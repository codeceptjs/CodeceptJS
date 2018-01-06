const event = require('../event');
const container = require('../container');
const recorder = require('../recorder');
const error = require('../output').error;

/**
 * Enable Helpers to listen to test events
 */
module.exports = function () {
  const helpers = container.helpers();

  const runHelpersHook = (hook, param) => {
    Object.keys(helpers).forEach((key) => {
      helpers[key][hook](param);
    });
  };

  const runAsyncHelpersHook = (hook, param, force) => {
    Object.keys(helpers).forEach((key) => {
      if (!helpers[key][hook]) return;
      recorder.add(`hook ${key}.${hook}()`, () => helpers[key][hook](param), force);
    });
  };

  event.dispatcher.on(event.all.before, () => {
    runHelpersHook('_init');
  });

  event.dispatcher.on(event.suite.before, (suite) => {
    runAsyncHelpersHook('_beforeSuite', suite, true);
  });

  event.dispatcher.on(event.suite.after, (suite) => {
    runAsyncHelpersHook('_afterSuite', suite, true);
  });

  event.dispatcher.on(event.test.started, (test) => {
    runHelpersHook('_test', test);
    recorder.catch(e => error(e));
  });

  event.dispatcher.on(event.test.before, () => {
    runAsyncHelpersHook('_before');
  });

  event.dispatcher.on(event.test.failed, (test) => {
    runAsyncHelpersHook('_failed', test, true);
    // should not fail test execution, so errors should be caught
    recorder.catchWithoutStop(e => error(e));
  });

  event.dispatcher.on(event.test.after, () => {
    runAsyncHelpersHook('_after', {}, true);
  });

  event.dispatcher.on(event.step.before, (step) => {
    runAsyncHelpersHook('_beforeStep', step);
  });

  event.dispatcher.on(event.step.after, (step) => {
    runAsyncHelpersHook('_afterStep', step);
  });

  event.dispatcher.on(event.all.result, () => {
    runAsyncHelpersHook('_finishTest', {}, true);
  });
};
