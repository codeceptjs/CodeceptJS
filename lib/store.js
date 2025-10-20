/**
 * global values for current session
 * @namespace
 */
const store = {
  /**
   * If we are in --debug mode
   * @type {boolean}
   */
  debugMode: false,

  /**
   * Is timeouts enabled
   * @type {boolean}
   */
  timeouts: true,

  /**
   * If auto-retries are enabled by retryFailedStep plugin
   * tryTo effect disables them
   * @type {boolean}
   */
  autoRetries: false,

  /**
   * Tests are executed via dry-run
   * @type {boolean}
   */
  dryRun: false,
  /**
   * If we are in pause mode
   * @type {boolean}
   */
  onPause: false,

  // current object states

  /** @type {CodeceptJS.Test | null} */
  currentTest: null,
  /** @type {CodeceptJS.Step | null} */
  currentStep: null,
  /** @type {CodeceptJS.Suite | null} */
  currentSuite: null,
}

module.exports = store
