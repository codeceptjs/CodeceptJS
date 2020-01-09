const assert = require('assert');
const { Parser } = require('gherkin');
const {
  Given,
  When,
  Then,
  matchStep,
  clearSteps,
} = require('../../lib/interfaces/bdd');
const run = require('../../lib/interfaces/gherkin');
const recorder = require('../../lib/recorder');
const container = require('../../lib/container');
const actor = require('../../lib/actor');

const text = `
  Feature: checkout process
  In order to buy products
  As a customer
  I want to be able to buy several products

  @super
  Scenario:
    Given I have product with 600 price
    And I have product with 1000 price
    When I go to checkout process
`;

describe('BDD', () => {
  beforeEach(() => {
    clearSteps();
    recorder.start();
    container.create({});
  });

  afterEach(() => {
    container.clear();
    recorder.stop();
  });

  it('should parse gherkin input', () => {
    const parser = new Parser();
    parser.stopAtFirstError = false;
    const ast = parser.parse(text);
    // console.log('Feature', ast.feature);
    // console.log('Scenario', ast.feature.children);
    // console.log('Steps', ast.feature.children[0].steps[0]);
    assert.ok(ast.feature);
    assert.ok(ast.feature.children);
    assert.ok(ast.feature.children[0].steps);
  });

  it('should load step definitions', () => {
    Given('I am a bird', () => 1);
    When('I fly over ocean', () => 2);
    Then(/I see (.*?)/, () => 3);
    assert.equal(1, matchStep('I am a bird')());
    assert.equal(3, matchStep('I see ocean')());
    assert.equal(3, matchStep('I see world')());
  });

  it('should contain tags', async () => {
    let sum = 0;
    Given(/I have product with (\d+) price/, param => sum += parseInt(param, 10));
    When('I go to checkout process', () => sum += 10);
    const suite = run(text);
    suite.tests[0].fn(() => {});
    assert.ok(suite.tests[0].tags);
    assert.equal('@super', suite.tests[0].tags[0]);
  });


  it('should load step definitions', (done) => {
    let sum = 0;
    Given(/I have product with (\d+) price/, param => sum += parseInt(param, 10));
    When('I go to checkout process', () => sum += 10);
    const suite = run(text);
    assert.equal('checkout process', suite.title);
    suite.tests[0].fn(() => {
      assert.ok(suite.tests[0].steps);
      assert.equal(1610, sum);
      done();
    });
  });


  it('should allow failed steps', (done) => {
    let sum = 0;
    Given(/I have product with (\d+) price/, param => sum += parseInt(param, 10));
    When('I go to checkout process', () => assert(false));
    const suite = run(text);
    assert.equal('checkout process', suite.title);
    let errored = false;
    suite.tests[0].fn((err) => {
      errored = !!err;
      assert(errored);
      done();
    });
  });

  it('should work with async functions', (done) => {
    let sum = 0;
    Given(/I have product with (\d+) price/, param => sum += parseInt(param, 10));
    When('I go to checkout process', async () => {
      return new Promise((checkoutDone) => {
        sum += 10;
        setTimeout(checkoutDone, 0);
      });
    });
    const suite = run(text);
    assert.equal('checkout process', suite.title);
    suite.tests[0].fn(() => {
      assert.ok(suite.tests[0].steps);
      assert.equal(1610, sum);
      done();
    });
  });


  it('should execute scenarios step-by-step ', (done) => {
    printed = [];
    container.append({
      helpers: {
        simple: {
          do(...args) {
            return Promise.resolve().then(() => printed.push(args.join(' ')));
          },
        },
      },
    });
    I = actor();
    let sum = 0;
    Given(/I have product with (\d+) price/, (price) => {
      I.do('add', sum += parseInt(price, 10));
    });
    When('I go to checkout process', () => {
      I.do('add finish checkout');
    });
    const suite = run(text);
    suite.tests[0].fn(() => {
      recorder.promise().then(() => {
        printed.should.include.members([
          'add 600',
          'add 1600',
          'add finish checkout',
        ]);
        const lines = recorder.scheduled().split('\n');
        lines.should.include.members([
          'do: "add", 600',
          'step passed',
          'return result',
          'do: "add", 1600',
          'step passed',
          'return result',
          'do: "add finish checkout"',
          'step passed',
          'return result',
          'fire test.passed',
          'finish test',
        ]);
        done();
      });
    });
  });

  it('should match step with params', () => {
    Given('I am a {word}', param => param);
    const fn = matchStep('I am a bird');
    assert.equal('bird', fn.params[0]);
  });

  it('should use shortened form for step definitions', () => {
    let fn;
    Given('I am a {word}', params => params[0]);
    When('I have {int} wings and {int} eyes', params => params[0] + params[1]);
    Given('I have ${int} in my pocket', params => params[0]); // eslint-disable-line no-template-curly-in-string
    Given('I have also ${float} in my pocket', params => params[0]); // eslint-disable-line no-template-curly-in-string
    fn = matchStep('I am a bird');
    assert.equal('bird', fn(fn.params));
    fn = matchStep('I have 2 wings and 2 eyes');
    assert.equal(4, fn(fn.params));
    fn = matchStep('I have $500 in my pocket');
    assert.equal(500, fn(fn.params));
    fn = matchStep('I have also $500.30 in my pocket');
    assert.equal(500.30, fn(fn.params));
  });

  it('should attach before hook for Background', () => {
    const text = `
    Feature: checkout process

      Background:
        Given I am logged in as customer

      Scenario:
        Then I am shopping
    `;
    let sum = 0;
    Given('I am logged in as customer', () => sum++);
    Then('I am shopping', () => sum++);
    const suite = run(text);
    const done = () => { };
    suite._beforeEach.forEach(hook => hook.run(done));
    suite.tests[0].fn(done);
    assert.equal(2, sum);
  });

  it('should execute scenario outlines', (done) => {
    const text = `
    @awesome @cool
    Feature: checkout process

    @super
    Scenario Outline: order discount
      Given I have product with price <price>$ in my cart
      And discount is 10 %
      Then I should see price is "<total>" $

      Examples:
        | price | total |
        | 10    | 9     |
        | 20    | 18    |
    `;
    let cart = 0;
    let sum = 0;
    Given('I have product with price {int}$ in my cart', (price) => {
      cart = price;
    });
    Given('discount is {int} %', (discount) => {
      cart -= cart * discount / 100;
    });
    Then('I should see price is {string} $', (total) => {
      sum = parseInt(total, 10);
    });

    const suite = run(text);

    assert.ok(suite.tests[0].tags);
    assert.equal('@awesome', suite.tests[0].tags[0]);
    assert.equal('@cool', suite.tests[0].tags[1]);
    assert.equal('@super', suite.tests[0].tags[2]);

    assert.equal(2, suite.tests.length);
    suite.tests[0].fn(() => {
      assert.equal(9, cart);
      assert.equal(9, sum);

      suite.tests[1].fn(() => {
        assert.equal(18, cart);
        assert.equal(18, sum);
        done();
      });
    });
  });

  it('should provide a parsed DataTable', (done) => {
    const text = `
    @awesome @cool
    Feature: checkout process

    @super
    Scenario: order products
      Given I have the following products :
        | label   | price  |
        | beer    | 9      |
        | cookies | 12     |
      Then I should see the following products :
        | label   | price  |
        | beer    | 9      |
        | cookies | 12     |
    `;

    let givenParsedRows;
    let thenParsedRows;

    Given('I have the following products :', (products) => {
      givenParsedRows = products.parse();
    });
    Then('I should see the following products :', (products) => {
      thenParsedRows = products.parse();
    });

    const suite = run(text);

    const expectedParsedDataTable = [
      ['label', 'price'],
      ['beer', '9'],
      ['cookies', '12'],
    ];
    suite.tests[0].fn(() => {
      assert.deepEqual(givenParsedRows.rawData, expectedParsedDataTable);
      assert.deepEqual(thenParsedRows.rawData, expectedParsedDataTable);
      done();
    });
  });
});
