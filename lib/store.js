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

  /** @type {CodeceptJS.Test | null} */
  currentTest: null,
}

module.exports = store
