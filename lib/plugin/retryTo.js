const recorder = require('../recorder')
const { debug } = require('../output')

const defaultConfig = {
  registerGlobal: true,
  pollInterval: 200,
}

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
  config = Object.assign(defaultConfig, config)
  function retryTo(callback, maxTries, pollInterval = config.pollInterval) {
    return new Promise((done, reject) => {
      let tries = 1

      function handleRetryException(err) {
        recorder.throw(err)
        reject(err)
      }

      const tryBlock = async () => {
        tries++
        recorder.session.start(`retryTo ${tries}`)
        try {
          await callback(tries)
        } catch (err) {
          handleRetryException(err)
        }

        // Call done if no errors
        recorder.add(() => {
          recorder.session.restore(`retryTo ${tries}`)
          done(null)
        })

        // Catch errors and retry
        recorder.session.catch((err) => {
          recorder.session.restore(`retryTo ${tries}`)
          if (tries <= maxTries) {
            debug(`Error ${err}... Retrying`)
            recorder.add(`retryTo ${tries}`, () => setTimeout(tryBlock, pollInterval))
          } else {
            // if maxTries reached
            handleRetryException(err)
          }
        })
      }

      recorder.add('retryTo', tryBlock).catch((err) => {
        console.error('An error occurred:', err)
        done(null)
      })
    })
  }

  if (config.registerGlobal) {
    global.retryTo = retryTo
  }

  return retryTo
}
