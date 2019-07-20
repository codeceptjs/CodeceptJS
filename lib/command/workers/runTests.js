const { parentPort, workerData } = require('worker_threads');
const { captureStream } = require('../utils');
const event = require('../../event');
const tty = require('tty');

if (!tty.getWindowSize) {
  // this is really old method, long removed from Node, but Mocha
  // reporters fall back on it if they cannot use `process.stdout.getWindowSize`
  // we need to polyfill it.
  tty.getWindowSize = () => [40, 80];
}

// Requiring of Codecept need to be after tty.getWindowSize is available.
const Codecept = require('../../codecept');

const { config, tests, testRoot } = workerData;
const TYPE = { TEST_RESULT: 'test_result' };
const captureLogs = captureStream(process.stdout);

let n = 0;
function runTest() {
  if (n >= tests.length) {
    return onAllTestsCompleted();
  }

  const { file, title } = tests[n];
  config.grep = title;
  const currentConfig = {
    ...config,
    tests: file,
  };

  // Load test and run
  const codecept = new Codecept(currentConfig, {});
  codecept.init(testRoot);
  codecept.loadTests();

  captureLogs.startCapture();
  codecept.run();
}
runTest();

// Adds listener for every test ends.
event.dispatcher.on(event.all.after, onTestComplete);

function onTestComplete() {
  captureLogs.stopCapture();
  const logs = captureLogs.getData();

  /*  Removes lines like below-
      > CodeceptJS v2.2.0
      > Using test root "/home/User/Documents/CodeceptJS/test/"
   */
  const finalLogs = logs.replace(/((CodeceptJS|Using test root).*?\n)/gi, '');

  sendToParentThread({
    type: TYPE.TEST_RESULT,
    log: finalLogs,
    test: tests[n],
  });
  n++;
  runTest();
}

function sendToParentThread(data) {
  parentPort.postMessage(data);
}

function onAllTestsCompleted() {
  event.dispatcher.removeListener(event.all.after, onTestComplete);
  parentPort.close();
}

