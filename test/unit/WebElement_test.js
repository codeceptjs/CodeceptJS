import { expect } from 'chai'
import WebElement from '../../lib/element/WebElement'

describe('WebElement', () => {
  describe('constructor and helper detection', () => {
    it('should detect Playwright helper', () => {
      const mockElement = {}
      const mockHelper = { constructor: { name: 'Playwright' } }
      const webElement = new WebElement(mockElement, mockHelper)

      expect(webElement.helperType).to.equal('playwright')
      expect(webElement.getNativeElement()).to.equal(mockElement)
      expect(webElement.getHelper()).to.equal(mockHelper)
    })

    it('should detect WebDriver helper', () => {
      const mockElement = {}
      const mockHelper = { constructor: { name: 'WebDriver' } }
      const webElement = new WebElement(mockElement, mockHelper)

      expect(webElement.helperType).to.equal('webdriver')
    })

    it('should detect Puppeteer helper', () => {
      const mockElement = {}
      const mockHelper = { constructor: { name: 'Puppeteer' } }
      const webElement = new WebElement(mockElement, mockHelper)

      expect(webElement.helperType).to.equal('puppeteer')
    })

    it('should handle unknown helper', () => {
      const mockElement = {}
      const mockHelper = { constructor: { name: 'Unknown' } }
      const webElement = new WebElement(mockElement, mockHelper)

      expect(webElement.helperType).to.equal('unknown')
    })
  })

  describe('getText()', () => {
    it('should work with Playwright helper', async () => {
      const mockElement = {
        textContent: () => Promise.resolve('test text'),
      }
      const mockHelper = { constructor: { name: 'Playwright' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const text = await webElement.getText()
      expect(text).to.equal('test text')
    })

    it('should work with WebDriver helper', async () => {
      const mockElement = {
        getText: () => Promise.resolve('test text'),
      }
      const mockHelper = { constructor: { name: 'WebDriver' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const text = await webElement.getText()
      expect(text).to.equal('test text')
    })

    it('should work with Puppeteer helper', async () => {
      const mockElement = {
        evaluate: fn => Promise.resolve('test text'),
      }
      const mockHelper = { constructor: { name: 'Puppeteer' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const text = await webElement.getText()
      expect(text).to.equal('test text')
    })

    it('should throw error for unknown helper', async () => {
      const mockElement = {}
      const mockHelper = { constructor: { name: 'Unknown' } }
      const webElement = new WebElement(mockElement, mockHelper)

      try {
        await webElement.getText()
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error.message).to.include('Unsupported helper type: unknown')
      }
    })
  })

  describe('getAttribute()', () => {
    it('should work with Playwright helper', async () => {
      const mockElement = {
        getAttribute: name => Promise.resolve(name === 'id' ? 'test-id' : null),
      }
      const mockHelper = { constructor: { name: 'Playwright' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const attr = await webElement.getAttribute('id')
      expect(attr).to.equal('test-id')
    })

    it('should work with WebDriver helper', async () => {
      const mockElement = {
        getAttribute: name => Promise.resolve(name === 'class' ? 'test-class' : null),
      }
      const mockHelper = { constructor: { name: 'WebDriver' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const attr = await webElement.getAttribute('class')
      expect(attr).to.equal('test-class')
    })

    it('should work with Puppeteer helper', async () => {
      const mockElement = {
        evaluate: (fn, attrName) => Promise.resolve(attrName === 'data-test' ? 'test-value' : null),
      }
      const mockHelper = { constructor: { name: 'Puppeteer' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const attr = await webElement.getAttribute('data-test')
      expect(attr).to.equal('test-value')
    })
  })

  describe('getProperty()', () => {
    it('should work with Playwright helper', async () => {
      const mockElement = {
        evaluate: (fn, propName) => Promise.resolve(propName === 'value' ? 'test-value' : null),
      }
      const mockHelper = { constructor: { name: 'Playwright' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const prop = await webElement.getProperty('value')
      expect(prop).to.equal('test-value')
    })

    it('should work with WebDriver helper', async () => {
      const mockElement = {
        getProperty: name => Promise.resolve(name === 'checked' ? true : null),
      }
      const mockHelper = { constructor: { name: 'WebDriver' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const prop = await webElement.getProperty('checked')
      expect(prop).to.equal(true)
    })

    it('should work with Puppeteer helper', async () => {
      const mockElement = {
        evaluate: (fn, propName) => Promise.resolve(propName === 'disabled' ? false : null),
      }
      const mockHelper = { constructor: { name: 'Puppeteer' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const prop = await webElement.getProperty('disabled')
      expect(prop).to.equal(false)
    })
  })

  describe('isVisible()', () => {
    it('should work with Playwright helper', async () => {
      const mockElement = {
        isVisible: () => Promise.resolve(true),
      }
      const mockHelper = { constructor: { name: 'Playwright' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const visible = await webElement.isVisible()
      expect(visible).to.equal(true)
    })

    it('should work with WebDriver helper', async () => {
      const mockElement = {
        isDisplayed: () => Promise.resolve(false),
      }
      const mockHelper = { constructor: { name: 'WebDriver' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const visible = await webElement.isVisible()
      expect(visible).to.equal(false)
    })

    it('should work with Puppeteer helper', async () => {
      const mockElement = {
        evaluate: fn => Promise.resolve(true), // Simulates visible element
      }
      const mockHelper = { constructor: { name: 'Puppeteer' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const visible = await webElement.isVisible()
      expect(visible).to.equal(true)
    })
  })

  describe('isEnabled()', () => {
    it('should work with Playwright helper', async () => {
      const mockElement = {
        isEnabled: () => Promise.resolve(true),
      }
      const mockHelper = { constructor: { name: 'Playwright' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const enabled = await webElement.isEnabled()
      expect(enabled).to.equal(true)
    })

    it('should work with WebDriver helper', async () => {
      const mockElement = {
        isEnabled: () => Promise.resolve(false),
      }
      const mockHelper = { constructor: { name: 'WebDriver' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const enabled = await webElement.isEnabled()
      expect(enabled).to.equal(false)
    })

    it('should work with Puppeteer helper', async () => {
      const mockElement = {
        evaluate: fn => Promise.resolve(true), // Simulates enabled element
      }
      const mockHelper = { constructor: { name: 'Puppeteer' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const enabled = await webElement.isEnabled()
      expect(enabled).to.equal(true)
    })
  })

  describe('click()', () => {
    it('should work with Playwright helper', async () => {
      let clicked = false
      const mockElement = {
        click: options => {
          clicked = true
          return Promise.resolve()
        },
      }
      const mockHelper = { constructor: { name: 'Playwright' } }
      const webElement = new WebElement(mockElement, mockHelper)

      await webElement.click()
      expect(clicked).to.equal(true)
    })

    it('should work with WebDriver helper', async () => {
      let clicked = false
      const mockElement = {
        click: () => {
          clicked = true
          return Promise.resolve()
        },
      }
      const mockHelper = { constructor: { name: 'WebDriver' } }
      const webElement = new WebElement(mockElement, mockHelper)

      await webElement.click()
      expect(clicked).to.equal(true)
    })

    it('should work with Puppeteer helper', async () => {
      let clicked = false
      const mockElement = {
        click: options => {
          clicked = true
          return Promise.resolve()
        },
      }
      const mockHelper = { constructor: { name: 'Puppeteer' } }
      const webElement = new WebElement(mockElement, mockHelper)

      await webElement.click()
      expect(clicked).to.equal(true)
    })
  })

  describe('type()', () => {
    it('should work with Playwright helper', async () => {
      let typedText = ''
      const mockElement = {
        type: (text, options) => {
          typedText = text
          return Promise.resolve()
        },
      }
      const mockHelper = { constructor: { name: 'Playwright' } }
      const webElement = new WebElement(mockElement, mockHelper)

      await webElement.type('test input')
      expect(typedText).to.equal('test input')
    })

    it('should work with WebDriver helper', async () => {
      let typedText = ''
      const mockElement = {
        setValue: text => {
          typedText = text
          return Promise.resolve()
        },
      }
      const mockHelper = { constructor: { name: 'WebDriver' } }
      const webElement = new WebElement(mockElement, mockHelper)

      await webElement.type('test input')
      expect(typedText).to.equal('test input')
    })

    it('should work with Puppeteer helper', async () => {
      let typedText = ''
      const mockElement = {
        type: (text, options) => {
          typedText = text
          return Promise.resolve()
        },
      }
      const mockHelper = { constructor: { name: 'Puppeteer' } }
      const webElement = new WebElement(mockElement, mockHelper)

      await webElement.type('test input')
      expect(typedText).to.equal('test input')
    })
  })

  describe('child element search', () => {
    it('should find single child element with $()', async () => {
      const mockChildElement = { id: 'child' }
      const mockElement = {
        $: selector => Promise.resolve(selector === '.child' ? mockChildElement : null),
      }
      const mockHelper = { constructor: { name: 'Playwright' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const childElement = await webElement.$('.child')
      expect(childElement).to.be.instanceOf(WebElement)
      expect(childElement.getNativeElement()).to.equal(mockChildElement)
    })

    it('should return null when child element not found', async () => {
      const mockElement = {
        $: selector => Promise.resolve(null),
      }
      const mockHelper = { constructor: { name: 'Playwright' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const childElement = await webElement.$('.nonexistent')
      expect(childElement).to.be.null
    })

    it('should find multiple child elements with $$()', async () => {
      const mockChildElements = [{ id: 'child1' }, { id: 'child2' }]
      const mockElement = {
        $$: selector => Promise.resolve(selector === '.children' ? mockChildElements : []),
      }
      const mockHelper = { constructor: { name: 'Playwright' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const childElements = await webElement.$$('.children')
      expect(childElements).to.have.length(2)
      expect(childElements[0]).to.be.instanceOf(WebElement)
      expect(childElements[1]).to.be.instanceOf(WebElement)
      expect(childElements[0].getNativeElement()).to.equal(mockChildElements[0])
      expect(childElements[1].getNativeElement()).to.equal(mockChildElements[1])
    })

    it('should return empty array when no child elements found', async () => {
      const mockElement = {
        $$: selector => Promise.resolve([]),
      }
      const mockHelper = { constructor: { name: 'Playwright' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const childElements = await webElement.$$('.nonexistent')
      expect(childElements).to.have.length(0)
    })
  })

  describe('_normalizeLocator()', () => {
    let webElement

    beforeEach(() => {
      const mockElement = {}
      const mockHelper = { constructor: { name: 'Playwright' } }
      webElement = new WebElement(mockElement, mockHelper)
    })

    it('should handle string locators', () => {
      expect(webElement._normalizeLocator('.test')).to.equal('.test')
      expect(webElement._normalizeLocator('#test')).to.equal('#test')
    })

    it('should handle locator objects with css', () => {
      expect(webElement._normalizeLocator({ css: '.test-css' })).to.equal('.test-css')
    })

    it('should handle locator objects with xpath', () => {
      expect(webElement._normalizeLocator({ xpath: '//div' })).to.equal('//div')
    })

    it('should handle locator objects with id', () => {
      expect(webElement._normalizeLocator({ id: 'test-id' })).to.equal('#test-id')
    })

    it('should handle locator objects with name', () => {
      expect(webElement._normalizeLocator({ name: 'test-name' })).to.equal('[name="test-name"]')
    })

    it('should handle locator objects with className', () => {
      expect(webElement._normalizeLocator({ className: 'test-class' })).to.equal('.test-class')
    })

    it('should convert unknown objects to string', () => {
      const obj = { toString: () => 'custom-locator' }
      expect(webElement._normalizeLocator(obj)).to.equal('custom-locator')
    })
  })

  describe('getBoundingBox()', () => {
    it('should work with Playwright helper', async () => {
      const mockBoundingBox = { x: 10, y: 20, width: 100, height: 50 }
      const mockElement = {
        boundingBox: () => Promise.resolve(mockBoundingBox),
      }
      const mockHelper = { constructor: { name: 'Playwright' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const box = await webElement.getBoundingBox()
      expect(box).to.deep.equal(mockBoundingBox)
    })

    it('should work with WebDriver helper', async () => {
      const mockRect = { x: 15, y: 25, width: 120, height: 60 }
      const mockElement = {
        getRect: () => Promise.resolve(mockRect),
      }
      const mockHelper = { constructor: { name: 'WebDriver' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const box = await webElement.getBoundingBox()
      expect(box).to.deep.equal(mockRect)
    })

    it('should work with Puppeteer helper', async () => {
      const mockBoundingBox = { x: 5, y: 10, width: 80, height: 40 }
      const mockElement = {
        boundingBox: () => Promise.resolve(mockBoundingBox),
      }
      const mockHelper = { constructor: { name: 'Puppeteer' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const box = await webElement.getBoundingBox()
      expect(box).to.deep.equal(mockBoundingBox)
    })
  })

  describe('getValue()', () => {
    it('should work with Playwright helper', async () => {
      const mockElement = {
        inputValue: () => Promise.resolve('input-value'),
      }
      const mockHelper = { constructor: { name: 'Playwright' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const value = await webElement.getValue()
      expect(value).to.equal('input-value')
    })

    it('should work with WebDriver helper', async () => {
      const mockElement = {
        getValue: () => Promise.resolve('input-value'),
      }
      const mockHelper = { constructor: { name: 'WebDriver' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const value = await webElement.getValue()
      expect(value).to.equal('input-value')
    })

    it('should work with Puppeteer helper', async () => {
      const mockElement = {
        evaluate: fn => Promise.resolve('input-value'),
      }
      const mockHelper = { constructor: { name: 'Puppeteer' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const value = await webElement.getValue()
      expect(value).to.equal('input-value')
    })
  })

  describe('getInnerHTML()', () => {
    it('should work with Playwright helper', async () => {
      const mockElement = {
        innerHTML: () => Promise.resolve('<span>inner</span>'),
      }
      const mockHelper = { constructor: { name: 'Playwright' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const html = await webElement.getInnerHTML()
      expect(html).to.equal('<span>inner</span>')
    })

    it('should work with WebDriver helper', async () => {
      const mockElement = {
        getProperty: prop => Promise.resolve(prop === 'innerHTML' ? '<div>content</div>' : null),
      }
      const mockHelper = { constructor: { name: 'WebDriver' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const html = await webElement.getInnerHTML()
      expect(html).to.equal('<div>content</div>')
    })

    it('should work with Puppeteer helper', async () => {
      const mockElement = {
        evaluate: fn => Promise.resolve('<p>paragraph</p>'),
      }
      const mockHelper = { constructor: { name: 'Puppeteer' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const html = await webElement.getInnerHTML()
      expect(html).to.equal('<p>paragraph</p>')
    })
  })

  describe('exists()', () => {
    it('should work with Playwright helper', async () => {
      const mockElement = {
        evaluate: fn => Promise.resolve(true),
      }
      const mockHelper = { constructor: { name: 'Playwright' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const exists = await webElement.exists()
      expect(exists).to.equal(true)
    })

    it('should work with WebDriver helper', async () => {
      const mockElement = {}
      const mockHelper = { constructor: { name: 'WebDriver' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const exists = await webElement.exists()
      expect(exists).to.equal(true)
    })

    it('should work with Puppeteer helper', async () => {
      const mockElement = {
        evaluate: fn => Promise.resolve(true),
      }
      const mockHelper = { constructor: { name: 'Puppeteer' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const exists = await webElement.exists()
      expect(exists).to.equal(true)
    })

    it('should handle errors and return false', async () => {
      const mockElement = {
        evaluate: () => Promise.reject(new Error('Element not found')),
      }
      const mockHelper = { constructor: { name: 'Playwright' } }
      const webElement = new WebElement(mockElement, mockHelper)

      const exists = await webElement.exists()
      expect(exists).to.equal(false)
    })
  })
})
