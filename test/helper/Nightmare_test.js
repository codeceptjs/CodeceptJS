'use strict';
let Nightmare = require('../../lib/helper/Nightmare');
let should = require('chai').should();
let I, browser;
let site_url = 'http://127.0.0.1:8000';
let assert = require('assert');
let path = require('path');
let fs = require('fs');
let fileExists = require('../../lib/utils').fileExists;
let AssertionFailedError = require('../../lib/assert/error');
let formContents = require('../../lib/utils').test.submittedData(path.join(__dirname, '/../data/app/db'));
let expectError = require('../../lib/utils').test.expectError;
require('co-mocha')(require('mocha'));
let webApiTests = require('./webapi');

describe('Nightmare', function () {
  this.retries(3);
  this.timeout(20000);

  before(function() {
    global.codecept_dir = path.join(__dirname, '/../data');
    try {
      fs.unlinkSync(dataFile);
    } catch (err) {}

    I = new Nightmare({
      url: site_url,
      windowSize: '500x400',
      show: false
    });
    I._init();
    I._beforeSuite();
  });

  beforeEach(function() {
    webApiTests.init({ I, site_url});
    return browser = I._before();
  });

  afterEach(() => {
    return I._after();
  });

  describe('open page : #amOnPage', () => {
    it('should open main page of configured site', function*() {
      I.amOnPage('/');
      let url = yield browser.url();
      return url.should.eql(site_url + '/');
    });

    it('should open any page of configured site', function*() {
      I.amOnPage('/info');
      let url = yield browser.url();
      return url.should.eql(site_url + '/info');
    });

    it('should open absolute url', function*() {
      I.amOnPage(site_url);
      let url = yield browser.url();
      return url.should.eql(site_url + '/');
    });
  });

  webApiTests.tests();


  // should work for webdriverio and seleniumwebdriver
  // but somehow fails on Travis CI :(
  describe('#moveCursorTo', () => {
    it('should trigger hover event', () => {
      return I.amOnPage('/form/hover')
        .then(() => I.moveCursorTo('#hover'))
        .then(() => I.see('Hovered', '#show'));
    });
  });

  describe('see text : #see', () => {
    it('should fail when text is not on site', () => {
      return I.amOnPage('/')
        .then(() => I.see('Something incredible!'))
        .then(expectError)
        .catch((e) => {
          e.should.be.instanceOf(AssertionFailedError);
          e.inspect().should.include('web application');
        })
    });


    it('should fail when clicable element not found', () => {
      return I.amOnPage('/')
        .then(() => I.click('Welcome'))
        .then(expectError)
        .catch((e) => {
          e.should.be.instanceOf(Error);
          e.message.should.include('Clickable');
        });
    });

    it('should fail when text on site', () => {
      return I.amOnPage('/')
        .then(() => I.dontSee('Welcome'))
        .then(expectError)
        .catch((e) => {
          e.should.be.instanceOf(AssertionFailedError);
          e.inspect().should.include('web application');
        });
    });

    it('should fail when test is not in context', () => {
      return I.amOnPage('/')
        .then(() => I.see('debug', {css: 'a'}))
        .then(expectError)
        .catch((e) => {
          e.should.be.instanceOf(AssertionFailedError);
          e.toString().should.not.include('web page');
          e.inspect().should.include("expected element {css: 'a'}");
        });
    });
  });

});
