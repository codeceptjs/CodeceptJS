import Step from './base.js'
import store from '../store.js'

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

export default HelperStep

export function extractStepCode(step) {
  return (step.code || (typeof step.toCode === 'function' ? step.toCode() : step.name)).trim()
}

function dryRunResolver() {
  return {
    get(target, prop) {
      if (prop === 'toString') return () => '<VALUE>'
      return new Proxy({}, dryRunResolver())
    },
  }
}
