const event = require('../event')
const output = require('../output')
const Config = require('../config')
const { isNotSet } = require('../utils')

const hooks = ['Before', 'After', 'BeforeSuite', 'AfterSuite']

/**
 * Priority levels for retry mechanisms (higher number = higher priority)
 * This ensures consistent behavior when multiple retry mechanisms are active
 */
const RETRY_PRIORITIES = {
  MANUAL_STEP: 100, // I.retry() or step.retry() - highest priority
  STEP_PLUGIN: 50, // retryFailedStep plugin
  SCENARIO_CONFIG: 30, // Global scenario retry config
  FEATURE_CONFIG: 20, // Global feature retry config
  HOOK_CONFIG: 10, // Hook retry config - lowest priority
}

/**
 * Enhanced global retry mechanism that coordinates with other retry types
 */
module.exports = function () {
  event.dispatcher.on(event.suite.before, suite => {
    let retryConfig = Config.get('retry')
    if (!retryConfig) return

    if (Number.isInteger(+retryConfig)) {
      // is number - apply as feature-level retry
      const retryNum = +retryConfig
      output.log(`[Global Retry] Feature retries: ${retryNum}`)

      // Only set if not already set by higher priority mechanism
      if (isNotSet(suite.retries())) {
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

      // Handle hook retries with priority awareness
      hooks
        .filter(hook => !!config[hook])
        .forEach(hook => {
          const retryKey = `retry${hook}`
          if (isNotSet(suite.opts[retryKey])) {
            suite.opts[retryKey] = config[hook]
            suite.opts[`${retryKey}Priority`] = RETRY_PRIORITIES.HOOK_CONFIG
          }
        })

      // Handle feature-level retries
      if (config.Feature) {
        if (isNotSet(suite.retries()) || (suite.opts.retryPriority || 0) <= RETRY_PRIORITIES.FEATURE_CONFIG) {
          suite.retries(config.Feature)
          suite.opts.retryPriority = RETRY_PRIORITIES.FEATURE_CONFIG
          output.log(`[Global Retry] Feature retries: ${config.Feature}`)
        }
      }
    }
  })

  event.dispatcher.on(event.test.before, test => {
    let retryConfig = Config.get('retry')
    if (!retryConfig) return

    if (Number.isInteger(+retryConfig)) {
      // Only set if not already set by higher priority mechanism
      if (test.retries() === -1) {
        test.retries(retryConfig)
        test.opts.retryPriority = RETRY_PRIORITIES.SCENARIO_CONFIG
        output.log(`[Global Retry] Scenario retries: ${retryConfig}`)
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
        // Respect priority system
        if (test.retries() === -1 || (test.opts.retryPriority || 0) <= RETRY_PRIORITIES.SCENARIO_CONFIG) {
          test.retries(config.Scenario)
          test.opts.retryPriority = RETRY_PRIORITIES.SCENARIO_CONFIG
          output.log(`[Global Retry] Scenario retries: ${config.Scenario}`)
        }
      }
    }
  })
}

// Export priority constants for use by other retry mechanisms
module.exports.RETRY_PRIORITIES = RETRY_PRIORITIES
