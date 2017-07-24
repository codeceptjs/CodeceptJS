'use strict';

let WebDriverIO = require('../../lib/helper/WebDriverIO');
let should = require('chai').should();
let wd;
let site_url = 'http://127.0.0.1:8000';
let assert = require('assert');
let path = require('path');
let fs = require('fs');
let fileExists = require('../../lib/utils').fileExists;
let AssertionFailedError = require('../../lib/assert/error');
let formContents = require('../../lib/utils').test.submittedData(path.join(__dirname, '/../data/app/db'));
let expectError = require('../../lib/utils').test.expectError;
let webApiTests = require('./webapi');
let within = require('../../lib/within')


describe('WebDriverIO', function () {
  this.retries(4);
  this.timeout(35000);

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data');
    try {
      fs.unlinkSync(dataFile);
    } catch (err) {}

    wd = new WebDriverIO({
      url: site_url,
      browser: 'chrome',
      windowSize: '500x400',
      smartWait: 10 // just to try
    });
  });

  beforeEach(() => {
    webApiTests.init({I: wd, site_url});
    return wd._before();
  });

  afterEach(() => {
    return wd._after();
  });

  // load common test suite
  webApiTests.tests();

  describe('open page : #amOnPage', () => {
    it('should open main page of configured site', () => {
      return wd.amOnPage('/').getUrl().then((url) => {
        return url.should.eql(site_url + '/');
      });
    });

    it('should open any page of configured site', () => {
      return wd.amOnPage('/info').getUrl().then((url) => {
        return url.should.eql(site_url + '/info');
      });
    });

    it('should open absolute url', () => {
      return wd.amOnPage(site_url).getUrl().then((url) => {
        return url.should.eql(site_url + '/');
      });
    });
  });

  describe('see text : #see', () => {
    it('should fail when text is not on site', () => {
      return wd.amOnPage('/')
        .then(() => wd.see('Something incredible!'))
        .then(expectError)
        .catch((e) => {
          e.should.be.instanceOf(AssertionFailedError);
          e.inspect().should.include('web page');
        })
        .then(() => wd.dontSee('Welcome'))
        .then(expectError)
        .catch((e) => {
          e.should.be.instanceOf(AssertionFailedError);
          e.inspect().should.include('web page');
      });
    });
      });

  describe('check fields: #seeInField, #seeCheckboxIsChecked, ...', () => {
    it('should throw error if field is not empty', () => {
      return wd.amOnPage('/form/empty')
        .then(() => wd.seeInField('#empty_input', 'Ayayay'))
        .then(expectError)
        .catch((e) => {
          e.should.be.instanceOf(AssertionFailedError);
          e.inspect().should.be.equal('expected fields by #empty_input to include "Ayayay"');
        });
    });

    it('should check values in checkboxes', function*() {
      yield wd.amOnPage('/form/field_values')
      yield wd.dontSeeInField('checkbox[]', 'not seen one');
      yield wd.seeInField('checkbox[]', 'see test one');
      yield wd.dontSeeInField('checkbox[]', 'not seen two');
      yield wd.seeInField('checkbox[]', 'see test two');
      yield wd.dontSeeInField('checkbox[]', 'not seen three');
      return wd.seeInField('checkbox[]', 'see test three');
    });

    it('should check values with boolean', function*() {
      yield wd.amOnPage('/form/field_values')
      yield wd.seeInField('checkbox1', true);
      yield wd.dontSeeInField('checkbox1', false);
      yield wd.seeInField('checkbox2', false);
      yield wd.dontSeeInField('checkbox2', true);
      yield wd.seeInField('radio2', true);
      yield wd.dontSeeInField('radio2', false);
      yield wd.seeInField('radio3', false);
      return wd.dontSeeInField('radio3', true);
    });

    it('should check values in radio', function*() {
      yield wd.amOnPage('/form/field_values')
      yield wd.seeInField('radio1', 'see test one');
      yield wd.dontSeeInField('radio1', 'not seen one');
      yield wd.dontSeeInField('radio1', 'not seen two');
      return wd.dontSeeInField('radio1', 'not seen three');
    });

    it('should check values in select', function*() {
      yield wd.amOnPage('/form/field_values')
      yield wd.seeInField('select1', 'see test one');
      yield wd.dontSeeInField('select1', 'not seen one');
      yield wd.dontSeeInField('select1', 'not seen two');
      return wd.dontSeeInField('select1', 'not seen three');
    });

    it('should check for empty select field', function*() {
      yield wd.amOnPage('/form/field_values')
      return wd.seeInField('select3', '');
    });

    it('should check for select multiple field', function*() {
      yield wd.amOnPage('/form/field_values')
      yield wd.dontSeeInField('select2', 'not seen one');
      yield wd.seeInField('select2', 'see test one');
      yield wd.dontSeeInField('select2', 'not seen two');
      yield wd.seeInField('select2', 'see test two');
      yield wd.dontSeeInField('select2', 'not seen three');
      return wd.seeInField('select2', 'see test three');
    });
  });

  describe('#pressKey', () => {
    it('should be able to send special keys to element', function*() {
      yield wd.amOnPage('/form/field');
      yield wd.appendField('Name', '-');
      yield wd.pressKey([`Control`, `a`]);
      yield wd.pressKey(`Delete`);
      yield wd.pressKey(['Shift', '111']);
      yield wd.pressKey('1');
      return wd.seeInField('Name', '!!!1');
    });
  });

  describe('#seeInSource', () => {
    it('should check for text to be in HTML source', () => {
      return wd.amOnPage('/')
        .then(() => wd.seeInSource('<title>TestEd Beta 2.0</title>'))
        .then(() => wd.dontSeeInSource('<meta'));
    });
  });

  describe('#seeAttributesOnElements', () => {
    it('should check attributes values for given element', () => {
      return wd.amOnPage('/info')
        .then(() => wd.seeAttributesOnElements('//form', { method: "post"}))
        .then(() => wd.seeAttributesOnElements('//form', { method: "post", action: "http://127.0.0.1:8000/"}))
        .then(() => wd.seeAttributesOnElements('//form', { method: "get"}))
        .then(expectError)
        .catch((e) => {
          assert.equal(e.message, `Not all elements (//form) have attributes {"method":"get"}`);
        });
    });

    it('should check attributes values for several elements', () => {
      return wd.amOnPage('/')
        .then(() => wd.seeAttributesOnElements('a', { 'qa-id': "test", 'qa-link': 'test'}))
        .then(() => wd.seeAttributesOnElements('//div', { 'qa-id': 'test'}))
        .then(() => wd.seeAttributesOnElements('a', { 'qa-id': "test", href: '/info'}))
        .then(expectError)
        .catch((e) => {
          e.message.should.include(`Not all elements (a) have attributes {"qa-id":"test","href":"/info"}`);
        });
    });
  });

  describe('#seeTitleEquals', () => {
    it('should check that title is equal to provided one', () => {
      return wd.amOnPage('/')
        .then(() => wd.seeTitleEquals('TestEd Beta 2.0'))
        .then(() => wd.seeTitleEquals('TestEd Beta 2.'))
        .then(expectError)
        .catch((e) => {
          assert.equal(e.message, `expected web page title to be TestEd Beta 2., but found TestEd Beta 2.0`);
        });
    });
  });

  describe('#seeTextEquals', () => {
    it('should check text is equal to provided one', () => {
      return wd.amOnPage('/')
        .then(() => wd.seeTextEquals('Welcome to test app!', 'h1'))
        .then(() => wd.seeTextEquals('Welcome to test app', 'h1'))
        .then(expectError)
        .catch((e) => {
          e.should.be.instanceOf(AssertionFailedError);
          e.inspect().should.include("expected element h1 'Welcome to test app' to equal 'Welcome to test app!'");
        });
    });
  });

  describe('#grabCssPropertyFrom', () => {
    it('should grab css property for given element', () => {
      return wd.amOnPage('/info')
        .then(() => wd.grabCssPropertyFrom('h3', 'font-weight'))
        .then((css) => assert.equal(css, "bold"));
    });
  });

  describe('#seeCssPropertiesOnElements', () => {
    it('should check css property for given element', () => {
      return wd.amOnPage('/info')
        .then(() => wd.seeCssPropertiesOnElements('h3', { 'font-weight': "bold"}))
        .then(() => wd.seeCssPropertiesOnElements('h3', { 'font-weight': "bold", display: 'block'}))
        .then(() => wd.seeCssPropertiesOnElements('h3', { 'font-weight': "non-bold"}))
        .then(expectError)
        .catch((e) => {
          e.message.should.include(`Not all elements (h3) have CSS property {"font-weight":"non-bold"}`);
        });
    });

    it('should check css property for several elements', () => {
      return wd.amOnPage('/')
        .then(() => wd.seeCssPropertiesOnElements('a', { color: "rgba(0, 0, 238, 1)", cursor: 'auto'}))
        .then(() => wd.seeCssPropertiesOnElements('//div', { display: 'block'}))
        .then(() => wd.seeCssPropertiesOnElements('a', { 'margin-top': "0em", cursor: 'auto'}))
        .then(expectError)
        .catch((e) => {
          e.message.should.include(`Not all elements (a) have CSS property {"margin-top":"0em","cursor":"auto"}`);
        });
    });
  });


  describe('#seeNumberOfVisibleElements', () => {
    it('should check number of visible elements for given locator', () => {
      return wd.amOnPage('/info')
        .then(() => wd.seeNumberOfVisibleElements('//div[@id = "grab-multiple"]//a', 3));
    });
  });

  describe('#grabNumberOfVisibleElements', () => {
    it('should grab number of visible elements for given locator', () => {
      return wd.amOnPage('/info')
        .then(() => wd.grabNumberOfVisibleElements('//div[@id = "grab-multiple"]//a'))
        .then((num) => assert.equal(num, 3));
    });
  });

  describe('#waitInUrl, #waitUrlEquals', () => {
    it('should wait part of the URL to match the expected', () => {
      return wd.amOnPage('/info')
        .then(() => wd.waitInUrl('/info'))
        .then(() => wd.waitInUrl('/info2', 0.1))
        .then(expectError)
        .catch((e) => {
          assert.equal(e.message, `expected url to include /info2, but found http://127.0.0.1:8000/info`);
        });
    });
    it('should wait for the entire URL to match the expected', () => {
      return wd.amOnPage('/info')
        .then(() => wd.waitUrlEquals('/info'))
        .then(() => wd.waitUrlEquals('http://127.0.0.1:8000/info'))
        .then(() => wd.waitUrlEquals('/info2', 0.1))
        .then(expectError)
        .catch((e) => {
          assert.equal(e.message, `expected url to be http://127.0.0.1:8000/info2, but found http://127.0.0.1:8000/info`);
        });
    });
  });

  describe('#waitForValue', () => {
    it('should wait for expected value for given locator', () => {
      return wd.amOnPage('/info')
        .then(() => wd.waitForValue('//input[@name= "rus"]', "Верно"))
        .then(() => wd.waitForValue('//input[@name= "rus"]', "Верно3", 0.1))
        .then(expectError)
        .catch((e) => {
          assert.equal(e.message, `element (//input[@name= "rus"]) is not in DOM or there is no element(//input[@name= "rus"]) with value "Верно3" after 0.1 sec`);
        });
    });
  });

  describe('#waitNumberOfVisibleElements', () => {
    it('should wait for a specified number of elements on the page', () => {
      return wd.amOnPage('/info')
        .then(() => wd.waitNumberOfVisibleElements('//div[@id = "grab-multiple"]//a', 3))
        .then(() => wd.waitNumberOfVisibleElements('//div[@id = "grab-multiple"]//a', 2, 0.1))
        .then(expectError)
        .catch((e) => {
          assert.equal(e.message, `The number of elements //div[@id = "grab-multiple"]//a is not 2 after 0.1 sec`);
        });
    });
  });

  describe('#switchToNextTab, #switchToPreviousTab, #openNewTab, #closeCurrentTab', () => {
    it('should switch to next tab', () => {
      return wd.amOnPage('/info')
        .then(() => wd.click('New tab'))
        .then(() => wd.switchToNextTab())
        .then(() => wd.waitInUrl('/login'));
    });
    it('should assert when there is no ability to switch to next tab', () => {
      return wd.amOnPage('/')
        .then(() => wd.click('More info'))
        .then(() => wd.switchToNextTab(2))
        .then(expectError)
        .catch((e) => {
        assert.equal(e.message, "There is no ability to switch to next tab with offset 2");
        });
    });
    it('should close current tab', () => {
      return wd.amOnPage('/info')
        .then(() => wd.click('New tab'))
        .then(() => wd.switchToNextTab())
        .then(() => wd.waitInUrl('/login'))
        .then(() => wd.closeCurrentTab())
        .then(() => wd.waitInUrl('/info'));
    });
    it('should open new tab', () => {
      return wd.amOnPage('/info')
        .then(() => wd.openNewTab())
        .then(() => wd.waitInUrl('about:blank'));
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
        .then(expectError)
        .catch((e) => {
          assert.equal(e.message, "There is no ability to switch to previous tab with offset 2");
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
  });

  describe('#waitForText', () => {
    it('should return error if not present', () => {
      return wd.amOnPage('/dynamic')
        .then(() => wd.waitForText('Nothing here', 1, '#text'))
        .then(expectError)
        .catch((e) => {
          e.message.should.be.equal('element (#text) is not in DOM or there is no element(#text) with text "Nothing here" after 1 sec');
        });
    });

    it('should return error if waiting is too small', () => {
      return wd.amOnPage('/dynamic')
        .then(() => wd.waitForText('Dynamic text', 0.1))
        .then(expectError)
        .catch((e) => {
          e.message.should.be.equal('element (body) is not in DOM or there is no element(body) with text "Dynamic text" after 0.1 sec');
        });
    });
  });

  describe('#seeNumberOfElements', () => {
    it('should return 1 as count', () => {
      return wd.amOnPage('/')
        .then(() => wd.seeNumberOfElements('#area1', 1));
    });
  });

  describe('#switchTo', () => {
      it('should switch reference to iframe content', () => {
          return wd.amOnPage('/iframe')
            .then(() => wd.switchTo('[name="content"]'))
            .then(() => wd.see('Information\nLots of valuable data here'));
      });

      it('should return error if iframe selector is invalid', () => {
          return wd.amOnPage('/iframe')
            .then(() => wd.switchTo('#invalidIframeSelector'))
            .then(expectError)
            .catch((e) => {
                e.should.be.instanceOf(Error);
                e.message.should.be.equal('Element #invalidIframeSelector not found by name|text|CSS|XPath');
            });
      });

    it('should return error if iframe selector is not iframe', () => {
      return wd.amOnPage('/iframe')
        .then(() => wd.switchTo('h1'))
        .then(expectError)
        .catch((e) => {
          e.should.be.instanceOf(Error);
          e.seleniumStack.type.should.be.equal('NoSuchFrame');
        });
    });

      it('should return to parent frame given a null locator', () => {
        return wd.amOnPage('/iframe')
          .then(() => wd.switchTo('[name="content"]'))
          .then(() => wd.see('Information\nLots of valuable data here'))
          .then(() => wd.switchTo(null))
          .then(() => wd.see('Iframe test'));
      });
  });


  describe('SmartWait', () => {
    before(() => wd.options.smartWait = 3000);
    after(() => wd.options.smartWait = 0);

    it('should wait for element to appear', () => {
      return wd.amOnPage('/form/wait_element')
        .then(() => wd.dontSeeElement('h1'))
        .then(() => wd.seeElement('h1'))
    });

    it('should wait for clickable element appear', () => {
      return wd.amOnPage('/form/wait_clickable')
        .then(() => wd.dontSeeElement('#click'))
        .then(() => wd.click('#click'))
        .then(() => wd.see('Hi!'))
    });

    it('should wait for clickable context to appear', () => {
      return wd.amOnPage('/form/wait_clickable')
        .then(() => wd.dontSeeElement('#linkContext'))
        .then(() => wd.click('Hello world', '#linkContext'))
        .then(() => wd.see('Hi!'))
    });

    it('should wait for text context to appear', () => {
      return wd.amOnPage('/form/wait_clickable')
        .then(() => wd.dontSee('Hello world'))
        .then(() => wd.see('Hello world', '#linkContext'))
    });

    it('should work with grabbers', () => {
      return wd.amOnPage('/form/wait_clickable')
        .then(() => wd.dontSee('Hello world'))
        .then(() => wd.grabAttributeFrom('#click', 'id'))
        .then((res) => assert.equal(res, 'click'))
    });

  });

  describe('#_locateClickable', () => {
    it('should locate a button to click', () => {
      return wd.amOnPage('/form/checkbox')
        .then(() => wd._locateClickable('Submit'))
        .then((res) => {
          res.length.should.be.equal(1)
        })
    });

    it('should not locate a non-existing checkbox', () => {
      return wd.amOnPage('/form/checkbox')
        .then(() => wd._locateClickable('I disagree'))
        .then((res) => res.length.should.be.equal(0))
    });
  });


  describe('#_locateCheckable', () => {
    it('should locate a checkbox', () => {
      return wd.amOnPage('/form/checkbox')
        .then(() => wd._locateCheckable('I Agree'))
        .then((res) => res.length.should.be.equal(1))
    });

    it('should not locate a non-existing checkbox', () => {
      return wd.amOnPage('/form/checkbox')
        .then(() => wd._locateCheckable('I disagree'))
        .then((res) => res.length.should.be.equal(0))
    });
  });

  describe('#_locateFields', () => {
    it('should locate a field', () => {
      return wd.amOnPage('/form/field')
        .then(() => wd._locateFields('Name'))
        .then((res) => res.length.should.be.equal(1))
    });

    it('should not locate a non-existing field', () => {
      return wd.amOnPage('/form/field')
        .then(() => wd._locateFields('Mother-in-law'))
        .then((res) => res.length.should.be.equal(0))
    });
  });
});
