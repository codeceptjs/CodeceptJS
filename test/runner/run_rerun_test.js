const assert = require('assert');
const path = require('path');
const expect = require('chai').expect;

const exec = require('child_process').exec;

const runner = path.join(__dirname, '/../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox/configs/run-rerun/');
const codecept_run = `${runner} run-rerun`;
const codecept_run_config = config => `${codecept_run} --config ${codecept_dir}/${config}`;

describe('run-rerun command', () => {
  before(() => {
    process.chdir(codecept_dir);
  });

  it('should display count of attemps', (done) => {
    exec(`${codecept_run_config('codecept.conf.js')} --debug`, (err, stdout) => {
      console.log(stdout);
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
});
