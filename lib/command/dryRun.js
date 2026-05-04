import chalk from 'chalk'
import { getConfig, getTestRoot } from './utils.js'
import Config from '../config.js'
import Codecept from '../codecept.js'
import output from '../output.js'
import event from '../event.js'
import store from '../store.js'
import Container from '../container.js'

export default async function (test, options) {
  if (options.grep) process.env.grep = options.grep
  if (options.ansi === false) chalk.level = 0
  store.dryRun = true
  const configFile = options.config
  let codecept

  const testRoot = getTestRoot(configFile)
  let config = await getConfig(configFile)
  if (options.override) {
    config = Config.append(JSON.parse(options.override))
  }

  if (config.plugins) {
    // Disable plugins that block (interactive) or perform external I/O (AI/network).
    // Leave the rest enabled so they can register support objects (e.g. auth registers
    // `login`); helper calls inside those support fns are already no-op'd by HelperStep
    // when store.dryRun is true.
    const disableInDryRun = new Set(['pause', 'pauseOnFail', 'analyze', 'aiTrace', 'pageInfo', 'heal'])
    for (const plugin in config.plugins) {
      if (disableInDryRun.has(plugin)) {
        config.plugins[plugin].enabled = false
      }
    }
  }

  try {
    codecept = new Codecept(config, options)
    await codecept.init(testRoot)

    if (options.bootstrap) await codecept.bootstrap()

    codecept.loadTests()

    if (!options.steps && !options.verbose && !options.debug) {
      await printTests(codecept.testFiles)
      return
    }
    if (options.numbers) numberSteps()
    event.dispatcher.on(event.all.result, printFooter)
    await codecept.run(test)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

function numberSteps() {
  let stepIndex = 0
  event.dispatcher.on(event.test.before, () => {
    stepIndex = 0
  })
  event.dispatcher.prependListener(event.step.before, step => {
    stepIndex++
    step.prefix = `${stepIndex}. ${step.prefix || ''}`
  })
}

async function printTests(files) {
  const { default: figures } = await import('figures')
  const { default: colors } = await import('chalk')

  output.print(output.styles.debug(`Tests from ${store.codeceptDir}:`))
  output.print()

  const mocha = Container.mocha()
  mocha.files = files
  mocha.loadFiles()

  let numOfTests = 0
  let numOfSuites = 0
  let outputString = ''
  const filterBy = process.env.grep

  let filterRegex
  if (filterBy) {
    try {
      filterRegex = new RegExp(filterBy, 'i') // Case-insensitive matching
    } catch (err) {
      console.error(`Invalid grep pattern: ${filterBy}`)
      process.exit(1)
    }
  }

  for (const suite of mocha.suite.suites) {
    const suiteMatches = filterRegex ? filterRegex.test(suite.title) : true
    let suiteHasMatchingTests = false

    if (suiteMatches) {
      outputString += `${colors.white.bold(suite.title)} -- ${output.styles.log(suite.file || '')}\n`
      suiteHasMatchingTests = true
      numOfSuites++
    }

    for (const test of suite.tests) {
      const testMatches = filterRegex ? filterRegex.test(test.title) : true

      if (testMatches) {
        if (!suiteMatches && !suiteHasMatchingTests) {
          outputString += `${colors.white.bold(suite.title)} -- ${output.styles.log(suite.file || '')}\n`
          suiteHasMatchingTests = true
          numOfSuites++
        }

        numOfTests++
        outputString += `  ${output.styles.scenario(figures.checkboxOff)} ${test.title}\n`
      }
    }
  }

  output.print(removeDuplicates(outputString))
  output.print('')
  output.success(`  Total: ${numOfSuites} suites | ${numOfTests} tests  `)
  printFooter()
  process.exit(0)
}

function printFooter() {
  output.print()
  output.print('--- DRY MODE: No tests were executed ---')
}

function removeDuplicates(inputString) {
  const array = inputString.split('\n')
  const uniqueLines = [...new Set(array)]
  return uniqueLines.join('\n')
}
