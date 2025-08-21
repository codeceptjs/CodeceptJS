import promiseRetry from 'promise-retry'
import event from '../event.js'
import recorder from '../recorder.js'
import assertThrown from '../assert/throws.js'
import { ucfirst, isAsyncFunction } from '../utils.js'
import { getInjectedArguments } from './inject.js'
import { fireHook } from './hooks.js'
import { enhanceMochaSuite } from './suite.js'
import { enhanceMochaTest } from './test.js'

const injectHook = function (inject, suite) {
  try {
    inject()
  } catch (err) {
    recorder.throw(err)
  }
  recorder.catch(err => {
    suiteTestFailedHookError(suite, err)
    throw err
  })
  return recorder.promise()
}

function suiteTestFailedHookError(suite, err, hookName) {
  suite.eachTest(test => {
    testInstance.err = err
    if (hookName) hookName = ucfirst(hookName)
    event.emit(event.test.failed, test, err, hookName)
  })
}

function makeDoneCallableOnce(done) {
  let called = false
  return function (err) {
    if (called) {
      return
    }
    called = true
    return done(err)
  }
}

/**
 * Wraps test function, injects support objects from container,
 * starts promise chain with recorder, performs before/after hooks
 * through event system.
 */
export function test(testInstance) {
  const testFn = testInstance.fn
  if (!testFn) {
    return testInstance
  }

  testInstance.timeout(0)
  testInstance.async = true

  testInstance.fn = function (done) {
    const doneFn = makeDoneCallableOnce(done)
    recorder.errHandler(err => {
      recorder.session.start('teardown')
      recorder.cleanAsyncErr()
      if (testInstance.throws) {
        // check that test should actually fail
        try {
          assertThrown(err, testInstance.throws)
          event.emit(event.test.passed, testInstance)
          event.emit(event.test.finished, testInstance)
          recorder.add(doneFn)
          return
        } catch (newErr) {
          err = newErr
        }
      }
      testInstance.err = err
      event.emit(event.test.failed, testInstance, err)
      event.emit(event.test.finished, testInstance)
      recorder.add(() => doneFn(err))
    })

    if (isAsyncFunction(testFn)) {
      event.emit(event.test.started, testInstance)
      testFn
        .call(testInstance, getInjectedArguments(testFn, testInstance))
        .then(() => {
          recorder.add('fire testInstance.passed', () => {
            event.emit(event.test.passed, testInstance)
            event.emit(event.test.finished, testInstance)
          })
          recorder.add('finish test', doneFn)
        })
        .catch(err => {
          recorder.throw(err)
        })
        .finally(() => {
          recorder.catch()
        })
      return
    }

    try {
      event.emit(event.test.started, testInstance)
      testFn.call(testInstance, getInjectedArguments(testFn, testInstance))
    } catch (err) {
      recorder.throw(err)
    } finally {
      recorder.add('fire testInstance.passed', () => {
        event.emit(event.test.passed, testInstance)
        event.emit(event.test.finished, testInstance)
      })
      recorder.add('finish test', doneFn)
      recorder.catch()
    }
  }
  return testInstance
}

/**
 * Injects arguments to function from controller
 */
export function injected(fn, suite, hookName) {
  return function (done) {
    const doneFn = makeDoneCallableOnce(done)
    const errHandler = err => {
      recorder.session.start('teardown')
      recorder.cleanAsyncErr()
      if (['before', 'beforeSuite'].includes(hookName)) {
        suiteTestFailedHookError(suite, err, hookName)
      }
      if (hookName === 'after') {
        suiteTestFailedHookError(suite, err, hookName)
        suite.eachTest(test => {
          event.emit(event.test.after, test)
        })
      }
      if (hookName === 'afterSuite') {
        suiteTestFailedHookError(suite, err, hookName)
        event.emit(event.suite.after, suite)
      }
      recorder.add(() => doneFn(err))
    }

    recorder.errHandler(err => {
      errHandler(err)
    })

    if (!fn) throw new Error('fn is not defined')

    fireHook(event.hook.started, suite)

    this.testInstance.body = fn.toString()

    if (!recorder.isRunning()) {
      recorder.errHandler(err => {
        errHandler(err)
      })
    }

    const opts = suite.opts || {}
    const retries = opts[`retry${ucfirst(hookName)}`] || 0

    const currentTest = hookName === 'before' || hookName === 'after' ? suite?.ctx?.currentTest : null

    promiseRetry(
      async (retry, number) => {
        try {
          recorder.startUnlessRunning()
          await fn.call(this, { ...getInjectedArguments(fn), suite, test: currentTest })
          await recorder.promise().catch(err => retry(err))
        } catch (err) {
          retry(err)
        } finally {
          if (number < retries) {
            recorder.stop()
            recorder.start()
          }
        }
      },
      { retries },
    )
      .then(() => {
        recorder.add('fire hook.passed', () => fireHook(event.hook.passed, suite))
        recorder.add('fire hook.finished', () => fireHook(event.hook.finished, suite))
        recorder.add(`finish ${hookName} hook`, doneFn)
        recorder.catch()
      })
      .catch(e => {
        recorder.throw(e)
        recorder.catch(e => {
          const err = recorder.getAsyncErr() === null ? e : recorder.getAsyncErr()
          errHandler(err)
        })
        recorder.add('fire hook.failed', () => fireHook(event.hook.failed, suite, e))
        recorder.add('fire hook.finished', () => fireHook(event.hook.finished, suite))
      })
  }
}

/**
 * Starts promise chain, so helpers could enqueue their hooks
 */
export function setup(suite) {
  return injectHook(() => {
    recorder.startUnlessRunning()
    event.emit(event.test.before, enhanceMochaTest(suite?.ctx?.currentTest))
  }, suite)
}

export function teardown(suite) {
  return injectHook(() => {
    recorder.startUnlessRunning()
    event.emit(event.test.after, enhanceMochaTest(suite?.ctx?.currentTest))
  }, suite)
}

export function suiteSetup(suite) {
  return injectHook(() => {
    recorder.startUnlessRunning()
    event.emit(event.suite.before, enhanceMochaSuite(suite))
  }, suite)
}

export function suiteTeardown(suite) {
  return injectHook(() => {
    recorder.startUnlessRunning()
    event.emit(event.suite.after, enhanceMochaSuite(suite))
  }, suite)
}

export { getInjectedArguments }
