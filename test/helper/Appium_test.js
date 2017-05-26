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


  describe('app installation : #seeAppIsInstalled, #installApp, #removeApp, #seeAppIsNotInstalled', () => {

    describe(
      '#grabAllContexts, #grabContext, #grabCurrentActivity, #grabNetworkConnection, #grabOrientation, #grabSettings',
      () => {

        it('should grab all available contexts for screen', function*() {
          yield app.click('~buttonStartWebviewCD')
          let val = yield app.grabAllContexts();
          assert.deepEqual(val, ['NATIVE_APP', 'WEBVIEW_io.selendroid.testapp']);
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
          yield app.setNetworkConnection(4)
          let val = yield app.grabNetworkConnection();
          assert.equal(val.value, 4);
          assert.equal(val.inAirplaneMode, false);
          assert.equal(val.hasWifi, false);
          assert.equal(val.hasData, true);
        });

        it('should grab orientation', function*() {
          let val = yield app.grabOrientation();
          assert.equal(val, 'PORTRAIT');
        });

        it('should grab custom settings', function*() {
          let val = yield app.grabSettings();
          assert.deepEqual(val, {ignoreUnimportantViews: false});
        });

      });

    it('should remove App and install it again', () => {
      return app.seeAppIsInstalled("io.selendroid.testapp")
        .then(() => app.removeApp("io.selendroid.testapp"))
        .then(() => app.seeAppIsNotInstalled("io.selendroid.testapp"))
        .then(() => app.installApp(apk_path))
        .then(() => app.seeAppIsInstalled("io.selendroid.testapp"))
    });

    it('should assert when app is/is not installed', () => {
      return app.seeAppIsInstalled("io.super.app")
        .then(expectError)
        .catch((e) => {
          e.should.be.instanceOf(AssertionFailedError);
          e.inspect().should.include('expected app io.super.app to be installed');
        })
        .then(() => app.seeAppIsNotInstalled("io.selendroid.testapp"))
        .then(expectError)
        .catch((e) => {
          e.should.be.instanceOf(AssertionFailedError);
          e.inspect().should.include('expected app io.selendroid.testapp not to be installed');
        })
    });
  });

  describe('see seeCurrentActivity: #seeCurrentActivityIs', () => {

    it('should return .HomeScreenActivity for default screen', () => {
      return app.seeCurrentActivityIs(".HomeScreenActivity")
    });

    it('should assert for wrong screen', () => {
      return app.seeCurrentActivityIs(".SuperScreen")
        .then(expectError)
        .catch((e) => {
          e.should.be.instanceOf(AssertionFailedError);
          e.inspect().should.include('expected current activity to be .SuperScreen');
        })
    });
  });

  describe('device lock : #seeDeviceIsLocked, #dontSeeDeviceIsLocked', () => {

    it('should return correct status about lock', () => {
      return app.dontSeeDeviceIsLocked()
        .then(() => app.seeDeviceIsLocked())
        .then(expectError)
        .catch((e) => {
          e.should.be.instanceOf(AssertionFailedError);
          e.inspect().should.include('expected device to be locked');
        })
    });
  });

  describe('device orientation : #seeOrientationIs #setOrientation', () => {

    it('should return correct status about lock', () => {
      return app.seeOrientationIs('PORTRAIT')
        .then(() => app.seeOrientationIs('LANDSCAPE'))
        .then(expectError)
        .catch((e) => {
          e.should.be.instanceOf(AssertionFailedError);
          e.inspect().should.include('expected orientation to be LANDSCAPE');
        })
    });

    it('should set device orientation', () => {
      return app.setOrientation('LANDSCAPE')
        .then(() => app.seeOrientationIs('LANDSCAPE'))
    });

  });

  describe('app context and activity: #switchToContext', () => {

    it('should switch context', function*() {
      yield app.click('~buttonStartWebviewCD')
      yield app.switchToContext('WEBVIEW_io.selendroid.testapp')
      let val = yield app.grabContext();
      return assert.equal(val, 'WEBVIEW_io.selendroid.testapp');
    });

    it('should switch activity', function*() {
      yield app.startActivity('io.selendroid.testapp', '.RegisterUserActivity')
      let val = yield app.grabCurrentActivity();
      assert.equal(val, '.RegisterUserActivity');
    });

  });

  describe('#setNetworkConnection, #setSettings', () => {

    it('should set Network Connection (airplane mode on)', function*() {
      yield app.setNetworkConnection(1)
      let val = yield app.grabNetworkConnection();
      return assert.equal(val.value, 1);
    });

    it('should set custom settings', function*() {
      yield app.setSettings({ cyberdelia: 'open' })
      let val = yield app.grabSettings();
      assert.deepEqual(val, { ignoreUnimportantViews: false, cyberdelia: 'open' });
    });

  });

  describe('#hideDeviceKeyboard', () => {

    it('should hide device Keyboard', () => {
      return app.click('~startUserRegistrationCD')
        .then(() => app.click('android.widget.CheckBox'))
        .then(expectError)
        .catch((e) => {
          e.message.should.include('Clickable element android.widget.CheckBox was not found by text|CSS|XPath');
        })
        .then(() => app.hideDeviceKeyboard('pressKey', 'Done'))
        .then(() => app.click('android.widget.CheckBox'))
    });

    it('should assert if no keyboard', () => {
      return app.hideDeviceKeyboard('pressKey', 'Done').then(expectError)
        .catch((e) => {
          e.message.should.include('An unknown server-side error occurred while processing the command. Original error: Soft keyboard not present, cannot hide keyboard');
        })
    });

  });

  describe('#sendDeviceKeyEvent', () => {

    it('should react on pressing keycode', () => {
      return app.sendDeviceKeyEvent(3)
        .then(() => app.waitForVisible('~Apps list'))
    });

  });

  describe('#openNotifications', () => {

    it('should react on notification opening', () => {
      return app.seeElement('~Do not disturb.')
        .then(expectError)
        .catch((e) => {
          e.should.be.instanceOf(AssertionFailedError);
          e.inspect().should.include('expected elements of ~Do not disturb. to be seen');
        })
        .then(() => app.openNotifications())
        .then(() => app.waitForVisible('~Do not disturb.', 10))
    });

  });

  describe('#makeTouchAction', () => {

    it('should react on touch actions', function*() {
      yield app.makeTouchAction("~buttonStartWebviewCD", 'tap')
      let val = yield app.grabCurrentActivity();
      assert.equal(val, '.WebViewActivity');
    });

    it('should react on swipe action', function*() {
      yield app.click("//android.widget.Button[@resource-id = 'io.selendroid.testapp:id/touchTest']")
      yield app.waitForText("Gesture Type", 10, "//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']")
      yield app.swipe("//android.widget.LinearLayout[@resource-id = 'io.selendroid.testapp:id/LinearLayout1']", 800, 1200, 1000);
      let type = yield app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']")
      let vx = yield app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/text_view3']")
      let vy = yield app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/text_view4']")
      assert.equal(type, 'FLICK');
      assert.equal(vx, 'vx: 28000.0 pps');
      assert.equal(vy, 'vy: 28000.0 pps');
    });

    it('should react on swipeDown action', function*() {
      yield app.click("//android.widget.Button[@resource-id = 'io.selendroid.testapp:id/touchTest']")
      yield app.waitForText("Gesture Type", 10, "//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']")
      yield app.swipeDown("//android.widget.LinearLayout[@resource-id = 'io.selendroid.testapp:id/LinearLayout1']", 1200, 1000);
      let type = yield app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']")
      let vy = yield app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/text_view4']")
      assert.equal(type, 'FLICK');
      assert.equal(vy, 'vy: 28000.0 pps');
    });

    it('should react on swipeUp action', function*() {
      yield app.click("//android.widget.Button[@resource-id = 'io.selendroid.testapp:id/touchTest']")
      yield app.waitForText("Gesture Type", 10, "//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']")
      yield app.swipeUp("//android.widget.LinearLayout[@resource-id = 'io.selendroid.testapp:id/LinearLayout1']", -1200, 1000);
      let type = yield app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']")
      let vy = yield app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/text_view4']")
      assert.equal(type, 'FLICK');
      assert.equal(vy, 'vy: -28000.0 pps');
    });

    it('should react on swipeRight action', function*() {
      yield app.click("//android.widget.Button[@resource-id = 'io.selendroid.testapp:id/touchTest']")
      yield app.waitForText("Gesture Type", 10, "//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']")
      yield app.swipeRight("//android.widget.LinearLayout[@resource-id = 'io.selendroid.testapp:id/LinearLayout1']", 800, 1000);
      let type = yield app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']")
      let vy = yield app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/text_view3']")
      assert.equal(type, 'FLICK');
      assert.equal(vy, 'vx: 28000.0 pps');
    });

    it('should react on swipeLeft action', function*() {
      yield app.click("//android.widget.Button[@resource-id = 'io.selendroid.testapp:id/touchTest']")
      yield app.waitForText("Gesture Type", 10, "//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']")
      yield app.swipeLeft("//android.widget.LinearLayout[@resource-id = 'io.selendroid.testapp:id/LinearLayout1']", -800, 1000);
      let type = yield app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']")
      let vy = yield app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/text_view3']")
      assert.equal(type, 'FLICK');
      assert.equal(vy, 'vx: -28000.0 pps');
    });

    it('should react on touchPerform action', function*() {
      yield app.touchPerform([{
        action: 'press',
        options: {
          x: 100,
          y: 420
        }
      }, { action: 'release' }])
      let val = yield app.grabCurrentActivity();
      assert.equal(val, '.WebViewActivity');
    });

    it('should assert when you dont scroll the document anymore', () => {
      return app.click('~startUserRegistrationCD')
        .then(() => app.swipeTo("android.widget.CheckBox", "//android.widget.ScrollView/android.widget.LinearLayout", "up", 30, 100, 500))
        .catch((e) => {
          e.inspect().should.include('Scroll to the end and element android.widget.CheckBox was not found');
        })
    });

    it('should react on swipeTo action', function*() {
      yield app.click("~startUserRegistrationCD")
      yield app.swipeTo("android.widget.CheckBox", "//android.widget.ScrollView/android.widget.LinearLayout", "up", 30, 100, 700);
    });

  });

  describe('#pullFile', () => {
    it('should pull file to local machine', function*() {
      let savepath = path.join(__dirname, '/../data/mobile/testpullfilecache' + new Date().getTime() + '.m')
      yield app.pullFile('/storage/emulated/0/Android/data/com.google.android.apps.maps/cache/cache_r.m', savepath)
      assert.ok(fs.existsSync(savepath))
    });
  });

});
