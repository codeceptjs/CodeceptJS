import Step from './base.js'
import store from '../store.js'

class HelperStep extends Step {
  constructor(helper, title) {
    super(title)
    /** @member {CodeceptJS.Helper} helper corresponding helper */
    this.helper = helper
    /** @member {string} helperMethod title of method to be executed */
    this.helperMethod = title
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

export default HelperStep

function dryRunResolver() {
  return {
    get(target, prop) {
      if (prop === 'toString') return () => '<VALUE>'
      return new Proxy({}, dryRunResolver())
    },
  }
}
