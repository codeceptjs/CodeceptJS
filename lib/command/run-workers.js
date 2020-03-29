// For Node version >=10.5.0, have to use experimental flag
const { satisfyNodeVersion } = require('./utils');
const { tryOrDefault } = require('../utils');
const output = require('../output');
const event = require('../event');
const Workers = require('../workers');


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

  output.print(`CodeceptJS v${require('../codecept').version()}`);
  output.print(`Running tests in ${output.styles.bold(numberOfWorkers)} workers...`);
  output.print();

  const workers = new Workers(numberOfWorkers, config);
  workers.overrideConfig(overrideConfigs);
  workers.run();

  workers.on(event.test.failed, (failedTest) => {
    output.test.failed(failedTest);
  });

  workers.on(event.test.passed, (successTest) => {
    output.test.passed(successTest);
  });

  workers.on(event.all.result, (_status, _completedTest, workerStats) => {
    workers.printResults();
  });
};
