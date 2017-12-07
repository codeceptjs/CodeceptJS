
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

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data');
    I = new Puppeteer({
      url: siteUrl,
      windowSize: '1000x800',
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
});
