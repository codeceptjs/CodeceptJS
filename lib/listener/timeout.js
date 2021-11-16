const event = require('../event');
const output = require('../output');
const recorder = require('../recorder');
const Config = require('../config');
const { timeouts } = require('../store');
const TIMEOUT_ORDER = require('../step').TIMEOUT_ORDER;

module.exports = function () {
  let timeout;
  let timeoutStack = [];
  let currentTest;
  let currentTimeout;

  if (!timeouts) {
    console.log('Timeouts were disabled');
    return;
  }

  event.dispatcher.on(event.suite.before, (suite) => {
    timeoutStack = [];
    const globalTimeout = Config.get('timeout');
    if (globalTimeout) {
      if (globalTimeout >= 1000) {
        console.log(`Warning: Timeout was set to ${globalTimeout}secs.\nGlobal timeout should be specified in seconds.`);
      }
      timeoutStack.push(globalTimeout);
    }
    if (suite.totalTimeout) timeoutStack.push(suite.totalTimeout);
    output.log(`Timeouts: ${timeoutStack}`);
  });

  event.dispatcher.on(event.test.before, (test) => {
    currentTest = test;
    timeout = test.totalTimeout || timeoutStack[timeoutStack.length - 1];
    if (!timeout) return;
    currentTimeout = timeout;
    output.debug(`Test Timeout: ${timeout}s`);
    timeout *= 1000;
  });

  event.dispatcher.on(event.test.passed, (test) => {
    currentTest = null;
  });

  event.dispatcher.on(event.test.failed, (test) => {
    currentTest = null;
  });

  event.dispatcher.on(event.step.before, (step) => {
    if (typeof timeout !== 'number') return;

    if (timeout < 0) {
      step.setTimeout(0.01, TIMEOUT_ORDER.testOrSuite);
    } else {
      step.setTimeout(timeout, TIMEOUT_ORDER.testOrSuite);
    }
  });

  event.dispatcher.on(event.step.finished, (step) => {
    if (typeof timeout === 'number' && !Number.isNaN(timeout)) timeout -= step.duration;

    if (typeof timeout === 'number' && timeout <= 0 && recorder.isRunning()) {
      if (currentTest && currentTest.callback) {
        recorder.reset();
        // replace mocha timeout with custom timeout
        currentTest.timeout(0);
        currentTest.callback(new Error(`Timeout ${currentTimeout}s exceeded (with Before hook)`));
        currentTest.timedOut = true;
      }
    }
  });
};
