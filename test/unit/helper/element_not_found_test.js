const expect = require('chai').expect;

const ElementNotFound = require('../../../lib/helper/errors/ElementNotFound');

const locator = '#invalidSelector';

describe('ElementNotFound error', () => {
  it('should throw error', () => {
    expect(() => new ElementNotFound(locator)).to.throw(Error);
  });

  it('should provide default message', () => {
    expect(() => new ElementNotFound(locator))
      .to.throw(Error, 'Element "#invalidSelector" was not found by text|CSS|XPath');
  });

  it('should use prefix for message', () => {
    expect(() => new ElementNotFound(locator, 'Field'))
      .to.throw(Error, 'Field "#invalidSelector" was not found by text|CSS|XPath');
  });

  it('should use postfix for message', () => {
    expect(() => new ElementNotFound(locator, 'Locator', 'cannot be found'))
      .to.throw(Error, 'Locator "#invalidSelector" cannot be found');
  });

  it('should stringify locator object', () => {
    const objectLocator = { css: locator };
    expect(() => new ElementNotFound(objectLocator))
      .to.throw(Error, `Element "${JSON.stringify(objectLocator)}" was not found by text|CSS|XPath`);
  });
});
