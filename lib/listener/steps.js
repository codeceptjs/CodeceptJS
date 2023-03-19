const debug = require('debug')('codeceptjs:steps');
const event = require('../event');
const store = require('../store');
const output = require('../output');

let currentTest;
let currentHook;

/**
 * Register steps inside tests
 */
module.exports = function () {
  event.dispatcher.on(event.test.before, (test) => {
    test.startedAt = +new Date();
    test.artifacts = {};
  });

  event.dispatcher.on(event.test.started, (test) => {
    currentTest = test;
    currentTest.steps = [];
    if (!('retryNum' in currentTest)) currentTest.retryNum = 0;
    else currentTest.retryNum += 1;
  });

  event.dispatcher.on(event.test.after, (test) => {
    currentTest = null;
  });

  event.dispatcher.on(event.test.finished, (test) => {
  });

  event.dispatcher.on(event.hook.started, (suite) => {
    currentHook = suite.ctx.test;
    currentHook.steps = [];

    if (suite.ctx && suite.ctx.test) output.log(`--- STARTED ${suite.ctx.test.title} ---`);
  });

  event.dispatcher.on(event.hook.passed, (suite) => {
    currentHook = null;
    if (suite.ctx && suite.ctx.test) output.log(`--- ENDED ${suite.ctx.test.title} ---`);
  });

  event.dispatcher.on(event.test.failed, () => {
    const cutSteps = function (current) {
      const failureIndex = current.steps.findIndex(el => el.status === 'failed');
      // To be sure that failed test will be failed in report
      current.state = 'failed';
      current.steps.length = failureIndex + 1;
      return current;
    };
    if (currentHook && Array.isArray(currentHook.steps) && currentHook.steps.length) {
      currentHook = cutSteps(currentHook);
      return currentHook = null;
    }
    if (!currentTest) return;
    // last step is failing step
    if (!currentTest.steps.length) return;
    return currentTest = cutSteps(currentTest);
  });

  event.dispatcher.on(event.test.passed, () => {
    if (!currentTest) return;
    // To be sure that passed test will be passed in report
    delete currentTest.err;
    currentTest.state = 'passed';
  });

  event.dispatcher.on(event.step.started, (step) => {
    if (store.debugMode) return;
    step.startedAt = +new Date();
    step.test = currentTest;
    if (currentHook && Array.isArray(currentHook.steps)) {
      return currentHook.steps.push(step);
    }
    if (!currentTest || !currentTest.steps) return;
    currentTest.steps.push(step);
  });

  event.dispatcher.on(event.step.finished, (step) => {
    if (store.debugMode) return;
    step.finishedAt = +new Date();
    if (step.startedAt) step.duration = step.finishedAt - step.startedAt;
    debug(`Step '${step}' finished; Duration: ${step.duration || 0}ms`);
  });
};
