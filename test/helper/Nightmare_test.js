const assert = require('assert');
const path = require('path');
const fs = require('fs');

const TestHelper = require('../support/TestHelper');
const Nightmare = require('../../lib/helper/Nightmare');
const AssertionFailedError = require('../../lib/assert/error');
const webApiTests = require('./webapi');
global.hermiona = require('../../lib');

let I;
let browser;
const siteUrl = TestHelper.siteUrl();

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
    it('should open main page of configured site', async () => {
      await I.amOnPage('/');
      const url = await browser.url();
      url.should.eql(`${siteUrl}/`);
    });

    it('should open any page of configured site', async () => {
      await I.amOnPage('/info');
      const url = await browser.url();
      url.should.eql(`${siteUrl}/info`);
    });

    it('should open absolute url', async () => {
      await I.amOnPage(siteUrl);
      const url = await browser.url();
      url.should.eql(`${siteUrl}/`);
    });

    it('should open same page twice without error', async () => {
      await I.amOnPage('/');
      await I.amOnPage('/');
    });
  });

  webApiTests.tests();

  describe('#waitForFunction', () => {
    it('should wait for function returns true', async () => {
      await I.amOnPage('/form/wait_js');
      await I.waitForFunction(() => window.__waitJs, 3);
    });

    it('should pass arguments and wait for function returns true', async () => {
      await I.amOnPage('/form/wait_js');
      await I.waitForFunction(varName => window[varName], ['__waitJs'], 3);
    });
  });

  // should work for webdriverio
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
        e.inspect().should.include('expected element {css: a}');
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
          assert.ok(!!els.length);
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
    it('should refresh the current page', async () => {
      await I.amOnPage(siteUrl);
      const url = await browser.url();
      assert.equal(`${siteUrl}/`, url);
      await I.refreshPage();
      const nextUrl = await browser.url();
      // reloaded the page, check the url is the same
      assert.equal(url, nextUrl);
    });
  });

  describe('#seeNumberOfElements', () => {
    it('should return 1 as count', async () => {
      await I.amOnPage('/');
      await I.seeNumberOfElements('#area1', 1);
    });
  });
});
