import { expect } from 'chai'
import { looksLikeSelector, checkSelectorIsNotText } from '../../lib/helper/extras/selectorCheck.js'
import store from '../../lib/store.js'

describe('selectorCheck', () => {
  describe('looksLikeSelector', () => {
    it('rejects a text passed instead of a selector', () => {
      expect(looksLikeSelector('Description Persistence Suite OtherYappiestIndigo973')).to.be.false
      expect(looksLikeSelector('Log in to your account')).to.be.false
    })

    it('accepts CSS locators', () => {
      expect(looksLikeSelector('.monaco-editor')).to.be.true
      expect(looksLikeSelector('#save')).to.be.true
      expect(looksLikeSelector('[data-test] a')).to.be.true
      expect(looksLikeSelector('ul > li')).to.be.true
      expect(looksLikeSelector('li:first-child')).to.be.true
    })

    it('accepts XPath locators', () => {
      expect(looksLikeSelector('//*[contains(@class,"monaco-editor")][1]')).to.be.true
      expect(looksLikeSelector('.//div')).to.be.true
      expect(looksLikeSelector('(//a)[1]')).to.be.true
    })

    it('accepts descendant selectors built from tag names', () => {
      expect(looksLikeSelector('div span')).to.be.true
      expect(looksLikeSelector('my-app my-button')).to.be.true
    })

    it('accepts a single word', () => {
      expect(looksLikeSelector('button')).to.be.true
      expect(looksLikeSelector('Save')).to.be.true
    })

    it('accepts mobile and engine locators', () => {
      expect(looksLikeSelector('~my Button')).to.be.true
      expect(looksLikeSelector('android=new UiSelector().text("Save now")')).to.be.true
      expect(looksLikeSelector('text=Save Changes')).to.be.true
    })
  })

  describe('checkSelectorIsNotText', () => {
    const warnings = []
    const helper = options => ({
      options,
      debugSection: (section, msg) => warnings.push(`[${section}] ${msg}`),
    })

    beforeEach(() => {
      warnings.length = 0
      store.debugMode = false
      store.currentStep = { title: 'waitForElement' }
    })

    afterEach(() => {
      store.debugMode = false
      store.currentStep = null
    })

    it('stays silent outside of debug and strict mode', () => {
      checkSelectorIsNotText(helper({}), 'Description Persistence Suite')
      expect(warnings).to.be.empty
    })

    it('stays silent on non-string and empty locators', () => {
      store.debugMode = true
      checkSelectorIsNotText(helper({ strict: true }), { css: 'a b' })
      checkSelectorIsNotText(helper({ strict: true }), undefined)
      checkSelectorIsNotText(helper({ strict: true }), '   ')
      expect(warnings).to.be.empty
    })

    it('warns in debug mode', () => {
      store.debugMode = true
      checkSelectorIsNotText(helper({}), 'Description Persistence Suite')
      expect(warnings).to.have.lengthOf(1)
      expect(warnings[0]).to.include('[Warning]')
      expect(warnings[0]).to.include("doesn't look like a CSS or XPath selector")
      expect(warnings[0]).to.include('I.waitForElement()')
      expect(warnings[0]).to.include('I.waitForText()')
    })

    it('does not warn on a valid selector in debug mode', () => {
      store.debugMode = true
      checkSelectorIsNotText(helper({}), '.monaco-editor')
      expect(warnings).to.be.empty
    })

    it('throws in strict mode', () => {
      const check = () => checkSelectorIsNotText(helper({ strict: true }), 'Description Persistence Suite')
      expect(check).to.throw(/doesn't look like a CSS or XPath selector/)
      try {
        check()
      } catch (err) {
        expect(err.name).to.equal('InvalidSelector')
      }
    })

    it('does not throw on a valid selector in strict mode', () => {
      checkSelectorIsNotText(helper({ strict: true }), '//div[@id="save"]')
      expect(warnings).to.be.empty
    })

    it('warns once per locator within a step', () => {
      store.debugMode = true
      const h = helper({})
      checkSelectorIsNotText(h, 'Description Persistence Suite')
      checkSelectorIsNotText(h, 'Description Persistence Suite')
      expect(warnings).to.have.lengthOf(1)
    })

    it('suggests I.see() for assertion steps', () => {
      store.debugMode = true
      store.currentStep = { title: 'seeElement' }
      checkSelectorIsNotText(helper({}), 'Description Persistence Suite')
      expect(warnings[0]).to.include('I.see()')
    })
  })
})
