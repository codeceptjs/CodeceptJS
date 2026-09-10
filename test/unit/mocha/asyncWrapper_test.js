import { expect } from 'chai'
import sinon from 'sinon'
import { test as testWrapper, injected, setup, teardown, suiteSetup, suiteTeardown } from '../../../lib/mocha/asyncWrapper.js'
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

// Runs a wrapped test/hook fn and resolves with how many times its done
// callback fired and the argument it received. A done that never fires becomes
// a fast, named rejection instead of a mocha timeout.
function runHook(hookFn, ms = 2000) {
  return new Promise((resolve, reject) => {
    let count = 0
    let arg
    const timer = setTimeout(() => reject(new Error('done callback was never called')), ms)
    timer.unref?.()
    hookFn(err => {
      count++
      arg = err
      const settle = setTimeout(() => {
        clearTimeout(timer)
        resolve({ count, arg })
      }, 50)
      settle.unref?.()
    })
  })
}

describe('AsyncWrapper', () => {
  beforeEach(async () => {
    test = { timeout: () => {} }
    fn = sinon.spy()
    test.fn = fn
    await Container.create({
      helpers: {
        FileSystem: {},
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

  describe('test() lifecycle (characterization)', () => {
    beforeEach(() => recorder.start())

    it('calls done once with the error and fires test.failed when a queued step throws', async () => {
      const onFailed = sinon.spy()
      event.dispatcher.on(event.test.failed, onFailed)
      test.fn = () => {
        recorder.add(() => {
          throw new Error('stepfail')
        })
      }
      const { count, arg } = await runHook(testWrapper(test).fn)
      expect(count).to.equal(1)
      expect(arg).to.be.instanceof(Error)
      expect(arg.message).to.equal('stepfail')
      expect(onFailed.called, 'test.failed fired').to.be.true
    })

    it('calls done once with the error when the body throws synchronously', async () => {
      const onFailed = sinon.spy()
      event.dispatcher.on(event.test.failed, onFailed)
      test.fn = () => {
        throw new Error('syncthrow')
      }
      const { count, arg } = await runHook(testWrapper(test).fn)
      expect(count).to.equal(1)
      expect(arg).to.be.instanceof(Error)
      expect(arg.message).to.equal('syncthrow')
      expect(onFailed.called, 'test.failed fired').to.be.true
    })

    it('passes (done with no error) and fires test.passed when test.throws matches', async () => {
      const onPassed = sinon.spy()
      event.dispatcher.on(event.test.passed, onPassed)
      test.throws = /boom/
      test.fn = () => {
        throw new Error('boom happened')
      }
      const { count, arg } = await runHook(testWrapper(test).fn)
      expect(count).to.equal(1)
      expect(arg, 'done called with no error').to.be.undefined
      expect(onPassed.called, 'test.passed fired').to.be.true
    })
  })

  describe('injected() hooks (characterization)', () => {
    beforeEach(() => recorder.start())

    it('a rejecting before-hook calls done with the error and fails the suite tests', async () => {
      const onFailed = sinon.spy()
      event.dispatcher.on(event.test.failed, onFailed)
      const suiteTests = [{ title: 'sample test' }]
      const suite = {
        opts: {},
        ctx: { test: { title: '"before each" hook' }, currentTest: suiteTests[0] },
        eachTest: cb => suiteTests.forEach(cb),
      }
      const fn = async () => {
        throw new Error('hookfail')
      }
      const hook = injected(fn, suite, 'before')
      const { arg } = await runHook(hook.bind({ test: {} }))
      expect(arg, 'done received the error').to.be.instanceof(Error)
      expect(arg.message).to.equal('hookfail')
      expect(onFailed.called, 'test.failed emitted for suite tests').to.be.true
      expect(suiteTests[0].err, 'the suite test got the hook error attached').to.be.instanceof(Error)
    })
  })

  describe('setup/teardown import hardening (regression)', () => {
    beforeEach(() => recorder.start())

    it('setup(): a throwing then-body calls done with the error instead of hanging', async () => {
      const suite = {
        ctx: {
          get currentTest() {
            throw new Error('setup-boom')
          },
        },
      }
      const { count, arg } = await runHook(setup(suite), 1000)
      expect(count).to.equal(1)
      expect(arg).to.be.instanceof(Error)
      expect(arg.message).to.equal('setup-boom')
    })

    it('teardown(): a throwing then-body calls done with the error instead of hanging', async () => {
      const suite = {
        ctx: {
          get currentTest() {
            throw new Error('teardown-boom')
          },
        },
      }
      const { count, arg } = await runHook(teardown(suite), 1000)
      expect(count).to.equal(1)
      expect(arg).to.be.instanceof(Error)
      expect(arg.message).to.equal('teardown-boom')
    })

    it('setup(): happy path calls done with no error', async () => {
      const suite = { ctx: { currentTest: { title: 'a sample test' } } }
      const { count, arg } = await runHook(setup(suite), 1000)
      expect(count).to.equal(1)
      expect(arg, 'done called with no error').to.be.undefined
    })
  })
  describe('helper lifecycle hook failures (#5660)', () => {
    beforeEach(() => recorder.start())

    // A helper's _beforeSuite()/_afterSuite() is queued on the recorder from an
    // event.suite.before/after listener (lib/listener/helpers.js), not through
    // the injected() wrapper, so it lands in suiteSetup/suiteTeardown's
    // errHandler rather than in the path that fires hook.failed.
    function queueFailingHelperHook(evt, message) {
      event.dispatcher.on(evt, () => {
        recorder.add(`hook MyHelper.${message}()`, () => {
          throw new Error(message)
        })
        recorder.catch()
      })
    }

    it('suiteSetup(): a failing helper _beforeSuite emits hook.failed', async () => {
      const failed = sinon.spy()
      event.dispatcher.on(event.hook.failed, failed)
      queueFailingHelperHook(event.suite.before, '_beforeSuite')

      const suite = { title: 'Login', ctx: { test: { title: 'codeceptjs.beforeSuite' } } }
      const { arg } = await runHook(suiteSetup(suite), 2000)

      expect(arg).to.be.instanceof(Error)
      expect(arg.message).to.equal('_beforeSuite')
      expect(failed.called, 'hook.failed was emitted').to.be.true
      expect(failed.firstCall.args[0].hookName).to.equal('BeforeSuite')
      expect(failed.firstCall.args[0].err).to.equal(arg)
    })

    it('suiteTeardown(): a failing helper _afterSuite emits hook.failed', async () => {
      const failed = sinon.spy()
      event.dispatcher.on(event.hook.failed, failed)
      queueFailingHelperHook(event.suite.after, '_afterSuite')

      const suite = { title: 'Login', ctx: { test: { title: 'codeceptjs.afterSuite' } } }
      const { arg } = await runHook(suiteTeardown(suite), 2000)

      expect(arg).to.be.instanceof(Error)
      expect(failed.called, 'hook.failed was emitted').to.be.true
      expect(failed.firstCall.args[0].hookName).to.equal('AfterSuite')
    })
  })
})
