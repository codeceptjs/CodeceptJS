// @ts-nocheck
const fs = require('fs');
const assert = require('assert');
const path = require('path');
const qrcode = require('qrcode-terminal');
const createTestCafe = require('testcafe');
const { Selector, ClientFunction } = require('testcafe');

const Helper = require('@codeceptjs/helper');
const ElementNotFound = require('./errors/ElementNotFound');
const testControllerHolder = require('./testcafe/testControllerHolder');
const {
  mapError,
  createTestFile,
  createClientFunction,
} = require('./testcafe/testcafe-utils');

const stringIncludes = require('../assert/include').includes;
const { urlEquals } = require('../assert/equal');
const { empty } = require('../assert/empty');
const { truth } = require('../assert/truth');
const {
  xpathLocator, normalizeSpacesInString,
} = require('../utils');
const Locator = require('../locator');

/**
 * Client Functions
 */
const getPageUrl = t => ClientFunction(() => document.location.href).with({ boundTestRun: t });
const getHtmlSource = t => ClientFunction(() => document.getElementsByTagName('html')[0].innerHTML).with({ boundTestRun: t });

/**
 * Uses [TestCafe](https://github.com/DevExpress/testcafe) library to run cross-browser tests.
 * The browser version you want to use in tests must be installed on your system.
 *
 * Requires `testcafe` package to be installed.
 *
 * ```
 * npm i testcafe --save-dev
 * ```
 *
 * ## Configuration
 *
 * This helper should be configured in codecept.conf.ts or codecept.conf.js
 *
 * * `url`: base url of website to be tested
 * * `show`: (optional, default: false) - show browser window.
 * * `windowSize`: (optional) - set browser window width and height
 * * `getPageTimeout` (optional, default: '30000') config option to set maximum navigation time in milliseconds.
 * * `waitForTimeout`: (optional) default wait* timeout in ms. Default: 5000.
 * * `browser`: (optional, default: chrome)  - See https://devexpress.github.io/testcafe/documentation/using-testcafe/common-concepts/browsers/browser-support.html
 *
 *
 * #### Example #1: Show chrome browser window
 *
 * ```js
 * {
 *    helpers: {
 *      TestCafe : {
 *        url: "http://localhost",
 *        waitForTimeout: 15000,
 *        show: true,
 *        browser: "chrome"
 *      }
 *    }
 * }
 * ```
 *
 *  To use remote device you can provide 'remote' as browser parameter this will display a link with QR Code
 *  See https://devexpress.github.io/testcafe/documentation/recipes/test-on-remote-computers-and-mobile-devices.html
 *  #### Example #2: Remote browser connection
 *
 * ```js
 * {
 *    helpers: {
 *      TestCafe : {
 *        url: "http://localhost",
 *        waitForTimeout: 15000,
 *        browser: "remote"
 *      }
 *    }
 * }
 * ```
 *
 * ## Access From Helpers
 *
 * Call Testcafe methods directly using the testcafe controller.
 *
 * ```js
 * const testcafeTestController = this.helpers['TestCafe'].t;
 * const comboBox = Selector('.combo-box');
 * await testcafeTestController
 *   .hover(comboBox) // hover over combo box
 *   .click('#i-prefer-both') // click some other element
 * ```
 *
 * ## Methods
 */
class TestCafe extends Helper {
  constructor(config) {
    super(config);

    this.testcafe = undefined; // testcafe instance
    this.t = undefined; // testcafe test controller
    this.dummyTestcafeFile; // generated testcafe test file

    // context is used for within() function.
    // It requires to have _withinBeginand _withinEnd implemented.
    // Inside _withinBegin we should define that all next element calls should be started from a specific element (this.context).
    this.context = undefined; // TODO Not sure if this applies to testcafe

    this.options = {
      url: 'http://localhost',
      show: false,
      browser: 'chrome',
      restart: true, // TODO Test if restart false works
      manualStart: false,
      keepBrowserState: false,
      waitForTimeout: 5000,
      getPageTimeout: 30000,
      fullPageScreenshots: false,
      disableScreenshots: false,
      windowSize: undefined,
      ...config,
    };
  }

  // TOOD Do a requirements check
  static _checkRequirements() {
    try {
      require('testcafe');
    } catch (e) {
      return ['testcafe@^1.1.0'];
    }
  }

  static _config() {
    return [
      { name: 'url', message: 'Base url of site to be tested', default: 'http://localhost' },
      { name: 'browser', message: 'Browser to be used', default: 'chrome' },
      {
        name: 'show', message: 'Show browser window', default: true, type: 'confirm',
      },
    ];
  }

  async _configureAndStartBrowser() {
    this.dummyTestcafeFile = createTestFile(global.output_dir); // create a dummy test file to get hold of the test controller

    this.iteration += 2; // Use different ports for each test run
    // @ts-ignore
    this.testcafe = await createTestCafe('', null, null);

    this.debugSection('_before', 'Starting testcafe browser...');

    this.isRunning = true;

    // TODO Do we have to cleanup the runner?
    const runner = this.testcafe.createRunner();

    this.options.browser !== 'remote' ? this._startBrowser(runner) : this._startRemoteBrowser(runner);

    this.t = await testControllerHolder.get();
    assert(this.t, 'Expected to have the testcafe test controller');

    if (this.options.windowSize && this.options.windowSize.indexOf('x') > 0) {
      const dimensions = this.options.windowSize.split('x');
      await this.t.resizeWindow(parseInt(dimensions[0], 10), parseInt(dimensions[1], 10));
    }
  }

  async _startBrowser(runner) {
    runner
      .src(this.dummyTestcafeFile)
      .screenshots(global.output_dir, !this.options.disableScreenshots)
      // .video(global.output_dir) // TODO Make this configurable
      .browsers(this.options.show ? this.options.browser : `${this.options.browser}:headless`)
      .reporter('minimal')
      .run({
        skipJsErrors: true,
        skipUncaughtErrors: true,
        quarantineMode: false,
        // debugMode: true,
        // debugOnFail: true,
        // developmentMode: true,
        pageLoadTimeout: this.options.getPageTimeout,
        selectorTimeout: this.options.waitForTimeout,
        assertionTimeout: this.options.waitForTimeout,
        takeScreenshotsOnFails: true,
      })
      .catch((err) => {
        this.debugSection('_before', `Error ${err.toString()}`);
        this.isRunning = false;
        this.testcafe.close();
      });
  }

  async _startRemoteBrowser(runner) {
    const remoteConnection = await this.testcafe.createBrowserConnection();
    console.log('Connect your device to the following URL or scan QR Code: ', remoteConnection.url);
    qrcode.generate(remoteConnection.url);
    remoteConnection.once('ready', () => {
      runner
        .src(this.dummyTestcafeFile)
        .browsers(remoteConnection)
        .reporter('minimal')
        .run({
          selectorTimeout: this.options.waitForTimeout,
          skipJsErrors: true,
          skipUncaughtErrors: true,
        })
        .catch((err) => {
          this.debugSection('_before', `Error ${err.toString()}`);
          this.isRunning = false;
          this.testcafe.close();
        });
    });
  }

  async _stopBrowser() {
    this.debugSection('_after', 'Stopping testcafe browser...');

    testControllerHolder.free();
    if (this.testcafe) {
      this.testcafe.close();
    }

    fs.unlinkSync(this.dummyTestcafeFile); // remove the dummy test
    this.t = undefined;

    this.isRunning = false;
  }

  _init() {
  }

  async _beforeSuite() {
    if (!this.options.restart && !this.options.manualStart && !this.isRunning) {
      this.debugSection('Session', 'Starting singleton browser session');
      return this._configureAndStartBrowser();
    }
  }

  async _before() {
    if (this.options.restart && !this.options.manualStart) return this._configureAndStartBrowser();
    if (!this.isRunning && !this.options.manualStart) return this._configureAndStartBrowser();
    this.context = null;
  }

  async _after() {
    if (!this.isRunning) return;

    if (this.options.restart) {
      this.isRunning = false;
      return this._stopBrowser();
    }

    if (this.options.keepBrowserState) return;

    if (!this.options.keepCookies) {
      this.debugSection('Session', 'cleaning cookies and localStorage');
      await this.clearCookie();

      // TODO IMHO that should only happen when
      await this.executeScript(() => localStorage.clear())
        .catch((err) => {
          if (!(err.message.indexOf("Storage is disabled inside 'data:' URLs.") > -1)) throw err;
        });
    }
  }

  _afterSuite() {
  }

  async _finishTest() {
    if (!this.options.restart && this.isRunning) return this._stopBrowser();
  }

  /**
   * Use [TestCafe](https://devexpress.github.io/testcafe/documentation/test-api/) API inside a test.
   *
   * First argument is a description of an action.
   * Second argument is async function that gets this helper as parameter.
   *
   * { [`t`](https://devexpress.github.io/testcafe/documentation/test-api/test-code-structure.html#test-controller)) } object from TestCafe API is available.
   *
   * ```js
   * I.useTestCafeTo('handle browser dialog', async ({ t }) {
   *   await t.setNativeDialogHandler(() => true);
   * });
   * ```
   *
   *
   *
   * @param {string} description used to show in logs.
   * @param {function} fn async functuion that executed with TestCafe helper as argument
   */
  useTestCafeTo(description, fn) {
    return this._useTo(...arguments);
  }

  /**
   * Get elements by different locator types, including strict locator
   * Should be used in custom helpers:
   *
   * ```js
   * const elements = await this.helpers['TestCafe']._locate('.item');
   * ```
   *
   */
  async _locate(locator) {
    return findElements.call(this, this.context, locator).catch(mapError);
  }

  async _withinBegin(locator) {
    const els = await this._locate(locator);
    assertElementExists(els, locator);
    this.context = await els.nth(0);
  }

  async _withinEnd() {
    this.context = null;
  }

  /**
   * Opens a web page in a browser. Requires relative or absolute url.
   * If url starts with `/`, opens a web page of a site defined in `url` config parameter.
   * 
   * ```js
   * I.amOnPage('/'); // opens main page of website
   * I.amOnPage('https://github.com'); // opens github
   * I.amOnPage('/login'); // opens a login page
   * ```
   * 
   * @param {string} url url path or global url.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async amOnPage(url) {
    if (!(/^\w+\:\/\//.test(url))) {
      url = this.options.url + url;
    }

    return this.t.navigateTo(url)
      .catch(mapError);
  }

  /**
   * Resize the current window to provided width and height.
   * First parameter can be set to `maximize`.
   * 
   * @param {number} width width in pixels or `maximize`.
   * @param {number} height height in pixels.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async resizeWindow(width, height) {
    if (width === 'maximize') {
      return this.t.maximizeWindow().catch(mapError);
    }

    return this.t.resizeWindow(width, height).catch(mapError);
  }

  /**
   * Calls [focus](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) on the matching element.
   * 
   * Examples:
   * 
   * ```js
   * I.dontSee('#add-to-cart-btn');
   * I.focus('#product-tile')
   * I.see('#add-to-cart-bnt');
   * ```
   * 
   * @param {string | object} locator field located by label|name|CSS|XPath|strict locator.
   * @param {any} [options] Playwright only: [Additional options](https://playwright.dev/docs/api/class-locator#locator-focus) for available options object as 2nd argument.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   *
   */
  async focus(locator) {
    const els = await this._locate(locator);
    await assertElementExists(els, locator, 'Element to focus');
    const element = await els.nth(0);

    const focusElement = ClientFunction(() => element().focus(), { boundTestRun: this.t, dependencies: { element } });

    return focusElement();
  }

  /**
   * Remove focus from a text input, button, etc.
   * Calls [blur](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) on the element.
   * 
   * Examples:
   * 
   * ```js
   * I.blur('.text-area')
   * ```
   * ```js
   * //element `#product-tile` is focused
   * I.see('#add-to-cart-btn');
   * I.blur('#product-tile')
   * I.dontSee('#add-to-cart-btn');
   * ```
   * 
   * @param {string | object} locator field located by label|name|CSS|XPath|strict locator.
   * @param {any} [options] Playwright only: [Additional options](https://playwright.dev/docs/api/class-locator#locator-blur) for available options object as 2nd argument.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   *
   */
  async blur(locator) {
    const els = await this._locate(locator);
    await assertElementExists(els, locator, 'Element to blur');
    const element = await els.nth(0);

    const blurElement = ClientFunction(() => element().blur(), { boundTestRun: this.t, dependencies: { element } });

    return blurElement();
  }

  /**
   * Perform a click on a link or a button, given by a locator.
   * If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
   * For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
   * For images, the "alt" attribute and inner text of any parent links are searched.
   * 
   * The second parameter is a context (CSS or XPath locator) to narrow the search.
   * 
   * ```js
   * // simple link
   * I.click('Logout');
   * // button of form
   * I.click('Submit');
   * // CSS button
   * I.click('#form input[type=submit]');
   * // XPath
   * I.click('//form/*[@type=submit]');
   * // link in context
   * I.click('Logout', '#nav');
   * // using strict locator
   * I.click({css: 'nav a.login'});
   * ```
   * 
   * @param {string | object} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
   * @param {?string | object | null} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   *
   */
  async click(locator, context = null) {
    return proceedClick.call(this, locator, context);
  }

  /**
   * Reload the current page.
   * 
   * ```js
   * I.refreshPage();
   * ```
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async refreshPage() {
    // eslint-disable-next-line no-restricted-globals
    return this.t.eval(() => location.reload(true), { boundTestRun: this.t }).catch(mapError);
  }

  /**
   * Waits for an element to become visible on a page (by default waits for 1sec).
   * Element can be located by CSS or XPath.
   * 
   * ```js
   * I.waitForVisible('#popup');
   * ```
   * 
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
   * @returns {void} automatically synchronized promise through #recorder
   * 
   *
   */
  async waitForVisible(locator, sec) {
    const timeout = sec ? sec * 1000 : undefined;

    return (await findElements.call(this, this.context, locator))
      .with({ visibilityCheck: true, timeout })()
      .catch(mapError);
  }

  /**
   * Fills a text field or textarea, after clearing its value, with the given string.
   * Field is located by name, label, CSS, or XPath.
   * 
   * ```js
   * // by label
   * I.fillField('Email', 'hello@world.com');
   * // by name
   * I.fillField('password', secret('123456'));
   * // by CSS
   * I.fillField('form#login input[name=username]', 'John');
   * // or by strict locator
   * I.fillField({css: 'form#login input[name=username]'}, 'John');
   * ```
   * @param {string | object} field located by label|name|CSS|XPath|strict locator.
   * @param {string | object} value text value to fill.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async fillField(field, value) {
    const els = await findFields.call(this, field);
    assertElementExists(els, field, 'Field');
    const el = await els.nth(0);
    return this.t
      .typeText(el, value.toString(), { replace: true })
      .catch(mapError);
  }

  /**
   * Clears a `<textarea>` or text `<input>` element's value.
   * 
   * ```js
   * I.clearField('Email');
   * I.clearField('user[email]');
   * I.clearField('#email');
   * ```
   * @param {string | object} editable field located by label|name|CSS|XPath|strict locator.
   * @returns {void} automatically synchronized promise through #recorder.
   * 
   */
  async clearField(field) {
    const els = await findFields.call(this, field);
    assertElementExists(els, field, 'Field');
    const el = await els.nth(0);

    const res = await this.t
      .selectText(el)
      .pressKey('delete');
    return res;
  }

  /**
   * Appends text to a input field or textarea.
   * Field is located by name, label, CSS or XPath
   * 
   * ```js
   * I.appendField('#myTextField', 'appended');
   * // typing secret
   * I.appendField('password', secret('123456'));
   * ```
   * @param {string | object} field located by label|name|CSS|XPath|strict locator
   * @param {string} value text value to append.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   *
   */
  async appendField(field, value) {
    const els = await findFields.call(this, field);
    assertElementExists(els, field, 'Field');
    const el = await els.nth(0);

    return this.t
      .typeText(el, value.toString(), { replace: false })
      .catch(mapError);
  }

  /**
   * Attaches a file to element located by label, name, CSS or XPath
   * Path to file is relative current codecept directory (where codecept.conf.ts or codecept.conf.js is located).
   * File will be uploaded to remote system (if tests are running remotely).
   * 
   * ```js
   * I.attachFile('Avatar', 'data/avatar.jpg');
   * I.attachFile('form input[name=avatar]', 'data/avatar.jpg');
   * ```
   * 
   * @param {string | object} locator field located by label|name|CSS|XPath|strict locator.
   * @param {string} pathToFile local file path relative to codecept.conf.ts or codecept.conf.js config file.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   *
   */
  async attachFile(field, pathToFile) {
    const els = await findFields.call(this, field);
    assertElementExists(els, field, 'Field');
    const el = await els.nth(0);
    const file = path.join(global.codecept_dir, pathToFile);

    return this.t
      .setFilesToUpload(el, [file])
      .catch(mapError);
  }

  /**
   * Presses a key on a focused element.
   * Special keys like 'Enter', 'Control', [etc](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value)
   * will be replaced with corresponding unicode.
   * If modifier key is used (Control, Command, Alt, Shift) in array, it will be released afterwards.
   * 
   * ```js
   * I.pressKey('Enter');
   * I.pressKey(['Control','a']);
   * ```
   * 
   * @param {string|string[]} key key or array of keys to press.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   *
   * {{ keys }}
   */
  async pressKey(key) {
    assert(key, 'Expected a sequence of keys or key combinations');

    return this.t
      .pressKey(key.toLowerCase()) // testcafe keys are lowercase
      .catch(mapError);
  }

  /**
   * Moves cursor to element matched by locator.
   * Extra shift can be set with offsetX and offsetY options.
   * 
   * ```js
   * I.moveCursorTo('.tooltip');
   * I.moveCursorTo('#submit', 5,5);
   * ```
   * 
   * @param {string | object} locator located by CSS|XPath|strict locator.
   * @param {number} [offsetX=0] (optional, `0` by default) X-axis offset.
   * @param {number} [offsetY=0] (optional, `0` by default) Y-axis offset.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   *
   */
  async moveCursorTo(locator, offsetX = 0, offsetY = 0) {
    const els = (await findElements.call(this, this.context, locator)).filterVisible();
    await assertElementExists(els, locator);

    return this.t
      .hover(els.nth(0), { offsetX, offsetY })
      .catch(mapError);
  }

  /**
   * Performs a double-click on an element matched by link|button|label|CSS or XPath.
   * Context can be specified as second parameter to narrow search.
   * 
   * ```js
   * I.doubleClick('Edit');
   * I.doubleClick('Edit', '.actions');
   * I.doubleClick({css: 'button.accept'});
   * I.doubleClick('.btn.edit');
   * ```
   * 
   * @param {string | object} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
   * @param {?string | object} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   *
   */
  async doubleClick(locator, context = null) {
    let matcher;
    if (context) {
      const els = await this._locate(context);
      await assertElementExists(els, context);
      matcher = await els.nth(0);
    }

    const els = (await findClickable.call(this, matcher, locator)).filterVisible();
    return this.t
      .doubleClick(els.nth(0))
      .catch(mapError);
  }

  /**
   * Performs right click on a clickable element matched by semantic locator, CSS or XPath.
   * 
   * ```js
   * // right click element with id el
   * I.rightClick('#el');
   * // right click link or button with text "Click me"
   * I.rightClick('Click me');
   * // right click button with text "Click me" inside .context
   * I.rightClick('Click me', '.context');
   * ```
   * 
   * @param {string | object} locator clickable element located by CSS|XPath|strict locator.
   * @param {?string | object} [context=null] (optional, `null` by default) element located by CSS|XPath|strict locator.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   *
   */
  async rightClick(locator, context = null) {
    let matcher;
    if (context) {
      const els = await this._locate(context);
      await assertElementExists(els, context);
      matcher = await els.nth(0);
    }
    const els = (await findClickable.call(this, matcher, locator)).filterVisible();
    assertElementExists(els, locator);
    return this.t
      .rightClick(els.nth(0))
      .catch(mapError);
  }

  /**
   * Selects a checkbox or radio button.
   * Element is located by label or name or CSS or XPath.
   * 
   * The second parameter is a context (CSS or XPath locator) to narrow the search.
   * 
   * ```js
   * I.checkOption('#agree');
   * I.checkOption('I Agree to Terms and Conditions');
   * I.checkOption('agree', '//form');
   * ```
   * @param {string | object} field checkbox located by label | name | CSS | XPath | strict locator.
   * @param {?string | object} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async checkOption(field, context = null) {
    const el = await findCheckable.call(this, field, context);

    return this.t
      .click(el)
      .catch(mapError);
  }

  /**
   * Unselects a checkbox or radio button.
   * Element is located by label or name or CSS or XPath.
   * 
   * The second parameter is a context (CSS or XPath locator) to narrow the search.
   * 
   * ```js
   * I.uncheckOption('#agree');
   * I.uncheckOption('I Agree to Terms and Conditions');
   * I.uncheckOption('agree', '//form');
   * ```
   * @param {string | object} field checkbox located by label | name | CSS | XPath | strict locator.
   * @param {?string | object} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async uncheckOption(field, context = null) {
    const el = await findCheckable.call(this, field, context);

    if (await el.checked) {
      return this.t
        .click(el)
        .catch(mapError);
    }
  }

  /**
   * Verifies that the specified checkbox is checked.
   * 
   * ```js
   * I.seeCheckboxIsChecked('Agree');
   * I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
   * I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
   * ```
   * 
   * @param {string | object} field located by label|name|CSS|XPath|strict locator.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async seeCheckboxIsChecked(field) {
    return proceedIsChecked.call(this, 'assert', field);
  }

  /**
   * Verifies that the specified checkbox is not checked.
   * 
   * ```js
   * I.dontSeeCheckboxIsChecked('#agree'); // located by ID
   * I.dontSeeCheckboxIsChecked('I agree to terms'); // located by label
   * I.dontSeeCheckboxIsChecked('agree'); // located by name
   * ```
   * 
   * @param {string | object} field located by label|name|CSS|XPath|strict locator.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async dontSeeCheckboxIsChecked(field) {
    return proceedIsChecked.call(this, 'negate', field);
  }

  /**
   * Selects an option in a drop-down select.
   * Field is searched by label | name | CSS | XPath.
   * Option is selected by visible text or by value.
   * 
   * ```js
   * I.selectOption('Choose Plan', 'Monthly'); // select by label
   * I.selectOption('subscription', 'Monthly'); // match option by text
   * I.selectOption('subscription', '0'); // or by value
   * I.selectOption('//form/select[@name=account]','Premium');
   * I.selectOption('form select[name=account]', 'Premium');
   * I.selectOption({css: 'form select[name=account]'}, 'Premium');
   * ```
   * 
   * Provide an array for the second argument to select multiple options.
   * 
   * ```js
   * I.selectOption('Which OS do you use?', ['Android', 'iOS']);
   * ```
   * @param {string | object} select field located by label|name|CSS|XPath|strict locator.
   * @param {string|Array<*>} option visible text or value of option.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async selectOption(select, option) {
    const els = await findFields.call(this, select);
    assertElementExists(els, select, 'Selectable field');

    const el = await els.filterVisible().nth(0);

    if ((await el.tagName).toLowerCase() !== 'select') {
      throw new Error('Element is not <select>');
    }
    if (!Array.isArray(option)) option = [option];

    // TODO As far as I understand the testcafe docs this should do a multi-select
    // but it does not work
    // const clickOpts = { ctrl: option.length > 1 };
    await this.t.click(el).catch(mapError);

    for (const key of option) {
      const opt = key;

      let optEl;
      try {
        optEl = el.child('option').withText(opt);
        if (await optEl.count) {
          await this.t.click(optEl).catch(mapError);
          continue;
        }
        // eslint-disable-next-line no-empty
      } catch (err) {
      }

      try {
        const sel = `[value="${opt}"]`;
        optEl = el.find(sel);
        if (await optEl.count) {
          await this.t.click(optEl).catch(mapError);
        }
        // eslint-disable-next-line no-empty
      } catch (err) {
      }
    }
  }

  /**
   * Checks that current url contains a provided fragment.
   * 
   * ```js
   * I.seeInCurrentUrl('/register'); // we are on registration page
   * ```
   * 
   * @param {string} url a fragment to check
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async seeInCurrentUrl(url) {
    stringIncludes('url').assert(url, await getPageUrl(this.t)().catch(mapError));
  }

  /**
   * Checks that current url does not contain a provided fragment.
   * 
   * @param {string} url value to check.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async dontSeeInCurrentUrl(url) {
    stringIncludes('url').negate(url, await getPageUrl(this.t)().catch(mapError));
  }

  /**
   * Checks that current url is equal to provided one.
   * If a relative url provided, a configured url will be prepended to it.
   * So both examples will work:
   * 
   * ```js
   * I.seeCurrentUrlEquals('/register');
   * I.seeCurrentUrlEquals('http://my.site.com/register');
   * ```
   * 
   * @param {string} url value to check.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async seeCurrentUrlEquals(url) {
    urlEquals(this.options.url).assert(url, await getPageUrl(this.t)().catch(mapError));
  }

  /**
   * Checks that current url is not equal to provided one.
   * If a relative url provided, a configured url will be prepended to it.
   * 
   * ```js
   * I.dontSeeCurrentUrlEquals('/login'); // relative url are ok
   * I.dontSeeCurrentUrlEquals('http://mysite.com/login'); // absolute urls are also ok
   * ```
   * 
   * @param {string} url value to check.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async dontSeeCurrentUrlEquals(url) {
    urlEquals(this.options.url).negate(url, await getPageUrl(this.t)().catch(mapError));
  }

  /**
   * Checks that a page contains a visible text.
   * Use context parameter to narrow down the search.
   * 
   * ```js
   * I.see('Welcome'); // text welcome on a page
   * I.see('Welcome', '.content'); // text inside .content div
   * I.see('Register', {css: 'form.register'}); // use strict locator
   * ```
   * @param {string} text expected on page.
   * @param {?string | object} [context=null] (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   *
   */
  async see(text, context = null) {
    let els;
    if (context) {
      els = (await findElements.call(this, this.context, context)).withText(normalizeSpacesInString(text));
    } else {
      els = (await findElements.call(this, this.context, '*')).withText(normalizeSpacesInString(text));
    }

    return this.t
      .expect(els.filterVisible().count).gt(0, `No element with text "${text}" found`)
      .catch(mapError);
  }

  /**
   * Opposite to `see`. Checks that a text is not present on a page.
   * Use context parameter to narrow down the search.
   * 
   * ```js
   * I.dontSee('Login'); // assume we are already logged in.
   * I.dontSee('Login', '.nav'); // no login inside .nav element
   * ```
   * 
   * @param {string} text which is not present.
   * @param {string | object} [context] (optional) element located by CSS|XPath|strict locator in which to perfrom search.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   *
   */
  async dontSee(text, context = null) {
    let els;
    if (context) {
      els = (await findElements.call(this, this.context, context)).withText(text);
    } else {
      els = (await findElements.call(this, this.context, 'body')).withText(text);
    }

    return this.t
      .expect(els.filterVisible().count).eql(0, `Element with text "${text}" can still be seen`)
      .catch(mapError);
  }

  /**
   * Checks that a given Element is visible
   * Element is located by CSS or XPath.
   * 
   * ```js
   * I.seeElement('#modal');
   * ```
   * @param {string | object} locator located by CSS|XPath|strict locator.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async seeElement(locator) {
    const exists = (await findElements.call(this, this.context, locator)).filterVisible().exists;
    return this.t
      .expect(exists).ok(`No element "${(new Locator(locator))}" found`)
      .catch(mapError);
  }

  /**
   * Opposite to `seeElement`. Checks that element is not visible (or in DOM)
   * 
   * ```js
   * I.dontSeeElement('.modal'); // modal is not shown
   * ```
   * 
   * @param {string | object} locator located by CSS|XPath|Strict locator.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async dontSeeElement(locator) {
    const exists = (await findElements.call(this, this.context, locator)).filterVisible().exists;
    return this.t
      .expect(exists).notOk(`Element "${(new Locator(locator))}" is still visible`)
      .catch(mapError);
  }

  /**
   * Checks that a given Element is present in the DOM
   * Element is located by CSS or XPath.
   * 
   * ```js
   * I.seeElementInDOM('#modal');
   * ```
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async seeElementInDOM(locator) {
    const exists = (await findElements.call(this, this.context, locator)).exists;
    return this.t
      .expect(exists).ok(`No element "${(new Locator(locator))}" found in DOM`)
      .catch(mapError);
  }

  /**
   * Opposite to `seeElementInDOM`. Checks that element is not on page.
   * 
   * ```js
   * I.dontSeeElementInDOM('.nav'); // checks that element is not on page visible or not
   * ```
   * 
   * @param {string | object} locator located by CSS|XPath|Strict locator.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async dontSeeElementInDOM(locator) {
    const exists = (await findElements.call(this, this.context, locator)).exists;
    return this.t
      .expect(exists).notOk(`Element "${(new Locator(locator))}" is still in DOM`)
      .catch(mapError);
  }

  /**
   * Asserts that an element is visible a given number of times.
   * Element is located by CSS or XPath.
   * 
   * ```js
   * I.seeNumberOfVisibleElements('.buttons', 3);
   * ```
   * 
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {number} num number of elements.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   *
   */
  async seeNumberOfVisibleElements(locator, num) {
    const count = (await findElements.call(this, this.context, locator)).filterVisible().count;
    return this.t
      .expect(count).eql(num)
      .catch(mapError);
  }

  /**
   * Grab number of visible elements by locator.
   * Resumes test execution, so **should be used inside async function with `await`** operator.
   * 
   * ```js
   * let numOfElements = await I.grabNumberOfVisibleElements('p');
   * ```
   * 
   * @param {string | object} locator located by CSS|XPath|strict locator.
   * @returns {Promise<number>} number of visible elements
   */
  async grabNumberOfVisibleElements(locator) {
    const count = (await findElements.call(this, this.context, locator)).filterVisible().count;
    return count;
  }

  /**
   * Checks that the given input field or textarea equals to given value.
   * For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.
   * 
   * ```js
   * I.seeInField('Username', 'davert');
   * I.seeInField({css: 'form textarea'},'Type your comment here');
   * I.seeInField('form input[type=hidden]','hidden_value');
   * I.seeInField('#searchform input','Search');
   * ```
   * @param {string | object} field located by label|name|CSS|XPath|strict locator.
   * @param {string | object} value value to check.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async seeInField(field, value) {
    const _value = (typeof value === 'boolean') ? value : value.toString();
    // const expectedValue = findElements.call(this, this.context, field).value;
    const els = await findFields.call(this, field);
    assertElementExists(els, field, 'Field');
    const el = await els.nth(0);

    return this.t
      .expect(await el.value).eql(_value)
      .catch(mapError);
  }

  /**
   * Checks that value of input field or textarea doesn't equal to given value
   * Opposite to `seeInField`.
   * 
   * ```js
   * I.dontSeeInField('email', 'user@user.com'); // field by name
   * I.dontSeeInField({ css: 'form input.email' }, 'user@user.com'); // field by CSS
   * ```
   * 
   * @param {string | object} field located by label|name|CSS|XPath|strict locator.
   * @param {string | object} value value to check.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async dontSeeInField(field, value) {
    const _value = (typeof value === 'boolean') ? value : value.toString();
    // const expectedValue = findElements.call(this, this.context, field).value;
    const els = await findFields.call(this, field);
    assertElementExists(els, field, 'Field');
    const el = await els.nth(0);

    return this.t
      .expect(el.value).notEql(_value)
      .catch(mapError);
  }

  /**
   * Checks that text is equal to provided one.
   *
   * ```js
   * I.seeTextEquals('text', 'h1');
   * ```
   */
  async seeTextEquals(text, context = null) {
    const expectedText = findElements.call(this, context, undefined).textContent;
    return this.t
      .expect(expectedText).eql(text)
      .catch(mapError);
  }

  /**
   * Checks that the current page contains the given string in its raw source code.
   * 
   * ```js
   * I.seeInSource('<h1>Green eggs &amp; ham</h1>');
   * ```
   * @param {string} text value to check.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async seeInSource(text) {
    const source = await getHtmlSource(this.t)();
    stringIncludes('HTML source of a page').assert(text, source);
  }

  /**
   * Checks that the current page does not contains the given string in its raw source code.
   * 
   * ```js
   * I.dontSeeInSource('<!--'); // no comments in source
   * ```
   * 
   * @param {string} value to check.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async dontSeeInSource(text) {
    const source = await getHtmlSource(this.t)();
    stringIncludes('HTML source of a page').negate(text, source);
  }

  /**
   * Saves screenshot of the specified locator to ouput folder (set in codecept.conf.ts or codecept.conf.js).
   * Filename is relative to output folder.
   * 
   * ```js
   * I.saveElementScreenshot(`#submit`,'debug.png');
   * ```
   * 
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {string} fileName file name to save.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   *
   */
  async saveElementScreenshot(locator, fileName) {
    const outputFile = path.join(global.output_dir, fileName);

    const sel = await findElements.call(this, this.context, locator);
    assertElementExists(sel, locator);
    const firstElement = await sel.filterVisible().nth(0);

    this.debug(`Screenshot of ${(new Locator(locator))} element has been saved to ${outputFile}`);
    return this.t.takeElementScreenshot(firstElement, fileName);
  }

  /**
   * Saves a screenshot to ouput folder (set in codecept.conf.ts or codecept.conf.js).
   * Filename is relative to output folder.
   * Optionally resize the window to the full available page `scrollHeight` and `scrollWidth` to capture the entire page by passing `true` in as the second argument.
   * 
   * ```js
   * I.saveScreenshot('debug.png');
   * I.saveScreenshot('debug.png', true) //resizes to available scrollHeight and scrollWidth before taking screenshot
   * ```
   * 
   * @param {string} fileName file name to save.
   * @param {boolean} [fullPage=false] (optional, `false` by default) flag to enable fullscreen screenshot mode.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  // TODO Implement full page screenshots
  async saveScreenshot(fileName) {
    const outputFile = path.join(global.output_dir, fileName);
    this.debug(`Screenshot is saving to ${outputFile}`);

    // TODO testcafe automatically creates thumbnail images (which cant be turned off)
    return this.t.takeScreenshot(fileName);
  }

  /**
   * Pauses execution for a number of seconds.
   * 
   * ```js
   * I.wait(2); // wait 2 secs
   * ```
   * 
   * @param {number} sec number of second to wait.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async wait(sec) {
    return new Promise(((done) => {
      setTimeout(done, sec * 1000);
    }));
  }

  /**
   * Executes sync script on a page.
   * Pass arguments to function as additional parameters.
   * Will return execution result to a test.
   * In this case you should use async function and await to receive results.
   * 
   * Example with jQuery DatePicker:
   * 
   * ```js
   * // change date of jQuery DatePicker
   * I.executeScript(function() {
   *   // now we are inside browser context
   *   $('date').datetimepicker('setDate', new Date());
   * });
   * ```
   * Can return values. Don't forget to use `await` to get them.
   * 
   * ```js
   * let date = await I.executeScript(function(el) {
   *   // only basic types can be returned
   *   return $(el).datetimepicker('getDate').toString();
   * }, '#date'); // passing jquery selector
   * ```
   * 
   * @param {string|function} fn function to be executed in browser context.
   * @param {...any} args to be passed to function.
   * @returns {Promise<any>} script return value
   * 
   *
   * If a function returns a Promise It will wait for its resolution.
   */
  async executeScript(fn, ...args) {
    const browserFn = createClientFunction(fn, args).with({ boundTestRun: this.t });
    return browserFn();
  }

  /**
   * Retrieves all texts from an element located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside async with `await`** operator.
   * 
   * ```js
   * let pins = await I.grabTextFromAll('#pin li');
   * ```
   * 
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @returns {Promise<string[]>} attribute value
   * 
   */
  async grabTextFromAll(locator) {
    const sel = await findElements.call(this, this.context, locator);
    const length = await sel.count;
    const texts = [];
    for (let i = 0; i < length; i++) {
      texts.push(await sel.nth(i).innerText);
    }

    return texts;
  }

  /**
   * Retrieves a text from an element located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside async with `await`** operator.
   * 
   * ```js
   * let pin = await I.grabTextFrom('#pin');
   * ```
   * If multiple elements found returns first element.
   * 
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @returns {Promise<string>} attribute value
   * 
   */
  async grabTextFrom(locator) {
    const sel = await findElements.call(this, this.context, locator);
    assertElementExists(sel, locator);
    const texts = await this.grabTextFromAll(locator);
    if (texts.length > 1) {
      this.debugSection('GrabText', `Using first element out of ${texts.length}`);
    }

    return texts[0];
  }

  /**
   * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside async with `await`** operator.
   * If more than one element is found - attribute of first element is returned.
   * 
   * ```js
   * let hint = await I.grabAttributeFrom('#tooltip', 'title');
   * ```
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {string} attr attribute name.
   * @returns {Promise<string>} attribute value
   * 
   */
  async grabAttributeFromAll(locator, attr) {
    const sel = await findElements.call(this, this.context, locator);
    const length = await sel.count;
    const attrs = [];
    for (let i = 0; i < length; i++) {
      attrs.push(await (await sel.nth(i)).getAttribute(attr));
    }

    return attrs;
  }

  /**
   * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside async with `await`** operator.
   * If more than one element is found - attribute of first element is returned.
   * 
   * ```js
   * let hint = await I.grabAttributeFrom('#tooltip', 'title');
   * ```
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {string} attr attribute name.
   * @returns {Promise<string>} attribute value
   * 
   */
  async grabAttributeFrom(locator, attr) {
    const sel = await findElements.call(this, this.context, locator);
    assertElementExists(sel, locator);
    const attrs = await this.grabAttributeFromAll(locator, attr);
    if (attrs.length > 1) {
      this.debugSection('GrabAttribute', `Using first element out of ${attrs.length}`);
    }

    return attrs[0];
  }

  /**
   * Retrieves an array of value from a form located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside async function with `await`** operator.
   * 
   * ```js
   * let inputs = await I.grabValueFromAll('//form/input');
   * ```
   * @param {string | object} locator field located by label|name|CSS|XPath|strict locator.
   * @returns {Promise<string[]>} attribute value
   * 
   */
  async grabValueFromAll(locator) {
    const sel = await findElements.call(this, this.context, locator);
    const length = await sel.count;
    const values = [];
    for (let i = 0; i < length; i++) {
      values.push(await (await sel.nth(i)).value);
    }

    return values;
  }

  /**
   * Retrieves a value from a form element located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside async function with `await`** operator.
   * If more than one element is found - value of first element is returned.
   * 
   * ```js
   * let email = await I.grabValueFrom('input[name=email]');
   * ```
   * @param {string | object} locator field located by label|name|CSS|XPath|strict locator.
   * @returns {Promise<string>} attribute value
   * 
   */
  async grabValueFrom(locator) {
    const sel = await findElements.call(this, this.context, locator);
    assertElementExists(sel, locator);
    const values = await this.grabValueFromAll(locator);
    if (values.length > 1) {
      this.debugSection('GrabValue', `Using first element out of ${values.length}`);
    }

    return values[0];
  }

  /**
   * Retrieves page source and returns it to test.
   * Resumes test execution, so **should be used inside async function with `await`** operator.
   * 
   * ```js
   * let pageSource = await I.grabSource();
   * ```
   * 
   * @returns {Promise<string>} source code
   */
  async grabSource() {
    return ClientFunction(() => document.documentElement.innerHTML).with({ boundTestRun: this.t })();
  }

  /**
   * Get JS log from browser.
   *
   * ```js
   * let logs = await I.grabBrowserLogs();
   * console.log(JSON.stringify(logs))
   * ```
   */
  async grabBrowserLogs() {
    // TODO Must map?
    return this.t.getBrowserConsoleMessages();
  }

  /**
   * Get current URL from browser.
   * Resumes test execution, so should be used inside an async function.
   * 
   * ```js
   * let url = await I.grabCurrentUrl();
   * console.log(`Current URL is [${url}]`);
   * ```
   * 
   * @returns {Promise<string>} current URL
   */
  async grabCurrentUrl() {
    return ClientFunction(() => document.location.href).with({ boundTestRun: this.t })();
  }

  /**
   * Retrieves a page scroll position and returns it to test.
   * Resumes test execution, so **should be used inside an async function with `await`** operator.
   * 
   * ```js
   * let { x, y } = await I.grabPageScrollPosition();
   * ```
   * 
   * @returns {Promise<PageScrollPosition>} scroll position
   * 
   */
  async grabPageScrollPosition() {
    return ClientFunction(() => ({ x: window.pageXOffset, y: window.pageYOffset })).with({ boundTestRun: this.t })();
  }

  /**
   * Scroll page to the top.
   * 
   * ```js
   * I.scrollPageToTop();
   * ```
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  scrollPageToTop() {
    return ClientFunction(() => window.scrollTo(0, 0)).with({ boundTestRun: this.t })().catch(mapError);
  }

  /**
   * Scroll page to the bottom.
   * 
   * ```js
   * I.scrollPageToBottom();
   * ```
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  scrollPageToBottom() {
    return ClientFunction(() => {
      const body = document.body;
      const html = document.documentElement;
      window.scrollTo(0, Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight,
      ));
    }).with({ boundTestRun: this.t })().catch(mapError);
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
   * @param {string | object} locator located by CSS|XPath|strict locator.
   * @param {number} [offsetX=0] (optional, `0` by default) X-axis offset.
   * @param {number} [offsetY=0] (optional, `0` by default) Y-axis offset.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async scrollTo(locator, offsetX = 0, offsetY = 0) {
    if (typeof locator === 'number' && typeof offsetX === 'number') {
      offsetY = offsetX;
      offsetX = locator;
      locator = null;
    }

    const scrollBy = ClientFunction((offset) => {
      if (window && window.scrollBy && offset) {
        window.scrollBy(offset.x, offset.y);
      }
    }).with({ boundTestRun: this.t });

    if (locator) {
      const els = await this._locate(locator);
      assertElementExists(els, locator, 'Element');
      const el = await els.nth(0);
      const x = (await el.offsetLeft) + offsetX;
      const y = (await el.offsetTop) + offsetY;

      return scrollBy({ x, y }).catch(mapError);
    }

    const x = offsetX;
    const y = offsetY;
    return scrollBy({ x, y }).catch(mapError);
  }

  /**
   * Switches frame or in case of null locator reverts to parent.
   * 
   * ```js
   * I.switchTo('iframe'); // switch to first iframe
   * I.switchTo(); // switch back to main page
   * ```
   * 
   * @param {?string | object} [locator=null] (optional, `null` by default) element located by CSS|XPath|strict locator.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async switchTo(locator) {
    if (Number.isInteger(locator)) {
      throw new Error('Not supported switching to iframe by number');
    }

    if (!locator) {
      return this.t.switchToMainWindow();
    }

    const el = await findElements.call(this, this.context, locator);
    return this.t.switchToIframe(el);
  }

  // TODO Add url assertions

  /**
   * Sets cookie(s).
   * 
   * Can be a single cookie object or an array of cookies:
   * 
   * ```js
   * I.setCookie({name: 'auth', value: true});
   * 
   * // as array
   * I.setCookie([
   *   {name: 'auth', value: true},
   *   {name: 'agree', value: true}
   * ]);
   * ```
   * 
   * @param {Cookie|Array<Cookie>} cookie a cookie object or array of cookie objects.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async setCookie(cookie) {
    if (Array.isArray(cookie)) {
      throw new Error('cookie array is not supported');
    }

    cookie.path = cookie.path || '/';
    // cookie.expires = cookie.expires || (new Date()).toUTCString();

    const setCookie = ClientFunction(() => {
      document.cookie = `${cookie.name}=${cookie.value};path=${cookie.path};expires=${cookie.expires};`;
    }, { dependencies: { cookie } }).with({ boundTestRun: this.t });

    return setCookie();
  }

  /**
   * Checks that cookie with given name exists.
   * 
   * ```js
   * I.seeCookie('Auth');
   * ```
   * 
   * @param {string} name cookie name.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   *
   */
  async seeCookie(name) {
    const cookie = await this.grabCookie(name);
    empty(`cookie ${name} to be set`).negate(cookie);
  }

  /**
   * Checks that cookie with given name does not exist.
   * 
   * ```js
   * I.dontSeeCookie('auth'); // no auth cookie
   * ```
   * 
   * @param {string} name cookie name.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async dontSeeCookie(name) {
    const cookie = await this.grabCookie(name);
    empty(`cookie ${name} not to be set`).assert(cookie);
  }

  /**
   * Gets a cookie object by name.
   * If none provided gets all cookies.
   * Resumes test execution, so **should be used inside async function with `await`** operator.
   * 
   * ```js
   * let cookie = await I.grabCookie('auth');
   * assert(cookie.value, '123456');
   * ```
   * 
   * @param {?string} [name=null] cookie name.
   * @returns {any} attribute value
   * 
   *
   * Returns cookie in JSON format. If name not passed returns all cookies for this domain.
   */
  async grabCookie(name) {
    if (!name) {
      const getCookie = ClientFunction(() => {
        return document.cookie.split(';').map(c => c.split('='));
      }).with({ boundTestRun: this.t });
      const cookies = await getCookie();
      return cookies.map(cookie => ({ name: cookie[0].trim(), value: cookie[1] }));
    }
    const getCookie = ClientFunction(() => {
      // eslint-disable-next-line prefer-template
      const v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
      return v ? v[2] : null;
    }, { dependencies: { name } }).with({ boundTestRun: this.t });
    const value = await getCookie();
    if (value) return { name, value };
  }

  /**
   * Clears a cookie by name,
   * if none provided clears all cookies.
   * 
   * ```js
   * I.clearCookie();
   * I.clearCookie('test'); // Playwright currently doesn't support clear a particular cookie name
   * ```
   * 
   * @param {?string} [cookie=null] (optional, `null` by default) cookie name
   * 
   */
  async clearCookie(cookieName) {
    const clearCookies = ClientFunction(() => {
      const cookies = document.cookie.split(';');

      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        if (cookieName === undefined || name === cookieName) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
      }
    }, { dependencies: { cookieName } }).with({ boundTestRun: this.t });

    return clearCookies();
  }

  /**
   * Waiting for the part of the URL to match the expected. Useful for SPA to understand that page was changed.
   * 
   * ```js
   * I.waitInUrl('/info', 2);
   * ```
   * 
   * @param {string} urlPart value to check.
   * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async waitInUrl(urlPart, sec = null) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;

    const clientFn = createClientFunction((urlPart) => {
      const currUrl = decodeURIComponent(decodeURIComponent(decodeURIComponent(window.location.href)));
      return currUrl.indexOf(urlPart) > -1;
    }, [urlPart]).with({ boundTestRun: this.t });

    return waitForFunction(clientFn, waitTimeout).catch(async () => {
      const currUrl = await this.grabCurrentUrl();
      throw new Error(`expected url to include ${urlPart}, but found ${currUrl}`);
    });
  }

  /**
   * Waits for the entire URL to match the expected
   * 
   * ```js
   * I.waitUrlEquals('/info', 2);
   * I.waitUrlEquals('http://127.0.0.1:8000/info');
   * ```
   * 
   * @param {string} urlPart value to check.
   * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async waitUrlEquals(urlPart, sec = null) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;

    const baseUrl = this.options.url;
    if (urlPart.indexOf('http') < 0) {
      urlPart = baseUrl + urlPart;
    }

    const clientFn = createClientFunction((urlPart) => {
      const currUrl = decodeURIComponent(decodeURIComponent(decodeURIComponent(window.location.href)));
      return currUrl === urlPart;
    }, [urlPart]).with({ boundTestRun: this.t });

    return waitForFunction(clientFn, waitTimeout).catch(async () => {
      const currUrl = await this.grabCurrentUrl();
      throw new Error(`expected url to be ${urlPart}, but found ${currUrl}`);
    });
  }

  /**
   * Waits for a function to return true (waits for 1 sec by default).
   * Running in browser context.
   * 
   * ```js
   * I.waitForFunction(fn[, [args[, timeout]])
   * ```
   * 
   * ```js
   * I.waitForFunction(() => window.requests == 0);
   * I.waitForFunction(() => window.requests == 0, 5); // waits for 5 sec
   * I.waitForFunction((count) => window.requests == count, [3], 5) // pass args and wait for 5 sec
   * ```
   * 
   * @param {string|function} fn to be executed in browser context.
   * @param {any[]|number} [argsOrSec] (optional, `1` by default) arguments for function or seconds.
   * @param {number} [sec] (optional, `1` by default) time in seconds to wait
   * @returns {void} automatically synchronized promise through #recorder
   * 
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
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;

    const clientFn = createClientFunction(fn, args).with({ boundTestRun: this.t });

    return waitForFunction(clientFn, waitTimeout);
  }

  /**
   * Waits for a specified number of elements on the page.
   * 
   * ```js
   * I.waitNumberOfVisibleElements('a', 3);
   * ```
   * 
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {number} num number of elements.
   * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async waitNumberOfVisibleElements(locator, num, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;

    return this.t
      .expect(createSelector(locator).with({ boundTestRun: this.t }).filterVisible().count)
      .eql(num, `The number of elements (${(new Locator(locator))}) is not ${num} after ${sec} sec`, { timeout: waitTimeout })
      .catch(mapError);
  }

  /**
   * Waits for element to be present on page (by default waits for 1sec).
   * Element can be located by CSS or XPath.
   * 
   * ```js
   * I.waitForElement('.btn.continue');
   * I.waitForElement('.btn.continue', 5); // wait for 5 secs
   * ```
   * 
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {number} [sec] (optional, `1` by default) time in seconds to wait
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async waitForElement(locator, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;

    return this.t
      .expect(createSelector(locator).with({ boundTestRun: this.t }).exists)
      .ok({ timeout: waitTimeout });
  }

  /**
   * Waits for an element to hide (by default waits for 1sec).
   * Element can be located by CSS or XPath.
   * 
   * ```js
   * I.waitToHide('#popup');
   * ```
   * 
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async waitToHide(locator, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;

    return this.t
      .expect(createSelector(locator).filterHidden().with({ boundTestRun: this.t }).exists)
      .notOk({ timeout: waitTimeout });
  }

  /**
   * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
   * Element can be located by CSS or XPath.
   * 
   * ```js
   * I.waitForInvisible('#popup');
   * ```
   * 
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async waitForInvisible(locator, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;

    return this.t
      .expect(createSelector(locator).filterVisible().with({ boundTestRun: this.t }).exists)
      .ok({ timeout: waitTimeout });
  }

  /**
   * Waits for a text to appear (by default waits for 1sec).
   * Element can be located by CSS or XPath.
   * Narrow down search results by providing context.
   * 
   * ```js
   * I.waitForText('Thank you, form has been submitted');
   * I.waitForText('Thank you, form has been submitted', 5, '#modal');
   * ```
   * 
   * @param {string }text to wait for.
   * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
   * @param {string | object} [context] (optional) element located by CSS|XPath|strict locator.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   *
   */
  async waitForText(text, sec = null, context = null) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;

    let els;
    if (context) {
      els = (await findElements.call(this, this.context, context));
      await this.t
        .expect(els.exists)
        .ok(`Context element ${context} not found`, { timeout: waitTimeout });
    } else {
      els = (await findElements.call(this, this.context, '*'));
    }

    return this.t
      .expect(els.withText(text).filterVisible().exists)
      .ok(`No element with text "${text}" found in ${context || 'body'}`, { timeout: waitTimeout })
      .catch(mapError);
  }
}

async function waitForFunction(browserFn, waitTimeout) {
  const pause = () => new Promise((done => {
    setTimeout(done, 50);
  }));

  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let result;
    try {
      result = await browserFn();
      // eslint-disable-next-line no-empty
    } catch (err) {
      throw new Error(`Error running function ${err.toString()}`);
    }

    if (result) return result;

    const duration = (Date.now() - start);
    if (duration > waitTimeout) {
      throw new Error('waitForFunction timed out');
    }
    await pause(); // make polling
  }
}

const createSelector = (locator) => {
  locator = new Locator(locator, 'css');
  if (locator.isXPath()) return elementByXPath(locator.value);
  return Selector(locator.simplify());
};

const elementByXPath = (xpath) => {
  assert(xpath, 'xpath is required');

  return Selector(() => {
    const iterator = document.evaluate(xpath, document, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
    const items = [];

    let item = iterator.iterateNext();

    while (item) {
      items.push(item);
      item = iterator.iterateNext();
    }

    return items;
  }, { dependencies: { xpath } });
};

const assertElementExists = async (res, locator, prefix, suffix) => {
  if (!res || !(await res.count) || !(await res.nth(0).tagName)) {
    throw new ElementNotFound(locator, prefix, suffix);
  }
};

async function findElements(matcher, locator) {
  if (locator && locator.react) throw new Error('react locators are not yet supported');

  locator = new Locator(locator, 'css');

  if (!locator.isXPath()) {
    return matcher
      ? matcher.find(locator.simplify())
      : Selector(locator.simplify()).with({ timeout: 0, boundTestRun: this.t });
  }

  if (!matcher) return elementByXPath(locator.value).with({ timeout: 0, boundTestRun: this.t });

  return matcher.find((node, idx, originNode) => {
    const found = document.evaluate(xpath, originNode, null, 5, null);
    let current = null;
    while (current = found.iterateNext()) {
      if (current === node) return true;
    }
    return false;
  }, { xpath: locator.value });
}

async function proceedClick(locator, context = null) {
  let matcher;

  if (context) {
    const els = await this._locate(context);
    await assertElementExists(els, context);
    matcher = await els.nth(0);
  }

  const els = await findClickable.call(this, matcher, locator);
  if (context) {
    await assertElementExists(els, locator, 'Clickable element', `was not found inside element ${new Locator(context).toString()}`);
  } else {
    await assertElementExists(els, locator, 'Clickable element');
  }

  const firstElement = await els.filterVisible().nth(0);

  return this.t
    .click(firstElement)
    .catch(mapError);
}

async function findClickable(matcher, locator) {
  if (locator && locator.react) throw new Error('react locators are not yet supported');

  locator = new Locator(locator);
  if (!locator.isFuzzy()) return (await findElements.call(this, matcher, locator)).filterVisible();

  let els;

  // try to use native TestCafe locator
  els = matcher ? matcher.find('a,button') : createSelector('a,button');
  els = await els.withExactText(locator.value).with({ timeout: 0, boundTestRun: this.t });
  if (await els.count) return els;

  const literal = xpathLocator.literal(locator.value);

  els = (await findElements.call(this, matcher, Locator.clickable.narrow(literal))).filterVisible();
  if (await els.count) return els;

  els = (await findElements.call(this, matcher, Locator.clickable.wide(literal))).filterVisible();
  if (await els.count) return els;

  els = (await findElements.call(this, matcher, Locator.clickable.self(literal))).filterVisible();
  if (await els.count) return els;

  return findElements.call(this, matcher, locator.value); // by css or xpath
}

async function proceedIsChecked(assertType, option) {
  const els = await findCheckable.call(this, option);
  assertElementExists(els, option, 'Checkable');

  const selected = await els.checked;

  return truth(`checkable ${option}`, 'to be checked')[assertType](selected);
}

async function findCheckable(locator, context) {
  assert(locator, 'locator is required');
  assert(this.t, 'this.t is required');

  let contextEl = await this.context;
  if (typeof context === 'string') {
    contextEl = (await findElements.call(this, contextEl, (new Locator(context, 'css')).simplify())).filterVisible();
    contextEl = await contextEl.nth(0);
  }

  const matchedLocator = new Locator(locator);
  if (!matchedLocator.isFuzzy()) {
    return (await findElements.call(this, contextEl, matchedLocator.simplify())).filterVisible();
  }

  const literal = xpathLocator.literal(locator);
  let els = (await findElements.call(this, contextEl, Locator.checkable.byText(literal))).filterVisible();
  if (await els.count) {
    return els;
  }

  els = (await findElements.call(this, contextEl, Locator.checkable.byName(literal))).filterVisible();
  if (await els.count) {
    return els;
  }

  return (await findElements.call(this, contextEl, locator)).filterVisible();
}

async function findFields(locator) {
  const matchedLocator = new Locator(locator);
  if (!matchedLocator.isFuzzy()) {
    return this._locate(matchedLocator);
  }
  const literal = xpathLocator.literal(locator);

  let els = await this._locate({ xpath: Locator.field.labelEquals(literal) });
  if (await els.count) {
    return els;
  }

  els = await this._locate({ xpath: Locator.field.labelContains(literal) });
  if (await els.count) {
    return els;
  }
  els = await this._locate({ xpath: Locator.field.byName(literal) });
  if (await els.count) {
    return els;
  }
  return this._locate({ css: locator });
}

module.exports = TestCafe;
