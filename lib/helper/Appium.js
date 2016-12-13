'use strict';
let webdriverio;
const WebdriverIO = require('./WebdriverIO');
const stringIncludes = require('../assert/include').includes;
const urlEquals = require('../assert/equal').urlEquals;
const equals = require('../assert/equal').equals;
const empty = require('../assert/empty').empty;
const truth = require('../assert/truth').truth;
const xpathLocator = require('../utils').xpathLocator;
const fileExists = require('../utils').fileExists;
const assert = require('assert');
const path = require('path');
const requireg = require('requireg');
const fs = require('fs');

let withinStore = {};
let browserCap;

/**
 Appium helper is extends from WebriverIO. It's support all browser methods and also includes special methods for mobile apps testing. You can use this helper to test Web on desktop and mobile devices and mobile apps.

 #### Appium Installation

 Appium is an open source test automation framework for use with native, hybrid and mobile web apps that implements the WebDriver protocol.
 It allows you to run Selenium tests on mobile devices and also test native, hybrid and mobile web apps.

 1.  Download and install [Appium](http://appium.io/)
 2.  Launch the daemon: `appium`

 ### Configuration

 This helper should be configured in codecept.conf.js

 #### Appium configuration

 -   `port`: Appium serverport
 -   `restart`: restart browser or app between tests (default: true), if set to false cookies will be cleaned but browser window will be kept and for apps nothing will be changed.
 -   `desiredCapabilities`: Appium capabilities
 --   `platformName` - Which mobile OS platform to use
 --   `appPackage` - Java package of the Android app you want to run
 --   `appActivity` - Activity name for the Android activity you want to launch from your package.
 --   `deviceName`: The kind of mobile device or emulator to use
 --   `platformVersion`: Mobile OS version
 --   `app` - The absolute local path or remote http URL to an .ipa or .apk file, or a .zip containing one of these. Appium will attempt to install this app binary on the appropriate device first.
 --   `browserName`: Name of mobile web browser to automate. Should be an empty string if automating an app instead.

 Example:

 ```js
 {
   helpers: {
       WebDriverIO: {
           desiredCapabilities: {
               platformName: "Android",
               appPackage: "com.example.android.myApp",
               appActivity: "MainActivity",
               deviceName: "OnePlus3",
               platformVersion: "6.0.1"
           },
           port: 4723,
           restart: false
       }
    }
 }
 ```
 Additional configuration params can be used from <https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/caps.md>


 ## Access From Helpers

 Receive a Appium client from a custom helper by accessing `browser` property:

 ```js
 this.helpers['Appium'].browser
 ```
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
        script: 1000 // ms
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
     * Appium: support only Android
     */
  checkAppIsInstalled(bundleId) {
    onlyForApps.call(this, "Android")
    return this.browser.isAppInstalled(bundleId).then(function(res) {
      return truth(`app ${bundleId}`, 'to be installed').assert(res.value);
    });
  }

  /**
   * Check if an app is not installed.
   * Appium: support only Android
   */
  checkAppIsNotInstalled(bundleId) {
    onlyForApps.call(this, "Android")
    return this.browser.isAppInstalled(bundleId).then(function(res) {
      return truth(`app ${bundleId}`, 'to be installed').negate(res.value);
    });
  }

  /**
   * check current activity on an Android device.
   * Appium: support only Android
   */
  checkCurrentActivityIs(currentActivity) {
    onlyForApps.call(this, "Android")
    return this.browser.currentActivity().then(function(res) {
      return truth('current activity', `to be ${currentActivity}`).assert(res.value == currentActivity);
    });
  }

  /**
   * Check whether the device is locked.
   * Appium: support only Android
   */
  seeDeviceIsLocked() {
    onlyForApps.call(this, "Android")
    return this.browser.isLocked().then(function(res) {
      return truth('device', 'to be locked').assert(res.value);
    });
  }

  /**
   * Check whether the device is not locked.
   * Appium: support only Android
   */
  dontSeeDeviceIsLocked() {
    onlyForApps.call(this, "Android")
    return this.browser.isLocked().then(function(res) {
      return truth('device', 'to be locked').negate(res.value);
    });
  }

  /**
   * Check the device orientation
   * Appium: support Android and iOS
   */
  seeOrientationIs(orientation) {
    onlyForApps.call(this)
    return this.browser.orientation().then(function(res) {
      return truth('orientation', `to be ${orientation}`).assert(res.value == orientation);
    });
  }

  /**
   * Close the given application.
   * Appium: support only iOS
   */
  closeApp() {
    onlyForApps.call(this, "iOS")
    return this.browser.closeApp();
  }

  /**
   * Get list of all available contexts
   * Appium: support Android and iOS
   */
  grabAllContexts() {
    onlyForApps.call(this)
    return this.browser.contexts();
  }

  /**
   * Retrieve current context
   * Appium: support Android and iOS
   */
  grabContext() {
    onlyForApps.call(this)
    return this.browser.context();
  }

  /**
   * Get current device activity.
   * Appium: support only Android
   */
  grabCurrentActivity() {
    onlyForApps.call(this, "Android")
    return this.browser.getCurrentDeviceActivity();
  }

  /**
   * Get the current geolocation.
   * Only for browser, firstly you sould setGeoLocation
   * Appium: support Android and iOS
   */
  grabGeoLocation() {
    onlyForApps.call(this)
    return this.browser.getGeoLocation();
  }

  /**
   * Get informations about the current network connection (Data/WIFI/Airplane).
   * The actual server value will be a number. However WebdriverIO additional
   * properties to the response object to allow easier assertions.
   * Appium: support only Android
   */
  grabNetworkConnection() {
    onlyForApps.call(this, "Android")
    return this.browser.getNetworkConnection();
  }

  /**
   * Get current orientation.
   * Appium: support Android and iOS
   */
  grabOrientation() {
    onlyForApps.call(this)
    return this.browser.orientation().then(function(res) {
      return res.value;
    });
  }

  /**
   * Get all the currently specified settings
   * Appium: support Android and iOS
   */
  grabSettings() {
    onlyForApps.call(this)
    return this.browser.settings();
  }

  /**
   * Hide the keyboard.
   * Appium: support Android and iOS
   */
  hideDeviceKeyboard(strategy, key) {
    onlyForApps.call(this)
    strategy = strategy || 'tapOutside'
    return this.browser.hideDeviceKeyboard(strategy, key);
  }

  /**
   * Install an app on device.
   * Appium: support only Android
   */
  installApp(path) {
    onlyForApps.call(this, "Android")
    return this.browser.installApp(path);
  }

  /**
   * Lock the device.
   * Appium: support only Android
   */
  lockDevice() {
    onlyForApps.call(this, "Android")
    return this.browser.lock();
  }

  /**
   * Press a particular key code on the device.
   * Appium: support only Android
   */
  longPressKeycode(keycode, metastate) {
    onlyForApps.call(this, "Android")
    return this.browser.longPressKeycode(keycode, metastate);
  }

  /**
   * The Touch Action API provides the basis of all gestures that can be
   * automated in Appium. At its core is the ability to chain together ad hoc
   * individual actions, which will then be applied to an element in the
   * application on the device.
   * Full documentation http://webdriver.io/api/mobile/touchAction.html
   * Appium: support Android and iOS
   */
  makeTouchAction(locator, action) {
    onlyForApps.call(this)
    return this.browser.touchAction(withStrictLocator(locator), action);
  }

  /**
   * Perform a shake action on the device.
   * Appium: support only iOS
   */
  makeShake() {
    onlyForApps.call(this, "iOS")
    return this.browser.shake();
  }

  /**
   * Open the notifications panel on the device.
   * Appium: support only Android
   */
  openNotifications() {
    onlyForApps.call(this)
    return this.browser.openNotifications();
  }

  /**
   * Pulls a file from the device.
   * Appium: support Android and iOS
   */
  pullFile(path, dest) {
    onlyForApps.call(this)
    return this.browser.pullFile(path).then(function(res) {
      fs.writeFile(dest, Buffer.from(res.value, 'base64'), function(err) {
        if (err) {
          return false;
        }
        return true
      });
    });
  }

  /**
   * Remove an app from the device.
   * Appium: support only Android
   */
  removeApp(bundleId) {
    onlyForApps.call(this, "Android")
    return this.browser.removeApp(bundleId);
  }

  /**
   * Perform a rotation gesture centered on the specified element.
   * Appium: support only iOS
   TODO: not tested
   */
  rotate(x, y, duration, radius, rotation, touchCount) {
    onlyForApps.call(this, "iOS")
    return this.browser.rotate(x, y, duration, radius, rotation, touchCount);
  }

  /**
   * Send the currently active app to the background and return it back.
   * Appium: support only Android
   */
  sendAppToBackground(seconds) {
    onlyForApps.call(this, "Android")
    seconds = seconds || this.options.waitForTimeout;
    return this.browser.background(seconds);
  }

  /**
   * send a key event to the device
   * Appium: support only Android
   * list of keys: https://developer.android.com/reference/android/view/KeyEvent.html
   */
  sendDeviceKeyEvent(keyValue) {
    onlyForApps.call(this, "Android")
    return this.browser.deviceKeyEvent(keyValue);
  }

  /**
   * Set immediate value in app.
   * Appium: support only iOS
   TODO: not tested
   */
  setImmediateValue(id, value) {
    onlyForApps.call(this, "iOS")
    return this.browser.setImmediateValue(id, value);
  }

  /**
   * Set a device orientation. Will fail, if app will not set orientation
   * Appium: support Android and iOS
   */
  setOrientation(orientation) {
    onlyForApps.call(this)
    return this.browser.setOrientation(orientation);
  }

  /**
   * Set the current geolocation. Only for browser. usage?
   * Appium: support Android
   */
  setGeoLocation(latitude, longitude, altitude) {
    latitude = latitude || 0;
    longitude = longitude || 0;
    altitude = altitude || 0;
    var obj = {
      latitude: latitude,
      longitude: longitude,
      altitude: altitude
    };
    onlyForApps.call(this, "Android")
    return this.browser.location(obj);
  }

  /**
   * Set network connection.
   * Appium: support only Android
   */
  setNetworkConnection(value) {
    onlyForApps.call(this)
    return this.browser.setNetworkConnection(value);
  }

  /**
   * Update the current setting on the device
   * Appium: support Android and iOS
   */
  setSettings(settings) {
    onlyForApps.call(this)
    return this.browser.settings(settings);
  }

  /**
   * Simulate Touch ID with either valid (match == true) or invalid (match == false) fingerprint.
   * Appium: support only iOS
   * TODO: not tested
   */
  simulateTouchId(match) {
    onlyForApps.call(this)
    match = match || true;
    return this.browser.touch(match);
  }

  /**
   * Start an arbitrary Android activity during a session.
   * Appium: support only Android
   */
  startActivity(appPackage, appActivity) {
    onlyForApps.call(this, "Android")
    return this.browser.startActivity(appPackage, appActivity);
  }


  /**
   * Perform a swipe on the screen or an element.
   * Appium: support Android and iOS
   */
  swipe(locator, xoffset, yoffset, speed) {
    onlyForApps.call(this)
    return this.browser.swipe(withStrictLocator(locator), xoffset, yoffset, speed);
  }

  /**
   * Perform a swipe down on an element.
   * Appium: support Android and iOS
   */
  swipeDown(locator, yOffset, speed) {
    onlyForApps.call(this)
    return this.browser.swipeDown(withStrictLocator(locator), yOffset, speed);
  }

  /**
   * Perform a swipe left on an element.
   * Appium: support Android and iOS
   */
  swipeLeft(locator, xoffset, speed) {
    onlyForApps.call(this)
    return this.browser.swipeLeft(withStrictLocator(locator), xoffset, speed);
  }

  /**
   * Perform a swipe right on an element.
   * Appium: support Android and iOS
   */
  swipeRight(locator, xoffset, speed) {
    onlyForApps.call(this)
    return this.browser.swipeRight(withStrictLocator(locator), xoffset, speed);
  }

  /**
   * Perform a swipe in selected direction on an element to seachable element.
   * Appium: support Android and iOS
   */
  swipeTo(seachableLocator, scrollLocator, direction, timeout, offset, speed) {
    onlyForApps.call(this)
    direction = direction || 'down'
    switch (direction) {
      case 'down':
        direction = 'swipeDown'
        break
      case 'up':
        direction = 'swipeUp'
        break
      case 'left':
        direction = 'swipeLeft'
        break
      case 'right':
        direction = 'swipeRight'
        break
    }
    timeout = timeout || this.options.waitForTimeout;
    let browser = this.browser;
    let err = false
    let currentSource;
    return browser.waitUntil(function() {
      if (err) {
        return new Error('Scroll to the end and element ' + seachableLocator + ' was not found');
      } else {
        return browser.isVisible(withStrictLocator(seachableLocator))
          .then(function(res) {
            if (res) {
              return true;
            } else {
              return browser[direction](scrollLocator, offset, speed).getSource().then((source) => {
                if (source === currentSource) {
                  err = true
                } else {
                  currentSource = source;
                  return false;
                }
              });
            }
          })
      }
    }, timeout * 1000)
  }

  /**
   * Perform a swipe up on an element.
   * Appium: support Android and iOS
   */
  swipeUp(locator, yOffset, speed) {
    onlyForApps.call(this)
    return this.browser.swipeUp(withStrictLocator(locator), yOffset, speed);
  }

  /**
   * Switch to the specified context
   * Appium: support only Android
   */
  switchToContext(value) {
    onlyForApps.call(this)
    return this.browser.context(value);
  }

  /**
   * Switch the state (enabled/disabled) of airplane mode.
   * Appium: support only Android
   */
  toggleAirplaneMode() {
    onlyForApps.call(this, "Android")
    return this.browser.toggleAirplaneMode();

  }

  /**
   * Switch the state (enabled/disabled) of the location service.
   * Appium: support only Android
   */
  toggleLocationServices() {
    onlyForApps.call(this, "Android")
    return this.browser.toggleLocationServices();
  }

  /**
   * Switch the state (enabled/disabled) of the wifi service.
   * Appium: support only Android
   */
  toggleWiFi() {
    onlyForApps.call(this, "Android")
    return this.browser.toggleWiFi();
  }

  /**
   * Performs a specific touch action. The action object need to contain the action name, x/y coordinates
   * Appium: support Android and iOS
   */
  touchPerform(actions) {
    onlyForApps.call(this)
    return this.browser.touchPerform(actions);
  }

  /**
   * Unlock the device.
   * Appium: support only Android
   */
  unlockDevice() {
    onlyForApps.call(this)
    return this.browser.unlock();
  }

  /*
   * End Appium Methods
   */

}

function isCSSorXPathLocator(locator) {
  if (locator[0] === '#' || locator[0] === '.') {
    if (browserCap)
      return true;
    else throw new Error(`Unable to use css locators in apps. Locator strategies for this request: xpath, id, class name`);
  }
  if (locator.substr(0, 2) === '//') {
    return true;
  }
  return false;
}

function withStrictLocator(locator) {
  if (!locator) return null;
  if (isCSSorXPathLocator(locator)) return locator;
  if (typeof(locator) !== 'object') return locator;
  let key = Object.keys(locator)[0];
  let value = locator[key];

  locator.toString = () => `{${key}: '${value}'}`;

  switch (key) {
    case 'by':
    case 'xpath':
      return value;
    case 'css':
      if (browserCap)
        return value;
      else throw new Error(`Unable to use css locators in apps. Locator strategies for this request: xpath, id, class name`);
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
    m = re.exec(caller)
  callerName = m[1] || m[2];
  if (!platformName) {
    if (!this.options.desiredCapabilities.platformName) {
      throw new Error(`${callerName} method can be used only with apps`)
    }
  } else {
    if (this.options.desiredCapabilities.platformName != platformName) {
      throw new Error(`${callerName} method can be used only with ${platformName} apps`)
    }
  }
}


module.exports = Appium;
