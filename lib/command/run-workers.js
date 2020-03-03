// For Node version >=10.5.0, have to use experimental flag

const { reporters: { Base } } = require('mocha');

const { satisfyNodeVersion } = require('./utils');
const { tryOrDefault } = require('../utils');
const output = require('../output');
const event = require('../event');
const Workers = require('../workers');

const stats = {
  suites: 0,
  passes: 0,
  failures: 0,
  tests: 0,
};
const finishedTests = {};
const errors = [];

module.exports = function (workerCount, options) {
  satisfyNodeVersion(
    '>=11.7.0',
    'Required minimum Node version of 11.7.0 to work with "run-workers"',
  );

  process.profile = options.profile;

  const { config: testConfig, override = '' } = options;
  const overrideConfigs = tryOrDefault(() => JSON.parse(override), {});
  const by = options.suites ? 'suite' : 'test';
  delete options.parent;
  const config = {
    by,
    testConfig,
    options,
  };

  const numberOfWorkers = parseInt(workerCount, 10);

  stats.start = new Date();

  output.print(`CodeceptJS v${require('../codecept').version()}`);
  output.print(`Running tests in ${output.styles.bold(numberOfWorkers)} workers...`);
  output.print();

  const workers = new Workers(numberOfWorkers, config);
  workers.overrideConfig(overrideConfigs);
  workers.run();

  workers.on(event.test.failed, (failedTest) => {
    output.test.failed(failedTest);
    updateFinishedTests(failedTest);
  });

  workers.on(event.test.passed, (successTest) => {
    output.test.passed(successTest);
    updateFinishedTests(successTest);
  });

  workers.on(event.all.result, (_status, _completedTest, workerStats) => {
    appendStats(workerStats);
    printResults();
  });
};

function printResults() {
  stats.end = new Date();
  stats.duration = stats.end - stats.start;
  output.print();
  if (stats.tests === 0 || (stats.passes && !errors.length)) {
    output.result(stats.passes, stats.failures, 0, `${stats.duration || 0 / 1000}s`);
  }
  if (stats.failures) {
    output.print();
    output.print('-- FAILURES:');
    const failedList = Object.keys(finishedTests)
      .filter(key => finishedTests[key].err)
      .map(key => finishedTests[key]);
    Base.list(failedList);
  }
}

function appendStats(newStats) {
  stats.passes += newStats.passes;
  stats.failures += newStats.failures;
  stats.tests += newStats.tests;
}

const updateFinishedTests = (test) => {
  const { id } = test;
  finishedTests[id] = test;
};
