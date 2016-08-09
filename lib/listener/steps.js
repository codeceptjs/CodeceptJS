'use strict';

let event = require('../event');

let currentTest;
let steps;

event.dispatcher.on(event.test.started, function (test) {
  currentTest = test;
  currentTest.steps = [];
});

event.dispatcher.on(event.test.after, function () {
  currentTest = null;
});

event.dispatcher.on(event.test.failed, function (test) {
  if (!currentTest) return;
  // last step is failing step
  if (!currentTest.steps.length) return;
  currentTest.steps.slice(-1)[0].status = 'failed';
});

event.dispatcher.on(event.step.before, function (step) {
  if (!currentTest || !currentTest.steps) return;
  currentTest.steps.push(step);
});
