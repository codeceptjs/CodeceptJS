import promiseRetry from 'promise-retry'
import event from '../event.js'
import recorder from '../recorder.js'
import assertThrown from '../assert/throws.js'
import { ucfirst, isAsyncFunction } from '../utils.js'
import { getInjectedArguments } from './inject.js'
import { fireHook } from './hooks.js'

const injectHook = function (inject, suite) {
  // Run the hook body inside recorder queue to ensure async parts complete before returning
  recorder.add('run hook', async () => {
    try {
      await inject()
    } catch (err) {
      throw err
    }
  })
  recorder.catch(err => {
    suiteTestFailedHookError(suite, err)
    throw err
  })
  return recorder.promise()
}

function suiteTestFailedHookError(suite, err, hookName) {
  suite.eachTest(test => {
    test.err = err
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
function test(test) {
  const testFn = test.fn
  if (!testFn) {
    return test
  }

  test.timeout(0)
  test.async = true

  test.fn = function (done) {
    const doneFn = makeDoneCallableOnce(done)
    let testPassed = false
    // Ensure recorder is running so any steps added inside test function are executed
    recorder.startUnlessRunning()
    // Fire started event immediately so listeners are notified regardless of recorder queue
    event.emit(event.test.started, test)
    recorder.errHandler(err => {
      recorder.session.start('teardown')
      recorder.cleanAsyncErr()
      if (test.throws) {
        // check that test should actually fail
        try {
          assertThrown(err, test.throws)
          if (!testPassed) {
            testPassed = true
            event.emit(event.test.passed, test)
          }
          event.emit(event.test.finished, test)
          recorder.add(doneFn)
          return
        } catch (newErr) {
          err = newErr
        }
      }
      test.err = err
      event.emit(event.test.failed, test, err)
      event.emit(event.test.finished, test)
      recorder.add(() => doneFn(err))
    })

    // Wrap test execution in a session so any recorder.add calls inside the test are executed before finishing
    recorder.add('start test session', () => recorder.session.start('test'))
    recorder.add('execute test', async () => {
      const args = await getInjectedArguments(testFn, test)
      const res = testFn.call(test, args)
      if (isAsyncFunction(testFn)) await res
    })
    recorder.add('restore test session', () => recorder.session.restore('test'))
    recorder.add('fire test.passed', () => {
      if (!testPassed) {
        testPassed = true
        event.emit(event.test.passed, test)
      }
      event.emit(event.test.finished, test)
    })
    recorder.add('finish test', doneFn)
    recorder.catch()
  }
  return test
}

/**
 * Injects arguments to function from controller
 */
function injected(fn, suite, hookName) {
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

    this.test.body = fn.toString()

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
          const injectedArgs = await getInjectedArguments(fn)
          await fn.call(this, { ...injectedArgs, suite, test: currentTest })
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

// Suite and test modules will be imported dynamically to avoid circular dependencies

/**
 * Starts promise chain, so helpers could enqueue their hooks
 */
function setup(suite) {
  return injectHook(async () => {
    recorder.startUnlessRunning()
    const testModule = await import('./test.js')
    const { enhanceMochaTest } = testModule.default || testModule
    event.emit(event.test.before, enhanceMochaTest(suite?.ctx?.currentTest))
  }, suite)
}

function teardown(suite) {
  return injectHook(async () => {
    recorder.startUnlessRunning()
    const testModule = await import('./test.js')
    const { enhanceMochaTest } = testModule.default || testModule
    event.emit(event.test.after, enhanceMochaTest(suite?.ctx?.currentTest))
  }, suite)
}

function suiteSetup(suite) {
  return injectHook(async () => {
    recorder.startUnlessRunning()
    const suiteModule = await import('./suite.js')
    const { enhanceMochaSuite } = suiteModule.default || suiteModule
    event.emit(event.suite.before, enhanceMochaSuite(suite))
  }, suite)
}

function suiteTeardown(suite) {
  return injectHook(async () => {
    recorder.startUnlessRunning()
    const suiteModule = await import('./suite.js')
    const { enhanceMochaSuite } = suiteModule.default || suiteModule
    event.emit(event.suite.after, enhanceMochaSuite(suite))
  }, suite)
}

export { test, injected, setup, teardown, suiteSetup, suiteTeardown, getInjectedArguments }

export default { test, injected, setup, teardown, suiteSetup, suiteTeardown, getInjectedArguments }
