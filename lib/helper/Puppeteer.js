const requireg = require('requireg');
const Helper = require('../helper');
const Locator = require('../locator');
const recorder = require('../recorder');
const stringIncludes = require('../assert/include').includes;
const { urlEquals } = require('../assert/equal');
const { equals } = require('../assert/equal');
const { empty } = require('../assert/empty');
const { truth } = require('../assert/truth');
const {
  xpathLocator,
  ucfirst,
  fileExists,
  clearString,
  chunkArray,
  convertCssPropertiesToCamelCase,
  screenshotOutputFolder,
} = require('../utils');
const {
  isColorProperty,
  convertColorToRGBA,
} = require('../colorUtils');
const path = require('path');
const ElementNotFound = require('./errors/ElementNotFound');
const RemoteBrowserConnectionRefused = require('./errors/RemoteBrowserConnectionRefused');
const Popup = require('./extras/Popup');
const Console = require('./extras/Console');
const axios = require('axios');
const fs = require('fs');


let puppeteer;
const popupStore = new Popup();
const consoleLogStore = new Console();

/**
 * Uses [Google Chrome's Puppeteer](https://github.com/GoogleChrome/puppeteer) library to run tests inside headless Chrome.
 * Browser control is executed via DevTools Protocol (instead of Selenium).
 * This helper works with a browser out of the box with no additional tools required to install.
 *
 * Requires `puppeteer` package to be installed.
 *
 * ## Configuration
 *
 * This helper should be configured in codecept.json or codecept.conf.js
 *
 * * `url`: base url of website to be tested
 * * `show`: (optional, default: false) - show Google Chrome window for debug.
 * * `restart`: (optional, default: true) - restart browser between tests.
 * * `disableScreenshots`: (optional, default: false)  - don't save screenshot on failure.
 * * `fullPageScreenshots` (optional, default: false) - make full page screenshots on failure.
 * * `uniqueScreenshotNames`: (optional, default: false)  - option to prevent screenshot override if you have scenarios with the same name in different suites.
 * * `keepBrowserState`: (optional, default: false) - keep browser state between tests when `restart` is set to false.
 * * `keepCookies`: (optional, default: false) - keep cookies between tests when `restart` is set to false.
 * * `waitForAction`: (optional) how long to wait after click, doubleClick or PressKey actions in ms. Default: 100.
 * * `waitForNavigation`: (optional, default: 'load'). When to consider navigation succeeded. Possible options: `load`, `domcontentloaded`, `networkidle0`, `networkidle2`. See [Puppeteer API](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagewaitfornavigationoptions). Array values are accepted as well.
 * * `getPageTimeout` (optional, default: '0') config option to set maximum navigation time in milliseconds.
 * * `waitForTimeout`: (optional) default wait* timeout in ms. Default: 1000.
 * * `windowSize`: (optional) default window size. Set a dimension like `640x480`.
 * * `userAgent`: (optional) user-agent string.
 * * `manualStart`: (optional, default: false) - do not start browser before a test, start it manually inside a helper with `this.helpers["Puppeteer"]._startBrowser()`.
 * * `chrome`: (optional) pass additional [Puppeteer run options](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions).
 *
 *
 * #### Example #1: Wait for 0 network connections.
 *
 * ```json
 * {
 *    "helpers": {
 *      "Puppeteer" : {
 *        "url": "http://localhost",
 *        "restart": false,
 *        "waitForNavigation": "networkidle0",
 *        "waitForAction": 500
 *      }
 *    }
 * }
 * ```
 *
 * #### Example #2: Wait for DOMContentLoaded event and 0 network connections
 *
 * ```json
 * {
 *    "helpers": {
 *      "Puppeteer" : {
 *        "url": "http://localhost",
 *        "restart": false,
 *        "waitForNavigation": [ "domcontentloaded", "networkidle0" ],
 *        "waitForAction": 500
 *      }
 *    }
 * }
 * ```
 *
 * #### Example #3: Debug in window mode
 *
 * ```json
 * {
 *    "helpers": {
 *      "Puppeteer" : {
 *        "url": "http://localhost",
 *        "show": true
 *      }
 *    }
 * }
 * ```
 *
 * #### Example #4: Connect to remote browser by specifying [websocket endpoint](https://chromedevtools.github.io/devtools-protocol/#how-do-i-access-the-browser-target)
 *
 * ```json
 * {
 *    "helpers": {
 *      "Puppeteer" : {
 *        "url": "http://localhost",
 *        "chrome": {
 *          "browserWSEndpoint": "ws://localhost:9222/devtools/browser/c5aa6160-b5bc-4d53-bb49-6ecb36cd2e0a"
 *        }
 *      }
 *    }
 * }
 * ```
 *
 * Note: When connecting to remote browser `show` and specific `chrome` options (e.g. `headless` or `devtools`) are ignored.
 *
 * ## Access From Helpers
 *
 * Receive Puppeteer client from a custom helper by accessing `browser` for the Browser object or `page` for the current Page object:
 *
 * ```js
 * const browser = this.helpers['Puppeteer'].browser;
 * await browser.pages(); // List of pages in the browser
 *
 * const currentPage = this.helpers['Puppeteer'].page;
 * await currentPage.url(); // Get the url of the current page
 * ```
 *
 * ## Methods
 */
class Puppeteer extends Helper {
  constructor(config) {
    super(config);
    puppeteer = requireg('puppeteer');

    // set defaults
    this.isRemoteBrowser = false;
    this.isRunning = false;

    // override defaults with config
    this._setConfig(config);
  }

  _validateConfig(config) {
    const defaults = {
      waitForAction: 100,
      waitForTimeout: 1000,
      fullPageScreenshots: false,
      disableScreenshots: false,
      uniqueScreenshotNames: false,
      manualStart: false,
      getPageTimeout: 0,
      waitForNavigation: 'load',
      restart: true,
      keepCookies: false,
      keepBrowserState: false,
      show: false,
      defaultPopupAction: 'accept',
    };

    return Object.assign(defaults, config);
  }

  _setConfig(config) {
    this.options = this._validateConfig(config);
    this.puppeteerOptions = Object.assign({ headless: !this.options.show }, this.options.chrome);
    this.isRemoteBrowser = !!this.puppeteerOptions.browserWSEndpoint;
    popupStore.defaultAction = this.options.defaultPopupAction;
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
      return ['puppeteer@^1.6.0'];
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
    recorder.retry({
      retries: 3,
      when: err => err.message.indexOf('context') > -1, // ignore context errors
    });
    if (this.options.restart && !this.options.manualStart) return this._startBrowser();
    if (!this.isRunning && !this.options.manualStart) return this._startBrowser();
    return this.browser;
  }

  async _after() {
    if (!this.isRunning) return;

    // close other sessions
    const contexts = this.browser.browserContexts();
    contexts.shift();
    await Promise.all(contexts.map(c => c.close()));

    if (this.options.restart) {
      this.isRunning = false;
      return this._stopBrowser();
    }

    if (this.options.keepBrowserState) return;

    if (!this.options.keepCookies) {
      this.debugSection('Session', 'cleaning cookies and localStorage');
      await this.clearCookie();
    }
    await this.executeScript('localStorage.clear();').catch((err) => {
      if (!(err.message.indexOf("Storage is disabled inside 'data:' URLs.") > -1)) throw err;
    });
    await this.closeOtherTabs();
    return this.browser;
  }

  _afterSuite() {
  }

  _finishTest() {
    if (!this.options.restart && this.isRunning) return this._stopBrowser();
  }

  _session() {
    const page = this.page;
    return {
      start: async () => {
        this.debugSection('Incognito Tab', 'opened');

        const bc = await this.browser.createIncognitoBrowserContext();
        await bc.newPage();
        // Create a new page inside context.
        return bc;
      },
      stop: async (context) => {
        // is closed by _after
      },
      loadVars: async (context) => {
        // if (this.withinLocator)
        const existingPages = context.targets().filter(t => t.type() === 'page');
        // this.page = await existingPages[0].page();
        // this.context = await page.$('body');
        return this._setPage(await existingPages[0].page());
      },
      restoreVars: async () => {
        this.withinLocator = null;
        this.page = page;
        if (!page) return;
        this.context = await page.$('body');
      },
    };
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
    this.page = page;
    if (!page) return;
    page.setDefaultNavigationTimeout(this.options.getPageTimeout);
    this.context = await page.$('body');
    await page.bringToFront();
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

      // Clear any prior existing pages when connecting to remote websocket
      await this.browser.newPage();
      await this.closeOtherTabs();
    } else {
      this.browser = await puppeteer.launch(this.puppeteerOptions);
    }

    this.browser.on('targetcreated', target => target.page().then(page => targetCreatedHandler.call(this, page)));
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

    if (this.options.windowSize && this.options.windowSize.indexOf('x') > 0) {
      const dimensions = this.options.windowSize.split('x');
      await this.resizeWindow(parseInt(dimensions[0], 10), parseInt(dimensions[1], 10));
    }

    this.isRunning = true;

    if (this.options.userAgent) {
      await this.page.setUserAgent(this.options.userAgent);
    }
  }

  async _stopBrowser() {
    this.withinLocator = null;
    this._setPage(null);
    this.context = null;
    popupStore.clear();
    if (this.isRemoteBrowser) {
      await this.browser.disconnect();
    } else {
      await this.browser.close();
    }
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
    if (!(/^\w+\:\/\//.test(url))) {
      url = this.options.url + url;
    }
    await this.page.goto(url, { waitUntil: this.options.waitForNavigation });
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
   */
  async moveCursorTo(locator, offsetX = 0, offsetY = 0) {
    const els = await this._locate(locator);
    assertElementExists(els);

    // Use manual mouse.move instead of .hover() so the offset can be added to the coordinates
    const { x, y } = await els[0]._clickablePoint();
    await this.page.mouse.move(x + offsetX, y + offsetY);
    return this._waitForAction();
  }

  /**
   * {{> ../webapi/dragAndDrop }}
   */
  async dragAndDrop(srcElement, destElement) {
    return proceedDragAndDrop.call(this, srcElement, destElement);
  }

  /**
   * {{> ../webapi/refreshPage }}
   */
  async refreshPage() {
    return this.page.reload({ timeout: this.options.getPageTimeout, waitUntil: this.options.waitForNavigation });
  }

  /**
   * {{> ../webapi/scrollPageToTop }}
   */
  scrollPageToTop() {
    return this.page.evaluate(() => {
      window.scrollTo(0, 0);
    });
  }

  /**
   * {{> ../webapi/scrollPageToBottom }}
   */
  scrollPageToBottom() {
    return this.page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      window.scrollTo(0, Math.max(
        body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight,
      ));
    });
  }

  /**
   * {{> ../webapi/scrollTo }}
   */
  async scrollTo(locator, offsetX = 0, offsetY = 0) {
    if (typeof locator === 'number' && typeof offsetX === 'number') {
      offsetY = offsetX;
      offsetX = locator;
      locator = null;
    }
    let x = 0;
    let y = 0;
    if (locator) {
      const els = await this._locate(locator);
      assertElementExists(els, locator, 'Element');
      await els[0]._scrollIntoViewIfNeeded();
      const elementCoordinates = await els[0]._clickablePoint();
      x = elementCoordinates.x;
      y = elementCoordinates.y;
    }

    await this.page.evaluate((x, y) => {
      window.scrollTo(x, y);
    }, x + offsetX, y + offsetY);
    return this._waitForAction();
  }

  /**
   * {{> ../webapi/seeInTitle }}
   */
  async seeInTitle(text) {
    const title = await this.page.title();
    stringIncludes('web page title').assert(text, title);
  }

  /**
   * {{> ../webapi/grabPageScrollPosition}}
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
   */
  async seeTitleEquals(text) {
    const title = await this.page.title();
    return equals('web page title').assert(title, text);
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
   * Find a checkbox by providing human readable text:
   *
   * ```js
   * this.helpers['Puppeteer']._locateCheckable('I agree with terms and conditions').then // ...
   * ```
   */
  async _locateCheckable(locator) {
    return findCheckable.call(this, locator, this.context);
  }

  /**
   * Find a clickable element by providing human readable text:
   *
   * ```js
   * this.helpers['Puppeteer']._locateClickable('Next page').then // ...
   * ```
   */
  async _locateClickable(locator) {
    const context = await this._getContext();
    return findClickable.call(this, context, locator);
  }

  /**
   * Find field elements by providing human readable text:
   *
   * ```js
   * this.helpers['Puppeteer']._locateFields('Your email').then // ...
   * ```
   */
  async _locateFields(locator) {
    return findFields.call(this, locator);
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
   * {{> ../webapi/grabNumberOfOpenTabs }}
   */
  async grabNumberOfOpenTabs() {
    const pages = await this.browser.pages();
    return pages.length;
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
   * {{> ../webapi/clickLink }}
   */
  async clickLink(locator, context = null) {
    return proceedClick.call(this, locator, context, { waitForNavigation: true });
  }

  /**
   * {{> ../webapi/downloadFile }}
   */
  async downloadFile(locator, customName) {
    let fileName;
    await this.page.setRequestInterception(true);
    this.click(locator);

    const xRequest = await new Promise((resolve) => {
      this.page.on('request', (request) => {
        const grabbedFileName = request.url().split('/')[request.url().split('/').length - 1];
        const fileExtension = request.url().split('/')[request.url().split('/').length - 1].split('.')[1];
        customName ? fileName = `${customName}.${fileExtension}` : fileName = grabbedFileName;
        request.abort();
        resolve(request);
      });
    });

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
      method: options.method, url: options.uri, headers: options.headers, responseType: 'arraybuffer',
    });

    const outputFile = path.join(`${global.output_dir}/${fileName}`);

    try {
      return new Promise((resolve, reject) => {
        const wstream = fs.createWriteStream(outputFile);
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
   * {{> ../webapi/doubleClick }}
   */
  async doubleClick(locator, context = null) {
    return proceedClick.call(this, locator, context, { clickCount: 2 });
  }

  /**
   * {{> ../webapi/rightClick }}
   */
  async rightClick(locator, context = null) {
    return proceedClick.call(this, locator, context, { button: 'right' });
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
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      await this._evaluateHandeInContext(el => el.value = '', el);
    } else if (editable) {
      await this._evaluateHandeInContext(el => el.innerHTML = '', el);
    }
    await el.type(value.toString(), { delay: 10 });
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
   * {{> ../webapi/grabNumberOfVisibleElements }}
   */
  async grabNumberOfVisibleElements(locator) {
    let els = await this._locate(locator);
    els = await Promise.all(els.map(el => el.boundingBox()));
    return els.filter(v => v).length;
  }

  /**
   * {{> ../webapi/seeInCurrentUrl }}
   */
  async seeInCurrentUrl(url) {
    stringIncludes('url').assert(url, await this._getPageUrl());
  }

  /**
   * {{> ../webapi/dontSeeInCurrentUrl }}
   */
  async dontSeeInCurrentUrl(url) {
    stringIncludes('url').negate(url, await this._getPageUrl());
  }

  /**
   * {{> ../webapi/seeCurrentUrlEquals }}
   */
  async seeCurrentUrlEquals(url) {
    urlEquals(this.options.url).assert(url, await this._getPageUrl());
  }

  /**
   * {{> ../webapi/dontSeeCurrentUrlEquals }}
   */
  async dontSeeCurrentUrlEquals(url) {
    urlEquals(this.options.url).negate(url, await this._getPageUrl());
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
  async dontSee(text, context = null) {
    return proceedSee.call(this, 'negate', text, context);
  }

  /**
   * {{> ../webapi/grabSource }}
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
   */
  async grabBrowserLogs() {
    const logs = consoleLogStore.entries;
    consoleLogStore.clear();
    return logs;
  }

  /**
   * {{> ../webapi/grabCurrentUrl }}
   */
  async grabCurrentUrl() {
    return this._getPageUrl();
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
   * {{> ../webapi/seeNumberOfVisibleElements }}
   */
  async seeNumberOfVisibleElements(locator, num) {
    const res = await this.grabNumberOfVisibleElements(locator);
    return equals(`expected number of visible elements (${locator}) is ${num}, but found ${res}`).assert(res, num);
  }

  /**
   * {{> ../webapi/setCookie }}
   */
  async setCookie(cookie) {
    if (Array.isArray(cookie)) {
      return this.page.setCookie(...cookie);
    }
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
    let context = this.page;
    if (this.context && typeof this.context.evaluate === 'function') {
      context = this.context;
    }
    return context.evaluate.apply(context, arguments);
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
   * {{> ../webapi/grabTextFrom }}
   */
  async grabTextFrom(locator) {
    const els = await this._locate(locator);
    assertElementExists(els, locator);
    const texts = [];
    for (const el of els) {
      texts.push(await (await el.getProperty('innerText')).jsonValue());
    }
    if (texts.length === 1) return texts[0];
    return texts;
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
   * {{> ../webapi/grabHTMLFrom }}
   */
  async grabHTMLFrom(locator) {
    const els = await this._locate(locator);
    assertElementExists(els, locator);
    const values = await Promise.all(els.map(el => this.page.evaluate(element => element.innerHTML, el)));
    if (Array.isArray(values) && values.length === 1) {
      return values[0];
    }
    return values;
  }

  /**
   * {{> ../webapi/grabCssPropertyFrom }}
   */
  async grabCssPropertyFrom(locator, cssProperty) {
    const els = await this._locate(locator);
    const res = await Promise.all(els.map(el => el.executionContext().evaluate(el => JSON.parse(JSON.stringify(getComputedStyle(el))), el)));
    const cssValues = res.map(props => props[cssProperty]);

    if (res.length > 0) {
      return cssValues;
    }
    return cssValues[0];
  }

  /**
   * {{> ../webapi/seeCssPropertiesOnElements }}
   */
  async seeCssPropertiesOnElements(locator, cssProperties) {
    const res = await this._locate(locator);
    assertElementExists(res, locator);

    const cssPropertiesCamelCase = convertCssPropertiesToCamelCase(cssProperties);
    const elemAmount = res.length;
    const commands = [];
    res.forEach((el) => {
      Object.keys(cssPropertiesCamelCase).forEach((prop) => {
        commands.push(el.executionContext()
          .evaluate((el) => {
            const style = window.getComputedStyle ? getComputedStyle(el) : el.currentStyle;
            return JSON.parse(JSON.stringify(style));
          }, el)
          .then((props) => {
            if (isColorProperty(prop)) {
              return convertColorToRGBA(props[prop]);
            }
            return props[prop];
          }));
      });
    });
    let props = await Promise.all(commands);
    const values = Object.keys(cssPropertiesCamelCase).map(key => cssPropertiesCamelCase[key]);
    if (!Array.isArray(props)) props = [props];
    let chunked = chunkArray(props, values.length);
    chunked = chunked.filter((val) => {
      for (let i = 0; i < val.length; ++i) {
        if (val[i] !== values[i]) return false;
      }
      return true;
    });
    return equals(`all elements (${locator}) to have CSS property ${JSON.stringify(cssProperties)}`).assert(chunked.length, elemAmount);
  }

  /**
   * {{> ../webapi/seeAttributesOnElements }}
   */
  async seeAttributesOnElements(locator, attributes) {
    const res = await this._locate(locator);
    assertElementExists(res, locator);

    const elemAmount = res.length;
    const commands = [];
    res.forEach((el) => {
      Object.keys(attributes).forEach((prop) => {
        commands.push(el
          .executionContext()
          .evaluateHandle((el, attr) => el[attr] || el.getAttribute(attr), el, prop)
          .then(el => el.jsonValue()));
      });
    });
    let attrs = await Promise.all(commands);
    const values = Object.keys(attributes).map(key => attributes[key]);
    if (!Array.isArray(attrs)) attrs = [attrs];
    let chunked = chunkArray(attrs, values.length);
    chunked = chunked.filter((val) => {
      for (let i = 0; i < val.length; ++i) {
        if (val[i] !== values[i]) return false;
      }
      return true;
    });
    return equals(`all elements (${locator}) to have attributes ${JSON.stringify(attributes)}`).assert(chunked.length, elemAmount);
  }

  /**
   * {{> ../webapi/dragSlider }}
   */
  async dragSlider(locator, offsetX = 0) {
    const src = await this._locate(locator);
    assertElementExists(src, locator, 'Slider Element');

    // Note: Using private api ._clickablePoint because the .BoundingBox does not take into account iframe offsets!
    const sliderSource = await src[0]._clickablePoint();

    // Drag start point
    await this.page.mouse.move(sliderSource.x, sliderSource.y, { steps: 5 });
    await this.page.mouse.down();

    // Drag destination
    await this.page.mouse.move(sliderSource.x + offsetX, sliderSource.y, { steps: 5 });
    await this.page.mouse.up();

    await this._waitForAction();
  }

  /**
   * {{> ../webapi/grabAttributeFrom }}
   */
  async grabAttributeFrom(locator, attr) {
    const els = await this._locate(locator);
    assertElementExists(els, locator);
    const array = [];

    for (let index = 0; index < els.length; index++) {
      const a = await this._evaluateHandeInContext((el, attr) => el[attr] || el.getAttribute(attr), els[index], attr);
      array.push(await a.jsonValue());
    }

    return array.length === 1 ? array[0] : array;
  }

  /**
   * {{> ../webapi/saveScreenshot }}
   */
  async saveScreenshot(fileName, fullPage) {
    const fullPageOption = fullPage || this.options.fullPageScreenshots;
    const outputFile = screenshotOutputFolder(fileName);

    this.debug(`Screenshot is saving to ${outputFile}`);
    const openSessions = await this.browser.pages();
    if (openSessions.length > 1) {
      this.page = await this.browser.targets()[this.browser.targets().length - 1].page();
    }
    return this.page.screenshot({ path: outputFile, fullPage: fullPageOption, type: 'png' });
  }

  async _failed(test) {
    await this._withinEnd();
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
   * {{> ../webapi/waitForEnabled }}
   */
  async waitForEnabled(locator, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;
    locator = new Locator(locator, 'css');
    const matcher = await this.context;
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
   * {{> ../webapi/waitForValue }}
   */
  async waitForValue(field, value, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;
    const locator = new Locator(field, 'css');
    const matcher = await this.context;
    let waiter;
    const context = await this._getContext();
    if (locator.isCSS()) {
      const valueFn = function (locator, value) {
        const els = document.querySelectorAll(locator);
        if (!els || els.length === 0) {
          return false;
        }
        return Array.prototype.filter.call(els, el => (el.value || '').indexOf(value) !== -1).length > 0;
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
   * {{> ../webapi/waitNumberOfVisibleElements }}
   */
  async waitNumberOfVisibleElements(locator, num, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;
    locator = new Locator(locator, 'css');
    const matcher = await this.context;
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
      throw new Error(`element (${locator.toString()}) still not visible after ${waitTimeout / 1000} sec\n${err.message}`);
    });
  }

  /**
   * {{> ../webapi/waitForInvisible }}
   */
  async waitForInvisible(locator, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;
    locator = new Locator(locator, 'css');
    const matcher = await this.context;
    let waiter;
    const context = await this._getContext();
    if (locator.isCSS()) {
      waiter = context.waitForSelector(locator.simplify(), { timeout: waitTimeout, hidden: true });
    } else {
      const visibleFn = function (locator, $XPath) {
        eval($XPath); // eslint-disable-line no-eval
        const matches = $XPath(null, locator);
        return matches.length === 0 || matches.filter(el => el.offsetParent === null).length > 0;
      };
      waiter = context.waitForFunction(visibleFn, { timeout: waitTimeout }, locator.value, $XPath.toString());
    }
    return waiter.catch((err) => {
      throw new Error(`element (${locator.toString()}) still visible after ${waitTimeout / 1000} sec\n${err.message}`);
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
   * {{> ../webapi/waitInUrl }}
   */
  async waitInUrl(urlPart, sec = null) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;

    return this.page.waitForFunction((urlPart) => {
      const currUrl = decodeURIComponent(decodeURIComponent(decodeURIComponent(window.location.href)));
      return currUrl.indexOf(urlPart) > -1;
    }, { timeout: waitTimeout }, urlPart).catch(async (e) => {
      const currUrl = await this._getPageUrl(); // Required because the waitForFunction can't return data.
      if (/failed: timeout/i.test(e.message)) {
        throw new Error(`expected url to include ${urlPart}, but found ${currUrl}`);
      } else {
        throw e;
      }
    });
  }

  /**
   * {{> ../webapi/waitUrlEquals }}
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
      if (/failed: timeout/i.test(e.message)) {
        throw new Error(`expected url to be ${urlPart}, but found ${currUrl}`);
      } else {
        throw e;
      }
    });
  }

  /**
   * {{> ../webapi/waitForText }}
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
   * Waits for a network request.
   *
   * ```js
   * I.waitForRequest('http://example.com/resource');
   * I.waitForRequest(request => request.url() === 'http://example.com' && request.method() === 'GET');
   * ```
   *
   * @param {*} urlOrPredicate
   * @param {*} sec
   */
  async waitForRequest(urlOrPredicate, sec = null) {
    const timeout = sec ? sec * 1000 : this.options.waitForTimeout;
    return this.page.waitForRequest(urlOrPredicate, { timeout });
  }

  /**
   * Waits for a network request.
   *
   * ```js
   * I.waitForResponse('http://example.com/resource');
   * I.waitForResponse(request => request.url() === 'http://example.com' && request.method() === 'GET');
   * ```
   *
   * @param {*} urlOrPredicate
   * @param {*} sec
   */
  async waitForResponse(urlOrPredicate, sec = null) {
    const timeout = sec ? sec * 1000 : this.options.waitForTimeout;
    return this.page.waitForResponse(urlOrPredicate, { timeout });
  }

  /**
   * {{> ../webapi/switchTo }}
   */
  async switchTo(locator) {
    if (Number.isInteger(locator)) {
      // Select by frame index of current context

      let childFrames = null;
      if (this.context && typeof this.context.childFrames === 'function') {
        childFrames = this.context.childFrames();
      } else {
        childFrames = this.page.mainFrame().childFrames();
      }

      if (locator >= 0 && locator < childFrames.length) {
        this.context = childFrames[locator];
      } else {
        throw new Error('Element #invalidIframeSelector was not found by text|CSS|XPath');
      }
      return;
    } else if (!locator) {
      this.context = await this.page.mainFrame().$('body');
      return;
    }

    // iframe by selector
    const els = await this._locate(locator);
    assertElementExists(els, locator);

    const iframeName = await els[0].getProperty('name').then(el => el.jsonValue());
    const iframeId = await els[0].getProperty('id').then(el => el.jsonValue());
    const iframeUrl = await els[0].getProperty('src').then(el => el.jsonValue());

    const searchName = iframeName || iframeId; // Name takes precedence over id, because of puppeteer's Frame.name() function
    const currentContext = await this._getContext();
    const resFrame = await findFrame.call(this, currentContext, searchName, iframeUrl);

    if (resFrame) {
      this.context = resFrame;
    } else {
      this.context = els[0];
    }
  }

  /**
   * {{> ../webapi/waitForFunction }}
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
   * Waits for navigation to finish. By default takes configured `waitForNavigation` option.
   *
   * See [Pupeteer's reference](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagewaitfornavigationoptions)
   *
   * @param {*} opts
   */
  async waitForNavigation(opts = {}) {
    opts = Object.assign({ timeout: this.options.getPageTimeout, waitUntil: this.options.waitForNavigation }, opts);
    return this.page.waitForNavigation(opts);
  }

  /**
   * {{> ../webapi/waitUntil }}
   */
  async waitUntil(fn, sec = null) {
    console.log('This method will remove in CodeceptJS 1.4; use `waitForFunction` instead!');
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;
    const context = await this._getContext();
    return context.waitForFunction(fn, { timeout: waitTimeout });
  }

  async waitUntilExists(locator, sec) {
    console.log(`waitUntilExists deprecated:
    * use 'waitForElement' to wait for element to be attached
    * use 'waitForDetached to wait for element to be removed'`);
    return this.waitForDetached(locator, sec);
  }

  /**
   * {{> ../webapi/waitForDetached }}
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
}

module.exports = Puppeteer;

async function findFrame(context, name, url) {
  if (!context) {
    return;
  }
  let frames = [];
  if (typeof context.childFrames === 'function') {
    frames = context.childFrames();
  } else {
    frames = this.page.frames();
  }

  return frames.find((frame) => {
    if (name || !url) {
      return frame.name() === name;
    }
    return frame.url() === url;
  });
}

async function findElements(matcher, locator) {
  locator = new Locator(locator, 'css');
  if (!locator.isXPath()) return matcher.$$(locator.simplify());

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
  await els[0].click(options);
  const promises = [];
  if (options.waitForNavigation) {
    promises.push(this.waitForNavigation());
  }
  promises.push(this._waitForAction());
  return Promise.all(promises);
}

async function findClickable(matcher, locator) {
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
    assertElementExists(els, 'context element');
    allText = await Promise.all(els.map(el => el.getProperty('innerText').then(p => p.jsonValue())));
  }

  if (strict) {
    return allText.map(elText => equals(description)[assertType](text, elText));
  }
  return stringIncludes(description)[assertType](text, allText.join(' | '));
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

async function proceedDragAndDrop(sourceLocator, destinationLocator, options = {}) {
  const src = await this._locate(sourceLocator);
  assertElementExists(src, sourceLocator, 'Source Element');

  const dst = await this._locate(destinationLocator);
  assertElementExists(dst, destinationLocator, 'Destination Element');

  // Note: Using private api ._clickablePoint becaues the .BoundingBox does not take into account iframe offsets!
  const dragSource = await src[0]._clickablePoint();
  const dragDestination = await dst[0]._clickablePoint();

  // Drag start point
  await this.page.mouse.move(dragSource.x, dragSource.y, { steps: 5 });
  await this.page.mouse.down();

  // Drag destination
  await this.page.mouse.move(dragDestination.x, dragDestination.y, { steps: 5 });
  await this.page.mouse.up();

  await this._waitForAction();
}

async function proceedSeeInField(assertType, field, value) {
  const els = await findFields.call(this, field);
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

function targetCreatedHandler(page) {
  if (!page) return;
  this.withinLocator = null;
  page.on('load', frame => this.context = page.$('body'));
  page.on('console', (msg) => {
    this.debugSection(`Browser:${ucfirst(msg.type())}`, (msg._text || '') + msg.args().join(' '));
    consoleLogStore.add(msg);
  });
}
