// @ts-nocheck
const fs = require('fs');
const assert = require('assert');
const path = require('path');
const qrcode = require('qrcode-terminal');
const createTestCafe = require('testcafe');
const { Selector, ClientFunction } = require('testcafe');

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
  xpathLocator,
} = require('../utils');
const Locator = require('../locator');
const Helper = require('../helper');

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
 * This helper should be configured in codecept.json or codecept.conf.js
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
   * {{> amOnPage }}
   */
  async amOnPage(url) {
    if (!(/^\w+\:\/\//.test(url))) {
      url = this.options.url + url;
    }

    return this.t.navigateTo(url)
      .catch(mapError);
  }

  /**
   * {{> resizeWindow }}
   */
  async resizeWindow(width, height) {
    if (width === 'maximize') {
      return this.t.maximizeWindow().catch(mapError);
    }

    return this.t.resizeWindow(width, height).catch(mapError);
  }

  /**
   * {{> click }}
   *
   */
  async click(locator, context = null) {
    return proceedClick.call(this, locator, context);
  }

  /**
   * {{> refreshPage }}
   */
  async refreshPage() {
    // eslint-disable-next-line no-restricted-globals
    return this.t.eval(() => location.reload(true), { boundTestRun: this.t }).catch(mapError);
  }

  /**
   * {{> waitForVisible }}
   *
   */
  async waitForVisible(locator, sec) {
    const timeout = sec ? sec * 1000 : undefined;

    return (await findElements.call(this, this.context, locator))
      .with({ visibilityCheck: true, timeout })()
      .catch(mapError);
  }

  /**
   * {{> fillField }}
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
   * {{> clearField }}
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
   * {{> appendField }}
   *
   */
  async appendField(field, value) {
    const els = await findFields.call(this, field);
    assertElementExists(els, field, 'Field');
    const el = await els.nth(0);

    return this.t
      .typeText(el, value, { replace: false })
      .catch(mapError);
  }

  /**
   * {{> attachFile }}
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
   * {{> pressKey }}
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
   * {{> moveCursorTo }}
   *
   */
  async moveCursorTo(locator, offsetX = 0, offsetY = 0) {
    const els = (await findElements.call(this, this.context, locator)).filterVisible();
    await assertElementExists(els);

    return this.t
      .hover(els.nth(0), { offsetX, offsetY })
      .catch(mapError);
  }

  /**
   * {{> doubleClick }}
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
   * {{> rightClick }}
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
    assertElementExists(els);
    return this.t
      .rightClick(els.nth(0))
      .catch(mapError);
  }

  /**
   * {{> checkOption }}
   */
  async checkOption(field, context = null) {
    const el = await findCheckable.call(this, field, context);

    return this.t
      .click(el)
      .catch(mapError);
  }

  /**
   * {{> uncheckOption }}
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
   * {{> seeCheckboxIsChecked }}
   */
  async seeCheckboxIsChecked(field) {
    return proceedIsChecked.call(this, 'assert', field);
  }

  /**
   * {{> dontSeeCheckboxIsChecked }}
   */
  async dontSeeCheckboxIsChecked(field) {
    return proceedIsChecked.call(this, 'negate', field);
  }

  /**
   * {{> selectOption }}
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
    const clickOpts = { ctrl: option.length > 1 };
    await this.t.click(el, clickOpts).catch(mapError);

    for (const key of option) {
      const opt = key;

      let optEl;
      try {
        optEl = el.child('option').withText(opt);
        if (await optEl.count) {
          await this.t.click(optEl, clickOpts).catch(mapError);
          continue;
        }
        // eslint-disable-next-line no-empty
      } catch (err) {
      }

      try {
        const sel = `[value="${opt}"]`;
        optEl = el.find(sel);
        if (await optEl.count) {
          await this.t.click(optEl, clickOpts).catch(mapError);
        }
        // eslint-disable-next-line no-empty
      } catch (err) {
      }
    }
  }

  /**
   * {{> seeInCurrentUrl }}
   */
  async seeInCurrentUrl(url) {
    stringIncludes('url').assert(url, await getPageUrl(this.t)().catch(mapError));
  }

  /**
   * {{> dontSeeInCurrentUrl }}
   */
  async dontSeeInCurrentUrl(url) {
    stringIncludes('url').negate(url, await getPageUrl(this.t)().catch(mapError));
  }

  /**
   * {{> seeCurrentUrlEquals }}
   */
  async seeCurrentUrlEquals(url) {
    urlEquals(this.options.url).assert(url, await getPageUrl(this.t)().catch(mapError));
  }

  /**
   * {{> dontSeeCurrentUrlEquals }}
   */
  async dontSeeCurrentUrlEquals(url) {
    urlEquals(this.options.url).negate(url, await getPageUrl(this.t)().catch(mapError));
  }

  /**
   * {{> see }}
   *
   */
  async see(text, context = null) {
    let els;
    if (context) {
      els = (await findElements.call(this, this.context, context)).withText(text);
    } else {
      els = (await findElements.call(this, this.context, '*')).withText(text);
    }

    return this.t
      .expect(els.filterVisible().count).gt(0, `No element with text "${text}" found`)
      .catch(mapError);
  }

  /**
   * {{> dontSee }}
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
   * {{> seeElement }}
   */
  async seeElement(locator) {
    const exists = (await findElements.call(this, this.context, locator)).filterVisible().exists;
    return this.t
      .expect(exists).ok(`No element "${locator}" found`)
      .catch(mapError);
  }

  /**
   * {{> dontSeeElement }}
   */
  async dontSeeElement(locator) {
    const exists = (await findElements.call(this, this.context, locator)).filterVisible().exists;
    return this.t
      .expect(exists).notOk(`Element "${locator}" is still visible`)
      .catch(mapError);
  }

  /**
   * {{> seeElementInDOM }}
   */
  async seeElementInDOM(locator) {
    const exists = (await findElements.call(this, this.context, locator)).exists;
    return this.t
      .expect(exists).ok(`No element "${locator}" found in DOM`)
      .catch(mapError);
  }

  /**
   * {{> dontSeeElementInDOM }}
   */
  async dontSeeElementInDOM(locator) {
    const exists = (await findElements.call(this, this.context, locator)).exists;
    return this.t
      .expect(exists).notOk(`Element "${locator}" is still in DOM`)
      .catch(mapError);
  }

  /**
   * {{> seeNumberOfVisibleElements }}
   *
   */
  async seeNumberOfVisibleElements(locator, num) {
    const count = (await findElements.call(this, this.context, locator)).filterVisible().count;
    return this.t
      .expect(count).eql(num)
      .catch(mapError);
  }

  /**
   * {{> grabNumberOfVisibleElements }}
   */
  async grabNumberOfVisibleElements(locator) {
    const count = (await findElements.call(this, this.context, locator)).filterVisible().count;
    return count;
  }

  /**
   * {{> seeInField }}
   */
  async seeInField(field, value) {
    // const expectedValue = findElements.call(this, this.context, field).value;
    const els = await findFields.call(this, field);
    assertElementExists(els, field, 'Field');
    const el = await els.nth(0);

    return this.t
      .expect(await el.value).eql(value)
      .catch(mapError);
  }

  /**
   * {{> dontSeeInField }}
   */
  async dontSeeInField(field, value) {
    // const expectedValue = findElements.call(this, this.context, field).value;
    const els = await findFields.call(this, field);
    assertElementExists(els, field, 'Field');
    const el = await els.nth(0);

    return this.t
      .expect(el.value).notEql(value)
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
   * {{> seeInSource }}
   */
  async seeInSource(text) {
    const source = await getHtmlSource(this.t)();
    stringIncludes('HTML source of a page').assert(text, source);
  }

  /**
   * {{> dontSeeInSource }}
   */
  async dontSeeInSource(text) {
    const source = await getHtmlSource(this.t)();
    stringIncludes('HTML source of a page').negate(text, source);
  }

  /**
   * {{> saveElementScreenshot }}
   *
   */
  async saveElementScreenshot(locator, fileName) {
    const outputFile = path.join(global.output_dir, fileName);

    const sel = await findElements.call(this, this.context, locator);
    assertElementExists(sel);
    const firstElement = await sel.filterVisible().nth(0);

    this.debug(`Screenshot of ${locator} element has been saved to ${outputFile}`);
    return this.t.takeElementScreenshot(firstElement, fileName);
  }

  /**
   * {{> saveScreenshot }}
   */
  // TODO Implement full page screenshots
  async saveScreenshot(fileName) {
    const outputFile = path.join(global.output_dir, fileName);
    this.debug(`Screenshot is saving to ${outputFile}`);

    // TODO testcafe automatically creates thumbnail images (which cant be turned off)
    return this.t.takeScreenshot(fileName);
  }

  /**
   * {{> wait }}
   */
  async wait(sec) {
    return new Promise(((done) => {
      setTimeout(done, sec * 1000);
    }));
  }

  /**
   * {{> executeScript }}
   *
   * If a function returns a Promise It will wait for it resolution.
   */
  async executeScript(fn, ...args) {
    const browserFn = createClientFunction(fn, args).with({ boundTestRun: this.t });
    return browserFn();
  }

  /**
   * {{> grabTextFromAll }}
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
   * {{> grabTextFrom }}
   */
  async grabTextFrom(locator) {
    const sel = await findElements.call(this, this.context, locator);
    assertElementExists(sel);
    const texts = await this.grabTextFromAll(locator);
    if (texts.length > 1) {
      this.debugSection('GrabText', `Using first element out of ${texts.length}`);
    }

    return texts[0];
  }

  /**
   * {{> grabAttributeFrom }}
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
   * {{> grabAttributeFrom }}
   */
  async grabAttributeFrom(locator, attr) {
    const sel = await findElements.call(this, this.context, locator);
    assertElementExists(sel);
    const attrs = await this.grabAttributeFromAll(locator, attr);
    if (attrs.length > 1) {
      this.debugSection('GrabAttribute', `Using first element out of ${attrs.length}`);
    }

    return attrs[0];
  }

  /**
   * {{> grabValueFromAll }}
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
   * {{> grabValueFrom }}
   */
  async grabValueFrom(locator) {
    const sel = await findElements.call(this, this.context, locator);
    assertElementExists(sel);
    const values = await this.grabValueFromAll(locator);
    if (values.length > 1) {
      this.debugSection('GrabValue', `Using first element out of ${values.length}`);
    }

    return values[0];
  }

  /**
   * {{> grabSource }}
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
   * {{> grabCurrentUrl }}
   */
  async grabCurrentUrl() {
    return ClientFunction(() => document.location.href).with({ boundTestRun: this.t })();
  }

  /**
   * {{> grabPageScrollPosition }}
   */
  async grabPageScrollPosition() {
    return ClientFunction(() => ({ x: window.pageXOffset, y: window.pageYOffset })).with({ boundTestRun: this.t })();
  }

  /**
   * {{> scrollPageToTop }}
   */
  scrollPageToTop() {
    return ClientFunction(() => window.scrollTo(0, 0)).with({ boundTestRun: this.t })().catch(mapError);
  }

  /**
   * {{> scrollPageToBottom }}
   */
  scrollPageToBottom() {
    return ClientFunction(() => {
      const body = document.body;
      const html = document.documentElement;
      window.scrollTo(0, Math.max(
        body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight,
      ));
    }).with({ boundTestRun: this.t })().catch(mapError);
  }

  /**
   * {{> scrollTo }}
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
   * {{> switchTo }}
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
   * {{> setCookie }}
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
   * {{> seeCookie }}
   *
   */
  async seeCookie(name) {
    const cookie = await this.grabCookie(name);
    empty(`cookie ${name} to be set`).negate(cookie);
  }

  /**
   * {{> dontSeeCookie }}
   */
  async dontSeeCookie(name) {
    const cookie = await this.grabCookie(name);
    empty(`cookie ${name} not to be set`).assert(cookie);
  }

  /**
   * {{> grabCookie }}
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
   * {{> clearCookie }}
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
   * {{> waitInUrl }}
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
   * {{> waitUrlEquals }}
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
   * {{> waitForFunction }}
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
   * {{> waitNumberOfVisibleElements }}
   */
  async waitNumberOfVisibleElements(locator, num, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;

    return this.t
      .expect(createSelector(locator).with({ boundTestRun: this.t }).filterVisible().count)
      .eql(num, `The number of elements (${locator}) is not ${num} after ${sec} sec`, { timeout: waitTimeout })
      .catch(mapError);
  }

  /**
   * {{> waitForElement }}
   */
  async waitForElement(locator, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;

    return this.t
      .expect(createSelector(locator).with({ boundTestRun: this.t }).exists)
      .ok({ timeout: waitTimeout });
  }

  /**
   * {{> waitToHide }}
   */
  async waitToHide(locator, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;

    return this.t
      .expect(createSelector(locator).filterHidden().with({ boundTestRun: this.t }).exists)
      .notOk({ timeout: waitTimeout });
  }

  /**
   * {{> waitForInvisible }}
   */
  async waitForInvisible(locator, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;

    return this.t
      .expect(createSelector(locator).filterVisible().with({ boundTestRun: this.t }).exists)
      .ok({ timeout: waitTimeout });
  }

  /**
   * {{> waitForText }}
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
  const pause = () => new Promise((done => setTimeout(done, 50)));

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
