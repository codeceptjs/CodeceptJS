const fs = require('fs')
const path = require('path')
const { serializeTest } = require('./mocha/test')

/**
 * Result of the test run
 *
 * @typedef {Object} Stats
 * @property {number} passes
 * @property {number} failures
 * @property {number} tests
 * @property {number} pending
 * @property {number} failedHooks
 * @property {Date} start
 * @property {Date} end
 * @property {number} duration
 */
class Result {
  /**
   * Create Result of the test run
   */
  constructor() {
    this._startTime = new Date()
    this._endTime = null

    this.reset()
    this.start()
  }

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

    /** @type {CodeceptJS.Test[]} */
    this._tests = []

    /** @type {String[]} */
    this._failures = []
  }

  start() {
    this._startTime = new Date()
  }

  finish() {
    this._endTime = new Date()
  }

  get hasFailed() {
    return this._stats.failures > 0
  }

  get tests() {
    return this._tests
  }

  get failures() {
    return this._failures.filter(f => f && (!Array.isArray(f) || f.length > 0))
  }

  get stats() {
    return this._stats
  }

  get startTime() {
    return this._startTime
  }

  /**
   * Add test to result
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
   * Add failures to result
   *
   * @param {String[]} newFailures
   */
  addFailures(newFailures) {
    this._failures.push(...newFailures)
  }

  get hasFailures() {
    return this.stats.failures > 0
  }

  get duration() {
    return this._endTime ? +this._endTime - +this._startTime : 0
  }

  get failedTests() {
    return this._tests.filter(test => test.state === 'failed')
  }

  get passedTests() {
    return this._tests.filter(test => test.state === 'passed')
  }

  get skippedTests() {
    return this._tests.filter(test => test.state === 'skipped' || test.state === 'pending')
  }

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
   * Save result to json file
   *
   * @param {string} fileName
   */
  save(fileName) {
    if (!fileName) fileName = 'result.json'
    fs.writeFileSync(path.join(global.output_dir, fileName), JSON.stringify(this.simplify(), null, 2))
  }

  /**
   * Add stats to result
   *
   * @param {object} newStats
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
