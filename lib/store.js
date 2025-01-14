/**
 * global values for current session
 * @namespace
 */
const store = {
  /** @type {boolean} */
  debugMode: false,
  /** @type {boolean} */
  timeouts: true,
  /** @type {boolean} */
  dryRun: false,
  /** @type {boolean} */
  onPause: false,
  /** @type {CodeceptJS.Test | null} */
  currentTest: null,
  /** @type {any} */
  currentStep: null,
}

module.exports = store
