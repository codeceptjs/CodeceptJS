'use strict';

let Appium = require('../../lib/helper/Appium');
let should = require('chai').should();
let app;
let assert = require('assert');
let path = require('path');
let fs = require('fs');
let fileExists = require('../../lib/utils').fileExists;
let AssertionFailedError = require('../../lib/assert/error');
let formContents = require('../../lib/utils').test.submittedData(path.join(__dirname, '/../data/app/db'));
let expectError = require('../../lib/utils').test.expectError;
let webApiTests = require('./webapi');
let apk_path = path.join(__dirname, '/../data/mobile/selendroid-test-app-0.17.0.apk')


describe('Appium', function () {
  this.retries(0);
  this.timeout(35000);

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data');
    try {
      fs.unlinkSync(dataFile);
    } catch (err) {
    }

    app = new Appium({
      port: 4723,
      desiredCapabilities: {
        app: apk_path,
        platformName: "Android",
        platformVersion: "7.1",
        deviceName: "Android Emulator"
      }
    });
  });

  beforeEach(() => {
    return app._before();
  });

  afterEach(() => {
    return app._after();
  });


  describe('app instalation : #seeAppIsInstalled, #removeApp, #seeAppIsNotInstalled', () => {
    it('should fail when text is not on site', () => {
      return app.seeAppIsInstalled("io.selendroid.testapp")
        .then(() => app.removeApp("io.selendroid.testapp"))
        .then(() => app.seeAppIsNotInstalled("io.selendroid.testapp"))
    });
  });

  describe('see seeCurrentActivity: #seeCurrentActivityIs', () => {
    it('should return .HomeScreenActivity for default screen', () => {
      return app.seeCurrentActivityIs(".HomeScreenActivity")
    });
  });

  describe('#grabAllContexts, #grabContext, #grabCurrentActivity, #grabNetworkConnection, #grabOrientation, #grabSettings', () => {
    it('should grab all availible contexts for screen', function*() {
      yield app.click("//android.widget.ImageButton[@content-desc = 'buttonStartWebviewCD']")
      let val = yield app.grabAllContexts();
      assert.deepEqual(val, [ 'NATIVE_APP', 'WEBVIEW_io.selendroid.testapp' ]);
    });
    it('should grab current context', function*() {
      let val = yield app.grabContext();
      assert.equal(val, 'NATIVE_APP');
    });
    it('should grab current activity of app', function*() {
      let val = yield app.grabCurrentActivity();
      assert.equal(val, '.HomeScreenActivity');
    });

    it('should grab network connection settings', function*() {
      let val = yield app.grabNetworkConnection();
      assert.equal(val.value, 4);
      assert.equal(val.inAirplaneMode, false);
      assert.equal(val.hasWifi, false);
      assert.equal(val.hasData, true);
    });
    //TODO: not working
    // it('should grab orientation', function*() {
    //   let val = yield app.grabOrientation();
    //   console.log(val)
    //   assert.equal(val, 4);
    // });

    it('should grab custom settings', function*() {
      let val = yield app.grabSettings();
      assert.deepEqual(val, { ignoreUnimportantViews: false });
    });

  });

});
