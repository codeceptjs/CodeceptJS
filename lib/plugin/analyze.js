const debug = require('debug')('codeceptjs:analyze')
const { isMainThread } = require('node:worker_threads')
const { arrowRight } = require('figures')
const container = require('../container')
const ai = require('../ai')
const colors = require('chalk')
const ora = require('ora-classic')
const event = require('../event')
const output = require('../output')
const { ansiRegExp, base64EncodeFile, markdownToAnsi } = require('../utils')

const MAX_DATA_LENGTH = 5000

const defaultConfig = {
  clusterize: 2,
  analyze: 3,
  vision: false,
  categories: [
    'Browser connection error / browser crash',
    'Network errors (server error, timeout, etc)',
    'HTML / page elements (not found, not visible, etc)',
    'Navigation errors (404, etc)',
    'Code errors (syntax error, JS errors, etc)',
    'Library & framework errors (CodeceptJS internal errors, user-defined libraries, etc)',
    'Data errors (password incorrect, no options in select, invalid format, etc)',
    'Assertion failures',
    'Other errors',
  ],
  prompts: {
    clusterize: (tests, config) => {
      const serializedFailedTests = tests
        .map((test, index) => {
          if (!test || !test.err) return
          return `
          TEST #${index + 1}: ${serializeTest(test)}
          ERROR: ${serializeError(test.err).slice(0, MAX_DATA_LENGTH / tests.length)}`
        })
        .join('\n\n---\n\n')

      const messages = [
        {
          role: 'user',
          content: `
        I am test analyst analyzing failed tests in CodeceptJS testing framework.

        Please analyze the following failed tests and classify them into groups by their cause.
        If there is no common cause, say: "No common cause found".

        Provide a short description of the group and a list of failed tests that belong to this group.
        Use percent sign to indicate the percentage of failed tests in the group if this percentage is greater than 30%.

        Here are failed tests:

        ${serializedFailedTests}

        Common categories of failures by order of priority:

        ${config.categories.join('\n- ')}

        If there is no groups of tests, say: "No patterns found"
        Preserve error messages but cut them if they are too long.
        Respond clearly and directly, without introductory words or phrases like ‘Of course,’ ‘Here is the answer,’ etc.
        Do not list more than 3 tests in the group.
        Do not list more than 3 errors in the group.
        If you identify that all tests in the group have the same tag, add this tag to the group report, otherwise ignore TAG section.
        If you identify that all tests in the group have the same suite, add this suite to the group report, otherwise ignore SUITE section.
        Pick different emojis for each group.

        Provide list of groups in following format:

        _______________________________

        --- GROUP <emoji> #<group_number> <(percentage of failed tests)'>
        CATEGORY <category_of_failure>
        ERRORS <error_message_1>, <error_message_2>, ...
        SUMMARY <summary_of_errors>
        STEPS <step_of_failure> (in format I.click(), I.see(), etc)
        AFFECTED TESTS (<total number of tests>) <test_title_1>, <test_title_2>, ...
        SUITE <suite_title>, <suite_title> (if all tests in the group have the same suite or suites)
        TAG <tag> (if all tags in group have the same tag)
        `,
        },
        {
          role: 'assistant',
          content: `--- GROUP'
        `,
        },
      ]
      return messages
    },
    analyze: (test, config) => {
      const testMessage = serializeTest(test)
      const errorMessage = serializeError(test.err)

      const messages = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `
        I am qa engineer analyzing failed tests in CodeceptJS testing framework.
        Please analyze the following failed test and error its error and explain it.

        Pick one of the categories of failures and explain it.

        Categories of failures in order of priority:

        ${config.categories.join('\n- ')}

        Here is the test and error:

        ------- TEST -------
        ${testMessage}

        ------- ERROR -------
        ${errorMessage}

        ------ INSTRUCTIONS ------

        Do not get to details, be concise.
        If there is failed step, just write it in STEPS section.
        If you have suggestions for the test, write them in SUMMARY section.
        Inside SUMMARY write exact values, if you have suggestions, explain which information you used to suggest.
        Be concise, each section should not take more than one sentence.

        Response format:

        CATEGORY <category_of_failure>
        STEPS <step_of_failure>
        SUMMARY <explanation_of_failure>

        Do not add any other sections or explanations. Only CATEGORY, SUMMARY, STEPS.
        ${config.vision ? 'Also a screenshot of the page is attached to the prompt.' : ''}
      `,
            },
          ],
        },
      ]

      if (config.vision && test.artifacts.screenshot) {
        debug('Adding screenshot to prompt')
        messages[0].content.push({
          type: 'image_url',
          image_url: {
            url: 'data:image/png;base64,' + base64EncodeFile(test.artifacts.screenshot),
          },
        })
      }

      return messages
    },
  },
}

/**
 *
 * @param {*} config
 * @returns
 */
module.exports = function (config = {}) {
  config = Object.assign(defaultConfig, config)

  event.dispatcher.on(event.workers.before, () => {
    if (!ai.isEnabled) return
    console.log('Enabled AI analysis')
  })

  event.dispatcher.on(event.all.result, async result => {
    if (!isMainThread) return // run only on main thread
    if (!ai.isEnabled) {
      console.log('AI is disabled, no analysis will be performed. Run tests with --ai flag to enable it.')
      return
    }

    printReport(result)
  })

  event.dispatcher.on(event.workers.result, async result => {
    if (!ai.isEnabled) {
      console.log('AI is disabled, no analysis will be performed. Run tests with --ai flag to enable it.')
      return
    }

    printReport(result)
  })

  async function printReport(result) {
    const failedTestsAndErrors = result.tests.filter(t => t.state === 'failed' && t.err)

    if (!failedTestsAndErrors.length) return

    debug(failedTestsAndErrors.map(t => serializeTest(t) + '\n' + serializeError(t.err)))

    try {
      if (failedTestsAndErrors.length >= config.clusterize) {
        const response = await clusterize(failedTestsAndErrors)
        printHeader()
        console.log(response)
        return
      }

      output.plugin('analyze', `Analyzing first ${config.analyze} failed tests...`)

      // we pick only unique errors to not repeat answers
      const uniqueErrors = failedTestsAndErrors.filter((item, index, array) => {
        return array.findIndex(t => t.err?.message === item.err?.message) === index
      })

      for (let i = 0; i < config.analyze; i++) {
        if (!uniqueErrors[i]) break

        const response = await analyze(uniqueErrors[i])
        if (!response) {
          break
        }

        printHeader()
        console.log()
        console.log('--------------------------------')
        console.log(arrowRight, colors.bold.white(uniqueErrors[i].fullTitle()), config.vision ? '👀' : '')
        console.log()
        console.log()
        console.log(response)
        console.log()
      }
    } catch (err) {
      console.error('Error analyzing failed tests', err)
    }

    if (!Object.keys(container.plugins()).includes('pageInfo')) {
      console.log('To improve analysis, enable pageInfo plugin to get more context for failed tests.')
    }
  }

  let hasPrintedHeader = false

  function printHeader() {
    if (!hasPrintedHeader) {
      console.log()
      console.log(colors.bold.white('🪄 AI REPORT:'))
      hasPrintedHeader = true
    }
  }

  async function clusterize(failedTestsAndErrors) {
    const spinner = ora('Clusterizing failures...').start()
    const prompt = config.prompts.clusterize(failedTestsAndErrors, config)
    try {
      const response = await ai.createCompletion(prompt)
      spinner.stop()
      return formatResponse(response)
    } catch (err) {
      spinner.stop()
      console.error('Error clusterizing failures', err.message)
    }
  }

  async function analyze(failedTestAndError) {
    const spinner = ora('Analyzing failure...').start()
    const prompt = config.prompts.analyze(failedTestAndError, config)
    try {
      const response = await ai.createCompletion(prompt)
      spinner.stop()
      return formatResponse(response)
    } catch (err) {
      spinner.stop()
      console.error('Error analyzing failure:', err.message)
    }
  }
}

function serializeError(error) {
  if (typeof error === 'string') {
    return error
  }

  if (!error) return

  let errorMessage = 'ERROR: ' + error.message

  if (error.inspect) {
    errorMessage = 'ERROR: ' + error.inspect()
  }

  if (error.stack) {
    errorMessage +=
      '\n' +
      error.stack
        .replace(global.codecept_dir || '', '.')
        .split('\n')
        .map(line => line.replace(ansiRegExp(), ''))
        .slice(0, 5)
        .join('\n')
  }
  if (error.steps) {
    errorMessage += '\n STEPS: ' + error.steps.map(s => s.toCode()).join('\n')
  }
  return errorMessage
}

function serializeTest(test) {
  if (!test.uid) return

  let testMessage = 'TEST TITLE: ' + test.title

  if (test.suite) {
    testMessage += '\n SUITE: ' + test.suite.title
  }

  if (test.steps?.length) {
    const failedSteps = test.steps.filter(s => s.status === 'failed')
    if (failedSteps.length) testMessage += '\n STEP: ' + failedSteps.map(s => s.toCode()).join('; ')
  }

  const pageInfo = test.notes.find(n => n.type === 'pageInfo')
  if (pageInfo) {
    testMessage += '\n PAGE INFO: ' + pageInfo.text
  }

  return testMessage
}

function formatResponse(response) {
  return response
    .split('\n')
    .map(line => line.trim())
    .filter(line => !/^[A-Z\s]+$/.test(line))
    .map(line => {
      if (line.startsWith('ANALYSIS REPORT')) return line.replace('ANALYSIS REPORT', colors.bold.white('ANALYSIS REPORT    '))
      if (line.startsWith('GROUP')) return line.replace('GROUP', colors.bold.bgWhite('GROUP           '))
      if (line.startsWith('STEPS')) return line.replace('STEPS', colors.bold.bgBlue('STEP            '))
      if (line.startsWith('AFFECTED TESTS')) return line.replace('AFFECTED TESTS', colors.bold.bgWhite('AFFECTED TESTS    '))
      if (line.startsWith('ERRORS')) return line.replace('ERRORS', colors.bold.bgRed('ERRORS          '))
      if (line.startsWith('TAG')) return line.replace('TAG', colors.bold.bgGray('TAG             '))
      if (line.startsWith('SUITE')) return line.replace('SUITE', colors.bold.bgGray('SUITE           '))
      if (line.startsWith('SUMMARY')) return line.replace('SUMMARY', colors.bold.bgYellow('SUMMARY         '))
      if (line.startsWith('CATEGORY')) return line.replace('CATEGORY', colors.bold.bgGreen('CATEGORY        '))
      return line
    })
    .map(line => markdownToAnsi(line))
    .join('\n')
}
