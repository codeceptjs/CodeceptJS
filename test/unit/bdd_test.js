const assert = require('assert');
const { Parser } = require('gherkin');
const {
  Given,
  When,
  Then,
  matchStep,
  clearSteps,
} = require('../../lib/interfaces/context');
const run = require('../../lib/interfaces/gherkin');

const text = `
  Feature: checkout process
  In order to buy products
  As a customer
  I want to be able to buy several products

  Scenario:
    Given I have product with 600 price
    And I have product with 1000 price
    When I go to checkout process
`;

describe('BDD', () => {
  beforeEach(() => {
    clearSteps();
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
    assert.equal(1, matchStep('I am a bird'));
    assert.equal(3, matchStep('I see ocean'));
    assert.equal(3, matchStep('I see world'));
  });

  it('should load step definitions', () => {
    let sum = 0;
    Given(/I have product with (\d+) price/, price => sum += parseInt(price, 10));
    When('I go to checkout process', () => sum += 10);
    run(text);
    assert.equal(1610, sum);
  });
});
