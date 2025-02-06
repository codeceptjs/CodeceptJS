const recorder = require('./recorder')
const { debug } = require('./output')
const store = require('./store')
const event = require('./event')
const within = require('./within')

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
async function hopeThat(callback) {
  if (store.dryRun) return
  const sessionName = 'hopeThat'

  let result = false
  return recorder.add(
    'hopeThat',
    () => {
      recorder.session.start(sessionName)
      store.hopeThat = true
      callback()
      recorder.add(() => {
        result = true
        recorder.session.restore(sessionName)
        return result
      })
      recorder.session.catch(err => {
        result = false
        const msg = err.inspect ? err.inspect() : err.toString()
        debug(`Unsuccessful assertion > ${msg}`)
        event.dispatcher.once(event.test.finished, test => {
          test.notes.push({ type: 'conditionalError', text: msg })
        })
        recorder.session.restore(sessionName)
        return result
      })
      return recorder.add(
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
 * const { hopeThat } = require('codeceptjs/effects')
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
      recorder.throw(err)
      reject(err)
    }

    const tryBlock = async () => {
      tries++
      recorder.session.start(`${sessionName} ${tries}`)
      try {
        await callback(tries)
      } catch (err) {
        handleRetryException(err)
      }

      // Call done if no errors
      recorder.add(() => {
        recorder.session.restore(`${sessionName} ${tries}`)
        done(null)
      })

      // Catch errors and retry
      recorder.session.catch(err => {
        recorder.session.restore(`${sessionName} ${tries}`)
        if (tries <= maxTries) {
          debug(`Error ${err}... Retrying`)
          recorder.add(`${sessionName} ${tries}`, () => setTimeout(tryBlock, pollInterval))
        } else {
          // if maxTries reached
          handleRetryException(err)
        }
      })
    }

    recorder.add(sessionName, tryBlock).catch(err => {
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
  return recorder.add(
    sessionName,
    () => {
      recorder.session.start(sessionName)
      isAutoRetriesEnabled = store.autoRetries
      if (isAutoRetriesEnabled) debug('Auto retries disabled inside tryTo effect')
      store.autoRetries = false
      callback()
      recorder.add(() => {
        result = true
        recorder.session.restore(sessionName)
        return result
      })
      recorder.session.catch(err => {
        result = false
        const msg = err.inspect ? err.inspect() : err.toString()
        debug(`Unsuccessful try > ${msg}`)
        recorder.session.restore(sessionName)
        return result
      })
      return recorder.add(
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

module.exports = {
  hopeThat,
  retryTo,
  tryTo,
  within,
}
