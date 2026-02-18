import * as chai from 'chai'
import storeModule from '../../lib/store.js'
const store = storeModule.default || storeModule
const expect = chai.expect
const assert = chai.assert
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataFile = path.join(__dirname, '/../data/app/db')
import { test as testUtils, fileExists } from '../../lib/utils.js'
const formContents = testUtils.submittedData(dataFile)
import { secret } from '../../lib/secret.js'

import Locator from '../../lib/locator.js'
import customLocators from '../../lib/plugin/customLocator.js'

let originalLocators
let I
let data
let siteUrl

export function init(testData) {
  data = testData
}

export function tests() {
  const isHelper = helperName => I.constructor.name === helperName

  beforeEach(() => {
    I = data.I
    siteUrl = data.siteUrl
    if (fileExists(dataFile)) fs.unlinkSync(dataFile)
  })

  describe('#saveElementScreenshot', () => {
    beforeEach(() => {
      global.output_dir = path.join(global.codecept_dir, 'output')
    })

    it('should create a screenshot file in output dir of element', async () => {
      await I.amOnPage('/form/field')
      await I.seeElement("input[name='name']")
      const sec = new Date().getUTCMilliseconds()
      await I.saveElementScreenshot("input[name='name']", `element_screenshot_${sec}.png`)
      assert.ok(fileExists(path.join(global.output_dir, `element_screenshot_${sec}.png`)), null, 'file does not exists')
    })
  })

  describe('current url : #seeInCurrentUrl, #seeCurrentUrlEquals, #grabCurrentUrl, ...', () => {
    it('should check for url fragment', async () => {
      await I.amOnPage('/form/checkbox')
      await I.seeInCurrentUrl('/form')
      await I.dontSeeInCurrentUrl('/user')
    })

    it('should check for equality', async () => {
      await I.amOnPage('/info')
      await I.seeCurrentUrlEquals('/info')
      await I.dontSeeCurrentUrlEquals('form')
    })

    it('should check for equality in absolute urls', async () => {
      await I.amOnPage('/info')
      await I.seeCurrentUrlEquals(`${siteUrl}/info`)
      await I.dontSeeCurrentUrlEquals(`${siteUrl}/form`)
    })

    it('should grab browser url', async () => {
      await I.amOnPage('/info')
      const url = await I.grabCurrentUrl()
      assert.equal(url, `${siteUrl}/info`)
    })

    it('should check for equality with query strings', async () => {
      await I.amOnPage('/info?user=test')
      // Query strings matter for exact equality
      await I.seeCurrentUrlEquals('/info?user=test')
      await I.dontSeeCurrentUrlEquals('/info')
      // But substring check works
      await I.seeInCurrentUrl('/info')
      await I.seeInCurrentUrl('user=test')
    })

    it('should handle root path with query strings', async () => {
      await I.amOnPage('/?user=ok')
      // Query strings matter - exact equality requires query string
      await I.seeCurrentUrlEquals('/?user=ok')
      await I.dontSeeCurrentUrlEquals('/')
      // But substring check works for path fragment
      await I.seeInCurrentUrl('/')
    })

    it('should check path equality ignoring query strings', async () => {
      await I.amOnPage('/info?user=test')
      // Path equality ignores query strings
      await I.seeCurrentPathEquals('/info')
      await I.dontSeeCurrentPathEquals('/form')
      await I.dontSeeCurrentPathEquals('/info?user=test')
    })

    it('should check root path equality ignoring query strings', async () => {
      await I.amOnPage('/?user=ok')
      await I.seeCurrentPathEquals('/')
      await I.dontSeeCurrentPathEquals('/info')
    })

    it('should check path equality ignoring hash fragments', async () => {
      await I.amOnPage('/info#section')
      await I.seeCurrentPathEquals('/info')
      await I.dontSeeCurrentPathEquals('/info#section')
    })

    it('should normalize trailing slashes in path comparison', async () => {
      await I.amOnPage('/info/')
      await I.seeCurrentPathEquals('/info')
      await I.seeCurrentPathEquals('/info/')

      await I.amOnPage('/form/field/')
      await I.seeCurrentPathEquals('/form/field')
      await I.seeCurrentPathEquals('/form/field/')
    })

    it('should normalize multiple consecutive slashes in path', async () => {
      await I.amOnPage('/form//field')
      await I.seeCurrentPathEquals('/form/field')
      await I.seeCurrentPathEquals('/form//field')
    })

    it('should handle root path correctly', async () => {
      await I.amOnPage('/')
      await I.seeCurrentPathEquals('/')
      await I.seeCurrentPathEquals('')
      await I.dontSeeCurrentPathEquals('/info')
    })

    it('should normalize both expected and actual paths', async () => {
      await I.amOnPage('/form/field/')
      await I.seeCurrentPathEquals('/form/field/')
      await I.seeCurrentPathEquals('/form/field')

      await I.amOnPage('/form//field//')
      await I.seeCurrentPathEquals('/form/field')
      await I.seeCurrentPathEquals('/form/field/')
    })
  })

  describe('#waitInUrl, #waitUrlEquals', () => {
    it('should wait part of the URL to match the expected', async () => {
      try {
        await I.amOnPage('/info')
        await I.waitInUrl('/info')
        await I.waitInUrl('/info2', 0.1)
      } catch (e) {
        assert.include(e.message, `expected url to include ${siteUrl}/info2, but found ${siteUrl}/info`)
      }
    })

    it('should wait for the entire URL to match the expected', async () => {
      try {
        await I.amOnPage('/info')
        await I.waitUrlEquals('/info')
        await I.waitUrlEquals(`${siteUrl}/info`)
        await I.waitUrlEquals('/info2', 0.1)
      } catch (e) {
        assert.include(e.message, `expected url to be ${siteUrl}/info2, but found ${siteUrl}/info`)
      }
    })
  })

  describe('#waitCurrentPathEquals', () => {
    it('should wait for path to match (ignoring query strings)', async () => {
      await I.amOnPage('/info')
      await I.waitCurrentPathEquals('/info')
    })

    it('should wait timeout with proper error message', async () => {
      try {
        await I.amOnPage('/info')
        await I.waitCurrentPathEquals('/nonexistent', 0.1)
      } catch (e) {
        assert.include(e.message, 'expected path to be /nonexistent')
      }
    })

    it('should normalize paths when comparing', async () => {
      await I.amOnPage('/form/field/')
      await I.waitCurrentPathEquals('/form/field')
      await I.waitCurrentPathEquals('/form/field/')
    })
  })

  describe('see text : #see', () => {
    it('should check text on site', async () => {
      await I.amOnPage('/')
      await I.see('Welcome to test app!')
      await I.see('A wise man said: "debug!"')
      await I.dontSee('Info')
    })

    it('should check text on site with ignoreCase option', async () => {
      await I.amOnPage('/')
      await I.see('Welcome')
      store.currentStep = { opts: { ignoreCase: true } }
      await I.see('welcome to test app!')
      await I.see('test link', 'a')
      store.currentStep = {}
      await I.dontSee('welcome')
    })

    it('should check text inside element', async () => {
      await I.amOnPage('/')
      await I.see('Welcome to test app!', 'h1')
      await I.amOnPage('/info')
      await I.see('valuable', { css: 'p' })
      await I.see('valuable', '//p')
      await I.dontSee('valuable', 'h1')
    })

    it('should verify non-latin chars', async () => {
      await I.amOnPage('/info')
      await I.see('на')
      await I.see("Don't do that at home!", 'h3')
      await I.see('Текст', 'p')
    })

    it('should verify text with &nbsp', async () => {
      if (isHelper('WebDriver')) return
      await I.amOnPage('/')
      await I.see('With special space chars')
    })
  })

  describe('see element : #seeElement, #seeElementInDOM, #dontSeeElement', () => {
    it('should check visible elements on page', async () => {
      await I.amOnPage('/form/field')
      await I.seeElement('input[name=name]')
      await I.seeElement({ name: 'name' })
      await I.seeElement('//input[@id="name"]')
      await I.dontSeeElement('#something-beyond')
      await I.dontSeeElement('//input[@id="something-beyond"]')
      await I.dontSeeElement({ name: 'noname' })
      await I.dontSeeElement('#noid')
    })

    it('should check elements are in the DOM', async () => {
      await I.amOnPage('/form/field')
      await I.seeElementInDOM('input[name=name]')
      await I.seeElementInDOM('//input[@id="name"]')
      await I.seeElementInDOM({ name: 'noname' })
      await I.seeElementInDOM('#noid')
      await I.dontSeeElementInDOM('#something-beyond')
      await I.dontSeeElementInDOM('//input[@id="something-beyond"]')
    })

    it('should check elements are visible on the page', async () => {
      await I.amOnPage('/form/field')
      await I.seeElementInDOM('input[name=email]')
      await I.dontSeeElement('input[name=email]')
      await I.dontSeeElement('#something-beyond')
    })
  })

  describe('#seeNumberOfVisibleElements', () => {
    it('should check number of visible elements for given locator', async () => {
      await I.amOnPage('/info')
      await I.seeNumberOfVisibleElements('//div[@id = "grab-multiple"]//a', 3)
    })
  })

  describe('#grabNumberOfVisibleElements', () => {
    it('should grab number of visible elements for given locator', async () => {
      await I.amOnPage('/info')
      const num = await I.grabNumberOfVisibleElements('//div[@id = "grab-multiple"]//a')
      assert.equal(num, 3)
    })

    it('should support locators like {xpath:"//div"}', async () => {
      await I.amOnPage('/info')
      const num = await I.grabNumberOfVisibleElements({
        xpath: '//div[@id = "grab-multiple"]//a',
      })
      assert.equal(num, 3)
    })

    it('should grab number of visible elements for given css locator', async () => {
      await I.amOnPage('/info')
      const num = await I.grabNumberOfVisibleElements('[id=grab-multiple] a')
      assert.equal(num, 3)
    })

    it('should return 0 for non-existing elements', async () => {
      await I.amOnPage('/info')
      const num = await I.grabNumberOfVisibleElements('button[type=submit]')
      assert.equal(num, 0)
    })

    it('should honor visibility hidden style', async () => {
      await I.amOnPage('/info')
      const num = await I.grabNumberOfVisibleElements('.issue2928')
      assert.equal(num, 1)
    })
  })

  describe('#seeInSource, #dontSeeInSource', () => {
    it('should check meta of a page', async () => {
      await I.amOnPage('/info')
      await I.seeInSource('<body>')
      await I.dontSeeInSource('<meta>')
      await I.seeInSource('Invisible text')
      await I.seeInSource('content="text/html; charset=utf-8"')
    })
  })

  describe('#click', () => {
    it('should click by inner text', async () => {
      await I.amOnPage('/')
      await I.click('More info')
      await I.seeInCurrentUrl('/info')
    })

    it('should click by css', async () => {
      await I.amOnPage('/')
      await I.click('#link')
      await I.seeInCurrentUrl('/info')
    })

    it('should click by xpath', async () => {
      await I.amOnPage('/')
      await I.click('//a[@id="link"]')
      await I.seeInCurrentUrl('/info')
    })

    it('should click by name', async () => {
      await I.amOnPage('/form/button')
      await I.click('btn0')
      assert.equal(formContents('text'), 'val')
    })

    it('should click on context', async () => {
      await I.amOnPage('/')
      await I.click('More info', 'body>p')
      await I.seeInCurrentUrl('/info')
    })

    it('should not click wrong context', async () => {
      let err = false
      await I.amOnPage('/')
      try {
        await I.click('More info', '#area1')
      } catch (e) {
        err = true
      }

      assert.ok(err)
    })

    it('should should click by aria-label', async () => {
      await I.amOnPage('/form/aria')
      await I.click('get info')
      await I.seeInCurrentUrl('/info')
    })

    it('should click link with inner span', async () => {
      await I.amOnPage('/form/example7')
      await I.click('Buy Chocolate Bar')
      await I.seeCurrentUrlEquals('/')
    })

    it('should click link with xpath locator', async () => {
      await I.amOnPage('/form/example7')
      await I.click({
        xpath: '(//*[@title = "Chocolate Bar"])[1]',
      })
      await I.seeCurrentUrlEquals('/')
    })
  })

  describe('#forceClick', () => {
    it('should forceClick by inner text', async () => {
      await I.amOnPage('/')
      await I.forceClick('More info')
      if (isHelper('Puppeteer')) await I.waitForNavigation()
      await I.seeInCurrentUrl('/info')
    })

    it('should forceClick by css', async () => {
      await I.amOnPage('/')
      await I.forceClick('#link')
      if (isHelper('Puppeteer')) await I.waitForNavigation()
      await I.seeInCurrentUrl('/info')
    })

    it('should forceClick by xpath', async () => {
      await I.amOnPage('/')
      await I.forceClick('//a[@id="link"]')
      if (isHelper('Puppeteer')) await I.waitForNavigation()
      await I.seeInCurrentUrl('/info')
    })

    it('should forceClick on context', async () => {
      await I.amOnPage('/')
      await I.forceClick('More info', 'body>p')
      if (isHelper('Puppeteer')) await I.waitForNavigation()
      await I.seeInCurrentUrl('/info')
    })
  })

  // Could not get double click to work
  describe('#doubleClick', () => {
    it('it should doubleClick', async function () {
      await I.amOnPage('/form/doubleclick')
      await I.dontSee('Done!')
      await I.doubleClick('#block')
      await I.see('Done!')
    })
  })

  // rightClick does not seem to work either
  describe('#rightClick', () => {
    it('it should rightClick', async () => {
      await I.amOnPage('/form/rightclick')
      await I.dontSee('right clicked')
      await I.rightClick('Lorem Ipsum')
      await I.see('right clicked')
    })

    it('it should rightClick by locator', async () => {
      await I.amOnPage('/form/rightclick')
      await I.dontSee('right clicked')
      await I.rightClick('.context a')
      await I.see('right clicked')
    })

    it('it should rightClick by locator and context', async () => {
      await I.amOnPage('/form/rightclick')
      await I.dontSee('right clicked')
      await I.rightClick('Lorem Ipsum', '.context')
      await I.see('right clicked')
    })
  })

  describe('#clickXY', () => {
    it('should click at global coordinates', async () => {
      await I.amOnPage('/form/click_coordinates')
      await I.dontSee('Global click at:')
      await I.clickXY(100, 50)
      await I.see('Global click at: X=100, Y=50')
    })

    it('should click at coordinates relative to element', async () => {
      await I.amOnPage('/form/click_coordinates')
      await I.dontSee('Clicked at:')
      await I.clickXY('#clickArea', 50, 30)
      await I.see('Clicked at: X=50, Y=30')
    })

    it('should click at different relative coordinates', async () => {
      await I.amOnPage('/form/click_coordinates')
      await I.clickXY('#clickArea', 100, 75)
      await I.see('Clicked at: X=100, Y=75')
    })
  })

  describe('#checkOption', () => {
    it('should check option by css', async () => {
      await I.amOnPage('/form/checkbox')
      await I.checkOption('#checkin')
      await I.click('Submit')
      await I.wait(1)
      assert.equal(formContents('terms'), 'agree')
    })

    it('should check option by strict locator', async () => {
      await I.amOnPage('/form/checkbox')
      await I.checkOption({
        id: 'checkin',
      })
      await I.click('Submit')
      assert.equal(formContents('terms'), 'agree')
    })

    it('should check option by name', async () => {
      await I.amOnPage('/form/checkbox')
      await I.checkOption('terms')
      await I.click('Submit')
      assert.equal(formContents('terms'), 'agree')
    })

    it('should check option by label', async () => {
      await I.amOnPage('/form/checkbox')
      await I.checkOption('I Agree')
      await I.click('Submit')
      assert.equal(formContents('terms'), 'agree')
    })

    it('should check option by context', async () => {
      await I.amOnPage('/form/example1')
      await I.checkOption('Remember me next time', '.rememberMe')
      await I.click('Login')
      assert.equal(formContents('LoginForm').rememberMe, 1)
    })
  })

  describe('#uncheckOption', () => {
    it('should uncheck option that is currently checked', async () => {
      await I.amOnPage('/info')
      await I.uncheckOption('interesting')
      await I.dontSeeCheckboxIsChecked('interesting')
    })
  })

  describe('#selectOption', () => {
    it('should select option by css', async () => {
      await I.amOnPage('/form/select')
      await I.selectOption('form select[name=age]', 'adult')
      await I.click('Submit')
      assert.equal(formContents('age'), 'adult')
    })

    it('should select option by name', async () => {
      await I.amOnPage('/form/select')
      await I.selectOption('age', 'adult')
      await I.click('Submit')
      assert.equal(formContents('age'), 'adult')
    })

    it('should select option by label', async () => {
      await I.amOnPage('/form/select')
      await I.selectOption('Select your age', 'dead')
      await I.click('Submit')
      assert.equal(formContents('age'), 'dead')
    })

    it('should select option by label and option text', async () => {
      await I.amOnPage('/form/select')
      await I.selectOption('Select your age', '21-60')
      await I.click('Submit')
      assert.equal(formContents('age'), 'adult')
    })

    it('should select option by label and option text - with an onchange callback', async () => {
      await I.amOnPage('/form/select_onchange')
      await I.selectOption('Select a value', 'Option 2')
      await I.click('Submit')
      assert.equal(formContents('select'), 'option2')
    })

    it('should select multiple options', async () => {
      await I.amOnPage('/form/select_multiple')
      await I.selectOption('What do you like the most?', ['Play Video Games', 'Have Sex'])
      await I.click('Submit')
      assert.deepEqual(formContents('like'), ['play', 'adult'])
    })

    it('should select option by label and option text with additional spaces', async () => {
      await I.amOnPage('/form/select_additional_spaces')
      await I.selectOption('Select your age', '21-60')
      await I.click('Submit')
      assert.equal(formContents('age'), 'adult')
    })

    describe('custom combobox/listbox', () => {
      it('should select from custom combobox by fuzzy label', async () => {
        await I.amOnPage('/form/custom_select')
        await I.selectOption('Country', 'Porto')
        await I.see('country: pt', '#result')
      })

      it('should select from multiple custom comboboxes', async () => {
        await I.amOnPage('/form/custom_select')
        await I.selectOption('Country', 'New York')
        await I.selectOption('City', 'Madrid')
        await I.see('country: us', '#result')
        await I.see('city: madrid', '#result')
      })

      it('should select from standalone listbox', async () => {
        await I.amOnPage('/form/custom_select')
        await I.selectOption('Favorite Color', 'Blue')
        await I.see('color: blue', '#result')
      })

      it('should select from combobox using strict css locator', async () => {
        await I.amOnPage('/form/custom_select')
        await I.selectOption({ css: '#country-trigger' }, 'Paris')
        await I.see('country: fr', '#result')
      })

      it('should select from listbox using strict css locator', async () => {
        await I.amOnPage('/form/custom_select')
        await I.selectOption({ css: '#color-listbox' }, 'Green')
        await I.see('color: green', '#result')
      })

      it('should select multiple options from multiselect listbox', async () => {
        await I.amOnPage('/form/custom_select')
        await I.selectOption('Tags', ['Important', 'Urgent'])
        await I.see('tags: important,urgent', '#result')
      })

      it('should select multiple options using strict css locator', async () => {
        await I.amOnPage('/form/custom_select')
        await I.selectOption({ css: '#tags-listbox' }, ['Review', 'Later'])
        await I.see('tags: review,later', '#result')
      })
    })
  })

  describe('#shadow DOM', () => {
    it('should click button inside shadow DOM', async () => {
      await I.amOnPage('/form/shadow_dom')
      await I.click({ shadow: ['my-button', 'button'] })
      await I.see('my-button > button', '#clicked-element')
    })

    it('should click button in nested shadow DOM', async () => {
      await I.amOnPage('/form/shadow_dom')
      await I.click({ shadow: ['my-app', 'my-form', 'button'] })
      await I.see('my-app > my-form > button', '#clicked-element')
    })

    it('should fill field inside nested shadow DOM', async () => {
      await I.amOnPage('/form/shadow_dom')
      await I.fillField({ shadow: ['my-app', 'my-form', 'input'] }, 'Shadow Test')
      await I.see('Shadow Test', '#input-value')
    })

    it('should work with shadow locator as JSON string', async () => {
      await I.amOnPage('/form/shadow_dom')
      await I.click('{"shadow": ["my-button", "button"]}')
      await I.see('my-button > button', '#clicked-element')
    })
  })

  describe('#executeScript', () => {
    it('should execute synchronous script', async () => {
      await I.amOnPage('/')
      await I.executeScript(() => {
        document.getElementById('link').innerHTML = 'Appended'
      })
      await I.see('Appended', 'a')
    })

    it('should return value from sync script', async () => {
      await I.amOnPage('/')
      const val = await I.executeScript(a => a + 5, 5)
      assert.equal(val, 10)
    })

    it('should return value from sync script in iframe', async function () {
      await I.amOnPage('/iframe')
      await I.switchTo({ css: 'iframe' })
      const val = await I.executeScript(() => document.getElementsByTagName('h1')[0].innerText)
      assert.equal(val, 'Information')
    })

    it('should execute async script', async function () {
      if (isHelper('Playwright')) return // It won't be implemented

      await I.amOnPage('/')
      const val = await I.executeAsyncScript((val, done) => {
        setTimeout(() => {
          document.getElementById('link').innerHTML = val
          done(5)
        }, 100)
      }, 'Timeout')
      assert.equal(val, 5)
      await I.see('Timeout', 'a')
    })
  })

  describe('#fillField, #appendField', () => {
    it('should fill input fields', async () => {
      await I.amOnPage('/form/field')
      await I.fillField('Name', 'Nothing special')
      await I.click('Submit')
      assert.equal(formContents('name'), 'Nothing special')
    })

    it('should fill input fields with secrets', async () => {
      await I.amOnPage('/form/field')
      await I.fillField('Name', secret('Something special'))
      await I.click('Submit')
      assert.equal(formContents('name'), 'Something special')
    })

    it('should fill field by css', async () => {
      await I.amOnPage('/form/field')
      await I.fillField('#name', 'Nothing special')
      await I.click('Submit')
      assert.equal(formContents('name'), 'Nothing special')
    })

    it('should fill field by strict locator', async () => {
      await I.amOnPage('/form/field')
      await I.fillField(
        {
          id: 'name',
        },
        'Nothing special',
      )
      await I.click('Submit')
      assert.equal(formContents('name'), 'Nothing special')
    })

    it('should fill textarea by css', async () => {
      await I.amOnPage('/form/textarea')
      await I.fillField('textarea', 'Nothing special')
      await I.click('Submit')
      assert.equal(formContents('description'), 'Nothing special')
    })

    it('should fill textarea by label', async () => {
      await I.amOnPage('/form/textarea')
      await I.fillField('Description', 'Nothing special')
      await I.click('Submit')
      assert.equal(formContents('description'), 'Nothing special')
    })

    it('should fill input by aria-label and aria-labelledby', async () => {
      await I.amOnPage('/form/aria')
      await I.fillField('My Address', 'Home Sweet Home')
      await I.fillField('Phone', '123456')
      await I.click('Submit')
      assert.equal(formContents('my-form-phone'), '123456')
      assert.equal(formContents('my-form-address'), 'Home Sweet Home')
    })

    it('should fill textarea by overwritting the existing value', async () => {
      await I.amOnPage('/form/textarea')
      await I.fillField('Description', 'Nothing special')
      await I.fillField('Description', 'Some other text')
      await I.click('Submit')
      assert.equal(formContents('description'), 'Some other text')
    })

    it('should append field value', async () => {
      await I.amOnPage('/form/field')
      await I.appendField('Name', '_AND_NEW')
      await I.click('Submit')
      assert.equal(formContents('name'), 'OLD_VALUE_AND_NEW')
    })

    it('should fill field by name', async () => {
      await I.amOnPage('/form/example1')
      await I.fillField('LoginForm[username]', 'davert')
      await I.fillField('LoginForm[password]', '123456')
      await I.click('Login')
      assert.equal(formContents('LoginForm').username, 'davert')
      assert.equal(formContents('LoginForm').password, '123456')
    })

    it.skip('should not fill invisible fields', async () => {
      if (isHelper('Playwright')) return // It won't be implemented
      await I.amOnPage('/form/field')
      try {
        I.fillField('email', 'test@1234')
      } catch (e) {
        await assert.equal(e.message, 'Error: Field "email" was not found by text|CSS|XPath')
      }
    })
  })

  describe('#clearField', () => {
    it('should clear a given element', async () => {
      await I.amOnPage('/form/field')
      await I.fillField('#name', 'Nothing special')
      await I.seeInField('#name', 'Nothing special')
      await I.clearField('#name')
      await I.dontSeeInField('#name', 'Nothing special')
    })

    it('should clear field by name', async () => {
      await I.amOnPage('/form/example1')
      await I.clearField('LoginForm[username]')
      await I.click('Login')
      assert.equal(formContents('LoginForm').username, '')
    })

    it('should clear field by locator', async () => {
      await I.amOnPage('/form/example1')
      await I.clearField('#LoginForm_username')
      await I.click('Login')
      assert.equal(formContents('LoginForm').username, '')
    })
  })

  describe('#type', () => {
    it('should type into a field', async () => {
      await I.amOnPage('/form/field')
      await I.click('Name')

      await I.type('Type Test')
      await I.seeInField('Name', 'Type Test')

      await I.fillField('Name', '')

      await I.type(['T', 'y', 'p', 'e', '2'])
      await I.seeInField('Name', 'Type2')
    })

    it('should use delay to slow down typing', async () => {
      await I.amOnPage('/form/field')
      await I.fillField('Name', '')
      const time = Date.now()
      await I.type('12345', 100)
      await I.seeInField('Name', '12345')
      assert(Date.now() - time > 500)
    })
  })

  describe('check fields: #seeInField, #seeCheckboxIsChecked, ...', () => {
    it('should check for empty field', async () => {
      await I.amOnPage('/form/empty')
      await I.seeInField('#empty_input', '')
    })

    it('should check for empty textarea', async () => {
      await I.amOnPage('/form/empty')
      await I.seeInField('#empty_textarea', '')
    })

    it('should check field equals', async () => {
      await I.amOnPage('/form/field')
      await I.seeInField('Name', 'OLD_VALUE')
      await I.seeInField('name', 'OLD_VALUE')
      await I.seeInField('//input[@id="name"]', 'OLD_VALUE')
      await I.dontSeeInField('//input[@id="name"]', 'NOtVALUE')
    })

    it('should check textarea equals', async () => {
      await I.amOnPage('/form/textarea')
      await I.seeInField('Description', 'sunrise')
      await I.seeInField('textarea', 'sunrise')
      await I.seeInField('//textarea[@id="description"]', 'sunrise')
      await I.dontSeeInField('//textarea[@id="description"]', 'sunset')
    })

    it('should check checkbox is checked :)', async () => {
      await I.amOnPage('/info')
      await I.seeCheckboxIsChecked('input[type=checkbox]')
    })

    it('should check checkbox is not checked', async () => {
      await I.amOnPage('/form/checkbox')
      await I.dontSeeCheckboxIsChecked('#checkin')
    })

    it('should match fields with the same name', async () => {
      await I.amOnPage('/form/example20')
      await I.seeInField("//input[@name='txtName'][2]", 'emma')
      await I.seeInField("input[name='txtName']:nth-child(2)", 'emma')
    })
  })

  describe('#grabTextFromAll, #grabHTMLFromAll, #grabValueFromAll, #grabAttributeFromAll', () => {
    it('should grab multiple texts from page', async () => {
      await I.amOnPage('/info')
      let vals = await I.grabTextFromAll('#grab-multiple a')
      assert.equal(vals[0], 'First')
      assert.equal(vals[1], 'Second')
      assert.equal(vals[2], 'Third')

      await I.amOnPage('/info')
      vals = await I.grabTextFromAll('#invalid-id a')
      assert.equal(vals.length, 0)
    })

    it('should grab multiple html from page', async function () {
      await I.amOnPage('/info')
      let vals = await I.grabHTMLFromAll('#grab-multiple a')
      assert.equal(vals[0], 'First')
      assert.equal(vals[1], 'Second')
      assert.equal(vals[2], 'Third')

      await I.amOnPage('/info')
      vals = await I.grabHTMLFromAll('#invalid-id a')
      assert.equal(vals.length, 0)
    })

    it('should grab multiple attribute from element', async () => {
      await I.amOnPage('/form/empty')
      const vals = await I.grabAttributeFromAll(
        {
          css: 'input',
        },
        'name',
      )
      assert.equal(vals[0], 'text')
      assert.equal(vals[1], 'empty_input')
    })

    it('Should return empty array if no attribute found', async () => {
      await I.amOnPage('/form/empty')
      const vals = await I.grabAttributeFromAll(
        {
          css: 'div',
        },
        'test',
      )
      assert.equal(vals.length, 0)
    })

    it('should grab values if multiple field matches', async () => {
      await I.amOnPage('/form/hidden')
      let vals = await I.grabValueFromAll('//form/input')
      assert.equal(vals[0], 'kill_people')
      assert.equal(vals[1], 'Submit')

      vals = await I.grabValueFromAll("//form/input[@name='action']")
      assert.equal(vals[0], 'kill_people')
    })

    it('Should return empty array if no value found', async () => {
      await I.amOnPage('/')
      const vals = await I.grabValueFromAll('//form/input')
      assert.equal(vals.length, 0)
    })
  })

  describe('#grabTextFrom, #grabHTMLFrom, #grabValueFrom, #grabAttributeFrom', () => {
    it('should grab text from page', async () => {
      await I.amOnPage('/')
      let val = await I.grabTextFrom('h1')
      assert.equal(val, 'Welcome to test app!')

      val = await I.grabTextFrom('//h1')
      assert.equal(val, 'Welcome to test app!')
    })

    it('should return empty string when the text of tag is an empty string', async function () {
      await I.amOnPage('/info')
      let val = await I.grabTextFrom('#p-no-text')
      assert.equal(val, '')
    })

    it('should grab html from page', async function () {
      await I.amOnPage('/info')
      const val = await I.grabHTMLFrom('#grab-multiple')
      if (isHelper('WebDriver')) {
        assert.equal('<a id="first-link">First</a>\n<a id="second-link">Second</a>\n<a id="third-link">Third</a>', val)
      } else {
        assert.equal(
          `
    <a id="first-link">First</a>
    <a id="second-link">Second</a>
    <a id="third-link">Third</a>
`,
          val,
        )
      }
    })

    it('should grab value from field', async () => {
      await I.amOnPage('/form/hidden')
      let val = await I.grabValueFrom('#action')
      assert.equal(val, 'kill_people')
      val = await I.grabValueFrom("//form/input[@name='action']")
      assert.equal(val, 'kill_people')
      await I.amOnPage('/form/textarea')
      val = await I.grabValueFrom('#description')
      assert.equal(val, 'sunrise')
      await I.amOnPage('/form/select')
      val = await I.grabValueFrom('#age')
      assert.equal(val, 'oldfag')
    })

    it('should grab attribute from element', async () => {
      await I.amOnPage('/search')
      const val = await I.grabAttributeFrom(
        {
          css: 'form',
        },
        'method',
      )
      assert.equal(val, 'get')
    })

    it('should grab custom attribute from element', async () => {
      await I.amOnPage('/form/example4')
      const val = await I.grabAttributeFrom(
        {
          css: '.navbar-toggle',
        },
        'data-toggle',
      )
      assert.equal(val, 'collapse')
    })
  })

  describe('page title : #seeTitle, #dontSeeTitle, #grabTitle', () => {
    it('should check page title', async function () {
      await I.amOnPage('/')
      await I.seeInTitle('TestEd Beta 2.0')
      await I.dontSeeInTitle('Welcome to test app')
      await I.amOnPage('/info')
      await I.dontSeeInTitle('TestEd Beta 2.0')
    })

    it('should grab page title', async function () {
      await I.amOnPage('/')
      const val = await I.grabTitle()
      assert.equal(val, 'TestEd Beta 2.0')
    })
  })

  describe('#attachFile', () => {
    it('should upload file located by CSS', async () => {
      await I.amOnPage('/form/file')
      await I.attachFile('#avatar', 'app/avatar.jpg')
      await I.click('Submit')
      await I.see('Thank you')
      expect(formContents().files).to.have.key('avatar')
      expect(formContents().files.avatar.name).to.eql('avatar.jpg')
      expect(formContents().files.avatar.type).to.eql('image/jpeg')
    })

    it('should upload file located by label', async () => {
      await I.amOnPage('/form/file')
      await I.attachFile('Avatar', 'app/avatar.jpg')
      await I.click('Submit')
      await I.see('Thank you')
      expect(formContents().files).to.have.key('avatar')
      expect(formContents().files.avatar.name).to.eql('avatar.jpg')
      expect(formContents().files.avatar.type).to.eql('image/jpeg')
    })
  })

  describe('#saveScreenshot', () => {
    beforeEach(() => {
      global.output_dir = path.join(global.codecept_dir, 'output')
    })

    it('should create a screenshot file in output dir', async () => {
      const sec = new Date().getUTCMilliseconds()
      await I.amOnPage('/')
      await I.saveScreenshot(`screenshot_${sec}.png`)
      assert.ok(fileExists(path.join(global.output_dir, `screenshot_${sec}.png`)), null, 'file does not exists')
    })

    it('should create a full page screenshot file in output dir', async () => {
      const sec = new Date().getUTCMilliseconds()
      await I.amOnPage('/')
      await I.saveScreenshot(`screenshot_full_${+sec}.png`, true)
      assert.ok(fileExists(path.join(global.output_dir, `screenshot_full_${+sec}.png`)), null, 'file does not exists')
    })
  })

  describe('cookies : #setCookie, #clearCookies, #seeCookie, #waitForCookie', () => {
    beforeEach(function () {
      // Skip in CI to avoid timeouts from external URLs
      if (process.env.CI || process.env.GITHUB_ACTIONS) this.skip()
    })
    it('should do all cookie stuff', async () => {
      await I.amOnPage('/')
      await I.setCookie({
        name: 'auth',
        value: '123456',
        url: 'http://localhost',
      })
      await I.seeCookie('auth')
      await I.dontSeeCookie('auuth')

      const cookie = await I.grabCookie('auth')
      assert.equal(cookie.value, '123456')

      await I.clearCookie('auth')
      await I.dontSeeCookie('auth')
    })

    it('should grab all cookies', async () => {
      await I.amOnPage('/')
      await I.setCookie({
        name: 'auth',
        value: '123456',
        url: 'http://localhost',
      })
      await I.setCookie({
        name: 'user',
        value: 'davert',
        url: 'http://localhost',
      })

      const cookies = await I.grabCookie()
      assert.equal(cookies.length, 2)
      assert(cookies[0].name)
      assert(cookies[0].value)
    })

    it('should clear all cookies', async () => {
      await I.amOnPage('/')
      await I.setCookie({
        name: 'auth',
        value: '123456',
        url: 'http://localhost',
      })
      await I.clearCookie()
      await I.dontSeeCookie('auth')
    })

    it('should wait for cookie and throw error when cookie not found', async () => {
      await I.amOnPage('https://google.com')
      try {
        await I.waitForCookie('auth', 2)
      } catch (e) {
        assert.equal(e.message, 'Cookie auth is not found after 2s')
      }
    })

    it('should wait for cookie', async () => {
      await I.amOnPage('/')
      await I.setCookie({
        name: 'auth',
        value: '123456',
        url: 'http://localhost',
      })
      await I.waitForCookie('auth')
    })
  })

  describe('#waitForText', () => {
    it('should wait for text', async () => {
      await I.amOnPage('/dynamic')
      await I.dontSee('Dynamic text')
      await I.waitForText('Dynamic text', 2)
      await I.see('Dynamic text')
    })

    it('should wait for text in context', async () => {
      await I.amOnPage('/dynamic')
      await I.dontSee('Dynamic text')
      await I.waitForText('Dynamic text', 2, '#text')
      await I.see('Dynamic text')
    })

    it('should fail if no context', async function () {
      let failed = false
      await I.amOnPage('/dynamic')
      await I.dontSee('Dynamic text')
      try {
        await I.waitForText('Dynamic text', 1, '#fext')
      } catch (e) {
        failed = true
      }
      assert.ok(failed)
    })

    it("should fail if text doesn't contain", async function () {
      let failed = false
      await I.amOnPage('/dynamic')
      try {
        await I.waitForText('Other text', 1)
      } catch (e) {
        failed = true
      }
      assert.ok(failed)
    })

    it('should fail if text is not in element', async function () {
      let failed = false
      await I.amOnPage('/dynamic')
      try {
        await I.waitForText('Other text', 1, '#text')
      } catch (e) {
        failed = true
      }
      assert.ok(failed)
    })

    it('should wait for text after timeout', async () => {
      await I.amOnPage('/timeout')
      await I.dontSee('Timeout text')
      await I.waitForText('Timeout text', 31, '#text')
      await I.see('Timeout text')
    })

    it('should wait for text located by XPath', async () => {
      await I.amOnPage('/dynamic')
      await I.dontSee('Dynamic text')
      await I.waitForText('Dynamic text', 5, '//div[@id="text"]')
    })

    it('should wait for text with double quotes', async () => {
      await I.amOnPage('/')
      await I.waitForText('said: "debug!"', 5)
    })

    it('should throw error when text not found', async () => {
      await I.amOnPage('/dynamic')
      await I.dontSee('Dynamic text')
      let failed = false
      try {
        await I.waitForText('Some text', 1, '//div[@id="text"]')
      } catch (e) {
        failed = true
      }
      assert.ok(failed)
    })
  })

  describe('#waitForElement', () => {
    it('should wait for visible element', async () => {
      await I.amOnPage('/form/wait_visible')
      await I.dontSee('Step One Button')
      await I.dontSeeElement('#step_1')
      await I.waitForVisible('#step_1', 2)
      await I.seeElement('#step_1')
      await I.click('#step_1')
      await I.waitForVisible('#step_2', 2)
      await I.see('Step Two Button')
    })

    it('should wait for element in DOM', async () => {
      await I.amOnPage('/form/wait_visible')
      await I.waitForElement('#step_2')
      await I.dontSeeElement('#step_2')
      await I.seeElementInDOM('#step_2')
    })

    it('should wait for element by XPath', async () => {
      await I.amOnPage('/form/wait_visible')
      await I.waitForElement('//div[@id="step_2"]')
      await I.dontSeeElement('//div[@id="step_2"]')
      await I.seeElementInDOM('//div[@id="step_2"]')
    })

    it('should wait for element to appear', async () => {
      await I.amOnPage('/form/wait_element')
      await I.dontSee('Hello')
      await I.dontSeeElement('h1')
      await I.waitForElement('h1', 2)
      await I.see('Hello')
    })
  })

  describe('#waitForInvisible', () => {
    it('should wait for element to be invisible', async () => {
      await I.amOnPage('/form/wait_invisible')
      await I.see('Step One Button')
      await I.seeElement('#step_1')
      await I.waitForInvisible('#step_1', 2)
      await I.dontSeeElement('#step_1')
    })

    it('should wait for element to be invisible by XPath', async () => {
      await I.amOnPage('/form/wait_invisible')
      await I.seeElement('//div[@id="step_1"]')
      await I.waitForInvisible('//div[@id="step_1"]')
      await I.dontSeeElement('//div[@id="step_1"]')
      await I.seeElementInDOM('//div[@id="step_1"]')
    })

    it('should wait for element to be removed', async () => {
      await I.amOnPage('/form/wait_invisible')
      await I.see('Step Two Button')
      await I.seeElement('#step_2')
      await I.waitForInvisible('#step_2', 2)
      await I.dontSeeElement('#step_2')
    })

    it('should wait for element to be removed by XPath', async () => {
      await I.amOnPage('/form/wait_invisible')
      await I.see('Step Two Button')
      await I.seeElement('//div[@id="step_2"]')
      await I.waitForInvisible('//div[@id="step_2"]', 2)
      await I.dontSeeElement('//div[@id="step_2"]')
    })
  })

  describe('#waitToHide', () => {
    it('should wait for element to be invisible', async () => {
      await I.amOnPage('/form/wait_invisible')
      await I.see('Step One Button')
      await I.seeElement('#step_1')
      await I.waitToHide('#step_1', 2)
      await I.dontSeeElement('#step_1')
    })

    it('should wait for element to be invisible by XPath', async () => {
      await I.amOnPage('/form/wait_invisible')
      await I.seeElement('//div[@id="step_1"]')
      await I.waitToHide('//div[@id="step_1"]')
      await I.dontSeeElement('//div[@id="step_1"]')
      await I.seeElementInDOM('//div[@id="step_1"]')
    })

    it('should wait for element to be removed', async () => {
      await I.amOnPage('/form/wait_invisible')
      await I.see('Step Two Button')
      await I.seeElement('#step_2')
      await I.waitToHide('#step_2', 2)
      await I.dontSeeElement('#step_2')
    })

    it('should wait for element to be removed by XPath', async () => {
      await I.amOnPage('/form/wait_invisible')
      await I.see('Step Two Button')
      await I.seeElement('//div[@id="step_2"]')
      await I.waitToHide('//div[@id="step_2"]', 2)
      await I.dontSeeElement('//div[@id="step_2"]')
    })
  })

  describe('#waitForDetached', () => {
    it('should throw an error if the element still exists in DOM', async function () {
      await I.amOnPage('/form/wait_detached')
      await I.see('Step One Button')
      await I.seeElement('#step_1')

      try {
        await I.waitForDetached('#step_1', 2)
        throw Error('Should not get this far')
      } catch (err) {
        expect(err.message).to.include('still on page after')
      }
    })

    it('should throw an error if the element still exists in DOM by XPath', async function () {
      await I.amOnPage('/form/wait_detached')
      await I.see('Step One Button')
      await I.seeElement('#step_1')

      try {
        await I.waitForDetached('#step_1', 2)
        throw Error('Should not get this far')
      } catch (err) {
        expect(err.message).to.include('still on page after')
      }
    })

    it('should wait for element to be removed from DOM', async function () {
      await I.amOnPage('/form/wait_detached')
      await I.see('Step Two Button')
      await I.seeElement('#step_2')
      await I.waitForDetached('#step_2', 2)
      await I.dontSeeElementInDOM('#step_2')
    })

    it('should wait for element to be removed from DOM by XPath', async function () {
      await I.amOnPage('/form/wait_detached')
      await I.seeElement('//div[@id="step_2"]')
      await I.waitForDetached('//div[@id="step_2"]')
      await I.dontSeeElement('//div[@id="step_2"]')
      await I.dontSeeElementInDOM('//div[@id="step_2"]')
    })
  })

  describe('within tests', () => {
    afterEach(() => I._withinEnd())

    it('should execute within block', async () => {
      await I.amOnPage('/form/example4')
      await I.seeElement('#navbar-collapse-menu')
      I._withinBegin('#register')
        .then(() => I.see('E-Mail'))
        .then(() => I.dontSee('Toggle navigation'))
        .then(() => I.dontSeeElement('#navbar-collapse-menu'))
    })

    it('should respect form fields inside within block ', async () => {
      let rethrow

      await I.amOnPage('/form/example4')
      await I.seeElement('#navbar-collapse-menu')
      await I.see('E-Mail')
      await I.see('Hasło')
      await I.fillField('Hasło', '12345')
      await I.seeInField('Hasło', '12345')
      await I.checkOption('terms')
      await I.seeCheckboxIsChecked('terms')
      I._withinBegin({ css: '.form-group' })
        .then(() => I.see('E-Mail'))
        .then(() => I.dontSee('Hasło'))
        .then(() => I.dontSeeElement('#navbar-collapse-menu'))

      try {
        await I.dontSeeCheckboxIsChecked('terms')
      } catch (err) {
        if (!err) assert.fail('seen checkbox')
      }

      try {
        await I.seeInField('Hasło', '12345')
      } catch (err) {
        if (!err) assert.fail('seen field')
      }

      if (rethrow) throw rethrow
    })

    it('should execute within block 2', async () => {
      await I.amOnPage('/form/example4')
      await I.fillField('Hasło', '12345')
      I._withinBegin({ xpath: '//div[@class="form-group"][2]' })
        .then(() => I.dontSee('E-Mail'))
        .then(() => I.see('Hasło'))
        .then(() => I.grabTextFrom('label'))
        .then(label => assert.equal(label, 'Hasło'))
        .then(() => I.grabValueFrom('input'))
        .then(input => assert.equal(input, '12345'))
    })

    it('within should respect context in see', async function () {
      await I.amOnPage('/form/example4')
      await I.see('Rejestracja', 'fieldset')
      I._withinBegin({ css: '.navbar-header' })
        .then(() => I.see('Rejestracja', '.container fieldset'))
        .then(() => I.see('Toggle navigation', '.container fieldset'))
    })

    it('within should respect context in see when using nested frames', async function () {
      await I.amOnPage('/iframe_nested')
      await I._withinBegin({
        frame: ['#wrapperId', '[name=content]'],
      })

      try {
        await I.see('Kill & Destroy')
      } catch (err) {
        if (!err) assert.fail('seen "Kill & Destroy"')
      }

      try {
        await I.dontSee('Nested Iframe test')
      } catch (err) {
        if (!err) assert.fail('seen "Nested Iframe test"')
      }

      try {
        await I.dontSee('Iframe test')
      } catch (err) {
        if (!err) assert.fail('seen "Iframe test"')
      }
    })

    it('within should respect context in see when using frame', async function () {
      await I.amOnPage('/iframe')
      await I._withinBegin({
        frame: '#number-frame-1234',
      })

      try {
        await I.see('Information')
      } catch (err) {
        if (!err) assert.fail('seen "Information"')
      }
    })

    it('within should respect context in see when using frame with strict locator', async function () {
      await I.amOnPage('/iframe')
      await I._withinBegin({
        frame: { css: '#number-frame-1234' },
      })

      try {
        await I.see('Information')
      } catch (err) {
        if (!err) assert.fail('seen "Information"')
      }
    })
  })

  describe('scroll: #scrollTo, #scrollPageToTop, #scrollPageToBottom', () => {
    it('should scroll inside an iframe', async function () {
      await I.amOnPage('/iframe')
      await I.resizeWindow(500, 700)
      await I.switchTo('iframe')

      const { x, y } = await I.grabPageScrollPosition()
      await I.scrollTo('.sign')

      const { x: afterScrollX, y: afterScrollY } = await I.grabPageScrollPosition()
      assert.notEqual(afterScrollY, y)
      assert.equal(afterScrollX, x)
    })

    it('should scroll to an element', async () => {
      await I.amOnPage('/form/scroll')
      await I.resizeWindow(500, 700)
      const { y } = await I.grabPageScrollPosition()
      await I.scrollTo('.section3 input[name="test"]')

      const { y: afterScrollY } = await I.grabPageScrollPosition()
      assert.notEqual(afterScrollY, y)
    })

    it('should scroll to coordinates', async () => {
      await I.amOnPage('/form/scroll')
      await I.resizeWindow(500, 700)
      await I.scrollTo(50, 70)

      const { x: afterScrollX, y: afterScrollY } = await I.grabPageScrollPosition()
      assert.equal(afterScrollX, 50)
      assert.equal(afterScrollY, 70)
    })

    it('should scroll to bottom of page', async () => {
      await I.amOnPage('/form/scroll')
      await I.resizeWindow(500, 700)
      const { y } = await I.grabPageScrollPosition()
      await I.scrollPageToBottom()

      const { y: afterScrollY } = await I.grabPageScrollPosition()
      assert.notEqual(afterScrollY, y)
      assert.notEqual(afterScrollY, 0)
    })

    it('should scroll to top of page', async () => {
      await I.amOnPage('/form/scroll')
      await I.resizeWindow(500, 700)
      await I.scrollPageToBottom()
      const { y } = await I.grabPageScrollPosition()
      await I.scrollPageToTop()

      const { y: afterScrollY } = await I.grabPageScrollPosition()
      assert.notEqual(afterScrollY, y)
      assert.equal(afterScrollY, 0)
    })
  })

  describe('#grabCssPropertyFrom', () => {
    it('should grab css property for given element', async function () {
      await I.amOnPage('/form/doubleclick')
      const css = await I.grabCssPropertyFrom('#block', 'height')
      assert.equal(css, '100px')
    })

    it('should grab camelcased css properies', async () => {
      await I.amOnPage('/form/doubleclick')
      const css = await I.grabCssPropertyFrom('#block', 'user-select')
      assert.equal(css, 'text')
    })

    it('should grab multiple values if more than one matching element found', async () => {
      await I.amOnPage('/info')
      const css = await I.grabCssPropertyFromAll('.span', 'height')
      assert.equal(css[0], '12px')
      assert.equal(css[1], '15px')
    })
  })

  describe('#seeAttributesOnElements', () => {
    it('should check attributes values for given element', async function () {
      if (isHelper('WebDriver')) this.skip()

      try {
        await I.amOnPage('/info')
        await I.seeAttributesOnElements('//form', {
          method: 'post',
        })
        await I.seeAttributesOnElements('//form', {
          method: 'get',
        })
        throw Error('It should never get this far')
      } catch (e) {
        expect(e.message).to.include('all elements (//form) to have attributes {"method":"get"}')
      }
    })

    it('should check href with slash', async function () {
      if (isHelper('WebDriver')) this.skip()

      try {
        await I.amOnPage('https://github.com/codeceptjs/CodeceptJS/')
        await I.seeAttributesOnElements(
          { css: 'a[href="/codeceptjs/CodeceptJS"]' },
          {
            href: '/codeceptjs/CodeceptJS',
          },
        )
      } catch (e) {
        expect(e.message).to.include('all elements (a[href="/codeceptjs/CodeceptJS"]) to have attributes {"href":"/codeceptjs/CodeceptJS"}')
      }
    })

    it('should check attributes values for several elements', async function () {
      try {
        await I.amOnPage('/')
        await I.seeAttributesOnElements('a', {
          'qa-id': 'test',
          'qa-link': 'test',
        })
        await I.seeAttributesOnElements('//div', {
          'qa-id': 'test',
        })
        await I.seeAttributesOnElements('a', {
          'qa-id': 'test',
          href: '/info',
        })
        throw new Error('It should never get this far')
      } catch (e) {
        expect(e.message).to.include('all elements (a) to have attributes {"qa-id":"test","href":"/info"}')
      }
    })

    it('should return error when using non existing attribute', async function () {
      if (isHelper('WebDriver')) this.skip()

      try {
        await I.amOnPage('https://github.com/codeceptjs/CodeceptJS/')
        await I.seeAttributesOnElements(
          { css: 'a[href="/codeceptjs/CodeceptJS"]' },
          {
            disable: true,
          },
        )
      } catch (e) {
        expect(e.message).to.include('expected all elements ({css: a[href="/codeceptjs/CodeceptJS"]}) to have attributes {"disable":true} "0" to equal "3"')
      }
    })

    it('should verify the boolean attribute', async function () {
      if (isHelper('WebDriver')) this.skip()

      try {
        await I.amOnPage('/')
        await I.seeAttributesOnElements('input', {
          disabled: true,
        })
      } catch (e) {
        expect(e.message).to.include('expected all elements (input) to have attributes {"disabled":true} "0" to equal "1"')
      }
    })
  })

  describe('#seeCssPropertiesOnElements', () => {
    it('should check css property for given element', async function () {
      try {
        await I.amOnPage('/info')
        await I.seeCssPropertiesOnElements('h4', {
          'font-weight': 300,
        })
        await I.seeCssPropertiesOnElements('h3', {
          'font-weight': 'bold',
          display: 'block',
        })
        await I.seeCssPropertiesOnElements('h3', {
          'font-weight': 'non-bold',
        })
        throw Error('It should never get this far')
      } catch (e) {
        expect(e.message).to.include('expected all elements (h3) to have CSS property {"font-weight":"non-bold"}')
      }
    })

    it('should check css property for several elements', async function () {
      if (process.env.BROWSER === 'firefox') this.skip()

      try {
        await I.amOnPage('/')
        await I.seeCssPropertiesOnElements('a', {
          color: 'rgb(0, 0, 238)',
          cursor: 'pointer',
        })
        await I.seeCssPropertiesOnElements('a', {
          color: '#0000EE',
          cursor: 'pointer',
        })
        await I.seeCssPropertiesOnElements('//div', {
          display: 'block',
        })
        await I.seeCssPropertiesOnElements('a', {
          'margin-top': '0em',
          cursor: 'pointer',
        })
        throw Error('It should never get this far')
      } catch (e) {
        expect(e.message).to.include('expected all elements (a) to have CSS property {"margin-top":"0em","cursor":"pointer"}')
      }
    })

    it('should normalize css color properties for given element', async function () {
      await I.amOnPage('/form/css_colors')
      await I.seeCssPropertiesOnElements('#namedColor', {
        'background-color': 'purple',
        color: 'yellow',
      })
      await I.seeCssPropertiesOnElements('#namedColor', {
        'background-color': '#800080',
        color: '#ffff00',
      })

      await I.seeCssPropertiesOnElements('#namedColor', {
        'background-color': 'rgb(128,0,128)',
        color: 'rgb(255,255,0)',
      })

      await I.seeCssPropertiesOnElements('#namedColor', {
        'background-color': 'rgba(128,0,128,1)',
        color: 'rgba(255,255,0,1)',
      })
    })
  })

  describe('#customLocators', () => {
    beforeEach(() => {
      originalLocators = Locator.filters
      Locator.filters = []
    })
    afterEach(() => {
      // reset custom locators
      Locator.filters = originalLocators
    })
    it('should support xpath custom locator by default', async () => {
      customLocators({
        attribute: 'data-test-id',
        enabled: true,
      })
      await I.amOnPage('/form/custom_locator')
      await I.dontSee('Step One Button')
      await I.dontSeeElement('$step_1')
      await I.waitForVisible('$step_1', 2)
      await I.seeElement('$step_1')
      await I.click('$step_1')
      await I.waitForVisible('$step_2', 2)
      await I.see('Step Two Button')
    })
    it('can use css strategy for custom locator', async () => {
      customLocators({
        attribute: 'data-test-id',
        enabled: true,
        strategy: 'css',
      })
      await I.amOnPage('/form/custom_locator')
      await I.dontSee('Step One Button')
      await I.dontSeeElement('$step_1')
      await I.waitForVisible('$step_1', 2)
      await I.seeElement('$step_1')
      await I.click('$step_1')
      await I.waitForVisible('$step_2', 2)
      await I.see('Step Two Button')
    })
    it('can use xpath strategy for custom locator', async () => {
      customLocators({
        attribute: 'data-test-id',
        enabled: true,
        strategy: 'xpath',
      })
      await I.amOnPage('/form/custom_locator')
      await I.dontSee('Step One Button')
      await I.dontSeeElement('$step_1')
      await I.waitForVisible('$step_1', 2)
      await I.seeElement('$step_1')
      await I.click('$step_1')
      await I.waitForVisible('$step_2', 2)
      await I.see('Step Two Button')
    })
  })

  describe('#focus, #blur', () => {
    it('should focus a button, field and textarea', async () => {
      await I.amOnPage('/form/focus_blur_elements')

      await I.focus('#button')
      await I.see('Button is focused', '#buttonMessage')

      await I.focus('#field')
      await I.see('Button not focused', '#buttonMessage')
      await I.see('Input field is focused', '#fieldMessage')

      await I.focus('#textarea')
      await I.see('Button not focused', '#buttonMessage')
      await I.see('Input field not focused', '#fieldMessage')
      await I.see('Textarea is focused', '#textareaMessage')
    })

    it('should blur focused button, field and textarea', async () => {
      await I.amOnPage('/form/focus_blur_elements')

      await I.focus('#button')
      await I.see('Button is focused', '#buttonMessage')
      await I.blur('#button')
      await I.see('Button not focused', '#buttonMessage')

      await I.focus('#field')
      await I.see('Input field is focused', '#fieldMessage')
      await I.blur('#field')
      await I.see('Input field not focused', '#fieldMessage')

      await I.focus('#textarea')
      await I.see('Textarea is focused', '#textareaMessage')
      await I.blur('#textarea')
      await I.see('Textarea not focused', '#textareaMessage')
    })
  })

  describe('#startRecordingTraffic, #seeTraffic, #stopRecordingTraffic, #dontSeeTraffic, #grabRecordedNetworkTraffics', () => {
    beforeEach(function () {
      if (process.env.isSelenium === 'true') this.skip()
      // Skip in CI to avoid timeouts from external URLs
      if (process.env.CI || process.env.GITHUB_ACTIONS) this.skip()
    })

    it('should throw error when calling seeTraffic before recording traffics', async () => {
      try {
        I.amOnPage('https://codecept.io/')
        await I.seeTraffic({ name: 'traffics', url: 'https://codecept.io/img/companies/BC_LogoScreen_C.jpg' })
      } catch (e) {
        expect(e.message).to.equal('Failure in test automation. You use "I.seeTraffic", but "I.startRecordingTraffic" was never called before.')
      }
    })

    it('should throw error when calling seeTraffic but missing name', async () => {
      try {
        I.amOnPage('https://codecept.io/')
        await I.seeTraffic({ url: 'https://codecept.io/img/companies/BC_LogoScreen_C.jpg' })
      } catch (e) {
        expect(e.message).to.equal('Missing required key "name" in object given to "I.seeTraffic".')
      }
    })

    it('should throw error when calling seeTraffic but missing url', async () => {
      try {
        I.amOnPage('https://codecept.io/')
        await I.seeTraffic({ name: 'https://codecept.io/img/companies/BC_LogoScreen_C.jpg' })
      } catch (e) {
        expect(e.message).to.equal('Missing required key "url" in object given to "I.seeTraffic".')
      }
    })

    it('should flush the network traffics', async () => {
      await I.startRecordingTraffic()
      await I.amOnPage('https://codecept.io/')
      await I.flushNetworkTraffics()
      const traffics = await I.grabRecordedNetworkTraffics()
      expect(traffics.length).to.equal(0)
    })

    it('should stop the network recording', async () => {
      await I.startRecordingTraffic()
      await I.amOnPage('https://codecept.io/')
      await I.stopRecordingTraffic()
      const traffics1 = await I.grabRecordedNetworkTraffics()
      await I.amOnPage('https://codecept.io/')
      const traffics2 = await I.grabRecordedNetworkTraffics()
      expect(traffics2.length).to.equal(traffics1.length)
    })

    it('should see recording traffics', async () => {
      I.startRecordingTraffic()
      I.amOnPage('https://codecept.io/')
      await I.seeTraffic({ name: 'traffics', url: 'https://codecept.io/img/companies/BC_LogoScreen_C.jpg' })
    })

    it('should not see recording traffics', async () => {
      I.startRecordingTraffic()
      I.amOnPage('https://codecept.io/')
      I.stopRecordingTraffic()
      await I.dontSeeTraffic({ name: 'traffics', url: 'https://codecept.io/img/companies/BC_LogoScreen_C.jpg' })
    })

    it('should not see recording traffics using regex url', async () => {
      I.startRecordingTraffic()
      I.amOnPage('https://codecept.io/')
      I.stopRecordingTraffic()
      await I.dontSeeTraffic({ name: 'traffics', url: /BC_LogoScreen_C.jpg/ })
    })

    it('should throw error when calling dontSeeTraffic but missing name', async () => {
      I.startRecordingTraffic()
      I.amOnPage('https://codecept.io/')
      I.stopRecordingTraffic()
      try {
        await I.dontSeeTraffic({ url: 'https://codecept.io/img/companies/BC_LogoScreen_C.jpg' })
      } catch (e) {
        expect(e.message).to.equal('Missing required key "name" in object given to "I.dontSeeTraffic".')
      }
    })

    it('should throw error when calling dontSeeTraffic but missing url', async () => {
      I.startRecordingTraffic()
      I.amOnPage('https://codecept.io/')
      I.stopRecordingTraffic()
      try {
        await I.dontSeeTraffic({ name: 'traffics' })
      } catch (e) {
        expect(e.message).to.equal('Missing required key "url" in object given to "I.dontSeeTraffic".')
      }
    })

    it('should check traffics with more advanced params', async () => {
      await I.startRecordingTraffic()
      await I.amOnPage('https://openaI.com/blog/chatgpt')
      const traffics = await I.grabRecordedNetworkTraffics()

      for (const traffic of traffics) {
        if (traffic.url.includes('&width=')) {
          // new URL object
          const currentUrl = new URL(traffic.url)

          // get access to URLSearchParams object
          const searchParams = currentUrl.searchParams

          await I.seeTraffic({
            name: 'sentry event',
            url: currentUrl.origin + currentUrl.pathname,
            parameters: searchParams,
          })

          break
        }
      }
    })

    it.skip('should check traffics with more advanced post data', async () => {
      await I.amOnPage('https://openaI.com/blog/chatgpt')
      await I.startRecordingTraffic()
      await I.seeTraffic({
        name: 'event',
        url: 'https://region1.google-analytics.com',
        requestPostData: {
          st: 2,
        },
      })
    })
  })

  // the WS test website is not so stable. So we skip those tests for now.
  describe.skip('#startRecordingWebSocketMessages, #grabWebSocketMessages, #stopRecordingWebSocketMessages', () => {
    beforeEach(function () {
      if (isHelper('WebDriver') || process.env.BROWSER === 'firefox') this.skip()
    })

    it('should throw error when calling grabWebSocketMessages before startRecordingWebSocketMessages', () => {
      try {
        I.amOnPage('https://websocketstest.com/')
        I.waitForText('Work for You!')
        I.grabWebSocketMessages()
      } catch (e) {
        expect(e.message).to.equal('Failure in test automation. You use "I.grabWebSocketMessages", but "I.startRecordingWebSocketMessages" was never called before.')
      }
    })

    it('should flush the WS messages', async () => {
      await I.startRecordingWebSocketMessages()
      I.amOnPage('https://websocketstest.com/')
      I.waitForText('Work for You!')
      I.flushWebSocketMessages()
      const wsMessages = I.grabWebSocketMessages()
      expect(wsMessages.length).to.equal(0)
    })

    it('should see recording WS messages', async () => {
      await I.startRecordingWebSocketMessages()
      await I.amOnPage('https://websocketstest.com/')
      I.waitForText('Work for You!')
      const wsMessages = await I.grabWebSocketMessages()
      expect(wsMessages.length).to.greaterThan(0)
    })

    it('should not see recording WS messages', async () => {
      await I.startRecordingWebSocketMessages()
      await I.amOnPage('https://websocketstest.com/')
      I.waitForText('Work for You!')
      const wsMessages = I.grabWebSocketMessages()
      await I.stopRecordingWebSocketMessages()
      await I.amOnPage('https://websocketstest.com/')
      I.waitForText('Work for You!')
      const afterWsMessages = I.grabWebSocketMessages()
      expect(wsMessages.length).to.equal(afterWsMessages.length)
    })
  })

  describe('role locators', () => {
    it('should locate elements by role', async () => {
      await I.amOnPage('/form/role_elements')

      // Test basic role locators
      await I.seeElement({ role: 'button' })
      await I.seeElement({ role: 'combobox' })
      await I.seeElement({ role: 'textbox' })
      await I.seeElement({ role: 'searchbox' })
      await I.seeElement({ role: 'checkbox' })

      // Test count of elements with same role
      await I.seeNumberOfVisibleElements({ role: 'button' }, 4)
      await I.seeNumberOfVisibleElements({ role: 'combobox' }, 4)
      await I.seeNumberOfVisibleElements({ role: 'checkbox' }, 2)
    })

    it('should locate elements by role with text filter', async () => {
      await I.amOnPage('/form/role_elements')

      // Test role with text (exact match)
      await I.seeElement({ role: 'button', text: 'Submit' })
      await I.seeElement({ role: 'button', text: 'Dont Submit' })
      await I.seeElement({ role: 'button', text: 'Cancel' })
      await I.seeElement({ role: 'button', text: 'Reset' })

      // Test role with text (partial match)
      await I.seeElement({ role: 'combobox', text: 'Title' })
      await I.seeElement({ role: 'combobox', text: 'Name' })
      await I.seeElement({ role: 'combobox', text: 'Category' })

      // Test role with exact text match
      await I.seeElement({ role: 'combobox', text: 'Title', exact: true })
      await I.dontSeeElement({ role: 'combobox', text: 'title', exact: true }) // case sensitive

      // Test non-existing elements
      await I.dontSeeElement({ role: 'button', text: 'Non Existent Button' })
      await I.dontSeeElement({ role: 'combobox', text: 'Non Existent Field' })
    })

    it('should interact with elements located by role', async () => {
      await I.amOnPage('/form/role_elements')

      // Fill combobox by role and text
      await I.fillField({ role: 'combobox', text: 'Title' }, 'Test Title')
      await I.seeInField({ role: 'combobox', text: 'Title' }, 'Test Title')

      // Fill textbox by role
      await I.fillField({ role: 'textbox', text: 'your@email.com' }, 'test@example.com')
      await I.seeInField({ role: 'textbox', text: 'your@email.com' }, 'test@example.com')

      // Fill another textbox
      await I.fillField({ role: 'textbox', text: 'Enter your message' }, 'This is a test message')
      await I.seeInField({ role: 'textbox', text: 'Enter your message' }, 'This is a test message')

      // Click button by role and text
      await I.click({ role: 'button', text: 'Submit' })
      await I.see('Form Submitted!')
      await I.see('Form data submitted')
    })

    it('should work with different role locator combinations', async () => {
      await I.amOnPage('/form/role_elements')

      // Test searchbox role
      await I.fillField({ role: 'searchbox' }, 'search query')
      await I.seeInField({ role: 'searchbox' }, 'search query')

      // Test checkbox interaction
      await I.dontSeeCheckboxIsChecked({ role: 'checkbox' })
      await I.checkOption({ role: 'checkbox' })
      await I.seeCheckboxIsChecked({ role: 'checkbox' })
      await I.uncheckOption({ role: 'checkbox' })
      await I.dontSeeCheckboxIsChecked({ role: 'checkbox' })

      // Test specific checkbox by text
      await I.checkOption({ role: 'checkbox', text: 'Subscribe to newsletter' })
      await I.seeCheckboxIsChecked({ role: 'checkbox', text: 'Subscribe to newsletter' })
      await I.dontSeeCheckboxIsChecked({ role: 'checkbox', text: 'I agree to the terms and conditions' })
    })

    it('should grab elements by role', async () => {
      await I.amOnPage('/form/role_elements')

      // Test grabbing multiple elements
      const buttons = await I.grabWebElements({ role: 'button' })
      assert.equal(buttons.length, 4)

      const comboboxes = await I.grabWebElements({ role: 'combobox' })
      assert.equal(comboboxes.length, 4)

      // Test grabbing specific element
      if (!isHelper('WebDriver')) {
        const submitButton = await I.grabWebElement({ role: 'button', text: 'Submit' })
        assert.ok(submitButton)
      }

      // Test grabbing text from role elements
      const buttonText = await I.grabTextFrom({ role: 'button', text: 'Cancel' })
      assert.equal(buttonText, 'Cancel')

      // Test grabbing attributes from role elements
      const titlePlaceholder = await I.grabAttributeFrom({ role: 'combobox', text: 'Title' }, 'placeholder')
      assert.equal(titlePlaceholder, 'Title')
    })

    it('should work with multiple elements of same role', async () => {
      await I.amOnPage('/form/role_elements')

      // Test filling specific combobox by text when there are multiple
      await I.fillField({ role: 'combobox', text: 'Name' }, 'John Doe')
      await I.fillField({ role: 'combobox', text: 'Category' }, 'Technology')
      await I.fillField({ role: 'combobox', text: 'Title' }, 'Software Engineer')

      // Verify each field has the correct value
      await I.seeInField({ role: 'combobox', text: 'Name' }, 'John Doe')
      await I.seeInField({ role: 'combobox', text: 'Category' }, 'Technology')
      await I.seeInField({ role: 'combobox', text: 'Title' }, 'Software Engineer')

      // Submit and verify data is processed correctly
      await I.click({ role: 'button', text: 'Submit' })
      await I.see('Form Submitted!')
      await I.see('John Doe')
      await I.see('Technology')
      await I.see('Software Engineer')
    })
  })

  describe('aria selectors without role locators', () => {
    it('should find clickable elements by aria-label', async () => {
      await I.amOnPage('/form/role_elements')

      await I.click('Reset')
      await I.dontSeeInField('Title', 'Test')

      await I.click('Submit')
      await I.see('Form Submitted!')
    })

    it('should click elements by aria-label', async () => {
      await I.amOnPage('/form/role_elements')

      await I.fillField('Title', 'Test Title')
      await I.fillField('Name', 'John Doe')

      await I.click('Submit')
      await I.see('Form Submitted!')
      await I.see('Test Title')
      await I.see('John Doe')
    })

    it('should fill fields by aria-label without specifying role', async () => {
      await I.amOnPage('/form/role_elements')

      await I.fillField('Title', 'Senior Developer')
      await I.seeInField('Title', 'Senior Developer')

      await I.fillField('Name', 'Jane Smith')
      await I.seeInField('Name', 'Jane Smith')

      await I.fillField('Category', 'Engineering')
      await I.seeInField('Category', 'Engineering')

      await I.fillField('your@email.com', 'test@example.com')
      await I.seeInField('your@email.com', 'test@example.com')

      await I.fillField('Enter your message', 'Hello World')
      await I.seeInField('Enter your message', 'Hello World')
    })

    it('should check options by aria-label', async () => {
      if (!isHelper('WebDriver')) return

      await I.amOnPage('/form/role_elements')

      await I.dontSeeCheckboxIsChecked('I agree to the terms and conditions')
      await I.checkOption('I agree to the terms and conditions')
      await I.seeCheckboxIsChecked('I agree to the terms and conditions')

      await I.dontSeeCheckboxIsChecked('Subscribe to newsletter')
      await I.checkOption('Subscribe to newsletter')
      await I.seeCheckboxIsChecked('Subscribe to newsletter')
    })

    it('should interact with multiple elements using aria-label', async () => {
      await I.amOnPage('/form/role_elements')

      await I.fillField('Title', 'Product Manager')
      await I.fillField('Name', 'Bob Johnson')
      await I.fillField('Category', 'Product')
      await I.fillField('your@email.com', 'bob@company.com')
      await I.fillField('Enter your message', 'Test message')

      if (isHelper('WebDriver')) {
        await I.checkOption('Subscribe to newsletter')
      }

      await I.click('Submit')
      await I.see('Form Submitted!')
      await I.see('Product Manager')
      await I.see('Bob Johnson')
      await I.see('Product')
    })

    it('should click the correct button when multiple buttons have similar text', async () => {
      await I.amOnPage('/form/role_elements')

      // Fill form with test data
      await I.fillField('Title', 'Test Data')
      await I.fillField('Name', 'Test User')

      // Click 'Submit' button - should NOT click 'Dont Submit'
      await I.click('Submit')

      // Verify form was submitted (meaning the correct 'Submit' button was clicked)
      await I.see('Form Submitted!')
      await I.see('Test Data')
      await I.see('Test User')

      // Reset and test again to be sure
      await I.click('Reset')
      await I.dontSee('Form Submitted!')

      // Fill form again
      await I.fillField('Title', 'Another Test')
      await I.fillField('Name', 'Another User')

      // Click 'Submit' button again
      await I.click('Submit')

      // Verify form was submitted again
      await I.see('Form Submitted!')
      await I.see('Another Test')
      await I.see('Another User')
    })
  })
}
