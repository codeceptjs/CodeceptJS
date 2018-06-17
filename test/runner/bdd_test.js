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
    exec(config_run_config('codecept.bdd.json') + ' --steps --grep "Checkout process"', (err, stdout, stderr) => { //eslint-disable-line
      stdout.should.include('Checkout process'); // feature
      // stdout.should.include('In order to buy products'); // test name
      stdout.should.include('Given I have product with $600 price');
      stdout.should.include('And I have product with $1000 price');
      stdout.should.include('Then I should see that total number of products is 2');
      stdout.should.include('And my order amount is $1600');
      stdout.should.not.include('I add item 600');
      assert(!err);
      done();
    });
  });

  it('should print substeps in debug mode', (done) => {
    exec(config_run_config('codecept.bdd.json') + ' --debug --grep "Checkout process"', (err, stdout, stderr) => { //eslint-disable-line
      stdout.should.include('Checkout process'); // feature
      // stdout.should.include('In order to buy products'); // test name
      stdout.should.include('Given I have product with $600 price');
      stdout.should.include('I add item 600');
      stdout.should.include('And I have product with $1000 price');
      stdout.should.include('I add item 1000');
      stdout.should.include('Then I should see that total number of products is 2');
      stdout.should.include('I see num 2');
      stdout.should.include('And my order amount is $1600');
      stdout.should.include('I see sum 1600');
      assert(!err);
      done();
    });
  });

  it('should run feature with examples files', (done) => {
    exec(config_run_config('codecept.bdd.json') + ' --steps --grep "Checkout examples"', (err, stdout, stderr) => { //eslint-disable-line
      stdout.should.include(' order discount {"price":"10","total":"10.0"}');
      stdout.should.include('   Given I have product with price 10$ in my cart');

      stdout.should.include(' order discount {"price":"20","total":"20.0"}');
      stdout.should.include('   Given I have product with price 20$ in my cart');

      stdout.should.include(' order discount {"price":"21","total":"18.9"}');
      stdout.should.include('   Given I have product with price 21$ in my cart');

      stdout.should.include(' order discount {"price":"30","total":"27.0"}');
      stdout.should.include('   Given I have product with price 30$ in my cart');

      stdout.should.include(' order discount {"price":"50","total":"45.0"}');
      stdout.should.include('   Given I have product with price 50$ in my cart');
      assert(!err);
      done();
    });
  });
});
