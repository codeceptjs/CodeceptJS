const { expect } = require('chai');
const path = require('path');
const semver = require('semver');
const { Workers, event, recorder } = require('../../lib/index');

describe('Workers', () => {
  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data/sandbox');
  });

  it('should run simple worker', (done) => {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version');
    const workerConfig = {
      by: 'test',
      testConfig: './test/data/sandbox/codecept.workers.conf.js',
    };
    let passedCount = 0;
    let failedCount = 0;
    const workers = new Workers(2, workerConfig);

    workers.run();

    workers.on(event.test.failed, () => {
      failedCount += 1;
    });
    workers.on(event.test.passed, () => {
      passedCount += 1;
    });

    workers.on(event.all.result, (status) => {
      expect(status).equal(false);
      expect(passedCount).equal(5);
      expect(failedCount).equal(3);
      done();
    });
  });

  it('should create worker by function', (done) => {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version');

    const createTestGroups = () => {
      const files = [
        [path.join(codecept_dir, '/custom-worker/base_test.worker.js')],
        [path.join(codecept_dir, '/custom-worker/custom_test.worker.js')],
      ];

      return files;
    };

    const workerConfig = {
      by: createTestGroups,
      testConfig: './test/data/sandbox/codecept.customworker.js',
    };

    const workers = new Workers(-1, workerConfig);

    for (const worker of workers.getWorkers()) {
      worker.addConfig({
        helpers: {
          FileSystem: {},
          Workers: {
            require: './custom_worker_helper',
          },
        },
      });
    }

    workers.run();

    workers.on(event.all.result, (status) => {
      expect(workers.getWorkers().length).equal(2);
      expect(status).equal(true);
      done();
    });
  });

  it('should run worker with custom config', (done) => {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version');

    const workerConfig = {
      by: 'test',
      testConfig: './test/data/sandbox/codecept.customworker.js',
    };
    let passedCount = 0;
    let failedCount = 0;

    const workers = new Workers(2, workerConfig);

    for (const worker of workers.getWorkers()) {
      worker.addConfig({
        helpers: {
          FileSystem: {},
          Workers: {
            require: './custom_worker_helper',
          },
        },
      });
    }

    workers.run();

    workers.on(event.test.failed, () => {
      failedCount += 1;
    });
    workers.on(event.test.passed, () => {
      passedCount += 1;
    });

    workers.on(event.all.result, (status) => {
      expect(status).equal(false);
      expect(passedCount).equal(4);
      expect(failedCount).equal(1);
      done();
    });
  });

  it('should able to add tests to each worker', (done) => {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version');

    const workerConfig = {
      by: 'test',
      testConfig: './test/data/sandbox/codecept.customworker.js',
    };

    const workers = new Workers(-1, workerConfig);

    const workerOne = workers.spawn();
    workerOne.addTestFiles([
      path.join(codecept_dir, '/custom-worker/base_test.worker.js'),
    ]);

    const workerTwo = workers.spawn();
    workerTwo.addTestFiles([
      path.join(codecept_dir, '/custom-worker/custom_test.worker.js'),
    ]);

    for (const worker of workers.getWorkers()) {
      worker.addConfig({
        helpers: {
          FileSystem: {},
          Workers: {
            require: './custom_worker_helper',
          },
        },
      });
    }

    workers.run();

    workers.on(event.all.result, (status) => {
      expect(workers.getWorkers().length).equal(2);
      expect(status).equal(true);
      done();
    });
  });

  it('should able to add tests to using createGroupsOfTests', (done) => {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version');

    const workerConfig = {
      by: 'test',
      testConfig: './test/data/sandbox/codecept.customworker.js',
    };

    const workers = new Workers(-1, workerConfig);
    const testGroups = workers.createGroupsOfSuites(2);

    const workerOne = workers.spawn();
    workerOne.addTests(testGroups[0]);

    const workerTwo = workers.spawn();
    workerTwo.addTests(testGroups[1]);

    for (const worker of workers.getWorkers()) {
      worker.addConfig({
        helpers: {
          FileSystem: {},
          Workers: {
            require: './custom_worker_helper',
          },
        },
      });
    }

    workers.run();

    workers.on(event.all.result, (status) => {
      expect(workers.getWorkers().length).equal(2);
      expect(status).equal(true);
      done();
    });
  });

  it('Should able to pass data from workers to main thread and vice versa', (done) => {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version');

    const workerConfig = {
      by: 'test',
      testConfig: './test/data/sandbox/codecept.customworker.js',
    };

    const workers = new Workers(2, workerConfig);

    for (const worker of workers.getWorkers()) {
      worker.addConfig({
        helpers: {
          FileSystem: {},
          Workers: {
            require: './custom_worker_helper',
          },
        },
      });
    }

    workers.run();
    recorder.add(() => share({ fromMain: true }));

    workers.on(event.all.result, (status) => {
      expect(status).equal(true);
      done();
    });
  });

  it('should propagate non test events', (done) => {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version');
    const messages = [];

    const createTestGroups = () => {
      const files = [
        [path.join(codecept_dir, '/non-test-events-worker/non_test_event.worker.js')],
      ];

      return files;
    };

    const workerConfig = {
      by: createTestGroups,
      testConfig: './test/data/sandbox/codecept.non-test-events-worker.js',
    };

    workers = new Workers(2, workerConfig);

    workers.run();

    workers.on('message', (data) => {
      messages.push(data);
    });

    workers.on(event.all.result, () => {
      expect(messages.length).equal(2);
      expect(messages[0]).equal('message 1');
      expect(messages[1]).equal('message 2');
      done();
    });
  });

  it('should run worker with multiple config', (done) => {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version');

    const workerConfig = {
      by: 'test',
      testConfig: './test/data/sandbox/codecept.multiple.js',
      options: {},
      selectedRuns: ['mobile'],
    };

    const workers = new Workers(2, workerConfig);

    for (const worker of workers.getWorkers()) {
      worker.addConfig({
        helpers: {
          FileSystem: {},
          Workers: {
            require: './custom_worker_helper',
          },
        },
      });
    }

    workers.run();

    workers.on(event.all.result, (status) => {
      expect(workers.getWorkers().length).equal(8);
      expect(status).equal(true);
      done();
    });
  });
});
