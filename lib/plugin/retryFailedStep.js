const event = require('../event');
const recorder = require('../recorder');

const defaultConfig = {
  retries: 5,
};

/**
 * Retries each failed step in a test.
 *
 * Add this plugin to config file:
 *
 * ```js
 * plugins: {
 *     retryFailedStep: {
 *        enabled: true
 *     }
 * }
 * ```
 *
 *
 * Run tests with plugin enabled:
 *
 * ```
 * codeceptjs run --plugins retryFailedStep
 * ```
 *
 * ##### Configuration:
 *
 * * `retries` - number of retries (by default 5),
 * * `when` - function, when to perform a retry (accepts error as parameter)
 * * `factor` - The exponential factor to use. Default is 2.
 * * `minTimeout` - The number of milliseconds before starting the first retry. Default is 1000.
 * * `maxTimeout` - The maximum number of milliseconds between two retries. Default is Infinity.
 * * `randomize` - Randomizes the timeouts by multiplying with a factor between 1 to 2. Default is false.
 *
 * This plugin is very basic so it's recommended to improve it to match your custom needs.
 *
 */
module.exports = (config) => {
  config = Object.assign(defaultConfig, config);
  const customWhen = config.when;

  const when = (err) => {
    const store = require('../store');
    if (store.debugMode) return false;
    if (customWhen) return customWhen(err);
    return true;
  };
  config.when = when;

  event.dispatcher.on(event.test.before, (test) => {
    recorder.retry(config);
  });
};
