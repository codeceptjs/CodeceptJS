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
require('co-mocha')(require('mocha'));

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
    it('should open main page of configured site', function* () {
      yield I.amOnPage('/');
      const url = yield browser.getCurrentUrl();
      return url.should.eql(`${siteUrl}/`);
    });

    it('should open any page of configured site', function* () {
      yield I.amOnPage('/info');
      const url = yield browser.getCurrentUrl();
      return url.should.eql(`${siteUrl}/info`);
    });

    it('should open absolute url', function* () {
      yield I.amOnPage(siteUrl);
      const url = yield browser.getCurrentUrl();
      return url.should.eql(`${siteUrl}/`);
    });
  });

  describe('#pressKey', () => {
    it('should be able to send special keys to element', function* () {
      yield I.amOnPage('/form/field');
      yield I.appendField('Name', '-');
      yield I.pressKey(['Control', 'a']);
      yield I.pressKey('Delete');
      yield I.pressKey(['Shift', '111']);
      yield I.pressKey('1');
      return I.seeInField('Name', '!!!1');
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
        e.inspect().should.include("expected element {css: 'a'}");
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
});
