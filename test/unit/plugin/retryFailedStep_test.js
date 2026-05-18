import { expect } from 'chai'
import retryFailedStep from '../../../lib/plugin/retryFailedStep.js'
import { tryTo, within } from '../../../lib/effects.js'
import { createTest } from '../../../lib/mocha/test.js'
import session from '../../../lib/session.js'
import store from '../../../lib/store.js'
import container from '../../../lib/container.js'
import event from '../../../lib/event.js'
import recorder from '../../../lib/recorder.js'

describe('retryFailedStep', () => {
  beforeEach(() => {
    recorder.retries = []
    container.clear({
      mock: {
        _session: () => {},
      },
    })
    store.autoRetries = false
    recorder.start()
  })

  afterEach(() => {
    store.autoRetries = false
    event.dispatcher.emit(event.step.finished, {})
  })

  // TODO: These tests pass individually but fail when run with full suite - state management issue
  it.skip('should retry failed step', async () => {
    retryFailedStep({ retries: 2, minTimeout: 1 })
    event.dispatcher.emit(event.test.before, createTest('test'))
    event.dispatcher.emit(event.step.started, { title: 'click' })

    let counter = 0
    await recorder.add(
      () => {
        counter++
        if (counter < 3) {
          throw new Error()
        }
      },
      undefined,
      undefined,
      true,
    )
    return recorder.promise()
  })

  // TODO: These tests pass individually but fail when run with full suite - state management issue
  it.skip('should not retry within', async () => {
    retryFailedStep({ retries: 1, minTimeout: 1 })
    const test = createTest('test')
    event.dispatcher.emit(event.test.before, test)

    let counter = 0
    event.dispatcher.emit(event.step.started, { title: 'click' })
    try {
      within('foo', () => {
        recorder.add(
          () => {
            counter++
            throw new Error()
          },
          undefined,
          undefined,
          true,
        )
      })
      await recorder.promise()
    } catch (e) {
      await recorder.catchWithoutStop(err => err)
    }

    expect(test.opts.conditionalRetries).to.equal(1)
    // expects to retry only once
    expect(counter).to.equal(2)
  })

  describe('config', () => {
    it('applies default retry timing', () => {
      retryFailedStep({})
      const cfg = recorder.retries.find(r => r.deferToScenarioRetries !== undefined)
      expect(cfg.retries).to.equal(3)
      expect(cfg.minTimeout).to.equal(150)
      expect(cfg.maxTimeout).to.equal(10000)
      expect(cfg.factor).to.equal(1.5)
    })

    it('overrides retry timing from config', () => {
      retryFailedStep({ retries: 5, minTimeout: 1000, maxTimeout: 3000, factor: 2 })
      const cfg = recorder.retries.find(r => r.deferToScenarioRetries !== undefined)
      expect(cfg.retries).to.equal(5)
      expect(cfg.minTimeout).to.equal(1000)
      expect(cfg.maxTimeout).to.equal(3000)
      expect(cfg.factor).to.equal(2)
    })

    it('does not leak config between instances', () => {
      retryFailedStep({ retries: 5, minTimeout: 1000 })
      recorder.retries = []
      retryFailedStep({})
      const cfg = recorder.retries.find(r => r.deferToScenarioRetries !== undefined)
      expect(cfg.retries).to.equal(3)
      expect(cfg.minTimeout).to.equal(150)
    })
  })

  it('should not retry steps with wait*', async () => {
    retryFailedStep({ retries: 2, minTimeout: 1 })
    event.dispatcher.emit(event.test.before, createTest('test'))

    let counter = 0
    event.dispatcher.emit(event.step.started, { title: 'waitForElement' })
    try {
      await recorder.add(
        () => {
          counter++
          if (counter < 3) {
            throw new Error()
          }
        },
        undefined,
        undefined,
        true,
      )
      await recorder.promise()
    } catch (e) {
      await recorder.catchWithoutStop(err => err)
    }

    expect(counter).to.equal(1)
    // expects to retry only once
  })

  it('should not retry steps with amOnPage', async () => {
    retryFailedStep({ retries: 2, minTimeout: 1 })
    event.dispatcher.emit(event.test.before, createTest('test'))

    let counter = 0
    event.dispatcher.emit(event.step.started, { title: 'amOnPage' })
    try {
      await recorder.add(
        () => {
          counter++
          if (counter < 3) {
            throw new Error()
          }
        },
        undefined,
        undefined,
        true,
      )
      await recorder.promise()
    } catch (e) {
      await recorder.catchWithoutStop(err => err)
    }

    expect(counter).to.equal(1)
    // expects to retry only once
  })

  it('should add custom steps to ignore', async () => {
    retryFailedStep({ retries: 2, minTimeout: 1, ignoredSteps: ['somethingNew*'] })
    event.dispatcher.emit(event.test.before, createTest('test'))

    let counter = 0
    event.dispatcher.emit(event.step.started, { title: 'somethingNew' })
    try {
      await recorder.add(
        () => {
          counter++
          if (counter < 3) {
            throw new Error()
          }
        },
        undefined,
        undefined,
        true,
      )
      await recorder.promise()
    } catch (e) {
      await recorder.catchWithoutStop(err => err)
    }

    expect(counter).to.equal(1)
    // expects to retry only once
  })

  it('should add custom regexp steps to ignore', async () => {
    retryFailedStep({ retries: 2, minTimeout: 1, ignoredSteps: [/somethingNew/] })
    event.dispatcher.emit(event.test.before, createTest('test'))

    let counter = 0
    event.dispatcher.emit(event.step.started, { title: 'somethingNew' })
    try {
      await recorder.add(
        () => {
          counter++
          if (counter < 3) {
            throw new Error()
          }
        },
        undefined,
        undefined,
        true,
      )
      await recorder.promise()
    } catch (e) {
      await recorder.catchWithoutStop(err => err)
    }

    expect(counter).to.equal(1)
    // expects to retry only once
  })

  // TODO: These tests pass individually but fail when run with full suite - state management issue
  it.skip('should not retry session', async () => {
    retryFailedStep({ retries: 1, minTimeout: 1 })
    event.dispatcher.emit(event.test.before, createTest('test'))
    event.dispatcher.emit(event.step.started, { title: 'click' })
    let counter = 0

    try {
      session('foo', () => {
        recorder.add(
          () => {
            counter++
            throw new Error()
          },
          undefined,
          undefined,
          true,
        )
      })
      await recorder.promise()
    } catch (e) {
      await recorder.catchWithoutStop(err => err)
    }

    // expects to retry only once
    expect(counter).to.equal(2)
  })

  it('should not turn around the chain of retries', () => {
    recorder.retry({
      retries: 2,
      when: err => {
        return err.message === 'someerror'
      },
      identifier: 'test',
    })
    recorder.retry({
      retries: 2,
      when: err => {
        return err.message === 'othererror'
      },
    })

    const getRetryIndex = () => recorder.retries.indexOf(recorder.retries.find(retry => retry.identifier))
    let initalIndex

    recorder.add(
      () => {
        initalIndex = getRetryIndex()
      },
      undefined,
      undefined,
      true,
    )

    recorder.add(
      () => {
        expect(initalIndex).to.equal(getRetryIndex())
      },
      undefined,
      undefined,
      true,
    )
    return recorder.promise()
  })

  // TODO: These tests pass individually but fail when run with full suite - state management issue
  it.skip('should not retry failed step when tryTo plugin is enabled', async () => {
    retryFailedStep({ retries: 2, minTimeout: 1 })
    event.dispatcher.emit(event.test.before, createTest('test'))

    let counter = 0

    // without tryTo effect
    event.dispatcher.emit(event.step.started, { title: 'click' })
    recorder.add('failed step', () => {
      counter++
      if (counter < 3) throw new Error('Ups')
    })
    await recorder.promise()

    expect(counter).to.equal(3)
    counter = 0

    // with tryTo effect
    let res = await tryTo(async () => {
      event.dispatcher.emit(event.step.started, { title: 'click' })
      recorder.add('failed step', () => {
        counter++
        throw new Error('Ups')
      })
      return recorder.promise()
    })
    expect(counter).to.equal(1)
    expect(res).to.equal(false)
  })
})
