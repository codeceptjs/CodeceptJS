const assert = require('assert');
const path = require('path');
const exec = require('child_process').exec;
const semver = require('semver');

const runner = path.join(__dirname, '/../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox');
const codecept_run = `${runner} run-workers --config ${codecept_dir}/codecept.workers.conf.js `;
const codecept_run_glob = config => `${runner} run-workers --config ${codecept_dir}/${config} `;

describe('CodeceptJS Workers Runner', function () {
  this.timeout(40000);

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data/sandbox');
  });

  it('should run tests in 3 workers', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version');
    exec(`${codecept_run} 3`, (err, stdout) => {
      stdout.should.include('CodeceptJS'); // feature
      stdout.should.include('glob current dir');
      stdout.should.include('From worker @1_grep print message 1');
      stdout.should.include('From worker @2_grep print message 2');
      stdout.should.include('Running tests in 3 workers');
      stdout.should.not.include('this is running inside worker');
      stdout.should.include('failed');
      stdout.should.include('File notafile not found');
      stdout.should.include('Scenario Steps:');
      assert(err.code === 1, 'failure');
      done();
    });
  });

  it('should print positive or zero failures with same name tests', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version');
    exec(`${codecept_run_glob('configs/workers/codecept.workers-negative.conf.js')} 2`, (err, stdout) => {
      stdout.should.include('Running tests in 2 workers...');
      stdout.should.not.include('FAIL  | 2 passed, -6 failed');
      stdout.should.include('FAIL  | 2 passed, 2 failed');
      assert(err);
      done();
    });
  });

  it('should use grep', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version');
    exec(`${codecept_run} 2 --grep "grep"`, (err, stdout) => {
      stdout.should.include('CodeceptJS'); // feature
      stdout.should.not.include('glob current dir');
      stdout.should.include('From worker @1_grep print message 1');
      stdout.should.include('From worker @2_grep print message 2');
      stdout.should.include('Running tests in 2 workers');
      stdout.should.not.include('this is running inside worker');
      stdout.should.not.include('failed');
      stdout.should.not.include('File notafile not found');
      assert(!err);
      done();
    });
  });

  it('should show failures when suite is failing', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version');
    exec(`${codecept_run} 2 --grep "Workers Failing"`, (err, stdout) => {
      stdout.should.include('CodeceptJS'); // feature
      stdout.should.include('Running tests in 2 workers');
      stdout.should.not.include('should not be executed');
      stdout.should.not.include('this is running inside worker');
      stdout.should.include('failed');
      stdout.should.include('FAILURES');
      stdout.should.include('worker has failed');
      assert(err.code === 1, 'failure');
      done();
    });
  });

  it('should print stdout in debug mode and load bootstrap', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version');
    exec(`${codecept_run} 1 --grep "grep" --debug`, (err, stdout) => {
      stdout.should.include('CodeceptJS'); // feature
      stdout.should.include('Running tests in 1 workers');
      stdout.should.include('bootstrap b1+b2');
      stdout.should.include('message 1');
      stdout.should.include('message 2');
      stdout.should.include('see this is worker');
      assert(!err);
      done();
    });
  });

  it('should run tests with glob pattern', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version');
    exec(`${codecept_run_glob('codecept.workers-glob.conf.js')} 1 --grep "grep" --debug`, (err, stdout) => {
      stdout.should.include('CodeceptJS'); // feature
      stdout.should.include('Running tests in 1 workers');
      stdout.should.include('bootstrap b1+b2');
      stdout.should.include('message 1');
      stdout.should.include('message 2');
      stdout.should.include('see this is worker');
      assert(!err);
      done();
    });
  });

  it('should print empty results with incorrect glob pattern', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version');
    exec(`${codecept_run_glob('codecept.workers-incorrect-glob.conf.js')} 1 --grep "grep" --debug`, (err, stdout) => {
      stdout.should.include('CodeceptJS'); // feature
      stdout.should.include('Running tests in 1 workers');
      stdout.should.include('OK  | 0 passed');
      assert(!err);
      done();
    });
  });

  it('should retry test', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version');
    exec(`${codecept_run} 2 --grep "retry"`, (err, stdout) => {
      stdout.should.include('CodeceptJS'); // feature
      stdout.should.include('OK  | 1 passed');
      done();
    });
  });

  it('should create output folder with custom name', function (done) {
    const fs = require('fs');
    const customName = 'thisIsCustomOutputFolderName';
    const outputDir = `${codecept_dir}/${customName}`;
    let createdOutput = false;

    if (fs.existsSync(outputDir)) {
      fs.rmdirSync(outputDir, { recursive: true });
    }

    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version');
    const configFileName = 'codecept.workers-custom-output-folder-name.conf.js';
    exec(`${codecept_run_glob(configFileName)} 2 --grep "grep" --debug`, (err, stdout) => {
      stdout.should.include(customName);
      if (fs.existsSync(outputDir)) {
        createdOutput = true;
      }
      assert(createdOutput, 'The output folder is not created');
      assert(!err);
      done();
    });
  });
});
