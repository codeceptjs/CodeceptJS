import debugModule from 'debug'
import event from '../event.js'
import recorder from '../recorder.js'
import store from '../store.js'

const debug = debugModule('codeceptjs:retryFailedStep')

const defaultConfig = {
  retries: 3,
  defaultIgnoredSteps: ['amOnPage', 'wait*', 'send*', 'execute*', 'run*', 'have*'],
  minTimeout: 150,
  maxTimeout: 10000,
  factor: 1.5,
  randomize: false,
  ignoredSteps: [],
  deferToScenarioRetries: true,
}

const RETRY_PRIORITIES = {
  MANUAL_STEP: 100,
  STEP_PLUGIN: 50,
  SCENARIO_CONFIG: 30,
  FEATURE_CONFIG: 20,
  HOOK_CONFIG: 10,
}

/**
 * Retries each failed step in a test.
 *
 * Add this plugin to config file:
 *
 * ```js
 * plugins: {
 *     retryFailedStep: {
 *        enabled: true
 *     }
 * }
 * ```
 *
 *
 * Run tests with plugin enabled:
 *
 * ```
 * npx codeceptjs run --plugins retryFailedStep
 * ```
 *
 * #### Configuration:
 *
 * * `retries` - number of retries (by default 3),
 * * `factor` - The exponential factor to use. Default is 1.5.
 * * `minTimeout` - The number of milliseconds before starting the first retry. Default is 150.
 * * `maxTimeout` - The maximum number of milliseconds between two retries. Default is 10000.
 * * `randomize` - Randomizes the timeouts by multiplying with a factor from 1 to 2. Default is false.
 * * `defaultIgnoredSteps` - an array of steps to be ignored for retry. Includes:
 *     * `amOnPage`
 *     * `wait*`
 *     * `send*`
 *     * `execute*`
 *     * `run*`
 *     * `have*`
 * * `ignoredSteps` - an array for custom steps to ignore on retry. Use it to append custom steps to ignored list.
 * You can use step names or step prefixes ending with `*`. As such, `wait*` will match all steps starting with `wait`.
 * To append your own steps to ignore list - copy and paste a default steps list. Regexp values are accepted as well.
 * * `deferToScenarioRetries` - when enabled (default), step retries are automatically disabled if scenario retries are configured to avoid excessive total retries.
 *
 * #### Example
 *
 * ```js
 * plugins: {
 *     retryFailedStep: {
 *         enabled: true,
 *         ignoredSteps: [
 *           'scroll*', // ignore all scroll steps
 *           /Cookie/, // ignore all steps with a Cookie in it (by regexp)
 *         ]
 *     }
 * }
 * ```
 *
 * #### Disable Per Test
 *
 * This plugin can be disabled per test. In this case you will need to add `step.retry()` to all flaky steps:
 *
 * Use scenario configuration to disable plugin for a test
 *
 * ```js
 * Scenario('scenario tite', { disableRetryFailedStep: true }, () => {
 *    // test goes here
 * })
 * ```
 *
 */
export default function (config) {
  config = Object.assign({}, defaultConfig, config)
  config.ignoredSteps = config.ignoredSteps.concat(config.defaultIgnoredSteps)

  let enableRetry = false

  const when = err => {
    if (!enableRetry) return
    if (store.debugMode) return false
    if (!store.autoRetries) return false
    if (err && err.isTerminal) return false
    if (err && err.message && (err.message.includes('ERR_ABORTED') || err.message.includes('frame was detached') || err.message.includes('Target page, context or browser has been closed'))) return false
    return true
  }
  config.when = when

  if (!recorder.retries.find(r => r === config)) {
    recorder.retries.push(config)
  }

  event.dispatcher.on(event.step.started, step => {
    if (!step.title) return
    for (const ignored of config.ignoredSteps) {
      if (step.title === ignored) return
      if (ignored instanceof RegExp) {
        if (step.title.match(ignored)) return
      } else if (ignored.indexOf('*') !== -1 && step.title.startsWith(ignored.slice(0, -1))) return
    }
    enableRetry = true
  })

  event.dispatcher.on(event.step.passed, () => {
    enableRetry = false
  })

  event.dispatcher.on(event.test.before, test => {
    if (!test.opts) test.opts = {}
    if (test.opts.disableRetryFailedStep || test.disableRetryFailedStep) {
      store.autoRetries = false
      return
    }

    const scenarioRetries = typeof test.retries === 'function' ? test.retries() : -1
    const stepRetryPriority = RETRY_PRIORITIES.STEP_PLUGIN
    const scenarioPriority = test.opts.retryPriority || 0

    if (scenarioRetries > 0 && config.deferToScenarioRetries !== false) {
      store.autoRetries = false
      return
    }

    const hasManualRetries = recorder.retries.some(retry => retry !== config)
    if (hasManualRetries) {
      store.autoRetries = false
      return
    }

    store.autoRetries = true
    test.opts.conditionalRetries = config.retries
    test.opts.stepRetryPriority = stepRetryPriority

    debug('applying retries = %d for test %s', config.retries, test.title)
    recorder.retry(config)
  })

  event.dispatcher.on(event.test.started, test => {
    if (test.opts?.disableRetryFailedStep || test.disableRetryFailedStep) return

    const hasManualRetries = recorder.retries.some(retry => retry !== config)
    if (hasManualRetries) return

    const scenarioRetries = typeof test.retries === 'function' ? test.retries() : -1
    if (scenarioRetries > 0 && config.deferToScenarioRetries !== false) {
      return
    }

    if (!store.autoRetries) {
      store.autoRetries = true
      test.opts.conditionalRetries = test.opts.conditionalRetries || config.retries
    }
  })
}
