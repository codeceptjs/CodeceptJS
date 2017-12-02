<<<<<<< HEAD
const TestHelper = require('../support/TestHelper');

const SeleniumWebdriver = require('../../lib/helper/SeleniumWebdriver');

let I;
let browser;
const site_url = TestHelper.siteUrl();
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const fileExists = require('../../lib/utils').fileExists;
const AssertionFailedError = require('../../lib/assert/error');
const formContents = require('../../lib/utils').test.submittedData(path.join(__dirname, '/../data/app/db'));
=======
'use strict';
let TestHelper = require('../support/TestHelper');

let Protractor = require('../../lib/helper/Protractor');
let should = require('chai').should();
let I, browser;
let site_url = TestHelper.siteUrl();
let assert = require('assert');
let path = require('path');
let fs = require('fs');
let fileExists = require('../../lib/utils').fileExists;
let AssertionFailedError = require('../../lib/assert/error');
let formContents = require('../../lib/utils').test.submittedData(path.join(__dirname, '/../data/app/db'));
>>>>>>> updated seleniumwebdriver & protractor
require('co-mocha')(require('mocha'));
const webApiTests = require('./webapi');

describe('SeleniumWebdriver', function () {
  this.retries(4);
  this.timeout(35000);

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data');
    try {
      fs.unlinkSync(dataFile);
    } catch (err) {}

    I = new Protractor({
      url: site_url,
      browser: 'chrome',
      windowSize: '500x700',
      restart: false,
<<<<<<< HEAD
      seleniumAddress: TestHelper.seleniumAddress(),
=======
      seleniumAddress: TestHelper.seleniumAddress()
    });
    return I._init().then(() => {
      return I._beforeSuite().then(() => {
        browser = I.browser;
        return I.amOutsideAngularApp();
      });
>>>>>>> updated seleniumwebdriver & protractor
    });
    return I._init().then(() => I._beforeSuite().then(() => {
      browser = I.browser;
    }));
  });

  after(() => I._finishTest());

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
<<<<<<< HEAD
    it('should fail when text is not on site', () => I.amOnPage('/')
      .then(() => I.see('Something incredible!'))
      .thenCatch((e) => {
        e.should.be.instanceOf(AssertionFailedError);
        e.inspect().should.include('web application');
      }));

    it('should fail when text on site', () => I.amOnPage('/')
      .then(() => I.dontSee('Welcome'))
      .thenCatch((e) => {
        e.should.be.instanceOf(AssertionFailedError);
        e.inspect().should.include('web application');
      }));

    it('should fail when test is not in context', () => I.amOnPage('/')
      .then(() => I.see('debug', { css: 'a' }))
      .thenCatch((e) => {
        e.should.be.instanceOf(AssertionFailedError);
        e.toString().should.not.include('web page');
        e.inspect().should.include("expected element {css: 'a'}");
      }));
=======
    it('should fail when text is not on site', () => {
      return I.amOnPage('/')
        .then(() => I.see('Something incredible!'))
        .catch((e) => {
          e.should.be.instanceOf(AssertionFailedError);
          e.inspect().should.include('web application');
        })
    });

    it('should fail when text on site', () => {
      return I.amOnPage('/')
        .then(() => I.dontSee('Welcome'))
        .catch((e) => {
          e.should.be.instanceOf(AssertionFailedError);
          e.inspect().should.include('web application');
        });
    });

    it('should fail when test is not in context', () => {
      return I.amOnPage('/')
        .then(() => I.see('debug', {css: 'a'}))
        .catch((e) => {
          e.should.be.instanceOf(AssertionFailedError);
          e.toString().should.not.include('web page');
          e.inspect().should.include("expected element {css: 'a'}");
        });
    });
>>>>>>> updated seleniumwebdriver & protractor
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
