const fs = require('fs')
const path = require('path')
const { serializeTest } = require('./mocha/test')

/**
 * @typedef {Object} Stats Statistics for a test result.
 * @property {number} passes Number of passed tests.
 * @property {number} failures Number of failed tests.
 * @property {number} tests Total number of tests.
 * @property {number} pending Number of pending tests.
 * @property {number} failedHooks Number of failed hooks.
 * @property {Date} start Start time of the test run.
 * @property {Date} end End time of the test run.
 * @property {number} duration Duration of the test run, in milliseconds.
 */

/**
 * @typedef {Array<string|number>} Failure
 * A detailed formatted report for a failed test.
 */

/**
 * Result of a test run. Will be emitted for example in "event.all.result" events.
 */
class Result {
  constructor() {
    this._startTime = new Date()
    this._endTime = null

    this.reset()
    this.start()
  }

  /**
   * Resets all collected stats, tests, and failure reports.
   */
  reset() {
    this._stats = {
      passes: 0,
      failures: 0,
      tests: 0,
      pending: 0,
      failedHooks: 0,
      start: null,
      end: null,
      duration: 0,
    }

    /**
     * @type {CodeceptJS.Test[]}
     * @private
     */
    this._tests = []

    /**
     * @type {Failure[]}
     * @private
     */
    this._failures = []
  }

  /**
   * Sets the start time to the current time.
   */
  start() {
    this._startTime = new Date()
  }

  /**
   * Sets the end time to the current time.
   */
  finish() {
    this._endTime = new Date()
  }

  /**
   * Whether this result contains any failed tests.
   *
   * @type {boolean}
   * @readonly
   */
  get hasFailed() {
    return this._stats.failures > 0
  }

  /**
   * All collected tests.
   *
   * @type {CodeceptJS.Test[]}
   * @readonly
   */
  get tests() {
    return this._tests
  }

  /**
   * The failure reports (array of strings per failed test).
   *
   * @type {Failure[]}
   * @readonly
   */
  get failures() {
    return this._failures.filter(f => f && (!Array.isArray(f) || f.length > 0))
  }

  /**
   * The test statistics.
   *
   * @type {Stats}
   * @readonly
   */
  get stats() {
    return this._stats
  }

  /**
   * The start time of the test run.
   *
   * @type {Date}
   * @readonly
   */
  get startTime() {
    return this._startTime
  }

  /**
   * Adds a test to this result.
   *
   * @param {CodeceptJS.Test} test
   */
  addTest(test) {
    const existingTestIndex = this._tests.findIndex(t => !!t.uid && t.uid === test.uid)
    if (existingTestIndex >= 0) {
      this._tests[existingTestIndex] = test
      return
    }

    this._tests.push(test)
  }

  /**
   * Adds failure reports to this result.
   *
   * @param {Failure[]} newFailures
   */
  addFailures(newFailures) {
    this._failures.push(...newFailures)
  }

  /**
   * Whether this result contains any failed tests.
   *
   * @type {boolean}
   * @readonly
   */
  get hasFailures() {
    return this.stats.failures > 0
  }

  /**
   * The duration of the test run, in milliseconds.
   *
   * @type {number}
   * @readonly
   */
  get duration() {
    return this._endTime ? +this._endTime - +this._startTime : 0
  }

  /**
   * All failed tests.
   *
   * @type {CodeceptJS.Test[]}
   * readonly
   */
  get failedTests() {
    return this._tests.filter(test => test.state === 'failed')
  }

  /**
   * All passed tests.
   *
   * @type {CodeceptJS.Test[]}
   * @readonly
   */
  get passedTests() {
    return this._tests.filter(test => test.state === 'passed')
  }

  /**
   * All skipped tests.
   *
   * @type {CodeceptJS.Test[]}
   * @readonly
   */
  get skippedTests() {
    return this._tests.filter(test => test.state === 'skipped' || test.state === 'pending')
  }

  /**
   * @returns {object} The JSON representation of this result.
   */
  simplify() {
    return {
      hasFailed: this.hasFailed,
      stats: this.stats,
      duration: this.duration,
      tests: this._tests.map(test => serializeTest(test)),
      failures: this._failures,
    }
  }

  /**
   * Saves this result to a JSON file.
   *
   * @param {string} [fileName] Path to the JSON file, relative to `output_dir`. Defaults to "result.json".
   */
  save(fileName) {
    if (!fileName) fileName = 'result.json'
    fs.writeFileSync(path.join(global.output_dir, fileName), JSON.stringify(this.simplify(), null, 2))
  }

  /**
   * Adds stats to this result.
   *
   * @param {Partial<Stats>} [newStats]
   */
  addStats(newStats = {}) {
    this._stats.passes += newStats.passes || 0
    this._stats.failures += newStats.failures || 0
    this._stats.tests += newStats.tests || 0
    this._stats.pending += newStats.pending || 0
    this._stats.failedHooks += newStats.failedHooks || 0

    // do not override start time
    this._stats.start = this._stats.start || newStats.start

    this._stats.end = newStats.end || this._stats.end
    this._stats.duration = newStats.duration
  }
}

module.exports = Result
