const assert = require('assert');
const path = require('path');
const exec = require('child_process').exec;

const runner = path.join(__dirname, '/../../bin/codecept.js');
const codecept_dir = path.join(
  __dirname,
  '/../data/sandbox/configs/commentStep',
);
const codecept_run = `${runner} run`;
const config_run_config = (config, grep) => `${codecept_run} --config ${codecept_dir}/${config} ${
  grep ? `--grep "${grep}"` : ''
}`;

describe('CodeceptJS commentStep plugin', function () {
  this.timeout(3000);

  before(() => {
    process.chdir(codecept_dir);
  });

  it('should print nested steps when global var comments used', done => {
    exec(
      `${config_run_config('codecept.conf.js', 'global var')} --debug`,
      (err, stdout) => {
        stdout.should.include(
          `    Prepare user base
      I print "other thins"
    Update data
      I print "do some things"
    Check the result
      I print "see everything works"`,
        );
        assert(!err);
        done();
      },
    );
  });

  it('should print nested steps when local var comments used', done => {
    exec(
      `${config_run_config('codecept.conf.js', 'local var')} --debug`,
      (err, stdout) => {
        stdout.should.include(
          `    Prepare project
      I print "other thins"
    Update project
      I print "do some things"
    Check project
      I print "see everything works"`,
        );
        assert(!err);
        done();
      },
    );
  });
});
