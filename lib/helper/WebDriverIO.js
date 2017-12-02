let webdriverio;
const requireg = require('requireg');
const Helper = require('../helper');
const stringIncludes = require('../assert/include').includes;
const { urlEquals, equals } = require('../assert/equal');
const empty = require('../assert/empty').empty;
const truth = require('../assert/truth').truth;
const { xpathLocator, fileExists, clearString, decodeUrl, chunkArray } = require('../utils');
const ElementNotFound = require('./errors/ElementNotFound');
const assert = require('assert');
const path = require('path');
<<<<<<< HEAD
const requireg = require('requireg');

const webRoot = 'body';
=======
const webRoot = 'body';
const Locator = require('../locator');
>>>>>>> refactored webdriverio

let withinStore = {};

/**
 * WebDriverIO helper which wraps [webdriverio](http://webdriver.io/) library to
 * manipulate browser using Selenium WebDriver or PhantomJS.
 *
 * ## Backends
 *
 * ### Selenium Installation
 *
 * 1. Download [Selenium Server](http://docs.seleniumhq.org/download/)
 * 2. For Chrome browser install [ChromeDriver](https://sites.google.com/a/chromium.org/chromedriver/getting-started),
 * for Firefox browser install [GeckoDriver](https://github.com/mozilla/geckodriver).
 * 3. Launch the server: `java -jar selenium-server-standalone-3.xx.xxx.jar`. To locate Chromedriver binary use
 * `-Dwebdriver.chrome.driver=./chromedriver` option. For Geckodriver use `-Dwebdriver.gecko.driver=`.
 *
 * ### PhantomJS Installation
 *
 * PhantomJS is a headless alternative to Selenium Server that implements the WebDriver protocol.
 * It allows you to run Selenium tests on a server without a GUI installed.
 *
 * 1. Download [PhantomJS](http://phantomjs.org/download.html)
 * 2. Run PhantomJS in WebDriver mode: `phantomjs --webdriver=4444`
 *
 * ### Configuration
 *
 * This helper should be configured in codecept.json
 *
 * * `url` - base url of website to be tested
 * * `browser` - browser in which perform testing
 * * `restart` (optional, default: true) - restart browser between tests.
 * * `smartWait`: (optional) **enables [SmartWait](http://codecept.io/acceptance/#smartwait)**; wait for additional milliseconds for element to appear. Enable for 5 secs: "smartWait": 5000
 * * `disableScreenshots` (optional, default: false)  - don't save screenshot on failure
 * * `uniqueScreenshotNames` (optional, default: false)  - option to prevent screenshot override if you have scenarios with the same name in different suites
 * * `keepBrowserState` (optional, default: false)  - keep browser state between tests when `restart` set to false.
 * * `keepCookies` (optional, default: false)  - keep cookies between tests when `restart` set to false.
 * * `windowSize`: (optional) default window size. Set to `maximize` or a dimension in the format `640x480`.
 * * `waitForTimeout`: (option) sets default wait time in *ms* for all `wait*` functions. 1000 by default;
 * * `desiredCapabilities`: Selenium's [desired
 * capabilities](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities)
 * * `manualStart` (optional, default: false) - do not start browser before a test, start it manually inside a helper
 * with `this.helpers["WebDriverIO"]._startBrowser()`
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

    this.options = {
      smartWait: 0,
      waitForTimeout: 1000, // ms
      desiredCapabilities: {},
      restart: true,
      uniqueScreenshotNames: false,
      disableScreenshots: false,
      fullPageScreenshots: true,
      manualStart: false,
      keepCookies: false,
      keepBrowserState: false,
      timeouts: {
        script: 1000, // ms
      },
    };

    this._validateConfig(config);
  }

  _validateConfig(config) {
    // set defaults
    this.root = webRoot;

    this.isRunning = false;

    // override defaults with config
    Object.assign(this.options, config);

    this.options.baseUrl = this.options.url || this.options.baseUrl;
    this.options.desiredCapabilities.browserName = this.options.browser || this.options.desiredCapabilities.browserName;
    this.options.waitForTimeout /= 1000; // convert to seconds

    if (!this.options.desiredCapabilities.platformName && (!this.options.url || !this.options.browser)) {
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
  }

  static _checkRequirements() {
    try {
      requireg('webdriverio');
    } catch (e) {
      return ['webdriverio'];
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
<<<<<<< HEAD
    return this.browser.then(() => {
      this.isRunning = true;
      const promisesList = [];
      if (this.options.timeouts) {
        promisesList.push(this.defineTimeout(this.options.timeouts));
      }
      if (this.options.windowSize === 'maximize') {
        promisesList.push(this.browser.execute('return [screen.width, screen.height]').then(res => this.browser.windowHandleSize({
          width: res.value[0],
          height: res.value[1],
        })));
      } else if (this.options.windowSize && this.options.windowSize.indexOf('x') > 0) {
        const dimensions = this.options.windowSize.split('x');
        promisesList.push(this.browser.windowHandleSize({
          width: dimensions[0],
          height: dimensions[1],
        }));
      }
      return Promise.all(promisesList);
    });
=======

    this.isRunning = true;
    if (this.options.timeouts) {
      await this.defineTimeout(this.options.timeouts);
    }

    if (this.options.windowSize === 'maximize') {
      await this.resizeWindow('maximize');
    } else if (this.options.windowSize && this.options.windowSize.indexOf('x') > 0) {
      let dimensions = this.options.windowSize.split('x');
      await this.resizeWindow(dimensions[0], dimensions[1]);
    }
    return this.browser;
>>>>>>> refactored webdriverio
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
<<<<<<< HEAD
    if (this.options.keepCookies) {
      return Promise.all([this.browser.execute('localStorage.clear();').catch((err) => {
        if (!(err.message.indexOf("Storage is disabled inside 'data:' URLs.") > -1)) throw err;
      }), this.closeOtherTabs()]);
    }
    if (this.options.desiredCapabilities.browserName) {
      this.debugSection('Session', 'cleaning cookies and localStorage');
      return Promise.all([this.browser.deleteCookie(), this.browser.execute('localStorage.clear();').catch((err) => {
        if (!(err.message.indexOf("Storage is disabled inside 'data:' URLs.") > -1)) throw err;
      }), this.closeOtherTabs()]);
=======

    if (!this.options.keepCookies && this.options.desiredCapabilities.browserName) {
      this.debugSection('Session', 'cleaning cookies and localStorage');
      await this.browser.deleteCookie();
>>>>>>> refactored webdriverio
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
    if (!this.options.restart && this.isRunning) return this.browser.end();
  }

<<<<<<< HEAD
  _failed(test) {
    const promisesList = [];
    if (Object.keys(withinStore).length !== 0) promisesList.push(this._withinEnd());
=======
  async _failed(test) {
    if (Object.keys(withinStore).length !== 0) await this._withinEnd();
>>>>>>> refactored webdriverio
    if (!this.options.disableScreenshots) {
      let fileName = clearString(test.title);
      if (test.ctx && test.ctx.test && test.ctx.test.type === 'hook') fileName = clearString(`${test.title}_${test.ctx.test.title}`);
      if (this.options.uniqueScreenshotNames) {
        const uuid = test.uuid || test.ctx.test.uuid;
        fileName = `${fileName.substring(0, 10)}_${uuid}.failed.png`;
      } else {
        fileName += '.failed.png';
      }
      await this.saveScreenshot(fileName, this.options.fullPageScreenshots).catch((err) => {
        if (err &&
            err.type &&
            err.type == "RuntimeError" &&
            err.message &&
            (err.message.indexOf("was terminated due to") > -1 || err.message.indexOf("no such window: target window already closed") > -1)
          ) {
          this.isRunning = false;
          return;
        }
      });
    }
<<<<<<< HEAD
    return Promise.all(promisesList).catch((err) => {
      if (err &&
          err.type &&
          err.type == 'RuntimeError' &&
          err.message &&
          (err.message.indexOf('was terminated due to') > -1 || err.message.indexOf('no such window: target window already closed') > -1)
      ) {
        this.isRunning = false;
      }
    });
  }

  _withinBegin(locator) {
    const frame = isFrameLocator(locator);
    const client = this.browser;
=======
  }

  async _withinBegin(locator) {
    let frame = isFrameLocator(locator);
    let client = this.browser;
>>>>>>> refactored webdriverio
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
<<<<<<< HEAD
    return client.element(withStrictLocator.call(this, locator)).then((res) => {
      this.browser.element = function (l) {
        return this.elementIdElement(res.value.ELEMENT, l);
      };
      this.browser.elements = function (l) {
        return this.elementIdElements(res.value.ELEMENT, l);
      };
    });
=======

    let res = await client.element(withStrictLocator(locator));
    this.browser.element = function (l) {
      return this.elementIdElement(res.value.ELEMENT, l);
    };
    this.browser.elements = function (l) {
      return this.elementIdElements(res.value.ELEMENT, l);
    };
    return this.browser;
>>>>>>> refactored webdriverio
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
   * Get elements by different locator types, including strict locator
   * Should be used in custom helpers:
   *
   * ```js
   * this.helpers['WebDriverIO']._locate({name: 'password'}).then //...
   * ```
   */
<<<<<<< HEAD
  _locate(locator, smartWait = false) {
    if (!this.options.smartWait || !smartWait) return this.browser.elements(withStrictLocator.call(this, locator));
    let els;

    return this.defineTimeout({ implicit: this.options.smartWait })
      .then(() => this.debugSection('SmartWait', `Locating ${locator} in ${this.options.smartWait}`))
      .then(() => this.browser.elements(withStrictLocator.call(this, locator)));
=======
  async _locate(locator, smartWait = false) {
    if (!this.options.smartWait || !smartWait) return this.browser.elements(withStrictLocator(locator));
    this.debugSection('SmartWait (${this.options.smartWait}ms)', `Locating ${locator} in ${this.options.smartWait}`);

    await this.defineTimeout({implicit: this.options.smartWait});
    let els = await this.browser.elements(withStrictLocator(locator));
    await this.defineTimeout({implicit: 0});
    return els;
>>>>>>> refactored webdriverio
  }

  /**
   * Find a checkbox by providing human readable text:
   *
   * ```js
   * this.helpers['WebDriverIO']._locateCheckable('I agree with terms and conditions').then // ...
   * ```
   */
<<<<<<< HEAD
  _locateCheckable(locator) {
    return findCheckable.call(this, locator, this.browser.elements.bind(this)).then(res => res.value);
=======
  async _locateCheckable(locator) {
    return findCheckable(locator, this.browser.elements.bind(this)).then((res) => res.value);
>>>>>>> refactored webdriverio
  }

  /**
   * Find a clickable element by providing human readable text:
   *
   * ```js
   * this.helpers['WebDriverIO']._locateClickable('Next page').then // ...
   * ```
   */
<<<<<<< HEAD
  _locateClickable(locator) {
    return findClickable.call(this, locator, this.browser.elements.bind(this)).then(res => res.value);
=======
  async _locateClickable(locator) {
    return findClickable(locator, this.browser.elements.bind(this)).then((res) => res.value);
>>>>>>> refactored webdriverio
  }

  /**
   * Find field elements by providing human readable text:
   *
   * ```js
   * this.helpers['WebDriverIO']._locateFields('Your email').then // ...
   * ```
   */
<<<<<<< HEAD
  _locateFields(locator) {
    return findFields.call(this, locator).then(res => res.value);
=======
  async _locateFields(locator) {
    return findFields.call(this, locator).then((res) => res.value);
>>>>>>> refactored webdriverio
  }

  /**
   * Set [WebDriverIO timeouts](http://webdriver.io/guide/testrunner/timeouts.html) in realtime.
   * Appium: support only web testing
   * Timeouts are expected to be passed as object:
   *
   * ```js
   * I.defineTimeout({ script: 5000 });
   * I.defineTimeout({ implicit: 10000, pageLoad: 10000, script: 5000 });
   * ```
   */
<<<<<<< HEAD
  defineTimeout(timeouts) {
    const p = [];
=======
  async defineTimeout(timeouts) {
>>>>>>> refactored webdriverio
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
    return this.browser; // return the last response
  }

  /**
   * {{> ../webapi/amOnPage }}
   * Appium: support only web testing
   */
  amOnPage(url) {
    return this.browser.url(url).url((err, res) => {
      if (err) throw err;
      this.debugSection('Url', res.value);
    });
  }

  /**
   * {{> ../webapi/click }}
   * Appium: support
   */
<<<<<<< HEAD
  click(locator, context = null) {
    const clickMethod = this.browser.isMobile ? 'touchClick' : 'elementIdClick';
    const locateFn = prepareLocateFn.call(this, context);

    return findClickable.call(this, locator, locateFn).then((res) => {
      if (!res.value || res.value.length === 0) {
        if (typeof locator === 'object') locator = JSON.stringify(locator);
        if (context) locator += ` inside ${context}`;
        throw new ElementNotFound(locator, 'Clickable element');
      }
      return this.browser[clickMethod](res.value[0].ELEMENT);
    });
=======
  async click(locator, context = null) {
    let clickMethod = this.browser.isMobile ? 'touchClick' : 'elementIdClick';
    let locateFn = prepareLocateFn.call(this, context);

    let res = await findClickable(locator, locateFn);
    if (!res.value || res.value.length === 0) {
      if (context) locator += ` inside ${new Locator(context).toString()}`;
      throw new ElementNotFound(new Locator(locator).toString(), "Clickable element");
    }
    return this.browser[clickMethod](res.value[0].ELEMENT);
>>>>>>> refactored webdriverio
  }

  /**
   * {{> ../webapi/doubleClick }}
   * Appium: support only web testing
   */
<<<<<<< HEAD
  doubleClick(locator, context = null) {
    const clickMethod = this.browser.isMobile ? 'touchClick' : 'elementIdClick';
    const locateFn = prepareLocateFn.call(this, context);

    return findClickable.call(this, locator, locateFn).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(locator, 'Clickable element');
      }
      const elem = res.value[0];
      return this.browser.moveTo(elem.ELEMENT).doDoubleClick();
    });
=======
  async doubleClick(locator, context = null) {
    let clickMethod = this.browser.isMobile ? 'touchClick' : 'elementIdClick';
    let locateFn = prepareLocateFn.call(this, context);

    let res = await findClickable(locator, locateFn);
    assertElementExists(res, locator, "Clickable element");

    let elem = res.value[0];
    return this.browser.moveTo(elem.ELEMENT).doDoubleClick();
>>>>>>> refactored webdriverio
  }

  /**
   * Performs right click on an element matched by CSS or XPath.
   * Appium: support, but in apps works as usual click
   */
  async rightClick(locator) {
    /**
     * just press button if no selector is given
     */
    if (locator === undefined) {
      return this.browser.buttonPress('right');
    }
<<<<<<< HEAD
    return this._locate(locator, true).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(locator, 'Clickable element');
      }
      const elem = res.value[0];
      if (this.browser.isMobile) return this.browser.touchClick(elem.ELEMENT);
      return this.browser.moveTo(elem.ELEMENT).buttonPress('right');
    });
=======

    let res = await this._locate(locator, true);
    assertElementExists(res, locator, "Clickable element");
    let elem = res.value[0];
    if (this.browser.isMobile) return this.browser.touchClick(elem.ELEMENT);
    return this.browser.moveTo(elem.ELEMENT).buttonPress("right");
>>>>>>> refactored webdriverio
  }

  /**
   * {{> ../webapi/fillField }}
   * Appium: support
   */
<<<<<<< HEAD
  fillField(field, value) {
    return findFields.call(this, field).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(field, 'Field');
      }
      const elem = res.value[0];
      return this.browser.elementIdClear(elem.ELEMENT).elementIdValue(elem.ELEMENT, value);
    });
=======
  async fillField(field, value) {
    let res = await findFields.call(this, field);
    assertElementExists(res, field, "Field");
    let elem = res.value[0];
    return this.browser.elementIdClear(elem.ELEMENT).elementIdValue(elem.ELEMENT, value);
>>>>>>> refactored webdriverio
  }

  /**
   * {{> ../webapi/appendField }}
   * Appium: support, but it's clear a field before insert in apps
   */
<<<<<<< HEAD
  appendField(field, value) {
    return findFields.call(this, field).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(field, 'Field');
      }
      const elem = res.value[0];
      return this.browser.elementIdValue(elem.ELEMENT, value);
    });
=======
  async appendField(field, value) {
    let res = await findFields.call(this, field);
    assertElementExists(res, field, "Field");
    let elem = res.value[0];
    return this.browser.elementIdValue(elem.ELEMENT, value);
  }


  /**
   * {{> ../webapi/clearField}}
   * Appium: support
   */
  async clearField(field) {
    let res = await findFields.call(this, field);
    assertElementExists(res, field, "Field");
    let elem = res.value[0];
    return this.browser.elementIdClear(elem.ELEMENT);
>>>>>>> refactored webdriverio
  }



  /**
   * {{> ../webapi/selectOption}}
   */
<<<<<<< HEAD
  selectOption(select, option) {
    return findFields.call(this, select).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(select, 'Selectable field');
      }
      const elem = res.value[0];

      let normalized,
        byVisibleText;
      let commands = [];
=======
  async selectOption(select, option) {
    let res = await findFields.call(this, select);
    assertElementExists(res, select, "Selectable field");
    let elem = res.value[0];
    let commands = [];

    if (!Array.isArray(option)) {
      option = [option];
    }
>>>>>>> refactored webdriverio

    // select options by visible text
    option.forEach((opt) => commands.push(this.browser.elementIdElements(elem.ELEMENT, Locator.select.byVisibleText(opt))));
    let els = await this.browser.unify(commands, { extractValue: true });
    commands = [];
    let clickOptionFn = (el) => {
      if (el[0]) el = el[0];
      if (el && el.ELEMENT) commands.push(this.browser.elementIdClick(el.ELEMENT));
    };

<<<<<<< HEAD
      option.forEach((opt) => {
        normalized = `[normalize-space(.) = "${opt.trim()}"]`;
        byVisibleText = `./option${normalized}|./optgroup/option${normalized}`;
        commands.push(this.browser.elementIdElements(elem.ELEMENT, byVisibleText));
      });
      return this.browser.unify(commands, {
        extractValue: true,
      }).then((els) => {
        commands = [];
        const clickOptionFn = (el) => {
          if (el[0]) el = el[0];
          if (el && el.ELEMENT) commands.push(this.browser.elementIdClick(el.ELEMENT));
        };

        if (els.length) {
          els.forEach(clickOptionFn);
          return this.browser.unify(commands);
        }
        let normalized,
          byValue;

        option.forEach((opt) => {
          normalized = `[normalize-space(@value) = "${opt.trim()}"]`;
          byValue = `./option${normalized}|./optgroup/option${normalized}`;
          commands.push(this.browser.elementIdElements(elem.ELEMENT, byValue));
        });
        // try by value
        return this.browser.unify(commands, {
          extractValue: true,
        }).then((els) => {
          if (els.length === 0) {
            throw new ElementNotFound(select, `Option ${option} in`, 'was found neither by visible text not by value');
          }
          commands = [];
          els.forEach(clickOptionFn);
          return this.browser.unify(commands);
        });
      });
    });
=======
    if (els.length) {
      els.forEach(clickOptionFn);
      return this.browser.unify(commands);
    }

    // select options by value
    option.forEach((opt) => commands.push(this.browser.elementIdElements(elem.ELEMENT, Locator.select.byValue(opt))));
    els = await this.browser.unify(commands, { extractValue: true });
    if (els.length === 0) {
      throw new ElementNotFound(select, `Option ${option} in`, "was found neither by visible text not by value");
    }
    commands = [];
    els.forEach(clickOptionFn);
    return this.browser.unify(commands);
>>>>>>> refactored webdriverio
  }

  /**
   * {{> ../webapi/attachFile }}
   * Appium: not tested
   */
<<<<<<< HEAD
  attachFile(locator, pathToFile) {
    const file = path.join(global.codecept_dir, pathToFile);
    if (!fileExists(file)) {
      throw new Error(`File at ${file} can not be found on local system`);
    }
    return findFields.call(this, locator).then((el) => {
      this.debug(`Uploading ${file}`);
      return this.browser.uploadFile(file).then((res) => {
        if (!el.value || el.value.length === 0) {
          throw new ElementNotFound(locator, 'File field');
        }
        return this.browser.elementIdValue(el.value[0].ELEMENT, res.value);
      });
    });
=======
  async attachFile(locator, pathToFile) {
    let file = path.join(global.codecept_dir, pathToFile);
    if (!fileExists(file)) {
      throw new Error(`File at ${file} can not be found on local system`);
    }
    let el = await findFields.call(this, locator);
    this.debug("Uploading " + file);

    let res = await this.browser.uploadFile(file);
    assertElementExists(el, locator, "File field");
    return this.browser.elementIdValue(el.value[0].ELEMENT, res.value);
>>>>>>> refactored webdriverio
  }

  /**
   * {{> ../webapi/checkOption }}
   * Appium: not tested
   */
<<<<<<< HEAD
  checkOption(field, context = null) {
    const clickMethod = this.browser.isMobile ? 'touchClick' : 'elementIdClick';

    const locateFn = prepareLocateFn.call(this, context);

    return findCheckable.call(this, field, locateFn).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(field, 'Checkable');
      }
      const elem = res.value[0];
      return this.browser.elementIdSelected(elem.ELEMENT).then(function (isSelected) {
        if (isSelected.value) return true;
        return this[clickMethod](elem.ELEMENT);
      });
    });
=======
  async checkOption(field, context = null) {
    let clickMethod = this.browser.isMobile ? 'touchClick' : 'elementIdClick';
    let locateFn = prepareLocateFn.call(this, context);

    let res = await findCheckable(field, locateFn);

    assertElementExists(res, field, "Checkable");
    let elem = res.value[0];

    let isSelected = await this.browser.elementIdSelected(elem.ELEMENT);
    if (isSelected.value) return Promise.resolve(true);
    return this.browser[clickMethod](elem.ELEMENT);
>>>>>>> refactored webdriverio
  }

  /**
   * {{> ../webapi/grabTextFrom }}
   * Appium: support
   */
<<<<<<< HEAD
  grabTextFrom(locator) {
    const client = this.browser;
    return this._locate(locator, true).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(locator);
      }
      const commands = [];
      res.value.forEach(el => commands.push(client.elementIdText(el.ELEMENT)));
      return client.unify(commands, {
        extractValue: true,
      }).then(selected => selected);
    });
=======
  async grabTextFrom(locator) {
    let res = await this._locate(locator, true);
    assertElementExists(res, locator);

    let commands = [];
    res.value.forEach((el) => commands.push(this.browser.elementIdText(el.ELEMENT)));
    return this.browser.unify(commands, {
      extractValue: true
    }).then((selected) => selected);
>>>>>>> refactored webdriverio
  }

  /**
   * Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside a generator with `yield`** operator.
   * Appium: support only web testing
   *
   *
   * ```js
   * let postHTML = yield I.grabHTMLFrom('#post');
   * ```
   */
<<<<<<< HEAD
  grabHTMLFrom(locator) {
    return this.browser.getHTML(withStrictLocator.call(this, locator)).then(html => html);
=======
  async grabHTMLFrom(locator) {
    return this.browser.getHTML(withStrictLocator(locator)).then((html) => html);
>>>>>>> refactored webdriverio
  }

  /**
   * {{> ../webapi/grabValueFrom }}
   * Appium: support only web testing
   */
<<<<<<< HEAD
  grabValueFrom(locator) {
    const client = this.browser;
    return this._locate(locator, true).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(locator);
      }
      const commands = [];
      res.value.forEach(el => commands.push(client.elementIdAttribute(el.ELEMENT, 'value')));
      return client.unify(commands, {
        extractValue: true,
      }).then(selected => selected);
=======
  async grabValueFrom(locator) {
    let res = await this._locate(locator, true);
    assertElementExists(res, locator);

    let commands = [];
    res.value.forEach((el) => commands.push(this.browser.elementIdAttribute(el.ELEMENT, 'value')));
    return this.browser.unify(commands, {
      extractValue: true
    }).then((selected) => {
      return selected;
>>>>>>> refactored webdriverio
    });
  }

  /**
   * Grab CSS property for given locator
   *
   * ```js
   * I.grabCssPropertyFrom('h3', 'font-weight');
   * ```
   */
<<<<<<< HEAD
  grabCssPropertyFrom(locator, cssProperty) {
    const client = this.browser;
    return this._locate(locator).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(locator);
      }
      const commands = [];
      res.value.forEach(el => commands.push(client.elementIdCssProperty(el.ELEMENT, cssProperty)));
      return client.unify(commands, {
        extractValue: true,
      }).then(selected => selected);
=======
  async grabCssPropertyFrom(locator, cssProperty) {
    let res = await this._locate(locator, true);
    assertElementExists(res, locator);

    let commands = [];
    res.value.forEach((el) => commands.push(this.browser.elementIdCssProperty(el.ELEMENT, cssProperty)));
    return this.browser.unify(commands, {
      extractValue: true
    }).then((selected) => {
      return selected;
>>>>>>> refactored webdriverio
    });
  }

  /**
   * {{> ../webapi/grabAttributeFrom }}
   * Appium: can be used for apps only with several values ("contentDescription", "text", "className", "resourceId")
   */
<<<<<<< HEAD
  grabAttributeFrom(locator, attr) {
    const client = this.browser;
    return this._locate(locator, true).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(locator);
      }
      const commands = [];
      res.value.forEach(el => commands.push(client.elementIdAttribute(el.ELEMENT, attr)));
      return client.unify(commands, {
        extractValue: true,
      }).then(selected => selected);
=======
  async grabAttributeFrom(locator, attr) {
    let res = await this._locate(locator, true);
    assertElementExists(res, locator);
    let commands = [];
    res.value.forEach((el) => commands.push(this.browser.elementIdAttribute(el.ELEMENT, attr)));
    return this.browser.unify(commands, {
      extractValue: true
    }).then((selected) => {
      return selected;
>>>>>>> refactored webdriverio
    });
  }

  /**
   * {{> ../webapi/seeInTitle }}
   * Appium: support only web testing
   */
<<<<<<< HEAD
  seeInTitle(text) {
    return this.browser.getTitle().then(title => stringIncludes('web page title').assert(text, title));
=======
  async seeInTitle(text) {
    let title = await this.browser.getTitle();
    return stringIncludes('web page title').assert(text, title);
>>>>>>> refactored webdriverio
  }

  /**
   * Checks that title is equal to provided one.
   *
   * ```js
   * I.seeTitleEquals('Test title.');
   * ```
   */
<<<<<<< HEAD
  seeTitleEquals(text) {
    return this.browser.getTitle().then(title => assert.equal(title, text, `expected web page title to be ${text}, but found ${title}`));
=======
  async seeTitleEquals(text) {
    let title = await this.browser.getTitle();
    return assert.equal(title, text, `expected web page title to be ${text}, but found ${title}`);
>>>>>>> refactored webdriverio
  }

  /**
   * {{> ../webapi/dontSeeInTitle }}
   * Appium: support only web testing
   */
<<<<<<< HEAD
  dontSeeInTitle(text) {
    return this.browser.getTitle().then(title => stringIncludes('web page title').negate(text, title));
=======
  async dontSeeInTitle(text) {
    let title = await this.browser.getTitle();
    return stringIncludes('web page title').negate(text, title);
>>>>>>> refactored webdriverio
  }

  /**
   * {{> ../webapi/grabTitle }}
   * Appium: support only web testing
   */
  async grabTitle() {
    let title = await this.browser.getTitle();
    this.debugSection('Title', title);
    return title;
  }

  /**
   * {{> ../webapi/see }}
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
   */
  async seeTextEquals(text, context = null) {
    return proceedSee.call(this, 'assert', text, context, true);
  }

  /**
   * {{> ../webapi/dontSee }}
   * Appium: support with context in apps
   */
  async dontSee(text, context = null) {
    return proceedSee.call(this, 'negate', text, context);
  }

  /**
   * {{> ../webapi/seeInField }}
   * Appium: support only web testing
   */
  async seeInField(field, value) {
    return proceedSeeField.call(this, 'assert', field, value);
  }

  /**
   * {{> ../webapi/dontSeeInField }}
   * Appium: support only web testing
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
   * Appium: support
   */
<<<<<<< HEAD
  seeElement(locator) {
    return this._locate(locator, true).then((res) => {
      if (!res.value || res.value.length === 0) {
        return truth(`elements of ${locator}`, 'to be seen').assert(false);
      }
      const commands = [];
      res.value.forEach(el => commands.push(this.browser.elementIdDisplayed(el.ELEMENT)));
      return this.browser.unify(commands, {
        extractValue: true,
      }).then(selected => truth(`elements of ${locator}`, 'to be seen').assert(selected));
    });
=======
  async seeElement(locator) {
    let res = await this._locate(locator, true);
    if (!res.value || res.value.length === 0) {
      return truth(`elements of ${locator}`, 'to be seen').assert(false);
    }
    let commands = [];
    res.value.forEach((el) => commands.push(this.browser.elementIdDisplayed(el.ELEMENT)));
    let selected = await this.browser.unify(commands, { extractValue: true })
    return truth(`elements of ${locator}`, 'to be seen').assert(selected);
>>>>>>> refactored webdriverio
  }

  /**
   * {{> ../webapi/dontSeeElement}}
   * Appium: support
   */
<<<<<<< HEAD
  dontSeeElement(locator) {
    return this.browser.elements(withStrictLocator.call(this, locator)).then((res) => {
      if (!res.value || res.value.length === 0) {
        return truth(`elements of ${locator}`, 'to be seen').negate(false);
      }
      const commands = [];
      res.value.forEach(el => commands.push(this.browser.elementIdDisplayed(el.ELEMENT)));
      return this.browser.unify(commands, {
        extractValue: true,
      }).then(selected => truth(`elements of ${locator}`, 'to be seen').negate(selected));
    });
=======
  async dontSeeElement(locator) {
    let res = await this._locate(locator, false);
    if (!res.value || res.value.length === 0) {
      return truth(`elements of ${locator}`, 'to be seen').negate(false);
    }
    let commands = [];
    res.value.forEach((el) => commands.push(this.browser.elementIdDisplayed(el.ELEMENT)));
    let selected = await this.browser.unify(commands, { extractValue: true });
    return truth(`elements of ${locator}`, 'to be seen').negate(selected);
>>>>>>> refactored webdriverio
  }

  /**
   * {{> ../webapi/seeElementInDOM }}
   * Appium: support
   */
<<<<<<< HEAD
  seeElementInDOM(locator) {
    return this.browser.elements(withStrictLocator.call(this, locator)).then(res => empty('elements').negate(res.value));
=======
  async seeElementInDOM(locator) {
    let res = await this.browser.elements(withStrictLocator(locator));
    return empty('elements').negate(res.value);
>>>>>>> refactored webdriverio
  }

  /**
   * {{> ../webapi/dontSeeElementInDOM }}
   * Appium: support
   */
<<<<<<< HEAD
  dontSeeElementInDOM(locator) {
    return this.browser.elements(withStrictLocator.call(this, locator)).then(res => empty('elements').assert(res.value));
=======
  async dontSeeElementInDOM(locator) {
    let res = await this.browser.elements(withStrictLocator(locator));
    return empty('elements').assert(res.value);
>>>>>>> refactored webdriverio
  }

  /**
   * {{> ../webapi/seeInSource }}
   * Appium: support
   */
<<<<<<< HEAD
  seeInSource(text) {
    return this.browser.getSource().then(source => stringIncludes('HTML source of a page').assert(text, source));
=======
  async seeInSource(text) {
    let source = await this.browser.getSource();
    return stringIncludes('HTML source of a page').assert(text, source);
>>>>>>> refactored webdriverio
  }

  /**
   * {{> ../webapi/seeInSource }}
   * Appium: support
   */
  async grabSource() {
    return this.browser.getSource();
  }

  /**
   * Get JS log from browser. Log buffer is reset after each request.
   *
   * ```js
   * let logs = yield I.grabBrowserLogs();
   * console.log(JSON.stringify(logs))
   * ```
   */
<<<<<<< HEAD
  grabBrowserLogs() {
    return this.browser.log('browser').then(res => res.value);
=======
  async grabBrowserLogs() {
    return this.browser.log("browser").then((res) => res.value);
>>>>>>> refactored webdriverio
  }

  /**
   * {{> ../webapi/dontSeeInSource }}
   * Appium: support
   */
<<<<<<< HEAD
  dontSeeInSource(text) {
    return this.browser.getSource().then(source => stringIncludes('HTML source of a page').negate(text, source));
=======
  async dontSeeInSource(text) {
    let source = await this.browser.getSource();
    return stringIncludes('HTML source of a page').negate(text, source);
>>>>>>> refactored webdriverio
  }

  /**
   * asserts that an element appears a given number of times in the DOM
   * Element is located by label or name or CSS or XPath.
   * Appium: support
   *
   * ```js
   * I.seeNumberOfElements('#submitBtn', 1);
   * ```
   */
<<<<<<< HEAD
  seeNumberOfElements(selector, num) {
    return this._locate(withStrictLocator.call(this, selector))
      .then(res => assert.equal(
        res.value.length, num,
        `expected number of elements (${selector}) is ${num}, but found ${res.value.length}`,
      ));
=======
  async seeNumberOfElements(selector, num) {
    let res = await this._locate(withStrictLocator(selector));
    return assert.equal(res.value.length, num, `expected number of elements (${selector}) is ${num}, but found ${res.value.length}`);
>>>>>>> refactored webdriverio
  }

  /**
   * asserts that an element is visible a given number of times
   * Element is located by CSS or XPath.
   *
   * ```js
   * I.seeNumberOfVisibleElements('.buttons', 3);
   * ```
   */
<<<<<<< HEAD
  seeNumberOfVisibleElements(locator, num) {
    return this.grabNumberOfVisibleElements(locator).then(res => assert.equal(
      res, num,
      `expected number of visible elements (${locator}) is ${num}, but found ${res}`,
    ));
=======
  async seeNumberOfVisibleElements(locator, num) {
    let res = await this.grabNumberOfVisibleElements(locator);
    return assert.equal(res, num, `expected number of visible elements (${locator}) is ${num}, but found ${res}`);
>>>>>>> refactored webdriverio
  }

  /**
   * Checks that all elements with given locator have given CSS properties.
   *
   * ```js
   * I.seeCssPropertiesOnElements('h3', { 'font-weight': "bold"});
   * ```
   */
<<<<<<< HEAD
  seeCssPropertiesOnElements(locator, cssProperties) {
    const client = this.browser;
    return this._locate(locator).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(locator);
      }
      const elemAmount = res.value.length;
      const commands = [];
      res.value.forEach((el) => {
        Object.keys(cssProperties).forEach((prop) => {
          commands.push(client.elementIdCssProperty(el.ELEMENT, prop));
        });
      });
      return client.unify(commands, {
        extractValue: true,
      }).then((props) => {
        const values = Object.keys(cssProperties).map(key => cssProperties[key]);
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
          `Not all elements (${locator}) have CSS property ${JSON.stringify(cssProperties)}`,
        );
=======
  async seeCssPropertiesOnElements(locator, cssProperties) {
    let res = await this._locate(locator);
    assertElementExists(res, locator);
    let elemAmount = res.value.length;
    let commands = [];
    res.value.forEach((el) => {
      Object.keys(cssProperties).forEach((prop) => {
        commands.push(this.browser.elementIdCssProperty(el.ELEMENT, prop));
>>>>>>> refactored webdriverio
      });
    });
    let props = await this.browser.unify(commands, { extractValue: true });
    let values = Object.keys(cssProperties).map((key) => cssProperties[key] );
    if (!Array.isArray(props)) props = [props];
    let chunked = chunkArray(props, values.length);
    chunked = chunked.filter((val) => {
      for (var i = 0; i < val.length; ++i) {
        if (val[i] !== values[i]) return false;
      }
      return true;
    });
    return assert.ok(chunked.length === elemAmount,
      `Not all elements (${locator}) have CSS property ${JSON.stringify(cssProperties)}`);
  }

  /**
   * Checks that all elements with given locator have given attributes.
   *
   * ```js
   * I.seeAttributesOnElements('//form', {'method': "post"});
   * ```
   */
<<<<<<< HEAD
  seeAttributesOnElements(locator, attributes) {
    const client = this.browser;
    return this._locate(locator).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(locator);
      }
      const elemAmount = res.value.length;
      const commands = [];
      res.value.forEach((el) => {
        Object.keys(attributes).forEach((attr) => {
          commands.push(client.elementIdAttribute(el.ELEMENT, attr));
        });
      });
      return client.unify(commands, {
        extractValue: true,
      }).then((attrs) => {
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
          `Not all elements (${locator}) have attributes ${JSON.stringify(attributes)}`,
        );
=======
  async seeAttributesOnElements(locator, attributes) {
    let res = await this._locate(locator);
    assertElementExists(res, locator);
    let elemAmount = res.value.length;
    let commands = [];
    res.value.forEach((el) => {
      Object.keys(attributes).forEach((attr) => {
        commands.push(this.browser.elementIdAttribute(el.ELEMENT, attr));
>>>>>>> refactored webdriverio
      });
    });
    let attrs = await this.browser.unify(commands, { extractValue: true });
    let values = Object.keys(attributes).map(function (key){
      return attributes[key];
    });
    if (!Array.isArray(attrs)) attrs = [attrs];
    let chunked = chunkArray(attrs, values.length);
    chunked = chunked.filter((val) => {
      for (var i = 0; i < val.length; ++i) {
        if (val[i] !== values[i]) return false;
      }
      return true;
    });
    return assert.ok(chunked.length === elemAmount,
      `Not all elements (${locator}) have attributes ${JSON.stringify(attributes)}`);
  }

  /**
   * Grab number of visible elements by locator
   *
   * ```js
   * I.grabNumberOfVisibleElements('p');
   * ```
   */
<<<<<<< HEAD
  grabNumberOfVisibleElements(locator) {
    return this.browser.elements(withStrictLocator.call(this, locator)).then((res) => {
      if (!res.value || res.value.length === 0) {
        return 0;
      }
      const commands = [];
      res.value.forEach(el => commands.push(this.browser.elementIdDisplayed(el.ELEMENT)));
      return this.browser.unify(commands, {
        extractValue: true,
      }).then((selected) => {
        if (!Array.isArray(selected)) selected = [selected];
        selected = selected.filter(val => val === true);
        return selected.length;
      });
    });
=======
  async grabNumberOfVisibleElements(locator) {
    let res = await this._locate(locator);
    assertElementExists(res, locator);

    let commands = [];
    res.value.forEach((el) => commands.push(this.browser.elementIdDisplayed(el.ELEMENT)));
    let selected = await this.browser.unify(commands, { extractValue: true });
    if (!Array.isArray(selected)) selected = [selected];
    selected = selected.filter((val) => val === true);
    return selected.length;
>>>>>>> refactored webdriverio
  }

  /**
   * {{> ../webapi/seeInCurrentUrl }}
   * Appium: support only web testing
   */
<<<<<<< HEAD
  seeInCurrentUrl(url) {
    return this.browser.url().then(res => stringIncludes('url').assert(url, decodeUrl(res.value)));
=======
  async seeInCurrentUrl(url) {
    let res = await this.browser.url();
    return stringIncludes('url').assert(url, decodeUrl(res.value));
>>>>>>> refactored webdriverio
  }

  /**
   * {{> ../webapi/dontSeeInCurrentUrl }}
   * Appium: support only web testing
   */
<<<<<<< HEAD
  dontSeeInCurrentUrl(url) {
    return this.browser.url().then(res => stringIncludes('url').negate(url, decodeUrl(res.value)));
=======
  async dontSeeInCurrentUrl(url) {
    let res = await this.browser.url();
    return stringIncludes('url').negate(url, decodeUrl(res.value));
>>>>>>> refactored webdriverio
  }

  /**
   * {{> ../webapi/seeCurrentUrlEquals }}
   * Appium: support only web testing
   */
<<<<<<< HEAD
  seeCurrentUrlEquals(url) {
    return this.browser.url().then(res => urlEquals(this.options.url).assert(url, decodeUrl(res.value)));
=======
  async seeCurrentUrlEquals(url) {
    let res = await this.browser.url();
    return urlEquals(this.options.url).assert(url, decodeUrl(res.value));
>>>>>>> refactored webdriverio
  }

  /**
   * {{> ../webapi/dontSeeCurrentUrlEquals }}
   * Appium: support only web testing
   */
<<<<<<< HEAD
  dontSeeCurrentUrlEquals(url) {
    return this.browser.url().then(res => urlEquals(this.options.url).negate(url, decodeUrl(res.value)));
=======
  async dontSeeCurrentUrlEquals(url) {
    let res = await this.browser.url();
    return urlEquals(this.options.url).negate(url, decodeUrl(res.value));
>>>>>>> refactored webdriverio
  }

  /**
   * {{> ../webapi/executeScript }}
   * Appium: support only web testing
   *
   * Wraps [execute](http://webdriver.io/api/protocol/execute.html) command.
   */
  executeScript(fn) {
    return this.browser.execute.apply(this.browser, arguments).then(res => res.value);
  }

  /**
   * {{> ../webapi/executeAsyncScript }}
   * Appium: support only web testing
   */
  executeAsyncScript(fn) {
    return this.browser.executeAsync.apply(this.browser, arguments).then(res => res.value);
  }

  /**
   * Scrolls to element matched by locator.
   * Extra shift can be set with offsetX and offsetY options
   * Appium: support only web testing
   *
   * ```js
   * I.scrollTo('footer');
   * I.scrollTo('#submit', 5,5);
   * ```
   */
<<<<<<< HEAD
  scrollTo(locator, offsetX = 0, offsetY = 0) {
    const client = this.browser;

=======
  async scrollTo(locator, offsetX = 0, offsetY = 0) {
>>>>>>> refactored webdriverio
    if (typeof locator === 'number' && typeof offsetX === 'number') {
      offsetY = offsetX;
      offsetX = locator;
      locator = null;
    }

    if (locator) {
<<<<<<< HEAD
      return this._locate(withStrictLocator.call(this, locator), true).then(function (res) {
        if (!res.value || res.value.length === 0) {
          return truth(`elements of ${locator}`, 'to be seen').assert(false);
        }
        const elem = res.value[0];
        if (client.isMobile) return this.touchScroll(elem.ELEMENT, offsetX, offsetY);
        return client.elementIdLocation(elem.ELEMENT).then((location) => {
          if (!location.value || location.value.length === 0) {
            throw new ElementNotFound(locator, 'Failed to receive', 'location');
          }
          return client.execute((x, y) => window.scrollTo(x, y), location.value.x + offsetX, location.value.y + offsetY);
        });
      });
    }
    if (client.isMobile) return client.touchScroll(locator, offsetX, offsetY);
    return client.execute((x, y) => window.scrollTo(x, y), offsetX, offsetY);
=======
      let res = await this._locate(withStrictLocator(locator), true);
      if (!res.value || res.value.length === 0) {
        return truth(`elements of ${locator}`, 'to be seen').assert(false);
      }
      let elem = res.value[0];
      if (this.browser.isMobile) return this.browser.touchScroll(elem.ELEMENT, offsetX, offsetY);
      let location = await this.browser.elementIdLocation(elem.ELEMENT);
      assertElementExists(location, "Failed to receive", "location");
      return this.browser.execute(function scroll(x, y) {
        return window.scrollTo(x, y);
      }, location.value.x + offsetX, location.value.y + offsetY);
    }

    if (this.browser.isMobile) return this.browser.touchScroll(locator, offsetX, offsetY);

    return this.browser.execute(function scroll(x, y) { return window.scrollTo(x, y); }, offsetX, offsetY);
>>>>>>> refactored webdriverio
  }

  /**
   * {{> ../webapi/moveCursorTo}}
   * Appium: support only web testing
   */
<<<<<<< HEAD
  moveCursorTo(locator, offsetX = 0, offsetY = 0) {
    const client = this.browser;
    let hasOffsetParams = true;
=======
  async moveCursorTo(locator, offsetX = 0, offsetY = 0) {
    var hasOffsetParams = true;
>>>>>>> refactored webdriverio
    if (typeof offsetX !== 'number' && typeof offsetY !== 'number') {
      hasOffsetParams = false;
    }

<<<<<<< HEAD
    return this._locate(withStrictLocator.call(this, locator), true).then((res) => {
      if (!res.value || res.value.length === 0) {
        return truth(`elements of ${locator}`, 'to be seen').assert(false);
      }
      const elem = res.value[0];
      if (client.isMobile) {
        return client.elementIdSize(elem.ELEMENT).then((size) => {
          if (!size.value || size.value.length === 0) {
            throw new ElementNotFound(locator, 'Failed to receive', 'size');
          }
          return client.elementIdLocation(elem.ELEMENT).then((location) => {
            if (!location.value || location.value.length === 0) {
              throw new ElementNotFound(locator, 'Failed to receive', 'location');
            }
            let x = location.value.x + size.value.width / 2;
            let y = location.value.y + size.value.height / 2;
=======
    let res = await this._locate(withStrictLocator(locator), true);
    assertElementExists(res, locator);
>>>>>>> refactored webdriverio

    let elem = res.value[0];

    if (!this.browser.isMobile) {
      return this.browser.moveTo(elem.ELEMENT, offsetX, offsetY);
    }

    let size = await this.browser.elementIdSize(elem.ELEMENT);
    assertElementExists(size, "Failed to receive", "size");

    let location = await this.browser.elementIdLocation(elem.ELEMENT);
    assertElementExists(size, "Failed to receive", "location");
    var x = location.value.x + size.value.width / 2;
    var y = location.value.y + size.value.height / 2;

    if (hasOffsetParams) {
      x = location.value.x + offsetX;
      y = location.value.y + offsetY;
    }
    return this.browser.touchMove(x, y);
  }

  /**
   * {{> ../webapi/saveScreenshot}}
   * Appium: support
   */
<<<<<<< HEAD
  saveScreenshot(fileName, fullPage = false) {
    const outputFile = path.join(global.output_dir, fileName);
=======
  async saveScreenshot(fileName, fullPage = false) {
    let outputFile = path.join(global.output_dir, fileName);
>>>>>>> refactored webdriverio

    if (!fullPage) {
      this.debug(`Screenshot has been saved to ${outputFile}`);
      return this.browser.saveScreenshot(outputFile);
    }
<<<<<<< HEAD
    return this.browser.execute(() => ({
      height: document.body.scrollHeight,
      width: document.body.scrollWidth,
    })).then(({
      width,
      height,
    }) => {
      this.browser.windowHandleSize(width, height);
      this.debug(`Screenshot has been saved to ${outputFile}`);
      return this.browser.saveScreenshot(outputFile);
=======

    let { width, height} = await this.browser.execute(function () {
      return {
        height: document.body.scrollHeight,
        width: document.body.scrollWidth
      };
>>>>>>> refactored webdriverio
    });

    await this.browser.windowHandleSize(width, height);
    this.debug('Screenshot has been saved to ' + outputFile);
    return this.browser.saveScreenshot(outputFile);
  }


  /**
   * {{> ../webapi/setCookie}}
   * Appium: support only web testing
   *
   * Uses Selenium's JSON [cookie
   * format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).
   */
  async setCookie(cookie) {
    return this.browser.setCookie(cookie);
  }

  /**
   * {{> ../webapi/clearCookie}}
   * Appium: support only web testing
   */
  async clearCookie(cookie) {
    return this.browser.deleteCookie(cookie);
  }

  /**
<<<<<<< HEAD
   * {{> ../webapi/clearField}}
   * Appium: support
   */
  clearField(field) {
    return findFields.call(this, field).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(field, 'Field');
      }
      const elem = res.value[0];
      return this.browser.elementIdClear(elem.ELEMENT);
    });
  }

  /**
   * {{> ../webapi/seeCookie}}
   * Appium: support only web testing
   */
  seeCookie(name) {
    return this.browser.getCookie(name).then(res => truth(`cookie ${name}`, 'to be set').assert(res));
=======
   * {{> ../webapi/seeCookie}}
   * Appium: support only web testing
   */
  async seeCookie(name) {
    let res = await this.browser.getCookie(name);
    return truth('cookie ' + name, 'to be set').assert(res);
>>>>>>> refactored webdriverio
  }

  /**
   * {{> ../webapi/dontSeeCookie}}
   * Appium: support only web testing
   */
<<<<<<< HEAD
  dontSeeCookie(name) {
    return this.browser.getCookie(name).then(res => truth(`cookie ${name}`, 'to be set').negate(res));
=======
  async dontSeeCookie(name) {
    let res = await this.browser.getCookie(name);
    return truth('cookie ' + name, 'to be set').negate(res);
>>>>>>> refactored webdriverio
  }

  /**
   * {{> ../webapi/grabCookie}}
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
   */
<<<<<<< HEAD
  seeInPopup(text) {
    return this.browser.alertText().then((res) => {
=======
  async seeInPopup(text) {
    return this.browser.alertText().then(function (res) {
>>>>>>> refactored webdriverio
      if (res === null) {
        throw new Error('Popup is not opened');
      }
      stringIncludes('text in popup').assert(text, res);
    });
  }

  /**
   * {{> ../webapi/pressKey }}
   *
   * To make combinations with modifier and mouse clicks (like Ctrl+Click) press a modifier, click, then release it.
   * Appium: support, but clear field before pressing in apps
   *
   * ```js
   * I.pressKey('Control');
   * I.click('#someelement');
   * I.pressKey('Control');
   * ```
   */
  async pressKey(key) {
    let modifier;
    if (Array.isArray(key) && ~['Control', 'Command', 'Shift', 'Alt'].indexOf(key[0])) {
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
<<<<<<< HEAD
  resizeWindow(width, height) {
    if (width === 'maximize') {
      return this.browser.execute('return [screen.width, screen.height]').then(res => this.browser.windowHandleSize({
        width: res.value[0],
        height: res.value[1],
      }));
    }
    return this.browser.windowHandleSize({
      width,
      height,
=======
  async resizeWindow(width, height) {
    if (width !== 'maximize') {
      return this.browser.windowHandleSize({ width, height });
    }

    let { screenWidth, screenHeight} = await this.browser.execute(function() {
      return {
        height: screen.height,
        width: screen.width
      };
>>>>>>> refactored webdriverio
    });

    return this.browser.windowHandleSize(screenWidth, screenHeight);
  }

  /**
   * Drag an item to a destination element.
   * Appium: not tested
   *
   * ```js
   * I.dragAndDrop('#dragHandle', '#container');
   * ```
   */
<<<<<<< HEAD
  dragAndDrop(srcElement, destElement) {
    const client = this.browser;
    const this2 = this;


    if (client.isMobile) {
      return client.element(withStrictLocator.call(this, srcElement)).then((res) => {
        if (!res.value || res.value.length === 0) return truth(`elements of ${srcElement}`, 'to be seen').assert(false);
        let elem = res.value;
        return this.elementIdLocation(elem.ELEMENT).then((location) => {
          if (!location.value || location.value.length === 0) {
            throw new Error(`Failed to receive (${srcElement}) location`);
          }
          return this.touchDown(location.value.x, location.value.y).then((res) => {
            if (res.state !== 'success') throw new Error(`Failed to touch button down on (${srcElement})`);
            return client.element(withStrictLocator.call(this, destElement)).then(function (res) {
              if (!res.value || res.value.length === 0) {
                return truth(`elements of ${destElement}`, 'to be seen')
                  .assert(false);
              }
              elem = res.value;
              return this.elementIdLocation(elem.ELEMENT).then(function (location) {
                if (!location.value || location.value.length === 0) {
                  throw new Error(`Failed to receive (${destElement}) location`);
                }
                return this.touchMove(location.value.x, location.value.y).then(function (res) {
                  if (res.state !== 'success') throw new Error(`Failed to touch move to (${destElement})`);
                  return this.touchUp(location.value.x, location.value.y);
                });
              });
            });
          });
        });
      });
    }

    return this2.moveCursorTo(withStrictLocator.call(this, srcElement)).then((res) => {
      if (res.state !== 'success') throw new Error(`Unable to move cursor to (${srcElement})`);
      return this.buttonDown().then((res) => {
        if (res.state !== 'success') throw new Error(`Failed to press button down on (${srcElement})`);
        return this2.moveCursorTo(withStrictLocator.call(this, destElement)).then(function (res) {
          if (res.state !== 'success') throw new Error(`Unable to move cursor to (${destElement})`);
          return this.buttonUp();
        });
      });
    });
=======
  async dragAndDrop(srcElement, destElement) {
    let client = this.browser;

    if (client.isMobile) {
      let res = await this._locate(withStrictLocator(srcElement), true);
      assertElementExists(res, srcElement);
      let elem = res.value[0];

      let location = await this.browser.elementIdLocation(elem.ELEMENT);
      assertElementExists(location, `Failed to receive (${srcElement}) location`);

      res = await this.browser.touchDown(location.value.x, location.value.y);
      if (res.state !== 'success') throw new Error(`Failed to touch button down on (${srcElement})`);

      res = await this._locate(withStrictLocator(destElement), true);
      assertElementExists(res, destElement);
      elem = res.value[0];

      location = await this.browser.elementIdLocation(elem.ELEMENT);
      assertElementExists(location, `Failed to receive (${destElement}) location`);

      res = await this.browser.touchMove(location.value.x, location.value.y);

      if (res.state !== 'success') throw new Error(`Failed to touch move to (${destElement})`);
      return this.browser.touchUp(location.value.x, location.value.y);
    }

    let res = await this.moveCursorTo(withStrictLocator(srcElement));
    if (res.state !== 'success') throw new Error(`Unable to move cursor to (${srcElement})`);
    res = await this.browser.buttonDown();
    if (res.state !== 'success') throw new Error(`Failed to press button down on (${srcElement})`);
    res = await this.moveCursorTo(withStrictLocator(destElement));
    if (res.state !== 'success') throw new Error(`Unable to move cursor to (${destElement})`);
    return this.browser.buttonUp();
>>>>>>> refactored webdriverio
  }


  /**
   * Close all tabs expect for one.
   * Appium: support web test
   *
   * ```js
   * I.closeOtherTabs();
   * ```
   */
<<<<<<< HEAD
  closeOtherTabs() {
    const client = this.browser;
    return client.getTabIds().then((handles) => {
      const mainHandle = handles[0];
      let p = Promise.resolve();
      handles.shift();
      handles.forEach((handle) => {
        p = p.then(() => client.switchTab(handle).then(() => client.close(mainHandle)));
=======
  async closeOtherTabs() {
    let client = this.browser;
    let handles = await this.browser.getTabIds();
    let mainHandle = handles[0];
    let p = Promise.resolve();
    handles.shift();
    handles.forEach((handle) => {
      p = p.then(() => {
        return client.switchTab(handle).then(() => client.close(mainHandle));
>>>>>>> refactored webdriverio
      });
    });
    return p;
  }

  /**
   * {{> ../webapi/wait }}
   * Appium: support
   */
  async wait(sec) {
    return this.browser.pause(sec * 1000);
  }

  /**
   * {{> ../webapi/waitForEnabled }}
   * Appium: support
   */
<<<<<<< HEAD
  waitForEnabled(locator, sec = null) {
    const client = this.browser;
    const aSec = sec || this.options.waitForTimeout;
    return client.waitUntil(() => client.elements(withStrictLocator.call(this, locator)).then((res) => {
      if (!res.value || res.value.length === 0) {
        return false;
      }
      const commands = [];
      res.value.forEach(el => commands.push(client.elementIdEnabled(el.ELEMENT)));
      return client.unify(commands, {
        extractValue: true,
      }).then((selected) => {
        if (Array.isArray(selected)) {
          return selected.filter(val => val === true).length > 0;
=======
  async waitForEnabled(locator, sec = null) {
    let client = this.browser;
    let aSec = sec || this.options.waitForTimeout;
    return client.waitUntil(function () {
      return client.elements(withStrictLocator(locator)).then(function (res) {
        if (!res.value || res.value.length === 0) {
          return false;
>>>>>>> refactored webdriverio
        }
        return selected;
      });
    }), aSec * 1000, `element (${locator}) still not enabled after ${aSec} sec`);
  }

  /**
   * {{> ../webapi/waitForElement }}
   * Appium: support
   */
<<<<<<< HEAD
  waitForElement(locator, sec = null) {
    const client = this.browser;
    const aSec = sec || this.options.waitForTimeout;
    return client.waitUntil(() => client.elements(withStrictLocator.call(this, locator)).then((res) => {
      if (!res.value || res.value.length === 0) {
        return false;
      } return true;
    }), aSec * 1000, `element (${locator}) still not present on page after ${aSec} sec`);
=======
  async waitForElement(locator, sec = null) {
    let client = this.browser;
    let aSec = sec || this.options.waitForTimeout;
    return client.waitUntil(function () {
      return client.elements(withStrictLocator(locator)).then(function (res) {
        if (!res.value || res.value.length === 0) {
          return false;
        } else return true;
      });
    }, aSec * 1000, `element (${locator}) still not present on page after ${aSec} sec`);
>>>>>>> refactored webdriverio
  }

  /**
   * {{> ../webapi/waitUntilExists }}
   * Appium: support
   */
<<<<<<< HEAD
  waitUntilExists(locator, sec = null) {
    const client = this.browser;
    sec = sec || this.options.waitForTimeout;
    return client.waitUntil(() => client.elements(withStrictLocator.call(this, locator)).then((res) => {
      if (!res.value || res.value.length === 0) {
        return true;
      } return false;
    }), sec * 1000, `element (${locator}) still present on page after ${sec} sec`);
=======
  async waitUntilExists(locator, sec = null) {
    let client = this.browser;
    let aSec = sec || this.options.waitForTimeout;
    return client.waitUntil(function () {
      return client.elements(withStrictLocator(locator)).then(function (res) {
        if (!res.value || res.value.length === 0) {
          return true;
        } else return false;
      });
    }, aSec * 1000, `element (${locator}) still present on page after ${sec} sec`);
>>>>>>> refactored webdriverio
  }


  /**
   * Waiting for the part of the URL to match the expected. Useful for SPA to understand that page was changed.
   *
   * ```js
   * I.waitInUrl('/info', 2);
   * ```
   */
<<<<<<< HEAD
  waitInUrl(urlPart, sec = null) {
    const client = this.browser;
    const aSec = sec || this.options.waitForTimeout;
    let currUrl = '';
=======
  async waitInUrl(urlPart, sec = null) {
    let client = this.browser;
    let aSec = sec || this.options.waitForTimeout;
    let currUrl = "";
>>>>>>> refactored webdriverio
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
   * Waits for the entire URL to match the expected
   *
   * ```js
   * I.waitUrlEquals('/info', 2);
   * I.waitUrlEquals('http://127.0.0.1:8000/info');
   * ```
   */
<<<<<<< HEAD
  waitUrlEquals(urlPart, sec = null) {
    const client = this.browser;
    const aSec = sec || this.options.waitForTimeout;
    const baseUrl = this.options.url;
=======
  async waitUrlEquals(urlPart, sec = null) {
    let client = this.browser;
    let aSec = sec || this.options.waitForTimeout;
    let baseUrl = this.options.url;
>>>>>>> refactored webdriverio
    if (urlPart.indexOf('http') < 0) {
      urlPart = baseUrl + urlPart;
    }
    let currUrl = '';
    return client
      .waitUntil(function () {
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
   * {{> ../webapi/waitForText }}
   * Appium: support
   */
<<<<<<< HEAD
  waitForText(text, sec = null, aContext = null) {
    const client = this.browser;
    const aSec = sec || this.options.waitForTimeout;
    const context = aContext || this.root;
    return client.waitUntil(
      () => client.elements(withStrictLocator.call(this, context)).then((res) => {
=======
  async waitForText(text, sec = null, aContext = null) {
    let client = this.browser;
    let aSec = sec || this.options.waitForTimeout;
    let context = aContext || this.root;
    return client.waitUntil(function () {
      return client.elements(withStrictLocator(context)).then(function (res) {
>>>>>>> refactored webdriverio
        if (!res.value || res.value.length === 0) {
          return false;
        }
        const commands = [];
        res.value.forEach(el => commands.push(client.elementIdText(el.ELEMENT)));
        return client.unify(commands, {
          extractValue: true,
        }).then((selected) => {
          if (Array.isArray(selected)) {
            return selected.filter(part => part.indexOf(text) >= 0).length > 0;
          }
          return selected.indexOf(text) >= 0;
        });
      }), aSec * 1000,
      `element (${context}) is not in DOM or there is no element(${context}) with text "${text}" after ${aSec} sec`,
    );
  }

  /**
   * Waits for the specified value to be in value attribute
   *
   * ```js
   * I.waitForValue('//input', "GoodValue");
   * ```
   *
   * @param field input field
   * @param value expected value
   * @param sec seconds to wait, 1 sec by default
   */
<<<<<<< HEAD
  waitForValue(field, value, sec = null) {
    const client = this.browser;
    const aSec = sec || this.options.waitForTimeout;
    return client.waitUntil(
      () => findFields.call(this, field).then((res) => {
=======
  async waitForValue(field, value, sec = null) {
    let client = this.browser;
    let aSec = sec || this.options.waitForTimeout;
    return client.waitUntil(() => {
      return findFields.call(this, field).then((res) => {
>>>>>>> refactored webdriverio
        if (!res.value || res.value.length === 0) {
          return false;
        }
        const commands = [];
        res.value.forEach(el => commands.push(this.browser.elementIdAttribute(el.ELEMENT, 'value')));
        return this.browser.unify(commands, {
          extractValue: true,
        }).then((selected) => {
          if (Array.isArray(selected)) {
            return selected.filter(part => part.indexOf(value) >= 0).length > 0;
          }
          return selected.indexOf(value) >= 0;
        });
      }), aSec * 1000,
      `element (${field}) is not in DOM or there is no element(${field}) with value "${value}" after ${aSec} sec`,
    );
  }

  /**
   * {{> ../webapi/waitForVisible }}
   * Appium: support
   */
<<<<<<< HEAD
  waitForVisible(locator, sec = null) {
    const client = this.browser;
    const aSec = sec || this.options.waitForTimeout;
    return client.waitUntil(() => client.elements(withStrictLocator.call(this, locator)).then((res) => {
      if (!res.value || res.value.length === 0) {
        return false;
      }
      const commands = [];
      res.value.forEach(el => commands.push(client.elementIdDisplayed(el.ELEMENT)));
      return client.unify(commands, {
        extractValue: true,
      }).then((selected) => {
        if (Array.isArray(selected)) {
          return selected.filter(val => val === true).length > 0;
=======
  async waitForVisible(locator, sec = null) {
    let client = this.browser;
    let aSec = sec || this.options.waitForTimeout;
    return client.waitUntil(function () {
      return client.elements(withStrictLocator(locator)).then(function (res) {
        if (!res.value || res.value.length === 0) {
          return false;
>>>>>>> refactored webdriverio
        }
        return selected;
      });
    }), aSec * 1000, `element (${locator}) still not visible after ${aSec} sec`);
  }

  /**
   * Waits for a specified number of elements on the page
   *
   * ```js
   * I.waitNumberOfVisibleElements('a', 3);
   * ```
   */
<<<<<<< HEAD
  waitNumberOfVisibleElements(locator, num, sec = null) {
    const client = this.browser;
    const aSec = sec || this.options.waitForTimeout;
    return client.waitUntil(() => client.elements(withStrictLocator.call(this, locator)).then(function (res) {
      if (!res.value || res.value.length === 0) {
        return false;
      }
      const commands = [];
      res.value.forEach(el => commands.push(this.elementIdDisplayed(el.ELEMENT)));
      return this.unify(commands, {
        extractValue: true,
      }).then((selected) => {
        if (!Array.isArray(selected)) selected = [selected];
        return selected.length === num;
=======
  async waitNumberOfVisibleElements(locator, num, sec = null) {
    let client = this.browser;
    let aSec = sec || this.options.waitForTimeout;
    return client.waitUntil(function () {
      return client.elements(withStrictLocator(locator)).then(function (res) {
        if (!res.value || res.value.length === 0) {
          return false;
        }
        let commands = [];
        res.value.forEach((el) => commands.push(this.elementIdDisplayed(el.ELEMENT)));
        return this.unify(commands, {
          extractValue: true
        }).then((selected) => {
          if (!Array.isArray(selected)) selected = [selected];
          return selected.length === num;
        });
>>>>>>> refactored webdriverio
      });
    }), aSec * 1000, `The number of elements ${locator} is not ${num} after ${aSec} sec`);
  }

  /**
   * {{> ../webapi/waitForInvisible }}
   * Appium: support
   */
<<<<<<< HEAD
  waitForInvisible(locator, sec = null) {
    const client = this.browser;
    const aSec = sec || this.options.waitForTimeout;
    return client.waitUntil(() => client.elements(withStrictLocator.call(this, locator)).then((res) => {
      if (!res.value || res.value.length === 0) {
        return true;
      }
      const commands = [];
      res.value.forEach(el => commands.push(client.elementIdDisplayed(el.ELEMENT)));
      return client.unify(commands, {
        extractValue: true,
      }).then((selected) => {
        if (Array.isArray(selected)) {
          return selected.filter(val => val === false).length > 0;
=======
  async waitForInvisible(locator, sec = null) {
    let client = this.browser;
    let aSec = sec || this.options.waitForTimeout;
    return client.waitUntil(function () {
      return client.elements(withStrictLocator(locator)).then(function (res) {
        if (!res.value || res.value.length === 0) {
          return true;
>>>>>>> refactored webdriverio
        }
        return !selected;
      });
    }), aSec * 1000, `element (${locator}) still visible after ${aSec}sec`);
  }

  /**
   * Waits for an element to become invisible on a page (by default waits for 1sec).
   * Element can be located by CSS or XPath.
   * Appium: support
   */
  async waitToHide(locator, sec = null) {
    return this.waitForInvisible(locator, sec);
  }

  /**
   * {{> ../webapi/waitForStalenessOf }}
   * Appium: support
   */
<<<<<<< HEAD
  waitForStalenessOf(locator, sec = null) {
    const client = this.browser;
    const aSec = sec || this.options.waitForTimeout;
    return client.waitUntil(() => client.elements(withStrictLocator.call(this, locator)).then((res) => {
      if (!res.value || res.value.length === 0) {
        return true;
      } return false;
    }), aSec * 1000, `element (${locator}) still attached to the DOM after ${aSec} sec`);
=======
  async waitForStalenessOf(locator, sec = null) {
    let client = this.browser;
    let aSec = sec || this.options.waitForTimeout;
    return client.waitUntil(function () {
      return client.elements(withStrictLocator(locator)).then(function (res) {
        if (!res.value || res.value.length === 0) {
          return true;
        } else return false;
      });
    }, aSec * 1000, `element (${locator}) still attached to the DOM after ${aSec} sec`);
>>>>>>> refactored webdriverio
  }

  /**
   * Waits for a function to return true (waits for 1sec by default).
   * Appium: support
   */
<<<<<<< HEAD
  waitUntil(fn, sec = null, timeoutMsg = null) {
    const aSec = sec || this.options.waitForTimeout;
=======
  async waitUntil(fn, sec = null, timeoutMsg = null) {
    let aSec = sec || this.options.waitForTimeout;
>>>>>>> refactored webdriverio
    return this.browser.waitUntil(fn, aSec, timeoutMsg);
  }

  /**
   * Switches frame or in case of null locator reverts to parent.
   * Appium: support only web testing
   */
  async switchTo(locator) {
    if (!locator) {
      return this.browser.frame(null);
    } else if (Number.isInteger(locator)) {
      return this.browser.frame(locator);
    }
<<<<<<< HEAD
    return this.browser.element(withStrictLocator.call(this, locator)).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(locator);
      }
      return this.browser.frame(res.value);
    });
=======
    let res = await this._locate(withStrictLocator(locator), true);
    assertElementExists(res, locator);
    return this.browser.frame(res.value[0]);
>>>>>>> refactored webdriverio
  }

  /**
   * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab
   *
   * ```js
   * I.switchToNextTab();
   * I.switchToNextTab(2);
   * ```
   */
<<<<<<< HEAD
  switchToNextTab(num = 1, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    const client = this.browser;
=======
  async switchToNextTab(num = 1, sec = null) {
    let aSec = sec || this.options.waitForTimeout;
    let client = this.browser;
>>>>>>> refactored webdriverio
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
   * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab
   *
   * ```js
   * I.switchToPreviousTab();
   * I.switchToPreviousTab(2);
   * ```
   */
<<<<<<< HEAD
  switchToPreviousTab(num = 1, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    const client = this.browser;
=======
  async switchToPreviousTab(num = 1, sec = null) {
    let aSec = sec || this.options.waitForTimeout;
    let client = this.browser;
>>>>>>> refactored webdriverio
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
   * Close current tab
   *
   * ```js
   * I.closeCurrentTab();
   * ```
   */
<<<<<<< HEAD
  closeCurrentTab() {
    const client = this.browser;
=======
  async closeCurrentTab() {
    let client = this.browser;
>>>>>>> refactored webdriverio
    return client.close();
  }

  /**
   * Open new tab and switch to it
   *
   * ```js
   * I.openNewTab();
   * ```
   */
<<<<<<< HEAD
  openNewTab() {
    const client = this.browser;
=======
  async openNewTab() {
    let client = this.browser;
>>>>>>> refactored webdriverio
    return client.newWindow('about:blank');
  }

  /**
   * Refresh the current page.
   *
   * ```js
   * I.refreshPage();
   * ```
   */
<<<<<<< HEAD
  refreshPage() {
    const client = this.browser;
=======
  async refreshPage() {
    let client = this.browser;
>>>>>>> refactored webdriverio
    return client.refresh();
  }

  /**
   * Scroll page to the top
   *
   * ```js
   * I.scrollPageToTop();
   * ```
   */
  scrollPageToTop() {
    const client = this.browser;
    return client.execute(() => {
      window.scrollTo(0, 0);
    });
  }

  /**
   * Scroll page to the bottom
   *
   * ```js
   * I.scrollPageToBottom();
   * ```
   */
  scrollPageToBottom() {
    const client = this.browser;
    return client.execute(() => {
      let body = document.body,
        html = document.documentElement;
      window.scrollTo(0, Math.max(
        body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight,
      ));
    });
  }
}

async function proceedSee(assertType, text, context, strict = false) {
  let description, res;
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

<<<<<<< HEAD
  return this._locate(withStrictLocator.call(this, context), smartWaitEnabled).then((res) => {
    if (!res.value || res.value.length === 0) {
      throw new ElementNotFound(context);
    }
    const commands = [];
    res.value.forEach(el => commands.push(this.browser.elementIdText(el.ELEMENT)));
    return this.browser.unify(commands, {
      extractValue: true,
    }).then((selected) => {
      if (strict) return equals(description)[assertType](text, selected);
      return stringIncludes(description)[assertType](text, selected);
    });
  });
}

function findClickable(locator, locateFn) {
  if (typeof locator === 'object' || locator[0] === '~') return locateFn(withStrictLocator.call(this, locator), true);
  if (isCSSorXPathLocator(locator)) return locateFn(locator, true);

  const literal = xpathLocator.literal(locator);

  const narrowLocator = xpathLocator.combine([
    `.//a[normalize-space(.)=${literal}]`,
    `.//button[normalize-space(.)=${literal}]`,
    `.//a/img[normalize-space(@alt)=${literal}]/ancestor::a`,
    `.//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][normalize-space(@value)=${literal}]`,
  ]);
  return locateFn(narrowLocator).then((els) => {
    if (els.value.length) {
      return els;
    }
    const wideLocator = xpathLocator.combine([
      `.//a[./@href][((contains(normalize-space(string(.)), ${literal})) or .//img[contains(./@alt, ${literal})])]`,
      `.//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][contains(./@value, ${literal})]`,
      `.//input[./@type = 'image'][contains(./@alt, ${literal})]`,
      `.//button[contains(normalize-space(string(.)), ${literal})]`,
      `.//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][./@name = ${literal}]`,
      `.//button[./@name = ${literal}]`,
    ]);
    return locateFn(wideLocator).then((els) => {
      if (els.value.length) {
        return els;
      }
      const selfLocator = xpathLocator.combine([
        `./self::*[contains(normalize-space(string(.)), ${literal}) or contains(normalize-space(@value), ${literal})]`,
      ]);
      return locateFn(selfLocator).then((els) => {
        if (els.value.length) {
          return els;
        }
        return locateFn(locator); // by css or xpath
      });
    });
  });
=======
  res = await this._locate(withStrictLocator(context), smartWaitEnabled);
  if (!res.value || res.value.length === 0) throw new ElementNotFound(context);

  let commands = [];
  res.value.forEach((el) => commands.push(this.browser.elementIdText(el.ELEMENT)));

  let selected = await this.browser.unify(commands, { extractValue: true });

  if (strict) return equals(description)[assertType](text, selected);
  return stringIncludes(description)[assertType](text, selected);
}

async function findClickable(locator, locateFn) {
  locator = new Locator(locator);
  if (!locator.isFuzzy()) return locateFn(locator.simplify(), true);

  let els;
  let literal = xpathLocator.literal(locator.value);

  els = await locateFn(Locator.clickable.narrow(literal));
  if (els.value.length) return els;

  els = await locateFn(Locator.clickable.wide(literal));
  if (els.value.length) return els;

  els = await locateFn(Locator.clickable.self(literal));
  if (els.value.length) return els;

  return locateFn(locator.value); // by css or xpath
>>>>>>> refactored webdriverio
}

function toStrictLocator(locator) {
  if (locator[0] == '#') return;
}

<<<<<<< HEAD
function findFields(locator) {
  if (typeof locator === 'object' || locator[0] === '~') return this._locate(withStrictLocator.call(this, locator), true);
  if (isCSSorXPathLocator(locator)) return this._locate(locator, true);

  const literal = xpathLocator.literal(locator);
  const byText = xpathLocator.combine([
    `.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')][(((./@name = ${literal}) or ./@id = //label[contains(normalize-space(string(.)), ${literal})]/@for) or ./@placeholder = ${literal})]`,
    `.//label[contains(normalize-space(string(.)), ${literal})]//.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')]`,
  ]);
  return this._locate(byText).then((els) => {
    if (els.value.length) return els;
    const byName = `.//*[self::input | self::textarea | self::select][@name = ${literal}]`;
    return this._locate(byName).then((els) => {
      if (els.value.length) return els;
      return this._locate(locator); // by css or xpath
    });
  });
}

function proceedSeeField(assertType, field, value) {
  return findFields.call(this, field).then((res) => {
    if (!res.value || res.value.length === 0) {
      throw new ElementNotFound(field, 'Field');
    }

    const proceedMultiple = (fields) => {
      let commands = [];
      fields.forEach(el => commands.push(this.browser.elementIdSelected(el.ELEMENT)));
      this.browser.unify(commands).then(() => {
        commands = [];
        fields.forEach((el) => {
          if (el.value === false) return;
          commands.push(this.browser.elementIdAttribute(el.ELEMENT, 'value'));
        });
        this.browser.unify(commands, {
          extractValue: true,
        }).then(val => stringIncludes(`fields by ${field}`)[assertType](value, val));
      });
    };

    const proceedSingle = el => this.browser.elementIdAttribute(el.ELEMENT, 'value').then(res => stringIncludes(`fields by ${field}`)[assertType](value, res.value));
=======
async function findFields(locator) {
  locator = new Locator(locator);
  if (!locator.isFuzzy()) return this._locate(locator.simplify(), true);

  let literal = xpathLocator.literal(locator.value);
  let els = await this._locate(Locator.field.byText(literal));
  if (els.value.length) return els;

  els = await this._locate(Locator.field.byName(literal));
  if (els.value.length) return els;
  return this._locate(locator.value); // by css or xpath
}

async function proceedSeeField(assertType, field, value) {
  let res = await findFields.call(this, field);
  assertElementExists(res, field, "Field");

  var proceedMultiple = (fields) => {
    let commands = [];
    fields.forEach((el) => commands.push(this.browser.elementIdSelected(el.ELEMENT)));
    this.browser.unify(commands).then(() => {
      commands = [];
      fields.forEach((el) => {
        if (el.value === false) return;
        commands.push(this.browser.elementIdAttribute(el.ELEMENT, 'value'));
      });
      return this.browser.unify(commands, {
        extractValue: true
      }).then((val) => {
        return stringIncludes('fields by ' + field)[assertType](value, val);
      });
    });
  };
>>>>>>> refactored webdriverio

  var proceedSingle = (el) => {
    return this.browser.elementIdAttribute(el.ELEMENT, 'value').then((res) => {
      return stringIncludes('fields by ' + field)[assertType](value, res.value);
    });
  };

  let tag = await this.browser.elementIdName(res.value[0].ELEMENT);
  if (tag.value === 'select') {
    return proceedMultiple(res.value);
  }

  if (tag.value === 'input') {
    return this.browser.elementIdAttribute(res.value[0].ELEMENT, 'type').then((type) => {
      if (type.value === 'checkbox' || type.value === 'radio') {
        return proceedMultiple(res.value);
      }
      return proceedSingle(res.value[0]);
    });
  }
  return proceedSingle(res.value[0]);
}

<<<<<<< HEAD
function proceedSeeCheckbox(assertType, field) {
  return findFields.call(this, field).then((res) => {
    if (!res.value || res.value.length === 0) {
      throw new ElementNotFound(field, 'Field');
    }
    const commands = [];
    res.value.forEach(el => commands.push(this.browser.elementIdSelected(el.ELEMENT)));
    return this.browser.unify(commands, {
      extractValue: true,
    }).then(selected => truth(`checkable field ${field}`, 'to be checked')[assertType](selected));
  });
}

function findCheckable(locator, locateFn) {
  if (typeof locator === 'object' || locator[0] === '~') return locateFn(withStrictLocator.call(this, locator), true);
  if (isCSSorXPathLocator(locator)) return locateFn(locator, true);

  const literal = xpathLocator.literal(locator);
  const byText = xpathLocator.combine([
    `.//input[@type = 'checkbox' or @type = 'radio'][(@id = //label[contains(normalize-space(string(.)), ${literal})]/@for) or @placeholder = ${literal}]`,
    `.//label[contains(normalize-space(string(.)), ${literal})]//input[@type = 'radio' or @type = 'checkbox']`,
  ]);
  return locateFn(byText).then((els) => {
    if (els.value.length) return els;
    const byName = `.//input[@type = 'checkbox' or @type = 'radio'][@name = ${literal}]`;
    return locateFn(byName).then((els) => {
      if (els.value.length) return els;
      return locateFn(locator); // by css or xpath
    });
  });
=======
async function proceedSeeCheckbox(assertType, field) {
  let res = await findFields.call(this, field);
  assertElementExists(res, field, "Field");

  let commands = [];
  res.value.forEach((el) => commands.push(this.browser.elementIdSelected(el.ELEMENT)));
  let selected = await this.browser.unify(commands, { extractValue: true });
  return truth(`checkable field ${field}`, 'to be checked')[assertType](selected);
>>>>>>> refactored webdriverio
}

async function findCheckable(locator, locateFn) {
  let els;
  locator = new Locator(locator);
  if (!locator.isFuzzy()) return locateFn(locator.simplify(), true);

  let literal = xpathLocator.literal(locator.value);
  els = await locateFn(Locator.checkable.byText(literal));
  if (els.value.length) return els;
  els = await locateFn(Locator.checkable.byName(literal))
  if (els.value.length) return els;

  return locateFn(locator.value); // by css or xpath
}

function withStrictLocator(locator) {
<<<<<<< HEAD
  if (!locator) return null;
  if (typeof locator === 'string') {
    if (locator[0] === '~') {
      if (this.isWeb || this.isWeb === undefined) {
        // hook before webdriverio supports native ~ locators in web
        return `[aria-label="${locator.slice(1)}"]`;
      }
      return `accessibility id:${locator.slice(1)}`;
    }
  }

  if (typeof locator !== 'object') return locator;
  const key = Object.keys(locator)[0];
  const value = locator[key];

  locator.toString = () => `{${key}: '${value}'}`;

  switch (key) {
    case 'by':
    case 'xpath':
      return value;
    case 'css':
      return value;
    case 'id':
      return `#${value}`;
    case 'name':
      return `[name="${value}"]`;
  }
}

function isFrameLocator(locator) {
  if (typeof locator !== 'object') return false;
  const key = Object.keys(locator)[0];
  if (key !== 'frame') return false;
  return locator[key];
=======
  return (new Locator(locator)).simplify();
}

function isFrameLocator(locator) {
  locator = new Locator(locator);
  if (locator.isFrame()) return locator.value;
  return false;
}

function assertElementExists(res, locator, prefix, suffix) {
  if (!res.value || res.value.length === 0) {
    throw new ElementNotFound(locator, prefix, suffix);
  }
>>>>>>> refactored webdriverio
}

function prepareLocateFn(context) {
  if (!context) return this._locate.bind(this);
  let el;
  return (l) => {
    if (el) return this.browser.elementIdElements(el, l);
    return this._locate(context, true).then((res) => {
<<<<<<< HEAD
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(context, 'Context element');
      }
=======
      assertElementExists(res, context, "Context element");
>>>>>>> refactored webdriverio
      return this.browser.elementIdElements(el = res.value[0].ELEMENT, l);
    });
  };
}

module.exports = WebDriverIO;
