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
 * npx codeceptjs run --plugins retryFailedStep
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
 * ### Disable Per Test
 *
 * This plugin can be disabled per test. In this case you will need to stet `I.retry()` to all flaky steps:
 *
 * Use scenario configuration to disable plugin for a test
 *
 * ```js
 * Scenario('scenario tite', () => {
 *    // test goes here
 * }).config(test => test.disableRetryFailedStep = true)
 * ```
 *
 */
module.exports = (config) => {
  config = Object.assign(defaultConfig, config);
  const customWhen = config.when;

  let enableRetry = false;

  const when = (err) => {
    if (!enableRetry) return;
    const store = require('../store');
    if (store.debugMode) return false;
    if (customWhen) return customWhen(err);
    return true;
  };
  config.when = when;

  event.dispatcher.on(event.step.started, (step) => {
    if (step.name.startsWith('wait')) return;
    enableRetry = true; // enable retry for a step
  });

  event.dispatcher.on(event.step.finished, (step) => {
    enableRetry = false;
  });

  event.dispatcher.on(event.test.before, (test) => {
    if (test.disableRetryFailedStep) return; // disable retry when a test is not active
    recorder.retry(config);
  });
};
