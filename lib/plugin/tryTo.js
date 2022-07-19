const recorder = require('../recorder');
const store = require('../store');
const { debug } = require('../output');

const defaultConfig = {
  registerGlobal: true,
};

/**
 *
 *
 * Adds global `tryTo` function inside of which all failed steps won't fail a test but will return true/false.
 *
 * Enable this plugin in `codecept.conf.js` (enabled by default for new setups):
 *
 * ```js
 * plugins: {
 *   tryTo: {
 *     enabled: true
 *   }
 * }
 * ```
 * Use it in your tests:
 *
 * ```js
 * const result = await tryTo(() => I.see('Welcome'));
 *
 * // if text "Welcome" is on page, result => true
 * // if text "Welcome" is not on page, result => false
 * ```
 *
 * Disables retryFailedStep plugin for steps inside a block;
 *
 * Use this plugin if:
 *
 * * you need to perform multiple assertions inside a test
 * * there is A/B testing on a website you test
 * * there is "Accept Cookie" banner which may surprisingly appear on a page.
 *
 * #### Usage
 *
 * #### Multiple Conditional Assertions
 *
 * ```js
 *
 * Add assert requires first:
 * ```js
 * const assert = require('assert');
 * ```
 * Then use the assert:
 * const result1 = await tryTo(() => I.see('Hello, user'));
 * const result2 = await tryTo(() => I.seeElement('.welcome'));
 * assert.ok(result1 && result2, 'Assertions were not succesful');
 * ```
 *
 * ##### Optional click
 *
 * ```js
 * I.amOnPage('/');
 * tryTo(() => I.click('Agree', '.cookies'));
 * ```
 *
 * #### Configuration
 *
 * * `registerGlobal` - to register `tryTo` function globally, true by default
 *
 * If `registerGlobal` is false you can use tryTo from the plugin:
 *
 * ```js
 * const tryTo = codeceptjs.container.plugins('tryTo');
 * ```
 *
*/
module.exports = function (config) {
  config = Object.assign(defaultConfig, config);

  if (config.registerGlobal) {
    global.tryTo = tryTo;
  }
  return tryTo;
};

function tryTo(callback) {
  const mode = store.debugMode;
  let result = false;
  return recorder.add('tryTo', () => {
    store.debugMode = true;
    recorder.session.start('tryTo');
    callback();
    recorder.add(() => {
      result = true;
      recorder.session.restore('tryTo');
      return result;
    });
    recorder.session.catch((err) => {
      result = false;
      const msg = err.inspect ? err.inspect() : err.toString();
      debug(`Unsuccessful try > ${msg}`);
      recorder.session.restore('tryTo');
      return result;
    });
    return recorder.add('result', () => {
      store.debugMode = mode;
      return result;
    }, true, false);
  }, false, false);
}
