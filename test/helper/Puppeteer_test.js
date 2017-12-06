
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

describe('Puppeteer', () => {
  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data');
    I = new Puppeteer({
      url: siteUrl,
      windowSize: '500x400',
      show: false,
    });
    I._init();
    return I._beforeSuite();
  });

  beforeEach(() => {
    // webApiTests.init({ I, siteUrl});
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
  describe('see element : #seeElement, #seeElementInDOM, #dontSeeElement', () => {
    it('should check visible elements on page', function* () {
      yield I.amOnPage('/form/field');
      yield I.seeElement('input[name=name]');
      yield I.seeElement({ name: 'name' });
      yield I.seeElement('//input[@id="name"]');
      yield I.dontSeeElement('#something-beyond');
      return I.dontSeeElement('//input[@id="something-beyond"]');
    });

    it('should check elements are in the DOM', function* () {
      yield I.amOnPage('/form/field');
      yield I.seeElementInDOM('input[name=name]');
      yield I.seeElementInDOM('//input[@id="name"]');
      yield I.dontSeeElementInDOM('#something-beyond');
      return I.dontSeeElementInDOM('//input[@id="something-beyond"]');
    });

    it('should check elements are visible on the page', function* () {
      yield I.amOnPage('/form/field');
      yield I.seeElementInDOM('input[name=email]');
      yield I.dontSeeElement('input[name=email]');
      return I.dontSeeElement('#something-beyond');
    });
  });
});
