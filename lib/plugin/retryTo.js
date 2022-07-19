const recorder = require('../recorder');
const store = require('../store');
const { debug } = require('../output');

const defaultConfig = {
  registerGlobal: true,
  pollInterval: 200,
};

/**
 *
 *
 * Adds global `retryTo` which retries steps a few times before failing.
 *
 * Enable this plugin in `codecept.conf.js` (enabled by default for new setups):
 *
 * ```js
 * plugins: {
 *   retryTo: {
 *     enabled: true
 *   }
 * }
 * ```
 *
 * Use it in your tests:
 *
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
 * Default polling interval can be changed in a config:
 *
 * ```js
 * plugins: {
 *   retryTo: {
 *     enabled: true,
 *     pollInterval: 500,
 *   }
 * }
 * ```
 *
 * Disables retryFailedStep plugin for steps inside a block;
 *
 * Use this plugin if:
 *
 * * you need repeat a set of actions in flaky tests
 * * iframe was not rendered and you need to retry switching to it
 *
 *
 * #### Configuration
 *
 * * `pollInterval` - default interval between retries in ms. 200 by default.
 * * `registerGlobal` - to register `retryTo` function globally, true by default
 *
 * If `registerGlobal` is false you can use retryTo from the plugin:
 *
 * ```js
 * const retryTo = codeceptjs.container.plugins('retryTo');
 * ```
 *
*/
module.exports = function (config) {
  config = Object.assign(defaultConfig, config);

  if (config.registerGlobal) {
    global.retryTo = retryTo;
  }
  return retryTo;

  function retryTo(callback, maxTries, pollInterval = undefined) {
    const mode = store.debugMode;
    let tries = 1;
    if (!pollInterval) pollInterval = config.pollInterval;

    let err = null;

    return new Promise((done) => {
      const tryBlock = () => {
        recorder.session.start(`retryTo ${tries}`);
        callback(tries);
        recorder.add(() => {
          recorder.session.restore(`retryTo ${tries}`);
          done(null);
        });
        recorder.session.catch((e) => {
          err = e;
          recorder.session.restore(`retryTo ${tries}`);
          tries++;
          if (tries <= maxTries) {
            debug(`Error ${err}... Retrying`);
            err = null;

            recorder.add(`retryTo ${tries}`, () => setTimeout(tryBlock, pollInterval));
          } else {
            done(null);
          }
        });
      };

      recorder.add('retryTo', async () => {
        store.debugMode = true;
        tryBlock();
      });
    }).then(() => {
      if (err) recorder.throw(err);
    });
  }
};
