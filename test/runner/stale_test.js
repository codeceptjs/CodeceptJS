const { expect } = require('expect');
const path = require('path');
const exec = require('child_process').exec;

const runner = path.join(__dirname, '/../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox');
const codecept_run = `${runner} run`;
const config_run_config = config => `${codecept_run} --config ${codecept_dir}/${config}`;

describe('CodeceptJS Interface', () => {
  before(() => {
    process.chdir(codecept_dir);
  });

  it('Should always failed and terminate', (done) => {
    exec(config_run_config('codecept.stale.js'), (err, stdout) => {
      console.log('err', err);
      console.log('stdout',stdout)
      expect(stdout).toContain('@@@Flaky error'); // feature
      expect(err).toBeTruthy();
      done();
    });
  });

});
