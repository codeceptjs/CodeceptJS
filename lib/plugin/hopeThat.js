const recorder = require('../recorder')
const { debug } = require('../output')

const defaultConfig = {
  registerGlobal: true,
}

/**
 * Adds a global `hopeThat` function for soft assertions.
 *
 * Steps executed inside `hopeThat` will not fail the test when they fail;
 * instead, they will return `true` or `false`.
 *
 * Enable this plugin in `codecept.conf.js`:
 *
 * ```js
 * plugins: {
 *   hopeThat: {
 *     enabled: true
 *   }
 * }
 * ```
 *
 * ### Usage
 *
 * Use `hopeThat` in your tests for conditional assertions:
 *
 * ```js
 * const result = await hopeThat(() => I.see('Welcome'));
 *
 * // If the text "Welcome" is on the page, result => true
 * // If the text "Welcome" is not on the page, result => false
 * ```
 *
 * This utility disables the `retryFailedStep` plugin for steps inside its block.
 *
 * #### Use Cases
 *
 * - Perform multiple conditional assertions in a test.
 * - Handle scenarios with A/B testing on a website.
 * - Handle unexpected elements, such as "Accept Cookie" banners.
 *
 * #### Examples
 *
 * ##### Multiple Conditional Assertions
 *
 * Add the assertion library:
 * ```js
 * const assert = require('assert');
 * ```
 *
 * Use `hopeThat` with assertions:
 * ```js
 * const result1 = await hopeThat(() => I.see('Hello, user'));
 * const result2 = await hopeThat(() => I.seeElement('.welcome'));
 * assert.ok(result1 && result2, 'Assertions were not successful');
 * ```
 *
 * ##### Optional Click
 *
 * ```js
 * I.amOnPage('/');
 * hopeThat(() => I.click('Agree', '.cookies'));
 * ```
 *
 * ### Configuration
 *
 * - `registerGlobal` (boolean, default: `true`) — Registers `hopeThat` globally.
 *
 * If `registerGlobal` is `false`, use `hopeThat` via the plugin:
 *
 * ```js
 * const hopeThat = codeceptjs.container.plugins('hopeThat');
 * ```
 *
 * @param {Object} config - Configuration object.
 * @param {boolean} [config.registerGlobal=true] - Whether to register `hopeThat` globally.
 * @returns {Function} hopeThat - The soft assertion function.
 */
module.exports = function (config) {
  config = Object.assign(defaultConfig, config)

  if (config.registerGlobal) {
    global.hopeThat = hopeThat
  }
  return hopeThat
}

function hopeThat(callback) {
  let result = false
  return recorder.add(
    'hopeThat',
    () => {
      recorder.session.start('hopeThat')
      process.env.HOPE_THAT = 'true'
      callback()
      recorder.add(() => {
        result = true
        recorder.session.restore('hopeThat')
        return result
      })
      recorder.session.catch(err => {
        result = false
        const msg = err.inspect ? err.inspect() : err.toString()
        debug(`Unsuccessful assertion > ${msg}`)
        recorder.session.restore('hopeThat')
        return result
      })
      return recorder.add(
        'result',
        () => {
          process.env.HOPE_THAT = undefined
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
