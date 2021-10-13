const event = require('../event');

const defaultConfig = {
  timeout: 150,
  noTimeoutSteps: [
    'amOnPage',
    'wait*',
  ],
  customTimeoutSteps: [],
};

/**
 * Set timeout for test steps globally.
 *
 * Add this plugin to config file:
 *
 * ```js
 * plugins: {
 *     stepTimeout: {
 *        enabled: true
 *     }
 * }
 * ```
 *
 *
 * Run tests with plugin enabled:
 *
 * ```
 * npx codeceptjs run --plugins stepTimeout
 * ```
 *
 * #### Configuration:
 *
 * * `timeout` - global step timeout, default 150, seconds
 * * `noTimeoutSteps` - an array of with no timeout. Default:
 *     * `amOnPage`
 *     * `wait*`
 * * `customTimeoutSteps` - an array with custom timeout settings. Use it to override or extend noTimeoutSteps.
 * You can use step names or step prefixes ending with `*`. As such, `wait*` will match all steps starting with `wait`.
 * You could set your own noTimeoutSteps instead of default one.
 *
 * #### Example
 *
 * ```js
 * plugins: {
 *     stepTimeout: {
 *         enabled: true,
 *         noTimeoutSteps: [
 *           'scroll*', // ignore all scroll steps
 *           /Cookie/, // ignore all steps with a Cookie in it (by regexp)
 *         ],
 *         customTimeoutSteps: [
 *           ['myFlakyStep*', 1],
 *           ['scrollWhichRequiresTimeout', 5],
 *         ]
 *     }
 * }
 * ```
 *
 */
module.exports = (config) => {
  config = Object.assign(defaultConfig, config);
  // below override rule makes sure customTimeoutSteps go first but then they override noTimeoutSteps in case of exact pattern match
  config.customTimeoutSteps = config.customTimeoutSteps.concat(config.noTimeoutSteps).concat(config.customTimeoutSteps);

  event.dispatcher.on(event.step.before, (step) => {
    const { I } = inject();
    let stepTimeout;
    for (let stepRule of config.customTimeoutSteps) {
      let customTimeout = 0;
      if (Array.isArray(stepRule)) {
        if (stepRule.length > 1) customTimeout = stepRule[1];
        stepRule = stepRule[0];
      }
      if (stepRule instanceof RegExp
        ? step.name.match(stepRule)
        : (step.name === stepRule || stepRule.indexOf('*') && step.name.startsWith(stepRule.slice(0, -1)))
      ) {
        stepTimeout = customTimeout;
        break;
      }
    }
    stepTimeout = stepTimeout === undefined ? config.timeout : stepTimeout;
    I.limitTime(stepTimeout);
  });
};
