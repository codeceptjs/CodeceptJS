const { expect } = require('chai');
const assert = require('assert');
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
    assert(l.isXPath());
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
    assert(l.isXPath());
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
    assert(l.isXPath());
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
    assert(l.isCSS());
    expect(l.simplify()).to.eql('[data-test=user]');
  });
});
