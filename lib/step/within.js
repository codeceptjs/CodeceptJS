import MetaStep from './meta.js'
import event from '../event.js'
import recorder from '../recorder.js'
import output from '../output.js'
import store from '../store.js'
import container from '../container.js'

let currentWithin

class WithinStep extends MetaStep {
  constructor(locator) {
    super('Within')
    this.args = [locator]
  }

  toString() {
    return `${this.prefix}Within ${this.humanizeArgs()}${this.suffix}`
  }
}

class WithinContext {
  constructor(locator) {
    this.locator = locator
    this.locatorString = typeof locator === 'object' ? JSON.stringify(locator) : locator
    this.metaStep = new WithinStep(this.locatorString)
    this.attachMetaStep = step => {
      if (currentWithin !== this) return
      if (!step) return
      step.metaStep = this.metaStep
    }
  }

  start() {
    if (currentWithin) currentWithin.end()
    currentWithin = this

    const helpers = store.dryRun ? {} : container.helpers()

    event.dispatcher.prependListener(event.step.before, this.attachMetaStep)
    event.dispatcher.once(event.test.finished, () => this.end())

    Object.keys(helpers).forEach(helper => {
      if (helpers[helper]._withinBegin) {
        recorder.add(`[${helper}] start within`, () => helpers[helper]._withinBegin(this.locator))
      }
    })
  }

  end() {
    if (currentWithin !== this) return
    currentWithin = null

    const helpers = store.dryRun ? {} : container.helpers()

    Object.keys(helpers).forEach(helper => {
      if (helpers[helper]._withinEnd) {
        recorder.add(`[${helper}] finish within`, () => helpers[helper]._withinEnd())
      }
    })

    recorder.add('finish within', () => {
      output.stepShift = 1
    })

    event.dispatcher.removeListener(event.step.before, this.attachMetaStep)
  }

  static current() {
    return currentWithin
  }

  static endCurrent() {
    if (currentWithin) currentWithin.end()
  }
}

export { WithinContext, WithinStep }
export default WithinContext
