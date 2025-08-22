const assert = require('assert')

/**
 * Unified WebElement class that wraps native element instances from different helpers
 * and provides a consistent API across all supported helpers (Playwright, WebDriver, Puppeteer).
 */
class WebElement {
  constructor(element, helper) {
    this.element = element
    this.helper = helper
    this.helperType = this._detectHelperType(helper)
  }

  _detectHelperType(helper) {
    if (!helper) return 'unknown'

    const className = helper.constructor.name
    if (className === 'Playwright') return 'playwright'
    if (className === 'WebDriver') return 'webdriver'
    if (className === 'Puppeteer') return 'puppeteer'

    return 'unknown'
  }

  /**
   * Get the native element instance
   * @returns {ElementHandle|WebElement|ElementHandle} Native element
   */
  getNativeElement() {
    return this.element
  }

  /**
   * Get the helper instance
   * @returns {Helper} Helper instance
   */
  getHelper() {
    return this.helper
  }

  /**
   * Get text content of the element
   * @returns {Promise<string>} Element text content
   */
  async getText() {
    switch (this.helperType) {
      case 'playwright':
        return this.element.textContent()
      case 'webdriver':
        return this.element.getText()
      case 'puppeteer':
        return this.element.evaluate(el => el.textContent)
      default:
        throw new Error(`Unsupported helper type: ${this.helperType}`)
    }
  }

  /**
   * Get attribute value of the element
   * @param {string} name Attribute name
   * @returns {Promise<string|null>} Attribute value
   */
  async getAttribute(name) {
    switch (this.helperType) {
      case 'playwright':
        return this.element.getAttribute(name)
      case 'webdriver':
        return this.element.getAttribute(name)
      case 'puppeteer':
        return this.element.evaluate((el, attrName) => el.getAttribute(attrName), name)
      default:
        throw new Error(`Unsupported helper type: ${this.helperType}`)
    }
  }

  /**
   * Get property value of the element
   * @param {string} name Property name
   * @returns {Promise<any>} Property value
   */
  async getProperty(name) {
    switch (this.helperType) {
      case 'playwright':
        return this.element.evaluate((el, propName) => el[propName], name)
      case 'webdriver':
        return this.element.getProperty(name)
      case 'puppeteer':
        return this.element.evaluate((el, propName) => el[propName], name)
      default:
        throw new Error(`Unsupported helper type: ${this.helperType}`)
    }
  }

  /**
   * Get innerHTML of the element
   * @returns {Promise<string>} Element innerHTML
   */
  async getInnerHTML() {
    switch (this.helperType) {
      case 'playwright':
        return this.element.innerHTML()
      case 'webdriver':
        return this.element.getProperty('innerHTML')
      case 'puppeteer':
        return this.element.evaluate(el => el.innerHTML)
      default:
        throw new Error(`Unsupported helper type: ${this.helperType}`)
    }
  }

  /**
   * Get value of the element (for input elements)
   * @returns {Promise<string>} Element value
   */
  async getValue() {
    switch (this.helperType) {
      case 'playwright':
        return this.element.inputValue()
      case 'webdriver':
        return this.element.getValue()
      case 'puppeteer':
        return this.element.evaluate(el => el.value)
      default:
        throw new Error(`Unsupported helper type: ${this.helperType}`)
    }
  }

  /**
   * Check if element is visible
   * @returns {Promise<boolean>} True if element is visible
   */
  async isVisible() {
    switch (this.helperType) {
      case 'playwright':
        return this.element.isVisible()
      case 'webdriver':
        return this.element.isDisplayed()
      case 'puppeteer':
        return this.element.evaluate(el => {
          const style = window.getComputedStyle(el)
          return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'
        })
      default:
        throw new Error(`Unsupported helper type: ${this.helperType}`)
    }
  }

  /**
   * Check if element is enabled
   * @returns {Promise<boolean>} True if element is enabled
   */
  async isEnabled() {
    switch (this.helperType) {
      case 'playwright':
        return this.element.isEnabled()
      case 'webdriver':
        return this.element.isEnabled()
      case 'puppeteer':
        return this.element.evaluate(el => !el.disabled)
      default:
        throw new Error(`Unsupported helper type: ${this.helperType}`)
    }
  }

  /**
   * Check if element exists in DOM
   * @returns {Promise<boolean>} True if element exists
   */
  async exists() {
    try {
      switch (this.helperType) {
        case 'playwright':
          // For Playwright, if we have the element, it exists
          return await this.element.evaluate(el => !!el)
        case 'webdriver':
          // For WebDriver, if we have the element, it exists
          return true
        case 'puppeteer':
          // For Puppeteer, if we have the element, it exists
          return await this.element.evaluate(el => !!el)
        default:
          throw new Error(`Unsupported helper type: ${this.helperType}`)
      }
    } catch (e) {
      return false
    }
  }

  /**
   * Get bounding box of the element
   * @returns {Promise<Object>} Bounding box with x, y, width, height properties
   */
  async getBoundingBox() {
    switch (this.helperType) {
      case 'playwright':
        return this.element.boundingBox()
      case 'webdriver':
        const rect = await this.element.getRect()
        return {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        }
      case 'puppeteer':
        return this.element.boundingBox()
      default:
        throw new Error(`Unsupported helper type: ${this.helperType}`)
    }
  }

  /**
   * Click the element
   * @param {Object} options Click options
   * @returns {Promise<void>}
   */
  async click(options = {}) {
    switch (this.helperType) {
      case 'playwright':
        return this.element.click(options)
      case 'webdriver':
        return this.element.click()
      case 'puppeteer':
        return this.element.click(options)
      default:
        throw new Error(`Unsupported helper type: ${this.helperType}`)
    }
  }

  /**
   * Type text into the element
   * @param {string} text Text to type
   * @param {Object} options Type options
   * @returns {Promise<void>}
   */
  async type(text, options = {}) {
    switch (this.helperType) {
      case 'playwright':
        return this.element.type(text, options)
      case 'webdriver':
        return this.element.setValue(text)
      case 'puppeteer':
        return this.element.type(text, options)
      default:
        throw new Error(`Unsupported helper type: ${this.helperType}`)
    }
  }

  /**
   * Find first child element matching the locator
   * @param {string|Object} locator Element locator
   * @returns {Promise<WebElement|null>} WebElement instance or null if not found
   */
  async $(locator) {
    let childElement

    switch (this.helperType) {
      case 'playwright':
        childElement = await this.element.$(this._normalizeLocator(locator))
        break
      case 'webdriver':
        try {
          childElement = await this.element.$(this._normalizeLocator(locator))
        } catch (e) {
          return null
        }
        break
      case 'puppeteer':
        childElement = await this.element.$(this._normalizeLocator(locator))
        break
      default:
        throw new Error(`Unsupported helper type: ${this.helperType}`)
    }

    return childElement ? new WebElement(childElement, this.helper) : null
  }

  /**
   * Find all child elements matching the locator
   * @param {string|Object} locator Element locator
   * @returns {Promise<WebElement[]>} Array of WebElement instances
   */
  async $$(locator) {
    let childElements

    switch (this.helperType) {
      case 'playwright':
        childElements = await this.element.$$(this._normalizeLocator(locator))
        break
      case 'webdriver':
        childElements = await this.element.$$(this._normalizeLocator(locator))
        break
      case 'puppeteer':
        childElements = await this.element.$$(this._normalizeLocator(locator))
        break
      default:
        throw new Error(`Unsupported helper type: ${this.helperType}`)
    }

    return childElements.map(el => new WebElement(el, this.helper))
  }

  /**
   * Normalize locator for element search
   * @param {string|Object} locator Locator to normalize
   * @returns {string} Normalized CSS selector
   * @private
   */
  _normalizeLocator(locator) {
    if (typeof locator === 'string') {
      return locator
    }

    if (typeof locator === 'object') {
      // Handle CodeceptJS locator objects
      if (locator.css) return locator.css
      if (locator.xpath) return locator.xpath
      if (locator.id) return `#${locator.id}`
      if (locator.name) return `[name="${locator.name}"]`
      if (locator.className) return `.${locator.className}`
    }

    return locator.toString()
  }
}

module.exports = WebElement
