let webdriverio;
let wdioV4;

const fs = require('fs');
const axios = require('axios');

const Webdriver = require('./WebDriver');
const AssertionFailedError = require('../assert/error');
const { truth } = require('../assert/truth');
const recorder = require('../recorder');
const Locator = require('../locator');
const ConnectionRefused = require('./errors/ConnectionRefused');

const mobileRoot = '//*';
const webRoot = 'body';

/**
 *  Appium helper extends [Webriver](http://codecept.io/helpers/WebDriver/) helper.
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
 * * `app`: Application path. Local path or remote URL to an .ipa or .apk file, or a .zip containing one of these. Alias to desiredCapabilities.appPackage
 * * `host`: (default: 'localhost') Appium host
 * * `port`: (default: '4723') Appium port
 * * `platform`: (Android or IOS), which mobile OS to use; alias to desiredCapabilities.platformName
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
 * Example Android App:
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
 * Example iOS Mobile Web with local Appium:
 *
 * ```js
 * {
 * helpers: {
 *   Appium: {
 *     platform: "iOS",
 *     url: "https://the-internet.herokuapp.com/",
 *     desiredCapabilities: {
 *       deviceName: "iPhone X",
 *       platformVersion: "12.0",
 *       browserName: "safari"
 *     }
 *   }
 * }
 * }
 * ```
 *
 * Example iOS Mobile Web on BrowserStack:
 *
 * ```js
 * {
 * helpers: {
 *   Appium: {
 *     host: "hub-cloud.browserstack.com",
 *     port: 4444,
 *     user: process.env.BROWSERSTACK_USER,
 *     key: process.env.BROWSERSTACK_KEY,
 *     platform: "iOS",
 *     url: "https://the-internet.herokuapp.com/",
 *     desiredCapabilities: {
 *       realMobile: "true",
 *       device: "iPhone 8",
 *       os_version: "12",
 *       browserName: "safari"
 *     }
 *   }
 * }
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
 *
 * ## Methods
 */
class Appium extends Webdriver {
  /**
   * Appium Special Methods for Mobile only
   * @augments WebDriver
   */

  constructor(config) {
    super(config);

    this.isRunning = false;

    webdriverio = require('webdriverio');
    (!webdriverio.VERSION || webdriverio.VERSION.indexOf('4') !== 0) ? wdioV4 = false : wdioV4 = true;
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
    const defaults = {
      // webdriverio defaults
      protocol: 'http',
      hostname: '0.0.0.0', // webdriverio specs
      port: 4723,
      path: '/wd/hub',

      // config
      waitForTimeout: 1000, // ms
      logLevel: 'error',
      capabilities: {},
      deprecationWarnings: false,
      restart: true,
      manualStart: false,
      timeouts: {
        script: 0, // ms
      },
    };

    // override defaults with config
    config = Object.assign(defaults, config);

    config.baseUrl = config.url || config.baseUrl;
    if (config.desiredCapabilities && Object.keys(config.desiredCapabilities).length) {
      config.capabilities = config.desiredCapabilities;
    }

    config.capabilities.deviceName = config.device || config.capabilities.deviceName;
    config.capabilities.browserName = config.browser || config.capabilities.browserName;
    config.capabilities.app = config.app || config.capabilities.app;
    config.capabilities.platformName = config.platform || config.capabilities.platformName;
    config.capabilities.tunnelIdentifier = config.tunnelIdentifier || config.capabilities.tunnelIdentifier; // Adding the code to connect to sauce labs via sauce tunnel
    config.waitForTimeout /= 1000; // convert to seconds

    // [CodeceptJS compatible] transform host to hostname
    config.hostname = config.host || config.hostname;

    if (!config.app && config.capabilities.browserName) {
      this.isWeb = true;
      this.root = webRoot;
    } else {
      this.isWeb = false;
      this.root = mobileRoot;
    }

    this.platform = null;
    if (config.capabilities.platformName) {
      this.platform = config.capabilities.platformName.toLowerCase();
    }

    return config;
  }

  static _config() {
    return [{
      name: 'app',
      message: 'Application package. Path to file or url',
      default: 'http://localhost',
    }, {
      name: 'platform',
      message: 'Mobile Platform',
      type: 'list',
      choices: ['iOS', 'Android'],
      default: 'Android',
    }, {
      name: 'device',
      message: 'Device to run tests on',
      default: 'emulator',
    }];
  }

  async _startBrowser() {
    try {
      if (this.options.multiremote) {
        this.browser = await webdriverio.multiremote(this.options.multiremote);
      } else {
        this.browser = await webdriverio.remote(this.options);
      }
    } catch (err) {
      if (err.toString().indexOf('ECONNREFUSED')) {
        throw new ConnectionRefused(err);
      }
      throw err;
    }
    this.$$ = this.browser.$$.bind(this.browser);

    this.isRunning = true;
    if (this.options.timeouts && this.isWeb) {
      await this.defineTimeout(this.options.timeouts);
    }
    if (this.options.windowSize === 'maximize' && !this.platform) {
      const res = await this.browser.execute('return [screen.width, screen.height]');
      return this.browser.windowHandleSize({
        width: res.value[0],
        height: res.value[1],
      });
    }
    if (this.options.windowSize && this.options.windowSize.indexOf('x') > 0 && !this.platform) {
      const dimensions = this.options.windowSize.split('x');
      await this.browser.windowHandleSize({
        width: dimensions[0],
        height: dimensions[1],
      });
    }
  }

  async _after() {
    if (!this.isRunning) return;
    if (this.options.restart) {
      this.isRunning = false;
      return this.browser.deleteSession();
    }
    if (this.isWeb && !this.platform) {
      return super._after();
    }
  }

  async _withinBegin(context) {
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

  _buildAppiumEndpoint() {
    const {
      protocol, port, hostname, path,
    } = this.browser.options;
    // Build path to Appium REST API endpoint
    return `${protocol}://${hostname}:${port}${path}`;
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
   * Also capabilities can be checked by a function.
   *
   * ```js
   * I.runOnAndroid((caps) => {
   *    // caps is current config of desiredCapabiliites
   *    return caps.platformVersion >= 6
   * },() => {
   *    // ...
   * });
   * ```
   *
   * @param {*} caps
   * @param {*} fn
   */
  async runOnIOS(caps, fn) {
    if (this.platform !== 'ios') return;
    recorder.session.start('iOS-only actions');
    this._runWithCaps(caps, fn);
    recorder.add('restore from iOS session', () => recorder.session.restore());
    return recorder.promise();
  }

  /**
   * Execute code only on Android
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
   * Also capabilities can be checked by a function.
   * In this case, code will be executed only on Android >= 6.
   *
   * ```js
   * I.runOnAndroid((caps) => {
   *    // caps is current config of desiredCapabiliites
   *    return caps.platformVersion >= 6
   * },() => {
   *    // ...
   * });
   * ```
   *
   * @param {*} caps
   * @param {*} fn
   */
  async runOnAndroid(caps, fn) {
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
  /* eslint-disable */
  async runInWeb(fn) {
    if (!this.isWeb) return;
    recorder.session.start('Web-only actions');

    recorder.add('restore from Web session', () => recorder.session.restore(), true);
    return recorder.promise();
  }
  /* eslint-enable */

  async _runWithCaps(caps, fn) {
    if (typeof caps === 'object') {
      for (const key in caps) {
        // skip if capabilities do not match
        if (this.config.desiredCapabilities[key] !== caps[key]) {
          return;
        }
      }
    }
    if (typeof caps === 'function') {
      if (!fn) {
        fn = caps;
      } else {
        // skip if capabilities are checked inside a function
        const enabled = caps(this.config.desiredCapabilities);
        if (!enabled) return;
      }
    }

    fn();
  }

  /**
   * Check if an app is installed.
   *
   * ```js
   * I.seeAppIsInstalled("com.example.android.apis");
   * ```
   *
   * @param {string} bundleId String  ID of bundled app
   * @return {Promise<void>}
   *
   * Appium: support only Android
   */
  async seeAppIsInstalled(bundleId) {
    onlyForApps.call(this, 'Android');
    const res = await this.browser.isAppInstalled(bundleId);
    return truth(`app ${bundleId}`, 'to be installed').assert(res);
  }

  /**
   * Check if an app is not installed.
   *
   * ```js
   * I.seeAppIsNotInstalled("com.example.android.apis");
   * ```
   *
   * @param {string} bundleId String  ID of bundled app
   * @return {Promise<void>}
   *
   * Appium: support only Android
   */
  async seeAppIsNotInstalled(bundleId) {
    onlyForApps.call(this, 'Android');
    const res = await this.browser.isAppInstalled(bundleId);
    return truth(`app ${bundleId}`, 'to be installed').negate(res);
  }

  /**
   * Install an app on device.
   *
   * ```js
   * I.installApp('/path/to/file.apk');
   * ```
   * @param {string} path path to apk file
   * @return {Promise<void>}
   *
   * Appium: support only Android
   */
  async installApp(path) {
    onlyForApps.call(this, 'Android');
    return this.browser.installApp(path);
  }

  /**
   * Remove an app from the device.
   *
   * ```js
   * I.removeApp('appName', 'com.example.android.apis');
   * ```
   *
   * Appium: support only Android
   *
   * @param {string} appId
   * @param {string} [bundleId] ID of bundle
   */
  async removeApp(appId, bundleId) {
    onlyForApps.call(this, 'Android');

    if (wdioV4) {
      return this.browser.removeApp(bundleId);
    }

    return axios({
      method: 'post',
      url: `${this._buildAppiumEndpoint()}/session/${this.browser.sessionId}/appium/device/remove_app`,
      data: { appId, bundleId },
    });
  }

  /**
   * Check current activity on an Android device.
   *
   * ```js
   * I.seeCurrentActivityIs(".HomeScreenActivity")
   * ```
   * @param {string} currentActivity
   * @return {Promise<void>}
   *
   * Appium: support only Android
   */
  async seeCurrentActivityIs(currentActivity) {
    onlyForApps.call(this, 'Android');
    const res = await this.browser.getCurrentActivity();
    return truth('current activity', `to be ${currentActivity}`).assert(res === currentActivity);
  }

  /**
   * Check whether the device is locked.
   *
   * ```js
   * I.seeDeviceIsLocked();
   * ```
   *
   * @return {Promise<void>}
   *
   * Appium: support only Android
   */
  async seeDeviceIsLocked() {
    onlyForApps.call(this, 'Android');
    const res = await this.browser.isLocked();
    return truth('device', 'to be locked').assert(res);
  }

  /**
   * Check whether the device is not locked.
   *
   * ```js
   * I.seeDeviceIsUnlocked();
   * ```
   *
   * @return {Promise<void>}
   *
   * Appium: support only Android
   */
  async seeDeviceIsUnlocked() {
    onlyForApps.call(this, 'Android');
    const res = await this.browser.isLocked();
    return truth('device', 'to be locked').negate(res);
  }

  /**
   * Check the device orientation
   *
   * ```js
   * I.seeOrientationIs('PORTRAIT');
   * I.seeOrientationIs('LANDSCAPE')
   * ```
   *
   * @return {Promise<void>}
   *
   * @param {'LANDSCAPE'|'PORTRAIT'} orientation LANDSCAPE or PORTRAIT
   *
   * Appium: support Android and iOS
   */
  async seeOrientationIs(orientation) {
    onlyForApps.call(this);
    let currentOrientation;

    if (wdioV4) {
      const res = await this.browser.orientation();
      currentOrientation = res;
    }

    const res = await axios({
      method: 'get',
      url: `${this._buildAppiumEndpoint()}/session/${this.browser.sessionId}/orientation`,
    });

    currentOrientation = res.data.value;
    return truth('orientation', `to be ${orientation}`).assert(currentOrientation === orientation);
  }

  /**
   * Set a device orientation. Will fail, if app will not set orientation
   *
   * ```js
   * I.setOrientation('PORTRAIT');
   * I.setOrientation('LANDSCAPE')
   * ```
   *
   * @param {'LANDSCAPE'|'PORTRAIT'} orientation LANDSCAPE or PORTRAIT
   *
   * Appium: support Android and iOS
   */
  async setOrientation(orientation) {
    onlyForApps.call(this);
    if (wdioV4) {
      return this.browser.setOrientation(orientation);
    }

    return axios({
      method: 'post',
      url: `${this._buildAppiumEndpoint()}/session/${this.browser.sessionId}/orientation`,
      data: { orientation },
    });
  }

  /**
   * Get list of all available contexts
   *
   * ```
   * let contexts = await I.grabAllContexts();
   * ```
   *
   * @return {Promise<string[]>}
   *
   * Appium: support Android and iOS
   */
  async grabAllContexts() {
    onlyForApps.call(this);
    return this.browser.getContexts();
  }

  /**
   * Retrieve current context
   *
   * ```js
   * let context = await I.grabContext();
   * ```
   *
   * @return {Promise<string|null>}
   *
   * Appium: support Android and iOS
   */
  async grabContext() {
    onlyForApps.call(this);
    return this.browser.getContext();
  }

  /**
   * Get current device activity.
   *
   * ```js
   * let activity = await I.grabCurrentActivity();
   * ```
   *
   * @return {Promise<string>}
   *
   * Appium: support only Android
   */
  async grabCurrentActivity() {
    onlyForApps.call(this, 'Android');
    return this.browser.getCurrentActivity();
  }

  /**
   * Get information about the current network connection (Data/WIFI/Airplane).
   * The actual server value will be a number. However WebdriverIO additional
   * properties to the response object to allow easier assertions.
   *
   * ```js
   * let con = await I.grabNetworkConnection();
   * ```
   *
   * @return {Promise<{}>}
   *
   * Appium: support only Android
   */
  async grabNetworkConnection() {
    onlyForApps.call(this, 'Android');
    const res = await this.browser.getNetworkConnection();
    return {
      value: res,
      inAirplaneMode: res.inAirplaneMode,
      hasWifi: res.hasWifi,
      hasData: res.hasData,
    };
  }

  /**
   * Get current orientation.
   *
   * ```js
   * let orientation = await I.grabOrientation();
   * ```
   *
   * @return {Promise<string>}
   *
   * Appium: support Android and iOS
   */
  async grabOrientation() {
    onlyForApps.call(this);
    const res = await this.browser.orientation();
    this.debugSection('Orientation', res);
    return res;
  }

  /**
   * Get all the currently specified settings.
   *
   * ```js
   * let settings = await I.grabSettings();
   * ```
   *
   * @return {Promise<string>}
   *
   * Appium: support Android and iOS
   */
  async grabSettings() {
    onlyForApps.call(this);
    const res = await this.browser.getSettings();
    this.debugSection('Settings', JSON.stringify(res));
    return res;
  }

  /**
   * Switch to the specified context.
   *
   * @param {*} context the context to switch to
   */
  async _switchToContext(context) {
    return this.browser.switchContext(context);
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
   * @return {Promise<void>}
   *
   * @param {string} [context]
   */
  async switchToWeb(context) {
    this.isWeb = true;
    this.defaultContext = 'body';

    if (context) return this._switchToContext(context);
    const contexts = await this.grabAllContexts();
    this.debugSection('Contexts', contexts.toString());
    for (const idx in contexts) {
      if (contexts[idx].match(/^WEBVIEW/)) return this._switchToContext(contexts[idx]);
    }

    throw new Error('No WEBVIEW could be guessed, please specify one in params');
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
   * @param {*} [context]
   * @return {Promise<void>}
   */
  async switchToNative(context = null) {
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
   * @return {Promise<void>}
   *
   * Appium: support only Android
   */
  async startActivity(appPackage, appActivity) {
    onlyForApps.call(this, 'Android');
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
   * @return {Promise<{}>}
   *
   * Appium: support only Android
   */
  async setNetworkConnection(value) {
    onlyForApps.call(this, 'Android');
    return this.browser.setNetworkConnection(value);
  }

  /**
   * Update the current setting on the device
   *
   * ```js
   * I.setSettings({cyberdelia: 'open'});
   * ```
   *
   * @param {object} settings object
   *
   * Appium: support Android and iOS
   */
  async setSettings(settings) {
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
   * Appium: support Android and iOS
   *
   * @param {'tapOutside' | 'pressKey'} [strategy] Desired strategy to close keyboard (‘tapOutside’ or ‘pressKey’)
   * @param {string} [key] Optional key
   */
  async hideDeviceKeyboard(strategy, key) {
    onlyForApps.call(this);
    strategy = strategy || 'tapOutside';
    return this.browser.hideKeyboard(strategy, key);
  }

  /**
   * Send a key event to the device.
   * List of keys: https://developer.android.com/reference/android/view/KeyEvent.html
   *
   * ```js
   * I.sendDeviceKeyEvent(3);
   * ```
   *
   * @param {number} keyValue  Device specific key value
   * @return {Promise<void>}
   *
   * Appium: support only Android
   */
  async sendDeviceKeyEvent(keyValue) {
    onlyForApps.call(this, 'Android');
    if (wdioV4) {
      return this.browser.sendKeyEvent(keyValue);
    }
    return this.browser.pressKeyCode(keyValue);
  }

  /**
   * Open the notifications panel on the device.
   *
   * ```js
   * I.openNotifications();
   * ```
   *
   * @return {Promise<void>}
   *
   * Appium: support only Android
   */
  async openNotifications() {
    onlyForApps.call(this, 'Android');
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
   * @return {Promise<void>}
   *
   * Appium: support Android and iOS
   */
  async makeTouchAction(locator, action) {
    onlyForApps.call(this);
    const element = await this.browser.$(parseLocator.call(this, locator));

    return this.browser.touchAction({
      action,
      element,
    });
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
   * @return {Promise<void>}
   *
   * @param {*} locator
   */
  async tap(locator) {
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
   * @param {CodeceptJS.LocatorOrString} locator
   * @param {number} xoffset
   * @param {number} yoffset
   * @param {number} [speed=1000] (optional), 1000 by default
   * @return {Promise<void>}
   *
   * Appium: support Android and iOS
   */
  /* eslint-disable */
  async swipe(locator, xoffset, yoffset, speed = 1000) {
    onlyForApps.call(this);
    const res = await this.browser.$(parseLocator.call(this, locator));
    // if (!res.length) throw new ElementNotFound(locator, 'was not found in UI');
    return this.performSwipe(await res.getLocation(), { x: await res.getLocation().x + xoffset, y: await res.getLocation().y + yoffset });
  }
  /* eslint-enable */

  /**
   * Perform a swipe on the screen.
   *
   * ```js
   * I.performSwipe({ x: 300, y: 100 }, { x: 200, y: 100 });
   * ```
   *
   * @param {object} from
   * @param {object} to
   *
   * Appium: support Android and iOS
   */
  async performSwipe(from, to) {
    await this.browser.touchPerform([{
      action: 'press',
      options: from,
    }, {
      action: 'wait',
      options: { ms: 1000 },
    }, {
      action: 'moveTo',
      options: to,
    }, {
      action: 'release',
    }]);
    await this.browser.pause(1000);
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
   * @param {CodeceptJS.LocatorOrString} locator
   * @param {number} [yoffset] (optional)
   * @param {number} [speed=1000] (optional), 1000 by default
   * @return {Promise<void>}
   *
   * Appium: support Android and iOS
   */
  async swipeDown(locator, yoffset = 1000, speed) {
    onlyForApps.call(this);

    if (!speed) {
      speed = yoffset;
      yoffset = 100;
    }

    return this.swipe(locator, 0, yoffset, speed);
  }

  /**
   *
   * Perform a swipe left on an element.
   *
   * ```js
   * let locator = "#io.selendroid.testapp:id/LinearLayout1";
   * I.swipeLeft(locator); // simple swipe
   * I.swipeLeft(locator, 500); // set speed
   * I.swipeLeft(locator, 1200, 1000); // set offset and speed
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator
   * @param {number} [xoffset] (optional)
   * @param {number} [speed=1000] (optional), 1000 by default
   * @return {Promise<void>}
   *
   * Appium: support Android and iOS
   */
  async swipeLeft(locator, xoffset = 1000, speed) {
    onlyForApps.call(this);
    if (!speed) {
      speed = xoffset;
      xoffset = 100;
    }

    return this.swipe(parseLocator.call(this, locator), -xoffset, 0, speed);
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
   * @param {CodeceptJS.LocatorOrString} locator
   * @param {number} [xoffset] (optional)
   * @param {number} [speed=1000] (optional), 1000 by default
   * @return {Promise<void>}
   *
   * Appium: support Android and iOS
   */
  async swipeRight(locator, xoffset = 1000, speed) {
    onlyForApps.call(this);
    if (!speed) {
      speed = xoffset;
      xoffset = 100;
    }

    return this.swipe(parseLocator.call(this, locator), xoffset, 0, speed);
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
   * @param {CodeceptJS.LocatorOrString} locator
   * @param {number} [yoffset] (optional)
   * @param {number} [speed=1000] (optional), 1000 by default
   * @return {Promise<void>}
   *
   * Appium: support Android and iOS
   */
  async swipeUp(locator, yoffset = 1000, speed) {
    onlyForApps.call(this);

    if (!speed) {
      speed = yoffset;
      yoffset = 100;
    }

    return this.swipe(parseLocator.call(this, locator), 0, -yoffset, speed);
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
   * @param {string} searchableLocator
   * @param {string} scrollLocator
   * @param {string} direction
   * @param {number} timeout
   * @param {number} offset
   * @param {number} speed
   * @return {Promise<void>}
   *
   * Appium: support Android and iOS
   */
  async swipeTo(searchableLocator, scrollLocator, direction, timeout, offset, speed) {
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

    const errorMsg = `element ("${searchableLocator}") still not visible after ${timeout}seconds`;
    const browser = this.browser;
    let err = false;
    let currentSource;
    return browser.waitUntil(() => {
      if (err) {
        return new Error(`Scroll to the end and element ${searchableLocator} was not found`);
      }
      return browser.$$(parseLocator.call(this, searchableLocator))
        .then(els => els.length && els[0].isDisplayed())
        .then((res) => {
          if (res) {
            return true;
          }
          return this[direction](scrollLocator, offset, speed).getSource().then((source) => {
            if (source === currentSource) {
              err = true;
            } else {
              currentSource = source;
              return false;
            }
          });
        });
    }, timeout * 1000, errorMsg)
      .catch((e) => {
        if (e.message.indexOf('timeout') && e.type !== 'NoSuchElement') {
          throw new AssertionFailedError({ customMessage: `Scroll to the end and element ${searchableLocator} was not found` }, '');
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
   *
   * @param {Array} actions Array of touch actions
   */
  async touchPerform(actions) {
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
   * @param {string} path
   * @param {string} dest
   * @return {Promise<string>}
   *
   * Appium: support Android and iOS
   */
  async pullFile(path, dest) {
    onlyForApps.call(this);
    return this.browser.pullFile(path).then(res => fs.writeFile(dest, Buffer.from(res, 'base64'), (err) => {
      if (err) {
        return false;
      }
      return true;
    }));
  }

  /**
   * Perform a shake action on the device.
   *
   * ```js
   * I.shakeDevice();
   * ```
   *
   * @return {Promise<void>}
   *
   * Appium: support only iOS
   */
  async shakeDevice() {
    onlyForApps.call(this, 'iOS');
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
   * @return {Promise<void>}
   *
   * Appium: support only iOS
   */
  async rotate(x, y, duration, radius, rotation, touchCount) {
    onlyForApps.call(this, 'iOS');
    return this.browser.rotate(x, y, duration, radius, rotation, touchCount);
  }

  /**
   * Set immediate value in app.
   *
   * See corresponding [webdriverio reference](http://webdriver.io/api/mobile/setImmediateValue.html).
   *
   * @return {Promise<void>}
   *
   * Appium: support only iOS
   */
  async setImmediateValue(id, value) {
    onlyForApps.call(this, 'iOS');
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
   * @return {Promise<void>}
   *
   * Appium: support only iOS
   * TODO: not tested
   */
  async simulateTouchId(match) {
    onlyForApps.call(this, 'iOS');
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
   * @return {Promise<void>}
   *
   * Appium: support only iOS
   */
  async closeApp() {
    onlyForApps.call(this, 'iOS');
    return this.browser.closeApp();
  }

  /**
   * {{> appendField }}
   *
   */
  async appendField(field, value) {
    if (this.isWeb) return super.appendField(field, value);
    return super.appendField(parseLocator.call(this, field), value);
  }

  /**
   * {{> checkOption }}
   *
   */
  async checkOption(field) {
    if (this.isWeb) return super.checkOption(field);
    return super.checkOption(parseLocator.call(this, field));
  }

  /**
   * {{> click }}
   *
   */
  async click(locator, context) {
    if (this.isWeb) return super.click(locator, context);
    return super.click(parseLocator.call(this, locator), parseLocator.call(this, context));
  }

  /**
   * {{> dontSeeCheckboxIsChecked }}
   *
   */
  async dontSeeCheckboxIsChecked(field) {
    if (this.isWeb) return super.dontSeeCheckboxIsChecked(field);
    return super.dontSeeCheckboxIsChecked(parseLocator.call(this, field));
  }

  /**
   * {{> dontSeeElement }}
   */
  async dontSeeElement(locator) {
    if (this.isWeb) return super.dontSeeElement(locator);
    return super.dontSeeElement(parseLocator.call(this, locator));
  }

  /**
   * {{> dontSeeInField }}
   *
   */
  async dontSeeInField(field, value) {
    if (this.isWeb) return super.dontSeeInField(field, value);
    return super.dontSeeInField(parseLocator.call(this, field), value);
  }

  /**
   * {{> dontSee }}
   */
  async dontSee(text, context = null) {
    if (this.isWeb) return super.dontSee(text, context);
    return super.dontSee(text, parseLocator.call(this, context));
  }

  /**
   * {{> fillField }}
   *
   */
  async fillField(field, value) {
    value = value.toString();
    if (this.isWeb) return super.fillField(field, value);
    return super.fillField(parseLocator.call(this, field), value);
  }

  /**
   * {{> grabTextFromAll }}
   *
   */
  async grabTextFromAll(locator) {
    if (this.isWeb) return super.grabTextFromAll(locator);
    return super.grabTextFromAll(parseLocator.call(this, locator));
  }

  /**
   * {{> grabTextFrom }}
   *
   */
  async grabTextFrom(locator) {
    if (this.isWeb) return super.grabTextFrom(locator);
    return super.grabTextFrom(parseLocator.call(this, locator));
  }

  /**
   * {{> grabNumberOfVisibleElements }}
   */
  async grabNumberOfVisibleElements(locator) {
    if (this.isWeb) return super.grabNumberOfVisibleElements(locator);
    return super.grabNumberOfVisibleElements(parseLocator.call(this, locator));
  }

  /**
   * Can be used for apps only with several values ("contentDescription", "text", "className", "resourceId")
   *
   * {{> grabAttributeFrom }}
   */
  async grabAttributeFrom(locator, attr) {
    if (this.isWeb) return super.grabAttributeFrom(locator, attr);
    return super.grabAttributeFrom(parseLocator.call(this, locator), attr);
  }

  /**
   * Can be used for apps only with several values ("contentDescription", "text", "className", "resourceId")
   * {{> grabAttributeFromAll }}
   */
  async grabAttributeFromAll(locator, attr) {
    if (this.isWeb) return super.grabAttributeFromAll(locator, attr);
    return super.grabAttributeFromAll(parseLocator.call(this, locator), attr);
  }

  /**
   * {{> grabValueFromAll }}
   *
   */
  async grabValueFromAll(locator) {
    if (this.isWeb) return super.grabValueFromAll(locator);
    return super.grabValueFromAll(parseLocator.call(this, locator));
  }

  /**
   * {{> grabValueFrom }}
   *
   */
  async grabValueFrom(locator) {
    if (this.isWeb) return super.grabValueFrom(locator);
    return super.grabValueFrom(parseLocator.call(this, locator));
  }

  /**
   * Saves a screenshot to ouput folder (set in codecept.json or codecept.conf.js).
   * Filename is relative to output folder.
   *
   * ```js
   * I.saveScreenshot('debug.png');
   * ```
   *
   * @param {string} fileName file name to save.
   * @return {Promise<void>}
   */
  async saveScreenshot(fileName) {
    return super.saveScreenshot(fileName, false);
  }

  /**
   * {{> scrollIntoView }}
   *
   * Supported only for web testing
   */
  async scrollIntoView(locator, scrollIntoViewOptions) {
    if (this.isWeb) return super.scrollIntoView(locator, scrollIntoViewOptions);
  }

  /**
   * {{> seeCheckboxIsChecked }}
   *
   */
  async seeCheckboxIsChecked(field) {
    if (this.isWeb) return super.seeCheckboxIsChecked(field);
    return super.seeCheckboxIsChecked(parseLocator.call(this, field));
  }

  /**
   * {{> seeElement }}
   *
   */
  async seeElement(locator) {
    if (this.isWeb) return super.seeElement(locator);
    return super.seeElement(parseLocator.call(this, locator));
  }

  /**
   * {{> seeInField }}
   *
   */
  async seeInField(field, value) {
    if (this.isWeb) return super.seeInField(field, value);
    return super.seeInField(parseLocator.call(this, field), value);
  }

  /**
   * {{> see }}
   *
   */
  async see(text, context) {
    if (this.isWeb) return super.see(text, context);
    return super.see(text, parseLocator.call(this, context));
  }

  /**
   * {{> selectOption }}
   *
   * Supported only for web testing
   */
  async selectOption(select, option) {
    if (this.isWeb) return super.selectOption(select, option);
    throw new Error('Should be used only in Web context. In native context use \'click\' method instead');
  }

  /**
   * {{> waitForElement }}
   *
   */
  async waitForElement(locator, sec = null) {
    if (this.isWeb) return super.waitForElement(locator, sec);
    return super.waitForElement(parseLocator.call(this, locator), sec);
  }

  /**
   * {{> waitForVisible }}
   *
   */
  async waitForVisible(locator, sec = null) {
    if (this.isWeb) return super.waitForVisible(locator, sec);
    return super.waitForVisible(parseLocator.call(this, locator), sec);
  }

  /**
   * {{> waitForInvisible }}
   *
   */
  async waitForInvisible(locator, sec = null) {
    if (this.isWeb) return super.waitForInvisible(locator, sec);
    return super.waitForInvisible(parseLocator.call(this, locator), sec);
  }

  /**
   * {{> waitForText }}
   *
   */
  async waitForText(text, sec = null, context = null) {
    if (this.isWeb) return super.waitForText(text, sec, context);
    return super.waitForText(text, sec, parseLocator.call(this, context));
  }
}

function parseLocator(locator) {
  if (!locator) return null;

  if (typeof locator === 'object') {
    if (locator.web && this.isWeb) {
      return parseLocator.call(this, locator.web);
    }

    if (locator.android && this.platform === 'android') {
      if (typeof locator.android === 'string') {
        return parseLocator.call(this, locator.android);
      }
      // The locator is an Android DataMatcher or ViewMatcher locator so return as is
      return locator.android;
    }

    if (locator.ios && this.platform === 'ios') {
      return parseLocator.call(this, locator.ios);
    }
  }

  if (typeof locator === 'string') {
    if (locator[0] === '~') return locator;
    if (locator.substr(0, 2) === '//') return locator;
    if (locator[0] === '#' && !this.isWeb) {
      // hook before webdriverio supports native # locators
      return parseLocator.call(this, { id: locator.slice(1) });
    }

    if (this.platform === 'android' && !this.isWeb) {
      const isNativeLocator = /^\-?android=?/.exec(locator);
      return isNativeLocator
        ? locator
        : `android=new UiSelector().text("${locator}")`;
    }
  }

  locator = new Locator(locator, 'xpath');
  if (locator.type === 'css' && !this.isWeb) throw new Error('Unable to use css locators in apps. Locator strategies for this request: xpath, id, class name or accessibility id');
  if (locator.type === 'name' && !this.isWeb) throw new Error("Can't locate element by name in Native context. Use either ID, class name or accessibility id");
  if (locator.type === 'id' && !this.isWeb && this.platform === 'android') return `//*[@resource-id='${locator.value}']`;
  return locator.simplify();
}

// in the end of a file
function onlyForApps(expectedPlatform) {
  const stack = new Error().stack || '';
  const re = /Appium.(\w+)/g;
  const caller = stack.split('\n')[2].trim();
  const m = re.exec(caller);

  if (!m) {
    throw new Error(`Invalid caller ${caller}`);
  }

  const callerName = m[1] || m[2];
  if (!expectedPlatform) {
    if (!this.platform) {
      throw new Error(`${callerName} method can be used only with apps`);
    }
  } else if (this.platform !== expectedPlatform.toLowerCase()) {
    throw new Error(`${callerName} method can be used only with ${expectedPlatform} apps`);
  }
}

module.exports = Appium;
