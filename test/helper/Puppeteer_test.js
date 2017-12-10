
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
    });
    I._init();
    return I._beforeSuite();
  });

  beforeEach(() => {
    webApiTests.init({ I, siteUrl });
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

  describe('#switchToNextTab, #switchToPreviousTab, #openNewTab, #closeCurrentTab', () => {
    it('should switch to next tab', () => I.amOnPage('/info')
      .then(() => I.click('New tab'))
      .then(() => I.switchToNextTab())
      .then(() => I.seeCurrentUrlEquals('/login')));

    it('should assert when there is no ability to switch to next tab', () => I.amOnPage('/')
      .then(() => I.click('More info'))
      .then(() => I.switchToNextTab(2))
      .catch((e) => {
        assert.equal(e.message, 'There is no ability to switch to next tab with offset 2');
      }));

    it('should close current tab', () => I.amOnPage('/info')
      .then(() => I.click('New tab'))
      .then(() => I.switchToNextTab())
      .then(() => I.seeInCurrentUrl('/login'))
      .then(() => I.closeCurrentTab())
      .then(() => I.seeInCurrentUrl('/info')));

    it('should open new tab', () => I.amOnPage('/info')
      .then(() => I.openNewTab())
      .then(() => I.seeInCurrentUrl('about:blank')));

    it('should switch to previous tab', () => I.amOnPage('/info')
      .then(() => I.openNewTab())
      .then(() => I.seeInCurrentUrl('about:blank'))
      .then(() => I.switchToPreviousTab())
      .then(() => I.seeInCurrentUrl('/info')));
  });
});
