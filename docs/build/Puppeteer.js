const axios = require('axios');
const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');

const Helper = require('@codeceptjs/helper');
const { v4: uuidv4 } = require('uuid');
const promiseRetry = require('promise-retry');
const Locator = require('../locator');
const recorder = require('../recorder');
const store = require('../store');
const stringIncludes = require('../assert/include').includes;
const { urlEquals } = require('../assert/equal');
const { equals } = require('../assert/equal');
const { empty } = require('../assert/empty');
const { truth } = require('../assert/truth');
const isElementClickable = require('./scripts/isElementClickable');
const {
  xpathLocator,
  ucfirst,
  fileExists,
  chunkArray,
  toCamelCase,
  clearString,
  convertCssPropertiesToCamelCase,
  screenshotOutputFolder,
  getNormalizedKeyAttributeValue,
  isModifierKey,
  requireWithFallback, normalizeSpacesInString,
} = require('../utils');
const {
  isColorProperty,
  convertColorToRGBA,
} = require('../colorUtils');
const ElementNotFound = require('./errors/ElementNotFound');
const RemoteBrowserConnectionRefused = require('./errors/RemoteBrowserConnectionRefused');
const Popup = require('./extras/Popup');
const Console = require('./extras/Console');
const findReact = require('./extras/React');
const { highlightElement } = require('./scripts/highlightElement');
const { blurElement } = require('./scripts/blurElement');
const { focusElement } = require('./scripts/focusElement');
const {
  dontSeeElementError, seeElementError, dontSeeElementInDOMError, seeElementInDOMError,
} = require('./errors/ElementAssertion');

let puppeteer;
let perfTiming;
const popupStore = new Popup();
const consoleLogStore = new Console();

/**
 * ## Configuration
 *
 * This helper should be configured in codecept.conf.js
 *
 * @typedef PuppeteerConfig
 * @type {object}
 * @prop {string} url - base url of website to be tested
 * @prop {object} [basicAuth] (optional) the basic authentication to pass to base url. Example: {username: 'username', password: 'password'}
 * @prop {boolean} [show] - show Google Chrome window for debug.
 * @prop {boolean} [restart=true] - restart browser between tests.
 * @prop {boolean} [disableScreenshots=false]  - don't save screenshot on failure.
 * @prop {boolean} [fullPageScreenshots=false] - make full page screenshots on failure.
 * @prop {boolean} [uniqueScreenshotNames=false]  - option to prevent screenshot override if you have scenarios with the same name in different suites.
 * @prop {boolean} [trace=false] - record [tracing information](https://pptr.dev/api/puppeteer.tracing) with screenshots.
 * @prop {boolean} [keepTraceForPassedTests=false] - save trace for passed tests.
 * @prop {boolean} [keepBrowserState=false] - keep browser state between tests when `restart` is set to false.
 * @prop {boolean} [keepCookies=false] - keep cookies between tests when `restart` is set to false.
 * @prop {number} [waitForAction=100] - how long to wait after click, doubleClick or PressKey actions in ms. Default: 100.
 * @prop {string} [waitForNavigation=load] - when to consider navigation succeeded. Possible options: `load`, `domcontentloaded`, `networkidle0`, `networkidle2`. See [Puppeteer API](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagewaitfornavigationoptions). Array values are accepted as well.
 * @prop {number} [pressKeyDelay=10] - delay between key presses in ms. Used when calling Puppeteers page.type(...) in fillField/appendField
 * @prop {number} [getPageTimeout=30000] - config option to set maximum navigation time in milliseconds. If the timeout is set to 0, then timeout will be disabled.
 * @prop {number} [waitForTimeout=1000] - default wait* timeout in ms.
 * @prop {string} [windowSize] - default window size. Set a dimension in format WIDTHxHEIGHT like `640x480`.
 * @prop {string} [userAgent] - user-agent string.
 * @prop {boolean} [manualStart=false] - do not start browser before a test, start it manually inside a helper with `this.helpers["Puppeteer"]._startBrowser()`.
 * @prop {string} [browser=chrome] - can be changed to `firefox` when using [puppeteer-firefox](https://codecept.io/helpers/Puppeteer-firefox).
 * @prop {object} [chrome] - pass additional [Puppeteer run options](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions).
 * @prop {boolean} [highlightElement] - highlight the interacting elements. Default: false. Note: only activate under verbose mode (--verbose).
 */
const config = {};

/**
 * Uses [Google Chrome's Puppeteer](https://github.com/GoogleChrome/puppeteer) library to run tests inside headless Chrome.
 * Browser control is executed via DevTools Protocol (instead of Selenium).
 * This helper works with a browser out of the box with no additional tools required to install.
 *
 * Requires `puppeteer` or `puppeteer-core` package to be installed.
 * ```
 * npm i puppeteer --save
 * ```
 * or
 * ```
 * npm i puppeteer-core --save
 * ```
 * Using `puppeteer-core` package, will prevent the download of browser binaries and allow connecting to an existing browser installation or for connecting to a remote one.
 *
 * > Experimental Firefox support [can be activated](https://codecept.io/helpers/Puppeteer-firefox).
 *
 * <!-- configuration -->
 *
 * #### Trace Recording Customization
 *
 * Trace recording provides complete information on test execution and includes screenshots, and network requests logged during run.
 * Traces will be saved to `output/trace`
 *
 * * `trace`: enables trace recording for failed tests; trace are saved into `output/trace` folder
 * * `keepTraceForPassedTests`: - save trace for passed tests
 *
 * #### Example #1: Wait for 0 network connections.
 *
 * ```js
 * {
 *    helpers: {
 *      Puppeteer : {
 *        url: "http://localhost",
 *        restart: false,
 *        waitForNavigation: "networkidle0",
 *        waitForAction: 500
 *      }
 *    }
 * }
 * ```
 *
 * #### Example #2: Wait for DOMContentLoaded event and 0 network connections
 *
 * ```js
 * {
 *    helpers: {
 *      Puppeteer : {
 *        url: "http://localhost",
 *        restart: false,
 *        waitForNavigation: [ "domcontentloaded", "networkidle0" ],
 *        waitForAction: 500
 *      }
 *    }
 * }
 * ```
 *
 * #### Example #3: Debug in window mode
 *
 * ```js
 * {
 *    helpers: {
 *      Puppeteer : {
 *        url: "http://localhost",
 *        show: true
 *      }
 *    }
 * }
 * ```
 *
 * #### Example #4: Connect to remote browser by specifying [websocket endpoint](https://chromedevtools.github.io/devtools-protocol/#how-do-i-access-the-browser-target)
 *
 * ```js
 * {
 *    helpers: {
 *      Puppeteer: {
 *        url: "http://localhost",
 *        chrome: {
 *          browserWSEndpoint: "ws://localhost:9222/devtools/browser/c5aa6160-b5bc-4d53-bb49-6ecb36cd2e0a"
 *        }
 *      }
 *    }
 * }
 * ```
 * > Note: When connecting to remote browser `show` and specific `chrome` options (e.g. `headless` or `devtools`) are ignored.
 *
 * #### Example #5: Target URL with provided basic authentication
 *
 * ```js
 * {
 *    helpers: {
 *      Puppeteer : {
 *        url: 'http://localhost',
 *        basicAuth: {username: 'username', password: 'password'},
 *        show: true
 *      }
 *    }
 * }
 * ```
 * #### Troubleshooting
 *
 * Error Message:  `No usable sandbox!`
 *
 * When running Puppeteer on CI try to disable sandbox if you see that message
 *
 * ```
 * helpers: {
 *  Puppeteer: {
 *     url: 'http://localhost',
 *     show: false,
 *     chrome: {
 *       args: ['--no-sandbox', '--disable-setuid-sandbox']
 *     }
 *   },
 * }
 * ```
 *
 *
 *
 * ## Access From Helpers
 *
 * Receive Puppeteer client from a custom helper by accessing `browser` for the Browser object or `page` for the current Page object:
 *
 * ```js
 * const { browser } = this.helpers.Puppeteer;
 * await browser.pages(); // List of pages in the browser
 *
 * const { page } = this.helpers.Puppeteer;
 * await page.url(); // Get the url of the current page
 * ```
 *
 * ## Methods
 */
class Puppeteer extends Helper {
  constructor(config) {
    super(config);

    puppeteer = requireWithFallback('puppeteer', 'puppeteer-core');
    // set defaults
    this.isRemoteBrowser = false;
    this.isRunning = false;
    this.isAuthenticated = false;
    this.sessionPages = {};
    this.activeSessionName = '';

    // override defaults with config
    this._setConfig(config);
  }

  _validateConfig(config) {
    const defaults = {
      browser: 'chrome',
      waitForAction: 100,
      waitForTimeout: 1000,
      pressKeyDelay: 10,
      fullPageScreenshots: false,
      disableScreenshots: false,
      uniqueScreenshotNames: false,
      manualStart: false,
      getPageTimeout: 30000,
      waitForNavigation: 'load',
      restart: true,
      keepCookies: false,
      keepBrowserState: false,
      show: false,
      defaultPopupAction: 'accept',
      highlightElement: false,
    };

    return Object.assign(defaults, config);
  }

  _getOptions(config) {
    return config.browser === 'firefox' ? Object.assign(this.options.firefox, { product: 'firefox' }) : this.options.chrome;
  }

  _setConfig(config) {
    this.options = this._validateConfig(config);
    this.puppeteerOptions = {
      headless: !this.options.show,
      ...this._getOptions(config),
    };
    if (this.puppeteerOptions.headless) this.puppeteerOptions.headless = 'new';
    this.isRemoteBrowser = !!this.puppeteerOptions.browserWSEndpoint;
    popupStore.defaultAction = this.options.defaultPopupAction;
  }

  static _config() {
    return [
      { name: 'url', message: 'Base url of site to be tested', default: 'http://localhost' },
      {
        name: 'show', message: 'Show browser window', default: true, type: 'confirm',
      },
      {
        name: 'windowSize', message: 'Browser viewport size', default: '1200x900',
      },
    ];
  }

  static _checkRequirements() {
    try {
      requireWithFallback('puppeteer', 'puppeteer-core');
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

  async _before(test) {
    this.sessionPages = {};
    this.currentRunningTest = test;
    recorder.retry({
      retries: process.env.FAILED_STEP_RETRIES || 3,
      when: err => {
        if (!err || typeof (err.message) !== 'string') {
          return false;
        }
        // ignore context errors
        return err.message.includes('context');
      },
    });
    if (this.options.restart && !this.options.manualStart) return this._startBrowser();
    if (!this.isRunning && !this.options.manualStart) return this._startBrowser();
    return this.browser;
  }

  async _after() {
    if (!this.isRunning) return;

    // close other sessions
    const contexts = this.browser.browserContexts();
    const defaultCtx = contexts.shift();

    await Promise.all(contexts.map(c => c.close()));

    if (this.options.restart) {
      this.isRunning = false;
      return this._stopBrowser();
    }

    // ensure this.page is from default context
    if (this.page) {
      const existingPages = defaultCtx.targets().filter(t => t.type() === 'page');
      await this._setPage(await existingPages[0].page());
    }

    if (this.options.keepBrowserState) return;

    if (!this.options.keepCookies) {
      this.debugSection('Session', 'cleaning cookies and localStorage');
      await this.clearCookie();
    }
    const currentUrl = await this.grabCurrentUrl();

    if (currentUrl.startsWith('http')) {
      await this.executeScript('localStorage.clear();').catch((err) => {
        if (!(err.message.indexOf("Storage is disabled inside 'data:' URLs.") > -1)) throw err;
      });
      await this.executeScript('sessionStorage.clear();').catch((err) => {
        if (!(err.message.indexOf("Storage is disabled inside 'data:' URLs.") > -1)) throw err;
      });
    }
    await this.closeOtherTabs();
    return this.browser;
  }

  _afterSuite() {
  }

  _finishTest() {
    if (!this.options.restart && this.isRunning) return this._stopBrowser();
  }

  _session() {
    return {
      start: async (name = '') => {
        this.debugSection('Incognito Tab', 'opened');
        this.activeSessionName = name;

        const bc = await this.browser.createBrowserContext();
        await bc.newPage();

        // Create a new page inside context.
        return bc;
      },
      stop: async () => {
        // is closed by _after
      },
      loadVars: async (context) => {
        const existingPages = context.targets().filter(t => t.type() === 'page');
        this.sessionPages[this.activeSessionName] = await existingPages[0].page();
        return this._setPage(this.sessionPages[this.activeSessionName]);
      },
      restoreVars: async (session) => {
        this.withinLocator = null;

        if (!session) {
          this.activeSessionName = '';
        } else {
          this.activeSessionName = session;
        }
        const defaultCtx = this.browser.defaultBrowserContext();
        const existingPages = defaultCtx.targets().filter(t => t.type() === 'page');
        await this._setPage(await existingPages[0].page());

        return this._waitForAction();
      },
    };
  }

  /**
   * Use Puppeteer API inside a test.
   *
   * First argument is a description of an action.
   * Second argument is async function that gets this helper as parameter.
   *
   * { [`page`](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#class-page), [`browser`](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#class-browser) } from Puppeteer API are available.
   *
   * ```js
   * I.usePuppeteerTo('emulate offline mode', async ({ page }) {
   *   await page.setOfflineMode(true);
   * });
   * ```
   *
   * @param {string} description used to show in logs.
   * @param {function} fn async function that is executed with Puppeteer as argument
   */
  usePuppeteerTo(description, fn) {
    return this._useTo(...arguments);
  }

  /**
   * Set the automatic popup response to Accept.
   * This must be set before a popup is triggered.
   *
   * ```js
   * I.amAcceptingPopups();
   * I.click('#triggerPopup');
   * I.acceptPopup();
   * ```
   */
  amAcceptingPopups() {
    popupStore.actionType = 'accept';
  }

  /**
   * Accepts the active JavaScript native popup window, as created by window.alert|window.confirm|window.prompt.
   * Don't confuse popups with modal windows, as created by [various
   * libraries](http://jster.net/category/windows-modals-popups).
   */
  acceptPopup() {
    popupStore.assertPopupActionType('accept');
  }

  /**
   * Set the automatic popup response to Cancel/Dismiss.
   * This must be set before a popup is triggered.
   *
   * ```js
   * I.amCancellingPopups();
   * I.click('#triggerPopup');
   * I.cancelPopup();
   * ```
   */
  amCancellingPopups() {
    popupStore.actionType = 'cancel';
  }

  /**
   * Dismisses the active JavaScript popup, as created by window.alert|window.confirm|window.prompt.
   */
  cancelPopup() {
    popupStore.assertPopupActionType('cancel');
  }

  /**
   * Checks that the active JavaScript popup, as created by `window.alert|window.confirm|window.prompt`, contains the
   * given string.
   * 
   * ```js
   * I.seeInPopup('Popup text');
   * ```
   * @param {string} text value to check.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async seeInPopup(text) {
    popupStore.assertPopupVisible();
    const popupText = await popupStore.popup.message();
    stringIncludes('text in popup').assert(text, popupText);
  }

  /**
   * Set current page
   * @param {object} page page to set
   */
  async _setPage(page) {
    page = await page;
    this._addPopupListener(page);
    this._addErrorListener(page);
    this.page = page;
    if (!page) return;
    page.setDefaultNavigationTimeout(this.options.getPageTimeout);
    this.context = await this.page.$('body');
    if (this.options.browser === 'chrome') {
      await page.bringToFront();
    }
  }

  async _addErrorListener(page) {
    if (!page) {
      return;
    }
    page.on('error', async (error) => {
      console.error('Puppeteer page error', error);
    });
  }

  /**
   * Add the 'dialog' event listener to a page
   * @page {Puppeteer.Page}
   *
   * The popup listener handles the dialog with the predefined action when it appears on the page.
   * It also saves a reference to the object which is used in seeInPopup.
   */
  _addPopupListener(page) {
    if (!page) {
      return;
    }
    page.on('dialog', async (dialog) => {
      popupStore.popup = dialog;
      const action = popupStore.actionType || this.options.defaultPopupAction;
      await this._waitForAction();

      switch (action) {
        case 'accept':
          return dialog.accept();

        case 'cancel':
          return dialog.dismiss();

        default: {
          throw new Error('Unknown popup action type. Only "accept" or "cancel" are accepted');
        }
      }
    });
  }

  /**
   * Gets page URL including hash.
   */
  async _getPageUrl() {
    return this.executeScript(() => window.location.href);
  }

  /**
   * Grab the text within the popup. If no popup is visible then it will return null
   *
   * ```js
   * await I.grabPopupText();
   * ```
   * @return {Promise<string | null>}
   */
  async grabPopupText() {
    if (popupStore.popup) {
      return popupStore.popup.message();
    }
    return null;
  }

  async _startBrowser() {
    if (this.isRemoteBrowser) {
      try {
        this.browser = await puppeteer.connect(this.puppeteerOptions);
      } catch (err) {
        if (err.toString().indexOf('ECONNREFUSED')) {
          throw new RemoteBrowserConnectionRefused(err);
        }
        throw err;
      }
    } else {
      this.browser = await puppeteer.launch(this.puppeteerOptions);
    }

    this.browser.on('targetcreated', target => target.page().then(page => targetCreatedHandler.call(this, page)).catch((e) => {
      console.error('Puppeteer page error', e);
    }));
    this.browser.on('targetchanged', (target) => {
      this.debugSection('Url', target.url());
    });

    const existingPages = await this.browser.pages();
    const mainPage = existingPages[0] || await this.browser.newPage();

    if (existingPages.length) {
      // Run the handler as it will not be triggered if the page already exists
      targetCreatedHandler.call(this, mainPage);
    }
    await this._setPage(mainPage);
    await this.closeOtherTabs();

    this.isRunning = true;
  }

  async _stopBrowser() {
    this.withinLocator = null;
    this._setPage(null);
    this.context = null;
    popupStore.clear();
    this.isAuthenticated = false;
    await this.browser.close();
    if (this.isRemoteBrowser) {
      await this.browser.disconnect();
    }
  }

  async _evaluateHandeInContext(...args) {
    const context = await this._getContext();
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
      await this.switchTo(frame);
      this.withinLocator = new Locator(frame);
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

  _extractDataFromPerformanceTiming(timing, ...dataNames) {
    const navigationStart = timing.navigationStart;

    const extractedData = {};
    dataNames.forEach((name) => {
      extractedData[name] = timing[name] - navigationStart;
    });

    return extractedData;
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

    if (this.options.basicAuth && (this.isAuthenticated !== true)) {
      if (url.includes(this.options.url)) {
        await this.page.authenticate(this.options.basicAuth);
        this.isAuthenticated = true;
      }
    }

    if (this.options.trace) {
      const fileName = `${`${global.output_dir}${path.sep}trace${path.sep}${uuidv4()}_${clearString(this.currentRunningTest.title)}`.slice(0, 245)}.json`;
      const dir = path.dirname(fileName);
      if (!fileExists(dir)) fs.mkdirSync(dir);
      await this.page.tracing.start({ screenshots: true, path: fileName });
      this.currentRunningTest.artifacts.trace = fileName;
    }

    await this.page.goto(url, { waitUntil: this.options.waitForNavigation });

    const performanceTiming = JSON.parse(await this.page.evaluate(() => JSON.stringify(window.performance.timing)));

    perfTiming = this._extractDataFromPerformanceTiming(
      performanceTiming,
      'responseEnd',
      'domInteractive',
      'domContentLoadedEventEnd',
      'loadEventEnd',
    );

    return this._waitForAction();
  }

  /**
   *
   * Unlike other drivers Puppeteer changes the size of a viewport, not the window!
   * Puppeteer does not control the window of a browser, so it can't adjust its real size.
   * It also can't maximize a window.
   *
   * Resize the current window to provided width and height.
   * First parameter can be set to `maximize`.
   * 
   * @param {number} width width in pixels or `maximize`.
   * @param {number} height height in pixels.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   *
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
   * I.setPuppeteerRequestHeaders({
   *    'X-Sent-By': 'CodeceptJS',
   * });
   * ```
   *
   * @param {object} customHeaders headers to set
   */
  async setPuppeteerRequestHeaders(customHeaders) {
    if (!customHeaders) {
      throw new Error('Cannot send empty headers.');
    }
    return this.page.setExtraHTTPHeaders(customHeaders);
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
   * {{ react }}
   */
  async moveCursorTo(locator, offsetX = 0, offsetY = 0) {
    const els = await this._locate(locator);
    assertElementExists(els, locator);

    // Use manual mouse.move instead of .hover() so the offset can be added to the coordinates
    const { x, y } = await getClickablePoint(els[0]);
    await this.page.mouse.move(x + offsetX, y + offsetY);
    return this._waitForAction();
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
    assertElementExists(els, locator, 'Element to focus');
    const el = els[0];

    await el.click();
    await el.focus();
    return this._waitForAction();
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
    assertElementExists(els, locator, 'Element to blur');

    await blurElement(els[0], this.page);
    return this._waitForAction();
  }

  /**
   * Drag an item to a destination element.
   * 
   * ```js
   * I.dragAndDrop('#dragHandle', '#container');
   * ```
   * 
   * @param {string | object} srcElement located by CSS|XPath|strict locator.
   * @param {string | object} destElement located by CSS|XPath|strict locator.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async dragAndDrop(srcElement, destElement) {
    return proceedDragAndDrop.call(this, srcElement, destElement);
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
    return this.page.reload({ timeout: this.options.getPageTimeout, waitUntil: this.options.waitForNavigation });
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
    return this.executeScript(() => {
      window.scrollTo(0, 0);
    });
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
    return this.executeScript(() => {
      const body = document.body;
      const html = document.documentElement;
      window.scrollTo(0, Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight,
      ));
    });
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

    if (locator) {
      const els = await this._locate(locator);
      assertElementExists(els, locator, 'Element');
      const el = els[0];
      await el.evaluate((el) => el.scrollIntoView());
      const elementCoordinates = await getClickablePoint(els[0]);
      await this.executeScript((x, y) => window.scrollBy(x, y), elementCoordinates.x + offsetX, elementCoordinates.y + offsetY);
    } else {
      await this.executeScript((x, y) => window.scrollTo(x, y), offsetX, offsetY);
    }
    return this._waitForAction();
  }

  /**
   * Checks that title contains text.
   * 
   * ```js
   * I.seeInTitle('Home Page');
   * ```
   * 
   * @param {string} text text value to check.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async seeInTitle(text) {
    const title = await this.page.title();
    stringIncludes('web page title').assert(text, title);
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
   * Checks that title is equal to provided one.
   * 
   * ```js
   * I.seeTitleEquals('Test title.');
   * ```
   * 
   * @param {string} text value to check.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async seeTitleEquals(text) {
    const title = await this.page.title();
    return equals('web page title').assert(title, text);
  }

  /**
   * Checks that title does not contain text.
   * 
   * ```js
   * I.dontSeeInTitle('Error');
   * ```
   * 
   * @param {string} text value to check.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async dontSeeInTitle(text) {
    const title = await this.page.title();
    stringIncludes('web page title').negate(text, title);
  }

  /**
   * Retrieves a page title and returns it to test.
   * Resumes test execution, so **should be used inside async with `await`** operator.
   * 
   * ```js
   * let title = await I.grabTitle();
   * ```
   * 
   * @returns {Promise<string>} title
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
   *
   * {{ react }}
   */
  async _locate(locator) {
    const context = await this.context;
    return findElements.call(this, context, locator);
  }

  /**
   * Find a checkbox by providing human-readable text:
   * NOTE: Assumes the checkable element exists
   *
   * ```js
   * this.helpers['Puppeteer']._locateCheckable('I agree with terms and conditions').then // ...
   * ```
   */
  async _locateCheckable(locator, providedContext = null) {
    const context = providedContext || await this._getContext();
    const els = await findCheckable.call(this, locator, context);
    assertElementExists(els[0], locator, 'Checkbox or radio');
    return els[0];
  }

  /**
   * Find a clickable element by providing human-readable text:
   *
   * ```js
   * this.helpers['Puppeteer']._locateClickable('Next page').then // ...
   * ```
   */
  async _locateClickable(locator) {
    const context = await this.context;
    return findClickable.call(this, context, locator);
  }

  /**
   * Find field elements by providing human-readable text:
   *
   * ```js
   * this.helpers['Puppeteer']._locateFields('Your email').then // ...
   * ```
   */
  async _locateFields(locator) {
    return findFields.call(this, locator);
  }

  /**
   * Grab WebElements for given locator
   * Resumes test execution, so **should be used inside an async function with `await`** operator.
   * 
   * ```js
   * const webElements = await I.grabWebElements('#button');
   * ```
   * 
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @returns {Promise<*>} WebElement of being used Web helper
   * 
   *
   */
  async grabWebElements(locator) {
    return this._locate(locator);
  }

  /**
   * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab
   *
   * ```js
   * I.switchToNextTab();
   * I.switchToNextTab(2);
   * ```
   *
   * @param {number} [num=1]
   */
  async switchToNextTab(num = 1) {
    const pages = await this.browser.pages();
    const index = pages.indexOf(this.page);
    this.withinLocator = null;
    const page = pages[index + num];

    if (!page) {
      throw new Error(`There is no ability to switch to next tab with offset ${num}`);
    }

    await this._setPage(page);
    return this._waitForAction();
  }

  /**
   * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab
   *
   * ```js
   * I.switchToPreviousTab();
   * I.switchToPreviousTab(2);
   * ```
   * @param {number} [num=1]
   */
  async switchToPreviousTab(num = 1) {
    const pages = await this.browser.pages();
    const index = pages.indexOf(this.page);
    this.withinLocator = null;
    const page = pages[index - num];

    if (!page) {
      throw new Error(`There is no ability to switch to previous tab with offset ${num}`);
    }

    await this._setPage(page);
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
    await oldPage.close();
    return this._waitForAction();
  }

  /**
   * Close all tabs except for the current one.
   *
   * ```js
   * I.closeOtherTabs();
   * ```
   */
  async closeOtherTabs() {
    const pages = await this.browser.pages();
    const otherPages = pages.filter(page => page !== this.page);

    let p = Promise.resolve();
    otherPages.forEach((page) => {
      p = p.then(() => page.close());
    });
    await p;
    return this._waitForAction();
  }

  /**
   * Open new tab and switch to it
   *
   * ```js
   * I.openNewTab();
   * ```
   */
  async openNewTab() {
    await this._setPage(await this.browser.newPage());
    return this._waitForAction();
  }

  /**
   * Grab number of open tabs.
   * Resumes test execution, so **should be used inside async function with `await`** operator.
   * 
   * ```js
   * let tabs = await I.grabNumberOfOpenTabs();
   * ```
   * 
   * @returns {Promise<number>} number of open tabs
   * 
   */
  async grabNumberOfOpenTabs() {
    const pages = await this.browser.pages();
    return pages.length;
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
   * {{ react }}
   */
  async seeElement(locator) {
    let els = await this._locate(locator);
    els = (await Promise.all(els.map(el => el.boundingBox() && el))).filter(v => v);
    // Puppeteer visibility was ignored? | Remove when Puppeteer is fixed
    els = await Promise.all(els.map(async el => (await el.evaluate(node => window.getComputedStyle(node).visibility !== 'hidden' && window.getComputedStyle(node).display !== 'none')) && el));
    try {
      return empty('visible elements').negate(els.filter(v => v).fill('ELEMENT'));
    } catch (e) {
      dontSeeElementError(locator);
    }
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
   * {{ react }}
   */
  async dontSeeElement(locator) {
    let els = await this._locate(locator);
    els = (await Promise.all(els.map(el => el.boundingBox() && el))).filter(v => v);
    // Puppeteer visibility was ignored? | Remove when Puppeteer is fixed
    els = await Promise.all(els.map(async el => (await el.evaluate(node => window.getComputedStyle(node).visibility !== 'hidden' && window.getComputedStyle(node).display !== 'none')) && el));
    try {
      return empty('visible elements').assert(els.filter(v => v).fill('ELEMENT'));
    } catch (e) {
      seeElementError(locator);
    }
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
    const els = await this._locate(locator);
    try {
      return empty('elements on page').negate(els.filter(v => v).fill('ELEMENT'));
    } catch (e) {
      dontSeeElementInDOMError(locator);
    }
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
    const els = await this._locate(locator);
    try {
      return empty('elements on a page').assert(els.filter(v => v).fill('ELEMENT'));
    } catch (e) {
      seeElementInDOMError(locator);
    }
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
   * {{ react }}
   */
  async click(locator, context = null) {
    return proceedClick.call(this, locator, context);
  }

  /**
   * Perform an emulated click on a link or a button, given by a locator.
   * Unlike normal click instead of sending native event, emulates a click with JavaScript.
   * This works on hidden, animated or inactive elements as well.
   * 
   * If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
   * For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
   * For images, the "alt" attribute and inner text of any parent links are searched.
   * 
   * The second parameter is a context (CSS or XPath locator) to narrow the search.
   * 
   * ```js
   * // simple link
   * I.forceClick('Logout');
   * // button of form
   * I.forceClick('Submit');
   * // CSS button
   * I.forceClick('#form input[type=submit]');
   * // XPath
   * I.forceClick('//form/*[@type=submit]');
   * // link in context
   * I.forceClick('Logout', '#nav');
   * // using strict locator
   * I.forceClick({css: 'nav a.login'});
   * ```
   * 
   * @param {string | object} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
   * @param {?string | object} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   *
   * {{ react }}
   */
  async forceClick(locator, context = null) {
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
    const elem = els[0];
    return this.executeScript((el) => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      const event = document.createEvent('MouseEvent');
      event.initEvent('click', true, true);
      return el.dispatchEvent(event);
    }, elem);
  }

  /**
   * Performs a click on a link and waits for navigation before moving on.
   * 
   * ```js
   * I.clickLink('Logout', '#nav');
   * ```
   * @param {string | object} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator
   * @param {?string | object} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator
   * @returns {void} automatically synchronized promise through #recorder
   * 
   *
   * {{ react }}
   */
  async clickLink(locator, context = null) {
    return proceedClick.call(this, locator, context, { waitForNavigation: true });
  }

  /**
   * Sets a directory to where save files. Allows to test file downloads.
   * Should be used with [FileSystem helper](https://codecept.io/helpers/FileSystem) to check that file were downloaded correctly.
   *
   * By default, files are saved to `output/downloads`.
   * This directory is cleaned on every `handleDownloads` call, to ensure no old files are kept.
   *
   * ```js
   * I.handleDownloads();
   * I.click('Download Avatar');
   * I.amInPath('output/downloads');
   * I.seeFile('avatar.jpg');
   *
   * ```
   *
   * @param {string} [downloadPath='downloads'] change this parameter to set another directory for saving
   */
  async handleDownloads(downloadPath = 'downloads') {
    downloadPath = path.join(global.output_dir, downloadPath);
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath, '0777');
    }
    fsExtra.emptyDirSync(downloadPath);

    try {
      return this.page._client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath });
    } catch (e) {
      return this.page._client().send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath });
    }
  }

  /**
   * This method is **deprecated**.
   *
   * Please use `handleDownloads()` instead.
   */
  async downloadFile(locator, customName) {
    let fileName;
    await this.page.setRequestInterception(true);

    const xRequest = await new Promise((resolve) => {
      this.page.on('request', (request) => {
        console.log('rq', request, customName);
        const grabbedFileName = request.url().split('/')[request.url().split('/').length - 1];
        const fileExtension = request.url().split('/')[request.url().split('/').length - 1].split('.')[1];
        console.log('nm', customName, fileExtension);
        if (customName && path.extname(customName) !== fileExtension) {
          console.log('bypassing a request');
          request.continue();
          return;
        }
        customName ? fileName = `${customName}.${fileExtension}` : fileName = grabbedFileName;
        request.abort();
        resolve(request);
      });
    });

    await this.click(locator);

    const options = {
      encoding: null,
      method: xRequest._method,
      uri: xRequest._url,
      body: xRequest._postData,
      headers: xRequest._headers,
    };

    const cookies = await this.page.cookies();
    options.headers.Cookie = cookies.map(ck => `${ck.name}=${ck.value}`).join(';');

    const response = await axios({
      method: options.method,
      url: options.uri,
      headers: options.headers,
      responseType: 'arraybuffer',
      onDownloadProgress(e) {
        console.log('+', e);
      },
    });

    const outputFile = path.join(`${global.output_dir}/${fileName}`);

    try {
      await new Promise((resolve, reject) => {
        const wstream = fs.createWriteStream(outputFile);
        console.log(response);
        wstream.write(response.data);
        wstream.end();
        this.debug(`File is downloaded in ${outputFile}`);
        wstream.on('finish', () => { resolve(fileName); });
        wstream.on('error', reject);
      });
    } catch (error) {
      throw new Error(`There is something wrong with downloaded file. ${error}`);
    }
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
   * {{ react }}
   */
  async doubleClick(locator, context = null) {
    return proceedClick.call(this, locator, context, { clickCount: 2 });
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
   * {{ react }}
   */
  async rightClick(locator, context = null) {
    return proceedClick.call(this, locator, context, { button: 'right' });
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
    const elm = await this._locateCheckable(field, context);
    const curentlyChecked = await elm.getProperty('checked')
      .then(checkedProperty => checkedProperty.jsonValue());
    // Only check if NOT currently checked
    if (!curentlyChecked) {
      await elm.click();
      return this._waitForAction();
    }
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
    const elm = await this._locateCheckable(field, context);
    const curentlyChecked = await elm.getProperty('checked')
      .then(checkedProperty => checkedProperty.jsonValue());
    // Only uncheck if currently checked
    if (curentlyChecked) {
      await elm.click();
      return this._waitForAction();
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
   * Presses a key in the browser and leaves it in a down state.
   * 
   * To make combinations with modifier key and user operation (e.g. `'Control'` + [`click`](#click)).
   * 
   * ```js
   * I.pressKeyDown('Control');
   * I.click('#element');
   * I.pressKeyUp('Control');
   * ```
   * 
   * @param {string} key name of key to press down.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async pressKeyDown(key) {
    key = getNormalizedKey.call(this, key);
    await this.page.keyboard.down(key);
    return this._waitForAction();
  }

  /**
   * Releases a key in the browser which was previously set to a down state.
   * 
   * To make combinations with modifier key and user operation (e.g. `'Control'` + [`click`](#click)).
   * 
   * ```js
   * I.pressKeyDown('Control');
   * I.click('#element');
   * I.pressKeyUp('Control');
   * ```
   * 
   * @param {string} key name of key to release.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async pressKeyUp(key) {
    key = getNormalizedKey.call(this, key);
    await this.page.keyboard.up(key);
    return this._waitForAction();
  }

  /**
   * _Note:_ Shortcuts like `'Meta'` + `'A'` do not work on macOS ([GoogleChrome/puppeteer#1313](https://github.com/GoogleChrome/puppeteer/issues/1313)).
   *
   * Presses a key in the browser (on a focused element).
   * 
   * _Hint:_ For populating text field or textarea, it is recommended to use [`fillField`](#fillfield).
   * 
   * ```js
   * I.pressKey('Backspace');
   * ```
   * 
   * To press a key in combination with modifier keys, pass the sequence as an array. All modifier keys (`'Alt'`, `'Control'`, `'Meta'`, `'Shift'`) will be released afterwards.
   * 
   * ```js
   * I.pressKey(['Control', 'Z']);
   * ```
   * 
   * For specifying operation modifier key based on operating system it is suggested to use `'CommandOrControl'`.
   * This will press `'Command'` (also known as `'Meta'`) on macOS machines and `'Control'` on non-macOS machines.
   * 
   * ```js
   * I.pressKey(['CommandOrControl', 'Z']);
   * ```
   * 
   * Some of the supported key names are:
   * - `'AltLeft'` or `'Alt'`
   * - `'AltRight'`
   * - `'ArrowDown'`
   * - `'ArrowLeft'`
   * - `'ArrowRight'`
   * - `'ArrowUp'`
   * - `'Backspace'`
   * - `'Clear'`
   * - `'ControlLeft'` or `'Control'`
   * - `'ControlRight'`
   * - `'Command'`
   * - `'CommandOrControl'`
   * - `'Delete'`
   * - `'End'`
   * - `'Enter'`
   * - `'Escape'`
   * - `'F1'` to `'F12'`
   * - `'Home'`
   * - `'Insert'`
   * - `'MetaLeft'` or `'Meta'`
   * - `'MetaRight'`
   * - `'Numpad0'` to `'Numpad9'`
   * - `'NumpadAdd'`
   * - `'NumpadDecimal'`
   * - `'NumpadDivide'`
   * - `'NumpadMultiply'`
   * - `'NumpadSubtract'`
   * - `'PageDown'`
   * - `'PageUp'`
   * - `'Pause'`
   * - `'Return'`
   * - `'ShiftLeft'` or `'Shift'`
   * - `'ShiftRight'`
   * - `'Space'`
   * - `'Tab'`
   * 
   * @param {string|string[]} key key or array of keys to press.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async pressKey(key) {
    const modifiers = [];
    if (Array.isArray(key)) {
      for (let k of key) {
        k = getNormalizedKey.call(this, k);
        if (isModifierKey(k)) {
          modifiers.push(k);
        } else {
          key = k;
          break;
        }
      }
    } else {
      key = getNormalizedKey.call(this, key);
    }
    for (const modifier of modifiers) {
      await this.page.keyboard.down(modifier);
    }
    await this.page.keyboard.press(key);
    for (const modifier of modifiers) {
      await this.page.keyboard.up(modifier);
    }
    return this._waitForAction();
  }

  /**
   * Types out the given text into an active field.
   * To slow down typing use a second parameter, to set interval between key presses.
   * _Note:_ Should be used when [`fillField`](#fillfield) is not an option.
   * 
   * ```js
   * // passing in a string
   * I.type('Type this out.');
   * 
   * // typing values with a 100ms interval
   * I.type('4141555311111111', 100);
   * 
   * // passing in an array
   * I.type(['T', 'E', 'X', 'T']);
   * 
   * // passing a secret
   * I.type(secret('123456'));
   * ```
   * 
   * @param {string|string[]} key or array of keys to type.
   * @param {?number} [delay=null] (optional) delay in ms between key presses
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async type(keys, delay = null) {
    if (!Array.isArray(keys)) {
      keys = keys.toString();
      keys = keys.split('');
    }

    for (const key of keys) {
      await this.page.keyboard.press(key);
      if (delay) await this.wait(delay / 1000);
    }
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
   * {{ react }}
   */
  async fillField(field, value) {
    const els = await findVisibleFields.call(this, field);
    assertElementExists(els, field, 'Field');
    const el = els[0];
    const tag = await el.getProperty('tagName').then(el => el.jsonValue());
    const editable = await el.getProperty('contenteditable').then(el => el.jsonValue());
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      await this._evaluateHandeInContext(el => el.value = '', el);
    } else if (editable) {
      await this._evaluateHandeInContext(el => el.innerHTML = '', el);
    }

    highlightActiveElement.call(this, el, await this._getContext());
    await el.type(value.toString(), { delay: this.options.pressKeyDelay });

    return this._waitForAction();
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
    return this.fillField(field, '');
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
   * {{ react }}
   */
  async appendField(field, value) {
    const els = await findVisibleFields.call(this, field);
    assertElementExists(els, field, 'Field');
    highlightActiveElement.call(this, els[0], await this._getContext());
    await els[0].press('End');
    await els[0].type(value.toString(), { delay: this.options.pressKeyDelay });
    return this._waitForAction();
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
    return proceedSeeInField.call(this, 'assert', field, _value);
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
    return proceedSeeInField.call(this, 'negate', field, _value);
  }

  /**
   * > ⚠ There is an [issue with file upload in Puppeteer 2.1.0 & 2.1.1](https://github.com/puppeteer/puppeteer/issues/5420), downgrade to 2.0.0 if you face it.
   *
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
   */
  async attachFile(locator, pathToFile) {
    const file = path.join(global.codecept_dir, pathToFile);

    if (!fileExists(file)) {
      throw new Error(`File at ${file} can not be found on local system`);
    }
    const els = await findFields.call(this, locator);
    assertElementExists(els, locator, 'Field');
    await els[0].uploadFile(file);
    return this._waitForAction();
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
    const els = await findVisibleFields.call(this, select);
    assertElementExists(els, select, 'Selectable field');
    const el = els[0];
    if (await el.getProperty('tagName').then(t => t.jsonValue()) !== 'SELECT') {
      throw new Error('Element is not <select>');
    }
    highlightActiveElement.call(this, els[0], await this._getContext());
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
   * Grab number of visible elements by locator.
   * Resumes test execution, so **should be used inside async function with `await`** operator.
   * 
   * ```js
   * let numOfElements = await I.grabNumberOfVisibleElements('p');
   * ```
   * 
   * @param {string | object} locator located by CSS|XPath|strict locator.
   * @returns {Promise<number>} number of visible elements
   * {{ react }}
   */
  async grabNumberOfVisibleElements(locator) {
    let els = await this._locate(locator);
    els = (await Promise.all(els.map(el => el.boundingBox() && el))).filter(v => v);
    // Puppeteer visibility was ignored? | Remove when Puppeteer is fixed
    els = await Promise.all(els.map(async el => (await el.evaluate(node => window.getComputedStyle(node).visibility !== 'hidden' && window.getComputedStyle(node).display !== 'none')) && el));

    return els.filter(v => v).length;
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
    stringIncludes('url').assert(url, await this._getPageUrl());
  }

  /**
   * Checks that current url does not contain a provided fragment.
   * 
   * @param {string} url value to check.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async dontSeeInCurrentUrl(url) {
    stringIncludes('url').negate(url, await this._getPageUrl());
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
    urlEquals(this.options.url).assert(url, await this._getPageUrl());
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
    urlEquals(this.options.url).negate(url, await this._getPageUrl());
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
   * {{ react }}
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
   * @param {string} text element value to check.
   * @param {(string | object)?} [context=null]  element located by CSS|XPath|strict locator.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async seeTextEquals(text, context = null) {
    return proceedSee.call(this, 'assert', text, context, true);
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
   * {{ react }}
   */
  async dontSee(text, context = null) {
    return proceedSee.call(this, 'negate', text, context);
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
    return this.page.content();
  }

  /**
   * Get JS log from browser.
   *
   * ```js
   * let logs = await I.grabBrowserLogs();
   * console.log(JSON.stringify(logs))
   * ```
   * @return {Promise<any[]>}
   */
  async grabBrowserLogs() {
    const logs = consoleLogStore.entries;
    consoleLogStore.clear();
    return logs;
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
    return this._getPageUrl();
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
    const source = await this.page.content();
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
    const source = await this.page.content();
    stringIncludes('HTML source of a page').negate(text, source);
  }

  /**
   * Asserts that an element appears a given number of times in the DOM.
   * Element is located by label or name or CSS or XPath.
   * 
   * 
   * ```js
   * I.seeNumberOfElements('#submitBtn', 1);
   * ```
   * 
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {number} num number of elements.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   *
   * {{ react }}
   */
  async seeNumberOfElements(locator, num) {
    const elements = await this._locate(locator);
    return equals(`expected number of elements (${(new Locator(locator))}) is ${num}, but found ${elements.length}`).assert(elements.length, num);
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
   * {{ react }}
   */
  async seeNumberOfVisibleElements(locator, num) {
    const res = await this.grabNumberOfVisibleElements(locator);
    return equals(`expected number of visible elements (${(new Locator(locator))}) is ${num}, but found ${res}`).assert(res, num);
  }

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
      return this.page.setCookie(...cookie);
    }
    return this.page.setCookie(cookie);
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
    const cookies = await this.page.cookies();
    empty(`cookie ${name} to be set`).negate(cookies.filter(c => c.name === name));
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
    const cookies = await this.page.cookies();
    empty(`cookie ${name} to be set`).assert(cookies.filter(c => c.name === name));
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
    const cookies = await this.page.cookies();
    if (!name) return cookies;
    const cookie = cookies.filter(c => c.name === name);
    if (cookie[0]) return cookie[0];
  }

  /**
   * Waits for the specified cookie in the cookies.
   * 
   * ```js
   * I.waitForCookie("token");
   * ```
   * 
   * @param {string} name expected cookie name.
   * @param {number} [sec=3] (optional, `3` by default) time in seconds to wait
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async waitForCookie(name, sec) {
    // by default, we will retry 3 times
    let retries = 3;
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;

    if (sec) {
      retries = sec;
    } else {
      retries = Math.ceil(waitTimeout / 1000) - 1;
    }

    return promiseRetry(async (retry, number) => {
      const _grabCookie = async (name) => {
        const cookies = await this.page.cookies();
        const cookie = cookies.filter(c => c.name === name);
        if (cookie.length === 0) throw Error(`Cookie ${name} is not found after ${retries}s`);
      };

      this.debugSection('Wait for cookie: ', name);
      if (number > 1) this.debugSection('Retrying... Attempt #', number);

      try {
        await _grabCookie(name);
      } catch (e) {
        retry(e);
      }
    }, { retries, maxTimeout: 1000 });
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
   * If a function returns a Promise, tt will wait for its resolution.
   *
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
   */
  async executeScript(...args) {
    let context = await this._getContext();
    if (this.context && this.context.constructor.name === 'CdpFrame') {
      context = this.context; // switching to iframe context
    }
    return context.evaluate.apply(context, args);
  }

  /**
   * Asynchronous scripts can also be executed with `executeScript` if a function returns a Promise.
   * Executes async script on page.
   * Provided function should execute a passed callback (as first argument) to signal it is finished.
   * 
   * Example: In Vue.js to make components completely rendered we are waiting for [nextTick](https://vuejs.org/v2/api/#Vue-nextTick).
   * 
   * ```js
   * I.executeAsyncScript(function(done) {
   *   Vue.nextTick(done); // waiting for next tick
   * });
   * ```
   * 
   * By passing value to `done()` function you can return values.
   * Additional arguments can be passed as well, while `done` function is always last parameter in arguments list.
   * 
   * ```js
   * let val = await I.executeAsyncScript(function(url, done) {
   *   // in browser context
   *   $.ajax(url, { success: (data) => done(data); }
   * }, 'http://ajax.callback.url/');
   * ```
   * 
   * @param {string|function} fn function to be executed in browser context.
   * @param {...any} args to be passed to function.
   * @returns {Promise<any>} script return value
   * 
   */
  async executeAsyncScript(...args) {
    const asyncFn = function () {
      const args = Array.from(arguments);
      const fn = eval(`(${args.shift()})`); // eslint-disable-line no-eval
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
   * {{ react }}
   */
  async grabTextFromAll(locator) {
    const els = await this._locate(locator);
    const texts = [];
    for (const el of els) {
      texts.push(await (await el.getProperty('innerText')).jsonValue());
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
   * {{ react }}
   */
  async grabTextFrom(locator) {
    const texts = await this.grabTextFromAll(locator);
    assertElementExists(texts, locator);
    if (texts.length > 1) {
      this.debugSection('GrabText', `Using first element out of ${texts.length}`);
    }

    return texts[0];
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
    const els = await findFields.call(this, locator);
    const values = [];
    for (const el of els) {
      values.push(await (await el.getProperty('value')).jsonValue());
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
    const values = await this.grabValueFromAll(locator);
    assertElementExists(values, locator);
    if (values.length > 1) {
      this.debugSection('GrabValue', `Using first element out of ${values.length}`);
    }

    return values[0];
  }

  /**
   * Retrieves all the innerHTML from elements located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside async function with `await`** operator.
   * 
   * ```js
   * let postHTMLs = await I.grabHTMLFromAll('.post');
   * ```
   * 
   * @param {string | object} element located by CSS|XPath|strict locator.
   * @returns {Promise<string[]>} HTML code for an element
   * 
   */
  async grabHTMLFromAll(locator) {
    const els = await this._locate(locator);
    const values = await Promise.all(els.map(el => el.evaluate(element => element.innerHTML, el)));
    return values;
  }

  /**
   * Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside async function with `await`** operator.
   * If more than one element is found - HTML of first element is returned.
   * 
   * ```js
   * let postHTML = await I.grabHTMLFrom('#post');
   * ```
   * 
   * @param {string | object} element located by CSS|XPath|strict locator.
   * @returns {Promise<string>} HTML code for an element
   * 
   */
  async grabHTMLFrom(locator) {
    const html = await this.grabHTMLFromAll(locator);
    assertElementExists(html, locator);
    if (html.length > 1) {
      this.debugSection('GrabHTML', `Using first element out of ${html.length}`);
    }

    return html[0];
  }

  /**
   * Grab array of CSS properties for given locator
   * Resumes test execution, so **should be used inside an async function with `await`** operator.
   * 
   * ```js
   * const values = await I.grabCssPropertyFromAll('h3', 'font-weight');
   * ```
   * 
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {string} cssProperty CSS property name.
   * @returns {Promise<string[]>} CSS value
   * 
   * {{ react }}
   */
  async grabCssPropertyFromAll(locator, cssProperty) {
    const els = await this._locate(locator);
    const res = await Promise.all(els.map(el => el.evaluate(el => JSON.parse(JSON.stringify(getComputedStyle(el))), el)));
    const cssValues = res.map(props => props[toCamelCase(cssProperty)]);

    return cssValues;
  }

  /**
   * Grab CSS property for given locator
   * Resumes test execution, so **should be used inside an async function with `await`** operator.
   * If more than one element is found - value of first element is returned.
   * 
   * ```js
   * const value = await I.grabCssPropertyFrom('h3', 'font-weight');
   * ```
   * 
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {string} cssProperty CSS property name.
   * @returns {Promise<string>} CSS value
   * 
   * {{ react }}
   */
  async grabCssPropertyFrom(locator, cssProperty) {
    const cssValues = await this.grabCssPropertyFromAll(locator, cssProperty);
    assertElementExists(cssValues, locator);

    if (cssValues.length > 1) {
      this.debugSection('GrabCSS', `Using first element out of ${cssValues.length}`);
    }

    return cssValues[0];
  }

  /**
   * Checks that all elements with given locator have given CSS properties.
   * 
   * ```js
   * I.seeCssPropertiesOnElements('h3', { 'font-weight': "bold"});
   * ```
   * 
   * @param {string | object} locator located by CSS|XPath|strict locator.
   * @param {object} cssProperties object with CSS properties and their values to check.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   * {{ react }}
   */
  async seeCssPropertiesOnElements(locator, cssProperties) {
    const res = await this._locate(locator);
    assertElementExists(res, locator);

    const cssPropertiesCamelCase = convertCssPropertiesToCamelCase(cssProperties);
    const elemAmount = res.length;
    let props = [];

    for (const element of res) {
      for (const prop of Object.keys(cssProperties)) {
        const cssProp = await this.grabCssPropertyFrom(locator, prop);
        if (isColorProperty(prop)) {
          props.push(convertColorToRGBA(cssProp));
        } else {
          props.push(cssProp);
        }
      }
    }

    const values = Object.keys(cssPropertiesCamelCase).map(key => cssPropertiesCamelCase[key]);
    if (!Array.isArray(props)) props = [props];
    let chunked = chunkArray(props, values.length);
    chunked = chunked.filter((val) => {
      for (let i = 0; i < val.length; ++i) {
        // eslint-disable-next-line eqeqeq
        if (val[i] != values[i]) return false;
      }
      return true;
    });
    return equals(`all elements (${(new Locator(locator))}) to have CSS property ${JSON.stringify(cssProperties)}`).assert(chunked.length, elemAmount);
  }

  /**
   * Checks that all elements with given locator have given attributes.
   * 
   * ```js
   * I.seeAttributesOnElements('//form', { method: "post"});
   * ```
   * 
   * @param {string | object} locator located by CSS|XPath|strict locator.
   * @param {object} attributes attributes and their values to check.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   * {{ react }}
   */
  async seeAttributesOnElements(locator, attributes) {
    const elements = await this._locate(locator);
    assertElementExists(elements, locator);

    const expectedAttributes = Object.entries(attributes);

    const valuesPromises = elements.map(async (element) => {
      const elementAttributes = {};
      await Promise.all(expectedAttributes.map(async ([attribute, expectedValue]) => {
        const actualValue = await element.evaluate((el, attr) => el[attr] || el.getAttribute(attr), attribute);
        elementAttributes[attribute] = actualValue;
      }));
      return elementAttributes;
    });

    const actualAttributes = await Promise.all(valuesPromises);

    const matchingElements = actualAttributes.filter((attrs) => expectedAttributes.every(([attribute, expectedValue]) => {
      const actualValue = attrs[attribute];
      if (!actualValue) return false;
      if (actualValue.toString().match(new RegExp(expectedValue.toString()))) return true;
      return expectedValue === actualValue;
    }));

    const elementsCount = elements.length;
    const matchingCount = matchingElements.length;

    return equals(`all elements (${(new Locator(locator))}) to have attributes ${JSON.stringify(attributes)}`)
      .assert(matchingCount, elementsCount);
  }

  /**
   * Drag the scrubber of a slider to a given position
   * For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.
   * 
   * ```js
   * I.dragSlider('#slider', 30);
   * I.dragSlider('#slider', -70);
   * ```
   * 
   * @param {string | object} locator located by label|name|CSS|XPath|strict locator.
   * @param {number} offsetX position to drag.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   * {{ react }}
   */
  async dragSlider(locator, offsetX = 0) {
    const src = await this._locate(locator);
    assertElementExists(src, locator, 'Slider Element');

    // Note: Using public api .getClickablePoint because the .BoundingBox does not take into account iframe offsets
    const sliderSource = await getClickablePoint(src[0]);

    // Drag start point
    await this.page.mouse.move(sliderSource.x, sliderSource.y, { steps: 5 });
    await this.page.mouse.down();

    // Drag destination
    await this.page.mouse.move(sliderSource.x + offsetX, sliderSource.y, { steps: 5 });
    await this.page.mouse.up();

    await this._waitForAction();
  }

  /**
   * Retrieves an array of attributes from elements located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside async with `await`** operator.
   * 
   * ```js
   * let hints = await I.grabAttributeFromAll('.tooltip', 'title');
   * ```
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {string} attr attribute name.
   * @returns {Promise<string[]>} attribute value
   * 
   * {{ react }}
   */
  async grabAttributeFromAll(locator, attr) {
    const els = await this._locate(locator);
    const array = [];
    for (let index = 0; index < els.length; index++) {
      const a = await this._evaluateHandeInContext((el, attr) => el[attr] || el.getAttribute(attr), els[index], attr);
      array.push(await a.jsonValue());
    }
    return array;
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
   * {{ react }}
   */
  async grabAttributeFrom(locator, attr) {
    const attrs = await this.grabAttributeFromAll(locator, attr);
    assertElementExists(attrs, locator);
    if (attrs.length > 1) {
      this.debugSection('GrabAttribute', `Using first element out of ${attrs.length}`);
    }

    return attrs[0];
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
   */
  async saveElementScreenshot(locator, fileName) {
    const outputFile = screenshotOutputFolder(fileName);

    const res = await this._locate(locator);
    assertElementExists(res, locator);
    if (res.length > 1) this.debug(`[Elements] Using first element out of ${res.length}`);
    const elem = res[0];
    this.debug(`Screenshot of ${(new Locator(locator))} element has been saved to ${outputFile}`);
    return elem.screenshot({ path: outputFile, type: 'png' });
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
  async saveScreenshot(fileName, fullPage) {
    const fullPageOption = fullPage || this.options.fullPageScreenshots;
    let outputFile = screenshotOutputFolder(fileName);

    this.debug(`Screenshot is saving to ${outputFile}`);

    await this.page.screenshot({
      path: outputFile,
      fullPage: fullPageOption,
      type: 'png',
    });

    if (this.activeSessionName) {
      for (const sessionName in this.sessionPages) {
        const activeSessionPage = this.sessionPages[sessionName];
        outputFile = screenshotOutputFolder(`${sessionName}_${fileName}`);

        this.debug(`${sessionName} - Screenshot is saving to ${outputFile}`);

        if (activeSessionPage) {
          await activeSessionPage.screenshot({
            path: outputFile,
            fullPage: fullPageOption,
            type: 'png',
          });
        }
      }
    }
  }

  async _failed(test) {
    await this._withinEnd();

    if (this.options.trace) {
      await this.page.tracing.stop();
      const _traceName = this.currentRunningTest.artifacts.trace.replace('.json', '.failed.json');
      fs.renameSync(this.currentRunningTest.artifacts.trace, _traceName);
      test.artifacts.trace = _traceName;
    }
  }

  async _passed(test) {
    await this._withinEnd();

    if (this.options.trace) {
      await this.page.tracing.stop();
      if (this.options.keepTraceForPassedTests) {
        const _traceName = this.currentRunningTest.artifacts.trace.replace('.json', '.passed.json');
        fs.renameSync(this.currentRunningTest.artifacts.trace, _traceName);
        test.artifacts.trace = _traceName;
      } else {
        fs.unlinkSync(this.currentRunningTest.artifacts.trace);
      }
    }
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
   * Waits for element to become enabled (by default waits for 1sec).
   * Element can be located by CSS or XPath.
   * 
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {number} [sec=1] (optional) time in seconds to wait, 1 by default.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async waitForEnabled(locator, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;
    locator = new Locator(locator, 'css');
    await this.context;
    let waiter;
    const context = await this._getContext();
    if (locator.isCSS()) {
      const enabledFn = function (locator) {
        const els = document.querySelectorAll(locator);
        if (!els || els.length === 0) {
          return false;
        }
        return Array.prototype.filter.call(els, el => !el.disabled).length > 0;
      };
      waiter = context.waitForFunction(enabledFn, { timeout: waitTimeout }, locator.value);
    } else {
      const enabledFn = function (locator, $XPath) {
        eval($XPath); // eslint-disable-line no-eval
        return $XPath(null, locator).filter(el => !el.disabled).length > 0;
      };
      waiter = context.waitForFunction(enabledFn, { timeout: waitTimeout }, locator.value, $XPath.toString());
    }
    return waiter.catch((err) => {
      throw new Error(`element (${locator.toString()}) still not enabled after ${waitTimeout / 1000} sec\n${err.message}`);
    });
  }

  /**
   * Waits for the specified value to be in value attribute.
   * 
   * ```js
   * I.waitForValue('//input', "GoodValue");
   * ```
   * 
   * @param {string | object} field input field.
   * @param {string }value expected value.
   * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async waitForValue(field, value, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;
    const locator = new Locator(field, 'css');
    await this.context;
    let waiter;
    const context = await this._getContext();
    if (locator.isCSS()) {
      const valueFn = function (locator, value) {
        const els = document.querySelectorAll(locator);
        if (!els || els.length === 0) {
          return false;
        }
        return Array.prototype.filter.call(els, el => (el.value.toString() || '').indexOf(value) !== -1).length > 0;
      };
      waiter = context.waitForFunction(valueFn, { timeout: waitTimeout }, locator.value, value);
    } else {
      const valueFn = function (locator, $XPath, value) {
        eval($XPath); // eslint-disable-line no-eval
        return $XPath(null, locator).filter(el => (el.value || '').indexOf(value) !== -1).length > 0;
      };
      waiter = context.waitForFunction(valueFn, { timeout: waitTimeout }, locator.value, $XPath.toString(), value);
    }
    return waiter.catch((err) => {
      const loc = locator.toString();
      throw new Error(`element (${loc}) is not in DOM or there is no element(${loc}) with value "${value}" after ${waitTimeout / 1000} sec\n${err.message}`);
    });
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
   * {{ react }}
   */
  async waitNumberOfVisibleElements(locator, num, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;
    locator = new Locator(locator, 'css');
    await this.context;
    let waiter;
    const context = await this._getContext();
    if (locator.isCSS()) {
      const visibleFn = function (locator, num) {
        const els = document.querySelectorAll(locator);
        if (!els || els.length === 0) {
          return false;
        }
        return Array.prototype.filter.call(els, el => el.offsetParent !== null).length === num;
      };
      waiter = context.waitForFunction(visibleFn, { timeout: waitTimeout }, locator.value, num);
    } else {
      const visibleFn = function (locator, $XPath, num) {
        eval($XPath); // eslint-disable-line no-eval
        return $XPath(null, locator).filter(el => el.offsetParent !== null).length === num;
      };
      waiter = context.waitForFunction(visibleFn, { timeout: waitTimeout }, locator.value, $XPath.toString(), num);
    }
    return waiter.catch((err) => {
      throw new Error(`The number of elements (${locator.toString()}) is not ${num} after ${waitTimeout / 1000} sec\n${err.message}`);
    });
  }

  /**
   * Waits for element to be clickable (by default waits for 1sec).
   * Element can be located by CSS or XPath.
   * 
   * ```js
   * I.waitForClickable('.btn.continue');
   * I.waitForClickable('.btn.continue', 5); // wait for 5 secs
   * ```
   * 
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {number} [sec] (optional, `1` by default) time in seconds to wait
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async waitForClickable(locator, waitTimeout) {
    const els = await this._locate(locator);
    assertElementExists(els, locator);

    return this.waitForFunction(isElementClickable, [els[0]], waitTimeout).catch(async (e) => {
      if (/Waiting failed/i.test(e.message) || /failed: timeout/i.test(e.message)) {
        throw new Error(`element ${new Locator(locator).toString()} still not clickable after ${waitTimeout || this.options.waitForTimeout / 1000} sec`);
      } else {
        throw e;
      }
    });
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
   * {{ react }}
   */
  async waitForElement(locator, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;
    locator = new Locator(locator, 'css');

    let waiter;
    const context = await this._getContext();
    if (locator.isCSS()) {
      waiter = context.waitForSelector(locator.simplify(), { timeout: waitTimeout });
    } else {
      waiter = _waitForElement.call(this, locator, { timeout: waitTimeout });
    }
    return waiter.catch((err) => {
      throw new Error(`element (${locator.toString()}) still not present on page after ${waitTimeout / 1000} sec\n${err.message}`);
    });
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
   * {{ react }}
   */
  async waitForVisible(locator, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;
    locator = new Locator(locator, 'css');
    await this.context;
    let waiter;
    const context = await this._getContext();
    if (locator.isCSS()) {
      waiter = context.waitForSelector(locator.simplify(), { timeout: waitTimeout, visible: true });
    } else {
      waiter = _waitForElement.call(this, locator, { timeout: waitTimeout, visible: true });
    }
    return waiter.catch((err) => {
      throw new Error(`element (${locator.toString()}) still not visible after ${waitTimeout / 1000} sec\n${err.message}`);
    });
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
    locator = new Locator(locator, 'css');
    await this.context;
    let waiter;
    const context = await this._getContext();
    if (locator.isCSS()) {
      waiter = context.waitForSelector(locator.simplify(), { timeout: waitTimeout, hidden: true });
    } else {
      waiter = _waitForElement.call(this, locator, { timeout: waitTimeout, hidden: true });
    }
    return waiter.catch((err) => {
      throw new Error(`element (${locator.toString()}) still visible after ${waitTimeout / 1000} sec\n${err.message}`);
    });
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
    locator = new Locator(locator, 'css');
    let waiter;
    const context = await this._getContext();
    if (locator.isCSS()) {
      waiter = context.waitForSelector(locator.simplify(), { timeout: waitTimeout, hidden: true });
    } else {
      waiter = _waitForElement.call(this, locator, { timeout: waitTimeout, hidden: true });
    }
    return waiter.catch((err) => {
      throw new Error(`element (${locator.toString()}) still not hidden after ${waitTimeout / 1000} sec\n${err.message}`);
    });
  }

  /**
   * Waits for number of tabs.
   * 
   * ```js
   * I.waitForNumberOfTabs(2);
   * ```
   * 
   * @param {number} expectedTabs expecting the number of tabs.
   * @param {number} sec number of secs to wait.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async waitForNumberOfTabs(expectedTabs, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;
    let currentTabs;
    let count = 0;

    do {
      currentTabs = await this.grabNumberOfOpenTabs();
      await this.wait(1);
      count += 1000;
      if (currentTabs >= expectedTabs) return;
    } while (count <= waitTimeout);

    throw new Error(`Expected ${expectedTabs} tabs are not met after ${waitTimeout / 1000} sec.`);
  }

  async _getContext() {
    if (this.context && this.context.constructor.name === 'CdpFrame') {
      return this.context;
    }
    return this.page;
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

    return this.page.waitForFunction((urlPart) => {
      const currUrl = decodeURIComponent(decodeURIComponent(decodeURIComponent(window.location.href)));
      return currUrl.indexOf(urlPart) > -1;
    }, { timeout: waitTimeout }, urlPart).catch(async (e) => {
      const currUrl = await this._getPageUrl(); // Required because the waitForFunction can't return data.
      if (/Waiting failed:/i.test(e.message) || /failed: timeout/i.test(e.message)) {
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

    return this.page.waitForFunction((urlPart) => {
      const currUrl = decodeURIComponent(decodeURIComponent(decodeURIComponent(window.location.href)));
      return currUrl.indexOf(urlPart) > -1;
    }, { timeout: waitTimeout }, urlPart).catch(async (e) => {
      const currUrl = await this._getPageUrl(); // Required because the waitForFunction can't return data.
      if (/Waiting failed/i.test(e.message) || /failed: timeout/i.test(e.message)) {
        throw new Error(`expected url to be ${urlPart}, but found ${currUrl}`);
      } else {
        throw e;
      }
    });
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
   */
  async waitForText(text, sec = null, context = null) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;
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
          eval($XPath); // eslint-disable-line no-eval
          const el = $XPath(null, locator);
          if (!el.length) return false;
          return el[0].innerText.indexOf(text) > -1;
        }, { timeout: waitTimeout }, locator.value, text, $XPath.toString());
      }
    } else {
      waiter = contextObject.waitForFunction(text => document.body && document.body.innerText.indexOf(text) > -1, { timeout: waitTimeout }, text);
    }

    return waiter.catch((err) => {
      throw new Error(`Text "${text}" was not found on page after ${waitTimeout / 1000} sec\n${err.message}`);
    });
  }

  /**
   * Waits for a network request.
   *
   * ```js
   * I.waitForRequest('http://example.com/resource');
   * I.waitForRequest(request => request.url() === 'http://example.com' && request.method() === 'GET');
   * ```
   *
   * @param {string|function} urlOrPredicate
   * @param {?number} [sec=null] seconds to wait
   */
  async waitForRequest(urlOrPredicate, sec = null) {
    const timeout = sec ? sec * 1000 : this.options.waitForTimeout;
    return this.page.waitForRequest(urlOrPredicate, { timeout });
  }

  /**
   * Waits for a network response.
   *
   * ```js
   * I.waitForResponse('http://example.com/resource');
   * I.waitForResponse(response => response.url() === 'http://example.com' && response.request().method() === 'GET');
   * ```
   *
   * @param {string|function} urlOrPredicate
   * @param {?number} [sec=null] number of seconds to wait
   */
  async waitForResponse(urlOrPredicate, sec = null) {
    const timeout = sec ? sec * 1000 : this.options.waitForTimeout;
    return this.page.waitForResponse(urlOrPredicate, { timeout });
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
      // Select by frame index of current context
      let frames = [];
      if (this.context && typeof this.context.childFrames === 'function') {
        frames = await this.context.childFrames();
      } else {
        frames = await this.page.mainFrame().childFrames();
      }

      if (locator >= 0 && locator < frames.length) {
        this.context = frames[locator];
      } else {
        throw new Error('Frame index out of bounds');
      }
      return;
    }

    if (!locator) {
      this.context = await this.page.mainFrame();
      return;
    }

    // Select iframe by selector
    const els = await this._locate(locator);
    assertElementExists(els, locator);

    const iframeElement = els[0];
    const contentFrame = await iframeElement.contentFrame();

    if (contentFrame) {
      this.context = contentFrame;
    } else {
      throw new Error('Element "#invalidIframeSelector" was not found by text|CSS|XPath');
    }
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
    const context = await this._getContext();
    return context.waitForFunction(fn, { timeout: waitTimeout }, ...args);
  }

  /**
   * Waits for navigation to finish. By default, takes configured `waitForNavigation` option.
   *
   * See [Puppeteer's reference](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagewaitfornavigationoptions)
   *
   * @param {*} opts
   */
  async waitForNavigation(opts = {}) {
    opts = {
      timeout: this.options.getPageTimeout,
      waitUntil: this.options.waitForNavigation,
      ...opts,
    };
    return this.page.waitForNavigation(opts);
  }

  async waitUntilExists(locator, sec) {
    console.log(`waitUntilExists deprecated:
    * use 'waitForElement' to wait for element to be attached
    * use 'waitForDetached to wait for element to be removed'`);
    return this.waitForDetached(locator, sec);
  }

  /**
   * Waits for an element to become not attached to the DOM on a page (by default waits for 1sec).
   * Element can be located by CSS or XPath.
   * 
   * ```js
   * I.waitForDetached('#popup');
   * ```
   * 
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async waitForDetached(locator, sec) {
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

  /**
   * Grab the data from performance timing using Navigation Timing API.
   * The returned data will contain following things in ms:
   * - responseEnd,
   * - domInteractive,
   * - domContentLoadedEventEnd,
   * - loadEventEnd
   * Resumes test execution, so **should be used inside an async function with `await`** operator.
   * 
   * ```js
   * await I.amOnPage('https://example.com');
   * let data = await I.grabDataFromPerformanceTiming();
   * //Returned data
   * { // all results are in [ms]
   *   responseEnd: 23,
   *   domInteractive: 44,
   *   domContentLoadedEventEnd: 196,
   *   loadEventEnd: 241
   * }
   * ```
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async grabDataFromPerformanceTiming() {
    return perfTiming;
  }

  /**
   * Grab the width, height, location of given locator.
   * Provide `width` or `height`as second param to get your desired prop.
   * Resumes test execution, so **should be used inside an async function with `await`** operator.
   * 
   * Returns an object with `x`, `y`, `width`, `height` keys.
   * 
   * ```js
   * const value = await I.grabElementBoundingRect('h3');
   * // value is like { x: 226.5, y: 89, width: 527, height: 220 }
   * ```
   * 
   * To get only one metric use second parameter:
   * 
   * ```js
   * const width = await I.grabElementBoundingRect('h3', 'width');
   * // width == 527
   * ```
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {string=} elementSize x, y, width or height of the given element.
   * @returns {Promise<DOMRect>|Promise<number>} Element bounding rectangle
   * 
   */
  async grabElementBoundingRect(locator, prop) {
    const els = await this._locate(locator);
    assertElementExists(els, locator);
    const rect = await els[0].boundingBox();
    if (prop) return rect[prop];
    return rect;
  }
}

module.exports = Puppeteer;

async function findElements(matcher, locator) {
  if (locator.react) return findReactElements.call(this, locator);
  locator = new Locator(locator, 'css');
  if (!locator.isXPath()) return matcher.$$(locator.simplify());
  // puppeteer version < 19.4.0 is no longer supported. This one is backward support.
  if (puppeteer.default?.defaultBrowserRevision) {
    return matcher.$$(`xpath/${locator.value}`);
  }
  return matcher.$x(locator.value);
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

  highlightActiveElement.call(this, els[0], await this._getContext());

  await els[0].click(options);
  const promises = [];
  if (options.waitForNavigation) {
    promises.push(this.waitForNavigation());
  }
  promises.push(this._waitForAction());

  return Promise.all(promises);
}

async function findClickable(matcher, locator) {
  if (locator.react) return findReactElements.call(this, locator);
  locator = new Locator(locator);
  if (!locator.isFuzzy()) return findElements.call(this, matcher, locator);

  let els;
  const literal = xpathLocator.literal(locator.value);

  els = await findElements.call(this, matcher, Locator.clickable.narrow(literal));
  if (els.length) return els;

  els = await findElements.call(this, matcher, Locator.clickable.wide(literal));
  if (els.length) return els;

  try {
    els = await findElements.call(this, matcher, Locator.clickable.self(literal));
    if (els.length) return els;
  } catch (err) {
    // Do nothing
  }

  return findElements.call(this, matcher, locator.value); // by css or xpath
}

async function proceedSee(assertType, text, context, strict = false) {
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
    assertElementExists(els, locator.toString());
    allText = await Promise.all(els.map(el => el.getProperty('innerText').then(p => p.jsonValue())));
  }

  if (strict) {
    return allText.map(elText => equals(description)[assertType](text, elText));
  }
  return stringIncludes(description)[assertType](normalizeSpacesInString(text), normalizeSpacesInString(allText.join(' | ')));
}

async function findCheckable(locator, context) {
  let contextEl = await this.context;
  if (typeof context === 'string') {
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

async function findVisibleFields(locator) {
  const els = await findFields.call(this, locator);
  const visible = await Promise.all(els.map(el => el.boundingBox()));
  return els.filter((el, index) => visible[index]);
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

async function proceedDragAndDrop(sourceLocator, destinationLocator) {
  const src = await this._locate(sourceLocator);
  assertElementExists(src, sourceLocator, 'Source Element');

  const dst = await this._locate(destinationLocator);
  assertElementExists(dst, destinationLocator, 'Destination Element');

  // Note: Using public api .getClickablePoint becaues the .BoundingBox does not take into account iframe offsets
  const dragSource = await getClickablePoint(src[0]);
  const dragDestination = await getClickablePoint(dst[0]);

  // Drag start point
  await this.page.mouse.move(dragSource.x, dragSource.y, { steps: 5 });
  await this.page.mouse.down();

  // Drag destination
  await this.page.mouse.move(dragDestination.x, dragDestination.y, { steps: 5 });
  await this.page.mouse.up();

  await this._waitForAction();
}

async function proceedSeeInField(assertType, field, value) {
  const els = await findVisibleFields.call(this, field);
  assertElementExists(els, field, 'Field');
  const el = els[0];
  const tag = await el.getProperty('tagName').then(el => el.jsonValue());
  const fieldType = await el.getProperty('type').then(el => el.jsonValue());

  const proceedMultiple = async (elements) => {
    const fields = Array.isArray(elements) ? elements : [elements];

    const elementValues = [];
    for (const element of fields) {
      elementValues.push(await element.getProperty('value').then(el => el.jsonValue()));
    }

    if (typeof value === 'boolean') {
      equals(`no. of items matching > 0: ${field}`)[assertType](value, !!elementValues.length);
    } else {
      if (assertType === 'assert') {
        equals(`select option by ${field}`)[assertType](true, elementValues.length > 0);
      }
      elementValues.forEach(val => stringIncludes(`fields by ${field}`)[assertType](value, val));
    }
  };

  if (tag === 'SELECT') {
    const selectedOptions = await el.$$('option:checked');
    // locate option by values and check them
    if (value === '') {
      return proceedMultiple(selectedOptions);
    }

    const options = await filterFieldsByValue(selectedOptions, value, true);
    return proceedMultiple(options);
  }

  if (tag === 'INPUT') {
    if (fieldType === 'checkbox' || fieldType === 'radio') {
      if (typeof value === 'boolean') {
        // Filter by values
        const options = await filterFieldsBySelectionState(els, true);
        return proceedMultiple(options);
      }

      const options = await filterFieldsByValue(els, value, true);
      return proceedMultiple(options);
    }
    return proceedMultiple(els[0]);
  }
  const fieldVal = await el.getProperty('value').then(el => el.jsonValue());
  return stringIncludes(`fields by ${field}`)[assertType](value, fieldVal);
}

async function filterFieldsByValue(elements, value, onlySelected) {
  const matches = [];
  for (const element of elements) {
    const val = await element.getProperty('value').then(el => el.jsonValue());
    let isSelected = true;
    if (onlySelected) {
      isSelected = await elementSelected(element);
    }
    if ((value == null || val.indexOf(value) > -1) && isSelected) {
      matches.push(element);
    }
  }
  return matches;
}

async function filterFieldsBySelectionState(elements, state) {
  const matches = [];
  for (const element of elements) {
    const isSelected = await elementSelected(element);
    if (isSelected === state) {
      matches.push(element);
    }
  }
  return matches;
}

async function elementSelected(element) {
  const type = await element.getProperty('type').then(el => el.jsonValue());

  if (type === 'checkbox' || type === 'radio') {
    return element.getProperty('checked').then(el => el.jsonValue());
  }
  return element.getProperty('selected').then(el => el.jsonValue());
}

function isFrameLocator(locator) {
  locator = new Locator(locator);
  if (locator.isFrame()) {
    const _locator = new Locator(locator);
    return _locator.value;
  }
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

async function targetCreatedHandler(page) {
  if (!page) return;
  this.withinLocator = null;
  page.on('load', () => {
    page.$('body')
      .catch(() => null)
      .then(context => this.context = context);
  });
  page.on('console', (msg) => {
    this.debugSection(`Browser:${ucfirst(msg.type())}`, (msg._text || '') + msg.args().join(' '));
    consoleLogStore.add(msg);
  });

  if (this.options.userAgent) {
    await page.setUserAgent(this.options.userAgent);
  }
  if (this.options.windowSize && this.options.windowSize.indexOf('x') > 0) {
    const dimensions = this.options.windowSize.split('x');
    const width = parseInt(dimensions[0], 10);
    const height = parseInt(dimensions[1], 10);
    await page.setViewport({ width, height });
  }
}

// BC compatibility for Puppeteer < 10
async function getClickablePoint(el) {
  if (el.clickablePoint) return el.clickablePoint();
  if (el._clickablePoint) return el._clickablePoint();
  return null;
}

// List of key values to key definitions
// https://github.com/GoogleChrome/puppeteer/blob/v1.20.0/lib/USKeyboardLayout.js
const keyDefinitionMap = {
  /* eslint-disable quote-props */
  '0': 'Digit0',
  '1': 'Digit1',
  '2': 'Digit2',
  '3': 'Digit3',
  '4': 'Digit4',
  '5': 'Digit5',
  '6': 'Digit6',
  '7': 'Digit7',
  '8': 'Digit8',
  '9': 'Digit9',
  'a': 'KeyA',
  'b': 'KeyB',
  'c': 'KeyC',
  'd': 'KeyD',
  'e': 'KeyE',
  'f': 'KeyF',
  'g': 'KeyG',
  'h': 'KeyH',
  'i': 'KeyI',
  'j': 'KeyJ',
  'k': 'KeyK',
  'l': 'KeyL',
  'm': 'KeyM',
  'n': 'KeyN',
  'o': 'KeyO',
  'p': 'KeyP',
  'q': 'KeyQ',
  'r': 'KeyR',
  's': 'KeyS',
  't': 'KeyT',
  'u': 'KeyU',
  'v': 'KeyV',
  'w': 'KeyW',
  'x': 'KeyX',
  'y': 'KeyY',
  'z': 'KeyZ',
  ';': 'Semicolon',
  '=': 'Equal',
  ',': 'Comma',
  '-': 'Minus',
  '.': 'Period',
  '/': 'Slash',
  '`': 'Backquote',
  '[': 'BracketLeft',
  '\\': 'Backslash',
  ']': 'BracketRight',
  '\'': 'Quote',
  /* eslint-enable quote-props */
};

function getNormalizedKey(key) {
  const normalizedKey = getNormalizedKeyAttributeValue(key);
  if (key !== normalizedKey) {
    this.debugSection('Input', `Mapping key '${key}' to '${normalizedKey}'`);
  }
  // Use key definition to ensure correct key is displayed when Shift modifier is active
  if (Object.prototype.hasOwnProperty.call(keyDefinitionMap, normalizedKey)) {
    return keyDefinitionMap[normalizedKey];
  }
  return normalizedKey;
}

function highlightActiveElement(element, context) {
  if (this.options.highlightElement && global.debugMode) {
    highlightElement(element, context);
  }
}

function _waitForElement(locator, options) {
  try {
    return this.context.waitForXPath(locator.value, options);
  } catch (e) {
    return this.context.waitForSelector(`::-p-xpath(${locator.value})`, options);
  }
}

async function findReactElements(locator, props = {}, state = {}) {
  const resqScript = await fs.promises.readFile(require.resolve('resq'), 'utf-8');
  await this.page.evaluate(resqScript.toString());

  await this.page.evaluate(() => window.resq.waitToLoadReact());
  const arrayHandle = await this.page.evaluateHandle((obj) => {
    const { selector, props, state } = obj;
    let elements = window.resq.resq$$(selector);
    if (Object.keys(props).length) {
      elements = elements.byProps(props);
    }
    if (Object.keys(state).length) {
      elements = elements.byState(state);
    }

    if (!elements.length) {
      return [];
    }

    // resq returns an array of HTMLElements if the React component is a fragment
    // this avoids having nested arrays of nodes which the driver does not understand
    // [[div, div], [div, div]] => [div, div, div, div]
    let nodes = [];

    elements.forEach((element) => {
      let { node, isFragment } = element;

      if (!node) {
        isFragment = true;
        node = element.children;
      }

      if (isFragment) {
        nodes = nodes.concat(node);
      } else {
        nodes.push(node);
      }
    });

    return [...nodes];
  }, {
    selector: locator.react,
    props: locator.props || {},
    state: locator.state || {},
  });

  const properties = await arrayHandle.getProperties();
  const result = [];
  for (const property of properties.values()) {
    const elementHandle = property.asElement();
    if (elementHandle) {
      result.push(elementHandle);
    }
  }

  await arrayHandle.dispose();
  return result;
}
