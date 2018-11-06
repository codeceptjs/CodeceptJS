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
 * This helper should be configured in codecept.json
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
   * @param locator element located by CSS|XPath|strict locator.
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
   * @param locator element located by CSS|XPath|strict locator.
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
   * @param locator element located by CSS|XPath|strict locator.
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
   * @param locator element located by CSS|XPath|strict locator.
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
   * @param timeouts WebDriver timeouts object.
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
   * Opens a web page in a browser. Requires relative or absolute url.
If url starts with `/`, opens a web page of a site defined in `url` config parameter.

```js
I.amOnPage('/'); // opens main page of website
I.amOnPage('https://github.com'); // opens github
I.amOnPage('/login'); // opens a login page
```

@param url url path or global url.
   * Appium: support only web testing
   */
  amOnPage(url) {
    return this.browser.url(url);
  }

  /**
   * Perform a click on a link or a button, given by a locator.
If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
For images, the "alt" attribute and inner text of any parent links are searched.

The second parameter is a context (CSS or XPath locator) to narrow the search.

```js
// simple link
I.click('Logout');
// button of form
I.click('Submit');
// CSS button
I.click('#form input[type=submit]');
// XPath
I.click('//form/*[@type=submit]');
// link in context
I.click('Logout', '#nav');
// using strict locator
I.click({css: 'nav a.login'});
```

@param locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
@param context (optional) element to search in CSS|XPath|Strict locator.
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
   * Performs a double-click on an element matched by link|button|label|CSS or XPath.
Context can be specified as second parameter to narrow search.

```js
I.doubleClick('Edit');
I.doubleClick('Edit', '.actions');
I.doubleClick({css: 'button.accept'});
I.doubleClick('.btn.edit');
```

@param locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
@param context (optional) element to search in CSS|XPath|Strict locator.
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

@param locator element located by CSS|XPath|strict locator.
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
   * Fills a text field or textarea, after clearing its value, with the given string.
Field is located by name, label, CSS, or XPath.

```js
// by label
I.fillField('Email', 'hello@world.com');
// by name
I.fillField('password', '123456');
// by CSS
I.fillField('form#login input[name=username]', 'John');
// or by strict locator
I.fillField({css: 'form#login input[name=username]'}, 'John');
```
@param field located by label|name|CSS|XPath|strict locator.
@param value text value to fill.
   * Appium: support
   */
  async fillField(field, value) {
    const res = await findFields.call(this, field);
    assertElementExists(res, field, 'Field');
    const elem = res.value[0];
    return this.browser.elementIdClear(elem.ELEMENT).elementIdValue(elem.ELEMENT, value);
  }

  /**
   * Appends text to a input field or textarea.
Field is located by name, label, CSS or XPath

```js
I.appendField('#myTextField', 'appended');
```
@param field located by label|name|CSS|XPath|strict locator
@param value text value to append.
   * Appium: support, but it's clear a field before insert in apps
   */
  async appendField(field, value) {
    const res = await findFields.call(this, field);
    assertElementExists(res, field, 'Field');
    const elem = res.value[0];
    return this.browser.elementIdValue(elem.ELEMENT, value);
  }


  /**
   * Clears a `<textarea>` or text `<input>` element's value.

```js
I.clearField('Email');
I.clearField('user[email]');
I.clearField('#email');
```
@param field located by label|name|CSS|XPath|strict locator.
   * Appium: support
   */
  async clearField(field) {
    const res = await findFields.call(this, field);
    assertElementExists(res, field, 'Field');
    const elem = res.value[0];
    return this.browser.elementIdClear(elem.ELEMENT);
  }


  /**
   * Selects an option in a drop-down select.
Field is searched by label | name | CSS | XPath.
Option is selected by visible text or by value.

```js
I.selectOption('Choose Plan', 'Monthly'); // select by label
I.selectOption('subscription', 'Monthly'); // match option by text
I.selectOption('subscription', '0'); // or by value
I.selectOption('//form/select[@name=account]','Premium');
I.selectOption('form select[name=account]', 'Premium');
I.selectOption({css: 'form select[name=account]'}, 'Premium');
```

Provide an array for the second argument to select multiple options.

```js
I.selectOption('Which OS do you use?', ['Android', 'iOS']);
```
@param select field located by label|name|CSS|XPath|strict locator.
@param option visible text or value of option.
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
   * Attaches a file to element located by label, name, CSS or XPath
Path to file is relative current codecept directory (where codecept.json is located).
File will be uploaded to remote system (if tests are running remotely).

```js
I.attachFile('Avatar', 'data/avatar.jpg');
I.attachFile('form input[name=avatar]', 'data/avatar.jpg');
```

@param locator field located by label|name|CSS|XPath|strict locator.
@param pathToFile local file path relative to codecept.json config file.
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
   * Selects a checkbox or radio button.
Element is located by label or name or CSS or XPath.

The second parameter is a context (CSS or XPath locator) to narrow the search.

```js
I.checkOption('#agree');
I.checkOption('I Agree to Terms and Conditions');
I.checkOption('agree', '//form');
```
@param field checkbox located by label | name | CSS | XPath | strict locator.
@param context (optional) element located by CSS | XPath | strict locator.
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
   * Unselects a checkbox or radio button.
Element is located by label or name or CSS or XPath.

The second parameter is a context (CSS or XPath locator) to narrow the search.

```js
I.uncheckOption('#agree');
I.uncheckOption('I Agree to Terms and Conditions');
I.uncheckOption('agree', '//form');
```
@param field checkbox located by label | name | CSS | XPath | strict locator.
@param context (optional) element located by CSS | XPath | strict locator.
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
   * Retrieves a text from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside async with `await`** operator.

```js
let pin = await I.grabTextFrom('#pin');
```
If multiple elements found returns an array of texts.

@param locator element located by CSS|XPath|strict locator.
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
   * Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside async function with `await`** operator.

```js
let postHTML = await I.grabHTMLFrom('#post');
```

@param locator element located by CSS|XPath|strict locator.
   * Appium: support only web testing
   */
  async grabHTMLFrom(locator) {
    const html = await this.browser.getHTML(withStrictLocator.call(this, locator));
    this.debugSection('Grab', html);
    return html;
  }

  /**
   * Retrieves a value from a form element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside async function with `await`** operator.

```js
let email = await I.grabValueFrom('input[name=email]');
```
@param locator field located by label|name|CSS|XPath|strict locator.
   * Appium: support only web testing
   */
  async grabValueFrom(locator) {
    const res = await this._locate(locator, true);
    assertElementExists(res, locator);

    return forEachAsync(res.value, async el => this.browser.elementIdAttribute(el.ELEMENT, 'value'));
  }

  /**
   * Grab CSS property for given locator
Resumes test execution, so **should be used inside an async function with `await`** operator.

```js
const value = await I.grabCssPropertyFrom('h3', 'font-weight');
```

@param locator element located by CSS|XPath|strict locator.
@param cssProperty CSS property name.
   */
  async grabCssPropertyFrom(locator, cssProperty) {
    const res = await this._locate(locator, true);
    assertElementExists(res, locator);
    return forEachAsync(res.value, async el => this.browser.elementIdCssProperty(el.ELEMENT, cssProperty));
  }

  /**
   * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside async with `await`** operator.

```js
let hint = await I.grabAttributeFrom('#tooltip', 'title');
```
@param locator element located by CSS|XPath|strict locator.
@param attr attribute name.
   * Appium: can be used for apps only with several values ("contentDescription", "text", "className", "resourceId")
   */
  async grabAttributeFrom(locator, attr) {
    const res = await this._locate(locator, true);
    assertElementExists(res, locator);
    return forEachAsync(res.value, async el => this.browser.elementIdAttribute(el.ELEMENT, attr));
  }

  /**
   * Checks that title contains text.

@param text text value to check.
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
   * @param text value to check.
   */
  async seeTitleEquals(text) {
    const title = await this.browser.getTitle();
    return assert.equal(title, text, `expected web page title to be ${text}, but found ${title}`);
  }

  /**
   * Checks that title does not contain text.

@param text text value to check.
   * Appium: support only web testing
   */
  async dontSeeInTitle(text) {
    const title = await this.browser.getTitle();
    return stringIncludes('web page title').negate(text, title);
  }

  /**
   * Retrieves a page title and returns it to test.
Resumes test execution, so **should be used inside async with `await`** operator.

```js
let title = await I.grabTitle();
```
   * Appium: support only web testing
   */
  async grabTitle() {
    const title = await this.browser.getTitle();
    this.debugSection('Title', title);
    return title;
  }

  /**
   * Checks that a page contains a visible text.
Use context parameter to narrow down the search.

```js
I.see('Welcome'); // text welcome on a page
I.see('Welcome', '.content'); // text inside .content div
I.see('Register', {css: 'form.register'}); // use strict locator
```
@param text expected on page.
@param context (optional) element located by CSS|Xpath|strict locator in which to search for text.
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
   * @param text element value to check.
   * @param context (optional) element located by CSS|XPath|strict locator.
   */
  async seeTextEquals(text, context = null) {
    return proceedSee.call(this, 'assert', text, context, true);
  }

  /**
   * Opposite to `see`. Checks that a text is not present on a page.
Use context parameter to narrow down the search.

```js
I.dontSee('Login'); // assume we are already logged in
```
@param text is not present.
@param context (optional) element located by CSS|XPath|strict locator in which to perfrom search.
   * Appium: support with context in apps
   */
  async dontSee(text, context = null) {
    return proceedSee.call(this, 'negate', text, context);
  }

  /**
   * Checks that the given input field or textarea equals to given value.
For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.

```js
I.seeInField('Username', 'davert');
I.seeInField({css: 'form textarea'},'Type your comment here');
I.seeInField('form input[type=hidden]','hidden_value');
I.seeInField('#searchform input','Search');
```
@param field located by label|name|CSS|XPath|strict locator.
@param value value to check.
   * Appium: support only web testing
   */
  async seeInField(field, value) {
    return proceedSeeField.call(this, 'assert', field, value);
  }

  /**
   * Checks that value of input field or textare doesn't equal to given value
Opposite to `seeInField`.

@param field located by label|name|CSS|XPath|strict locator.
@param value value to check.
   * Appium: support only web testing
   */
  async dontSeeInField(field, value) {
    return proceedSeeField.call(this, 'negate', field, value);
  }

  /**
   * Verifies that the specified checkbox is checked.

```js
I.seeCheckboxIsChecked('Agree');
I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
```
@param field located by label|name|CSS|XPath|strict locator.
   * Appium: not tested
   */
  async seeCheckboxIsChecked(field) {
    return proceedSeeCheckbox.call(this, 'assert', field);
  }

  /**
   * Verifies that the specified checkbox is not checked.

@param field located by label|name|CSS|XPath|strict locator.
   * Appium: not tested
   */
  async dontSeeCheckboxIsChecked(field) {
    return proceedSeeCheckbox.call(this, 'negate', field);
  }

  /**
   * Checks that a given Element is visible
Element is located by CSS or XPath.

```js
I.seeElement('#modal');
```
@param locator located by CSS|XPath|strict locator.
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
   * Opposite to `seeElement`. Checks that element is not visible (or in DOM)

@param locator located by CSS|XPath|Strict locator.
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
   * Checks that a given Element is present in the DOM
Element is located by CSS or XPath.

```js
I.seeElementInDOM('#modal');
```
@param locator located by CSS|XPath|strict locator.
   * Appium: support
   */
  async seeElementInDOM(locator) {
    const res = await this.browser.elements(withStrictLocator.call(this, locator));
    return empty('elements').negate(res.value);
  }

  /**
   * Opposite to `seeElementInDOM`. Checks that element is not on page.

@param locator located by CSS|XPath|Strict locator.
   * Appium: support
   */
  async dontSeeElementInDOM(locator) {
    const res = await this.browser.elements(withStrictLocator.call(this, locator));
    return empty('elements').assert(res.value);
  }

  /**
   * Checks that the current page contains the given string in its raw source code.

```js
I.seeInSource('<h1>Green eggs &amp; ham</h1>');
```
@param text value to check.
   * Appium: support
   */
  async seeInSource(text) {
    const source = await this.browser.getSource();
    return stringIncludes('HTML source of a page').assert(text, source);
  }

  /**
   * Retrieves page source and returns it to test.
Resumes test execution, so should be used inside an async function.

```js
let pageSource = await I.grabSource();
```
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
   * Get current URL from browser.
Resumes test execution, so should be used inside an async function.

```js
let url = await I.grabCurrentUrl();
console.log(`Current URL is [${url}]`);
```
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
   * Checks that the current page contains the given string in its raw source code.

@param text value to check.
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
   * @param locator element located by CSS|XPath|strict locator.
   * @param num number of elements.
   */
  async seeNumberOfElements(locator, num) {
    const res = await this._locate(withStrictLocator.call(this, locator));
    return assert.equal(res.value.length, num, `expected number of elements (${locator}) is ${num}, but found ${res.value.length}`);
  }

  /**
   * Asserts that an element is visible a given number of times.
Element is located by CSS or XPath.

```js
I.seeNumberOfVisibleElements('.buttons', 3);
```

@param locator element located by CSS|XPath|strict locator.
@param num number of elements.
   */
  async seeNumberOfVisibleElements(locator, num) {
    const res = await this.grabNumberOfVisibleElements(locator);
    return assert.equal(res, num, `expected number of visible elements (${locator}) is ${num}, but found ${res}`);
  }

  /**
   * Checks that all elements with given locator have given CSS properties.

```js
I.seeCssPropertiesOnElements('h3', { 'font-weight': "bold"});
```

@param locator located by CSS|XPath|strict locator.
@param cssProperties object with CSS properties and their values to check.
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
   * Checks that all elements with given locator have given attributes.

```js
I.seeAttributesOnElements('//form', {'method': "post"});
```

@param locator located by CSS|XPath|strict locator.
@param attributes object with attributes and their values to check.
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
   * Grab number of visible elements by locator.

```js
I.grabNumberOfVisibleElements('p');
```

@param locator located by CSS|XPath|strict locator.
   */
  async grabNumberOfVisibleElements(locator) {
    const res = await this._locate(locator);

    let selected = await forEachAsync(res.value, async el => this.browser.elementIdDisplayed(el.ELEMENT));
    if (!Array.isArray(selected)) selected = [selected];
    selected = selected.filter(val => val === true);
    return selected.length;
  }

  /**
   * Checks that current url contains a provided fragment.

```js
I.seeInCurrentUrl('/register'); // we are on registration page
```

@param url value to check.
   * Appium: support only web testing
   */
  async seeInCurrentUrl(url) {
    const res = await this.browser.url();
    return stringIncludes('url').assert(url, decodeUrl(res.value));
  }

  /**
   * Checks that current url does not contain a provided fragment.

@param url value to check.
   * Appium: support only web testing
   */
  async dontSeeInCurrentUrl(url) {
    const res = await this.browser.url();
    return stringIncludes('url').negate(url, decodeUrl(res.value));
  }

  /**
   * Checks that current url is equal to provided one.
If a relative url provided, a configured url will be prepended to it.
So both examples will work:

```js
I.seeCurrentUrlEquals('/register');
I.seeCurrentUrlEquals('http://my.site.com/register');
```

@param url value to check.
   * Appium: support only web testing
   */
  async seeCurrentUrlEquals(url) {
    const res = await this.browser.url();
    return urlEquals(this.options.url).assert(url, decodeUrl(res.value));
  }

  /**
   * Checks that current url is not equal to provided one.
If a relative url provided, a configured url will be prepended to it.

@param url value to check.
   * Appium: support only web testing
   */
  async dontSeeCurrentUrlEquals(url) {
    const res = await this.browser.url();
    return urlEquals(this.options.url).negate(url, decodeUrl(res.value));
  }

  /**
   * Executes sync script on a page.
Pass arguments to function as additional parameters.
Will return execution result to a test.
In this case you should use async function and await to receive results.

Example with jQuery DatePicker:

```js
// change date of jQuery DatePicker
I.executeScript(function() {
  // now we are inside browser context
  $('date').datetimepicker('setDate', new Date());
});
```
Can return values. Don't forget to use `await` to get them.

```js
let date = await I.executeScript(function(el) {
  // only basic types can be returned
  return $(el).datetimepicker('getDate').toString();
}, '#date'); // passing jquery selector
```

@param fn function to be executed in browser context.
@param ...args args to be passed to function.
   * Appium: support only web testing
   *
   * Wraps [execute](http://webdriver.io/api/protocol/execute.html) command.
   */
  executeScript(fn) {
    return this.browser.execute.apply(this.browser, arguments).then(res => res.value);
  }

  /**
   * Executes async script on page.
Provided function should execute a passed callback (as first argument) to signal it is finished.

Example: In Vue.js to make components completely rendered we are waiting for [nextTick](https://vuejs.org/v2/api/#Vue-nextTick).

```js
I.executeAsyncScript(function(done) {
  Vue.nextTick(done); // waiting for next tick
});
```

By passing value to `done()` function you can return values.
Additional arguments can be passed as well, while `done` function is always last parameter in arguments list.

```js
let val = await I.executeAsyncScript(function(url, done) {
  // in browser context
  $.ajax(url, { success: (data) => done(data); }
}, 'http://ajax.callback.url/');
```

@param fn function to be executed in browser context.
@param ...args args to be passed to function.
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
   * @param locator located by CSS|XPath|strict locator.
   * @param offsetX (optional) X-axis offset.
   * @param offsetY (optional) Y-axis offset.
   */

  /**
   * Scrolls to element matched by locator.
Extra shift can be set with offsetX and offsetY options.

```js
I.scrollTo('footer');
I.scrollTo('#submit', 5, 5);
```

@param locator located by CSS|XPath|strict locator.
@param offsetX (optional) X-axis offset.
@param offsetY (optional) Y-axis offset.
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
   * Moves cursor to element matched by locator.
Extra shift can be set with offsetX and offsetY options.

```js
I.moveCursorTo('.tooltip');
I.moveCursorTo('#submit', 5,5);
```

@param locator located by CSS|XPath|strict locator.
@param offsetX (optional) X-axis offset.
@param offsetY (optional) Y-axis offset.
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
   * Saves a screenshot to ouput folder (set in codecept.json).
Filename is relative to output folder. 
Optionally resize the window to the full available page `scrollHeight` and `scrollWidth` to capture the entire page by passing `true` in as the second argument.

```js
I.saveScreenshot('debug.png');
I.saveScreenshot('debug.png', true) //resizes to available scrollHeight and scrollWidth before taking screenshot
```

@param fileName file name to save. 
@param fullPage (optional) flag to enable fullscreen screenshot mode.
   * Appium: support
   */
  async saveScreenshot(fileName, fullPage = false) {
    const outputFile = path.join(global.output_dir, fileName);

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
   * Sets a cookie.

```js
I.setCookie({name: 'auth', value: true});
```

@param cookie cookie JSON object.
   * Appium: support only web testing
   *
   * Uses Selenium's JSON [cookie
   * format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).
   */
  async setCookie(cookie) {
    return this.browser.setCookie(cookie);
  }

  /**
   * Clears a cookie by name,
if none provided clears all cookies.

```js
I.clearCookie();
I.clearCookie('test');
```

@param cookie (optional) cookie name.
   * Appium: support only web testing
   */
  async clearCookie(cookie) {
    return this.browser.deleteCookie(cookie);
  }

  /**
   * Checks that cookie with given name exists.

```js
I.seeCookie('Auth');
```

@param name cookie name.
   * Appium: support only web testing
   */
  async seeCookie(name) {
    const res = await this.browser.getCookie(name);
    return truth(`cookie ${name}`, 'to be set').assert(res);
  }

  /**
   * Checks that cookie with given name does not exist.

@param name cookie name.
   * Appium: support only web testing
   */
  async dontSeeCookie(name) {
    const res = await this.browser.getCookie(name);
    return truth(`cookie ${name}`, 'to be set').negate(res);
  }

  /**
   * Gets a cookie object by name.
If none provided gets all cookies.
* Resumes test execution, so **should be used inside async with `await`** operator.

```js
let cookie = await I.grabCookie('auth');
assert(cookie.value, '123456');
```

@param name (optional) cookie name.
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
   * @param text value to check.
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
   * Presses a key on a focused element.
Special keys like 'Enter', 'Control', [etc](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value)
will be replaced with corresponding unicode.
If modifier key is used (Control, Command, Alt, Shift) in array, it will be released afterwards.

```js
I.pressKey('Enter');
I.pressKey(['Control','a']);
```

@param key key or array of keys to press.
   * [Valid key names](https://w3c.github.io/webdriver/#keyboard-actions) are:

- `'Add'`,
- `'Alt'`,
- `'ArrowDown'` or `'Down arrow'`,
- `'ArrowLeft'` or `'Left arrow'`,
- `'ArrowRight'` or `'Right arrow'`,
- `'ArrowUp'` or `'Up arrow'`,
- `'Backspace'`,
- `'Command'`,
- `'Control'`,
- `'Del'`,
- `'Divide'`,
- `'End'`,
- `'Enter'`,
- `'Equals'`,
- `'Escape'`,
- `'F1 to F12'`,
- `'Home'`,
- `'Insert'`,
- `'Meta'`,
- `'Multiply'`,
- `'Numpad 0'` to `'Numpad 9'`,
- `'Pagedown'` or `'PageDown'`,
- `'Pageup'` or `'PageUp'`,
- `'Pause'`,
- `'Semicolon'`,
- `'Shift'`,
- `'Space'`,
- `'Subtract'`,
- `'Tab'`.
   *
   * To make combinations with modifier and mouse clicks (like Ctrl+Click) press a modifier, click, then release it.
   * Appium: support, but clear field before pressing in apps:
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
   * Resize the current window to provided width and height.
First parameter can be set to `maximize`.

@param width width in pixels or `maximize`.
@param height height in pixels.
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
   * Drag an item to a destination element.

```js
I.dragAndDrop('#dragHandle', '#container');
```

@param srcElement located by CSS|XPath|strict locator.
@param destElement located by CSS|XPath|strict locator.
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
   * Pauses execution for a number of seconds.

```js
I.wait(2); // wait 2 secs
```

@param sec number of second to wait.
@param sec time in seconds to wait.
   * Appium: support
   */
  async wait(sec) {
    return this.browser.pause(sec * 1000);
  }

  /**
   * Waits for element to become enabled (by default waits for 1sec).
Element can be located by CSS or XPath.

@param locator element located by CSS|XPath|strict locator.
@param sec (optional) time in seconds to wait, 1 by default.
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
    }, aSec * 1000, `element (${locator}) still not enabled after ${aSec} sec`);
  }

  /**
   * Waits for element to be present on page (by default waits for 1sec).
Element can be located by CSS or XPath.

```js
I.waitForElement('.btn.continue');
I.waitForElement('.btn.continue', 5); // wait for 5 secs
```

@param locator element located by CSS|XPath|strict locator.
@param sec (optional) time in seconds to wait, 1 by default.
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
   * Waiting for the part of the URL to match the expected. Useful for SPA to understand that page was changed.

```js
I.waitInUrl('/info', 2);
```

@param urlPart value to check.
@param sec (optional) time in seconds to wait.
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

```js
I.waitUrlEquals('/info', 2);
I.waitUrlEquals('http://127.0.0.1:8000/info');
```

@param urlPart value to check.
@param sec (optional) time in seconds to wait.
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
   * Waits for a text to appear (by default waits for 1sec).
Element can be located by CSS or XPath.
Narrow down search results by providing context.

```js
I.waitForText('Thank you, form has been submitted');
I.waitForText('Thank you, form has been submitted', 5, '#modal');
```

@param text to wait for.
@param sec (optional) time in seconds to wait.
@param context (optional) element located by CSS|XPath|strict locator.
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
   * Waits for the specified value to be in value attribute.

```js
I.waitForValue('//input', "GoodValue");
```

@param field input field.
@param value expected value.
@param sec (optional) time in seconds to wait, 1 sec by default.
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
   * Waits for an element to become visible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

```
I.waitForVisible('#popup');
```

@param locator element located by CSS|XPath|strict locator.
@param sec (optional) time in seconds to wait, 1 by default.
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
    }, aSec * 1000, `element (${locator}) still not visible after ${aSec} sec`);
  }

  /**
   * Waits for a specified number of elements on the page.

```js
I.waitNumberOfVisibleElements('a', 3);
```

@param locator element located by CSS|XPath|strict locator.
@param num number of elements.
@param sec (optional) time in seconds to wait.
   */
  async waitNumberOfVisibleElements(locator, num, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    return this.browser.waitUntil(async () => {
      const res = await this.browser.elements(withStrictLocator.call(this, locator));
      if (!res.value || res.value.length === 0) return false;
      let selected = await forEachAsync(res.value, async el => this.browser.elementIdDisplayed(el.ELEMENT));

      if (!Array.isArray(selected)) selected = [selected];
      return selected.length === num;
    }, aSec * 1000, `The number of elements (${locator}) is not ${num} after ${aSec} sec`);
  }

  /**
   * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

```
I.waitForInvisible('#popup');
```

@param locator element located by CSS|XPath|strict locator.
@param sec (optional) time in seconds to wait, 1 by default.
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
    }, aSec * 1000, `element (${locator}) still visible after ${aSec} sec`);
  }

  /**
   * Waits for an element to hide (by default waits for 1sec).
Element can be located by CSS or XPath.

```
I.waitToHide('#popup');
```

@param locator element located by CSS|XPath|strict locator.
@param sec (optional) time in seconds to wait, 1 by default.
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
   * Waits for an element to become not attached to the DOM on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

```
I.waitForDetached('#popup');
```

@param locator element located by CSS|XPath|strict locator.
@param sec (optional) time in seconds to wait, 1 by default.
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
    }, aSec * 1000, `element (${locator}) still attached to the DOM after ${aSec} sec`);
  }

  /**
   * Waits for a function to return true (waits for 1 sec by default).
Running in browser context.

```js
I.waitForFunction(fn[, [args[, timeout]])
```

```js
I.waitForFunction(() => window.requests == 0);
I.waitForFunction(() => window.requests == 0, 5); // waits for 5 sec
I.waitForFunction((count) => window.requests == count, [3], 5) // pass args and wait for 5 sec
```

@param fn to be executed in browser context.
@param argsOrSec (optional) arguments for function or seconds.
@param sec (optional) time in seconds to wait, 1 by default.
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
   * Waits for a function to return true (waits for 1sec by default).

```js
I.waitUntil(() => window.requests == 0);
I.waitUntil(() => window.requests == 0, 5);
```

@param fn function which is executed in browser context.
@param sec (optional) time in seconds to wait, 1 by default.
@param timeoutMsg (optional) message to show in case of timeout fail.
   * Appium: support
   */
  async waitUntil(fn, sec = null, timeoutMsg = null) {
    const aSec = sec || this.options.waitForTimeout;
    return this.browser.waitUntil(fn, aSec * 1000, timeoutMsg);
  }

  /**
   * Switches frame or in case of null locator reverts to parent.

@param locator element located by CSS|XPath|strict locator.
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
   * @param num (optional) number of tabs to switch forward, default: 1.
   * @param sec (optional) time in seconds to wait.
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
   * @param num (optional) number of tabs to switch backward, default: 1.
   * @param sec (optional) time in seconds to wait.
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
   * Grab number of open tabs.

```js
I.grabNumberOfOpenTabs();
```
   */
  async grabNumberOfOpenTabs() {
    const pages = await this.browser.getTabIds();
    return pages.length;
  }

  /**
   * Reload the current page.

````js
`I.refreshPage();
````

   */
  async refreshPage() {
    const client = this.browser;
    return client.refresh();
  }

  /**
   * Scroll page to the top.

```js
I.scrollPageToTop();
```
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
   * Scroll page to the bottom.

```js
I.scrollPageToBottom();
```
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
   * Retrieves a page scroll position and returns it to test.
Resumes test execution, so **should be used inside an async function with `await`** operator.

```js
let { x, y } = await I.grabPageScrollPosition();
```
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
// @param  {object[]} items  list of items
// @param  {object} [option]  extractValue: set to try to return the .value property of the input items
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
