let By;
let EC;
let Runner;
let Key;

const requireg = require('requireg');
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

let withinStore = {};

/**
 * Protractor helper is based on [Protractor library](http://www.protractortest.org) and used for testing web applications.
 *
 * Protractor requires [Selenium Server and ChromeDriver/GeckoDriver to be installed](http://codecept.io/quickstart/#prepare-selenium-server).
 * To test non-Angular applications please make sure you have `angular: false` in configuration file.
 *
 * ### Configuration
 *
 * This helper should be configured in codecept.json
 *
 * * `url` - base url of website to be tested
 * * `browser` - browser in which perform testing
 * * `angular` (optional, default: true): disable this option to run tests for non-Angular applications.
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
 * #### Sample Config
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
 * #### Config for Non-Angular application:
 *
 * ```json
 * {
 *    "helpers": {
 *      "Protractor" : {
 *        "url": "http://localhost",
 *        "browser": "chrome",
 *        "angular": false
 *      }
 *    }
 * }
 * ```
 *
 * #### Config for Headless Chrome
 *
 * ```json
 * {
 *    "helpers": {
 *      "Protractor" : {
 *        "url": "http://localhost",
 *        "browser": "chrome",
 *        "capabilities": {
 *          "chromeOptions": {
 *            "args": [ "--headless", "--disable-gpu", "--window-size=800,600" ]
 *          }
 *        }
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
class Protractor extends Helper {
  constructor(config) {
    super(config);
    this.options = {
      browser: 'chrome',
      url: 'http://localhost',
      seleniumAddress: 'http://localhost:4444/wd/hub',
      fullPageScreenshots: true,
      rootElement: 'body',
      allScriptsTimeout: 10000,
      scriptTimeout: 10000,
      waitForTimeout: 1000, // ms
      windowSize: null,
      driver: 'hosted',
      capabilities: {},
      angular: true,
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
    return Promise.resolve();
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

  async _beforeSuite() {
    if (!this.options.restart && !this.options.manualStart && !this.isRunning) {
      this.debugSection('Session', 'Starting singleton browser session');
      return this._startBrowser();
    }
  }


  async _startBrowser() {
    const runner = new Runner(this.options);
    this.browser = runner.createBrowser();
    global.browser = this.browser;
    global.$ = this.browser.$;
    global.$$ = this.browser.$$;
    global.element = this.browser.element;
    global.by = global.By = new By();
    global.ExpectedConditions = EC = this.browser.ExpectedConditions;
    const promisesList = [];
    if (this.options.windowSize === 'maximize') {
      await this.resizeWindow(this.options.windowSize);
    } else if (this.options.windowSize) {
      const size = this.options.windowSize.split('x');
      await this.resizeWindow(parseInt(size[0], 10), parseInt(size[1], 10));
    }
    if (this.options.angular) {
      this.amInsideAngularApp();
    } else {
      this.amOutsideAngularApp();
    }
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
    const url = await this.browser.getCurrentUrl();
    if (!/data:,/i.test(url)) {
      await this.browser.executeScript('localStorage.clear();');
    }
    return this.closeOtherTabs();
  }

  async _failed(test) {
    this._withinEnd();
    if (this.options.disableScreenshots) return;
    let fileName = clearString(test.title);
    if (test.ctx && test.ctx.test && test.ctx.test.type === 'hook') fileName = clearString(`${test.title}_${test.ctx.test.title}`);
    if (this.options.uniqueScreenshotNames) {
      const uuid = test.uuid || test.ctx.test.uuid;
      fileName = `${fileName.substring(0, 10)}_${uuid}.failed.png`;
    } else {
      fileName += '.failed.png';
    }
    return this.saveScreenshot(fileName, true).catch((err) => {
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

  async _finishTest() {
    if (!this.options.restart && this.isRunning) return this.browser.quit();
  }


  async _withinBegin(locator) {
    withinStore.elFn = this.browser.findElement;
    withinStore.elsFn = this.browser.findElements;

    this.context = locator;
    const context = global.element(guessLocator(locator) || global.by.css(locator));

    this.browser.findElement = l => (l ? context.element(l).getWebElement() : context.getWebElement());
    this.browser.findElements = l => context.all(l).getWebElements();
    return context;
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
    this.browser.waitForAngularEnabled(false);
    return Promise.resolve(this.insideAngular = false);
  }

  /**
   * Enters Angular mode (switched on by default)
   * Should be used after "amOutsideAngularApp"
   */
  async amInsideAngularApp() {
    this.browser.waitForAngularEnabled(true);
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
    const res = await fn();
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
    const res = await this.browser.get(url);
    this.debug(`Visited ${url}`);
    return res;
  }

  /**
   * {{> ../webapi/click }}
   */
  async click(locator, context = null) {
    let matcher = this.browser;
    if (context) {
      const els = await this._locate(context, true);
      assertElementExists(els, context);
      matcher = els[0];
    }
    const el = await findClickable.call(this, matcher, locator);
    return el.click();
  }

  /**
   * {{> ../webapi/doubleClick }}
   */
  async doubleClick(locator, context = null) {
    let matcher = this.browser;
    if (context) {
      const els = await this._locate(context, true);
      assertElementExists(els, context);
      matcher = els[0];
    }
    const el = await findClickable.call(this, matcher, locator);
    return this.browser.actions().doubleClick(el).perform();
  }

  /**
   * {{> ../webapi/moveCursorTo}}
   */
  async moveCursorTo(locator, offsetX = null, offsetY = null) {
    let offset = null;
    if (offsetX !== null || offsetY !== null) {
      offset = { x: offsetX, y: offsetY };
    }
    const els = await this._locate(locator, true);
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
   */
  dontSee(text, context = null) {
    return proceedSee.call(this, 'negate', text, context);
  }

  /**
   * {{> ../webapi/selectOption }}
   */
  async selectOption(select, option) {
    const fields = await findFields(this.browser, select);
    assertElementExists(fields, select, 'Selectable field');
    if (!Array.isArray(option)) {
      option = [option];
    }
    const field = fields[0];
    const promises = [];
    for (const key in option) {
      const opt = xpathLocator.literal(option[key]);
      let els = await field.findElements(global.by.xpath(Locator.select.byVisibleText(opt)));
      if (!els.length) {
        els = await field.findElements(global.by.xpath(Locator.select.byValue(opt)));
      }
      els.forEach(el => promises.push(el.click()));
    }

    return Promise.all(promises);
  }

  /**
   * {{> ../webapi/fillField }}
   */
  async fillField(field, value) {
    const els = await findFields(this.browser, field);
    await els[0].clear();
    return els[0].sendKeys(value);
  }

  /**
   * {{> ../webapi/pressKey }}
   */
  async pressKey(key) {
    let modifier;
    if (Array.isArray(key) && ~['Control', 'Command', 'Shift', 'Alt'].indexOf(key[0])) { // eslint-disable-line no-bitwise
      modifier = Key[key[0].toUpperCase()];
      key = key[1];
    }

    // guess special key in Selenium Webdriver list
    if (Key[key.toUpperCase()]) {
      key = Key[key.toUpperCase()];
    }

    const action = this.browser.actions();
    if (modifier) action.keyDown(modifier);
    action.sendKeys(key);
    if (modifier) action.keyUp(modifier);
    return action.perform();
  }

  /**
   * {{> ../webapi/attachFile }}
   */
  async attachFile(locator, pathToFile) {
    const file = path.join(global.codecept_dir, pathToFile);
    if (!fileExists(file)) {
      throw new Error(`File at ${file} can not be found on local system`);
    }
    const els = await findFields(this.browser, locator);
    assertElementExists(els, locator, 'Field');
    if (this.options.browser !== 'phantomjs') {
      const remote = require('selenium-webdriver/remote');
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
    const els = await findFields(this.browser, field);
    assertElementExists(els, field, 'Field');
    return els[0].sendKeys(value);
  }

  /**
   * {{> ../webapi/clearField }}
   */
  async clearField(field) {
    const els = await findFields(this.browser, field);
    assertElementExists(els, field, 'Field');
    return els[0].clear();
  }

  /**
   * {{> ../webapi/checkOption }}
   */
  async checkOption(field, context = null) {
    let matcher = this.browser;
    if (context) {
      const els = await this._locate(context, true);
      assertElementExists(els, context);
      matcher = els[0];
    }
    const els = await findCheckable(matcher, field);
    assertElementExists(els, field, 'Checkbox or radio');
    const isSelected = await els[0].isSelected();
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
    const els = await this._locate(locator);
    assertElementExists(els);
    return els[0].getText();
  }

  /**
   * {{> ../webapi/grabValueFrom }}
   */
  async grabValueFrom(locator) {
    const els = await findFields(this.browser, locator);
    assertElementExists(els, locator, 'Field');
    return els[0].getAttribute('value');
  }

  /**
   * {{> ../webapi/grabAttributeFrom }}
   */
  async grabAttributeFrom(locator, attr) {
    const els = await this._locate(locator);
    assertElementExists(els);
    return els[0].getAttribute(attr);
  }

  /**
   * {{> ../webapi/seeInTitle }}
   */
  async seeInTitle(text) {
    return this.browser.getTitle().then(title => stringIncludes('web page title').assert(text, title));
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
    return equals('web page title').assert(title, text);
  }

  /**
   * {{> ../webapi/dontSeeInTitle }}
   */
  async dontSeeInTitle(text) {
    return this.browser.getTitle().then(title => stringIncludes('web page title').negate(text, title));
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
    els = await Promise.all(els.map(el => el.isDisplayed()));
    return empty('elements').negate(els.filter(v => v).fill('ELEMENT'));
  }

  /**
   * {{> ../webapi/dontSeeElement }}
   */
  async dontSeeElement(locator) {
    let els = await this._locate(locator, false);
    els = await Promise.all(els.map(el => el.isDisplayed()));
    return empty('elements').assert(els.filter(v => v).fill('ELEMENT'));
  }

  /**
   * {{> ../webapi/seeElementInDOM }}
   */
  async seeElementInDOM(locator) {
    return this.browser.findElements(guessLocator(locator) || global.by.css(locator)).then(els => empty('elements').negate(els.fill('ELEMENT')));
  }

  /**
   * {{> ../webapi/dontSeeElementInDOM }}
   */
  async dontSeeElementInDOM(locator) {
    return this.browser.findElements(guessLocator(locator) || global.by.css(locator)).then(els => empty('elements').assert(els.fill('ELEMENT')));
  }

  /**
   * {{> ../webapi/seeInSource }}
   */
  async seeInSource(text) {
    return this.browser.getPageSource().then(source => stringIncludes('HTML source of a page').assert(text, source));
  }

  /**
   * {{> ../webapi/seeInSource }}
   */
  async grabSource() {
    return this.browser.getPageSource();
  }

  /**
   * {{> ../webapi/dontSeeInSource }}
   */
  async dontSeeInSource(text) {
    return this.browser.getPageSource().then(source => stringIncludes('HTML source of a page').negate(text, source));
  }

  /**
   * asserts that an element appears a given number of times in the DOM
   * Element is located by label or name or CSS or XPath.
   *
   * ```js
   * I.seeNumberOfElements('#submitBtn', 1);
   * ```
   */
  async seeNumberOfElements(selector, num) {
    const elements = await this._locate(selector);
    return equals(`expected number of elements (${selector}) is ${num}, but found ${elements.length}`).assert(elements.length, num);
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
    return this.browser.getCurrentUrl().then(currentUrl => stringIncludes('url').assert(url, currentUrl));
  }

  /**
   * {{> ../webapi/dontSeeInCurrentUrl }}
   */
  async dontSeeInCurrentUrl(url) {
    return this.browser.getCurrentUrl().then(currentUrl => stringIncludes('url').negate(url, currentUrl));
  }

  /**
   * {{> ../webapi/seeCurrentUrlEquals }}
   */
  async seeCurrentUrlEquals(url) {
    return this.browser.getCurrentUrl().then(currentUrl => urlEquals(this.options.url).assert(url, currentUrl));
  }

  /**
   * {{> ../webapi/dontSeeCurrentUrlEquals }}
   */
  async dontSeeCurrentUrlEquals(url) {
    return this.browser.getCurrentUrl().then(currentUrl => urlEquals(this.options.url).negate(url, currentUrl));
  }

  /**
   * {{> ../webapi/saveScreenshot }}
   */
  async saveScreenshot(fileName, fullPage = false) {
    const outputFile = path.join(global.output_dir, fileName);
    this.debug(`Screenshot has been saved to ${outputFile}`);

    const writeFile = (png, outputFile) => {
      const fs = require('fs');
      const stream = fs.createWriteStream(outputFile);
      stream.write(Buffer.from(png, 'base64'));
      stream.end();
      return new Promise(resolve => stream.on('finish', resolve));
    };

    if (!fullPage) {
      const png = await this.browser.takeScreenshot();
      return writeFile(png, outputFile);
    }

    const { width, height } = await this.browser.executeScript(() => ({
      height: document.body.scrollHeight,
      width: document.body.scrollWidth,
    }));

    await this.browser.manage().window().setSize(width, height);
    const png = await this.browser.takeScreenshot();
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
    return this.browser.manage().getCookie(name).then(res => truth(`cookie ${name}`, 'to be set').assert(res));
  }

  /**
   * {{> ../webapi/dontSeeCookie}}
   */
  async dontSeeCookie(name) {
    return this.browser.manage().getCookie(name).then(res => truth(`cookie ${name}`, 'to be set').negate(res));
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
      const res = await this.browser.executeScript('return [screen.width, screen.height]');
      return this.browser.manage().window().setSize(parseInt(res[0], 10), parseInt(res[1], 10));
    }
    return this.browser.manage().window().setSize(parseInt(width, 10), parseInt(height, 10));
  }

  /**
   * Close all tabs except for the current one.
   *
   * ```js
   * I.closeOtherTabs();
   * ```
   */
  async closeOtherTabs() {
    const client = this.browser;

    const handles = await client.getAllWindowHandles();
    const currentHandle = await client.getWindowHandle();
    const otherHandles = handles.filter(handle => handle !== currentHandle);

    if (!otherHandles || !otherHandles.length) return;
    let p = Promise.resolve();
    otherHandles.forEach((handle) => {
      p = p.then(() => client.switchTo().window(handle).then(() => client.close()));
    });
    p = p.then(() => client.switchTo().window(currentHandle));
    return p;
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

    const currentHandle = await client.getWindowHandle();
    const nextHandle = await this._getWindowHandle(-1);

    await client.switchTo().window(currentHandle);
    await client.close();
    return client.switchTo().window(nextHandle);
  }

  /**
   * Get the window handle relative to the current handle. i.e. the next handle or the previous.
   * @param {Number} offset Offset from current handle index. i.e. offset < 0 will go to the previous handle and positive number will go to the next window handle in sequence.
   */
  async _getWindowHandle(offset = 0) {
    const client = this.browser;
    const handles = await client.getAllWindowHandles();
    const index = handles.indexOf(await client.getWindowHandle());
    const nextIndex = index + offset;

    return handles[nextIndex];
    // return handles[(index + offset) % handles.length];
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
    await this.executeScript('window.open("about:blank")');
    const handles = await client.getAllWindowHandles();
    await client.switchTo().window(handles[handles.length - 1]);
  }

  /**
   * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab
   *
   * ```js
   * I.switchToNextTab();
   * I.switchToNextTab(2);
   * ```
   */
  async switchToNextTab(num = 1) {
    const client = this.browser;
    const newHandle = await this._getWindowHandle(num);

    if (!newHandle) {
      throw new Error(`There is no ability to switch to next tab with offset ${num}`);
    }
    return client.switchTo().window(newHandle);
  }

  /**
   * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab
   *
   * ```js
   * I.switchToPreviousTab();
   * I.switchToPreviousTab(2);
   * ```
   */
  async switchToPreviousTab(num = 1) {
    const client = this.browser;
    const newHandle = await this._getWindowHandle(-1 * num);

    if (!newHandle) {
      throw new Error(`There is no ability to switch to previous tab with offset ${num}`);
    }
    return client.switchTo().window(newHandle);
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
  async waitForElement(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    const el = global.element(guessLocator(locator) || global.by.css(locator));
    return this.browser.wait(EC.presenceOf(el), aSec * 1000);
  }

  /**
   * {{> ../webapi/waitUntilExists }}
   */
  waitUntilExists(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    const el = global.element(guessLocator(locator) || global.by.css(locator));
    return this.browser.wait(EC.not(EC.presenceOf(el)), aSec * 1000);
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
   * {{> ../webapi/refreshPage }}
   */
  refreshPage() {
    return this.browser.refresh();
  }

  /**
   * Reloads page
   */
  refresh() {
    console.log('Deprecated in favor of refreshPage');
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
  const matchedLocator = guessLocator(locator);
  if (matchedLocator) {
    return client.findElements(matchedLocator);
  }
  const literal = xpathLocator.literal(locator);
  let els = await client.findElements(global.by.xpath(Locator.checkable.byText(literal)));
  if (els.length) {
    return els;
  }
  els = await client.findElements(global.by.xpath(Locator.checkable.byName(literal)));
  if (els.length) {
    return els;
  }
  return client.findElements(global.by.css(locator));
}

async function findFields(client, locator) {
  const matchedLocator = guessLocator(locator);
  if (matchedLocator) {
    return client.findElements(matchedLocator);
  }
  const literal = xpathLocator.literal(locator);

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
  return client.findElements(global.by.css(locator));
}

async function proceedSee(assertType, text, context) {
  let description;
  let locator;
  if (!context) {
    if (this.context === this.options.rootElement) {
      locator = guessLocator(this.context) || global.by.css(this.context);
      description = 'web application';
    } else {
      // inside within block
      locator = global.by.xpath('.//*');
      description = `current context ${(new Locator(context)).toString()}`;
    }
  } else {
    locator = guessLocator(context) || global.by.css(context);
    description = `element ${(new Locator(context)).toString()}`;
  }
  const enableSmartWait = !!this.context && assertType === 'assert';
  const els = await this._smartWait(() => this.browser.findElements(locator), enableSmartWait);
  const promises = [];
  let source = '';
  els.forEach(el => promises.push(el.getText().then(elText => source += `| ${elText}`)));
  await Promise.all(promises);
  return stringIncludes(description)[assertType](text, source);
}

async function proceedSeeInField(assertType, field, value) {
  const els = await findFields(this.browser, field);
  assertElementExists(els, field, 'Field');
  const el = els[0];
  const tag = await el.getTagName();
  const fieldVal = await el.getAttribute('value');
  if (tag === 'select') {
    // locate option by values and check them
    const literal = xpathLocator.literal(fieldVal);
    const textEl = await el.findElement(global.by.xpath(Locator.select.byValue(literal)));
    const text = await textEl.getText();
    return equals(`select option by ${field}`)[assertType](value, text);
  }
  return stringIncludes(`field by ${field}`)[assertType](value, fieldVal);
}

async function proceedIsChecked(assertType, option) {
  const els = await findCheckable(this.browser, option);
  assertElementExists(els, option, 'Option');
  const elsSelected = [];
  els.forEach(el => elsSelected.push(el.isSelected()));
  const values = await Promise.all(elsSelected);
  const selected = values.reduce((prev, cur) => prev || cur);
  return truth(`checkable ${option}`, 'to be checked')[assertType](selected);
}

async function findClickable(matcher, locator) {
  locator = new Locator(locator);
  if (!locator.isFuzzy()) {
    const els = await this._locate(locator.value, true);
    assertElementExists(els, locator.value);
    return els[0];
  }
  const literal = xpathLocator.literal(locator.value);
  const narrowLocator = Locator.clickable.narrow(literal);
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

function guessLocator(locator) {
  const l = new Locator(locator);
  if (l.isFuzzy()) return false;
  if (l.type) return global.by[l.type](l.value);
  return false;
}

function assertElementExists(res, locator, prefix, suffix) {
  if (!res.length) {
    throw new ElementNotFound(locator, prefix, suffix);
  }
}
