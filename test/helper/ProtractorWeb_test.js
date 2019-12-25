const TestHelper = require('../support/TestHelper');
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const fileExists = require('../../lib/utils').fileExists;
const Protractor = require('../../lib/helper/Protractor');
const AssertionFailedError = require('../../lib/assert/error');
const webApiTests = require('./webapi');

let I;
let browser;
const should = require('chai').should();

const siteUrl = TestHelper.siteUrl();
const formContents = require('../../lib/utils').test.submittedData(path.join(__dirname, '/../data/app/db'));

describe('Protractor-NonAngular', function () {
  this.retries(3);
  this.timeout(35000);

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data');
    try {
      fs.unlinkSync(dataFile);
    } catch (err) {
      // continue regardless of error
    }

    I = new Protractor({
      url: siteUrl,
      browser: 'chrome',
      windowSize: '1000x800',
      angular: false,
      restart: false,
      seleniumAddress: TestHelper.seleniumAddress(),
      waitForTimeout: 5000,
      capabilities: {
        loggingPrefs: {
          driver: 'INFO',
          browser: 'INFO',
        },
        chromeOptions: {
          args: ['--headless', '--disable-gpu', '--window-size=1280,1024'],
        },
      },
    });
    return I._init().then(() => I._beforeSuite().then(() => {
      browser = I.browser;
    }));
  });


  beforeEach(() => {
    webApiTests.init({
      I,
      siteUrl,
    });
    return I._before();
  });

  describe('window size #resizeWindow', () => {
    it('should set initial window size', () => I.amOnPage('/form/resize')
      .then(() => I.click('Window Size'))
      .then(() => I.see('Height 800', '#height'))
      .then(() => I.see('Width 1000', '#width')));

    it('should resize window to specific dimensions', () => I.amOnPage('/form/resize')
      .then(() => I.resizeWindow(950, 600))
      .then(() => I.click('Window Size'))
      .then(() => I.see('Height 600', '#height'))
      .then(() => I.see('Width 950', '#width')));
  });


  after(() => I._after());

  describe('open page : #amOnPage', () => {
    it('should open main page of configured site', async () => {
      await I.amOnPage('/');
      const url = await browser.getCurrentUrl();
      url.should.eql(`${siteUrl}/`);
    });

    it('should open any page of configured site', async () => {
      await I.amOnPage('/info');
      const url = await browser.getCurrentUrl();
      url.should.eql(`${siteUrl}/info`);
    });

    it('should open absolute url', async () => {
      await I.amOnPage(siteUrl);
      const url = await browser.getCurrentUrl();
      url.should.eql(`${siteUrl}/`);
    });
  });

  describe('#pressKey', () => {
    it('should be able to send special keys to element', async () => {
      await I.amOnPage('/form/field');
      await I.appendField('Name', '-');
      await I.pressKey(['Control', 'a']);
      await I.pressKey('Delete');
      await I.pressKey(['Shift', '111']);
      await I.pressKey('1');
      await I.seeInField('Name', '!!!1');
    });
  });


  webApiTests.tests();

  describe('see text : #see', () => {
    it('should fail when text is not on site', () => I.amOnPage('/')
      .then(() => I.see('Something incredible!'))
      .catch((e) => {
        e.should.be.instanceOf(AssertionFailedError);
        e.inspect().should.include('web application');
      }));

    it('should fail when text on site', () => I.amOnPage('/')
      .then(() => I.dontSee('Welcome'))
      .catch((e) => {
        e.should.be.instanceOf(AssertionFailedError);
        e.inspect().should.include('web application');
      }));

    it('should fail when test is not in context', () => I.amOnPage('/')
      .then(() => I.see('debug', {
        css: 'a',
      }))
      .catch((e) => {
        e.should.be.instanceOf(AssertionFailedError);
        e.toString().should.not.include('web page');
        e.inspect().should.include('expected element {css: a}');
      }));
  });

  describe('SmartWait', () => {
    before(() => I.options.smartWait = 3000);
    after(() => I.options.smartWait = 0);

    it('should wait for element to appear', () => I.amOnPage('/form/wait_element')
      .then(() => I.dontSeeElement('h1'))
      .then(() => I.seeElement('h1')));

    it('should wait for clickable element appear', () => I.amOnPage('/form/wait_clickable')
      .then(() => I.dontSeeElement('#click'))
      .then(() => I.click('#click'))
      .then(() => I.see('Hi!')));

    it('should wait for clickable context to appear', () => I.amOnPage('/form/wait_clickable')
      .then(() => I.dontSeeElement('#linkContext'))
      .then(() => I.click('Hello world', '#linkContext'))
      .then(() => I.see('Hi!')));

    it('should wait for text context to appear', () => I.amOnPage('/form/wait_clickable')
      .then(() => I.dontSee('Hello world'))
      .then(() => I.see('Hello world', '#linkContext')));
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

  describe('#waitForFunction', () => {
    it('should wait for function returns true', () => I.amOnPage('/form/wait_js')
      .then(() => I.waitForFunction(() => window.__waitJs, 3)));

    it('should pass arguments and wait for function returns true', () => I.amOnPage('/form/wait_js')
      .then(() => I.waitForFunction(varName => window[varName], ['__waitJs'], 3)));
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
      .then(() => I.see('button was clicked')));
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
  });

  describe('popup : #acceptPopup, #seeInPopup, #cancelPopup', () => {
    it('should accept popup window', () => I.amOnPage('/form/popup')
      .then(() => I.click('Confirm'))
      .then(() => I.acceptPopup())
      .then(() => I.see('Yes', '#result')));

    it('should cancel popup', () => I.amOnPage('/form/popup')
      .then(() => I.click('Confirm'))
      .then(() => I.cancelPopup())
      .then(() => I.see('No', '#result')));

    it('should check text in popup', () => I.amOnPage('/form/popup')
      .then(() => I.click('Alert'))
      .then(() => I.seeInPopup('Really?'))
      .then(() => I.cancelPopup()));

    it('should grab text from popup', () => I.amOnPage('/form/popup')
      .then(() => I.click('Alert'))
      .then(() => I.grabPopupText())
      .then(text => assert.equal(text, 'Really?'))
      .then(() => I.cancelPopup())); // TODO: Remove the cancelPopup line.


    it('should return null if no popup is visible (do not throw an error)', () => I.amOnPage('/form/popup')
      .then(() => I.grabPopupText())
      .then(text => assert.equal(text, null)));
  });

  describe('#grabBrowserLogs', () => {
    it('should grab browser logs', () => I.amOnPage('/')
      .then(() => I.executeScript(() => {
        console.log('Test log entry');
      }))
      .then(() => I.grabBrowserLogs())
      .then((logs) => {
        const matchingLogs = logs.filter(log => log.message.indexOf('Test log entry') > -1);
        assert.equal(matchingLogs.length, 1);
      }));

    it('should grab browser logs across pages', () => I.amOnPage('/')
      .then(() => I.executeScript(() => {
        console.log('Test log entry 1');
      }))
      .then(() => I.openNewTab())
      .then(() => I.amOnPage('/info'))
      .then(() => I.executeScript(() => {
        console.log('Test log entry 2');
      }))
      .then(() => I.grabBrowserLogs())
      .then((logs) => {
        const matchingLogs = logs.filter(log => log.message.indexOf('Test log entry') > -1);
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

  describe('#_locateClickable', () => {
    it('should locate a button to click', async () => {
      await I.amOnPage('/form/checkbox');
      const els = await I._locateClickable('Submit');
      assert.equal(els == null, false);
    });

    it('should not locate a non-existing checkbox using _locateClickable', async () => {
      await I.amOnPage('/form/checkbox');
      try {
        await I._locateClickable('I disagree');
        throw Error('Should not get this far');
      } catch (e) {
        e.message.should.include = 'No element found using locator:';
      }
    });
  });

  describe('#_locateCheckable', () => {
    it('should locate a checkbox', async () => {
      await I.amOnPage('/form/checkbox');
      const els = await I._locateCheckable('I Agree');
      assert.equal(els == null, false);
    });

    it('should not locate a non-existing checkbox', async () => {
      await I.amOnPage('/form/checkbox');
      try {
        await I._locateCheckable('I Agree');
        throw Error('Should not get this far');
      } catch (e) {
        e.message.should.include = 'No element found using locator:';
      }
    });
  });

  describe('#_locateFields', () => {
    it('should locate a field', async () => {
      await I.amOnPage('/form/field');
      const els = await I._locateFields('Name');
      assert.equal(els == null, false);
    });

    it('should not locate a non-existing field', async () => {
      await I.amOnPage('/form/field');
      try {
        const els = await I._locateFields('Mother-in-law');
        throw Error('Should not get this far');
      } catch (e) {
        e.message.should.include = 'No element found using locator:';
      }
    });
  });

  /* describe('#waitUntil predicate', () => {
    it('should wait until the windows requests is equal to 0', () => I.amOnPage('/form/wait_value')
      .then(() => I.waitUntil(function () {
        return browser.sleep(10);
      })));
  }); */
});
