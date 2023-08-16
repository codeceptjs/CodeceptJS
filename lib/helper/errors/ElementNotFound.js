const Locator = require('../../locator');
/**
 * Uses to throw readable element not found error
 * Stringify object's locators
 */
class ElementNotFound {
  constructor(
    locator,
    prefixMessage = 'Element',
    postfixMessage = 'was not found by text|CSS|XPath',
  ) {
    if (typeof locator === 'object') {
      locator = JSON.stringify(locator);
    }
    throw new Error(`${prefixMessage} "${(new Locator(locator))}" ${postfixMessage}`);
  }
}

module.exports = ElementNotFound;
