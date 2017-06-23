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

let browserCap;

/**
 *  Appium helper extends [WebriverIO](http://codecept.io/helpers/WebDriverIO/) helper.
 *  It supports all browser methods and also includes special methods for mobile apps testing.
 *  You can use this helper to test Web on desktop and mobile devices and mobile apps.
 *
 * #### Appium Installation
 *
 * Appium is an open source test automation framework for use with native, hybrid and mobile web apps that implements the WebDriver protocol.
 * It allows you to run Selenium tests on mobile devices and also test native, hybrid and mobile web apps.
 *
 * Download and install [Appium](http://appium.io/)
 *
 * ```
 * npm install -g appium
 * ```
 *
 * Launch the daemon: `appium`
 *
 * ### Configuration
 *
 * This helper should be configured in codecept.json or codecept.conf.js
 *
 * #### Appium configuration
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
 *           desiredCapabilities: {
 *               platformName: "Android",
 *               appPackage: "com.example.android.myApp",
 *               appActivity: "MainActivity",
 *               deviceName: "OnePlus3",
 *               platformVersion: "6.0.1"
 *           },
 *           port: 4723,
 *           restart: false
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
    webdriverio = requireg('webdriverio');

    // set defaults
    this.options = {
      waitForTimeout: 1000, // ms
      desiredCapabilities: {},
      restart: true,
      manualStart: false,
      timeouts: {
        script: 0 // ms
      }
    };

    // override defaults with config
    Object.assign(this.options, config);

    this.options.baseUrl = this.options.url || this.options.baseUrl;
    this.options.desiredCapabilities.browserName = this.options.browser || this.options.desiredCapabilities.browserName;
    browserCap = this.options.desiredCapabilities.browserName;
    this.options.waitForTimeout /= 1000; // convert to seconds


  }


  _startBrowser() {
    if (this.options.multiremote) {
      this.browser = webdriverio.multiremote(this.options.multiremote).init();
    } else {
      this.browser = webdriverio.remote(this.options).init();
    }

    if (this.options.timeouts && browserCap) {
      this.defineTimeout(this.options.timeouts);
    }

    if (this.options.windowSize === 'maximize') {
      this.browser.windowHandleMaximize(false);
    }
    if (this.options.windowSize && this.options.windowSize.indexOf('x') > 0) {
      let dimensions = this.options.windowSize.split('x');
      this.browser.windowHandleSize({
        width: dimensions[0],
        height: dimensions[1]
      });
    }
    return this.browser;
  }

  _after() {
    if (this.options.restart) return this.browser.end();
    if (this.options.desiredCapabilities.browserName) {
      this.debugSection('Session', 'cleaning cookies and localStorage');
      return this.browser.execute('localStorage.clear();').then(() => {
        return this.browser.deleteCookie();
      });
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
      return truth('current activity', `to be ${currentActivity}`).assert(res.value == currentActivity);
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
      return truth('orientation', `to be ${orientation}`).assert(res.value == orientation);
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
   * ```js
   * I.switchToContext('WEBVIEW_io.selendroid.testapp');
   * ```
   *
   * @param context the context to switch to
   *
   * Appium: support only Android
   */
  switchToContext(context) {
    onlyForApps.call(this, "Android");
    return this.browser.context(context);
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
   * @param keyValue	Device specifc key value
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
    return this.browser.touchAction(withStrictLocator(locator), action);
  }

  /**
   * Perform a swipe on the screen or an element.
   *
   * ```js
   * let locator = "//android.widget.LinearLayout[@resource-id = 'io.selendroid.testapp:id/LinearLayout1']";
   * I.swipe(locator, 800, 1200, 1000);
   * ```
   *
   * [See complete reference](http://webdriver.io/api/mobile/swipe.html)
   *
   * @param locator
   * @param xoffset
   * @param yoffset
   * @param speed
   *
   * Appium: support Android and iOS
   */
  swipe(locator, xoffset, yoffset, speed) {
    onlyForApps.call(this);
    return this.browser.swipe(withStrictLocator(locator), xoffset, yoffset, speed);
  }

  /**
   * Perform a swipe down on an element.
   *
   * ```js
   * let locator = "//android.widget.LinearLayout[@resource-id = 'io.selendroid.testapp:id/LinearLayout1']";
   * I.swipeDown(locator, 1200, 1000);
   * ```
   *
   * @param locator
   * @param yoffset (optional)
   * @param speed
   *
   * Appium: support Android and iOS
   */
  swipeDown(locator, yOffset, speed) {
    onlyForApps.call(this);
    return this.browser.swipeDown(withStrictLocator(locator), yOffset, speed);
  }

  /**
   * Perform a swipe left on an element.
   *
   * ```js
   * let locator = "//android.widget.LinearLayout[@resource-id = 'io.selendroid.testapp:id/LinearLayout1']";
   * I.swipeLeft(locator, 800, 1000);
   * ```
   *
   * @param locator
   * @param xoffset (optional)
   * @param speed
   *
   * Appium: support Android and iOS
   */
  swipeLeft(locator, xoffset, speed) {
    onlyForApps.call(this);
    return this.browser.swipeLeft(withStrictLocator(locator), xoffset, speed);
  }

  /**
   * Perform a swipe left on an element.
   *
   * ```js
   * let locator = "//android.widget.LinearLayout[@resource-id = 'io.selendroid.testapp:id/LinearLayout1']";
   * I.swipeRight(locator, 800, 1000);
   * ```
   *
   * @param locator
   * @param xoffset (optional)
   * @param speed
   *
   * Appium: support Android and iOS
   */
  swipeRight(locator, xoffset, speed) {
    onlyForApps.call(this);
    return this.browser.swipeRight(withStrictLocator(locator), xoffset, speed);
  }

  /**
   * Perform a swipe down on an element.
   *
   * ```js
   * let locator = "//android.widget.LinearLayout[@resource-id = 'io.selendroid.testapp:id/LinearLayout1']";
   * I.swipeUp(locator, 1200, 1000);
   * ```
   *
   * @param locator
   * @param yoffset (optional)
   * @param speed
   *
   * Appium: support Android and iOS
   */
  swipeUp(locator, yOffset, speed) {
    onlyForApps.call(this);
    return this.browser.swipeUp(withStrictLocator(locator), yOffset, speed);
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
        return new Error('Scroll to the end and element ' + seachableLocator + ' was not found');
      } else {
        return browser.isVisible(withStrictLocator(searchableLocator))
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
        if (e.type === 'WaitUntilTimeoutError' && e.message != 'timeout' && e.type != 'NoSuchElement') {
          throw new AssertionFailedError({customMessage: 'Scroll to the end and element ' + seachableLocator + ' was not found'}, '');
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

}

function isCSSorXPathLocator(locator) {
  if (locator[0] === '#' || locator[0] === '.') {
    if (browserCap) {
      return true;
    } else {
      throw new Error(
        `Unable to use css locators in apps. Locator strategies for this request: xpath, id, class name`);
    }
  }
  if (locator.substr(0, 2) === '//') {
    return true;
  }
  return false;
}

function withStrictLocator(locator) {
  if (!locator) return null;
  if (isCSSorXPathLocator(locator)) return locator;
  if (typeof locator !== 'object') return locator;
  let key = Object.keys(locator)[0];
  let value = locator[key];

  locator.toString = () => `{${key}: '${value}'}`;

  switch (key) {
  case 'by':
  case 'xpath':
    return value;
  case 'css':
    if (browserCap) {
      return value;
    } else {
      throw new Error(
          `Unable to use css locators in apps. Locator strategies for this request: xpath, id, class name or accessibility id`);
    }
  case 'id':
    return '#' + value;
  case 'name':
    return `[name="${value}"]`;
  }
}

// in the end of a file
function onlyForApps(platformName) {
  var callerName;
  var stack = new Error().stack,
    re = /Appium.(\w+)/g,
    caller = stack.split('\n')[2].trim(),
    m = re.exec(caller);
  callerName = m[1] || m[2];
  if (!platformName) {
    if (!this.options.desiredCapabilities.platformName) {
      throw new Error(`${callerName} method can be used only with apps`);
    }
  } else {
    if (this.options.desiredCapabilities.platformName != platformName) {
      throw new Error(`${callerName} method can be used only with ${platformName} apps`);
    }
  }
}


module.exports = Appium;

// docs for inherited methods

/**
 * {{> ../webapi/appendField }}
 *
 * @name appendField
 * @kind function
 * @memberof Appium
 * @scope instance
 */
var _appendField;

/**
 * {{> ../webapi/checkOption }}
 *
 * @name checkOption
 * @kind function
 * @memberof Appium
 * @scope instance
 */
var _checkOption;

/**
 * {{> ../webapi/click }}
 *
 * @name click
 * @kind function
 * @memberof Appium
 * @scope instance
 */
var _click;

/**
 * {{> ../webapi/dontSeeCheckboxIsChecked }}
 *
 * @name dontSeeCheckboxIsChecked
 * @kind function
 * @memberof Appium
 * @scope instance
 */
var _dontSeeCheckboxIsChecked;

/**
 * {{> ../webapi/dontSeeElement }}
 *
 * @name dontSeeElement
 * @kind function
 * @memberof Appium
 * @scope instance
 */
var _dontSeeElement;

/**
 * {{> ../webapi/dontSeeInField }}
 *
 * @name dontSeeInField
 * @kind function
 * @memberof Appium
 * @scope instance
 */
var _dontSeeInField;


/**
 * {{> ../webapi/dontSee }}
 *
 * @name dontSee
 * @kind function
 * @memberof Appium
 * @scope instance
 */
var _dontSee;

/**
 * {{> ../webapi/fillField }}
 *
 * @name fillField
 * @kind function
 * @memberof Appium
 * @scope instance
 */
var _fillField;

/**
 * {{> ../webapi/grabTextFrom }}
 *
 * @name grabTextFrom
 * @kind function
 * @memberof Appium
 * @scope instance
 */
var _grabTextFrom;

/**
 * {{> ../webapi/grabValueFrom }}
 *
 * @name grabValueFrom
 * @kind function
 * @memberof Appium
 * @scope instance
 */
var _grabValueFrom;

/**
 * {{> ../webapi/seeCheckboxIsChecked }}
 *
 * @name seeCheckboxIsChecked
 * @kind function
 * @memberof Appium
 * @scope instance
 */
var _seeCheckboxIsChecked;

/**
 * {{> ../webapi/seeElement }}
 *
 * @name seeElement
 * @kind function
 * @memberof Appium
 * @scope instance
 */
var _seeElement;

/**
 * {{> ../webapi/seeInField }}
 *
 * @name seeInField
 * @kind function
 * @memberof Appium
 * @scope instance
 */
var _seeInField;

/**
 * {{> ../webapi/see }}
 *
 * @name see
 * @kind function
 * @memberof Appium
 * @scope instance
 */
var _see;

/**
 * {{> ../webapi/selectOption }}
 *
 * @name selectOption
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _selectOption;
