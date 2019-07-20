const { satisfyNodeVersion, getConfig, getTestRoot } = require('./utils');
// For Node version >=10.5.0, have to use experimental flag
satisfyNodeVersion(
  '>=11.7.0',
  'Required minimum Node version of 11.7.0 to work with "run-workers"',
);

const path = require('path');
const Codecept = require('../codecept');
const Container = require('../container');
const { Worker } = require('worker_threads');
const { tryOrDefault } = require('../utils');
const output = require('../output');

const result = {};
const TYPE = {
  TEST_RESULT: 'test_result',
};

module.exports = function (_, options) {
  const { workers, config: configPath, override = '' } = options;

  const overrideConfigs = tryOrDefault(() => JSON.parse(override), {});
  const numberOfWorkers = stringToNumber(workers, 3);

  const config = {
    ...getConfig(configPath),
    ...overrideConfigs,
  };
  const testRoot = getTestRoot(configPath);
  config.tests = path.resolve(testRoot, config.tests);

  const testFiles = getTestFiles(config, testRoot);
  const groups = createGroupsOfTests(testFiles, numberOfWorkers);

  const workerList = createWorkers(groups, config, testRoot);
  workerList.forEach(worker => assignWorkerMethods(worker, groups.length));
};

function getTestFiles(config, testRoot) {
  const codecept = new Codecept(config, {});
  codecept.init(testRoot);
  codecept.loadTests();
  return codecept.testFiles;
}

function createGroupsOfTests(files, numberOfGroups) {
  const mocha = Container.mocha();
  mocha.files = files;
  mocha.loadFiles();

  const groups = [];
  let groupCounter = 0;

  for (const suite of mocha.suite.suites) {
    for (const test of suite.tests) {
      const i = groupCounter % numberOfGroups;
      if (groups[i] === undefined) groups[i] = [];
      if (test) {
        const { file, title } = test;
        groups[i].push({ file, title });
        groupCounter++;
      }
    }
  }
  return groups;
}

const pathToWorker = path.join(__dirname, 'workers', 'runTests.js');

function createWorkers(groups, config, testRoot) {
  const workers = groups.map((tests) => {
    return new Worker(pathToWorker, {
      workerData: {
        config,
        tests,
        testRoot,
      },
    });
  });

  return workers;
}

let numberOfWorkersClosed = 0;

function assignWorkerMethods(worker, totalWorkers) {
  worker.on('message', (message) => {
    const { type, log, test } = message;

    if (type === TYPE.TEST_RESULT) {
      const { file } = test;
      if (result[file] === undefined) result[file] = [];
      result[file].push(log);
    }
  });

  worker.on('exit', () => {
    numberOfWorkersClosed++;
    if (numberOfWorkersClosed >= totalWorkers) {
      Object.values(result).forEach(tests =>
        tests.forEach(log => console.log(log)));
    }
  });
}

const stringToNumber = (str, defaultValue) => {
  const num = parseInt(str, 10);
  if (Number.isNaN(num)) {
    return defaultValue;
  }
  return num;
};
