'use strict';

let Appium = require('../../lib/helper/Appium');
var chai = require('chai');
let should = require('chai').should();
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;
let I;
let site_url = 'http://davertmik.github.io/angular-demo-app';
let assert = require('assert');
let path = require('path');
let fs = require('fs');
let fileExists = require('../../lib/utils').fileExists;
let AssertionFailedError = require('../../lib/assert/error');
let expectError = require('../../lib/utils').test.expectError;
let webApiTests = require('./webapi');
let within = require('../../lib/within')
require('co-mocha')(require('mocha'));

describe('Appium Web', function () {
  this.retries(4);
  this.timeout(35000);

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data');
    try {
      fs.unlinkSync(dataFile);
    } catch (err) {}

    I = new Appium({
      url: site_url,
      browser: 'chrome',
      windowSize: '500x400',
      restart: false,
      platform: 'Android',
      device: 'Android Emulator'
    });
    webApiTests.init({I, site_url});
    return I._beforeSuite();
  });

  beforeEach(() => {
    return I._before();
  });

  afterEach(() => {
    return I._after();
  });

  after(() => {
    return I._finishTest();
  });

  describe('current url : #seeInCurrentUrl, #seeCurrentUrlEquals, ...', () => {
    it('should check for url fragment', function*() {
      yield I.amOnPage(site_url+'/#/info');
      yield I.seeInCurrentUrl('/info');
      return I.dontSeeInCurrentUrl('/result');
    });

    it('should check for equality', function*() {
      yield I.amOnPage('/#/info');
      yield I.seeCurrentUrlEquals('/#/info');
      return I.dontSeeCurrentUrlEquals('/#/result');
    });
  });

  describe('see text : #see', () => {
    it('should check text on site', function*() {
      yield I.amOnPage('/');
      yield I.see('Description');
      return I.dontSee('Create Event Today');
    });

    it('should check text inside element', function*() {
      yield I.amOnPage('/#/info');
      yield I.see('About', 'h1');
      yield I.see('Welcome to event app', {css: 'p.jumbotron'});
      return I.see('Back to form', '//div/a');
    });
  });

  describe('see element : #seeElement, #dontSeeElement', () => {
    it('should check visible elements on page', function*() {
      yield I.amOnPage('/');
      yield I.seeElement('.btn.btn-primary');
      yield I.seeElement({css: '.btn.btn-primary'});
      return I.dontSeeElement({css: '.btn.btn-secondary'});
    });
  });


  describe('#click', () => {
    it('should click by text', function*() {
      yield I.amOnPage('/');
      yield I.dontSeeInCurrentUrl('/info');
      yield I.click('Get more info!');
      return I.seeInCurrentUrl('/info');
    });

    it('should click by css', function*() {
      yield I.amOnPage('/');
      yield I.click('.btn-primary');
      yield I.wait(2);
      return I.seeInCurrentUrl('/result');
    });

    it('should click by non-optimal css', function*() {
      yield I.amOnPage('/');
      yield I.click('form a.btn');
      yield I.wait(2);
      return I.seeInCurrentUrl('/result');
    });

    it('should click by xpath', function*() {
      yield I.amOnPage('/');
      yield I.click('//a[contains(., "more info")]');
      return I.seeInCurrentUrl('/info');
    });

    it('should click on context', function*() {
      yield I.amOnPage('/');
      yield I.click('.btn-primary', 'form');
      yield I.wait(2);
      return I.seeInCurrentUrl('/result');
    });

    it('should click link with inner span', function*() {
      yield I.amOnPage('/#/result');
      yield I.click('Go to info');
      return I.seeInCurrentUrl('/info')
    });

    it('should click buttons as links', function*() {
      yield I.amOnPage('/');
      yield I.click('Options');
      return I.seeInCurrentUrl('/options')
    });
  });

  describe('#grabTextFrom, #grabValueFrom, #grabAttributeFrom', () => {
    it('should grab text from page', function*() {
      yield I.amOnPage('/#/info');
      let val = yield I.grabTextFrom('p.jumbotron');
      return expect(val).to.equal('Welcome to event app');
    });

    it('should grab value from field', function*() {
      yield I.amOnPage('/#/options');
      let val = yield I.grabValueFrom('#ssh');
      return expect(val).to.equal('PUBLIC-SSH-KEY');
    });

    it('should grab attribute from element', function*() {
      yield I.amOnPage('/#/info');
      let val = yield I.grabAttributeFrom('a.btn', 'ng-href');
      return expect(val).to.equal('#/');
    });
  });

  xdescribe('#within', () => {

    afterEach(() => I._withinEnd());

    it('should work using within operator', function*() {
      yield I.amOnPage('/#/info');
      yield I.see('This is a very simple event creating app built with AngularJS');
      // yield I.wait(2);
      yield I._withinBegin({ css: 'p.jumbotron'});
      yield I.see('Welcome to event app');
    //   yield I.see('About');
    //   return I.dontSee('This is a very simple event creating app built with AngularJS');
    });

  });

});
