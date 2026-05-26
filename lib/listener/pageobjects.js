import event from '../event.js'
import recorder from '../recorder.js'
import store from '../store.js'
import container from '../container.js'
import { resetBeforeCalledSet, getBeforeCalledSet } from '../container.js'

export default function () {
  const runAsyncSupportHook = (hook, param, force) => {
    if (store.dryRun) return
    const support = container.supportObjects()
    Object.keys(support).forEach(key => {
      if (key === 'I') return
      const obj = support[key]
      if (!obj || typeof obj !== 'object' || !obj[hook]) return
      recorder.add(`pageobject ${key}.${hook}()`, () => obj[hook](param), force, false)
    })
  }

  event.dispatcher.on(event.test.started, () => {
    resetBeforeCalledSet()
  })

  event.dispatcher.on(event.test.after, () => {
    if (store.dryRun) return
    const support = container.supportObjects()
    const called = getBeforeCalledSet()
    called.forEach(name => {
      const obj = support[name]
      if (obj && obj._after) {
        recorder.add(`pageobject ${name}._after()`, () => obj._after(), true, false)
      }
    })
    recorder.catchWithoutStop(() => {})
  })

  event.dispatcher.on(event.suite.after, suite => {
    runAsyncSupportHook('_afterSuite', suite, true)
  })

  event.dispatcher.on(event.suite.before, suite => {
    runAsyncSupportHook('_beforeSuite', suite, true)
  })
}
