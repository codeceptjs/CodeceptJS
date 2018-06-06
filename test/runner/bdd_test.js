const assert = require('assert');
const path = require('path');
const exec = require('child_process').exec;

const runner = path.join(__dirname, '/../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox');
const codecept_run = `${runner} run`;
const config_run_config = config => `${codecept_run} --config ${codecept_dir}/${config}`;
const config_run_override = config => `${codecept_run} --override '${JSON.stringify(config)}'`;

describe('CodeceptJS Interface', () => {
  before(() => {
    process.chdir(codecept_dir);
  });

  it('should run feature files', (done) => {
    exec(config_run_config('codecept.bdd.json'), (err, stdout, stderr) => {
      stdout.should.include('BDD'); // feature
      stdout.should.include('checkout process'); // test name
      stdout.should.include('In order to buy products'); // test name
      stdout.should.include('Given I have product with 600 price'); // test name
      assert(!err);
      done();
    });
  });
});
