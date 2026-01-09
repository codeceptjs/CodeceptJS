// For Node version >=10.5.0, have to use experimental flag
import { tryOrDefault } from '../utils.js'
import output from '../output.js'
import store from '../store.js'
import event from '../event.js'
import Workers from '../workers.js'
import Codecept from '../codecept.js'
import { getMachineInfo } from './info.js'

export default async function (workerCount, selectedRuns, options) {
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

  output.print(`CodeceptJS v${Codecept.version()} ${output.standWithUkraine()}`)
  output.print(`Running tests in ${output.styles.bold(numberOfWorkers)} workers...`)
  store.hasWorkers = true

  const workers = new Workers(numberOfWorkers, config)
  workers.overrideConfig(overrideConfigs)
  
  // Show test distribution after workers are initialized
  await workers.bootstrapAll()
  
  const workerObjects = workers.getWorkers()
  output.print()
  output.print('Test distribution:')
  workerObjects.forEach((worker, index) => {
    const testCount = worker.tests.length
    output.print(`  Worker ${index + 1}: ${testCount} test${testCount !== 1 ? 's' : ''}`)
  })
  output.print()

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
      await getMachineInfo()
    }
    await workers.run()
  } catch (err) {
    output.error(err)
    process.exitCode = 1
  } finally {
    await workers.teardownAll()
    
    // Force exit if event loop doesn't clear naturally
    // This is needed because worker threads may leave handles open
    // even after proper cleanup, preventing natural process termination
    if (!options.noExit) {
      // Use beforeExit to ensure we run after all other exit handlers
      // have set the correct exit code
      process.once('beforeExit', (code) => {
        // Give cleanup a moment to complete, then force exit with the correct code
        setTimeout(() => {
          process.exit(code || process.exitCode || 0)
        }, 100)
      })
    }
  }
}
