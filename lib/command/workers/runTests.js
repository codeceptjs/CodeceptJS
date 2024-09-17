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
    suite.tests = suite.tests.filter(test => tests.indexOf(test.uid) >= 0);
  }
}

function initializeListeners() {
  function simplifyError(error) {
    if (error) {
      const {
        stack,
        uncaught,
        message,
        actual,
        expected,
      } = error;

      return {
        stack,
        uncaught,
        message,
        actual,
        expected,
      };
    }

    return null;
  }
  function simplifyTest(test, err = null) {
    test = { ...test };

    if (test.start && !test.duration) {
      const end = new Date();
      test.duration = end - test.start;
    }

    if (test.err) {
      err = simplifyError(test.err);
      test.status = 'failed';
    } else if (err) {
      err = simplifyError(err);
      test.status = 'failed';
    }
    const parent = {};
    if (test.parent) {
      parent.title = test.parent.title;
    }

    if (test.opts) {
      Object.keys(test.opts).forEach(k => {
        if (typeof test.opts[k] === 'object') delete test.opts[k];
        if (typeof test.opts[k] === 'function') delete test.opts[k];
      });
    }

    return {
      opts: test.opts || {},
      tags: test.tags || [],
      uid: test.uid,
      workerIndex,
      retries: test._retries,
      title: test.title,
      status: test.status,
      duration: test.duration || 0,
      err,
      parent,
      steps: test.steps && test.steps.length > 0 ? simplifyStepsInTestObject(test.steps, err) : [],
    };
  }

  function simplifyStepsInTestObject(steps, err) {
    steps = [...steps];
    const _steps = [];

    for (step of steps) {
      const _args = [];

      if (step.args) {
        for (const arg of step.args) {
          // check if arg is a JOI object
          if (arg && arg.$_root) {
            _args.push(JSON.stringify(arg).slice(0, 300));
          // check if arg is a function
          } else if (arg && typeof arg === 'function') {
            _args.push(arg.name);
          } else {
            _args.push(arg);
          }
        }
      }

      _steps.push({
        actor: step.actor,
        name: step.name,
        status: step.status,
        args: JSON.stringify(_args),
        startedAt: step.startedAt,
        startTime: step.startTime,
        endTime: step.endTime,
        finishedAt: step.finishedAt,
        duration: step.duration,
        err,
      });
    }

    return _steps;
  }

  function simplifyStep(step, err = null) {
    step = { ...step };

    if (step.startTime && !step.duration) {
      const end = new Date();
      step.duration = end - step.startTime;
    }

    if (step.err) {
      err = simplifyError(step.err);
      step.status = 'failed';
    } else if (err) {
      err = simplifyError(err);
      step.status = 'failed';
    }

    const parent = {};
    if (step.metaStep) {
      parent.title = step.metaStep.actor;
    }

    if (step.opts) {
      Object.keys(step.opts).forEach(k => {
        if (typeof step.opts[k] === 'object') delete step.opts[k];
        if (typeof step.opts[k] === 'function') delete step.opts[k];
      });
    }

    return {
      opts: step.opts || {},
      workerIndex,
      title: step.name,
      status: step.status,
      duration: step.duration || 0,
      err,
      parent,
      test: simplifyTest(step.test),
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

  // steps
  event.dispatcher.on(event.step.finished, step => sendToParentThread({ event: event.step.finished, workerIndex, data: simplifyStep(step) }));
  event.dispatcher.on(event.step.started, step => sendToParentThread({ event: event.step.started, workerIndex, data: simplifyStep(step) }));
  event.dispatcher.on(event.step.passed, step => sendToParentThread({ event: event.step.passed, workerIndex, data: simplifyStep(step) }));
  event.dispatcher.on(event.step.failed, step => sendToParentThread({ event: event.step.failed, workerIndex, data: simplifyStep(step) }));

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
  event.dispatcher.on(event.test.failed, (test) => {
    if (test.ctx._runnable.title.includes('hook: AfterSuite')) {
      stats.failedHooks += 1;
    }
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
