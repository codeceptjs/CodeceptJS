const tty = require('tty');

if (!tty.getWindowSize) {
  // this is really old method, long removed from Node, but Mocha
  // reporters fall back on it if they cannot use `process.stdout.getWindowSize`
  // we need to polyfill it.
  tty.getWindowSize = () => [40, 80];
}

const { parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const path = require('path');
const event = require('../../event');
const output = require('../../output');
const container = require('../../container');
const { getConfig, getTestRoot } = require('../utils');

let stdout = '';
const stderr = '';


// Requiring of Codecept need to be after tty.getWindowSize is available.
const Codecept = require('../../codecept');

const {
  options, tests, testRoot, workerIndex,
} = workerData;

// hide worker output
if (!options.debug && !options.verbose) process.stdout.write = (string, encoding, fd) => { stdout += string; return true; };

const config = getConfig(options.config || testRoot);

// Load test and run
const codecept = new Codecept(config, options);
codecept.init(testRoot);
codecept.loadTests();
const mocha = container.mocha();
filterTests();
if (mocha.suite.total()) {
  codecept.runBootstrap((err) => {
    if (err) throw new Error(`Error while running bootstrap file :${err}`);
    initializeListeners();
    disablePause();
    codecept.run();
  });
}

function filterTests() {
  const files = codecept.testFiles;
  mocha.files = files;
  mocha.loadFiles();

  for (const suite of mocha.suite.suites) {
    suite.tests = suite.tests.filter(test => tests.indexOf(test.id) >= 0);
  }
}

function initializeListeners() {
  function simplifyTest(test, err = null) {
    if (test.start && !test.duration) {
      const end = new Date();
      test.duration = end - test.start;
    }

    if (test.err) {
      err = {
        stack: test.err.stack,
        uncaught: test.err.uncaught,
        message: test.err.message,
        actual: test.err.actual,
        expected: test.err.expected,
      };
    }
    const parent = {};
    if (test.parent) {
      parent.title = test.parent.title;
    }

    return {
      workerIndex,
      title: test.title,
      status: test.status,
      duration: test.duration || 0,
      err,
      parent,
    };
  }

  collectStats();
  // suite
  event.dispatcher.on(event.suite.before, suite => sendToParentThread({ event: event.suite.before, workerIndex, data: simplifyTest(suite) }));
  event.dispatcher.on(event.suite.after, suite => sendToParentThread({ event: event.suite.after, workerIndex, data: simplifyTest(suite) }));

  // calculate duration
  event.dispatcher.on(event.test.started, test => test.start = new Date());

  // tests
  event.dispatcher.on(event.test.before, test => sendToParentThread({ event: event.test.before, workerIndex, data: simplifyTest(test) }));
  event.dispatcher.on(event.test.after, test => sendToParentThread({ event: event.test.after, workerIndex, data: simplifyTest(test) }));
  event.dispatcher.on(event.test.finished, test => sendToParentThread({ event: event.test.finished, workerIndex, data: simplifyTest(test) }));
  event.dispatcher.on(event.test.failed, test => sendToParentThread({ event: event.test.failed, workerIndex, data: simplifyTest(test) }));
  event.dispatcher.on(event.test.passed, test => sendToParentThread({ event: event.test.passed, workerIndex, data: simplifyTest(test) }));
  event.dispatcher.on(event.test.started, test => sendToParentThread({ event: event.test.started, workerIndex, data: simplifyTest(test) }));

  event.dispatcher.on(event.hook.failed, (test, err) => sendToParentThread({ event: event.hook.failed, workerIndex, data: simplifyTest(test, err) }));
  event.dispatcher.on(event.hook.passed, (test, err) => sendToParentThread({ event: event.hook.passed, workerIndex, data: simplifyTest(test, err) }));


  // all
  event.dispatcher.once(event.all.result, () => parentPort.close());
}

function disablePause() {
  global.pause = () => {};
}

function collectStats() {
  const stats = {
    passes: 0,
    failures: 0,
    tests: 0,
  };
  event.dispatcher.on(event.test.passed, () => {
    stats.passes++;
  });
  event.dispatcher.on(event.test.failed, () => {
    stats.failures++;
  });
  event.dispatcher.on(event.test.finished, () => {
    stats.tests++;
  });
  event.dispatcher.once(event.all.after, () => {
    sendToParentThread({ event: event.all.after, data: stats });
  });
}

function sendToParentThread(data) {
  parentPort.postMessage(data);
}
