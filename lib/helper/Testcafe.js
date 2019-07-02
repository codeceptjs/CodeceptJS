// @ts-nocheck
const fs = require('fs');
const assert = require('assert');
const path = require('path');
const requireg = require('requireg');
const createTestCafe = require('testcafe');
const { Selector, ClientFunction } = require('testcafe');

const testControllerHolder = require('./testcafe/testControllerHolder');
const {
  mapError,
  createTestFile,
  getParamNames,
  createDependencies,
} = require('./testcafe/testcafe-utils');

const stringIncludes = require('../assert/include').includes;
const { urlEquals } = require('../assert/equal');
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
 * Uses Testcafe to run tests.
 */
class Testcafe extends Helper {
  constructor(config) {
    super(config);

    this.iteration = 1;
    this.testcafe = undefined; // testcafe instance
    this.t = undefined; // testcafe test controller
    this.dummyTestcafeFile; // generated testcafe test file

    // context is used for within() function.
    // It requires to have _withinBeginand _withinEnd implemented.
    // Inside _withinBegin we should define that all next element calls should be started from a specific element (this.context).
    this.context = undefined; // TODO Not sure if this applies to testcafe


    this.options = Object.assign({
      url: 'http://localhost',
      show: false,
      browser: 'chrome',
      restart: true, // TODO Test if restart false works
      manualStart: false,
      keepBrowserState: false,
      waitForTimeout: 10000,
      getPageTimeout: 30000,
      fullPageScreenshots: false,
      disableScreenshots: false,
      windowSize: undefined,
    }, config);
  }

  // TOOD Do a requirements check
  static _checkRequirements() {
    try {
      requireg('testcafe');
    } catch (e) {
      return ['testcafe@^1.1.0'];
    }
  }

  async _startBrowser() {
    this.dummyTestcafeFile = createTestFile(global.output_dir); // create a dummy test file to get hold of the test controller

    this.iteration += 2; // Use different ports for each test run
    // @ts-ignore
    this.testcafe = await createTestCafe('localhost', 1338 + this.iteration, 1339 + this.iteration);

    this.debugSection('_before', 'Starting testcafe browser...');

    this.isRunning = true;

    // TODO Do we have to cleanup the runner?
    const runner = this.testcafe.createRunner();
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

    this.t = await testControllerHolder.get();
    assert(this.t, 'Expected to have the testcafe test controller');

    if (this.options.windowSize && this.options.windowSize.indexOf('x') > 0) {
      const dimensions = this.options.windowSize.split('x');
      await this.t.resizeWindow(parseInt(dimensions[0], 10), parseInt(dimensions[1], 10));
    }
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

  _init() {}

  async _beforeSuite() {
    if (!this.options.restart && !this.options.manualStart && !this.isRunning) {
      this.debugSection('Session', 'Starting singleton browser session');
      return this._startBrowser();
    }
  }


  async _before() {
    if (this.options.restart && !this.options.manualStart) return this._startBrowser();
    if (!this.isRunning && !this.options.manualStart) return this._startBrowser();
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
   * Get elements by different locator types, including strict locator
   * Should be used in custom helpers:
   *
   * ```js
   * const elements = await this.helpers['Testcafe']._locate({name: 'password'});
   * ```
   *
   * {{ react }}
   */
  async _locate(locator) {
    return findElements.call(this, this.context, locator);
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
   * {{ react }}
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
   * This method accepts [React selectors](https://codecept.io/react).
   */
  async waitForVisible(locator, sec) {
    const timeout = sec ? sec * 1000 : undefined;

    return findElements.call(this, this.context, locator)
      .with({ visibilityCheck: true, timeout })()
      .catch(mapError);
  }

  /**
   * {{> fillField }}
   * {{ react }}
   */
  async fillField(field, value) {
    const els = await findFields.call(this, field);
    assertElementExists(els, field, 'Field');
    const el = await els.nth(0);
    // await el.focus();
    // const tag = await el.getProperty('tagName').then(el => el.jsonValue());
    // const editable = await el.getProperty('contenteditable').then(el => el.jsonValue());
    // if (tag === 'INPUT' || tag === 'TEXTAREA') {
    //   await this._evaluateHandeInContext(el => el.value = '', el);
    // } else if (editable) {
    //   await this._evaluateHandeInContext(el => el.innerHTML = '', el);
    // }
    // await el.type(value.toString(), { delay: 10 });
    // return this._waitForAction();

    return this.t
      .typeText(el, value.toString(), { replace: true })
      .catch(mapError);
  }

  /**
   * {{> appendField }}
   *
   * {{ react }}
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
   * {{> hover }}
   *
   * {{ locator }}
   */
  async hover(locator) {
    return this.t
      .hover(findElements.call(this, this.context, locator))
      .catch(mapError);
  }

  /**
   * {{> doubleClick }}
   *
   * {{ react }}
   */
  async doubleClick(locator, context = null) {
    const el = findElements.call(this, context, locator).filterVisible().nth(0);
    return this.t
      .doubleClick(el)
      .catch(mapError);
  }

  /**
   * {{> rightClick }}
   *
   * {{ react }}
   */
  async rightClick(locator, context = null) {
    const el = findElements.call(this, context, locator).filterVisible().nth(0);
    return this.t
      .rightClick(el)
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
    console.log('selectOption', await els.count);

    const el = await els.filterVisible().nth(0);
    console.log('selectOption', await el.tagName);

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
      console.log('selectOption', opt);

      let optEl;
      try {
        optEl = el.child('option').withText(opt);
        console.log('selectOption', await optEl.tagName, await optEl.value, await optEl.innerText, await optEl.count);
        if (await optEl.count) {
          await this.t.click(optEl, clickOpts).catch(mapError);
          continue;
        }
      // eslint-disable-next-line no-empty
      } catch (err) {}

      try {
        const sel = `[value="${opt}"]`;
        optEl = el.find(sel);
        if (await optEl.count) {
          await this.t.click(optEl, clickOpts).catch(mapError);
        }
      // eslint-disable-next-line no-empty
      } catch (err) {}
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
   * {{ react }}
   */
  async see(text, context = null) {
    let els;
    if (context) {
      els = findElements.call(this, this.context, context)
        .withText(text);
    } else {
      els = findElements.call(this, this.context, 'body')
        .withText(text);
    }

    return this.t
      .expect(els.filterVisible().count).gt(0, `No element with text "${text}" found`)
      .catch(mapError);
  }

  /**
   * {{> dontSee }}
   *
   * {{ react }}
   */
  async dontSee(text, context = null) {
    let els;
    if (context) {
      els = findElements.call(this, this.context, context)
        .withText(text);
    } else {
      els = findElements.call(this, this.context, 'body')
        .withText(text);
    }

    return this.t
      .expect(els.filterVisible().count).eql(0, `Element with text "${text}" can still be seen`)
      .catch(mapError);
  }

  /**
   * {{> seeElement }}
   * {{ react }}
   */
  async seeElement(locator) {
    const exists = findElements.call(this, this.context, locator).filterVisible().exists;
    return this.t
      .expect(exists).ok(`No element "${locator}" found`)
      .catch(mapError);
  }

  /**
   * {{> dontSeeElement }}
   * {{ react }}
   */
  async dontSeeElement(locator) {
    const exists = findElements.call(this, this.context, locator).filterVisible().exists;
    return this.t
      .expect(exists).notOk(`Element "${locator}" is still visible`)
      .catch(mapError);
  }

  /**
   * {{> seeElementInDOM }}
   */
  async seeElementInDOM(locator) {
    const exists = findElements.call(this, this.context, locator).exists;
    return this.t
      .expect(exists).ok(`No element "${locator}" found in DOM`)
      .catch(mapError);
  }

  /**
   * {{> dontSeeElementInDOM }}
   */
  async dontSeeElementInDOM(locator) {
    const exists = findElements.call(this, this.context, locator).exists;
    return this.t
      .expect(exists).notOk(`Element "${locator}" is still in DOM`)
      .catch(mapError);
  }

  /**
   * {{> seeNumberOfVisibleElements }}
   *
   * {{ react }}
   */
  async seeNumberOfVisibleElements(locator, num) {
    const count = findElements.call(this, this.context, locator)
      .filterVisible().count;
    return this.t
      .expect(count).eql(num)
      .catch(mapError);
  }

  /**
   * {{> grabNumberOfVisibleElements }}
   * {{ react }}
   */
  async grabNumberOfVisibleElements(locator) {
    const count = findElements.call(this, this.context, locator)
      .filterVisible().count;
    return count;
  }

  /**
   * {{> seeInField }}
   */
  async seeInField(field, value) {
    const expectedValue = findElements.call(this, this.context, field).value;
    return this.t
      .expect(expectedValue).eql(value)
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
   * {{> saveScreenshot }}
   */
  async saveScreenshot(fileName, fullPage) {
    // TODO Implement full page screenshots
    const fullPageOption = fullPage || this.options.fullPageScreenshots;

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
    let browserFn;
    if (args && args.length > 0) {
      console.log(args);

      const { paramNames, fnWithoutParams } = getParamNames(fn);
      const dependencies = createDependencies(paramNames, args);

      console.log(dependencies);
      browserFn = ClientFunction(fnWithoutParams, { dependencies })
        .with({ boundTestRun: this.t });
    } else {
      browserFn = ClientFunction(fn).with({ boundTestRun: this.t });
    }
    return browserFn();
  }

  /**
   * {{> executeAsyncScript }}
   *
   * Asynchronous scripts can also be executed with `executeScript` if a function returns a Promise.
   */
  // async executeAsyncScript(fn) {
  //   const asyncFn = () => Promise(resolve => )
  //   let browserFn;
  //   if (args && args.length > 0) {
  //     console.log(args);

  //     const { paramNames, fnWithoutParams } = getParamNames(fn);
  //     const dependencies = createDependencies(paramNames, args);

  //     console.log(dependencies);
  //     browserFn = ClientFunction(fnWithoutParams, { dependencies })
  //       .with({ boundTestRun: this.t });
  //   } else {
  //     browserFn = ClientFunction(fn).with({ boundTestRun: this.t });
  //   }
  //   return browserFn();
  // }

  /**
   * {{> executeAsyncScript }}
   *
   * Asynchronous scripts can also be executed with `executeScript` if a function returns a Promise.
   */
  async executeAsyncScript(fn) {
    throw new Error('executeAsyncScript is not yet implemented');
  }

  /**
   * {{> grabTextFrom }}
   * {{ react }}
   */
  async grabTextFrom(locator) {
    const sel = findElements.call(this, this.context, locator);

    return sel.innerText;
  }

  /**
   * {{> grabAttributeFrom }}
   * {{ react }}
   */
  async grabAttributeFrom(locator, attr) {
    const sel = findElements.call(this, this.context, locator);

    return sel.getAttribute(attr);
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
   * {{> switchTo }}
   */
  async switchTo(locator) {
    return this.t.switchToIframe(findElements.call(this, this.context, locator));
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
    cookie.expires = cookie.expires || (new Date()).toUTCString();

    const setCookie = ClientFunction(() => {
      document.cookie = `${cookie.name}=${cookie.value};path=${cookie.path};expires=${cookie.expires};`;
    }, { dependencies: { cookie } }).with({ boundTestRun: this.t });

    return setCookie();
  }

  /**
   * {{> seeCookie }}
   *
   */
  // async seeCookie(name) {
  //   const cookies = await this.page.cookies();
  //   empty(`cookie ${name} to be set`).negate(cookies.filter(c => c.name === name));
  // }

  /**
   * {{> dontSeeCookie }}
   */
  // async dontSeeCookie(name) {
  //   const cookies = await this.page.cookies();
  //   empty(`cookie ${name} to be set`).assert(cookies.filter(c => c.name === name));
  // }

  /**
   * {{> grabCookie }}
   *
   * Returns cookie in JSON format. If name not passed returns all cookies for this domain.
   */
  async grabCookie(name) {
    const getCookie = ClientFunction(() => {
      // eslint-disable-next-line prefer-template
      const v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
      return v ? v[2] : null;
    }, { dependencies: { name } }).with({ boundTestRun: this.t });
    return getCookie();
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

    return waitForFunction.call(this, (urlPart) => {
      const currUrl = decodeURIComponent(decodeURIComponent(decodeURIComponent(window.location.href)));
      return currUrl.indexOf(urlPart) > -1;
    }, [urlPart], waitTimeout)
      .catch(async () => {
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

    return waitForFunction.call(this, (urlPart) => {
      const currUrl = decodeURIComponent(decodeURIComponent(decodeURIComponent(window.location.href)));
      return currUrl.indexOf(urlPart) > -1;
    }, [urlPart], waitTimeout)
      .catch(async () => {
        const currUrl = await this.grabCurrentUrl();
        throw new Error(`expected url to be ${urlPart}, but found ${currUrl}`);
      });
  }

  /**
   * {{> waitForFunction }}
   */
  async waitForFunction(fn, argsOrSec = null, sec = null) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;

    let args = [];
    if (argsOrSec) {
      if (Array.isArray(argsOrSec)) {
        args = argsOrSec;
      } else if (typeof argsOrSec === 'number') {
        sec = argsOrSec;
      }
    }

    return waitForFunction.call(this, fn, args, waitTimeout);
  }

  /**
   * {{> waitNumberOfVisibleElements }}
   * {{ react }}
   */
  async waitNumberOfVisibleElements(locator, num, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;

    locator = new Locator(locator, 'css');

    if (locator.isCSS()) {
      return this.t
        .expect(Selector(locator.simplify()).with({ boundTestRun: this.t }).filterVisible().count)
        .eql(num, `The number of elements (${locator}) is not ${num} after ${sec} sec`, { timeout: waitTimeout })
        .catch(mapError);
    }

    return this.t
      .expect(elementByXPath(locator.value).with({ boundTestRun: this.t }).filterVisible().count)
      .eql(num, `The number of elements (${locator}) is not ${num} after ${sec} sec`, { timeout: waitTimeout })
      .catch(mapError);
  }

  /**
   * {{> waitForElement }}
   * {{ react }}
   */
  async waitForElement(locator, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;

    locator = new Locator(locator, 'css');

    if (locator.isCSS()) {
      return this.t
        .expect(Selector(locator.simplify()).with({ boundTestRun: this.t }).exists)
        .ok({ timeout: waitTimeout })
        .catch(mapError);
    }

    return this.t
      .expect(elementByXPath(locator.value).with({ boundTestRun: this.t }).exists)
      .ok({ timeout: waitTimeout })
      .catch(mapError);
  }

  /**
   * {{> waitToHide }}
   */
  async waitToHide(locator, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;

    locator = new Locator(locator, 'css');

    if (locator.isCSS()) {
      return this.t
        .expect(Selector(locator.simplify()).filterVisible().with({ boundTestRun: this.t }).exists)
        .notOk({ timeout: waitTimeout })
        .catch(mapError);
    }

    return this.t
      .expect(elementByXPath(locator.value).filterVisible().with({ boundTestRun: this.t }).exists)
      .notOk({ timeout: waitTimeout })
      .catch(mapError);
  }
}

async function waitForFunction(fn, args, waitTimeout) {
  let browserFn;
  if (args && args.length > 0) {
    const { paramNames, fnWithoutParams } = getParamNames(fn);

    const dependencies = createDependencies(paramNames, args);

    browserFn = ClientFunction(fnWithoutParams, { dependencies })
      .with({ boundTestRun: this.t });
  } else {
    browserFn = ClientFunction(fn)
      .with({ boundTestRun: this.t });
  }

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
  }
}

const elementByXPath = (xpath) => {
  assert(xpath, 'xpath is required');
  console.log('elementByXPath', xpath);

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
  if (!res || (await res.count) === 0) {
    throw new ElementNotFound(locator, prefix, suffix);
  }
};

function findElements(matcher, locator) {
  if (locator && locator.react) throw new Error('react locators are not yet supported');

  locator = new Locator(locator, 'css');

  if (!locator.isXPath()) {
    return matcher ? matcher.find(locator.simplify()) : Selector(locator.simplify()).with({ timeout: 0, boundTestRun: this.t });
  }

  return matcher ?
    matcher.find(elementByXPath(locator.value).with({ timeout: 0, boundTestRun: this.t })) :
    elementByXPath(locator.value).with({ timeout: 0, boundTestRun: this.t });
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

  const firstElement = await els.nth(0);

  return this.t
    .click(firstElement)
    .catch(mapError);
}

async function findClickable(matcher, locator) {
  if (locator && locator.react) throw new Error('react locators are not yet supported');

  locator = new Locator(locator);
  if (!locator.isFuzzy()) return findElements.call(this, matcher, locator).filterVisible();

  let els;
  const literal = xpathLocator.literal(locator.value);

  els = findElements.call(this, matcher, Locator.clickable.narrow(literal)).filterVisible();
  if (await els.count) return els;

  els = findElements.call(this, matcher, Locator.clickable.wide(literal)).filterVisible();
  if (await els.count) return els;

  try {
    els = findElements.call(this, matcher, Locator.clickable.self(literal)).filterVisible();
    if (await els.count) return els;
  } catch (err) {
    // Do nothing
  }

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
    contextEl = await findElements.call(this, contextEl, (new Locator(context, 'css')).simplify()).filterVisible();
    contextEl = await contextEl.nth(0);
  }

  const matchedLocator = new Locator(locator);
  if (!matchedLocator.isFuzzy()) {
    return findElements.call(this, contextEl, matchedLocator.simplify()).filterVisible();
  }

  const literal = xpathLocator.literal(locator);
  let els = await findElements.call(this, contextEl, Locator.checkable.byText(literal)).filterVisible();
  if (await els.count) {
    return els;
  }

  els = findElements.call(this, contextEl, Locator.checkable.byName(literal)).filterVisible();
  if (await els.count) {
    return els;
  }

  return findElements.call(this, contextEl, locator).filterVisible();
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

module.exports = Testcafe;
