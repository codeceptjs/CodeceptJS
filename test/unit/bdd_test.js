const { expect } = require('chai');
const { Parser } = require('gherkin');
const Config = require('../../lib/config');
const {
  Given,
  When,
  And,
  Then,
  matchStep,
  clearSteps,
  defineParameterType,
} = require('../../lib/interfaces/bdd');
const run = require('../../lib/interfaces/gherkin');
const recorder = require('../../lib/recorder');
const container = require('../../lib/container');
const actor = require('../../lib/actor');
const event = require('../../lib/event');

class Color {
  constructor(name) {
    this.name = name;
  }
}

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

const checkTestForErrors = (test) => {
  return new Promise((resolve, reject) => {
    test.fn((err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

describe('BDD', () => {
  beforeEach(() => {
    clearSteps();
    recorder.start();
    container.create({});
    Config.reset();
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
    expect(ast.feature).is.ok;
    expect(ast.feature.children).is.ok;
    expect(ast.feature.children[0].steps).is.ok;
  });

  it('should load step definitions', () => {
    Given('I am a bird', () => 1);
    When('I fly over ocean', () => 2);
    And(/^I fly over land$/i, () => 3);
    Then(/I see (.*?)/, () => 4);
    expect(1).is.equal(matchStep('I am a bird')());
    expect(3).is.equal(matchStep('I Fly oVer Land')());
    expect(4).is.equal(matchStep('I see ocean')());
    expect(4).is.equal(matchStep('I see world')());
  });

  it('should fail on duplicate step definitions with option', () => {
    Config.append({
      gherkin: {
        avoidDuplicateSteps: true,
      },
    });

    let error = null;
    try {
      Given('I am a bird', () => 1);
      Then('I am a bird', () => 1);
    } catch (err) {
      error = err;
    } finally {
      expect(!!error).is.true;
    }
  });

  it('should contain tags', async () => {
    let sum = 0;
    Given(/I have product with (\d+) price/, param => sum += parseInt(param, 10));
    When('I go to checkout process', () => sum += 10);
    const suite = run(text);
    suite.tests[0].fn(() => {});
    expect(suite.tests[0].tags).is.ok;
    expect('@super').is.equal(suite.tests[0].tags[0]);
  });

  it('should load step definitions', (done) => {
    let sum = 0;
    Given(/I have product with (\d+) price/, param => sum += parseInt(param, 10));
    When('I go to checkout process', () => sum += 10);
    const suite = run(text);
    expect('checkout process').is.equal(suite.title);
    suite.tests[0].fn(() => {
      expect(suite.tests[0].steps).is.ok;
      expect(1610).is.equal(sum);
      done();
    });
  });

  it('should allow failed steps', async () => {
    let sum = 0;
    Given(/I have product with (\d+) price/, param => sum += parseInt(param, 10));
    When('I go to checkout process', () => expect(false).is.true);
    const suite = run(text);
    expect('checkout process').is.equal(suite.title);
    try {
      await checkTestForErrors(suite.tests[0]);
      return Promise.reject((new Error('Test should have thrown with failed step, but did not')));
    } catch (err) {
      const errored = !!err;
      expect(errored).is.true;
    }
  });

  it('handles errors in steps', async () => {
    let sum = 0;
    Given(/I have product with (\d+) price/, param => sum += parseInt(param, 10));
    When('I go to checkout process', () => { throw new Error('errored step'); });
    const suite = run(text);
    expect('checkout process').is.equal(suite.title);
    try {
      await checkTestForErrors(suite.tests[0]);
      return Promise.reject((new Error('Test should have thrown with error, but did not')));
    } catch (err) {
      const errored = !!err;
      expect(errored).is.true;
    }
  });

  it('handles async errors in steps', async () => {
    let sum = 0;
    Given(/I have product with (\d+) price/, param => sum += parseInt(param, 10));
    When('I go to checkout process', () => Promise.reject(new Error('step failed')));
    const suite = run(text);
    expect('checkout process').is.equal(suite.title);
    try {
      await checkTestForErrors(suite.tests[0]);
      return Promise.reject((new Error('Test should have thrown with error, but did not')));
    } catch (err) {
      const errored = !!err;
      expect(errored).is.true;
    }
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
    expect('checkout process').is.equal(suite.title);
    suite.tests[0].fn(() => {
      expect(suite.tests[0].steps).is.ok;
      expect(1610).is.equal(sum);
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
    expect('bird').is.equal(fn.params[0]);
  });

  it('should produce step events', (done) => {
    const text = `
    Feature: Emit step event

      Scenario:
        Then I emit step events
    `;
    Then('I emit step events', () => {});
    let listeners = 0;
    event.dispatcher.addListener(event.bddStep.before, () => listeners++);
    event.dispatcher.addListener(event.bddStep.after, () => listeners++);

    const suite = run(text);
    suite.tests[0].fn(() => {
      listeners.should.eql(2);
      done();
    });
  });

  it('should use shortened form for step definitions', () => {
    let fn;
    Given('I am a {word}', params => params[0]);
    When('I have {int} wings and {int} eyes', params => params[0] + params[1]);
    Given('I have ${int} in my pocket', params => params[0]); // eslint-disable-line no-template-curly-in-string
    Given('I have also ${float} in my pocket', params => params[0]); // eslint-disable-line no-template-curly-in-string
    fn = matchStep('I am a bird');
    expect('bird').is.equal(fn(fn.params));
    fn = matchStep('I have 2 wings and 2 eyes');
    expect(4).is.equal(fn(fn.params));
    fn = matchStep('I have $500 in my pocket');
    expect(500).is.equal(fn(fn.params));
    fn = matchStep('I have also $500.30 in my pocket');
    expect(500.30).is.equal(fn(fn.params));
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
    function incrementSum() {
      sum++;
    }
    Given('I am logged in as customer', incrementSum);
    Then('I am shopping', incrementSum);
    const suite = run(text);
    const done = () => { };
    suite._beforeEach.forEach(hook => hook.run(done));
    suite.tests[0].fn(done);
    expect(2).is.equal(sum);
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

      @exampleTag1
      @exampleTag2
      Examples:
        | price | total |
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

    expect(suite.tests[0].tags).is.ok;
    expect(['@awesome', '@cool', '@super']).is.deep.equal(suite.tests[0].tags);
    expect(['@awesome', '@cool', '@super', '@exampleTag1', '@exampleTag2']).is.deep.equal(suite.tests[1].tags);

    expect(2).is.equal(suite.tests.length);
    suite.tests[0].fn(() => {
      expect(9).is.equal(cart);
      expect(9).is.equal(sum);

      suite.tests[1].fn(() => {
        expect(18).is.equal(cart);
        expect(18).is.equal(sum);
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
      expect(givenParsedRows.rawData).is.deep.equal(expectedParsedDataTable);
      expect(thenParsedRows.rawData).is.deep.equal(expectedParsedDataTable);
      done();
    });
  });

  it('should match step with custom parameter type', (done) => {
    const colorType = {
      name: 'color',
      regexp: /red|blue|yellow/,
      transformer: (s) => new Color(s),
    };
    defineParameterType(colorType);
    Given('I have a {color} label', (color) => color);
    const fn = matchStep('I have a red label');
    expect('red').is.equal(fn.params[0].name);
    done();
  });

  it('should match step with async custom parameter type transformation', async () => {
    const colorType = {
      name: 'async_color',
      regexp: /red|blue|yellow/,
      transformer: async (s) => new Color(s),
    };
    defineParameterType(colorType);
    Given('I have a {async_color} label', (color) => color);
    const fn = matchStep('I have a blue label');
    const color = await fn.params[0];
    expect('blue').is.equal(color.name);
    await Promise.resolve();
  });
});
