const fs = require('fs')
const path = require('path')

class Result {
  constructor() {
    this._stats = {
      passes: 0,
      failures: 0,
      tests: 0,
      pending: 0,
      failedHooks: 0,
    }

    this._startTime = new Date()
    this._endTime = null

    /** @type {CodeceptJS.Test[]} */
    this._tests = []

    /** @type {String[]} */
    this._failures = []

    this.start()
  }

  start() {
    this._startTime = new Date()
  }

  finish() {
    this._endTime = new Date()
  }

  get hasFailed() {
    return this.tests.some(test => test.state === 'failed')
  }

  get tests() {
    return this._tests
  }

  get failures() {
    return this._failures
  }

  get stats() {
    return this._stats
  }

  get startTime() {
    return this._startTime
  }

  addTest(test) {
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
    return this._failures.length > 0
  }

  get duration() {
    return this._endTime ? +this._endTime - +this._startTime : 0
  }

  simplify() {
    return {
      hasFailed: this.hasFailed,
      stats: this.stats,
      duration: this.duration,
      tests: this._tests.map(test => test.simplify()),
      failures: this._failures,
    }
  }

  save(fileName) {
    if (!fileName) fileName = 'result.json'
    fs.writeFileSync(path.join(codeceptjs.outputDir, fileName), JSON.stringify(this.simplify(), null, 2))
  }

  addStats(newStats = {}) {
    this._stats.passes += newStats.passes || 0
    this._stats.failures += newStats.failures || 0
    this._stats.tests += newStats.tests || 0
    this._stats.pending += newStats.pending || 0
    this._stats.failedHooks += newStats.failedHooks || 0
  }
}

module.exports = Result
