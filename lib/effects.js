const recorder = require('./recorder')
const { debug } = require('./output')
const store = require('./store')

/**
 * @module hopeThat
 *
 * `hopeThat` is a utility function for CodeceptJS tests that allows for soft assertions.
 * It enables conditional assertions without terminating the test upon failure.
 * This is particularly useful in scenarios like A/B testing, handling unexpected elements,
 * or performing multiple assertions where you want to collect all results before deciding
 * on the test outcome.
 *
 * ## Use Cases
 *
 * - **Multiple Conditional Assertions**: Perform several assertions and evaluate all their outcomes together.
 * - **A/B Testing**: Handle different variants in A/B tests without failing the entire test upon one variant's failure.
 * - **Unexpected Elements**: Manage elements that may or may not appear, such as "Accept Cookie" banners.
 *
 * ## Examples
 *
 * ### Multiple Conditional Assertions
 *
 * Add the assertion library:
 * ```js
 * const assert = require('assert');
 * const { hopeThat } = require('codeceptjs/effects');
 * ```
 *
 * Use `hopeThat` with assertions:
 * ```js
 * const result1 = await hopeThat(() => I.see('Hello, user'));
 * const result2 = await hopeThat(() => I.seeElement('.welcome'));
 * assert.ok(result1 && result2, 'Assertions were not successful');
 * ```
 *
 * ### Optional Click
 *
 * ```js
 * const { hopeThat } = require('codeceptjs/effects');
 *
 * I.amOnPage('/');
 * await hopeThat(() => I.click('Agree', '.cookies'));
 * ```
 *
 * Performs a soft assertion within CodeceptJS tests.
 *
 * This function records the execution of a callback containing assertion logic.
 * If the assertion fails, it logs the failure without stopping the test execution.
 * It is useful for scenarios where multiple assertions are performed, and you want
 * to evaluate all outcomes before deciding on the test result.
 *
 * ## Usage
 *
 * ```js
 * const result = await hopeThat(() => I.see('Welcome'));
 *
 * // If the text "Welcome" is on the page, result => true
 * // If the text "Welcome" is not on the page, result => false
 * ```
 *
 * @async
 * @function hopeThat
 * @param {Function} callback - The callback function containing the soft assertion logic.
 * @returns {Promise<boolean | any>} - Resolves to `true` if the assertion is successful, or `false` if it fails.
 *
 * @example
 * // Multiple Conditional Assertions
 * const assert = require('assert');
 * const { hopeThat } = require('codeceptjs/effects');
 *
 * const result1 = await hopeThat(() => I.see('Hello, user'));
 * const result2 = await hopeThat(() => I.seeElement('.welcome'));
 * assert.ok(result1 && result2, 'Assertions were not successful');
 *
 * @example
 * // Optional Click
 * const { hopeThat } = require('codeceptjs/effects');
 *
 * I.amOnPage('/');
 * await hopeThat(() => I.click('Agree', '.cookies'));
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
 *
 * @module retryTo
 *
 * `retryTo` which retries steps a few times before failing.
 *
 *
 * Use it in your tests:
 *
 * const { retryTo } = require('codeceptjs/effects');
 * ```js
 * // retry these steps 5 times before failing
 * await retryTo((tryNum) => {
 *   I.switchTo('#editor frame');
 *   I.click('Open');
 *   I.see('Opened')
 * }, 5);
 * ```
 * Set polling interval as 3rd argument (200ms by default):
 *
 * ```js
 * // retry these steps 5 times before failing
 * await retryTo((tryNum) => {
 *   I.switchTo('#editor frame');
 *   I.click('Open');
 *   I.see('Opened')
 * }, 5, 100);
 * ```
 *
 * Disables retryFailedStep plugin for steps inside a block;
 *
 * Use this plugin if:
 *
 * * you need repeat a set of actions in flaky tests
 * * iframe was not rendered, so you need to retry switching to it
 *
 *
 * #### Configuration
 *
 * * `pollInterval` - default interval between retries in ms. 200 by default.
 *
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
 * @module tryTo
 *
 * `tryTo` which all failed steps won't fail a test but will return true/false.
 * It enables conditional assertions without terminating the test upon failure.
 * This is particularly useful in scenarios like A/B testing, handling unexpected elements,
 * or performing multiple assertions where you want to collect all results before deciding
 * on the test outcome.
 *
 * ## Use Cases
 *
 * - **Multiple Conditional Assertions**: Perform several assertions and evaluate all their outcomes together.
 * - **A/B Testing**: Handle different variants in A/B tests without failing the entire test upon one variant's failure.
 * - **Unexpected Elements**: Manage elements that may or may not appear, such as "Accept Cookie" banners.
 *
 * ## Examples
 *
 * ### Multiple Conditional Assertions
 *
 * Add the assertion library:
 * ```js
 * const assert = require('assert');
 * const { tryTo } = require('codeceptjs/effects');
 * ```
 *
 * Use `hopeThat` with assertions:
 * ```js
 * const result1 = await tryTo(() => I.see('Hello, user'));
 * const result2 = await tryTo(() => I.seeElement('.welcome'));
 * assert.ok(result1 && result2, 'Assertions were not successful');
 * ```
 *
 * ### Optional Click
 *
 * ```js
 * const { tryTo } = require('codeceptjs/effects');
 *
 * I.amOnPage('/');
 * await tryTo(() => I.click('Agree', '.cookies'));
 * ```
 *
 * This function records the execution of a callback containing assertion logic.
 * If the assertion fails, it logs the failure without stopping the test execution.
 * It is useful for scenarios where multiple assertions are performed, and you want
 * to evaluate all outcomes before deciding on the test result.
 *
 * ## Usage
 *
 * ```js
 * const result = await tryTo(() => I.see('Welcome'));
 *
 * // If the text "Welcome" is on the page, result => true
 * // If the text "Welcome" is not on the page, result => false
 * ```
 *
 * @async
 * @function tryTo
 * @param {Function} callback - The callback function.
 * @returns {Promise<boolean | any>} - Resolves to `true` if the assertion is successful, or `false` if it fails.
 *
 * @example
 * // Multiple Conditional Assertions
 * const assert = require('assert');
 * const { tryTo } = require('codeceptjs/effects');
 *
 * const result1 = await tryTo(() => I.see('Hello, user'));
 * const result2 = await tryTo(() => I.seeElement('.welcome'));
 * assert.ok(result1 && result2, 'Assertions were not successful');
 *
 * @example
 * // Optional Click
 * const { tryTo } = require('codeceptjs/effects');
 *
 * I.amOnPage('/');
 * await tryTo(() => I.click('Agree', '.cookies'));
 */
async function tryTo(callback) {
  if (store.dryRun) return
  const sessionName = 'tryTo'

  let result = false
  return recorder.add(
    sessionName,
    () => {
      recorder.session.start(sessionName)
      store.tryTo = true
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
          store.tryTo = undefined
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
}
