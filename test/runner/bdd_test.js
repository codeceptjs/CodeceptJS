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
    exec(config_run_config('codecept.bdd.json') + ' --steps', (err, stdout, stderr) => { //eslint-disable-line
      stdout.should.include('Checkout process'); // feature
      // stdout.should.include('In order to buy products'); // test name
      stdout.should.include('Given I have product with $600 price');
      stdout.should.include('And I have product with $1000 price');
      stdout.should.include('Then I should see that total number of products is 2');
      stdout.should.include('And my order amount is $1600');
      assert(!err);
      done();
    });
  });
});
