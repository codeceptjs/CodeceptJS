const assert = require('assert');
const expect = require('chai').expect;
const path = require('path');
const fs = require('fs');

const playwright = require('playwright');

const TestHelper = require('../support/TestHelper');
const Playwright = require('../../lib/helper/Playwright');

const AssertionFailedError = require('../../lib/assert/error');
const webApiTests = require('./webapi');
const FileSystem = require('../../lib/helper/FileSystem');
const { deleteDir } = require('../../lib/utils');
const Secret = require('../../lib/secret');
global.codeceptjs = require('../../lib');

let I;
let page;
let FS;
const siteUrl = TestHelper.siteUrl();

describe('Playwright', function () {
  this.timeout(35000);
  this.retries(1);

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data');

    I = new Playwright({
      url: siteUrl,
      windowSize: '500x700',
      show: false,
      waitForTimeout: 5000,
      waitForAction: 500,
      timeout: 2000,
      restart: true,
      chrome: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
      defaultPopupAction: 'accept',
    });
    I._init();
    return I._beforeSuite();
  });

  beforeEach(async () => {
    webApiTests.init({
      I, siteUrl,
    });
    return I._before().then(() => {
      page = I.page;
      browser = I.browser;
    });
  });

  afterEach(async () => {
    return I._after();
  });

  describe('restart browser: #restartBrowser', () => {
    it('should open a new tab after restart of browser', async () => {
      await I.restartBrowser();
      await I.wait(1);
      const numPages = await I.grabNumberOfOpenTabs();
      assert.equal(numPages, 1);
    });
  });

  describe('open page : #amOnPage', () => {
    it('should open main page of configured site', async () => {
      await I.amOnPage('/');
      const url = await page.url();
      await url.should.eql(`${siteUrl}/`);
    });
    it('should open any page of configured site', async () => {
      await I.amOnPage('/info');
      const url = await page.url();
      return url.should.eql(`${siteUrl}/info`);
    });

    it('should open absolute url', async () => {
      await I.amOnPage(siteUrl);
      const url = await page.url();
      return url.should.eql(`${siteUrl}/`);
    });

    it('should open any page of configured site without leading slash', async () => {
      await I.amOnPage('info');
      const url = await page.url();
      return url.should.eql(`${siteUrl}/info`);
    });

    it('should open blank page', async () => {
      await I.amOnPage('about:blank');
      const url = await page.url();
      return url.should.eql('about:blank');
    });
  });

  describe('grabDataFromPerformanceTiming', () => {
    it('should return data from performance timing', async () => {
      await I.amOnPage('/');
      const res = await I.grabDataFromPerformanceTiming();
      expect(res).to.have.property('responseEnd');
      expect(res).to.have.property('domInteractive');
      expect(res).to.have.property('domContentLoadedEventEnd');
      expect(res).to.have.property('loadEventEnd');
    });
  });

  webApiTests.tests();

  describe('#click', () => {
    it('should not try to click on invisible elements', async () => {
      await I.amOnPage('/invisible_elements');
      await I.click('Hello World');
    });
  });
  describe('#grabCheckedElementStatus', () => {
    it('check grabCheckedElementStatus', async () => {
      await I.amOnPage('/invisible_elements');
      let result = await I.grabCheckedElementStatus({ id: 'html' });
      assert.equal(result, true);
      result = await I.grabCheckedElementStatus({ id: 'css' });
      assert.equal(result, false);
      result = await I.grabCheckedElementStatus({ id: 'js' });
      assert.equal(result, true);
      result = await I.grabCheckedElementStatus({ id: 'ts' });
      assert.equal(result, false);
      try {
        await I.grabCheckedElementStatus({ id: 'basic' });
      } catch (e) {
        assert.equal(e.message, 'Element is not a checkbox or radio input');
      }
    });
  });
  describe('#grabDisabledElementStatus', () => {
    it('check isElementDisabled', async () => {
      await I.amOnPage('/invisible_elements');
      let result = await I.grabDisabledElementStatus({ id: 'fortran' });
      assert.equal(result, true);
      result = await I.grabDisabledElementStatus({ id: 'basic' });
      assert.equal(result, false);
    });
  });

  describe('#waitForFunction', () => {
    it('should wait for function returns true', () => {
      return I.amOnPage('/form/wait_js')
        .then(() => I.waitForFunction(() => window.__waitJs, 3));
    });

    it('should pass arguments and wait for function returns true', () => {
      return I.amOnPage('/form/wait_js')
        .then(() => I.waitForFunction(varName => window[varName], ['__waitJs'], 3));
    });
  });

  describe('#waitForVisible #waitForInvisible - within block', () => {
    it('should wait for visible element', async () => {
      await I.amOnPage('/iframe');
      await I._withinBegin({
        frame: '#number-frame-1234',
      });

      await I.waitForVisible('h1');
    });

    it('should wait for invisible element', async () => {
      await I.amOnPage('/iframe');
      await I._withinBegin({
        frame: '#number-frame-1234',
      });

      await I.waitForInvisible('h9');
    });

    it('should wait for element to hide', async () => {
      await I.amOnPage('/iframe');
      await I._withinBegin({
        frame: '#number-frame-1234',
      });

      await I.waitToHide('h9');
    });
  });

  describe('#waitToHide', () => {
    it('should wait for hidden element', () => {
      return I.amOnPage('/form/wait_invisible')
        .then(() => I.see('Step One Button'))
        .then(() => I.waitToHide('#step_1', 2))
        .then(() => I.dontSeeElement('#step_1'))
        .then(() => I.dontSee('Step One Button'));
    });

    it('should wait for hidden element by XPath', () => {
      return I.amOnPage('/form/wait_invisible')
        .then(() => I.see('Step One Button'))
        .then(() => I.waitToHide('//div[@id="step_1"]', 2))
        .then(() => I.dontSeeElement('//div[@id="step_1"]'))
        .then(() => I.dontSee('Step One Button'));
    });
  });

  describe('#waitNumberOfVisibleElements', () => {
    it('should wait for a specified number of elements on the page', () => I.amOnPage('/info')
      .then(() => I.waitNumberOfVisibleElements('//div[@id = "grab-multiple"]//a', 3))
      .then(() => I.waitNumberOfVisibleElements('//div[@id = "grab-multiple"]//a', 2, 0.1))
      .then(() => {
        throw Error('It should never get this far');
      })
      .catch((e) => {
        e.message.should.include('The number of elements (//div[@id = "grab-multiple"]//a) is not 2 after 0.1 sec');
      }));

    it('should wait for a specified number of elements on the page using a css selector', () => I.amOnPage('/info')
      .then(() => I.waitNumberOfVisibleElements('#grab-multiple > a', 3))
      .then(() => I.waitNumberOfVisibleElements('#grab-multiple > a', 2, 0.1))
      .then(() => {
        throw Error('It should never get this far');
      })
      .catch((e) => {
        e.message.should.include('The number of elements (#grab-multiple > a) is not 2 after 0.1 sec');
      }));

    it('should wait for a specified number of elements which are not yet attached to the DOM', () => I.amOnPage('/form/wait_num_elements')
      .then(() => I.waitNumberOfVisibleElements('.title', 2, 3))
      .then(() => I.see('Hello'))
      .then(() => I.see('World')));
  });

  describe('#moveCursorTo', () => {
    it('should trigger hover event', () => I.amOnPage('/form/hover')
      .then(() => I.moveCursorTo('#hover'))
      .then(() => I.see('Hovered', '#show')));

    it('should not trigger hover event because of the offset is beyond the element', () => I.amOnPage('/form/hover')
      .then(() => I.moveCursorTo('#hover', 100, 100))
      .then(() => I.dontSee('Hovered', '#show')));
  });

  describe('#switchToNextTab, #switchToPreviousTab, #openNewTab, #closeCurrentTab, #closeOtherTabs, #grabNumberOfOpenTabs', () => {
    it('should only have 1 tab open when the browser starts and navigates to the first page', () => I.amOnPage('/')
      .then(() => I.wait(1))
      .then(() => I.grabNumberOfOpenTabs())
      .then(numPages => assert.equal(numPages, 1)));

    it('should switch to next tab', () => I.amOnPage('/info')
      .then(() => I.wait(1))
      .then(() => I.grabNumberOfOpenTabs())
      .then(numPages => assert.equal(numPages, 1))
      .then(() => I.click('New tab'))
      .then(() => I.switchToNextTab())
      .then(() => I.wait(2))
      .then(() => I.seeCurrentUrlEquals('/login'))
      .then(() => I.grabNumberOfOpenTabs())
      .then(numPages => assert.equal(numPages, 2)));

    it('should assert when there is no ability to switch to next tab', () => I.amOnPage('/')
      .then(() => I.click('More info'))
      .then(() => I.wait(1)) // Wait is required because the url is change by previous statement (maybe related to #914)
      .then(() => I.switchToNextTab(2))
      .then(() => I.wait(2))
      .then(() => assert.equal(true, false, 'Throw an error if it gets this far (which it should not)!'))
      .catch((e) => {
        assert.equal(e.message, 'There is no ability to switch to next tab with offset 2');
      }));

    it('should close current tab', () => I.amOnPage('/info')
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
      .then(numPages => assert.equal(numPages, 1)));

    it('should close other tabs', () => I.amOnPage('/')
      .then(() => I.openNewTab())
      .then(() => I.wait(1))
      .then(() => I.seeInCurrentUrl('about:blank'))
      .then(() => I.amOnPage('/info'))
      .then(() => I.openNewTab())
      .then(() => I.amOnPage('/login'))
      .then(() => I.closeOtherTabs())
      .then(() => I.wait(1))
      .then(() => I.seeInCurrentUrl('/login'))
      .then(() => I.grabNumberOfOpenTabs())
      .then(numPages => assert.equal(numPages, 1)));

    it('should open new tab', () => I.amOnPage('/info')
      .then(() => I.openNewTab())
      .then(() => I.wait(1))
      .then(() => I.seeInCurrentUrl('about:blank'))
      .then(() => I.grabNumberOfOpenTabs())
      .then(numPages => assert.equal(numPages, 2)));

    it('should switch to previous tab', () => I.amOnPage('/info')
      .then(() => I.openNewTab())
      .then(() => I.wait(1))
      .then(() => I.seeInCurrentUrl('about:blank'))
      .then(() => I.switchToPreviousTab())
      .then(() => I.wait(2))
      .then(() => I.seeInCurrentUrl('/info')));

    it('should assert when there is no ability to switch to previous tab', () => I.amOnPage('/info')
      .then(() => I.openNewTab())
      .then(() => I.wait(1))
      .then(() => I.waitInUrl('about:blank'))
      .then(() => I.switchToPreviousTab(2))
      .then(() => I.wait(2))
      .then(() => I.waitInUrl('/info'))
      .catch((e) => {
        assert.equal(e.message, 'There is no ability to switch to previous tab with offset 2');
      }));
  });

  describe('popup : #acceptPopup, #seeInPopup, #cancelPopup, #grabPopupText', () => {
    it('should accept popup window', () => I.amOnPage('/form/popup')
      .then(() => I.amAcceptingPopups())
      .then(() => I.click('Confirm'))
      .then(() => I.acceptPopup())
      .then(() => I.see('Yes', '#result')));

    it('should accept popup window (using default popup action type)', () => I.amOnPage('/form/popup')
      .then(() => I.click('Confirm'))
      .then(() => I.acceptPopup())
      .then(() => I.see('Yes', '#result')));

    it('should cancel popup', () => I.amOnPage('/form/popup')
      .then(() => I.amCancellingPopups())
      .then(() => I.click('Confirm'))
      .then(() => I.cancelPopup())
      .then(() => I.see('No', '#result')));

    it('should check text in popup', () => I.amOnPage('/form/popup')
      .then(() => I.amCancellingPopups())
      .then(() => I.click('Alert'))
      .then(() => I.seeInPopup('Really?'))
      .then(() => I.cancelPopup()));

    it('should grab text from popup', () => I.amOnPage('/form/popup')
      .then(() => I.amCancellingPopups())
      .then(() => I.click('Alert'))
      .then(() => I.grabPopupText())
      .then(text => assert.equal(text, 'Really?')));

    it('should return null if no popup is visible (do not throw an error)', () => I.amOnPage('/form/popup')
      .then(() => I.grabPopupText())
      .then(text => assert.equal(text, null)));
  });

  describe('#seeNumberOfElements', () => {
    it('should return 1 as count', () => I.amOnPage('/')
      .then(() => I.seeNumberOfElements('#area1', 1)));
  });

  describe('#switchTo', () => {
    it('should switch reference to iframe content', () => {
      I.amOnPage('/iframe');
      I.switchTo('[name="content"]');
      I.see('Information');
      I.see('Lots of valuable data here');
    });

    it('should return error if iframe selector is invalid', () => I.amOnPage('/iframe')
      .then(() => I.switchTo('#invalidIframeSelector'))
      .catch((e) => {
        e.should.be.instanceOf(Error);
        e.message.should.be.equal('Element "#invalidIframeSelector" was not found by text|CSS|XPath');
      }));

    it('should return error if iframe selector is not iframe', () => I.amOnPage('/iframe')
      .then(() => I.switchTo('h1'))
      .catch((e) => {
        e.should.be.instanceOf(Error);
        e.message.should.be.equal('Element "#invalidIframeSelector" was not found by text|CSS|XPath');
      }));

    it('should return to parent frame given a null locator', async () => {
      I.amOnPage('/iframe');
      I.switchTo('[name="content"]');
      I.see('Information');
      I.see('Lots of valuable data here');
      I.switchTo(null);
      I.see('Iframe test');
    });

    it('should switch to iframe using css', () => {
      I.amOnPage('/iframe');
      I.switchTo('iframe#number-frame-1234');
      I.see('Information');
      I.see('Lots of valuable data here');
    });

    it('should switch to iframe using css when there are more than one iframes', () => {
      I.amOnPage('/iframes');
      I.switchTo('iframe#number-frame-1234');
      I.see('Information');
    });
  });

  describe('#seeInSource, #grabSource', () => {
    it('should check for text to be in HTML source', () => I.amOnPage('/')
      .then(() => I.seeInSource('<title>TestEd Beta 2.0</title>'))
      .then(() => I.dontSeeInSource('<meta')));

    it('should grab the source', () => I.amOnPage('/')
      .then(() => I.grabSource())
      .then(source => assert.notEqual(source.indexOf('<title>TestEd Beta 2.0</title>'), -1, 'Source html should be retrieved')));
  });

  describe('#seeTitleEquals', () => {
    it('should check that title is equal to provided one', () => I.amOnPage('/')
      .then(() => I.seeTitleEquals('TestEd Beta 2.0'))
      .then(() => I.seeTitleEquals('TestEd Beta 2.'))
      .then(() => assert.equal(true, false, 'Throw an error because it should not get this far!'))
      .catch((e) => {
        e.should.be.instanceOf(Error);
        e.message.should.be.equal('expected web page title "TestEd Beta 2.0" to equal "TestEd Beta 2."');
      }));
  });

  describe('#seeTextEquals', () => {
    it('should check text is equal to provided one', () => I.amOnPage('/')
      .then(() => I.seeTextEquals('Welcome to test app!', 'h1'))
      .then(() => I.seeTextEquals('Welcome to test app', 'h1'))
      .then(() => assert.equal(true, false, 'Throw an error because it should not get this far!'))
      .catch((e) => {
        e.should.be.instanceOf(Error);
        e.message.should.be.equal('expected element h1 "Welcome to test app" to equal "Welcome to test app!"');
      }));
  });

  describe('#_locateClickable', () => {
    it('should locate a button to click', () => I.amOnPage('/form/checkbox')
      .then(() => I._locateClickable('Submit'))
      .then((res) => {
        res.length.should.be.equal(1);
      }));

    it('should not locate a non-existing checkbox using _locateClickable', () => I.amOnPage('/form/checkbox')
      .then(() => I._locateClickable('I disagree'))
      .then(res => res.length.should.be.equal(0)));
  });

  describe('#_locateCheckable', () => {
    it('should locate a checkbox', () => I.amOnPage('/form/checkbox')
      .then(() => I._locateCheckable('I Agree'))
      .then(res => res.should.be.not.undefined));
  });

  describe('#_locateFields', () => {
    it('should locate a field', () => I.amOnPage('/form/field')
      .then(() => I._locateFields('Name'))
      .then(res => res.length.should.be.equal(1)));

    it('should not locate a non-existing field', () => I.amOnPage('/form/field')
      .then(() => I._locateFields('Mother-in-law'))
      .then(res => res.length.should.be.equal(0)));
  });

  describe('check fields: #seeInField, #seeCheckboxIsChecked, ...', () => {
    it('should throw error if field is not empty', () => I.amOnPage('/form/empty')
      .then(() => I.seeInField('#empty_input', 'Ayayay'))
      .catch((e) => {
        e.should.be.instanceOf(AssertionFailedError);
        e.inspect().should.be.equal('expected fields by #empty_input to include "Ayayay"');
      }));

    it('should check values in checkboxes', async () => {
      await I.amOnPage('/form/field_values');
      await I.dontSeeInField('checkbox[]', 'not seen one');
      await I.seeInField('checkbox[]', 'see test one');
      await I.dontSeeInField('checkbox[]', 'not seen two');
      await I.seeInField('checkbox[]', 'see test two');
      await I.dontSeeInField('checkbox[]', 'not seen three');
      await I.seeInField('checkbox[]', 'see test three');
    });

    it('should check values are the secret type in checkboxes', async () => {
      await I.amOnPage('/form/field_values');
      await I.dontSeeInField('checkbox[]', Secret.secret('not seen one'));
      await I.seeInField('checkbox[]', Secret.secret('see test one'));
      await I.dontSeeInField('checkbox[]', Secret.secret('not seen two'));
      await I.seeInField('checkbox[]', Secret.secret('see test two'));
      await I.dontSeeInField('checkbox[]', Secret.secret('not seen three'));
      await I.seeInField('checkbox[]', Secret.secret('see test three'));
    });

    it('should check values with boolean', async () => {
      await I.amOnPage('/form/field_values');
      await I.seeInField('checkbox1', true);
      await I.dontSeeInField('checkbox1', false);
      await I.seeInField('checkbox2', false);
      await I.dontSeeInField('checkbox2', true);
      await I.seeInField('radio2', true);
      await I.dontSeeInField('radio2', false);
      await I.seeInField('radio3', false);
      await I.dontSeeInField('radio3', true);
    });

    it('should check values in radio', async () => {
      await I.amOnPage('/form/field_values');
      await I.seeInField('radio1', 'see test one');
      await I.dontSeeInField('radio1', 'not seen one');
      await I.dontSeeInField('radio1', 'not seen two');
      await I.dontSeeInField('radio1', 'not seen three');
    });

    it('should check values in select', async () => {
      await I.amOnPage('/form/field_values');
      await I.seeInField('select1', 'see test one');
      await I.dontSeeInField('select1', 'not seen one');
      await I.dontSeeInField('select1', 'not seen two');
      await I.dontSeeInField('select1', 'not seen three');
    });

    it('should check for empty select field', async () => {
      await I.amOnPage('/form/field_values');
      await I.seeInField('select3', '');
    });

    it('should check for select multiple field', async () => {
      await I.amOnPage('/form/field_values');
      await I.dontSeeInField('select2', 'not seen one');
      await I.seeInField('select2', 'see test one');
      await I.dontSeeInField('select2', 'not seen two');
      await I.seeInField('select2', 'see test two');
      await I.dontSeeInField('select2', 'not seen three');
      await I.seeInField('select2', 'see test three');
    });
  });

  describe('#clearField', () => {
    it('should clear input', async () => {
      await I.amOnPage('/form/field');
      await I.fillField('Name', 'value that is cleared using I.clearField()');
      await I.clearField('Name');
      await I.dontSeeInField('Name', 'value that is cleared using I.clearField()');
    });

    it('should clear div textarea', async () => {
      await I.amOnPage('/form/field');
      await I.clearField('#textarea');
      await I.dontSeeInField('#textarea', 'I look like textarea');
    });

    it('should clear textarea', async () => {
      await I.amOnPage('/form/textarea');
      await I.fillField('#description', 'value that is cleared using I.clearField()');
      await I.clearField('#description');
      await I.dontSeeInField('#description', 'value that is cleared using I.clearField()');
    });

    xit('should clear contenteditable', async () => {
      const isClearMethodPresent = await I.usePlaywrightTo('check if new Playwright .clear() method present', async ({ page }) => {
        return typeof page.locator().clear === 'function';
      });
      if (!isClearMethodPresent) {
        this.skip();
      }

      await I.amOnPage('/form/contenteditable');
      await I.clearField('#contenteditableDiv');
      await I.dontSee('This is editable. Click here to edit this text.', '#contenteditableDiv');
    });
  });

  describe('#pressKey, #pressKeyDown, #pressKeyUp', () => {
    it('should be able to send special keys to element', async () => {
      await I.amOnPage('/form/field');
      await I.appendField('Name', '-');

      await I.pressKey(['Right Shift', 'Home']);
      await I.pressKey('Delete');

      // Sequence only executes up to first non-modifier key ('Digit1')
      await I.pressKey(['SHIFT_RIGHT', 'Digit1', 'Digit4']);
      await I.pressKey('1');
      await I.pressKey('2');
      await I.pressKey('3');
      await I.pressKey('ArrowLeft');
      await I.pressKey('Left Arrow');
      await I.pressKey('arrow_left');
      await I.pressKeyDown('Shift');
      await I.pressKey('a');
      await I.pressKey('KeyB');
      await I.pressKeyUp('ShiftLeft');
      await I.pressKey('C');
      await I.seeInField('Name', '!ABC123');
    });

    it('should use modifier key based on operating system', async () => {
      await I.amOnPage('/form/field');
      await I.fillField('Name', 'value that is cleared using select all shortcut');

      await I.pressKey(['ControlOrCommand', 'a']);
      await I.pressKey('Backspace');
      await I.dontSeeInField('Name', 'value that is cleared using select all shortcut');
    });

    it('should show correct numpad or punctuation key when Shift modifier is active', async () => {
      await I.amOnPage('/form/field');
      await I.fillField('Name', '');

      await I.pressKey(';');
      await I.pressKey(['Shift', ';']);
      await I.pressKey(['Shift', 'Semicolon']);
      await I.pressKey('=');
      await I.pressKey(['Shift', '=']);
      await I.pressKey(['Shift', 'Equal']);
      await I.pressKey('*');
      await I.pressKey(['Shift', '*']);
      await I.pressKey(['Shift', 'Multiply']);
      await I.pressKey('+');
      await I.pressKey(['Shift', '+']);
      await I.pressKey(['Shift', 'Add']);
      await I.pressKey(',');
      await I.pressKey(['Shift', ',']);
      await I.pressKey(['Shift', 'Comma']);
      await I.pressKey(['Shift', 'NumpadComma']);
      await I.pressKey(['Shift', 'Separator']);
      await I.pressKey('-');
      await I.pressKey(['Shift', '-']);
      await I.pressKey(['Shift', 'Subtract']);
      await I.pressKey('.');
      await I.pressKey(['Shift', '.']);
      await I.pressKey('/');
      await I.pressKey(['Shift', '/']);
      await I.pressKey(['Shift', 'Divide']);
      await I.pressKey(['Shift', 'Slash']);

      await I.seeInField('Name', ';::=++***+++,<<<<-_-.>/?/?');
    });
  });

  describe('#waitForEnabled', () => {
    it('should wait for input text field to be enabled', () => I.amOnPage('/form/wait_enabled')
      .then(() => I.waitForEnabled('#text', 2))
      .then(() => I.fillField('#text', 'hello world'))
      .then(() => I.seeInField('#text', 'hello world')));

    it('should wait for input text field to be enabled by xpath', () => I.amOnPage('/form/wait_enabled')
      .then(() => I.waitForEnabled("//*[@name = 'test']", 2))
      .then(() => I.fillField('#text', 'hello world'))
      .then(() => I.seeInField('#text', 'hello world')));

    it('should wait for a button to be enabled', () => I.amOnPage('/form/wait_enabled')
      .then(() => I.waitForEnabled('#text', 2))
      .then(() => I.click('#button'))
      .then(() => I.see('button was clicked', '#message')));
  });

  describe('#waitForValue', () => {
    it('should wait for expected value for given locator', () => I.amOnPage('/info')
      .then(() => I.waitForValue('//input[@name= "rus"]', 'Верно'))
      .then(() => I.waitForValue('//input[@name= "rus"]', 'Верно3', 0.1))
      .then(() => {
        throw Error('It should never get this far');
      })
      .catch((e) => {
        e.message.should.include('element (//input[@name= "rus"]) is not in DOM or there is no element(//input[@name= "rus"]) with value "Верно3" after 0.1 sec');
      }));

    it('should wait for expected value for given css locator', () => I.amOnPage('/form/wait_value')
      .then(() => I.seeInField('#text', 'Hamburg'))
      .then(() => I.waitForValue('#text', 'Brisbane', 2.5))
      .then(() => I.seeInField('#text', 'Brisbane')));

    it('should wait for expected value for given xpath locator', () => I.amOnPage('/form/wait_value')
      .then(() => I.seeInField('#text', 'Hamburg'))
      .then(() => I.waitForValue('//input[@value = "Grüße aus Hamburg"]', 'Brisbane', 2.5))
      .then(() => I.seeInField('#text', 'Brisbane')));

    it('should only wait for one of the matching elements to contain the value given xpath locator', () => I.amOnPage('/form/wait_value')
      .then(() => I.waitForValue('//input[@type = "text"]', 'Brisbane', 4))
      .then(() => I.seeInField('#text', 'Brisbane'))
      .then(() => I.seeInField('#text2', 'London')));

    it('should only wait for one of the matching elements to contain the value given css locator', () => I.amOnPage('/form/wait_value')
      .then(() => I.waitForValue('.inputbox', 'Brisbane', 4))
      .then(() => I.seeInField('#text', 'Brisbane'))
      .then(() => I.seeInField('#text2', 'London')));
  });

  describe('#grabHTMLFrom', () => {
    it('should grab inner html from an element using xpath query', () => I.amOnPage('/')
      .then(() => I.grabHTMLFrom('//title'))
      .then(html => assert.equal(html, 'TestEd Beta 2.0')));

    it('should grab inner html from an element using id query', () => I.amOnPage('/')
      .then(() => I.grabHTMLFrom('#area1'))
      .then(html => assert.equal(html.trim(), '<a href="/form/file" qa-id="test" qa-link="test"> Test Link </a>')));

    it('should grab inner html from multiple elements', () => I.amOnPage('/')
      .then(() => I.grabHTMLFromAll('//a'))
      .then(html => assert.equal(html.length, 5)));

    it('should grab inner html from within an iframe', () => I.amOnPage('/iframe')
      .then(() => I.switchTo({ frame: 'iframe' }))
      .then(() => I.grabHTMLFrom('#new-tab'))
      .then(html => assert.equal(html.trim(), '<a href="/login" target="_blank">New tab</a>')));
  });

  describe('#grabBrowserLogs', () => {
    it('should grab browser logs', () => I.amOnPage('/')
      .then(() => I.executeScript(() => {
        console.log('Test log entry');
      }))
      .then(() => I.grabBrowserLogs())
      .then((logs) => {
        const matchingLogs = logs.filter(log => log.text().indexOf('Test log entry') > -1);
        assert.equal(matchingLogs.length, 1);
      }));

    it('should grab browser logs in new tab', () => I.amOnPage('/')
      .then(() => I.openNewTab())
      .then(() => I.executeScript(() => {
        console.log('Test log entry');
      }))
      .then(() => I.grabBrowserLogs())
      .then((logs) => {
        const matchingLogs = logs.filter(log => log.text().indexOf('Test log entry') > -1);
        assert.equal(matchingLogs.length, 1);
      }));

    it('should grab browser logs in two tabs', () => I.amOnPage('/')
      .then(() => I.executeScript(() => {
        console.log('Test log entry 1');
      }))
      .then(() => I.openNewTab())
      .then(() => I.executeScript(() => {
        console.log('Test log entry 2');
      }))
      .then(() => I.grabBrowserLogs())
      .then((logs) => {
        const matchingLogs = logs.filter(log => log.text().includes('Test log entry'));
        assert.equal(matchingLogs.length, 2);
      }));

    it('should grab browser logs in next tab', () => I.amOnPage('/info')
      .then(() => I.click('New tab'))
      .then(() => I.switchToNextTab())
      .then(() => I.executeScript(() => {
        console.log('Test log entry');
      }))
      .then(() => I.grabBrowserLogs())
      .then((logs) => {
        const matchingLogs = logs.filter(log => log.text().indexOf('Test log entry') > -1);
        assert.equal(matchingLogs.length, 1);
      }));
  });

  describe('#dragAndDrop', () => {
    it('Drag item from source to target (no iframe) @dragNdrop - customized steps', () => I.amOnPage('https://jqueryui.com/resources/demos/droppable/default.html')
      .then(() => I.seeElementInDOM('#draggable'))
      .then(() => I.dragAndDrop('#draggable', '#droppable'))
      .then(() => I.see('Dropped')));

    it('Drag item from source to target (no iframe) @dragNdrop - using Playwright API', () => I.amOnPage('https://jqueryui.com/resources/demos/droppable/default.html')
      .then(() => I.seeElementInDOM('#draggable'))
      .then(() => I.dragAndDrop('#draggable', '#droppable', { force: true }))
      .then(() => I.see('Dropped')));

    xit('Drag and drop from within an iframe', () => I.amOnPage('https://jqueryui.com/droppable')
      .then(() => I.resizeWindow(700, 700))
      .then(() => I.switchTo('//iframe[@class="demo-frame"]'))
      .then(() => I.seeElementInDOM('#draggable'))
      .then(() => I.dragAndDrop('#draggable', '#droppable'))
      .then(() => I.see('Dropped')));
  });

  describe('#switchTo frame', () => {
    it('should switch to frame using name', () => I.amOnPage('/iframe')
      .then(() => I.see('Iframe test', 'h1'))
      .then(() => I.dontSee('Information', 'h1'))
      .then(() => I.switchTo('iframe'))
      .then(() => I.see('Information', 'h1'))
      .then(() => I.dontSee('Iframe test', 'h1')));

    it('should switch to root frame', () => I.amOnPage('/iframe')
      .then(() => I.see('Iframe test', 'h1'))
      .then(() => I.dontSee('Information', 'h1'))
      .then(() => I.switchTo('iframe'))
      .then(() => I.see('Information', 'h1'))
      .then(() => I.dontSee('Iframe test', 'h1'))
      .then(() => I.switchTo())
      .then(() => I.see('Iframe test', 'h1')));

    it('should switch to frame using frame number', () => I.amOnPage('/iframe')
      .then(() => I.see('Iframe test', 'h1'))
      .then(() => I.dontSee('Information', 'h1'))
      .then(() => I.switchTo(0))
      .then(() => I.see('Information', 'h1'))
      .then(() => I.dontSee('Iframe test', 'h1')));
  });

  describe('#dragSlider', () => {
    it('should drag scrubber to given position', async () => {
      await I.amOnPage('/form/page_slider');
      await I.seeElementInDOM('#slidecontainer input');
      const before = await I.grabValueFrom('#slidecontainer input');
      await I.dragSlider('#slidecontainer input', 20);
      const after = await I.grabValueFrom('#slidecontainer input');
      assert.notEqual(before, after);
    });
  });

  describe('#uncheckOption', () => {
    it('should uncheck option that is currently checked', async () => {
      await I.amOnPage('/info');
      await I.uncheckOption('interesting');
      await I.dontSeeCheckboxIsChecked('interesting');
    });

    it('should NOT uncheck option that is NOT currently checked', async () => {
      await I.amOnPage('/info');
      await I.uncheckOption('interesting');
      // Unchecking again should not affect the current 'unchecked' status
      await I.uncheckOption('interesting');
      await I.dontSeeCheckboxIsChecked('interesting');
    });
  });

  describe('#usePlaywrightTo', () => {
    it('should return title', async () => {
      await I.amOnPage('/');
      const title = await I.usePlaywrightTo('test', async ({ page }) => {
        return page.title();
      });
      assert.equal('TestEd Beta 2.0', title);
    });

    it('should pass expected parameters', async () => {
      await I.amOnPage('/');
      const params = await I.usePlaywrightTo('test', async (params) => {
        return params;
      });
      expect(params.page).to.exist;
      expect(params.browserContext).to.exist;
      expect(params.browser).to.exist;
    });
  });

  describe('#mockRoute, #stopMockingRoute', () => {
    it('should mock a route', async () => {
      await I.amOnPage('/form/fetch_call');
      await I.mockRoute('https://reqres.in/api/comments/1', route => {
        route.fulfill({
          status: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          contentType: 'application/json',
          body: '{"name": "this was mocked" }',
        });
      });
      await I.click('GET COMMENTS');
      await I.see('this was mocked');
      await I.stopMockingRoute('https://reqres.in/api/comments/1');
      await I.click('GET COMMENTS');
      await I.see('data');
      await I.dontSee('this was mocked');
    });
  });

  describe('#startRecordingTraffic, #seeTraffic, #stopRecordingTraffic, #dontSeeTraffic, #grabRecordedNetworkTraffics', () => {
    it('should throw error when calling seeTraffic before recording traffics', async () => {
      try {
        I.amOnPage('https://codecept.io/');
        await I.seeTraffic({ name: 'traffics', url: 'https://codecept.io/img/companies/BC_LogoScreen_C.jpg' });
      } catch (e) {
        expect(e.message).to.equal('Failure in test automation. You use "I.seeTraffic", but "I.startRecordingTraffic" was never called before.');
      }
    });

    it('should throw error when calling seeTraffic but missing name', async () => {
      try {
        I.amOnPage('https://codecept.io/');
        await I.seeTraffic({ url: 'https://codecept.io/img/companies/BC_LogoScreen_C.jpg' });
      } catch (e) {
        expect(e.message).to.equal('Missing required key "name" in object given to "I.seeTraffic".');
      }
    });

    it('should throw error when calling seeTraffic but missing url', async () => {
      try {
        I.amOnPage('https://codecept.io/');
        await I.seeTraffic({ name: 'https://codecept.io/img/companies/BC_LogoScreen_C.jpg' });
      } catch (e) {
        expect(e.message).to.equal('Missing required key "url" in object given to "I.seeTraffic".');
      }
    });

    it('should flush the network traffics', async () => {
      I.startRecordingTraffic();
      I.amOnPage('https://codecept.io/');
      I.flushNetworkTraffics();
      const traffics = await I.grabRecordedNetworkTraffics();
      expect(traffics.length).to.equal(0);
    });

    it('should see recording traffics', async () => {
      I.startRecordingTraffic();
      I.amOnPage('https://codecept.io/');
      await I.seeTraffic({ name: 'traffics', url: 'https://codecept.io/img/companies/BC_LogoScreen_C.jpg' });
    });

    it('should not see recording traffics', async () => {
      I.startRecordingTraffic();
      I.amOnPage('https://codecept.io/');
      I.stopRecordingTraffic();
      await I.dontSeeTraffic({ name: 'traffics', url: 'https://codecept.io/img/companies/BC_LogoScreen_C.jpg' });
    });

    it('should not see recording traffics using regex url', async () => {
      I.startRecordingTraffic();
      I.amOnPage('https://codecept.io/');
      I.stopRecordingTraffic();
      await I.dontSeeTraffic({ name: 'traffics', url: /BC_LogoScreen_C.jpg/ });
    });

    it('should throw error when calling dontSeeTraffic but missing name', async () => {
      I.startRecordingTraffic();
      I.amOnPage('https://codecept.io/');
      I.stopRecordingTraffic();
      try {
        await I.dontSeeTraffic({ url: 'https://codecept.io/img/companies/BC_LogoScreen_C.jpg' });
      } catch (e) {
        expect(e.message).to.equal('Missing required key "name" in object given to "I.dontSeeTraffic".');
      }
    });

    it('should throw error when calling dontSeeTraffic but missing url', async () => {
      I.startRecordingTraffic();
      I.amOnPage('https://codecept.io/');
      I.stopRecordingTraffic();
      try {
        await I.dontSeeTraffic({ name: 'traffics' });
      } catch (e) {
        expect(e.message).to.equal('Missing required key "url" in object given to "I.dontSeeTraffic".');
      }
    });

    it('should mock traffics', async () => {
      await I.amOnPage('/form/fetch_call');
      await I.mockTraffic('https://reqres.in/api/comments/1', '{"name": "this was mocked" }');
      await I.startRecordingTraffic();
      await I.click('GET COMMENTS');
      await I.see('this was mocked');

      await I.mockTraffic('https://reqres.in/api/comments/1', '{"name": "this was another mocked" }');
      await I.click('GET COMMENTS');
      await I.see('this was another mocked');

      const traffics = await I.grabRecordedNetworkTraffics();
      expect(traffics[0].url).to.equal('https://reqres.in/api/comments/1');
      expect(traffics[0].response.status).to.equal(200);
      expect(traffics[0].response.body).to.contain({ name: 'this was mocked' });

      expect(traffics[1].url).to.equal('https://reqres.in/api/comments/1');
      expect(traffics[1].response.status).to.equal(200);
      expect(traffics[1].response.body).to.contain({ name: 'this was another mocked' });
    });

    it('should block traffics using a list of urls', async () => {
      I.blockTraffic(['https://reqres.in/api/*', 'https://reqres.in/api/comments/*']);
      I.amOnPage('/form/fetch_call');
      I.startRecordingTraffic();
      I.click('GET COMMENTS');
      I.see('Can not load data!');
    });

    it('should block traffics of a given url', async () => {
      I.blockTraffic('https://reqres.in/api/comments/*');
      I.amOnPage('/form/fetch_call');
      I.startRecordingTraffic();
      I.click('GET COMMENTS');
      I.see('Can not load data!');
    });

    it('should check traffics with more advanced params', async () => {
      await I.startRecordingTraffic();
      await I.amOnPage('https://openai.com/blog/chatgpt');
      const traffics = await I.grabRecordedNetworkTraffics();

      for (const traffic of traffics) {
        if (traffic.url.includes('&width=')) {
          // new URL object
          const currentUrl = new URL(traffic.url);

          // get access to URLSearchParams object
          const searchParams = currentUrl.searchParams;

          await I.seeTraffic({
            name: 'sentry event',
            url: currentUrl.origin + currentUrl.pathname,
            parameters: searchParams,
          });

          break;
        }
      }
    });

    it('should check traffics with more advanced post data', async () => {
      I.amOnPage('https://openai.com/blog/chatgpt');
      I.startRecordingTraffic();
      await I.seeTraffic({
        name: 'event',
        url: 'https://cloudflareinsights.com/cdn-cgi/rum',
        requestPostData: {
          st: 2,
        },
      });
    });

    it('should show error when advanced post data are not matching', async () => {
      I.amOnPage('https://openai.com/blog/chatgpt');
      I.startRecordingTraffic();
      try {
        await I.seeTraffic({
          name: 'event',
          url: 'https://cloudflareinsights.com/cdn-cgi/rum',
          requestPostData: {
            st: 3,
          },
        });
      } catch (e) {
        expect(e.message).to.contain('actual value: "2"');
      }
    });
  });

  describe('#startRecordingWebSocketMessages, #grabWebSocketMessages, #stopRecordingWebSocketMessages', () => {
    it('should throw error when calling grabWebSocketMessages before startRecordingWebSocketMessages', () => {
      try {
        I.amOnPage('https://websocketstest.com/');
        I.waitForText('Work for You!');
        I.grabWebSocketMessages();
      } catch (e) {
        expect(e.message).to.equal('Failure in test automation. You use "I.grabWebSocketMessages", but "I.startRecordingWebSocketMessages" was never called before.');
      }
    });

    it('should flush the WS messages', async () => {
      await I.startRecordingWebSocketMessages();
      I.amOnPage('https://websocketstest.com/');
      I.waitForText('Work for You!');
      I.flushNetworkTraffics();
      const wsMessages = I.grabWebSocketMessages();
      expect(wsMessages.length).to.equal(0);
    });

    it('should see recording WS messages', async () => {
      await I.startRecordingWebSocketMessages();
      await I.amOnPage('https://websocketstest.com/');
      I.waitForText('Work for You!');
      const wsMessages = I.grabWebSocketMessages();
      expect(wsMessages.length).to.greaterThan(0);
    });

    it('should not see recording WS messages', async () => {
      await I.startRecordingWebSocketMessages();
      await I.amOnPage('https://websocketstest.com/');
      I.waitForText('Work for You!');
      const wsMessages = I.grabWebSocketMessages();
      await I.stopRecordingWebSocketMessages();
      await I.amOnPage('https://websocketstest.com/');
      I.waitForText('Work for You!');
      const afterWsMessages = I.grabWebSocketMessages();
      expect(wsMessages.length).to.equal(afterWsMessages.length);
    });
  });

  describe('#makeApiRequest', () => {
    it('should make 3rd party API request', async () => {
      const response = await I.makeApiRequest('get', 'https://reqres.in/api/users?page=2');
      expect(response.status()).to.equal(200);
      expect(await response.json()).to.include.keys(['page']);
    });

    it('should make local API request', async () => {
      const response = await I.makeApiRequest('get', '/form/fetch_call');
      expect(response.status()).to.equal(200);
    });

    it('should convert to axios response with onResponse hook', async () => {
      let response;
      I.config.onResponse = (resp) => response = resp;
      await I.makeApiRequest('get', 'https://reqres.in/api/users?page=2');
      expect(response).to.be.ok;
      expect(response.status).to.equal(200);
      expect(response.data).to.include.keys(['page', 'total']);
    });
  });

  describe('#grabElementBoundingRect', () => {
    it('should get the element bounding rectangle', async () => {
      await I.amOnPage('/image');
      const size = await I.grabElementBoundingRect('#logo');
      expect(size.x).is.greaterThan(39); // 40 or more
      expect(size.y).is.greaterThan(39);
      expect(size.width).is.greaterThan(0);
      expect(size.height).is.greaterThan(0);
      expect(size.width).to.eql(100);
      expect(size.height).to.eql(100);
    });

    it('should get the element width', async () => {
      await I.amOnPage('/image');
      const width = await I.grabElementBoundingRect('#logo', 'width');
      expect(width).is.greaterThan(0);
      expect(width).to.eql(100);
    });

    it('should get the element height', async () => {
      await I.amOnPage('/image');
      const height = await I.grabElementBoundingRect('#logo', 'height');
      expect(height).is.greaterThan(0);
      expect(height).to.eql(100);
    });
  });

  describe('#handleDownloads - with passed folder', () => {
    before(() => {
      // create download folder;
      global.output_dir = path.join(`${__dirname}/../data/output`);

      FS = new FileSystem();
      FS._before();
      FS.amInPath('output/downloadHere');
    });

    it('should download file', async () => {
      await I.amOnPage('/form/download');
      await I.handleDownloads('downloadHere/avatar.jpg');
      await I.click('Download file');
      await FS.waitForFile('avatar.jpg', 5);
    });
  });

  describe('#handleDownloads - with default folder', () => {
    before(() => {
      // create download folder;
      global.output_dir = path.join(`${__dirname}/../data/output`);

      FS = new FileSystem();
      FS._before();
      FS.amInPath('output');
    });

    it('should download file', async () => {
      await I.amOnPage('/form/download');
      await I.handleDownloads('avatar.jpg');
      await I.click('Download file');
      await FS.waitForFile('avatar.jpg', 5);
    });
  });

  describe('#waitForURL', () => {
    it('should wait for URL', () => {
      I.amOnPage('/');
      I.click('More info');
      I.waitForURL('/info');
      I.see('Information');
    });

    it('should wait for regex URL', () => {
      I.amOnPage('/');
      I.click('More info');
      I.waitForURL(/info/);
      I.see('Information');
    });
  });
});

let remoteBrowser;
async function createRemoteBrowser() {
  if (remoteBrowser) {
    await remoteBrowser.close();
  }
  remoteBrowser = await playwright.chromium.launchServer({
    webSocket: true,
    // args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  });
  remoteBrowser.on('disconnected', () => {
    remoteBrowser = null;
  });
  return remoteBrowser;
}

describe('Playwright (remote browser) websocket', function () {
  this.timeout(35000);
  this.retries(1);

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
  };

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data');
    I = new Playwright(helperConfig);
    I._init();
  });

  beforeEach(async () => {
    // Mimick remote session by creating another browser instance
    const remoteBrowser = await createRemoteBrowser();
    // I.isRunning = false;
    // Set websocket endpoint to other browser instance
  });

  afterEach(async () => {
    await I._after();
    return remoteBrowser && remoteBrowser.close();
  });

  describe('#_startBrowser', () => {
    it('should throw an exception when endpoint is unreachable', async () => {
      I._setConfig({ ...helperConfig, chromium: { browserWSEndpoint: 'ws://unreachable/' } });
      try {
        await I._startBrowser();
        throw Error('It should never get this far');
      } catch (e) {
        e.message.should.include('Cannot connect to websocket');
      }
    });

    it('should connect to legacy API endpoint', async () => {
      const wsEndpoint = await remoteBrowser.wsEndpoint();
      I._setConfig({ ...helperConfig, chromium: { browserWSEndpoint: { wsEndpoint } } });
      await I._before();
      await I.amOnPage('/');
      await I.see('Welcome to test app');
    });

    it('should connect to remote browsers', async () => {
      helperConfig.chromium.browserWSEndpoint = await remoteBrowser.wsEndpoint();
      I._setConfig(helperConfig);

      await I._before();
      await I.amOnPage('/');
      await I.see('Welcome to test app');
    });

    it('should manage pages in remote browser', async () => {
      helperConfig.chromium.browserWSEndpoint = await remoteBrowser.wsEndpoint();
      I._setConfig(helperConfig);

      await I._before();
      assert.ok(I.isRemoteBrowser);
      const context = await I.browserContext;
      // Session was cleared
      let currentPages = await context.pages();
      assert.equal(currentPages.length, 1);

      let numPages = await I.grabNumberOfOpenTabs();
      assert.equal(numPages, 1);

      await I.openNewTab();

      numPages = await I.grabNumberOfOpenTabs();
      assert.equal(numPages, 2);

      await I._stopBrowser();

      currentPages = await context.pages();
      assert.equal(currentPages.length, 0);
    });
  });
});

describe('Playwright - BasicAuth', function () {
  this.timeout(35000);

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data');

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
    });
    I._init();
    return I._beforeSuite();
  });

  beforeEach(() => {
    webApiTests.init({
      I, siteUrl,
    });
    return I._before().then(() => {
      page = I.page;
    });
  });

  afterEach(() => {
    return I._after();
  });

  describe('open page with provided basic auth', () => {
    it('should be authenticated ', async () => {
      await I.amOnPage('/basic_auth');
      await I.see('You entered admin as your password.');
    });
  });
});

describe('Playwright - Emulation', () => {
  before(() => {
    const { devices } = require('playwright');
    global.codecept_dir = path.join(__dirname, '/../data');

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
    });
    I._init();
    return I._beforeSuite();
  });

  beforeEach(() => {
    return I._before().then(() => {
      page = I.page;
      browser = I.browser;
    });
  });

  afterEach(() => {
    return I._after();
  });

  it('should open page as iPhone ', async () => {
    await I.amOnPage('/');
    const width = await I.executeScript('window.innerWidth');
    assert.equal(width, 980);
  });
});

describe('Playwright - PERSISTENT', () => {
  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data');

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
    });
    I._init();
    return I._beforeSuite();
  });

  beforeEach(() => {
    return I._before().then(() => {
      page = I.page;
      browser = I.browser;
    });
  });

  afterEach(() => {
    return I._after();
  });

  it('should launch a persistent context', async () => {
    assert.equal(I._getType(), 'BrowserContext');
  });
});

describe('Playwright - Electron', () => {
  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data');

    I = new Playwright({
      waitForTimeout: 5000,
      waitForAction: 500,
      restart: true,
      browser: 'electron',
      electron: {
        executablePath: require('electron'),
        args: [path.join(codecept_dir, '/electron/')],
      },
    });
    I._init();
    return I._beforeSuite();
  });

  describe('#amOnPage', () => {
    it('should throw an error', async () => {
      try {
        await I.amOnPage('/');
        throw Error('It should never get this far');
      } catch (e) {
        e.message.should.include('Cannot open pages inside an Electron container');
      }
    });
  });

  describe('#openNewTab', () => {
    it('should throw an error', async () => {
      try {
        await I.openNewTab();
        throw Error('It should never get this far');
      } catch (e) {
        e.message.should.include('Cannot open new tabs inside an Electron container');
      }
    });
  });

  describe('#switchToNextTab', () => {
    it('should throw an error', async () => {
      try {
        await I.switchToNextTab();
        throw Error('It should never get this far');
      } catch (e) {
        e.message.should.include('Cannot switch tabs inside an Electron container');
      }
    });
  });

  describe('#switchToPreviousTab', () => {
    it('should throw an error', async () => {
      try {
        await I.switchToNextTab();
        throw Error('It should never get this far');
      } catch (e) {
        e.message.should.include('Cannot switch tabs inside an Electron container');
      }
    });
  });

  describe('#closeCurrentTab', () => {
    it('should throw an error', async () => {
      try {
        await I.closeCurrentTab();
        throw Error('It should never get this far');
      } catch (e) {
        e.message.should.include('Cannot close current tab inside an Electron container');
      }
    });
  });
});

describe('Playwright - Performance Metrics', () => {
  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data');
    global.output_dir = path.join(`${__dirname}/../data/output`);

    I = new Playwright({
      url: siteUrl,
      windowSize: '500x700',
      show: false,
      restart: true,
      browser: 'chromium',
      trace: true,
      video: true,
    });
    I._init();
    return I._beforeSuite();
  });

  beforeEach(async () => {
    webApiTests.init({
      I, siteUrl,
    });
    deleteDir(path.join(global.output_dir, 'video'));
    return I._before().then(() => {
      page = I.page;
      browser = I.browser;
    });
  });

  afterEach(async () => {
    return I._after();
  });

  it('grabs performance metrics', async () => {
    await I.amOnPage('https://codecept.io');
    const metrics = await I.grabMetrics();
    console.log(metrics);
    expect(metrics.length).to.greaterThan(0);
    expect(metrics[0].name).to.equal('Timestamp');
  });
});

describe('Playwright - Video & Trace', () => {
  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data');
    global.output_dir = path.join(`${__dirname}/../data/output`);

    I = new Playwright({
      url: siteUrl,
      windowSize: '500x700',
      show: false,
      restart: true,
      browser: 'chromium',
      trace: true,
      video: true,
    });
    I._init();
    return I._beforeSuite();
  });

  beforeEach(async () => {
    webApiTests.init({
      I, siteUrl,
    });
    deleteDir(path.join(global.output_dir, 'video'));
    deleteDir(path.join(global.output_dir, 'trace'));
    return I._before().then(() => {
      page = I.page;
      browser = I.browser;
    });
  });

  afterEach(async () => {
    return I._after();
  });

  it('checks that video is recorded', async () => {
    const test = { title: 'a failed test', artifacts: {} };
    await I.amOnPage('/');
    await I.dontSee('this should be an error');
    await I.click('More info');
    await I.dontSee('this should be an error');
    await I._failed(test);
    assert(test.artifacts);
    // expect(Object.keys(test.artifacts).length).should.eq(2);
    expect(Object.keys(test.artifacts)).to.include('trace');
    expect(Object.keys(test.artifacts)).to.include('video');

    assert.ok(fs.existsSync(test.artifacts.trace));
    expect(test.artifacts.video).to.include(path.join(global.output_dir, 'video'));
    expect(test.artifacts.trace).to.include(path.join(global.output_dir, 'trace'));
  });
});
