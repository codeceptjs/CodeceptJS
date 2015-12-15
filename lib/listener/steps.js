'use strict';

let event = require('../event');

let currentTest;
let steps;

event.dispatcher.on(event.test.started, function (test) {
  steps = [];
  currentTest = test;
});

event.dispatcher.on(event.test.after, function () {
  if (currentTest) currentTest.steps = steps;
  currentTest = null;
});

event.dispatcher.on(event.step.before, function (step) {
  if (!currentTest || !currentTest.steps) return;
  steps.push(step);
});
