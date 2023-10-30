// For Node version >=10.5.0, have to use experimental flag
const { tryOrDefault } = require('../utils');
const output = require('../output');
const event = require('../event');
const Workers = require('../workers');

module.exports = async function (workerCount, selectedRuns, options) {
  process.env.profile = options.profile;

  const suiteArr = [];
  const passedTestArr = [];
  const failedTestArr = [];
  const skippedTestArr = [];
  const passedStepArr = [];
  const failedStepArr = [];
  const skippedStepArr = [];

  const { config: testConfig, override = '' } = options;
  const overrideConfigs = tryOrDefault(() => JSON.parse(override), {});
  const by = options.suites ? 'suite' : 'test';
  delete options.parent;
  const config = {
    by,
    testConfig,
    options,
    selectedRuns,
  };

  const numberOfWorkers = parseInt(workerCount, 10);

  output.print(`CodeceptJS v${require('../codecept').version()} ${output.standWithUkraine()}`);
  output.print(`Running tests in ${output.styles.bold(numberOfWorkers)} workers...`);
  output.print();

  const workers = new Workers(numberOfWorkers, config);
  workers.overrideConfig(overrideConfigs);

  workers.on(event.suite.before, (suite) => {
    suiteArr.push(suite);
  });

  workers.on(event.test.failed, (test) => {
    failedTestArr.push(test);
    output.test.failed(test);
  });

  workers.on(event.test.passed, (test) => {
    passedTestArr.push(test);
    output.test.passed(test);
  });

  workers.on(event.test.skipped, (test) => {
    skippedTestArr.push(test);
    output.test.passed(test);
  });

  workers.on(event.step.failed, (step) => {
    failedStepArr.push(step);
  });

  workers.on(event.step.passed, (step) => {
    passedStepArr.push(step);
  });

  workers.on(event.step.passed, (step) => {
    skippedStepArr.push(step);
  });

  workers.on(event.all.result, () => {
    // expose test stats after all workers finished their execution
    event.dispatcher.emit(event.workers.result, {
      suites: suiteArr,
      tests: {
        passed: passedTestArr,
        failed: failedTestArr,
        skipped: skippedTestArr,
      },
      steps: {
        passed: passedStepArr,
        failed: failedStepArr,
        skipped: skippedStepArr,
      },
    });
    workers.printResults();
  });

  try {
    if (options.verbose) {
      global.debugMode = true;
      const { getMachineInfo } = require('./info');
      await getMachineInfo();
    }
    await workers.bootstrapAll();
    await workers.run();
  } catch (err) {
    output.error(err);
    process.exit(1);
  } finally {
    await workers.teardownAll();
  }
};
