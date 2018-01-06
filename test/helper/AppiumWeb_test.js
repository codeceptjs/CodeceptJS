const Appium = require('../../lib/helper/Appium');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const expect = chai.expect;
let I;
const site_url = 'http://davertmik.github.io';
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const fileExists = require('../../lib/utils').fileExists;
const AssertionFailedError = require('../../lib/assert/error');
const webApiTests = require('./webapi');
const within = require('../../lib/within');
require('co-mocha')(require('mocha'));

describe('Appium Web', function () {
  this.retries(4);
  this.timeout(70000);

  before(() => {
    I = new Appium({
      url: site_url,
      browser: 'chrome',
      restart: false,
      desiredCapabilities: {
        appiumVersion: '1.6.5',
        recordVideo: 'false',
        recordScreenshots: 'false',
        platformName: 'Android',
        platformVersion: '6.0',
        deviceName: 'Android Emulator',
      },
      host: 'ondemand.saucelabs.com',
      port: 80,
      // port: 4723,
      // host: 'localhost',
      user: process.env.SAUCE_USERNAME,
      key: process.env.SAUCE_ACCESS_KEY,
    });
    // I.isWeb = true;
    I._init();
    I._beforeSuite();
  });

  after(() => I._finishTest());

  beforeEach(() => {
    I.isWeb = true;
    return I._before();
  });

  afterEach(() => I._after());

  describe('current url : #seeInCurrentUrl, #seeCurrentUrlEquals, ...', () => {
    it('should check for url fragment', function* () {
      yield I.amOnPage('/angular-demo-app/#/info');
      yield I.seeInCurrentUrl('/info');
      return I.dontSeeInCurrentUrl('/result');
    });

    it('should check for equality', function* () {
      yield I.amOnPage('/angular-demo-app/#/info');
      yield I.seeCurrentUrlEquals('/angular-demo-app/#/info');
      return I.dontSeeCurrentUrlEquals('/angular-demo-app/#/result');
    });
  });

  describe('see text : #see', () => {
    it('should check text on site', function* () {
      yield I.amOnPage('/angular-demo-app/');
      yield I.see('Description');
      return I.dontSee('Create Event Today');
    });

    it('should check text inside element', function* () {
      yield I.amOnPage('/angular-demo-app/#/info');
      yield I.see('About', 'h1');
      yield I.see('Welcome to event app', { css: 'p.jumbotron' });
      return I.see('Back to form', '//div/a');
    });
  });

  describe('see element : #seeElement, #dontSeeElement', () => {
    it('should check visible elements on page', function* () {
      yield I.amOnPage('/angular-demo-app/');
      yield I.seeElement('.btn.btn-primary');
      yield I.seeElement({ css: '.btn.btn-primary' });
      return I.dontSeeElement({ css: '.btn.btn-secondary' });
    });
  });


  describe('#click', () => {
    it('should click by text', function* () {
      yield I.amOnPage('/angular-demo-app/');
      yield I.dontSeeInCurrentUrl('/info');
      yield I.click('Get more info!');
      return I.seeInCurrentUrl('/info');
    });

    it('should click by css', function* () {
      yield I.amOnPage('/angular-demo-app/');
      yield I.click('.btn-primary');
      yield I.wait(2);
      return I.seeInCurrentUrl('/result');
    });

    it('should click by non-optimal css', function* () {
      yield I.amOnPage('/angular-demo-app/');
      yield I.click('form a.btn');
      yield I.wait(2);
      return I.seeInCurrentUrl('/result');
    });

    it('should click by xpath', function* () {
      yield I.amOnPage('/angular-demo-app/');
      yield I.click('//a[contains(., "more info")]');
      return I.seeInCurrentUrl('/info');
    });

    it('should click on context', function* () {
      yield I.amOnPage('/angular-demo-app/');
      yield I.click('.btn-primary', 'form');
      yield I.wait(2);
      return I.seeInCurrentUrl('/result');
    });

    it('should click link with inner span', function* () {
      yield I.amOnPage('/angular-demo-app/#/result');
      yield I.click('Go to info');
      return I.seeInCurrentUrl('/info');
    });

    it('should click buttons as links', function* () {
      yield I.amOnPage('/angular-demo-app/');
      yield I.click('Options');
      return I.seeInCurrentUrl('/options');
    });
  });

  describe('#grabTextFrom, #grabValueFrom, #grabAttributeFrom', () => {
    it('should grab text from page', function* () {
      yield I.amOnPage('/angular-demo-app/#/info');
      const val = yield I.grabTextFrom('p.jumbotron');
      return expect(val).to.equal('Welcome to event app');
    });

    it('should grab value from field', function* () {
      yield I.amOnPage('/angular-demo-app/#/options');
      const val = yield I.grabValueFrom('#ssh');
      return expect(val).to.equal('PUBLIC-SSH-KEY');
    });

    it('should grab attribute from element', function* () {
      yield I.amOnPage('/angular-demo-app/#/info');
      const val = yield I.grabAttributeFrom('a.btn', 'ng-href');
      return expect(val).to.equal('#/');
    });
  });

  describe('#within', () => {
    afterEach(() => I._withinEnd());

    it('should work using within operator', function* () {
      yield I.amOnPage('/angular-demo-app/#/options');
      yield I.see('Choose if you ok with terms');
      yield I._withinBegin({ css: 'div.results' });
      yield I.see('SSH Public Key: PUBLIC-SSH-KEY');
      return I.dontSee('Options');
    });
  });
});
