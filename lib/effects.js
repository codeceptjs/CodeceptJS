import recorder from './recorder.js'
import output from './output.js'
import store from './store.js'
import event from './event.js'
import container from './container.js'
import MetaStep from './step/meta.js'
import { empty } from './assert/empty.js'
import { isAsyncFunction } from './utils.js'

// When a test imports effects through a CommonJS loader (e.g. tsx/cjs), a second,
// disconnected copy of this module and its `recorder`/`container` singletons is loaded.
// That copy's recorder is never started and its container has no helpers, so effects
// would silently do nothing. Resolve the live instances registered on globalThis by the
// runner instead, falling back to the local singletons when running purely under ESM.
const _getRecorder = () => (typeof globalThis !== 'undefined' && globalThis.__codeceptjs_recorder) || recorder
const _getContainer = () => (typeof globalThis !== 'undefined' && globalThis.__codeceptjs_container) || container

/**
 * @param {CodeceptJS.LocatorOrString}  context
 * @param {Function}  fn
 * @return {Promise<*> | undefined}
 */
function within(context, fn) {
  const helpers = store.dryRun ? {} : _getContainer().helpers()
  const locator = typeof context === 'object' ? JSON.stringify(context) : context

  return _getRecorder().add(
    'register within wrapper',
    () => {
      const metaStep = new WithinStep(locator, fn)
      const defineMetaStep = step => (step.metaStep = metaStep)
      _getRecorder().session.start('within')

      event.dispatcher.prependListener(event.step.before, defineMetaStep)

      Object.keys(helpers).forEach(helper => {
        if (helpers[helper]._withinBegin) _getRecorder().add(`[${helper}] start within`, () => helpers[helper]._withinBegin(context))
      })

      const finalize = () => {
        event.dispatcher.removeListener(event.step.before, defineMetaStep)
        _getRecorder().add('Finalize session within session', () => {
          output.stepShift = 1
          _getRecorder().session.restore('within')
        })
      }
      const finishHelpers = () => {
        Object.keys(helpers).forEach(helper => {
          if (helpers[helper]._withinEnd) _getRecorder().add(`[${helper}] finish within`, () => helpers[helper]._withinEnd())
        })
      }

      if (isAsyncFunction(fn)) {
        return fn()
          .then(res => {
            finishHelpers()
            finalize()
            return _getRecorder()
              .promise()
              .then(() => res)
          })
          .catch(e => {
            finalize()
            _getRecorder().throw(e)
          })
      }

      let res
      try {
        res = fn()
      } catch (err) {
        _getRecorder().throw(err)
      } finally {
        finishHelpers()
        _getRecorder().catch(err => {
          output.stepShift = 1
          throw err
        })
      }
      finalize()
      return _getRecorder()
        .promise()
        .then(() => res)
    },
    false,
    false,
  )
}

class WithinStep extends MetaStep {
  constructor(locator, fn) {
    super('Within')
    this.args = [locator]
  }

  toString() {
    return `${this.prefix}Within ${this.humanizeArgs()}${this.suffix}`
  }
}

/**
 * A utility function for CodeceptJS tests that acts as a soft assertion.
 * Executes a callback within a recorded session, ensuring errors are handled gracefully without failing the test immediately.
 *
 * @async
 * @function hopeThat
 * @param {Function} callback - The callback function containing the logic to validate.
 *                              This function should perform the desired assertion or condition check.
 * @returns {Promise<boolean|any>} A promise resolving to `true` if the assertion or condition was successful,
 *                             or `false` if an error occurred.
 *
 * @description
 * - Designed for use in CodeceptJS tests as a "soft assertion."
 *   Unlike standard assertions, it does not stop the test execution on failure.
 * - Starts a new recorder session named 'hopeThat' and manages state restoration.
 * - Logs errors and attaches them as notes to the test, enabling post-test reporting of soft assertion failures.
 * - Resets the `store.hopeThat` flag after the execution, ensuring clean state for subsequent operations.
 *
 * @example
 * const { hopeThat } = require('codeceptjs/effects')
 * await hopeThat(() => {
 *   I.see('Welcome'); // Perform a soft assertion
 * });
 *
 * @throws Will handle errors that occur during the callback execution. Errors are logged and attached as notes to the test.
 */
let hopeThatFailures = []
event.dispatcher.on(event.test.before, () => {
  hopeThatFailures = []
})

async function hopeThat(callback) {
  if (store.dryRun) return
  const sessionName = 'hopeThat'

  let result = false
  return _getRecorder().add(
    'hopeThat',
    () => {
      _getRecorder().session.start(sessionName)
      store.hopeThat = true
      callback()
      _getRecorder().add(() => {
        result = true
        _getRecorder().session.restore(sessionName)
        return result
      })
      _getRecorder().session.catch(err => {
        result = false
        const msg = err.inspect ? err.inspect() : err.toString()
        output.debug(`Unsuccessful assertion > ${msg}`)
        hopeThatFailures.push(msg)
        event.dispatcher.once(event.test.finished, test => {
          if (!test.notes) test.notes = []
          test.notes.push({ type: 'conditionalError', text: msg })
        })
        _getRecorder().session.restore(sessionName)
        return result
      })
      return _getRecorder().add(
        'result',
        () => {
          store.hopeThat = undefined
          return result
        },
        true,
        false,
      )
    },
    false,
    false,
  )
}

/**
 * Asserts that no `hopeThat` soft assertion has failed in the current test.
 * Call once at the end of a scenario to fail it when any soft assertion failed.
 */
hopeThat.noErrors = function () {
  const failures = hopeThatFailures
  hopeThatFailures = []
  empty('soft assertions').assert(failures)
}

/**
 * A CodeceptJS utility function to retry a step or callback multiple times with a specified polling interval.
 *
 * @async
 * @function retryTo
 * @param {Function} callback - The function to execute, which will be retried upon failure.
 *                               Receives the current retry count as an argument.
 * @param {number} maxTries - The maximum number of attempts to retry the callback.
 * @param {number} [pollInterval=200] - The delay (in milliseconds) between retry attempts.
 * @returns {Promise<void|any>} A promise that resolves when the callback executes successfully, or rejects after reaching the maximum retries.
 *
 * @description
 * - This function is designed for use in CodeceptJS tests to handle intermittent or flaky test steps.
 * - Starts a new recorder session for each retry attempt, ensuring proper state management and error handling.
 * - Logs errors and retries the callback until it either succeeds or the maximum number of attempts is reached.
 * - Restores the session state after each attempt, whether successful or not.
 *
 * @example
 * const { retryTo } = require('codeceptjs/effects')
 * await retryTo((tries) => {
 *   if (tries < 3) {
 *     I.see('Non-existent element'); // Simulates a failure
 *   } else {
 *     I.see('Welcome'); // Succeeds on the 3rd attempt
 *   }
 * }, 5, 300); // Retry up to 5 times, with a 300ms interval
 *
 * @throws Will reject with the last error encountered if the maximum retries are exceeded.
 */
async function retryTo(callback, maxTries, pollInterval = 200) {
  const sessionName = 'retryTo'

  return new Promise((done, reject) => {
    let tries = 1

    function handleRetryException(err) {
      _getRecorder().throw(err)
      reject(err)
    }

    const tryBlock = async () => {
      tries++
      _getRecorder().session.start(`${sessionName} ${tries}`)
      try {
        await callback(tries)
      } catch (err) {
        handleRetryException(err)
      }

      // Call done if no errors
      _getRecorder().add(() => {
        _getRecorder().session.restore(`${sessionName} ${tries}`)
        done(null)
      })

      // Catch errors and retry
      _getRecorder().session.catch(err => {
        _getRecorder().session.restore(`${sessionName} ${tries}`)
        if (tries <= maxTries) {
          output.debug(`Error ${err}... Retrying`)
          _getRecorder().add(`${sessionName} ${tries}`, () => setTimeout(tryBlock, pollInterval))
        } else {
          // if maxTries reached
          handleRetryException(err)
        }
      })
    }

    _getRecorder()
      .add(sessionName, tryBlock)
      .catch(err => {
        console.error('An error occurred:', err)
        done(null)
      })
  })
}

/**
 * A CodeceptJS utility function to attempt a step or callback without failing the test.
 * If the step fails, the test continues execution without interruption, and the result is logged.
 *
 * @async
 * @function tryTo
 * @param {Function} callback - The function to execute, which may succeed or fail.
 *                               This function contains the logic to be attempted.
 * @returns {Promise<boolean|any>} A promise resolving to `true` if the step succeeds, or `false` if it fails.
 *
 * @description
 * - Useful for scenarios where certain steps are optional or their failure should not interrupt the test flow.
 * - Starts a new recorder session named 'tryTo' for isolation and error handling.
 * - Captures errors during execution and logs them for debugging purposes.
 * - Ensures the `store.tryTo` flag is reset after execution to maintain a clean state.
 *
 * @example
 * const { tryTo } = require('codeceptjs/effects')
 * const wasSuccessful = await tryTo(() => {
 *   I.see('Welcome'); // Attempt to find an element on the page
 * });
 *
 * if (!wasSuccessful) {
 *   I.say('Optional step failed, but test continues.');
 * }
 *
 * @throws Will handle errors internally, logging them and returning `false` as the result.
 */
async function tryTo(callback) {
  if (store.dryRun) return
  const sessionName = 'tryTo'

  let result = false
  let isAutoRetriesEnabled = store.autoRetries
  return _getRecorder().add(
    sessionName,
    () => {
      _getRecorder().session.start(sessionName)
      isAutoRetriesEnabled = store.autoRetries
      if (isAutoRetriesEnabled) output.debug('Auto retries disabled inside tryTo effect')
      store.autoRetries = false
      callback()
      _getRecorder().add(() => {
        result = true
        _getRecorder().session.restore(sessionName)
        return result
      })
      _getRecorder().session.catch(err => {
        result = false
        const msg = err.inspect ? err.inspect() : err.toString()
        output.debug(`Unsuccessful try > ${msg}`)
        _getRecorder().session.restore(sessionName)
        return result
      })
      return _getRecorder().add(
        'result',
        () => {
          store.autoRetries = isAutoRetriesEnabled
          return result
        },
        true,
        false,
      )
    },
    false,
    false,
  )
}

export { hopeThat, retryTo, tryTo, within }

export default {
  hopeThat,
  retryTo,
  tryTo,
  within,
}
