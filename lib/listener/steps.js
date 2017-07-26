'use strict';
const event = require('../event');
const recorder = require('../recorder');
const output = require('../output');

let currentTest;
let steps;

/**
 * Register steps inside tests
 */
module.exports = function () {

  event.dispatcher.on(event.test.started, function (test) {
    currentTest = test;
    currentTest.steps = [];
    if (!('retryNum' in currentTest)) currentTest.retryNum = 0
    else currentTest.retryNum = currentTest.retryNum + 1
  });

  event.dispatcher.on(event.test.after, function () {
    currentTest = null;
  });

  event.dispatcher.on(event.test.failed, function (test) {
    if (!currentTest) return;
    // last step is failing step
    if (!currentTest.steps.length) return;
    let failureIndex = currentTest.steps.findIndex((el) => {
      return el.status === 'failed';
    });
    //To be sure that failed test will be failed in report
    currentTest.state = 'failed'
    currentTest.steps.length = failureIndex + 1;
  });

  event.dispatcher.on(event.test.passed, function (test) {
    //To be sure that passed test will be passed in report
    delete currentTest.err;
    currentTest.state = 'passed'
  });

  event.dispatcher.on(event.step.before, function (step) {
    if (!currentTest || !currentTest.steps) return;
    currentTest.steps.push(step);
  });
};

