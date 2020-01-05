const { expect } = require('chai');
const path = require('path');
const { Workers, event } = require('../../lib/index');

describe('Workers', () => {
  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data/sandbox');
  });

  it('should run simple worker', (done) => {
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
      expect(passedCount).equal(4);
      expect(failedCount).equal(2);
      done();
    });
  });

  it('should run custom worker', (done) => {
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

    workers.on(event.all.result, (status) => {
      expect(status).equal(true);
      done();
    });
  });
});
