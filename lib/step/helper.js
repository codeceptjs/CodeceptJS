const Step = require('./base')
const store = require('../store')

class HelperStep extends Step {
  constructor(helper, name) {
    super(name)
    /** @member {CodeceptJS.Helper} helper corresponding helper */
    this.helper = helper
    /** @member {string} helperMethod name of method to be executed */
    this.helperMethod = name
  }

  /**
   * @param {...any} args
   * @return {*}
   */
  run() {
    this.args = Array.prototype.slice.call(arguments)
    this.startTime = +Date.now()

    if (store.dryRun) {
      this.setStatus('success')
      return Promise.resolve(new Proxy({}, dryRunResolver()))
    }
    let result
    try {
      if (this.helperMethod !== 'say') {
        result = this.helper[this.helperMethod].apply(this.helper, this.args)
      }
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

module.exports = HelperStep

function dryRunResolver() {
  return {
    get(target, prop) {
      if (prop === 'toString') return () => '<VALUE>'
      return new Proxy({}, dryRunResolver())
    },
  }
}
