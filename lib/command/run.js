const { getConfig, printError, getTestRoot, createOutputDir } = require('./utils')
const Config = require('../config')
const store = require('../store')
const Codecept = require('../codecept')
const fs = require('fs')
const path = require('path')
const container = require('../container')

module.exports = async function (test, options) {
  // registering options globally to use in config
  // Backward compatibility for --profile
  // TODO: remove in CodeceptJS 4
  process.profile = options.profile

  if (options.profile) {
    process.env.profile = options.profile
  }
  if (options.verbose || options.debug) store.debugMode = true

  const configFile = options.config

  let config = getConfig(configFile)
  if (options.override) {
    config = Config.append(JSON.parse(options.override))
  }
  const testRoot = getTestRoot(configFile)
  createOutputDir(config, testRoot)

  const codecept = new Codecept(config, options)

  try {
    codecept.init(testRoot)
    await codecept.bootstrap()

    // Handle failed tests file loading
    if (options.failedTests) {
      const failedTestsFile = path.isAbsolute(options.failedTests) ? options.failedTests : path.join(testRoot, options.failedTests)

      if (!fs.existsSync(failedTestsFile)) {
        throw new Error(`Failed tests file not found: ${failedTestsFile}`)
      }

      const failedTestsData = JSON.parse(fs.readFileSync(failedTestsFile, 'utf8'))
      if (!failedTestsData.tests || !Array.isArray(failedTestsData.tests)) {
        throw new Error(`Invalid failed tests file format: ${failedTestsFile}`)
      }

      // Load all tests first, then filter to only failed ones
      codecept.loadTests(test)
      codecept.filterByFailedTests(failedTestsData.tests)
    } else {
      codecept.loadTests(test)
    }

    if (options.verbose) {
      global.debugMode = true
      const { getMachineInfo } = require('./info')
      await getMachineInfo()
    }

    await codecept.run()

    // Save failed tests if requested
    if (options.saveFailedTests !== undefined) {
      const result = container.result()
      if (result.failedTests.length > 0) {
        const fileName = typeof options.saveFailedTests === 'string' ? options.saveFailedTests : 'failed-tests.json'
        result.saveFailedTests(fileName)
        console.log(`Failed tests saved to: ${fileName}`)
      }
    }
  } catch (err) {
    printError(err)
    process.exitCode = 1
  } finally {
    await codecept.teardown()
  }
}
