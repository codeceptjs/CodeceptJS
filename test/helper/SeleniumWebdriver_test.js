

const SeleniumWebdriver = require('../../lib/helper/SeleniumWebdriver');
const should = require('chai').should();

let I;
let browser;
const site_url = 'http://127.0.0.1:8000';
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const fileExists = require('../../lib/utils').fileExists;
const AssertionFailedError = require('../../lib/assert/error');
const formContents = require('../../lib/utils').test.submittedData(path.join(__dirname, '/../data/app/db'));
const expectError = require('../../lib/utils').test.expectError;
require('co-mocha')(require('mocha'));
const webApiTests = require('./webapi');

describe('SeleniumWebdriver', function () {
  this.retries(4);
  this.timeout(35000);

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data');
    try {
      fs.unlinkSync(dataFile);
    } catch (err) {
      // continue regardless of error
    }

    I = new SeleniumWebdriver({
      url: site_url,
      browser: 'chrome',
      windowSize: '500x700',
      restart: false,
    });
    return I._init().then(() => {
      return I._beforeSuite().then(() => {
        browser = I.browser;
      });
    });
  });

  after(() => {
    return I._finishTest();
  });

  beforeEach(() => {
    webApiTests.init({ I, site_url });
  });

  describe('open page : #amOnPage', () => {
    it('should open main page of configured site', function* () {
      I.amOnPage('/');
      const url = yield browser.getCurrentUrl();
      return url.should.eql(`${site_url}/`);
    });

    it('should open any page of configured site', function* () {
      I.amOnPage('/info');
      const url = yield browser.getCurrentUrl();
      return url.should.eql(`${site_url}/info`);
    });

    it('should open absolute url', function* () {
      I.amOnPage(site_url);
      const url = yield browser.getCurrentUrl();
      return url.should.eql(`${site_url}/`);
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
    it('should fail when text is not on site', () => {
      return I.amOnPage('/')
        .then(() => I.see('Something incredible!'))
        .then(expectError)
        .thenCatch((e) => {
          e.should.be.instanceOf(AssertionFailedError);
          e.inspect().should.include('web application');
        });
    });

    it('should fail when text on site', () => {
      return I.amOnPage('/')
        .then(() => I.dontSee('Welcome'))
        .then(expectError)
        .thenCatch((e) => {
          e.should.be.instanceOf(AssertionFailedError);
          e.inspect().should.include('web application');
        });
    });

    it('should fail when test is not in context', () => {
      return I.amOnPage('/')
        .then(() => I.see('debug', { css: 'a' }))
        .then(expectError)
        .thenCatch((e) => {
          e.should.be.instanceOf(AssertionFailedError);
          e.toString().should.not.include('web page');
          e.inspect().should.include("expected element {css: 'a'}");
        });
    });
  });

  describe('SmartWait', () => {
    before(() => I.options.smartWait = 3000);
    after(() => I.options.smartWait = 0);

    it('should wait for element to appear', () => {
      return I.amOnPage('/form/wait_element')
        .then(() => I.dontSeeElement('h1'))
        .then(() => I.seeElement('h1'));
    });

    it('should wait for clickable element appear', () => {
      return I.amOnPage('/form/wait_clickable')
        .then(() => I.dontSeeElement('#click'))
        .then(() => I.click('#click'))
        .then(() => I.see('Hi!'));
    });

    it('should wait for clickable context to appear', () => {
      return I.amOnPage('/form/wait_clickable')
        .then(() => I.dontSeeElement('#linkContext'))
        .then(() => I.click('Hello world', '#linkContext'))
        .then(() => I.see('Hi!'));
    });

    it('should wait for text context to appear', () => {
      return I.amOnPage('/form/wait_clickable')
        .then(() => I.dontSee('Hello world'))
        .then(() => I.see('Hello world', '#linkContext'));
    });
  });
});
