const chai = require('chai')
const expect = chai.expect

const Playwright = require('../../lib/helper/Playwright')
const Locator = require('../../lib/locator')

describe('Custom Locator Strategies', function () {
  this.timeout(5000)

  let helper

  beforeEach(() => {
    helper = new Playwright({
      url: 'http://localhost',
      browser: 'chromium',
      customLocatorStrategies: {
        byRole: (selector, root) => {
          return root.querySelector(`[role="${selector}"]`)
        },
        byTestId: (selector, root) => {
          return root.querySelector(`[data-testid="${selector}"]`)
        },
        byDataQa: (selector, root) => {
          const elements = root.querySelectorAll(`[data-qa="${selector}"]`)
          return Array.from(elements)
        },
      },
    })
  })

  describe('#configuration', () => {
    it('should store custom locator strategies in helper', () => {
      expect(helper.customLocatorStrategies).to.not.be.undefined
      expect(helper.customLocatorStrategies).to.be.an('object')
      expect(Object.keys(helper.customLocatorStrategies)).to.have.length(3)
    })

    it('should have all configured strategies as functions', () => {
      expect(helper.customLocatorStrategies.byRole).to.be.a('function')
      expect(helper.customLocatorStrategies.byTestId).to.be.a('function')
      expect(helper.customLocatorStrategies.byDataQa).to.be.a('function')
    })
  })

  describe('#_isCustomLocatorStrategyDefined', () => {
    it('should return true when strategies are defined', () => {
      expect(helper._isCustomLocatorStrategyDefined()).to.be.true
    })

    it('should return false when no strategies are defined', () => {
      const emptyHelper = new Playwright({
        url: 'http://localhost',
        browser: 'chromium',
      })
      expect(emptyHelper._isCustomLocatorStrategyDefined()).to.be.false
    })

    it('should return false when strategies is empty object', () => {
      const emptyHelper = new Playwright({
        url: 'http://localhost',
        browser: 'chromium',
        customLocatorStrategies: {},
      })
      expect(emptyHelper._isCustomLocatorStrategyDefined()).to.be.false
    })
  })

  describe('#_lookupCustomLocator', () => {
    it('should find existing custom locator function', () => {
      const strategy = helper._lookupCustomLocator('byRole')
      expect(strategy).to.be.a('function')
    })

    it('should return null for non-existent strategy', () => {
      const strategy = helper._lookupCustomLocator('nonExistent')
      expect(strategy).to.be.null
    })

    it('should return null when customLocatorStrategies is not defined', () => {
      const emptyHelper = new Playwright({
        url: 'http://localhost',
        browser: 'chromium',
      })
      const strategy = emptyHelper._lookupCustomLocator('byRole')
      expect(strategy).to.be.null
    })

    it('should return null when customLocatorStrategies is null', () => {
      const helper = new Playwright({
        url: 'http://localhost',
        browser: 'chromium',
      })
      helper.customLocatorStrategies = null
      const strategy = helper._lookupCustomLocator('byRole')
      expect(strategy).to.be.null
    })

    it('should return null when strategy exists but is not a function', () => {
      const helper = new Playwright({
        url: 'http://localhost',
        browser: 'chromium',
        customLocatorStrategies: {
          notAFunction: 'this is a string, not a function',
        },
      })
      const strategy = helper._lookupCustomLocator('notAFunction')
      expect(strategy).to.be.null
    })
  })

  describe('#_isCustomLocator', () => {
    it('should identify custom locators correctly', () => {
      expect(helper._isCustomLocator({ byRole: 'button' })).to.be.true
      expect(helper._isCustomLocator({ byTestId: 'submit' })).to.be.true
      expect(helper._isCustomLocator({ byDataQa: 'form' })).to.be.true
    })

    it('should not identify standard locators as custom', () => {
      expect(helper._isCustomLocator({ css: '#test' })).to.be.false
      expect(helper._isCustomLocator({ xpath: '//div' })).to.be.false
      expect(helper._isCustomLocator({ id: 'test' })).to.be.false
      expect(helper._isCustomLocator({ name: 'test' })).to.be.false
    })

    it('should throw error for undefined custom strategy', () => {
      expect(() => {
        helper._isCustomLocator({ undefinedStrategy: 'test' })
      }).to.throw('Please define "customLocatorStrategies"')
    })

    it('should handle string locators correctly', () => {
      expect(helper._isCustomLocator('#test')).to.be.false
      expect(helper._isCustomLocator('//div')).to.be.false
    })

    it('should handle edge case locators', () => {
      expect(helper._isCustomLocator(null)).to.be.false
      expect(helper._isCustomLocator(undefined)).to.be.false
      expect(helper._isCustomLocator({})).to.be.false
    })
  })

  describe('Locator class integration', () => {
    it('should identify custom locator types via Locator class', () => {
      const customLocator = new Locator({ byRole: 'button' })
      expect(customLocator.isCustom()).to.be.true
      expect(customLocator.type).to.equal('byRole')
      expect(customLocator.value).to.equal('button')
    })

    it('should not identify standard locator types as custom', () => {
      const standardLocator = new Locator({ css: '#test' })
      expect(standardLocator.isCustom()).to.be.false
    })

    it('should handle multiple custom locator strategies in one helper', () => {
      const multiHelper = new Playwright({
        url: 'http://localhost',
        browser: 'chromium',
        customLocatorStrategies: {
          byRole: (s, r) => r.querySelector(`[role="${s}"]`),
          byTestId: (s, r) => r.querySelector(`[data-testid="${s}"]`),
          byClass: (s, r) => r.querySelector(`.${s}`),
          byAttribute: (s, r) => r.querySelector(`[${s}]`),
          byCustom: (s, r) => r.querySelector(s),
        },
      })

      expect(multiHelper._isCustomLocatorStrategyDefined()).to.be.true
      expect(Object.keys(multiHelper.customLocatorStrategies)).to.have.length(5)

      // Test each strategy
      expect(multiHelper._isCustomLocator({ byRole: 'button' })).to.be.true
      expect(multiHelper._isCustomLocator({ byTestId: 'test' })).to.be.true
      expect(multiHelper._isCustomLocator({ byClass: 'active' })).to.be.true
      expect(multiHelper._isCustomLocator({ byAttribute: 'disabled' })).to.be.true
      expect(multiHelper._isCustomLocator({ byCustom: '#custom' })).to.be.true
    })
  })

  describe('Error handling', () => {
    it('should handle malformed configuration gracefully', () => {
      // Test with non-object customLocatorStrategies
      const badHelper1 = new Playwright({
        url: 'http://localhost',
        browser: 'chromium',
        customLocatorStrategies: 'not an object',
      })
      expect(badHelper1._isCustomLocatorStrategyDefined()).to.be.false
      expect(badHelper1._lookupCustomLocator('anything')).to.be.null

      // Test with null customLocatorStrategies
      const badHelper2 = new Playwright({
        url: 'http://localhost',
        browser: 'chromium',
        customLocatorStrategies: null,
      })
      expect(badHelper2._isCustomLocatorStrategyDefined()).to.be.false
      expect(badHelper2._lookupCustomLocator('anything')).to.be.null
    })

    it('should validate strategy functions correctly', () => {
      const mixedHelper = new Playwright({
        url: 'http://localhost',
        browser: 'chromium',
        customLocatorStrategies: {
          validStrategy: (s, r) => r.querySelector(s),
          invalidStrategy1: 'not a function',
          invalidStrategy2: null,
          invalidStrategy3: undefined,
          invalidStrategy4: {},
          invalidStrategy5: [],
        },
      })

      expect(mixedHelper._lookupCustomLocator('validStrategy')).to.be.a('function')
      expect(mixedHelper._lookupCustomLocator('invalidStrategy1')).to.be.null
      expect(mixedHelper._lookupCustomLocator('invalidStrategy2')).to.be.null
      expect(mixedHelper._lookupCustomLocator('invalidStrategy3')).to.be.null
      expect(mixedHelper._lookupCustomLocator('invalidStrategy4')).to.be.null
      expect(mixedHelper._lookupCustomLocator('invalidStrategy5')).to.be.null
    })
  })

  describe('buildLocatorString integration', () => {
    it('should build correct locator strings for custom strategies', () => {
      // We can't easily test buildLocatorString directly since it's not exported,
      // but we can test that custom locators are properly identified
      const locator1 = new Locator({ byRole: 'button' })
      const locator2 = new Locator({ byTestId: 'submit' })
      const locator3 = new Locator({ byDataQa: 'form-section' })

      expect(locator1.isCustom()).to.be.true
      expect(locator2.isCustom()).to.be.true
      expect(locator3.isCustom()).to.be.true

      expect(locator1.type).to.equal('byRole')
      expect(locator1.value).to.equal('button')

      expect(locator2.type).to.equal('byTestId')
      expect(locator2.value).to.equal('submit')

      expect(locator3.type).to.equal('byDataQa')
      expect(locator3.value).to.equal('form-section')
    })
  })
})
