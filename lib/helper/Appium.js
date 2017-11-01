'use strict';
let webdriverio;
const WebdriverIO = require('./WebDriverIO');
const AssertionFailedError = require('../assert/error');
const empty = require('../assert/empty').empty;
const truth = require('../assert/truth').truth;
const assert = require('assert');
const path = require('path');
const requireg = require('requireg');
const fs = require('fs');
const recorder = require('../recorder');
const isGenerator = require('../utils').isGenerator;
const resumeTest = require('../scenario').resumeTest;


const mobileRoot = '//*';
const webRoot = 'body';

/**
 *  Appium helper extends [WebriverIO](http://codecept.io/helpers/WebDriverIO/) helper.
 *  It supports all browser methods and also includes special methods for mobile apps testing.
 *  You can use this helper to test Web on desktop and mobile devices and mobile apps.
 *
 * ## Appium Installation
 *
 * Appium is an open source test automation framework for use with native, hybrid and mobile web apps that implements the WebDriver protocol.
 * It allows you to run Selenium tests on mobile devices and also test native, hybrid and mobile web apps.
 *
 * Download and install [Appium](http://appium.io/)
 *
 * ```sh
 * npm install -g appium
 * ```
 *
 * Launch the daemon: `appium`
 *
 * ## Helper configuration
 *
 * This helper should be configured in codecept.json or codecept.conf.js
 *
 * * `port`: Appium port
 * * `restart`: restart browser or app between tests (default: true), if set to false cookies will be cleaned but browser window will be kept and for apps nothing will be changed.
 * * `desiredCapabilities`: [], Appium capabilities, see below
 *     * `platformName` - Which mobile OS platform to use
 *     * `appPackage` - Java package of the Android app you want to run
 *     * `appActivity` - Activity name for the Android activity you want to launch from your package.
 *     * `deviceName`: The kind of mobile device or emulator to use
 *     * `platformVersion`: Mobile OS version
 *     * `app` - The absolute local path or remote http URL to an .ipa or .apk file, or a .zip containing one of these. Appium will attempt to install this app binary on the appropriate device first.
 *     * `browserName`: Name of mobile web browser to automate. Should be an empty string if automating an app instead.
 *
 * Example:
 *
 * ```js
 * {
 *   helpers: {
 *       Appium: {
 *           platform: "Android",
 *           desiredCapabilities: {
 *               appPackage: "com.example.android.myApp",
 *               appActivity: "MainActivity",
 *               deviceName: "OnePlus3",
 *               platformVersion: "6.0.1"
 *           }
 *       }
 *     }
 * }
 * ```
 *
 * Additional configuration params can be used from <https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/caps.md>
 *
 * ## Access From Helpers
 *
 * Receive a Appium client from a custom helper by accessing `browser` property:
 *
 * ```js
 * let browser = this.helpers['Appium'].browser
 * ```
 */
class Appium extends WebdriverIO {

  /**
   * Appium Special Methods for Mobile only
   */

  constructor(config) {
    super(config);

    this.isRunning = false;

    webdriverio = requireg('webdriverio');
  }

  _validateConfig(config) {

    if (!(config.app || config.platform) && !config.browser) {
      throw new Error(`
        Appium requires either platform and app or a browser to be set.
        Check your codeceptjs config file to ensure these are set properly
          {
            "helpers": {
              "Appium": {
                "app": "/path/to/app/package"
                "platform": "MOBILE_OS",
              }
            }
          }
      `);
    }

    // set defaults
    this.options = {
      waitForTimeout: 1000, // ms
      port: 4723,
      host: 'localhost',
      desiredCapabilities: {},
      restart: true,
      manualStart: false,
      timeouts: {
        script: 0 // ms
      }
    };

    // override defaults with config
    this.options = Object.assign(this.options, config);

    this.options.baseUrl = this.options.url || this.options.baseUrl;
    this.options.desiredCapabilities.deviceName = this.options.device || this.options.desiredCapabilities.deviceName;
    this.options.desiredCapabilities.browserName = this.options.browser || this.options.desiredCapabilities.browserName;
    this.options.desiredCapabilities.app = this.options.app || this.options.desiredCapabilities.app;
    this.options.desiredCapabilities.platformName = this.options.platform || this.options.desiredCapabilities.platformName;
    this.options.waitForTimeout /= 1000; // convert to seconds


    if (!this.options.app && this.options.desiredCapabilities.browserName) {
      this.isWeb = true;
      this.root = webRoot;
    } else {
      this.isWeb = false;
      this.root = mobileRoot;
    }

    this.platform = null;
    if (this.options.desiredCapabilities.platformName) {
      this.platform = this.options.desiredCapabilities.platformName.toLowerCase();
    }
  }

  static _config() {
    return [{
      name: 'app',
      message: "Application package. Path to file or url",
      default: 'http://localhost'
    }, {
      name: 'platform',
      message: 'Mobile Platform',
      type: "list",
      choices: ['iOS', 'Android'],
      default: 'Android'
    }, {
      name: 'device',
      message: "Device to run tests on",
      default: 'emulator'
    }];
  }

  _startBrowser() {
    if (this.options.multiremote) {
      this.browser = webdriverio.multiremote(this.options.multiremote).init();
    } else {
      this.browser = webdriverio.remote(this.options).init();
    }
    return this.browser.then(() => {
      this.isRunning = true;
      let promisesList = [];
      if (this.options.timeouts && this.isWeb) {
        promisesList.push(this.defineTimeout(this.options.timeouts));
      }
      if (this.options.windowSize === 'maximize' && !this.platform) {
        promisesList.push(this.browser.execute('return [screen.width, screen.height]').then((res) => {
          this.options.defaultWidth = res.value[0];
          this.options.defaultHeight = res.value[1];
          return this.browser.windowHandleSize({
            width: res.value[0],
            height: res.value[1]
          });
        }));
      } else if (this.options.windowSize && this.options.windowSize.indexOf('x') > 0 && !this.platform) {
        let dimensions = this.options.windowSize.split('x');
        this.options.defaultWidth = dimensions[0];
        this.options.defaultHeight = dimensions[1];
        promisesList.push(this.browser.windowHandleSize({
          width: dimensions[0],
          height: dimensions[1]
        }));
      } else if (!this.options.windowSize && !this.platform) {
        promisesList.push(this.browser.windowHandleSize().then((res) => {
          this.options.defaultWidth = res.width;
          this.options.defaultHeight = res.height;
        }));
      }
      return Promise.all(promisesList);
    });
  }

  _after() {
    if (!this.isRunning) return;
    if (this.options.restart) {
      this.isRunning = false;
      return this.browser.end();
    }
    if (this.isWeb && !this.platform) {
      return super._after();
    }
  }

  _withinBegin(context) {
    if (this.isWeb) {
      return super._withinBegin(context);
    }
    if (context === 'webview') {
      return this.switchToWeb();
    }
    if (typeof context === 'object') {
      if (context.web) return this.switchToWeb(context.web);
      if (context.webview) return this.switchToWeb(context.webview);
    }
    return this._switchToContext(context);
  }

  _withinEnd() {
    if (this.isWeb) {
      return super._withinEnd();
    }
    return this.switchToNative();
  }


  /**
   * Execute code only on iOS
   *
   * ```js
   * I.runOnIOS(() => {
   *    I.click('//UIAApplication[1]/UIAWindow[1]/UIAButton[1]');
   *    I.see('Hi, IOS', '~welcome');
   * });
   * ```
   *
   * Additional filter can be applied by checking for capabilities.
   * For instance, this code will be executed only on iPhone 5s:
   *
   *
   * ```js
   * I.runOnIOS({deviceName: 'iPhone 5s'},() => {
   *    // ...
   * });
   * ```
   *
   * @param {*} caps
   * @param {*} fn
   */
  runOnIOS(caps, fn) {
    if (this.platform !== 'ios') return;
    recorder.session.start('iOS-only actions');
    this._runWithCaps(caps, fn);
    recorder.add('restore from iOS session', () => recorder.session.restore());
    return recorder.promise();
  }

  /**
   * Execute code only on iOS
   *
   * ```js
   * I.runOnAndroid(() => {
   *    I.click('io.selendroid.testapp:id/buttonTest');
   * });
   * ```
   *
   * Additional filter can be applied by checking for capabilities.
   * For instance, this code will be executed only on Android 6.0:
   *
   *
   * ```js
   * I.runOnAndroid({platformVersion: '6.0'},() => {
   *    // ...
   * });
   * ```
   *
   * @param {*} caps
   * @param {*} fn
   */
  runOnAndroid(caps, fn) {
    if (this.platform !== 'android') return;
    recorder.session.start('Android-only actions');
    this._runWithCaps(caps, fn);
    recorder.add('restore from Android session', () => recorder.session.restore());
    return recorder.promise();
  }

  /**
   * Execute code only in Web mode.
   *
   * ```js
   * I.runInWeb(() => {
   *    I.waitForElement('#data');
   *    I.seeInCurrentUrl('/data');
   * });
   * ```
   *
   * @param {*} fn
   */
  runInWeb(fn) {
    if (!this.isWeb) return;
    recorder.session.start('Web-only actions');

    let res = fn();
    if (isGenerator(fn)) {
      res.next();
      resumeTest(res);
    }

    recorder.add('restore from Web session', () => recorder.session.restore(), true);
    return recorder.promise();
  }

  _runWithCaps(caps, fn) {
    if (typeof caps === 'object') {
      for (let key in caps) {
        // skip if capabilities do not match
        if (this.config.desiredCapabilities[key] !== caps[key]) {
          return;
        }
      }
    } else {
      fn = caps;
    }

    let res = fn();
    if (isGenerator(fn)) {
      res.next();
      resumeTest(res);
    }
  }


  /**
   * Check if an app is installed.
   *
   * ```js
   * I.seeAppIsInstalled("com.example.android.apis");
   * ```
   *
   * @param bundleId	String	ID of bundled app
   *
   * Appium: support only Android
   */
  seeAppIsInstalled(bundleId) {
    onlyForApps.call(this, "Android");
    return this.browser.isAppInstalled(bundleId).then(function (res) {
      return truth(`app ${bundleId}`, 'to be installed').assert(res.value);
    });
  }

  /**
   * Check if an app is not installed.
   *
   * ```js
   * I.seeAppIsNotInstalled("com.example.android.apis");
   * ```
   *
   * @param bundleId	String	ID of bundled app
   *
   * Appium: support only Android
   */
  seeAppIsNotInstalled(bundleId) {
    onlyForApps.call(this, "Android");
    return this.browser.isAppInstalled(bundleId).then(function (res) {
      return truth(`app ${bundleId}`, 'to be installed').negate(res.value);
    });
  }

  /**
   * Install an app on device.
   *
   * ```js
   * I.installApp('/path/to/file.apk');
   * ```
   * @param path path to apk file
   *
   * Appium: support only Android
   */
  installApp(path) {
    onlyForApps.call(this, "Android");
    return this.browser.installApp(path);
  }

  /**
   * Remove an app from the device.
   *
   * ```js
   * I.removeApp('com.example.android.apis');
   * ```
   * @param bundleId	String	ID of bundled app
   *
   * Appium: support only Android
   */
  removeApp(bundleId) {
    onlyForApps.call(this, "Android");
    return this.browser.removeApp(bundleId);
  }

  /**
   * Check current activity on an Android device.
   *
   * ```js
   * I.seeCurrentActivityIs(".HomeScreenActivity")
   * ```
   *
   * Appium: support only Android
   */
  seeCurrentActivityIs(currentActivity) {
    onlyForApps.call(this, "Android");
    return this.browser.currentActivity().then(function (res) {
      return truth('current activity', `to be ${currentActivity}`).assert(res.value === currentActivity);
    });
  }

  /**
   * Check whether the device is locked.
   *
   * ```js
   * I.seeDeviceIsLocked();
   * ```
   *
   * Appium: support only Android
   */
  seeDeviceIsLocked() {
    onlyForApps.call(this, "Android");
    return this.browser.isLocked().then(function (res) {
      return truth('device', 'to be locked').assert(res.value);
    });
  }

  /**
   * Check whether the device is not locked.
   *
   * ```js
   * I.seeDeviceIsUnlocked();
   * ```
   *
   * Appium: support only Android
   */
  seeDeviceIsUnlocked() {
    onlyForApps.call(this, "Android");
    return this.browser.isLocked().then(function (res) {
      return truth('device', 'to be locked').negate(res.value);
    });
  }

  /**
   * Check the device orientation
   *
   * ```js
   * I.seeOrientationIs('PORTRAIT');
   * I.seeOrientationIs('LANDSCAPE')
   * ```
   *
   * @param orientation LANDSCAPE or PORTRAIT
   *
   * Appium: support Android and iOS
   */
  seeOrientationIs(orientation) {
    onlyForApps.call(this);
    return this.browser.orientation().then(function (res) {
      return truth('orientation', `to be ${orientation}`).assert(res.value === orientation);
    });
  }

  /**
   * Set a device orientation. Will fail, if app will not set orientation
   *
   * ```js
   * I.setOrientation('PORTRAIT');
   * I.setOrientation('LANDSCAPE')
   * ```
   *
   * @param orientation LANDSCAPE or PORTRAIT
   *
   * Appium: support Android and iOS
   */
  setOrientation(orientation) {
    onlyForApps.call(this);
    return this.browser.setOrientation(orientation);
  }

  /**
   * Get list of all available contexts
   *
   * ```
   * let contexts = yield I.grabAllContexts();
   * ```
   *
   * Appium: support Android and iOS
   */
  grabAllContexts() {
    onlyForApps.call(this);
    return this.browser.contexts().then(function (res) {
      return res.value;
    });
  }

  /**
   * Retrieve current context
   *
   * ```js
   * let context = yield I.grabContext();
   * ```
   *
   * Appium: support Android and iOS
   */
  grabContext() {
    onlyForApps.call(this);
    return this.browser.context().then(function (res) {
      return res.value;
    });
  }

  /**
   * Get current device activity.
   *
   * ```js
   * let activity = yield I.grabCurrentActivity();
   * ```
   *
   * Appium: support only Android
   */
  grabCurrentActivity() {
    onlyForApps.call(this, "Android");
    return this.browser.getCurrentDeviceActivity();
  }

  /**
   * Get information about the current network connection (Data/WIFI/Airplane).
   * The actual server value will be a number. However WebdriverIO additional
   * properties to the response object to allow easier assertions.
   *
   * ```js
   * let con = yield I.grabNetworkConnection();
   * ```
   *
   * Appium: support only Android
   */
  grabNetworkConnection() {
    onlyForApps.call(this, "Android");
    return this.browser.getNetworkConnection().then(function (res) {
      return {
        value: res.value,
        inAirplaneMode: res.inAirplaneMode,
        hasWifi: res.hasWifi,
        hasData: res.hasData
      };
    });
  }

  /**
   * Get current orientation.
   *
   * ```js
   * let orientation = yield I.grabOrientation();
   * ```
   *
   * Appium: support Android and iOS
   */
  grabOrientation() {
    onlyForApps.call(this);
    return this.browser.orientation().then(function (res) {
      return res.value;
    });
  }

  /**
   * Get all the currently specified settings.
   *
   * ```js
   * let settings = yield I.grabSettings();
   * ```
   *
   * Appium: support Android and iOS
   */
  grabSettings() {
    onlyForApps.call(this);
    return this.browser.settings().then(function (res) {
      return res.value;
    });
  }

  /**
   * Switch to the specified context.
   *
   * @param context the context to switch to

   */
  _switchToContext(context) {
    return this.browser.context(context);
  }

  /**
   * Switches to web context.
   * If no context is provided switches to the first detected web context
   *
   * ```js
   * // switch to first web context
   * I.switchToWeb();
   *
   * // or set the context explicitly
   * I.switchToWeb('WEBVIEW_io.selendroid.testapp');
   * ```
   *
   * @param {string} [context]
   */
  switchToWeb(context) {
    this.isWeb = true;
    this.defaultContext = 'body';

    if (context) return this._switchToContext(context);
    return this.grabAllContexts().then((contexts) => {
      for (let idx in contexts) {
        if (contexts[idx].match(/^WEBVIEW/)) return this._switchToContext(contexts[idx]);
      }

      throw new Error("No WEBVIEW could be guessed, please specify one in params");
    });
  }

  /**
   * Switches to native context.
   * By default switches to NATIVE_APP context unless other specified.
   *
   * ```js
   * I.switchToNative();
   *
   * // or set context explicitly
   * I.switchToNative('SOME_OTHER_CONTEXT');
   * ```
   * @param {*} context
   */
  switchToNative(context = null) {
    this.isWeb = false;
    this.defaultContext = '//*';

    if (context) return this._switchToContext(context);
    return this._switchToContext('NATIVE_APP');
  }

  /**
   * Start an arbitrary Android activity during a session.
   *
   * ```js
   * I.startActivity('io.selendroid.testapp', '.RegisterUserActivity');
   * ```
   *
   * Appium: support only Android
   */
  startActivity(appPackage, appActivity) {
    onlyForApps.call(this, "Android");
    return this.browser.startActivity(appPackage, appActivity);
  }

  /**
   * Set network connection mode.
   *
   * * airplane mode
   * * wifi mode
   * * data data
   *
   * ```js
   * I.setNetworkConnection(0) // airplane mode off, wifi off, data off
   * I.setNetworkConnection(1) // airplane mode on, wifi off, data off
   * I.setNetworkConnection(2) // airplane mode off, wifi on, data off
   * I.setNetworkConnection(4) // airplane mode off, wifi off, data on
   * I.setNetworkConnection(6) // airplane mode off, wifi on, data on
   * ```
   * See corresponding [webdriverio reference](http://webdriver.io/api/mobile/setNetworkConnection.html).
   *
   * Appium: support only Android
   */
  setNetworkConnection(value) {
    onlyForApps.call(this, "Android");
    return this.browser.setNetworkConnection(value);
  }

  /**
   * Update the current setting on the device
   *
   * ```js
   * I.setSettings({cyberdelia: 'open'});
   * ```
   *
   * @param settings object
   *
   * Appium: support Android and iOS
   */
  setSettings(settings) {
    onlyForApps.call(this);
    return this.browser.settings(settings);
  }

  /**
   * Hide the keyboard.
   *
   * ```js
   * // taps outside to hide keyboard per default
   * I.hideDeviceKeyboard();
   * I.hideDeviceKeyboard('tapOutside');
   *
   * // or by pressing key
   * I.hideDeviceKeyboard('pressKey', 'Done');
   * ```
   *
   * @param	strategy	desired strategy to close keyboard (‘tapOutside’ or ‘pressKey’)
   *
   * Appium: support Android and iOS
   */
  hideDeviceKeyboard(strategy, key) {
    onlyForApps.call(this);
    strategy = strategy || 'tapOutside';
    return this.browser.hideDeviceKeyboard(strategy, key);
  }

  /**
   * Send a key event to the device.
   * List of keys: https://developer.android.com/reference/android/view/KeyEvent.html
   *
   * ```js
   * I.sendDeviceKeyEvent(3);
   * ```
   *
   * @param keyValue	Device specific key value
   *
   * Appium: support only Android
   */
  sendDeviceKeyEvent(keyValue) {
    onlyForApps.call(this, "Android");
    return this.browser.deviceKeyEvent(keyValue);
  }

  /**
   * Open the notifications panel on the device.
   *
   * ```js
   * I.openNotifications();
   * ```
   *
   * Appium: support only Android
   */
  openNotifications() {
    onlyForApps.call(this, "Android");
    return this.browser.openNotifications();
  }

  /**
   * The Touch Action API provides the basis of all gestures that can be
   * automated in Appium. At its core is the ability to chain together ad hoc
   * individual actions, which will then be applied to an element in the
   * application on the device.
   * [See complete documentation](http://webdriver.io/api/mobile/touchAction.html)
   *
   * ```js
   * I.makeTouchAction("~buttonStartWebviewCD", 'tap');
   * ```
   *
   * Appium: support Android and iOS
   */
  makeTouchAction(locator, action) {
    onlyForApps.call(this);
    return this.browser.touchAction(parseLocator.call(this, locator), action);
  }

  /**
   * Taps on element.
   *
   * ```js
   * I.tap("~buttonStartWebviewCD");
   * ```
   *
   * Shortcut for `makeTouchAction`
   *
   * @param {*} locator
   */
  tap(locator) {
    return this.makeTouchAction(locator, 'tap');
  }

  /**
   * Perform a swipe on the screen or an element.
   *
   * ```js
   * let locator = "#io.selendroid.testapp:id/LinearLayout1";
   * I.swipe(locator, 800, 1200, 1000);
   * ```
   *
   * [See complete reference](http://webdriver.io/api/mobile/swipe.html)
   *
   * @param locator
   * @param xoffset
   * @param yoffset
   * @param speed (optional), 1000 by default
   *
   * Appium: support Android and iOS
   */
  swipe(locator, xoffset, yoffset, speed = 1000) {
    onlyForApps.call(this);
    return this.browser.swipe(parseLocator.call(this, locator), xoffset, yoffset, speed);
  }

  /**
   * Perform a swipe down on an element.
   *
   * ```js
   * let locator = "#io.selendroid.testapp:id/LinearLayout1";
   * I.swipeDown(locator); // simple swipe
   * I.swipeDown(locator, 500); // set speed
   * I.swipeDown(locator, 1200, 1000); // set offset and speed
   * ```
   *
   * @param locator
   * @param yoffset (optional)
   * @param speed (optional), 1000 by default
   *
   * Appium: support Android and iOS
   */
  swipeDown(locator, yoffset = 1000, speed) {
    onlyForApps.call(this);
    return this.browser.swipeDown(parseLocator.call(this, locator), yoffset, speed);
  }

  /**
   * Perform a swipe left on an element.
   *
   * ```js
   * let locator = "#io.selendroid.testapp:id/LinearLayout1";
   * I.swipeLeft(locator); // simple swipe
   * I.swipeLeft(locator, 500); // set speed
   * I.swipeLeft(locator, 1200, 1000); // set offset and speed
   * ```
   *
   * @param locator
   * @param xoffset (optional)
   * @param speed (optional), 1000 by default
   *
   * Appium: support Android and iOS
   */
  swipeLeft(locator, xoffset = 1000, speed) {
    onlyForApps.call(this);
    return this.browser.swipeLeft(parseLocator.call(this, locator), xoffset, speed);
  }

  /**
   * Perform a swipe right on an element.
   *
   * ```js
   * let locator = "#io.selendroid.testapp:id/LinearLayout1";
   * I.swipeRight(locator); // simple swipe
   * I.swipeRight(locator, 500); // set speed
   * I.swipeRight(locator, 1200, 1000); // set offset and speed
   * ```
   *
   * @param locator
   * @param xoffset (optional)
   * @param speed (optional), 1000 by default
   *
   * Appium: support Android and iOS
   */
  swipeRight(locator, xoffset = 1000, speed) {
    onlyForApps.call(this);
    return this.browser.swipeRight(parseLocator.call(this, locator), xoffset, speed);
  }

  /**
   * Perform a swipe up on an element.
   *
   * ```js
   * let locator = "#io.selendroid.testapp:id/LinearLayout1";
   * I.swipeUp(locator); // simple swipe
   * I.swipeUp(locator, 500); // set speed
   * I.swipeUp(locator, 1200, 1000); // set offset and speed
   * ```
   *
   * @param locator
   * @param yoffset (optional)
   * @param speed (optional), 1000 by default
   *
   * Appium: support Android and iOS
   */
  swipeUp(locator, yoffset = 1000, speed) {
    onlyForApps.call(this);
    return this.browser.swipeUp(parseLocator.call(this, locator), yoffset, speed);
  }

  /**
   * Perform a swipe in selected direction on an element to searchable element.
   *
   * ```js
   * I.swipeTo(
   *  "android.widget.CheckBox", // searchable element
   *  "//android.widget.ScrollView/android.widget.LinearLayout", // scroll element
   *   "up", // direction
   *    30,
   *    100,
   *    500);
   * ```
   *
   * @param searchableLocator
   * @param scrollLocator
   * @param direction
   * @param timeout
   * @param offset
   * @param speed
   *
   * Appium: support Android and iOS
   */
  swipeTo(searchableLocator, scrollLocator, direction, timeout, offset, speed) {
    onlyForApps.call(this);
    direction = direction || 'down';
    switch (direction) {
    case 'down':
      direction = 'swipeDown';
      break;
    case 'up':
      direction = 'swipeUp';
      break;
    case 'left':
      direction = 'swipeLeft';
      break;
    case 'right':
      direction = 'swipeRight';
      break;
    }
    timeout = timeout || this.options.waitForTimeout;

    var errorMsg = 'element ("' + searchableLocator + '") still not visible after ' + timeout + 'seconds';
    let browser = this.browser;
    let err = false;
    let currentSource;
    return browser.waitUntil(function () {
      if (err) {
        return new Error('Scroll to the end and element ' + searchableLocator + ' was not found');
      } else {
        return browser.isVisible(parseLocator.call(this, searchableLocator))
          .then(function (res) {
            if (res) {
              return true;
            } else {
              return browser[direction](scrollLocator, offset, speed).getSource().then((source) => {
                if (source === currentSource) {
                  err = true;
                } else {
                  currentSource = source;
                  return false;
                }
              });
            }
          });
      }
    }, timeout * 1000, errorMsg)
      .catch((e) => {
        if (e.type === 'WaitUntilTimeoutError' && e.message !== 'timeout' && e.type !== 'NoSuchElement') {
          throw new AssertionFailedError({customMessage: 'Scroll to the end and element ' + searchableLocator + ' was not found'}, '');
        } else {
          throw e;
        }
      });

  }

  /**
   * Performs a specific touch action.
   * The action object need to contain the action name, x/y coordinates
   *
   * ```js
   * I.touchPerform([{
   *     action: 'press',
   *     options: {
   *       x: 100,
   *       y: 200
   *     }
   * }, {action: 'release'}])
   *
   * I.touchPerform([{
   *    action: 'tap',
   *    options: {
   *        element: '1', // json web element was queried before
   *        x: 10,   // x offset
   *        y: 20,   // y offset
   *        count: 1 // number of touches
   *    }
   * }]);
   * ```
   *
   * Appium: support Android and iOS
   */
  touchPerform(actions) {
    onlyForApps.call(this);
    return this.browser.touchPerform(actions);
  }

  /**
   * Pulls a file from the device.
   *
   * ```js
   * I.pullFile('/storage/emulated/0/DCIM/logo.png', 'my/path');
   * // save file to output dir
   * I.pullFile('/storage/emulated/0/DCIM/logo.png', output_dir);
   * ```
   *
   * Appium: support Android and iOS
   */
  pullFile(path, dest) {
    onlyForApps.call(this);
    return this.browser.pullFile(path).then(function (res) {
      return fs.writeFile(dest, Buffer.from(res.value, 'base64'), function (err) {
        if (err) {
          return false;
        }
        return true;
      });
    });
  }

  /**
   * Perform a shake action on the device.
   *
   * ```js
   * I.shakeDevice();
   * ```
   *
   * Appium: support only iOS
   */
  shakeDevice() {
    onlyForApps.call(this, "iOS");
    return this.browser.shake();
  }

  /**
   * Perform a rotation gesture centered on the specified element.
   *
   * ```js
   * I.rotate(120, 120)
   * ```
   *
   * See corresponding [webdriverio reference](http://webdriver.io/api/mobile/rotate.html).
   *
   * Appium: support only iOS
   */
  rotate(x, y, duration, radius, rotation, touchCount) {
    onlyForApps.call(this, "iOS");
    return this.browser.rotate(x, y, duration, radius, rotation, touchCount);
  }

  /**
   * Set immediate value in app.
   *
   * See corresponding [webdriverio reference](http://webdriver.io/api/mobile/setImmediateValue.html).
   *
   * Appium: support only iOS
   */
  setImmediateValue(id, value) {
    onlyForApps.call(this, "iOS");
    return this.browser.setImmediateValue(id, value);
  }

  /**
   * Simulate Touch ID with either valid (match == true) or invalid (match == false) fingerprint.
   *
   * ```js
   * I.touchId(); // simulates valid fingerprint
   * I.touchId(true); // simulates valid fingerprint
   * I.touchId(false); // simulates invalid fingerprint
   * ```
   *
   * Appium: support only iOS
   * TODO: not tested
   */
  simulateTouchId(match) {
    onlyForApps.call(this, "iOS");
    match = match || true;
    return this.browser.touchId(match);
  }

  /**
   * Close the given application.
   *
   * ```js
   * I.closeApp();
   * ```
   *
   * Appium: support only iOS
   */
  closeApp() {
    onlyForApps.call(this, "iOS");
    return this.browser.closeApp();
  }

  /**
   * {{> ../webapi/appendField }}
   *
   */
  appendField(field, value) {
    if (this.isWeb) return super.appendField(field, value);
    return super.appendField(parseLocator.call(this, field), value);
  }

  /**
   * {{> ../webapi/checkOption }}
   *
   */
  checkOption(checkbox) {
    if (this.isWeb) return super.checkOption(checkbox);
    return super.checkOption(parseLocator.call(this, checkbox));
  }

  /**
   * {{> ../webapi/click }}
   *
   */
  click(button, context) {
    if (this.isWeb) return super.click(button, context);
    return super.click(parseLocator.call(this, button), parseLocator.call(this, context));
  }

  /**
   * {{> ../webapi/dontSeeCheckboxIsChecked }}
   *
   */
  dontSeeCheckboxIsChecked(checkbox) {
    if (this.isWeb) return super.dontSeeCheckboxIsChecked(checkbox);
    return super.dontSeeCheckboxIsChecked(parseLocator.call(this, checkbox));
  }

  /**
   * {{> ../webapi/dontSeeElement }}
   *
   */
  dontSeeElement(el, context) {
    if (this.isWeb) return super.dontSeeElement(el);
    return super.dontSeeElement(parseLocator.call(this, el));
  }

  /**
   * {{> ../webapi/dontSeeInField }}
   *
   */
  dontSeeInField(field, value) {
    if (this.isWeb) return super.dontSeeInField(field, value);
    return super.dontSeeInField(parseLocator.call(this, field), value);
  }


  /**
   * {{> ../webapi/dontSee }}
   *
   */
  dontSee(text, context) {
    if (this.isWeb) return super.dontSee(text, context);
    return super.dontSee(text, parseLocator.call(this, context));
  }

  /**
   * {{> ../webapi/fillField }}
   *
   */
  fillField(field, value) {
    if (this.isWeb) return super.fillField(field, value);
    return super.fillField(parseLocator.call(this, field), value);
  }

  /**
   * {{> ../webapi/grabTextFrom }}
   *
   */
  grabTextFrom(el) {
    if (this.isWeb) return super.grabTextFrom(el);
    return super.grabTextFrom(parseLocator.call(this, el));
  }

  /**
   * {{> ../webapi/grabValueFrom }}
   *
   */
  grabValueFrom(el) {
    if (this.isWeb) return super.grabValueFrom(el);
    return super.grabValueFrom(parseLocator.call(this, el));
  }

  /**
   * {{> ../webapi/seeCheckboxIsChecked }}
   *
   */
  seeCheckboxIsChecked(checkbox) {
    if (this.isWeb) return super.seeCheckboxIsChecked(checkbox);
    return super.seeCheckboxIsChecked(parseLocator.call(this, checkbox));
  }

  /**
   * {{> ../webapi/seeElement }}
   *
   */
  seeElement(el) {
    if (this.isWeb) return super.seeElement(el);
    return super.seeElement(parseLocator.call(this, el));
  }

  /**
   * {{> ../webapi/seeInField }}
   *
   */
  seeInField(field, value) {
    if (this.isWeb) return super.seeInField(field, value);
    return super.seeInField(parseLocator.call(this, field), value);
  }

  /**
   * {{> ../webapi/see }}
   *
   */
  see(text, context) {
    if (this.isWeb) return super.see(text, context);
    return super.see(text, parseLocator.call(this, context));
  }

  /**
   * {{> ../webapi/selectOption }}
   *
   * Support only web testing!
   *
   */
  selectOption(select, option) {
    if (this.isWeb) return super.selectOption(select, option);
    throw new Error(`Should be used only in Web context. In native context use 'click' method instead`);
  }
}

function parseLocator(locator) {
  if (!locator) return null;
  if (typeof locator === 'string') {
    if (locator.substr(0, 2) === '//') return locator;
    if (locator[0] === '~') return locator;

    if (locator[0] === '#' && !this.isWeb) {
      // hook before webdriverio supports native # locators
      return parseLocator.call(this, { id: locator.slice(1) });
    }
    if (this.platform === 'android' && !this.isWeb) {
      return `android=new UiSelector().text("${locator}")`;
    }
  }

  if (typeof locator !== 'object') return locator;

  if (locator.web && this.isWeb) {
    return parseLocator.call(this, locator.web);
  }

  if (locator.android && this.platform === 'android') {
    return parseLocator.call(this, locator.android);
  }

  if (locator.ios && this.platform === 'ios') {
    return parseLocator.call(this, locator.ios);
  }

  let key = Object.keys(locator)[0];
  let value = locator[key];

  locator.toString = () => `{${key}: '${value}'}`;

  switch (key) {
  case 'by':
  case 'xpath':
    return value;
  case 'css':
    if (this.isWeb) {
      return value;
    } else {
      throw new Error(
          `Unable to use css locators in apps. Locator strategies for this request: xpath, id, class name or accessibility id`);
    }
  case 'id':
    if (!this.isWeb && this.platform === 'android') {
      return `//*[@resource-id='${value}']`;
    }
    return '#' + value;
  case 'name':
    if (!this.isWeb) {
      throw new Error("Can't locate element by name in Native context. Use either ID, class name or accessibility id");
    }
    return `[name="${value}"]`;
  }
}

// in the end of a file
function onlyForApps(expectedPlatform) {
  var callerName;
  let stack = new Error().stack || '';
  let re = /Appium.(\w+)/g;
  let caller = stack.split('\n')[2].trim();
  let m = re.exec(caller);

  if (!m) {
    throw new Error(`Invalid caller ${caller}`);
  }

  callerName = m[1] || m[2];
  if (!expectedPlatform) {
    if (!this.platform) {
      throw new Error(`${callerName} method can be used only with apps`);
    }
  } else {
    if (this.platform !== expectedPlatform.toLowerCase()) {
      throw new Error(`${callerName} method can be used only with ${expectedPlatform} apps`);
    }
  }
}


module.exports = Appium;
