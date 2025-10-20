const debug = require('debug')('codeceptjs:analyze')
const { isMainThread } = require('node:worker_threads')
const { arrowRight } = require('figures')
const container = require('../container')
const store = require('../store')
const ai = require('../ai')
const colors = require('chalk')
const ora = require('ora-classic')
const event = require('../event')
const output = require('../output')
const { ansiRegExp, base64EncodeFile, markdownToAnsi } = require('../utils')

const MAX_DATA_LENGTH = 5000

const defaultConfig = {
  clusterize: 5,
  analyze: 2,
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
          #${index + 1}: ${serializeTest(test)}
          ${serializeError(test.err).slice(0, MAX_DATA_LENGTH / tests.length)}`.trim()
        })
        .join('\n\n--------\n\n')

      const messages = [
        {
          role: 'user',
          content: `
        I am test analyst analyzing failed tests in CodeceptJS testing framework.

        Please analyze the following failed tests and classify them into groups by their cause.
        If there is no groups detected, say: "No common groups found".

        Provide a short description of the group and a list of failed tests that belong to this group.
        Use percent sign to indicate the percentage of failed tests in the group if this percentage is greater than 30%.

        Here are failed tests:

        ${serializedFailedTests}

        Common categories of failures by order of priority:

        ${config.categories.join('\n- ')}

        If there is no groups of tests, say: "No patterns found"
        Preserve error messages but cut them if they are too long.
        Respond clearly and directly, without introductory words or phrases like 'Of course,' 'Here is the answer,' etc.
        Do not list more than 3 errors in the group.
        If you identify that all tests in the group have the same tag, add this tag to the group report, otherwise ignore TAG section.
        If you identify that all tests in the group have the same suite, add this suite to the group report, otherwise ignore SUITE section.
        Pick different emojis for each group.
        Order groups by the number of tests in the group.
        If group has one test, skip that group.

        Provide list of groups in following format:

        _______________________________

        ## Group <group_number> <emoji>

        * SUMMARY <summary_of_errors>
        * CATEGORY <category_of_failure>
        * URL <url_of_failure_if_any>
        * ERROR <error_message_1>, <error_message_2>, ...
        * STEP <step_of_failure> (use CodeceptJS format I.click(), I.see(), etc; if all failures happend on the same step)
        * SUITE <suite_title>, <suite_title> (if SUITE is present, and if all tests in the group have the same suite or suites)
        * TAG <tag> (if TAG is present, and if all tests in the group have the same tag)
        * AFFECTED TESTS (<total number of tests>):
            x <test1 title>
            x <test2 title>
            x <test3 title>
            x ...
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
        Do not be too technical in SUMMARY section.
        Inside SUMMARY write exact values, if you have suggestions, explain which information you used to suggest.
        Be concise, each section should not take more than one sentence.

        Response format:

        * SUMMARY <explanation_of_failure>
        * ERROR <error_message_1>, <error_message_2>, ...
        * CATEGORY <category_of_failure>
        * STEPS <step_of_failure>
        * URL <url_of_failure_if_any>

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
 * Uses AI to analyze test failures and provide insights
 *
 * This plugin analyzes failed tests using AI to provide detailed explanations and group similar failures.
 * When enabled with --ai flag, it generates reports after test execution.
 *
 * #### Usage
 *
 * ```js
 * // in codecept.conf.js
 * exports.config = {
 *   plugins: {
 *     analyze: {
 *       enabled: true,
 *       clusterize: 5,
 *       analyze: 2,
 *       vision: false
 *     }
 *   }
 * }
 * ```
 *
 * #### Configuration
 *
 * * `clusterize` (number) - minimum number of failures to trigger clustering analysis. Default: 5
 * * `analyze` (number) - maximum number of individual test failures to analyze in detail. Default: 2
 * * `vision` (boolean) - enables visual analysis of test screenshots. Default: false
 * * `categories` (array) - list of failure categories for classification. Defaults to:
 *   - Browser connection error / browser crash
 *   - Network errors (server error, timeout, etc)
 *   - HTML / page elements (not found, not visible, etc)
 *   - Navigation errors (404, etc)
 *   - Code errors (syntax error, JS errors, etc)
 *   - Library & framework errors
 *   - Data errors (password incorrect, invalid format, etc)
 *   - Assertion failures
 *   - Other errors
 * * `prompts` (object) - customize AI prompts for analysis
 *   - `clusterize` - prompt for clustering analysis
 *   - `analyze` - prompt for individual test analysis
 *
 * #### Features
 *
 * * Groups similar failures when number of failures >= clusterize value
 * * Provides detailed analysis of individual failures
 * * Analyzes screenshots if vision=true and screenshots are available
 * * Classifies failures into predefined categories
 * * Suggests possible causes and solutions
 *
 * @param {Object} config - Plugin configuration
 * @returns {void}
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
    if (!result.hasFailed) {
      console.log('Everything is fine, skipping AI analysis')
      return
    }

    if (!ai.isEnabled) {
      console.log('AI is disabled, no analysis will be performed. Run tests with --ai flag to enable it.')
      return
    }

    printReport(result)
  })

  async function printReport(result) {
    const failedTestsAndErrors = result.tests.filter(t => t.err)

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
  if (test.parent) {
    testMessage += '\n SUITE: ' + test.parent.title
  }

  if (test.steps?.length) {
    const failedSteps = test.steps
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
    .replace(/<think>([\s\S]*?)<\/think>/g, store.debugMode ? colors.cyan('$1') : '')
    .split('\n')
    .map(line => line.trim())
    .filter(line => !/^[A-Z\s]+$/.test(line))
    .map(line => markdownToAnsi(line))
    .map(line => line.replace(/^x /gm, `    ${colors.red.bold('x')} `))
    .join('\n')
    .trim()
}
