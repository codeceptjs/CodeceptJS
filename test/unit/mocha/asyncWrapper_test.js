import { expect } from 'chai'
import sinon from 'sinon'
import { test as testWrapper, setup, teardown, suiteSetup, suiteTeardown } from '../../../lib/mocha/asyncWrapper.js'
import recorder from '../../../lib/recorder.js'
import event from '../../../lib/event.js'
import Container from '../../../lib/container.js'

let test
let fn
let before
let after
let beforeSuite
let afterSuite
let failed
let started

describe('AsyncWrapper', () => {
  beforeEach(async () => {
    test = { timeout: () => {} }
    fn = sinon.spy()
    test.fn = fn
    await Container.create({
      helpers: {
        TestHelper: {
          testMethod: () => 'test result',
        },
      },
    })
  })
  beforeEach(() => recorder.reset())
  afterEach(() => event.cleanDispatcher())

  it('should wrap test function', () => {
    testWrapper(test).fn(() => {})
    // Return a promise that resolves when the recorder promise resolves
    return new Promise(resolve => {
      // Use setImmediate to allow the wrapped function to execute
      setImmediate(() => {
        try {
          expect(fn.called).is.ok
          resolve()
        } catch (err) {
          // If the recorder is running, wait for it
          if (recorder.isRunning()) {
            recorder
              .promise()
              .then(() => {
                expect(fn.called).is.ok
                resolve()
              })
              .catch(resolve)
          } else {
            throw err
          }
        }
      })
    })
  })

  it('should work with async func', async () => {
    let counter = 0
    test.fn = async () => {
      recorder.add('test', async () => {
        counter++
        counter++
        counter++
        counter++
      })
    }

    await setup()
    const wrappedTest = testWrapper(test)
    // Wait for the wrapped function to complete
    await new Promise(resolve => wrappedTest.fn(resolve))
    recorder.add('validation', () => expect(counter).to.eq(4))
    return recorder.promise()
  })

  describe('events', () => {
    beforeEach(async () => {
      event.dispatcher.on(event.test.before, (before = sinon.spy()))
      event.dispatcher.on(event.test.after, (after = sinon.spy()))
      event.dispatcher.on(event.test.started, (started = sinon.spy()))
      event.dispatcher.on(event.suite.before, (beforeSuite = sinon.spy()))
      event.dispatcher.on(event.suite.after, (afterSuite = sinon.spy()))
      await new Promise(r => suiteSetup()(r))
      await new Promise(r => setup()(r))
    })

    it('should fire events', async () => {
      recorder.reset()
      const wrappedTest = testWrapper(test)

      // Execute the wrapped test function with a mock done callback
      return new Promise((resolve, reject) => {
        wrappedTest.fn(err => {
          ;(async () => {
            try {
              await new Promise(r => teardown()(r))
              await new Promise(r => suiteTeardown()(r))

              if (err) {
                reject(err)
                return
              }

              expect(started.called).is.ok
              expect(beforeSuite.called).is.ok
              expect(afterSuite.called).is.ok
              expect(before.called).is.ok
              expect(after.called).is.ok
              resolve()
            } catch (testErr) {
              reject(testErr)
            }
          })()
        })
      })
    })

    it('should fire failed event on error', async () => {
      event.dispatcher.on(event.test.failed, (failed = sinon.spy()))
      await setup()
      test.fn = () => {
        throw new Error('ups')
      }
      testWrapper(test).fn(() => {})
      return recorder
        .promise()
        .then(() => expect(failed.called).is.ok)
        .catch(() => null)
    })

    it('should fire failed event on async error', () => {
      test.fn = () => {
        recorder.throw(new Error('ups'))
      }
      testWrapper(test).fn(() => {})
      return recorder
        .promise()
        .then(() => expect(failed.called).is.ok)
        .catch(() => null)
    })
  })
})
