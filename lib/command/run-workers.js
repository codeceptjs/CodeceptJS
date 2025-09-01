// For Node version >=10.5.0, have to use experimental flag
const { tryOrDefault } = require('../utils')
const output = require('../output')
const store = require('../store')
const event = require('../event')
const Workers = require('../workers')
const fs = require('fs')
const path = require('path')
const container = require('../container')

module.exports = async function (workerCount, selectedRuns, options) {
  process.env.profile = options.profile

  const { config: testConfig, override = '' } = options
  const overrideConfigs = tryOrDefault(() => JSON.parse(override), {})

  // Determine test split strategy
  let by = 'test' // default
  if (options.by) {
    // Explicit --by option takes precedence
    by = options.by
  } else if (options.suites) {
    // Legacy --suites option
    by = 'suite'
  }

  // Validate the by option
  const validStrategies = ['test', 'suite', 'pool']
  if (!validStrategies.includes(by)) {
    throw new Error(`Invalid --by strategy: ${by}. Valid options are: ${validStrategies.join(', ')}`)
  }
  delete options.parent

  // Handle failed tests loading
  let failedTestsData = null
  if (options.failedTests) {
    const failedTestsFile = path.isAbsolute(options.failedTests) ? options.failedTests : path.resolve(options.failedTests)

    if (!fs.existsSync(failedTestsFile)) {
      throw new Error(`Failed tests file not found: ${failedTestsFile}`)
    }

    failedTestsData = JSON.parse(fs.readFileSync(failedTestsFile, 'utf8'))
    if (!failedTestsData.tests || !Array.isArray(failedTestsData.tests)) {
      throw new Error(`Invalid failed tests file format: ${failedTestsFile}`)
    }
  }

  const config = {
    by,
    testConfig,
    options,
    selectedRuns,
    failedTestsData, // Pass failed tests data to workers
  }

  const numberOfWorkers = parseInt(workerCount, 10)

  output.print(`CodeceptJS v${require('../codecept').version()} ${output.standWithUkraine()}`)
  output.print(`Running tests in ${output.styles.bold(numberOfWorkers)} workers...`)
  output.print()
  store.hasWorkers = true

  const workers = new Workers(numberOfWorkers, config)
  workers.overrideConfig(overrideConfigs)

  workers.on(event.test.failed, test => {
    output.test.failed(test)
  })

  workers.on(event.test.passed, test => {
    output.test.passed(test)
  })

  workers.on(event.test.skipped, test => {
    output.test.skipped(test)
  })

  workers.on(event.all.result, result => {
    workers.printResults()
  })

  try {
    if (options.verbose || options.debug) store.debugMode = true

    if (options.verbose) {
      const { getMachineInfo } = require('./info')
      await getMachineInfo()
    }
    await workers.bootstrapAll()
    await workers.run()

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
    output.error(err)
    process.exit(1)
  } finally {
    await workers.teardownAll()
  }
}
