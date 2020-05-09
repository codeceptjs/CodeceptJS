const assert = require('assert');
const path = require('path');
const exec = require('child_process').exec;

const runner = path.join(__dirname, '/../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox');
const codecept_run = `${runner} run`;
const config_run_config = config => `${codecept_run} --config ${codecept_dir}/${config}`;

describe('BDD Gherkin', () => {
  before(() => {
    process.chdir(codecept_dir);
  });

  it('should run feature files', (done) => {
    exec(config_run_config('codecept.bdd.json') + ' --steps --grep "Checkout process"', (err, stdout, stderr) => { //eslint-disable-line
      stdout.should.include('Checkout process'); // feature
      stdout.should.include('-- before checkout --');
      stdout.should.include('-- after checkout --');
      // stdout.should.include('In order to buy products'); // test name
      stdout.should.include('Given I have product with $600 price');
      stdout.should.include('And I have product with $1000 price');
      stdout.should.include('Then I should see that total number of products is 2');
      stdout.should.include('And my order amount is $1600');
      stdout.should.not.include('I add item 600'); // 'Given' actor's non-gherkin step check
      stdout.should.not.include('I see sum 1600'); // 'And' actor's non-gherkin step check
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

  it('should print events in nodejs debug mode', (done) => {
    exec(config_run_config('codecept.bdd.json') + ' --grep "Checkout products" --verbose', { env: { DEBUG: 'codeceptjs:*' } }, (err, stdout, stderr) => { //eslint-disable-line
      stderr.should.include('Emitted | step.start (I add product "Harry Potter", 5)');
      stdout.should.include('name            | category        | price');
      stdout.should.include('Harry Potter    | Books           | 5');
      stdout.should.include('iPhone 5        | Smartphones     | 1200 ');
      stdout.should.include('Nuclear Bomb    | Weapons         | 100000');
      assert(!err);
      done();
    });
  });

  it('should obfuscate secret substeps in debug mode', (done) => {
    exec(config_run_config('codecept.bdd.json') + ' --debug --grep "Secrets"', (err, stdout, stderr) => { //eslint-disable-line
      stdout.should.include('Given I login'); // feature
      stdout.should.not.include('password');
      assert(!err);
      done();
    });
  });

  it('should run feature with examples files', (done) => {
    exec(config_run_config('codecept.bdd.json') + ' --steps --grep "Checkout examples"', (err, stdout, stderr) => { //eslint-disable-line
      stdout.should.include(' order discount {"price":"10","total":"10.0"}');
      stdout.should.include(' Given I have product with price 10$ in my cart');

      stdout.should.include(' order discount {"price":"20","total":"20.0"}');
      stdout.should.include(' Given I have product with price 20$ in my cart');

      stdout.should.include(' order discount {"price":"21","total":"18.9"}');
      stdout.should.include(' Given I have product with price 21$ in my cart');

      stdout.should.include(' order discount {"price":"30","total":"27.0"}');
      stdout.should.include(' Given I have product with price 30$ in my cart');

      stdout.should.include(' order discount {"price":"50","total":"45.0"}');
      stdout.should.include(' Given I have product with price 50$ in my cart');
      assert(!err);
      done();
    });
  });

  it('should run feature with table and examples files', (done) => {
    exec(config_run_config('codecept.bdd.json') + ' --steps --grep "Include Examples in dataTtable placeholder"', (err, stdout, stderr) => { //eslint-disable-line
      stdout.should.include('name            | Nuclear Bomb ');
      stdout.should.include('price           | 20 ');
      stdout.should.include('name            | iPhone 5 ');
      stdout.should.include('price           | 10 ');
      assert(!err);
      done();
    });
  });

  it('should run feature with tables', (done) => {
    exec(config_run_config('codecept.bdd.json') + ' --steps --grep "Checkout products"', (err, stdout, stderr) => { //eslint-disable-line
      stdout.should.include('Given I have products in my cart');
      stdout.should.include('name');
      stdout.should.include('Harry Potter');
      stdout.should.include('Smartphones');
      stdout.should.include('100000');
      stdout.should.include('Then my order amount is $101205');
      assert(!err);
      done();
    });
  });

  it('should run feature with long strings', (done) => {
    exec(config_run_config('codecept.bdd.json') + ' --steps --grep "Checkout string"', (err, stdout, stderr) => { //eslint-disable-line
      stdout.should.include('Given I have product described as');
      stdout.should.include('The goal of the product description is to provide the customer with enough information to compel them to want to buy the product immediately.');
      stdout.should.include('Then my order amount is $582');
      assert(!err);
      done();
    });
  });

  it('should run feature by file name', (done) => {
    exec(config_run_config('codecept.bdd.json') + ' --steps features/tables.feature', (err, stdout, stderr) => { //eslint-disable-line
      stdout.should.include('Checkout product');
      stdout.should.include('checkout 3 products');
      stdout.should.not.include('Checkout string');
      stdout.should.not.include('describe product');
      stdout.should.not.include('Checkout process');
      stdout.should.not.include('Checkout examples process');
      assert(!err);
      done();
    });
  });

  it('should run feature by scenario name', (done) => {
    exec(config_run_config('codecept.bdd.json') + ' --grep "checkout 3 products" --steps', (err, stdout, stderr) => { //eslint-disable-line
      stdout.should.include('Checkout product');
      stdout.should.include('checkout 3 products');
      stdout.should.not.include('Checkout string');
      stdout.should.not.include('describe product');
      stdout.should.not.include('Checkout process');
      stdout.should.not.include('Checkout examples process');
      assert(!err);
      done();
    });
  });

  it('should run feature by tag name', (done) => {
    exec(config_run_config('codecept.bdd.json') + ' --grep "@important" --steps', (err, stdout, stderr) => { //eslint-disable-line
      stdout.should.include('I have product with $600 price in my cart');
      stdout.should.not.include('Checkout string');
      stdout.should.not.include('describe product');
      stdout.should.not.include('Checkout table');
      stdout.should.not.include('Checkout examples process');
      assert(!err);
      done();
    });
  });

  it('should run scenario by tag name', (done) => {
    exec(config_run_config('codecept.bdd.json') + ' --grep "@very" --steps', (err, stdout, stderr) => { //eslint-disable-line
      stdout.should.include('I have product with $600 price in my cart');
      stdout.should.not.include('Checkout string');
      stdout.should.not.include('describe product');
      stdout.should.not.include('Checkout table');
      stdout.should.not.include('Checkout examples process');
      assert(!err);
      done();
    });
  });

  it('should run scenario outline by tag', (done) => {
    exec(config_run_config('codecept.bdd.json') + ' --grep "@user" --steps', (err, stdout, stderr) => { //eslint-disable-line
      stdout.should.not.include('0 passed');
      stdout.should.include('I have product with price 10$');
      assert(!err);
      done();
    });
  });


  it('should run scenario and scenario outline by tags', (done) => {
    exec(config_run_config('codecept.bdd.json') + ' --grep "\@user|\@very" --steps', (err, stdout, stderr) => { //eslint-disable-line
      stdout.should.not.include('0 passed');
      stdout.should.include('I have product with price 10$');
      stdout.should.include('I have product with $600 price in my cart');
      stdout.should.include('6 passed');
      assert(!err);
      done();
    });
  });

  it('should show all available steps', (done) => {
    exec(`${runner} gherkin:steps --config ${codecept_dir}/codecept.bdd.json`, (err, stdout, stderr) => { //eslint-disable-line
      stdout.should.include('Gherkin');
      stdout.should.include('/I have product with \\$(\\d+) price/');
      stdout.should.include('step_definitions/my_steps.js:3:1');
      stdout.should.include('step_definitions/my_steps.js:3:1');
      stdout.should.include('I should see that total number of products is {int}');
      stdout.should.include('I should see overall price is "{float}" $');
      assert(!err);
      done();
    });
  });

  it('should generate snippets for missing steps', (done) => {
    exec(`${runner} gherkin:snippets --dry-run --config ${codecept_dir}/codecept.dummy.bdd.json`, (err, stdout, stderr) => { //eslint-disable-line
      stdout.should.include(`Given('I open a browser on a site', () => {
  // From "support/dummy.feature" {"line":4,"column":5}
  throw new Error('Not implemented yet');
});

When('I click login button at {float}', () => {
  // From "support/dummy.feature" {"line":5,"column":5}
  throw new Error('Not implemented yet');
});

When('I enter username {string} and password {string}', () => {
  // From "support/dummy.feature" {"line":6,"column":5}
  throw new Error('Not implemented yet');
});

When('I submit {int} form', () => {
  // From "support/dummy.feature" {"line":7,"column":5}
  throw new Error('Not implemented yet');
});

Then('I should log in', () => {
  // From "support/dummy.feature" {"line":8,"column":5}
  throw new Error('Not implemented yet');
});

When(/^I define a step with an opening paren \\( only$/, () => {
  // From "support/dummy.feature" {"line":9,"column":5}
  throw new Error('Not implemented yet');
});

When(/^I define a step with a closing paren \\) only$/, () => {
  // From "support/dummy.feature" {"line":10,"column":5}
  throw new Error('Not implemented yet');
});

When(/^I define a step with a opening brace \\{ only$/, () => {
  // From "support/dummy.feature" {"line":11,"column":5}
  throw new Error('Not implemented yet');
});

When(/^I define a step with a closing brace \\} only$/, () => {
  // From "support/dummy.feature" {"line":12,"column":5}
  throw new Error('Not implemented yet');
});

When(/^I define a step with a slash http:\\/\\/example\\.com\\/foo$/, () => {
  // From "support/dummy.feature" {"line":13,"column":5}
  throw new Error('Not implemented yet');
});

When(/^I define a step with a \\( paren and an (\\d+) int$/, () => {
  // From "support/dummy.feature" {"line":14,"column":5}
  throw new Error('Not implemented yet');
});

When(/^I define a step with a \\( paren and a (\\d+\\.\\d+) float$/, () => {
  // From "support/dummy.feature" {"line":15,"column":5}
  throw new Error('Not implemented yet');
});

When(/^I define a step with a \\( paren and a "(.*?)" string$/, () => {
  // From "support/dummy.feature" {"line":16,"column":5}
  throw new Error('Not implemented yet');
});`);
      assert(!err);
      done();
    });
  });

  it('should not generate duplicated steps', (done) => {
    exec(`${runner} gherkin:snippets --dry-run --config ${codecept_dir}/codecept.duplicate.bdd.json`, (err, stdout, stderr) => { //eslint-disable-line
      assert.equal(stdout.match(/I open a browser on a site/g).length, 1);
      assert(!err);
      done();
    });
  });
});
