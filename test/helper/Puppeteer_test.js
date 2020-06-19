const assert = require('assert');
const expect = require('chai').expect;
const path = require('path');

const puppeteer = require('puppeteer');

const TestHelper = require('../support/TestHelper');
const Puppeteer = require('../../lib/helper/Puppeteer');

const AssertionFailedError = require('../../lib/assert/error');
const webApiTests = require('./webapi');
const FileSystem = require('../../lib/helper/FileSystem');

let I;
let browser;
let page;
let FS;
const siteUrl = TestHelper.siteUrl();

describe('Puppeteer - BasicAuth', function () {
  this.timeout(10000);

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data');

    I = new Puppeteer({
      url: siteUrl,
      windowSize: '500x700',
      show: false,
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
      browser = I.browser;
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
    it('should be authenticated on second run', async () => {
      await I.amOnPage('/basic_auth');
      await I.see('You entered admin as your password.');
    });
  });
});

describe('Puppeteer', function () {
  this.timeout(35000);
  this.retries(1);

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data');

    I = new Puppeteer({
      url: siteUrl,
      windowSize: '500x700',
      show: false,
      waitForTimeout: 5000,
      waitForAction: 500,
      chrome: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
      defaultPopupAction: 'accept',
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
      browser = I.browser;
    });
  });

  afterEach(() => {
    return I._after();
  });

  describe('Session', () => {
    it('should not fail for localStorage.clear() on about:blank', async () => {
      I.options.restart = false;
      return I.page.goto('about:blank')
        .then(() => I._after())
        .then(() => { I.options.restart = true; })
        .catch((e) => {
          I.options.restart = true;
          throw new Error(e);
        });
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

    it('should be unauthenticated ', async () => {
      await I.amOnPage('/basic_auth');
      await I.dontSee('You entered admin as your password.');
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
      .then(() => I.click('New tab'))
      .then(() => I.switchToNextTab())
      .then(() => I.wait(2))
      .then(() => I.seeInCurrentUrl('/login'))
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
    it('should switch reference to iframe content', () => I.amOnPage('/iframe')
      .then(() => I.switchTo('[name="content"]'))
      .then(() => I.see('Information'))
      .then(() => I.see('Lots of valuable data here')));

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

    it('should return to parent frame given a null locator', () => I.amOnPage('/iframe')
      .then(() => I.switchTo('[name="content"]'))
      .then(() => I.see('Information'))
      .then(() => I.see('Lots of valuable data here'))
      .then(() => I.switchTo(null))
      .then(() => I.see('Iframe test')));
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
      .then(res => res.should.be.defined));
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
      await I.pressKey(['Shift', 'Decimal']);
      await I.pressKey(['Shift', 'Period']);
      await I.pressKey('/');
      await I.pressKey(['Shift', '/']);
      await I.pressKey(['Shift', 'Divide']);
      await I.pressKey(['Shift', 'Slash']);

      await I.seeInField('Name', ';::=++***+++,<<<<-_-.>.>/?/?');
    });

    it('should show correct number key when Shift modifier is active', async () => {
      await I.amOnPage('/form/field');
      await I.fillField('Name', '');

      await I.pressKey('0');
      await I.pressKeyDown('Shift');
      await I.pressKey('0');
      await I.pressKey('Digit0');
      await I.pressKey('Numpad0');
      await I.pressKeyUp('Shift');

      await I.pressKey('1');
      await I.pressKeyDown('Shift');
      await I.pressKey('1');
      await I.pressKey('Digit1');
      await I.pressKey('Numpad1');
      await I.pressKeyUp('Shift');

      await I.pressKey('2');
      await I.pressKeyDown('Shift');
      await I.pressKey('2');
      await I.pressKey('Digit2');
      await I.pressKey('Numpad2');
      await I.pressKeyUp('Shift');

      await I.pressKey('3');
      await I.pressKeyDown('Shift');
      await I.pressKey('3');
      await I.pressKey('Digit3');
      await I.pressKey('Numpad3');
      await I.pressKeyUp('Shift');

      await I.pressKey('4');
      await I.pressKeyDown('Shift');
      await I.pressKey('4');
      await I.pressKey('Digit4');
      await I.pressKey('Numpad4');
      await I.pressKeyUp('Shift');

      await I.pressKey('5');
      await I.pressKeyDown('Shift');
      await I.pressKey('5');
      await I.pressKey('Digit5');
      await I.pressKey('Numpad5');
      await I.pressKeyUp('Shift');

      await I.pressKey('6');
      await I.pressKeyDown('Shift');
      await I.pressKey('6');
      await I.pressKey('Digit6');
      await I.pressKey('Numpad6');
      await I.pressKeyUp('Shift');

      await I.pressKey('7');
      await I.pressKeyDown('Shift');
      await I.pressKey('7');
      await I.pressKey('Digit7');
      await I.pressKey('Numpad7');
      await I.pressKeyUp('Shift');

      await I.pressKey('8');
      await I.pressKeyDown('Shift');
      await I.pressKey('8');
      await I.pressKey('Digit8');
      await I.pressKey('Numpad8');
      await I.pressKeyUp('Shift');

      await I.pressKey('9');
      await I.pressKeyDown('Shift');
      await I.pressKey('9');
      await I.pressKey('Digit9');
      await I.pressKey('Numpad9');
      await I.pressKeyUp('Shift');

      await I.seeInField('Name', '0))01!!12@@23##34$$45%%56^^67&&78**89((9');
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

  describe('#waitForText', () => {
    it('should wait for text after load body', async () => {
      await I.amOnPage('/redirect_long');
      await I.waitForText('Hi there and greetings!', 5);
    });
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
      .then(() => I.grabHTMLFrom('//a'))
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

    it('should grab browser logs across pages', () => I.amOnPage('/')
      .then(() => I.executeScript(() => {
        console.log('Test log entry 1');
      }))
      .then(() => I.openNewTab())
      .then(() => I.wait(1))
      .then(() => I.amOnPage('/info'))
      .then(() => I.executeScript(() => {
        console.log('Test log entry 2');
      }))
      .then(() => I.grabBrowserLogs())
      .then((logs) => {
        const matchingLogs = logs.filter(log => log.text().indexOf('Test log entry') > -1);
        assert.equal(matchingLogs.length, 2);
      }));
  });

  describe('#dragAndDrop', () => {
    it('Drag item from source to target (no iframe) @dragNdrop', () => I.amOnPage('http://jqueryui.com/resources/demos/droppable/default.html')
      .then(() => I.seeElementInDOM('#draggable'))
      .then(() => I.dragAndDrop('#draggable', '#droppable'))
      .then(() => I.see('Dropped')));

    it('Drag and drop from within an iframe', () => I.amOnPage('http://jqueryui.com/droppable')
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

  describe('#grabElementBoundingRect', () => {
    it('should get the element bounding rectangle', async () => {
      await I.amOnPage('https://www.google.com');
      const size = await I.grabElementBoundingRect('#hplogo');
      expect(size.x).is.greaterThan(0);
      expect(size.y).is.greaterThan(0);
      expect(size.width).is.greaterThan(0);
      expect(size.height).is.greaterThan(0);
    });

    it('should get the element width', async () => {
      await I.amOnPage('https://www.google.com');
      const width = await I.grabElementBoundingRect('#hplogo', 'width');
      expect(width).is.greaterThan(0);
    });

    it('should get the element height', async () => {
      await I.amOnPage('https://www.google.com');
      const height = await I.grabElementBoundingRect('#hplogo', 'height');
      expect(height).is.greaterThan(0);
    });
  });

  describe('#handleDownloads', () => {
    before(() => {
      // create download folder;
      global.output_dir = path.join(`${__dirname}/../data/output`);

      FS = new FileSystem();
      FS._before();
      FS.amInPath('output');
    });

    it('should dowload file', async () => {
      await I.amOnPage('/form/download');
      await I.handleDownloads();
      await I.click('Download file');
      await FS.waitForFile('downloads/avatar.jpg', 5);
    });
  });

  describe('#waitForClickable', () => {
    it('should wait for clickable', async () => {
      await I.amOnPage('/form/wait_for_clickable');
      await I.waitForClickable({ css: 'input#text' });
    });

    it('should wait for clickable by XPath', async () => {
      await I.amOnPage('/form/wait_for_clickable');
      await I.waitForClickable({ xpath: './/input[@id="text"]' });
    });

    it('should fail for disabled element', async () => {
      await I.amOnPage('/form/wait_for_clickable');
      await I.waitForClickable({ css: '#button' }, 0.1).then((isClickable) => {
        if (isClickable) throw new Error('Element is clickable, but must be unclickable');
      }).catch((e) => {
        e.message.should.include('element {css: #button} still not clickable after 0.1 sec');
      });
    });

    it('should fail for disabled element by XPath', async () => {
      await I.amOnPage('/form/wait_for_clickable');
      await I.waitForClickable({ xpath: './/button[@id="button"]' }, 0.1).then((isClickable) => {
        if (isClickable) throw new Error('Element is clickable, but must be unclickable');
      }).catch((e) => {
        e.message.should.include('element {xpath: .//button[@id="button"]} still not clickable after 0.1 sec');
      });
    });

    it('should fail for element not in viewport by top', async () => {
      await I.amOnPage('/form/wait_for_clickable');
      await I.waitForClickable({ css: '#notInViewportTop' }, 0.1).then((isClickable) => {
        if (isClickable) throw new Error('Element is clickable, but must be unclickable');
      }).catch((e) => {
        e.message.should.include('element {css: #notInViewportTop} still not clickable after 0.1 sec');
      });
    });

    it('should fail for element not in viewport by bottom', async () => {
      await I.amOnPage('/form/wait_for_clickable');
      await I.waitForClickable({ css: '#notInViewportBottom' }, 0.1).then((isClickable) => {
        if (isClickable) throw new Error('Element is clickable, but must be unclickable');
      }).catch((e) => {
        e.message.should.include('element {css: #notInViewportBottom} still not clickable after 0.1 sec');
      });
    });

    it('should fail for element not in viewport by left', async () => {
      await I.amOnPage('/form/wait_for_clickable');
      await I.waitForClickable({ css: '#notInViewportLeft' }, 0.1).then((isClickable) => {
        if (isClickable) throw new Error('Element is clickable, but must be unclickable');
      }).catch((e) => {
        e.message.should.include('element {css: #notInViewportLeft} still not clickable after 0.1 sec');
      });
    });

    it('should fail for element not in viewport by right', async () => {
      await I.amOnPage('/form/wait_for_clickable');
      await I.waitForClickable({ css: '#notInViewportRight' }, 0.1).then((isClickable) => {
        if (isClickable) throw new Error('Element is clickable, but must be unclickable');
      }).catch((e) => {
        e.message.should.include('element {css: #notInViewportRight} still not clickable after 0.1 sec');
      });
    });

    it('should fail for overlapping element', async () => {
      await I.amOnPage('/form/wait_for_clickable');
      await I.waitForClickable({ css: '#div2_button' }, 0.1);
      await I.waitForClickable({ css: '#div1_button' }, 0.1).then((isClickable) => {
        if (isClickable) throw new Error('Element is clickable, but must be unclickable');
      }).catch((e) => {
        e.message.should.include('element {css: #div1_button} still not clickable after 0.1 sec');
      });
    });

    it('should pass if element change class', async () => {
      await I.amOnPage('/form/wait_for_clickable');
      await I.click('button_save');
      await I.waitForClickable('//button[@name="button_publish"]');
    });

    it('should fail if element change class and not clickable', async () => {
      await I.amOnPage('/form/wait_for_clickable');
      await I.click('button_save');
      I.waitForClickable('//button[@name="button_publish"]', 0.1).then((isClickable) => {
        if (isClickable) throw new Error('Element is clickable, but must be unclickable');
      }).catch((e) => {
        e.message.should.include('element //button[@name="button_publish"] still not clickable after 0.1 sec');
      });
    });
  });
});

let remoteBrowser;
async function createRemoteBrowser() {
  if (remoteBrowser) {
    await remoteBrowser.close();
  }
  remoteBrowser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  });
  remoteBrowser.on('disconnected', () => {
    remoteBrowser = null;
  });
  return remoteBrowser;
}

const helperConfig = {
  chrome: {
    browserWSEndpoint: 'ws://localhost:9222/devtools/browser/<id>',
    // Following options are ignored with remote browser
    headless: false,
    devtools: true,
  },
  // Important in order to handle remote browser state before starting/stopping browser
  manualStart: true,
  url: siteUrl,
  waitForTimeout: 5000,
  waitForAction: 500,
  windowSize: '500x700',
};

describe('Puppeteer (remote browser)', function () {
  this.timeout(35000);
  this.retries(1);

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data');
    I = new Puppeteer(helperConfig);
    I._init();
    return I._beforeSuite();
  });

  beforeEach(async () => {
    // Mimick remote session by creating another browser instance
    await createRemoteBrowser();
    // Set websocket endpoint to other browser instance
    helperConfig.chrome.browserWSEndpoint = await remoteBrowser.wsEndpoint();
    I._setConfig(helperConfig);

    return I._before();
  });

  afterEach(() => {
    return I._after()
      .then(() => {
        remoteBrowser && remoteBrowser.close();
      });
  });

  describe('#_startBrowser', () => {
    it('should throw an exception when endpoint is unreachable', async () => {
      helperConfig.chrome.browserWSEndpoint = 'ws://unreachable/';
      I._setConfig(helperConfig);
      try {
        await I._startBrowser();
        throw Error('It should never get this far');
      } catch (e) {
        e.message.should.include('Cannot connect to websocket endpoint.\n\nPlease make sure remote browser is running and accessible.');
      }
    });

    it('should clear any prior existing pages on remote browser', async () => {
      const remotePages = await remoteBrowser.pages();
      assert.equal(remotePages.length, 1);
      for (let p = 1; p < 5; p++) {
        await remoteBrowser.newPage();
      }
      const existingPages = await remoteBrowser.pages();
      assert.equal(existingPages.length, 5);

      await I._startBrowser();
      // Session was cleared
      let currentPages = await remoteBrowser.pages();
      assert.equal(currentPages.length, 1);

      let numPages = await I.grabNumberOfOpenTabs();
      assert.equal(numPages, 1);

      await I.openNewTab();

      numPages = await I.grabNumberOfOpenTabs();
      assert.equal(numPages, 2);

      await I._stopBrowser();

      currentPages = await remoteBrowser.pages();
      assert.equal(currentPages.length, 2);
    });
  });
});
