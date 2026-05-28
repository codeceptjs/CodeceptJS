import assert from 'assert'
import { simplifyHtmlElement } from '../html.js'

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

    let ctor = helper.constructor
    while (ctor && ctor.name) {
      if (ctor.name === 'Playwright') return 'playwright'
      if (ctor.name === 'WebDriver') return 'webdriver'
      if (ctor.name === 'Puppeteer') return 'puppeteer'
      ctor = Object.getPrototypeOf(ctor)
    }

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
        // For Locator objects, use inputValue() for the 'value' property
        if (name === 'value' && this.element.inputValue) {
          return this.element.inputValue()
        }
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
        // Playwright Locator objects use fill() instead of type()
        if (this.element.fill) {
          return this.element.fill(text, options)
        }
        return this.element.type(text, options)
      case 'webdriver':
        return this.element.setValue(text)
      case 'puppeteer':
        await this.element.evaluate(el => { el.value = '' })
        return this.element.type(text, options)
      default:
        throw new Error(`Unsupported helper type: ${this.helperType}`)
    }
  }

  /**
   * Run a function in the browser with this element as the first argument.
   * @param {Function} fn Browser-side function. Receives the element, then extra args.
   * @param {...any} args Additional arguments passed to the function
   * @returns {Promise<any>} Value returned by fn
   */
  async evaluate(fn, ...args) {
    switch (this.helperType) {
      case 'playwright':
      case 'puppeteer':
        return this.element.evaluate(fn, ...args)
      case 'webdriver':
        return this.helper.executeScript(fn, this.element, ...args)
      default:
        throw new Error(`Unsupported helper type: ${this.helperType}`)
    }
  }

  /**
   * Focus the element.
   * @returns {Promise<void>}
   */
  async focus() {
    switch (this.helperType) {
      case 'playwright':
        return this.element.focus()
      case 'puppeteer':
        if (this.element.focus) return this.element.focus()
        return this.element.evaluate(el => el.focus())
      case 'webdriver':
        return this.helper.executeScript(el => el.focus(), this.element)
      default:
        throw new Error(`Unsupported helper type: ${this.helperType}`)
    }
  }

  /**
   * Type characters via the page/browser keyboard into the focused element.
   * Unlike `type()`, this does not call `.fill()`/`.setValue()`, so it works
   * with contenteditable nodes, iframe bodies, and editor-owned hidden textareas.
   * @param {string} text Text to send
   * @param {Object} [options] Options (e.g. `{ delay }`)
   * @returns {Promise<void>}
   */
  async typeText(text, options = {}) {
    const s = String(text)
    switch (this.helperType) {
      case 'playwright':
      case 'puppeteer':
        return this.helper.page.keyboard.type(s, options)
      case 'webdriver': {
        const ENTER = '\uE007'
        const parts = s.split('\n')
        for (let i = 0; i < parts.length; i++) {
          if (parts[i]) await this.helper.browser.keys(parts[i])
          if (i < parts.length - 1) await this.helper.browser.keys(ENTER)
        }
        return
      }
      default:
        throw new Error(`Unsupported helper type: ${this.helperType}`)
    }
  }

  /**
   * Select all content in the focused field and delete it via keyboard input.
   * Sends Ctrl+A and Meta+A (so it works across platforms) followed by Backspace.
   * @returns {Promise<void>}
   */
  async selectAllAndDelete() {
    switch (this.helperType) {
      case 'playwright':
        await this.helper.page.keyboard.press('Control+a').catch(() => {})
        await this.helper.page.keyboard.press('Meta+a').catch(() => {})
        await this.helper.page.keyboard.press('Backspace')
        return
      case 'puppeteer':
        for (const mod of ['Control', 'Meta']) {
          try {
            await this.helper.page.keyboard.down(mod)
            await this.helper.page.keyboard.press('KeyA')
            await this.helper.page.keyboard.up(mod)
          } catch (e) {}
        }
        await this.helper.page.keyboard.press('Backspace')
        return
      case 'webdriver': {
        const b = this.helper.browser
        await b.keys(['Control', 'a']).catch(() => {})
        await b.keys(['Meta', 'a']).catch(() => {})
        await b.keys(['Backspace'])
        return
      }
      default:
        throw new Error(`Unsupported helper type: ${this.helperType}`)
    }
  }

  /**
   * Treat this element as an iframe; invoke `fn` with a WebElement wrapping
   * the iframe body. For WebDriver this switches the browser into the frame
   * for the duration of the callback and switches back on exit.
   * @param {(body: WebElement) => Promise<any>} fn
   * @returns {Promise<any>} Return value of fn
   */
  async inIframe(fn) {
    switch (this.helperType) {
      case 'playwright':
      case 'puppeteer': {
        const frame = await this.element.contentFrame()
        const body = await frame.$('body')
        return fn(new WebElement(body, this.helper))
      }
      case 'webdriver': {
        const browser = this.helper.browser
        await browser.switchFrame(this.element)
        try {
          const body = await browser.$('body')
          return await fn(new WebElement(body, this.helper))
        } finally {
          await browser.switchFrame(null)
        }
      }
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
        // Playwright Locator objects use locator() method
        if (this.element.locator) {
          const childLocator = this.element.locator(this._normalizeLocator(locator))
          // Get the element handle from the locator
          try {
            childElement = await childLocator.elementHandle()
          } catch (e) {
            return null
          }
        } else {
          childElement = await this.element.$(this._normalizeLocator(locator))
        }
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
        // Playwright Locator objects use locator() method
        if (this.element.locator) {
          const childLocator = this.element.locator(this._normalizeLocator(locator))
          // Get all element handles from the locator
          childElements = await childLocator.elementHandles()
        } else {
          childElements = await this.element.$$(this._normalizeLocator(locator))
        }
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
  async toAbsoluteXPath() {
    const xpathFn = (el) => {
      const parts = []
      let current = el
      while (current && current.nodeType === Node.ELEMENT_NODE) {
        let index = 0
        let sibling = current.previousSibling
        while (sibling) {
          if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === current.tagName) {
            index++
          }
          sibling = sibling.previousSibling
        }
        const tagName = current.tagName.toLowerCase()
        const pathIndex = index > 0 ? `[${index + 1}]` : ''
        parts.unshift(`${tagName}${pathIndex}`)
        current = current.parentElement
      }
      return '//' + parts.join('/')
    }

    switch (this.helperType) {
      case 'playwright':
        return this.element.evaluate(xpathFn)
      case 'puppeteer':
        return this.element.evaluate(xpathFn)
      case 'webdriver':
        return this.helper.browser.execute(xpathFn, this.element)
      default:
        throw new Error(`Unsupported helper type: ${this.helperType}`)
    }
  }

  async toOuterHTML() {
    switch (this.helperType) {
      case 'playwright':
        return this.element.evaluate(el => el.outerHTML)
      case 'puppeteer':
        return this.element.evaluate(el => el.outerHTML)
      case 'webdriver':
        return this.helper.browser.execute(el => el.outerHTML, this.element)
      default:
        throw new Error(`Unsupported helper type: ${this.helperType}`)
    }
  }

  async toSimplifiedHTML(maxLength = 300) {
    const outerHTML = await this.toOuterHTML()
    return simplifyHtmlElement(outerHTML, maxLength)
  }

  /**
   * Plain-object snapshot of the element — text, simplified HTML, visibility,
   * enabled state, and a curated set of attributes. Each underlying call is
   * isolated so a single failure (e.g. detached element) doesn't poison the
   * rest. Suitable for JSON.stringify, log output, MCP tool responses.
   *
   * @param {object}   [opts]
   * @param {number}   [opts.maxHtmlLength=300]   passed through to toSimplifiedHTML
   * @param {string[]} [opts.attrs]               attribute names to surface
   * @returns {Promise<{text?: string, html?: string, visible?: boolean, enabled?: boolean, attrs?: object}>}
   */
  async describe({ maxHtmlLength = 300, attrs = ['id', 'class', 'name', 'role', 'type', 'href', 'value', 'aria-label', 'placeholder', 'data-testid'] } = {}) {
    const out = {}
    await Promise.all([
      this.toSimplifiedHTML(maxHtmlLength).then(v => { if (v) out.html = v }, () => {}),
      this.getText().then(v => { const t = v?.trim(); if (t) out.text = t }, () => {}),
      this.isVisible().then(v => { out.visible = v }, () => {}),
      this.isEnabled().then(v => { out.enabled = v }, () => {}),
    ])
    const collected = {}
    await Promise.all(attrs.map(async name => {
      try {
        const v = await this.getAttribute(name)
        if (v != null && v !== '') collected[name] = v
      } catch {}
    }))
    if (Object.keys(collected).length) out.attrs = collected
    return out
  }

  // Make accidental JSON.stringify (e.g. returning a WebElement from MCP run_code)
  // produce a usable hint instead of `{}` — the underlying handle isn't
  // serializable. Use .describe() for the real plain-object snapshot.
  toJSON() {
    return `[WebElement ${this.helperType} — call .describe() for a plain-object snapshot or .toSimplifiedHTML() for HTML]`
  }

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

export default WebElement
