const { EventEmitter } = require('events');
const { Worker } = require('worker_threads');
const Codecept = require('./codecept');
const Container = require('./container');
const { getTestRoot } = require('./command/utils');
const mainConfig = require('./config');
const output = require('./output');
const path = require('path');
const event = require('./event');
const { Suite, Test, reporters: { Base } } = require('mocha');

const pathToWorker = path.join(__dirname, 'command', 'workers', 'runTests.js');

const initializeCodecept = (configPath) => {
  const codecept = new Codecept(mainConfig.load(configPath), {});
  codecept.init(getTestRoot(configPath));
  codecept.loadTests();

  return codecept;
};

const populateGroups = (numberOfWorkers) => {
  const groups = [];
  for (let i = 0; i < numberOfWorkers; i++) {
    groups[i] = [];
  }

  return groups;
};

const createWorker = (workerObject) => {
  return new Worker(pathToWorker, {
    workerData: {
      options: simplifyObject(workerObject.options),
      tests: workerObject.tests,
      testRoot: workerObject.testRoot,
      workerIndex: workerObject.workerIndex + 1,
    },
  });
};

const simplifyObject = (object) => {
  return Object.keys(object)
    .filter(k => k.indexOf('_') !== 0)
    .filter(k => typeof object[k] !== 'function')
    .filter(k => typeof object[k] !== 'object')
    .reduce((obj, key) => {
      obj[key] = object[key];
      return obj;
    }, {});
};

const repackTest = (test) => {
  test = Object.assign(new Test(test.title || '', () => { }), test);
  test.parent = Object.assign(new Suite(test.parent.title), test.parent);
  return test;
};

const createWorkerObjects = (testGroups, config) => {
  return testGroups.map((tests, index) => new WorkerObject({ config: JSON.stringify(config) }, tests, getTestRoot(), index));
};

const indexOfSmallestElement = (groups) => {
  let i = 0;
  for (let j = 1; j < groups.length; j++) {
    if (groups[j - 1].length > groups[j].length) {
      i = j;
    }
  }
  return i;
};

class WorkerObject {
  constructor(options, tests, testRoot, workerIndex) {
    this.options = options || {};
    this.tests = tests;
    this.testRoot = testRoot || getTestRoot();
    this.workerIndex = workerIndex;
  }

  addConfig(config) {
    this.options.config = JSON.stringify(config);
  }

  addTests(tests) {
    this.tests = tests;
  }
}

class Workers extends EventEmitter {
  /**
   * @param {Number} numberOfWorkers
   * @param {Boolean} runAsSuite
   */
  constructor(numberOfWorkers, runAsSuite, configPath) {
    super();
    this.codecept = initializeCodecept(configPath);
    this.finishedTests = [];
    this.errors = [];
    this.numberOfWorkers = 0;
    this.closedWorkers = 0;
    this.workers = [];
    this.stats = {
      passes: 0,
      failures: 0,
      tests: 0,
    };

    if (typeof numberOfWorkers === 'number' && numberOfWorkers > 0) {
      this.numberOfWorkers = numberOfWorkers;
      this.testGroups = runAsSuite ? this.createGroupsOfSuites(numberOfWorkers) : this.createGroupsOfTests(numberOfWorkers);
      this.workers = createWorkerObjects(this.testGroups, this.codecept.config);
    }
  }

  spawn() {
    const worker = new WorkerObject({}, [], getTestRoot(), this.numberOfWorkers);
    this.workers.push(worker);
    this.numberOfWorkers += 1;
    return worker;
  }

  createGroupsOfTests(numberOfWorkers) {
    const files = this.codecept.testFiles;
    const mocha = Container.mocha();
    mocha.files = files;
    mocha.loadFiles();
    const groups = populateGroups(numberOfWorkers);
    let groupCounter = 0;

    mocha.suite.eachTest((test) => {
      const i = groupCounter % groups.length;
      if (test) {
        const { id } = test;
        groups[i].push(id);
        groupCounter++;
      }
    });
    return groups;
  }

  createGroupsOfSuites(numberOfWorkers) {
    const files = this.codecept.testFiles;
    const mocha = Container.mocha();
    mocha.files = files;
    mocha.loadFiles();
    const groups = populateGroups(numberOfWorkers);

    mocha.suite.suites.forEach((suite) => {
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

  run() {
    for (const worker of this.workers) {
      const workerThread = createWorker(worker);
      this.listenWorkerEvents(workerThread);
    }
    return this;
  }

  isFailed() {
    return this.stats.failures || this.errors.length;
  }

  listenWorkerEvents(worker) {
    worker.on('message', (message) => {
      output.process(message.workerIndex);

      switch (message.event) {
        case event.test.failed: output.test.failed(repackTest(message.data));
          this.finishedTests.push(repackTest(message.data));
          break;
        case event.test.passed: output.test.passed(repackTest(message.data)); break;
        case event.suite.before: output.suite.started(repackTest(message.data)); break;
        case event.all.after: this.appendStats(message.data); break;
      }
      output.process(null);
    });

    worker.on('error', (err) => {
      this.errors.push(err);
    });

    worker.on('exit', () => {
      this.closedWorkers += 1;
      if (this.closedWorkers === this.numberOfWorkers) {
        if (this.isFailed()) {
          this.emit('FAILED', this.finishedTests, this.errors, this.stats);
        } else {
          this.emit('PASSED', this.stats);
        }
      }
    });
  }

  overrideConfig(config) {
    for (const worker of this.workers) {
      worker.addConfig(config);
    }
  }

  appendStats(newStats) {
    this.stats.passes += newStats.passes;
    this.stats.failures += newStats.failures;
    this.stats.tests += newStats.tests;
  }
}

module.exports = Workers;
