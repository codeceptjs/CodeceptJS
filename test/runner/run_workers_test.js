const expect = require('expect');
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
      expect(stdout).toContain('CodeceptJS'); // feature
      expect(stdout).toContain('glob current dir');
      expect(stdout).toContain('From worker @1_grep print message 1');
      expect(stdout).toContain('From worker @2_grep print message 2');
      expect(stdout).toContain('Running tests in 3 workers');
      expect(stdout).not.toContain('this is running inside worker');
      expect(stdout).toContain('failed');
      expect(stdout).toContain('File notafile not found');
      expect(stdout).toContain('Scenario Steps:');
      expect(err.code).toBe(1);
      done();
    });
  });

  it('should print positive or zero failures with same name tests', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version');
    exec(`${codecept_run_glob('configs/workers/codecept.workers-negative.conf.js')} 2`, (err, stdout) => {
      expect(stdout).toContain('Running tests in 2 workers...');
      expect(stdout).not.toContain('FAIL  | 2 passed, -6 failed');
      expect(stdout).toContain('FAIL  | 2 passed, 2 failed');
      expect(err).toBeTruthy();
      done();
    });
  });

  it('should use grep', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version');
    exec(`${codecept_run} 2 --grep "grep"`, (err, stdout) => {
      expect(stdout).toContain('CodeceptJS'); // feature
      expect(stdout).not.toContain('glob current dir');
      expect(stdout).toContain('From worker @1_grep print message 1');
      expect(stdout).toContain('From worker @2_grep print message 2');
      expect(stdout).toContain('Running tests in 2 workers');
      expect(stdout).not.toContain('this is running inside worker');
      expect(stdout).not.toContain('failed');
      expect(stdout).not.toContain('File notafile not found');
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should show failures when suite is failing', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version');
    exec(`${codecept_run} 2 --grep "Workers Failing"`, (err, stdout) => {
      expect(stdout).toContain('CodeceptJS'); // feature
      expect(stdout).toContain('Running tests in 2 workers');
      expect(stdout).not.toContain('should not be executed');
      expect(stdout).not.toContain('this is running inside worker');
      expect(stdout).toContain('failed');
      expect(stdout).toContain('FAILURES');
      expect(stdout).toContain('worker has failed');
      expect(err.code).toBe(1);
      done();
    });
  });

  it('should print stdout in debug mode and load bootstrap', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version');
    exec(`${codecept_run} 1 --grep "grep" --debug`, (err, stdout) => {
      expect(stdout).toContain('CodeceptJS'); // feature
      expect(stdout).toContain('Running tests in 1 workers');
      expect(stdout).toContain('bootstrap b1+b2');
      expect(stdout).toContain('message 1');
      expect(stdout).toContain('message 2');
      expect(stdout).toContain('see this is worker');
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should run tests with glob pattern', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version');
    exec(`${codecept_run_glob('codecept.workers-glob.conf.js')} 1 --grep "grep" --debug`, (err, stdout) => {
      expect(stdout).toContain('CodeceptJS'); // feature
      expect(stdout).toContain('Running tests in 1 workers');
      expect(stdout).toContain('bootstrap b1+b2');
      expect(stdout).toContain('message 1');
      expect(stdout).toContain('message 2');
      expect(stdout).toContain('see this is worker');
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should print empty results with incorrect glob pattern', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version');
    exec(`${codecept_run_glob('codecept.workers-incorrect-glob.conf.js')} 1 --grep "grep" --debug`, (err, stdout) => {
      expect(stdout).toContain('CodeceptJS'); // feature
      expect(stdout).toContain('Running tests in 1 workers');
      expect(stdout).toContain('OK  | 0 passed');
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should retry test', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version');
    exec(`${codecept_run} 2 --grep "retry"`, (err, stdout) => {
      expect(stdout).toContain('CodeceptJS'); // feature
      expect(stdout).toContain('OK  | 1 passed');
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
      expect(stdout).toContain(customName);
      if (fs.existsSync(outputDir)) {
        createdOutput = true;
      }
      expect(createdOutput).toBeTruthy();
      expect(err).toBeFalsy();
      done();
    });
  });
});
