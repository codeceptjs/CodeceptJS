const requireg = require('requireg');
const Helper = require('../helper');
const Locator = require('../locator');
const stringIncludes = require('../assert/include').includes;
const { urlEquals } = require('../assert/equal');
const { equals } = require('../assert/equal');
const { empty } = require('../assert/empty');
const { truth } = require('../assert/truth');
const {
  xpathLocator, fileExists, clearString, decodeUrl, chunkArray,
} = require('../utils');
const path = require('path');
const ElementNotFound = require('./errors/ElementNotFound');

const puppeteer = requireg('puppeteer');

/**
 * Uses [Google Chrome's Puppeteer](https://github.com/GoogleChrome/puppeteer) library to run tests inside headless Chrome.
 * Browser control is executed via DevTools without Selenium.
 * This helper works with a browser out of the box with no additional tools required to install.
 *
 * Requires `puppeteer` package to be installed.
 *
 * ## Configuration
 *
 * This helper should be configured in codecept.json
 *
 * * `url` - base url of website to be tested
 * * `show` (optional, default: false) - show Google Chrome window for debug.
 * * `disableScreenshots` (optional, default: false)  - don't save screenshot on failure.
 * * `uniqueScreenshotNames` (optional, default: false)  - option to prevent screenshot override if you have scenarios with the same name in different suites.
 * * `waitForAction`: (optional) how long to wait after click, doubleClick or PressKey actions in ms. Default: 100.
 * * `waitForTimeout`: (optional) default wait* timeout in ms. Default: 1000.
 * * `windowSize`: (optional) default window size. Set a dimension like `640x480`.
 * * `chrome`: (optional) pass additional [Puppeteer run options](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions). Example
 *
 * ```js
 * "chrome": {
 *   "executablePath" : "/path/to/Chrome"
 * }
 * ```
 */
class Puppeteer extends Helper {
  constructor(config) {
    super(config);

    // set defaults
    this.options = {
      waitForAction: 100,
      waitForTimeout: 1000,
      fullPageScreenshots: true,
      disableScreenshots: false,
      uniqueScreenshotNames: false,
      restart: true,
      show: false,
    };

    this.isRunning = false;

    // override defaults with config
    Object.assign(this.options, config);
    this.puppeteerOptions = Object.assign({ headless: !this.options.show }, this.options.chrome);
  }

  static _config() {
    return [
      { name: 'url', message: 'Base url of site to be tested', default: 'http://localhost' },
    ];
  }

  static _checkRequirements() {
    try {
      requireg('puppeteer');
    } catch (e) {
      return ['puppeteer'];
    }
  }

  _init() {
  }

  _beforeSuite() {
    if (!this.options.restart && !this.options.manualStart && !this.isRunning) {
      this.debugSection('Session', 'Starting singleton browser session');
      return this._startBrowser();
    }
  }


  async _before() {
    return this._startBrowser();
  }

  async _after() {
    return this._stopBrowser();
  }

  async _startBrowser() {
    this.browser = await puppeteer.launch(this.puppeteerOptions);
    this.browser.on('targetcreated', (target) => {
      target.page().then((page) => {
        if (!page) return;
        this.withinLocator = null;
        page.on('load', frame => this.context = page.$('body'));
        page.on('console', msg => this.debugSection(msg.type, msg.args.join(' ')));
      });
    });

    this.browser.on('targetchanged', (target) => {
      this.debugSection('Url', target.url());
    });

    this.page = await this.browser.newPage();

    if (this.options.windowSize && this.options.windowSize.indexOf('x') > 0) {
      const dimensions = this.options.windowSize.split('x');
      await this.resizeWindow(parseInt(dimensions[0], 10), parseInt(dimensions[1], 10));
    }
  }

  async _stopBrowser() {
    this.withinLocator = null;
    this.page = null;
    this.context = null;
    await this.browser.close();
  }

  async _evaluateHandeInContext(...args) {
    let context = await this._getContext();

    if (context.constructor.name === 'Frame') {
      // Currently there is no evalateHandle for the Frame object
      // https://github.com/GoogleChrome/puppeteer/issues/1051
      context = await context.executionContext();
    }

    return context.evaluateHandle(...args);
  }


  async _withinBegin(locator) {
    if (this.withinLocator) {
      throw new Error('Can\'t start within block inside another within block');
    }

    const frame = isFrameLocator(locator);

    if (frame) {
      if (Array.isArray(frame)) {
        return this.switchTo(null)
          .then(() => frame.reduce((p, frameLocator) => p.then(() => this.switchTo(frameLocator)), Promise.resolve()));
      }
      await this.switchTo(locator);
      this.withinLocator = new Locator(locator);
      return;
    }

    const els = await this._locate(locator);
    assertElementExists(els, locator);
    this.context = els[0];

    this.withinLocator = new Locator(locator);
  }

  async _withinEnd() {
    this.withinLocator = null;
    this.context = await this.page.mainFrame().$('body');
  }

  /**
   * {{> ../webapi/amOnPage }}
   */
  async amOnPage(url) {
    if (url.indexOf('http') !== 0) {
      url = this.options.url + url;
    }
    await this.page.goto(url);
    return this._waitForAction();
  }

  /**
   * {{> ../webapi/resizeWindow }}
   *
   * Unlike other drivers Puppeteer changes the size of a viewport, not the window!
   * Puppeteer does not control the window of a browser so it can't adjust its real size.
   * It also can't maximize a window.
   */
  async resizeWindow(width, height) {
    if (width === 'maximize') {
      throw new Error('Puppeteer can\'t control windows, so it can\'t maximize it');
    }
    await this.page.setViewport({ width, height });
    return this._waitForAction();
  }

  /**
   * Set headers for all next requests
   *
   * ```js
   * I.haveRequestHeaders({
   *    'X-Sent-By': 'CodeceptJS',
   * });
   * ```
   */
  async haveRequestHeaders(customHeaders) {
    if (!customHeaders) {
      throw new Error('Cannot send empty headers.');
    }
    return this.page.setExtraHTTPHeaders(customHeaders);
  }


  /**
   * {{> ../webapi/moveCursorTo}}
   *
   * For Puppeteer offsetX and offsetY arguments are ignored
   */
  async moveCursorTo(locator, offsetX = 0, offsetY = 0) {
    if (offsetX || offsetY) console.log('Currently offset is ignored :(');
    const els = await this._locate(locator);
    assertElementExists(els);
    await els[0].hover();
    return this._waitForAction();
  }

  /**
   * {{> ../webapi/refreshPage }}
   */
  async refreshPage() {
    return this.page.reload();
  }

  /**
   * {{> ../webapi/seeInTitle }}
   */
  async seeInTitle(text) {
    const title = await this.page.title();
    stringIncludes('web page title').assert(text, title);
  }

  /**
   * {{> ../webapi/dontSeeInTitle }}
   */
  async dontSeeInTitle(text) {
    const title = await this.page.title();
    stringIncludes('web page title').negate(text, title);
  }

  /**
   * {{> ../webapi/grabTitle }}
   */
  async grabTitle() {
    return this.page.title();
  }

  /**
   * Get elements by different locator types, including strict locator
   * Should be used in custom helpers:
   *
   * ```js
   * const elements = await this.helpers['Puppeteer']._locate({name: 'password'});
   * ```
   */
  async _locate(locator) {
    return findElements(await this.context, locator);
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
    const pages = await this.browser.pages();
    const index = pages.indexOf(this.page);
    this.withinLocator = null;
    this.page = pages[(index + num) % pages.length];
    await this.page.bringToFront();
    return this._waitForAction();
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
    const pages = await this.browser.pages();
    const index = pages.indexOf(this.page);
    this.withinLocator = null;
    this.page = pages[(index - num) % pages.length];
    await this.page.bringToFront();
    return this._waitForAction();
  }

  /**
   * Close current tab and switches to previous.
   *
   * ```js
   * I.closeCurrentTab();
   * ```
   */
  async closeCurrentTab() {
    const oldPage = this.page;
    await this.switchToPreviousTab();
    return oldPage.close();
  }

  /**
   * Open new tab and switch to it
   *
   * ```js
   * I.openNewTab();
   * ```
   */
  async openNewTab() {
    this.page = await this.browser.newPage();
  }

  /**
   * {{> ../webapi/seeElement }}
   */

  async seeElement(locator) {
    let els = await this._locate(locator);
    els = await Promise.all(els.map(el => el.boundingBox()));
    return empty('visible elements').negate(els.filter(v => v).fill('ELEMENT'));
  }

  /**
   * {{> ../webapi/dontSeeElement }}
   */
  async dontSeeElement(locator) {
    let els = await this._locate(locator);
    els = await Promise.all(els.map(el => el.boundingBox()));
    return empty('visible elements').assert(els.filter(v => v).fill('ELEMENT'));
  }

  /**
   * {{> ../webapi/seeElementInDOM }}
   */
  async seeElementInDOM(locator) {
    const els = await this._locate(locator);
    return empty('elements on page').negate(els.filter(v => v).fill('ELEMENT'));
  }

  /**
   * {{> ../webapi/dontSeeElementInDOM }}
   */
  async dontSeeElementInDOM(locator) {
    const els = await this._locate(locator);
    return empty('elements on a page').assert(els.filter(v => v).fill('ELEMENT'));
  }

  /**
   * {{> ../webapi/click }}
   */
  async click(locator, context = null) {
    return proceedClick.call(this, locator, context);
  }

  /**
   * {{> ../webapi/doubleClick }}
   */
  async doubleClick(locator, context = null) {
    return proceedClick.call(this, locator, context, { clickCount: 2 });
  }


  /**
   * {{> ../webapi/checkOption }}
   */
  async checkOption(field, context = null) {
    const els = await findCheckable.call(this, field, context);
    assertElementExists(els[0], field, 'Checkbox or radio');
    if (await els[0].getProperty('checked') === true) return;
    await els[0].click();
    return this._waitForAction();
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
   * {{> ../webapi/pressKey }}
   */
  async pressKey(key) {
    let modifier;
    const modifiers = ['Control', 'Command', 'Shift', 'Alt'];
    if (Array.isArray(key) && modifiers.indexOf(key[0]) > -1) {
      modifier = key[0];
      key = key[1];
    }
    if (modifier) await this.page.keyboard.down(modifier);
    await await this.page.keyboard.press(key);
    if (modifier) await this.page.keyboard.up(modifier);
    return this._waitForAction();
  }

  /**
   * {{> ../webapi/fillField }}
   */
  async fillField(field, value) {
    const els = await findFields.call(this, field);
    assertElementExists(els, field, 'Field');
    const el = els[0];
    // await el.focus();
    const tag = await el.getProperty('tagName').then(el => el.jsonValue());
    const editable = await el.getProperty('contenteditable').then(el => el.jsonValue());

    if (tag === 'TEXTAREA' || editable) {
      await this._evaluateHandeInContext(el => el.innerHTML = '', el);
    }
    if (tag === 'INPUT') {
      await this._evaluateHandeInContext(el => el.value = '', el);
    }
    await el.type(value, { delay: 10 });
    return this._waitForAction();
  }


  /**
   * {{> ../webapi/clearField }}
   */
  async clearField(field) {
    return this.fillField(field, '');
  }

  /**
   * {{> ../webapi/appendField }}
   */
  async appendField(field, value) {
    const els = await findFields.call(this, field);
    assertElementExists(els, field, 'Field');
    await els[0].press('End');
    await els[0].type(value, { delay: 10 });
    return this._waitForAction();
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
   * {{> ../webapi/attachFile }}
   *
   */
  async attachFile(locator, pathToFile) {
    const file = path.join(global.codecept_dir, pathToFile);

    if (!fileExists(file)) {
      throw new Error(`File at ${file} can not be found on local system`);
    }
    const els = await findFields.call(this, locator);
    assertElementExists(els, 'Field');
    await els[0].uploadFile(file);
    return this._waitForAction();
  }

  /**
   * {{> ../webapi/selectOption }}
   */
  async selectOption(select, option) {
    const els = await findFields.call(this, select);
    assertElementExists(els, select, 'Selectable field');
    const el = els[0];
    if (await el.getProperty('tagName').then(t => t.jsonValue()) !== 'SELECT') {
      throw new Error('Element is not <select>');
    }
    if (!Array.isArray(option)) option = [option];

    for (const key in option) {
      const opt = xpathLocator.literal(option[key]);
      let optEl = await findElements.call(this, el, { xpath: Locator.select.byVisibleText(opt) });
      if (optEl.length) {
        this._evaluateHandeInContext(el => el.selected = true, optEl[0]);
        continue;
      }
      optEl = await findElements.call(this, el, { xpath: Locator.select.byValue(opt) });
      if (optEl.length) {
        this._evaluateHandeInContext(el => el.selected = true, optEl[0]);
      }
    }
    await this._evaluateHandeInContext((element) => {
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }, el);

    return this._waitForAction();
  }

  /**
   * {{> ../webapi/seeInCurrentUrl }}
   */
  async seeInCurrentUrl(url) {
    const currentUrl = this.page.url();
    stringIncludes('url').assert(url, currentUrl);
  }

  /**
   * {{> ../webapi/dontSeeInCurrentUrl }}
   */
  async dontSeeInCurrentUrl(url) {
    const currentUrl = await this.page.url();
    stringIncludes('url').negate(url, currentUrl);
  }

  /**
   * {{> ../webapi/seeCurrentUrlEquals }}
   */
  async seeCurrentUrlEquals(url) {
    const currentUrl = await this.page.url();
    urlEquals(this.options.url).assert(url, currentUrl);
  }

  /**
   * {{> ../webapi/dontSeeCurrentUrlEquals }}
   */
  async dontSeeCurrentUrlEquals(url) {
    const currentUrl = await this.page.url();
    urlEquals(this.options.url).negate(url, currentUrl);
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
  async dontSee(text, context = null) {
    return proceedSee.call(this, 'negate', text, context);
  }

  /**
   * {{> ../webapi/seeInSource }}
   */
  async seeInSource(text) {
    const source = await this.page.content();
    stringIncludes('HTML source of a page').assert(text, source);
  }

  /**
   * {{> ../webapi/dontSeeInSource }}
   */
  async dontSeeInSource(text) {
    const source = await this.page.content();
    stringIncludes('HTML source of a page').negate(text, source);
  }

  /**
   * {{> ../webapi/setCookie }}
   */
  async setCookie(cookie) {
    return this.page.setCookie(cookie);
  }

  /**
   * {{> ../webapi/seeCookie}}
   *
   */
  async seeCookie(name) {
    const cookies = await this.page.cookies();
    empty(`cookie ${name} to be set`).negate(cookies.filter(c => c.name === name));
  }

  /**
   * {{> ../webapi/dontSeeCookie}}
   */
  async dontSeeCookie(name) {
    const cookies = await this.page.cookies();
    empty(`cookie ${name} to be set`).assert(cookies.filter(c => c.name === name));
  }

  /**
   * {{> ../webapi/grabCookie}}
   *
   * Returns cookie in JSON format. If name not passed returns all cookies for this domain.
   */
  async grabCookie(name) {
    const cookies = await this.page.cookies();
    if (!name) return cookies;
    const cookie = cookies.filter(c => c.name === name);
    if (cookie[0]) return cookie[0];
  }

  /**
   * {{> ../webapi/clearCookie}}
   */
  async clearCookie(name) {
    const cookies = await this.page.cookies();
    if (!name) {
      return this.page.deleteCookie.apply(this.page, cookies);
    }
    const cookie = cookies.filter(c => c.name === name);
    if (!cookie[0]) return;
    return this.page.deleteCookie(cookie[0]);
  }

  /**
   * {{> ../webapi/executeScript }}
   *
   * If a function returns a Promise It will wait for it resolution.
   */
  async executeScript(fn) {
    return this.page.evaluate.apply(this.page, arguments);
  }

  /**
   * {{> ../webapi/executeAsyncScript }}
   *
   * Asynchronous scripts can also be executed with `executeScript` if a function returns a Promise.
   */
  async executeAsyncScript(fn) {
    const args = Array.from(arguments);
    const asyncFn = function () {
      const args = Array.from(arguments);
      const fn = eval(args.shift()); // eslint-disable-line no-eval
      return new Promise((done) => {
        args.push(done);
        fn.apply(null, args);
      });
    };
    args[0] = args[0].toString();
    args.unshift(asyncFn);
    return this.page.evaluate.apply(this.page, args);
  }


  /**
   * {{> ../webapi/grabTextFrom }}
   */
  async grabTextFrom(locator) {
    const els = await this._locate(locator);
    assertElementExists(els, locator);
    return els[0].getProperty('innerText').then(t => t.jsonValue());
  }

  /**
   * {{> ../webapi/grabValueFrom }}
   */
  async grabValueFrom(locator) {
    const els = await findFields.call(this, locator);
    assertElementExists(els, locator);
    return els[0].getProperty('value').then(t => t.jsonValue());
  }

  /**
   * {{> ../webapi/grabAttributeFrom }}
   */
  async grabAttributeFrom(locator, attr) {
    const els = await this._locate(locator);
    assertElementExists(els, locator);
    return this._evaluateHandeInContext((el, attr) => el.getAttribute(attr), els[0], attr)
      .then(t => t.jsonValue());
  }

  /**
   * {{> ../webapi/saveScreenshot }}
   */
  async saveScreenshot(fileName, fullPage = this.options.fullPageScreenshots) {
    const outputFile = path.join(global.output_dir, fileName);
    this.debug(`Screenshot is saving to ${outputFile}`);
    return this.page.screenshot({ path: outputFile, fullPage, type: 'png' });
  }

  async _failed(test) {
    const promisesList = [];
    await this._withinEnd();
    if (!this.options.disableScreenshots) {
      let fileName = clearString(test.title);
      if (test.ctx && test.ctx.test && test.ctx.test.type === 'hook') fileName = clearString(`${test.title}_${test.ctx.test.title}`);
      if (this.options.uniqueScreenshotNames) {
        const uuid = test.uuid || test.ctx.test.uuid;
        fileName = `${fileName.substring(0, 10)}_${uuid}.failed.png`;
      } else {
        fileName += '.failed.png';
      }
      await this.saveScreenshot(fileName, true);
    }
  }

  /**
   * {{> ../webapi/wait }}
   */
  async wait(sec) {
    return new Promise(((done) => {
      setTimeout(done, sec * 1000);
    }));
  }

  /**
   * {{> ../webapi/waitForElement }}
   */
  async waitForElement(locator, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;
    locator = new Locator(locator, 'css');

    let waiter;
    const context = await this._getContext();
    if (locator.isCSS()) {
      waiter = context.waitForSelector(locator.simplify(), { timeout: waitTimeout });
    } else {
      waiter = context.waitForFunction($XPath, { timeout: waitTimeout }, null, locator.value);
    }
    return waiter.catch((err) => {
      throw new Error(`element (${locator.toString()}) still not present on page after ${waitTimeout / 1000} sec\n${err.message}`);
    });
  }

  /**
   * {{> ../webapi/waitForVisible }}
   */
  async waitForVisible(locator, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;
    locator = new Locator(locator, 'css');
    const matcher = await this.context;
    let waiter;
    const context = await this._getContext();
    if (locator.isCSS()) {
      waiter = context.waitForSelector(locator.simplify(), { timeout: waitTimeout, visible: true });
    } else {
      const visibleFn = function (locator, $XPath) {
        eval($XPath); // eslint-disable-line no-eval
        return $XPath(null, locator).filter(el => el.offsetParent !== null).length > 0;
      };
      waiter = context.waitForFunction(visibleFn, { timeout: waitTimeout }, locator.value, $XPath.toString());
    }
    return waiter.catch((err) => {
      throw new Error(`element (${locator.toString()}) still not visible on page after ${waitTimeout / 1000} sec\n${err.message}`);
    });
  }

  /**
   * {{> ../webapi/waitToHide }}
   */
  async waitToHide(locator, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;
    locator = new Locator(locator, 'css');
    let waiter;
    const context = await this._getContext();
    if (locator.isCSS()) {
      waiter = context.waitForSelector(locator.simplify(), { timeout: waitTimeout, hidden: true });
    } else {
      const visibleFn = function (locator, $XPath) {
        eval($XPath); // eslint-disable-line no-eval
        return $XPath(null, locator).filter(el => el.offsetParent !== null).length === 0;
      };
      waiter = context.waitForFunction(visibleFn, { timeout: waitTimeout }, locator.value, $XPath.toString());
    }
    return waiter.catch((err) => {
      throw new Error(`element (${locator.toString()}) still not hidden after ${waitTimeout / 1000} sec\n${err.message}`);
    });
  }

  async _getContext() {
    if (this.context && this.context.constructor.name === 'Frame') {
      return this.context;
    }
    return this.page;
  }

  /**
   * {{> ../webapi/waitForText }}
   */
  async waitForText(text, sec = null, context = null) {
    const aSec = sec || this.options.waitForTimeout;
    const waitTimeout = aSec * 1000;
    let waiter;

    const contextObject = await this._getContext();

    if (context) {
      const locator = new Locator(context, 'css');
      if (locator.isCSS()) {
        waiter = contextObject.waitForFunction((locator, text) => {
          const el = document.querySelector(locator);
          if (!el) return false;
          return el.innerText.indexOf(text) > -1;
        }, { timeout: waitTimeout }, locator.value, text);
      }

      if (locator.isXPath()) {
        waiter = contextObject.waitForFunction((locator, text, $XPath) => {
          const el = $XPath(null, locator);
          if (!el.length) return false;
          return el[0].innerText.indexOf(text) > -1;
        }, { timeout: waitTimeout }, locator.value, text, $XPath);
      }
    } else {
      waiter = contextObject.waitForFunction(text => document.body.innerText.indexOf(text) > -1, { timeout: waitTimeout }, text);
    }

    return waiter.catch((err) => {
      throw new Error(`Text "${text}" was not found on page after ${waitTimeout / 1000} sec\n${err.message}`);
    });
  }

  /**
   * Switches frame or in case of null locator reverts to parent.
   * Appium: support only web testing
   */
  async switchTo(locator) {
    if (!locator) {
      this.context = await this.page.mainFrame().$('body');
      return;
    } else if (Number.isInteger(locator)) {
      // Select by frame index of current context
      const childFrames = this.context ? this.context.childFrames() : this.page.frames();

      if (locator >= 0 && locator < childFrames.length) {
        this.context = childFrames[locator];
      } else {
        throw new Error('Element #invalidIframeSelector was not found by text|CSS|XPath');
      }
      return;
    }

    // iframe by selector
    const els = await this._locate(locator);
    assertElementExists(els, locator);

    const iframeName = await els[0].getProperty('name').then(el => el.jsonValue());
    const iframeId = await els[0].getProperty('id').then(el => el.jsonValue());

    const searchName = iframeName || iframeId; // Name takes precedence over id, because of puppeteer's Frame.name() function
    const currentContext = await this._getContext();
    const resFrame = await findFrame.call(this, currentContext, searchName, els[0]);

    if (resFrame) {
      this.context = resFrame;
    } else {
      this.context = els[0];
    }
  }

  /**
   * {{> ../webapi/waitUntil }}
   */
  async waitUntil(fn, sec = null) {
    const aSec = sec || this.options.waitForTimeout;
    const waitTimeout = aSec * 1000;
    const context = await this._getContext();
    return context.waitForFunction(fn, { timeout: waitTimeout });
  }

  /**
   * {{> ../webapi/waitUntilExists }}
   */
  async waitUntilExists(locator, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;
    locator = new Locator(locator, 'css');

    let waiter;
    const context = await this._getContext();
    if (locator.isCSS()) {
      const visibleFn = function (locator) {
        return document.querySelector(locator) === null;
      };
      waiter = context.waitForFunction(visibleFn, { timeout: waitTimeout }, locator.value);
    } else {
      const visibleFn = function (locator, $XPath) {
        eval($XPath); // eslint-disable-line no-eval
        return $XPath(null, locator).length === 0;
      };
      waiter = context.waitForFunction(visibleFn, { timeout: waitTimeout }, locator.value, $XPath.toString());
    }
    return waiter.catch((err) => {
      throw new Error(`element (${locator.toString()}) still on page after ${waitTimeout / 1000} sec\n${err.message}`);
    });
  }

  async _waitForAction() {
    return this.wait(this.options.waitForAction / 1000);
  }
}

module.exports = Puppeteer;

async function findFrame(context, locator, element) {
  if (!context) {
    return;
  }
  let frames = [];
  if (typeof context.childFrames === 'function') {
    frames = context.childFrames();
  } else {
    frames = this.page.frames();
  }

  return frames.find(frame => frame.name() === locator);
}

async function findElements(matcher, locator) {
  locator = new Locator(locator, 'css');
  if (!locator.isXPath()) return matcher.$$(locator.simplify());

  let context = null;
  if (matcher.constructor.name === 'ElementHandle') {
    context = matcher;
  }
  if (matcher.constructor.name === 'Frame') {
    context = matcher;
  }

  return matcher.$x(locator.value, matcher);
}

async function proceedClick(locator, context = null, options = {}) {
  let matcher = await this.context;
  if (context) {
    const els = await this._locate(context);
    assertElementExists(els, context);
    matcher = els[0];
  }
  const els = await findClickable.call(this, matcher, locator);
  if (context) {
    assertElementExists(els, locator, 'Clickable element', `was not found inside element ${new Locator(context).toString()}`);
  } else {
    assertElementExists(els, locator, 'Clickable element');
  }
  await els[0].click(options);
  await this._waitForAction();
}

async function findClickable(matcher, locator) {
  locator = new Locator(locator);
  if (!locator.isFuzzy()) return findElements.call(this, matcher, locator.simplify());

  let els;
  const literal = xpathLocator.literal(locator.value);

  els = await findElements.call(this, matcher, Locator.clickable.narrow(literal));
  if (els.length) return els;

  els = await findElements.call(this, matcher, Locator.clickable.wide(literal));
  if (els.length) return els;

  els = await findElements.call(this, matcher, Locator.clickable.self(literal));
  if (els.length) return els;

  return findElements.call(this, matcher, locator.value); // by css or xpath
}

async function proceedSee(assertType, text, context) {
  let description;
  let allText;
  if (!context) {
    let el = await this.context;

    if (el && !el.getProperty) {
      // Fallback to body
      el = await this.context.$('body');
    }

    allText = [await el.getProperty('innerText').then(p => p.jsonValue())];
    description = 'web application';
  } else {
    const locator = new Locator(context, 'css');
    description = `element ${locator.toString()}`;
    const els = await this._locate(locator);
    assertElementExists(els, 'context element');
    allText = await Promise.all(els.map(el => el.getProperty('innerText').then(p => p.jsonValue())));
  }

  return stringIncludes(description)[assertType](text, allText.join(' | '));
}

async function findCheckable(locator, context) {
  let contextEl = await this.context;
  if (context) {
    contextEl = await findElements.call(this, contextEl, (new Locator(context, 'css')).simplify());
    contextEl = contextEl[0];
  }

  const matchedLocator = new Locator(locator);
  if (!matchedLocator.isFuzzy()) {
    return findElements.call(this, contextEl, matchedLocator.simplify());
  }

  const literal = xpathLocator.literal(locator);
  let els = await findElements.call(this, contextEl, Locator.checkable.byText(literal));
  if (els.length) {
    return els;
  }
  els = await findElements.call(this, contextEl, Locator.checkable.byName(literal));
  if (els.length) {
    return els;
  }
  return findElements.call(this, contextEl, locator);
}

async function proceedIsChecked(assertType, option) {
  let els = await findCheckable.call(this, option);
  assertElementExists(els, option, 'Checkable');
  els = await Promise.all(els.map(el => el.getProperty('checked')));
  els = await Promise.all(els.map(el => el.jsonValue()));
  const selected = els.reduce((prev, cur) => prev || cur);
  return truth(`checkable ${option}`, 'to be checked')[assertType](selected);
}

async function findFields(locator) {
  const matchedLocator = new Locator(locator);
  if (!matchedLocator.isFuzzy()) {
    return this._locate(matchedLocator);
  }
  const literal = xpathLocator.literal(locator);

  let els = await this._locate({ xpath: Locator.field.labelEquals(literal) });
  if (els.length) {
    return els;
  }

  els = await this._locate({ xpath: Locator.field.labelContains(literal) });
  if (els.length) {
    return els;
  }
  els = await this._locate({ xpath: Locator.field.byName(literal) });
  if (els.length) {
    return els;
  }
  return this._locate({ css: locator });
}

async function proceedSeeInField(assertType, field, value) {
  const els = await findFields.call(this, field);
  assertElementExists(els, field, 'Field');
  const el = els[0];
  const tag = await el.getProperty('tagName').then(el => el.jsonValue());
  const fieldVal = await el.getProperty('value').then(el => el.jsonValue());
  if (tag === 'SELECT') {
    // locate option by values and check them
    const option = await el.$(`option[value="${fieldVal}"]`);
    assertElementExists(option, `Option with value ${fieldVal}`);
    const text = await option.getProperty('innerText');
    return equals(`select option by ${field}`)[assertType](value, text);
  }
  return stringIncludes(`field by ${field}`)[assertType](value, fieldVal);
}

function isFrameLocator(locator) {
  locator = new Locator(locator);
  if (locator.isFrame()) return locator.value;
  return false;
}


function assertElementExists(res, locator, prefix, suffix) {
  if (!res || res.length === 0) {
    throw new ElementNotFound(locator, prefix, suffix);
  }
}

function $XPath(element, selector) {
  const found = document.evaluate(selector, element || document.body, null, 5, null);
  const res = [];
  let current = null;
  while (current = found.iterateNext()) {
    res.push(current);
  }
  return res;
}

