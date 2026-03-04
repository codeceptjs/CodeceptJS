import event from '../event.js'
import output from '../output.js'
import Config from '../config.js'
import { isNotSet } from '../utils.js'

const hooks = ['Before', 'After', 'BeforeSuite', 'AfterSuite']

const RETRY_PRIORITIES = {
  MANUAL_STEP: 100,
  STEP_PLUGIN: 50,
  SCENARIO_CONFIG: 30,
  FEATURE_CONFIG: 20,
  HOOK_CONFIG: 10,
}

export default function () {
  event.dispatcher.on(event.suite.before, suite => {
    let retryConfig = Config.get('retry')
    if (!retryConfig) return

    if (Number.isInteger(+retryConfig)) {
      const retryNum = +retryConfig
      output.log(`Retries: ${retryNum}`)

      if (suite.retries() === -1 || (suite.opts.retryPriority || 0) <= RETRY_PRIORITIES.FEATURE_CONFIG) {
        suite.retries(retryNum)
        suite.opts.retryPriority = RETRY_PRIORITIES.FEATURE_CONFIG
      }
      return
    }

    if (!Array.isArray(retryConfig)) {
      retryConfig = [retryConfig]
    }

    for (const config of retryConfig) {
      if (config.grep) {
        if (!suite.title.includes(config.grep)) continue
      }

      hooks
        .filter(hook => !!config[hook])
        .forEach(hook => {
          const retryKey = `retry${hook}`
          if (isNotSet(suite.opts[retryKey])) {
            suite.opts[retryKey] = config[hook]
            suite.opts[`${retryKey}Priority`] = RETRY_PRIORITIES.HOOK_CONFIG
          }
        })

      if (config.Feature) {
        if (suite.retries() === -1 || (suite.opts.retryPriority || 0) <= RETRY_PRIORITIES.FEATURE_CONFIG) {
          suite.retries(config.Feature)
          suite.opts.retryPriority = RETRY_PRIORITIES.FEATURE_CONFIG
        }
      }

      output.log(`Retries: ${JSON.stringify(config)}`)
    }
  })

  event.dispatcher.on(event.test.before, test => {
    let retryConfig = Config.get('retry')
    if (!retryConfig) return

    if (Number.isInteger(+retryConfig)) {
      if (test.retries() === -1) {
        test.retries(retryConfig)
        test.opts.retryPriority = RETRY_PRIORITIES.SCENARIO_CONFIG
      }
      return
    }

    if (!Array.isArray(retryConfig)) {
      retryConfig = [retryConfig]
    }

    retryConfig = retryConfig.filter(config => !!config.Scenario)

    for (const config of retryConfig) {
      if (config.grep) {
        if (!test.fullTitle().includes(config.grep)) continue
      }

      if (config.Scenario) {
        if (test.retries() === -1 || (test.opts.retryPriority || 0) <= RETRY_PRIORITIES.SCENARIO_CONFIG) {
          test.retries(config.Scenario)
          test.opts.retryPriority = RETRY_PRIORITIES.SCENARIO_CONFIG
        }
        output.log(`Retries: ${config.Scenario}`)
      }
    }
  })
}

export { RETRY_PRIORITIES }
