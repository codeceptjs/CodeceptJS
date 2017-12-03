<<<<<<< HEAD
let By;
let EC;
let Runner;
=======
'use strict';
let By;
let EC;
let Runner;
let Key;
>>>>>>> refactored Protractor helper

const requireg = require('requireg');
<<<<<<< HEAD
const SeleniumWebdriver = require('./SeleniumWebdriver');
=======
const Helper = require('../helper');
const stringIncludes = require('../assert/include').includes;
const { urlEquals, equals } = require('../assert/equal');
const empty = require('../assert/empty').empty;
const truth = require('../assert/truth').truth;
const { xpathLocator, fileExists, clearString } = require('../utils');
const ElementNotFound = require('./errors/ElementNotFound');
const Locator = require('../locator');
const path = require('path');
const recorder = require('../recorder');
>>>>>>> refactored

let withinStore = {};

/**
 * Protractor helper is based on [Protractor library](http://www.protractortest.org) and used for testing AngularJS applications.
 *
 * ## Backends
 *
 * ### Selenium Installation
 *
 * 1. Download [Selenium Server](http://docs.seleniumhq.org/download/)
 * 2. For Chrome browser install [ChromeDriver](https://sites.google.com/a/chromium.org/chromedriver/getting-started), for Firefox browser install [GeckoDriver](https://github.com/mozilla/geckodriver).
 * 3. Launch the server: `java -jar selenium-server-standalone-3.xx.xxx.jar`. To locate Chromedriver binary use `-Dwebdriver.chrome.driver=./chromedriver` option. For Geckodriver use `-Dwebdriver.gecko.driver=`.
 *
 * ### PhantomJS Installation
 *
 * PhantomJS is a headless alternative to Selenium Server that implements the WebDriver protocol.
 * It allows you to run Selenium tests on a server without a GUI installed.
 *
 * 1. Download [PhantomJS](http://phantomjs.org/download.html)
 * 2. Run PhantomJS in WebDriver mode: `phantomjs --webdriver=4444`
 *
 * ## Configuration
 *
 * This helper should be configured in codecept.json
 *
 * * `url` - base url of website to be tested
 * * `browser` - browser in which perform testing
 * * `driver` - which protractor driver to use (local, direct, session, hosted, sauce, browserstack). By default set to 'hosted' which requires selenium server to be started.
 * * `restart` (optional, default: true) - restart browser between tests.
 * * `smartWait`: (optional) **enables [SmartWait](http://codecept.io/acceptance/#smartwait)**; wait for additional milliseconds for element to appear. Enable for 5 secs: "smartWait": 5000
 * * `disableScreenshots` (optional, default: false)  - don't save screenshot on failure
 * * `uniqueScreenshotNames` (optional, default: false)  - option to prevent screenshot override if you have scenarios with the same name in different suites
 * * `keepBrowserState` (optional, default: false)  - keep browser state between tests when `restart` set to false.
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
 * Example:
 *
 * ```json
 * {
 *    "helpers": {
 *      "Protractor" : {
 *        "url": "http://localhost",
 *        "browser": "chrome",
 *        "smartWait": 5000,
 *        "restart": false
 *      }
 *    }
 * }
 * ```
 *
 * ## Access From Helpers
 *
 * Receive a WebDriverIO client from a custom helper by accessing `browser` property:
 *
 * ```js
 * this.helpers['Protractor'].browser
 * ```
 */
<<<<<<< HEAD
class Protractor extends SeleniumWebdriver {
=======
class Protractor extends Helper {

>>>>>>> refactored
  constructor(config) {
    super(config);
    this.options = {
      browser: 'chrome',
      url: 'http://localhost',
      seleniumAddress: 'http://localhost:4444/wd/hub',
      fullPageScreenshots: true,
      rootElement: 'body',
      scriptTimeout: 10000,
      waitForTimeout: 1000, // ms
      windowSize: null,
      driver: 'hosted',
      capabilities: {},
<<<<<<< HEAD
=======
      angular: true
>>>>>>> refactored
    };

    this.isRunning = false;

    this.options = Object.assign(this.options, config);
    if (!this.options.allScriptsTimeout) this.options.allScriptsTimeout = this.options.scriptsTimeout;
    if (!this.options.scriptTimeout) this.options.scriptTimeout = this.options.scriptsTimeout;
    if (this.options.proxy) this.options.capabilities.proxy = this.options.proxy;
    if (this.options.browser) this.options.capabilities.browserName = this.options.browser;
    this.options.waitForTimeout /= 1000; // convert to seconds
  }

  async _init() {
    Runner = requireg('protractor/built/runner').Runner;
    By = requireg('protractor').ProtractorBy;
    Key = requireg('protractor').Key;

    this.context = this.options.rootElement;
<<<<<<< HEAD
    try {
      // get selenium-webdriver
      this.webdriver = requireg('selenium-webdriver');
    } catch (e) {
      // maybe it is installed as protractor dependency?
      this.webdriver = requireg('protractor/node_modules/selenium-webdriver');
    }
    return Promise.resolve(Runner);
=======
    return Promise.resolve();
>>>>>>> refactored Protractor helper
  }

  static _checkRequirements() {
    try {
      requireg('protractor');
      require('assert').ok(requireg('protractor/built/runner').Runner);
    } catch (e) {
      return ['protractor@^5.0.0'];
    }
  }

  static _config() {
    return [
      { name: 'url', message: 'Base url of site to be tested', default: 'http://localhost' },
      { name: 'driver', message: 'Protractor driver (local, direct, session, hosted, sauce, browserstack)', default: 'hosted' },
      { name: 'browser', message: 'Browser in which testing will be performed', default: 'chrome' },
      { name: 'rootElement', message: 'Root element of AngularJS application', default: 'body' },
    ];
  }

  async _beforeStep() {
    if (!this.insideAngular) {
      return this.amOutsideAngularApp();
    }
  }

<<<<<<< HEAD
  _startBrowser() {
    const runner = new Runner(this.options);
=======
  async _beforeSuite() {
    if (!this.options.restart && !this.options.manualStart && !this.isRunning) {
      this.debugSection('Session', 'Starting singleton browser session');
      return this._startBrowser();
    }
  }


  async _startBrowser() {
    let runner = new Runner(this.options);
>>>>>>> refactored
    this.browser = runner.createBrowser();
    global.browser = this.browser;
    global.$ = this.browser.$;
    global.$$ = this.browser.$$;
    global.element = this.browser.element;
    global.by = global.By = new By();
    global.ExpectedConditions = EC = this.browser.ExpectedConditions;
    const promisesList = [];
    if (this.options.windowSize == 'maximize') {
      await this.resizeWindow(this.options.windowSize);
    }
    if (this.options.windowSize) {
<<<<<<< HEAD
      const size = this.options.windowSize.split('x');
      promisesList.push(this.resizeWindow(parseInt(size[0]), parseInt(size[1])));
=======
      var size = this.options.windowSize.split('x');
      await this.resizeWindow(parseInt(size[0]), parseInt(size[1]));
>>>>>>> refactored
    }
    if (!this.options.angular) this.amOutsideAngularApp();
    this.isRunning = true;
  }

  async _before() {
    if (this.options.restart && !this.options.manualStart) await this._startBrowser();
    if (!this.isRunning && !this.options.manualStart) await this._startBrowser();
  }

  async _after() {
    if (!this.isRunning) return;
    if (this.options.restart) {
      this.isRunning = false;
      return this.browser.quit();
    }
    if (this.options.keepBrowserState) return;
    if (!this.options.keepCookies) {
      await this.browser.manage().deleteAllCookies();
    }
    await this.browser.executeScript('localStorage.clear();')
    return this.closeOtherTabs();
  }

  async _failed(test) {
    this._withinEnd();
    if (this.options.disableScreenshots) return;
    let fileName = clearString(test.title);
    if (test.ctx && test.ctx.test && test.ctx.test.type == 'hook') fileName = clearString(`${test.title}_${test.ctx.test.title}`);
    if (this.options.uniqueScreenshotNames) {
      let uuid = test.uuid || test.ctx.test.uuid;
      fileName = `${fileName.substring(0, 10)}_${uuid}.failed.png`;
    } else {
      fileName = fileName + '.failed.png';
    }
    return this.saveScreenshot(fileName, true).catch((err) => {
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

  async _finishTest() {
    if (!this.options.restart && this.isRunning) return this.browser.quit();
  }


  async _withinBegin(locator) {
    withinStore.elFn = this.browser.findElement;
    withinStore.elsFn = this.browser.findElements;

    this.context = locator;
<<<<<<< HEAD
    if (this.insideAngular) {
      const context = global.element(guessLocator(locator) || global.by.css(locator));

      this.browser.findElement = l => (l ? context.element(l).getWebElement() : context.getWebElement());
      this.browser.findElements = l => context.all(l).getWebElements();
      return context;
    }
    return super._withinBegin(locator);
=======
    let context = global.element(guessLocator(locator) || global.by.css(locator));

    this.browser.findElement = (l) => l ? context.element(l).getWebElement() : context.getWebElement();
    this.browser.findElements = (l) => context.all(l).getWebElements();
    return context;
>>>>>>> refactored
  }

  _withinEnd() {
    if (!Object.keys(withinStore).length) return;
    this.browser.findElement = withinStore.elFn;
    this.browser.findElements = withinStore.elsFn;
    withinStore = {};
    this.context = this.options.rootElement;
  }


  /**
   * Switch to non-Angular mode,
   * start using WebDriver instead of Protractor in this session
   */
  async amOutsideAngularApp() {
    if (!this.browser) return;
    this.browser.ignoreSynchronization = true;
    return Promise.resolve(this.insideAngular = false);
  }

  /**
   * Enters Angular mode (switched on by default)
   * Should be used after "amOutsideAngularApp"
   */
  async amInsideAngularApp() {
    this.browser.ignoreSynchronization = false;
    return Promise.resolve(this.insideAngular = true);
  }


    /**
   * Get elements by different locator types, including strict locator
   * Should be used in custom helpers:
   *
   * ```js
   * this.helpers['SeleniumWebdriver']._locate({name: 'password'}).then //...
   * ```
   * To use SmartWait and wait for element to appear on a page, add `true` as second arg:
   *
   * ```js
   * this.helpers['SeleniumWebdriver']._locate({name: 'password'}, true).then //...
   * ```
   *
   */
  async _locate(locator, smartWait = false) {
    return this._smartWait(() => this.browser.findElements(guessLocator(locator) || global.by.css(locator)), smartWait);
  }

  async _smartWait(fn, enabled = true) {
    if (!this.options.smartWait || !enabled) return fn();
    await this.browser.manage().timeouts().implicitlyWait(this.options.smartWait);
    let res = await fn();
    await this.browser.manage().timeouts().implicitlyWait(0);
    return res;
  }

  /**
   * {{> ../webapi/amOnPage }}
   */
  async amOnPage(url) {
    if (url.indexOf('http') !== 0) {
      url = this.options.url + url;
    }
    let res = await this.browser.get(url);
    this.debug('Visited '+ url);
    return res;
  }

  /**
   * {{> ../webapi/click }}
   */
  async click(locator, context = null) {
    let matcher = this.browser;
    if (context) {
      let els = await this._locate(context, true);
      assertElementExists(els, context);
      matcher = els[0];
    }
    let el = await findClickable.call(this, matcher, locator);
    return el.click();
  }

  /**
   * {{> ../webapi/doubleClick }}
   */
  async doubleClick(locator, context = null) {
    let matcher = this.browser;
    if (context) {
      let els = await this._locate(context, true);
      assertElementExists(els, context);
      matcher = els[0];
    }
    let el = await findClickable.call(this, matcher, locator);
    return this.browser.actions().doubleClick(el).perform();
  }

  /**
   * {{> ../webapi/moveCursorTo}}
   */
  async moveCursorTo(locator, offsetX = null, offsetY = null) {
    let offset = null;
    if (offsetX !== null || offsetY !== null) {
      offset = {x: offsetX, y: offsetY};
    }
    let els = await this._locate(locator, true);
    assertElementExists(els, locator);
    return this.browser.actions().mouseMove(els[0], offset).perform();
  }

  /**
   * {{> ../webapi/see }}
   */
  async see(text, context = null) {
    return proceedSee.call(this, 'assert', text, context);
  }

  /**
   * {{> ../webapi/dontSee }}
   */
  dontSee(text, context = null) {
    return proceedSee.call(this, 'negate', text, context);
  }

  /**
   * {{> ../webapi/selectOption }}
   */
  async selectOption(select, option) {
    let fields = await findFields(this.browser, select);
    assertElementExists(fields, select, 'Selectable field');
    if (!Array.isArray(option)) {
      option = [option];
    }
    let field = fields[0];
    let promises = [];
    for (let key in option) {
      let opt = option[key];
      let normalizedText = `[normalize-space(.) = "${opt.trim() }"]`;
      let byVisibleText = `./option${normalizedText}|./optgroup/option${normalizedText}`;
      let els = await field.findElements(global.by.xpath(byVisibleText));
      if (!els.length) {
        let normalizedValue = `[normalize-space(@value) = "${opt.trim() }"]`;
        let byValue = `./option${normalizedValue}|./optgroup/option${normalizedValue}`;
        els = await field.findElements(global.by.xpath(byValue));
      }
      els.forEach((el) => promises.push(el.click()));
    }
    return Promise.all(promises);
  }

  /**
   * {{> ../webapi/fillField }}
   */
  async fillField(field, value) {
    let els = await findFields(this.browser, field);
    await els[0].clear();
    return els[0].sendKeys(value);
  }

  /**
   * {{> ../webapi/pressKey }}
   */
  async pressKey(key) {
    let modifier;
    if (Array.isArray(key) && ~['Control', 'Command', 'Shift', 'Alt'].indexOf(key[0])) {
      modifier = Key[key[0].toUpperCase()];
      key = key[1];
    }

    // guess special key in Selenium Webdriver list
    if (Key[key.toUpperCase()]) {
      key = Key[key.toUpperCase()];
    }

    let action = this.browser.actions();
    if (modifier) action.keyDown(modifier);
    action.sendKeys(key);
    if (modifier) action.keyUp(modifier);
    return action.perform();
  }

  /**
   * {{> ../webapi/attachFile }}
   */
  async attachFile(locator, pathToFile) {
    let file = path.join(global.codecept_dir, pathToFile);
    if (!fileExists(file)) {
      throw new Error(`File at ${file} can not be found on local system`);
    }
    let els = await findFields(this.browser, locator);
    assertElementExists(els, locator, 'Field');
    if (this.options.browser !== 'phantomjs') {
      var remote = require('selenium-webdriver/remote');
      this.browser.setFileDetector(new remote.FileDetector());
    }
    return els[0].sendKeys(file);
  }

  /**
   * {{> ../webapi/seeInField }}
   */
  async seeInField(field, value) {
    return proceedSeeInField.call(this, 'assert', field, value);
  }

  /**
   * {{> ../webapi/dontSeeInField }}
   */
  async dontSeeInField(field, value) {
    return proceedSeeInField.call(this, 'negate', field, value);
  }

  /**
   * {{> ../webapi/appendField }}
   */
  async appendField(field, value) {
    let els = await findFields(this.browser, field);
    assertElementExists(els, field, "Field");
    return els[0].sendKeys(value);
  }

  /**
   * {{> ../webapi/clearField }}
   */
  async clearField(field) {
    let els = await findFields(this.browser, field);
    assertElementExists(els, field, "Field");
    return els[0].clear();
  }

  /**
   * {{> ../webapi/checkOption }}
   */
  async checkOption(field, context = null) {
    let matcher = this.browser;
    if (context) {
      let els = await this._locate(context, true);
      assertElementExists(els, context);
      matcher = els[0];
    }
    let els = await findCheckable(matcher, field);
    assertElementExists(els, field, "Checkbox or radio");
    let isSelected = await els[0].isSelected();
    if (!isSelected) return els[0].click();
  }

  /**
   * {{> ../webapi/seeCheckboxIsChecked }}
   */
  async seeCheckboxIsChecked(field) {
    return proceedIsChecked.call(this, 'assert', field);
  }

  /**
   * {{> ../webapi/dontSeeCheckboxIsChecked }}
   */
  async dontSeeCheckboxIsChecked(field) {
    return proceedIsChecked.call(this, 'negate', field);
  }

  /**
   * {{> ../webapi/grabTextFrom }}
   */
  async grabTextFrom(locator) {
    let els = await this._locate(locator)
    assertElementExists(els);
    return els[0].getText();
  }

  /**
   * {{> ../webapi/grabValueFrom }}
   */
  async grabValueFrom(locator) {
    let els = await findFields(this.browser, locator);
    assertElementExists(els, locator, 'Field');
    return els[0].getAttribute('value');
  }

  /**
   * {{> ../webapi/grabAttributeFrom }}
   */
  async grabAttributeFrom(locator, attr) {
    return this.browser.findElement(guessLocator(locator) || global.by.css(locator)).getAttribute(attr);
  }

  /**
   * {{> ../webapi/seeInTitle }}
   */
  async seeInTitle(text) {
    return this.browser.getTitle().then((title) => {
      return stringIncludes('web page title').assert(text, title);
    });
  }

  /**
   * {{> ../webapi/dontSeeInTitle }}
   */
  async dontSeeInTitle(text) {
    return this.browser.getTitle().then((title) => {
      return stringIncludes('web page title').negate(text, title);
    });
  }

  /**
   * {{> ../webapi/grabTitle }}
   */
  async grabTitle() {
    return this.browser.getTitle().then((title) => {
      this.debugSection('Title', title);
      return title;
    });
  }

  /**
   * {{> ../webapi/seeElement }}
   */
  async seeElement(locator) {
    let els = await this._locate(locator, true);
    els = await Promise.all(els.map((el) => el.isDisplayed()));
    return empty('elements').negate(els.filter((v) => v).fill('ELEMENT'));
  }

  /**
   * {{> ../webapi/dontSeeElement }}
   */
  async dontSeeElement(locator) {
    let els = await this._locate(locator, false);
    els = await Promise.all(els.map((el) => el.isDisplayed()));
    return empty('elements').assert(els.filter((v) => v).fill('ELEMENT'));
  }

  /**
   * {{> ../webapi/seeElementInDOM }}
   */
  async seeElementInDOM(locator) {
    return this.browser.findElements(guessLocator(locator) || global.by.css(locator)).then((els) => {
      return empty('elements').negate(els.fill('ELEMENT'));
    });
  }

  /**
   * {{> ../webapi/dontSeeElementInDOM }}
   */
  async dontSeeElementInDOM(locator) {
    return this.browser.findElements(guessLocator(locator) || global.by.css(locator)).then((els) => {
      return empty('elements').assert(els.fill('ELEMENT'));
    });
  }

  /**
   * {{> ../webapi/seeInSource }}
   */
  async seeInSource(text) {
    return this.browser.getPageSource().then((source) => {
      return stringIncludes('HTML source of a page').assert(text, source);
    });
  }

  /**
   * {{> ../webapi/dontSeeInSource }}
   */
  async dontSeeInSource(text) {
    return this.browser.getPageSource().then((source) => {
      return stringIncludes('HTML source of a page').negate(text, source);
    });
  }

  /**
   * {{> ../webapi/executeScript }}
   */
  async executeScript(fn) {
    return this.browser.executeScript.apply(this.browser, arguments);
  }

  /**
   * {{> ../webapi/executeAsyncScript }}
   */
  async executeAsyncScript(fn) {
    this.browser.manage().timeouts().setScriptTimeout(this.options.scriptTimeout);
    return this.browser.executeAsyncScript.apply(this.browser, arguments);
  }

  /**
   * {{> ../webapi/seeInCurrentUrl }}
   */
  async seeInCurrentUrl(url) {
    return this.browser.getCurrentUrl().then(function (currentUrl) {
      return stringIncludes('url').assert(url, currentUrl);
    });
  }

  /**
   * {{> ../webapi/dontSeeInCurrentUrl }}
   */
  async dontSeeInCurrentUrl(url) {
    return this.browser.getCurrentUrl().then(function (currentUrl) {
      return stringIncludes('url').negate(url, currentUrl);
    });
  }

  /**
   * {{> ../webapi/seeCurrentUrlEquals }}
   */
  async seeCurrentUrlEquals(url) {
    return this.browser.getCurrentUrl().then((currentUrl) => {
      return urlEquals(this.options.url).assert(url, currentUrl);
    });
  }

  /**
   * {{> ../webapi/dontSeeCurrentUrlEquals }}
   */
  async dontSeeCurrentUrlEquals(url) {
    return this.browser.getCurrentUrl().then((currentUrl) => {
      return urlEquals(this.options.url).negate(url, currentUrl);
    });
  }

  /**
   * {{> ../webapi/saveScreenshot }}
   */
  async saveScreenshot(fileName, fullPage = false) {
    let outputFile = path.join(global.output_dir, fileName);
    this.debug('Screenshot has been saved to ' + outputFile);

    const writeFile = (png, outputFile) => {
      let fs = require('fs');
      let stream = fs.createWriteStream(outputFile);
      stream.write(new Buffer(png, 'base64'));
      stream.end();
      return new Promise((resolve) => stream.on('finish', resolve));
    };

    if (!fullPage) {
      let png = await this.browser.takeScreenshot();
      return writeFile(png, outputFile);
    }

    let { width, height } = await this.browser.executeScript(() => ({
      height: document.body.scrollHeight,
      width: document.body.scrollWidth
    }));

    await this.browser.manage().window().setSize(width, height);
    let png = await this.browser.takeScreenshot();
    return writeFile(png, outputFile);
  }

  /**
   * {{> ../webapi/clearCookie}}
   */
  async clearCookie(cookie = null) {
    if (!cookie) {
      return this.browser.manage().deleteAllCookies();
    }
    return this.browser.manage().deleteCookie(cookie);
  }

  /**
   * {{> ../webapi/seeCookie}}
   */
  async seeCookie(name) {
    return this.browser.manage().getCookie(name).then(function (res) {
      return truth('cookie ' + name, 'to be set').assert(res);
    });
  }

  /**
   * {{> ../webapi/dontSeeCookie}}
   */
  async dontSeeCookie(name) {
    return this.browser.manage().getCookie(name).then(function (res) {
      return truth('cookie ' + name, 'to be set').negate(res);
    });
  }

  /**
   * {{> ../webapi/grabCookie}}
   *
   * Returns cookie in JSON [format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).
   */
  async grabCookie(name) {
    return this.browser.manage().getCookie(name);
  }

  /**
   * {{> ../webapi/resizeWindow }}
   */
  async resizeWindow(width, height) {
    if (width === 'maximize') {
      let res = await this.browser.executeScript('return [screen.width, screen.height]');
      return this.browser.manage().window().setSize(parseInt(res[0]), parseInt(res[1]));
    }
    return this.browser.manage().window().setSize(parseInt(width), parseInt(height));
  }

  /**
   * Close all tabs expect for one.
   *
   * ```js
   * I.closeOtherTabs();
   * ```
   */
  async closeOtherTabs() {
    let client = this.browser;

    let handles = await client.getAllWindowHandles();
    if (!handles || !handles.length) return;
    let mainHandle = handles[0];
    let p = Promise.resolve();
    handles.shift();
    handles.forEach(function (handle) {
      p = p.then(() => {
        return client.switchTo().window(handle).then(() => client.close());
      });
    });
    p = p.then(() => client.switchTo().window(mainHandle));
    return p;
  }


  /**
   * {{> ../webapi/wait }}
   */
  wait(sec) {
    return this.browser.sleep(sec * 1000);
  }


  /**
   * {{> ../webapi/waitForElement }}
   */
<<<<<<< HEAD
  waitForElement(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    const el = global.element(guessLocator(locator) || global.by.css(locator));
=======
  async waitForElement(locator, sec = null) {
    let aSec = sec || this.options.waitForTimeout;
    let el = global.element(guessLocator(locator) || global.by.css(locator));
>>>>>>> refactored
    return this.browser.wait(EC.presenceOf(el), aSec * 1000);
  }

  /**
   * {{> ../webapi/waitUntilExists }}
   */
  waitUntilExists(locator, sec = null) {
<<<<<<< HEAD
    sec = sec || this.options.waitForTimeout;
    const el = element(guessLocator(locator) || by.css(locator));
    return this.browser.wait(!EC.presenceOf(el), sec * 1000);
=======
    let aSec = sec || this.options.waitForTimeout;
    let el = global.element(guessLocator(locator) || global.by.css(locator));
    return this.browser.wait(EC.not(EC.presenceOf(el)), aSec * 1000);
>>>>>>> updated seleniumwebdriver & protractor
  }

  /**
   * Waits for element to become clickable for number of seconds.
   */
  waitForClickable(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    const el = global.element(guessLocator(locator) || global.by.css(locator));
    return this.browser.wait(EC.elementToBeClickable(el), aSec * 1000);
  }

  /**
   * {{> ../webapi/waitForVisible }}
   */
  waitForVisible(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    const el = global.element(guessLocator(locator) || global.by.css(locator));
    return this.browser.wait(EC.visibilityOf(el), aSec * 1000);
  }

  /**
   * {{> ../webapi/waitForInvisible }}
   */
  waitForInvisible(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    const el = global.element(guessLocator(locator) || global.by.css(locator));
    return this.browser.wait(EC.invisibilityOf(el), aSec * 1000);
  }

  /**
   * {{> ../webapi/waitForStalenessOf }}
   */
  waitForStalenessOf(locator, sec = null) {
    return this.waitForInvisible(locator, sec);
  }

  /**
   * {{> ../webapi/waitForText }}
   */
  waitForText(text, sec = null, context = null) {
    if (!context) {
      context = this.context;
    }
    const el = global.element(guessLocator(context) || global.by.css(context));
    const aSec = sec || this.options.waitForTimeout;
    return this.browser.wait(EC.textToBePresentInElement(el, text), aSec * 1000);
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
    return this.browser.manage().addCookie(cookie);
  }
}

module.exports = Protractor;

async function findCheckable(client, locator) {
  let matchedLocator = guessLocator(locator);
  if (matchedLocator) {
    return client.findElements(matchedLocator);
  }
<<<<<<< HEAD
  if (typeof locator === 'object') {
    const key = Object.keys(locator)[0];
    const value = locator[key];
    return global.by[key](value);
=======
  let literal = xpathLocator.literal(locator);
  let els = await client.findElements(global.by.xpath(Locator.checkable.byText(literal)));
  if (els.length) {
    return els;
>>>>>>> refactored
  }
  els = await client.findElements(global.by.xpath(Locator.checkable.byName(literal)));
  if (els.length) {
    return els;
  }
  return client.findElements(global.by.css(locator));
}

<<<<<<< HEAD
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
let _amOnPage;

/**
 * {{> ../webapi/appendField }}
 *
 * @name appendField
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _appendField;

/**
 * {{> ../webapi/attachFile }}
 *
 * @name attachFile
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _attachFile;

/**
 * {{> ../webapi/checkOption }}
 *
 * @name checkOption
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _checkOption;

/**
 * {{> ../webapi/clearCookie }}
 *
 * @name clearCookie
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _clearCookie;

/**
 * {{> ../webapi/click }}
 *
 * @name click
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _click;

/**
 * {{> ../webapi/dontSeeCheckboxIsChecked }}
 *
 * @name dontSeeCheckboxIsChecked
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _dontSeeCheckboxIsChecked;

/**
 * {{> ../webapi/dontSeeCookie }}
 *
 * @name dontSeeCookie
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _dontSeeCookie;

/**
 * {{> ../webapi/dontSeeCurrentUrlEquals }}
 *
 * @name dontSeeCurrentUrlEquals
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _dontSeeCurrentUrlEquals;

/**
 * {{> ../webapi/dontSeeElement }}
 *
 * @name dontSeeElement
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _dontSeeElement;

/**
 * {{> ../webapi/dontSeeInCurrentUrl }}
 *
 * @name dontSeeInCurrentUrl
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _dontSeeInCurrentUrl;

/**
 * {{> ../webapi/dontSeeInField }}
 *
 * @name dontSeeInField
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _dontSeeInField;

/**
 * {{> ../webapi/dontSeeInSource }}
 *
 * @name dontSeeInSource
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _dontSeeInSource;

/**
 * {{> ../webapi/dontSeeInTitle }}
 *
 * @name dontSeeInTitle
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _dontSeeInTitle;

/**
 * {{> ../webapi/dontSee }}
 *
 * @name dontSee
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _dontSee;

/**
 * {{> ../webapi/executeAsyncScript }}
 *
 * @name executeAsyncScript
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _executeAsyncScript;

/**
 * {{> ../webapi/executeScript }}
 *
 * @name executeScript
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _executeScript;

/**
 * {{> ../webapi/fillField }}
 *
 * @name fillField
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _fillField;

/**
 * {{> ../webapi/grabAttributeFrom }}
 *
 * @name grabAttributeFrom
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _grabAttributeFrom;

/**
 * {{> ../webapi/grabCookie }}
 *
 * @name grabCookie
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _grabCookie;

/**
 * {{> ../webapi/grabTextFrom }}
 *
 * @name grabTextFrom
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _grabTextFrom;

/**
 * {{> ../webapi/grabTitle }}
 *
 * @name grabTitle
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _grabTitle;

/**
 * {{> ../webapi/grabValueFrom }}
 *
 * @name grabValueFrom
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _grabValueFrom;

/**
 * {{> ../webapi/pressKey }}
 *
 * @name pressKey
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _pressKey;

/**
 * {{> ../webapi/resizeWindow }}
 *
 * @name resizeWindow
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _resizeWindow;

/**
 * {{> ../webapi/saveScreenshot }}
 *
 * @name saveScreenshot
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _saveScreenshot;

/**
 * {{> ../webapi/seeCheckboxIsChecked }}
 *
 * @name seeCheckboxIsChecked
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _seeCheckboxIsChecked;

/**
 * {{> ../webapi/seeCookie }}
 *
 * @name seeCookie
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _seeCookie;

/**
 * {{> ../webapi/seeCurrentUrlEquals }}
 *
 * @name seeCurrentUrlEquals
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _seeCurrentUrlEquals;

/**
 * {{> ../webapi/seeElement }}
 *
 * @name seeElement
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _seeElement;

/**
 * {{> ../webapi/seeInCurrentUrl }}
 *
 * @name seeInCurrentUrl
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _seeInCurrentUrl;

/**
 * {{> ../webapi/seeInField }}
 *
 * @name seeInField
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _seeInField;

/**
 * {{> ../webapi/seeInSource }}
 *
 * @name seeInSource
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _seeInSource;

/**
 * {{> ../webapi/seeInTitle }}
 *
 * @name seeInTitle
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _seeInTitle;

/**
 * {{> ../webapi/see }}
 *
 * @name see
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _see;

/**
 * {{> ../webapi/selectOption }}
 *
 * @name selectOption
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _selectOption;

/**
 * {{> ../webapi/setCookie }}
 *
 * @name setCookie
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let _setCookie;
=======
async function findFields(client, locator) {
  let matchedLocator = guessLocator(locator);
  if (matchedLocator) {
    return client.findElements(matchedLocator);
  }
  let literal = xpathLocator.literal(locator);

  let els = await client.findElements(global.by.xpath(Locator.field.labelEquals(literal)));
  if (els.length) {
    return els;
  }

  els = await client.findElements(global.by.xpath(Locator.field.labelContains(literal)));
  if (els.length) {
    return els;
  }
  els = await client.findElements(global.by.xpath(Locator.field.byName(literal)));
  if (els.length) {
    return els;
  }
  return await client.findElements(global.by.css(locator));
}

async function proceedSee(assertType, text, context) {
  let description, locator;
  if (!context) {
    if (this.context === this.options.rootElement) {
      locator = guessLocator(this.context) || global.by.css(this.context);
      description = 'web application';
    } else {
      // inside within block
      locator = global.by.xpath('.//*');
      description = 'current context ' + (new Locator(context)).toString();
    }
  } else {
    locator = guessLocator(context) || global.by.css(context);
    description = 'element ' + (new Locator(context)).toString();
  }
  let enableSmartWait = !!this.context && assertType == 'assert';
  let els = await this._smartWait(() => this.browser.findElements(locator), enableSmartWait);
  let promises = [];
  let source = '';
  els.forEach(el => promises.push(el.getText().then((elText) => source += '| ' + elText)));
  await Promise.all(promises);
  return stringIncludes(description)[assertType](text, source);
}

async function proceedSeeInField(assertType, field, value) {
  let els = await findFields(this.browser, field);
  assertElementExists(els, field, 'Field');
  let el = els[0];
  let tag = await el.getTagName();
  let fieldVal = await el.getAttribute('value');
  if (tag == 'select') {
    // locate option by values and check them
    let literal = xpathLocator.literal(fieldVal);
    let text = await el.findElement(global.by.xpath(Locator.select.byValue(literal))).getText();
    return equals('select option by ' + field)[assertType](value, text);
  }
  return stringIncludes('field by ' + field)[assertType](value, fieldVal);
}

async function proceedIsChecked(assertType, option) {
  let els = await findCheckable(this.browser, option);
  assertElementExists(els, option, 'Option');
  let elsSelected = [];
  els.forEach((el) => elsSelected.push(el.isSelected()));
  let values = await Promise.all(elsSelected);
  let selected = values.reduce((prev, cur) => prev || cur);
  return truth(`checkable ${option}`, 'to be checked')[assertType](selected);
}

async function findClickable(matcher, locator) {
  locator = new Locator(locator);
  if (!locator.isFuzzy()) {
    let els = await this._locate(locator.value, true);
    assertElementExists(els, locator.value);
    return els[0];
  }
  let literal = xpathLocator.literal(locator.value);
  let narrowLocator = Locator.clickable.narrow(literal);
  let els = await matcher.findElements(global.by.xpath(narrowLocator));
  if (els.length) {
    return els[0];
  }

  els = await matcher.findElements(global.by.xpath(Locator.clickable.wide(literal)));
  if (els.length) {
    return els[0];
  }
  return matcher.findElement(global.by.css(locator.value));
}
>>>>>>> refactored

function guessLocator(locator) {
  let l = new Locator(locator);
  if (l.isFuzzy()) return false;
  if (l.type) return global.by[l.type](l.value);
  return false;
}

<<<<<<< HEAD
/**
 * ```js
 * this.helpers['Protractor']._locate({name: 'password'}).then //...
 * ```
 * To use SmartWait and wait for element to appear on a page, add `true` as second arg:
 *
 * ```js
 * this.helpers['Protractor']._locate({name: 'password'}, true).then //...
 * ```
 *
 * @name _locate
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
let __locate;
=======
function assertElementExists(res, locator, prefix, suffix) {
  if (!res.length) {
    throw new ElementNotFound(locator, prefix, suffix);
  }
}
>>>>>>> refactored
