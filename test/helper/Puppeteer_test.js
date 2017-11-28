'use strict';
let TestHelper = require('../support/TestHelper');
let Puppeteer = require('../../lib/helper/Puppeteer');
let should = require('chai').should();
let I, browser, page;
let site_url = TestHelper.siteUrl();
let assert = require('assert');
let path = require('path');
let fs = require('fs');
let fileExists = require('../../lib/utils').fileExists;
let AssertionFailedError = require('../../lib/assert/error');
let formContents = require('../../lib/utils').test.submittedData(path.join(__dirname, '/../data/app/db'));
let expectError = require('../../lib/utils').test.expectError;
let webApiTests = require('./webapi');

describe('Puppeteer', function () {

  before(function() {
    global.codecept_dir = path.join(__dirname, '/../data');
    try {
      fs.unlinkSync(dataFile);
    } catch (err) {}

    I = new Puppeteer({
      url: site_url,
      windowSize: '500x400',
      show: false
    });
    I._init();
    I._beforeSuite();
  });

  beforeEach(function() {
    // webApiTests.init({ I, site_url});
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
      let url = await page.url();
      await url.should.eql(site_url + '/');
    });
    it('should open any page of configured site', async () => {
      await I.amOnPage('/info');
      let url = await page.url();
      return url.should.eql(site_url + '/info');
    });

    it('should open absolute url', async () => {
      await I.amOnPage(site_url);
      let url = await page.url();
      return url.should.eql(site_url + '/');
    });
  });



});