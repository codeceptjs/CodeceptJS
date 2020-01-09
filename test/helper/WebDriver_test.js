const assert = require('assert');
const expect = require('chai').expect;
const path = require('path');
const fs = require('fs');

const TestHelper = require('../support/TestHelper');
const WebDriver = require('../../lib/helper/WebDriver');
const AssertionFailedError = require('../../lib/assert/error');
const webApiTests = require('./webapi');

const siteUrl = TestHelper.siteUrl();
let wd;

describe('WebDriver', function () {
  this.retries(1);
  this.timeout(35000);

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data');
    try {
      fs.unlinkSync(dataFile);
    } catch (err) {
      // continue regardless of error
    }

    wd = new WebDriver({
      url: siteUrl,
      browser: 'chrome',
      windowSize: '500x700',
      smartWait: 0, // just to try
      host: TestHelper.seleniumHost(),
      port: TestHelper.seleniumPort(),
      waitForTimeout: 5000,
      capabilities: {
        chromeOptions: {
          args: ['--headless', '--disable-gpu', '--window-size=1280,1024'],
        },
      },
    });
  });

  beforeEach(() => {
    webApiTests.init({ I: wd, siteUrl });
    return wd._before();
  });

  afterEach(() => wd._after());

  // load common test suite
  webApiTests.tests();

  describe('open page : #amOnPage', () => {
    it('should open main page of configured site', async () => {
      await wd.amOnPage('/');
      const url = await wd.grabCurrentUrl();
      url.should.eql(`${siteUrl}/`);
    });

    it('should open any page of configured site', async () => {
      await wd.amOnPage('/info');
      const url = await wd.grabCurrentUrl();
      url.should.eql(`${siteUrl}/info`);
    });

    it('should open absolute url', async () => {
      await wd.amOnPage(siteUrl);
      const url = await wd.grabCurrentUrl();
      url.should.eql(`${siteUrl}/`);
    });
  });

  describe('see text : #see', () => {
    it('should fail when text is not on site', async () => {
      await wd.amOnPage('/');

      try {
        await wd.see('Something incredible!');
      } catch (e) {
        e.should.be.instanceOf(AssertionFailedError);
        e.inspect().should.include('web page');
      }

      try {
        await wd.dontSee('Welcome');
      } catch (e) {
        e.should.be.instanceOf(AssertionFailedError);
        e.inspect().should.include('web page');
      }
    });
  });

  describe('check fields: #seeInField, #seeCheckboxIsChecked, ...', () => {
    it('should throw error if field is not empty', async () => {
      await wd.amOnPage('/form/empty');

      try {
        await wd.seeInField('#empty_input', 'Ayayay');
      } catch (e) {
        e.should.be.instanceOf(AssertionFailedError);
        e.inspect().should.be.equal('expected fields by #empty_input to include "Ayayay"');
      }
    });

    it('should check values in checkboxes', async () => {
      await wd.amOnPage('/form/field_values');
      await wd.dontSeeInField('checkbox[]', 'not seen one');
      await wd.seeInField('checkbox[]', 'see test one');
      await wd.dontSeeInField('checkbox[]', 'not seen two');
      await wd.seeInField('checkbox[]', 'see test two');
      await wd.dontSeeInField('checkbox[]', 'not seen three');
      await wd.seeInField('checkbox[]', 'see test three');
    });

    it('should check values with boolean', async () => {
      await wd.amOnPage('/form/field_values');
      await wd.seeInField('checkbox1', true);
      await wd.dontSeeInField('checkbox1', false);
      await wd.seeInField('checkbox2', false);
      await wd.dontSeeInField('checkbox2', true);
      await wd.seeInField('radio2', true);
      await wd.dontSeeInField('radio2', false);
      await wd.seeInField('radio3', false);
      await wd.dontSeeInField('radio3', true);
    });

    it('should check values in radio', async () => {
      await wd.amOnPage('/form/field_values');
      await wd.seeInField('radio1', 'see test one');
      await wd.dontSeeInField('radio1', 'not seen one');
      await wd.dontSeeInField('radio1', 'not seen two');
      await wd.dontSeeInField('radio1', 'not seen three');
    });

    it('should check values in select', async () => {
      await wd.amOnPage('/form/field_values');
      await wd.seeInField('select1', 'see test one');
      await wd.dontSeeInField('select1', 'not seen one');
      await wd.dontSeeInField('select1', 'not seen two');
      await wd.dontSeeInField('select1', 'not seen three');
    });

    it('should check for empty select field', async () => {
      await wd.amOnPage('/form/field_values');
      await wd.seeInField('select3', '');
    });

    it('should check for select multiple field', async () => {
      await wd.amOnPage('/form/field_values');
      await wd.dontSeeInField('select2', 'not seen one');
      await wd.seeInField('select2', 'see test one');
      await wd.dontSeeInField('select2', 'not seen two');
      await wd.seeInField('select2', 'see test two');
      await wd.dontSeeInField('select2', 'not seen three');
      await wd.seeInField('select2', 'see test three');
    });

    it('should return error when element has no value attribute', async () => {
      await wd.amOnPage('https://codecept.io/quickstart');

      try {
        await wd.seeInField('#search_input_react', 'WebDriver1');
      } catch (e) {
        e.should.be.instanceOf(Error);
      }
    });
  });

  describe('#pressKey, #pressKeyDown, #pressKeyUp', () => {
    it('should be able to send special keys to element', async () => {
      await wd.amOnPage('/form/field');
      await wd.appendField('Name', '-');

      await wd.pressKey(['Right Shift', 'Home']);
      await wd.pressKey('Delete');

      // Sequence only executes up to first non-modifier key ('Digit1')
      await wd.pressKey(['SHIFT_RIGHT', 'Digit1', 'Digit4']);
      await wd.pressKey('1');
      await wd.pressKey('2');
      await wd.pressKey('3');
      await wd.pressKey('ArrowLeft');
      await wd.pressKey('Left Arrow');
      await wd.pressKey('arrow_left');
      await wd.pressKeyDown('Shift');
      await wd.pressKey('a');
      await wd.pressKey('KeyB');
      await wd.pressKeyUp('ShiftLeft');
      await wd.pressKey('C');
      await wd.seeInField('Name', '!ABC123');
    });

    it('should use modifier key based on operating system', async () => {
      await wd.amOnPage('/form/field');
      await wd.fillField('Name', 'value that is cleared using select all shortcut');

      await wd.pressKey(['CommandOrControl', 'A']);
      await wd.pressKey('Backspace');
      await wd.dontSeeInField('Name', 'value that is cleared using select all shortcut');
    });

    it('should show correct numpad or punctuation key when Shift modifier is active', async () => {
      await wd.amOnPage('/form/field');
      await wd.fillField('Name', '');

      await wd.pressKey(';');
      await wd.pressKey(['Shift', ';']);
      await wd.pressKey(['Shift', 'Semicolon']);
      await wd.pressKey('=');
      await wd.pressKey(['Shift', '=']);
      await wd.pressKey(['Shift', 'Equal']);
      await wd.pressKey('*');
      await wd.pressKey(['Shift', '*']);
      await wd.pressKey(['Shift', 'Multiply']);
      await wd.pressKey('+');
      await wd.pressKey(['Shift', '+']);
      await wd.pressKey(['Shift', 'Add']);
      await wd.pressKey(',');
      await wd.pressKey(['Shift', ',']);
      await wd.pressKey(['Shift', 'Comma']);
      await wd.pressKey(['Shift', 'NumpadComma']);
      await wd.pressKey(['Shift', 'Separator']);
      await wd.pressKey('-');
      await wd.pressKey(['Shift', '-']);
      await wd.pressKey(['Shift', 'Subtract']);
      await wd.pressKey('.');
      await wd.pressKey(['Shift', '.']);
      await wd.pressKey(['Shift', 'Decimal']);
      await wd.pressKey(['Shift', 'Period']);
      await wd.pressKey('/');
      await wd.pressKey(['Shift', '/']);
      await wd.pressKey(['Shift', 'Divide']);
      await wd.pressKey(['Shift', 'Slash']);

      await wd.seeInField('Name', ';::=++***+++,<<<<-_-.>.>/?/?');
    });

    it('should show correct number key when Shift modifier is active', async () => {
      await wd.amOnPage('/form/field');
      await wd.fillField('Name', '');

      await wd.pressKey('0');
      await wd.pressKeyDown('Shift');
      await wd.pressKey('0');
      await wd.pressKey('Digit0');
      await wd.pressKeyUp('Shift');

      await wd.pressKey('1');
      await wd.pressKeyDown('Shift');
      await wd.pressKey('1');
      await wd.pressKey('Digit1');
      await wd.pressKeyUp('Shift');

      await wd.pressKey('2');
      await wd.pressKeyDown('Shift');
      await wd.pressKey('2');
      await wd.pressKey('Digit2');
      await wd.pressKeyUp('Shift');

      await wd.pressKey('3');
      await wd.pressKeyDown('Shift');
      await wd.pressKey('3');
      await wd.pressKey('Digit3');
      await wd.pressKeyUp('Shift');

      await wd.pressKey('4');
      await wd.pressKeyDown('Shift');
      await wd.pressKey('4');
      await wd.pressKey('Digit4');
      await wd.pressKeyUp('Shift');

      await wd.pressKey('5');
      await wd.pressKeyDown('Shift');
      await wd.pressKey('5');
      await wd.pressKey('Digit5');
      await wd.pressKeyUp('Shift');

      await wd.pressKey('6');
      await wd.pressKeyDown('Shift');
      await wd.pressKey('6');
      await wd.pressKey('Digit6');
      await wd.pressKeyUp('Shift');

      await wd.pressKey('7');
      await wd.pressKeyDown('Shift');
      await wd.pressKey('7');
      await wd.pressKey('Digit7');
      await wd.pressKeyUp('Shift');

      await wd.pressKey('8');
      await wd.pressKeyDown('Shift');
      await wd.pressKey('8');
      await wd.pressKey('Digit8');
      await wd.pressKeyUp('Shift');

      await wd.pressKey('9');
      await wd.pressKeyDown('Shift');
      await wd.pressKey('9');
      await wd.pressKey('Digit9');
      await wd.pressKeyUp('Shift');

      await wd.seeInField('Name', '0))1!!2@@3##4$$5%%6^^7&&8**9((');
    });
  });

  describe('#seeInSource, #grabSource', () => {
    it('should check for text to be in HTML source', async () => {
      await wd.amOnPage('/');
      await wd.seeInSource('<title>TestEd Beta 2.0</title>');
      await wd.dontSeeInSource('<meta');
    });

    it('should grab the source', async () => {
      await wd.amOnPage('/');
      const source = await wd.grabSource();
      assert.notEqual(source.indexOf('<title>TestEd Beta 2.0</title>'), -1, 'Source html should be retrieved');
    });

    it('should grab the innerHTML for an element', async () => {
      await wd.amOnPage('/');
      const source = await wd.grabHTMLFrom('#area1');
      assert.deepEqual(
        source,
        `
    <a href="/form/file" qa-id="test" qa-link="test"> Test Link </a>
`,
      );
    });
  });

  describe('#seeTitleEquals', () => {
    it('should check that title is equal to provided one', async () => {
      await wd.amOnPage('/');

      try {
        await wd.seeTitleEquals('TestEd Beta 2.0');
        await wd.seeTitleEquals('TestEd Beta 2.');
      } catch (e) {
        assert.equal(e.message, 'expected web page title to be TestEd Beta 2., but found TestEd Beta 2.0');
      }
    });
  });

  describe('#seeTextEquals', () => {
    it('should check text is equal to provided one', async () => {
      await wd.amOnPage('/');
      await wd.seeTextEquals('Welcome to test app!', 'h1');

      try {
        await wd.seeTextEquals('Welcome to test app', 'h1');
        assert.equal(true, false, 'Throw an error because it should not get this far!');
      } catch (e) {
        e.should.be.instanceOf(Error);
        e.message.should.be.equal('expected element h1 "Welcome to test app" to equal "Welcome to test app!"');
        // e.should.be.instanceOf(AssertionFailedError);
      }
    });

    it('should check text is not equal to empty string of element text', async () => {
      await wd.amOnPage('https://codecept.discourse.group/');

      try {
        await wd.seeTextEquals('', '[id="site-logo"]');
        await wd.seeTextEquals('This is not empty', '[id="site-logo"]');
      } catch (e) {
        e.should.be.instanceOf(Error);
        e.message.should.be.equal('expected element [id="site-logo"] "This is not empty" to equal ""');
      }
    });
  });

  describe('#waitForFunction', () => {
    it('should wait for function returns true', async () => {
      await wd.amOnPage('/form/wait_js');
      await wd.waitForFunction(() => window.__waitJs, 3);
    });

    it('should pass arguments and wait for function returns true', async () => {
      await wd.amOnPage('/form/wait_js');
      await wd.waitForFunction(varName => window[varName], ['__waitJs'], 3);
    });
  });

  describe('#waitForEnabled', () => {
    it('should wait for input text field to be enabled', async () => {
      await wd.amOnPage('/form/wait_enabled');
      await wd.waitForEnabled('#text', 2);
      await wd.fillField('#text', 'hello world');
      await wd.seeInField('#text', 'hello world');
    });

    it('should wait for input text field to be enabled by xpath', async () => {
      await wd.amOnPage('/form/wait_enabled');
      await wd.waitForEnabled("//*[@name = 'test']", 2);
      await wd.fillField('#text', 'hello world');
      await wd.seeInField('#text', 'hello world');
    });

    it('should wait for a button to be enabled', async () => {
      await wd.amOnPage('/form/wait_enabled');
      await wd.waitForEnabled('#text', 2);
      await wd.click('#button');
      await wd.see('button was clicked');
    });
  });

  describe('#waitForValue', () => {
    it('should wait for expected value for given locator', async () => {
      await wd.amOnPage('/info');
      await wd.waitForValue('//input[@name= "rus"]', 'Верно');

      try {
        await wd.waitForValue('//input[@name= "rus"]', 'Верно3', 0.1);
        throw Error('It should never get this far');
      } catch (e) {
        e.message.should.include('element (//input[@name= "rus"]) is not in DOM or there is no element(//input[@name= "rus"]) with value "Верно3" after 0.1 sec');
      }
    });

    it('should wait for expected value for given css locator', async () => {
      await wd.amOnPage('/form/wait_value');
      await wd.seeInField('#text', 'Hamburg');
      await wd.waitForValue('#text', 'Brisbane', 2.5);
      await wd.seeInField('#text', 'Brisbane');
    });

    it('should wait for expected value for given xpath locator', async () => {
      await wd.amOnPage('/form/wait_value');
      await wd.seeInField('#text', 'Hamburg');
      await wd.waitForValue('//input[@value = "Grüße aus Hamburg"]', 'Brisbane', 2.5);
      await wd.seeInField('#text', 'Brisbane');
    });

    it('should only wait for one of the matching elements to contain the value given xpath locator', async () => {
      await wd.amOnPage('/form/wait_value');
      await wd.waitForValue('//input[@type = "text"]', 'Brisbane', 4);
      await wd.seeInField('#text', 'Brisbane');
      await wd.seeInField('#text2', 'London');
    });

    it('should only wait for one of the matching elements to contain the value given css locator', async () => {
      await wd.amOnPage('/form/wait_value');
      await wd.waitForValue('.inputbox', 'Brisbane', 4);
      await wd.seeInField('#text', 'Brisbane');
      await wd.seeInField('#text2', 'London');
    });
  });

  describe('#waitNumberOfVisibleElements', () => {
    it('should wait for a specified number of elements on the page', () => {
      return wd.amOnPage('/info')
        .then(() => wd.waitNumberOfVisibleElements('//div[@id = "grab-multiple"]//a', 3))
        .then(() => wd.waitNumberOfVisibleElements('//div[@id = "grab-multiple"]//a', 2, 0.1))
        .then(() => {
          throw Error('It should never get this far');
        })
        .catch((e) => {
          e.message.should.include('The number of elements (//div[@id = "grab-multiple"]//a) is not 2 after 0.1 sec');
        });
    });

    it('should be no [object Object] in the error message', () => {
      return wd.amOnPage('/info')
        .then(() => wd.waitNumberOfVisibleElements({ css: '//div[@id = "grab-multiple"]//a' }, 3))
        .then(() => {
          throw Error('It should never get this far');
        })
        .catch((e) => {
          e.message.should.not.include('[object Object]');
        });
    });

    it('should wait for a specified number of elements on the page using a css selector', () => {
      return wd.amOnPage('/info')
        .then(() => wd.waitNumberOfVisibleElements('#grab-multiple > a', 3))
        .then(() => wd.waitNumberOfVisibleElements('#grab-multiple > a', 2, 0.1))
        .then(() => {
          throw Error('It should never get this far');
        })
        .catch((e) => {
          e.message.should.include('The number of elements (#grab-multiple > a) is not 2 after 0.1 sec');
        });
    });

    it('should wait for a specified number of elements which are not yet attached to the DOM', () => {
      return wd.amOnPage('/form/wait_num_elements')
        .then(() => wd.waitNumberOfVisibleElements('.title', 2, 3))
        .then(() => wd.see('Hello'))
        .then(() => wd.see('World'));
    });
  });

  describe('#waitForVisible', () => {
    it('should be no [object Object] in the error message', () => {
      return wd.amOnPage('/info')
        .then(() => wd.waitForVisible('//div[@id = "grab-multiple"]//a', 3))
        .then(() => {
          throw Error('It should never get this far');
        })
        .catch((e) => {
          e.message.should.not.include('[object Object]');
        });
    });
  });

  describe('#waitForInvisible', () => {
    it('should be no [object Object] in the error message', () => {
      return wd.amOnPage('/info')
        .then(() => wd.waitForInvisible('//div[@id = "grab-multiple"]//a', 3))
        .then(() => {
          throw Error('It should never get this far');
        })
        .catch((e) => {
          e.message.should.not.include('[object Object]');
        });
    });

    it('should wait for a specified element to be invisible', () => {
      return wd.amOnPage('/form/wait_invisible')
        .then(() => wd.waitForInvisible('#step1', 3))
        .then(() => wd.dontSeeElement('#step1'));
    });
  });

  describe('#moveCursorTo', () => {
    it('should trigger hover event', async () => {
      await wd.amOnPage('/form/hover');
      await wd.moveCursorTo('#hover');
      await wd.see('Hovered', '#show');
    });

    it('should not trigger hover event because of the offset is beyond the element', async () => {
      await wd.amOnPage('/form/hover');
      await wd.moveCursorTo('#hover', 100, 100);
      await wd.dontSee('Hovered', '#show');
    });
  });

  describe('#switchToNextTab, #switchToPreviousTab, #openNewTab, #closeCurrentTab, #closeOtherTabs, #grabNumberOfOpenTabs', () => {
    it('should only have 1 tab open when the browser starts and navigates to the first page', async () => {
      await wd.amOnPage('/');
      const numPages = await wd.grabNumberOfOpenTabs();
      assert.equal(numPages, 1);
    });

    it('should switch to next tab', async () => {
      wd.amOnPage('/info');
      const numPages = await wd.grabNumberOfOpenTabs();
      assert.equal(numPages, 1);

      await wd.click('New tab');
      await wd.switchToNextTab();
      await wd.waitInUrl('/login');
      const numPagesAfter = await wd.grabNumberOfOpenTabs();
      assert.equal(numPagesAfter, 2);
    });

    it('should assert when there is no ability to switch to next tab', () => {
      return wd.amOnPage('/')
        .then(() => wd.click('More info'))
        .then(() => wd.wait(1)) // Wait is required because the url is change by previous statement (maybe related to #914)
        .then(() => wd.switchToNextTab(2))
        .then(() => assert.equal(true, false, 'Throw an error if it gets this far (which it should not)!'))
        .catch((e) => {
          assert.equal(e.message, 'There is no ability to switch to next tab with offset 2');
        });
    });

    it('should close current tab', () => {
      return wd.amOnPage('/info')
        .then(() => wd.click('New tab'))
        .then(() => wd.switchToNextTab())
        .then(() => wd.seeInCurrentUrl('/login'))
        .then(() => wd.grabNumberOfOpenTabs())
        .then(numPages => assert.equal(numPages, 2))
        .then(() => wd.closeCurrentTab())
        .then(() => wd.seeInCurrentUrl('/info'))
        .then(() => wd.grabNumberOfOpenTabs());
    });

    it('should close other tabs', () => {
      return wd.amOnPage('/')
        .then(() => wd.openNewTab())
        .then(() => wd.seeInCurrentUrl('about:blank'))
        .then(() => wd.amOnPage('/info'))
        .then(() => wd.click('New tab'))
        .then(() => wd.switchToNextTab())
        .then(() => wd.seeInCurrentUrl('/login'))
        .then(() => wd.closeOtherTabs())
        .then(() => wd.seeInCurrentUrl('/login'))
        .then(() => wd.grabNumberOfOpenTabs());
    });

    it('should open new tab', () => {
      return wd.amOnPage('/info')
        .then(() => wd.openNewTab())
        .then(() => wd.waitInUrl('about:blank'))
        .then(() => wd.grabNumberOfOpenTabs())
        .then(numPages => assert.equal(numPages, 2));
    });

    it('should switch to previous tab', () => {
      return wd.amOnPage('/info')
        .then(() => wd.openNewTab())
        .then(() => wd.waitInUrl('about:blank'))
        .then(() => wd.switchToPreviousTab())
        .then(() => wd.waitInUrl('/info'));
    });

    it('should assert when there is no ability to switch to previous tab', () => {
      return wd.amOnPage('/info')
        .then(() => wd.openNewTab())
        .then(() => wd.waitInUrl('about:blank'))
        .then(() => wd.switchToPreviousTab(2))
        .then(() => wd.waitInUrl('/info'))
        .catch((e) => {
          assert.equal(e.message, 'There is no ability to switch to previous tab with offset 2');
        });
    });
  });

  describe('popup : #acceptPopup, #seeInPopup, #cancelPopup', () => {
    it('should accept popup window', () => {
      return wd.amOnPage('/form/popup')
        .then(() => wd.click('Confirm'))
        .then(() => wd.acceptPopup())
        .then(() => wd.see('Yes', '#result'));
    });

    it('should cancel popup', () => {
      return wd.amOnPage('/form/popup')
        .then(() => wd.click('Confirm'))
        .then(() => wd.cancelPopup())
        .then(() => wd.see('No', '#result'));
    });

    it('should check text in popup', () => {
      return wd.amOnPage('/form/popup')
        .then(() => wd.click('Alert'))
        .then(() => wd.seeInPopup('Really?'))
        .then(() => wd.cancelPopup());
    });

    it('should grab text from popup', () => {
      return wd.amOnPage('/form/popup')
        .then(() => wd.click('Alert'))
        .then(() => wd.grabPopupText())
        .then(text => assert.equal(text, 'Really?'));
    });

    it('should return null if no popup is visible (do not throw an error)', () => {
      return wd.amOnPage('/form/popup')
        .then(() => wd.grabPopupText())
        .then(text => assert.equal(text, null));
    });
  });

  describe('#waitForText', () => {
    it('should return error if not present', () => {
      return wd.amOnPage('/dynamic')
        .then(() => wd.waitForText('Nothing here', 1, '#text'))
        .catch((e) => {
          e.message.should.be.equal('element (#text) is not in DOM or there is no element(#text) with text "Nothing here" after 1 sec');
        });
    });

    it('should return error if waiting is too small', () => {
      return wd.amOnPage('/dynamic')
        .then(() => wd.waitForText('Dynamic text', 0.1))
        .catch((e) => {
          e.message.should.be.equal('element (body) is not in DOM or there is no element(body) with text "Dynamic text" after 0.1 sec');
        });
    });
  });

  describe('#seeNumberOfElements', () => {
    it('should return 1 as count', async () => {
      await wd.amOnPage('/');
      await wd.seeNumberOfElements('#area1', 1);
    });
  });

  describe('#switchTo', () => {
    it('should switch reference to iframe content', async () => {
      await wd.amOnPage('/iframe');
      await wd.switchTo('[name="content"]');
      await wd.see('Information\nLots of valuable data here');
    });

    it('should return error if iframe selector is invalid', async () => {
      await wd.amOnPage('/iframe');

      try {
        await wd.switchTo('#invalidIframeSelector');
      } catch (e) {
        e.should.be.instanceOf(Error);
        e.message.should.be.equal('Element "#invalidIframeSelector" was not found by text|CSS|XPath');
      }
    });

    it('should return error if iframe selector is not iframe', async () => {
      await wd.amOnPage('/iframe');

      try {
        await wd.switchTo('h1');
      } catch (e) {
        e.should.be.instanceOf(Error);
        e.message.should.contain('no such frame');
      }
    });

    it('should return to parent frame given a null locator', async () => {
      await wd.amOnPage('/iframe');
      await wd.switchTo('[name="content"]');
      await wd.see('Information\nLots of valuable data here');
      await wd.switchTo(null);
      await wd.see('Iframe test');
    });
  });

  describe('click context', () => {
    it('should click on inner text', async () => {
      await wd.amOnPage('/form/checkbox');
      await wd.click('Submit', '//input[@type = "submit"]');
      await wd.waitInUrl('/form/complex');
    });

    it('should click on input in inner element', async () => {
      await wd.amOnPage('/form/checkbox');
      await wd.click('Submit', '//form');
      await wd.waitInUrl('/form/complex');
    });

    it('should click by accessibility_id', async () => {
      await wd.amOnPage('/info');
      await wd.click('~index via aria-label');
      await wd.see('Welcome to test app!');
    });
  });

  describe('window size #resizeWindow', () => {
    it('should set initial window size', async () => {
      await wd.amOnPage('/form/resize');
      await wd.click('Window Size');
      await wd.see('Height 700', '#height');
      await wd.see('Width 500', '#width');
    });

    it('should set window size on new session', () => {
      return wd.amOnPage('/info')
        .then(() => wd._session())
        .then(session => session.start()
          .then(browser => ({
            browser,
            session,
          })))
        .then(({ session, browser }) => session.loadVars(browser))
        .then(() => wd.amOnPage('/form/resize'))
        .then(() => wd.click('Window Size'))
        .then(() => wd.see('Height 700', '#height'))
        .then(() => wd.see('Width 500', '#width'));
    });

    it('should resize window to specific dimensions', async () => {
      await wd.amOnPage('/form/resize');
      await wd.resizeWindow(950, 600);
      await wd.click('Window Size');
      await wd.see('Height 600', '#height');
      await wd.see('Width 950', '#width');
    });

    xit('should resize window to maximum screen dimensions', async () => {
      await wd.amOnPage('/form/resize');
      await wd.resizeWindow(500, 400);
      await wd.click('Window Size');
      await wd.see('Height 400', '#height');
      await wd.see('Width 500', '#width');
      await wd.resizeWindow('maximize');
      await wd.click('Window Size');
      await wd.dontSee('Height 400', '#height');
      await wd.dontSee('Width 500', '#width');
    });
  });

  describe('SmartWait', () => {
    before(() => wd.options.smartWait = 3000);
    after(() => wd.options.smartWait = 0);

    it('should wait for element to appear', async () => {
      await wd.amOnPage('/form/wait_element');
      await wd.dontSeeElement('h1');
      await wd.seeElement('h1');
    });

    it('should wait for clickable element appear', async () => {
      await wd.amOnPage('/form/wait_clickable');
      await wd.dontSeeElement('#click');
      await wd.click('#click');
      await wd.see('Hi!');
    });

    it('should wait for clickable context to appear', async () => {
      await wd.amOnPage('/form/wait_clickable');
      await wd.dontSeeElement('#linkContext');
      await wd.click('Hello world', '#linkContext');
      await wd.see('Hi!');
    });

    it('should wait for text context to appear', async () => {
      await wd.amOnPage('/form/wait_clickable');
      await wd.dontSee('Hello world');
      await wd.see('Hello world', '#linkContext');
    });

    it('should work with grabbers', async () => {
      await wd.amOnPage('/form/wait_clickable');
      await wd.dontSee('Hello world');
      const res = await wd.grabAttributeFrom('#click', 'id');
      assert.equal(res, 'click');
    });
  });

  describe('#_locateClickable', () => {
    it('should locate a button to click', async () => {
      await wd.amOnPage('/form/checkbox');
      const res = await wd._locateClickable('Submit');
      res.length.should.be.equal(1);
    });

    it('should not locate a non-existing checkbox', async () => {
      await wd.amOnPage('/form/checkbox');
      const res = await wd._locateClickable('I disagree');
      res.length.should.be.equal(0);
    });
  });


  describe('#_locateCheckable', () => {
    it('should locate a checkbox', async () => {
      await wd.amOnPage('/form/checkbox');
      const res = await wd._locateCheckable('I Agree');
      res.length.should.be.equal(1);
    });

    it('should not locate a non-existing checkbox', async () => {
      await wd.amOnPage('/form/checkbox');
      const res = await wd._locateCheckable('I disagree');
      res.length.should.be.equal(0);
    });
  });

  describe('#_locateFields', () => {
    it('should locate a field', async () => {
      await wd.amOnPage('/form/field');
      const res = await wd._locateFields('Name');
      res.length.should.be.equal(1);
    });

    it('should not locate a non-existing field', async () => {
      await wd.amOnPage('/form/field');
      const res = await wd._locateFields('Mother-in-law');
      res.length.should.be.equal(0);
    });
  });

  xdescribe('#grabBrowserLogs', () => {
    it('should grab browser logs', async () => {
      await wd.amOnPage('/');
      await wd.executeScript(() => {
        console.log('Test log entry');
      });
      const logs = await wd.grabBrowserLogs();
      console.log('lololo', logs);

      const matchingLogs = logs.filter(log => log.message.indexOf('Test log entry') > -1);
      assert.equal(matchingLogs.length, 1);
    });

    it('should grab browser logs across pages', async () => {
      wd.amOnPage('/');
      await wd.executeScript(() => {
        console.log('Test log entry 1');
      });
      await wd.openNewTab();
      await wd.amOnPage('/info');
      await wd.executeScript(() => {
        console.log('Test log entry 2');
      });

      const logs = await wd.grabBrowserLogs();

      const matchingLogs = logs.filter(log => log.message.indexOf('Test log entry') > -1);
      assert.equal(matchingLogs.length, 2);
    });
  });

  describe('#dragAndDrop', () => {
    it('Drag item from source to target (no iframe) @dragNdrop', async () => {
      await wd.amOnPage('http://jqueryui.com/resources/demos/droppable/default.html');
      await wd.seeElementInDOM('#draggable');
      await wd.dragAndDrop('#draggable', '#droppable');
      await wd.see('Dropped');
    });

    it('Drag and drop from within an iframe', async () => {
      await wd.amOnPage('http://jqueryui.com/droppable');
      await wd.resizeWindow(700, 700);
      await wd.switchTo('//iframe[@class="demo-frame"]');
      await wd.seeElementInDOM('#draggable');
      await wd.dragAndDrop('#draggable', '#droppable');
      await wd.see('Dropped');
    });
  });

  describe('#switchTo frame', () => {
    it('should switch to frame using name', async () => {
      await wd.amOnPage('/iframe');
      await wd.see('Iframe test', 'h1');
      await wd.dontSee('Information', 'h1');
      await wd.switchTo('iframe');
      await wd.see('Information', 'h1');
      await wd.dontSee('Iframe test', 'h1');
    });

    it('should switch to root frame', async () => {
      await wd.amOnPage('/iframe');
      await wd.see('Iframe test', 'h1');
      await wd.dontSee('Information', 'h1');
      await wd.switchTo('iframe');
      await wd.see('Information', 'h1');
      await wd.dontSee('Iframe test', 'h1');
      await wd.switchTo();
      await wd.see('Iframe test', 'h1');
    });

    it('should switch to frame using frame number', async () => {
      await wd.amOnPage('/iframe');
      await wd.see('Iframe test', 'h1');
      await wd.dontSee('Information', 'h1');
      await wd.switchTo(0);
      await wd.see('Information', 'h1');
      await wd.dontSee('Iframe test', 'h1');
    });
  });

  describe('#AttachFile', () => {
    it('should attach to regular input element', async () => {
      await wd.amOnPage('/form/file');
      await wd.attachFile('Avatar', './app/avatar.jpg');
      await wd.seeInField('Avatar', 'avatar.jpg');
    });

    it('should attach to invisible input element', async () => {
      await wd.amOnPage('/form/file');
      await wd.attachFile('hidden', '/app/avatar.jpg');
    });
  });


  describe('#dragSlider', () => {
    it('should drag scrubber to given position', async () => {
      await wd.amOnPage('/form/page_slider');
      await wd.seeElementInDOM('#slidecontainer input');

      const before = await wd.grabValueFrom('#slidecontainer input');
      await wd.dragSlider('#slidecontainer input', 20);
      const after = await wd.grabValueFrom('#slidecontainer input');

      assert.notEqual(before, after);
    });
  });

  describe('#uncheckOption', () => {
    it('should uncheck option that is currently checked', async () => {
      await wd.amOnPage('/info');
      await wd.uncheckOption('interesting');
      await wd.dontSeeCheckboxIsChecked('interesting');
    });

    it('should NOT uncheck option that is NOT currently checked', async () => {
      await wd.amOnPage('/info');
      await wd.uncheckOption('interesting');
      // Unchecking again should not affect the current 'unchecked' status
      await wd.uncheckOption('interesting');
      await wd.dontSeeCheckboxIsChecked('interesting');
    });
  });

  describe('allow back and forth between handles: #grabAllWindowHandles #grabCurrentWindowHandle #switchToWindow', () => {
    it('should open main page of configured site, open a popup, switch to main page, then switch to popup, close popup, and go back to main page', async () => {
      await wd.amOnPage('/');
      const handleBeforePopup = await wd.grabCurrentWindowHandle();
      const urlBeforePopup = await wd.grabCurrentUrl();

      const allHandlesBeforePopup = await wd.grabAllWindowHandles();
      allHandlesBeforePopup.length.should.eql(1);

      await wd.executeScript(() => {
        window.open('https://www.w3schools.com/', 'new window', 'toolbar=yes,scrollbars=yes,resizable=yes,width=400,height=400');
      });

      const allHandlesAfterPopup = await wd.grabAllWindowHandles();
      allHandlesAfterPopup.length.should.eql(2);

      await wd.switchToWindow(allHandlesAfterPopup[1]);
      const urlAfterPopup = await wd.grabCurrentUrl();
      urlAfterPopup.should.eql('https://www.w3schools.com/');

      handleBeforePopup.should.eql(allHandlesAfterPopup[0]);
      await wd.switchToWindow(handleBeforePopup);
      const currentURL = await wd.grabCurrentUrl();
      currentURL.should.eql(urlBeforePopup);

      await wd.switchToWindow(allHandlesAfterPopup[1]);
      const urlAfterSwitchBack = await wd.grabCurrentUrl();
      urlAfterSwitchBack.should.eql('https://www.w3schools.com/');
      await wd.closeCurrentTab();

      const allHandlesAfterPopupClosed = await wd.grabAllWindowHandles();
      allHandlesAfterPopupClosed.length.should.eql(1);
      const currentWindowHandle = await wd.grabCurrentWindowHandle();
      currentWindowHandle.should.eql(handleBeforePopup);
    });
  });

  describe('#waitForClickable', () => {
    it('should wait for clickable', async () => {
      await wd.amOnPage('/form/wait_for_clickable');
      await wd.waitForClickable({ css: 'input#text' });
    });

    it('should wait for clickable by XPath', async () => {
      await wd.amOnPage('/form/wait_for_clickable');
      await wd.waitForClickable({ xpath: './/input[@id="text"]' });
    });

    it('should fail for disabled element', async () => {
      await wd.amOnPage('/form/wait_for_clickable');
      await wd.waitForClickable({ css: '#button' }, 0.1).then((isClickable) => {
        if (isClickable) throw new Error('Element is clickable, but must be unclickable');
      }).catch((e) => {
        e.message.should.include('element #button still not clickable after 0.1 sec');
      });
    });

    it('should fail for disabled element by XPath', async () => {
      await wd.amOnPage('/form/wait_for_clickable');
      await wd.waitForClickable({ xpath: './/button[@id="button"]' }, 0.1).then((isClickable) => {
        if (isClickable) throw new Error('Element is clickable, but must be unclickable');
      }).catch((e) => {
        e.message.should.include('element .//button[@id="button"] still not clickable after 0.1 sec');
      });
    });

    it('should fail for element not in viewport by top', async () => {
      await wd.amOnPage('/form/wait_for_clickable');
      await wd.waitForClickable({ css: '#notInViewportTop' }, 0.1).then((isClickable) => {
        if (isClickable) throw new Error('Element is clickable, but must be unclickable');
      }).catch((e) => {
        e.message.should.include('element #notInViewportTop still not clickable after 0.1 sec');
      });
    });

    it('should fail for element not in viewport by bottom', async () => {
      await wd.amOnPage('/form/wait_for_clickable');
      await wd.waitForClickable({ css: '#notInViewportBottom' }, 0.1).then((isClickable) => {
        if (isClickable) throw new Error('Element is clickable, but must be unclickable');
      }).catch((e) => {
        e.message.should.include('element #notInViewportBottom still not clickable after 0.1 sec');
      });
    });

    it('should fail for element not in viewport by left', async () => {
      await wd.amOnPage('/form/wait_for_clickable');
      await wd.waitForClickable({ css: '#notInViewportLeft' }, 0.1).then((isClickable) => {
        if (isClickable) throw new Error('Element is clickable, but must be unclickable');
      }).catch((e) => {
        e.message.should.include('element #notInViewportLeft still not clickable after 0.1 sec');
      });
    });

    it('should fail for element not in viewport by right', async () => {
      await wd.amOnPage('/form/wait_for_clickable');
      await wd.waitForClickable({ css: '#notInViewportRight' }, 0.1).then((isClickable) => {
        if (isClickable) throw new Error('Element is clickable, but must be unclickable');
      }).catch((e) => {
        e.message.should.include('element #notInViewportRight still not clickable after 0.1 sec');
      });
    });

    it('should fail for overlapping element', async () => {
      await wd.amOnPage('/form/wait_for_clickable');
      await wd.waitForClickable({ css: '#div2_button' }, 0.1);
      await wd.waitForClickable({ css: '#div1_button' }, 0.1).then((isClickable) => {
        if (isClickable) throw new Error('Element is clickable, but must be unclickable');
      }).catch((e) => {
        e.message.should.include('element #div1_button still not clickable after 0.1 sec');
      });
    });
  });

  describe('GeoLocation', () => {
    it('should set the geoLocation', async () => {
      await wd.setGeoLocation(37.4043, -122.0748);
      const geoLocation = await wd.grabGeoLocation();
      assert.equal(geoLocation.latitude, 37.4043, 'The latitude is not properly set');
      assert.equal(geoLocation.longitude, -122.0748, 'The longitude is not properly set');
    });
  });

  describe('#grabElementBoundingRect', () => {
    it('should get the element size', async () => {
      await wd.amOnPage('https://www.google.com');
      const size = await wd.grabElementBoundingRect('#hplogo');
      expect(size.x).is.greaterThan(0);
      expect(size.y).is.greaterThan(0);
      expect(size.width).is.greaterThan(0);
      expect(size.height).is.greaterThan(0);
    });

    it('should get the element width', async () => {
      await wd.amOnPage('https://www.google.com');
      const width = await wd.grabElementBoundingRect('#hplogo', 'width');
      expect(width).is.greaterThan(0);
    });

    it('should get the element height', async () => {
      await wd.amOnPage('https://www.google.com');
      const height = await wd.grabElementBoundingRect('#hplogo', 'height');
      expect(height).is.greaterThan(0);
    });
  });

  describe('#scrollIntoView', () => {
    it('should scroll element into viewport', async () => {
      await wd.amOnPage('/form/scroll_into_view');
      const element = await wd.browser.$('#notInViewportByDefault');
      expect(await element.isDisplayedInViewport()).to.be.false;
      await wd.scrollIntoView('#notInViewportByDefault');
      expect(await element.isDisplayedInViewport()).to.be.true;
    });
  });
});
