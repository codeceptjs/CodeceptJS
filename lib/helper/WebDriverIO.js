let webdriverio;
const requireg = require('requireg');
const Helper = require('../helper');
const stringIncludes = require('../assert/include').includes;
const { urlEquals, equals } = require('../assert/equal');
const empty = require('../assert/empty').empty;
const truth = require('../assert/truth').truth;
const {
  xpathLocator, fileExists, clearString, decodeUrl, chunkArray,
} = require('../utils');
const ElementNotFound = require('./errors/ElementNotFound');
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
 *            "args": [ "--headless", "--disable-gpu", "--window-size=800,600" ]
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
      deprecationWarnings: false,
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
    await this.browser;
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
    if (!this.options.restart && this.isRunning) return this.browser.end();
  }

  async _failed(test) {
    if (Object.keys(withinStore).length !== 0) await this._withinEnd();
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
            err.type === 'RuntimeError' &&
            err.message &&
            (err.message.indexOf('was terminated due to') > -1 || err.message.indexOf('no such window: target window already closed') > -1)
        ) {
          this.isRunning = false;
        }
      });
    }
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
   * Get elements by different locator types, including strict locator
   * Should be used in custom helpers:
   *
   * ```js
   * this.helpers['WebDriverIO']._locate({name: 'password'}).then //...
   * ```
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
   */
  async _locateFields(locator) {
    return findFields.call(this, locator).then(res => res.value);
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
  async defineTimeout(timeouts) {
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
   * {{> ../webapi/doubleClick }}
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

    const res = await this._locate(locator, true);
    assertElementExists(res, locator, 'Clickable element');
    const elem = res.value[0];
    if (this.browser.isMobile) return this.browser.touchClick(elem.ELEMENT);
    return this.browser.moveTo(elem.ELEMENT).buttonPress('right');
  }

  /**
   * {{> ../webapi/fillField }}
   * Appium: support
   */
  async fillField(field, value) {
    const res = await findFields.call(this, field);
    assertElementExists(res, field, 'Field');
    const elem = res.value[0];
    return this.browser.elementIdClear(elem.ELEMENT).elementIdValue(elem.ELEMENT, value);
  }

  /**
   * {{> ../webapi/appendField }}
   * Appium: support, but it's clear a field before insert in apps
   */
  async appendField(field, value) {
    const res = await findFields.call(this, field);
    assertElementExists(res, field, 'Field');
    const elem = res.value[0];
    return this.browser.elementIdValue(elem.ELEMENT, value);
  }


  /**
   * {{> ../webapi/clearField}}
   * Appium: support
   */
  async clearField(field) {
    const res = await findFields.call(this, field);
    assertElementExists(res, field, 'Field');
    const elem = res.value[0];
    return this.browser.elementIdClear(elem.ELEMENT);
  }


  /**
   * {{> ../webapi/selectOption}}
   */
  async selectOption(select, option) {
    const res = await findFields.call(this, select);
    assertElementExists(res, select, 'Selectable field');
    const elem = res.value[0];
    let commands = [];

    if (!Array.isArray(option)) {
      option = [option];
    }

    // select options by visible text
    option.forEach(opt => commands.push(this.browser.elementIdElements(elem.ELEMENT, Locator.select.byVisibleText(xpathLocator.literal(opt)))));
    let els = await this.browser.unify(commands, { extractValue: true });
    commands = [];
    const clickOptionFn = (el) => {
      if (el[0]) el = el[0];
      if (el && el.ELEMENT) commands.push(this.browser.elementIdClick(el.ELEMENT));
    };

    if (els.length) {
      els.forEach(clickOptionFn);
      return this.browser.unify(commands);
    }
    // select options by value
    option.forEach(opt => commands.push(this.browser.elementIdElements(elem.ELEMENT, Locator.select.byValue(xpathLocator.literal(opt)))));
    els = await this.browser.unify(commands, { extractValue: true });
    if (els.length === 0) {
      throw new ElementNotFound(select, `Option ${option} in`, 'was found neither by visible text not by value');
    }
    commands = [];
    els.forEach(clickOptionFn);
    return this.browser.unify(commands);
  }

  /**
   * {{> ../webapi/attachFile }}
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
   * {{> ../webapi/checkOption }}
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
   * {{> ../webapi/grabTextFrom }}
   * Appium: support
   */
  async grabTextFrom(locator) {
    const res = await this._locate(locator, true);
    assertElementExists(res, locator);

    const commands = [];
    res.value.forEach(el => commands.push(this.browser.elementIdText(el.ELEMENT)));
    return this.browser.unify(commands, {
      extractValue: true,
    }).then(selected => selected);
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
  async grabHTMLFrom(locator) {
    return this.browser.getHTML(withStrictLocator.call(this, locator)).then(html => html);
  }

  /**
   * {{> ../webapi/grabValueFrom }}
   * Appium: support only web testing
   */
  async grabValueFrom(locator) {
    const res = await this._locate(locator, true);
    assertElementExists(res, locator);

    const commands = [];
    res.value.forEach(el => commands.push(this.browser.elementIdAttribute(el.ELEMENT, 'value')));
    return this.browser.unify(commands, {
      extractValue: true,
    }).then(selected => selected);
  }

  /**
   * Grab CSS property for given locator
   *
   * ```js
   * I.grabCssPropertyFrom('h3', 'font-weight');
   * ```
   */
  async grabCssPropertyFrom(locator, cssProperty) {
    const res = await this._locate(locator, true);
    assertElementExists(res, locator);

    const commands = [];
    res.value.forEach(el => commands.push(this.browser.elementIdCssProperty(el.ELEMENT, cssProperty)));
    return this.browser.unify(commands, {
      extractValue: true,
    }).then(selected => selected);
  }

  /**
   * {{> ../webapi/grabAttributeFrom }}
   * Appium: can be used for apps only with several values ("contentDescription", "text", "className", "resourceId")
   */
  async grabAttributeFrom(locator, attr) {
    const res = await this._locate(locator, true);
    assertElementExists(res, locator);
    const commands = [];
    res.value.forEach(el => commands.push(this.browser.elementIdAttribute(el.ELEMENT, attr)));
    return this.browser.unify(commands, {
      extractValue: true,
    }).then(selected => selected);
  }

  /**
   * {{> ../webapi/seeInTitle }}
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
   */
  async seeTitleEquals(text) {
    const title = await this.browser.getTitle();
    return assert.equal(title, text, `expected web page title to be ${text}, but found ${title}`);
  }

  /**
   * {{> ../webapi/dontSeeInTitle }}
   * Appium: support only web testing
   */
  async dontSeeInTitle(text) {
    const title = await this.browser.getTitle();
    return stringIncludes('web page title').negate(text, title);
  }

  /**
   * {{> ../webapi/grabTitle }}
   * Appium: support only web testing
   */
  async grabTitle() {
    const title = await this.browser.getTitle();
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
  async seeElement(locator) {
    const res = await this._locate(locator, true);
    if (!res.value || res.value.length === 0) {
      return truth(`elements of ${locator}`, 'to be seen').assert(false);
    }
    const commands = [];
    res.value.forEach(el => commands.push(this.browser.elementIdDisplayed(el.ELEMENT)));
    const selected = await this.browser.unify(commands, { extractValue: true });
    return truth(`elements of ${locator}`, 'to be seen').assert(selected);
  }

  /**
   * {{> ../webapi/dontSeeElement}}
   * Appium: support
   */
  async dontSeeElement(locator) {
    const res = await this._locate(locator, false);
    if (!res.value || res.value.length === 0) {
      return truth(`elements of ${locator}`, 'to be seen').negate(false);
    }
    const commands = [];
    res.value.forEach(el => commands.push(this.browser.elementIdDisplayed(el.ELEMENT)));
    const selected = await this.browser.unify(commands, { extractValue: true });
    return truth(`elements of ${locator}`, 'to be seen').negate(selected);
  }

  /**
   * {{> ../webapi/seeElementInDOM }}
   * Appium: support
   */
  async seeElementInDOM(locator) {
    const res = await this.browser.elements(withStrictLocator.call(this, locator));
    return empty('elements').negate(res.value);
  }

  /**
   * {{> ../webapi/dontSeeElementInDOM }}
   * Appium: support
   */
  async dontSeeElementInDOM(locator) {
    const res = await this.browser.elements(withStrictLocator.call(this, locator));
    return empty('elements').assert(res.value);
  }

  /**
   * {{> ../webapi/seeInSource }}
   * Appium: support
   */
  async seeInSource(text) {
    const source = await this.browser.getSource();
    return stringIncludes('HTML source of a page').assert(text, source);
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
  async grabBrowserLogs() {
    return this.browser.log('browser').then(res => res.value);
  }

  /**
   * {{> ../webapi/dontSeeInSource }}
   * Appium: support
   */
  async dontSeeInSource(text) {
    const source = await this.browser.getSource();
    return stringIncludes('HTML source of a page').negate(text, source);
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
  async seeNumberOfElements(selector, num) {
    const res = await this._locate(withStrictLocator.call(this, selector));
    return assert.equal(res.value.length, num, `expected number of elements (${selector}) is ${num}, but found ${res.value.length}`);
  }

  /**
   * asserts that an element is visible a given number of times
   * Element is located by CSS or XPath.
   *
   * ```js
   * I.seeNumberOfVisibleElements('.buttons', 3);
   * ```
   */
  async seeNumberOfVisibleElements(locator, num) {
    const res = await this.grabNumberOfVisibleElements(locator);
    return assert.equal(res, num, `expected number of visible elements (${locator}) is ${num}, but found ${res}`);
  }

  /**
   * Checks that all elements with given locator have given CSS properties.
   *
   * ```js
   * I.seeCssPropertiesOnElements('h3', { 'font-weight': "bold"});
   * ```
   */
  async seeCssPropertiesOnElements(locator, cssProperties) {
    const res = await this._locate(locator);
    assertElementExists(res, locator);
    const elemAmount = res.value.length;
    const commands = [];
    res.value.forEach((el) => {
      Object.keys(cssProperties).forEach((prop) => {
        commands.push(this.browser.elementIdCssProperty(el.ELEMENT, prop));
      });
    });
    let props = await this.browser.unify(commands, { extractValue: true });
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
  }

  /**
   * Checks that all elements with given locator have given attributes.
   *
   * ```js
   * I.seeAttributesOnElements('//form', {'method': "post"});
   * ```
   */
  async seeAttributesOnElements(locator, attributes) {
    const res = await this._locate(locator);
    assertElementExists(res, locator);
    const elemAmount = res.value.length;
    const commands = [];
    res.value.forEach((el) => {
      Object.keys(attributes).forEach((attr) => {
        commands.push(this.browser.elementIdAttribute(el.ELEMENT, attr));
      });
    });
    let attrs = await this.browser.unify(commands, { extractValue: true });
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
  }

  /**
   * Grab number of visible elements by locator
   *
   * ```js
   * I.grabNumberOfVisibleElements('p');
   * ```
   */
  async grabNumberOfVisibleElements(locator) {
    const res = await this._locate(locator);
    assertElementExists(res, locator);

    const commands = [];
    res.value.forEach(el => commands.push(this.browser.elementIdDisplayed(el.ELEMENT)));
    let selected = await this.browser.unify(commands, { extractValue: true });
    if (!Array.isArray(selected)) selected = [selected];
    selected = selected.filter(val => val === true);
    return selected.length;
  }

  /**
   * {{> ../webapi/seeInCurrentUrl }}
   * Appium: support only web testing
   */
  async seeInCurrentUrl(url) {
    const res = await this.browser.url();
    return stringIncludes('url').assert(url, decodeUrl(res.value));
  }

  /**
   * {{> ../webapi/dontSeeInCurrentUrl }}
   * Appium: support only web testing
   */
  async dontSeeInCurrentUrl(url) {
    const res = await this.browser.url();
    return stringIncludes('url').negate(url, decodeUrl(res.value));
  }

  /**
   * {{> ../webapi/seeCurrentUrlEquals }}
   * Appium: support only web testing
   */
  async seeCurrentUrlEquals(url) {
    const res = await this.browser.url();
    return urlEquals(this.options.url).assert(url, decodeUrl(res.value));
  }

  /**
   * {{> ../webapi/dontSeeCurrentUrlEquals }}
   * Appium: support only web testing
   */
  async dontSeeCurrentUrlEquals(url) {
    const res = await this.browser.url();
    return urlEquals(this.options.url).negate(url, decodeUrl(res.value));
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
      return this.browser.execute((x, y) => window.scrollTo(x, y), location.value.x + offsetX, location.value.y + offsetY);
    }

    if (this.browser.isMobile) return this.browser.touchScroll(locator, offsetX, offsetY);

    return this.browser.execute((x, y) => window.scrollTo(x, y), offsetX, offsetY);
  }

  /**
   * {{> ../webapi/moveCursorTo}}
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
   * {{> ../webapi/saveScreenshot}}
   * Appium: support
   */
  async saveScreenshot(fileName, fullPage = false) {
    const outputFile = path.join(global.output_dir, fileName);

    if (!fullPage) {
      this.debug(`Screenshot has been saved to ${outputFile}`);
      return this.browser.saveScreenshot(outputFile);
    }

    const { width, height } = await this.browser.execute(() => ({
      height: document.body.scrollHeight,
      width: document.body.scrollWidth,
    }));

    await this.browser.windowHandleSize(width, height);
    this.debug(`Screenshot has been saved to ${outputFile}`);
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
   * {{> ../webapi/seeCookie}}
   * Appium: support only web testing
   */
  async seeCookie(name) {
    const res = await this.browser.getCookie(name);
    return truth(`cookie ${name}`, 'to be set').assert(res);
  }

  /**
   * {{> ../webapi/dontSeeCookie}}
   * Appium: support only web testing
   */
  async dontSeeCookie(name) {
    const res = await this.browser.getCookie(name);
    return truth(`cookie ${name}`, 'to be set').negate(res);
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
  async seeInPopup(text) {
    return this.browser.alertText().then((res) => {
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
   * Appium: support, but clear field before pressing in apps:
   *
   * ```js
   * I.pressKey('Control');
   * I.click('#someelement');
   * I.pressKey('Control');
   * ```
   *
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
    if (width !== 'maximize') {
      return this.browser.windowHandleSize({ width, height });
    }

    const { screenWidth, screenHeight } = await this.browser.execute(() => ({
      height: window.screen.height,
      width: window.screen.width,
    }));

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

    let res = await this.moveCursorTo(withStrictLocator.call(this, srcElement));
    if (res.state !== 'success') throw new Error(`Unable to move cursor to (${srcElement})`);
    res = await this.browser.buttonDown();
    if (res.state !== 'success') throw new Error(`Failed to press button down on (${srcElement})`);
    res = await this.moveCursorTo(withStrictLocator.call(this, destElement));
    if (res.state !== 'success') throw new Error(`Unable to move cursor to (${destElement})`);
    return this.browser.buttonUp();
  }


  /**
   * Close all tabs expect for one.
   * Appium: support web test
   *
   * ```js
   * I.closeOtherTabs();
   * ```
   */
  async closeOtherTabs() {
    const client = this.browser;
    const handles = await this.browser.getTabIds();
    const mainHandle = handles[0];
    let p = Promise.resolve();
    handles.shift();
    handles.forEach((handle) => {
      p = p.then(() => client.switchTab(handle).then(() => client.close(mainHandle)));
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
  async waitForEnabled(locator, sec = null) {
    const client = this.browser;
    const aSec = sec || this.options.waitForTimeout;
    return client.waitUntil(async () => {
      const res = await this.browser.elements(withStrictLocator.call(this, locator));
      if (!res.value || res.value.length === 0) {
        return false;
      }
      const commands = [];
      res.value.forEach(el => commands.push(client.elementIdEnabled(el.ELEMENT)));
      const selected = await client.unify(commands, { extractValue: true });
      if (Array.isArray(selected)) {
        return selected.filter(val => val === true).length > 0;
      }
      return selected;
    }, aSec * 1000, `element (${locator}) still not enabled after ${aSec} sec`);
  }

  /**
   * {{> ../webapi/waitForElement }}
   * Appium: support
   */
  async waitForElement(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    return this.browser.waitUntil(async () => {
      const res = await this.browser.elements(withStrictLocator.call(this, locator));
      return res.value && res.value.length;
    }, aSec * 1000, `element (${locator}) still not present on page after ${aSec} sec`);
  }

  /**
   * {{> ../webapi/waitUntilExists }}
   * Appium: support
   */
  async waitUntilExists(locator, sec = null) {
    return this.waitForStalenessOf(locator, sec);
  }


  /**
   * Waiting for the part of the URL to match the expected. Useful for SPA to understand that page was changed.
   *
   * ```js
   * I.waitInUrl('/info', 2);
   * ```
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
   * Waits for the entire URL to match the expected
   *
   * ```js
   * I.waitUrlEquals('/info', 2);
   * I.waitUrlEquals('http://127.0.0.1:8000/info');
   * ```
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
   * {{> ../webapi/waitForText }}
   * Appium: support
   */
  async waitForText(text, sec = null, aContext = null) {
    const aSec = sec || this.options.waitForTimeout;
    const context = aContext || this.root;
    return this.browser.waitUntil(
      async () => {
        const res = await this.browser.elements(withStrictLocator.call(this, context));
        if (!res.value || res.value.length === 0) return false;
        const commands = [];
        res.value.forEach(el => commands.push(this.browser.elementIdText(el.ELEMENT)));
        const selected = await this.browser.unify(commands, { extractValue: true });
        if (Array.isArray(selected)) {
          return selected.filter(part => part.indexOf(text) >= 0).length > 0;
        }
        return selected.indexOf(text) >= 0;
      }, aSec * 1000,
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
  async waitForValue(field, value, sec = null) {
    const client = this.browser;
    const aSec = sec || this.options.waitForTimeout;
    return client.waitUntil(
      async () => {
        const res = await findFields.call(this, field);
        if (!res.value || res.value.length === 0) return false;
        const commands = [];
        res.value.forEach(el => commands.push(this.browser.elementIdAttribute(el.ELEMENT, 'value')));

        const selected = await this.browser.unify(commands, { extractValue: true });
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
   * Appium: support
   */
  async waitForVisible(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    return this.browser.waitUntil(async () => {
      const res = await this.browser.elements(withStrictLocator.call(this, locator));
      if (!res.value || res.value.length === 0) return false;
      const commands = [];
      res.value.forEach(el => commands.push(this.browser.elementIdDisplayed(el.ELEMENT)));

      const selected = await this.browser.unify(commands, { extractValue: true });
      if (Array.isArray(selected)) {
        return selected.filter(val => val === true).length > 0;
      }
      return selected;
    }, aSec * 1000, `element (${locator}) still not visible after ${aSec} sec`);
  }

  /**
   * Waits for a specified number of elements on the page
   *
   * ```js
   * I.waitNumberOfVisibleElements('a', 3);
   * ```
   */
  async waitNumberOfVisibleElements(locator, num, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    return this.browser.waitUntil(async () => {
      const res = await this.browser.elements(withStrictLocator.call(this, locator));
      if (!res.value || res.value.length === 0) return false;
      const commands = [];

      res.value.forEach(el => commands.push(this.browser.elementIdDisplayed(el.ELEMENT)));
      let selected = await this.browser.unify(commands, { extractValue: true });

      if (!Array.isArray(selected)) selected = [selected];
      return selected.length === num;
    }, aSec * 1000, `The number of elements ${locator} is not ${num} after ${aSec} sec`);
  }

  /**
   * {{> ../webapi/waitForInvisible }}
   * Appium: support
   */
  async waitForInvisible(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    return this.browser.waitUntil(async () => {
      const res = await this.browser.elements(withStrictLocator.call(this, locator));
      if (!res.value || res.value.length === 0) return false;
      const commands = [];
      res.value.forEach(el => commands.push(this.browser.elementIdDisplayed(el.ELEMENT)));

      const selected = await this.browser.unify(commands, { extractValue: true });
      if (Array.isArray(selected)) {
        return selected.filter(val => val === false).length > 0;
      }
      return !selected;
    }, aSec * 1000, `element (${locator}) still visible after ${aSec} sec`);
  }

  /**
   * {{> ../webapi/waitToHide }}
   * Appium: support
   */
  async waitToHide(locator, sec = null) {
    return this.waitForInvisible(locator, sec);
  }

  /**
   * {{> ../webapi/waitForStalenessOf }}
   * Appium: support
   */
  async waitForStalenessOf(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    return this.browser.waitUntil(async () => {
      const res = await this.browser.elements(withStrictLocator.call(this, locator));
      if (!res.value || res.value.length === 0) {
        return true;
      }
      return false;
    }, aSec * 1000, `element (${locator}) still attached to the DOM after ${aSec} sec`);
  }

  /**
   * {{> ../webapi/waitUntil }}
   * Appium: support
   */
  async waitUntil(fn, sec = null, timeoutMsg = null) {
    const aSec = sec || this.options.waitForTimeout;
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
    const res = await this._locate(withStrictLocator.call(this, locator), true);
    assertElementExists(res, locator);
    return this.browser.frame(res.value[0]);
  }

  /**
   * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab
   *
   * ```js
   * I.switchToNextTab();
   * I.switchToNextTab(2);
   * ```
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
   * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab
   *
   * ```js
   * I.switchToPreviousTab();
   * I.switchToPreviousTab(2);
   * ```
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
   * Close current tab
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
   * Open new tab and switch to it
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
   * {{> ../webapi/refreshPage }}
   */
  async refreshPage() {
    const client = this.browser;
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
      const body = document.body;
      const html = document.documentElement;
      window.scrollTo(0, Math.max(
        body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight,
      ));
    });
  }

  /**
   * placeholder for ~ locator only test case write once run on both Appium and WebDriverIO
   */
  runOnIOS(caps, fn) {
  }

  /**
   * placeholder for ~ locator only test case write once run on both Appium and WebDriverIO
   */
  runOnAndroid(caps, fn) {
  }

  /**
   * placeholder for ~ locator only test case write once run on both Appium and WebDriverIO
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

  const commands = [];
  res.value.forEach(el => commands.push(this.browser.elementIdText(el.ELEMENT)));

  const selected = await this.browser.unify(commands, { extractValue: true });

  if (strict) return equals(description)[assertType](text, selected);
  return stringIncludes(description)[assertType](text, selected);
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

  const proceedMultiple = (fields) => {
    let commands = [];
    fields.forEach(el => commands.push(this.browser.elementIdSelected(el.ELEMENT)));
    this.browser.unify(commands).then(() => {
      commands = [];
      fields.forEach((el) => {
        if (el.value === false) return;
        commands.push(this.browser.elementIdAttribute(el.ELEMENT, 'value'));
      });
      return this.browser.unify(commands, {
        extractValue: true,
      }).then(val => stringIncludes(`fields by ${field}`)[assertType](value, val));
    });
  };

  const proceedSingle = el => this.browser.elementIdAttribute(el.ELEMENT, 'value').then(res => stringIncludes(`fields by ${field}`)[assertType](value, res.value));

  const tag = await this.browser.elementIdName(res.value[0].ELEMENT);
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

async function proceedSeeCheckbox(assertType, field) {
  const res = await findFields.call(this, field);
  assertElementExists(res, field, 'Field');

  const commands = [];
  res.value.forEach(el => commands.push(this.browser.elementIdSelected(el.ELEMENT)));
  const selected = await this.browser.unify(commands, { extractValue: true });
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

module.exports = WebDriverIO;
