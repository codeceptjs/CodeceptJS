import { expect } from 'chai'
import WebElement from '../../lib/element/WebElement'

describe('Helper Integration with WebElement', () => {
  describe('WebElement method testing across helpers', () => {
    it('should work consistently across all helper types', async () => {
      const testCases = [
        {
          helperType: 'Playwright',
          mockElement: {
            textContent: () => Promise.resolve('playwright-text'),
            getAttribute: name => Promise.resolve(`playwright-${name}`),
            isVisible: () => Promise.resolve(true),
            click: () => Promise.resolve(),
            $: selector => Promise.resolve({ id: 'child-playwright' }),
          },
        },
        {
          helperType: 'WebDriver',
          mockElement: {
            getText: () => Promise.resolve('webdriver-text'),
            getAttribute: name => Promise.resolve(`webdriver-${name}`),
            isDisplayed: () => Promise.resolve(true),
            click: () => Promise.resolve(),
            $: selector => Promise.resolve({ id: 'child-webdriver' }),
          },
        },
        {
          helperType: 'Puppeteer',
          mockElement: {
            evaluate: (fn, ...args) => {
              if (fn.toString().includes('textContent')) return Promise.resolve('puppeteer-text')
              if (fn.toString().includes('getAttribute')) return Promise.resolve(`puppeteer-${args[0]}`)
              if (fn.toString().includes('getComputedStyle')) return Promise.resolve(true)
              return Promise.resolve('default')
            },
            click: () => Promise.resolve(),
            $: selector => Promise.resolve({ id: 'child-puppeteer' }),
          },
        },
      ]

      for (const testCase of testCases) {
        const mockHelper = { constructor: { name: testCase.helperType } }
        const webElement = new WebElement(testCase.mockElement, mockHelper)

        // Test that all methods exist and are callable
        expect(webElement.getText).to.be.a('function')
        expect(webElement.getAttribute).to.be.a('function')
        expect(webElement.isVisible).to.be.a('function')
        expect(webElement.click).to.be.a('function')
        expect(webElement.$).to.be.a('function')
        expect(webElement.$$).to.be.a('function')

        // Test that methods return expected values
        const text = await webElement.getText()
        expect(text).to.include(testCase.helperType.toLowerCase())

        const attr = await webElement.getAttribute('id')
        expect(attr).to.include(testCase.helperType.toLowerCase())

        const visible = await webElement.isVisible()
        expect(visible).to.equal(true)

        // Test child element search returns WebElement
        const childElement = await webElement.$('.child')
        if (childElement) {
          expect(childElement).to.be.instanceOf(WebElement)
        }

        // Test native element access
        expect(webElement.getNativeElement()).to.equal(testCase.mockElement)
        expect(webElement.getHelper()).to.equal(mockHelper)
      }
    })
  })

  describe('Helper method mocking', () => {
    it('should verify grabWebElement returns WebElement for all helpers', () => {
      // Mock implementations for each helper's grabWebElement method
      const mockPlaywrightGrabWebElement = function (locator) {
        const element = { type: 'playwright-element' }
        return new WebElement(element, this)
      }

      const mockWebDriverGrabWebElement = function (locator) {
        const elements = [{ type: 'webdriver-element' }]
        if (elements.length === 0) throw new Error('Element not found')
        return new WebElement(elements[0], this)
      }

      const mockPuppeteerGrabWebElement = function (locator) {
        const elements = [{ type: 'puppeteer-element' }]
        if (elements.length === 0) throw new Error('Element not found')
        return new WebElement(elements[0], this)
      }

      // Test each helper's method behavior
      const playwrightHelper = { constructor: { name: 'Playwright' } }
      const webdriverHelper = { constructor: { name: 'WebDriver' } }
      const puppeteerHelper = { constructor: { name: 'Puppeteer' } }

      const playwrightResult = mockPlaywrightGrabWebElement.call(playwrightHelper, '.test')
      const webdriverResult = mockWebDriverGrabWebElement.call(webdriverHelper, '.test')
      const puppeteerResult = mockPuppeteerGrabWebElement.call(puppeteerHelper, '.test')

      expect(playwrightResult).to.be.instanceOf(WebElement)
      expect(webdriverResult).to.be.instanceOf(WebElement)
      expect(puppeteerResult).to.be.instanceOf(WebElement)

      expect(playwrightResult.getNativeElement().type).to.equal('playwright-element')
      expect(webdriverResult.getNativeElement().type).to.equal('webdriver-element')
      expect(puppeteerResult.getNativeElement().type).to.equal('puppeteer-element')
    })

    it('should verify grabWebElements returns WebElement array for all helpers', () => {
      // Mock implementations for each helper's grabWebElements method
      const mockPlaywrightGrabWebElements = function (locator) {
        const elements = [{ type: 'playwright-element1' }, { type: 'playwright-element2' }]
        return elements.map(element => new WebElement(element, this))
      }

      const mockWebDriverGrabWebElements = function (locator) {
        const elements = [{ type: 'webdriver-element1' }, { type: 'webdriver-element2' }]
        return elements.map(element => new WebElement(element, this))
      }

      const mockPuppeteerGrabWebElements = function (locator) {
        const elements = [{ type: 'puppeteer-element1' }, { type: 'puppeteer-element2' }]
        return elements.map(element => new WebElement(element, this))
      }

      // Test each helper's method behavior
      const playwrightHelper = { constructor: { name: 'Playwright' } }
      const webdriverHelper = { constructor: { name: 'WebDriver' } }
      const puppeteerHelper = { constructor: { name: 'Puppeteer' } }

      const playwrightResults = mockPlaywrightGrabWebElements.call(playwrightHelper, '.test')
      const webdriverResults = mockWebDriverGrabWebElements.call(webdriverHelper, '.test')
      const puppeteerResults = mockPuppeteerGrabWebElements.call(puppeteerHelper, '.test')

      expect(playwrightResults).to.have.length(2)
      expect(webdriverResults).to.have.length(2)
      expect(puppeteerResults).to.have.length(2)

      playwrightResults.forEach(result => expect(result).to.be.instanceOf(WebElement))
      webdriverResults.forEach(result => expect(result).to.be.instanceOf(WebElement))
      puppeteerResults.forEach(result => expect(result).to.be.instanceOf(WebElement))
    })
  })
})
