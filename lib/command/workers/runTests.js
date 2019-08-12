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
const { captureStream } = require('../utils');
const event = require('../../event');
const output = require('../../output');
const container = require('../../container');

let stdout = '';
const stderr = '';

process.stdout.write = (string, encoding, fd) => { stdout += string; return true; };
// process.stderr.write = (string, encoding, fd) => { stderr += string; return true; };

// Requiring of Codecept need to be after tty.getWindowSize is available.
const Codecept = require('../../codecept');

const { config, tests, testRoot } = workerData;
// const captureLogs = captureStream(process.stdout);

// Load test and run
const codecept = new Codecept(config, {});
codecept.init(testRoot);
codecept.loadTests();
filterTests();
initializeListeners();
disablePause();

codecept.runBootstrap();
output.level(3);
codecept.run();

function filterTests() {
  const mocha = container.mocha();
  for (const suite of mocha.suite.suites) {
    suite.tests.forEach((test, index) => {
      if (tests.indexOf(test.id) === -1) delete suite.tests[index];
    });
  }
}

function initializeListeners() {
  function simplifyStep(step) {
    return {
      name: step.name,
      actor: step.actor,
      helperMethod: step.helperMethod,
      status: step.status,
      prefix: step.prefix,
      args: step.args,
    };
  }

  function simplifyTest(test) {
    return {
      title: test.title,
      status: test.status,
    };
  }

  // steps
  event.dispatcher.on(event.step.before, step => sendToParentThread({ event: event.step.before, data: simplifyStep(step) }));
  event.dispatcher.on(event.step.after, step => sendToParentThread({ event: event.step.after, data: simplifyStep(step) }));
  event.dispatcher.on(event.step.passed, step => sendToParentThread({ event: event.step.passed, data: simplifyStep(step) }));
  event.dispatcher.on(event.step.failed, step => sendToParentThread({ event: event.step.failed, data: simplifyStep(step) }));
  // tests
  event.dispatcher.on(event.test.before, test => sendToParentThread({ event: event.test.before, data: simplifyTest(test) }));
  event.dispatcher.on(event.test.after, test => sendToParentThread({ event: event.test.after, data: simplifyTest(test) }));
  event.dispatcher.on(event.test.finished, test => sendToParentThread({ event: event.test.finished, data: simplifyTest(test) }));
  event.dispatcher.on(event.test.failed, test => sendToParentThread({ event: event.test.failed, data: simplifyTest(test) }));
  event.dispatcher.on(event.test.passed, test => sendToParentThread({ event: event.test.passed, data: simplifyTest(test) }));
  event.dispatcher.on(event.test.started, test => sendToParentThread({ event: event.test.started, data: simplifyTest(test) }));
  // all
  event.dispatcher.on(event.all.before, () => sendToParentThread({ event: event.all.before }));
  event.dispatcher.on(event.all.after, () => sendToParentThread({ event: event.all.after }));
  event.dispatcher.on(event.all.result, () => sendToParentThread({ event: event.all.result }));
  event.dispatcher.once(event.all.result, () => parentPort.close());
}

function disablePause() {
  global.pause = () => {};
}

// Adds listener for every test ends.
// event.dispatcher.on(event.all.after, onTestComplete);

// function onTestComplete() {
//   // captureLogs.stopCapture();
//   const logs = captureLogs.getData();

//   /*  Removes lines like below-
//       > CodeceptJS v2.2.0
//       > Using test root "/home/User/Documents/CodeceptJS/test/"
//    */
//   const finalLogs = logs.replace(/((CodeceptJS|Using test root).*?\n)/gi, '');

//   sendToParentThread({
//     type: TYPE.TEST_RESULT,
//     log: finalLogs,
//     test: tests[n],
//   });
//   n++;
//   runTest();
// }

function sendToParentThread(data) {
  parentPort.postMessage(data);
}

// function onAllTestsCompleted() {
//   event.dispatcher.removeListener(event.all.after, onTestComplete);
//   parentPort.close();
// }
