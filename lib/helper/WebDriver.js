let webdriverio;
const assert = require('assert');
const path = require('path');
const requireg = require('requireg');
const Helper = require('../helper');
const stringIncludes = require('../assert/include').includes;
const { urlEquals, equals } = require('../assert/equal');
const { debug } = require('../output');
const empty = require('../assert/empty').empty;
const truth = require('../assert/truth').truth;
const {
  xpathLocator,
  fileExists,
  decodeUrl,
  chunkArray,
  convertCssPropertiesToCamelCase,
  screenshotOutputFolder,
  fileToBase64Zip,
} = require('../utils');
const {
  isColorProperty,
  convertColorToRGBA,
} = require('../colorUtils');
const ElementNotFound = require('./errors/ElementNotFound');
const ConnectionRefused = require('./errors/ConnectionRefused');
const Locator = require('../locator');

const webRoot = 'body';

/**
 * WebDriver helper which wraps [webdriverio](http://webdriver.io/) library to
 * manipulate browser using Selenium WebDriver or PhantomJS.
 *
 * WebDriver requires [Selenium Server and ChromeDriver/GeckoDriver to be installed](http://codecept.io/quickstart/#prepare-selenium-server).
 *
 * ### Configuration
 *
 * This helper should be configured in codecept.json or codecept.conf.js
 *
 * * `url`: base url of website to be tested.
 * * `browser`: browser in which to perform testing.
 * * `host`: (optional, default: localhost) - WebDriver host to connect.
 * * `port`: (optional, default: 4444) - WebDriver port to connect.
 * * `protocol`: (optional, default: http) - protocol for WebDriver server.
 * * `path`: (optional, default: /wd/hub) - path to WebDriver server,
 * * `remoteFileUpload`: (optional, default: true) - upload file to remote server when running `attachFile`.
 * * `restart`: (optional, default: true) - restart browser between tests.
 * * `smartWait`: (optional) **enables [SmartWait](http://codecept.io/acceptance/#smartwait)**; wait for additional milliseconds for element to appear. Enable for 5 secs: "smartWait": 5000.
 * * `disableScreenshots`: (optional, default: false) - don't save screenshots on failure.
 * * `fullPageScreenshots` (optional, default: false) - make full page screenshots on failure.
 * * `uniqueScreenshotNames`: (optional, default: false) - option to prevent screenshot override if you have scenarios with the same name in different suites.
 * * `keepBrowserState`: (optional, default: false) - keep browser state between tests when `restart` is set to false.
 * * `keepCookies`: (optional, default: false) - keep cookies between tests when `restart` set to false.
 * * `windowSize`: (optional) default window size. Set to `maximize` or a dimension in the format `640x480`.
 * * `waitForTimeout`: (optional, default: 1000) sets default wait time in *ms* for all `wait*` functions.
 * * `desiredCapabilities`: Selenium's [desired
 * capabilities](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities).
 * * `manualStart`: (optional, default: false) - do not start browser before a test, start it manually inside a helper
 * with `this.helpers["WebDriver"]._startBrowser()`.
 * * `timeouts`: [WebDriver timeouts](http://webdriver.io/docs/timeouts.html) defined as hash.
 *
 * Example:
 *
 * ```json
 * {
 *    "helpers": {
 *      "WebDriver" : {
 *        "smartWait": 5000,
 *        "browser": "chrome",
 *        "restart": false,
 *        "windowSize": "maximize",
 *        "timeouts": {
 *          "script": 60000,
 *          "page load": 10000
 *        }
 *      }
 *    }
 * }
 * ```
 *
 * Additional configuration params can be used from [webdriverio
 * website](http://webdriver.io/guide/getstarted/configuration.html).
 *
 * ### Headless Chrome
 *
 * ```json
 * {
 *    "helpers": {
 *      "WebDriver" : {
 *        "url": "http://localhost",
 *        "browser": "chrome",
 *        "desiredCapabilities": {
 *          "chromeOptions": {
 *            "args": [ "--headless", "--disable-gpu", "--window-size=800,600" ]
 *          }
 *        }
 *      }
 *    }
 * }
 * ```
 *
 * ### Internet Explorer
 * Additional configuration params can be used from [IE options](https://seleniumhq.github.io/selenium/docs/api/rb/Selenium/WebDriver/IE/Options.html)
 *
 * ```json
 * {
 *    "helpers": {
 *      "WebDriver" : {
 *        "url": "http://localhost",
 *        "browser": "internet explorer",
 *        "desiredCapabilities": {
 *          "ieOptions": {
 *            "ie.browserCommandLineSwitches": "-private",
 *            "ie.usePerProcessProxy": true,
 *            "ie.ensureCleanSession": true,
 *          }
 *        }
 *      }
 *    }
 * }
 * ```
 *
 * ### Selenoid Options
 *
 * ```json
 * {
 *    "helpers": {
 *      "WebDriver" : {
 *        "url": "http://localhost",
 *        "browser": "chrome",
 *        "desiredCapabilities": {
 *          "selenoidOptions": {
 *            "enableVNC": true,
 *          }
 *        }
 *      }
 *    }
 * }
 * ```
 *
 * ### Connect through proxy
 *
 * CodeceptJS also provides flexible options when you want to execute tests to Selenium servers through proxy. You will
 * need to update the `helpers.WebDriver.capabilities.proxy` key.
 *
 * ```js
 * {
 *     "helpers": {
 *         "WebDriver": {
 *             "capabilities": {
 *                 "proxy": {
 *                     "proxyType": "manual|pac",
 *                     "proxyAutoconfigUrl": "URL TO PAC FILE",
 *                     "httpProxy": "PROXY SERVER",
 *                     "sslProxy": "PROXY SERVER",
 *                     "ftpProxy": "PROXY SERVER",
 *                     "socksProxy": "PROXY SERVER",
 *                     "socksUsername": "USERNAME",
 *                     "socksPassword": "PASSWORD",
 *                     "noProxy": "BYPASS ADDRESSES"
 *                 }
 *             }
 *         }
 *     }
 * }
 * ```
 * For example,
 *
 * ```js
 * {
 *     "helpers": {
 *         "WebDriver": {
 *             "capabilities": {
 *                 "proxy": {
 *                     "proxyType": "manual",
 *                     "httpProxy": "http://corporate.proxy:8080",
 *                     "socksUsername": "codeceptjs",
 *                     "socksPassword": "secret",
 *                     "noProxy": "127.0.0.1,localhost"
 *                 }
 *             }
 *         }
 *     }
 * }
 * ```
 *
 * Please refer to [Selenium - Proxy Object](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities) for more
 * information.
 *
 * ### Cloud Providers
 *
 * WebDriver makes it possible to execute tests against services like `Sauce Labs` `BrowserStack` `TestingBot`
 * Check out their documentation on [available parameters](http://webdriver.io/guide/usage/cloudservices.html)
 *
 * Connecting to `BrowserStack` and `Sauce Labs` is simple. All you need to do
 * is set the `user` and `key` parameters. WebDriver automatically know which
 * service provider to connect to.
 *
 * ```js
 * {
 *     "helpers":{
 *         "WebDriver": {
 *             "url": "YOUR_DESIRED_HOST",
 *             "user": "YOUR_BROWSERSTACK_USER",
 *             "key": "YOUR_BROWSERSTACK_KEY",
 *             "capabilities": {
 *                 "browserName": "chrome",
 *
 *                 // only set this if you're using BrowserStackLocal to test a local domain
 *                 // "browserstack.local": true,
 *
 *                 // set this option to tell browserstack to provide addition debugging info
 *                 // "browserstack.debug": true,
 *             }
 *         }
 *     }
 * }
 * ```
 *
 * ### Multiremote Capabilities
 *
 * This is a work in progress but you can control two browsers at a time right out of the box.
 * Individual control is something that is planned for a later version.
 *
 * Here is the [webdriverio docs](http://webdriver.io/guide/usage/multiremote.html) on the subject
 *
 * ```js
 * {
 *     "helpers": {
 *         "WebDriver": {
 *             "multiremote": {
 *                 "MyChrome": {
 *                     "desiredCapabilities": {
 *                         "browserName": "chrome"
 *                      }
 *                 },
 *                 "MyFirefox": {
 *                    "desiredCapabilities": {
 *                        "browserName": "firefox"
 *                    }
 *                 }
 *             }
 *         }
 *     }
 * }
 * ```
 *
 *
 * ## Access From Helpers
 *
 * Receive a WebDriver client from a custom helper by accessing `browser` property:
 *
 * ```js
 * this.helpers['WebDriver'].browser
 * ```
 *
 * ## Methods
 */
class WebDriver extends Helper {
  constructor(config) {
    super(config);
    webdriverio = requireg('webdriverio');
    if (webdriverio.VERSION && webdriverio.VERSION.indexOf('4') === 0) {
      throw new Error('This helper is compatible with "webdriverio@5". Please upgrade webdriverio to v5+ or use WebDriverIO helper instead');
    }
    // set defaults
    this.root = webRoot;
    this.isWeb = true;
    this.isRunning = false;

    this._setConfig(config);

    Locator.addFilter((locator, result) => {
      if (typeof locator === 'string' && locator.indexOf('~') === 0) {
        // accessibility locator
        if (this.isWeb) {
          result.value = `[aria-label="${locator.slice(1)}"]`;
          result.type = 'css';
          result.output = `aria-label=${locator.slice(1)}`;
        }
      }
    });
  }

  _validateConfig(config) {
    const defaults = {
      logLevel: 'silent',

      // codeceptjs
      remoteFileUpload: true,
      smartWait: 0,
      waitForTimeout: 1000, // ms
      capabilities: {},
      restart: true,
      uniqueScreenshotNames: false,
      disableScreenshots: false,
      fullPageScreenshots: false,
      manualStart: false,
      keepCookies: false,
      keepBrowserState: false,
      deprecationWarnings: false,
      timeouts: {
        script: 1000, // ms
      },
    };


    // override defaults with config
    config = Object.assign(defaults, config);


    if (typeof config.host !== 'undefined') config.hostname = config.host; // webdriverio spec
    config.baseUrl = config.url || config.baseUrl;
    if (config.desiredCapabilities && Object.keys(config.desiredCapabilities).length) {
      config.capabilities = config.desiredCapabilities;
    }
    config.capabilities.browserName = config.browser || config.capabilities.browserName;
    if (config.capabilities.chromeOptions) {
      config.capabilities['goog:chromeOptions'] = config.capabilities.chromeOptions;
      delete config.capabilities.chromeOptions;
    }
    if (config.capabilities.firefoxOptions) {
      config.capabilities['moz:firefoxOptions'] = config.capabilities.firefoxOptions;
      delete config.capabilities.firefoxOptions;
    }
    if (config.capabilities.ieOptions) {
      config.capabilities['se:ieOptions'] = config.capabilities.ieOptions;
      delete config.capabilities.ieOptions;
    }
    if (config.capabilities.selenoidOptions) {
      config.capabilities['selenoid:options'] = config.capabilities.selenoidOptions;
      delete config.capabilities.selenoidOptions;
    }

    config.waitForTimeout /= 1000; // convert to seconds

    if (!config.capabilities.platformName && (!config.url || !config.browser)) {
      throw new Error(`
        WebDriver requires at url and browser to be set.
        Check your codeceptjs config file to ensure these are set properly
          {
            "helpers": {
              "WebDriver": {
                "url": "YOUR_HOST"
                "browser": "YOUR_PREFERRED_TESTING_BROWSER"
              }
            }
          }
      `);
    }

    return config;
  }

  static _checkRequirements() {
    try {
      requireg('webdriverio');
    } catch (e) {
      return ['webdriverio@^5.2.2'];
    }
  }

  static _config() {
    return [{
      name: 'url',
      message: 'Base url of site to be tested',
      default: 'http://localhost',
    }, {
      name: 'browser',
      message: 'Browser in which testing will be performed',
      default: 'chrome',
    }];
  }

  _beforeSuite() {
    if (!this.options.restart && !this.options.manualStart && !this.isRunning) {
      this.debugSection('Session', 'Starting singleton browser session');
      return this._startBrowser();
    }
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

    this.isRunning = true;
    if (this.options.timeouts && this.isWeb) {
      await this.defineTimeout(this.options.timeouts);
    }

    if (this.isWeb && this.options.windowSize === 'maximize') {
      await this.resizeWindow('maximize');
    } else if (this.isWeb && this.options.windowSize && this.options.windowSize.indexOf('x') > 0) {
      const dimensions = this.options.windowSize.split('x');
      await this.resizeWindow(dimensions[0], dimensions[1]);
    }
    this.$$ = this.browser.$$.bind(this.browser);
    return this.browser;
  }

  async _stopBrowser() {
    if (this.browser && this.isRunning) await this.browser.deleteSession();
  }

  async _before() {
    this.context = this.root;
    if (this.options.restart && !this.options.manualStart) return this._startBrowser();
    if (!this.isRunning && !this.options.manualStart) return this._startBrowser();
    this.$$ = this.browser.$$.bind(this.browser);
    return this.browser;
  }

  async _after() {
    if (!this.isRunning) return;
    if (this.options.restart) {
      this.isRunning = false;
      return this.browser.deleteSession();
    }
    if (this.browser.isInsideFrame) await this.browser.switchToFrame(null);

    if (this.options.keepBrowserState) return;

    if (!this.options.keepCookies && this.options.capabilities.browserName) {
      this.debugSection('Session', 'cleaning cookies and localStorage');
      await this.browser.deleteCookies();
    }
    await this.browser.execute('localStorage.clear();').catch((err) => {
      if (!(err.message.indexOf("Storage is disabled inside 'data:' URLs.") > -1)) throw err;
    });
    await this.closeOtherTabs();
    return this.browser;
  }

  _afterSuite() {
  }

  _finishTest() {
    if (!this.options.restart && this.isRunning) return this._stopBrowser();
  }

  _session() {
    const defaultSession = this.browser;
    return {
      start: async (opts) => {
        // opts.disableScreenshots = true; // screenshots cant be saved as session will be already closed
        opts = this._validateConfig(Object.assign(this.options, opts));
        this.debugSection('New Browser', JSON.stringify(opts));
        return webdriverio.remote(opts);
      },
      stop: async (browser) => {
        return browser.deleteSession();
      },
      loadVars: async (browser) => {
        if (this.context !== this.root) throw new Error('Can\'t start session inside within block');
        this.browser = browser;
        this.$$ = this.browser.$$.bind(this.browser);
      },
      restoreVars: async () => {
        this.browser = defaultSession;
        this.$$ = this.browser.$$.bind(this.browser);
      },
    };
  }

  async _failed(test) {
    if (this.context !== this.root) await this._withinEnd();
  }

  async _withinBegin(locator) {
    const frame = isFrameLocator(locator);
    if (frame) {
      this.browser.isInsideFrame = true;
      if (Array.isArray(frame)) {
        // this.switchTo(null);
        await forEachAsync(frame, async f => this.switchTo(f));
        return;
      }
      await this.switchTo(frame);
      return;
    }
    this.context = locator;

    let res = await this.browser.$$(withStrictLocator(locator));
    assertElementExists(res, locator);
    res = usingFirstElement(res);
    this.context = res.selector;
    this.$$ = res.$$.bind(res);
  }

  async _withinEnd() {
    if (this.browser.isInsideFrame) {
      this.browser.isInsideFrame = false;
      return this.switchTo(null);
    }
    this.context = this.root;
    this.$$ = this.browser.$$.bind(this.browser);
  }

  /**
   * Get elements by different locator types, including strict locator.
   * Should be used in custom helpers:
   *
   * ```js
   * this.helpers['WebDriver']._locate({name: 'password'}).then //...
   * ```
   *
   * @param locator element located by CSS|XPath|strict locator.
   */
  async _locate(locator, smartWait = false) {
    if (require('../store').debugMode) smartWait = false;
    if (!this.options.smartWait || !smartWait) {
      const els = await this.$$(withStrictLocator(locator));
      return els;
    }
    this.debugSection(`SmartWait (${this.options.smartWait}ms)`, `Locating ${locator} in ${this.options.smartWait}`);

    await this.defineTimeout({ implicit: this.options.smartWait });
    const els = await this.$$(withStrictLocator(locator));
    await this.defineTimeout({ implicit: 0 });
    return els;
  }

  /**
   * Find a checkbox by providing human readable text:
   *
   * ```js
   * this.helpers['WebDriver']._locateCheckable('I agree with terms and conditions').then // ...
   * ```
   *
   * @param locator element located by CSS|XPath|strict locator.
   */
  async _locateCheckable(locator) {
    return findCheckable.call(this, locator, this.$$.bind(this)).then(res => res);
  }

  /**
   * Find a clickable element by providing human readable text:
   *
   * ```js
   * this.helpers['WebDriver']._locateClickable('Next page').then // ...
   * ```
   *
   * @param locator element located by CSS|XPath|strict locator.
   */
  async _locateClickable(locator) {
    return findClickable.call(this, locator, this.$$.bind(this)).then(res => res);
  }

  /**
   * Find field elements by providing human readable text:
   *
   * ```js
   * this.helpers['WebDriver']._locateFields('Your email').then // ...
   * ```
   *
   * @param locator element located by CSS|XPath|strict locator.
   */
  async _locateFields(locator) {
    return findFields.call(this, locator).then(res => res);
  }

  /**
   * Set [WebDriver timeouts](https://webdriver.io/docs/timeouts.html) in realtime.
   *
   *
   * * *Appium*: supported only for web testing.
   * Timeouts are expected to be passed as object:
   *
   * ```js
   * I.defineTimeout({ script: 5000 });
   * I.defineTimeout({ implicit: 10000, pageLoad: 10000, script: 5000 });
   * ```
   *
   * @param timeouts WebDriver timeouts object.
   */
  defineTimeout(timeouts) {
    return this.browser.setTimeout(timeouts);
  }

  /**
   * {{> ../webapi/amOnPage }}
   *
   *
   * * *Appium*: supported only for web testing
   */
  amOnPage(url) {
    return this.browser.url(url);
  }

  /**
   * {{> ../webapi/click }}
   *
   *
   * * *Appium*: supported
   */
  async click(locator, context = null) {
    const clickMethod = this.browser.isMobile ? 'touchClick' : 'elementClick';
    const locateFn = prepareLocateFn.call(this, context);

    const res = await findClickable.call(this, locator, locateFn);
    if (context) {
      assertElementExists(res, locator, 'Clickable element', `was not found inside element ${new Locator(context)}`);
    } else {
      assertElementExists(res, locator, 'Clickable element');
    }
    const elem = usingFirstElement(res);
    return this.browser[clickMethod](getElementId(elem));
  }

  /**
   * {{> ../webapi/doubleClick }}
   *
   *
   * * *Appium*: supported only for web testing
   */
  async doubleClick(locator, context = null) {
    const locateFn = prepareLocateFn.call(this, context);

    const res = await findClickable.call(this, locator, locateFn);
    if (context) {
      assertElementExists(res, locator, 'Clickable element', `was not found inside element ${new Locator(context)}`);
    } else {
      assertElementExists(res, locator, 'Clickable element');
    }

    const elem = usingFirstElement(res);
    return elem.doubleClick();
  }

  /**
   * {{> ../webapi/rightClick }}
   *
   *
   * * *Appium*: supported, but in apps works as usual click
   */
  async rightClick(locator, context) {
    const locateFn = prepareLocateFn.call(this, context);

    const res = await findClickable.call(this, locator, locateFn);
    if (context) {
      assertElementExists(res, locator, 'Clickable element', `was not found inside element ${new Locator(context)}`);
    } else {
      assertElementExists(res, locator, 'Clickable element');
    }

    const el = usingFirstElement(res);

    await el.moveTo();

    if (this.browser.isW3C) {
      // W3C version
      return this.browser.performActions([
        { type: 'pointerDown', button: 2 },
      ]);
    }
    // JSON Wire version
    await this.browser.buttonDown(2);
  }

  /**
   * {{> ../webapi/fillField }}
   *
   *
   * * *Appium*: supported
   */
  async fillField(field, value) {
    const res = await findFields.call(this, field);
    assertElementExists(res, field, 'Field');
    const elem = usingFirstElement(res);
    return elem.setValue(value.toString());
  }

  /**
   * {{> ../webapi/appendField }}
   *
   *
   * * *Appium*: supported, but it's clear a field before insert in apps
   */
  async appendField(field, value) {
    const res = await findFields.call(this, field);
    assertElementExists(res, field, 'Field');
    const elem = usingFirstElement(res);
    return elem.addValue(value);
  }


  /**
   * {{> ../webapi/clearField}}
   *
   *
   * * *Appium*: supported
   */
  async clearField(field) {
    const res = await findFields.call(this, field);
    assertElementExists(res, field, 'Field');
    const elem = usingFirstElement(res);
    return elem.clearValue(getElementId(elem));
  }


  /**
   * {{> ../webapi/selectOption}}
   */
  async selectOption(select, option) {
    const res = await findFields.call(this, select);
    assertElementExists(res, select, 'Selectable field');
    const elem = usingFirstElement(res);

    if (!Array.isArray(option)) {
      option = [option];
    }

    // select options by visible text
    let els = await forEachAsync(option, async opt => this.browser.findElementsFromElement(getElementId(elem), 'xpath', Locator.select.byVisibleText(xpathLocator.literal(opt))));

    const clickOptionFn = async (el) => {
      if (el[0]) el = el[0];
      const elementId = getElementId(el);
      if (elementId) return this.browser.elementClick(elementId);
    };

    if (Array.isArray(els) && els.length) {
      return forEachAsync(els, clickOptionFn);
    }
    // select options by value
    els = await forEachAsync(option, async opt => this.browser.findElementsFromElement(getElementId(elem), 'xpath', Locator.select.byValue(xpathLocator.literal(opt))));
    if (els.length === 0) {
      throw new ElementNotFound(select, `Option "${option}" in`, 'was not found neither by a visible text nor by a value');
    }
    return forEachAsync(els, clickOptionFn);
  }

  /**
   * {{> ../webapi/attachFile }}
   * Appium: not tested
   */
  async attachFile(locator, pathToFile) {
    let file = path.join(global.codecept_dir, pathToFile);
    if (!fileExists(file)) {
      throw new Error(`File at ${file} can not be found on local system`);
    }

    const res = await findFields.call(this, locator);
    this.debug(`Uploading ${file}`);
    assertElementExists(res, locator, 'File field');
    const el = usingFirstElement(res);

    // Remote Uplaod (when running Selenium Server)
    if (this.options.remoteFileUpload) {
      const fileCompressed = await fileToBase64Zip(file);
      try {
        this.debugSection('File', 'Uploading file to remote server');
        file = await this.browser.uploadFile(fileCompressed);
      } catch (err) {
        throw new Error(`File can't be transferred to remote server. Set \`remoteFileUpload: false\` in config to upload file locally.\n${err.message}`);
      }
    }

    return el.addValue(file);
  }

  /**
   * {{> ../webapi/checkOption }}
   * Appium: not tested
   */
  async checkOption(field, context = null) {
    const clickMethod = this.browser.isMobile ? 'touchClick' : 'elementClick';
    const locateFn = prepareLocateFn.call(this, context);

    const res = await findCheckable.call(this, field, locateFn);

    assertElementExists(res, field, 'Checkable');
    const elem = usingFirstElement(res);
    const elementId = getElementId(elem);

    const isSelected = await this.browser.isElementSelected(elementId);
    if (isSelected.value) return Promise.resolve(true);
    return this.browser[clickMethod](elementId);
  }

  /**
   * {{> ../webapi/uncheckOption }}
   * Appium: not tested
   */
  async uncheckOption(field, context = null) {
    const clickMethod = this.browser.isMobile ? 'touchClick' : 'elementClick';
    const locateFn = prepareLocateFn.call(this, context);

    const res = await findCheckable.call(this, field, locateFn);

    assertElementExists(res, field, 'Checkable');
    const elem = usingFirstElement(res);
    const elementId = getElementId(elem);

    const isSelected = await this.browser.isElementSelected(elementId);
    if (!isSelected.value) return Promise.resolve(true);
    return this.browser[clickMethod](elementId);
  }

  /**
   * {{> ../webapi/grabTextFrom }}
   *
   *
   * * *Appium*: supported
   */
  async grabTextFrom(locator) {
    const res = await this._locate(locator, true);
    assertElementExists(res, locator);
    let val;
    if (res.length > 1) {
      val = await forEachAsync(res, async el => this.browser.getElementText(getElementId(el)));
    } else {
      val = await this.browser.getElementText(getElementId(res[0]));
    }
    this.debugSection('Grab', val);
    return val;
  }

  /**
   * {{> ../webapi/grabHTMLFrom }}
   *
   *
   * * *Appium*: supported only for web testing
   */
  async grabHTMLFrom(locator) {
    const elems = await this._locate(locator, true);
    assertElementExists(elems, locator);
    const values = await Promise.all(elems.map(elem => elem.getHTML(false)));
    this.debugSection('Grab', values);
    if (Array.isArray(values) && values.length === 1) {
      return values[0];
    }
    return values;
  }

  /**
   * {{> ../webapi/grabValueFrom }}
   *
   *
   * * *Appium*: supported only for web testing
   */
  async grabValueFrom(locator) {
    const res = await this._locate(locator, true);
    assertElementExists(res, locator);

    return forEachAsync(res, async el => el.getValue());
  }

  /**
   * {{> ../webapi/grabCssPropertyFrom }}
   */
  async grabCssPropertyFrom(locator, cssProperty) {
    const res = await this._locate(locator, true);
    assertElementExists(res, locator);
    return forEachAsync(res, async el => this.browser.getElementCSSValue(getElementId(el), cssProperty));
  }

  /**
   * {{> ../webapi/grabAttributeFrom }}
   * Appium: can be used for apps only with several values ("contentDescription", "text", "className", "resourceId")
   */
  async grabAttributeFrom(locator, attr) {
    const res = await this._locate(locator, true);
    assertElementExists(res, locator);
    return forEachAsync(res, async el => el.getAttribute(attr));
  }

  /**
   * {{> ../webapi/seeInTitle }}
   *
   *
   * * *Appium*: supported only for web testing
   */
  async seeInTitle(text) {
    const title = await this.browser.getTitle();
    return stringIncludes('web page title').assert(text, title);
  }

  /**
   * Checks that title is equal to provided one.
   *
   * ```js
   * I.seeTitleEquals('Test title.');
   * ```
   *
   * @param text value to check.
   */
  async seeTitleEquals(text) {
    const title = await this.browser.getTitle();
    return assert.equal(title, text, `expected web page title to be ${text}, but found ${title}`);
  }

  /**
   * {{> ../webapi/dontSeeInTitle }}
   *
   *
   * * *Appium*: supported only for web testing
   */
  async dontSeeInTitle(text) {
    const title = await this.browser.getTitle();
    return stringIncludes('web page title').negate(text, title);
  }

  /**
   * {{> ../webapi/grabTitle }}
   *
   *
   * * *Appium*: supported only for web testing
   */
  async grabTitle() {
    const title = await this.browser.getTitle();
    this.debugSection('Title', title);
    return title;
  }

  /**
   * {{> ../webapi/see }}
   *
   *
   * * *Appium*: supported with context in apps
   */
  async see(text, context = null) {
    return proceedSee.call(this, 'assert', text, context);
  }

  /**
   * Checks that text is equal to provided one.
   *
   * ```js
   * I.seeTextEquals('text', 'h1');
   * ```
   *
   * @param text element value to check.
   * @param context (optional) element located by CSS|XPath|strict locator.
   */
  async seeTextEquals(text, context = null) {
    return proceedSee.call(this, 'assert', text, context, true);
  }

  /**
   * {{> ../webapi/dontSee }}
   *
   *
   * * *Appium*: supported with context in apps
   */
  async dontSee(text, context = null) {
    return proceedSee.call(this, 'negate', text, context);
  }

  /**
   * {{> ../webapi/seeInField }}
   *
   *
   * * *Appium*: supported only for web testing
   */
  async seeInField(field, value) {
    return proceedSeeField.call(this, 'assert', field, value);
  }

  /**
   * {{> ../webapi/dontSeeInField }}
   *
   *
   * * *Appium*: supported only for web testing
   */
  async dontSeeInField(field, value) {
    return proceedSeeField.call(this, 'negate', field, value);
  }

  /**
   * {{> ../webapi/seeCheckboxIsChecked }}
   * Appium: not tested
   */
  async seeCheckboxIsChecked(field) {
    return proceedSeeCheckbox.call(this, 'assert', field);
  }

  /**
   * {{> ../webapi/dontSeeCheckboxIsChecked }}
   * Appium: not tested
   */
  async dontSeeCheckboxIsChecked(field) {
    return proceedSeeCheckbox.call(this, 'negate', field);
  }

  /**
   * {{> ../webapi/seeElement }}
   *
   *
   * * *Appium*: supported
   */
  async seeElement(locator) {
    const res = await this._locate(withStrictLocator(locator), true);
    assertElementExists(res);
    const selected = await forEachAsync(res, async el => el.isDisplayed());
    return truth(`elements of ${locator}`, 'to be seen').assert(selected);
  }

  /**
   * {{> ../webapi/dontSeeElement}}
   *
   *
   * * *Appium*: supported
   */
  async dontSeeElement(locator) {
    const res = await this._locate(withStrictLocator(locator), false);
    if (!res || res.length === 0) {
      return truth(`elements of ${locator}`, 'to be seen').negate(false);
    }
    const selected = await forEachAsync(res, async el => el.isDisplayed());
    return truth(`elements of ${locator}`, 'to be seen').negate(selected);
  }

  /**
   * {{> ../webapi/seeElementInDOM }}
   *
   *
   * * *Appium*: supported
   */
  async seeElementInDOM(locator) {
    const res = await this.$$(withStrictLocator(locator));
    return empty('elements').negate(res);
  }

  /**
   * {{> ../webapi/dontSeeElementInDOM }}
   *
   *
   * * *Appium*: supported
   */
  async dontSeeElementInDOM(locator) {
    const res = await this.$$(withStrictLocator(locator));
    return empty('elements').assert(res);
  }

  /**
   * {{> ../webapi/seeInSource }}
   *
   *
   * * *Appium*: supported
   */
  async seeInSource(text) {
    const source = await this.browser.getPageSource();
    return stringIncludes('HTML source of a page').assert(text, source);
  }

  /**
   * {{> ../webapi/grabSource }}
   *
   *
   * * *Appium*: supported
   */
  async grabSource() {
    return this.browser.getPageSource();
  }

  /**
   * Get JS log from browser. Log buffer is reset after each request.
   *
   * ```js
   * let logs = await I.grabBrowserLogs();
   * console.log(JSON.stringify(logs))
   * ```
   */
  async grabBrowserLogs() {
    if (this.browser.isW3C) {
      this.debug('Logs not awailable in W3C specification');
      return;
    }
    return this.browser.getLogs('browser');
  }

  /**
   * {{> ../webapi/grabCurrentUrl }}
   */
  async grabCurrentUrl() {
    const res = await this.browser.getUrl();
    this.debugSection('Url', res);
    return res;
  }

  /**
   * {{> ../webapi/dontSeeInSource }}
   *
   *
   * * *Appium*: supported
   */
  async dontSeeInSource(text) {
    const source = await this.browser.getPageSource();
    return stringIncludes('HTML source of a page').negate(text, source);
  }

  /**
   * Asserts that an element appears a given number of times in the DOM.
   * Element is located by label or name or CSS or XPath.
   *
   *
   * * *Appium*: supported
   *
   * ```js
   * I.seeNumberOfElements('#submitBtn', 1);
   * ```
   *
   * @param locator element located by CSS|XPath|strict locator.
   * @param num number of elements.
   */
  async seeNumberOfElements(locator, num) {
    const res = await this._locate(locator);
    return assert.equal(res.length, num, `expected number of elements (${locator}) is ${num}, but found ${res.length}`);
  }

  /**
   * {{> ../webapi/seeNumberOfVisibleElements }}
   */
  async seeNumberOfVisibleElements(locator, num) {
    const res = await this.grabNumberOfVisibleElements(locator);
    return assert.equal(res, num, `expected number of visible elements (${locator}) is ${num}, but found ${res}`);
  }

  /**
   * {{> ../webapi/seeCssPropertiesOnElements }}
   */
  async seeCssPropertiesOnElements(locator, cssProperties) {
    const res = await this._locate(locator);
    assertElementExists(res, locator);
    const elemAmount = res.length;

    let props = await forEachAsync(res, async (el) => {
      return forEachAsync(Object.keys(cssProperties), async (prop) => {
        const propValue = await this.browser.getElementCSSValue(getElementId(el), prop);
        if (isColorProperty(prop) && propValue && propValue.value) {
          return convertColorToRGBA(propValue.value);
        }
        return propValue;
      });
    });

    const cssPropertiesCamelCase = convertCssPropertiesToCamelCase(cssProperties);

    const values = Object.keys(cssPropertiesCamelCase).map(key => cssPropertiesCamelCase[key]);
    if (!Array.isArray(props)) props = [props];
    let chunked = chunkArray(props, values.length);
    chunked = chunked.filter((val) => {
      for (let i = 0; i < val.length; ++i) {
        if (val[i] !== values[i]) return false;
      }
      return true;
    });
    return assert.ok(
      chunked.length === elemAmount,
      `expected all elements (${locator}) to have CSS property ${JSON.stringify(cssProperties)}`,
    );
  }

  /**
   * {{> ../webapi/seeAttributesOnElements }}
   */
  async seeAttributesOnElements(locator, attributes) {
    const res = await this._locate(locator);
    assertElementExists(res, locator);
    const elemAmount = res.length;

    let attrs = await forEachAsync(res, async (el) => {
      return forEachAsync(Object.keys(attributes), async attr => el.getAttribute(attr));
    });

    const values = Object.keys(attributes).map(key => attributes[key]);
    if (!Array.isArray(attrs)) attrs = [attrs];
    let chunked = chunkArray(attrs, values.length);
    chunked = chunked.filter((val) => {
      for (let i = 0; i < val.length; ++i) {
        if (val[i] !== values[i]) return false;
      }
      return true;
    });
    return assert.ok(
      chunked.length === elemAmount,
      `expected all elements (${locator}) to have attributes ${JSON.stringify(attributes)}`,
    );
  }

  /**
   * {{> ../webapi/grabNumberOfVisibleElements }}
   */
  async grabNumberOfVisibleElements(locator) {
    const res = await this._locate(locator);

    let selected = await forEachAsync(res, async el => el.isDisplayed());
    if (!Array.isArray(selected)) selected = [selected];
    selected = selected.filter(val => val === true);
    return selected.length;
  }

  /**
   * {{> ../webapi/seeInCurrentUrl }}
   *
   *
   * * *Appium*: supported only for web testing
   */
  async seeInCurrentUrl(url) {
    const res = await this.browser.getUrl();
    return stringIncludes('url').assert(url, decodeUrl(res));
  }

  /**
   * {{> ../webapi/dontSeeInCurrentUrl }}
   *
   *
   * * *Appium*: supported only for web testing
   */
  async dontSeeInCurrentUrl(url) {
    const res = await this.browser.getUrl();
    return stringIncludes('url').negate(url, decodeUrl(res));
  }

  /**
   * {{> ../webapi/seeCurrentUrlEquals }}
   *
   *
   * * *Appium*: supported only for web testing
   */
  async seeCurrentUrlEquals(url) {
    const res = await this.browser.getUrl();
    return urlEquals(this.options.url).assert(url, decodeUrl(res));
  }

  /**
   * {{> ../webapi/dontSeeCurrentUrlEquals }}
   *
   *
   * * *Appium*: supported only for web testing
   */
  async dontSeeCurrentUrlEquals(url) {
    const res = await this.browser.getUrl();
    return urlEquals(this.options.url).negate(url, decodeUrl(res));
  }

  /**
   * {{> ../webapi/executeScript }}
   *
   *
   * * *Appium*: supported only for web testing
   *
   * Wraps [execute](http://webdriver.io/api/protocol/execute.html) command.
   */
  executeScript(fn) {
    return this.browser.execute.apply(this.browser, arguments);
  }

  /**
   * {{> ../webapi/executeAsyncScript }}
   *
   *
   * * *Appium*: supported only for web testing
   */
  executeAsyncScript(fn) {
    return this.browser.executeAsync.apply(this.browser, arguments);
  }

  /**
   * Scrolls to element matched by locator.
   * Extra shift can be set with offsetX and offsetY options.
   *
   * ```js
   * I.scrollTo('footer');
   * I.scrollTo('#submit', 5, 5);
   * ```
   *
   * @param locator located by CSS|XPath|strict locator.
   * @param offsetX (optional) X-axis offset.
   * @param offsetY (optional) Y-axis offset.
   */

  /**
   * {{> ../webapi/scrollTo }}
   *
   *
   * * *Appium*: supported only for web testing
   */
  async scrollTo(locator, offsetX = 0, offsetY = 0) {
    if (typeof locator === 'number' && typeof offsetX === 'number') {
      offsetY = offsetX;
      offsetX = locator;
      locator = null;
    }

    if (locator) {
      const res = await this._locate(withStrictLocator(locator), true);
      assertElementExists(res);
      const elem = usingFirstElement(res);
      const elementId = getElementId(elem);
      if (this.browser.isMobile) return this.browser.touchScroll(elementId, offsetX, offsetY);
      const location = await elem.getLocation();
      assertElementExists(location, 'Failed to receive', 'location');
      /* eslint-disable prefer-arrow-callback */
      return this.browser.execute(function (x, y) { return window.scrollTo(x, y); }, location.x + offsetX, location.y + offsetY);
      /* eslint-enable */
    }

    if (this.browser.isMobile) return this.browser.touchScroll(locator, offsetX, offsetY);

    /* eslint-disable prefer-arrow-callback, comma-dangle */
    return this.browser.execute(function (x, y) { return window.scrollTo(x, y); }, offsetX, offsetY);
    /* eslint-enable */
  }

  /**
   * {{> ../webapi/moveCursorTo}}
   *
   *
   * * *Appium*: supported only for web testing
   */
  async moveCursorTo(locator, offsetX = 0, offsetY = 0) {
    const res = await this._locate(withStrictLocator(locator), true);
    assertElementExists(res, locator);
    const elem = usingFirstElement(res);
    return elem.moveTo(offsetX, offsetY);
  }

  /**
   * {{> ../webapi/saveScreenshot}}
   *
   *
   * * *Appium*: supported
   */
  async saveScreenshot(fileName, fullPage = false) {
    const outputFile = screenshotOutputFolder(fileName);

    if (!fullPage) {
      this.debug(`Screenshot has been saved to ${outputFile}`);
      return this.browser.saveScreenshot(outputFile);
    }

    /* eslint-disable prefer-arrow-callback, comma-dangle, prefer-const */
    const originalWindowSize = await this.browser.getWindowSize();

    let { width, height } = await this.browser.execute(function () {
      return {
        height: document.body.scrollHeight,
        width: document.body.scrollWidth
      };
    }).then(res => res);

    if (height < 100) height = 500; // errors for very small height
    /* eslint-enable */

    await this.browser.setWindowSize(width, height);
    this.debug(`Screenshot has been saved to ${outputFile}, size: ${width}x${height}`);
    const buffer = await this.browser.saveScreenshot(outputFile);
    await this.browser.setWindowSize(originalWindowSize.width, originalWindowSize.height);
    return buffer;
  }


  /**
   * {{> ../webapi/setCookie}}
   *
   *
   * * *Appium*: supported only for web testing
   *
   * Uses Selenium's JSON [cookie
   * format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).
   */
  async setCookie(cookie) {
    return this.browser.setCookies(cookie);
  }

  /**
   * {{> ../webapi/clearCookie}}
   *
   *
   * * *Appium*: supported only for web testing
   */
  async clearCookie(cookie) {
    return this.browser.deleteCookies(cookie);
  }

  /**
   * {{> ../webapi/seeCookie}}
   *
   *
   * * *Appium*: supported only for web testing
   */
  async seeCookie(name) {
    const cookie = await this.browser.getCookies([name]);
    return truth(`cookie ${name}`, 'to be set').assert(cookie);
  }

  /**
   * {{> ../webapi/dontSeeCookie}}
   *
   *
   * * *Appium*: supported only for web testing
   */
  async dontSeeCookie(name) {
    const cookie = await this.browser.getCookies([name]);
    return truth(`cookie ${name}`, 'to be set').negate(cookie);
  }

  /**
   * {{> ../webapi/grabCookie}}
   *
   *
   * * *Appium*: supported only for web testing
   */
  async grabCookie(name) {
    if (!name) return this.browser.getCookies();
    const cookie = await this.browser.getCookies([name]);
    this.debugSection('Cookie', JSON.stringify(cookie));
    return cookie[0];
  }

  /**
   * Accepts the active JavaScript native popup window, as created by window.alert|window.confirm|window.prompt.
   * Don't confuse popups with modal windows, as created by [various
   * libraries](http://jster.net/category/windows-modals-popups).
   *
   * * *Appium*: supported only for web testing
   */
  async acceptPopup() {
    return this.browser.getAlertText().then((res) => {
      if (res !== null) {
        return this.browser.acceptAlert();
      }
    });
  }

  /**
   * Dismisses the active JavaScript popup, as created by window.alert|window.confirm|window.prompt.
   *
   *
   * * *Appium*: supported only for web testing
   */
  async cancelPopup() {
    return this.browser.getAlertText().then((res) => {
      if (res !== null) {
        return this.browser.dismissAlert();
      }
    });
  }

  /**
   * Checks that the active JavaScript popup, as created by `window.alert|window.confirm|window.prompt`, contains the
   * given string.
   *
   * * *Appium*: supported only for web testing
   *
   * @param text value to check.
   */
  async seeInPopup(text) {
    return this.browser.getAlertText().then((res) => {
      if (res === null) {
        throw new Error('Popup is not opened');
      }
      stringIncludes('text in popup').assert(text, res);
    });
  }

  /**
   * Grab the text within the popup. If no popup is visible then it will return null.
   *
   * ```js
   * await I.grabPopupText();
   * ```
   */
  async grabPopupText() {
    try {
      return await this.browser.getAlertText();
    } catch (err) {
      this.debugSection('Popup', 'Error getting text from popup');
    }
  }

  /**
   * {{> ../webapi/pressKey }}
   * {{> ../webapi/_keys }}
   *
   * To make combinations with modifier and mouse clicks (like Ctrl+Click) press a modifier, click, then release it.
   *
   *
   * * *Appium*: supported, but clear field before pressing in apps:
   *
   * ```js
   * I.pressKey('Control');
   * I.click('#someelement');
   * I.pressKey('Control');
   * ```
   */
  async pressKey(key) {
    let modifier;
    const modifiers = ['Control', 'Command', 'Shift', 'Alt'];
    if (Array.isArray(key) && modifiers.indexOf(key[0]) > -1) {
      modifier = key[0];
    }
    await this.browser.keys(key);
    if (!modifier) return true;
    return this.browser.keys(modifier); // release modifier
  }

  /**
   * {{> ../webapi/resizeWindow }}
   * Appium: not tested in web, in apps doesn't work
   */
  async resizeWindow(width, height) {
    if (width === 'maximize') {
      const size = await this.browser.maximizeWindow();
      this.debugSection('Window Size', size);
      return;
    }
    if (this.browser.isW3C) {
      return this.browser.setWindowRect(null, null, parseInt(width, 10), parseInt(height, 10));
    }
    return this.browser.setWindowSize(parseInt(width, 10), parseInt(height, 10));
  }

  /**
   * {{> ../webapi/dragAndDrop }}
   * Appium: not tested
   */
  async dragAndDrop(srcElement, destElement) {
    let sourceEl = await this._locate(srcElement);
    assertElementExists(sourceEl);
    sourceEl = usingFirstElement(sourceEl);

    let destEl = await this._locate(destElement);
    assertElementExists(destEl);
    destEl = usingFirstElement(destEl);

    return sourceEl.dragAndDrop(destEl);
  }

  /**
   * {{> ../webapi/dragSlider }}
   */
  async dragSlider(locator, offsetX = 0) {
    const browser = this.browser;
    await this.moveCursorTo(locator);

    // for chrome
    if (browser.isW3C) {
      return browser.performActions([
        { type: 'pointerDown', button: 0 },
        {
          type: 'pointerMove', origin: 'pointer', duration: 1000, x: offsetX, y: 0,
        },
        { type: 'pointerUp', button: 0 },
      ]);
    }

    await browser.buttonDown(0);
    await browser.moveToElement(null, offsetX, 0);
    await browser.buttonUp(0);
  }


  /**
   * Close all tabs except for the current one.
   *
   *
   * * *Appium*: supported web test
   *
   * ```js
   * I.closeOtherTabs();
   * ```
   */
  async closeOtherTabs() {
    const handles = await this.browser.getWindowHandles();
    const currentHandle = await this.browser.getWindowHandle();
    const otherHandles = handles.filter(handle => handle !== currentHandle);

    await forEachAsync(otherHandles, async (handle) => {
      await this.browser.switchToWindow(handle);
      await this.browser.closeWindow();
    });
    await this.browser.switchToWindow(currentHandle);
  }

  /**
   * {{> ../webapi/wait }}
   *
   *
   * * *Appium*: supported
   */
  async wait(sec) {
    return new Promise(resolve => setTimeout(resolve, sec * 1000));
  }

  /**
   * {{> ../webapi/waitForEnabled }}
   *
   *
   * * *Appium*: supported
   */
  async waitForEnabled(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    return this.browser.waitUntil(async () => {
      const res = await this.$$(withStrictLocator(locator));
      if (!res || res.length === 0) {
        return false;
      }
      const selected = await forEachAsync(res, async el => this.browser.isElementEnabled(getElementId(el)));
      if (Array.isArray(selected)) {
        return selected.filter(val => val === true).length > 0;
      }
      return selected;
    }, aSec * 1000, `element (${new Locator(locator)}) still not enabled after ${aSec} sec`);
  }

  /**
   * {{> ../webapi/waitForElement }}
   */
  async waitForElement(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    return this.browser.waitUntil(async () => {
      const res = await this.$$(withStrictLocator(locator));
      return res && res.length;
    }, aSec * 1000, `element (${locator}) still not present on page after ${aSec} sec`);
  }

  async waitUntilExists(locator, sec = null) {
    console.log(`waitUntilExists deprecated:
    * use 'waitForElement' to wait for element to be attached
    * use 'waitForDetached to wait for element to be removed'`);
    return this.waitForStalenessOf(locator, sec);
  }


  /**
   * {{> ../webapi/waitInUrl }}
   */
  async waitInUrl(urlPart, sec = null) {
    const client = this.browser;
    const aSec = sec || this.options.waitForTimeout;
    let currUrl = '';
    return client
      .waitUntil(function () {
        return this.getUrl().then((res) => {
          currUrl = decodeUrl(res);
          return currUrl.indexOf(urlPart) > -1;
        });
      }, aSec * 1000).catch((e) => {
        if (e.message.indexOf('timeout')) {
          throw new Error(`expected url to include ${urlPart}, but found ${currUrl}`);
        }
        throw e;
      });
  }

  /**
   * {{> ../webapi/waitUrlEquals }}
   */
  async waitUrlEquals(urlPart, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    const baseUrl = this.options.url;
    if (urlPart.indexOf('http') < 0) {
      urlPart = baseUrl + urlPart;
    }
    let currUrl = '';
    return this.browser.waitUntil(function () {
      return this.getUrl().then((res) => {
        currUrl = decodeUrl(res);
        return currUrl === urlPart;
      });
    }, aSec * 1000).catch((e) => {
      if (e.message.indexOf('timeout')) {
        throw new Error(`expected url to be ${urlPart}, but found ${currUrl}`);
      }
      throw e;
    });
  }

  /**
   * {{> ../webapi/waitForText }}
   *
   */
  async waitForText(text, sec = null, context = null) {
    const aSec = sec || this.options.waitForTimeout;
    const _context = context || this.root;
    return this.browser.waitUntil(
      async () => {
        const res = await this.$$(withStrictLocator.call(this, _context));
        if (!res || res.length === 0) return false;
        const selected = await forEachAsync(res, async el => this.browser.getElementText(getElementId(el)));
        if (Array.isArray(selected)) {
          return selected.filter(part => part.indexOf(text) >= 0).length > 0;
        }
        return selected.indexOf(text) >= 0;
      }, aSec * 1000,
      `element (${_context}) is not in DOM or there is no element(${_context}) with text "${text}" after ${aSec} sec`,
    );
  }

  /**
   * {{> ../webapi/waitForValue }}
   */
  async waitForValue(field, value, sec = null) {
    const client = this.browser;
    const aSec = sec || this.options.waitForTimeout;
    return client.waitUntil(
      async () => {
        const res = await findFields.call(this, field);
        if (!res || res.length === 0) return false;
        const selected = await forEachAsync(res, async el => el.getValue());
        if (Array.isArray(selected)) {
          return selected.filter(part => part.indexOf(value) >= 0).length > 0;
        }
        return selected.indexOf(value) >= 0;
      }, aSec * 1000,
      `element (${field}) is not in DOM or there is no element(${field}) with value "${value}" after ${aSec} sec`,
    );
  }

  /**
   * {{> ../webapi/waitForVisible }}
   *
   *
   * * *Appium*: supported
   */
  async waitForVisible(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    return this.browser.waitUntil(async () => {
      const res = await this.$$(withStrictLocator(locator));
      if (!res || res.length === 0) return false;
      const selected = await forEachAsync(res, async el => el.isDisplayed());
      if (Array.isArray(selected)) {
        return selected.filter(val => val === true).length > 0;
      }
      return selected;
    }, aSec * 1000, `element (${new Locator(locator)}) still not visible after ${aSec} sec`);
  }

  /**
   * {{> ../webapi/waitNumberOfVisibleElements }}
   */
  async waitNumberOfVisibleElements(locator, num, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    return this.browser.waitUntil(async () => {
      const res = await this.$$(withStrictLocator(locator));
      if (!res || res.length === 0) return false;
      let selected = await forEachAsync(res, async el => el.isDisplayed());

      if (!Array.isArray(selected)) selected = [selected];
      return selected.length === num;
    }, aSec * 1000, `The number of elements (${new Locator(locator)}) is not ${num} after ${aSec} sec`);
  }

  /**
   * {{> ../webapi/waitForInvisible }}
   *
   *
   * * *Appium*: supported
   */
  async waitForInvisible(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    return this.browser.waitUntil(async () => {
      const res = await this.$$(withStrictLocator(locator));
      if (!res || res.length === 0) return true;
      const selected = await forEachAsync(res, async el => el.isDisplayed());
      return !selected.length;
    }, aSec * 1000, `element (${new Locator(locator)}) still visible after ${aSec} sec`);
  }

  /**
   * {{> ../webapi/waitToHide }}
   *
   *
   * * *Appium*: supported
   */
  async waitToHide(locator, sec = null) {
    return this.waitForInvisible(locator, sec);
  }

  async waitForStalenessOf(locator, sec = null) {
    console.log('waitForStalenessOf deprecated. Use waitForDetached instead');
    return this.waitForDetached(locator, sec);
  }

  /**
   * {{> ../webapi/waitForDetached }}
   *
   *
   * * *Appium*: supported
   */
  async waitForDetached(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    return this.browser.waitUntil(async () => {
      const res = await this.$$(withStrictLocator(locator));
      if (!res || res.length === 0) {
        return true;
      }
      return false;
    }, aSec * 1000, `element (${new Locator(locator)}) still on page after ${aSec} sec`);
  }

  /**
   * {{> ../webapi/waitForFunction }}
   *
   *
   * * *Appium*: supported
   */
  async waitForFunction(fn, argsOrSec = null, sec = null) {
    let args = [];
    if (argsOrSec) {
      if (Array.isArray(argsOrSec)) {
        args = argsOrSec;
      } else if (typeof argsOrSec === 'number') {
        sec = argsOrSec;
      }
    }

    const aSec = sec || this.options.waitForTimeout;
    return this.browser.waitUntil(async () => this.browser.execute(fn, ...args), aSec * 1000);
  }

  /**
   * {{> ../webapi/waitUntil }}
   *
   * @param interval (optional) time in seconds between condition checks.
   * * *Appium*: supported
   */
  async waitUntil(fn, sec = null, timeoutMsg = null, interval = null) {
    const aSec = sec || this.options.waitForTimeout;
    const _interval = typeof interval === 'number' ? interval * 1000 : null;
    return this.browser.waitUntil(fn, aSec * 1000, timeoutMsg, _interval);
  }

  /**
   * {{> ../webapi/switchTo }}
   *
   *
   * * *Appium*: supported only for web testing
   */
  async switchTo(locator) {
    this.browser.isInsideFrame = true;
    if (Number.isInteger(locator)) {
      return this.browser.switchToFrame(locator);
    } else if (!locator) {
      return this.browser.switchToFrame(null);
    }
    let res = await this._locate(locator, true);
    assertElementExists(res, locator);
    res = usingFirstElement(res);
    return this.browser.switchToFrame(res);
  }

  /**
   * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab.
   *
   * ```js
   * I.switchToNextTab();
   * I.switchToNextTab(2);
   * ```
   *
   * @param num (optional) number of tabs to switch forward, default: 1.
   * @param sec (optional) time in seconds to wait.
   */
  async switchToNextTab(num = 1, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    let target;
    const current = await this.browser.getWindowHandle();
    await this.browser.waitUntil(async () => {
      await this.browser.getWindowHandles().then((handles) => {
        if (handles.indexOf(current) + num + 1 <= handles.length) {
          target = handles[handles.indexOf(current) + num];
        }
      });
      return target;
    }, aSec * 1000, `There is no ability to switch to next tab with offset ${num}`);
    return this.browser.switchToWindow(target);
  }

  /**
   * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab.
   *
   * ```js
   * I.switchToPreviousTab();
   * I.switchToPreviousTab(2);
   * ```
   *
   * @param num (optional) number of tabs to switch backward, default: 1.
   * @param sec (optional) time in seconds to wait.
   */
  async switchToPreviousTab(num = 1, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    const current = await this.browser.getWindowHandle();
    let target;
    await this.browser.waitUntil(async () => {
      await this.browser.getWindowHandles().then((handles) => {
        if (handles.indexOf(current) - num > -1) {
          target = handles[handles.indexOf(current) - num];
        }
      });
      return target;
    }, aSec * 1000, `There is no ability to switch to previous tab with offset ${num}`);
    return this.browser.switchToWindow(target);
  }

  /**
   * Close current tab.
   *
   * ```js
   * I.closeCurrentTab();
   * ```
   */
  async closeCurrentTab() {
    await this.browser.closeWindow();
    const handles = await this.browser.getWindowHandles();
    if (handles[0]) await this.browser.switchToWindow(handles[0]);
  }

  /**
   * Open new tab and switch to it.
   *
   * ```js
   * I.openNewTab();
   * ```
   */
  async openNewTab() {
    const client = this.browser;
    return client.newWindow('about:blank');
  }

  /**
   * {{> ../webapi/grabNumberOfOpenTabs }}
   */
  async grabNumberOfOpenTabs() {
    const pages = await this.browser.getWindowHandles();
    this.debugSection('Tabs', `Total ${pages.length}`);
    return pages.length;
  }

  /**
   * {{> ../webapi/refreshPage }}
   */
  async refreshPage() {
    const client = this.browser;
    return client.refresh();
  }

  /**
   * {{> ../webapi/scrollPageToTop }}
   */
  scrollPageToTop() {
    const client = this.browser;
    /* eslint-disable prefer-arrow-callback */
    return client.execute(function () {
      window.scrollTo(0, 0);
    });
    /* eslint-enable */
  }

  /**
   * {{> ../webapi/scrollPageToBottom }}
   */
  scrollPageToBottom() {
    const client = this.browser;
    /* eslint-disable prefer-arrow-callback, comma-dangle */
    return client.execute(function () {
      const body = document.body;
      const html = document.documentElement;
      window.scrollTo(0, Math.max(
        body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight
      ));
    });
    /* eslint-enable */
  }

  /**
   * {{> ../webapi/grabPageScrollPosition}}
   */
  async grabPageScrollPosition() {
    /* eslint-disable comma-dangle */
    function getScrollPosition() {
      return {
        x: window.pageXOffset,
        y: window.pageYOffset
      };
    }
    /* eslint-enable comma-dangle */
    return this.executeScript(getScrollPosition);
  }

  /**
   * Placeholder for ~ locator only test case write once run on both Appium and WebDriver.
   */
  runOnIOS(caps, fn) {
  }

  /**
   * Placeholder for ~ locator only test case write once run on both Appium and WebDriver.
   */
  runOnAndroid(caps, fn) {
  }

  /**
   * Placeholder for ~ locator only test case write once run on both Appium and WebDriver.
   */
  runInWeb(fn) {
    return fn();
  }
}

async function proceedSee(assertType, text, context, strict = false) {
  let description;
  if (!context) {
    if (this.context === webRoot) {
      context = this.context;
      description = 'web page';
    } else {
      description = `current context ${this.context}`;
      context = './/*';
    }
  } else {
    description = `element ${context}`;
  }

  const smartWaitEnabled = assertType === 'assert';

  const res = await this._locate(withStrictLocator(context), smartWaitEnabled);
  assertElementExists(res, context);

  const selected = await forEachAsync(res, async el => this.browser.getElementText(getElementId(el)));

  if (strict) {
    if (Array.isArray(selected) && selected.length !== 0) {
      return selected.map(elText => equals(description)[assertType](text, elText));
    }
    return equals(description)[assertType](text, selected);
  }
  return stringIncludes(description)[assertType](text, selected);
}

// Mimic Array.forEach() API, but with an async callback function.
// Execute each callback on each array item serially. Useful when using WebDriver API.
//
// Added due because of problem with chrome driver when too many requests
// are made simultaneously. https://bugs.chromium.org/p/chromedriver/issues/detail?id=2152#c9
//
// @param {object[]} array Input array items to iterate over
// @param {function} callback Async function to excute on each array item
// @return Array
async function forEachAsync(array, callback, option = {}) {
  const {
    expandArrayResults = true,
  } = option;
  const inputArray = Array.isArray(array) ? array : [array];
  const values = [];
  for (let index = 0; index < inputArray.length; index++) {
    let res;
    try {
      res = await callback(inputArray[index], index, inputArray);
      if (Array.isArray(res) && expandArrayResults) {
        res.forEach(val => values.push(val));
      } else if (res) {
        values.push(res);
      }
    } catch (err) {
      throw err;
    }
  }
  return values;
}

//  Mimic Array.filter() API, but with an async callback function.
//  Execute each callback on each array item serially. Useful when using WebDriver API.
//  Added due because of problem with chrome driver when too many requests
//  are made simultaneously. https://bugs.chromium.org/p/chromedriver/issues/detail?id=2152#c9
//  @param {object[]} array Input array items to iterate over
//  @param {function} callback Async functin to excute on each array item
//  @param {object} option Additional options. 'extractValue' will extract the .value object from a WebdriverIO
//
async function filterAsync(array, callback) {
  const inputArray = Array.isArray(array) ? array : [array];
  const values = [];
  for (let index = 0; index < inputArray.length; index++) {
    try {
      const res = await callback(inputArray[index], index, inputArray);
      const value = Array.isArray(res) ? res[0] : res;

      if (value) {
        values.push(inputArray[index]);
      }
    } catch (err) {
      throw err;
    }
  }
  return values;
}


async function findClickable(locator, locateFn) {
  locator = new Locator(locator);
  if (!locator.isFuzzy()) return locateFn(locator.simplify(), true);

  let els;
  const literal = xpathLocator.literal(locator.value);

  els = await locateFn(Locator.clickable.narrow(literal));
  if (els.length) return els;

  els = await locateFn(Locator.clickable.wide(literal));
  if (els.length) return els;

  els = await locateFn(Locator.clickable.self(literal));
  if (els.length) return els;

  return locateFn(locator.value); // by css or xpath
}


async function findFields(locator) {
  locator = new Locator(locator);
  if (!locator.isFuzzy()) return this._locate(locator.simplify(), true);

  const literal = xpathLocator.literal(locator.value);
  let els = await this._locate(Locator.field.byText(literal));
  if (els.length) return els;

  els = await this._locate(Locator.field.byName(literal));
  if (els.length) return els;
  return this._locate(locator.value); // by css or xpath
}

async function proceedSeeField(assertType, field, value) {
  const res = await findFields.call(this, field);
  assertElementExists(res, field, 'Field');
  const elem = usingFirstElement(res);
  const elemId = getElementId(elem);

  const proceedMultiple = async (fields) => {
    const fieldResults = toArray(await forEachAsync(fields, async (el) => {
      const elementId = getElementId(el);
      return this.browser.isW3C ? el.getValue() : this.browser.getElementAttribute(elementId, 'value');
    }));

    if (typeof value === 'boolean') {
      equals(`no. of items matching > 0: ${field}`)[assertType](value, !!fieldResults.length);
    } else {
      // Assert that results were found so the forEach assert does not silently pass
      equals(`no. of items matching > 0:  ${field}`)[assertType](true, !!fieldResults.length);
      fieldResults.forEach(val => stringIncludes(`fields by ${field}`)[assertType](value, val));
    }
  };

  const proceedSingle = el => this.browser.getElementAttribute(getElementId(el), 'value').then((res) => {
    if (res === null) {
      throw new Error(`Element ${el.selector} has no value attribute`);
    }
    stringIncludes(`fields by ${field}`)[assertType](value, res);
  });

  const filterBySelected = async elements => filterAsync(elements, async el => this.browser.isElementSelected(getElementId(el)));

  const filterSelectedByValue = async (elements, value) => {
    return filterAsync(elements, async (el) => {
      const elementId = getElementId(el);
      const currentValue = this.browser.isW3C ? await el.getValue() : await this.browser.getElementAttribute(elementId, 'value');
      const isSelected = await this.browser.isElementSelected(elementId);
      return currentValue === value && isSelected;
    });
  };

  const tag = await elem.getTagName();
  if (tag === 'select') {
    const subOptions = await this.browser.findElementsFromElement(elemId, 'css', 'option');

    if (value === '') {
      // Don't filter by value
      const selectedOptions = await filterBySelected(subOptions);
      return proceedMultiple(selectedOptions);
    }

    const options = await filterSelectedByValue(subOptions, value);
    return proceedMultiple(options);
  }

  if (tag === 'input') {
    const fieldType = await elem.getAttribute('type');

    if (fieldType === 'checkbox' || fieldType === 'radio') {
      if (typeof value === 'boolean') {
        // Support boolean values
        const options = await filterBySelected(res);
        return proceedMultiple(options);
      }

      const options = await filterSelectedByValue(res, value);
      return proceedMultiple(options);
    }
    return proceedSingle(elem);
  }
  return proceedSingle(elem);
}

function toArray(item) {
  if (!Array.isArray(item)) {
    return [item];
  }
  return item;
}

async function proceedSeeCheckbox(assertType, field) {
  const res = await findFields.call(this, field);
  assertElementExists(res, field, 'Field');

  const selected = await forEachAsync(res, async el => this.browser.isElementSelected(getElementId(el)));
  return truth(`checkable field "${field}"`, 'to be checked')[assertType](selected);
}

async function findCheckable(locator, locateFn) {
  let els;
  locator = new Locator(locator);
  if (!locator.isFuzzy()) return locateFn(locator.simplify(), true);

  const literal = xpathLocator.literal(locator.value);
  els = await locateFn(Locator.checkable.byText(literal));
  if (els.length) return els;
  els = await locateFn(Locator.checkable.byName(literal));
  if (els.length) return els;

  return locateFn(locator.value); // by css or xpath
}

function withStrictLocator(locator) {
  locator = new Locator(locator);
  return locator.simplify();
}

function isFrameLocator(locator) {
  locator = new Locator(locator);
  if (locator.isFrame()) return locator.value;
  return false;
}

function assertElementExists(res, locator, prefix, suffix) {
  if (!res || res.length === 0) {
    throw new ElementNotFound(locator, prefix, suffix);
  }
}

function usingFirstElement(els) {
  if (els.length > 1) debug(`[Elements] Using first element out of ${els.length}`);
  return els[0];
}

function getElementId(el) {
  // W3C WebDriver web element identifier
  // https://w3c.github.io/webdriver/#dfn-web-element-identifier
  if (el['element-6066-11e4-a52e-4f735466cecf']) {
    return el['element-6066-11e4-a52e-4f735466cecf'];
  }
  // (deprecated) JsonWireProtocol identifier
  // https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#webelement-json-object
  if (el.ELEMENT) {
    return el.ELEMENT;
  }
  return null;
}

function prepareLocateFn(context) {
  if (!context) return this._locate.bind(this);
  let el;
  return (l) => {
    l = new Locator(l, 'css');
    if (el) return this.browser.findElementsFromElement(el, l.type, l.value);
    return this._locate(context, true).then(async (res) => {
      assertElementExists(res, context, 'Context element');
      return res[0].$$(l.simplify());
    });
  };
}

module.exports = WebDriver;
