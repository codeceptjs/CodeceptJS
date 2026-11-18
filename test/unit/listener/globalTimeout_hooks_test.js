import { expect } from 'chai'
import event from '../../../lib/event.js'
import store from '../../../lib/store.js'
import globalTimeoutListener from '../../../lib/listener/globalTimeout.js'
import { AfterSuiteHook } from '../../../lib/mocha/hooks.js'

describe('globalTimeout listener - suite hooks', () => {
  let prevTimeouts

  const removeHookListeners = () => {
    for (const name of Object.values(event.hook)) event.dispatcher.removeAllListeners(name)
  }

  beforeEach(() => {
    prevTimeouts = store.timeouts
    store.timeouts = true
    event.cleanDispatcher()
    removeHookListeners()
    globalTimeoutListener()
  })

  afterEach(() => {
    store.timeouts = prevTimeouts
    event.cleanDispatcher()
    removeHookListeners()
  })

  it('ignores hook.finished for a suite hook that never fired hook.started', () => {
    const hook = new AfterSuiteHook({ suite: { title: 'suite' } })
    expect(() => event.dispatcher.emit(event.hook.finished, hook)).not.to.throw()
  })

  it('restores saved timeouts only once per started suite hook', () => {
    const hook = new AfterSuiteHook({ suite: { title: 'suite' } })
    event.dispatcher.emit(event.hook.started, hook)
    event.dispatcher.emit(event.hook.finished, hook)
    expect(() => event.dispatcher.emit(event.hook.finished, hook)).not.to.throw()
  })
})
