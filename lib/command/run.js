import { getConfig, printError, getTestRoot, createOutputDir } from './utils.js'
import Config from '../config.js'
import store from '../store.js'
import Codecept from '../codecept.js'

export default async function (test, options) {
  // registering options globally to use in config
  // Backward compatibility for --profile
  // TODO: remove in CodeceptJS 4
  process.profile = options.profile

  if (options.profile) {
    process.env.profile = options.profile
  }
  if (options.verbose || options.debug) store.debugMode = true

  const configFile = options.config

  let config = await getConfig(configFile)
  if (options.override) {
    config = Config.append(JSON.parse(options.override))
  }
  const testRoot = getTestRoot(configFile)
  createOutputDir(config, testRoot)

  const codecept = new Codecept(config, options)

  try {
    await codecept.init(testRoot)
    await codecept.bootstrap()
    codecept.loadTests(test)

    if (options.verbose) {
      global.debugMode = true
      const { getMachineInfo } = await import('./info.js')
      await getMachineInfo()
    }

    await codecept.run()
  } catch (err) {
    printError(err)
    process.exitCode = 1
  } finally {
    // Add timeout to teardown to prevent hanging
    const teardownPromise = codecept.teardown()
    const teardownTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Teardown timeout')), 10000)
    )
    
    try {
      await Promise.race([teardownPromise, teardownTimeout])
    } catch (e) {
      if (e.message === 'Teardown timeout') {
        console.warn('Teardown timed out after 10 seconds, forcing exit')
      } else {
        console.warn('Teardown error:', e.message)
      }
    }
    
    // Force exit immediately after teardown completes or times out
    if (!options.noExit) {
      // Give a very short grace period then force exit
      setTimeout(() => {
        process.exit(process.exitCode || 0)
      }, 500)
    }
  }
}
