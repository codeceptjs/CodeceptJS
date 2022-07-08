const { expect } = require('chai');
const customLocatorPlugin = require('../../../lib/plugin/customLocator');
const Locator = require('../../../lib/locator');

describe('customLocator', () => {
  beforeEach(() => {
    Locator.filters = [];
  });

  it('add a custom locator by $ -> data-qa', () => {
    customLocatorPlugin({
      prefix: '$',
      attribute: 'data-qa',
      showActual: true,
    });
    const l = new Locator('$user-id');
    expect(l.isXPath()).to.be.true;
    expect(l.toXPath()).to.eql('.//*[@data-qa=\'user-id\']');
    expect(l.toString()).to.eql('.//*[@data-qa=\'user-id\']');
  });

  it('add a custom locator by = -> data-test-id', () => {
    customLocatorPlugin({
      prefix: '=',
      attribute: 'data-test-id',
      showActual: false,
    });
    const l = new Locator('=no-user');
    expect(l.isXPath()).to.be.true;
    expect(l.toXPath()).to.eql('.//*[@data-test-id=\'no-user\']');
    expect(l.toString()).to.eql('=no-user');
  });

  it('add a custom locator with multple char prefix = -> data-test-id', () => {
    customLocatorPlugin({
      prefix: 'test=',
      attribute: 'data-test-id',
      showActual: false,
    });
    const l = new Locator('test=no-user');
    expect(l.isXPath()).to.be.true;
    expect(l.toXPath()).to.eql('.//*[@data-test-id=\'no-user\']');
    expect(l.toString()).to.eql('test=no-user');
  });

  it('add a custom locator with CSS', () => {
    customLocatorPlugin({
      prefix: '$',
      attribute: 'data-test',
      strategy: 'css',
    });
    const l = new Locator('$user');
    expect(l.isCSS()).to.be.true;
    expect(l.simplify()).to.eql('[data-test=user]');
  });

  it('add a custom locator with array $ -> data-qa, data-qa-id', () => {
    customLocatorPlugin({
      prefix: '$',
      attribute: ['data-qa', 'data-qa-id'],
      showActual: true,
    });
    const l = new Locator('$user-id');
    expect(l.isXPath()).to.be.true;
    expect(l.toXPath()).to.eql('.//*[@data-qa=\'user-id\' or @data-qa-id=\'user-id\']');
    expect(l.toString()).to.eql('.//*[@data-qa=\'user-id\' or @data-qa-id=\'user-id\']');
  });

  it('add a custom locator array with CSS', () => {
    customLocatorPlugin({
      prefix: '$',
      attribute: ['data-test', 'data-test-id'],
      strategy: 'css',
    });
    const l = new Locator('$user');
    expect(l.isCSS()).to.be.true;
    expect(l.simplify()).to.eql('[data-test=user],[data-test-id=user]');
  });

  it('should return initial locator value when it does not start with specified prefix', () => {
    customLocatorPlugin({
      prefix: '$',
      attribute: 'data-test',
    });
    const l = new Locator('=user');
    expect(l.simplify()).to.eql('=user');
  });
});
