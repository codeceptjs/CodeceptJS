const tty = require('tty');

if (!tty.getWindowSize) {
  // this is really old method, long removed from Node, but Mocha
  // reporters fall back on it if they cannot use `process.stdout.getWindowSize`
  // we need to polyfill it.
  tty.getWindowSize = () => [40, 80];
}

const { parentPort, workerData } = require('worker_threads');
const event = require('../../event');
const container = require('../../container');
const { getConfig } = require('../utils');
const { tryOrDefault, deepMerge } = require('../../utils');

// eslint-disable-next-line no-unused-vars
let stdout = '';
/* eslint-enable no-unused-vars */
const stderr = '';

// Requiring of Codecept need to be after tty.getWindowSize is available.
const Codecept = require(process.env.CODECEPT_CLASS_PATH || '../../codecept');

const {
  options, tests, testRoot, workerIndex,
} = workerData;

// hide worker output
if (!options.debug && !options.verbose) process.stdout.write = (string) => { stdout += string; return true; };

const overrideConfigs = tryOrDefault(() => JSON.parse(options.override), {});

// important deep merge so dynamic things e.g. functions on config are not overridden
const config = deepMerge(getConfig(options.config || testRoot), overrideConfigs);

// Load test and run
const codecept = new Codecept(config, options);
codecept.init(testRoot);
codecept.loadTests();
const mocha = container.mocha();
filterTests();

(async function () {
  if (mocha.suite.total()) {
    await runTests();
  }
}());

async function runTests() {
  try {
    await codecept.bootstrap();
  } catch (err) {
    throw new Error(`Error while running bootstrap file :${err}`);
  }
  listenToParentThread();
  initializeListeners();
  disablePause();
  try {
    await codecept.run();
  } finally {
    await codecept.teardown();
  }
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
    test = { ...test };

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
      test.status = 'failed';
    }
    const parent = {};
    if (test.parent) {
      parent.title = test.parent.title;
    }

    return {
      id: test.id,
      workerIndex,
      retries: test._retries,
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
  // we should force-send correct errors to prevent race condition
  event.dispatcher.on(event.test.finished, (test, err) => sendToParentThread({ event: event.test.finished, workerIndex, data: simplifyTest(test, err) }));
  event.dispatcher.on(event.test.failed, (test, err) => sendToParentThread({ event: event.test.failed, workerIndex, data: simplifyTest(test, err) }));
  event.dispatcher.on(event.test.passed, (test, err) => sendToParentThread({ event: event.test.passed, workerIndex, data: simplifyTest(test, err) }));
  event.dispatcher.on(event.test.started, test => sendToParentThread({ event: event.test.started, workerIndex, data: simplifyTest(test) }));
  event.dispatcher.on(event.test.skipped, test => sendToParentThread({ event: event.test.skipped, workerIndex, data: simplifyTest(test) }));

  event.dispatcher.on(event.hook.failed, (test, err) => sendToParentThread({ event: event.hook.failed, workerIndex, data: simplifyTest(test, err) }));
  event.dispatcher.on(event.hook.passed, (test, err) => sendToParentThread({ event: event.hook.passed, workerIndex, data: simplifyTest(test, err) }));
  event.dispatcher.on(event.all.failures, (data) => sendToParentThread({ event: event.all.failures, workerIndex, data }));

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
    skipped: 0,
    tests: 0,
    pending: 0,
  };
  event.dispatcher.on(event.test.skipped, () => {
    stats.skipped++;
  });
  event.dispatcher.on(event.test.passed, () => {
    stats.passes++;
  });
  event.dispatcher.on(event.test.failed, () => {
    stats.failures++;
  });
  event.dispatcher.on(event.test.skipped, () => {
    stats.pending++;
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

function listenToParentThread() {
  parentPort.on('message', (eventData) => {
    container.append({ support: eventData.data });
  });
}
