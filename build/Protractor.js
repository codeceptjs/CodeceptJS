let EC;
let Key;
let Button;
let ProtractorBy;
let ProtractorExpectedConditions;

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
  convertCssPropertiesToCamelCase,
} = require('../utils');
const {
  isColorProperty,
  convertColorToRGBA,
} = require('../colorUtils');
const ElementNotFound = require('./errors/ElementNotFound');
const ConnectionRefused = require('./errors/ConnectionRefused');
const Locator = require('../locator');
const path = require('path');
const recorder = require('../recorder');

let withinStore = {};
let Runner;

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
 * * `fullPageScreenshots` (optional, default: false) - make full page screenshots on failure.
 * * `uniqueScreenshotNames` (optional, default: false)  - option to prevent screenshot override if you have scenarios with the same name in different suites
 * * `keepBrowserState` (optional, default: false)  - keep browser state between tests when `restart` set to false.
 * * `seleniumAddress` - Selenium address to connect (default: http://localhost:4444/wd/hub)
 * * `rootElement` - Root element of AngularJS application (default: body)
 * * `getPageTimeout` (optional) sets default timeout for a page to be loaded. 10000 by default.
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
    // process.env.SELENIUM_PROMISE_MANAGER = false; // eslint-disable-line
    super(config);

    this.isRunning = false;
    this._setConfig(config);
  }

  _validateConfig(config) {
    const defaults = {
      browser: 'chrome',
      url: 'http://localhost',
      seleniumAddress: 'http://localhost:4444/wd/hub',
      fullPageScreenshots: false,
      rootElement: 'body',
      allScriptsTimeout: 10000,
      scriptTimeout: 10000,
      waitForTimeout: 1000, // ms
      windowSize: null,
      getPageTimeout: 10000,
      driver: 'hosted',
      capabilities: {},
      angular: true,
      restart: true,
    };

    config = Object.assign(defaults, config);

    if (!config.allScriptsTimeout) config.allScriptsTimeout = config.scriptsTimeout;
    if (!config.scriptTimeout) config.scriptTimeout = config.scriptsTimeout;
    if (config.proxy) config.capabilities.proxy = config.proxy;
    if (config.browser) config.capabilities.browserName = config.browser;

    config.waitForTimeout /= 1000; // convert to seconds
    return config;
  }

  async _init() {
    process.on('unhandledRejection', (reason) => {
      if (reason.message.indexOf('ECONNREFUSED') > 0) {
        this.browser = null;
      }
    });

    Runner = requireg('protractor/built/runner').Runner;
    ProtractorBy = requireg('protractor').ProtractorBy;
    Key = requireg('protractor').Key;
    Button = requireg('protractor').Button;
    ProtractorExpectedConditions = requireg('protractor').ProtractorExpectedConditions;

    return Promise.resolve();
  }

  static _checkRequirements() {
    try {
      requireg('protractor');
      require('assert').ok(requireg('protractor/built/runner').Runner);
    } catch (e) {
      return ['protractor@^5.3.0'];
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
    try {
      const runner = new Runner(this.options);
      this.browser = runner.createBrowser();
      await this.browser.ready;
    } catch (err) {
      if (err.toString().indexOf('ECONNREFUSED')) {
        throw new ConnectionRefused(err);
      }
      throw err;
    }
    if (this.options.angular) {
      await this.amInsideAngularApp();
    } else {
      await this.amOutsideAngularApp();
    }

    loadGlobals(this.browser);

    if (this.options.windowSize === 'maximize') {
      await this.resizeWindow(this.options.windowSize);
    } else if (this.options.windowSize) {
      const size = this.options.windowSize.split('x');
      await this.resizeWindow(parseInt(size[0], 10), parseInt(size[1], 10));
    }
    this.context = this.options.rootElement;
    this.isRunning = true;
    return this.browser.ready;
  }

  async _before() {
    if (this.options.restart && !this.options.manualStart) return this._startBrowser();
    if (!this.isRunning && !this.options.manualStart) return this._startBrowser();
  }

  async _after() {
    if (!this.browser) return;
    if (!this.isRunning) return;
    if (this.options.restart) {
      this.isRunning = false;
      return this.browser.quit();
    }
    if (this.options.keepBrowserState) return;

    const dialog = await this.grabPopupText();
    if (dialog) {
      await this.cancelPopup();
    }
    if (!this.options.keepCookies) {
      await this.browser.manage().deleteAllCookies();
    }
    let url;
    try {
      url = await this.browser.getCurrentUrl();
    } catch (err) {
      // Ignore, as above will throw if no webpage has been loaded
    }
    if (url && !/data:,/i.test(url)) {
      await this.browser.executeScript('localStorage.clear();');
    }
    return this.closeOtherTabs();
  }

  async _failed(test, err) {
    await this._withinEnd();
  }

  async _finishTest() {
    if (!this.options.restart && this.isRunning) return this.browser.quit();
  }


  async _withinBegin(locator) {
    withinStore.elFn = this.browser.findElement;
    withinStore.elsFn = this.browser.findElements;

    const frame = isFrameLocator(locator);

    if (frame) {
      if (Array.isArray(frame)) {
        withinStore.frame = frame.join('>');
        return this.switchTo(null)
          .then(() => frame.reduce((p, frameLocator) => p.then(() => this.switchTo(frameLocator)), Promise.resolve()));
      }
      withinStore.frame = frame;
      return this.switchTo(locator);
    }

    this.context = locator;
    const context = await global.element(guessLocator(locator) || global.by.css(locator));
    if (!context) throw new ElementNotFound(locator);

    this.browser.findElement = l => (l ? context.element(l).getWebElement() : context.getWebElement());
    this.browser.findElements = l => context.all(l).getWebElements();
    return context;
  }

  async _withinEnd() {
    if (!isWithin()) return;
    if (withinStore.frame) {
      withinStore = {};
      return this.switchTo(null);
    }
    this.browser.findElement = withinStore.elFn;
    this.browser.findElements = withinStore.elsFn;
    withinStore = {};
    this.context = this.options.rootElement;
  }

  _session() {
    const defaultSession = this.browser;
    return {
      start: async (opts) => {
        opts = this._validateConfig(Object.assign(this.options, opts));
        this.debugSection('New Browser', JSON.stringify(opts));
        const runner = new Runner(opts);
        const res = await this.browser.executeScript('return [window.outerWidth, window.outerHeight]');
        const browser = runner.createBrowser(null, this.browser);
        await browser.ready;
        await browser.waitForAngularEnabled(this.insideAngular);
        await browser.manage().window().setSize(parseInt(res[0], 10), parseInt(res[1], 10));
        return browser.ready;
      },
      stop: async (browser) => {
        return browser.close();
      },
      loadVars: async (browser) => {
        if (isWithin()) throw new Error('Can\'t start session inside within block');
        this.browser = browser;
        loadGlobals(this.browser);
      },
      restoreVars: async () => {
        if (isWithin()) await this._withinEnd();
        this.browser = defaultSession;
        loadGlobals(this.browser);
      },
    };
  }

  /**
   * Switch to non-Angular mode,
   * start using WebDriver instead of Protractor in this session
   */
  async amOutsideAngularApp() {
    if (!this.browser) return;
    await this.browser.waitForAngularEnabled(false);
    return Promise.resolve(this.insideAngular = false);
  }

  /**
   * Enters Angular mode (switched on by default)
   * Should be used after "amOutsideAngularApp"
   */
  async amInsideAngularApp() {
    await this.browser.waitForAngularEnabled(true);
    return Promise.resolve(this.insideAngular = true);
  }


  /**
   * Get elements by different locator types, including strict locator
   * Should be used in custom helpers:
   *
   * ```js
   * this.helpers['Protractor']._locate({name: 'password'}).then //...
   * ```
   * To use SmartWait and wait for element to appear on a page, add `true` as second arg:
   *
   * ```js
   * this.helpers['Protractor']._locate({name: 'password'}, true).then //...
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
   * Find a checkbox by providing human readable text:
   *
   * ```js
   * this.helpers['Protractor']._locateCheckable('I agree with terms and conditions').then // ...
   * ```
   */
  async _locateCheckable(locator) {
    return findCheckable.call(this, this.browser, locator);
  }

  /**
   * Find a clickable element by providing human readable text:
   *
   * ```js
   * this.helpers['Protractor']._locateClickable('Next page').then // ...
   * ```
   */
  async _locateClickable(locator) {
    return findClickable.call(this, this.browser, locator);
  }

  /**
   * Find field elements by providing human readable text:
   *
   * ```js
   * this.helpers['Protractor']._locateFields('Your email').then // ...
   * ```
   */
  async _locateFields(locator) {
    return findFields.call(this, this.browser, locator);
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
   * Performs right click on an element matched by CSS or XPath.

@param locator element located by CSS|XPath|strict locator.
   */
  async rightClick(locator, context = null) {
    /**
     * just press button if no selector is given
     */
    if (locator === undefined) {
      return this.browser.actions().click(Button.RIGHT).perform();
    }

    const els = await this._locate(locator, true);
    assertElementExists(els);
    const el = els[0];

    await this.browser.actions().mouseMove(el).perform();
    return this.browser.actions().click(Button.RIGHT).perform();
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
   * Checks that a page contains a visible text.
Use context parameter to narrow down the search.

```js
I.see('Welcome'); // text welcome on a page
I.see('Welcome', '.content'); // text inside .content div
I.see('Register', {css: 'form.register'}); // use strict locator
```
@param text expected on page.
@param context (optional) element located by CSS|Xpath|strict locator in which to search for text.
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
   * Opposite to `see`. Checks that a text is not present on a page.
Use context parameter to narrow down the search.

```js
I.dontSee('Login'); // assume we are already logged in
```
@param text is not present.
@param context (optional) element located by CSS|XPath|strict locator in which to perfrom search.
   */
  dontSee(text, context = null) {
    return proceedSee.call(this, 'negate', text, context);
  }

  /**
   * Get JS log from browser. Log buffer is reset after each request.
Resumes test execution, so **should be used inside an async function with `await`** operator.

```js
let logs = await I.grabBrowserLogs();
console.log(JSON.stringify(logs))
```
   */
  async grabBrowserLogs() {
    return this.browser.manage().logs().get('browser');
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
    return this.browser.getCurrentUrl();
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
   */
  async fillField(field, value) {
    const els = await findFields(this.browser, field);
    await els[0].clear();
    return els[0].sendKeys(value);
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
   * Attaches a file to element located by label, name, CSS or XPath
Path to file is relative current codecept directory (where codecept.json is located).
File will be uploaded to remote system (if tests are running remotely).

```js
I.attachFile('Avatar', 'data/avatar.jpg');
I.attachFile('form input[name=avatar]', 'data/avatar.jpg');
```

@param locator field located by label|name|CSS|XPath|strict locator.
@param pathToFile local file path relative to codecept.json config file.
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
   */
  async seeInField(field, value) {
    return proceedSeeInField.call(this, 'assert', field, value);
  }

  /**
   * Checks that value of input field or textare doesn't equal to given value
Opposite to `seeInField`.

@param field located by label|name|CSS|XPath|strict locator.
@param value value to check.
   */
  async dontSeeInField(field, value) {
    return proceedSeeInField.call(this, 'negate', field, value);
  }

  /**
   * Appends text to a input field or textarea.
Field is located by name, label, CSS or XPath

```js
I.appendField('#myTextField', 'appended');
```
@param field located by label|name|CSS|XPath|strict locator
@param value text value to append.
   */
  async appendField(field, value) {
    const els = await findFields(this.browser, field);
    assertElementExists(els, field, 'Field');
    return els[0].sendKeys(value);
  }

  /**
   * Clears a `<textarea>` or text `<input>` element's value.

```js
I.clearField('Email');
I.clearField('user[email]');
I.clearField('#email');
```
@param field located by label|name|CSS|XPath|strict locator.
   */
  async clearField(field) {
    const els = await findFields(this.browser, field);
    assertElementExists(els, field, 'Field');
    return els[0].clear();
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
   * Verifies that the specified checkbox is checked.

```js
I.seeCheckboxIsChecked('Agree');
I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
```
@param field located by label|name|CSS|XPath|strict locator.
   */
  async seeCheckboxIsChecked(field) {
    return proceedIsChecked.call(this, 'assert', field);
  }

  /**
   * Verifies that the specified checkbox is not checked.

@param field located by label|name|CSS|XPath|strict locator.
   */
  async dontSeeCheckboxIsChecked(field) {
    return proceedIsChecked.call(this, 'negate', field);
  }

  /**
   * Retrieves a text from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside async with `await`** operator.

```js
let pin = await I.grabTextFrom('#pin');
```
If multiple elements found returns an array of texts.

@param locator element located by CSS|XPath|strict locator.
   */
  async grabTextFrom(locator) {
    const els = await this._locate(locator);
    assertElementExists(els);
    const texts = [];
    for (const el of els) {
      texts.push(await el.getText());
    }
    if (texts.length === 1) return texts[0];
    return texts;
  }

  /**
   * Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside async function with `await`** operator.

```js
let postHTML = await I.grabHTMLFrom('#post');
```

@param locator element located by CSS|XPath|strict locator.
   */
  async grabHTMLFrom(locator) {
    const els = await this._locate(locator);
    assertElementExists(els);

    const html = await Promise.all(els.map((el) => {
      return this.browser.executeScript('return arguments[0].innerHTML;', el);
    }));

    if (html.length === 1) {
      return html[0];
    }
    return html;
  }

  /**
   * Retrieves a value from a form element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside async function with `await`** operator.

```js
let email = await I.grabValueFrom('input[name=email]');
```
@param locator field located by label|name|CSS|XPath|strict locator.
   */
  async grabValueFrom(locator) {
    const els = await findFields(this.browser, locator);
    assertElementExists(els, locator, 'Field');
    return els[0].getAttribute('value');
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
    const els = await this._locate(locator, true);
    assertElementExists(els, locator);
    const values = await Promise.all(els.map(el => el.getCssValue(cssProperty)));

    if (Array.isArray(values) && values.length === 1) {
      return values[0];
    }
    return values;
  }

  /**
   * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside async with `await`** operator.

```js
let hint = await I.grabAttributeFrom('#tooltip', 'title');
```
@param locator element located by CSS|XPath|strict locator.
@param attr attribute name.
   */
  async grabAttributeFrom(locator, attr) {
    const els = await this._locate(locator);
    assertElementExists(els);
    return els[0].getAttribute(attr);
  }

  /**
   * Checks that title contains text.

@param text text value to check.
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
   * Checks that title does not contain text.

@param text text value to check.
   */
  async dontSeeInTitle(text) {
    return this.browser.getTitle().then(title => stringIncludes('web page title').negate(text, title));
  }

  /**
   * Retrieves a page title and returns it to test.
Resumes test execution, so **should be used inside async with `await`** operator.

```js
let title = await I.grabTitle();
```
   */
  async grabTitle() {
    return this.browser.getTitle().then((title) => {
      this.debugSection('Title', title);
      return title;
    });
  }

  /**
   * Checks that a given Element is visible
Element is located by CSS or XPath.

```js
I.seeElement('#modal');
```
@param locator located by CSS|XPath|strict locator.
   */
  async seeElement(locator) {
    let els = await this._locate(locator, true);
    els = await Promise.all(els.map(el => el.isDisplayed()));
    return empty('elements').negate(els.filter(v => v).fill('ELEMENT'));
  }

  /**
   * Opposite to `seeElement`. Checks that element is not visible (or in DOM)

@param locator located by CSS|XPath|Strict locator.
   */
  async dontSeeElement(locator) {
    let els = await this._locate(locator, false);
    els = await Promise.all(els.map(el => el.isDisplayed()));
    return empty('elements').assert(els.filter(v => v).fill('ELEMENT'));
  }

  /**
   * Checks that a given Element is present in the DOM
Element is located by CSS or XPath.

```js
I.seeElementInDOM('#modal');
```
@param locator located by CSS|XPath|strict locator.
   */
  async seeElementInDOM(locator) {
    return this.browser.findElements(guessLocator(locator) || global.by.css(locator)).then(els => empty('elements').negate(els.fill('ELEMENT')));
  }

  /**
   * Opposite to `seeElementInDOM`. Checks that element is not on page.

@param locator located by CSS|XPath|Strict locator.
   */
  async dontSeeElementInDOM(locator) {
    return this.browser.findElements(guessLocator(locator) || global.by.css(locator)).then(els => empty('elements').assert(els.fill('ELEMENT')));
  }

  /**
   * Checks that the current page contains the given string in its raw source code.

```js
I.seeInSource('<h1>Green eggs &amp; ham</h1>');
```
@param text value to check.
   */
  async seeInSource(text) {
    return this.browser.getPageSource().then(source => stringIncludes('HTML source of a page').assert(text, source));
  }

  /**
   * Retrieves page source and returns it to test.
Resumes test execution, so should be used inside an async function.

```js
let pageSource = await I.grabSource();
```
   */
  async grabSource() {
    return this.browser.getPageSource();
  }

  /**
   * Checks that the current page contains the given string in its raw source code.

@param text value to check.
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
    return equals(`expected number of visible elements (${locator}) is ${num}, but found ${res}`).assert(res, num);
  }

  /**
   * Grab number of visible elements by locator.

```js
I.grabNumberOfVisibleElements('p');
```

@param locator located by CSS|XPath|strict locator.
   */
  async grabNumberOfVisibleElements(locator) {
    let els = await this._locate(locator);
    els = await Promise.all(els.map(el => el.isDisplayed()));
    return els.length;
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
    const els = await this._locate(locator);
    assertElementExists(els, locator);

    const cssPropertiesCamelCase = convertCssPropertiesToCamelCase(cssProperties);

    const attributeNames = Object.keys(cssPropertiesCamelCase);
    const expectedValues = attributeNames.map(name => cssPropertiesCamelCase[name]);
    const missingAttributes = [];

    for (const el of els) {
      const attributeValues = await Promise.all(attributeNames.map(attr => el.getCssValue(attr)));

      const missing = attributeValues.filter((actual, i) => {
        const prop = attributeNames[i];
        let propValue = actual;
        if (isColorProperty(prop) && propValue) {
          propValue = convertColorToRGBA(propValue);
        }
        return propValue !== expectedValues[i];
      });
      if (missing.length) {
        missingAttributes.push(...missing);
      }
    }
    return equals(`all elements (${locator}) to have CSS property ${JSON.stringify(cssProperties)}`).assert(missingAttributes.length, 0);
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
    const els = await this._locate(locator);
    assertElementExists(els, locator);

    const attributeNames = Object.keys(attributes);
    const expectedValues = attributeNames.map(name => attributes[name]);
    const missingAttributes = [];

    for (const el of els) {
      const attributeValues = await Promise.all(attributeNames.map(attr => el.getAttribute(attr)));
      const missing = attributeValues.filter((actual, i) => {
        if (expectedValues[i] instanceof RegExp) {
          return expectedValues[i].test(actual);
        }
        return actual !== expectedValues[i];
      });
      if (missing.length) {
        missingAttributes.push(...missing);
      }
    }

    return equals(`all elements (${locator}) to have attributes ${JSON.stringify(attributes)}`).assert(missingAttributes.length, 0);
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
   */
  async executeScript(fn) {
    return this.browser.executeScript.apply(this.browser, arguments);
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
   */
  async executeAsyncScript(fn) {
    this.browser.manage().timeouts().setScriptTimeout(this.options.scriptTimeout);
    return this.browser.executeAsyncScript.apply(this.browser, arguments);
  }

  /**
     * Checks that current url contains a provided fragment.

```js
I.seeInCurrentUrl('/register'); // we are on registration page
```

@param url value to check.
   */
  async seeInCurrentUrl(url) {
    return this.browser.getCurrentUrl().then(currentUrl => stringIncludes('url').assert(url, currentUrl));
  }

  /**
   * Checks that current url does not contain a provided fragment.

@param url value to check.
   */
  async dontSeeInCurrentUrl(url) {
    return this.browser.getCurrentUrl().then(currentUrl => stringIncludes('url').negate(url, currentUrl));
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
   */
  async seeCurrentUrlEquals(url) {
    return this.browser.getCurrentUrl().then(currentUrl => urlEquals(this.options.url).assert(url, currentUrl));
  }

  /**
   * Checks that current url is not equal to provided one.
If a relative url provided, a configured url will be prepended to it.

@param url value to check.
   */
  async dontSeeCurrentUrlEquals(url) {
    return this.browser.getCurrentUrl().then(currentUrl => urlEquals(this.options.url).negate(url, currentUrl));
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
   */
  async saveScreenshot(fileName, fullPage = false) {
    const outputFile = path.join(global.output_dir, fileName);

    const writeFile = (png, outputFile) => {
      const fs = require('fs');
      const stream = fs.createWriteStream(outputFile);
      stream.write(Buffer.from(png, 'base64'));
      stream.end();
      return new Promise(resolve => stream.on('finish', resolve));
    };

    if (!fullPage) {
      this.debug(`Screenshot has been saved to ${outputFile}`);
      const png = await this.browser.takeScreenshot();
      return writeFile(png, outputFile);
    }

    let { width, height } = await this.browser.executeScript(() => ({ // eslint-disable-line
      height: document.body.scrollHeight,
      width: document.body.scrollWidth,
    }));

    if (height < 100) height = 500;

    await this.browser.manage().window().setSize(width, height);
    this.debug(`Screenshot has been saved to ${outputFile}, size: ${width}x${height}`);
    const png = await this.browser.takeScreenshot();
    return writeFile(png, outputFile);
  }

  /**
   * Clears a cookie by name,
if none provided clears all cookies.

```js
I.clearCookie();
I.clearCookie('test');
```

@param cookie (optional) cookie name.
   */
  async clearCookie(cookie = null) {
    if (!cookie) {
      return this.browser.manage().deleteAllCookies();
    }
    return this.browser.manage().deleteCookie(cookie);
  }

  /**
   * Checks that cookie with given name exists.

```js
I.seeCookie('Auth');
```

@param name cookie name.
   */
  async seeCookie(name) {
    return this.browser.manage().getCookie(name).then(res => truth(`cookie ${name}`, 'to be set').assert(res));
  }

  /**
   * Checks that cookie with given name does not exist.

@param name cookie name.
   */
  async dontSeeCookie(name) {
    return this.browser.manage().getCookie(name).then(res => truth(`cookie ${name}`, 'to be set').negate(res));
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
   *
   * Returns cookie in JSON [format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).
   */
  async grabCookie(name) {
    return this.browser.manage().getCookie(name);
  }

  /**
   * Accepts the active JavaScript native popup window, as created by window.alert|window.confirm|window.prompt.
   * Don't confuse popups with modal windows, as created by [various
   * libraries](http://jster.net/category/windows-modals-popups). Appium: support only web testing
   */
  async acceptPopup() {
    return this.browser.switchTo().alert().accept();
  }

  /**
   * Dismisses the active JavaScript popup, as created by window.alert|window.confirm|window.prompt.
   */
  async cancelPopup() {
    return this.browser.switchTo().alert().dismiss();
  }

  /**
   * Checks that the active JavaScript popup, as created by `window.alert|window.confirm|window.prompt`, contains the
   * given string.
   */
  async seeInPopup(text) {
    const popupAlert = await this.browser.switchTo().alert();
    const res = await popupAlert.getText();
    if (res === null) {
      throw new Error('Popup is not opened');
    }
    stringIncludes('text in popup').assert(text, res);
  }

  /**
   * Grab the text within the popup. If no popup is visible then it will return null
   *
   * ```js
   * await I.grabPopupText();
   * ```
   */
  async grabPopupText() {
    try {
      const dialog = await this.browser.switchTo().alert();

      if (dialog) {
        return dialog.getText();
      }
    } catch (e) {
      if (e.message.match(/no.*?(alert|modal)/i)) {
        // Don't throw an error
        return null;
      }
      throw e;
    }
  }

  /**
   * Resize the current window to provided width and height.
First parameter can be set to `maximize`.

@param width width in pixels or `maximize`.
@param height height in pixels.
   */
  async resizeWindow(width, height) {
    if (width === 'maximize') {
      const res = await this.browser.executeScript('return [screen.width, screen.height]');
      return this.browser.manage().window().setSize(parseInt(res[0], 10), parseInt(res[1], 10));
    }
    return this.browser.manage().window().setSize(parseInt(width, 10), parseInt(height, 10));
  }

  /**
   * Drag an item to a destination element.

```js
I.dragAndDrop('#dragHandle', '#container');
```

@param srcElement located by CSS|XPath|strict locator.
@param destElement located by CSS|XPath|strict locator.
   */
  async dragAndDrop(srcElement, destElement) {
    const srcEl = await this._locate(srcElement, true);
    const destEl = await this._locate(destElement, true);
    assertElementExists(srcEl);
    assertElementExists(destEl);
    return this.browser
      .actions()
      .dragAndDrop(srcEl[0], destEl[0])
      .perform();
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
   * Grab number of open tabs.

```js
I.grabNumberOfOpenTabs();
```
   */
  async grabNumberOfOpenTabs() {
    const pages = await this.browser.getAllWindowHandles();
    return pages.length;
  }

  /**
   * Switches frame or in case of null locator reverts to parent.

@param locator element located by CSS|XPath|strict locator.
   */
  async switchTo(locator) {
    if (Number.isInteger(locator)) {
      return this.browser.switchTo().frame(locator);
    } else if (!locator) {
      return this.browser.switchTo().frame(null);
    }

    const els = await this._locate(withStrictLocator.call(this, locator), true);
    assertElementExists(els, locator);
    return this.browser.switchTo().frame(els[0]);
  }

  /**
   * Pauses execution for a number of seconds.

```js
I.wait(2); // wait 2 secs
```

@param sec number of second to wait.
@param sec time in seconds to wait.
   */
  wait(sec) {
    return this.browser.sleep(sec * 1000);
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
   */
  async waitForElement(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    const el = global.element(guessLocator(locator) || global.by.css(locator));
    return this.browser.wait(EC.presenceOf(el), aSec * 1000);
  }

  async waitUntilExists(locator, sec = null) {
    console.log(`waitUntilExists deprecated:
    * use 'waitForElement' to wait for element to be attached
    * use 'waitForDetached to wait for element to be removed'`);
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
   */
  async waitForDetached(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    const el = global.element(guessLocator(locator) || global.by.css(locator));
    return this.browser.wait(EC.not(EC.presenceOf(el)), aSec * 1000).catch((err) => {
      if (err.message && err.message.indexOf('Wait timed out after') > -1) {
        throw new Error(`element (${JSON.stringify(locator)}) still on page after ${sec} sec`);
      } else throw err;
    });
  }

  /**
   * Waits for element to become clickable for number of seconds.
   *
   * ```js
   * I.waitForClickable('#link');
   * ```
   */
  async waitForClickable(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    const el = global.element(guessLocator(locator) || global.by.css(locator));
    return this.browser.wait(EC.elementToBeClickable(el), aSec * 1000);
  }

  /**
   * Waits for an element to become visible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

```
I.waitForVisible('#popup');
```

@param locator element located by CSS|XPath|strict locator.
@param sec (optional) time in seconds to wait, 1 by default.
   */
  async waitForVisible(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    const el = global.element(guessLocator(locator) || global.by.css(locator));
    return this.browser.wait(EC.visibilityOf(el), aSec * 1000);
  }

  /**
   * Waits for an element to hide (by default waits for 1sec).
Element can be located by CSS or XPath.

```
I.waitToHide('#popup');
```

@param locator element located by CSS|XPath|strict locator.
@param sec (optional) time in seconds to wait, 1 by default.
   */
  async waitToHide(locator, sec = null) {
    return this.waitForInvisible(locator, sec);
  }

  /**
   * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

```
I.waitForInvisible('#popup');
```

@param locator element located by CSS|XPath|strict locator.
@param sec (optional) time in seconds to wait, 1 by default.
   */
  async waitForInvisible(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    const el = global.element(guessLocator(locator) || global.by.css(locator));
    return this.browser.wait(EC.invisibilityOf(el), aSec * 1000);
  }

  async waitForStalenessOf(locator, sec = null) {
    console.log(`waitForStalenessOf deprecated.
    * Use waitForDetached to wait for element to be removed from page
    * Use waitForInvisible to wait for element to be hidden on page`);
    return this.waitForInvisible(locator, sec);
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
    function visibilityCountOf(loc, expectedCount) {
      return function () {
        return global.element.all(loc)
          .filter(el => el.isDisplayed())
          .count()
          .then(count => count === expectedCount);
      };
    }

    const aSec = sec || this.options.waitForTimeout;
    const guessLoc = guessLocator(locator) || global.by.css(locator);

    return this.browser.wait(visibilityCountOf(guessLoc, num), aSec * 1000)
      .catch((err) => {
        throw Error(`The number of elements (${locator}) is not ${num} after ${aSec} sec`);
      });
  }

  /**
   * Waits for element to become enabled (by default waits for 1sec).
Element can be located by CSS or XPath.

@param locator element located by CSS|XPath|strict locator.
@param sec (optional) time in seconds to wait, 1 by default.
   */
  async waitForEnabled(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    const el = global.element(guessLocator(locator) || global.by.css(locator));

    return this.browser.wait(EC.elementToBeClickable(el), aSec * 1000)
      .catch((err) => {
        throw Error(`element (${locator}) still not enabled after ${aSec} sec`);
      });
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
    const aSec = sec || this.options.waitForTimeout;

    const valueToBeInElementValue = (loc, expectedCount) => {
      return async () => {
        const els = await findFields(this.browser, loc);

        if (!els) {
          return false;
        }
        const values = await Promise.all(els.map(el => el.getAttribute('value')));
        return values.filter(part => part.indexOf(value) >= 0).length > 0;
      };
    };

    return this.browser.wait(valueToBeInElementValue(field, value), aSec * 1000)
      .catch((err) => {
        throw Error(`element (${field}) is not in DOM or there is no element(${field}) with value "${value}" after ${aSec} sec`);
      });
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
    return this.browser.wait(() => this.browser.executeScript.call(this.browser, fn, ...args), aSec * 1000);
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
   */
  async waitUntil(fn, sec = null, timeoutMsg = null) {
    const aSec = sec || this.options.waitForTimeout;
    return this.browser.wait(fn, aSec * 1000, timeoutMsg);
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
    const aSec = sec || this.options.waitForTimeout;
    const waitTimeout = aSec * 1000;

    return this.browser.wait(EC.urlContains(urlPart), waitTimeout)
      .catch(async (e) => {
        const currUrl = await this.browser.getCurrentUrl();
        if (/wait timed out after/i.test(e.message)) {
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
    const waitTimeout = aSec * 1000;
    const baseUrl = this.options.url;
    if (urlPart.indexOf('http') < 0) {
      urlPart = baseUrl + urlPart;
    }

    return this.browser.wait(EC.urlIs(urlPart), waitTimeout)
      .catch(async (e) => {
        const currUrl = await this.browser.getCurrentUrl();
        if (/wait timed out after/i.test(e.message)) {
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
   */
  async waitForText(text, sec = null, context = null) {
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
   * Reload the current page.

````js
`I.refreshPage();
````

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
   * Scrolls to element matched by locator.
Extra shift can be set with offsetX and offsetY options.

```js
I.scrollTo('footer');
I.scrollTo('#submit', 5, 5);
```

@param locator located by CSS|XPath|strict locator.
@param offsetX (optional) X-axis offset.
@param offsetY (optional) Y-axis offset.
   */
  async scrollTo(locator, offsetX = 0, offsetY = 0) {
    if (typeof locator === 'number' && typeof offsetX === 'number') {
      offsetY = offsetX;
      offsetX = locator;
      locator = null;
    }

    if (locator) {
      const res = await this._locate(locator, true);
      if (!res || res.length === 0) {
        return truth(`elements of ${locator}`, 'to be seen').assert(false);
      }
      const elem = res[0];
      const location = await elem.getLocation();
      /* eslint-disable prefer-arrow-callback */
      return this.executeScript(function (x, y) { return window.scrollTo(x, y); }, location.x + offsetX, location.y + offsetY);
      /* eslint-enable */
    }

    /* eslint-disable prefer-arrow-callback, comma-dangle */
    return this.executeScript(function (x, y) { return window.scrollTo(x, y); }, offsetX, offsetY);
    /* eslint-enable */
  }

  /**
   * Scroll page to the top.

```js
I.scrollPageToTop();
```
   */
  async scrollPageToTop() {
    return this.executeScript('window.scrollTo(0, 0);');
  }

  /**
   * Scroll page to the bottom.

```js
I.scrollPageToBottom();
```
   */
  async scrollPageToBottom() {
    /* eslint-disable prefer-arrow-callback, comma-dangle */
    return this.executeScript(function () {
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

  /**
   * Sets a cookie.

```js
I.setCookie({name: 'auth', value: true});
```

@param cookie cookie JSON object.
   */
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

function withStrictLocator(locator) {
  locator = new Locator(locator);
  if (locator.isAccessibilityId()) return withAccessiblitiyLocator.call(this, locator.value);
  return locator.simplify();
}

function withAccessiblitiyLocator(locator) {
  if (this.isWeb === false) {
    return `accessibility id:${locator.slice(1)}`;
  }
  return `[aria-label="${locator.slice(1)}"]`;
  // hook before webdriverio supports native ~ locators in web
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
    const els = await this._locate(locator, true);
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

function isFrameLocator(locator) {
  locator = new Locator(locator);
  if (locator.isFrame()) return locator.value;
  return false;
}

function isWithin() {
  return Object.keys(withinStore).length !== 0;
}

function loadGlobals(browser) {
  global.browser = browser;
  global.$ = browser.$;
  global.$$ = browser.$$;
  global.element = browser.element;
  global.by = global.By = new ProtractorBy();
  global.ExpectedConditions = EC = new ProtractorExpectedConditions(browser);
}
