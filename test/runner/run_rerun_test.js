const assert = require('assert');
const path = require('path');
const expect = require('chai').expect;

const exec = require('child_process').exec;

const runner = path.join(__dirname, '/../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox/configs/run-rerun/');
const codecept_run = `${runner} run-rerun`;
const codecept_run_config = (config, grep) => `${codecept_run} --config ${codecept_dir}/${config} --grep "${grep || ''}"`;

describe('run-rerun command', () => {
  before(() => {
    process.chdir(codecept_dir);
  });

  it('should display count of attemps', (done) => {
    exec(`${codecept_run_config('codecept.conf.js')} --debug`, (err, stdout) => {
      stdout.should.include(`
Run Rerun - Command --
  @RunRerun
    I print message "RunRerun"
RunRerun
  ✔ OK`);
      stdout.should.include(`
Run Rerun - Command --
  @RunRerun
    I print message "RunRerun"
    I print message "RunRerun"
RunRerun
  ✔ OK`);
      stdout.should.include(`
Run Rerun - Command --
  @RunRerun
    I print message "RunRerun"
    I print message "RunRerun"
    I print message "RunRerun"
RunRerun
  ✔ OK`);
      stdout.should.include('Process run 1 of max 3, success runs 1/3 ');
      stdout.should.include('Process run 2 of max 3, success runs 2/3 ');
      stdout.should.include('Process run 3 of max 3, success runs 3/3 ');
      stdout.should.include('OK  | 1 passed');
      assert(!err);
      done();
    });
  });

  it('should display 2 success count of attemps', (done) => {
    exec(`${codecept_run_config('codecept.conf.min_less_max.js')} --debug`, (err, stdout) => {
      stdout.should.include(`
Run Rerun - Command --
  @RunRerun
    I print message "RunRerun"
RunRerun
  ✔ OK`);
      stdout.should.include(`
Run Rerun - Command --
  @RunRerun
    I print message "RunRerun"
    I print message "RunRerun"
RunRerun
  ✔ OK`);
      stdout.should.not.include(`
Run Rerun - Command --
  @RunRerun
    I print message "RunRerun"
    I print message "RunRerun"
    I print message "RunRerun"
RunRerun
  ✔ OK`);
      stdout.should.include('Process run 1 of max 3, success runs 1/2 ');
      stdout.should.include('Process run 2 of max 3, success runs 2/2 ');
      stdout.should.not.include('Process run 3 of max 3');
      stdout.should.include('OK  | 1 passed');
      assert(!err);
      done();
    });
  });

  it('should display error if minSuccess more then maxReruns', (done) => {
    exec(`${codecept_run_config('codecept.conf.min_more_max.js')} --debug`, (err, stdout) => {
      stdout.should.include('minSuccess must be less then maxReruns');
      assert(err);
      done();
    });
  });

  it('should display errors if test is fail always', (done) => {
    exec(`${codecept_run_config('codecept.conf.fail_test.js', '@RunRerun - Fail all attempt')} --debug`, (err, stdout) => {
      stdout.should.include('Fail run 1 of max 3, success runs 0/2 ');
      stdout.should.include('Fail run 2 of max 3, success runs 0/2 ');
      stdout.should.include('Fail run 3 of max 3, success runs 0/2 ');
      stdout.should.include('Test suite unstable!');
      assert(err);
      done();
    });
  });

  it('should display success run if test was fail one time of two attepmts and 3 reruns', (done) => {
    exec(`FAIL_ATTEMPT=0  ${codecept_run_config('codecept.conf.fail_test.js', '@RunRerun - fail second test')} --debug`, (err, stdout) => {
      stdout.should.include('Process run 1 of max 3, success runs 1/2');
      stdout.should.include('Fail run 2 of max 3, success runs 1/2');
      stdout.should.include('Process run 3 of max 3, success runs 2/2');
      stdout.should.not.include('Test suite unstable!');
      assert(!err);
      done();
    });
  });
});
