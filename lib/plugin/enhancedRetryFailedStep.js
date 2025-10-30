const event = require('../event')
const recorder = require('../recorder')
const store = require('../store')
const output = require('../output')
const { RETRY_PRIORITIES } = require('../retryCoordinator')

const defaultConfig = {
  retries: 3,
  defaultIgnoredSteps: ['amOnPage', 'wait*', 'send*', 'execute*', 'run*', 'have*'],
  factor: 1.5,
  ignoredSteps: [],
}

/**
 * Enhanced retryFailedStep plugin that coordinates with other retry mechanisms
 *
 * This plugin provides step-level retries and coordinates with global retry settings
 * to avoid conflicts and provide predictable behavior.
 */
module.exports = config => {
  config = Object.assign({}, defaultConfig, config)
  config.ignoredSteps = config.ignoredSteps.concat(config.defaultIgnoredSteps)
  const customWhen = config.when

  let enableRetry = false

  const when = err => {
    if (!enableRetry) return false
    if (store.debugMode) return false
    if (!store.autoRetries) return false
    if (customWhen) return customWhen(err)
    return true
  }
  config.when = when

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

  event.dispatcher.on(event.step.finished, () => {
    enableRetry = false
  })

  event.dispatcher.on(event.test.before, test => {
    // pass disableRetryFailedStep is a preferred way to disable retries
    // test.disableRetryFailedStep is used for backward compatibility
    if (test.opts.disableRetryFailedStep || test.disableRetryFailedStep) {
      store.autoRetries = false
      output.log(`[Step Retry] Disabled for test: ${test.title}`)
      return // disable retry when a test is not active
    }

    // Check if step retries should be disabled due to higher priority scenario retries
    const scenarioRetries = test.retries()
    const stepRetryPriority = RETRY_PRIORITIES.STEP_PLUGIN
    const scenarioPriority = test.opts.retryPriority || 0

    if (scenarioRetries > 0 && config.deferToScenarioRetries !== false) {
      // Scenario retries are configured with higher or equal priority
      // Option 1: Disable step retries (conservative approach)
      store.autoRetries = false
      output.log(`[Step Retry] Deferred to scenario retries (${scenarioRetries} retries)`)
      return

      // Option 2: Reduce step retries to avoid excessive total retries
      // const reducedStepRetries = Math.max(1, Math.floor(config.retries / scenarioRetries))
      // config.retries = reducedStepRetries
      // output.log(`[Step Retry] Reduced to ${reducedStepRetries} retries due to scenario retries (${scenarioRetries})`)
    }

    // this option is used to set the retries inside _before() block of helpers
    store.autoRetries = true
    test.opts.conditionalRetries = config.retries
    test.opts.stepRetryPriority = stepRetryPriority

    recorder.retry(config)

    output.log(`[Step Retry] Enabled with ${config.retries} retries for test: ${test.title}`)
  })

  // Add coordination info for debugging
  event.dispatcher.on(event.test.finished, test => {
    if (test.state === 'passed' && test.opts.conditionalRetries && store.autoRetries) {
      const stepRetries = test.opts.conditionalRetries || 0
      const scenarioRetries = test.retries() || 0

      if (stepRetries > 0 && scenarioRetries > 0) {
        output.log(`[Retry Coordination] Test used both step retries (${stepRetries}) and scenario retries (${scenarioRetries})`)
      }
    }
  })
}
