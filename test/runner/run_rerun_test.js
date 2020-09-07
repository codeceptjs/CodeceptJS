const assert = require('assert');
const path = require('path');
const expect = require('expect');
const { isToken } = require('typescript');

const exec = require('child_process').exec;
const execSync = require('child_process').execSync;

const runner = path.join(__dirname, '/../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox/configs/run-rerun/');
const codecept_run = `${runner} run`;
const codecept_run_workers = `${runner} rerun-workers`;
const codecept_run_config = (config, grep) => `${codecept_run} --rerun --config ${codecept_dir}/${config} --grep "${grep || ''}"`;
const codecept_run_workers_config = (config, grep) => `${codecept_run_workers} 2 --config ${codecept_dir}/${config} --grep "${grep || ''}"`;

describe('run with --rerun command', () => {
  before(() => {
    process.chdir(codecept_dir);
  });

  describe('single thread', () => {
    it('should display count of attemps', (done) => {
      exec(`${codecept_run_config('codecept.conf.js')} --debug`, (err, stdout, stderr) => {
        expect(stdout).toContain(`
Run Rerun - Command --
  @RunRerun
    I print message "RunRerun"
RunRerun
  ✔ OK`);
        expect(stdout).toContain(`
Run Rerun - Command --
  @RunRerun
    I print message "RunRerun"
    I print message "RunRerun"
RunRerun
  ✔ OK`);
        expect(stdout).toContain(`
Run Rerun - Command --
  @RunRerun
    I print message "RunRerun"
    I print message "RunRerun"
    I print message "RunRerun"
RunRerun
  ✔ OK`);
        expect(stdout).toContain('Process run 1 of max 3, success runs 1/3');
        expect(stdout).toContain('Process run 2 of max 3, success runs 2/3');
        expect(stdout).toContain('Process run 3 of max 3, success runs 3/3');
        expect(stdout).toContain('OK  | 1 passed');
        assert(!err);
        done();
      });
    });

    it('should display 2 success count of attemps', (done) => {
      exec(`${codecept_run_config('codecept.conf.min_less_max.js')} --debug`, (err, stdout) => {
        expect(stdout).toContain(`
Run Rerun - Command --
  @RunRerun
    I print message "RunRerun"
RunRerun
  ✔ OK`);
        expect(stdout).toContain(`
Run Rerun - Command --
  @RunRerun
    I print message "RunRerun"
    I print message "RunRerun"
RunRerun
  ✔ OK`);
        expect(stdout).not.toContain(`
Run Rerun - Command --
  @RunRerun
    I print message "RunRerun"
    I print message "RunRerun"
    I print message "RunRerun"
RunRerun
  ✔ OK`);
        expect(stdout).toContain('Process run 1 of max 3, success runs 1/2');
        expect(stdout).toContain('Process run 2 of max 3, success runs 2/2');
        expect(stdout).not.toContain('Process run 3 of max 3');
        expect(stdout).toContain('OK  | 1 passed');
        assert(!err);
        done();
      });
    });

    it('should display error if minSuccess more than maxReruns', (done) => {
      exec(`${codecept_run_config('codecept.conf.min_more_max.js')} --debug`, (err, stdout) => {
        expect(stdout).toContain('minSuccess must be less than maxReruns');
        assert(err);
        done();
      });
    });

    it('should display errors if test is fail always', (done) => {
      exec(`${codecept_run_config('codecept.conf.fail_test.js', '@RunRerun - Fail all attempt')} --debug`, (err, stdout) => {
        expect(stdout).toContain('Fail run 1 of max 3, success runs 0/2');
        expect(stdout).toContain('Fail run 2 of max 3, success runs 0/2');
        expect(stdout).toContain('Fail run 3 of max 3, success runs 0/2');
        expect(stdout).toContain('Flaky tests detected!');
        assert(err);
        done();
      });
    });

    it('should display success run if test was fail one time of two attepmts and 3 reruns', (done) => {
      exec(`FAIL_ATTEMPT=0  ${codecept_run_config('codecept.conf.fail_test.js', '@RunRerun - fail second test')} --debug`, (err, stdout) => {
        expect(stdout).toContain('Process run 1 of max 3, success runs 1/2');
        expect(stdout).toContain('Fail run 2 of max 3, success runs 1/2');
        expect(stdout).toContain('Process run 3 of max 3, success runs 2/2');
        expect(stdout).not.toContain('Flaky tests detected!');
        assert(!err);
        done();
      });
    });
  });

  describe('workers', () => {
    it('should display count of attemps', (done) => {
      exec(`${codecept_run_workers_config('codecept.conf.js')} --debug`, (err, stdout) => {
        console.log(stdout);
        expect(stdout).toContain('Process run 1 of max 3, success runs 1/3');
        expect(stdout).toContain('Process run 2 of max 3, success runs 2/3');
        expect(stdout).toContain('Process run 3 of max 3, success runs 3/3');
        expect(stdout).toContain('OK  | 3 passed');
        assert(!err);
        done();
      });
    });

    it.only('should display count of attemps', (done) => {
      exec(`${codecept_run_workers_config('codecept.conf.fail_test.js', '@RunRerun - Fail all attempt')} --debug`, (err, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        expect(stdout).toContain('Fail run 1 of max 3, success runs 0/2');
        expect(stdout).toContain('Fail run 2 of max 3, success runs 0/2');
        expect(stdout).toContain('Fail run 3 of max 3, success runs 0/2');
        expect(stdout).toContain('Flaky tests detected!');
        assert(err);
        done();
      });
    });
  });
});
