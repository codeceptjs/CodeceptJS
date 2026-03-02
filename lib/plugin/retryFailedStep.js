import event from '../event.js'

import recorder from '../recorder.js'

import store from '../store.js'

const defaultConfig = {
  retries: 3,
  defaultIgnoredSteps: ['amOnPage', 'wait*', 'send*', 'execute*', 'run*', 'have*'],
  factor: 1.5,
  ignoredSteps: [],
  runInParent: false,
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
 * * `when` - function, when to perform a retry (accepts error as parameter)
 * * `factor` - The exponential factor to use. Default is 1.5.
 * * `minTimeout` - The number of milliseconds before starting the first retry. Default is 1000.
 * * `maxTimeout` - The maximum number of milliseconds between two retries. Default is Infinity.
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
 * This plugin can be disabled per test. In this case you will need to stet `I.retry()` to all flaky steps:
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
  config = Object.assign(defaultConfig, config)
  config.ignoredSteps = config.ignoredSteps.concat(config.defaultIgnoredSteps)
  const customWhen = config.when

  let enableRetry = false

  const when = err => {
    if (!enableRetry) return
    if (store.debugMode) return false
    if (!store.autoRetries) return false
    // Don't retry terminal errors (e.g., frame detachment errors)
    if (err && err.isTerminal) return false
    // Don't retry navigation errors that are known to be terminal
    if (err && err.message && (err.message.includes('ERR_ABORTED') || err.message.includes('frame was detached') || err.message.includes('Target page, context or browser has been closed'))) return false
    if (customWhen) return customWhen(err)
    return true
  }
  config.when = when

  // Ensure retry options are available before any steps run
  if (!recorder.retries.find(r => r === config)) {
    recorder.retries.push(config)
  }

  event.dispatcher.on(event.step.started, step => {
    // if a step is ignored - return
    for (const ignored of config.ignoredSteps) {
      if (step.name === ignored) return
      if (ignored instanceof RegExp) {
        if (step.name.match(ignored)) return
      } else if (ignored.indexOf('*') && step.name.startsWith(ignored.slice(0, -1))) return
    }
    enableRetry = true // enable retry for a step
  })

  // Disable retry only after a successful step; keep it enabled for failure so retry logic can act
  event.dispatcher.on(event.step.passed, () => {
    enableRetry = false
  })

  event.dispatcher.on(event.test.before, test => {
    // pass disableRetryFailedStep is a preferred way to disable retries
    // test.disableRetryFailedStep is used for backward compatibility
    if (!test.opts) test.opts = {}
    if (test.opts.disableRetryFailedStep || test.disableRetryFailedStep) {
      store.autoRetries = false
      return // disable retry when a test is not active
    }

    // Don't apply plugin retry logic if there are already manual retries configured
    // Check if any retry configs exist that aren't from this plugin
    const hasManualRetries = recorder.retries.some(retry => retry !== config)
    if (hasManualRetries) {
      store.autoRetries = false
      return
    }

    // this option is used to set the retries inside _before() block of helpers
    store.autoRetries = true
    test.opts.conditionalRetries = config.retries
    // debug: record applied retries value for tests
    if (process.env.DEBUG_RETRY_PLUGIN) {
      // eslint-disable-next-line no-console
      console.log('[retryFailedStep] applying retries =', config.retries, 'for test', test.title)
    }
    recorder.retry(config)
  })

  // Fallback for environments where event.test.before wasn't emitted (runner scenarios)
  event.dispatcher.on(event.test.started, test => {
    if (test.opts?.disableRetryFailedStep || test.disableRetryFailedStep) return

    // Don't apply plugin retry logic if there are already manual retries configured
    // Check if any retry configs exist that aren't from this plugin
    const hasManualRetries = recorder.retries.some(retry => retry !== config)
    if (hasManualRetries) return

    if (!store.autoRetries) {
      store.autoRetries = true
      test.opts.conditionalRetries = test.opts.conditionalRetries || config.retries
    }
  })
}
