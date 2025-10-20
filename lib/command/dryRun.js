const { getConfig, getTestRoot } = require('./utils')
const Config = require('../config')
const Codecept = require('../codecept')
const output = require('../output')
const event = require('../event')
const store = require('../store')
const Container = require('../container')

module.exports = async function (test, options) {
  if (options.grep) process.env.grep = options.grep
  const configFile = options.config
  let codecept

  const testRoot = getTestRoot(configFile)
  let config = getConfig(configFile)
  if (options.override) {
    config = Config.append(JSON.parse(options.override))
  }

  if (config.plugins) {
    // disable all plugins by default, they can be enabled with -p option
    for (const plugin in config.plugins) {
      // if `-p all` is passed, then enabling all plugins, otherwise plugins could be enabled by `-p customLocator,commentStep,tryTo`
      config.plugins[plugin].enabled = options.plugins === 'all'
    }
  }

  try {
    codecept = new Codecept(config, options)
    codecept.init(testRoot)

    if (options.bootstrap) await codecept.bootstrap()

    codecept.loadTests()
    store.dryRun = true

    if (!options.steps && !options.verbose && !options.debug) {
      printTests(codecept.testFiles)
      return
    }
    event.dispatcher.on(event.all.result, printFooter)
    codecept.run(test)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

function printTests(files) {
  const figures = require('figures')
  const colors = require('chalk')

  output.print(output.styles.debug(`Tests from ${global.codecept_dir}:`))
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
