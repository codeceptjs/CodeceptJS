const promiseRetry = require('promise-retry')
const event = require('../event')
const recorder = require('../recorder')
const assertThrown = require('../assert/throws')
const { ucfirst, isAsyncFunction } = require('../utils')
const { getInjectedArguments } = require('./inject')
const { fireHook } = require('./hooks')

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
    test.err = err
    event.emit(event.test.failed, test, err, ucfirst(hookName))
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
module.exports.test = test => {
  const testFn = test.fn
  if (!testFn) {
    return test
  }

  test.timeout(0)
  test.async = true

  test.fn = function (done) {
    const doneFn = makeDoneCallableOnce(done)
    recorder.errHandler(err => {
      recorder.session.start('teardown')
      recorder.cleanAsyncErr()
      if (test.throws) {
        // check that test should actually fail
        try {
          assertThrown(err, test.throws)
          event.emit(event.test.passed, test)
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

    if (isAsyncFunction(testFn)) {
      event.emit(event.test.started, test)
      testFn
        .call(test, getInjectedArguments(testFn, test))
        .then(() => {
          recorder.add('fire test.passed', () => {
            event.emit(event.test.passed, test)
            event.emit(event.test.finished, test)
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
      event.emit(event.test.started, test)
      testFn.call(test, getInjectedArguments(testFn, test))
    } catch (err) {
      recorder.throw(err)
    } finally {
      recorder.add('fire test.passed', () => {
        event.emit(event.test.passed, test)
        event.emit(event.test.finished, test)
      })
      recorder.add('finish test', doneFn)
      recorder.catch()
    }
  }
  return test
}

/**
 * Injects arguments to function from controller
 */
module.exports.injected = function (fn, suite, hookName) {
  return function (done) {
    const doneFn = makeDoneCallableOnce(done)
    const errHandler = err => {
      recorder.session.start('teardown')
      recorder.cleanAsyncErr()
      if (hookName == 'before' || hookName == 'beforeSuite') suiteTestFailedHookError(suite, err, hookName)
      if (hookName === 'after') event.emit(event.test.after, suite)
      if (hookName === 'afterSuite') event.emit(event.suite.after, suite)
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

    promiseRetry(
      async (retry, number) => {
        try {
          recorder.startUnlessRunning()
          await fn.call(this, getInjectedArguments(fn))
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
module.exports.setup = function (suite) {
  return injectHook(() => {
    recorder.startUnlessRunning()
    event.emit(event.test.before, suite && suite.ctx && suite.ctx.currentTest)
  }, suite)
}

module.exports.teardown = function (suite) {
  return injectHook(() => {
    recorder.startUnlessRunning()
    event.emit(event.test.after, suite && suite.ctx && suite.ctx.currentTest)
  }, suite)
}

module.exports.suiteSetup = function (suite) {
  return injectHook(() => {
    recorder.startUnlessRunning()
    event.emit(event.suite.before, suite)
  }, suite)
}

module.exports.suiteTeardown = function (suite) {
  return injectHook(() => {
    recorder.startUnlessRunning()
    event.emit(event.suite.after, suite)
  }, suite)
}

module.exports.getInjectedArguments = getInjectedArguments
