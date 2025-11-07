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
    await codecept.teardown()

    // Schedule a delayed exit to prevent process hanging due to helper event loops (e.g., Playwright)
    // Wait 1 second to allow final cleanup and output to complete
    if (!process.env.CODECEPT_DISABLE_AUTO_EXIT) {
      setTimeout(() => {
        process.exit(process.exitCode || 0)
      }, 1000).unref()
    }
  }
}
