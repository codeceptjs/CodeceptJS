const TestHelper = require('../support/TestHelper');
const Puppeteer = require('../../lib/helper/Puppeteer');
const should = require('chai').should();
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const fileExists = require('../../lib/utils').fileExists;
const AssertionFailedError = require('../../lib/assert/error');
const formContents = require('../../lib/utils').test.submittedData(path.join(__dirname, '/../data/app/db'));
const expectError = require('../../lib/utils').test.expectError;
const webApiTests = require('./webapi');

let I;
let browser;
let page;
const siteUrl = TestHelper.siteUrl();

describe('Puppeteer', function () {
  this.timeout(35000);
  // this.retries(1);

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data');
    I = new Puppeteer({
      url: siteUrl,
      windowSize: '500x700',
      show: false,
      waitForTimeout: 2000,
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
  });

  webApiTests.tests();

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

  describe('#moveCursorTo', () => {
    it('should trigger hover event', () => I.amOnPage('/form/hover')
      .then(() => I.moveCursorTo('#hover'))
      .then(() => I.see('Hovered', '#show')));
  });

  describe('#switchToNextTab, #switchToPreviousTab, #openNewTab, #closeCurrentTab, #closeOtherTabs', () => {
    it('should switch to next tab', () => I.amOnPage('/info')
      .then(() => I.click('New tab'))
      .then(() => I.switchToNextTab())
      .then(() => I.seeCurrentUrlEquals('/login')));

    it('should assert when there is no ability to switch to next tab', () => I.amOnPage('/')
      .then(() => I.click('More info'))
      .then(() => I.switchToNextTab(2))
      .then(() => assert.equal(true, false, 'Throw an error if it gets this far (which it should not)!'))
      .catch((e) => {
        assert.equal(e.message, 'There is no ability to switch to next tab with offset 2');
      }));

    it('should close current tab', () => I.amOnPage('/info')
      .then(() => I.click('New tab'))
      .then(() => I.switchToNextTab())
      .then(() => I.seeInCurrentUrl('/login'))
      .then(() => I.closeCurrentTab())
      .then(() => I.seeInCurrentUrl('/info')));

    it('should close other tabs', () => I.amOnPage('/')
      .then(() => I.openNewTab())
      .then(() => I.seeInCurrentUrl('about:blank'))
      .then(() => I.amOnPage('/info'))
      .then(() => I.click('New tab'))
      .then(() => I.switchToNextTab())
      .then(() => I.seeInCurrentUrl('/login'))
      .then(() => I.closeOtherTabs())
      .then(() => I.seeInCurrentUrl('/login')));

    it('should open new tab', () => I.amOnPage('/info')
      .then(() => I.openNewTab())
      .then(() => I.seeInCurrentUrl('about:blank')));

    it('should switch to previous tab', () => I.amOnPage('/info')
      .then(() => I.openNewTab())
      .then(() => I.seeInCurrentUrl('about:blank'))
      .then(() => I.switchToPreviousTab())
      .then(() => I.seeInCurrentUrl('/info')));
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
      .then(() => I.see('Information\nLots of valuable data here')));

    it('should return error if iframe selector is invalid', () => I.amOnPage('/iframe')
      .then(() => I.switchTo('#invalidIframeSelector'))
      .catch((e) => {
        e.should.be.instanceOf(Error);
        e.message.should.be.equal('Element #invalidIframeSelector was not found by text|CSS|XPath');
      }));

    it('should return error if iframe selector is not iframe', () => I.amOnPage('/iframe')
      .then(() => I.switchTo('h1'))
      .catch((e) => {
        e.should.be.instanceOf(Error);
        e.message.should.be.equal('Element #invalidIframeSelector was not found by text|CSS|XPath');
      }));

    it('should return to parent frame given a null locator', () => I.amOnPage('/iframe')
      .then(() => I.switchTo('[name="content"]'))
      .then(() => I.see('Information\nLots of valuable data here'))
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
      .catch((e) => {
        e.should.be.instanceOf(AssertionFailedError);
        e.inspect().should.include("expected element h1 'Welcome to test app' to equal 'Welcome to test app!'");
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
      .then(res => res.length.should.be.equal(1)));

    it('should not locate a non-existing checkbox', () => I.amOnPage('/form/checkbox')
      .then(() => I._locateCheckable('I disagree'))
      .then(res => res.length.should.be.equal(0)));
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
      return I.seeInField('checkbox[]', 'see test three');
    });

    it('should check values with boolean', function* () {
      yield I.amOnPage('/form/field_values');
      yield I.seeInField('checkbox1', true);
      yield I.dontSeeInField('checkbox1', false);
      yield I.seeInField('checkbox2', false);
      yield I.dontSeeInField('checkbox2', true);
      yield I.seeInField('radio2', true);
      yield I.dontSeeInField('radio2', false);
      yield I.seeInField('radio3', false);
      return I.dontSeeInField('radio3', true);
    });

    it('should check values in radio', function* () {
      yield I.amOnPage('/form/field_values');
      yield I.seeInField('radio1', 'see test one');
      yield I.dontSeeInField('radio1', 'not seen one');
      yield I.dontSeeInField('radio1', 'not seen two');
      return I.dontSeeInField('radio1', 'not seen three');
    });

    it('should check values in select', function* () {
      yield I.amOnPage('/form/field_values');
      yield I.seeInField('select1', 'see test one');
      yield I.dontSeeInField('select1', 'not seen one');
      yield I.dontSeeInField('select1', 'not seen two');
      return I.dontSeeInField('select1', 'not seen three');
    });

    it('should check for empty select field', function* () {
      yield I.amOnPage('/form/field_values');
      return I.seeInField('select3', '');
    });

    it('should check for select multiple field', function* () {
      yield I.amOnPage('/form/field_values');
      yield I.dontSeeInField('select2', 'not seen one');
      yield I.seeInField('select2', 'see test one');
      yield I.dontSeeInField('select2', 'not seen two');
      yield I.seeInField('select2', 'see test two');
      yield I.dontSeeInField('select2', 'not seen three');
      return I.seeInField('select2', 'see test three');
    });
  });

  describe('#waitInUrl, #waitUrlEquals', () => {
    it('should wait part of the URL to match the expected', () => I.amOnPage('/info')
      .then(() => I.waitInUrl('/info'))
      .then(() => I.waitInUrl('/info2', 0.1))
      .catch((e) => {
        assert.equal(e.message, `expected url to include /info2, but found ${siteUrl}/info`);
      }));
    it('should wait for the entire URL to match the expected', () => I.amOnPage('/info')
      .then(() => I.waitUrlEquals('/info'))
      .then(() => I.waitUrlEquals(`${siteUrl}/info`))
      .then(() => I.waitUrlEquals('/info2', 0.1))
      .catch((e) => {
        assert.equal(e.message, `expected url to be ${siteUrl}/info2, but found ${siteUrl}/info`);
      }));
  });

  describe('#seeNumberOfVisibleElements', () => {
    it('should check number of visible elements for given locator', () => I.amOnPage('/info')
      .then(() => I.seeNumberOfVisibleElements('//div[@id = "grab-multiple"]//a', 3)));
  });

  describe('#grabNumberOfVisibleElements', () => {
    it('should grab number of visible elements for given locator', () => I.amOnPage('/info')
      .then(() => I.grabNumberOfVisibleElements('//div[@id = "grab-multiple"]//a'))
      .then(num => assert.equal(num, 3)));
    it('should support locators like {xpath:"//div"}', () => I.amOnPage('/info')
      .then(() => I.grabNumberOfVisibleElements({
        xpath: '//div[@id = "grab-multiple"]//a',
      }))
      .then(num => assert.equal(num, 3)));
  });
});
