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
 WebDriverIO helper which wraps [webdriverio](http://webdriver.io/) library to
 manipulate browser using Selenium WebDriver, PhantomJS or Appium.

 #### Selenium Installation

 1.  Download [Selenium Server](http://docs.seleniumhq.org/download/)
 2.  Launch the daemon: `java -jar selenium-server-standalone-2.xx.xxx.jar`

 #### PhantomJS Installation

 PhantomJS is a headless alternative to Selenium Server that implements the WebDriver protocol.
 It allows you to run Selenium tests on a server without a GUI installed.

 1.  Download [PhantomJS](http://phantomjs.org/download.html)
 2.  Run PhantomJS in WebDriver mode: `phantomjs --webdriver=4444`

 #### Appium Installation

 Appium is an open source test automation framework for use with native, hybrid and mobile web apps that implements the WebDriver protocol.
 It allows you to run Selenium tests on mobile devices and also test native, hybrid and mobile web apps.

 1.  Download and install [Appium](http://appium.io/)
 2.  Launch the daemon: `appium`

 ### Configuration

 This helper should be configured in codecept.conf.js

 #### Desktop configuration

 -   `url` - base url of website to be tested
 -   `browser` - browser in which perform testing
 -   `restart` - restart browser between tests (default: true), if set to false cookies will be cleaned but browser window will be kept.
 -   `windowSize`: (optional) default window size. Set to `maximize` or a dimension in the format `640x480`.
 -   `waitForTimeout`: (optional) sets default wait time in _ms_ for all `wait*` functions. 1000 by default;
 -   `desiredCapabilities`: Selenium capabilities
 -   `manualStart` (optional, default: false) - do not start browser before a test, start it manually inside a helper with `this.helpers["WebDriverIO"]._startBrowser()`
 -   `timeouts`: [WebDriverIO timeouts](http://webdriver.io/guide/testrunner/timeouts.html) defined as hash.

 Example:

 ```js
 {
    helpers: {
      WebDriverIO : {
        browser: "chrome",
        restart: false,
        windowSize: "maximize",
        timeouts: {
          script: 60000,
          page load: 10000,
          implicit : 5000
        }
      }
    }
 }
 ```

 Additional configuration params can be used from <http://webdriver.io/guide/getstarted/configuration.html>

 ### Connect through proxy

 CodeceptJS also provides flexible options when you want to execute tests to Selenium servers through proxy. You will
 need to update the `helpers.WebDriverIO.desiredCapabilities.proxy` key.

 ```js
 {
     helpers: {
         WebDriverIO: {
             desiredCapabilities: {
                 proxy: {
                     proxyType: "manual|pac",
                     proxyAutoconfigUrl: "URL TO PAC FILE",
                     httpProxy: "PROXY SERVER",
                     sslProxy: "PROXY SERVER",
                     ftpProxy: "PROXY SERVER",
                     socksProxy: "PROXY SERVER",
                     socksUsername: "USERNAME",
                     socksPassword: "PASSWORD",
                     noProxy: "BYPASS ADDRESSES"
                 }
             }
         }
     }
 }
 ```

 For example,

 ```js
 {
     helpers: {
         WebDriverIO: {
             desiredCapabilities: {
                 proxy: {
                     proxyType: "manual",
                     httpProxy: "http://corporate.proxy:8080",
                     socksUsername: "codeceptjs",
                     socksPassword: "secret",
                     noProxy: "127.0.0.1,localhost"
                 }
             }
         }
     }
 }
 ```

 Please refer to [Selenium - Proxy Object](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities) for more information.

 ### Cloud Providers

 WebDriverIO makes it possible to execute tests against services like `Sauce Labs` `BrowserStack` `TestingBot`
 Check out their documentation on [available parameters](http://webdriver.io/guide/testrunner/cloudservices.html)

 Connecting to `BrowserStack` and `Sauce Labs` is simple. All you need to do
 is set the `user` and `key` parameters. WebDriverIO authomatically know which
 service provider to connect to.

 ```js
 {
     helpers:{
         WebDriverIO: {
             url: "YOUR_DESIERED_HOST",
             user: "YOUR_BROWSERSTACK_USER",
             key: "YOUR_BROWSERSTACK_KEY",
             desiredCapabilities: {
                 browserName: "chrome",

                 // only set this if you're using BrowserStackLocal to test a local domain
                 // "browserstack.local": true,

                 // set this option to tell browserstack to provide addition debugging info
                 // "browserstack.debug": true,
             }
         }
     }
 }
 ```

 ### Multiremote Capabilities

 This is a work in progress but you can control two browsers at a time right out of the box.
 Individual control is something that is planned for a later version.

 Here is the [webdriverio docs](http://webdriver.io/guide/usage/multiremote.html) on the subject

 ```js
 {
     helpers: {
         WebDriverIO: {
             multiremote: {
                 MyChrome: {
                     desiredCapabilities: {
                         browserName: "chrome"
                      }
                 },
                 MyFirefox: {
                    desiredCapabilities: {
                        browserName: "firefox"
                    }
                 }
             }
         }
     }
 }
 ```

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

 Receive a WebDriverIO client from a custom helper by accessing `browser` property:

 ```js
 this.helpers['WebDriverIO'].browser
 ```
 */
class Appium extends WebdriverIO {

  /**
   * Appium Special Methods for Mobile only
   */

  /**
   * Check if an app is installed.
   * Appium: support only Android
   */
  checkAppIsInstalled(bundleId) {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.isAppInstalled(bundleId).then(function(res) {
        return truth(`app ${bundleId}`, 'to be installed').assert(res.value);
      });
    } else
      throw new Error(`checkAppInstallation method can be used only with Android apps`);
  }

  /**
   * Check if an app is not installed.
   * Appium: support only Android
   */
  checkAppIsNotInstalled(bundleId) {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.isAppInstalled(bundleId).then(function(res) {
        return truth(`app ${bundleId}`, 'to be installed').negate(res.value);
      });
    } else
      throw new Error(`checkAppInstallation method can be used only with Android apps`);
  }

  /**
   * check current activity on an Android device.
   * Appium: support only Android
   */
  checkCurrentActivityIs(currentActivity) {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.currentActivity().then(function(res) {
        return truth('current activity', `to be ${currentActivity}`).assert(res.value == currentActivity);
      });
    } else
      throw new Error(`getCurrentActivity method can be used only with Android apps`);
  }

  /**
   * Check whether the device is locked.
   * Appium: support only Android
   */
  checkDeviceIsLocked() {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.isLocked().then(function(res) {
        return truth('device', 'to be locked').assert(res.value);
      });
    } else
      throw new Error(`checkDeviceLock method can be used only with Android apps`);
  }

  /**
   * Check whether the device is not locked.
   * Appium: support only Android
   */
  checkDeviceIsNotLocked() {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.isLocked().then(function(res) {
        return truth('device', 'to be locked').negate(res.value);
      });
    } else
      throw new Error(`checkDeviceLock method can be used only with Android apps`);
  }

  /**
   * Check the device orientation
   * Appium: support Android and iOS
   */
  checkOrientationIs(orientation) {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.orientation().then(function(res) {
        return truth('orientation', `to be ${orientation}`).assert(res.value == orientation);
      });
    } else
      throw new Error(`getDeviceOrientation method can be used only with apps`);
  }

  /**
   * Close the given application.
   * Appium: support only iOS
   */
  closeApp() {
    if (this.options.desiredCapabilities.platformName == "iOS") {
      return this.browser.closeApp();
    } else
      throw new Error(`closeApp method can be used only with iOS apps`);
  }

  /**
   * Get list of all available contexts
   * Appium: support Android and iOS
   */
  grabAllContexts() {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.contexts();
    } else
      throw new Error(`getAllContexts method can be used only with apps`);
  }

  /**
   * Retrieve current context
   * Appium: support Android and iOS
   */
  grabContext() {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.context();
    } else
      throw new Error(`getContext method can be used only with apps`);
  }

  /**
   * Get current device activity.
   * Appium: support only Android
   */
  grabCurrentActivity() {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.getCurrentDeviceActivity();
    } else
      throw new Error(`getCurrentDeviceActivity method can be used only with Android apps`);
  }

  /**
   * Get the current geolocation.
   * Only for browser, firstly you sould setGeoLocation
   * Appium: support Android and iOS
   */
  grabGeoLocation() {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.getGeoLocation();
    } else
      throw new Error(`getGeoLocation method can be used only with apps`);
  }

  /**
   * Get informations about the current network connection (Data/WIFI/Airplane).
   * The actual server value will be a number. However WebdriverIO additional
   * properties to the response object to allow easier assertions.
   * Appium: support only Android
   */
  grabNetworkConnection() {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.getNetworkConnection();
    } else
      throw new Error(`getNetworkConnection method can be used only with Android apps`);
  }

  /**
   * Get current orientation.
   * Appium: support Android and iOS
   */
  grabOrientation() {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.orientation().then(function(res) {
        return res.value;
      });
    } else
      throw new Error(`grabOrientation method can be used only with apps`);
  }

  /**
   * Get all the currently specified settings
   * Appium: support Android and iOS
   */
  grabSettings() {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.settings();
    } else
      throw new Error(`grabSettings method can be used only with apps`);
  }

  /**
   * Hide the keyboard.
   * Appium: support Android and iOS
   */
  hideDeviceKeyboard(strategy, key) {
    if (this.options.desiredCapabilities.platformName) {
      strategy = strategy || 'tapOutside'
      return this.browser.hideDeviceKeyboard(strategy, key);
    } else
      throw new Error(`hideDeviceKeyboard method can be used only with apps`);
  }

  /**
   * Install an app on device.
   * Appium: support only Android
   */
  installApp(path) {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.installApp(path);
    } else
      throw new Error(`installApp method can be used only with Android apps`);
  }

  /**
   * Lock the device.
   * Appium: support only Android
   */
  lockDevice() {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.lock();
    } else
      throw new Error(`lockDevice method can be used only with Android apps`);
  }

  /**
   * Press a particular key code on the device.
   * Appium: support only Android
   */
  longPressKeycode(keycode, metastate) {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.longPressKeycode(keycode, metastate);
    } else
      throw new Error(`longPressKeycode method can be used only with Android apps`);
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
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.touchAction(withStrictLocator(locator), action);
    } else
      throw new Error(`makeTouchAction method can be used only with apps`);
  }

  /**
   * Perform a shake action on the device.
   * Appium: support only iOS
   */
  makeShake() {
    if (this.options.desiredCapabilities.platformName == "iOS") {
      return this.browser.shake();
    } else
      throw new Error(`makeShake method can be used only with iOS apps`);
  }

  /**
   * Open the notifications panel on the device.
   * Appium: support only Android
   */
  openNotifications() {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.openNotifications();
    } else
      throw new Error(`openNotifications method can be used only with Android apps`);
  }

  /**
   * Pulls a file from the device.
   * Appium: support Android and iOS
   */
  pullFile(path, dest) {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.pullFile(path).then(function(res) {
        fs.writeFile(dest, Buffer.from(res.value, 'base64'), function(err) {
          if (err) {
            return false;
          }
          return true
        });
      });
    } else
      throw new Error(`pullFile method can be used only with apps`);
  }

  /**
   * Remove an app from the device.
   * Appium: support only Android
   */
  removeApp(bundleId) {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.removeApp(bundleId);
    } else
      throw new Error(`removeApp method can be used only with Android apps`);
  }

  /**
   * Perform a rotation gesture centered on the specified element.
   * Appium: support only iOS
   TODO: not tested
   */
  rotate(x, y, duration, radius, rotation, touchCount) {
    if (this.options.desiredCapabilities.platformName == "iOS") {
      return this.browser.rotate(x, y, duration, radius, rotation, touchCount);
    } else
      throw new Error(`rotate method can be used only with iOS apps`);
  }

  /**
   * Send the currently active app to the background and return it back.
   * Appium: support only Android
   */
  sendAppToBackground(seconds) {
    if (this.options.desiredCapabilities.platformName == "Android") {
      seconds = seconds || this.options.waitForTimeout;
      return this.browser.background(seconds);
    } else
      throw new Error(`sendAppToBackground method can be used only with Android apps`);
  }

  /**
   * send a key event to the device
   * Appium: support only Android
   * list of keys: https://developer.android.com/reference/android/view/KeyEvent.html
   */
  sendDeviceKeyEvent(keyValue) {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.deviceKeyEvent(keyValue);
    } else
      throw new Error(`sendDeviceKeyEvent method can be used only with Android apps`);
  }

  /**
   * Set immediate value in app.
   * Appium: support only iOS
   TODO: not tested
   */
  setImmediateValue(id, value) {
    if (this.options.desiredCapabilities.platformName = "iOS") {
      return this.browser.setImmediateValue(id, value);
    } else
      throw new Error(`setImmediateValue method can be used only with iOS apps`);
  }

  /**
   * Set a device orientation. Will fail, if app will not set orientation
   * Appium: support Android and iOS
   */
  setOrientation(orientation) {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.setOrientation(orientation);
    } else
      throw new Error(`setDeviceOrientation method can be used only with apps`);
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
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.location(obj);
    } else
      throw new Error(`setGeoLocation method can be used only with apps`);
  }

  /**
   * Set network connection.
   * Appium: support only Android
   */
  setNetworkConnection(value) {
    if (this.options.desiredCapabilities.platformName = "Android") {
      return this.browser.setNetworkConnection(value);
    } else
      throw new Error(`setNetworkConnection method can be used only with Android apps`);
  }

  /**
   * Update the current setting on the device
   * Appium: support Android and iOS
   */
  setSettings(settings) {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.settings(settings);
    } else
      throw new Error(`setSettings method can be used only with apps`);
  }

  /**
   * Simulate Touch ID with either valid (match == true) or invalid (match == false) fingerprint.
   * Appium: support only iOS
   * TODO: not tested
   */
  simulateTouchId(match) {
    if (this.options.desiredCapabilities.platformName) {
      match = match || true;
      return this.browser.touch(match);
    } else
      throw new Error(`simulateTouchId method can be used only with iOS apps`);
  }

  /**
   * Start an arbitrary Android activity during a session.
   * Appium: support only Android
   */
  startActivity(appPackage, appActivity) {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.startActivity(appPackage, appActivity);
    } else
      throw new Error(`startActivity method can be used only with Android apps`);
  }


  /**
   * Perform a swipe on the screen or an element.
   * Appium: support Android and iOS
   */
  swipe(locator, xoffset, yoffset, speed) {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.swipe(withStrictLocator(locator), xoffset, yoffset, speed);
    } else
      throw new Error(`swipe method can be used only with apps`);
  }

  /**
   * Perform a swipe down on an element.
   * Appium: support Android and iOS
   */
  swipeDown(locator, yOffset, speed) {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.swipeDown(withStrictLocator(locator), yOffset, speed);
    } else
      throw new Error(`swipeDown method can be used only with apps`);
  }

  /**
   * Perform a swipe left on an element.
   * Appium: support Android and iOS
   */
  swipeLeft(locator, xoffset, speed) {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.swipeLeft(withStrictLocator(locator), xoffset, speed);
    } else
      throw new Error(`swipeLeft method can be used only with apps`);
  }

  /**
   * Perform a swipe right on an element.
   * Appium: support Android and iOS
   */
  swipeRight(locator, xoffset, speed) {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.swipeRight(withStrictLocator(locator), xoffset, speed);
    } else
      throw new Error(`swipeRight method can be used only with apps`);
  }

  /**
   * Perform a swipe in selected direction on an element to seachable element.
   * Appium: support Android and iOS
   */
  swipeTo(seachableLocator, scrollLocator, direction, timeout, offset, speed) {
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
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.swipeUp(withStrictLocator(locator), yOffset, speed);
    } else
      throw new Error(`swipeUp method can be used only with apps`);
  }

  /**
   * Switch to the specified context
   * Appium: support only Android
   */
  switchToContext(value) {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.context(value);
    } else
      throw new Error(`switchToContext method can be used only with apps`);
  }

  /**
   * Switch the state (enabled/disabled) of airplane mode.
   * Appium: support only Android
   */
  toggleAirplaneMode() {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.toggleAirplaneMode();
    } else
      throw new Error(`toggleAirplaneMode method can be used only with Android apps`);
  }

  /**
   * Switch the state (enabled/disabled) of the location service.
   * Appium: support only Android
   */
  toggleLocationServices() {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.toggleLocationServices();
    } else
      throw new Error(`toggleLocationServices method can be used only with Android apps`);
  }

  /**
   * Switch the state (enabled/disabled) of the wifi service.
   * Appium: support only Android
   */
  toggleWiFi() {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.toggleWiFi();
    } else
      throw new Error(`toggleWiFi method can be used only with Android apps`);
  }

  /**
   * Performs a specific touch action. The action object need to contain the action name, x/y coordinates
   * Appium: support Android and iOS
   */
  touchPerform(actions) {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.touchPerform(actions);
    } else
      throw new Error(`touchPerform method can be used only with apps`);
  }

  /**
   * Unlock the device.
   * Appium: support only Android
   */
  unlockDevice() {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.unlock();
    } else
      throw new Error(`unlockDevice method can be used only with Android apps`);
  }

  /*
   * End Appium Methods
   */

}

function isCSSorXPathLocator(locator) {
  if (locator[0] === '#' || locator[0] === '.') {
    if (browserCap)
      return true;
    //TODO: add accessibility id, -android uiauto support
    else throw new Error(`Unable to use css locators in apps. Locator strategies for this request: xpath, id, class name`);
  }
  if (locator.substr(0, 2) === '//') {
    return true;
  }
  return false;
}

function withStrictLocator(locator) {
  if (!locator) return null;
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

module.exports = Appium;
