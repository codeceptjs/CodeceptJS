import Locator from '../../locator.js'
/**
 * Uses to throw readable element not found error
 * Stringify object's locators
 */
class ElementNotFound {
  constructor(locator, prefixMessage = 'Element', postfixMessage = 'was not found by text|CSS|XPath') {
    let locatorStr
    if (typeof locator === 'object') {
      locatorStr = JSON.stringify(locator)
    } else {
      locatorStr = new Locator(locator).toString()
    }
    throw new Error(`${prefixMessage} "${locatorStr}" ${postfixMessage}`)
  }
}

export default ElementNotFound
