const assert = require('assert');
const expect = require('chai').expect;
const path = require('path');

const Appium = require('../../lib/helper/Appium');
const AssertionFailedError = require('../../lib/assert/error');
const fileExists = require('../../lib/utils').fileExists;

let app;
const apk_path = 'storage:filename=selendroid-test-app-0.17.0.apk';

describe('Appium', function () {
  // this.retries(1);
  this.timeout(0);

  before(async () => {
    global.codecept_dir = path.join(__dirname, '/../data');
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
    await app._beforeSuite();
    app.isWeb = false;
    await app._before();
  });

  after(async () => {
    await app._after();
  });

  describe('app installation : #seeAppIsInstalled, #installApp, #removeApp, #seeAppIsNotInstalled', () => {
    describe(
      '#grabAllContexts, #grabContext, #grabCurrentActivity, #grabNetworkConnection, #grabOrientation, #grabSettings',
      () => {
        it('should grab all available contexts for screen', async () => {
          await app.click('~buttonStartWebviewCD');
          const val = await app.grabAllContexts();
          assert.deepEqual(val, ['NATIVE_APP', 'WEBVIEW_io.selendroid.testapp']);
        });

        it('should grab current context', async () => {
          const val = await app.grabContext();
          assert.equal(val, 'NATIVE_APP');
        });

        it('should grab current activity of app', async () => {
          const val = await app.grabCurrentActivity();
          assert.equal(val, '.HomeScreenActivity');
        });

        it('should grab network connection settings', async () => {
          await app.setNetworkConnection(4);
          const val = await app.grabNetworkConnection();
          assert.equal(val.value, 4);
          assert.equal(val.inAirplaneMode, false);
          assert.equal(val.hasWifi, false);
          assert.equal(val.hasData, true);
        });

        it('should grab orientation', async () => {
          const val = await app.grabOrientation();
          assert.equal(val, 'PORTRAIT');
        });

        it('should grab custom settings', async () => {
          const val = await app.grabSettings();
          assert.deepEqual(val, { ignoreUnimportantViews: false });
        });
      },
    );

    it('should remove App and install it again', async () => {
      await app.seeAppIsInstalled('io.selendroid.testapp');
      await app.removeApp('io.selendroid.testapp');
      await app.seeAppIsNotInstalled('io.selendroid.testapp');
      await app.installApp(apk_path);
      await app.seeAppIsInstalled('io.selendroid.testapp');
    });

    it('should assert when app is/is not installed', async () => {
      try {
        await app.seeAppIsInstalled('io.super.app');
      } catch (e) {
        e.should.be.instanceOf(AssertionFailedError);
        e.inspect().should.include('expected app io.super.app to be installed');
      }

      try {
        await app.seeAppIsNotInstalled('io.selendroid.testapp');
      } catch (e) {
        e.should.be.instanceOf(AssertionFailedError);
        e.inspect().should.include('expected app io.selendroid.testapp not to be installed');
      }
    });
  });

  describe('see seeCurrentActivity: #seeCurrentActivityIs', () => {
    it('should return .HomeScreenActivity for default screen', async () => {
      await app.seeCurrentActivityIs('.HomeScreenActivity');
    });

    it('should assert for wrong screen', async () => {
      try {
        await app.seeCurrentActivityIs('.SuperScreen');
      } catch (e) {
        e.should.be.instanceOf(AssertionFailedError);
        e.inspect().should.include('expected current activity to be .SuperScreen');
      }
    });
  });

  describe('device lock : #seeDeviceIsLocked, #seeDeviceIsUnlocked', () => {
    it('should return correct status about lock @second', async () => {
      await app.seeDeviceIsUnlocked();
      try {
        await app.seeDeviceIsLocked();
      } catch (e) {
        e.should.be.instanceOf(AssertionFailedError);
        e.inspect().should.include('expected device to be locked');
      }
    });
  });

  describe('device orientation : #seeOrientationIs #setOrientation', () => {
    it('should return correct status about lock', async () => {
      await app.seeOrientationIs('PORTRAIT');
      try {
        await app.seeOrientationIs('LANDSCAPE');
      } catch (e) {
        e.should.be.instanceOf(AssertionFailedError);
        e.inspect().should.include('expected orientation to be LANDSCAPE');
      }
    });

    it('should set device orientation', async () => {
      await app.click('~buttonStartWebviewCD');
      await app.setOrientation('LANDSCAPE');
      await app.seeOrientationIs('LANDSCAPE');
    });
  });

  describe('app context and activity: #_switchToContext, #switchToWeb, #switchToNative', () => {
    it('should switch context', async () => {
      await app.click('~buttonStartWebviewCD');
      await app._switchToContext('WEBVIEW_io.selendroid.testapp');
      const val = await app.grabContext();
      return assert.equal(val, 'WEBVIEW_io.selendroid.testapp');
    });

    it('should switch to native and web contexts @quick', async () => {
      await app.click('~buttonStartWebviewCD');
      await app.see('WebView location');
      await app.switchToWeb();
      let val = await app.grabContext();
      assert.equal(val, 'WEBVIEW_io.selendroid.testapp');
      await app.see('Prefered Car');
      assert.ok(app.isWeb);
      await app.switchToNative();
      val = await app.grabContext();
      assert.equal(val, 'NATIVE_APP');
      return assert.ok(!app.isWeb);
    });

    it('should switch activity', async () => {
      await app.startActivity('io.selendroid.testapp', '.RegisterUserActivity');
      const val = await app.grabCurrentActivity();
      assert.equal(val, '.RegisterUserActivity');
    });
  });

  describe('#setNetworkConnection, #setSettings', () => {
    it('should set Network Connection (airplane mode on)', async () => {
      await app.setNetworkConnection(1);
      const val = await app.grabNetworkConnection();
      return assert.equal(val.value, 1);
    });

    it('should set custom settings', async () => {
      await app.setSettings({ cyberdelia: 'open' });
      const val = await app.grabSettings();
      assert.deepEqual(val, { ignoreUnimportantViews: false, cyberdelia: 'open' });
    });
  });

  describe('#hideDeviceKeyboard', () => {
    it('should hide device Keyboard @quick', async () => {
      await app.click('~startUserRegistrationCD');
      try {
        await app.click('//android.widget.CheckBox');
      } catch (e) {
        e.message.should.include('element');
      }
      await app.hideDeviceKeyboard('pressKey', 'Done');
      await app.click('//android.widget.CheckBox');
    });

    it('should assert if no keyboard', async () => {
      try {
        await app.hideDeviceKeyboard('pressKey', 'Done');
      } catch (e) {
        e.message.should.include('An unknown server-side error occurred while processing the command. Original error: Soft keyboard not present, cannot hide keyboard');
      }
    });
  });

  describe('#sendDeviceKeyEvent', () => {
    it('should react on pressing keycode', async () => {
      await app.sendDeviceKeyEvent(3);
      await app.waitForVisible('~Apps');
    });
  });

  describe('#openNotifications', () => {
    it('should react on notification opening', async () => {
      try {
        await app.seeElement('//android.widget.FrameLayout[@resource-id="com.android.systemui:id/quick_settings_container"]');
      } catch (e) {
        e.should.be.instanceOf(AssertionFailedError);
        e.inspect().should.include('expected elements of //android.widget.FrameLayout[@resource-id="com.android.systemui:id/quick_settings_container"] to be seen');
      }
      await app.openNotifications();
      await app.waitForVisible('//android.widget.FrameLayout[@resource-id="com.android.systemui:id/quick_settings_container"]', 10);
    });
  });

  describe('#makeTouchAction', () => {
    it('should react on touch actions', async () => {
      await app.tap('~buttonStartWebviewCD');
      const val = await app.grabCurrentActivity();
      assert.equal(val, '.WebViewActivity');
    });

    it('should react on swipe action', async () => {
      await app.click("//android.widget.Button[@resource-id = 'io.selendroid.testapp:id/touchTest']");
      await app.waitForText(
        'Gesture Type', 10,
        "//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']",
      );
      await app.swipe(
        "//android.widget.LinearLayout[@resource-id = 'io.selendroid.testapp:id/LinearLayout1']", 800,
        1200, 1000,
      );
      const type = await app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']");
      const vx = await app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/text_view3']");
      const vy = await app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/text_view4']");
      assert.equal(type, 'FLICK');
      assert.ok(vx.match(/vx: \d\d000\.0 pps/), 'to be like \d\d000.0 pps');
      assert.ok(vy.match(/vy: \d\d000\.0 pps/), 'to be like \d\d000.0 pps');
    });

    it('should react on swipeDown action', async () => {
      await app.click("//android.widget.Button[@resource-id = 'io.selendroid.testapp:id/touchTest']");
      await app.waitForText(
        'Gesture Type', 10,
        "//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']",
      );
      await app.swipeDown(
        "//android.widget.LinearLayout[@resource-id = 'io.selendroid.testapp:id/LinearLayout1']",
        1200, 1000,
      );
      const type = await app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']");
      const vy = await app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/text_view4']");
      assert.equal(type, 'FLICK');
      assert.ok(vy.match(/vy: \d\d000\.0 pps/), 'to be like \d\d000.0 pps');
    });

    it('run simplified swipeDown @quick', async () => {
      await app.click("//android.widget.Button[@resource-id = 'io.selendroid.testapp:id/touchTest']");
      await app.waitForText(
        'Gesture Type', 10,
        "//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']",
      );
      await app.swipeDown(
        "//android.widget.LinearLayout[@resource-id = 'io.selendroid.testapp:id/LinearLayout1']",
        1200, 1000,
      );
      const type = await app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']");
      assert.equal(type, 'FLICK');
    });

    it('should react on swipeUp action', async () => {
      await app.click("//android.widget.Button[@resource-id = 'io.selendroid.testapp:id/touchTest']");
      await app.waitForText(
        'Gesture Type', 10,
        "//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']",
      );
      await app.swipeUp(
        "//android.widget.LinearLayout[@resource-id = 'io.selendroid.testapp:id/LinearLayout1']", 1200,
        1000,
      );
      const type = await app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']");
      const vy = await app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/text_view4']");
      assert.equal(type, 'FLICK');
      assert.ok(vy.match(/vy: -\d\d000\.0 pps/), 'to be like \d\d000.0 pps');
    });

    it('should react on swipeRight action', async () => {
      await app.click("//android.widget.Button[@resource-id = 'io.selendroid.testapp:id/touchTest']");
      await app.waitForText(
        'Gesture Type', 10,
        "//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']",
      );
      await app.swipeRight(
        "//android.widget.LinearLayout[@resource-id = 'io.selendroid.testapp:id/LinearLayout1']",
        800, 1000,
      );
      const type = await app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']");
      const vy = await app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/text_view3']");
      assert.equal(type, 'FLICK');
      assert.ok(vy.match(/vx: \d\d000\.0 pps/), 'to be like \d\d000.0 pps');
    });

    it('should react on swipeLeft action', async () => {
      await app.click("//android.widget.Button[@resource-id = 'io.selendroid.testapp:id/touchTest']");
      await app.waitForText(
        'Gesture Type', 10,
        "//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']",
      );
      await app.swipeLeft(
        "//android.widget.LinearLayout[@resource-id = 'io.selendroid.testapp:id/LinearLayout1']",
        800, 1000,
      );
      const type = await app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/gesture_type_text_view']");
      const vy = await app.grabTextFrom("//android.widget.TextView[@resource-id = 'io.selendroid.testapp:id/text_view3']");
      assert.equal(type, 'FLICK');
      assert.ok(vy.match(/vx: -\d\d000\.0 pps/), 'to be like 21000.0 pps');
    });

    it('should react on touchPerform action', async () => {
      await app.touchPerform([{
        action: 'press',
        options: {
          x: 100,
          y: 200,
        },
      }, { action: 'release' }]);
      const val = await app.grabCurrentActivity();
      assert.equal(val, '.HomeScreenActivity');
    });

    it('should assert when you dont scroll the document anymore', async () => {
      await app.click('~startUserRegistrationCD');
      try {
        await app.swipeTo(
          '//android.widget.CheckBox', '//android.widget.ScrollView/android.widget.LinearLayout', 'up',
          30, 100, 500,
        );
      } catch (e) {
        e.message.should.include('Scroll to the end and element android.widget.CheckBox was not found');
      }
    });

    it('should react on swipeTo action', async () => {
      await app.click('~startUserRegistrationCD');
      await app.swipeTo(
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
    it('should pull file to local machine', async () => {
      const savepath = path.join(__dirname, `/../data/output/testpullfile${new Date().getTime()}.png`);
      await app.pullFile('/storage/emulated/0/DCIM/sauce_logo.png', savepath);
      assert.ok(fileExists(savepath), null, 'file does not exists');
    });
  });

  describe('see text : #see', () => {
    it('should work inside elements @second', async () => {
      await app.see('EN Button', '~buttonTestCD');
      await app.see('Hello');
      await app.dontSee('Welcome', '~buttonTestCD');
    });

    it('should work inside web view as normally @quick', async () => {
      await app.click('~buttonStartWebviewCD');
      await app.switchToWeb();
      await app.see('Prefered Car:');
    });
  });

  describe('#appendField', () => {
    it('should be able to send special keys to element @second', async () => {
      await app.click('~startUserRegistrationCD');
      await app.click('~email of the customer');
      await app.appendField('~email of the customer', '1');
      await app.hideDeviceKeyboard('pressKey', 'Done');
      await app.swipeTo(
        '//android.widget.Button', '//android.widget.ScrollView/android.widget.LinearLayout', 'up', 30,
        100, 700,
      );
      await app.click('//android.widget.Button');
      await app.see(
        '1',
        '#io.selendroid.testapp:id/label_email_data',
      );
    });
  });

  describe('#seeInSource', () => {
    it('should check for text to be in HTML source', async () => {
      await app.seeInSource('class="android.widget.Button" package="io.selendroid.testapp" content-desc="buttonTestCD"');
      await app.dontSeeInSource('<meta');
    });
  });

  describe('#waitForText', () => {
    it('should return error if not present', async () => {
      try {
        await app.waitForText('Nothing here', 1, '~buttonTestCD');
      } catch (e) {
        e.should.be.instanceOf(AssertionFailedError);
        e.inspect().should.be.equal('expected element ~buttonTestCD to include "Nothing here"');
      }
    });
  });

  describe('#seeNumberOfElements @second', () => {
    it('should return 1 as count', async () => {
      await app.seeNumberOfElements('~buttonTestCD', 1);
    });
  });

  describe('see element : #seeElement, #dontSeeElement', () => {
    it('should check visible elements on page @quick', async () => {
      await app.seeElement('~buttonTestCD');
      await app.seeElement('//android.widget.Button[@content-desc = "buttonTestCD"]');
      await app.dontSeeElement('#something-beyond');
      await app.dontSeeElement('//input[@id="something-beyond"]');
    });
  });

  describe('#click @quick', () => {
    it('should click by accessibility id', async () => {
      await app.click('~startUserRegistrationCD');
      await app.seeElement('~label_usernameCD');
    });

    it('should click by xpath', async () => {
      await app.click('//android.widget.ImageButton[@content-desc = "startUserRegistrationCD"]');
      await app.seeElement('~label_usernameCD');
    });
  });

  describe('#fillField, #appendField @second', () => {
    it('should fill field by accessibility id', async () => {
      await app.click('~startUserRegistrationCD');
      await app.fillField('~email of the customer', 'Nothing special');
      await app.hideDeviceKeyboard('pressKey', 'Done');
      await app.swipeTo(
        '//android.widget.Button', '//android.widget.ScrollView/android.widget.LinearLayout', 'up', 30,
        100, 700,
      );
      await app.click('//android.widget.Button');
      await app.see(
        'Nothing special',
        '//android.widget.TextView[@resource-id="io.selendroid.testapp:id/label_email_data"]',
      );
    });

    it('should fill field by xpath', async () => {
      await app.click('~startUserRegistrationCD');
      await app.fillField('//android.widget.EditText[@content-desc="email of the customer"]', 'Nothing special');
      await app.hideDeviceKeyboard('pressKey', 'Done');
      await app.swipeTo(
        '//android.widget.Button', '//android.widget.ScrollView/android.widget.LinearLayout', 'up', 30,
        100, 700,
      );
      await app.click('//android.widget.Button');
      await app.see(
        'Nothing special',
        '//android.widget.TextView[@resource-id="io.selendroid.testapp:id/label_email_data"]',
      );
    });

    it('should append field value @second', async () => {
      await app.click('~startUserRegistrationCD');
      await app.fillField('~email of the customer', 'Nothing special');
      await app.appendField('~email of the customer', 'blabla');
      await app.hideDeviceKeyboard('pressKey', 'Done');
      await app.swipeTo(
        '//android.widget.Button', '//android.widget.ScrollView/android.widget.LinearLayout', 'up', 30,
        100, 700,
      );
      await app.click('//android.widget.Button');
      await app.see(
        'Nothing specialblabla',
        '//android.widget.TextView[@resource-id="io.selendroid.testapp:id/label_email_data"]',
      );
    });
  });

  describe('#clearField', () => {
    it('should clear a given element', async () => {
      await app.click('~startUserRegistrationCD');
      await app.fillField('~email of the customer', 'Nothing special');
      await app.see('Nothing special', '~email of the customer');
      await app.clearField('~email of the customer');
      await app.dontSee('Nothing special', '~email of the customer');
    });
  });

  describe('#grabTextFrom, #grabValueFrom, #grabAttributeFrom @quick', () => {
    it('should grab text from page', async () => {
      const val = await app.grabTextFrom('~buttonTestCD');
      assert.equal(val, 'EN Button');
    });

    it('should grab attribute from element', async () => {
      const val = await app.grabAttributeFrom('~buttonTestCD', 'resourceId');
      assert.equal(val, 'io.selendroid.testapp:id/buttonTest');
    });

    it('should be able to grab elements', async () => {
      await app.click('~startUserRegistrationCD');
      await app.click('~email of the customer');
      await app.appendField('~email of the customer', '1');
      await app.hideDeviceKeyboard('pressKey', 'Done');
      await app.swipeTo(
        '//android.widget.Button', '//android.widget.ScrollView/android.widget.LinearLayout', 'up', 30,
        100, 700,
      );
      await app.click('//android.widget.Button');
      await app.see(
        '1',
        '#io.selendroid.testapp:id/label_email_data',
      );
      const num = await app.grabNumberOfVisibleElements('#io.selendroid.testapp:id/label_email_data');
      assert.strictEqual(1, num);

      const id = await app.grabNumberOfVisibleElements(
        '//android.widget.TextView[@resource-id="io.selendroid.testapp:id/label_email_data"]',
        'contentDescription',
      );
      assert.strictEqual(1, id);
    });
  });

  describe('#saveScreenshot @quick', () => {
    beforeEach(() => {
      global.output_dir = path.join(global.codecept_dir, 'output');
    });

    it('should create a screenshot file in output dir', async () => {
      const sec = (new Date()).getUTCMilliseconds();
      await app.saveScreenshot(`screenshot_${sec}.png`);
      assert.ok(fileExists(path.join(global.output_dir, `screenshot_${sec}.png`)), null, 'file does not exists');
    });
  });

  describe('#runOnIOS, #runOnAndroid, #runInWeb', () => {
    it('should use Android locators', async () => {
      await app.click({ android: '~startUserRegistrationCD', ios: 'fake-element' });
      await app.see('Welcome to register a new User');
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
      app.runOnAndroid(caps => caps.platformVersion >= 5, () => {});
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
