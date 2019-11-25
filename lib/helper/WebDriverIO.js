let webdriverio;
const requireg = require('requireg');
const Helper = require('../helper');
const stringIncludes = require('../assert/include').includes;
const { urlEquals, equals } = require('../assert/equal');
const empty = require('../assert/empty').empty;
const truth = require('../assert/truth').truth;
const {
  xpathLocator,
  fileExists,
  clearString,
  decodeUrl,
  chunkArray,
  convertCssPropertiesToCamelCase,
  screenshotOutputFolder,
} = require('../utils');
const {
  isColorProperty,
  convertColorToRGBA,
} = require('../colorUtils');
const ElementNotFound = require('./errors/ElementNotFound');
const ConnectionRefused = require('./errors/ConnectionRefused');

const assert = require('assert');
const path = require('path');

const webRoot = 'body';
const Locator = require('../locator');

let withinStore = {};

/**
 * WebDriverIO helper which wraps [webdriverio](http://webdriver.io/) library to
 * manipulate browser using Selenium WebDriver or PhantomJS.
 *
 * WebDriverIO requires [Selenium Server and ChromeDriver/GeckoDriver to be installed](http://codecept.io/quickstart/#prepare-selenium-server).
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
 * with `this.helpers["WebDriverIO"]._startBrowser()`.
 * * `timeouts`: [WebDriverIO timeouts](http://webdriver.io/guide/testrunner/timeouts.html) defined as hash.
 *
 * Example:
 *
 * ```json
 * {
 *    "helpers": {
 *      "WebDriverIO" : {
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
 *      "WebDriverIO" : {
 *        "url": "http://localhost",
 *        "browser": "chrome",
 *        "desiredCapabilities": {
 *          "chromeOptions": {
 *            "args": [ "--headless", "--disable-gpu", "--no-sandbox" ]
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
 * need to update the `helpers.WebDriverIO.desiredCapabilities.proxy` key.
 *
 * ```js
 * {
 *     "helpers": {
 *         "WebDriverIO": {
 *             "desiredCapabilities": {
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
 *         "WebDriverIO": {
 *             "desiredCapabilities": {
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
 * WebDriverIO makes it possible to execute tests against services like `Sauce Labs` `BrowserStack` `TestingBot`
 * Check out their documentation on [available parameters](http://webdriver.io/guide/usage/cloudservices.html)
 *
 * Connecting to `BrowserStack` and `Sauce Labs` is simple. All you need to do
 * is set the `user` and `key` parameters. WebDriverIO automatically know which
 * service provider to connect to.
 *
 * ```js
 * {
 *     "helpers":{
 *         "WebDriverIO": {
 *             "url": "YOUR_DESIRED_HOST",
 *             "user": "YOUR_BROWSERSTACK_USER",
 *             "key": "YOUR_BROWSERSTACK_KEY",
 *             "desiredCapabilities": {
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
 *         "WebDriverIO": {
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
 * Receive a WebDriverIO client from a custom helper by accessing `browser` property:
 *
 * ```js
 * this.helpers['WebDriverIO'].browser
 * ```
 */
class WebDriverIO extends Helper {
  constructor(config) {
    super(config);
    webdriverio = requireg('webdriverio');

    console.log('DEPRECATION WARNING', 'WebDriverIO helper is deprecated');
    console.log('DEPRECATION WARNING', 'WebDriverIO was based on webdriverio package v4 which is outdated now');
    console.log('DEPRECATION WARNING', 'Upgrade to "webdriverio@5" and switch to WebDriver helper');

    // set defaults
    this.root = webRoot;

    this.isRunning = false;

    this._setConfig(config);
  }

  _validateConfig(config) {
    const defaults = {
      smartWait: 0,
      waitForTimeout: 1000, // ms
      desiredCapabilities: {},
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

    config.baseUrl = config.url || config.baseUrl;
    config.desiredCapabilities.browserName = config.browser || config.desiredCapabilities.browserName;
    config.waitForTimeout /= 1000; // convert to seconds

    if (!config.desiredCapabilities.platformName && (!config.url || !config.browser)) {
      throw new Error(`
        WebDriverIO requires at url and browser to be set.
        Check your codeceptjs config file to ensure these are set properly
          {
            "helpers": {
              "WebDriverIO": {
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
      return ['webdriverio@4'];
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
    if (this.options.multiremote) {
      this.browser = webdriverio.multiremote(this.options.multiremote).init();
    } else {
      this.browser = webdriverio.remote(this.options).init();
    }
    try {
      await this.browser;
    } catch (err) {
      if (err.toString().indexOf('ECONNREFUSED')) {
        throw new ConnectionRefused(err);
      }
      throw err;
    }

    this.isRunning = true;
    if (this.options.timeouts) {
      await this.defineTimeout(this.options.timeouts);
    }

    if (this.options.windowSize === 'maximize') {
      await this.resizeWindow('maximize');
    } else if (this.options.windowSize && this.options.windowSize.indexOf('x') > 0) {
      const dimensions = this.options.windowSize.split('x');
      await this.resizeWindow(dimensions[0], dimensions[1]);
    }
    return this.browser;
  }

  async _stopBrowser() {
    if (this.browser && this.isRunning) await this.browser.end();
  }

  async _before() {
    this.context = this.root;
    if (this.options.restart && !this.options.manualStart) return this._startBrowser();
    if (!this.isRunning && !this.options.manualStart) return this._startBrowser();
    return this.browser;
  }

  async _after() {
    if (!this.isRunning) return;
    if (this.options.restart) {
      this.isRunning = false;
      return this.browser.end();
    }

    if (this.options.keepBrowserState) return;

    if (!this.options.keepCookies && this.options.desiredCapabilities.browserName) {
      this.debugSection('Session', 'cleaning cookies and localStorage');
      await this.browser.deleteCookie();
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
    const defaultSession = this.browser.requestHandler.sessionID;
    return {
      start: async (opts) => {
        // opts.disableScreenshots = true; // screenshots cant be saved as session will be already closed
        opts = this._validateConfig(Object.assign(this.options, opts));
        this.debugSection('New Browser', JSON.stringify(opts));
        const browser = webdriverio.remote(opts).init();
        await browser;
        return browser.requestHandler.sessionID;
      },
      stop: async (sessionId) => {
        return this.browser.session('DELETE', sessionId);
      },
      loadVars: async (sessionId) => {
        if (isWithin()) throw new Error('Can\'t start session inside within block');
        this.browser.requestHandler.sessionID = sessionId;
      },
      restoreVars: async () => {
        if (isWithin()) await this._withinEnd();
        this.browser.requestHandler.sessionID = defaultSession;
      },
    };
  }

  async _failed(test) {
    if (isWithin()) await this._withinEnd();
  }

  async _withinBegin(locator) {
    const frame = isFrameLocator(locator);
    const client = this.browser;
    if (frame) {
      if (Array.isArray(frame)) {
        withinStore.frame = frame.join('>');
        return client
          .frame(null)
          .then(() => frame.reduce((p, frameLocator) => p.then(() => this.switchTo(frameLocator)), Promise.resolve()));
      }
      withinStore.frame = frame;
      return this.switchTo(frame);
    }
    withinStore.elFn = this.browser.element;
    withinStore.elsFn = this.browser.elements;
    this.context = locator;

    const res = await client.element(withStrictLocator.call(this, locator));
    assertElementExists(res, locator);
    this.browser.element = function (l) {
      return this.elementIdElement(res.value.ELEMENT, l);
    };
    this.browser.elements = function (l) {
      return this.elementIdElements(res.value.ELEMENT, l);
    };
    return this.browser;
  }

  async _withinEnd() {
    if (withinStore.frame) {
      withinStore = {};
      return this.switchTo(null);
    }
    this.context = this.root;
    this.browser.element = withinStore.elFn;
    this.browser.elements = withinStore.elsFn;
    withinStore = {};
  }

  /**
   * Get elements by different locator types, including strict locator.
   * Should be used in custom helpers:
   *
   * ```js
   * this.helpers['WebDriverIO']._locate({name: 'password'}).then //...
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   */
  async _locate(locator, smartWait = false) {
    if (!this.options.smartWait || !smartWait) return this.browser.elements(withStrictLocator.call(this, locator));
    this.debugSection(`SmartWait (${this.options.smartWait}ms)`, `Locating ${locator} in ${this.options.smartWait}`);

    await this.defineTimeout({ implicit: this.options.smartWait });
    const els = await this.browser.elements(withStrictLocator.call(this, locator));
    await this.defineTimeout({ implicit: 0 });
    return els;
  }

  /**
   * Find a checkbox by providing human readable text:
   *
   * ```js
   * this.helpers['WebDriverIO']._locateCheckable('I agree with terms and conditions').then // ...
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   */
  async _locateCheckable(locator) {
    return findCheckable.call(this, locator, this.browser.elements.bind(this)).then(res => res.value);
  }

  /**
   * Find a clickable element by providing human readable text:
   *
   * ```js
   * this.helpers['WebDriverIO']._locateClickable('Next page').then // ...
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   */
  async _locateClickable(locator) {
    return findClickable.call(this, locator, this.browser.elements.bind(this)).then(res => res.value);
  }

  /**
   * Find field elements by providing human readable text:
   *
   * ```js
   * this.helpers['WebDriverIO']._locateFields('Your email').then // ...
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   */
  async _locateFields(locator) {
    return findFields.call(this, locator).then(res => res.value);
  }

  /**
   * Set [WebDriverIO timeouts](http://webdriver.io/guide/testrunner/timeouts.html) in realtime.
   * Appium: support only web testing.
   * Timeouts are expected to be passed as object:
   *
   * ```js
   * I.defineTimeout({ script: 5000 });
   * I.defineTimeout({ implicit: 10000, pageLoad: 10000, script: 5000 });
   * ```
   *
   * @param {WebdriverIO.Timeouts}  timeouts WebDriver timeouts object.
   */
  async defineTimeout(timeouts) {
    try {
      // try to set W3C compatible timeouts
      await this.browser.timeouts(timeouts);
    } catch (error) {
      if (timeouts.implicit) {
        await this.browser.timeouts('implicit', timeouts.implicit);
      }
      if (timeouts['page load']) {
        await this.browser.timeouts('page load', timeouts['page load']);
      }
      // both pageLoad and page load are accepted
      // see http://webdriver.io/api/protocol/timeouts.html
      if (timeouts.pageLoad) {
        await this.browser.timeouts('page load', timeouts.pageLoad);
      }
      if (timeouts.script) {
        await this.browser.timeouts('script', timeouts.script);
      }
    }
    return this.browser; // return the last response
  }

  /**
   * {{> amOnPage }}
   * Appium: support only web testing
   */
  amOnPage(url) {
    return this.browser.url(url);
  }

  /**
   * {{> click }}
   * Appium: support
   */
  async click(locator, context = null) {
    const clickMethod = this.browser.isMobile ? 'touchClick' : 'elementIdClick';
    const locateFn = prepareLocateFn.call(this, context);

    const res = await findClickable.call(this, locator, locateFn);
    if (context) {
      assertElementExists(res, locator, 'Clickable element', `was not found inside element ${new Locator(context).toString()}`);
    } else {
      assertElementExists(res, locator, 'Clickable element');
    }
    return this.browser[clickMethod](res.value[0].ELEMENT);
  }

  /**
   * {{> doubleClick }}
   * Appium: support only web testing
   */
  async doubleClick(locator, context = null) {
    const clickMethod = this.browser.isMobile ? 'touchClick' : 'elementIdClick';
    const locateFn = prepareLocateFn.call(this, context);

    const res = await findClickable.call(this, locator, locateFn);
    if (context) {
      assertElementExists(res, locator, 'Clickable element', `was not found inside element ${new Locator(context).toString()}`);
    } else {
      assertElementExists(res, locator, 'Clickable element');
    }

    const elem = res.value[0];
    return this.browser.moveTo(elem.ELEMENT).doDoubleClick();
  }

  /**
   * {{> rightClick }}
   * Appium: support, but in apps works as usual click
   */
  async rightClick(locator) {
    // just press button if no selector is given
    if (locator === undefined) {
      return this.browser.buttonPress('right');
    }

    const res = await this._locate(locator, true);
    assertElementExists(res, locator, 'Clickable element');
    const elem = res.value[0];
    if (this.browser.isMobile) return this.browser.touchClick(elem.ELEMENT);
    return this.browser.moveTo(elem.ELEMENT).buttonPress('right');
  }

  /**
   * {{> fillField }}
   * Appium: support
   */
  async fillField(field, value) {
    const res = await findFields.call(this, field);
    assertElementExists(res, field, 'Field');
    const elem = res.value[0];
    return this.browser.elementIdClear(elem.ELEMENT).elementIdValue(elem.ELEMENT, value.toString());
  }

  /**
   * {{> appendField }}
   * Appium: support, but it's clear a field before insert in apps
   */
  async appendField(field, value) {
    const res = await findFields.call(this, field);
    assertElementExists(res, field, 'Field');
    const elem = res.value[0];
    return this.browser.elementIdValue(elem.ELEMENT, value);
  }


  /**
   * {{> clearField}}
   * Appium: support
   */
  async clearField(field) {
    const res = await findFields.call(this, field);
    assertElementExists(res, field, 'Field');
    const elem = res.value[0];
    return this.browser.elementIdClear(elem.ELEMENT);
  }


  /**
   * {{> selectOption}}
   */
  async selectOption(select, option) {
    const res = await findFields.call(this, select);
    assertElementExists(res, select, 'Selectable field');
    const elem = res.value[0];

    if (!Array.isArray(option)) {
      option = [option];
    }

    // select options by visible text
    let els = await forEachAsync(option, async opt => this.browser.elementIdElements(elem.ELEMENT, Locator.select.byVisibleText(xpathLocator.literal(opt))));

    const clickOptionFn = async (el) => {
      if (el[0]) el = el[0];
      if (el && el.ELEMENT) return this.browser.elementIdClick(el.ELEMENT);
    };

    if (Array.isArray(els) && els.length) {
      return forEachAsync(els, clickOptionFn);
    }
    // select options by value
    els = await forEachAsync(option, async opt => this.browser.elementIdElements(elem.ELEMENT, Locator.select.byValue(xpathLocator.literal(opt))));
    if (els.length === 0) {
      throw new ElementNotFound(select, `Option ${option} in`, 'was found neither by visible text not by value');
    }
    return forEachAsync(els, clickOptionFn);
  }

  /**
   * {{> attachFile }}
   * Appium: not tested
   */
  async attachFile(locator, pathToFile) {
    const file = path.join(global.codecept_dir, pathToFile);
    if (!fileExists(file)) {
      throw new Error(`File at ${file} can not be found on local system`);
    }
    const el = await findFields.call(this, locator);
    this.debug(`Uploading ${file}`);

    const res = await this.browser.uploadFile(file);
    assertElementExists(el, locator, 'File field');
    return this.browser.elementIdValue(el.value[0].ELEMENT, res.value);
  }

  /**
   * {{> checkOption }}
   * Appium: not tested
   */
  async checkOption(field, context = null) {
    const clickMethod = this.browser.isMobile ? 'touchClick' : 'elementIdClick';
    const locateFn = prepareLocateFn.call(this, context);

    const res = await findCheckable.call(this, field, locateFn);

    assertElementExists(res, field, 'Checkable');
    const elem = res.value[0];

    const isSelected = await this.browser.elementIdSelected(elem.ELEMENT);
    if (isSelected.value) return Promise.resolve(true);
    return this.browser[clickMethod](elem.ELEMENT);
  }

  /**
   * {{> uncheckOption }}
   * Appium: not tested
   */
  async uncheckOption(field, context = null) {
    const clickMethod = this.browser.isMobile ? 'touchClick' : 'elementIdClick';
    const locateFn = prepareLocateFn.call(this, context);

    const res = await findCheckable.call(this, field, locateFn);

    assertElementExists(res, field, 'Checkable');
    const elem = res.value[0];

    const isSelected = await this.browser.elementIdSelected(elem.ELEMENT);
    if (!isSelected.value) return Promise.resolve(true);
    return this.browser[clickMethod](elem.ELEMENT);
  }

  /**
   * {{> grabTextFrom }}
   * Appium: support
   */
  async grabTextFrom(locator) {
    const res = await this._locate(locator, true);
    assertElementExists(res, locator);
    const val = await forEachAsync(res.value, async el => this.browser.elementIdText(el.ELEMENT));
    this.debugSection('Grab', val);
    return val;
  }

  /**
   * {{> grabHTMLFrom }}
   * Appium: support only web testing
   */
  async grabHTMLFrom(locator) {
    const html = await this.browser.getHTML(withStrictLocator.call(this, locator));
    this.debugSection('Grab', html);
    return html;
  }

  /**
   * {{> grabValueFrom }}
   * Appium: support only web testing
   */
  async grabValueFrom(locator) {
    const res = await this._locate(locator, true);
    assertElementExists(res, locator);

    return forEachAsync(res.value, async el => this.browser.elementIdAttribute(el.ELEMENT, 'value'));
  }

  /**
   * {{> grabCssPropertyFrom }}
   */
  async grabCssPropertyFrom(locator, cssProperty) {
    const res = await this._locate(locator, true);
    assertElementExists(res, locator);
    return forEachAsync(res.value, async el => this.browser.elementIdCssProperty(el.ELEMENT, cssProperty));
  }

  /**
   * {{> grabAttributeFrom }}
   * Appium: can be used for apps only with several values ("contentDescription", "text", "className", "resourceId")
   */
  async grabAttributeFrom(locator, attr) {
    const res = await this._locate(locator, true);
    assertElementExists(res, locator);
    return forEachAsync(res.value, async el => this.browser.elementIdAttribute(el.ELEMENT, attr));
  }

  /**
   * {{> seeInTitle }}
   * Appium: support only web testing
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
   * @param {string} text value to check.
   */
  async seeTitleEquals(text) {
    const title = await this.browser.getTitle();
    return assert.equal(title, text, `expected web page title to be ${text}, but found ${title}`);
  }

  /**
   * {{> dontSeeInTitle }}
   * Appium: support only web testing
   */
  async dontSeeInTitle(text) {
    const title = await this.browser.getTitle();
    return stringIncludes('web page title').negate(text, title);
  }

  /**
   * {{> grabTitle }}
   * Appium: support only web testing
   */
  async grabTitle() {
    const title = await this.browser.getTitle();
    this.debugSection('Title', title);
    return title;
  }

  /**
   * {{> see }}
   * Appium: support with context in apps
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
   * @param {string} text element value to check.
   * @param {CodeceptJS.LocatorOrString?} [context] (optional) element located by CSS|XPath|strict locator.
   */
  async seeTextEquals(text, context = null) {
    return proceedSee.call(this, 'assert', text, context, true);
  }

  /**
   * {{> dontSee }}
   * Appium: support with context in apps
   */
  async dontSee(text, context = null) {
    return proceedSee.call(this, 'negate', text, context);
  }

  /**
   * {{> seeInField }}
   * Appium: support only web testing
   */
  async seeInField(field, value) {
    return proceedSeeField.call(this, 'assert', field, value);
  }

  /**
   * {{> dontSeeInField }}
   * Appium: support only web testing
   */
  async dontSeeInField(field, value) {
    return proceedSeeField.call(this, 'negate', field, value);
  }

  /**
   * {{> seeCheckboxIsChecked }}
   * Appium: not tested
   */
  async seeCheckboxIsChecked(field) {
    return proceedSeeCheckbox.call(this, 'assert', field);
  }

  /**
   * {{> dontSeeCheckboxIsChecked }}
   * Appium: not tested
   */
  async dontSeeCheckboxIsChecked(field) {
    return proceedSeeCheckbox.call(this, 'negate', field);
  }

  /**
   * {{> seeElement }}
   * Appium: support
   */
  async seeElement(locator) {
    const res = await this._locate(locator, true);
    if (!res.value || res.value.length === 0) {
      return truth(`elements of ${locator}`, 'to be seen').assert(false);
    }

    const selected = await forEachAsync(res.value, async el => this.browser.elementIdDisplayed(el.ELEMENT));
    return truth(`elements of ${locator}`, 'to be seen').assert(selected);
  }

  /**
   * {{> dontSeeElement}}
   * Appium: support
   */
  async dontSeeElement(locator) {
    const res = await this._locate(locator, false);
    if (!res.value || res.value.length === 0) {
      return truth(`elements of ${locator}`, 'to be seen').negate(false);
    }
    const selected = await forEachAsync(res.value, async el => this.browser.elementIdDisplayed(el.ELEMENT));
    return truth(`elements of ${locator}`, 'to be seen').negate(selected);
  }

  /**
   * {{> seeElementInDOM }}
   * Appium: support
   */
  async seeElementInDOM(locator) {
    const res = await this.browser.elements(withStrictLocator.call(this, locator));
    return empty('elements').negate(res.value);
  }

  /**
   * {{> dontSeeElementInDOM }}
   * Appium: support
   */
  async dontSeeElementInDOM(locator) {
    const res = await this.browser.elements(withStrictLocator.call(this, locator));
    return empty('elements').assert(res.value);
  }

  /**
   * {{> seeInSource }}
   * Appium: support
   */
  async seeInSource(text) {
    const source = await this.browser.getSource();
    return stringIncludes('HTML source of a page').assert(text, source);
  }

  /**
   * {{> grabSource }}
   * Appium: support
   */
  async grabSource() {
    return this.browser.getSource();
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
    return this.browser.log('browser').then(res => res.value);
  }

  /**
   * {{> grabCurrentUrl }}
   */
  async grabCurrentUrl() {
    const res = await this.browser.url();
    return res.value;
  }

  async grabBrowserUrl() {
    console.log('grabBrowserUrl deprecated. Use grabCurrentUrl instead');
    const res = await this.browser.url();
    return res.value;
  }

  /**
   * {{> dontSeeInSource }}
   * Appium: support
   */
  async dontSeeInSource(text) {
    const source = await this.browser.getSource();
    return stringIncludes('HTML source of a page').negate(text, source);
  }

  /**
   * Asserts that an element appears a given number of times in the DOM.
   * Element is located by label or name or CSS or XPath.
   * Appium: support
   *
   * ```js
   * I.seeNumberOfElements('#submitBtn', 1);
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   * @param {number} [num] number of elements.
   */
  async seeNumberOfElements(locator, num) {
    const res = await this._locate(withStrictLocator.call(this, locator));
    return assert.equal(res.value.length, num, `expected number of elements (${locator}) is ${num}, but found ${res.value.length}`);
  }

  /**
   * {{> seeNumberOfVisibleElements }}
   */
  async seeNumberOfVisibleElements(locator, num) {
    const res = await this.grabNumberOfVisibleElements(locator);
    return assert.equal(res, num, `expected number of visible elements (${locator}) is ${num}, but found ${res}`);
  }

  /**
   * {{> seeCssPropertiesOnElements }}
   */
  async seeCssPropertiesOnElements(locator, cssProperties) {
    const res = await this._locate(locator);
    assertElementExists(res, locator);
    const elemAmount = res.value.length;

    let props = await forEachAsync(res.value, async (el) => {
      return forEachAsync(Object.keys(cssProperties), async (prop) => {
        const propValue = await this.browser.elementIdCssProperty(el.ELEMENT, prop);
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
   * {{> seeAttributesOnElements }}
   */
  async seeAttributesOnElements(locator, attributes) {
    const res = await this._locate(locator);
    assertElementExists(res, locator);
    const elemAmount = res.value.length;

    let attrs = await forEachAsync(res.value, async (el) => {
      return forEachAsync(Object.keys(attributes), async attr => this.browser.elementIdAttribute(el.ELEMENT, attr));
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
   * {{> grabNumberOfVisibleElements }}
   */
  async grabNumberOfVisibleElements(locator) {
    const res = await this._locate(locator);

    let selected = await forEachAsync(res.value, async el => this.browser.elementIdDisplayed(el.ELEMENT));
    if (!Array.isArray(selected)) selected = [selected];
    selected = selected.filter(val => val === true);
    return selected.length;
  }

  /**
   * {{> seeInCurrentUrl }}
   * Appium: support only web testing
   */
  async seeInCurrentUrl(url) {
    const res = await this.browser.url();
    return stringIncludes('url').assert(url, decodeUrl(res.value));
  }

  /**
   * {{> dontSeeInCurrentUrl }}
   * Appium: support only web testing
   */
  async dontSeeInCurrentUrl(url) {
    const res = await this.browser.url();
    return stringIncludes('url').negate(url, decodeUrl(res.value));
  }

  /**
   * {{> seeCurrentUrlEquals }}
   * Appium: support only web testing
   */
  async seeCurrentUrlEquals(url) {
    const res = await this.browser.url();
    return urlEquals(this.options.url).assert(url, decodeUrl(res.value));
  }

  /**
   * {{> dontSeeCurrentUrlEquals }}
   * Appium: support only web testing
   */
  async dontSeeCurrentUrlEquals(url) {
    const res = await this.browser.url();
    return urlEquals(this.options.url).negate(url, decodeUrl(res.value));
  }

  /**
   * {{> executeScript }}
   * Appium: support only web testing
   *
   * Wraps [execute](http://webdriver.io/api/protocol/execute.html) command.
   */
  executeScript(fn) {
    return this.browser.execute.apply(this.browser, arguments).then(res => res.value);
  }

  /**
   * {{> executeAsyncScript }}
   * Appium: support only web testing
   */
  executeAsyncScript(fn) {
    return this.browser.executeAsync.apply(this.browser, arguments).then(res => res.value);
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
   * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
   * @param {number} [offsetX=0] (optional) X-axis offset.
   * @param {number} [offsetY=0] (optional) Y-axis offset.
   */

  /**
   * {{> scrollTo }}
   * Appium: support only web testing
   */
  async scrollTo(locator, offsetX = 0, offsetY = 0) {
    if (typeof locator === 'number' && typeof offsetX === 'number') {
      offsetY = offsetX;
      offsetX = locator;
      locator = null;
    }

    if (locator) {
      const res = await this._locate(withStrictLocator.call(this, locator), true);
      if (!res.value || res.value.length === 0) {
        return truth(`elements of ${locator}`, 'to be seen').assert(false);
      }
      const elem = res.value[0];
      if (this.browser.isMobile) return this.browser.touchScroll(elem.ELEMENT, offsetX, offsetY);
      const location = await this.browser.elementIdLocation(elem.ELEMENT);
      assertElementExists(location, 'Failed to receive', 'location');
      /* eslint-disable prefer-arrow-callback */
      return this.browser.execute(function (x, y) { return window.scrollTo(x, y); }, location.value.x + offsetX, location.value.y + offsetY);
      /* eslint-enable */
    }

    if (this.browser.isMobile) return this.browser.touchScroll(locator, offsetX, offsetY);

    /* eslint-disable prefer-arrow-callback, comma-dangle */
    return this.browser.execute(function (x, y) { return window.scrollTo(x, y); }, offsetX, offsetY);
    /* eslint-enable */
  }

  /**
   * {{> moveCursorTo}}
   * Appium: support only web testing
   */
  async moveCursorTo(locator, offsetX = 0, offsetY = 0) {
    let hasOffsetParams = true;
    if (typeof offsetX !== 'number' && typeof offsetY !== 'number') {
      hasOffsetParams = false;
    }

    const res = await this._locate(withStrictLocator.call(this, locator), true);
    assertElementExists(res, locator);

    const elem = res.value[0];

    if (!this.browser.isMobile) {
      return this.browser.moveTo(elem.ELEMENT, offsetX, offsetY);
    }

    const size = await this.browser.elementIdSize(elem.ELEMENT);
    assertElementExists(size, 'Failed to receive', 'size');

    const location = await this.browser.elementIdLocation(elem.ELEMENT);
    assertElementExists(size, 'Failed to receive', 'location');
    let x = location.value.x + size.value.width / 2;
    let y = location.value.y + size.value.height / 2;

    if (hasOffsetParams) {
      x = location.value.x + offsetX;
      y = location.value.y + offsetY;
    }
    return this.browser.touchMove(x, y);
  }

  /**
   * {{> saveScreenshot}}
   * Appium: support
   */
  async saveScreenshot(fileName, fullPage = false) {
    const outputFile = screenshotOutputFolder(fileName);

    if (!fullPage) {
      this.debug(`Screenshot has been saved to ${outputFile}`);
      return this.browser.saveScreenshot(outputFile);
    }

    /* eslint-disable prefer-arrow-callback, comma-dangle, prefer-const */
    let { width, height } = await this.browser.execute(function () {
      return {
        height: document.body.scrollHeight,
        width: document.body.scrollWidth
      };
    }).then(res => res.value);

    if (height < 100) height = 500; // errors for very small height
    /* eslint-enable */

    await this.browser.windowHandleSize({ width, height });
    this.debug(`Screenshot has been saved to ${outputFile}, size: ${width}x${height}`);
    return this.browser.saveScreenshot(outputFile);
  }


  /**
   * {{> setCookie}}
   * Appium: support only web testing
   *
   * Uses Selenium's JSON [cookie
   * format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).
   */
  async setCookie(cookie) {
    return this.browser.setCookie(cookie);
  }

  /**
   * {{> clearCookie}}
   * Appium: support only web testing
   */
  async clearCookie(cookie) {
    return this.browser.deleteCookie(cookie);
  }

  /**
   * {{> seeCookie}}
   * Appium: support only web testing
   */
  async seeCookie(name) {
    const res = await this.browser.getCookie(name);
    return truth(`cookie ${name}`, 'to be set').assert(res);
  }

  /**
   * {{> dontSeeCookie}}
   * Appium: support only web testing
   */
  async dontSeeCookie(name) {
    const res = await this.browser.getCookie(name);
    return truth(`cookie ${name}`, 'to be set').negate(res);
  }

  /**
   * {{> grabCookie}}
   * Appium: support only web testing
   */
  async grabCookie(name) {
    return this.browser.getCookie(name);
  }

  /**
   * Accepts the active JavaScript native popup window, as created by window.alert|window.confirm|window.prompt.
   * Don't confuse popups with modal windows, as created by [various
   * libraries](http://jster.net/category/windows-modals-popups). Appium: support only web testing
   */
  async acceptPopup() {
    return this.browser.alertText().then(function (res) {
      if (res !== null) {
        return this.alertAccept();
      }
    });
  }

  /**
   * Dismisses the active JavaScript popup, as created by window.alert|window.confirm|window.prompt.
   * Appium: support only web testing
   */
  async cancelPopup() {
    return this.browser.alertText().then(function (res) {
      if (res !== null) {
        return this.alertDismiss();
      }
    });
  }

  /**
   * Checks that the active JavaScript popup, as created by `window.alert|window.confirm|window.prompt`, contains the
   * given string. Appium: support only web testing
   *
   * @param {string} text value to check.
   */
  async seeInPopup(text) {
    return this.browser.alertText().then((res) => {
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
    return this.browser.alertText()
      .catch(() => null); // Don't throw an error
  }

  /**
   * {{> pressKeyWithKeyNormalization }}
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
   * {{> resizeWindow }}
   * Appium: not tested in web, in apps doesn't work
   */
  async resizeWindow(width, height) {
    if (width !== 'maximize') {
      return this.browser.windowHandleSize({ width, height });
    }

    /* eslint-disable prefer-arrow-callback,comma-dangle */
    const { screenWidth, screenHeight } = await this.browser.execute(function () {
      return {
        screenHeight: window.screen.height,
        screenWidth: window.screen.width
      };
    }).then(res => res.value);
    /* eslint-enable prefer-arrow-callback,comma-dangle */

    return this.browser.windowHandleSize({ width: screenWidth, height: screenHeight });
  }

  /**
   * {{> dragAndDrop }}
   * Appium: not tested
   */
  async dragAndDrop(srcElement, destElement) {
    const client = this.browser;

    if (client.isMobile) {
      let res = await this._locate(withStrictLocator.call(this, srcElement), true);
      assertElementExists(res, srcElement);
      let elem = res.value[0];

      let location = await this.browser.elementIdLocation(elem.ELEMENT);
      assertElementExists(location, `Failed to receive (${srcElement}) location`);

      res = await this.browser.touchDown(location.value.x, location.value.y);
      if (res.state !== 'success') throw new Error(`Failed to touch button down on (${srcElement})`);

      res = await this._locate(withStrictLocator.call(this, destElement), true);
      assertElementExists(res, destElement);
      elem = res.value[0];

      location = await this.browser.elementIdLocation(elem.ELEMENT);
      assertElementExists(location, `Failed to receive (${destElement}) location`);

      res = await this.browser.touchMove(location.value.x, location.value.y);

      if (res.state !== 'success') throw new Error(`Failed to touch move to (${destElement})`);
      return this.browser.touchUp(location.value.x, location.value.y);
    }

    return client.dragAndDrop(
      withStrictLocator.call(this, srcElement),
      withStrictLocator.call(this, destElement),
    );
  }


  /**
   * Close all tabs except for the current one.
   * Appium: support web test
   *
   * ```js
   * I.closeOtherTabs();
   * ```
   */
  async closeOtherTabs() {
    const client = this.browser;
    const handles = await client.getTabIds();
    const currentHandle = await client.getCurrentTabId();
    const otherHandles = handles.filter(handle => handle !== currentHandle);

    let p = Promise.resolve();
    otherHandles.forEach((handle) => {
      p = p.then(() => client.switchTab(handle).then(() => client.close(currentHandle)));
    });
    return p;
  }

  /**
   * {{> wait }}
   * Appium: support
   */
  async wait(sec) {
    return this.browser.pause(sec * 1000);
  }

  /**
   * {{> waitForEnabled }}
   * Appium: support
   */
  async waitForEnabled(locator, sec = null) {
    const client = this.browser;
    const aSec = sec || this.options.waitForTimeout;
    return client.waitUntil(async () => {
      const res = await this.browser.elements(withStrictLocator.call(this, locator));
      if (!res.value || res.value.length === 0) {
        return false;
      }
      const selected = await forEachAsync(res.value, async el => client.elementIdEnabled(el.ELEMENT));
      if (Array.isArray(selected)) {
        return selected.filter(val => val === true).length > 0;
      }
      return selected;
    }, aSec * 1000, `element (${JSON.stringify(locator)}) still not enabled after ${aSec} sec`);
  }

  /**
   * {{> waitForElement }}
   * Appium: support
   */
  async waitForElement(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    return this.browser.waitUntil(async () => {
      const res = await this.browser.elements(withStrictLocator.call(this, locator));
      return res.value && res.value.length;
    }, aSec * 1000, `element (${locator}) still not present on page after ${aSec} sec`);
  }

  async waitUntilExists(locator, sec = null) {
    console.log(`waitUntilExists deprecated:
    * use 'waitForElement' to wait for element to be attached
    * use 'waitForDetached to wait for element to be removed'`);
    return this.waitForStalenessOf(locator, sec);
  }


  /**
   * {{> waitInUrl }}
   */
  async waitInUrl(urlPart, sec = null) {
    const client = this.browser;
    const aSec = sec || this.options.waitForTimeout;
    let currUrl = '';
    return client
      .waitUntil(function () {
        return this.url().then((res) => {
          currUrl = decodeUrl(res.value);
          return currUrl.indexOf(urlPart) > -1;
        });
      }, aSec * 1000).catch((e) => {
        if (e.type === 'WaitUntilTimeoutError') {
          throw new Error(`expected url to include ${urlPart}, but found ${currUrl}`);
        } else {
          throw e;
        }
      });
  }

  /**
   * {{> waitUrlEquals }}
   */
  async waitUrlEquals(urlPart, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    const baseUrl = this.options.url;
    if (urlPart.indexOf('http') < 0) {
      urlPart = baseUrl + urlPart;
    }
    let currUrl = '';
    return this.browser.waitUntil(function () {
      return this.url().then((res) => {
        currUrl = decodeUrl(res.value);
        return currUrl === urlPart;
      });
    }, aSec * 1000).catch((e) => {
      if (e.type === 'WaitUntilTimeoutError') {
        throw new Error(`expected url to be ${urlPart}, but found ${currUrl}`);
      } else {
        throw e;
      }
    });
  }

  /**
   * {{> waitForText }}
   * Appium: support
   */
  async waitForText(text, sec = null, context = null) {
    const aSec = sec || this.options.waitForTimeout;
    const _context = context || this.root;
    return this.browser.waitUntil(
      async () => {
        const res = await this.browser.elements(withStrictLocator.call(this, _context));
        if (!res.value || res.value.length === 0) return false;
        const selected = await forEachAsync(res.value, async el => this.browser.elementIdText(el.ELEMENT));
        if (Array.isArray(selected)) {
          return selected.filter(part => part.indexOf(text) >= 0).length > 0;
        }
        return selected.indexOf(text) >= 0;
      }, aSec * 1000,
      `element (${_context}) is not in DOM or there is no element(${_context}) with text "${text}" after ${aSec} sec`,
    );
  }

  /**
   * {{> waitForValue }}
   */
  async waitForValue(field, value, sec = null) {
    const client = this.browser;
    const aSec = sec || this.options.waitForTimeout;
    return client.waitUntil(
      async () => {
        const res = await findFields.call(this, field);
        if (!res.value || res.value.length === 0) return false;
        const selected = await forEachAsync(res.value, async el => this.browser.elementIdAttribute(el.ELEMENT, 'value'));
        if (Array.isArray(selected)) {
          return selected.filter(part => part.indexOf(value) >= 0).length > 0;
        }
        return selected.indexOf(value) >= 0;
      }, aSec * 1000,
      `element (${field}) is not in DOM or there is no element(${field}) with value "${value}" after ${aSec} sec`,
    );
  }

  /**
   * {{> waitForVisible }}
   * Appium: support
   */
  async waitForVisible(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    return this.browser.waitUntil(async () => {
      const res = await this.browser.elements(withStrictLocator.call(this, locator));
      if (!res.value || res.value.length === 0) return false;
      const selected = await forEachAsync(res.value, async el => this.browser.elementIdDisplayed(el.ELEMENT));
      if (Array.isArray(selected)) {
        return selected.filter(val => val === true).length > 0;
      }
      return selected;
    }, aSec * 1000, `element (${JSON.stringify(locator)}) still not visible after ${aSec} sec`);
  }

  /**
   * {{> waitNumberOfVisibleElements }}
   */
  async waitNumberOfVisibleElements(locator, num, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    return this.browser.waitUntil(async () => {
      const res = await this.browser.elements(withStrictLocator.call(this, locator));
      if (!res.value || res.value.length === 0) return false;
      let selected = await forEachAsync(res.value, async el => this.browser.elementIdDisplayed(el.ELEMENT));

      if (!Array.isArray(selected)) selected = [selected];
      return selected.length === num;
    }, aSec * 1000, `The number of elements (${JSON.stringify(locator)}) is not ${num} after ${aSec} sec`);
  }

  /**
   * {{> waitForInvisible }}
   * Appium: support
   */
  async waitForInvisible(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    return this.browser.waitUntil(async () => {
      const res = await this.browser.elements(withStrictLocator.call(this, locator));
      if (!res.value || res.value.length === 0) return true;
      const selected = await forEachAsync(res.value, async el => this.browser.elementIdDisplayed(el.ELEMENT));
      if (Array.isArray(selected)) {
        return selected.filter(val => val === false).length > 0;
      }
      return !selected;
    }, aSec * 1000, `element (${JSON.stringify(locator)}) still visible after ${aSec} sec`);
  }

  /**
   * {{> waitToHide }}
   * Appium: support
   */
  async waitToHide(locator, sec = null) {
    return this.waitForInvisible(locator, sec);
  }

  async waitForStalenessOf(locator, sec = null) {
    console.log('waitForStalenessOf deprecated. Use waitForDetached instead');
    return this.waitForDetached(locator, sec);
  }

  /**
   * {{> waitForDetached }}
   * Appium: support
   */
  async waitForDetached(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    return this.browser.waitUntil(async () => {
      const res = await this.browser.elements(withStrictLocator.call(this, locator));
      if (!res.value || res.value.length === 0) {
        return true;
      }
      return false;
    }, aSec * 1000, `element (${JSON.stringify(locator)}) still attached to the DOM after ${aSec} sec`);
  }

  /**
   * {{> waitForFunction }}
   * Appium: support
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
    const client = this.browser;
    return client.waitUntil(async () => (await client.execute(fn, ...args)).value, aSec * 1000);
  }

  /**
   * {{> waitUntil }}
   * * *Appium*: supported
   */
  async waitUntil(fn, sec = null, timeoutMsg = null, interval = null) {
    const aSec = sec || this.options.waitForTimeout;
    const _interval = typeof interval === 'number' ? interval * 1000 : null;
    return this.browser.waitUntil(fn, aSec * 1000, timeoutMsg, _interval);
  }

  /**
   * {{> switchTo }}
   * Appium: support only web testing
   */
  async switchTo(locator) {
    if (Number.isInteger(locator)) {
      return this.browser.frame(locator);
    } else if (!locator) {
      return this.browser.frame(null);
    }
    const res = await this._locate(withStrictLocator.call(this, locator), true);
    assertElementExists(res, locator);
    return this.browser.frame(res.value[0]);
  }

  /**
   * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab.
   *
   * ```js
   * I.switchToNextTab();
   * I.switchToNextTab(2);
   * ```
   *
   * @param {number} [num=1] (optional) number of tabs to switch forward, default: 1.
   * @param {?number} [sec=null] (optional) time in seconds to wait.
   */
  async switchToNextTab(num = 1, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    const client = this.browser;
    return client
      .waitUntil(function () {
        return this.getTabIds().then(function (handles) {
          return this.getCurrentTabId().then(function (current) {
            if (handles.indexOf(current) + num + 1 <= handles.length) {
              return this.switchTab(handles[handles.indexOf(current) + num]);
            } return false;
          });
        });
      }, aSec * 1000, `There is no ability to switch to next tab with offset ${num}`);
  }

  /**
   * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab.
   *
   * ```js
   * I.switchToPreviousTab();
   * I.switchToPreviousTab(2);
   * ```
   *
   * @param {number} [num=1] (optional) number of tabs to switch backward, default: 1.
   * @param {?number} [sec] (optional) time in seconds to wait.
   */
  async switchToPreviousTab(num = 1, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    const client = this.browser;
    return client
      .waitUntil(function () {
        return this.getTabIds().then(function (handles) {
          return this.getCurrentTabId().then(function (current) {
            if (handles.indexOf(current) - num > -1) return this.switchTab(handles[handles.indexOf(current) - num]);
            return false;
          });
        });
      }, aSec * 1000, `There is no ability to switch to previous tab with offset ${num}`);
  }

  /**
   * Close current tab.
   *
   * ```js
   * I.closeCurrentTab();
   * ```
   */
  async closeCurrentTab() {
    const client = this.browser;
    return client.close();
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
   * {{> grabNumberOfOpenTabs }}
   */
  async grabNumberOfOpenTabs() {
    const pages = await this.browser.getTabIds();
    return pages.length;
  }

  /**
   * {{> refreshPage }}
   */
  async refreshPage() {
    const client = this.browser;
    return client.refresh();
  }

  /**
   * {{> scrollPageToTop }}
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
   * {{> scrollPageToBottom }}
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
   * {{> grabPageScrollPosition}}
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
   * Placeholder for ~ locator only test case write once run on both Appium and WebDriverIO.
   */
  runOnIOS(caps, fn) {
  }

  /**
   * Placeholder for ~ locator only test case write once run on both Appium and WebDriverIO.
   */
  runOnAndroid(caps, fn) {
  }

  /**
   * Placeholder for ~ locator only test case write once run on both Appium and WebDriverIO.
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

  const res = await this._locate(withStrictLocator.call(this, context), smartWaitEnabled);
  if (!res.value || res.value.length === 0) throw new ElementNotFound(context);

  const selected = await forEachAsync(res.value, async el => this.browser.elementIdText(el.ELEMENT));

  if (strict) {
    if (Array.isArray(selected)) {
      return selected.map(elText => equals(description)[assertType](text, elText));
    }
    return equals(description)[assertType](text, selected);
  }
  return stringIncludes(description)[assertType](text, selected);
}

// Mimic Array.forEach() API, but with an async callback function.
// Execute each callback on each array item serially. Useful when using WebDriverIO API.
//
// Added due because of problem with chrome driver when too many requests
// are made simultaneously. https://bugs.chromium.org/p/chromedriver/issues/detail?id=2152#c9
//
// @param {object[]} array Input array items to iterate over
// @param {function} callback Async function to excute on each array item
// @param {object} option Additional options. 'extractValue' will extract the .value object from a WebdriverIO
async function forEachAsync(array, callback, option = {}) {
  const {
    extractValue = true,
    unify: unifyResults = true,
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
  if (unifyResults) {
    return unify(values, { extractValue: true });
  }
  return values;
}

//  Mimic Array.filter() API, but with an async callback function.
//  Execute each callback on each array item serially. Useful when using WebDriverIO API.
//  Added due because of problem with chrome driver when too many requests
//  are made simultaneously. https://bugs.chromium.org/p/chromedriver/issues/detail?id=2152#c9
//  @param {object[]} array Input array items to iterate over
//  @param {function} callback Async function to excute on each array item
//  @param {object} option Additional options. 'extractValue' will extract the .value object from a WebdriverIO
//
async function filterAsync(array, callback, option = {}) {
  const {
    extractValue = true,
  } = option;
  const inputArray = Array.isArray(array) ? array : [array];
  const values = [];
  for (let index = 0; index < inputArray.length; index++) {
    try {
      const res = unify(await callback(inputArray[index], index, inputArray), { extractValue });
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


// Internal helper method to handle command results (similar behaviour as the unify function from WebDriverIO
// except it does not resolve promises)
//
// @param {object[]} items  list of items
// @param {object} [option]  extractValue: set to try to return the .value property of the input items
function unify(items, option = {}) {
  const { extractValue = false } = option;

  let result = Array.isArray(items) ? items : [items];

  if (extractValue) {
    result = result.map((res) => {
      if (Object.prototype.hasOwnProperty.call(res, 'value')) {
        return res.value;
      }
      return res;
    });
  }

  if (Array.isArray(result) && result.length === 1) {
    result = result[0];
  }

  return result;
}

async function findClickable(locator, locateFn) {
  locator = new Locator(locator);
  if (!locator.isFuzzy()) return locateFn(locator.simplify(), true);
  if (locator.isAccessibilityId()) return locateFn(withAccessiblitiyLocator.call(this, locator.value), true);

  let els;
  const literal = xpathLocator.literal(locator.value);

  els = await locateFn(Locator.clickable.narrow(literal));
  if (els.value.length) return els;

  els = await locateFn(Locator.clickable.wide(literal));
  if (els.value.length) return els;

  els = await locateFn(Locator.clickable.self(literal));
  if (els.value.length) return els;

  return locateFn(locator.value); // by css or xpath
}


async function findFields(locator) {
  locator = new Locator(locator);
  if (!locator.isFuzzy()) return this._locate(locator.simplify(), true);
  if (locator.isAccessibilityId()) return this._locate(withAccessiblitiyLocator.call(this, locator.value), true);

  const literal = xpathLocator.literal(locator.value);
  let els = await this._locate(Locator.field.byText(literal));
  if (els.value.length) return els;

  els = await this._locate(Locator.field.byName(literal));
  if (els.value.length) return els;
  return this._locate(locator.value); // by css or xpath
}

async function proceedSeeField(assertType, field, value) {
  const res = await findFields.call(this, field);
  assertElementExists(res, field, 'Field');

  const proceedMultiple = async (fields) => {
    const fieldResults = toArray(await forEachAsync(fields, async (el) => {
      return this.browser.elementIdAttribute(el.ELEMENT, 'value');
    }));

    if (typeof value === 'boolean') {
      equals(`no. of items matching > 0: ${field}`)[assertType](value, !!fieldResults.length);
    } else {
      // Assert that results were found so the forEach assert does not silently pass
      equals(`no. of items matching > 0:  ${field}`)[assertType](true, !!fieldResults.length);
      fieldResults.forEach(val => stringIncludes(`fields by ${field}`)[assertType](value, val));
    }
  };

  const proceedSingle = el => this.browser.elementIdAttribute(el.ELEMENT, 'value').then(res => stringIncludes(`fields by ${field}`)[assertType](value, res.value));

  const filterBySelected = async elements => filterAsync(elements, async el => this.browser.elementIdSelected(el.ELEMENT));

  const filterSelectedByValue = async (elements, value) => {
    return filterAsync(elements, async (el) => {
      const currentValue = unify(await this.browser.elementIdAttribute(el.ELEMENT, 'value'), { extractValue: true });
      const isSelected = unify(await this.browser.elementIdSelected(el.ELEMENT), { extractValue: true });
      return currentValue === value && isSelected;
    });
  };

  const tag = await this.browser.elementIdName(res.value[0].ELEMENT);
  if (tag.value === 'select') {
    const subOptions = unify(await this.browser.elementIdElements(res.value[0].ELEMENT, 'option'), { extractValue: true });

    if (value === '') {
      // Don't filter by value
      const selectedOptions = await filterBySelected(subOptions);
      return proceedMultiple(selectedOptions);
    }

    const options = await filterSelectedByValue(subOptions, value);
    return proceedMultiple(options);
  }

  if (tag.value === 'input') {
    const fieldType = unify(await this.browser.elementIdAttribute(res.value[0].ELEMENT, 'type'), { extractValue: true });

    if (typeof fieldType === 'string' && (fieldType === 'checkbox' || fieldType === 'radio')) {
      if (typeof value === 'boolean') {
        // Support boolean values
        const options = await filterBySelected(res.value);
        return proceedMultiple(options);
      }

      const options = await filterSelectedByValue(res.value, value);
      return proceedMultiple(options);
    }
    return proceedSingle(res.value[0]);
  }
  return proceedSingle(res.value[0]);
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

  const selected = await forEachAsync(res.value, async el => this.browser.elementIdSelected(el.ELEMENT));
  return truth(`checkable field ${field}`, 'to be checked')[assertType](selected);
}

async function findCheckable(locator, locateFn) {
  let els;
  locator = new Locator(locator);
  if (!locator.isFuzzy()) return locateFn(locator.simplify(), true);
  if (locator.isAccessibilityId()) return locateFn(withAccessiblitiyLocator.call(this, locator.value), true);

  const literal = xpathLocator.literal(locator.value);
  els = await locateFn(Locator.checkable.byText(literal));
  if (els.value.length) return els;
  els = await locateFn(Locator.checkable.byName(literal));
  if (els.value.length) return els;

  return locateFn(locator.value); // by css or xpath
}

function withStrictLocator(locator) {
  locator = new Locator(locator);
  if (locator.isAccessibilityId()) return withAccessiblitiyLocator.call(this, locator.value);
  return locator.simplify();
}

function isFrameLocator(locator) {
  locator = new Locator(locator);
  if (locator.isFrame()) return locator.value;
  return false;
}

function withAccessiblitiyLocator(locator) {
  if (this.isWeb === false) {
    return `accessibility id:${locator.slice(1)}`;
  }
  return `[aria-label="${locator.slice(1)}"]`;
  // hook before webdriverio supports native ~ locators in web
}

function assertElementExists(res, locator, prefix, suffix) {
  if (!res.value || res.value.length === 0) {
    throw new ElementNotFound(locator, prefix, suffix);
  }
}

function prepareLocateFn(context) {
  if (!context) return this._locate.bind(this);
  let el;
  return (l) => {
    if (el) return this.browser.elementIdElements(el, l);
    return this._locate(context, true).then((res) => {
      assertElementExists(res, context, 'Context element');
      return this.browser.elementIdElements(el = res.value[0].ELEMENT, l);
    });
  };
}

function isWithin() {
  return Object.keys(withinStore).length !== 0;
}

module.exports = WebDriverIO;
try {
  const webdriverio = requireg('webdriverio');
  if (!webdriverio.VERSION || webdriverio.VERSION.indexOf('4') !== 0) {
    console.log('DEPRECATION WARNING', 'WebDriverIO helper is compatible only with webdriverio v4. While you are using webdriverio 5+.');
    console.log('DEPRECATION WARNING', 'Using WebDriver helper instead...');
    console.log('DEPRECATION WARNING', 'Please replace WebDriverIO => WebDriver in config to remove this message');
    console.log('DEPRECATION WARNING', 'or downgrade to webdriverio@4 and use WebDriverIO if you face some issues');
    module.exports = require('./WebDriver');
  }
} catch (err) {
  // not installed, fine
}
