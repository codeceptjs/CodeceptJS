const expect = require('expect');

const ElementNotFound = require('../../../lib/helper/errors/ElementNotFound');

const locator = '#invalidSelector';

describe('ElementNotFound error', () => {
  it('should throw error', () => {
    expect(() => new ElementNotFound(locator)).toThrow(Error);
  });

  it('should provide default message', () => {
    expect(() => new ElementNotFound(locator))
      .toThrow(Error, 'Element "#invalidSelector" was not found by text|CSS|XPath');
  });

  it('should use prefix for message', () => {
    expect(() => new ElementNotFound(locator, 'Field'))
      .toThrow(Error, 'Field "#invalidSelector" was not found by text|CSS|XPath');
  });

  it('should use postfix for message', () => {
    expect(() => new ElementNotFound(locator, 'Locator', 'cannot be found'))
      .toThrow(Error, 'Locator "#invalidSelector" cannot be found');
  });

  it('should stringify locator object', () => {
    const objectLocator = { css: locator };
    expect(() => new ElementNotFound(objectLocator))
      .toThrow(Error, `Element "${JSON.stringify(objectLocator)}" was not found by text|CSS|XPath`);
  });
});
