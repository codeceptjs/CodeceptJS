'use strict';
let By, EC, Runner;

const requireg = require('requireg');
const SeleniumWebdriver = require('./SeleniumWebdriver');
const stringIncludes = require('../assert/include').includes;
const urlEquals = require('../assert/equal').urlEquals;
const equals = require('../assert/equal').equals;
const empty = require('../assert/empty').empty;
const truth = require('../assert/truth').truth;
const xpathLocator = require('../utils').xpathLocator;
const fileExists = require('../utils').fileExists;
const co = require('co');
const path = require('path');
const recorder = require('../recorder');

let withinStore = {};

/**
 * Protractor helper is based on [Protractor library](http://www.protractortest.org) and used for testing AngularJS applications.
 *
 * #### Selenium Installation
 *
 * 1. Download [Selenium Server](http://docs.seleniumhq.org/download/)
 * 2. Launch the daemon: `java -jar selenium-server-standalone-2.xx.xxx.jar`
 *
 * #### PhantomJS Installation
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
 * * `driver` - which protrator driver to use (local, direct, session, hosted, sauce, browserstack). By default set to 'hosted' which requires selenium server to be started.
 * * `restart` (optional, default: true) - restart browser between tests.
 * * `seleniumAddress` - Selenium address to connect (default: http://localhost:4444/wd/hub)
 * * `rootElement` - Root element of AngularJS application (default: body)
 * * `waitForTimeout`: (optional) sets default wait time in _ms_ for all `wait*` functions. 1000 by default.
 * * `scriptsTimeout`: (optional) timeout in milliseconds for each script run on the browser, 10000 by default.
 * * `windowSize`: (optional) default window size. Set to `maximize` or a dimension in the format `640x480`.
 * * `manualStart` (optional, default: false) - do not start browser before a test, start it manually inside a helper with `this.helpers["WebDriverIO"]._startBrowser()`
 * * `capabilities`: {} - list of [Desired Capabilities](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities)
 * * `proxy`: set proxy settings
 *
 * other options are the same as in [Protractor config](https://github.com/angular/protractor/blob/master/docs/referenceConf.js).
 *
 * ## Access From Helpers
 *
 * Receive a WebDriverIO client from a custom helper by accessing `browser` property:
 *
 * ```js
 * this.helpers['Protractor'].browser
 * ```
 */
class Protractor extends SeleniumWebdriver {

  constructor(config) {
    super(config);
    this.options = {
      browser: 'firefox',
      url: 'http://localhost',
      seleniumAddress: 'http://localhost:4444/wd/hub',
      rootElement: 'body',
      scriptsTimeout: 10000,
      waitForTimeout: 1000, // ms
      windowSize: null,
      driver: 'hosted',
      capabilities: {}
    };


    this.options = Object.assign(this.options, config);
    if (!this.options.allScriptsTimeout) this.options.allScriptsTimeout = this.options.scriptsTimeout;
    if (this.options.proxy) this.options.capabilities.proxy = this.options.proxy;
    if (this.options.browser) this.options.capabilities.browserName = this.options.browser;
    this.options.waitForTimeout /= 1000; // convert to seconds
  }

  _init() {
    Runner = require('protractor/built/runner').Runner;
    By = require('protractor').ProtractorBy;
    this.isProtractor5 = !require('protractor').wrapDriver;

    try {
      // get selenium-webdriver
      this.webdriver = requireg('selenium-webdriver');
    } catch (e) {
       // maybe it is installed as protractor dependency?
      this.webdriver = requireg('protractor/node_modules/selenium-webdriver');
    }
  }

  static _checkRequirements() {
    try {
      requireg("protractor");
      require('assert').ok(requireg("protractor/built/runner").Runner);
    } catch(e) {
      return ["protractor@^5.0.0"];
    }
  }

  static _config() {
    return [
      { name: 'url', message: "Base url of site to be tested", default: 'http://localhost' },
      { name: 'driver', message: "Protractor driver (local, direct, session, hosted, sauce, browserstack)", default: 'hosted' },
      { name: 'browser', message: 'Browser in which testing will be performed', default: 'firefox' },
      { name: 'rootElement', message: "Root element of AngularJS application", default: 'body' },
    ];
  }

  _startBrowser() {
    let runner = new Runner(this.options);
    this.browser = runner.createBrowser();

    global.browser = this.browser;
    global.$ = this.browser.$;
    global.$$ = this.browser.$$;
    global.element = this.browser.element;
    global.by = global.By = new By();
    global.ExpectedConditions = EC = this.browser.ExpectedConditions;

    if (this.options.windowSize == 'maximize') {
      this.resizeWindow(this.options.windowSize);
    }

    if (this.options.windowSize) {
      var size = this.options.windowSize.split('x');
      this.resizeWindow(parseInt(size[0]), parseInt(size[1]));
    }

    return this.browser;
  }

  _before() {
    super._before();
    this.amInsideAngularApp();
    this.context = this.options.rootElement;
    return this.browser;
  }

  _withinBegin(locator) {
    withinStore.elFn = this.browser.findElement;
    withinStore.elsFn = this.browser.findElements;

    this.context = locator;
    if (this.insideAngular) {
      let context = element(guessLocator(locator) || by.css(locator));

      this.browser.findElement = (l) => l ? context.element(l).getWebElement() : context.getWebElement();
      this.browser.findElements = (l) => context.all(l).getWebElements();
      return context;
    }
    return super._withinBegin(locator);
  }

  _withinEnd() {
    this.browser.findElement = withinStore.elFn;
    this.browser.findElements = withinStore.elsFn;
    this.context = this.options.rootElement;
  }

  /**
   * Get elements by different locator types, including strict locator
   * Should be used in custom helpers:
   *
   * ```js
   * this.helpers['Protractor']._locate({model: 'newTodo'}).then //...
   * ```
   */
  _locate(locator) {
    return this.browser.findElements(guessLocator(locator));
  }

  /**
   * Switch to non-Angular mode,
   * start using WebDriver instead of Protractor in this session
   */
  amOutsideAngularApp() {
    if (!this.browser) return;
    this.browser.ignoreSynchronization = true;
    return Promise.resolve(this.insideAngular = false);
  }

  /**
   * Enters Angular mode (switched on by default)
   * Should be used after "amOutsideAngularApp"
   */
  amInsideAngularApp() {
    if (this.browser.driver && this.insideAngular) {
      return; // already inside angular
    }
    this.browser.ignoreSynchronization = false;
    return Promise.resolve(this.insideAngular = true);
  }

  /**
   * {{> ../webapi/waitForElement }}
   */
  waitForElement(locator, sec) {
    sec = sec || this.options.waitForTimeout;
    let el = element(guessLocator(locator) || by.css(locator));
    return this.browser.wait(EC.presenceOf(el), sec * 1000);
  }

  /**
   * Waits for element to become clickable for number of seconds.
   */
  waitForClickable(locator, sec) {
    sec = sec || this.options.waitForTimeout;
    let el = element(guessLocator(locator) || by.css(locator));
    return this.browser.wait(EC.elementToBeClickable(el), sec * 1000);
  }

  /**
   * {{> ../webapi/waitForVisible }}
   */
  waitForVisible(locator, sec) {
    sec = sec || this.options.waitForTimeout;
    let el = element(guessLocator(locator) || by.css(locator));
    return this.browser.wait(EC.visibilityOf(el), sec * 1000);
  }

  /**
   * {{> ../webapi/waitForInvisible }}
   */
  waitForInvisible(locator, sec) {
    sec = sec || this.options.waitForTimeout;
    let el = element(guessLocator(locator) || by.css(locator));
    return this.browser.wait(EC.invisibilityOf(el), sec * 1000);
  }

  /**
   * {{> ../webapi/waitForStalenessOf }}
   */
  waitForStalenessOf(locator, sec) {
    return this.waitForInvisible(locator, sec);
  }

  /**
   * {{> ../webapi/waitForText }}
   */
  waitForText(text, sec, context) {
    if (!context) {
      context = this.context;
    }
    let el = element(guessLocator(context) || by.css(context));
    sec = sec || this.options.waitForTimeout;
    return this.browser.wait(EC.textToBePresentInElement(el, text), sec * 1000);
  }

  // ANGULAR SPECIFIC

  /**
   * Moves to url
   */
  moveTo(path) {
    return this.browser.setLocation(path);
  }

  /**
   * Reloads page
   */
  refresh() {
    return this.browser.refresh();
  }

  /**
   * Injects Angular module.
   *
   * ```js
   * I.haveModule('modName', function() {
   *   angular.module('modName', []).value('foo', 'bar');
   * });
   * ```
   */
  haveModule(modName, fn) {
    return this.browser.addMockModule(modName, fn);
  }

  /**
   * Removes mocked Angular module. If modName not specified - clears all mock modules.
   *
   * ```js
   * I.resetModule(); // clears all
   * I.resetModule('modName');
   * ```
   */
  resetModule(modName) {
    if (!modName) {
      return this.browser.clearMockModules();
    }
    return this.browser.removeMockModule(modName);
  }

  setCookie(cookie) {
    if (this.isProtractor5) {
      return this.browser.manage().addCookie(cookie);
    }
    return super.setCookie(cookie);
  }
}

module.exports = Protractor;

function guessLocator(locator) {
  if (!locator) {
    return;
  }
  if (typeof locator === 'object') {
    let key = Object.keys(locator)[0];
    let value = locator[key];
    return by[key](value);
  }
  if (isCSS(locator)) {
    return by.css(locator);
  }
  if (isXPath(locator)) {
    return by.xpath(locator);
  }
}

function isCSS(locator) {
  return locator[0] === '#' || locator[0] === '.';
}

function isXPath(locator) {
  return locator.substr(0, 2) === '//' || locator.substr(0, 3) === './/';
}

// docs for inherited methods

/**
 * {{> ../webapi/amOnPage }}
 *
 * @name amOnPage
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _amOnPage;

/**
 * {{> ../webapi/appendField }}
 *
 * @name appendField
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _appendField;

/**
 * {{> ../webapi/attachFile }}
 *
 * @name attachFile
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _attachFile;

/**
 * {{> ../webapi/checkOption }}
 *
 * @name checkOption
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _checkOption;

/**
 * {{> ../webapi/clearCookie }}
 *
 * @name clearCookie
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _clearCookie;

/**
 * {{> ../webapi/click }}
 *
 * @name click
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _click;

/**
 * {{> ../webapi/dontSeeCheckboxIsChecked }}
 *
 * @name dontSeeCheckboxIsChecked
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _dontSeeCheckboxIsChecked;

/**
 * {{> ../webapi/dontSeeCookie }}
 *
 * @name dontSeeCookie
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _dontSeeCookie;

/**
 * {{> ../webapi/dontSeeCurrentUrlEquals }}
 *
 * @name dontSeeCurrentUrlEquals
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _dontSeeCurrentUrlEquals;

/**
 * {{> ../webapi/dontSeeElement }}
 *
 * @name dontSeeElement
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _dontSeeElement;

/**
 * {{> ../webapi/dontSeeInCurrentUrl }}
 *
 * @name dontSeeInCurrentUrl
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _dontSeeInCurrentUrl;

/**
 * {{> ../webapi/dontSeeInField }}
 *
 * @name dontSeeInField
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _dontSeeInField;

/**
 * {{> ../webapi/dontSeeInSource }}
 *
 * @name dontSeeInSource
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _dontSeeInSource;

/**
 * {{> ../webapi/dontSeeInTitle }}
 *
 * @name dontSeeInTitle
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _dontSeeInTitle;

/**
 * {{> ../webapi/dontSee }}
 *
 * @name dontSee
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _dontSee;

/**
 * {{> ../webapi/executeAsyncScript }}
 *
 * @name executeAsyncScript
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _executeAsyncScript;

/**
 * {{> ../webapi/executeScript }}
 *
 * @name executeScript
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _executeScript;

/**
 * {{> ../webapi/fillField }}
 *
 * @name fillField
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _fillField;

/**
 * {{> ../webapi/grabAttributeFrom }}
 *
 * @name grabAttributeFrom
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _grabAttributeFrom;

/**
 * {{> ../webapi/grabCookie }}
 *
 * @name grabCookie
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _grabCookie;

/**
 * {{> ../webapi/grabTextFrom }}
 *
 * @name grabTextFrom
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _grabTextFrom;

/**
 * {{> ../webapi/grabTitle }}
 *
 * @name grabTitle
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _grabTitle;

/**
 * {{> ../webapi/grabValueFrom }}
 *
 * @name grabValueFrom
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _grabValueFrom;

/**
 * {{> ../webapi/pressKey }}
 *
 * @name pressKey
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _pressKey;

/**
 * {{> ../webapi/resizeWindow }}
 *
 * @name resizeWindow
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _resizeWindow;

/**
 * {{> ../webapi/saveScreenshot }}
 *
 * @name saveScreenshot
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _saveScreenshot;

/**
 * {{> ../webapi/seeCheckboxIsChecked }}
 *
 * @name seeCheckboxIsChecked
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _seeCheckboxIsChecked;

/**
 * {{> ../webapi/seeCookie }}
 *
 * @name seeCookie
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _seeCookie;

/**
 * {{> ../webapi/seeCurrentUrlEquals }}
 *
 * @name seeCurrentUrlEquals
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _seeCurrentUrlEquals;

/**
 * {{> ../webapi/seeElement }}
 *
 * @name seeElement
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _seeElement;

/**
 * {{> ../webapi/seeInCurrentUrl }}
 *
 * @name seeInCurrentUrl
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _seeInCurrentUrl;

/**
 * {{> ../webapi/seeInField }}
 *
 * @name seeInField
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _seeInField;

/**
 * {{> ../webapi/seeInSource }}
 *
 * @name seeInSource
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _seeInSource;

/**
 * {{> ../webapi/seeInTitle }}
 *
 * @name seeInTitle
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _seeInTitle;

/**
 * {{> ../webapi/see }}
 *
 * @name see
 * @kind function
 * @memberof Protractor
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

/**
 * {{> ../webapi/setCookie }}
 *
 * @name setCookie
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _setCookie;
