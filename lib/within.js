import output from './output.js'
import storeModule from './store.js'
const store = storeModule.default || storeModule
import recorderModule from './recorder.js'
const recorder = recorderModule.default || recorderModule
import container from './container.js'
import event from './event.js'
import MetaStep from './step/meta.js'
import { isAsyncFunction } from './utils.js'

/**
 * TODO: move to effects
 *
 * @param {CodeceptJS.LocatorOrString}  context
 * @param {Function}  fn
 * @return {Promise<*> | undefined}
 */
function within(context, fn) {
  const helpers = store.dryRun ? {} : container.helpers()
  const locator = typeof context === 'object' ? JSON.stringify(context) : context

  return recorder.add(
    'register within wrapper',
    () => {
      const metaStep = new WithinStep(locator, fn)
      const defineMetaStep = step => (step.metaStep = metaStep)
      recorder.session.start('within')

      event.dispatcher.prependListener(event.step.before, defineMetaStep)

      Object.keys(helpers).forEach(helper => {
        if (helpers[helper]._withinBegin) recorder.add(`[${helper}] start within`, () => helpers[helper]._withinBegin(context))
      })

      const finalize = () => {
        event.dispatcher.removeListener(event.step.before, defineMetaStep)
        recorder.add('Finalize session within session', () => {
          output.stepShift = 1
          recorder.session.restore('within')
        })
      }
      const finishHelpers = () => {
        Object.keys(helpers).forEach(helper => {
          if (helpers[helper]._withinEnd) recorder.add(`[${helper}] finish within`, () => helpers[helper]._withinEnd())
        })
      }

      if (isAsyncFunction(fn)) {
        return fn()
          .then(res => {
            finishHelpers()
            finalize()
            return recorder.promise().then(() => res)
          })
          .catch(e => {
            finalize()
            recorder.throw(e)
          })
      }

      let res
      try {
        res = fn()
      } catch (err) {
        recorder.throw(err)
      } finally {
        finishHelpers()
        recorder.catch(err => {
          output.stepShift = 1
          throw err
        })
      }
      finalize()
      return recorder.promise().then(() => res)
    },
    false,
    false,
  )
}

export default within

class WithinStep extends MetaStep {
  constructor(locator, fn) {
    super('Within')
    this.args = [locator]
  }

  toString() {
    return `${this.prefix}Within ${this.humanizeArgs()}${this.suffix}`
  }
}
