const expect = require('expect');
const { describe } = require('mocha');
const path = require('path');
const exec = require('child_process').exec;
const semver = require('semver');

const runner = path.join(__dirname, '/../../bin/hermiona.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox/configs/run-rerun/');
const codecept_run = `${runner} run-rerun`;
const codecept_run_config = (config, grep) => `${codecept_run} --config ${codecept_dir}/${config} --grep "${grep || ''}"`;

describe('run-rerun command', () => {
  before(() => {
    process.chdir(codecept_dir);
  });

  it('should display count of attemps', (done) => {
    exec(`${codecept_run_config('hermiona.conf.js')} --debug`, (err, stdout) => {
      const runs = stdout.split('Run Rerun - Command --');

      // check first run
      expect(runs[1]).toContain('OK  | 1 passed');
      expect(runs[1]).toContain('✔ OK');

      // check second run
      expect(runs[2]).toContain('OK  | 1 passed');
      expect(runs[2]).toContain('✔ OK');

      // check third run
      expect(runs[2]).toContain('OK  | 1 passed');
      expect(runs[2]).toContain('✔ OK');

      expect(stdout).toContain('Process run 1 of max 3, success runs 1/3');
      expect(stdout).toContain('Process run 2 of max 3, success runs 2/3');
      expect(stdout).toContain('Process run 3 of max 3, success runs 3/3');
      expect(stdout).toContain('OK  | 1 passed');
      expect(err).toBeNull();
      done();
    });
  });

  it('should display 2 success count of attemps', (done) => {
    exec(`${codecept_run_config('codecept.conf.min_less_max.js')} --debug`, (err, stdout) => {
      const runs = stdout.split('Run Rerun - Command --');

      // check first run
      expect(runs[2]).toContain('OK  | 1 passed');
      expect(runs[2]).toContain('✔ OK');

      // check second run
      expect(runs[2]).toContain('OK  | 1 passed');
      expect(runs[2]).toContain('✔ OK');

      expect(stdout).toContain('Process run 1 of max 3, success runs 1/2');
      expect(stdout).toContain('Process run 2 of max 3, success runs 2/2');
      expect(stdout).not.toContain('Process run 3 of max 3');
      expect(stdout).toContain('OK  | 1 passed');
      expect(err).toBeNull();
      done();
    });
  });

  it('should display error if minSuccess more than maxReruns', (done) => {
    exec(`${codecept_run_config('codecept.conf.min_more_max.js')} --debug`, (err, stdout) => {
      expect(stdout).toContain('minSuccess must be less than maxReruns');
      expect(err.code).toBe(1);
      done();
    });
  });

  it('should display errors if test is fail always', (done) => {
    exec(`${codecept_run_config('codecept.conf.fail_test.js', '@RunRerun - Fail all attempt')} --debug`, (err, stdout) => {
      expect(stdout).toContain('Fail run 1 of max 3, success runs 0/2');
      expect(stdout).toContain('Fail run 2 of max 3, success runs 0/2');
      expect(stdout).toContain('Fail run 3 of max 3, success runs 0/2');
      expect(stdout).toContain('Flaky tests detected!');
      expect(err.code).toBe(1);
      done();
    });
  });

  it('should display success run if test was fail one time of two attepmts and 3 reruns', (done) => {
    exec(`FAIL_ATTEMPT=0  ${codecept_run_config('codecept.conf.fail_test.js', '@RunRerun - fail second test')} --debug`, (err, stdout) => {
      expect(stdout).toContain('Process run 1 of max 3, success runs 1/2');
      expect(stdout).toContain('Fail run 2 of max 3, success runs 1/2');
      expect(stdout).toContain('Process run 3 of max 3, success runs 2/2');
      expect(stdout).not.toContain('Flaky tests detected!');
      expect(err).toBeNull();
      done();
    });
  });
});
