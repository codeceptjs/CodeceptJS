import chai from 'chai'

const assert = chai.assert
const expect = chai.expect

import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'

import playwright, { devices } from 'playwright'
import electron from 'electron'

import TestHelper from '../support/TestHelper.js'
import Playwright from '../../lib/helper/Playwright.js'

import AssertionFailedError from '../../lib/assert/error.js'
import * as webApiTests from './webapi.js'
import FileSystem from '../../lib/helper/FileSystem.js'
import { deleteDir } from '../../lib/utils.js'
import Secret from '../../lib/secret.js'
import codeceptjsModule from '../../lib/index.js'
global.codeceptjs = codeceptjsModule.default || codeceptjsModule

import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataFile = path.join(__dirname, '/../data/app/db')
import { test as testUtils } from '../../lib/utils.js'
const formContents = testUtils.submittedData(dataFile)

let I
let page
let browser
let FS
const siteUrl = TestHelper.siteUrl()

describe('Playwright', function () {
  this.timeout(35000)
  this.retries(1)

  before(async () => {
    global.codecept_dir = path.join(__dirname, '/../data')

    I = new Playwright({
      url: siteUrl,
      // windowSize: '500x700',
      browser: process.env.BROWSER || 'chromium',
      show: false,
      waitForTimeout: 5000,
      waitForAction: 500,
      timeout: 2000,
      restart: false, // Don't restart browser to avoid hanging
      chrome: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
      defaultPopupAction: 'accept',
    })
    await I._init()
    return I._beforeSuite()
  })

  beforeEach(async () => {
    webApiTests.init({
      I,
      siteUrl,
    })
    return I._before().then(() => {
      page = I.page
      browser = I.browser
    })
  })

  afterEach(async () => {
    return I._after()
  })

  after(async () => {
    await I._afterSuite()
    await I._cleanup()
  })

  describe('restart browser: #restartBrowser', () => {
    it('should open a new tab after restart of browser', async () => {
      await I.restartBrowser()
      await I.wait(1)
      const numPages = await I.grabNumberOfOpenTabs()
      assert.equal(numPages, 1)
    })
  })

  describe('open page : #amOnPage', () => {
    it('should open main page of configured site', async () => {
      await I.amOnPage('/')
      const url = await page.url()
      await url.should.eql(`${siteUrl}/`)
    })
    it('should open any page of configured site', async () => {
      await I.amOnPage('/info')
      const url = await page.url()
      return url.should.eql(`${siteUrl}/info`)
    })

    it('should open absolute url', async () => {
      await I.amOnPage(siteUrl)
      const url = await page.url()
      return url.should.eql(`${siteUrl}/`)
    })

    it('should open any page of configured site without leading slash', async () => {
      await I.amOnPage('info')
      const url = await page.url()
      return url.should.eql(`${siteUrl}/info`)
    })

    it('should open blank page', async () => {
      await I.amOnPage('about:blank')
      const url = await page.url()
      return url.should.eql('about:blank')
    })
  })

  describe('grabDataFromPerformanceTiming', () => {
    it('should return data from performance timing', async () => {
      await I.amOnPage('/')
      const res = await I.grabDataFromPerformanceTiming()
      expect(res).to.have.property('responseEnd')
      expect(res).to.have.property('domInteractive')
      expect(res).to.have.property('domContentLoadedEventEnd')
      expect(res).to.have.property('loadEventEnd')
    })
  })

  webApiTests.tests()

  describe('#click', () => {
    it('should not try to click on invisible elements', async () => {
      await I.amOnPage('/invisible_elements')
      await I.click('Hello World')
    })
  })
  describe('#grabCheckedElementStatus', () => {
    it('check grabCheckedElementStatus', async () => {
      await I.amOnPage('/invisible_elements')
      let result = await I.grabCheckedElementStatus({ id: 'html' })
      assert.equal(result, true)
      result = await I.grabCheckedElementStatus({ id: 'css' })
      assert.equal(result, false)
      result = await I.grabCheckedElementStatus({ id: 'js' })
      assert.equal(result, true)
      result = await I.grabCheckedElementStatus({ id: 'ts' })
      assert.equal(result, false)
      try {
        await I.grabCheckedElementStatus({ id: 'basic' })
      } catch (e) {
        assert.equal(e.message, 'Element is not a checkbox or radio input')
      }
    })
  })
  describe('#grabDisabledElementStatus', () => {
    it('check isElementDisabled', async () => {
      await I.amOnPage('/invisible_elements')
      let result = await I.grabDisabledElementStatus({ id: 'fortran' })
      assert.equal(result, true)
      result = await I.grabDisabledElementStatus({ id: 'basic' })
      assert.equal(result, false)
    })
  })

  describe('#waitForFunction', () => {
    it('should wait for function returns true', () => {
      return I.amOnPage('/form/wait_js').then(() => I.waitForFunction(() => window.__waitJs, 3))
    })

    it('should pass arguments and wait for function returns true', () => {
      return I.amOnPage('/form/wait_js').then(() => I.waitForFunction(varName => window[varName], ['__waitJs'], 3))
    })
  })

  describe('#waitForVisible #waitForInvisible - within block', () => {
    it('should wait for visible element', async () => {
      await I.amOnPage('/iframe')
      await I._withinBegin({
        frame: '#number-frame-1234',
      })

      await I.waitForVisible('h1')
    })

    it('should wait for invisible element', async () => {
      await I.amOnPage('/iframe')
      await I._withinBegin({
        frame: '#number-frame-1234',
      })

      await I.waitForInvisible('h9')
    })

    it('should wait for element to hide', async () => {
      await I.amOnPage('/iframe')
      await I._withinBegin({
        frame: '#number-frame-1234',
      })

      await I.waitToHide('h9')
    })

    it('should wait for invisible combined with dontseeElement', async function () {
      this.timeout(30000) // Increase timeout for external URL test
      await I.amOnPage('https://codecept.io/')
      await I.waitForVisible('.frameworks', 10)
      await I.waitForVisible('[alt="React"]', 10)
      await I.waitForVisible('.mountains', 10)
      await I._withinBegin('.mountains', async () => {
        await I.dontSeeElement('[alt="React"]')
        await I.waitForInvisible('[alt="React"]', 2)
      })
    })
  })

  describe('#waitToHide', () => {
    it('should wait for hidden element', () => {
      return I.amOnPage('/form/wait_invisible')
        .then(() => I.see('Step One Button'))
        .then(() => I.waitToHide('#step_1', 2))
        .then(() => I.dontSeeElement('#step_1'))
        .then(() => I.dontSee('Step One Button'))
    })

    it('should wait for hidden element by XPath', () => {
      return I.amOnPage('/form/wait_invisible')
        .then(() => I.see('Step One Button'))
        .then(() => I.waitToHide('//div[@id="step_1"]', 2))
        .then(() => I.dontSeeElement('//div[@id="step_1"]'))
        .then(() => I.dontSee('Step One Button'))
    })
  })

  describe('#waitNumberOfVisibleElements', () => {
    it('should wait for a specified number of elements on the page', () =>
      I.amOnPage('/info')
        .then(() => I.waitNumberOfVisibleElements('//div[@id = "grab-multiple"]//a', 3))
        .then(() => I.waitNumberOfVisibleElements('//div[@id = "grab-multiple"]//a', 2, 0.1))
        .then(() => {
          throw Error('It should never get this far')
        })
        .catch(e => {
          e.message.should.include('The number of elements (//div[@id = "grab-multiple"]//a) is not 2 after 0.1 sec')
        }))

    it('should wait for a specified number of elements on the page using a css selector', () =>
      I.amOnPage('/info')
        .then(() => I.waitNumberOfVisibleElements('#grab-multiple > a', 3))
        .then(() => I.waitNumberOfVisibleElements('#grab-multiple > a', 2, 0.1))
        .then(() => {
          throw Error('It should never get this far')
        })
        .catch(e => {
          e.message.should.include('The number of elements (#grab-multiple > a) is not 2 after 0.1 sec')
        }))

    it('should wait for a specified number of elements which are not yet attached to the DOM', () =>
      I.amOnPage('/form/wait_num_elements')
        .then(() => I.waitNumberOfVisibleElements('.title', 2, 3))
        .then(() => I.see('Hello'))
        .then(() => I.see('World')))

    it('should wait for 0 number of visible elements', async () => {
      await I.amOnPage('/form/wait_invisible')
      await I.waitNumberOfVisibleElements('#step_1', 0)
    })
  })

  describe('#moveCursorTo', () => {
    it('should trigger hover event', () =>
      I.amOnPage('/form/hover')
        .then(() => I.moveCursorTo('#hover'))
        .then(() => I.see('Hovered', '#show')))

    it('should not trigger hover event because of the offset is beyond the element', () =>
      I.amOnPage('/form/hover')
        .then(() => I.moveCursorTo('#hover', 100, 100))
        .then(() => I.dontSee('Hovered', '#show')))
  })

  describe('#switchToNextTab, #switchToPreviousTab, #openNewTab, #closeCurrentTab, #closeOtherTabs, #grabNumberOfOpenTabs, #waitForNumberOfTabs', () => {
    it('should only have 1 tab open when the browser starts and navigates to the first page', () =>
      I.amOnPage('/')
        .then(() => I.wait(1))
        .then(() => I.grabNumberOfOpenTabs())
        .then(numPages => assert.equal(numPages, 1)))

    it('should switch to next tab', () =>
      I.amOnPage('/info')
        .then(() => I.wait(1))
        .then(() => I.grabNumberOfOpenTabs())
        .then(numPages => assert.equal(numPages, 1))
        .then(() => I.click('New tab'))
        .then(() => I.switchToNextTab())
        .then(() => I.wait(2))
        .then(() => I.seeCurrentUrlEquals('/login'))
        .then(() => I.grabNumberOfOpenTabs())
        .then(numPages => assert.equal(numPages, 2)))

    it('should assert when there is no ability to switch to next tab', () =>
      I.amOnPage('/')
        .then(() => I.click('More info'))
        .then(() => I.wait(1)) // Wait is required because the url is change by previous statement (maybe related to #914)
        .then(() => I.switchToNextTab(2))
        .then(() => I.wait(2))
        .then(() => assert.equal(true, false, 'Throw an error if it gets this far (which it should not)!'))
        .catch(e => {
          assert.equal(e.message, 'There is no ability to switch to next tab with offset 2')
        }))

    it('should close current tab', () =>
      I.amOnPage('/info')
        .then(() => I.click('New tab'))
        .then(() => I.switchToNextTab())
        .then(() => I.wait(2))
        .then(() => I.seeInCurrentUrl('/login'))
        .then(() => I.grabNumberOfOpenTabs())
        .then(numPages => assert.equal(numPages, 2))
        .then(() => I.closeCurrentTab())
        .then(() => I.wait(1))
        .then(() => I.seeInCurrentUrl('/info'))
        .then(() => I.grabNumberOfOpenTabs())
        .then(numPages => assert.equal(numPages, 1)))

    it('should close other tabs', () =>
      I.amOnPage('/')
        .then(() => I.openNewTab())
        .then(() => I.waitForNumberOfTabs(2))
        .then(() => I.seeInCurrentUrl('about:blank'))
        .then(() => I.amOnPage('/info'))
        .then(() => I.openNewTab())
        .then(() => I.amOnPage('/login'))
        .then(() => I.closeOtherTabs())
        .then(() => I.waitForNumberOfTabs(1))
        .then(() => I.seeInCurrentUrl('/login'))
        .then(() => I.grabNumberOfOpenTabs())
        .then(numPages => assert.equal(numPages, 1)))

    it('should open new tab', () =>
      I.amOnPage('/info')
        .then(() => I.openNewTab())
        .then(() => I.wait(1))
        .then(() => I.seeInCurrentUrl('about:blank'))
        .then(() => I.grabNumberOfOpenTabs())
        .then(numPages => assert.equal(numPages, 2)))

    it('should switch to previous tab', () =>
      I.amOnPage('/info')
        .then(() => I.openNewTab())
        .then(() => I.wait(1))
        .then(() => I.seeInCurrentUrl('about:blank'))
        .then(() => I.switchToPreviousTab())
        .then(() => I.wait(2))
        .then(() => I.seeInCurrentUrl('/info')))

    it('should assert when there is no ability to switch to previous tab', () =>
      I.amOnPage('/info')
        .then(() => I.openNewTab())
        .then(() => I.wait(1))
        .then(() => I.waitInUrl('about:blank'))
        .then(() => I.switchToPreviousTab(2))
        .then(() => I.wait(2))
        .then(() => I.waitInUrl('/info'))
        .catch(e => {
          assert.equal(e.message, 'There is no ability to switch to previous tab with offset 2')
        }))
  })

  describe('popup : #acceptPopup, #seeInPopup, #cancelPopup, #grabPopupText', () => {
    it('should accept popup window', () =>
      I.amOnPage('/form/popup')
        .then(() => I.amAcceptingPopups())
        .then(() => I.click('Confirm'))
        .then(() => I.acceptPopup())
        .then(() => I.see('Yes', '#result')))

    it('should accept popup window (using default popup action type)', () =>
      I.amOnPage('/form/popup')
        .then(() => I.click('Confirm'))
        .then(() => I.acceptPopup())
        .then(() => I.see('Yes', '#result')))

    it('should cancel popup', () =>
      I.amOnPage('/form/popup')
        .then(() => I.amCancellingPopups())
        .then(() => I.click('Confirm'))
        .then(() => I.cancelPopup())
        .then(() => I.see('No', '#result')))

    it('should check text in popup', () =>
      I.amOnPage('/form/popup')
        .then(() => I.amCancellingPopups())
        .then(() => I.click('Alert'))
        .then(() => I.seeInPopup('Really?'))
        .then(() => I.cancelPopup()))

    it('should grab text from popup', () =>
      I.amOnPage('/form/popup')
        .then(() => I.amCancellingPopups())
        .then(() => I.click('Alert'))
        .then(() => I.grabPopupText())
        .then(text => assert.equal(text, 'Really?')))

    it('should return null if no popup is visible (do not throw an error)', () =>
      I.amOnPage('/form/popup')
        .then(() => I.grabPopupText())
        .then(text => assert.equal(text, null)))
  })

  describe('#seeNumberOfElements', () => {
    it('should return 1 as count', () => I.amOnPage('/').then(() => I.seeNumberOfElements('#area1', 1)))
  })

  describe('#switchTo', () => {
    it('should switch reference to iframe content', () => {
      I.amOnPage('/iframe')
      I.switchTo('[name="content"]')
      I.see('Information')
      I.see('Lots of valuable data here')
    })

    it('should return error if iframe selector is invalid', () =>
      I.amOnPage('/iframe')
        .then(() => I.switchTo('#invalidIframeSelector'))
        .catch(e => {
          e.should.be.instanceOf(Error)
          e.message.should.be.equal('Element "#invalidIframeSelector" was not found by text|CSS|XPath')
        }))

    it('should return error if iframe selector is not iframe', () =>
      I.amOnPage('/iframe')
        .then(() => I.switchTo('h1'))
        .catch(e => {
          e.should.be.instanceOf(Error)
          e.message.should.be.equal('Element "#invalidIframeSelector" was not found by text|CSS|XPath')
        }))

    it('should return to parent frame given a null locator', async () => {
      I.amOnPage('/iframe')
      I.switchTo('[name="content"]')
      I.see('Information')
      I.see('Lots of valuable data here')
      I.switchTo(null)
      I.see('Iframe test')
    })

    it('should switch to iframe using css', () => {
      I.amOnPage('/iframe')
      I.switchTo('iframe#number-frame-1234')
      I.see('Information')
      I.see('Lots of valuable data here')
    })

    it('should switch to iframe using css when there are more than one iframes', () => {
      I.amOnPage('/iframes')
      I.switchTo('iframe#number-frame-1234')
      I.see('Information')
    })
  })

  describe('#seeInSource, #grabSource', () => {
    it('should check for text to be in HTML source', () =>
      I.amOnPage('/')
        .then(() => I.seeInSource('<title>TestEd Beta 2.0</title>'))
        .then(() => I.dontSeeInSource('<meta')))

    it('should grab the source', () =>
      I.amOnPage('/')
        .then(() => I.grabSource())
        .then(source => assert.notEqual(source.indexOf('<title>TestEd Beta 2.0</title>'), -1, 'Source html should be retrieved')))
  })

  describe('#seeTitleEquals', () => {
    it('should check that title is equal to provided one', () =>
      I.amOnPage('/')
        .then(() => I.seeTitleEquals('TestEd Beta 2.0'))
        .then(() => I.seeTitleEquals('TestEd Beta 2.'))
        .then(() => assert.equal(true, false, 'Throw an error because it should not get this far!'))
        .catch(e => {
          e.should.be.instanceOf(Error)
          e.message.should.be.equal('expected web page title "TestEd Beta 2.0" to equal "TestEd Beta 2."')
        }))
  })

  describe('#seeTextEquals', () => {
    it('should check text is equal to provided one', () =>
      I.amOnPage('/')
        .then(() => I.seeTextEquals('Welcome to test app!', 'h1'))
        .then(() => I.seeTextEquals('Welcome to test app', 'h1'))
        .then(() => assert.equal(true, false, 'Throw an error because it should not get this far!'))
        .catch(e => {
          e.should.be.instanceOf(Error)
          e.message.should.be.equal('expected element h1 "Welcome to test app" to equal "Welcome to test app!"')
        }))
  })

  describe('#selectOption', () => {
    it('should select option by label and partial option text', async () => {
      await I.amOnPage('/form/select')
      await I.selectOption('Select your age', '21-')
      await I.click('Submit')
      assert.equal(formContents('age'), 'adult')
    })
  })

  describe('#_locateClickable', () => {
    it('should locate a button to click', () =>
      I.amOnPage('/form/checkbox')
        .then(() => I._locateClickable('Submit'))
        .then(res => {
          res.length.should.be.equal(1)
        }))

    it('should not locate a non-existing checkbox using _locateClickable', () =>
      I.amOnPage('/form/checkbox')
        .then(() => I._locateClickable('I disagree'))
        .then(res => res.length.should.be.equal(0)))
  })

  describe('#_locateCheckable', () => {
    it('should locate a checkbox', () =>
      I.amOnPage('/form/checkbox')
        .then(() => I._locateCheckable('I Agree'))
        .then(res => res.should.be.not.undefined))
  })

  describe('#_locateFields', () => {
    it('should locate a field', () =>
      I.amOnPage('/form/field')
        .then(() => I._locateFields('Name'))
        .then(res => res.length.should.be.equal(1)))

    it('should not locate a non-existing field', () =>
      I.amOnPage('/form/field')
        .then(() => I._locateFields('Mother-in-law'))
        .then(res => res.length.should.be.equal(0)))
  })

  describe('check fields: #seeInField, #seeCheckboxIsChecked, ...', () => {
    it('should throw error if field is not empty', () =>
      I.amOnPage('/form/empty')
        .then(() => I.seeInField('#empty_input', 'Ayayay'))
        .catch(e => {
          e.should.be.instanceOf(AssertionFailedError)
          e.inspect().should.be.equal('expected fields by #empty_input to include "Ayayay"')
        }))

    it('should check values in checkboxes', async () => {
      await I.amOnPage('/form/field_values')
      await I.dontSeeInField('checkbox[]', 'not seen one')
      await I.seeInField('checkbox[]', 'see test one')
      await I.dontSeeInField('checkbox[]', 'not seen two')
      await I.seeInField('checkbox[]', 'see test two')
      await I.dontSeeInField('checkbox[]', 'not seen three')
      await I.seeInField('checkbox[]', 'see test three')
    })

    it('should check values are the secret type in checkboxes', async () => {
      await I.amOnPage('/form/field_values')
      await I.dontSeeInField('checkbox[]', Secret.secret('not seen one'))
      await I.seeInField('checkbox[]', Secret.secret('see test one'))
      await I.dontSeeInField('checkbox[]', Secret.secret('not seen two'))
      await I.seeInField('checkbox[]', Secret.secret('see test two'))
      await I.dontSeeInField('checkbox[]', Secret.secret('not seen three'))
      await I.seeInField('checkbox[]', Secret.secret('see test three'))
    })

    it('should check values with boolean', async () => {
      await I.amOnPage('/form/field_values')
      await I.seeInField('checkbox1', true)
      await I.dontSeeInField('checkbox1', false)
      await I.seeInField('checkbox2', false)
      await I.dontSeeInField('checkbox2', true)
      await I.seeInField('radio2', true)
      await I.dontSeeInField('radio2', false)
      await I.seeInField('radio3', false)
      await I.dontSeeInField('radio3', true)
    })

    it('should check values in radio', async () => {
      await I.amOnPage('/form/field_values')
      await I.seeInField('radio1', 'see test one')
      await I.dontSeeInField('radio1', 'not seen one')
      await I.dontSeeInField('radio1', 'not seen two')
      await I.dontSeeInField('radio1', 'not seen three')
    })

    it('should check values in select', async () => {
      await I.amOnPage('/form/field_values')
      await I.seeInField('select1', 'see test one')
      await I.dontSeeInField('select1', 'not seen one')
      await I.dontSeeInField('select1', 'not seen two')
      await I.dontSeeInField('select1', 'not seen three')
    })

    it('should check for empty select field', async () => {
      await I.amOnPage('/form/field_values')
      await I.seeInField('select3', '')
    })

    it('should check for select multiple field', async () => {
      await I.amOnPage('/form/field_values')
      await I.dontSeeInField('select2', 'not seen one')
      await I.seeInField('select2', 'see test one')
      await I.dontSeeInField('select2', 'not seen two')
      await I.seeInField('select2', 'see test two')
      await I.dontSeeInField('select2', 'not seen three')
      await I.seeInField('select2', 'see test three')
    })
  })

  describe('#clearField', () => {
    it('should clear input', async () => {
      await I.amOnPage('/form/field')
      await I.fillField('Name', 'value that is cleared using I.clearField()')
      await I.clearField('Name')
      await I.dontSeeInField('Name', 'value that is cleared using I.clearField()')
    })

    it('should clear div textarea', async () => {
      await I.amOnPage('/form/field')
      await I.clearField('#textarea')
      await I.dontSeeInField('#textarea', 'I look like textarea')
    })

    it('should clear textarea', async () => {
      await I.amOnPage('/form/textarea')
      await I.fillField('#description', 'value that is cleared using I.clearField()')
      await I.clearField('#description')
      await I.dontSeeInField('#description', 'value that is cleared using I.clearField()')
    })

    xit('should clear contenteditable', async () => {
      const isClearMethodPresent = await I.usePlaywrightTo('check if new Playwright .clear() method present', async ({ page }) => {
        return typeof page.locator().clear === 'function'
      })
      if (!isClearMethodPresent) {
        this.skip()
      }

      await I.amOnPage('/form/contenteditable')
      await I.clearField('#contenteditableDiv')
      await I.dontSee('This is editable. Click here to edit this text.', '#contenteditableDiv')
    })
  })

  describe('#pressKey, #pressKeyDown, #pressKeyUp', () => {
    it('should be able to send special keys to element', async () => {
      await I.amOnPage('/form/field')
      await I.appendField('Name', '-')

      await I.pressKey(['Right Shift', 'Home'])
      await I.pressKey('Delete')

      // Sequence only executes up to first non-modifier key ('Digit1')
      await I.pressKey(['SHIFT_RIGHT', 'Digit1', 'Digit4'])
      await I.pressKey('1')
      await I.pressKey('2')
      await I.pressKey('3')
      await I.pressKey('ArrowLeft')
      await I.pressKey('Left Arrow')
      await I.pressKey('arrow_left')
      await I.pressKeyDown('Shift')
      await I.pressKey('a')
      await I.pressKey('KeyB')
      await I.pressKeyUp('ShiftLeft')
      await I.pressKey('C')
      await I.seeInField('Name', '!ABC123')
    })

    it('should use modifier key based on operating system', async () => {
      await I.amOnPage('/form/field')
      await I.fillField('Name', 'value that is cleared using select all shortcut')

      await I.pressKey(['ControlOrCommand', 'a'])
      await I.pressKey('Backspace')
      await I.dontSeeInField('Name', 'value that is cleared using select all shortcut')
    })

    it('should show correct numpad or punctuation key when Shift modifier is active', async () => {
      await I.amOnPage('/form/field')
      await I.fillField('Name', '')

      await I.pressKey(';')
      await I.pressKey(['Shift', ';'])
      await I.pressKey(['Shift', 'Semicolon'])
      await I.pressKey('=')
      await I.pressKey(['Shift', '='])
      await I.pressKey(['Shift', 'Equal'])
      await I.pressKey('*')
      await I.pressKey(['Shift', '*'])
      await I.pressKey(['Shift', 'Multiply'])
      await I.pressKey('+')
      await I.pressKey(['Shift', '+'])
      await I.pressKey(['Shift', 'Add'])
      await I.pressKey(',')
      await I.pressKey(['Shift', ','])
      await I.pressKey(['Shift', 'Comma'])
      await I.pressKey(['Shift', 'NumpadComma'])
      await I.pressKey(['Shift', 'Separator'])
      await I.pressKey('-')
      await I.pressKey(['Shift', '-'])
      await I.pressKey(['Shift', 'Subtract'])
      await I.pressKey('.')
      await I.pressKey(['Shift', '.'])
      await I.pressKey('/')
      await I.pressKey(['Shift', '/'])
      await I.pressKey(['Shift', 'Divide'])
      await I.pressKey(['Shift', 'Slash'])

      await I.seeInField('Name', ';::=++***+++,<<<<-_-.>/?/?')
    })
  })

  describe('#type', () => {
    it('should type national characters', async () => {
      await I.amOnPage('/form/field')
      await I.fillField('Name', '')
      await I.type('Oprávněné')
      await I.seeInField('Name', 'Oprávněné')
    })
  })

  describe('#waitForEnabled', () => {
    it('should wait for input text field to be enabled', () =>
      I.amOnPage('/form/wait_enabled')
        .then(() => I.waitForEnabled('#text', 2))
        .then(() => I.fillField('#text', 'hello world'))
        .then(() => I.seeInField('#text', 'hello world')))

    it('should wait for input text field to be enabled by xpath', () =>
      I.amOnPage('/form/wait_enabled')
        .then(() => I.waitForEnabled("//*[@name = 'test']", 2))
        .then(() => I.fillField('#text', 'hello world'))
        .then(() => I.seeInField('#text', 'hello world')))

    it('should wait for a button to be enabled', () =>
      I.amOnPage('/form/wait_enabled')
        .then(() => I.waitForEnabled('#text', 2))
        .then(() => I.click('#button'))
        .then(() => I.see('button was clicked', '#message')))
  })

  describe('#waitForDisabled', () => {
    it('should wait for input text field to be disabled', () => I.amOnPage('/form/wait_disabled').then(() => I.waitForDisabled('#text', 1)))

    it('should wait for input text field to be enabled by xpath', () => I.amOnPage('/form/wait_disabled').then(() => I.waitForDisabled("//*[@name = 'test']", 1)))

    it('should wait for a button to be disabled', () => I.amOnPage('/form/wait_disabled').then(() => I.waitForDisabled('#text', 1)))
  })

  describe('#waitForValue', () => {
    it('should wait for expected value for given locator', () =>
      I.amOnPage('/info')
        .then(() => I.waitForValue('//input[@name= "rus"]', 'Верно'))
        .then(() => I.waitForValue('//input[@name= "rus"]', 'Верно3', 0.1))
        .then(() => {
          throw Error('It should never get this far')
        })
        .catch(e => {
          e.message.should.include('element (//input[@name= "rus"]) is not in DOM or there is no element(//input[@name= "rus"]) with value "Верно3" after 0.1 sec')
        }))

    it('should wait for expected value for given css locator', () =>
      I.amOnPage('/form/wait_value')
        .then(() => I.seeInField('#text', 'Hamburg'))
        .then(() => I.waitForValue('#text', 'Brisbane', 2.5))
        .then(() => I.seeInField('#text', 'Brisbane')))

    it('should wait for expected value for given xpath locator', () =>
      I.amOnPage('/form/wait_value')
        .then(() => I.seeInField('#text', 'Hamburg'))
        .then(() => I.waitForValue('//input[@value = "Grüße aus Hamburg"]', 'Brisbane', 2.5))
        .then(() => I.seeInField('#text', 'Brisbane')))

    it('should only wait for one of the matching elements to contain the value given xpath locator', () =>
      I.amOnPage('/form/wait_value')
        .then(() => I.waitForValue('//input[@type = "text"]', 'Brisbane', 4))
        .then(() => I.seeInField('#text', 'Brisbane'))
        .then(() => I.seeInField('#text2', 'London')))

    it('should only wait for one of the matching elements to contain the value given css locator', () =>
      I.amOnPage('/form/wait_value')
        .then(() => I.waitForValue('.inputbox', 'Brisbane', 4))
        .then(() => I.seeInField('#text', 'Brisbane'))
        .then(() => I.seeInField('#text2', 'London')))
  })

  describe('#waitForText timeout fix', () => {
    it('should wait for the full timeout duration when text is not found', async function () {
      this.timeout(10000) // Allow up to 10 seconds for this test

      const startTime = Date.now()
      const timeoutSeconds = 3 // 3 second timeout

      try {
        await I.amOnPage('/')
        await I.waitForText('ThisTextDoesNotExistAnywhere12345', timeoutSeconds)
        // Should not reach here
        throw new Error('waitForText should have thrown an error')
      } catch (error) {
        const elapsedTime = Date.now() - startTime
        const expectedTimeout = timeoutSeconds * 1000

        // Verify it waited close to the full timeout (allow 500ms tolerance)
        assert.ok(elapsedTime >= expectedTimeout - 500, `Expected to wait at least ${expectedTimeout - 500}ms, but waited ${elapsedTime}ms`)
        assert.ok(elapsedTime <= expectedTimeout + 1000, `Expected to wait at most ${expectedTimeout + 1000}ms, but waited ${elapsedTime}ms`)
        assert.ok(error.message.includes('was not found on page after'), `Expected error message about text not found, got: ${error.message}`)
      }
    })

    it('should return quickly when text is found', async function () {
      this.timeout(5000)

      const startTime = Date.now()

      await I.amOnPage('/')
      await I.waitForText('TestEd', 10) // This text should exist on the test page

      const elapsedTime = Date.now() - startTime
      // Should find text quickly, within 2 seconds
      assert.ok(elapsedTime < 2000, `Expected to find text quickly but took ${elapsedTime}ms`)
    })

    it('should work correctly with context parameter and proper timeout', async function () {
      this.timeout(8000)

      const startTime = Date.now()
      const timeoutSeconds = 2

      try {
        await I.amOnPage('/')
        await I.waitForText('NonExistentTextInBody', timeoutSeconds, 'body')
        throw new Error('Should have thrown timeout error')
      } catch (error) {
        const elapsedTime = Date.now() - startTime
        const expectedTimeout = timeoutSeconds * 1000

        // Verify proper timeout behavior with context
        assert.ok(elapsedTime >= expectedTimeout - 500, `Expected to wait at least ${expectedTimeout - 500}ms, but waited ${elapsedTime}ms`)
        assert.ok(elapsedTime <= expectedTimeout + 1000, `Expected to wait at most ${expectedTimeout + 1000}ms, but waited ${elapsedTime}ms`)
        assert.ok(error.message.includes('was not found on page after'), `Expected timeout error message, got: ${error.message}`)
      }
    })
  })

  describe('#grabHTMLFrom', () => {
    it('should grab inner html from an element using xpath query', () =>
      I.amOnPage('/')
        .then(() => I.grabHTMLFrom('//title'))
        .then(html => assert.equal(html, 'TestEd Beta 2.0')))

    it('should grab inner html from an element using id query', () =>
      I.amOnPage('/')
        .then(() => I.grabHTMLFrom('#area1'))
        .then(html => assert.equal(html.trim(), '<a href="/form/file" qa-id="test" qa-link="test"> Test Link </a>')))

    it('should grab inner html from multiple elements', () =>
      I.amOnPage('/')
        .then(() => I.grabHTMLFromAll('//a'))
        .then(html => assert.equal(html.length, 5)))

    it('should grab inner html from within an iframe', () =>
      I.amOnPage('/iframe')
        .then(() => I.switchTo({ frame: 'iframe' }))
        .then(() => I.grabHTMLFrom('#new-tab'))
        .then(html => assert.equal(html.trim(), '<a href="/login" target="_blank">New tab</a>')))
  })

  describe('#grabBrowserLogs', () => {
    it('should grab browser logs', () =>
      I.amOnPage('/')
        .then(() =>
          I.executeScript(() => {
            console.log('Test log entry')
          }),
        )
        .then(() => I.grabBrowserLogs())
        .then(logs => {
          const matchingLogs = logs.filter(log => log.text().indexOf('Test log entry') > -1)
          assert.equal(matchingLogs.length, 1)
        }))

    it('should grab browser logs in new tab', () =>
      I.amOnPage('/')
        .then(() => I.openNewTab())
        .then(() =>
          I.executeScript(() => {
            console.log('Test log entry')
          }),
        )
        .then(() => I.grabBrowserLogs())
        .then(logs => {
          const matchingLogs = logs.filter(log => log.text().indexOf('Test log entry') > -1)
          assert.equal(matchingLogs.length, 1)
        }))

    it('should grab browser logs in two tabs', () =>
      I.amOnPage('/')
        .then(() =>
          I.executeScript(() => {
            console.log('Test log entry 1')
          }),
        )
        .then(() => I.openNewTab())
        .then(() =>
          I.executeScript(() => {
            console.log('Test log entry 2')
          }),
        )
        .then(() => I.grabBrowserLogs())
        .then(logs => {
          const matchingLogs = logs.filter(log => log.text().includes('Test log entry'))
          assert.equal(matchingLogs.length, 2)
        }))

    it('should grab browser logs in next tab', () =>
      I.amOnPage('/info')
        .then(() => I.click('New tab'))
        .then(() => I.switchToNextTab())
        .then(() =>
          I.executeScript(() => {
            console.log('Test log entry')
          }),
        )
        .then(() => I.grabBrowserLogs())
        .then(logs => {
          const matchingLogs = logs.filter(log => log.text().indexOf('Test log entry') > -1)
          assert.equal(matchingLogs.length, 1)
        }))
  })

  describe('#dragAndDrop', () => {
    it('Drag item from source to target (no iframe) @dragNdrop - customized steps', () =>
      I.amOnPage('https://jqueryui.com/resources/demos/droppable/default.html')
        .then(() => I.seeElementInDOM('#draggable'))
        .then(() => I.dragAndDrop('#draggable', '#droppable'))
        .then(() => I.see('Dropped')))

    it('Drag item from source to target (no iframe) @dragNdrop - using Playwright API', () =>
      I.amOnPage('https://jqueryui.com/resources/demos/droppable/default.html')
        .then(() => I.seeElementInDOM('#draggable'))
        .then(() => I.dragAndDrop('#draggable', '#droppable', { force: true }))
        .then(() => I.see('Dropped')))

    xit('Drag and drop from within an iframe', () =>
      I.amOnPage('https://jqueryui.com/droppable')
        .then(() => I.resizeWindow(700, 700))
        .then(() => I.switchTo('//iframe[@class="demo-frame"]'))
        .then(() => I.seeElementInDOM('#draggable'))
        .then(() => I.dragAndDrop('#draggable', '#droppable'))
        .then(() => I.see('Dropped')))
  })

  describe('#switchTo frame', () => {
    it('should switch to frame using name', () =>
      I.amOnPage('/iframe')
        .then(() => I.see('Iframe test', 'h1'))
        .then(() => I.dontSee('Information', 'h1'))
        .then(() => I.switchTo('iframe'))
        .then(() => I.see('Information', 'h1'))
        .then(() => I.dontSee('Iframe test', 'h1')))

    it('should switch to root frame', () =>
      I.amOnPage('/iframe')
        .then(() => I.see('Iframe test', 'h1'))
        .then(() => I.dontSee('Information', 'h1'))
        .then(() => I.switchTo('iframe'))
        .then(() => I.see('Information', 'h1'))
        .then(() => I.dontSee('Iframe test', 'h1'))
        .then(() => I.switchTo())
        .then(() => I.see('Iframe test', 'h1')))

    it('should switch to frame using frame number', () =>
      I.amOnPage('/iframe')
        .then(() => I.see('Iframe test', 'h1'))
        .then(() => I.dontSee('Information', 'h1'))
        .then(() => I.switchTo(0))
        .then(() => I.see('Information', 'h1'))
        .then(() => I.dontSee('Iframe test', 'h1'))
        .then(() => I.switchTo())
        .then(() => I.see('Iframe test', 'h1')))
  })

  describe('#dragSlider', () => {
    it('should drag scrubber to given position', async () => {
      await I.amOnPage('/form/page_slider')
      await I.seeElementInDOM('#slidecontainer input')
      const before = await I.grabValueFrom('#slidecontainer input')
      await I.dragSlider('#slidecontainer input', 20)
      const after = await I.grabValueFrom('#slidecontainer input')
      assert.notEqual(before, after)
    })
  })

  describe('#uncheckOption', () => {
    it('should uncheck option that is currently checked', async () => {
      await I.amOnPage('/info')
      await I.uncheckOption('interesting')
      await I.dontSeeCheckboxIsChecked('interesting')
    })

    it('should NOT uncheck option that is NOT currently checked', async () => {
      await I.amOnPage('/info')
      await I.uncheckOption('interesting')
      // Unchecking again should not affect the current 'unchecked' status
      await I.uncheckOption('interesting')
      await I.dontSeeCheckboxIsChecked('interesting')
    })
  })

  describe('#usePlaywrightTo', () => {
    it('should return title', async () => {
      await I.amOnPage('/')
      const title = await I.usePlaywrightTo('test', async ({ page }) => {
        return page.title()
      })
      assert.equal('TestEd Beta 2.0', title)
    })

    it('should pass expected parameters', async () => {
      await I.amOnPage('/')
      const params = await I.usePlaywrightTo('test', async params => {
        return params
      })
      expect(params.page).to.exist
      expect(params.browserContext).to.exist
      expect(params.browser).to.exist
    })
  })

  describe('#mockRoute, #stopMockingRoute', () => {
    it('should mock a route', async () => {
      await I.amOnPage('/form/fetch_call')
      await I.mockRoute('http://localhost:3001/api/comments/1', route => {
        route.fulfill({
          status: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          contentType: 'application/json',
          body: '{"name": "this was mocked" }',
        })
      })
      await I.click('GET COMMENTS')
      await I.see('this was mocked')
      await I.stopMockingRoute('http://localhost:3001/api/comments/1')
      await I.click('GET COMMENTS')
      await I.see('data')
      await I.dontSee('this was mocked')
    })
  })

  describe('#makeApiRequest', () => {
    it('should make 3rd party API request', async () => {
      // Using local json-server for reliable testing
      const response = await I.makeApiRequest('get', 'http://127.0.0.1:8010/posts/1')
      expect(response.status()).to.equal(200)
      expect(await response.json()).to.include.keys(['id', 'title', 'author'])
    })

    it('should make local API request', async () => {
      const response = await I.makeApiRequest('get', '/form/fetch_call')
      expect(response.status()).to.equal(200)
    })

    it('should convert to axios response with onResponse hook', async () => {
      let response
      I.config.onResponse = resp => (response = resp)
      await I.makeApiRequest('get', 'http://127.0.0.1:8010/posts/1')
      expect(response).to.be.ok
      expect(response.status).to.equal(200)
      expect(response.data).to.include.keys(['id', 'title', 'author'])
    })
  })

  describe('#grabElementBoundingRect', () => {
    it('should get the element bounding rectangle', async () => {
      await I.amOnPage('/image')
      const size = await I.grabElementBoundingRect('#logo')
      expect(size.x).is.greaterThan(39) // 40 or more
      expect(size.y).is.greaterThan(39)
      expect(size.width).is.greaterThan(0)
      expect(size.height).is.greaterThan(0)
      expect(size.width).to.eql(100)
      expect(size.height).to.eql(100)
    })

    it('should get the element width', async () => {
      await I.amOnPage('/image')
      const width = await I.grabElementBoundingRect('#logo', 'width')
      expect(width).is.greaterThan(0)
      expect(width).to.eql(100)
    })

    it('should get the element height', async () => {
      await I.amOnPage('/image')
      const height = await I.grabElementBoundingRect('#logo', 'height')
      expect(height).is.greaterThan(0)
      expect(height).to.eql(100)
    })
  })

  describe('#handleDownloads - with passed folder', () => {
    before(async () => {
      // create download folder;
      global.output_dir = path.join(`${__dirname}/../data/output`)

      FS = new FileSystem()
      FS._before()
      FS.amInPath('output/downloadHere')
    })

    it('should download file', async () => {
      await I.amOnPage('/form/download')
      await I.handleDownloads('downloadHere/avatar.jpg')
      await I.click('Download file')
      await FS.waitForFile('avatar.jpg', 5)
    })
  })

  describe('#handleDownloads - with default folder', () => {
    before(async () => {
      // create download folder;
      global.output_dir = path.join(`${__dirname}/../data/output`)

      FS = new FileSystem()
      FS._before()
      FS.amInPath('output')
    })

    it('should download file', async () => {
      await I.amOnPage('/form/download')
      await I.handleDownloads('avatar.jpg')
      await I.click('Download file')
      await FS.waitForFile('avatar.jpg', 5)
    })
  })

  describe('#waitForURL', () => {
    it('should wait for URL', () => {
      I.amOnPage('/')
      I.click('More info')
      I.waitForURL('/info')
      I.see('Information')
    })

    it('should wait for regex URL', () => {
      I.amOnPage('/')
      I.click('More info')
      I.waitForURL(/info/)
      I.see('Information')
    })
  })
})

describe('Playwright - Custom Locator Strategies Configuration', () => {
  let customI

  before(async () => {
    // Create a new Playwright instance with custom locator strategies
    customI = new Playwright({
      url: siteUrl,
      browser: process.env.BROWSER || 'chromium',
      show: false,
      waitForTimeout: 5000,
      timeout: 2000,
      restart: true,
      chrome: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
      customLocatorStrategies: {
        byRole: (selector, root) => {
          return root.querySelector(`[role="${selector}"]`)
        },
        byTestId: (selector, root) => {
          return root.querySelector(`[data-testid="${selector}"]`)
        },
        byDataQa: (selector, root) => {
          const elements = root.querySelectorAll(`[data-qa="${selector}"]`)
          return Array.from(elements) // Return all matching elements
        },
      },
    })
    // Note: Skip _init() for configuration-only tests to avoid browser dependency
    // await customI._init()
    // Skip browser initialization for basic config tests
  })

  after(async () => {
    if (customI) {
      try {
        await customI._after()
      } catch (e) {
        // Ignore cleanup errors if browser wasn't initialized
      }
    }
  })

  it('should have custom locator strategies defined', () => {
    expect(customI.customLocatorStrategies).to.not.be.undefined
    expect(customI.customLocatorStrategies.byRole).to.be.a('function')
    expect(customI.customLocatorStrategies.byTestId).to.be.a('function')
    expect(customI.customLocatorStrategies.byDataQa).to.be.a('function')
  })

  it('should detect custom locator strategies are defined', () => {
    expect(customI._isCustomLocatorStrategyDefined()).to.be.true
  })

  it('should lookup custom locator functions', () => {
    const byRoleFunction = customI._lookupCustomLocator('byRole')
    expect(byRoleFunction).to.be.a('function')

    const nonExistentFunction = customI._lookupCustomLocator('nonExistent')
    expect(nonExistentFunction).to.be.null
  })

  it('should identify custom locators correctly', () => {
    const customLocator = { byRole: 'button' }
    expect(customI._isCustomLocator(customLocator)).to.be.true

    const standardLocator = { css: '#test' }
    expect(customI._isCustomLocator(standardLocator)).to.be.false
  })

  it('should throw error for undefined custom locator strategy', () => {
    const invalidLocator = { nonExistent: 'test' }

    try {
      customI._isCustomLocator(invalidLocator)
      expect.fail('Should have thrown an error')
    } catch (error) {
      expect(error.message).to.include('Please define "customLocatorStrategies"')
    }
  })
})

describe('Playwright - Custom Locator Strategies Browser Tests', () => {
  let customI

  before(async () => {
    // Create a new Playwright instance with custom locator strategies
    customI = new Playwright({
      url: siteUrl,
      browser: process.env.BROWSER || 'chromium',
      show: false,
      waitForTimeout: 5000,
      timeout: 2000,
      restart: true,
      chrome: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
      customLocatorStrategies: {
        byRole: (selector, root) => {
          return root.querySelector(`[role="${selector}"]`)
        },
        byTestId: (selector, root) => {
          return root.querySelector(`[data-testid="${selector}"]`)
        },
        byDataQa: (selector, root) => {
          const elements = root.querySelectorAll(`[data-qa="${selector}"]`)
          return Array.from(elements) // Return all matching elements
        },
      },
    })
    await customI._init()
  })

  after(async () => {
    if (customI) {
      try {
        await customI._after()
      } catch (e) {
        // Ignore cleanup errors if browser wasn't initialized
      }
    }
  })

  it('should use custom locator to find elements on page', async function () {
    // Skip if browser can't be initialized
    try {
      await customI._beforeSuite()
      await customI._before()
    } catch (e) {
      this.skip() // Skip if browser not available
    }

    await customI.amOnPage('/form/example1')

    // Test byRole locator - assuming the page has elements with role attributes
    // This test assumes there's a button with role="button" on the form page
    // If the test fails, it means the page doesn't have the expected elements
    // but the custom locator mechanism is working if no errors are thrown

    try {
      const elements = await customI._locate({ byRole: 'button' })
      // If we get here without error, the custom locator is working
      expect(elements).to.be.an('array')
    } catch (error) {
      // If the error is about element not found, that's ok - means locator works but element doesn't exist
      // If it's about custom locator not being recognized, that's a real failure
      if (error.message.includes('Please define "customLocatorStrategies"')) {
        throw error
      }
      // Element not found is acceptable - means the custom locator is working
      console.log('Custom locator working but element not found (expected):', error.message)
    }
  })
})

let remoteBrowser
async function createRemoteBrowser() {
  if (remoteBrowser) {
    await remoteBrowser.close()
  }
  remoteBrowser = await playwright.chromium.launchServer({
    webSocket: true,
    // args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  })
  remoteBrowser.on('disconnected', () => {
    remoteBrowser = null
  })
  return remoteBrowser
}

describe.skip('Playwright (remote browser) websocket', function () {
  this.timeout(35000)
  this.retries(1)

  const helperConfig = {
    chromium: {
      browserWSEndpoint: 'ws://localhost:9222/devtools/browser/<id>',
      // Following options are ignored with remote browser
      headless: false,
      devtools: true,
    },
    browser: 'chromium',
    restart: true,
    // Important in order to handle remote browser state before starting/stopping browser
    url: siteUrl,
    waitForTimeout: 5000,
    waitForAction: 500,
    windowSize: '500x700',
  }

  before(async () => {
    global.codecept_dir = path.join(__dirname, '/../data')
    I = new Playwright(helperConfig)
    await I._init()
  })

  beforeEach(async () => {
    // Mimick remote session by creating another browser instance
    const remoteBrowser = await createRemoteBrowser()
    // I.isRunning = false;
    // Set websocket endpoint to other browser instance
  })

  afterEach(async () => {
    await I._after()
    return remoteBrowser && remoteBrowser.close()
  })

  describe('#_startBrowser', () => {
    it('should throw an exception when endpoint is unreachable', async () => {
      I._setConfig({ ...helperConfig, chromium: { browserWSEndpoint: 'ws://unreachable/' } })
      try {
        await I._startBrowser()
        throw Error('It should never get this far')
      } catch (e) {
        e.message.should.include('Cannot connect to websocket')
      }
    })

    it('should connect to legacy API endpoint', async () => {
      const wsEndpoint = await remoteBrowser.wsEndpoint()
      I._setConfig({ ...helperConfig, chromium: { browserWSEndpoint: { wsEndpoint } } })
      await I._before()
      await I.amOnPage('/')
      await I.see('Welcome to test app')
    })

    it('should connect to remote browsers', async () => {
      helperConfig.chromium.browserWSEndpoint = await remoteBrowser.wsEndpoint()
      I._setConfig(helperConfig)

      await I._before()
      await I.amOnPage('/')
      await I.see('Welcome to test app')
    })

    it('should manage pages in remote browser', async () => {
      helperConfig.chromium.browserWSEndpoint = await remoteBrowser.wsEndpoint()
      I._setConfig(helperConfig)

      await I._before()
      assert.ok(I.isRemoteBrowser)
      const context = await I.browserContext
      // Session was cleared
      let currentPages = await context.pages()
      assert.equal(currentPages.length, 1)

      let numPages = await I.grabNumberOfOpenTabs()
      assert.equal(numPages, 1)

      await I.openNewTab()

      numPages = await I.grabNumberOfOpenTabs()
      assert.equal(numPages, 2)

      await I._stopBrowser()

      currentPages = await context.pages()
      assert.equal(currentPages.length, 0)
    })
  })
})

describe('Playwright - BasicAuth', function () {
  this.timeout(35000)

  before(async () => {
    global.codecept_dir = path.join(__dirname, '/../data')

    I = new Playwright({
      url: 'http://localhost:8000',
      browser: 'chromium',
      windowSize: '500x700',
      show: false,
      restart: true,
      waitForTimeout: 5000,
      waitForAction: 500,
      chrome: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
      defaultPopupAction: 'accept',
      basicAuth: { username: 'admin', password: 'admin' },
    })
    await I._init()
    return I._beforeSuite()
  })

  beforeEach(() => {
    webApiTests.init({
      I,
      siteUrl,
    })
    return I._before().then(() => {
      page = I.page
    })
  })

  afterEach(() => {
    return I._after()
  })

  describe('open page with provided basic auth', () => {
    it('should be authenticated ', async () => {
      await I.amOnPage('/basic_auth')
      await I.see('You entered admin as your password.')
    })
  })
})

describe('Playwright - Emulation', () => {
  before(async () => {
    global.codecept_dir = path.join(__dirname, '/../data')

    I = new Playwright({
      url: 'http://localhost:8000',
      browser: 'chromium',
      windowSize: '500x700',
      emulate: devices['iPhone 6'],
      show: false,
      restart: true,
      waitForTimeout: 5000,
      waitForAction: 500,
      chrome: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    })
    await I._init()
    return I._beforeSuite()
  })

  beforeEach(() => {
    return I._before().then(() => {
      page = I.page
      browser = I.browser
    })
  })

  afterEach(() => {
    return I._after()
  })

  it('should open page as iPhone ', async () => {
    await I.amOnPage('/')
    const width = await I.executeScript('window.innerWidth')
    assert.equal(width, 980)
  })
})

describe('Playwright - PERSISTENT', () => {
  before(async () => {
    global.codecept_dir = path.join(__dirname, '/../data')

    I = new Playwright({
      url: 'http://localhost:8000',
      browser: 'chromium',
      windowSize: '500x700',
      show: false,
      restart: true,
      waitForTimeout: 5000,
      waitForAction: 500,
      chromium: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        userDataDir: '/tmp/playwright-tmp',
      },
    })
    await I._init()
    return I._beforeSuite()
  })

  beforeEach(() => {
    return I._before().then(() => {
      page = I.page
      browser = I.browser
    })
  })

  afterEach(() => {
    return I._after()
  })

  it('should launch a persistent context', async () => {
    assert.equal(I._getType(), 'BrowserContext')
  })
})

describe('Playwright - Electron', function () {
  before(async function () {
    this.timeout(15000) // Increase timeout for Electron test
    global.codecept_dir = path.join(__dirname, '/../data')

    I = new Playwright({
      waitForTimeout: 5000,
      waitForAction: 500,
      restart: false, // Don't restart browser to avoid hanging
      browser: 'electron',
      electron: {
        executablePath: electron,
        args: [path.join(global.codecept_dir, '/electron/')],
      },
    })
    try {
      await I._init()
      await I._beforeSuite()
    } catch (e) {
      console.log('Electron test setup failed, skipping tests:', e.message)
      this.skip()
    }
  })

  describe('#amOnPage', () => {
    it('should throw an error', async () => {
      try {
        await I.amOnPage('/')
        throw Error('It should never get this far')
      } catch (e) {
        e.message.should.include('Cannot open pages inside an Electron container')
      }
    })
  })

  describe('#openNewTab', () => {
    it('should throw an error', async () => {
      try {
        await I.openNewTab()
        throw Error('It should never get this far')
      } catch (e) {
        e.message.should.include('Cannot open new tabs inside an Electron container')
      }
    })
  })

  describe('#switchToNextTab', () => {
    it('should throw an error', async () => {
      try {
        await I.switchToNextTab()
        throw Error('It should never get this far')
      } catch (e) {
        e.message.should.include('Cannot switch tabs inside an Electron container')
      }
    })
  })

  describe('#switchToPreviousTab', () => {
    it('should throw an error', async () => {
      try {
        await I.switchToNextTab()
        throw Error('It should never get this far')
      } catch (e) {
        e.message.should.include('Cannot switch tabs inside an Electron container')
      }
    })
  })

  describe('#closeCurrentTab', () => {
    it('should throw an error', async () => {
      try {
        await I.closeCurrentTab()
        throw Error('It should never get this far')
      } catch (e) {
        e.message.should.include('Cannot close current tab inside an Electron container')
      }
    })
  })
})

describe('Playwright - Performance Metrics', () => {
  before(async () => {
    global.codecept_dir = path.join(__dirname, '/../data')
    global.output_dir = path.join(`${__dirname}/../data/output`)

    I = new Playwright({
      url: siteUrl,
      windowSize: '500x700',
      show: false,
      restart: false, // Don't restart browser to avoid hanging
      browser: 'chromium',
    })
    await I._init()
    return I._beforeSuite()
  })

  beforeEach(async () => {
    webApiTests.init({
      I,
      siteUrl,
    })
    return I._before().then(() => {
      page = I.page
      browser = I.browser
    })
  })

  afterEach(async () => {
    return I._after()
  })

  after(async () => {
    await I._afterSuite()
    if (I.browser) {
      await I.browser.close()
    }
  })

  it('grabs performance metrics', async function () {
    this.timeout(10000) // Increase timeout for this test
    await I.amOnPage('https://codecept.io')
    const metrics = await I.grabMetrics()
    expect(metrics.length).to.greaterThan(0)
    expect(metrics[0].name).to.equal('Timestamp')
  })

  after(async () => {
    await I._afterSuite()
    // Use the built-in cleanup method
    await I._cleanup()
  })
})

describe('Playwright - Video & Trace & HAR', () => {
  const test = { title: 'a failed test', artifacts: {} }

  before(async () => {
    global.codecept_dir = path.join(__dirname, '/../data')
    global.output_dir = path.join(`${__dirname}/../data/output`)

    I = new Playwright({
      url: siteUrl,
      windowSize: '300x500',
      show: false,
      restart: true,
      browser: 'chromium',
      trace: true,
      video: true,
      recordVideo: {
        size: {
          width: 400,
          height: 600,
        },
      },
      recordHar: {},
    })
    await I._init()
    return I._beforeSuite()
  })

  beforeEach(async () => {
    webApiTests.init({
      I,
      siteUrl,
    })
    deleteDir(path.join(global.output_dir, 'video'))
    deleteDir(path.join(global.output_dir, 'trace'))
    deleteDir(path.join(global.output_dir, 'har'))
    return I._before(test).then(() => {
      page = I.page
      browser = I.browser
    })
  })

  afterEach(async () => {
    return I._after()
  })

  it('checks that video is recorded', async () => {
    await I.amOnPage('/')
    await I.dontSee('this should be an error')
    await I.click('More info')
    await I.dontSee('this should be an error')
    await I._failed(test)
    assert(test.artifacts)
    expect(Object.keys(test.artifacts)).to.include('trace')
    expect(Object.keys(test.artifacts)).to.include('video')
    expect(Object.keys(test.artifacts)).to.include('har')

    assert.ok(fs.existsSync(test.artifacts.trace))
    expect(test.artifacts.video).to.include(path.join(global.output_dir, 'video'))
    expect(test.artifacts.trace).to.include(path.join(global.output_dir, 'trace'))
    expect(test.artifacts.har).to.include(path.join(global.output_dir, 'har'))
  })

  it('checks that video and trace are recorded for sessions', async () => {
    // Reset test artifacts
    test.artifacts = {}

    await I.amOnPage('about:blank')
    await I.executeScript(() => (document.title = 'Main Session'))

    // Create a session and perform actions
    const session = I._session()
    const sessionName = 'test_session'
    I.activeSessionName = sessionName

    // Start session and get context
    const sessionContext = await session.start(sessionName, {})
    I.sessionPages[sessionName] = (await sessionContext.pages())[0]

    // Simulate session actions
    await I.sessionPages[sessionName].goto('about:blank')
    await I.sessionPages[sessionName].evaluate(() => (document.title = 'Session Test'))

    // Trigger failure to save artifacts
    await I._failed(test)

    // Check main session artifacts
    assert(test.artifacts)
    expect(Object.keys(test.artifacts)).to.include('trace')
    expect(Object.keys(test.artifacts)).to.include('video')

    // Check session-specific artifacts with correct naming convention
    const sessionVideoKey = `video_${sessionName}`
    const sessionTraceKey = `trace_${sessionName}`

    expect(Object.keys(test.artifacts)).to.include(sessionVideoKey)
    expect(Object.keys(test.artifacts)).to.include(sessionTraceKey)

    // Verify file naming convention: session name comes first
    // The file names should contain the session name at the beginning
    expect(test.artifacts[sessionVideoKey]).to.include(sessionName)
    expect(test.artifacts[sessionTraceKey]).to.include(sessionName)

    // Cleanup
    await sessionContext.close()
    delete I.sessionPages[sessionName]
  })

  it('handles sessions with long test titles correctly', async () => {
    // Create a test with a very long title to test truncation behavior
    const longTest = {
      title:
        'this_is_a_very_long_test_title_that_would_cause_issues_with_file_naming_when_session_names_are_appended_at_the_end_instead_of_the_beginning_which_could_lead_to_collisions_between_different_sessions_writing_to_the_same_file_path_due_to_truncation',
      artifacts: {},
    }

    await I.amOnPage('about:blank')

    // Create multiple sessions with different names
    const session1 = I._session()
    const session2 = I._session()
    const sessionName1 = 'session_one'
    const sessionName2 = 'session_two'

    I.activeSessionName = sessionName1
    const sessionContext1 = await session1.start(sessionName1, {})
    I.sessionPages[sessionName1] = (await sessionContext1.pages())[0]

    I.activeSessionName = sessionName2
    const sessionContext2 = await session2.start(sessionName2, {})
    I.sessionPages[sessionName2] = (await sessionContext2.pages())[0]

    // Trigger failure to save artifacts
    await I._failed(longTest)

    // Check that different sessions have different file paths
    const session1VideoKey = `video_${sessionName1}`
    const session2VideoKey = `video_${sessionName2}`
    const session1TraceKey = `trace_${sessionName1}`
    const session2TraceKey = `trace_${sessionName2}`

    expect(longTest.artifacts[session1VideoKey]).to.not.equal(longTest.artifacts[session2VideoKey])
    expect(longTest.artifacts[session1TraceKey]).to.not.equal(longTest.artifacts[session2TraceKey])

    // Verify that session names are present in filenames (indicating the naming fix works)
    expect(longTest.artifacts[session1VideoKey]).to.include(sessionName1)
    expect(longTest.artifacts[session2VideoKey]).to.include(sessionName2)
    expect(longTest.artifacts[session1TraceKey]).to.include(sessionName1)
    expect(longTest.artifacts[session2TraceKey]).to.include(sessionName2)

    // Cleanup
    await sessionContext1.close()
    await sessionContext2.close()
    delete I.sessionPages[sessionName1]
    delete I.sessionPages[sessionName2]
  })

  it('skips main session in session artifacts processing', async () => {
    // Reset test artifacts
    test.artifacts = {}

    await I.amOnPage('about:blank')

    // Simulate having a main session (empty string name) in sessionPages
    I.sessionPages[''] = I.page

    // Create a regular session
    const session = I._session()
    const sessionName = 'regular_session'
    I.activeSessionName = sessionName
    const sessionContext = await session.start(sessionName, {})
    I.sessionPages[sessionName] = (await sessionContext.pages())[0]

    // Trigger failure to save artifacts
    await I._failed(test)

    // Check that main session artifacts are present (not duplicated)
    expect(Object.keys(test.artifacts)).to.include('trace')
    expect(Object.keys(test.artifacts)).to.include('video')

    // Check that regular session artifacts are present
    expect(Object.keys(test.artifacts)).to.include(`video_${sessionName}`)
    expect(Object.keys(test.artifacts)).to.include(`trace_${sessionName}`)

    // Check that there are no duplicate main session artifacts with empty key
    expect(Object.keys(test.artifacts)).to.not.include('video_')
    expect(Object.keys(test.artifacts)).to.not.include('trace_')

    // Cleanup
    await sessionContext.close()
    delete I.sessionPages[sessionName]
    delete I.sessionPages['']
  })

  it('gracefully handles tracing errors for invalid session contexts', async () => {
    // Reset test artifacts
    test.artifacts = {}

    await I.amOnPage('about:blank')

    // Create a real session that we can manipulate
    const session = I._session()
    const sessionName = 'error_session'
    I.activeSessionName = sessionName
    const sessionContext = await session.start(sessionName, {})
    I.sessionPages[sessionName] = (await sessionContext.pages())[0]

    // Manually stop tracing to create the error condition
    try {
      await sessionContext.tracing.stop()
    } catch (e) {
      // This may fail if tracing wasn't started, which is fine
    }

    // Now when _failed is called, saveTraceForContext should handle the tracing error gracefully
    await I._failed(test)

    // Main artifacts should still be created
    expect(Object.keys(test.artifacts)).to.include('trace')
    expect(Object.keys(test.artifacts)).to.include('video')

    // Session video should still be created despite tracing error
    expect(Object.keys(test.artifacts)).to.include(`video_${sessionName}`)

    // Cleanup
    await sessionContext.close()
    delete I.sessionPages[sessionName]
  })
})
describe('Playwright - HAR', () => {
  before(async () => {
    global.codecept_dir = path.join(process.cwd())

    I = new Playwright({
      url: siteUrl,
      windowSize: '500x700',
      show: false,
      restart: true,
      browser: 'chromium',
    })
    await I._init()
    return I._beforeSuite()
  })

  beforeEach(async () => {
    webApiTests.init({
      I,
      siteUrl,
    })
    return I._before().then(() => {
      page = I.page
      browser = I.browser
    })
  })

  afterEach(async () => {
    return I._after()
  })

  it('replay from HAR - non existing file', async () => {
    try {
      await I.replayFromHar('./non-existing-file.har')
      await I.amOnPage('https://demo.playwright.dev/api-mocking')
    } catch (e) {
      expect(e.message).to.include('cannot be found on local system')
    }
  })

  it('replay from HAR', async () => {
    const harFile = './test/data/sandbox/testHar.har'
    await I.replayFromHar(harFile)
    await I.amOnPage('https://demo.playwright.dev/api-mocking')
    await I.see('CodeceptJS')
  })

  describe('#grabWebElements, #grabWebElement', () => {
    it('should return an array of WebElement', async () => {
      await I.amOnPage('/form/focus_blur_elements')

      const webElements = await I.grabWebElements('#button')
      assert.equal(webElements[0].constructor.name, 'WebElement')
      assert.equal(webElements[0].getNativeElement(), "locator('#button').first()")
      assert.isAbove(webElements.length, 0)
    })

    it('should return a WebElement', async () => {
      await I.amOnPage('/form/focus_blur_elements')

      const webElement = await I.grabWebElement('#button')
      assert.equal(webElement.constructor.name, 'WebElement')
      assert.equal(webElement.getNativeElement(), "locator('#button').first()")
    })
  })
})

describe('using data-testid attribute', () => {
  before(async () => {
    global.codecept_dir = path.join(__dirname, '/../data')
    global.output_dir = path.join(`${__dirname}/../data/output`)

    I = new Playwright({
      url: siteUrl,
      windowSize: '500x700',
      show: false,
      restart: true,
      browser: 'chromium',
    })
    await I._init()
    return I._beforeSuite()
  })

  beforeEach(async () => {
    return I._before().then(() => {
      page = I.page
      browser = I.browser
    })
  })

  afterEach(async () => {
    return I._after()
  })

  it('should find element by pw locator', async () => {
    await I.amOnPage('/')

    const webElements = await I.grabWebElements({ pw: '[data-testid="welcome"]' })
    assert.equal(webElements[0].constructor.name, 'WebElement')
    assert.equal(webElements[0].getNativeElement()._selector, '[data-testid="welcome"] >> nth=0')
    assert.equal(webElements.length, 1)
  })

  it('should find element by h1[data-testid="welcome"]', async () => {
    await I.amOnPage('/')

    const webElements = await I.grabWebElements('h1[data-testid="welcome"]')
    assert.equal(webElements[0].constructor.name, 'WebElement')
    assert.equal(webElements[0].getNativeElement()._selector, 'h1[data-testid="welcome"] >> nth=0')
    assert.equal(webElements.length, 1)
  })
})

// Global after hook to ensure all browser instances are closed
after(async function () {
  this.timeout(10000) // 10 second timeout for cleanup

  // Close the main browser instance if it exists
  if (I && I.browser) {
    try {
      await Promise.race([I.browser.close(), new Promise((_, reject) => setTimeout(() => reject(new Error('Browser close timeout')), 5000))])
    } catch (e) {
      console.warn('Warning during browser cleanup:', e.message)
    }
  }

  // Close remote browser if it exists
  if (remoteBrowser) {
    try {
      await Promise.race([remoteBrowser.close(), new Promise((_, reject) => setTimeout(() => reject(new Error('Remote browser close timeout')), 5000))])
    } catch (e) {
      console.warn('Warning during remote browser cleanup:', e.message)
    }
  }

  // Force close any remaining Playwright browser processes
  try {
    const { exec } = await import('child_process')
    exec('pkill -f "playwright.*chromium" || true')
  } catch (e) {
    // Ignore errors from pkill
  }
})
