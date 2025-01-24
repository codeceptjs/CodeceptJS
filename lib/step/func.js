const BaseStep = require('./base')
const store = require('../store')

/**
 * Function executed as a step
 */
class FuncStep extends BaseStep {
  setCallable(fn) {
    this.fn = fn
  }

  setHelper(helper) {
    this.helper = helper
  }

  run() {
    if (!this.fn) throw new Error('Function is not set')

    this.args = Array.prototype.slice.call(arguments)
    this.startTime = +Date.now()

    if (store.dryRun) {
      this.setStatus('success')
      // should we add Proxy and dry run resolver here?
      return Promise.resolve(true)
    }

    let result
    try {
      result = this.fn.apply(this.helper, this.args)
      this.setStatus('success')
      this.endTime = +Date.now()
    } catch (err) {
      this.endTime = +Date.now()
      this.setStatus('failed')
      throw err
    }
    return result
  }
}

module.exports = FuncStep
