'use strict';

let WebDriverIO = require('../../../lib/helper/WebDriverIO');
let should = require('chai').should();
let wd;
let site_url = 'http://127.0.0.1:8000';
let assert = require('assert');
let path = require('path');
let fs = require('fs');
let fileExists = require('../../../lib/utils').fileExists;
let AssertionFailedError = require('../../../lib/assert/error');
let formContents = require('../../../lib/utils').test.submittedData(path.join(__dirname, '../../data/app/db'));
let expectError = require('../../../lib/utils').test.expectError;
let webApiTests = require('./webapi');


describe('WebDriverIO', function () {
  this.timeout(10000);

  before(() => {
    global.codecept_dir = path.join(__dirname, '../../data');
    try {
      fs.unlinkSync(dataFile);
    } catch (err) {}

    wd = new WebDriverIO({
      url: site_url,
      browser: 'firefox'
    });
  });

  beforeEach(() => {
    webApiTests.init({ I, site_url});
    return wd._before();
  });

  afterEach(() => {
    return wd._after();
  });

  describe('open page : #amOnPage', () => {
    it('should open main page of configured site', () => {
      return wd.amOnPage('/').getUrl().then((url) => {
        return url.should.eql(site_url + '/');
      });
    });

    it('should open any page of configured site', () => {
      return wd.amOnPage('/info').getUrl().then((url) => {
        return url.should.eql(site_url + '/info');
      });
    });

    it('should open absolute url', () => {
      return wd.amOnPage(site_url).getUrl().then((url) => {
        return url.should.eql(site_url + '/');
      });
    });
  });

  webApiTests.tests();

  // custom tests

  describe('#clearField', () => {
    it('should clear a given element', () => {
      return wd.amOnPage('/form/field')
        .then(() => wd.fillField('#name', 'Nothing special'))
        .then(() => wd.see('Nothing special', '#name'))
        .then(() => wd.clearField('#name'))
        .then(() => wd.dontSee('Nothing special', '#name'));
    });
  });

  describe('#seeInSource', () => {
    it('should check for text to be in HTML source', () => {
      return wd.amOnPage('/')
        .then(() => wd.seeInSource('<title>TestEd Beta 2.0</title>'))
        .then(() => wd.dontSeeInSource('<meta'));
    });
  });

  describe('window size : #resizeWindow', () => {
    it('should change the active window size', () => {
      return wd.amOnPage('/')
        .then(() => wd.resizeWindow(640, 480))
        .then(function () { return this.windowHandleSize((err, size) => {
          assert.equal(size.value.width, 640);
          return assert.equal(size.value.height, 480);
        });
      });
    });
  });

  describe('popup : #acceptPopup, #seeInPopup, #cancelPopup', () => {
    it('should accept popup window', () => {
      return wd.amOnPage('/form/popup')
        .then(() => wd.click('Confirm'))
        .then(() => wd.acceptPopup())
        .then(() => wd.see('Yes', '#result'));
    });

    it('should cancel popup', () => {
      return wd.amOnPage('/form/popup')
        .then(() => wd.click('Confirm'))
        .then(() => wd.cancelPopup())
        .then(() => wd.see('No', '#result'));
    });

    it('should check text in popup', () => {
      return wd.amOnPage('/form/popup')
        .then(() => wd.click('Alert'))
        .then(() => wd.seeInPopup('Really?'))
        .then(() => wd.cancelPopup());
    });
  });

  describe('#waitForText', () => {

    it('should return error if not present', () => {
      return wd.amOnPage('/dynamic')
        .then(() => wd.waitForText('Nothing here', 0, '#text'))
        .then(expectError)
        .catch((e) => {
          e.should.be.instanceOf(AssertionFailedError);
          e.inspect().should.be.equal('expected element #text to include Nothing here');
        });
    });

    it('should return error if waiting is too small', () => {
      return wd.amOnPage('/dynamic')
        .then(() => wd.waitForText('Dynamic text', 0.5))
        .then(expectError)
        .catch((e) => {
          e.should.be.instanceOf(AssertionFailedError);
          e.inspect().should.be.equal('expected element body to include Dynamic text');
        });
    });
  });

  describe('#waitToHide', () => {
    it('should until element is not visible', () => {
      return wd.amOnPage('/')
        .then(() => wd.click('More info'))
        .then(() => wd.waitToHide('#area1'))
        .then(() => wd.seeInCurrentUrl('/info'));
    });
  });

  describe('#seeNumberOfElements', () => {
    it('should return 1 as count', () => {
      return wd.amOnPage('/')
        .then(() => wd.seeNumberOfElements('#area1', 1));
    });
  });

});
