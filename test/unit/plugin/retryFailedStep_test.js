let expect
import('chai').then(chai => {
  expect = chai.expect
})

const retryFailedStep = require('../../../lib/plugin/retryFailedStep')
const { tryTo, within } = require('../../../lib/effects')
const { createTest } = require('../../../lib/mocha/test')
const session = require('../../../lib/session')
const store = require('../../../lib/store')
const container = require('../../../lib/container')
const event = require('../../../lib/event')
const recorder = require('../../../lib/recorder')

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

  it('should retry failed step', async () => {
    retryFailedStep({ retries: 2, minTimeout: 1 })
    event.dispatcher.emit(event.test.before, createTest('test'))
    event.dispatcher.emit(event.step.started, { name: 'click' })

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

  it('should not retry within', async () => {
    retryFailedStep({ retries: 1, minTimeout: 1 })
    const test = createTest('test')
    event.dispatcher.emit(event.test.before, test)

    let counter = 0
    event.dispatcher.emit(event.step.started, { name: 'click' })
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
    counter.should.equal(2)
  })

  it('should not retry steps with wait*', async () => {
    retryFailedStep({ retries: 2, minTimeout: 1 })
    event.dispatcher.emit(event.test.before, createTest('test'))

    let counter = 0
    event.dispatcher.emit(event.step.started, { name: 'waitForElement' })
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
    event.dispatcher.emit(event.step.started, { name: 'amOnPage' })
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
    event.dispatcher.emit(event.step.started, { name: 'somethingNew' })
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
    event.dispatcher.emit(event.step.started, { name: 'somethingNew' })
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

  it('should not retry session', async () => {
    retryFailedStep({ retries: 1, minTimeout: 1 })
    event.dispatcher.emit(event.test.before, createTest('test'))
    event.dispatcher.emit(event.step.started, { name: 'click' })
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
        initalIndex.should.equal(getRetryIndex())
      },
      undefined,
      undefined,
      true,
    )
    return recorder.promise()
  })

  it('should not retry failed step when tryTo plugin is enabled', async () => {
    retryFailedStep({ retries: 2, minTimeout: 1 })
    event.dispatcher.emit(event.test.before, createTest('test'))

    let counter = 0

    // without tryTo effect
    event.dispatcher.emit(event.step.started, { name: 'click' })
    recorder.add('failed step', () => {
      counter++
      if (counter < 3) throw new Error('Ups')
    })
    await recorder.promise()

    expect(counter).to.equal(3)
    counter = 0

    // with tryTo effect
    let res = await tryTo(async () => {
      event.dispatcher.emit(event.step.started, { name: 'click' })
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
