import assert from 'assert';
import { expect } from 'chai';
import path from 'path';
import { exec } from 'child_process';

const __dirname = path.resolve('.');
const runner = path.join(__dirname, 'bin/codecept.js');
const codecept_dir = path.join(__dirname, 'test/data/sandbox');
const codecept_run = `${runner} run`;
const config_run_config = config => `${codecept_run} --config ${codecept_dir}/${config}`;

describe('BDD Gherkin', () => {
  before(() => {
    process.chdir(codecept_dir);
  });

  it('should run feature files', (done) => {
    exec(config_run_config('codecept.bdd.js') + ' --verbose --grep "Checkout process"', (err, stdout, stderr) => { //eslint-disable-line
      console.log(`${config_run_config('codecept.bdd.js')} --verbose --grep "Checkout process"`);
      console.log(stdout)
      expect(stdout).to.include('Checkout process'); // feature
      expect(stdout).to.include('-- before checkout --');
      expect(stdout).to.include('-- after checkout --');
      // expect(stdout).to.include('In order to buy products'); // test name
      expect(stdout).to.include('Given I have product with $600 price');
      expect(stdout).to.include('And I have product with $1000 price');
      expect(stdout).to.include('Then I should see that total number of products is 2');
      expect(stdout).to.include('And my order amount is $1600');
      expect(stdout).to.not.include('I add item 600'); // 'Given' actor's non-gherkin step check
      expect(stdout).to.not.include('I see sum 1600'); // 'And' actor's non-gherkin step check
      assert(!err);
      done();
    });
  });

  it('should print substeps in debug mode', (done) => {
    exec(config_run_config('codecept.bdd.js') + ' --debug --grep "Checkout process"', (err, stdout, stderr) => { //eslint-disable-line
      expect(stdout).to.include('Checkout process'); // feature
      // expect(stdout).to.include('In order to buy products'); // test name
      expect(stdout).to.include('Given I have product with $600 price');
      expect(stdout).to.include('I add item 600');
      expect(stdout).to.include('And I have product with $1000 price');
      expect(stdout).to.include('I add item 1000');
      expect(stdout).to.include('Then I should see that total number of products is 2');
      expect(stdout).to.include('I see num 2');
      expect(stdout).to.include('And my order amount is $1600');
      expect(stdout).to.include('I see sum 1600');
      assert(!err);
      done();
    });
  });

  it('should print events in nodejs debug mode', (done) => {
    exec(`DEBUG=codeceptjs:* ${config_run_config('codecept.bdd.js')} --grep "Checkout products" --debug`, (err, stdout, stderr) => { //eslint-disable-line
      stderr.should.include('Emitted | step.start (I add product "Harry Potter", 5)');
      expect(stdout).to.include('name            | category        | price');
      expect(stdout).to.include('Harry Potter    | Books           | 5');
      expect(stdout).to.include('iPhone 5        | Smartphones     | 1200 ');
      expect(stdout).to.include('Nuclear Bomb    | Weapons         | 100000');
      assert(!err);
      done();
    });
  });

  it('should obfuscate secret substeps in debug mode', (done) => {
    exec(config_run_config('codecept.bdd.js') + ' --debug --grep "Secrets"', (err, stdout, stderr) => { //eslint-disable-line
      expect(stdout).to.include('Given I login'); // feature
      expect(stdout).to.not.include('password');
      assert(!err);
      done();
    });
  });

  it('should run feature with examples files', (done) => {
    exec(config_run_config('codecept.bdd.js') + ' --steps --grep "Checkout examples"', (err, stdout, stderr) => { //eslint-disable-line
      expect(stdout).to.include(' order discount {"price":"10","total":"10.0"}');
      expect(stdout).to.include(' Given I have product with price 10$ in my cart');

      expect(stdout).to.include(' order discount {"price":"20","total":"20.0"}');
      expect(stdout).to.include(' Given I have product with price 20$ in my cart');

      expect(stdout).to.include(' order discount {"price":"21","total":"18.9"}');
      expect(stdout).to.include(' Given I have product with price 21$ in my cart');

      expect(stdout).to.include(' order discount {"price":"30","total":"27.0"}');
      expect(stdout).to.include(' Given I have product with price 30$ in my cart');

      expect(stdout).to.include(' order discount {"price":"50","total":"45.0"}');
      expect(stdout).to.include(' Given I have product with price 50$ in my cart');
      assert(!err);
      done();
    });
  });

  it('should run feature with table and examples files', (done) => {
    exec(config_run_config('codecept.bdd.js') + ' --steps --grep "Include Examples in dataTtable placeholder"', (err, stdout, stderr) => { //eslint-disable-line
      expect(stdout).to.include('name            | Nuclear Bomb ');
      expect(stdout).to.include('price           | 20 ');
      expect(stdout).to.include('name            | iPhone 5 ');
      expect(stdout).to.include('price           | 10 ');
      assert(!err);
      done();
    });
  });

  it('should show data from examples in test title', (done) => {
    exec(config_run_config('codecept.bdd.js') + ' --steps --grep "Include Examples in dataTtable placeholder"', (err, stdout, stderr) => { //eslint-disable-line
      expect(stdout).to.include('order a product with discount - iPhone 5 - 10  @IncludeExamplesIndataTtable');
      expect(stdout).to.include('name            | Nuclear Bomb ');
      expect(stdout).to.include('price           | 20 ');
      expect(stdout).to.include('name            | iPhone 5 ');
      expect(stdout).to.include('price           | 10 ');
      assert(!err);
      done();
    });
  });

  it('should run feature with tables', (done) => {
    exec(config_run_config('codecept.bdd.js') + ' --steps --grep "Checkout products"', (err, stdout, stderr) => { //eslint-disable-line
      expect(stdout).to.include('Given I have products in my cart');
      expect(stdout).to.include('name');
      expect(stdout).to.include('Harry Potter');
      expect(stdout).to.include('Smartphones');
      expect(stdout).to.include('100000');
      expect(stdout).to.include('Then my order amount is $101205');
      assert(!err);
      done();
    });
  });

  it('should run feature with tables contain long text', (done) => {
    exec(config_run_config('codecept.bdd.js') + ' --steps --grep "Checkout products"', (err, stdout, stderr) => { //eslint-disable-line
      expect(stdout).to.include('Given I have products in my cart');
      expect(stdout).to.include('name');
      expect(stdout).to.include('Harry Potter and the deathly hallows');
      assert(!err);
      done();
    });
  });

  it('should run feature with long strings', (done) => {
    exec(config_run_config('codecept.bdd.js') + ' --steps --grep "Checkout string"', (err, stdout, stderr) => { //eslint-disable-line
      expect(stdout).to.include('Given I have product described as');
      expect(stdout).to.include('The goal of the product description is to provide the customer with enough information to compel them to want to buy the product immediately.');
      expect(stdout).to.include('Then my order amount is $582');
      assert(!err);
      done();
    });
  });

  it('should run feature by file name', (done) => {
    exec(config_run_config('codecept.bdd.js') + ' --steps features/tables.feature', (err, stdout, stderr) => { //eslint-disable-line
      expect(stdout).to.include('Checkout product');
      expect(stdout).to.include('checkout 3 products');
      expect(stdout).to.not.include('Checkout string');
      expect(stdout).to.not.include('describe product');
      expect(stdout).to.not.include('Checkout process');
      expect(stdout).to.not.include('Checkout examples process');
      assert(!err);
      done();
    });
  });

  it('should run feature by scenario name', (done) => {
    exec(config_run_config('codecept.bdd.js') + ' --grep "checkout 3 products" --steps', (err, stdout, stderr) => { //eslint-disable-line
      expect(stdout).to.include('Checkout product');
      expect(stdout).to.include('checkout 3 products');
      expect(stdout).to.not.include('Checkout string');
      expect(stdout).to.not.include('describe product');
      expect(stdout).to.not.include('Checkout process');
      expect(stdout).to.not.include('Checkout examples process');
      assert(!err);
      done();
    });
  });

  it('should run feature by tag name', (done) => {
    exec(config_run_config('codecept.bdd.js') + ' --grep "@important" --steps', (err, stdout, stderr) => { //eslint-disable-line
      expect(stdout).to.include('I have product with $600 price in my cart');
      expect(stdout).to.not.include('Checkout string');
      expect(stdout).to.not.include('describe product');
      expect(stdout).to.not.include('Checkout table');
      expect(stdout).to.not.include('Checkout examples process');
      assert(!err);
      done();
    });
  });

  it('should run scenario by tag name', (done) => {
    exec(config_run_config('codecept.bdd.js') + ' --grep "@very" --steps', (err, stdout, stderr) => { //eslint-disable-line
      expect(stdout).to.include('I have product with $600 price in my cart');
      expect(stdout).to.not.include('Checkout string');
      expect(stdout).to.not.include('describe product');
      expect(stdout).to.not.include('Checkout table');
      expect(stdout).to.not.include('Checkout examples process');
      assert(!err);
      done();
    });
  });

  it('should run scenario outline by tag', (done) => {
    exec(config_run_config('codecept.bdd.js') + ' --grep "@user" --steps', (err, stdout, stderr) => { //eslint-disable-line
      expect(stdout).to.not.include('0 passed');
      expect(stdout).to.include('I have product with price 10$');
      assert(!err);
      done();
    });
  });

  it('should run scenario and scenario outline by tags', (done) => {
    exec(config_run_config('codecept.bdd.js') + ' --grep "\@user|\@very" --steps', (err, stdout, stderr) => { //eslint-disable-line
      expect(stdout).to.not.include('0 passed');
      expect(stdout).to.include('I have product with price 10$');
      expect(stdout).to.include('I have product with $600 price in my cart');
      expect(stdout).to.include('6 passed');
      assert(!err);
      done();
    });
  });

  it('should run scenario and scenario outline by tags', (done) => {
    exec(config_run_config('codecept.bdd.js') + ' --grep "\@user|\@very" --steps', (err, stdout, stderr) => { //eslint-disable-line
      expect(stdout).to.not.include('0 passed');
      expect(stdout).to.include('I have product with price 10$');
      expect(stdout).to.include('I have product with $600 price in my cart');
      expect(stdout).to.include('6 passed');
      assert(!err);
      done();
    });
  });

  it('should run not get stuck on failing step', (done) => {
    exec(config_run_config('codecept.bdd.js') + ' --grep "@fail" --steps', (err, stdout, stderr) => { //eslint-disable-line
      // expect(stdout).to.include('Given I make a request (and it fails)');
      // expect(stdout).to.not.include('Then my test execution gets stuck');
      expect(stdout).to.include('1 failed');
      expect(stdout).to.include('[Wrapped Error]');
      assert(err);
      done();
    });
  });

  it('should show all available steps', (done) => {
    exec(`${runner} gherkin:steps --config ${codecept_dir}/codecept.bdd.js`, (err, stdout, stderr) => { //eslint-disable-line
      expect(stdout).to.include('Gherkin');
      expect(stdout).to.include('/I have product with \\$(\\d+) price/');
      expect(stdout).to.include('step_definitions/my_steps.js:3:1');
      expect(stdout).to.include('step_definitions/my_steps.js:3:1');
      expect(stdout).to.include('I should see that total number of products is {int}');
      expect(stdout).to.include('I should see overall price is "{float}" $');
      assert(!err);
      done();
    });
  });

  it('should generate snippets for missing steps', (done) => {
    exec(`${runner} gherkin:snippets --dry-run --config ${codecept_dir}/codecept.dummy.bdd.js`, (err, stdout, stderr) => { //eslint-disable-line
      expect(stdout).to.include(`Given('I open a browser on a site', () => {
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
    exec(`${runner} gherkin:snippets --dry-run --config ${codecept_dir}/codecept.duplicate.bdd.js`, (err, stdout, stderr) => { //eslint-disable-line
      assert.equal(stdout.match(/I open a browser on a site/g).length, 1);
      assert(!err);
      done();
    });
  });

  describe('i18n', () => {
    const codecept_dir = path.join(__dirname, '/../data/sandbox/i18n');
    const config_run_config = config => `${codecept_run} --config ${codecept_dir}/${config}`;

    before(() => {
      process.chdir(codecept_dir);
    });
    it('should run feature files in DE', (done) => {
      exec(config_run_config('codecept.bdd.de.js') + ' --steps --grep "@i18n"', (err, stdout, stderr) => { //eslint-disable-line
        expect(stdout).to.include('On Angenommen: ich habe ein produkt mit einem preis von 10$ in meinem warenkorb');
        expect(stdout).to.include('On Und: der rabatt für bestellungen über $20 beträgt 10 %');
        expect(stdout).to.include('On Wenn: ich zur kasse gehe');
        expect(stdout).to.include('On Dann: sollte ich den gesamtpreis von "10.0" $ sehen');
        expect(stdout).to.include('On Angenommen: ich habe ein produkt mit einem preis von 10$ in meinem warenkorb');
        expect(stdout).to.include('Ich add item 10');
        expect(stdout).to.include('On Und: der rabatt für bestellungen über $20 beträgt 10 %');
        expect(stdout).to.include('Ich have discount for price 20, 10');
        expect(stdout).to.include('On Wenn: ich zur kasse gehe');
        expect(stdout).to.include('Ich checkout');
        expect(stdout).to.include('On Dann: sollte ich den gesamtpreis von "10.0" $ sehen');
        expect(stdout).to.include('Ich see sum 10');
        assert(!err);
        done();
      });
    });
  });
});
