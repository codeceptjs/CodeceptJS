const { EventEmitter } = require('events');
const path = require('path');
const { Worker } = require('worker_threads');
const { Suite, Test } = require('mocha');
const Codecept = require('./codecept');
const MochaFactory = require('./mochaFactory');
const Container = require('./container');
const { getTestRoot } = require('./command/utils');
const { isFunction } = require('./utils');
const mainConfig = require('./config');
const output = require('./output');
const event = require('./event');
const runHook = require('./hooks');

const pathToWorker = path.join(__dirname, 'command', 'workers', 'runTests.js');

const initializeCodecept = (configPath) => {
  const codecept = new Codecept(mainConfig.load(configPath || '.'), {});
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
    .filter((k) => k.indexOf('_') !== 0)
    .filter((k) => typeof object[k] !== 'function')
    .filter((k) => typeof object[k] !== 'object')
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

const createWorkerObjects = (testGroups, config, testRoot) => {
  return testGroups.map((tests, index) => {
    const workerObj = new WorkerObject(index);
    workerObj.addConfig(config);
    workerObj.addTests(tests);
    workerObj.setTestRoot(testRoot);

    return workerObj;
  });
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

const convertToMochaTests = (testGroup) => {
  const group = [];
  if (testGroup instanceof Array) {
    const mocha = MochaFactory.create({}, {});
    mocha.files = testGroup;
    mocha.loadFiles();
    mocha.suite.eachTest((test) => {
      const { id } = test;
      group.push(id);
    });
    mocha.unloadFiles();
  }

  return group;
};

class WorkerObject {
  /**
   * @param {Number} workerIndex - Unique ID for worker
   */
  constructor(workerIndex) {
    this.workerIndex = workerIndex;
    this.options = {};
    this.tests = [];
    this.testRoot = getTestRoot();
  }

  addConfig(config) {
    const oldConfig = JSON.parse(this.options.override || '{}');
    const newConfig = {
      ...oldConfig,
      ...config,
    };
    this.options.override = JSON.stringify(newConfig);
  }

  addTestFiles(testGroup) {
    this.addTests(convertToMochaTests(testGroup));
  }

  addTests(tests) {
    this.tests = this.tests.concat(tests);
  }

  setTestRoot(path) {
    this.testRoot = getTestRoot(path);
  }
}

class Workers extends EventEmitter {
  /**
   * @param {Number} numberOfWorkers
   * @param {Object} config
   */
  constructor(numberOfWorkers, config = { by: 'test' }) {
    super();
    this.codecept = initializeCodecept(config.testConfig);
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
    this.testGroups = [];

    this._initWorkers(numberOfWorkers, config);
  }

  _initWorkers(numberOfWorkers, config) {
    if (isFunction(config.by)) {
      const createTests = config.by;
      const testGroups = createTests();
      if (!(testGroups instanceof Array)) {
        throw new Error('Test group should be an array');
      }
      for (const testGroup of testGroups) {
        this.testGroups.push(convertToMochaTests(testGroup));
      }
    } else if (typeof numberOfWorkers === 'number' && numberOfWorkers > 0) {
      this.testGroups = config.by === 'suite' ? this.createGroupsOfSuites(numberOfWorkers) : this.createGroupsOfTests(numberOfWorkers);
    }

    this.workers = createWorkerObjects(this.testGroups, this.codecept.config, config.testConfig);
    this.numberOfWorkers = this.workers.length;
  }

  /**
   * Creates a new worker
   *
   * @returns {WorkerObject}
   */
  spawn() {
    const worker = new WorkerObject(this.numberOfWorkers);
    this.workers.push(worker);
    this.numberOfWorkers += 1;
    return worker;
  }

  /**
   * @param {Number} numberOfWorkers
   */
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

  /**
   * @param {Number} numberOfWorkers
   */
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

  /**
   * @param {Object} config
   */
  overrideConfig(config) {
    for (const worker of this.workers) {
      worker.addConfig(config);
    }
  }

  run() {
    runHook(this.codecept.config.bootstrapAll, () => {
      for (const worker of this.workers) {
        const workerThread = createWorker(worker);
        this._listenWorkerEvents(workerThread);
      }
    }, 'bootstrapAll');

    return this;
  }

  /**
   * @returns {Array<WorkerObject>}
   */
  getWorkers() {
    return this.workers;
  }

  /**
   * @returns {Boolean}
   */
  isFailed() {
    return (this.stats.failures || this.errors.length) > 0;
  }

  _listenWorkerEvents(worker) {
    worker.on('message', (message) => {
      output.process(message.workerIndex);
      switch (message.event) {
        case event.test.failed: this.emit(event.test.failed, repackTest(message.data)); break;
        case event.test.passed: this.emit(event.test.passed, repackTest(message.data)); break;
        case event.test.finished: this.emit(event.test.finished, repackTest(message.data)); break;
        case event.all.after: this._appendStats(message.data); break;
      }
    });

    worker.on('error', (err) => {
      this.errors.push(err);
    });

    worker.on('exit', () => {
      this.closedWorkers += 1;
      if (this.closedWorkers === this.numberOfWorkers) {
        runHook(this.codecept.config.teardownAll, () => {
          this.emit(event.all.result, !this.isFailed());
        });
      }
    });
  }

  _appendStats(newStats) {
    this.stats.passes += newStats.passes;
    this.stats.failures += newStats.failures;
    this.stats.tests += newStats.tests;
  }
}

module.exports = Workers;
