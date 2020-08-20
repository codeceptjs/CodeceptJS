const Container = require('../container');
const store = require('../store');
const recorder = require('../recorder');
const event = require('../event');
const log = require('../output').log;
const supportedHelpers = require('./standardActingHelpers');

const methodsToDelay = [
  'click',
  'fillField',
  'checkOption',
  'pressKey',
  'doubleClick',
  'rightClick',
];

const defaultConfig = {
  methods: methodsToDelay,
  delayBefore: 100,
  delayAfter: 200,
};

/**
 *
 * Sometimes it takes some time for a page to respond to user's actions.
 * Depending on app's performance this can be either slow or fast.
 *
 * For instance, if you click a button and nothing happens - probably JS event is not attached to this button yet
 * Also, if you fill field and input validation doesn't accept your input - maybe because you typed value too fast.
 *
 * This plugin allows to slow down tests execution when a test running too fast.
 * It puts a tiny delay for before and after action commands.
 *
 * Commands affected (by default):
 *
 * * `click`
 * * `fillField`
 * * `checkOption`
 * * `pressKey`
 * * `doubleClick`
 * * `rightClick`
 *
 *
 * #### Configuration
 *
 * ```js
 * plugins: {
 *    autoDelay: {
 *      enabled: true
 *    }
 * }
 * ```
 *
 * Possible config options:
 *
 * * `methods`: list of affected commands. Can be overridden
 * * `delayBefore`: put a delay before a command. 100ms by default
 * * `delayAfter`: put a delay after a command. 200ms by default
 *
 */
module.exports = function (config) {
  supportedHelpers.push('REST');
  const helpers = Container.helpers();
  let helper;

  config = Object.assign(defaultConfig, config);

  for (const helperName of supportedHelpers) {
    if (Object.keys(helpers).indexOf(helperName) > -1) {
      helper = helpers[helperName];
    }
  }

  if (!helper) return; // no helpers for auto-delay

  event.dispatcher.on(event.step.before, (step) => {
    if (config.methods.indexOf(step.helperMethod) < 0) return; // skip non-actions

    recorder.add('auto-delay', async () => {
      if (store.debugMode) return; // no need to delay in debug
      log(`Delaying for ${config.delayBefore}ms`);
      return new Promise((resolve) => {
        setTimeout(resolve, config.delayBefore);
      });
    });
  });

  event.dispatcher.on(event.step.after, (step) => {
    if (config.methods.indexOf(step.helperMethod) < 0) return; // skip non-actions

    recorder.add('auto-delay', async () => {
      if (store.debugMode) return; // no need to delay in debug
      log(`Delaying for ${config.delayAfter}ms`);
      return new Promise((resolve) => {
        setTimeout(resolve, config.delayAfter);
      });
    });
  });
};
