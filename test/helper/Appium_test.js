const Appium = require('../../lib/helper/Appium');

let app;
const assert = require('assert');
const expect = require('chai').expect;
const path = require('path');
const fs = require('fs');
const fileExists = require('../../lib/utils').fileExists;
const AssertionFailedError = require('../../lib/assert/error');
require('co-mocha')(require('mocha'));

const apk_path = 'https://github.com/Codeception/CodeceptJS/raw/Appium/test/data/mobile/selendroid-test-app-0.17.0.apk';


describe('Appium', function () {
  // this.retries(1);
  this.timeout(0);

  before(() => {
    app = new Appium({
      app: apk_path,
      desiredCapabilities: {
        appiumVersion: '1.9.1',
        browserName: '',
        recordVideo: 'false',
        recordScreenshots: 'false',
        platformName: 'Android',
        platformVersion: '6.0',
        deviceName: 'Android Emulator',
      },
      protocol: 'http',
      host: 'ondemand.saucelabs.com',
      port: 80,
      // port: 4723,
      // host: 'localhost',
      user: process.env.SAUCE_USERNAME,
      key: process.env.SAUCE_ACCESS_KEY,
    });
    return app._beforeSuite();
  });

  beforeEach(async () => {
    app.isWeb = false;
    await app._before();
    // await app.installApp(apk_path);
  });

  afterEach(() => app._after());

  describe('app installation : #seeAppIsInstalled, #installApp, #removeApp, #seeAppIsNotInstalled', () => {
    describe(
      '#grabAllContexts, #grabContext, #grabCurrentActivity, #grabNetworkConnection, #grabOrientation, #grabSettings',
      () => {
        it('should grab all available contexts for screen', function* () {
          yield app.click('~buttonStartWebviewCD');
          const val = yield app.grabAllContexts();
          assert.deepEqual(val, ['NATIVE_APP', 'WEBVIEW_io.selendroid.testapp']);
        });

        it('should grab current context', function* () {
          const val = yield app.grabContext();
          assert.equal(val, 'NATIVE_APP');
        });

        it('should grab current activity of app', function* () {
          const val = yield app.grabCurrentActivity();
          assert.equal(val, '.HomeScreenActivity');
        });

        it('should grab network connection settings', function* () {
          yield app.setNetworkConnection(4);
          const val = yield app.grabNetworkConnection();
          assert.equal(val.value, 4);
          assert.equal(val.inAirplaneMode, false);
          assert.equal(val.hasWifi, false);
          assert.equal(val.hasData, true);
        });

        it('should grab orientation', function* () {
          const val = yield app.grabOrientation();
          assert.equal(val, 'PORTRAIT');
        });

        it('should grab custom settings', function* () {
          const val = yield app.grabSettings();
          assert.deepEqual(val, { ignoreUnimportantViews: false });
        });
      },
    );

    it('should remove App and install it again', () => app.seeAppIsInstalled('io.selendroid.testapp')
      .then(() => app.removeApp('io.selendroid.testapp'))
      .then(() => app.seeAppIsNotInstalled('io.selendroid.testapp'))
      .then(() => app.installApp(apk_path))
      .then(() => app.seeAppIsInstalled('io.selendroid.testapp')));

    it('should assert when app is/is not installed', () => app.seeAppIsInstalled('io.super.app')
      .catch((e) => {
        e.should.be.instanceOf(AssertionFailedError);
        e.inspect().should.include('expected app io.super.app to be installed');
      })
      .then(() => app.seeAppIsNotInstalled('io.selendroid.testapp'))
      .catch((e) => {
        e.should.be.instanceOf(AssertionFailedError);
        e.inspect().should.include('expected app io.selendroid.testapp not to be installed');
      }));
  });

  describe('see seeCurrentActivity: #seeCurrentActivityIs', () => {
    it('should return .HomeScreenActivity for default screen', () => app.seeCurrentActivityIs('.HomeScreenActivity'));

    it('should assert for wrong screen', () => app.seeCurrentActivityIs('.SuperScreen')
      .catch((e) => {
        e.should.be.instanceOf(AssertionFailedError);
        e.inspect().should.include('expected current activity to be .SuperScreen');
      }));
  });

  describe('device lock : #seeDeviceIsLocked, #seeDeviceIsUnlocked', () => {
    it('should return correct status about lock @second', () => app.seeDeviceIsUnlocked()
      .then(() => app.seeDeviceIsLocked())
      .catch((e) => {
        e.should.be.instanceOf(AssertionFailedError);
        e.inspect().should.include('expected device to be locked');
      }));
  });

  describe('device orientation : #seeOrientationIs #setOrientation', () => {
    it('should return correct status about lock', () => app.seeOrientationIs('PORTRAIT')
      .then(() => app.seeOrientationIs('LANDSCAPE'))
      .catch((e) => {
        e.should.be.instanceOf(AssertionFailedError);
        e.inspect().should.include('expected orientation to be LANDSCAPE');
      }));

    it('should set device orientation', () => app.click('~buttonStartWebviewCD')
      .then(() => app.setOrientation('LANDSCAPE'))
      .then(() => app.seeOrientationIs('LANDSCAPE')));
  });

  describe('app context and activity: #_switchToContext, #switchToWeb, #switchToNative', () => {
    it('should switch context', function* () {
      yield app.click('~buttonStartWebviewCD');
      yield app._switchToContext('WEBVIEW_io.selendroid.testapp');
      const val = yield app.grabContext();
      return assert.equal(val, 'WEBVIEW_io.selendroid.testapp');
    });

    it('should switch to native and web contexts @quick', function* () {
      yield app.click('~buttonStartWebviewCD');
      yield app.see('WebView location');
      yield app.switchToWeb();
      let val = yield app.grabContext();
      assert.equal(val, 'WEBVIEW_io.selendroid.testapp');
      yield app.see('Prefered Car');
      assert.ok(app.isWeb);
      yield app.switchToNative();
      val = yield app.grabContext();
      assert.equal(val, 'NATIVE_APP');
      return assert.ok(!app.isWeb);
    });

    it('should switch activity', function* () {
      yield app.startActivity('io.selendroid.testapp', '.RegisterUserActivity');
      const val = yield app.grabCurrentActivity();
      assert.equal(val, '.RegisterUserActivity');
    });
  });

  describe('#setNetworkConnection, #setSettings', () => {
    it('should set Network Connection (airplane mode on)', function* () {
      yield app.setNetworkConnection(1);
      const val = yield app.grabNetworkConnection();
      return assert.equal(val.value, 1);
    });

    it('should set custom settings', function* () {
      yield app.setSettings({ cyberdelia: 'open' });
      const val = yield app.grabSettings();
      assert.deepEqual(val, { ignoreUnimportantViews: false, cyberdelia: 'open' });
    });
  });

  describe('#hideDeviceKeyboard', () => {
    it('should hide device Keyboard @quick', () => app.click('~startUserRegistrationCD')
      .then(() => app.click('//android.widget.CheckBox'))
      .catch((e) => {
        e.message.should.include('element');
      })
      .then(() => app.hideDeviceKeyboard('pressKey', 'Done'))
      .then(() => app.click('//android.widget.CheckBox')));

    it('should assert if no keyboard', () => app.hideDeviceKeyboard('pressKey', 'Done')
      .catch((e) => {
        e.message.should.include('An unknown server-side error occurred while processing the command. Original error: Soft keyboard not present, cannot hide keyboard');
      }));
  });

  describe('#sendDeviceKeyEvent', () => {
    it('should react on pressing keycode', function* () {
      return app.sendDeviceKeyEvent(3)
        .then(() => app.waitForVisible('~Apps'));
    });
  });

  describe('#openNotifications', () => {
    it('should react on notification opening', () => app.seeElement('//android.widget.FrameLayout[@resource-id="com.android.systemui:id/quick_settings_container"]')
      .catch((e) => {
        e.should.be.instanceOf(AssertionFailedError);
        e.inspect().should.include('expected elements of //android.widget.FrameLayout[@resource-id="com.android.systemui:id/quick_settings_container"] to be seen');
      })
      .then(() => app.openNotifications())
      .then(() => app.waitForVisible('//android.widget.FrameLayout[@resource-id="com.android.systemui:id/quick_settings_container"]', 10)));
  });

  describe('#makeTouchAction', () => {
    it('should react on touch actions', function* () {
      yield app.tap('~buttonStartWebviewCD');
      const val = yield app.grabCurrentActivity();
      assert.equal(val, '.WebViewActivity');
    });

    it('should react on swipe action', function* () {
      yield app.click("//android.widget.Button[@resource-id = 'io.selendroid.testapp:id/touchTest']");
      yield app.waitForText(
        'Gesture Type', 10,
        "//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']",
      );
      yield app.swipe(
        "//android.widget.LinearLayout[@resource-id = 'io.selendroid.testapp:id/LinearLayout1']", 800,
        1200, 1000,
      );
      const type = yield app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']");
      const vx = yield app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/text_view3']");
      const vy = yield app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/text_view4']");
      assert.equal(type, 'FLICK');
      assert.ok(vx.match(/vx: \d\d000\.0 pps/), 'to be like \d\d000.0 pps');
      assert.ok(vy.match(/vy: \d\d000\.0 pps/), 'to be like \d\d000.0 pps');
    });

    it('should react on swipeDown action', function* () {
      yield app.click("//android.widget.Button[@resource-id = 'io.selendroid.testapp:id/touchTest']");
      yield app.waitForText(
        'Gesture Type', 10,
        "//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']",
      );
      yield app.swipeDown(
        "//android.widget.LinearLayout[@resource-id = 'io.selendroid.testapp:id/LinearLayout1']",
        1200, 1000,
      );
      const type = yield app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']");
      const vy = yield app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/text_view4']");
      assert.equal(type, 'FLICK');
      assert.ok(vy.match(/vy: \d\d000\.0 pps/), 'to be like \d\d000.0 pps');
    });

    it('run simplified swipeDown @quick', async () => {
      await app.click("//android.widget.Button[@resource-id = 'io.selendroid.testapp:id/touchTest']");
      await app.waitForText(
        'Gesture Type', 10,
        "//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']",
      );
      // yield app.swipeDown('#io.selendroid.testapp:id/LinearLayout1');
      await app.swipeDown(
        "//android.widget.LinearLayout[@resource-id = 'io.selendroid.testapp:id/LinearLayout1']",
        1200, 1000,
      );
      const type = await app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']");
      // const vy = yield app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/text_view4']");
      assert.equal(type, 'FLICK');
    });


    it('should react on swipeUp action', function* () {
      yield app.click("//android.widget.Button[@resource-id = 'io.selendroid.testapp:id/touchTest']");
      yield app.waitForText(
        'Gesture Type', 10,
        "//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']",
      );
      yield app.swipeUp(
        "//android.widget.LinearLayout[@resource-id = 'io.selendroid.testapp:id/LinearLayout1']", 1200,
        1000,
      );
      const type = yield app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']");
      const vy = yield app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/text_view4']");
      assert.equal(type, 'FLICK');
      assert.ok(vy.match(/vy: -\d\d000\.0 pps/), 'to be like \d\d000.0 pps');
    });

    it('should react on swipeRight action', function* () {
      yield app.click("//android.widget.Button[@resource-id = 'io.selendroid.testapp:id/touchTest']");
      yield app.waitForText(
        'Gesture Type', 10,
        "//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']",
      );
      yield app.swipeRight(
        "//android.widget.LinearLayout[@resource-id = 'io.selendroid.testapp:id/LinearLayout1']",
        800, 1000,
      );
      const type = yield app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']");
      const vy = yield app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/text_view3']");
      assert.equal(type, 'FLICK');
      assert.ok(vy.match(/vx: \d\d000\.0 pps/), 'to be like \d\d000.0 pps');
    });

    it('should react on swipeLeft action', function* () {
      yield app.click("//android.widget.Button[@resource-id = 'io.selendroid.testapp:id/touchTest']");
      yield app.waitForText(
        'Gesture Type', 10,
        "//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']",
      );
      yield app.swipeLeft(
        "//android.widget.LinearLayout[@resource-id = 'io.selendroid.testapp:id/LinearLayout1']",
        800, 1000,
      );
      const type = yield app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']");
      const vy = yield app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/text_view3']");
      assert.equal(type, 'FLICK');
      assert.ok(vy.match(/vx: -\d\d000\.0 pps/), 'to be like 21000.0 pps');
    });

    it('should react on touchPerform action', function* () {
      yield app.touchPerform([{
        action: 'press',
        options: {
          x: 100,
          y: 200,
        },
      }, { action: 'release' }]);
      const val = yield app.grabCurrentActivity();
      assert.equal(val, '.HomeScreenActivity');
    });

    it('should assert when you dont scroll the document anymore', () => app.click('~startUserRegistrationCD')
      .then(() => app.swipeTo(
        '//android.widget.CheckBox', '//android.widget.ScrollView/android.widget.LinearLayout', 'up',
        30, 100, 500,
      ))
      .catch((e) => {
        e.message.should.include('Scroll to the end and element android.widget.CheckBox was not found');
      }));

    it('should react on swipeTo action', function* () {
      yield app.click('~startUserRegistrationCD');
      yield app.swipeTo(
        '//android.widget.CheckBox', '//android.widget.ScrollView/android.widget.LinearLayout', 'up', 30,
        100, 700,
      );
    });

    describe('#performTouchAction', () => {
      it('should react on swipeUp action @second', async () => {
        await app.click("//android.widget.Button[@resource-id = 'io.selendroid.testapp:id/touchTest']");
        await app.waitForText(
          'Gesture Type', 10,
          "//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']",
        );
        await app.swipeUp("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']");
        const type = await app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']");
        const vy = await app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/text_view4']");
        assert.equal(type, 'FLICK');
        expect(vy.split(' ')[1]).to.be.below(1006);
      });

      it('should react on swipeDown action @second', async () => {
        await app.click("//android.widget.Button[@resource-id = 'io.selendroid.testapp:id/touchTest']");
        await app.waitForText(
          'Gesture Type', 10,
          "//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']",
        );
        await app.swipeUp("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']");
        const type = await app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']");
        const vy = await app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/text_view4']");
        assert.equal(type, 'FLICK');
        expect(vy.split(' ')[1]).to.be.above(178);
      });

      it('should react on swipeLeft action', async () => {
        await app.click("//android.widget.Button[@resource-id = 'io.selendroid.testapp:id/touchTest']");
        await app.waitForText(
          'Gesture Type', 10,
          "//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']",
        );
        await app.swipeLeft("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']");
        const type = await app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']");
        const vy = await app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/text_view4']");
        assert.equal(type, 'FLICK');
        expect(vy.split(' ')[1]).to.be.below(730);
      });

      it('should react on swipeRight action', async () => {
        await app.click("//android.widget.Button[@resource-id = 'io.selendroid.testapp:id/touchTest']");
        await app.waitForText(
          'Gesture Type', 10,
          "//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']",
        );
        await app.swipeRight("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']");
        const type = await app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']");
        const vy = await app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/text_view4']");
        assert.equal(type, 'FLICK');
        expect(vy.split(' ')[1]).to.be.above(278);
      });
    });
  });

  describe('#pullFile', () => {
    it('should pull file to local machine', function* () {
      const savepath = path.join(__dirname, `/../data/output/testpullfile${new Date().getTime()}.png`);
      return app.pullFile('/storage/emulated/0/DCIM/sauce_logo.png', savepath)
        .then(() => assert.ok(fileExists(savepath), null, 'file does not exists'));
    });
  });


  describe('see text : #see', () => {
    it('should work inside elements @second', () => app.see('EN Button', '~buttonTestCD')
      .then(() => app.see('Hello'))
      .then(() => app.dontSee('Welcome', '~buttonTestCD')));

    it('should work inside web view as normally @quick', function* () {
      yield app.click('~buttonStartWebviewCD');
      yield app.switchToWeb();
      return app.see('Prefered Car:');
    });
  });

  describe('#appendField', () => {
    it('should be able to send special keys to element @second', function* () {
      yield app.click('~startUserRegistrationCD');
      yield app.click('~email of the customer');
      yield app.appendField('~email of the customer', '1');
      yield app.hideDeviceKeyboard('pressKey', 'Done');
      yield app.swipeTo(
        '//android.widget.Button', '//android.widget.ScrollView/android.widget.LinearLayout', 'up', 30,
        100, 700,
      );
      yield app.click('//android.widget.Button');
      return app.see(
        '1',
        '#io.selendroid.testapp:id/label_email_data',
      );
    });
  });

  describe('#seeInSource', () => {
    it('should check for text to be in HTML source', () => app.seeInSource('class="android.widget.Button" package="io.selendroid.testapp" content-desc="buttonTestCD"')
      .then(() => app.dontSeeInSource('<meta')));
  });

  describe('#waitForText', () => {
    it('should return error if not present', () => app.waitForText('Nothing here', 1, '~buttonTestCD')
      .catch((e) => {
        e.should.be.instanceOf(AssertionFailedError);
        e.inspect().should.be.equal('expected element ~buttonTestCD to include "Nothing here"');
      }));
  });

  describe('#seeNumberOfElements @second', () => {
    it('should return 1 as count', () => app.seeNumberOfElements('~buttonTestCD', 1));
  });

  describe('see element : #seeElement, #dontSeeElement', () => {
    it('should check visible elements on page @quick', function* () {
      yield app.seeElement('~buttonTestCD');
      yield app.seeElement('//android.widget.Button[@content-desc = "buttonTestCD"]');
      yield app.dontSeeElement('#something-beyond');
      return app.dontSeeElement('//input[@id="something-beyond"]');
    });
  });

  describe('#click @quick', () => {
    it('should click by accessibility id', function* () {
      return app.click('~startUserRegistrationCD')
        .then(() => app.seeElement('~label_usernameCD'));
    });

    it('should click by xpath', function* () {
      return app.click('//android.widget.ImageButton[@content-desc = "startUserRegistrationCD"]')
        .then(() => app.seeElement('~label_usernameCD'));
    });
  });

  describe('#fillField, #appendField @second', () => {
    it('should fill field by accessibility id', function* () {
      return app.click('~startUserRegistrationCD')
        .then(() => app.fillField('~email of the customer', 'Nothing special'))
        .then(() => app.hideDeviceKeyboard('pressKey', 'Done'))
        .then(() => app.swipeTo(
          '//android.widget.Button', '//android.widget.ScrollView/android.widget.LinearLayout', 'up', 30,
          100, 700,
        ))
        .then(() => app.click('//android.widget.Button'))
        .then(() => app.see(
          'Nothing special',
          '//android.widget.TextView[@resource-id="io.selendroid.testapp:id/label_email_data"]',
        ));
    });

    it('should fill field by xpath', function* () {
      yield app.click('~startUserRegistrationCD');
      yield app.fillField('//android.widget.EditText[@content-desc="email of the customer"]', 'Nothing special');
      yield app.hideDeviceKeyboard('pressKey', 'Done');
      yield app.swipeTo(
        '//android.widget.Button', '//android.widget.ScrollView/android.widget.LinearLayout', 'up', 30,
        100, 700,
      );
      yield app.click('//android.widget.Button');
      yield app.see(
        'Nothing special',
        '//android.widget.TextView[@resource-id="io.selendroid.testapp:id/label_email_data"]',
      );
    });

    it('should append field value @second', function* () {
      yield app.click('~startUserRegistrationCD');
      yield app.fillField('~email of the customer', 'Nothing special');
      yield app.appendField('~email of the customer', 'blabla');
      yield app.hideDeviceKeyboard('pressKey', 'Done');
      yield app.swipeTo(
        '//android.widget.Button', '//android.widget.ScrollView/android.widget.LinearLayout', 'up', 30,
        100, 700,
      );
      yield app.click('//android.widget.Button');
      yield app.see(
        'Nothing specialblabla',
        '//android.widget.TextView[@resource-id="io.selendroid.testapp:id/label_email_data"]',
      );
    });
  });

  describe('#clearField', () => {
    it('should clear a given element', () => app.click('~startUserRegistrationCD')
      .then(() => app.fillField('~email of the customer', 'Nothing special'))
      .then(() => app.see('Nothing special', '~email of the customer'))
      .then(() => app.clearField('~email of the customer'))
      .then(() => app.dontSee('Nothing special', '~email of the customer')));
  });

  describe('#grabTextFrom, #grabValueFrom, #grabAttributeFrom', () => {
    it('should grab text from page', function* () {
      const val = yield app.grabTextFrom('~buttonTestCD');
      assert.equal(val, 'EN Button');
    });

    it('should grab attribute from element', function* () {
      const val = yield app.grabAttributeFrom('~buttonTestCD', 'resourceId');
      return assert.equal(val, 'io.selendroid.testapp:id/buttonTest');
    });
  });

  describe('#saveScreenshot', () => {
    beforeEach(() => {
      global.output_dir = path.join(global.codecept_dir, 'output');
    });

    it('should create a screenshot file in output dir', () => {
      const sec = (new Date()).getUTCMilliseconds();
      return app.saveScreenshot(`screenshot_${sec}`)
        .then(() => assert.ok(fileExists(path.join(output_dir, `screenshot_${sec}`)), null, 'file does not exists'));
    });
  });

  describe('#runOnIOS, #runOnAndroid, #runInWeb', () => {
    it('should use Android locators', () => {
      app.click({ android: '~startUserRegistrationCD', ios: 'fake-element' }).then(() => {
        app.see('Welcome to register a new User');
      });
    });

    it('should execute only on Android @quick', () => {
      let platform = null;
      app.runOnIOS(() => {
        platform = 'ios';
      });
      app.runOnAndroid(() => {
        platform = 'android';
      });
      app.runOnAndroid({ platformVersion: '7.0' }, () => {
        platform = 'android7';
      });

      assert.equal('android', platform);
    });

    it('should execute only on Android >= 5.0 @quick', () => {
      let platform = null;
      app.runOnAndroid(caps => caps.platformVersion >= 5, () => {
        platform = 'android';
      });
    });

    it('should execute only in Web', () => {
      app.isWeb = true;
      let executed = false;
      app.runOnIOS(() => {
        executed = true;
      });
      assert.ok(!executed);
    });
  });
});
