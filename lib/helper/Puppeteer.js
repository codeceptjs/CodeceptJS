import axios from 'axios'
import fs from 'fs'
import fsExtra from 'fs-extra'
import path from 'path'
import Helper from '@codeceptjs/helper'
import { v4 as uuidv4 } from 'uuid'
import promiseRetry from 'promise-retry'
import Locator from '../locator.js'
import recorder from '../recorder.js'
import store from '../store.js'
import { checkFocusBeforeType, checkFocusBeforePressKey } from './extras/focusCheck.js'
import { includes as stringIncludes } from '../assert/include.js'
import { urlEquals, equals } from '../assert/equal.js'
import { empty } from '../assert/empty.js'
import { truth } from '../assert/truth.js'
import isElementClickable from './scripts/isElementClickable.js'
import {
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
  requireWithFallback,
  normalizeSpacesInString,
  normalizePath,
  resolveUrl,
  getMimeType,
  base64EncodeFile,
} from '../utils.js'
import { isColorProperty, convertColorToRGBA } from '../colorUtils.js'
import ElementNotFound from './errors/ElementNotFound.js'
import MultipleElementsFound from './errors/MultipleElementsFound.js'
import RemoteBrowserConnectionRefused from './errors/RemoteBrowserConnectionRefused.js'
import Popup from './extras/Popup.js'
import Console from './extras/Console.js'
import { highlightElement } from './scripts/highlightElement.js'
import { blurElement } from './scripts/blurElement.js'
import { dropFile } from './scripts/dropFile.js'
import { dontSeeElementError, seeElementError, dontSeeElementInDOMError, seeElementInDOMError } from './errors/ElementAssertion.js'
import { dontSeeTraffic, seeTraffic, grabRecordedNetworkTraffics, stopRecordingTraffic, flushNetworkTraffics } from './network/actions.js'
import WebElement from '../element/WebElement.js'
import { selectElement } from './extras/elementSelection.js'
import { fillRichEditor } from './extras/richTextEditor.js'

let puppeteer

/**
 * Wraps error objects that don't have a proper message property
 * This is needed for ESM compatibility with Puppeteer error handling
 */
function wrapError(e) {
  if (e && typeof e === 'object' && !e.message) {
    const err = new Error(String(e))
    err.stack = e.stack
    return err
  }
  return e
}
let perfTiming
const popupStore = new Popup()
const consoleLogStore = new Console()

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
 * @prop {string|string[]} [waitForNavigation=load] - when to consider navigation succeeded. Possible options: `load`, `domcontentloaded`, `networkidle0`, `networkidle2`. See [Puppeteer API](https://github.com/puppeteer/puppeteer/blob/main/docs/api/puppeteer.waitforoptions.md). Array values are accepted as well.
 * @prop {number} [pressKeyDelay=10] - delay between key presses in ms. Used when calling Puppeteers page.type(...) in fillField/appendField
 * @prop {number} [getPageTimeout=30000] - config option to set maximum navigation time in milliseconds. If the timeout is set to 0, then timeout will be disabled.
 * @prop {number} [waitForTimeout=1000] - default wait* timeout in ms.
 * @prop {string} [windowSize] - default window size. Set a dimension in format WIDTHxHEIGHT like `640x480`.
 * @prop {string} [userAgent] - user-agent string.
 * @prop {boolean} [manualStart=false] - do not start browser before a test, start it manually inside a helper with `this.helpers["Puppeteer"]._startBrowser()`.
 * @prop {string} [browser=chrome] - can be changed to `firefox` when using [puppeteer-firefox](https://codecept.io/helpers/Puppeteer-firefox).
 * @prop {object} [chrome] - pass additional [Puppeteer run options](https://github.com/puppeteer/puppeteer/blob/main/docs/api/puppeteer.launchoptions.md).
 * @prop {boolean} [highlightElement] - highlight the interacting elements. Default: false. Note: only activate under verbose mode (--verbose).
 */
const config = {}

/**
 * Uses [Google Chrome's Puppeteer](https://github.com/puppeteer/puppeteer) library to run tests inside headless Chrome.
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
    super(config)

    // puppeteer will be loaded dynamically in _init method
    // set defaults
    this.isRemoteBrowser = false
    this.isRunning = false
    this.isAuthenticated = false
    this.sessionPages = {}
    this.activeSessionName = ''

    // for network stuff
    this.requests = []
    this.recording = false
    this.recordedAtLeastOnce = false

    // for websocket messages
    this.webSocketMessages = []
    this.recordingWebSocketMessages = false
    this.recordedWebSocketMessagesAtLeastOnce = false
    this.cdpSession = null

    // override defaults with config
    this._setConfig(config)
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
      strict: false,
    }

    return Object.assign(defaults, config)
  }

  _getOptions(config) {
    return config.browser === 'firefox' ? Object.assign(this.options.firefox, { product: 'firefox' }) : this.options.chrome
  }

  _setConfig(config) {
    this.options = this._validateConfig(config)
    this.puppeteerOptions = {
      headless: !this.options.show,
      ...this._getOptions(config),
    }
    if (this.puppeteerOptions.headless) this.puppeteerOptions.headless = 'new'
    this.isRemoteBrowser = !!this.puppeteerOptions.browserWSEndpoint
    popupStore.defaultAction = this.options.defaultPopupAction
  }

  static _config() {
    return [
      { name: 'url', message: 'Base url of site to be tested', default: 'http://localhost' },
      {
        name: 'show',
        message: 'Show browser window',
        default: true,
        type: 'confirm',
      },
      {
        name: 'windowSize',
        message: 'Browser viewport size',
        default: '1200x900',
      },
    ]
  }

  static _checkRequirements() {
    try {
      // In ESM, puppeteer will be checked via dynamic import in _init
      // The import will fail at module load time if puppeteer is missing
      return null
    } catch (e) {
      return ['puppeteer']
    }
  }

  async _init() {
    // Load puppeteer dynamically with fallback
    if (!puppeteer) {
      try {
        const puppeteerModule = await import('puppeteer')
        puppeteer = puppeteerModule.default || puppeteerModule
        this.debugSection('Puppeteer', `Loaded puppeteer successfully, launch available: ${!!puppeteer.launch}`)
      } catch (e) {
        try {
          const puppeteerModule = await import('puppeteer-core')
          puppeteer = puppeteerModule.default || puppeteerModule
          this.debugSection('Puppeteer', `Loaded puppeteer-core successfully, launch available: ${!!puppeteer.launch}`)
        } catch (e2) {
          throw new Error('Neither puppeteer nor puppeteer-core could be loaded. Please install one of them.')
        }
      }
    } else {
      this.debugSection('Puppeteer', `Puppeteer already loaded, launch available: ${!!puppeteer.launch}`)
    }
  }

  _beforeSuite() {
    if (!this.options.restart && !this.options.manualStart && !this.isRunning) {
      this.debugSection('Session', 'Starting singleton browser session')
      return this._startBrowser()
    }
  }

  async _before(test) {
    this.sessionPages = {}
    this.currentRunningTest = test
    recorder.retry({
      retries: test?.opts?.conditionalRetries || 3,
      when: err => {
        if (!err || typeof err.message !== 'string') {
          return false
        }
        // ignore context errors
        return err.message.includes('context')
      },
    })
    if (this.options.restart && !this.options.manualStart) return this._startBrowser()
    if (!this.isRunning && !this.options.manualStart) return this._startBrowser()
    return this.browser
  }

  async _after() {
    if (!this.isRunning) return

    // Clear popup state to prevent leakage between tests
    popupStore.clear()

    // close other sessions
    const contexts = this.browser.browserContexts()
    const defaultCtx = contexts.shift()

    await Promise.all(contexts.map(c => c.close()))

    if (this.options.restart) {
      this.isRunning = false
      return this._stopBrowser()
    }

    // ensure this.page is from default context
    if (this.page) {
      const existingPages = defaultCtx.targets().filter(t => t.type() === 'page')
      await this._setPage(await existingPages[0].page())
    }

    if (this.options.keepBrowserState) return

    if (!this.options.keepCookies) {
      this.debugSection('Session', 'cleaning cookies and localStorage')
      await this.clearCookie()
    }
    const currentUrl = await this.grabCurrentUrl()

    if (currentUrl.startsWith('http')) {
      await this.executeScript('localStorage.clear();').catch(err => {
        if (!(err.message.indexOf("Storage is disabled inside 'data:' URLs.") > -1)) throw err
      })
      await this.executeScript('sessionStorage.clear();').catch(err => {
        if (!(err.message.indexOf("Storage is disabled inside 'data:' URLs.") > -1)) throw err
      })
    }
    await this.closeOtherTabs()
    return this.browser
  }

  _afterSuite() {}

  _finishTest() {
    if (!this.options.restart && this.isRunning) return this._stopBrowser()
  }

  _session() {
    return {
      start: async (name = '') => {
        this.debugSection('Incognito Tab', 'opened')
        this.activeSessionName = name

        const bc = await this.browser.createBrowserContext()
        await bc.newPage()

        // Create a new page inside context.
        return bc
      },
      stop: async () => {
        // is closed by _after
      },
      loadVars: async context => {
        const existingPages = context.targets().filter(t => t.type() === 'page')
        this.sessionPages[this.activeSessionName] = await existingPages[0].page()
        return this._setPage(this.sessionPages[this.activeSessionName])
      },
      restoreVars: async session => {
        this.withinLocator = null

        if (!session) {
          this.activeSessionName = ''
        } else {
          this.activeSessionName = session
        }
        
        const defaultCtx = this.browser.defaultBrowserContext()
        if (!defaultCtx) {
          this.debug('Cannot restore session vars: default browser context is undefined')
          return
        }

        try {
          const existingPages = defaultCtx.targets().filter(t => t.type() === 'page')
          if (existingPages && existingPages.length > 0) {
            await this._setPage(await existingPages[0].page())
            // Reset context-related variables to ensure clean state after session
            this.context = await this.page
            this.contextLocator = null
          } else {
            this.debug('Cannot restore session vars: no pages available')
          }
        } catch (err) {
          this.debug(`Failed to restore session vars: ${err.message}`)
          return
        }

        return this._waitForAction()
      },
    }
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
    return this._useTo(...arguments)
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
    popupStore.actionType = 'accept'
  }

  /**
   * Accepts the active JavaScript native popup window, as created by window.alert|window.confirm|window.prompt.
   * Don't confuse popups with modal windows, as created by [various
   * libraries](http://jster.net/category/windows-modals-popups).
   */
  acceptPopup() {
    popupStore.assertPopupActionType('accept')
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
    popupStore.actionType = 'cancel'
  }

  /**
   * Dismisses the active JavaScript popup, as created by window.alert|window.confirm|window.prompt.
   */
  cancelPopup() {
    popupStore.assertPopupActionType('cancel')
  }

  /**
   * {{> seeInPopup }}
   */
  async seeInPopup(text) {
    popupStore.assertPopupVisible()
    const popupText = await popupStore.popup.message()
    stringIncludes('text in popup').assert(text, popupText)
  }

  /**
   * Set current page
   * @param {object} page page to set
   */
  async _setPage(page) {
    page = await page
    this._addPopupListener(page)
    this._addErrorListener(page)
    this.page = page
    if (!page) return
    page.setDefaultNavigationTimeout(this.options.getPageTimeout)
    this.context = await this.page.$('body')
    if (this.options.browser === 'chrome') {
      await page.bringToFront()
    }
  }

  async _addErrorListener(page) {
    if (!page) {
      return
    }
    page.on('error', async error => {
      console.error('Puppeteer page error', error)
    })
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
      return
    }
    page.on('dialog', async dialog => {
      popupStore.popup = dialog
      const action = popupStore.actionType || this.options.defaultPopupAction
      await this._waitForAction()

      switch (action) {
        case 'accept':
          return dialog.accept()

        case 'cancel':
          return dialog.dismiss()

        default: {
          throw new Error('Unknown popup action type. Only "accept" or "cancel" are accepted')
        }
      }
    })
  }

  /**
   * Gets page URL including hash.
   */
  async _getPageUrl() {
    return this.executeScript(() => window.location.href)
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
      return popupStore.popup.message()
    }
    return null
  }

  async _startBrowser() {
    this.debugSection('Puppeteer', `Starting browser. Puppeteer available: ${!!puppeteer}, launch available: ${!!puppeteer?.launch}`)

    if (!puppeteer) {
      throw new Error('Puppeteer is not loaded. Make sure _init() was called before _startBrowser()')
    }

    if (this.isRemoteBrowser) {
      try {
        this.browser = await puppeteer.connect(this.puppeteerOptions)
      } catch (err) {
        if (err.toString().indexOf('ECONNREFUSED')) {
          throw new RemoteBrowserConnectionRefused(err)
        }
        throw err
      }
    } else {
      this.browser = await puppeteer.launch(this.puppeteerOptions)
    }

    this.browser.on('targetcreated', target =>
      target
        .page()
        .then(page => targetCreatedHandler.call(this, page))
        .catch(e => {
          console.error('Puppeteer page error', e)
        }),
    )
    this.browser.on('targetchanged', target => {
      this.debugSection('Url', target.url())
    })

    const existingPages = await this.browser.pages()
    const mainPage = existingPages[0] || (await this.browser.newPage())

    if (existingPages.length) {
      // Run the handler as it will not be triggered if the page already exists
      targetCreatedHandler.call(this, mainPage)
    }
    await this._setPage(mainPage)
    await this.closeOtherTabs()

    this.isRunning = true
  }

  async _stopBrowser() {
    this.withinLocator = null
    this._setPage(null)
    this.context = null
    popupStore.clear()
    this.isAuthenticated = false
    await this.browser.close()
    if (this.isRemoteBrowser) {
      await this.browser.disconnect()
    }
  }

  async _evaluateHandeInContext(fn, handle, ...args) {
    // If handle is provided, evaluate directly on it to avoid "JavaScript world" errors
    if (handle) {
      return handle.evaluate(fn, ...args)
    }
    // Otherwise use the context
    const context = await this._getContext()
    return context.evaluateHandle(fn, ...args)
  }

  async _withinBegin(locator) {
    if (this.withinLocator) {
      throw new Error("Can't start within block inside another within block")
    }

    const frame = isFrameLocator(locator)

    if (frame) {
      if (Array.isArray(frame)) {
        return this.switchTo(null).then(() => frame.reduce((p, frameLocator) => p.then(() => this.switchTo(frameLocator)), Promise.resolve()))
      }
      await this.switchTo(frame)
      this.withinLocator = new Locator(frame)
      return
    }

    const el = await this._locateElement(locator)
    if (!el) {
      throw new ElementNotFound(locator, 'Element for within context')
    }
    this.context = el

    this.withinLocator = new Locator(locator)
  }

  async _withinEnd() {
    this.withinLocator = null
    if (this.page && !this.page.isClosed?.()) {
      this.context = await this.page.mainFrame().$('body')
    } else {
      this.context = null
    }
  }

  _extractDataFromPerformanceTiming(timing, ...dataNames) {
    const navigationStart = timing.navigationStart

    const extractedData = {}
    dataNames.forEach(name => {
      extractedData[name] = timing[name] - navigationStart
    })

    return extractedData
  }

  /**
   * {{> amOnPage }}
   */
  async amOnPage(url) {
    if (!/^\w+\:\/\//.test(url)) {
      url = this.options.url + url
    }

    if (this.options.basicAuth && this.isAuthenticated !== true) {
      if (url.includes(this.options.url)) {
        await this.page.authenticate(this.options.basicAuth)
        this.isAuthenticated = true
      }
    }

    if (this.options.trace) {
      const fileName = `${`${store.outputDir}${path.sep}trace${path.sep}${uuidv4()}_${clearString(this.currentRunningTest.title)}`.slice(0, 245)}.json`
      const dir = path.dirname(fileName)
      if (!fileExists(dir)) fs.mkdirSync(dir)
      await this.page.tracing.start({ screenshots: true, path: fileName })
      this.currentRunningTest.artifacts.trace = fileName
    }

    try {
      await this.page.goto(url, { waitUntil: this.options.waitForNavigation })
    } catch (err) {
      // Handle terminal navigation errors that shouldn't be retried
      if (
        err.message &&
        (err.message.includes('ERR_ABORTED') || err.message.includes('frame was detached') || err.message.includes('Target page, context or browser has been closed') || err.message.includes('Navigation timeout'))
      ) {
        // Mark this as a terminal error to prevent retries
        const terminalError = new Error(err.message)
        terminalError.isTerminal = true
        throw terminalError
      }
      throw err
    }

    const performanceTiming = JSON.parse(await this.page.evaluate(() => JSON.stringify(window.performance.timing)))

    perfTiming = this._extractDataFromPerformanceTiming(performanceTiming, 'responseEnd', 'domInteractive', 'domContentLoadedEventEnd', 'loadEventEnd')

    return this._waitForAction()
  }

  /**
   *
   * Unlike other drivers Puppeteer changes the size of a viewport, not the window!
   * Puppeteer does not control the window of a browser, so it can't adjust its real size.
   * It also can't maximize a window.
   *
   * {{> resizeWindow }}
   *
   */
  async resizeWindow(width, height) {
    if (width === 'maximize') {
      throw new Error("Puppeteer can't control windows, so it can't maximize it")
    }

    await this.page.setViewport({ width, height })
    return this._waitForAction()
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
      throw new Error('Cannot send empty headers.')
    }
    return this.page.setExtraHTTPHeaders(customHeaders)
  }

  /**
   * {{> moveCursorTo }}
   */
  async moveCursorTo(locator, offsetX = 0, offsetY = 0) {
    let context = null
    if (typeof offsetX !== 'number') {
      context = offsetX
      offsetX = 0
    }

    let el
    if (context) {
      const contextEls = await findElements.call(this, this.page, context)
      assertElementExists(contextEls, context, 'Context element')
      const els = await findElements.call(this, contextEls[0], locator)
      if (!els || els.length === 0) {
        throw new ElementNotFound(locator, 'Element to move cursor to')
      }
      el = els[0]
    } else {
      el = await this._locateElement(locator)
      if (!el) {
        throw new ElementNotFound(locator, 'Element to move cursor to')
      }
    }

    // Use manual mouse.move instead of .hover() so the offset can be added to the coordinates
    const { x, y } = await getClickablePoint(el)
    await this.page.mouse.move(x + offsetX, y + offsetY)
    return this._waitForAction()
  }

  /**
   * {{> focus }}
   *
   */
  async focus(locator) {
    const el = await this._locateElement(locator)
    if (!el) {
      throw new ElementNotFound(locator, 'Element to focus')
    }

    await el.click()
    await el.focus()
    return this._waitForAction()
  }

  /**
   * {{> blur }}
   *
   */
  async blur(locator) {
    const el = await this._locateElement(locator)
    if (!el) {
      throw new ElementNotFound(locator, 'Element to blur')
    }

    await blurElement(el, this.page)
    return this._waitForAction()
  }

  /**
   * {{> dragAndDrop }}
   */
  async dragAndDrop(srcElement, destElement) {
    return proceedDragAndDrop.call(this, srcElement, destElement)
  }

  /**
   * {{> refreshPage }}
   */
  async refreshPage() {
    return this.page.reload({ timeout: this.options.getPageTimeout, waitUntil: this.options.waitForNavigation })
  }

  /**
   * {{> scrollPageToTop }}
   */
  scrollPageToTop() {
    return this.executeScript(() => {
      window.scrollTo(0, 0)
    })
  }

  /**
   * {{> scrollPageToBottom }}
   */
  scrollPageToBottom() {
    return this.executeScript(() => {
      const body = document.body
      const html = document.documentElement
      window.scrollTo(0, Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight))
    })
  }

  /**
   * {{> scrollTo }}
   */
  async scrollTo(locator, offsetX = 0, offsetY = 0) {
    if (typeof locator === 'number' && typeof offsetX === 'number') {
      offsetY = offsetX
      offsetX = locator
      locator = null
    }

    if (locator) {
      const el = await this._locateElement(locator)
      if (!el) {
        throw new ElementNotFound(locator, 'Element to scroll into view')
      }
      await el.evaluate(el => el.scrollIntoView())
      const elementCoordinates = await getClickablePoint(el)
      await this.executeScript((x, y) => window.scrollBy(x, y), elementCoordinates.x + offsetX, elementCoordinates.y + offsetY)
    } else {
      await this.executeScript((x, y) => window.scrollTo(x, y), offsetX, offsetY)
    }
    return this._waitForAction()
  }

  /**
   * {{> seeInTitle }}
   */
  async seeInTitle(text) {
    const title = await this.page.title()
    stringIncludes('web page title').assert(text, title)
  }

  /**
   * {{> grabPageScrollPosition }}
   */
  async grabPageScrollPosition() {
    function getScrollPosition() {
      return {
        x: window.pageXOffset,
        y: window.pageYOffset,
      }
    }

    return this.executeScript(getScrollPosition)
  }

  /**
   * {{> seeTitleEquals }}
   */
  async seeTitleEquals(text) {
    const title = await this.page.title()
    return equals('web page title').assert(title, text)
  }

  /**
   * {{> dontSeeInTitle }}
   */
  async dontSeeInTitle(text) {
    const title = await this.page.title()
    stringIncludes('web page title').negate(text, title)
  }

  /**
   * {{> grabTitle }}
   */
  async grabTitle() {
    return this.page.title()
  }

  /**
   * Get elements by different locator types, including strict locator
   * Should be used in custom helpers:
   *
   * ```js
   * const elements = await this.helpers['Puppeteer']._locate({name: 'password'});
   * ```
   *
   */
  async _locate(locator) {
    const context = await this.context
    return findElements.call(this, context, locator)
  }

  /**
   * Get single element by different locator types, including strict locator
   * Should be used in custom helpers:
   *
   * ```js
   * const element = await this.helpers['Puppeteer']._locateElement({name: 'password'});
   * ```
   *
   */
  async _locateElement(locator) {
    const context = await this.context
    const elementIndex = store.currentStep?.opts?.elementIndex
    if (this.options.strict || elementIndex) {
      const elements = await findElements.call(this, context, locator)
      if (elements.length === 0) {
        throw new ElementNotFound(locator, 'Element', 'was not found')
      }
      return selectElement(elements, locator, this)
    }
    return findElement.call(this, context, locator)
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
    const context = providedContext || (await this._getContext())
    const els = await findCheckable.call(this, locator, context)
    if (!els || els.length === 0) {
      throw new ElementNotFound(locator, 'Checkbox or radio')
    }
    return selectElement(els, locator, this)
  }

  /**
   * Find a clickable element by providing human-readable text:
   *
   * ```js
   * this.helpers['Puppeteer']._locateClickable('Next page').then // ...
   * ```
   */
  async _locateClickable(locator) {
    const context = await this.context
    return findClickable.call(this, context, locator)
  }

  /**
   * Find field elements by providing human-readable text:
   *
   * ```js
   * this.helpers['Puppeteer']._locateFields('Your email').then // ...
   * ```
   */
  async _locateFields(locator) {
    return findFields.call(this, locator)
  }

  /**
   * {{> grabWebElements }}
   *
   */
  async grabWebElements(locator) {
    const elements = await this._locate(locator)
    return elements.map(element => new WebElement(element, this))
  }

  /**
   * {{> grabWebElement }}
   *
   */
  async grabWebElement(locator) {
    const elements = await this._locate(locator)
    if (elements.length === 0) {
      throw new ElementNotFound(locator, 'Element')
    }
    return new WebElement(elements[0], this)
  }

  async grabWebElement(locator) {
    const els = await this._locate(locator)
    assertElementExists(els, locator)
    return els[0]
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
    const pages = await this.browser.pages()
    const index = pages.indexOf(this.page)
    this.withinLocator = null
    const page = pages[index + num]

    if (!page) {
      throw new Error(`There is no ability to switch to next tab with offset ${num}`)
    }

    await this._setPage(page)
    return this._waitForAction()
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
    const pages = await this.browser.pages()
    const index = pages.indexOf(this.page)
    this.withinLocator = null
    const page = pages[index - num]

    if (!page) {
      throw new Error(`There is no ability to switch to previous tab with offset ${num}`)
    }

    await this._setPage(page)
    return this._waitForAction()
  }

  /**
   * Close current tab and switches to previous.
   *
   * ```js
   * I.closeCurrentTab();
   * ```
   */
  async closeCurrentTab() {
    const oldPage = this.page
    await this.switchToPreviousTab()
    await oldPage.close()
    return this._waitForAction()
  }

  /**
   * Close all tabs except for the current one.
   *
   * ```js
   * I.closeOtherTabs();
   * ```
   */
  async closeOtherTabs() {
    const pages = await this.browser.pages()
    const otherPages = pages.filter(page => page !== this.page)

    let p = Promise.resolve()
    otherPages.forEach(page => {
      p = p.then(() => page.close())
    })
    await p
    return this._waitForAction()
  }

  /**
   * Open new tab and switch to it
   *
   * ```js
   * I.openNewTab();
   * ```
   */
  async openNewTab() {
    await this._setPage(await this.browser.newPage())
    return this._waitForAction()
  }

  /**
   * {{> grabNumberOfOpenTabs }}
   */
  async grabNumberOfOpenTabs() {
    const pages = await this.browser.pages()
    return pages.length
  }

  /**
   * {{> seeElement }}
   */
  async seeElement(locator, context = null) {
    let els
    if (context) {
      const contextPage = await this.context
      const contextEls = await findElements.call(this, contextPage, context)
      assertElementExists(contextEls, context, 'Context element')
      els = await findElements.call(this, contextEls[0], locator)
    } else {
      els = await this._locate(locator)
    }
    els = (await Promise.all(els.map(el => el.boundingBox() && el))).filter(v => v)
    // Puppeteer visibility was ignored? | Remove when Puppeteer is fixed
    els = await Promise.all(els.map(async el => (await el.evaluate(node => window.getComputedStyle(node).visibility !== 'hidden' && window.getComputedStyle(node).display !== 'none')) && el))
    try {
      return empty('visible elements').negate(els.filter(v => v).fill('ELEMENT'))
    } catch (e) {
      dontSeeElementError(locator)
    }
  }

  /**
   * {{> dontSeeElement }}
   */
  async dontSeeElement(locator, context = null) {
    let els
    if (context) {
      const contextPage = await this.context
      const contextEls = await findElements.call(this, contextPage, context)
      assertElementExists(contextEls, context, 'Context element')
      els = await findElements.call(this, contextEls[0], locator)
    } else {
      els = await this._locate(locator)
    }
    els = (await Promise.all(els.map(el => el.boundingBox() && el))).filter(v => v)
    // Puppeteer visibility was ignored? | Remove when Puppeteer is fixed
    els = await Promise.all(els.map(async el => (await el.evaluate(node => window.getComputedStyle(node).visibility !== 'hidden' && window.getComputedStyle(node).display !== 'none')) && el))
    try {
      return empty('visible elements').assert(els.filter(v => v).fill('ELEMENT'))
    } catch (e) {
      seeElementError(locator)
    }
  }

  /**
   * {{> seeElementInDOM }}
   */
  async seeElementInDOM(locator) {
    const els = await this._locate(locator)
    try {
      return empty('elements on page').negate(els.filter(v => v).fill('ELEMENT'))
    } catch (e) {
      dontSeeElementInDOMError(locator)
    }
  }

  /**
   * {{> dontSeeElementInDOM }}
   */
  async dontSeeElementInDOM(locator) {
    const els = await this._locate(locator)
    try {
      return empty('elements on a page').assert(els.filter(v => v).fill('ELEMENT'))
    } catch (e) {
      seeElementInDOMError(locator)
    }
  }

  /**
   * {{> click }}
   *
   */
  async click(locator = '//body', context = null) {
    return proceedClick.call(this, locator, context)
  }

  /**
   * {{> forceClick }}
   *
   */
  async forceClick(locator, context = null) {
    let matcher = await this.context
    if (context) {
      const els = await this._locate(context)
      assertElementExists(els, context)
      matcher = els[0]
    }

    const els = await findClickable.call(this, matcher, locator)
    if (context) {
      assertElementExists(els, locator, 'Clickable element', `was not found inside element ${new Locator(context).toString()}`)
    } else {
      assertElementExists(els, locator, 'Clickable element')
    }
    const elem = els[0]
    return this.executeScript(el => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
      const event = document.createEvent('MouseEvent')
      event.initEvent('click', true, true)
      return el.dispatchEvent(event)
    }, elem)
  }

  /**
   * {{> clickLink }}
   *
   */
  async clickLink(locator, context = null) {
    return proceedClick.call(this, locator, context, { waitForNavigation: true })
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
    downloadPath = path.join(store.outputDir, downloadPath)
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath, '0777')
    }
    fsExtra.emptyDirSync(downloadPath)

    try {
      return this.page._client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath })
    } catch (e) {
      return this.page._client().send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath })
    }
  }

  /**
   * This method is **deprecated**.
   *
   * Please use `handleDownloads()` instead.
   */
  async downloadFile(locator, customName) {
    let fileName
    await this.page.setRequestInterception(true)

    const xRequest = await new Promise(resolve => {
      this.page.on('request', request => {
        console.log('rq', request, customName)
        const grabbedFileName = request.url().split('/')[request.url().split('/').length - 1]
        const fileExtension = request.url().split('/')[request.url().split('/').length - 1].split('.')[1]
        console.log('nm', customName, fileExtension)
        if (customName && path.extname(customName) !== fileExtension) {
          console.log('bypassing a request')
          request.continue()
          return
        }
        customName ? (fileName = `${customName}.${fileExtension}`) : (fileName = grabbedFileName)
        request.abort()
        resolve(request)
      })
    })

    await this.click(locator)

    const options = {
      encoding: null,
      method: xRequest._method,
      uri: xRequest._url,
      body: xRequest._postData,
      headers: xRequest._headers,
    }

    const cookies = await this.page.cookies()
    options.headers.Cookie = cookies.map(ck => `${ck.name}=${ck.value}`).join(';')

    const response = await axios({
      method: options.method,
      url: options.uri,
      headers: options.headers,
      responseType: 'arraybuffer',
      onDownloadProgress(e) {
        console.log('+', e)
      },
    })

    const outputFile = path.join(`${store.outputDir}/${fileName}`)

    try {
      await new Promise((resolve, reject) => {
        const wstream = fs.createWriteStream(outputFile)
        console.log(response)
        wstream.write(response.data)
        wstream.end()
        this.debug(`File is downloaded in ${outputFile}`)
        wstream.on('finish', () => {
          resolve(fileName)
        })
        wstream.on('error', reject)
      })
    } catch (error) {
      throw new Error(`There is something wrong with downloaded file. ${error}`)
    }
  }

  /**
   * {{> doubleClick }}
   *
   */
  async doubleClick(locator, context = null) {
    return proceedClick.call(this, locator, context, { clickCount: 2 })
  }

  /**
   * {{> rightClick }}
   *
   */
  async rightClick(locator, context = null) {
    return proceedClick.call(this, locator, context, { button: 'right' })
  }

  /**
   * Performs click at specific coordinates.
   * If locator is provided, the coordinates are relative to the element.
   * If locator is not provided, the coordinates are global page coordinates.
   *
   * ```js
   * // Click at global coordinates (100, 200)
   * I.clickXY(100, 200);
   *
   * // Click at coordinates (50, 30) relative to element
   * I.clickXY('#someElement', 50, 30);
   * ```
   *
   * @param {CodeceptJS.LocatorOrString|number} locator Element to click on or X coordinate if no element.
   * @param {number} [x] X coordinate relative to element, or Y coordinate if locator is a number.
   * @param {number} [y] Y coordinate relative to element.
   * @returns {Promise<void>}
   */
  async clickXY(locator, x, y) {
    // If locator is a number, treat it as global X coordinate
    if (typeof locator === 'number') {
      const globalX = locator
      const globalY = x
      await this.page.mouse.click(globalX, globalY)
      return this._waitForAction()
    }

    // Locator is provided, click relative to element
    const els = await this._locate(locator)
    assertElementExists(els, locator, 'Element to click')

    const box = await els[0].boundingBox()
    if (!box) {
      throw new Error(`Element ${locator} is not visible or has no bounding box`)
    }

    const absoluteX = box.x + x
    const absoluteY = box.y + y

    await this.page.mouse.click(absoluteX, absoluteY)
    return this._waitForAction()
  }

  /**
   * {{> checkOption }}
   */
  async checkOption(field, context = null) {
    const elm = await this._locateCheckable(field, context)
    let curentlyChecked = await elm
      .getProperty('checked')
      .then(checkedProperty => checkedProperty.jsonValue())
      .catch(() => null)

    if (!curentlyChecked) {
      const ariaChecked = await elm.evaluate(el => el.getAttribute('aria-checked'))
      curentlyChecked = ariaChecked === 'true'
    }

    if (!curentlyChecked) {
      await elm.click()
      return this._waitForAction()
    }
  }

  /**
   * {{> uncheckOption }}
   */
  async uncheckOption(field, context = null) {
    const elm = await this._locateCheckable(field, context)
    let curentlyChecked = await elm
      .getProperty('checked')
      .then(checkedProperty => checkedProperty.jsonValue())
      .catch(() => null)

    if (!curentlyChecked) {
      const ariaChecked = await elm.evaluate(el => el.getAttribute('aria-checked'))
      curentlyChecked = ariaChecked === 'true'
    }

    if (curentlyChecked) {
      await elm.click()
      return this._waitForAction()
    }
  }

  /**
   * {{> seeCheckboxIsChecked }}
   */
  async seeCheckboxIsChecked(field) {
    return proceedIsChecked.call(this, 'assert', field)
  }

  /**
   * {{> dontSeeCheckboxIsChecked }}
   */
  async dontSeeCheckboxIsChecked(field) {
    return proceedIsChecked.call(this, 'negate', field)
  }

  /**
   * {{> pressKeyDown }}
   */
  async pressKeyDown(key) {
    key = getNormalizedKey.call(this, key)
    await this.page.keyboard.down(key)
    return this._waitForAction()
  }

  /**
   * {{> pressKeyUp }}
   */
  async pressKeyUp(key) {
    key = getNormalizedKey.call(this, key)
    await this.page.keyboard.up(key)
    return this._waitForAction()
  }

  /**
   * _Note:_ Shortcuts like `'Meta'` + `'A'` do not work on macOS ([puppeteer/puppeteer#1313](https://github.com/puppeteer/puppeteer/issues/1313)).
   *
   * {{> pressKeyWithKeyNormalization }}
   */
  async pressKey(key) {
    await checkFocusBeforePressKey(this, key)
    const modifiers = []
    if (Array.isArray(key)) {
      for (let k of key) {
        k = getNormalizedKey.call(this, k)
        if (isModifierKey(k)) {
          modifiers.push(k)
        } else {
          key = k
          break
        }
      }
    } else {
      key = getNormalizedKey.call(this, key)
    }
    for (const modifier of modifiers) {
      await this.page.keyboard.down(modifier)
    }
    await this.page.keyboard.press(key)
    for (const modifier of modifiers) {
      await this.page.keyboard.up(modifier)
    }
    return this._waitForAction()
  }

  /**
   * {{> type }}
   */
  async type(keys, delay = null) {
    await checkFocusBeforeType(this)

    if (!Array.isArray(keys)) {
      keys = keys.toString()
      keys = keys.split('')
    }

    for (const key of keys) {
      await this.page.keyboard.press(key)
      if (delay) await this.wait(delay / 1000)
    }
  }

  /**
   * {{> fillField }}
   */
  async fillField(field, value, context = null) {
    let els = await findVisibleFields.call(this, field, context)
    if (!els.length) {
      els = await findFields.call(this, field, context)
    }
    assertElementExists(els, field, 'Field')
    const el = selectElement(els, field, this)

    if (await fillRichEditor(this, el, value)) {
      highlightActiveElement.call(this, el, await this._getContext())
      return this._waitForAction()
    }

    const tag = await el.getProperty('tagName').then(el => el.jsonValue())
    const editable = await el.getProperty('contenteditable').then(el => el.jsonValue())
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      await this._evaluateHandeInContext(el => (el.value = ''), el)
    } else if (editable) {
      await this._evaluateHandeInContext(el => (el.innerHTML = ''), el)
    }

    highlightActiveElement.call(this, el, await this._getContext())
    await el.type(value.toString(), { delay: this.options.pressKeyDelay })

    return this._waitForAction()
  }

  /**
   * {{> clearField }}
   */
  async clearField(field, context = null) {
    return this.fillField(field, '', context)
  }

  /**
   * {{> appendField }}
   *
   */
  async appendField(field, value, context = null) {
    const els = await findVisibleFields.call(this, field, context)
    assertElementExists(els, field, 'Field')
    const el = selectElement(els, field, this)
    highlightActiveElement.call(this, el, await this._getContext())
    await el.press('End')
    await el.type(value.toString(), { delay: this.options.pressKeyDelay })
    return this._waitForAction()
  }

  /**
   * {{> seeInField }}
   */
  async seeInField(field, value, context = null) {
    const _value = typeof value === 'boolean' ? value : value.toString()
    return proceedSeeInField.call(this, 'assert', field, _value, context)
  }

  /**
   * {{> dontSeeInField }}
   */
  async dontSeeInField(field, value, context = null) {
    const _value = typeof value === 'boolean' ? value : value.toString()
    return proceedSeeInField.call(this, 'negate', field, _value, context)
  }

  /**
   * > ⚠ There is an [issue with file upload in Puppeteer 2.1.0 & 2.1.1](https://github.com/puppeteer/puppeteer/issues/5420), downgrade to 2.0.0 if you face it.
   *
   * {{> attachFile }}
   */
  async attachFile(locator, pathToFile, context = null) {
    const file = path.join(store.codeceptDir, pathToFile)

    if (!fileExists(file)) {
      throw new Error(`File at ${file} can not be found on local system`)
    }
    const els = await findFields.call(this, locator, context)
    if (els.length) {
      const el = selectElement(els, locator, this)
      const tag = await el.evaluate(el => el.tagName)
      const type = await el.evaluate(el => el.type)
      if (tag === 'INPUT' && type === 'file') {
        await el.uploadFile(file)
        return this._waitForAction()
      }
    }

    const targetEls = els.length ? els : await this._locate(locator)
    assertElementExists(targetEls, locator, 'Element')
    const el = selectElement(targetEls, locator, this)
    const fileData = {
      base64Content: base64EncodeFile(file),
      fileName: path.basename(file),
      mimeType: getMimeType(path.basename(file)),
    }
    await el.evaluate(dropFile, fileData)
    return this._waitForAction()
  }

  /**
   * {{> selectOption }}
   */
  async selectOption(select, option, context = null) {
    const pageContext = await this._getContext()
    const matchedLocator = new Locator(select)

    let contextEl
    if (context) {
      const contextEls = await findElements.call(this, pageContext, context)
      assertElementExists(contextEls, context, 'Context element')
      contextEl = contextEls[0]
    }

    // Strict locator
    if (!matchedLocator.isFuzzy()) {
      this.debugSection('SelectOption', `Strict: ${JSON.stringify(select)}`)
      const els = contextEl ? await findElements.call(this, contextEl, select) : await this._locate(select)
      assertElementExists(els, select, 'Selectable element')
      return proceedSelect.call(this, pageContext, selectElement(els, select, this), option)
    }

    // Fuzzy: try combobox
    this.debugSection('SelectOption', `Fuzzy: "${matchedLocator.value}"`)
    const comboboxSearchCtx = contextEl || pageContext
    let els = await findByRole(comboboxSearchCtx, { role: 'combobox', name: matchedLocator.value })
    if (els?.length) return proceedSelect.call(this, pageContext, selectElement(els, select, this), option)

    // Fuzzy: try listbox
    els = await findByRole(comboboxSearchCtx, { role: 'listbox', name: matchedLocator.value })
    if (els?.length) return proceedSelect.call(this, pageContext, selectElement(els, select, this), option)

    // Fuzzy: try native select
    const visibleEls = await findVisibleFields.call(this, select, context)
    assertElementExists(visibleEls, select, 'Selectable field')
    return proceedSelect.call(this, pageContext, selectElement(visibleEls, select, this), option)
  }

  /**
   * {{> grabNumberOfVisibleElements }}
   */
  async grabNumberOfVisibleElements(locator) {
    let els = await this._locate(locator)
    els = (await Promise.all(els.map(el => el.boundingBox() && el))).filter(v => v)
    // Puppeteer visibility was ignored? | Remove when Puppeteer is fixed
    els = await Promise.all(els.map(async el => (await el.evaluate(node => window.getComputedStyle(node).visibility !== 'hidden' && window.getComputedStyle(node).display !== 'none')) && el))

    return els.filter(v => v).length
  }

  /**
   * {{> seeInCurrentUrl }}
   */
  async seeInCurrentUrl(url) {
    stringIncludes('url').assert(url, await this._getPageUrl())
  }

  /**
   * {{> dontSeeInCurrentUrl }}
   */
  async dontSeeInCurrentUrl(url) {
    stringIncludes('url').negate(url, await this._getPageUrl())
  }

  /**
   * {{> seeCurrentUrlEquals }}
   */
  async seeCurrentUrlEquals(url) {
    urlEquals(this.options.url).assert(url, await this._getPageUrl())
  }

  /**
   * {{> dontSeeCurrentUrlEquals }}
   */
  async dontSeeCurrentUrlEquals(url) {
    urlEquals(this.options.url).negate(url, await this._getPageUrl())
  }

  /**
   * {{> seeCurrentPathEquals }}
   */
  async seeCurrentPathEquals(path) {
    const currentUrl = await this._getPageUrl()
    const baseUrl = this.options.url || 'http://localhost'
    const actualPath = new URL(currentUrl, baseUrl).pathname
    return equals('url path').assert(normalizePath(path), normalizePath(actualPath))
  }

  /**
   * {{> dontSeeCurrentPathEquals }}
   */
  async dontSeeCurrentPathEquals(path) {
    const currentUrl = await this._getPageUrl()
    const baseUrl = this.options.url || 'http://localhost'
    const actualPath = new URL(currentUrl, baseUrl).pathname
    return equals('url path').negate(normalizePath(path), normalizePath(actualPath))
  }

  /**
   * {{> see }}
   *
   */
  async see(text, context = null) {
    return proceedSee.call(this, 'assert', text, context)
  }

  /**
   * {{> seeTextEquals }}
   */
  async seeTextEquals(text, context = null) {
    return proceedSee.call(this, 'assert', text, context, true)
  }

  /**
   * {{> dontSee }}
   *
   */
  async dontSee(text, context = null) {
    return proceedSee.call(this, 'negate', text, context)
  }

  /**
   * {{> grabSource }}
   */
  async grabSource() {
    return this.page.content()
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
    const logs = consoleLogStore.entries
    consoleLogStore.clear()
    return logs
  }

  /**
   * {{> grabCurrentUrl }}
   */
  async grabCurrentUrl() {
    return this._getPageUrl()
  }

  /**
   * {{> seeInSource }}
   */
  async seeInSource(text) {
    const source = await this.page.content()
    stringIncludes('HTML source of a page').assert(text, source)
  }

  /**
   * {{> dontSeeInSource }}
   */
  async dontSeeInSource(text) {
    const source = await this.page.content()
    stringIncludes('HTML source of a page').negate(text, source)
  }

  /**
   * {{> seeNumberOfElements }}
   *
   */
  async seeNumberOfElements(locator, num) {
    const elements = await this._locate(locator)
    return equals(`expected number of elements (${new Locator(locator)}) is ${num}, but found ${elements.length}`).assert(elements.length, num)
  }

  /**
   * {{> seeNumberOfVisibleElements }}
   *
   */
  async seeNumberOfVisibleElements(locator, num) {
    const res = await this.grabNumberOfVisibleElements(locator)
    return equals(`expected number of visible elements (${new Locator(locator)}) is ${num}, but found ${res}`).assert(res, num)
  }

  /**
   * {{> setCookie }}
   */
  async setCookie(cookie) {
    if (Array.isArray(cookie)) {
      return this.page.setCookie(...cookie)
    }
    return this.page.setCookie(cookie)
  }

  /**
   * {{> seeCookie }}
   *
   */
  async seeCookie(name) {
    const cookies = await this.page.cookies()
    empty(`cookie ${name} to be set`).negate(cookies.filter(c => c.name === name))
  }

  /**
   * {{> dontSeeCookie }}
   */
  async dontSeeCookie(name) {
    const cookies = await this.page.cookies()
    empty(`cookie ${name} not to be set`).assert(cookies.filter(c => c.name === name))
  }

  /**
   * {{> grabCookie }}
   *
   * Returns cookie in JSON format. If name not passed returns all cookies for this domain.
   */
  async grabCookie(name) {
    const cookies = await this.page.cookies()
    if (!name) return cookies
    const cookie = cookies.filter(c => c.name === name)
    if (cookie[0]) return cookie[0]
  }

  /**
   * {{> waitForCookie }}
   */
  async waitForCookie(name, sec) {
    // by default, we will retry 3 times
    let retries = 3
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout

    if (sec) {
      retries = sec
    } else {
      retries = Math.ceil(waitTimeout / 1000) - 1
    }

    return promiseRetry(
      async (retry, number) => {
        const _grabCookie = async name => {
          const cookies = await this.page.cookies()
          const cookie = cookies.filter(c => c.name === name)
          if (cookie.length === 0) throw Error(`Cookie ${name} is not found after ${retries}s`)
        }

        this.debugSection('Wait for cookie: ', name)
        if (number > 1) this.debugSection('Retrying... Attempt #', number)

        try {
          await _grabCookie(name)
        } catch (e) {
          retry(e)
        }
      },
      { retries, maxTimeout: 1000 },
    )
  }

  /**
   * {{> clearCookie }}
   */
  async clearCookie(name) {
    const cookies = await this.page.cookies()
    if (!name) {
      return this.page.deleteCookie.apply(this.page, cookies)
    }
    const cookie = cookies.filter(c => c.name === name)
    if (!cookie[0]) return
    return this.page.deleteCookie(cookie[0])
  }

  /**
   * If a function returns a Promise, tt will wait for its resolution.
   *
   * {{> executeScript }}
   */
  async executeScript(...args) {
    let context = await this._getContext()
    if (this.context && this.context.constructor.name === 'CdpFrame') {
      context = this.context // switching to iframe context
    }
    return context.evaluate.apply(context, args)
  }

  /**
   * Asynchronous scripts can also be executed with `executeScript` if a function returns a Promise.
   * {{> executeAsyncScript }}
   */
  async executeAsyncScript(...args) {
    const asyncFn = function () {
      const args = Array.from(arguments)
      const fn = eval(`(${args.shift()})`)
      return new Promise(done => {
        args.push(done)
        fn.apply(null, args)
      })
    }
    args[0] = args[0].toString()
    args.unshift(asyncFn)
    return this.page.evaluate.apply(this.page, args)
  }

  /**
   * {{> grabTextFromAll }}
   */
  async grabTextFromAll(locator) {
    const els = await this._locate(locator)
    const texts = []
    for (const el of els) {
      texts.push(await (await el.getProperty('innerText')).jsonValue())
    }
    return texts
  }

  /**
   * {{> grabTextFrom }}
   */
  async grabTextFrom(locator) {
    const texts = await this.grabTextFromAll(locator)
    assertElementExists(texts, locator)
    if (texts.length > 1) {
      this.debugSection('GrabText', `Using first element out of ${texts.length}`)
    }

    return texts[0]
  }

  /**
   * {{> grabValueFromAll }}
   */
  async grabValueFromAll(locator) {
    const els = await findFields.call(this, locator)
    const values = []
    for (const el of els) {
      values.push(await (await el.getProperty('value')).jsonValue())
    }
    return values
  }

  /**
   * {{> grabValueFrom }}
   */
  async grabValueFrom(locator) {
    const values = await this.grabValueFromAll(locator)
    assertElementExists(values, locator)
    if (values.length > 1) {
      this.debugSection('GrabValue', `Using first element out of ${values.length}`)
    }

    return values[0]
  }

  /**
   * {{> grabHTMLFromAll }}
   */
  async grabHTMLFromAll(locator) {
    const els = await this._locate(locator)
    const values = await Promise.all(els.map(el => el.evaluate(element => element.innerHTML)))
    return values
  }

  /**
   * {{> grabHTMLFrom }}
   */
  async grabHTMLFrom(locator) {
    const html = await this.grabHTMLFromAll(locator)
    assertElementExists(html, locator)
    if (html.length > 1) {
      this.debugSection('GrabHTML', `Using first element out of ${html.length}`)
    }

    return html[0]
  }

  /**
   * {{> grabCssPropertyFromAll }}
   */
  async grabCssPropertyFromAll(locator, cssProperty) {
    const els = await this._locate(locator)
    const res = await Promise.all(els.map(el => el.evaluate(el => JSON.parse(JSON.stringify(getComputedStyle(el))))))
    const cssValues = res.map(props => props[toCamelCase(cssProperty)])

    return cssValues
  }

  /**
   * {{> grabCssPropertyFrom }}
   */
  async grabCssPropertyFrom(locator, cssProperty) {
    const cssValues = await this.grabCssPropertyFromAll(locator, cssProperty)
    assertElementExists(cssValues, locator)

    if (cssValues.length > 1) {
      this.debugSection('GrabCSS', `Using first element out of ${cssValues.length}`)
    }

    return cssValues[0]
  }

  /**
   * {{> seeCssPropertiesOnElements }}
   */
  async seeCssPropertiesOnElements(locator, cssProperties) {
    const res = await this._locate(locator)
    assertElementExists(res, locator)

    const cssPropertiesCamelCase = convertCssPropertiesToCamelCase(cssProperties)
    const elemAmount = res.length
    let props = []

    for (const element of res) {
      for (const prop of Object.keys(cssProperties)) {
        const cssProp = await this.grabCssPropertyFrom(locator, prop)
        if (isColorProperty(prop)) {
          props.push(convertColorToRGBA(cssProp))
        } else {
          props.push(cssProp)
        }
      }
    }

    const values = Object.keys(cssPropertiesCamelCase).map(key => cssPropertiesCamelCase[key])
    if (!Array.isArray(props)) props = [props]
    let chunked = chunkArray(props, values.length)
    chunked = chunked.filter(val => {
      for (let i = 0; i < val.length; ++i) {
        if (val[i] != values[i]) return false
      }
      return true
    })
    return equals(`all elements (${new Locator(locator)}) to have CSS property ${JSON.stringify(cssProperties)}`).assert(chunked.length, elemAmount)
  }

  /**
   * {{> seeAttributesOnElements }}
   */
  async seeAttributesOnElements(locator, attributes) {
    const elements = await this._locate(locator)
    assertElementExists(elements, locator)

    const expectedAttributes = Object.entries(attributes)

    const valuesPromises = elements.map(async element => {
      const elementAttributes = {}
      await Promise.all(
        expectedAttributes.map(async ([attribute, expectedValue]) => {
          const actualValue = await element.evaluate((el, attr) => el[attr] || el.getAttribute(attr), attribute)
          elementAttributes[attribute] = actualValue
        }),
      )
      return elementAttributes
    })

    const actualAttributes = await Promise.all(valuesPromises)

    const matchingElements = actualAttributes.filter(attrs =>
      expectedAttributes.every(([attribute, expectedValue]) => {
        const actualValue = attrs[attribute]
        if (!actualValue) return false
        if (actualValue.toString().match(new RegExp(expectedValue.toString()))) return true
        return expectedValue === actualValue
      }),
    )

    const elementsCount = elements.length
    const matchingCount = matchingElements.length

    return equals(`all elements (${new Locator(locator)}) to have attributes ${JSON.stringify(attributes)}`).assert(matchingCount, elementsCount)
  }

  /**
   * {{> dragSlider }}
   */
  async dragSlider(locator, offsetX = 0) {
    const src = await this._locate(locator)
    assertElementExists(src, locator, 'Slider Element')

    // Note: Using public api .getClickablePoint because the .BoundingBox does not take into account iframe offsets
    const sliderSource = await getClickablePoint(src[0])

    // Drag start point
    await this.page.mouse.move(sliderSource.x, sliderSource.y, { steps: 5 })
    await this.page.mouse.down()

    // Drag destination
    await this.page.mouse.move(sliderSource.x + offsetX, sliderSource.y, { steps: 5 })
    await this.page.mouse.up()

    await this._waitForAction()
  }

  /**
   * {{> grabAttributeFromAll }}
   */
  async grabAttributeFromAll(locator, attr) {
    const els = await this._locate(locator)
    const array = []
    for (let index = 0; index < els.length; index++) {
      const a = await this._evaluateHandeInContext((el, attr) => el[attr] || el.getAttribute(attr), els[index], attr)
      array.push(a)
    }
    return array
  }

  /**
   * {{> grabAttributeFrom }}
   */
  async grabAttributeFrom(locator, attr) {
    const attrs = await this.grabAttributeFromAll(locator, attr)
    assertElementExists(attrs, locator)
    if (attrs.length > 1) {
      this.debugSection('GrabAttribute', `Using first element out of ${attrs.length}`)
    }

    return attrs[0]
  }

  /**
   * {{> saveElementScreenshot }}
   */
  async saveElementScreenshot(locator, fileName) {
    const outputFile = screenshotOutputFolder(fileName)

    const res = await this._locate(locator)
    assertElementExists(res, locator)
    if (res.length > 1) this.debug(`[Elements] Using first element out of ${res.length}`)
    const elem = res[0]
    this.debug(`Screenshot of ${new Locator(locator)} element has been saved to ${outputFile}`)
    return elem.screenshot({ path: outputFile, type: 'png' })
  }

  /**
   * {{> saveScreenshot }}
   */
  async saveScreenshot(fileName, fullPage) {
    const fullPageOption = fullPage || this.options.fullPageScreenshots
    let outputFile = screenshotOutputFolder(fileName)

    this.debug(`Screenshot is saving to ${outputFile}`)

    // Safety check: ensure page exists and is not closed
    if (!this.page || this.page.isClosed?.()) {
      this.debugSection('Screenshot', 'Page is not available, skipping screenshot')
      return
    }

    await this.page.screenshot({
      path: outputFile,
      fullPage: fullPageOption,
      type: 'png',
    })

    if (this.activeSessionName) {
      for (const sessionName in this.sessionPages) {
        const activeSessionPage = this.sessionPages[sessionName]
        outputFile = screenshotOutputFolder(`${sessionName}_${fileName}`)

        this.debug(`${sessionName} - Screenshot is saving to ${outputFile}`)

        if (activeSessionPage && !activeSessionPage.isClosed?.()) {
          await activeSessionPage.screenshot({
            path: outputFile,
            fullPage: fullPageOption,
            type: 'png',
          })
        }
      }
    }
  }

  async _failed(test) {
    await this._withinEnd()

    if (this.options.trace) {
      await this.page.tracing.stop()
      const _traceName = this.currentRunningTest.artifacts.trace.replace('.json', '.failed.json')
      fs.renameSync(this.currentRunningTest.artifacts.trace, _traceName)
      test.artifacts.trace = _traceName
    }
  }

  async _passed(test) {
    await this._withinEnd()

    if (this.options.trace) {
      await this.page.tracing.stop()
      if (this.options.keepTraceForPassedTests) {
        const _traceName = this.currentRunningTest.artifacts.trace.replace('.json', '.passed.json')
        fs.renameSync(this.currentRunningTest.artifacts.trace, _traceName)
        test.artifacts.trace = _traceName
      } else {
        fs.unlinkSync(this.currentRunningTest.artifacts.trace)
      }
    }
  }

  /**
   * {{> wait }}
   */
  async wait(sec) {
    return new Promise(done => {
      setTimeout(done, sec * 1000)
    })
  }

  /**
   * {{> waitForEnabled }}
   */
  async waitForEnabled(locator, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout
    locator = new Locator(locator, 'css')
    await this.context
    let waiter
    const context = await this._getContext()
    if (locator.isCSS()) {
      const enabledFn = function (locator) {
        const els = document.querySelectorAll(locator)
        if (!els || els.length === 0) {
          return false
        }
        return Array.prototype.filter.call(els, el => !el.disabled).length > 0
      }
      waiter = context.waitForFunction(enabledFn, { timeout: waitTimeout }, locator.value)
    } else {
      const enabledFn = function (locator, $XPath) {
        eval($XPath)
        return $XPath(null, locator).filter(el => !el.disabled).length > 0
      }
      waiter = context.waitForFunction(enabledFn, { timeout: waitTimeout }, locator.value, $XPath.toString())
    }
    return waiter.catch(err => {
      throw new Error(`element (${locator.toString()}) still not enabled after ${waitTimeout / 1000} sec\n${err.message}`)
    })
  }

  /**
   * {{> waitForValue }}
   */
  async waitForValue(field, value, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout
    const locator = new Locator(field, 'css')
    await this.context
    let waiter
    const context = await this._getContext()
    if (locator.isCSS()) {
      const valueFn = function (locator, value) {
        const els = document.querySelectorAll(locator)
        if (!els || els.length === 0) {
          return false
        }
        return Array.prototype.filter.call(els, el => (el.value.toString() || '').indexOf(value) !== -1).length > 0
      }
      waiter = context.waitForFunction(valueFn, { timeout: waitTimeout }, locator.value, value)
    } else {
      const valueFn = function (locator, $XPath, value) {
        eval($XPath)
        return $XPath(null, locator).filter(el => (el.value || '').indexOf(value) !== -1).length > 0
      }
      waiter = context.waitForFunction(valueFn, { timeout: waitTimeout }, locator.value, $XPath.toString(), value)
    }
    return waiter.catch(err => {
      const loc = locator.toString()
      throw new Error(`element (${loc}) is not in DOM or there is no element(${loc}) with value "${value}" after ${waitTimeout / 1000} sec\n${err.message}`)
    })
  }

  /**
   * {{> waitNumberOfVisibleElements }}
   */
  async waitNumberOfVisibleElements(locator, num, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout
    locator = new Locator(locator, 'css')
    let waiter
    const context = await this._getContext()
    if (locator.isCSS()) {
      const visibleFn = function (locator, num) {
        const els = document.querySelectorAll(locator)
        if (!els || els.length === 0) {
          return false
        }
        return Array.prototype.filter.call(els, el => el.offsetParent !== null).length === num
      }
      waiter = context.waitForFunction(visibleFn, { timeout: waitTimeout }, locator.value, num)
    } else {
      const visibleFn = function (locator, $XPath, num) {
        eval($XPath)
        return $XPath(null, locator).filter(el => el.offsetParent !== null).length === num
      }
      waiter = context.waitForFunction(visibleFn, { timeout: waitTimeout }, locator.value, $XPath.toString(), num)
    }
    return waiter.catch(err => {
      throw new Error(`The number of elements (${locator.toString()}) is not ${num} after ${waitTimeout / 1000} sec\n${err.message}`)
    })
  }

  /**
   * {{> waitForClickable }}
   */
  async waitForClickable(locator, waitTimeout) {
    const el = await this._locateElement(locator)
    if (!el) {
      throw new ElementNotFound(locator, 'Element to wait for clickable')
    }

    return this.waitForFunction(isElementClickable, [el], waitTimeout).catch(async e => {
      if (/Waiting failed/i.test(e.message) || /failed: timeout/i.test(e.message)) {
        throw new Error(`element ${new Locator(locator).toString()} still not clickable after ${waitTimeout || this.options.waitForTimeout / 1000} sec`)
      } else {
        throw e
      }
    })
  }

  /**
   * {{> waitForElement }}
   */
  async waitForElement(locator, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout
    locator = new Locator(locator, 'css')

    let waiter
    const context = await this._getContext()
    if (locator.isCSS()) {
      waiter = context.waitForSelector(locator.simplify(), { timeout: waitTimeout })
    } else {
      waiter = _waitForElement.call(this, locator, { timeout: waitTimeout })
    }
    return waiter.catch(err => {
      throw new Error(`element (${locator.toString()}) still not present on page after ${waitTimeout / 1000} sec\n${err.message}`)
    })
  }

  /**
   * {{> waitForVisible }}
   *
   */
  async waitForVisible(locator, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout
    locator = new Locator(locator, 'css')
    await this.context
    let waiter
    const context = await this._getContext()
    if (locator.isCSS()) {
      waiter = context.waitForSelector(locator.simplify(), { timeout: waitTimeout, visible: true })
    } else {
      waiter = _waitForElement.call(this, locator, { timeout: waitTimeout, visible: true })
    }
    return waiter.catch(err => {
      throw new Error(`element (${locator.toString()}) still not visible after ${waitTimeout / 1000} sec\n${err.message}`)
    })
  }

  /**
   * {{> waitForInvisible }}
   */
  async waitForInvisible(locator, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout
    locator = new Locator(locator, 'css')
    await this.context
    let waiter
    const context = await this._getContext()
    if (locator.isCSS()) {
      waiter = context.waitForSelector(locator.simplify(), { timeout: waitTimeout, hidden: true })
    } else {
      waiter = _waitForElement.call(this, locator, { timeout: waitTimeout, hidden: true })
    }
    return waiter.catch(err => {
      throw new Error(`element (${locator.toString()}) still visible after ${waitTimeout / 1000} sec\n${err.message}`)
    })
  }

  /**
   * {{> waitToHide }}
   */
  async waitToHide(locator, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout
    locator = new Locator(locator, 'css')
    let waiter
    const context = await this._getContext()
    if (locator.isCSS()) {
      waiter = context.waitForSelector(locator.simplify(), { timeout: waitTimeout, hidden: true })
    } else {
      waiter = _waitForElement.call(this, locator, { timeout: waitTimeout, hidden: true })
    }
    return waiter.catch(err => {
      throw new Error(`element (${locator.toString()}) still not hidden after ${waitTimeout / 1000} sec\n${err.message}`)
    })
  }

  /**
   * {{> waitForNumberOfTabs }}
   */
  async waitForNumberOfTabs(expectedTabs, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout
    let currentTabs
    let count = 0

    do {
      currentTabs = await this.grabNumberOfOpenTabs()
      await this.wait(1)
      count += 1000
      if (currentTabs >= expectedTabs) return
    } while (count <= waitTimeout)

    throw new Error(`Expected ${expectedTabs} tabs are not met after ${waitTimeout / 1000} sec.`)
  }

  async _getContext() {
    if (this.context && this.context.constructor.name === 'CdpFrame') {
      return this.context
    }
    return this.page
  }

  /**
   * {{> waitInUrl }}
   */
  async waitInUrl(urlPart, sec = null) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout
    const expectedUrl = resolveUrl(urlPart, this.options.url)

    return this.page
      .waitForFunction(
        urlPart => {
          const currUrl = decodeURIComponent(decodeURIComponent(decodeURIComponent(window.location.href)))
          return currUrl.indexOf(urlPart) > -1
        },
        { timeout: waitTimeout },
        expectedUrl,
      )
      .catch(async e => {
        const currUrl = await this._getPageUrl()
        if (/Waiting failed:/i.test(e.message) || /failed: timeout/i.test(e.message)) {
          throw new Error(`expected url to include ${expectedUrl}, but found ${currUrl}`)
        } else {
          throw e
        }
      })
  }

  /**
   * {{> waitUrlEquals }}
   */
  async waitUrlEquals(urlPart, sec = null) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout
    const expectedUrl = resolveUrl(urlPart, this.options.url)

    return this.page
      .waitForFunction(
        url => {
          const currUrl = decodeURIComponent(window.location.href)
          return currUrl === url
        },
        { timeout: waitTimeout },
        expectedUrl,
      )
      .catch(async e => {
        const currUrl = await this._getPageUrl()
        if (/Waiting failed/i.test(e.message) || /failed: timeout/i.test(e.message)) {
          throw new Error(`expected url to be ${expectedUrl}, but found ${currUrl}`)
        } else {
          throw e
        }
      })
  }

  /**
   * {{> waitCurrentPathEquals }}
   */
  async waitCurrentPathEquals(path, sec = null) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout
    const normalizedPath = normalizePath(path)

    return this.page
      .waitForFunction(
        expectedPath => {
          const actualPath = window.location.pathname
          const normalizePath = p => (p === '' || p === '/' ? '/' : p.replace(/\/+/g, '/').replace(/\/$/, '') || '/')
          return normalizePath(actualPath) === expectedPath
        },
        { timeout: waitTimeout },
        normalizedPath,
      )
      .catch(async e => {
        const currUrl = await this._getPageUrl()
        const baseUrl = this.options.url || 'http://localhost'
        const actualPath = new URL(currUrl, baseUrl).pathname
        if (/Waiting failed/i.test(e.message) || /failed: timeout/i.test(e.message)) {
          throw new Error(`expected path to be ${normalizedPath}, but found ${normalizePath(actualPath)}`)
        } else {
          throw e
        }
      })
  }

  /**
   * {{> waitForText }}
   */
  async waitForText(text, sec = null, context = null) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout
    let waiter

    const contextObject = await this._getContext()

    if (context) {
      const locator = new Locator(context, 'css')
      if (locator.isCSS()) {
        waiter = contextObject.waitForFunction(
          (locator, text) => {
            const el = document.querySelector(locator)
            if (!el) return false
            return el.innerText.indexOf(text) > -1
          },
          { timeout: waitTimeout },
          locator.value,
          text,
        )
      }

      if (locator.isXPath()) {
        waiter = contextObject.waitForFunction(
          (locator, text, $XPath) => {
            eval($XPath)
            const el = $XPath(null, locator)
            if (!el.length) return false
            return el[0].innerText.indexOf(text) > -1
          },
          { timeout: waitTimeout },
          locator.value,
          text,
          $XPath.toString(),
        )
      }
    } else {
      waiter = contextObject.waitForFunction(text => document.body && document.body.innerText.indexOf(text) > -1, { timeout: waitTimeout }, text)
    }

    return waiter.catch(err => {
      throw new Error(`Text "${text}" was not found on page after ${waitTimeout / 1000} sec\n${err.message}`)
    })
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
    const timeout = sec ? sec * 1000 : this.options.waitForTimeout
    return this.page.waitForRequest(urlOrPredicate, { timeout })
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
    const timeout = sec ? sec * 1000 : this.options.waitForTimeout
    return this.page.waitForResponse(urlOrPredicate, { timeout })
  }

  /**
   * {{> switchTo }}
   */
  async switchTo(locator) {
    if (Number.isInteger(locator)) {
      // Select by frame index of current context
      let frames = []
      if (this.context && typeof this.context.childFrames === 'function') {
        frames = await this.context.childFrames()
      } else {
        frames = await this.page.mainFrame().childFrames()
      }

      if (locator >= 0 && locator < frames.length) {
        this.context = frames[locator]
      } else {
        throw new Error('Frame index out of bounds')
      }
      return
    }

    if (!locator) {
      this.context = await this.page.mainFrame()
      return
    }

    // Select iframe by selector
    const els = await this._locate(locator)
    assertElementExists(els, locator)

    const iframeElement = els[0]
    const contentFrame = await iframeElement.contentFrame()

    if (contentFrame) {
      this.context = contentFrame
    } else {
      throw new Error('Element "#invalidIframeSelector" was not found by text|CSS|XPath')
    }
  }

  /**
   * {{> waitForFunction }}
   */
  async waitForFunction(fn, argsOrSec = null, sec = null) {
    let args = []
    if (argsOrSec) {
      if (Array.isArray(argsOrSec)) {
        args = argsOrSec
      } else if (typeof argsOrSec === 'number') {
        sec = argsOrSec
      }
    }
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout
    const context = await this._getContext()
    return context.waitForFunction(fn, { timeout: waitTimeout }, ...args)
  }

  /**
   * Waits for navigation to finish. By default, takes configured `waitForNavigation` option.
   *
   * See [Puppeteer's reference](https://github.com/puppeteer/puppeteer/blob/main/docs/api/puppeteer.page.waitfornavigation.md)
   *
   * @param {*} opts
   */
  async waitForNavigation(opts = {}) {
    opts = {
      timeout: this.options.getPageTimeout,
      waitUntil: this.options.waitForNavigation,
      ...opts,
    }
    return this.page.waitForNavigation(opts)
  }

  async waitUntilExists(locator, sec) {
    console.log(`waitUntilExists deprecated:
    * use 'waitForElement' to wait for element to be attached
    * use 'waitForDetached to wait for element to be removed'`)
    return this.waitForDetached(locator, sec)
  }

  /**
   * {{> waitForDetached }}
   */
  async waitForDetached(locator, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout
    locator = new Locator(locator, 'css')

    let waiter
    const context = await this._getContext()
    if (locator.isCSS()) {
      const visibleFn = function (locator) {
        return document.querySelector(locator) === null
      }
      waiter = context.waitForFunction(visibleFn, { timeout: waitTimeout }, locator.value)
    } else {
      const visibleFn = function (locator, $XPath) {
        eval($XPath)
        return $XPath(null, locator).length === 0
      }
      waiter = context.waitForFunction(visibleFn, { timeout: waitTimeout }, locator.value, $XPath.toString())
    }
    return waiter.catch(err => {
      throw new Error(`element (${locator.toString()}) still on page after ${waitTimeout / 1000} sec\n${err.message}`)
    })
  }

  async _waitForAction() {
    return this.wait(this.options.waitForAction / 1000)
  }

  /**
   * {{> grabDataFromPerformanceTiming }}
   */
  async grabDataFromPerformanceTiming() {
    return perfTiming
  }

  /**
   * {{> grabElementBoundingRect }}
   */
  async grabElementBoundingRect(locator, prop) {
    const els = await this._locate(locator)
    assertElementExists(els, locator)
    const rect = await els[0].boundingBox()
    if (prop) return rect[prop]
    return rect
  }

  /**
   * Mocks network request using [`Request Interception`](https://pptr.dev/guides/network-interception)
   *
   * ```js
   * I.mockRoute(/(\.png$)|(\.jpg$)/, route => route.abort());
   * ```
   * This method allows intercepting and mocking requests & responses. [Learn more about it](https://pptr.dev/guides/network-interception)
   *
   * @param {string|RegExp} [url] URL, regex or pattern for to match URL
   * @param {function} [handler] a function to process request
   */
  async mockRoute(url, handler) {
    await this.page.setRequestInterception(true)

    this.page.on('request', interceptedRequest => {
      if (interceptedRequest.url().match(url)) {
        // @ts-ignore
        handler(interceptedRequest)
      } else {
        interceptedRequest.continue()
      }
    })
  }

  /**
   * Stops network mocking created by `mockRoute`.
   *
   * ```js
   * I.stopMockingRoute(/(\.png$)|(\.jpg$)/);
   * ```
   *
   * @param {string|RegExp} [url] URL, regex or pattern for to match URL
   */
  async stopMockingRoute(url) {
    await this.page.setRequestInterception(true)

    this.page.off('request')

    // Resume normal request handling for the given URL
    this.page.on('request', interceptedRequest => {
      if (interceptedRequest.url().includes(url)) {
        interceptedRequest.continue()
      } else {
        interceptedRequest.continue()
      }
    })
  }

  /**
   *
   * {{> flushNetworkTraffics }}
   */
  flushNetworkTraffics() {
    flushNetworkTraffics.call(this)
  }

  /**
   *
   * {{> stopRecordingTraffic }}
   */
  async stopRecordingTraffic() {
    await this.page.setRequestInterception(false)
    stopRecordingTraffic.call(this)
  }

  /**
   * {{> startRecordingTraffic }}
   *
   */
  async startRecordingTraffic() {
    this.flushNetworkTraffics()
    this.recording = true
    this.recordedAtLeastOnce = true

    await this.page.setRequestInterception(true)

    this.page.on('request', request => {
      const information = {
        url: request.url(),
        method: request.method(),
        requestHeaders: request.headers(),
        requestPostData: request.postData(),
        response: request.response(),
      }

      this.debugSection('REQUEST: ', JSON.stringify(information))

      if (typeof information.requestPostData === 'object') {
        information.requestPostData = JSON.parse(information.requestPostData)
      }
      request.continue()
      this.requests.push(information)
    })
  }

  /**
   *
   * {{> grabRecordedNetworkTraffics }}
   */
  async grabRecordedNetworkTraffics() {
    return grabRecordedNetworkTraffics.call(this)
  }

  /**
   *
   * {{> seeTraffic }}
   */
  async seeTraffic({ name, url, parameters, requestPostData, timeout = 10 }) {
    await seeTraffic.call(this, ...arguments)
  }

  /**
   *
   * {{> dontSeeTraffic }}
   *
   */
  dontSeeTraffic({ name, url }) {
    dontSeeTraffic.call(this, ...arguments)
  }

  async getNewCDPSession() {
    const client = await this.page.target().createCDPSession()
    return client
  }

  /**
   * {{> startRecordingWebSocketMessages }}
   */
  async startRecordingWebSocketMessages() {
    this.flushWebSocketMessages()
    this.recordingWebSocketMessages = true
    this.recordedWebSocketMessagesAtLeastOnce = true

    this.cdpSession = await this.getNewCDPSession()
    await this.cdpSession.send('Network.enable')
    await this.cdpSession.send('Page.enable')

    this.cdpSession.on('Network.webSocketFrameReceived', payload => {
      this._logWebsocketMessages(this._getWebSocketLog('RECEIVED', payload))
    })

    this.cdpSession.on('Network.webSocketFrameSent', payload => {
      this._logWebsocketMessages(this._getWebSocketLog('SENT', payload))
    })

    this.cdpSession.on('Network.webSocketFrameError', payload => {
      this._logWebsocketMessages(this._getWebSocketLog('ERROR', payload))
    })
  }

  /**
   * {{> stopRecordingWebSocketMessages }}
   */
  async stopRecordingWebSocketMessages() {
    await this.cdpSession.send('Network.disable')
    await this.cdpSession.send('Page.disable')
    this.page.removeAllListeners('Network')
    this.recordingWebSocketMessages = false
  }

  /**
   *  Grab the recording WS messages
   *
   * @return { Array<any>|undefined }
   *
   */
  grabWebSocketMessages() {
    if (!this.recordingWebSocketMessages) {
      if (!this.recordedWebSocketMessagesAtLeastOnce) {
        throw new Error('Failure in test automation. You use "I.grabWebSocketMessages", but "I.startRecordingWebSocketMessages" was never called before.')
      }
    }
    return this.webSocketMessages
  }

  /**
   * Resets all recorded WS messages.
   */
  flushWebSocketMessages() {
    this.webSocketMessages = []
  }

  _getWebSocketMessage(payload) {
    if (payload.errorMessage) {
      return payload.errorMessage
    }

    return payload.response.payloadData
  }

  _getWebSocketLog(prefix, payload) {
    return `${prefix} ID: ${payload.requestId} TIMESTAMP: ${payload.timestamp} (${new Date().toISOString()})\n\n${this._getWebSocketMessage(payload)}\n\n`
  }

  _logWebsocketMessages(message) {
    this.webSocketMessages.push(message)
  }
}

export default Puppeteer

/**
 * Find elements using Puppeteer's native element discovery methods
 * Note: Unlike Playwright, Puppeteer's Locator API doesn't have .all() method for multiple elements
 * @param {Object} matcher - Puppeteer context to search within
 * @param {Object|string} locator - Locator specification
 * @returns {Promise<Array>} Array of ElementHandle objects
 */
async function findElements(matcher, locator) {
  locator = new Locator(locator, 'css')

  // Check if locator is a role locator and call findByRole
  if (locator.isRole()) return findByRole.call(this, matcher, locator)

  // Handle shadow DOM locators with >>> deep descendant combinator
  // { shadow: ['my-app', 'recipe-hello', 'button'] } => 'my-app >>> recipe-hello >>> button'
  if (locator.isShadow()) {
    const shadowSelector = locator.value.join(' >>> ')
    return matcher.$$(shadowSelector)
  }

  // Use proven legacy approach - Puppeteer Locator API doesn't have .all() method
  if (!locator.isXPath()) return matcher.$$(locator.simplify())
  
  // puppeteer version < 19.4.0 is no longer supported. This one is backward support.
  if (puppeteer.default?.defaultBrowserRevision) {
    return matcher.$$(`xpath/${locator.value}`)
  }
  
  // For Puppeteer 24.x+, $x method was removed
  // Use ::-p-xpath() selector syntax
  // Check if matcher has $$ method (Page, Frame, or ElementHandle)
  if (matcher && typeof matcher.$$ === 'function') {
    const xpathSelector = `::-p-xpath(${locator.value})`
    try {
      return await matcher.$$(xpathSelector)
    } catch (e) {
      // XPath selector may not work on ElementHandle, fall through to evaluate method
      this.debug && this.debug(`XPath selector failed on ${matcher.constructor?.name}: ${e.message}`)
    }
  }
  
  // ElementHandles don't support XPath directly  // Search within the element by making XPath relative
  try {
    const relativeXPath = locator.value.startsWith('.//') ? locator.value : `.//${locator.value.replace(/^\/\//, '')}`
    
    // Use the element as context by evaluating XPath from it
    const elements = await matcher.evaluateHandle((element, xpath) => {
      const iterator = document.evaluate(xpath, element, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
      const results = []
      for (let i = 0; i < iterator.snapshotLength; i++) {
        results.push(iterator.snapshotItem(i))
      }
      return results
    }, relativeXPath)
    
    // Convert JSHandle to array of ElementHandles
    const properties = await elements.getProperties()
    return Array.from(properties.values())
  } catch (e) {
    this.debug(`XPath within element failed: ${e.message}`)
  }
  
  // Fallback: return empty array
  return []
}

/**
 * Find a single element using Puppeteer's native element discovery methods
 * Note: Puppeteer Locator API doesn't have .first() method like Playwright
 * @param {Object} matcher - Puppeteer context to search within
 * @param {Object|string} locator - Locator specification
 * @returns {Promise<Object>} Single ElementHandle object
 */
async function findElement(matcher, locator) {
  locator = new Locator(locator, 'css')

  // Check if locator is a role locator and call findByRole
  if (locator.isRole()) {
    const elements = await findByRole.call(this, matcher, locator)
    return elements[0]
  }

  // Handle shadow DOM locators with >>> deep descendant combinator
  if (locator.isShadow()) {
    const shadowSelector = locator.value.join(' >>> ')
    const elements = await matcher.$$(shadowSelector)
    return elements[0]
  }

  // Use proven legacy approach - Puppeteer Locator API doesn't have .first() method
  if (!locator.isXPath()) {
    const elements = await matcher.$$(locator.simplify())
    return elements[0]
  }
  // puppeteer version < 19.4.0 is no longer supported. This one is backward support.
  if (puppeteer.default?.defaultBrowserRevision) {
    const elements = await matcher.$$(`xpath/${locator.value}`)
    return elements[0]
  }
  // For Puppeteer 24.x+, $x method was removed - use ::-p-xpath() selector
  const elements = await matcher.$$(`::-p-xpath(${locator.value})`)
  return elements[0]
}

async function proceedClick(locator, context = null, options = {}) {
  let matcher = await this.context
  if (context) {
    const els = await this._locate(context)
    assertElementExists(els, context)
    matcher = els[0]
  }
  const els = await findClickable.call(this, matcher, locator)
  if (context) {
    assertElementExists(els, locator, 'Clickable element', `was not found inside element ${new Locator(context).toString()}`)
  } else {
    assertElementExists(els, locator, 'Clickable element')
  }
  const el = selectElement(els, locator, this)

  highlightActiveElement.call(this, el, await this._getContext())

  await el.click(options)
  const promises = []
  if (options.waitForNavigation) {
    promises.push(this.waitForNavigation())
  }
  promises.push(this._waitForAction())

  return Promise.all(promises)
}

async function findClickable(matcher, locator) {
  const matchedLocator = new Locator(locator)

  if (!matchedLocator.isFuzzy()) return findElements.call(this, matcher, matchedLocator)

  let els
  const literal = xpathLocator.literal(matchedLocator.value)

  els = await findElements.call(this, matcher, Locator.clickable.narrow(literal))
  if (els.length) return els

  els = await findElements.call(this, matcher, Locator.clickable.wide(literal))
  if (els.length) return els

  try {
    els = await findElements.call(this, matcher, Locator.clickable.self(literal))
    if (els.length) return els
  } catch (err) {
    // Do nothing
  }

  // Try ARIA selector for accessible name
  try {
    els = await matcher.$$(`::-p-aria(${matchedLocator.value})`)
    if (els.length) return els
  } catch (err) {
    // ARIA selector not supported or failed
  }

  return findElements.call(this, matcher, matchedLocator.value) // by css or xpath
}

async function proceedSee(assertType, text, context, strict = false) {
  let description
  let allText
  if (!context) {
    let el = await this.context

    if (el && !el.getProperty) {
      // Fallback to body
      el = await this.context.$('body')
    }

    allText = [await el.getProperty('innerText').then(p => p.jsonValue())]
    description = 'web application'
  } else {
    const locator = new Locator(context, 'css')
    description = `element ${locator.toString()}`
    const els = await this._locate(locator)
    assertElementExists(els, locator.toString())
    allText = await Promise.all(els.map(el => el.getProperty('innerText').then(p => p.jsonValue())))
  }

  if (store?.currentStep?.opts?.ignoreCase === true) {
    text = text.toLowerCase()
    allText = allText.map(elText => elText.toLowerCase())
  }

  if (strict) {
    return allText.map(elText => equals(description)[assertType](text, elText))
  }
  return stringIncludes(description)[assertType](normalizeSpacesInString(text), normalizeSpacesInString(allText.join(' | ')))
}

async function findCheckable(locator, context) {
  let contextEl = await this.context
  if (typeof context === 'string') {
    contextEl = await findElements.call(this, contextEl, new Locator(context, 'css').simplify())
    contextEl = contextEl[0]
  }

  const matchedLocator = new Locator(locator)
  if (!matchedLocator.isFuzzy()) {
    return findElements.call(this, contextEl, matchedLocator)
  }

  const literal = xpathLocator.literal(matchedLocator.value)
  let els = await findElements.call(this, contextEl, Locator.checkable.byText(literal))
  if (els.length) {
    return els
  }
  els = await findElements.call(this, contextEl, Locator.checkable.byName(literal))
  if (els.length) {
    return els
  }

  // Try ARIA selector for accessible name
  try {
    els = await contextEl.$$(`::-p-aria(${matchedLocator.value})`)
    if (els.length) return els
  } catch (err) {
    // ARIA selector not supported or failed
  }

  return findElements.call(this, contextEl, matchedLocator.value)
}

async function proceedIsChecked(assertType, option) {
  let els = await findCheckable.call(this, option)
  assertElementExists(els, option, 'Checkable')

  const checkedStates = await Promise.all(
    els.map(async el => {
      const checked = await el
        .getProperty('checked')
        .then(p => p.jsonValue())
        .catch(() => null)

      if (checked) {
        return checked
      }

      const ariaChecked = await el.evaluate(el => el.getAttribute('aria-checked'))
      return ariaChecked === 'true'
    }),
  )

  const selected = checkedStates.reduce((prev, cur) => prev || cur)
  return truth(`checkable ${option}`, 'to be checked')[assertType](selected)
}

async function findVisibleFields(locator, context = null) {
  const els = await findFields.call(this, locator, context)
  const visible = await Promise.all(els.map(el => el.boundingBox()))
  return els.filter((el, index) => visible[index])
}

async function findFields(locator, context = null) {
  let contextEl
  if (context) {
    const contextPage = await this.context
    const contextEls = await findElements.call(this, contextPage, context)
    assertElementExists(contextEls, context, 'Context element')
    contextEl = contextEls[0]
  }

  const locateFn = contextEl
    ? loc => findElements.call(this, contextEl, loc)
    : loc => this._locate(loc)

  const matchedLocator = new Locator(locator)
  if (!matchedLocator.isFuzzy()) {
    return locateFn(matchedLocator)
  }
  const literal = xpathLocator.literal(matchedLocator.value)

  let els = await locateFn({ xpath: Locator.field.labelEquals(literal) })
  if (els.length) {
    return els
  }

  els = await locateFn({ xpath: Locator.field.labelContains(literal) })
  if (els.length) {
    return els
  }
  els = await locateFn({ xpath: Locator.field.byName(literal) })
  if (els.length) {
    return els
  }

  // Try ARIA selector for accessible name
  if (!contextEl) {
    try {
      const page = await this.context
      els = await page.$$(`::-p-aria(${matchedLocator.value})`)
      if (els.length) return els
    } catch (err) {
      // ARIA selector not supported or failed
    }
  }

  return locateFn({ css: matchedLocator.value })
}

async function proceedDragAndDrop(sourceLocator, destinationLocator) {
  const src = await this._locateElement(sourceLocator)
  if (!src) {
    throw new ElementNotFound(sourceLocator, 'Source Element')
  }

  const dst = await this._locateElement(destinationLocator)
  if (!dst) {
    throw new ElementNotFound(destinationLocator, 'Destination Element')
  }

  // Note: Using public api .getClickablePoint because the .BoundingBox does not take into account iframe offsets
  const dragSource = await getClickablePoint(src)
  const dragDestination = await getClickablePoint(dst)

  // Drag start point
  await this.page.mouse.move(dragSource.x, dragSource.y, { steps: 5 })
  await this.page.mouse.down()

  // Drag destination
  await this.page.mouse.move(dragDestination.x, dragDestination.y, { steps: 5 })
  await this.page.mouse.up()

  await this._waitForAction()
}

async function proceedSeeInField(assertType, field, value, context) {
  const els = await findVisibleFields.call(this, field, context)
  assertElementExists(els, field, 'Field')
  const el = els[0]
  const tag = await el.getProperty('tagName').then(el => el.jsonValue())
  const fieldType = await el.getProperty('type').then(el => el.jsonValue())

  const proceedMultiple = async elements => {
    const fields = Array.isArray(elements) ? elements : [elements]

    const elementValues = []
    for (const element of fields) {
      elementValues.push(await element.getProperty('value').then(el => el.jsonValue()))
    }

    if (typeof value === 'boolean') {
      equals(`no. of items matching > 0: ${field}`)[assertType](value, !!elementValues.length)
    } else {
      if (assertType === 'assert') {
        equals(`select option by ${field}`)[assertType](true, elementValues.length > 0)
      }
      elementValues.forEach(val => stringIncludes(`fields by ${field}`)[assertType](value, val))
    }
  }

  if (tag === 'SELECT') {
    const selectedOptions = await el.$$('option:checked')
    // locate option by values and check them
    if (value === '') {
      return proceedMultiple(selectedOptions)
    }

    const options = await filterFieldsByValue(selectedOptions, value, true)
    return proceedMultiple(options)
  }

  if (tag === 'INPUT') {
    if (fieldType === 'checkbox' || fieldType === 'radio') {
      if (typeof value === 'boolean') {
        // Filter by values
        const options = await filterFieldsBySelectionState(els, true)
        return proceedMultiple(options)
      }

      const options = await filterFieldsByValue(els, value, true)
      return proceedMultiple(options)
    }
    return proceedMultiple(els[0])
  }

  let fieldVal = await el.getProperty('value').then(el => el.jsonValue())

  if (fieldVal === undefined || fieldVal === null) {
    fieldVal = await el.evaluate(el => el.textContent || el.innerText)
  }

  return stringIncludes(`fields by ${field}`)[assertType](value, fieldVal)
}

async function filterFieldsByValue(elements, value, onlySelected) {
  const matches = []
  for (const element of elements) {
    let val = await element.getProperty('value').then(el => el.jsonValue())

    if (val === undefined || val === null) {
      val = await element.evaluate(el => el.textContent || el.innerText)
    }

    let isSelected = true
    if (onlySelected) {
      isSelected = await elementSelected(element)
    }
    if ((value == null || (val && val.indexOf(value) > -1)) && isSelected) {
      matches.push(element)
    }
  }
  return matches
}

async function filterFieldsBySelectionState(elements, state) {
  const matches = []
  for (const element of elements) {
    const isSelected = await elementSelected(element)
    if (isSelected === state) {
      matches.push(element)
    }
  }
  return matches
}

async function elementSelected(element) {
  const type = await element.getProperty('type').then(el => el.jsonValue())

  if (type === 'checkbox' || type === 'radio') {
    return element.getProperty('checked').then(el => el.jsonValue())
  }
  return element.getProperty('selected').then(el => el.jsonValue())
}

function isFrameLocator(locator) {
  locator = new Locator(locator)
  if (locator.isFrame()) {
    const _locator = new Locator(locator)
    return _locator.value
  }
  return false
}

function assertElementExists(res, locator, prefix, suffix) {
  if (!res || res.length === 0) {
    throw new ElementNotFound(locator, prefix, suffix)
  }
}

function assertOnlyOneElement(elements, locator, helper) {
  if (elements.length > 1) {
    const webElements = elements.map(el => new WebElement(el, helper))
    throw new MultipleElementsFound(locator, webElements)
  }
}

function $XPath(element, selector) {
  const found = document.evaluate(selector, element || document.body, null, 5, null)
  const res = []
  let current = null
  while ((current = found.iterateNext())) {
    res.push(current)
  }
  return res
}

async function targetCreatedHandler(page) {
  if (!page) return
  this.withinLocator = null
  page.on('load', () => {
    page
      .$('body')
      .catch(() => null)
      .then(context => (this.context = context))
  })
  page.on('console', msg => {
    this.debugSection(`Browser:${ucfirst(msg.type())}`, (msg._text || '') + msg.args().join(' '))
    consoleLogStore.add(msg)
  })

  if (this.options.userAgent) {
    await page.setUserAgent(this.options.userAgent)
  }
  if (this.options.windowSize && this.options.windowSize.indexOf('x') > 0) {
    const dimensions = this.options.windowSize.split('x')
    const width = parseInt(dimensions[0], 10)
    const height = parseInt(dimensions[1], 10)
    await page.setViewport({ width, height })
  }
}

// BC compatibility for Puppeteer < 10
async function getClickablePoint(el) {
  if (el.clickablePoint) return el.clickablePoint()
  if (el._clickablePoint) return el._clickablePoint()
  return null
}

// List of key values to key definitions
// https://github.com/puppeteer/puppeteer/blob/v1.20.0/lib/USKeyboardLayout.js
const keyDefinitionMap = {
  0: 'Digit0',
  1: 'Digit1',
  2: 'Digit2',
  3: 'Digit3',
  4: 'Digit4',
  5: 'Digit5',
  6: 'Digit6',
  7: 'Digit7',
  8: 'Digit8',
  9: 'Digit9',
  a: 'KeyA',
  b: 'KeyB',
  c: 'KeyC',
  d: 'KeyD',
  e: 'KeyE',
  f: 'KeyF',
  g: 'KeyG',
  h: 'KeyH',
  i: 'KeyI',
  j: 'KeyJ',
  k: 'KeyK',
  l: 'KeyL',
  m: 'KeyM',
  n: 'KeyN',
  o: 'KeyO',
  p: 'KeyP',
  q: 'KeyQ',
  r: 'KeyR',
  s: 'KeyS',
  t: 'KeyT',
  u: 'KeyU',
  v: 'KeyV',
  w: 'KeyW',
  x: 'KeyX',
  y: 'KeyY',
  z: 'KeyZ',
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
  "'": 'Quote',
}

function getNormalizedKey(key) {
  const normalizedKey = getNormalizedKeyAttributeValue(key)
  if (key !== normalizedKey) {
    this.debugSection('Input', `Mapping key '${key}' to '${normalizedKey}'`)
  }
  // Use key definition to ensure correct key is displayed when Shift modifier is active
  if (Object.prototype.hasOwnProperty.call(keyDefinitionMap, normalizedKey)) {
    return keyDefinitionMap[normalizedKey]
  }
  return normalizedKey
}

function highlightActiveElement(element, context) {
  if (this.options.highlightElement && store.debugMode) {
    highlightElement(element, context)
  }
}

function _waitForElement(locator, options) {
  try {
    return this.context.waitForXPath(locator.value, options)
  } catch (e) {
    return this.context.waitForSelector(`::-p-xpath(${locator.value})`, options)
  }
}

async function findByRole(matcher, locator) {
  const resolved = toLocatorConfig(locator, 'role')
  const roleSelector = buildRoleSelector(resolved)

  if (!resolved.text && !resolved.name) {
    return matcher.$$(roleSelector)
  }

  const allElements = await matcher.$$(roleSelector)
  const filtered = []
  const accessibleName = resolved.text ?? resolved.name
  const matcherFn = createRoleTextMatcher(accessibleName, resolved.exact === true)

  for (const el of allElements) {
    const texts = await el.evaluate(e => {
      const ariaLabel = e.hasAttribute('aria-label') ? e.getAttribute('aria-label') : ''
      const labelText = e.id ? document.querySelector(`label[for="${e.id}"]`)?.textContent.trim() || '' : ''
      const placeholder = e.getAttribute('placeholder') || ''
      const innerText = e.innerText ? e.innerText.trim() : ''
      return [ariaLabel || labelText, placeholder, innerText]
    })

    if (texts.some(text => matcherFn(text))) filtered.push(el)
  }

  return filtered
}

function toLocatorConfig(locator, key) {
  const matchedLocator = new Locator(locator, key)
  if (matchedLocator.locator) return matchedLocator.locator
  return { [key]: matchedLocator.value }
}

function buildRoleSelector(resolved) {
  return `::-p-aria([role="${resolved.role}"])`
}

function createRoleTextMatcher(expected, exactMatch) {
  if (expected instanceof RegExp) {
    return value => expected.test(value || '')
  }
  const target = String(expected)
  if (exactMatch) {
    return value => value === target
  }
  return value => typeof value === 'string' && value.includes(target)
}

async function proceedSelect(context, el, option) {
  const role = await el.evaluate(e => e.getAttribute('role'))
  const options = Array.isArray(option) ? option : [option]

  if (role === 'combobox') {
    this.debugSection('SelectOption', 'Expanding combobox')
    highlightActiveElement.call(this, el, context)
    const ariaOwns = await el.evaluate(e => e.getAttribute('aria-owns'))
    const ariaControls = await el.evaluate(e => e.getAttribute('aria-controls'))
    await el.click()
    await this._waitForAction()

    const listboxId = ariaOwns || ariaControls
    let listbox = null
    if (listboxId) {
      const listboxEls = await context.$$( `#${listboxId}`)
      if (listboxEls.length) listbox = listboxEls[0]
    }
    if (!listbox) {
      const listboxEls = await findByRole.call(this, context, { role: 'listbox' })
      if (listboxEls?.length) listbox = listboxEls[0]
    }

    if (listbox) {
      for (const opt of options) {
        const optEls = await findByRole.call(this, listbox, { role: 'option', name: opt })
        if (optEls?.length) {
          const optEl = optEls[0]
          this.debugSection('SelectOption', `Clicking: "${opt}"`)
          highlightActiveElement.call(this, optEl, context)
          await optEl.click()
        }
      }
    }
    return this._waitForAction()
  }

  if (role === 'listbox') {
    for (const opt of options) {
      const optEls = await findByRole.call(this, el, { role: 'option', name: opt })
      if (optEls?.length) {
        const optEl = optEls[0]
        this.debugSection('SelectOption', `Clicking: "${opt}"`)
        highlightActiveElement.call(this, optEl, context)
        await optEl.click()
      }
    }
    return this._waitForAction()
  }

  // Native <select> element
  const tagName = await el.evaluate(e => e.tagName)
  if (tagName !== 'SELECT') {
    throw new Error('Element is not <select>')
  }
  highlightActiveElement.call(this, el, context)
  const optionArray = Array.isArray(option) ? option : [option]

  for (const key in optionArray) {
    const opt = xpathLocator.literal(optionArray[key])
    let optEl = await findElements.call(this, el, { xpath: Locator.select.byVisibleText(opt) })
    if (optEl.length) {
      this._evaluateHandeInContext(el => (el.selected = true), optEl[0])
      continue
    }
    optEl = await findElements.call(this, el, { xpath: Locator.select.byValue(opt) })
    if (optEl.length) {
      this._evaluateHandeInContext(el => (el.selected = true), optEl[0])
    }
  }
  await this._evaluateHandeInContext(element => {
    element.dispatchEvent(new Event('input', { bubbles: true }))
    element.dispatchEvent(new Event('change', { bubbles: true }))
  }, el)

  return this._waitForAction()
}

