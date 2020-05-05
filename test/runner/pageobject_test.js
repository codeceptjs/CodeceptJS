const assert = require('assert');
const path = require('path');
const exec = require('child_process').exec;

const runner = path.join(__dirname, '/../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox/configs/pageObjects');
const codecept_run = `${runner} run`;
const config_run_config = (config, grep) => `${codecept_run} --config ${codecept_dir}/${config} ${grep ? `--grep "${grep}"` : ''}`;

describe('CodeceptJS Interface', () => {
  before(() => {
    process.chdir(codecept_dir);
  });

  it('should inject page objects by class', (done) => {
    exec(`${config_run_config('codecept.conf.js', '@ClassPageObject')} --debug`, (err, stdout) => {
      stdout.should.not.include('classpage.type is not a function');
      stdout.should.include('classpage: type');
      stdout.should.include('I print message "Class Page Type"');
      stdout.should.include('classpage: purgeDomains');
      stdout.should.include('I print message "purgeDomains"');
      stdout.should.include('Class Page Type');
      stdout.should.include('OK  | 1 passed');
      assert(!err);
      done();
    });
  });

  it('should inject page objects by class which nested base clas', (done) => {
    exec(`${config_run_config('codecept.conf.js', '@NestedClassPageObject')} --debug`, (err, stdout) => {
      stdout.should.not.include('classnestedpage.type is not a function');
      stdout.should.include('classnestedpage: type');
      stdout.should.include('user => User1');
      stdout.should.include('I print message "Nested Class Page Type"');
      stdout.should.include('classnestedpage: purgeDomains');
      stdout.should.include('I print message "purgeDomains"');
      stdout.should.include('Nested Class Page Type');
      stdout.should.include('OK  | 1 passed');
      assert(!err);
      done();
    });
  });
});
