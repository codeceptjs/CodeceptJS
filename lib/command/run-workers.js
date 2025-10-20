// For Node version >=10.5.0, have to use experimental flag
const { tryOrDefault } = require('../utils')
const output = require('../output')
const store = require('../store')
const event = require('../event')
const Workers = require('../workers')

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
  const config = {
    by,
    testConfig,
    options,
    selectedRuns,
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
  } catch (err) {
    output.error(err)
    process.exit(1)
  } finally {
    await workers.teardownAll()
  }
}
