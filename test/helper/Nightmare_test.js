const TestHelper = require('../support/TestHelper');

const Nightmare = require('../../lib/helper/Nightmare');

let I;
let browser;
const siteUrl = TestHelper.siteUrl();
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const AssertionFailedError = require('../../lib/assert/error');
require('co-mocha')(require('mocha'));
const webApiTests = require('./webapi');

describe('Nightmare', function () {
  this.retries(3);
  this.timeout(35000);

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data');
    try {
      fs.unlinkSync(dataFile);
    } catch (err) {
      // continue regardless of error
    }

    I = new Nightmare({
      url: siteUrl,
      windowSize: '500x700',
      show: false,
      waitForTimeout: 5000,
    });
    I._init();
    return I._beforeSuite();
  });

  beforeEach(() => {
    webApiTests.init({ I, siteUrl });
    return I._before().then(() => browser = I.browser);
  });

  afterEach(() => I._after());

  describe('open page : #amOnPage', () => {
    it('should open main page of configured site', function* () {
      I.amOnPage('/');
      const url = yield browser.url();
      return url.should.eql(`${siteUrl}/`);
    });

    it('should open any page of configured site', function* () {
      I.amOnPage('/info');
      const url = yield browser.url();
      return url.should.eql(`${siteUrl}/info`);
    });

    it('should open absolute url', function* () {
      I.amOnPage(siteUrl);
      const url = yield browser.url();
      return url.should.eql(`${siteUrl}/`);
    });
  });

  webApiTests.tests();


  // should work for webdriverio and seleniumwebdriver
  // but somehow fails on Travis CI :(
  describe('#moveCursorTo', () => {
    it('should trigger hover event', () => I.amOnPage('/form/hover')
      .then(() => I.moveCursorTo('#hover'))
      .then(() => I.see('Hovered', '#show')));
  });

  describe('scripts Inject', () => {
    it('should reinject scripts after navigating to new page', () => I.amOnPage('/')
      .then(() => I.click("//div[@id='area1']/a"))
      .then(() => I.waitForVisible("//input[@id='avatar']")));
  });

  describe('see text : #see', () => {
    it('should fail when text is not on site', () => I.amOnPage('/')
      .then(() => I.see('Something incredible!'))
      .catch((e) => {
        e.should.be.instanceOf(AssertionFailedError);
        e.inspect().should.include('web application');
      }));


    it('should fail when clickable element not found', () => I.amOnPage('/')
      .then(() => I.click('Welcome'))
      .catch((e) => {
        e.should.be.instanceOf(Error);
        e.message.should.include('Clickable');
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

  describe('#locate', () => {
    it('should use locate to check element', () => {
      const attribute = 'qa-id';
      return I.amOnPage('/')
        .then(() => I._locate({
          css: '.notice',
        }).then((els) => {
          // we received an array with IDs of matched elements
          // now let's execute client-side script to get attribute for the first element
          assert.ok(!!els);
          return browser.evaluate((el, attribute) => window.codeceptjs.fetchElement(el).getAttribute(attribute), els[0], attribute);
        }).then((attributeValue) => {
          // get attribute value and back to server side
          // execute an assertion
          assert.equal(attributeValue, 'test');
        }));
    });
  });

  describe('window size #resizeWindow', () => {
    it('should set initial window size', () => I.amOnPage('/form/resize')
      .then(() => I.click('Window Size'))
      .then(() => I.see('Height 700', '#height'))
      .then(() => I.see('Width 500', '#width')));

    it('should resize window to specific dimensions', () => I.amOnPage('/form/resize')
      .then(() => I.resizeWindow(950, 600))
      .then(() => I.click('Window Size'))
      .then(() => I.see('Height 600', '#height'))
      .then(() => I.see('Width 950', '#width')));
  });


  describe('refresh page', () => {
    it('should refresh the current page', function* () {
      I.amOnPage(siteUrl);
      const url = yield browser.url();
      assert.equal(`${siteUrl}/`, url);
      yield I.refreshPage();
      const nextUrl = yield browser.url();
      // reloaded the page, check the url is the same
      assert.equal(url, nextUrl);
    });
  });
});
