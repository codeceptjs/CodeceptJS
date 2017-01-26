'use strict';

let event = require('../event');

let failed = false;

let failedTests = [];

event.dispatcher.on(event.test.failed, function (test) {
  failedTests.push(test.fullTitle());
});

// if test was successful after retries
event.dispatcher.on(event.test.passed, function (test) {
  failedTests = failedTests.filter((failed) => test.fullTitle() !== failed);
});

event.dispatcher.on(event.all.result, function () {
  if (failedTests.length) process.exit(1);
});
