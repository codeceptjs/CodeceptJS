import { expect } from 'chai'
import pausePlugin from '../../../lib/plugin/pause.js'
import { setPauseHandler } from '../../../lib/pause.js'
import { hopeThat, isEffectActive, retryTo, tryTo } from '../../../lib/effects.js'
import recordStep from '../../../lib/step/record.js'
import Step from '../../../lib/step.js'
import event from '../../../lib/event.js'
import recorder from '../../../lib/recorder.js'
import store from '../../../lib/store.js'
import { createTest } from '../../../lib/mocha/test.js'

const trackedEvents = [event.test.before, event.test.started, event.test.failed, event.test.after, event.step.failed]

const failingStep = () => recordStep(new Step({ fail: () => Promise.reject(new Error('Ups')) }, 'fail'), [])

describe('pause plugin on=fail', () => {
  let pauses
  let listenersBefore

  beforeEach(() => {
    store.dryRun = false
    pauses = 0
    setPauseHandler(() => {
      pauses++
      return Promise.resolve()
    })
    listenersBefore = Object.fromEntries(trackedEvents.map(name => [name, event.dispatcher.listeners(name)]))
    recorder.reset()
    recorder.start()
    pausePlugin({})
  })

  afterEach(() => {
    for (const name of trackedEvents) {
      for (const listener of event.dispatcher.listeners(name)) {
        if (!listenersBefore[name].includes(listener)) event.dispatcher.removeListener(name, listener)
      }
    }
    event.dispatcher.emit(event.test.finished, createTest('cleanup'))
    setPauseHandler(null)
    recorder.reset()
  })

  const finishTest = async test => {
    event.dispatcher.emit(event.test.finished, test)
    event.dispatcher.emit(event.test.after, test)
    await recorder.promise()
  }

  it('does not pause when a step failure is swallowed by tryTo (#4516)', async () => {
    const test = createTest('tryTo')
    event.dispatcher.emit(event.test.started, test)
    const result = await tryTo(failingStep)
    await recorder.promise()
    expect(result).to.equal(false)
    event.dispatcher.emit(event.test.passed, test)
    await finishTest(test)
    expect(pauses).to.equal(0)
  })

  it('pauses when a hopeThat soft assertion fails', async () => {
    const test = createTest('hopeThat')
    event.dispatcher.emit(event.test.started, test)
    const result = await hopeThat(failingStep)
    await recorder.promise()
    expect(result).to.equal(false)
    event.dispatcher.emit(event.test.passed, test)
    await finishTest(test)
    expect(pauses).to.equal(1)
  })

  it('does not pause when retryTo succeeds after a failed attempt', async () => {
    const test = createTest('retryTo')
    event.dispatcher.emit(event.test.started, test)
    await retryTo(tries => (tries === 1 ? failingStep() : recorder.add(() => 'ok')), 2, 0)
    await recorder.promise()
    event.dispatcher.emit(event.test.passed, test)
    await finishTest(test)
    expect(pauses).to.equal(0)
  })

  it('pauses when retryTo exhausts all attempts', async () => {
    const test = createTest('retryTo exhausted')
    event.dispatcher.emit(event.test.started, test)
    const err = await retryTo(failingStep, 2, 0).catch(e => e)
    expect(err).to.be.instanceOf(Error)
    recorder.reset()
    recorder.start()
    event.dispatcher.emit(event.test.failed, test, err)
    await finishTest(test)
    expect(pauses).to.equal(1)
    expect(isEffectActive()).to.equal(false)
  })

  it('leaves no active effect after nested tryTo', async () => {
    await tryTo(() => tryTo(failingStep))
    await recorder.promise()
    expect(isEffectActive()).to.equal(false)
  })

  it('pauses when a failed step fails the test', async () => {
    const test = createTest('failing step')
    event.dispatcher.emit(event.test.started, test)
    const err = await failingStep().catch(e => e)
    recorder.reset()
    recorder.start()
    event.dispatcher.emit(event.test.failed, test, err)
    await finishTest(test)
    expect(pauses).to.equal(1)
  })

  it('pauses when a Before hook fails', async () => {
    const test = createTest('before hook')
    event.dispatcher.emit(event.test.before, test)
    const err = await failingStep().catch(e => e)
    recorder.reset()
    recorder.start()
    event.dispatcher.emit(event.test.failed, test, err, 'Before')
    await finishTest(test)
    expect(pauses).to.equal(1)
  })

  it('pauses when an After hook fails a passed test', async () => {
    const test = createTest('after hook')
    event.dispatcher.emit(event.test.started, test)
    event.dispatcher.emit(event.test.passed, test)
    const err = await failingStep().catch(e => e)
    recorder.reset()
    recorder.start()
    event.dispatcher.emit(event.test.failed, test, err, 'After')
    await finishTest(test)
    expect(pauses).to.equal(1)
  })

  it('does not pause when the test fails without a failed step', async () => {
    const test = createTest('plain error')
    event.dispatcher.emit(event.test.started, test)
    event.dispatcher.emit(event.test.failed, test, new Error('Ups'))
    await finishTest(test)
    expect(pauses).to.equal(0)
  })

  it('does not carry a failure over to the next test', async () => {
    const failed = createTest('failed')
    event.dispatcher.emit(event.test.started, failed)
    const err = await failingStep().catch(e => e)
    recorder.reset()
    recorder.start()
    event.dispatcher.emit(event.test.failed, failed, err)
    await finishTest(failed)

    const passed = createTest('passed')
    event.dispatcher.emit(event.test.started, passed)
    event.dispatcher.emit(event.test.passed, passed)
    await finishTest(passed)
    expect(pauses).to.equal(1)
  })
})
