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

module.exports = {
  hopeThat,
}
