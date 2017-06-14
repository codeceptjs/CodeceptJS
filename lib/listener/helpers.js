'use strict';

const event = require('../event');
const container = require('../container');
const recorder = require('../recorder');
const error = require('../output').error;

/**
 * Enable Helpers to listen to test events
 */
module.exports = function () {
  let helpers = container.helpers();

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

  event.dispatcher.on(event.all.before, function () {
    runHelpersHook('_init');
  });

  event.dispatcher.on(event.suite.before, function (suite) {
    runAsyncHelpersHook('_beforeSuite', suite, true);
  });

  event.dispatcher.on(event.suite.after, function (suite) {
    runAsyncHelpersHook('_afterSuite', suite, true);
  });

  event.dispatcher.on(event.test.started, function (test) {
    runHelpersHook('_test', test);
    recorder.catch((e) => error(e));
  });

  event.dispatcher.on(event.test.before, function () {
    runAsyncHelpersHook('_before');
  });

  event.dispatcher.on(event.test.failed, function (test) {
    runAsyncHelpersHook('_failed', test, true);
    // should not fail test execution, so errors should be catched
    recorder.catch((e) => error(e));
  });

  event.dispatcher.on(event.test.after, function () {
    runAsyncHelpersHook('_after', {}, true);
  });

  event.dispatcher.on(event.step.before, function (step) {
    runAsyncHelpersHook('_beforeStep', step);
  });

  event.dispatcher.on(event.step.after, function (step) {
    runAsyncHelpersHook('_afterStep', step);
  });
};
