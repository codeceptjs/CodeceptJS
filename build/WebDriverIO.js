'use strict';
let webdriverio;
const Helper = require('../helper');
const stringIncludes = require('../assert/include').includes;
const urlEquals = require('../assert/equal').urlEquals;
const equals = require('../assert/equal').equals;
const empty = require('../assert/empty').empty;
const truth = require('../assert/truth').truth;
const xpathLocator = require('../utils').xpathLocator;
const fileExists = require('../utils').fileExists;
const clearString = require('../utils').clearString;
const decodeUrl = require('../utils').decodeUrl;
const chunkArray = require('../utils').chunkArray;
const ElementNotFound = require('./errors/ElementNotFound');
const assert = require('assert');
const path = require('path');
const requireg = require('requireg');
const webRoot = 'body';


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
        script: 1000 // ms
      }
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
      requireg("webdriverio");
    } catch (e) {
      return ["webdriverio"];
    }
  }

  static _config() {
    return [{
      name: 'url',
      message: "Base url of site to be tested",
      default: 'http://localhost'
    }, {
      name: 'browser',
      message: 'Browser in which testing will be performed',
      default: 'chrome'
    }];
  }

  _beforeSuite() {
    if (!this.options.restart && !this.options.manualStart && !this.isRunning) {
      this.debugSection('Session', 'Starting singleton browser session');
      return this._startBrowser();
    }
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
      if (this.options.timeouts) {
        promisesList.push(this.defineTimeout(this.options.timeouts));
      }
      if (this.options.windowSize === 'maximize') {
        promisesList.push(this.browser.execute('return [screen.width, screen.height]').then((res) => {
          return this.browser.windowHandleSize({
            width: res.value[0],
            height: res.value[1]
          });
        }));
      } else if (this.options.windowSize && this.options.windowSize.indexOf('x') > 0) {
        let dimensions = this.options.windowSize.split('x');
        promisesList.push(this.browser.windowHandleSize({
          width: dimensions[0],
          height: dimensions[1]
        }));
      }
      return Promise.all(promisesList);
    });
  }

  _before() {
    this.context = this.root;
    if (this.options.restart && !this.options.manualStart) return this._startBrowser();
    if (!this.isRunning && !this.options.manualStart) return this._startBrowser();
    return this.browser;
  }

  _after() {
    if (!this.isRunning) return;
    if (this.options.restart) {
      this.isRunning = false;
      return this.browser.end();
    }
    if (this.options.keepBrowserState) return;
    if (this.options.keepCookies) {
      return Promise.all(
        [this.browser.execute('localStorage.clear();').catch((err) => {
          if (!(err.message.indexOf("Storage is disabled inside 'data:' URLs.") > -1)) throw err;
        }), this.closeOtherTabs()]);
    }
    if (this.options.desiredCapabilities.browserName) {
      this.debugSection('Session', 'cleaning cookies and localStorage');
      return Promise.all(
        [this.browser.deleteCookie(), this.browser.execute('localStorage.clear();').catch((err) => {
          if (!(err.message.indexOf("Storage is disabled inside 'data:' URLs.") > -1)) throw err;
        }), this.closeOtherTabs()]);
    }
  }

  _afterSuite() {
  }

  _finishTest() {
    if (!this.options.restart && this.isRunning) return this.browser.end();
  }

  _failed(test) {
    let promisesList = [];
    if (Object.keys(withinStore).length !== 0) promisesList.push(this._withinEnd());
    if (!this.options.disableScreenshots) {
      let fileName = clearString(test.title);
      if (test.ctx && test.ctx.test && test.ctx.test.type === 'hook') fileName = clearString(`${test.title}_${test.ctx.test.title}`);
      if (this.options.uniqueScreenshotNames) {
        let uuid = test.uuid || test.ctx.test.uuid;
        fileName = `${fileName.substring(0, 10)}_${uuid}.failed.png`;
      } else {
        fileName = fileName + '.failed.png';
      }
      promisesList.push(this.saveScreenshot(fileName, this.options.fullPageScreenshots));
    }
    return Promise.all(promisesList).catch((err) => {
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

  _withinBegin(locator) {
    let frame = isFrameLocator(locator);
    let client = this.browser;
    if (frame) {
      withinStore.frame = frame;
      return this.switchTo(frame);
    }
    withinStore.elFn = this.browser.element;
    withinStore.elsFn = this.browser.elements;
    this.context = locator;
    return client.element(withStrictLocator(locator)).then((res) => {
      this.browser.element = function (l) {
        return this.elementIdElement(res.value.ELEMENT, l);
      };
      this.browser.elements = function (l) {
        return this.elementIdElements(res.value.ELEMENT, l);
      };
    });
  }

  _withinEnd() {
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
  _locate(locator, smartWait = false) {

    if (!this.options.smartWait || !smartWait) return this.browser.elements(withStrictLocator(locator));
    let els;

    return this.defineTimeout({implicit: this.options.smartWait})
      .then(() => this.debugSection('SmartWait', `Locating ${locator} in ${this.options.smartWait}`))
      .then(() => this.browser.elements(withStrictLocator(locator)));
  }

  /**
   * Find a checkbox by providing human readable text:
   *
   * ```js
   * this.helpers['WebDriverIO']._locateCheckable('I agree with terms and conditions').then // ...
   * ```
   */
  _locateCheckable(locator) {
    return findCheckable(locator, this.browser.elements.bind(this)).then((res) => res.value);
  }

  /**
   * Find a clickable element by providing human readable text:
   *
   * ```js
   * this.helpers['WebDriverIO']._locateClickable('Next page').then // ...
   * ```
   */
  _locateClickable(locator) {
    return findClickable(locator, this.browser.elements.bind(this)).then((res) => res.value);
  }

  /**
   * Find field elements by providing human readable text:
   *
   * ```js
   * this.helpers['WebDriverIO']._locateFields('Your email').then // ...
   * ```
   */
  _locateFields(locator) {
    return findFields.call(this, locator).then((res) => res.value);
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
  defineTimeout(timeouts) {
    let p = [];
    if (timeouts.implicit) {
      p.push(this.browser.timeouts('implicit', timeouts.implicit));
    }
    if (timeouts['page load']) {
      p.push(this.browser.timeouts('page load', timeouts['page load']));
    }
    // both pageLoad and page load are accepted
    // see http://webdriver.io/api/protocol/timeouts.html
    if (timeouts.pageLoad) {
      p.push(this.browser.timeouts('page load', timeouts.pageLoad));
    }
    if (timeouts.script) {
      p.push(this.browser.timeouts('script', timeouts.script));
    }
    return Promise.all(p); // return the last response
  }

  /**
   * Opens a web page in a browser. Requires relative or absolute url.
If url starts with `/`, opens a web page of a site defined in `url` config parameter.

```js
I.amOnPage('/'); // opens main page of website
I.amOnPage('https://github.com'); // opens github
I.amOnPage('/login'); // opens a login page
```

@param url url path or global url
   * Appium: support only web testing
   */
  amOnPage(url) {
    return this.browser.url(url).url((err, res) => {
      if (err) throw err;
      this.debugSection('Url', res.value);
    });
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
@param locator clickable link or button located by text, or any element located by CSS|XPath|strict locator
@param context (optional) element to search in CSS|XPath|Strict locator
   * Appium: support
   */
  click(locator, context = null) {
    let clickMethod = this.browser.isMobile ? 'touchClick' : 'elementIdClick';
    let locateFn = prepareLocateFn.call(this, context);

    return findClickable(locator, locateFn).then((res) => {
      if (!res.value || res.value.length === 0) {
        if (typeof locator === "object") locator = JSON.stringify(locator);
        if (context) locator += ` inside ${context}`;
        throw new ElementNotFound(locator, "Clickable element");
      }
      return this.browser[clickMethod](res.value[0].ELEMENT);
    });
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

@param locator
@param context
   * Appium: support only web testing
   */
  doubleClick(locator, context = null) {
    let clickMethod = this.browser.isMobile ? 'touchClick' : 'elementIdClick';
    let locateFn = prepareLocateFn.call(this, context);

    return findClickable(locator, locateFn).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(locator, "Clickable element");
      }
      let elem = res.value[0];
      return this.browser.moveTo(elem.ELEMENT).doDoubleClick();
    });
  }

  /**
   * Performs right click on an element matched by CSS or XPath.
   * Appium: support, but in apps works as usual click
   */
  rightClick(locator) {
    /**
     * just press button if no selector is given
     */
    if (locator === undefined) {
      return this.browser.buttonPress("right");
    }
    return this._locate(locator, true).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(locator, "Clickable element");
      }
      let elem = res.value[0];
      if (this.browser.isMobile) return this.browser.touchClick(elem.ELEMENT);
      return this.browser.moveTo(elem.ELEMENT).buttonPress("right");
    });
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
@param field located by label|name|CSS|XPath|strict locator
@param value

   * Appium: support
   */
  fillField(field, value) {
    return findFields.call(this, field).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(field, "Field");
      }
      let elem = res.value[0];
      return this.browser.elementIdClear(elem.ELEMENT).elementIdValue(elem.ELEMENT, value);
    });
  }

  /**
   * Appends text to a input field or textarea.
Field is located by name, label, CSS or XPath

```js
I.appendField('#myTextField', 'appended');
```
@param field located by label|name|CSS|XPath|strict locator
@param value text value
   * Appium: support, but it's clear a field before insert in apps
   */
  appendField(field, value) {
    return findFields.call(this, field).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(field, "Field");
      }
      let elem = res.value[0];
      return this.browser.elementIdValue(elem.ELEMENT, value);
    });
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
@param select field located by label|name|CSS|XPath|strict locator
@param option

   */
  selectOption(select, option) {
    return findFields.call(this, select).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(select, "Selectable field");
      }
      let elem = res.value[0];

      let normalized, byVisibleText;
      let commands = [];

      if (!Array.isArray(option)) {
        option = [option];
      }

      option.forEach((opt) => {
        normalized = `[normalize-space(.) = "${opt.trim() }"]`;
        byVisibleText = `./option${normalized}|./optgroup/option${normalized}`;
        commands.push(this.browser.elementIdElements(elem.ELEMENT, byVisibleText));
      });
      return this.browser.unify(commands, {
        extractValue: true
      }).then((els) => {
        commands = [];
        let clickOptionFn = (el) => {
          if (el[0]) el = el[0];
          if (el && el.ELEMENT) commands.push(this.browser.elementIdClick(el.ELEMENT));
        };

        if (els.length) {
          els.forEach(clickOptionFn);
          return this.browser.unify(commands);
        }
        let normalized, byValue;

        option.forEach((opt) => {
          normalized = `[normalize-space(@value) = "${opt.trim() }"]`;
          byValue = `./option${normalized}|./optgroup/option${normalized}`;
          commands.push(this.browser.elementIdElements(elem.ELEMENT, byValue));
        });
        // try by value
        return this.browser.unify(commands, {
          extractValue: true
        }).then((els) => {
          if (els.length === 0) {
            throw new ElementNotFound(select, `Option ${option} in`, "was found neither by visible text not by value");
          }
          commands = [];
          els.forEach(clickOptionFn);
          return this.browser.unify(commands);
        });
      });
    });
  }

  /**
   * Attaches a file to element located by label, name, CSS or XPath
Path to file is relative current codecept directory (where codecept.json is located).
File will be uploaded to remote system (if tests are running remotely).

```js
I.attachFile('Avatar', 'data/avatar.jpg');
I.attachFile('form input[name=avatar]', 'data/avatar.jpg');
```
@param locator field located by label|name|CSS|XPath|strict locator
@param pathToFile local file path relative to codecept.json config file

   * Appium: not tested
   */
  attachFile(locator, pathToFile) {
    let file = path.join(global.codecept_dir, pathToFile);
    if (!fileExists(file)) {
      throw new Error(`File at ${file} can not be found on local system`);
    }
    return findFields.call(this, locator).then((el) => {
      this.debug("Uploading " + file);
      return this.browser.uploadFile(file).then((res) => {
        if (!el.value || el.value.length === 0) {
          throw new ElementNotFound(locator, "File field");
        }
        return this.browser.elementIdValue(el.value[0].ELEMENT, res.value);
      });
    });
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
@param field checkbox located by label | name | CSS | XPath | strict locator
@param context (optional) element located by CSS | XPath | strict locator
   * Appium: not tested
   */
  checkOption(field, context = null) {
    let clickMethod = this.browser.isMobile ? 'touchClick' : 'elementIdClick';

    let locateFn = prepareLocateFn.call(this, context);

    return findCheckable(field, locateFn).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(field, "Checkable");
      }
      let elem = res.value[0];
      return this.browser.elementIdSelected(elem.ELEMENT).then(function (isSelected) {
        if (isSelected.value) return true;
        return this[clickMethod](elem.ELEMENT);
      });
    });
  }

  /**
   * Retrieves a text from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let pin = yield I.grabTextFrom('#pin');
```
@param locator element located by CSS|XPath|strict locator
   * Appium: support
   */
  grabTextFrom(locator) {
    let client = this.browser;
    return this._locate(locator, true).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(locator);
      }
      let commands = [];
      res.value.forEach((el) => commands.push(client.elementIdText(el.ELEMENT)));
      return client.unify(commands, {
        extractValue: true
      }).then((selected) => {
        return selected;
      });
    });
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
  grabHTMLFrom(locator) {
    return this.browser.getHTML(withStrictLocator(locator)).then(function (html) {
      return html;
    });
  }

  /**
   * Retrieves a value from a form element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let email = yield I.grabValueFrom('input[name=email]');
```
@param locator field located by label|name|CSS|XPath|strict locator
   * Appium: support only web testing
   */
  grabValueFrom(locator) {
    let client = this.browser;
    return this._locate(locator, true).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(locator);
      }
      let commands = [];
      res.value.forEach((el) => commands.push(client.elementIdAttribute(el.ELEMENT, 'value')));
      return client.unify(commands, {
        extractValue: true
      }).then((selected) => {
        return selected;
      });
    });
  }

  /**
   * Grab CSS property for given locator
   *
   * ```js
   * I.grabCssPropertyFrom('h3', 'font-weight');
   * ```
   */
  grabCssPropertyFrom(locator, cssProperty) {
    let client = this.browser;
    return this._locate(locator).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(locator);
      }
      let commands = [];
      res.value.forEach((el) => commands.push(client.elementIdCssProperty(el.ELEMENT, cssProperty)));
      return client.unify(commands, {
        extractValue: true
      }).then((selected) => {
        return selected;
      });
    });
  }

  /**
   * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let hint = yield I.grabAttributeFrom('#tooltip', 'title');
```
@param locator element located by CSS|XPath|strict locator
@param attr
   * Appium: can be used for apps only with several values ("contentDescription", "text", "className", "resourceId")
   */
  grabAttributeFrom(locator, attr) {
    let client = this.browser;
    return this._locate(locator, true).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(locator);
      }
      let commands = [];
      res.value.forEach((el) => commands.push(client.elementIdAttribute(el.ELEMENT, attr)));
      return client.unify(commands, {
        extractValue: true
      }).then((selected) => {
        return selected;
      });
    });
  }

  /**
   * Checks that title contains text.

@param text
   * Appium: support only web testing
   */
  seeInTitle(text) {
    return this.browser.getTitle().then((title) => {
      return stringIncludes('web page title').assert(text, title);
    });
  }

  /**
   * Checks that title is equal to provided one.
   *
   * ```js
   * I.seeTitleEquals('Test title.');
   * ```
   */
  seeTitleEquals(text) {
    return this.browser.getTitle().then((title) => {
      return assert.equal(title, text, `expected web page title to be ${text}, but found ${title}`);
    });
  }

  /**
   * Checks that title does not contain text.

@param text
   * Appium: support only web testing
   */
  dontSeeInTitle(text) {
    return this.browser.getTitle().then((title) => {
      return stringIncludes('web page title').negate(text, title);
    });
  }

  /**
   * Retrieves a page title and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let title = yield I.grabTitle();
```
   * Appium: support only web testing
   */
  grabTitle() {
    return this.browser.getTitle().then((title) => {
      this.debugSection('Title', title);
      return title;
    });
  }

  /**
   * Checks that a page contains a visible text.
Use context parameter to narrow down the search.

```js
I.see('Welcome'); // text welcome on a page
I.see('Welcome', '.content'); // text inside .content div
I.see('Register', {css: 'form.register'}); // use strict locator
```
@param text expected on page
@param context (optional) element located by CSS|Xpath|strict locator in which to search for text
   * Appium: support with context in apps
   */
  see(text, context = null) {
    return proceedSee.call(this, 'assert', text, context);
  }

  /**
   * Checks that text is equal to provided one.
   *
   * ```js
   * I.seeTextEquals('text', 'h1');
   * ```
   */
  seeTextEquals(text, context = null) {
    return proceedSee.call(this, 'assert', text, context, true);
  }

  /**
   * Opposite to `see`. Checks that a text is not present on a page.
Use context parameter to narrow down the search.

```js
I.dontSee('Login'); // assume we are already logged in
```
@param text is not present
@param context (optional) element located by CSS|XPath|strict locator in which to perfrom search
   * Appium: support with context in apps
   */
  dontSee(text, context = null) {
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
@param field located by label|name|CSS|XPath|strict locator
@param value
   * Appium: support only web testing
   */
  seeInField(field, value) {
    return proceedSeeField.call(this, 'assert', field, value);
  }

  /**
   * Checks that value of input field or textare doesn't equal to given value
Opposite to `seeInField`.

@param field located by label|name|CSS|XPath|strict locator
@param value is not expected to be a field value
   * Appium: support only web testing
   */
  dontSeeInField(field, value) {
    return proceedSeeField.call(this, 'negate', field, value);
  }

  /**
   * Verifies that the specified checkbox is checked.

```js
I.seeCheckboxIsChecked('Agree');
I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
```
@param field located by label|name|CSS|XPath|strict locator
   * Appium: not tested
   */
  seeCheckboxIsChecked(field) {
    return proceedSeeCheckbox.call(this, 'assert', field);
  }

  /**
   * Verifies that the specified checkbox is not checked.

@param field located by label|name|CSS|XPath|strict locator

   * Appium: not tested
   */
  dontSeeCheckboxIsChecked(field) {
    return proceedSeeCheckbox.call(this, 'negate', field);
  }

  /**
   * Checks that a given Element is visible
Element is located by CSS or XPath.

```js
I.seeElement('#modal');
```
@param locator located by CSS|XPath|strict locator
   * Appium: support
   */
  seeElement(locator) {
    return this._locate(locator, true).then((res) => {
      if (!res.value || res.value.length === 0) {
        return truth(`elements of ${locator}`, 'to be seen').assert(false);
      }
      let commands = [];
      res.value.forEach((el) => commands.push(this.browser.elementIdDisplayed(el.ELEMENT)));
      return this.browser.unify(commands, {
        extractValue: true
      }).then((selected) => {
        return truth(`elements of ${locator}`, 'to be seen').assert(selected);
      });
    });
  }

  /**
   * Opposite to `seeElement`. Checks that element is not visible

@param locator located by CSS|XPath|Strict locator
   * Appium: support
   */
  dontSeeElement(locator) {
    return this.browser.elements(withStrictLocator(locator)).then((res) => {
      if (!res.value || res.value.length === 0) {
        return truth(`elements of ${locator}`, 'to be seen').negate(false);
      }
      let commands = [];
      res.value.forEach((el) => commands.push(this.browser.elementIdDisplayed(el.ELEMENT)));
      return this.browser.unify(commands, {
        extractValue: true
      }).then((selected) => {
        return truth(`elements of ${locator}`, 'to be seen').negate(selected);
      });
    });
  }

  /**
   * Checks that a given Element is present in the DOM
Element is located by CSS or XPath.

```js
I.seeElementInDOM('#modal');
```
@param locator located by CSS|XPath|strict locator
   * Appium: support
   */
  seeElementInDOM(locator) {
    return this.browser.elements(withStrictLocator(locator)).then(function (res) {
      return empty('elements').negate(res.value);
    });
  }

  /**
   * Opposite to `seeElementInDOM`. Checks that element is not on page.

@param locator located by CSS|XPath|Strict locator
   * Appium: support
   */
  dontSeeElementInDOM(locator) {
    return this.browser.elements(withStrictLocator(locator)).then(function (res) {
      return empty('elements').assert(res.value);
    });
  }

  /**
   * Checks that the current page contains the given string in its raw source code.

```js
I.seeInSource('<h1>Green eggs &amp; ham</h1>');
```
@param text
   * Appium: support
   */
  seeInSource(text) {
    return this.browser.getSource().then((source) => {
      return stringIncludes('HTML source of a page').assert(text, source);
    });
  }

  /**
   * Checks that the current page contains the given string in its raw source code.

```js
I.seeInSource('<h1>Green eggs &amp; ham</h1>');
```
@param text
   * Appium: support
   */
  grabSource() {
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
  grabBrowserLogs() {
    return this.browser.log("browser").then((res) => {
      return res.value;
    });
  }

  /**
   * Checks that the current page contains the given string in its raw source code

@param text
   * Appium: support
   */
  dontSeeInSource(text) {
    return this.browser.getSource().then((source) => {
      return stringIncludes('HTML source of a page').negate(text, source);
    });
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
  seeNumberOfElements(selector, num) {
    return this._locate(withStrictLocator(selector))
      .then(function (res) {
        return assert.equal(res.value.length, num,
          `expected number of elements (${selector}) is ${num}, but found ${res.value.length}`);
      });
  }

  /**
   * asserts that an element is visible a given number of times
   * Element is located by CSS or XPath.
   *
   * ```js
   * I.seeNumberOfVisibleElements('.buttons', 3);
   * ```
   */
  seeNumberOfVisibleElements(locator, num) {
    return this.grabNumberOfVisibleElements(locator).then(function (res) {
      return assert.equal(res, num,
        `expected number of visible elements (${locator}) is ${num}, but found ${res}`);
    });
  }

  /**
   * Checks that all elements with given locator have given CSS properties.
   *
   * ```js
   * I.seeCssPropertiesOnElements('h3', { 'font-weight': "bold"});
   * ```
   */
  seeCssPropertiesOnElements(locator, cssProperties) {
    let client = this.browser;
    return this._locate(locator).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(locator);
      }
      let elemAmount = res.value.length;
      let commands = [];
      res.value.forEach((el) => {
        Object.keys(cssProperties).forEach((prop) => {
          commands.push(client.elementIdCssProperty(el.ELEMENT, prop));
        });
      });
      return client.unify(commands, {
        extractValue: true
      }).then((props) => {
        let values = Object.keys(cssProperties).map(function (key){
          return cssProperties[key];
        });
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
      });
    });
  }

  /**
   * Checks that all elements with given locator have given attributes.
   *
   * ```js
   * I.seeAttributesOnElements('//form', {'method': "post"});
   * ```
   */
  seeAttributesOnElements(locator, attributes) {
    let client = this.browser;
    return this._locate(locator).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(locator);
      }
      let elemAmount = res.value.length;
      let commands = [];
      res.value.forEach((el) => {
        Object.keys(attributes).forEach((attr) => {
          commands.push(client.elementIdAttribute(el.ELEMENT, attr));
        });
      });
      return client.unify(commands, {
        extractValue: true
      }).then((attrs) => {
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
      });
    });
  }

  /**
   * Grab number of visible elements by locator
   *
   * ```js
   * I.grabNumberOfVisibleElements('p');
   * ```
   */
  grabNumberOfVisibleElements(locator) {
    return this.browser.elements(withStrictLocator(locator)).then((res) => {
      if (!res.value || res.value.length === 0) {
        return 0;
      }
      let commands = [];
      res.value.forEach((el) => commands.push(this.browser.elementIdDisplayed(el.ELEMENT)));
      return this.browser.unify(commands, {
        extractValue: true
      }).then((selected) => {
        if (!Array.isArray(selected)) selected = [selected];
        selected = selected.filter((val) => val === true);
        return selected.length;
      });
    });
  }

  /**
   * Checks that current url contains a provided fragment.

```js
I.seeInCurrentUrl('/register'); // we are on registration page
```
@param url
   * Appium: support only web testing
   */
  seeInCurrentUrl(url) {
    return this.browser.url().then(function (res) {
      return stringIncludes('url').assert(url, decodeUrl(res.value));
    });
  }

  /**
   * Checks that current url does not contain a provided fragment.

@param url
   * Appium: support only web testing
   */
  dontSeeInCurrentUrl(url) {
    return this.browser.url().then(function (res) {
      return stringIncludes('url').negate(url, decodeUrl(res.value));
    });
  }

  /**
   * Checks that current url is equal to provided one.
If a relative url provided, a configured url will be prepended to it.
So both examples will work:

```js
I.seeCurrentUrlEquals('/register');
I.seeCurrentUrlEquals('http://my.site.com/register');
```
@param url
   * Appium: support only web testing
   */
  seeCurrentUrlEquals(url) {
    return this.browser.url().then((res) => {
      return urlEquals(this.options.url).assert(url, decodeUrl(res.value));
    });
  }

  /**
   * Checks that current url is not equal to provided one.
If a relative url provided, a configured url will be prepended to it.

@param url
   * Appium: support only web testing
   */
  dontSeeCurrentUrlEquals(url) {
    return this.browser.url().then((res) => {
      return urlEquals(this.options.url).negate(url, decodeUrl(res.value));
    });
  }

  /**
   * Executes sync script on a page.
Pass arguments to function as additional parameters.
Will return execution result to a test.
In this case you should use generator and yield to receive results.

Example with jQuery DatePicker:

```js
// change date of jQuery DatePicker
I.executeScript(function() {
  // now we are inside browser context
  $('date').datetimepicker('setDate', new Date());
});
```
Can return values. Don't forget to use `yield` to get them.

```js
let date = yield I.executeScript(function(el) {
  // only basic types can be returned
  return $(el).datetimepicker('getDate').toString();
}, '#date'); // passing jquery selector
```

@param fn function to be executed in browser context
@param ...args args to be passed to function

   * Appium: support only web testing
   *
   * Wraps [execute](http://webdriver.io/api/protocol/execute.html) command.
   */
  executeScript(fn) {
    return this.browser.execute.apply(this.browser, arguments).then((res) => res.value);
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
let val = yield I.executeAsyncScript(function(url, done) {
 // in browser context
 $.ajax(url, { success: (data) => done(data); }
}, 'http://ajax.callback.url/');
```

@param fn function to be executed in browser context
@param ...args args to be passed to function
   * Appium: support only web testing
   */
  executeAsyncScript(fn) {
    return this.browser.executeAsync.apply(this.browser, arguments).then((res) => res.value);
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
  scrollTo(locator, offsetX = 0, offsetY = 0) {
    let client = this.browser;

    if (typeof locator === 'number' && typeof offsetX === 'number') {
      offsetY = offsetX;
      offsetX = locator;
      locator = null;
    }

    if (locator) {
      return this._locate(withStrictLocator(locator), true).then(function (res) {
        if (!res.value || res.value.length === 0) {
          return truth(`elements of ${locator}`, 'to be seen').assert(false);
        }
        let elem = res.value[0];
        if (client.isMobile) return this.touchScroll(elem.ELEMENT, offsetX, offsetY);
        return client.elementIdLocation(elem.ELEMENT).then(function (location) {
          if (!location.value || location.value.length === 0) {
            throw new ElementNotFound(locator, "Failed to receive", "location");
          }
          return client.execute(function scroll(x, y) {
            return window.scrollTo(x, y);
          }, location.value.x + offsetX, location.value.y + offsetY);
        });
      });
    } else {
      if (client.isMobile) return client.touchScroll(locator, offsetX, offsetY);
      return client.execute(function scroll(x, y) {
        return window.scrollTo(x, y);
      }, offsetX, offsetY);
    }
  }

  /**
   * Moves cursor to element matched by locator.
Extra shift can be set with offsetX and offsetY options

```js
I.moveCursorTo('.tooltip');
I.moveCursorTo('#submit', 5,5);
```

   * Appium: support only web testing
   */
  moveCursorTo(locator, offsetX = 0, offsetY = 0) {
    let client = this.browser;
    var hasOffsetParams = true;
    if (typeof offsetX !== 'number' && typeof offsetY !== 'number') {
      hasOffsetParams = false;
    }

    return this._locate(withStrictLocator(locator), true).then((res) => {
      if (!res.value || res.value.length === 0) {
        return truth(`elements of ${locator}`, 'to be seen').assert(false);
      }
      let elem = res.value[0];
      if (client.isMobile) {
        return client.elementIdSize(elem.ELEMENT).then(function (size) {
          if (!size.value || size.value.length === 0) {
            throw new ElementNotFound(locator, "Failed to receive", "size");
          }
          return client.elementIdLocation(elem.ELEMENT).then(function (location) {
            if (!location.value || location.value.length === 0) {
              throw new ElementNotFound(locator, "Failed to receive", "location");
            }
            var x = location.value.x + size.value.width / 2;
            var y = location.value.y + size.value.height / 2;

            if (hasOffsetParams) {
              x = location.value.x + offsetX;
              y = location.value.y + offsetY;
            }
            return client.touchMove(x, y);
          });
        });
      }

      return client.moveTo(elem.ELEMENT, offsetX, offsetY);
    });
  }

  /**
   * Saves a screenshot to ouput folder (set in codecept.json).
Filename is relative to output folder. 
Optionally resize the window to the full available page `scrollHeight` and `scrollWidth` to capture the entire page by passing `true` in as the second argument.

```js
I.saveScreenshot('debug.png');
I.saveScreenshot('debug.png',true) \\resizes to available scrollHeight and scrollWidth before taking screenshot
```
@param fileName
@param fullPage (optional)
   * Appium: support
   */
  saveScreenshot(fileName, fullPage = false) {
    let outputFile = path.join(global.output_dir, fileName);

    if (!fullPage) {
      this.debug('Screenshot has been saved to ' + outputFile);
      return this.browser.saveScreenshot(outputFile);
    }
    return this.browser.execute(function () {
      return {
        height: document.body.scrollHeight,
        width: document.body.scrollWidth
      };
    }).then(({
               width,
               height
             }) => {
      this.browser.windowHandleSize(width, height);
      this.debug('Screenshot has been saved to ' + outputFile);
      return this.browser.saveScreenshot(outputFile);
    });
  }


  /**
   * Sets a cookie

```js
I.setCookie({name: 'auth', value: true});
```
@param cookie
   * Appium: support only web testing
   *
   * Uses Selenium's JSON [cookie
   * format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).
   */
  setCookie(cookie) {
    return this.browser.setCookie(cookie);
  }

  /**
   * Clears a cookie by name,
if none provided clears all cookies

```js
I.clearCookie();
I.clearCookie('test');
```
@param cookie (optional)
   * Appium: support only web testing
   */
  clearCookie(cookie) {
    return this.browser.deleteCookie(cookie);
  }

  /**
   * Clears a `<textarea>` or text `<input>` element's value.

```js
I.clearField('Email');
I.clearField('user[email]');
I.clearField('#email');
```
@param field located by label|name|CSS|XPath|strict locator
   * Appium: support
   */
  clearField(field) {
    return findFields.call(this, field).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(field, "Field");
      }
      let elem = res.value[0];
      return this.browser.elementIdClear(elem.ELEMENT);
    });

  }

  /**
   * Checks that cookie with given name exists.

```js
I.seeCookie('Auth');
```
@param name
   * Appium: support only web testing
   */
  seeCookie(name) {
    return this.browser.getCookie(name).then(function (res) {
      return truth('cookie ' + name, 'to be set').assert(res);
    });
  }

  /**
   * Checks that cookie with given name does not exist.

@param name
   * Appium: support only web testing
   */
  dontSeeCookie(name) {
    return this.browser.getCookie(name).then(function (res) {
      return truth('cookie ' + name, 'to be set').negate(res);
    });
  }

  /**
   * Gets a cookie object by name
* Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let cookie = I.grabCookie('auth');
assert(cookie.value, '123456');
```
@param name
   * Appium: support only web testing
   */
  grabCookie(name) {
    return this.browser.getCookie(name);
  }

  /**
   * Accepts the active JavaScript native popup window, as created by window.alert|window.confirm|window.prompt.
   * Don't confuse popups with modal windows, as created by [various
   * libraries](http://jster.net/category/windows-modals-popups). Appium: support only web testing
   */
  acceptPopup() {
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
  cancelPopup() {
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
  seeInPopup(text) {
    return this.browser.alertText().then(function (res) {
      if (res === null) {
        throw new Error('Popup is not opened');
      }
      stringIncludes('text in popup').assert(text, res);
    });
  }

  /**
   * Presses a key on a focused element.
Speical keys like 'Enter', 'Control', [etc](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value)
will be replaced with corresponding unicode.
If modifier key is used (Control, Command, Alt, Shift) in array, it will be released afterwards.

```js
I.pressKey('Enter');
I.pressKey(['Control','a']);
```
@param key

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
  pressKey(key) {
    let modifier;
    if (Array.isArray(key) && ~['Control', 'Command', 'Shift', 'Alt'].indexOf(key[0])) {
      modifier = key[0];
    }
    return this.browser.keys(key).then(function () {
      if (!modifier) return true;
      return this.keys(modifier); // release modifier
    });
  }

  /**
   * Resize the current window to provided width and height.
First parameter can be set to `maximize`

@param width or `maximize`
@param height
   * Appium: not tested in web, in apps doesn't work
   */
  resizeWindow(width, height) {
    if (width === 'maximize') {
      return this.browser.execute('return [screen.width, screen.height]').then((res) => {
        return this.browser.windowHandleSize({
          width: res.value[0],
          height: res.value[1]
        });
      });
    }
    return this.browser.windowHandleSize({
      width,
      height
    });
  }

  /**
   * Drag an item to a destination element.
   * Appium: not tested
   *
   * ```js
   * I.dragAndDrop('#dragHandle', '#container');
   * ```
   */
  dragAndDrop(srcElement, destElement) {
    let client = this.browser;
    let this2 = this;


    if (client.isMobile) {
      return client.element(withStrictLocator(srcElement)).then(function (res) {
        if (!res.value || res.value.length === 0) return truth(`elements of ${srcElement}`, 'to be seen').assert(false);
        let elem = res.value;
        return this.elementIdLocation(elem.ELEMENT).then(function (location) {
          if (!location.value || location.value.length === 0) {
            throw new Error(
              `Failed to receive (${srcElement}) location`);
          }
          return this.touchDown(location.value.x, location.value.y).then(function (res) {
            if (res.state !== 'success') throw new Error(`Failed to touch button down on (${srcElement})`);
            return client.element(withStrictLocator(destElement)).then(function (res) {
              if (!res.value || res.value.length === 0) {
                return truth(`elements of ${destElement}`, 'to be seen')
                  .assert(false);
              }
              elem = res.value;
              return this.elementIdLocation(elem.ELEMENT).then(function (location) {
                if (!location.value || location.value.length === 0) {
                  throw new Error(
                  `Failed to receive (${destElement}) location`);
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

    return this2.moveCursorTo(withStrictLocator(srcElement)).then(function (res) {
      if (res.state !== 'success') throw new Error(`Unable to move cursor to (${srcElement})`);
      return this.buttonDown().then(function (res) {
        if (res.state !== 'success') throw new Error(`Failed to press button down on (${srcElement})`);
        return this2.moveCursorTo(withStrictLocator(destElement)).then(function (res) {
          if (res.state !== 'success') throw new Error(`Unable to move cursor to (${destElement})`);
          return this.buttonUp();
        });
      });
    });
  }


  /**
   * Close all tabs expect for one.
   * Appium: support web test
   *
   * ```js
   * I.closeOtherTabs();
   * ```
   */
  closeOtherTabs() {
    let client = this.browser;
    return client.getTabIds().then(function (handles) {
      let mainHandle = handles[0];
      let p = Promise.resolve();
      handles.shift();
      handles.forEach(function (handle) {
        p = p.then(() => {
          return client.switchTab(handle).then(() => client.close(mainHandle));
        });
      });
      return p;
    });
  }

  /**
   * Pauses execution for a number of seconds.

```js
I.wait(2); // wait 2 secs
```

@param sec
   * Appium: support
   */
  wait(sec) {
    return this.browser.pause(sec * 1000);
  }

  /**
   * Waits for element to become enabled (by default waits for 1sec).
Element can be located by CSS or XPath.

@param locator element located by CSS|XPath|strict locator
@param sec time seconds to wait, 1 by default
   * Appium: support
   */
  waitForEnabled(locator, sec = null) {
    let client = this.browser;
    let aSec = sec || this.options.waitForTimeout;
    return client.waitUntil(function () {
      return client.elements(withStrictLocator(locator)).then(function (res) {
        if (!res.value || res.value.length === 0) {
          return false;
        }
        let commands = [];
        res.value.forEach((el) => commands.push(client.elementIdEnabled(el.ELEMENT)));
        return client.unify(commands, {
          extractValue: true
        }).then((selected) => {
          if (Array.isArray(selected)) {
            return selected.filter((val) => val === true).length > 0;
          }
          return selected;
        });
      });
    }, aSec * 1000, `element (${locator}) still not enabled after ${aSec} sec`);
  }

  /**
   * Waits for element to be present on page (by default waits for 1sec).
Element can be located by CSS or XPath.

```js
I.waitForElement('.btn.continue');
I.waitForElement('.btn.continue', 5); // wait for 5 secs
```

@param locator element located by CSS|XPath|strict locator
@param sec time seconds to wait, 1 by default
   * Appium: support
   */
  waitForElement(locator, sec = null) {
    let client = this.browser;
    let aSec = sec || this.options.waitForTimeout;
    return client.waitUntil(function () {
      return client.elements(withStrictLocator(locator)).then(function (res) {
        if (!res.value || res.value.length === 0) {
          return false;
        } else return true;
      });
    }, aSec * 1000, `element (${locator}) still not present on page after ${aSec} sec`);
  }

  /**
   * Waits for element not to be present on page (by default waits for 1sec).
Element can be located by CSS or XPath.

```js
I.waitUntilExists('.btn.continue');
I.waitUntilExists('.btn.continue', 5); // wait for 5 secs
```

@param locator element located by CSS|XPath|strict locator
@param sec time seconds to wait, 1 by default

   * Appium: support
   */
  waitUntilExists(locator, sec = null) {
    let client = this.browser;
    sec = sec || this.options.waitForTimeout;
    return client.waitUntil(function () {
      return client.elements(withStrictLocator(locator)).then(function (res) {
        if (!res.value || res.value.length === 0) {
          return true;
        } else return false;
      });
    }, sec * 1000, `element (${locator}) still present on page after ${sec} sec`);
  }


  /**
   * Waiting for the part of the URL to match the expected. Useful for SPA to understand that page was changed.
   *
   * ```js
   * I.waitInUrl('/info', 2);
   * ```
   */
  waitInUrl(urlPart, sec = null) {
    let client = this.browser;
    let aSec = sec || this.options.waitForTimeout;
    let currUrl = "";
    return client
      .waitUntil(function () {
        return this.url().then(function (res) {
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
  waitUrlEquals(urlPart, sec = null) {
    let client = this.browser;
    let aSec = sec || this.options.waitForTimeout;
    let baseUrl = this.options.url;
    if (urlPart.indexOf('http') < 0) {
      urlPart = baseUrl + urlPart;
    }
    let currUrl = "";
    return client
      .waitUntil(function () {
        return this.url().then(function (res) {
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

@param text to wait for
@param sec seconds to wait
@param context element located by CSS|XPath|strict locator
   * Appium: support
   */
  waitForText(text, sec = null, aContext = null) {
    let client = this.browser;
    let aSec = sec || this.options.waitForTimeout;
    let context = aContext || this.root;
    return client.waitUntil(function () {
      return client.elements(withStrictLocator(context)).then(function (res) {
        if (!res.value || res.value.length === 0) {
          return false;
        }
        let commands = [];
        res.value.forEach((el) => commands.push(client.elementIdText(el.ELEMENT)));
        return client.unify(commands, {
          extractValue: true
        }).then((selected) => {
          if (Array.isArray(selected)) {
            return selected.filter(part => part.indexOf(text) >= 0).length > 0;
          }
          return selected.indexOf(text) >= 0;
        });
      });
    }, aSec * 1000,
      `element (${context}) is not in DOM or there is no element(${context}) with text "${text}" after ${aSec} sec`);
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
  waitForValue(field, value, sec = null) {
    let client = this.browser;
    let aSec = sec || this.options.waitForTimeout;
    return client.waitUntil(() => {
      return findFields.call(this, field).then((res) => {
        if (!res.value || res.value.length === 0) {
          return false;
        }
        let commands = [];
        res.value.forEach((el) => commands.push(this.browser.elementIdAttribute(el.ELEMENT, "value")));
        return this.browser.unify(commands, {
          extractValue: true
        }).then((selected) => {
          if (Array.isArray(selected)) {
            return selected.filter(part => part.indexOf(value) >= 0).length > 0;
          }
          return selected.indexOf(value) >= 0;
        });
      });
    }, aSec * 1000,
      `element (${field}) is not in DOM or there is no element(${field}) with value "${value}" after ${aSec} sec`);
  }

  /**
   * Waits for an element to become visible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

```
I.waitForVisible('#popup');
```

@param locator element located by CSS|XPath|strict locator
@param sec time seconds to wait, 1 by default
   * Appium: support
   */
  waitForVisible(locator, sec = null) {
    let client = this.browser;
    let aSec = sec || this.options.waitForTimeout;
    return client.waitUntil(function () {
      return client.elements(withStrictLocator(locator)).then(function (res) {
        if (!res.value || res.value.length === 0) {
          return false;
        }
        let commands = [];
        res.value.forEach((el) => commands.push(client.elementIdDisplayed(el.ELEMENT)));
        return client.unify(commands, {
          extractValue: true
        }).then((selected) => {
          if (Array.isArray(selected)) {
            return selected.filter((val) => val === true).length > 0;
          }
          return selected;
        });
      });
    }, aSec * 1000, `element (${locator}) still not visible after ${aSec} sec`);
  }

  /**
   * Waits for a specified number of elements on the page
   *
   * ```js
   * I.waitNumberOfVisibleElements('a', 3);
   * ```
   */
  waitNumberOfVisibleElements(locator, num, sec = null) {
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
      });
    }, aSec * 1000, `The number of elements ${locator} is not ${num} after ${aSec} sec`);
  }

  /**
   * Waits for an element to become invisible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

```
I.waitForInvisible('#popup');
```

@param locator element located by CSS|XPath|strict locator
@param sec time seconds to wait, 1 by default

   * Appium: support
   */
  waitForInvisible(locator, sec = null) {
    let client = this.browser;
    let aSec = sec || this.options.waitForTimeout;
    return client.waitUntil(function () {
      return client.elements(withStrictLocator(locator)).then(function (res) {
        if (!res.value || res.value.length === 0) {
          return true;
        }
        let commands = [];
        res.value.forEach((el) => commands.push(client.elementIdDisplayed(el.ELEMENT)));
        return client.unify(commands, {
          extractValue: true
        }).then((selected) => {
          if (Array.isArray(selected)) {
            return selected.filter((val) => val === false).length > 0;
          }
          return !selected;
        });
      });
    }, aSec * 1000, `element (${locator}) still visible after ${aSec}sec`);
  }

  /**
   * Waits for an element to become invisible on a page (by default waits for 1sec).
   * Element can be located by CSS or XPath.
   * Appium: support
   */
  waitToHide(locator, sec = null) {
    return this.waitForInvisible(locator, sec);
  }

  /**
   * Waits for an element to become not attached to the DOM on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

```
I.waitForStalenessOf('#popup');
```

@param locator element located by CSS|XPath|strict locator
@param sec time seconds to wait, 1 by default

   * Appium: support
   */
  waitForStalenessOf(locator, sec = null) {
    let client = this.browser;
    let aSec = sec || this.options.waitForTimeout;
    return client.waitUntil(function () {
      return client.elements(withStrictLocator(locator)).then(function (res) {
        if (!res.value || res.value.length === 0) {
          return true;
        } else return false;
      });
    }, aSec * 1000, `element (${locator}) still attached to the DOM after ${aSec} sec`);
  }

  /**
   * Waits for a function to return true (waits for 1sec by default).
   * Appium: support
   */
  waitUntil(fn, sec = null, timeoutMsg = null) {
    let aSec = sec || this.options.waitForTimeout;
    return this.browser.waitUntil(fn, aSec, timeoutMsg);
  }

  /**
   * Switches frame or in case of null locator reverts to parent.
   * Appium: support only web testing
   */
  switchTo(locator) {
    if (!locator) {
      return this.browser.frame(null);
    } else if (Number.isInteger(locator)) {
      return this.browser.frame(locator);
    }
    return this.browser.element(withStrictLocator(locator)).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(locator);
      }
      return this.browser.frame(res.value);
    });
  }

  /**
   * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab
   *
   * ```js
   * I.switchToNextTab();
   * I.switchToNextTab(2);
   * ```
   */
  switchToNextTab(num = 1, sec = null) {
    let aSec = sec || this.options.waitForTimeout;
    let client = this.browser;
    return client
      .waitUntil(function () {
        return this.getTabIds().then(function (handles) {
          return this.getCurrentTabId().then(function (current) {
            if (handles.indexOf(current) + num + 1 <= handles.length) {
              return this.switchTab(
              handles[handles.indexOf(current) + num]);
            } else return false;
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
  switchToPreviousTab(num = 1, sec = null) {
    let aSec = sec || this.options.waitForTimeout;
    let client = this.browser;
    return client
      .waitUntil(function () {
        return this.getTabIds().then(function (handles) {
          return this.getCurrentTabId().then(function (current) {
            if (handles.indexOf(current) - num > -1) return this.switchTab(handles[handles.indexOf(current) - num]);
            else return false;
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
  closeCurrentTab() {
    let client = this.browser;
    return client.close();
  }

  /**
   * Open new tab and switch to it
   *
   * ```js
   * I.openNewTab();
   * ```
   */
  openNewTab() {
    let client = this.browser;
    return client.newWindow('about:blank');
  }

  /**
   * Refresh the current page.
   *
   * ```js
   * I.refreshPage();
   * ```
   */
  refreshPage() {
    let client = this.browser;
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
    let client = this.browser;
    return client.execute(function () {
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
    let client = this.browser;
    return client.execute(function () {
      var body = document.body,
        html = document.documentElement;
      window.scrollTo(0, Math.max(body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight));
    });
  }

}

function proceedSee(assertType, text, context, strict = false) {
  let description;
  if (!context) {
    if (this.context === webRoot) {
      context = this.context;
      description = 'web page';
    } else {
      description = 'current context ' + this.context;
      context = './/*';
    }
  } else {
    description = 'element ' + context;
  }

  let smartWaitEnabled = assertType === 'assert';

  return this._locate(withStrictLocator(context), smartWaitEnabled).then((res) => {
    if (!res.value || res.value.length === 0) {
      throw new ElementNotFound(context);
    }
    let commands = [];
    res.value.forEach((el) => commands.push(this.browser.elementIdText(el.ELEMENT)));
    return this.browser.unify(commands, {
      extractValue: true
    }).then((selected) => {
      if (strict) return equals(description)[assertType](text, selected);
      return stringIncludes(description)[assertType](text, selected);
    });
  });
}

function findClickable(locator, locateFn) {
  if (typeof locator === 'object') return locateFn(withStrictLocator(locator), true);
  if (isCSSorXPathLocator(locator)) return locateFn(locator, true);

  let literal = xpathLocator.literal(locator);

  let narrowLocator = xpathLocator.combine([
    `.//a[normalize-space(.)=${literal}]`,
    `.//button[normalize-space(.)=${literal}]`,
    `.//a/img[normalize-space(@alt)=${literal}]/ancestor::a`,
    `.//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][normalize-space(@value)=${literal}]`
  ]);
  return locateFn(narrowLocator).then(function (els) {
    if (els.value.length) {
      return els;
    }
    let wideLocator = xpathLocator.combine([
      `.//a[./@href][((contains(normalize-space(string(.)), ${literal})) or .//img[contains(./@alt, ${literal})])]`,
      `.//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][contains(./@value, ${literal})]`,
      `.//input[./@type = 'image'][contains(./@alt, ${literal})]`,
      `.//button[contains(normalize-space(string(.)), ${literal})]`,
      `.//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][./@name = ${literal}]`,
      `.//button[./@name = ${literal}]`
    ]);
    return locateFn(wideLocator).then(function (els) {
      if (els.value.length) {
        return els;
      }
      let selfLocator = xpathLocator.combine([
        `./self::*[contains(normalize-space(string(.)), ${literal}) or contains(normalize-space(@value), ${literal})]`
      ]);
      return locateFn(selfLocator).then(function (els) {
        if (els.value.length) {
          return els;
        }
        return locateFn(locator); // by css or xpath
      });
    });
  });
}

function toStrictLocator(locator) {
  if (locator[0] == '#') return;
}

function findFields(locator) {
  if (typeof locator === 'object') return this._locate(withStrictLocator(locator), true);
  if (isCSSorXPathLocator(locator)) return this._locate(locator, true);

  let literal = xpathLocator.literal(locator);
  let byText = xpathLocator.combine([
    `.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')][(((./@name = ${literal}) or ./@id = //label[contains(normalize-space(string(.)), ${literal})]/@for) or ./@placeholder = ${literal})]`,
    `.//label[contains(normalize-space(string(.)), ${literal})]//.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')]`
  ]);
  return this._locate(byText).then((els) => {
    if (els.value.length) return els;
    let byName = `.//*[self::input | self::textarea | self::select][@name = ${literal}]`;
    return this._locate(byName).then((els) => {
      if (els.value.length) return els;
      return this._locate(locator); // by css or xpath
    });
  });
}

function proceedSeeField(assertType, field, value) {
  return findFields.call(this, field).then((res) => {
    if (!res.value || res.value.length === 0) {
      throw new ElementNotFound(field, "Field");
    }

    var proceedMultiple = (fields) => {
      let commands = [];
      fields.forEach((el) => commands.push(this.browser.elementIdSelected(el.ELEMENT)));
      this.browser.unify(commands).then(() => {
        commands = [];
        fields.forEach((el) => {
          if (el.value === false) return;
          commands.push(this.browser.elementIdAttribute(el.ELEMENT, 'value'));
        });
        this.browser.unify(commands, {
          extractValue: true
        }).then((val) => {
          return stringIncludes('fields by ' + field)[assertType](value, val);
        });
      });
    };

    var proceedSingle = (el) => {
      return this.browser.elementIdAttribute(el.ELEMENT, 'value').then((res) => {
        return stringIncludes('fields by ' + field)[assertType](value, res.value);
      });
    };

    return this.browser.elementIdName(res.value[0].ELEMENT).then((tag) => {
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
    });
  });
}

function proceedSeeCheckbox(assertType, field) {
  return findFields.call(this, field).then((res) => {
    if (!res.value || res.value.length === 0) {
      throw new ElementNotFound(field, "Field");
    }
    let commands = [];
    res.value.forEach((el) => commands.push(this.browser.elementIdSelected(el.ELEMENT)));
    return this.browser.unify(commands, {
      extractValue: true
    }).then((selected) => {
      return truth(`checkable field ${field}`, 'to be checked')[assertType](selected);
    });
  });
}

function findCheckable(locator, locateFn) {
  if (typeof locator === 'object') return locateFn(withStrictLocator(locator), true);
  if (isCSSorXPathLocator(locator)) return locateFn(locator, true);

  let literal = xpathLocator.literal(locator);
  let byText = xpathLocator.combine([
    `.//input[@type = 'checkbox' or @type = 'radio'][(@id = //label[contains(normalize-space(string(.)), ${literal})]/@for) or @placeholder = ${literal}]`,
    `.//label[contains(normalize-space(string(.)), ${literal})]//input[@type = 'radio' or @type = 'checkbox']`
  ]);
  return locateFn(byText).then(function (els) {
    if (els.value.length) return els;
    let byName = `.//input[@type = 'checkbox' or @type = 'radio'][@name = ${literal}]`;
    return locateFn(byName).then(function (els) {
      if (els.value.length) return els;
      return locateFn(locator); // by css or xpath
    });
  });
}

function isCSSorXPathLocator(locator) {
  if (locator[0] === '#' || locator[0] === '.') {
    return true;
  }
  if (locator.substr(0, 2) === '//') {
    return true;
  }
  return false;
}

function withStrictLocator(locator) {
  if (!locator) return null;
  if (typeof locator !== 'object') return locator;
  let key = Object.keys(locator)[0];
  let value = locator[key];

  locator.toString = () => `{${key}: '${value}'}`;

  switch (key) {
  case 'by':
  case 'xpath':
    return value;
  case 'css':
    return value;
  case 'id':
    return '#' + value;
  case 'name':
    return `[name="${value}"]`;
  }
}

function isFrameLocator(locator) {
  if (typeof locator !== 'object') return false;
  let key = Object.keys(locator)[0];
  if (key !== 'frame') return false;
  return locator[key];
}

function prepareLocateFn(context) {
  if (!context) return this._locate.bind(this);
  let el;
  return (l) => {
    if (el) return this.browser.elementIdElements(el, l);
    return this._locate(context, true).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new ElementNotFound(context, "Context element");
      }
      return this.browser.elementIdElements(el = res.value[0].ELEMENT, l);
    });
  };
}

module.exports = WebDriverIO;
