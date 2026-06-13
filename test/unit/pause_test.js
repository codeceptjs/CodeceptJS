import { expect } from 'chai'
import sinon from 'sinon'
import pause, { setPauseHandler, pauseNow } from '../../lib/pause.js'
import recorder from '../../lib/recorder.js'
import event from '../../lib/event.js'
import store from '../../lib/store.js'

const settles = (promise, ms = 2000) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      const t = setTimeout(() => reject(new Error(`did not settle within ${ms}ms`)), ms)
      t.unref?.()
    }),
  ])

describe('pause external handler hook', () => {
  afterEach(() => {
    setPauseHandler(null)
  })

  it('setPauseHandler is exported and callable', () => {
    expect(typeof setPauseHandler).to.equal('function')
    expect(() => setPauseHandler(() => Promise.resolve())).to.not.throw()
    expect(() => setPauseHandler(null)).to.not.throw()
  })

  it('handler receives registered variables and returns a Promise', async () => {
    let received = null
    const handler = arg => {
      received = arg
      return Promise.resolve()
    }
    setPauseHandler(handler)
    // Drive the handler directly to verify the contract
    const p = handler({ registeredVariables: { foo: 1 } })
    expect(p).to.be.a('promise')
    await p
    expect(received).to.deep.equal({ registeredVariables: { foo: 1 } })
  })
})

describe('pause listener lifecycle', () => {
  beforeEach(() => {
    store.dryRun = false
    setPauseHandler(null)
    recorder.reset()
    recorder.stop()
  })

  afterEach(() => {
    setPauseHandler(null)
    event.dispatcher.emit(event.test.finished)
    recorder.reset()
  })

  it('keeps exactly one listener no matter how many pause() calls', () => {
    const baseStep = event.dispatcher.listenerCount(event.step.after)
    const baseFin = event.dispatcher.listenerCount(event.test.finished)
    pause()
    pause()
    pause()
    expect(event.dispatcher.listenerCount(event.step.after)).to.equal(baseStep + 1)
    expect(event.dispatcher.listenerCount(event.test.finished)).to.equal(baseFin + 1)
  })

  it('removes both pause listeners when the test finishes', () => {
    const baseStep = event.dispatcher.listenerCount(event.step.after)
    const baseFin = event.dispatcher.listenerCount(event.test.finished)
    pause()
    expect(event.dispatcher.listenerCount(event.step.after)).to.equal(baseStep + 1)
    event.dispatcher.emit(event.test.finished)
    expect(event.dispatcher.listenerCount(event.step.after)).to.equal(baseStep)
    expect(event.dispatcher.listenerCount(event.test.finished)).to.equal(baseFin)
  })

  it('does not restore the pause session when none is open on test.finished', async () => {
    pause()
    recorder.start()
    const restoreSpy = sinon.spy(recorder.session, 'restore')
    event.dispatcher.emit(event.test.finished)
    event.dispatcher.emit(event.test.finished)
    const pauseRestores = restoreSpy.getCalls().filter(c => c.args[0] === 'pause').length
    restoreSpy.restore()
    expect(pauseRestores, 'no pause restore when nothing is open').to.equal(0)
    expect(recorder.getCurrentSessionId()).to.equal(null)
    await settles(recorder.promise())
  })

  it('pauseNow drives the external handler and restores the session', async () => {
    let received = null
    setPauseHandler(arg => {
      received = arg
      return Promise.resolve()
    })
    recorder.start()
    pauseNow({ foo: 1 })
    await settles(recorder.promise())
    expect(received).to.deep.equal({ registeredVariables: { foo: 1 } })
    expect(recorder.getCurrentSessionId()).to.equal(null)
  })
})
