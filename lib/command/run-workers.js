const { satisfyNodeVersion, getConfig, getTestRoot } = require('./utils');
// For Node version >=10.5.0, have to use experimental flag

const ms = require('ms');
const path = require('path');
const Codecept = require('../codecept');
const Container = require('../container');
const { tryOrDefault } = require('../utils');
const output = require('../output');
const event = require('../event');
const runHook = require('../hooks');
const { Suite, Test, reporters: { Base } } = require('mocha');

const stats = {
  suites: 0,
  passes: 0,
  failures: 0,
  tests: 0,
};


let numberOfWorkersClosed = 0;
const hasFailures = () => stats.failures || errors.length;
const pathToWorker = path.join(__dirname, 'workers', 'runTests.js');
const finishedTests = [];
const errors = [];

module.exports = function (workers, options) {
  satisfyNodeVersion(
    '>=11.7.0',
    'Required minimum Node version of 11.7.0 to work with "run-workers"',
  );

  process.profile = options.profile;

  const { Worker } = require('worker_threads');

  const { config: configPath, override = '' } = options;

  const overrideConfigs = tryOrDefault(() => JSON.parse(override), {});
  const numberOfWorkers = parseInt(workers, 10);

  const config = {
    ...getConfig(configPath),
    ...overrideConfigs,
  };

  const testRoot = getTestRoot(configPath);
  config.tests = path.resolve(testRoot, config.tests);


  const codecept = new Codecept(config, options);
  codecept.init(testRoot);
  codecept.loadTests();

  const groups = createGroupsOfTests(codecept, numberOfWorkers, options.suites);

  stats.start = new Date();

  output.print(`CodeceptJS v${require('../codecept').version()}`);
  output.print(`Running tests in ${output.styles.bold(workers)} workers...`);
  output.print();

  // run bootstrap all
  runHook(config.bootstrapAll, () => {
    const workerList = createWorkers(groups, options, testRoot);
    workerList.forEach(worker => assignWorkerMethods(worker, groups.length));
  }, 'bootstrapAll');

  function createWorkers(groups, options, testRoot) {
    const workers = groups.map((tests, workerIndex) => {
      workerIndex++;
      return new Worker(pathToWorker, {
        workerData: {
          options: simplifyObject(options),
          tests,
          testRoot,
          workerIndex,
        },
      });
    });

    return workers;
  }

  function assignWorkerMethods(worker, totalWorkers) {
    worker.on('message', (message) => {
      output.process(message.workerIndex);

      switch (message.event) {
        case event.test.failed:
          finishedTests.push(repackTest(message.data));
          output.test.failed(repackTest(message.data));
          break;
        case event.test.passed: output.test.passed(repackTest(message.data)); break;
        case event.suite.before: output.suite.started(message.data); break;
        case event.all.after: appendStats(message.data); break;
      }
      output.process(null);
    });

    worker.on('error', (err) => {
      errors.push(err);
      console.error(err);
    });

    worker.on('exit', () => {
      numberOfWorkersClosed++;
      if (numberOfWorkersClosed >= totalWorkers) {
        printResults();
        runHook(config.teardownAll, () => {
          if (hasFailures()) process.exit(1);
          process.exit(0);
        });
      }
    });
  }
};

function printResults() {
  stats.end = new Date();
  stats.duration = stats.end - stats.start;
  output.print();
  if (stats.passes && !errors.length) {
    output.result(stats.passes, stats.failures, 0, `${stats.duration / 1000}s`);
  }
  if (stats.failures) {
    output.print();
    output.print('-- FAILURES:');
    Base.list(finishedTests.filter(t => t.err));
  }
}

function createGroupsOfTests(codecept, numberOfGroups, preserveSuites) {
  const files = codecept.testFiles;
  const mocha = Container.mocha();
  mocha.files = files;
  mocha.loadFiles();

  const groups = [];
  for (let i = 0; i < numberOfGroups; i++) {
    groups[i] = [];
  }
  if (preserveSuites) {
    return groupSuites(mocha.suite, groups);
  }
  return groupTests(mocha.suite, groups);
}

function groupTests(suite, groups) {
  let groupCounter = 0;

  suite.eachTest((test) => {
    const i = groupCounter % groups.length;
    if (test) {
      const { id } = test;
      groups[i].push(id);
      groupCounter++;
    }
  });
  return groups;
}

function groupSuites(suite, groups) {
  suite.suites.forEach((suite) => {
    const i = indexOfSmallestElement(groups);
    suite.tests.forEach((test) => {
      if (test) {
        const { id } = test;
        groups[i].push(id);
      }
    });
  });
  return groups;
}

function indexOfSmallestElement(groups) {
  let i = 0;
  for (let j = 1; j < groups.length; j++) {
    if (groups[j - 1].length > groups[j].length) {
      i = j;
    }
  }
  return i;
}

function appendStats(newStats) {
  stats.passes += newStats.passes;
  stats.failures += newStats.failures;
  stats.tests += newStats.tests;
}

function repackTest(test) {
  test = Object.assign(new Test(test.title || '', () => { }), test);
  test.parent = Object.assign(new Suite(test.parent.title), test.parent);
  return test;
}

function repackSuite(suite) {
  return Object.assign(new Suite(suite.title), suite);
}


function simplifyObject(object) {
  return Object.keys(object)
    .filter(k => k.indexOf('_') !== 0)
    .filter(k => typeof object[k] !== 'function')
    .filter(k => typeof object[k] !== 'object')
    .reduce((obj, key) => {
      obj[key] = object[key];
      return obj;
    }, {});
}
