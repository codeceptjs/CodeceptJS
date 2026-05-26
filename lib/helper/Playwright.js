import path from 'path'
import fs from 'fs'
import Helper from '@codeceptjs/helper'
import { v4 as uuidv4 } from 'uuid'
import assert from 'assert'
import promiseRetry from 'promise-retry'
import Locator from '../locator.js'
import recorder from '../recorder.js'
import store from '../store.js'
import { checkFocusBeforeType, checkFocusBeforePressKey } from './extras/focusCheck.js'
import { includes as stringIncludes } from '../assert/include.js'
import { urlEquals, equals } from '../assert/equal.js'
import { empty } from '../assert/empty.js'
import { truth } from '../assert/truth.js'
import {
  xpathLocator,
  ucfirst,
  fileExists,
  chunkArray,
  convertCssPropertiesToCamelCase,
  screenshotOutputFolder,
  getNormalizedKeyAttributeValue,
  isModifierKey,
  clearString,
  requireWithFallback,
  normalizeSpacesInString,
  normalizePath,
  resolveUrl,
  relativeDir,
  getMimeType,
  base64EncodeFile,
} from '../utils.js'
import { isColorProperty, convertColorToRGBA } from '../colorUtils.js'
import ElementNotFound from './errors/ElementNotFound.js'
import MultipleElementsFound from './errors/MultipleElementsFound.js'
import RemoteBrowserConnectionRefused from './errors/RemoteBrowserConnectionRefused.js'
import Popup from './extras/Popup.js'
import Console from './extras/Console.js'
import { findByPlaywrightLocator } from './extras/PlaywrightLocator.js'
import { dropFile } from './scripts/dropFile.js'
import WebElement from '../element/WebElement.js'
import { selectElement } from './extras/elementSelection.js'
import { fillRichEditor } from './extras/richTextEditor.js'

let playwright
let perfTiming
let defaultSelectorEnginesInitialized = false


const popupStore = new Popup()
const consoleLogStore = new Console()
const availableBrowsers = ['chromium', 'webkit', 'firefox', 'electron']

import { setRestartStrategy, restartsSession, restartsContext, restartsBrowser } from './extras/PlaywrightRestartOpts.js'
import { createValueEngine, createDisabledEngine } from './extras/PlaywrightPropEngine.js'
import { seeElementError, dontSeeElementError, dontSeeElementInDOMError, seeElementInDOMError } from './errors/ElementAssertion.js'
import { dontSeeTraffic, seeTraffic, grabRecordedNetworkTraffics, stopRecordingTraffic, flushNetworkTraffics } from './network/actions.js'

const pathSeparator = path.sep

/**
 * ## Configuration
 *
 * This helper should be configured in codecept.conf.(js|ts)
 *
 * @typedef PlaywrightConfig
 * @type {object}
 * @prop {string} [url] - base url of website to be tested
 * @prop {'chromium' | 'firefox'| 'webkit' | 'electron'} [browser='chromium'] - a browser to test on, either: `chromium`, `firefox`, `webkit`, `electron`. Default: chromium.
 * @prop {boolean} [show=true] - show browser window.
 * @prop {string|boolean} [restart=false] - restart strategy between tests. Possible values:
 *   * 'context' or **false** - restarts [browser context](https://playwright.dev/docs/api/class-browsercontext) but keeps running browser. Recommended by Playwright team to keep tests isolated.
 *   * 'session' or 'keep' - keeps browser context and session, but cleans up cookies and localStorage between tests. The fastest option when running tests in windowed mode. Works with `keepCookies` and `keepBrowserState` options. This behavior was default before CodeceptJS 3.1
 * @prop {number} [timeout=1000] - -  [timeout](https://playwright.dev/docs/api/class-page#page-set-default-timeout) in ms of all Playwright actions .
 * @prop {boolean} [disableScreenshots=false] - don't save screenshot on failure.
 * @prop {any} [emulate] - browser in device emulation mode.
 * @prop {boolean} [video=false] - enables video recording for failed tests; videos are saved into `output/videos` folder
 * @prop {boolean} [keepVideoForPassedTests=false] - save videos for passed tests; videos are saved into `output/videos` folder
 * @prop {boolean} [trace=false] - record [tracing information](https://playwright.dev/docs/trace-viewer) with screenshots and snapshots.
 * @prop {boolean} [keepTraceForPassedTests=false] - save trace for passed tests.
 * @prop {boolean} [fullPageScreenshots=false] - make full page screenshots on failure.
 * @prop {boolean} [uniqueScreenshotNames=false] - option to prevent screenshot override if you have scenarios with the same name in different suites.
 * @prop {boolean} [keepBrowserState=false] - keep browser state between tests when `restart` is set to 'session'.
 * @prop {boolean} [keepCookies=false] - keep cookies between tests when `restart` is set to 'session'.
 * @prop {number} [waitForAction] - how long to wait after click, doubleClick or PressKey actions in ms. Default: 100.
 * @prop {'load' | 'domcontentloaded' | 'commit'} [waitForNavigation] - When to consider navigation succeeded. Possible options: `load`, `domcontentloaded`, `commit`. Choose one of those options is possible. See [Playwright API](https://playwright.dev/docs/api/class-page#page-wait-for-url).
 * @prop {number} [pressKeyDelay=10] - Delay between key presses in ms. Used when calling Playwrights page.type(...) in fillField/appendField
 * @prop {number} [getPageTimeout] - config option to set maximum navigation time in milliseconds.
 * @prop {number} [waitForTimeout] - default wait* timeout in ms. Default: 1000.
 * @prop {object} [basicAuth] - the basic authentication to pass to base url. Example: {username: 'username', password: 'password'}
 * @prop {string} [windowSize] - default window size. Set a dimension like `640x480`.
 * @prop {'dark' | 'light' | 'no-preference'} [colorScheme] - default color scheme. Possible values: `dark` | `light` | `no-preference`.
 * @prop {string} [userAgent] - user-agent string.
 * @prop {string} [locale] - locale string. Example: 'en-GB', 'de-DE', 'fr-FR', ...
 * @prop {boolean} [manualStart] - do not start browser before a test, start it manually inside a helper with `this.helpers["Playwright"]._startBrowser()`.
 * @prop {object} [chromium] - pass additional chromium options
 * @prop {object} [firefox] - pass additional firefox options
 * @prop {object} [electron] - (pass additional electron options
 * @prop {any} [channel] - (While Playwright can operate against the stock Google Chrome and Microsoft Edge browsers available on the machine. In particular, current Playwright version will support Stable and Beta channels of these browsers. See [Google Chrome & Microsoft Edge](https://playwright.dev/docs/browsers/#google-chrome--microsoft-edge).
 * @prop {string[]} [ignoreLog] - An array with console message types that are not logged to debug log. Default value is `['warning', 'log']`. E.g. you can set `[]` to log all messages. See all possible [values](https://playwright.dev/docs/api/class-consolemessage#console-message-type).
 * @prop {boolean} [ignoreHTTPSErrors] - Allows access to untrustworthy pages, e.g. to a page with an expired certificate. Default value is `false`
 * @prop {boolean} [bypassCSP] - bypass Content Security Policy or CSP
 * @prop {boolean} [highlightElement] - highlight the interacting elements. Default: false. Note: only activate under verbose mode (--verbose).
 * @prop {object} [recordHar] - record HAR and will be saved to `output/har`. See more of [HAR options](https://playwright.dev/docs/api/class-browser#browser-new-context-option-record-har).
 * @prop {string} [testIdAttribute=data-testid] - locate elements based on the testIdAttribute. See more of [locate by test id](https://playwright.dev/docs/locators#locate-by-test-id).
 * @prop {string|object} [storageState] - Playwright storage state (path to JSON file or object)
 *   passed directly to `browser.newContext`.
 *   If a Scenario is declared with a `cookies` option (e.g. `Scenario('name', { cookies: [...] }, fn)`),
 *   those cookies are used instead and the configured `storageState` is ignored (no merge).
 *   May include session cookies, auth tokens, localStorage and (if captured with
 *   `grabStorageState({ indexedDB: true })`) IndexedDB data; treat as sensitive and do not commit.
 */
const config = {}

/**
 * Uses [Playwright](https://github.com/microsoft/playwright) library to run tests inside:
 *
 * * Chromium
 * * Firefox
 * * Webkit (Safari)
 *
 * This helper works with a browser out of the box with no additional tools required to install.
 *
 * Requires `playwright` or `playwright-core` package version ^1 to be installed:
 *
 * ```
 * npm i playwright@^1.18 --save
 * ```
 * or
 * ```
 * npm i playwright-core@^1.18 --save
 * ```
 *
 * Breaking Changes: if you use Playwright v1.38 and later, it will no longer download browsers automatically.
 *
 * Run `npx playwright install` to download browsers after `npm install`.
 *
 * Using playwright-core package, will prevent the download of browser binaries and allow connecting to an existing browser installation or for connecting to a remote one.
 *
 *
 * <!-- configuration -->
 *
 * #### Video Recording Customization
 *
 * By default, video is saved to `output/video` dir. You can customize this path by passing `dir` option to `recordVideo` option.
 *
 * `video`: enables video recording for failed tests; videos are saved into `output/videos` folder
 * * `keepVideoForPassedTests`: - save videos for passed tests
 * * `recordVideo`: [additional options for videos customization](https://playwright.dev/docs/next/api/class-browser#browser-new-context)
 *
 * #### Trace Recording Customization
 *
 * Trace recording provides complete information on test execution and includes DOM snapshots, screenshots, and network requests logged during run.
 * Traces will be saved to `output/trace`
 *
 * * `trace`: enables trace recording for failed tests; trace are saved into `output/trace` folder
 * * `keepTraceForPassedTests`: - save trace for passed tests
 *
 * #### HAR Recording Customization
 *
 * A HAR file is an HTTP Archive file that contains a record of all the network requests that are made when a page is loaded.
 * It contains information about the request and response headers, cookies, content, timings, and more. You can use HAR files to mock network requests in your tests.
 * HAR will be saved to `output/har`. More info could be found here https://playwright.dev/docs/api/class-browser#browser-new-context-option-record-har.
 *
 * ```
 * ...
 * recordHar: {
 *     mode: 'minimal', // possible values: 'minimal'|'full'.
 *     content: 'embed' // possible values:  "omit"|"embed"|"attach".
 * }
 * ...
 *```
 *
 * #### Example #1: Wait for 0 network connections.
 *
 * ```js
 * {
 *    helpers: {
 *      Playwright : {
 *        url: "http://localhost",
 *        restart: false,
 *        waitForNavigation: "networkidle0",
 *        waitForAction: 500
 *      }
 *    }
 * }
 * ```
 *
 * #### Example #2: Wait for DOMContentLoaded event
 *
 * ```js
 * {
 *    helpers: {
 *      Playwright : {
 *        url: "http://localhost",
 *        restart: false,
 *        waitForNavigation: "domcontentloaded",
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
 *      Playwright : {
 *        url: "http://localhost",
 *        show: true
 *      }
 *    }
 * }
 * ```
 *
 * #### Example #4: Connect to remote browser by specifying [websocket endpoint](https://playwright.dev/docs/api/class-browsertype#browsertypeconnectparams)
 *
 * ```js
 * {
 *    helpers: {
 *      Playwright: {
 *        url: "http://localhost",
 *        chromium: {
 *          browserWSEndpoint: 'ws://localhost:9222/devtools/browser/c5aa6160-b5bc-4d53-bb49-6ecb36cd2e0a',
 *          cdpConnection: false // default is false
 *        }
 *      }
 *    }
 * }
 * ```
 *
 * #### Example #5: Testing with Chromium extensions
 *
 * [official docs](https://github.com/microsoft/playwright/blob/v0.11.0/docs/api.md#working-with-chrome-extensions)
 *
 * ```js
 * {
 *  helpers: {
 *    Playwright: {
 *      url: "http://localhost",
 *      show: true // headless mode not supported for extensions
 *      chromium: {
 *        // Note: due to this would launch persistent context, so to avoid the error when running tests with run-workers a timestamp would be appended to the defined folder name. For instance: playwright-tmp_1692715649511
 *        userDataDir: '/tmp/playwright-tmp', // necessary to launch the browser in normal mode instead of incognito,
 *        args: [
 *           `--disable-extensions-except=${pathToExtension}`,
 *           `--load-extension=${pathToExtension}`
 *        ]
 *      }
 *    }
 *  }
 * }
 * ```
 *
 * #### Example #6: Launch tests emulating iPhone 6
 *
 *
 *
 * ```js
 * const { devices } = require('playwright');
 *
 * {
 *  helpers: {
 *    Playwright: {
 *      url: "http://localhost",
 *      emulate: devices['iPhone 6'],
 *    }
 *  }
 * }
 * ```
 *
 * #### Example #7: Launch test with a specific user locale
 *
 * ```js
 * {
 *  helpers: {
 *   Playwright : {
 *     url: "http://localhost",
 *     locale: "fr-FR",
 *   }
 *  }
 * }
 * ```
 *
 * * #### Example #8: Launch test with a specific color scheme
 *
 * ```js
 * {
 *  helpers: {
 *   Playwright : {
 *     url: "http://localhost",
 *     colorScheme: "dark",
 *   }
 *  }
 * }
 * ```
 *
 * * #### Example #9: Launch electron test
 *
 * ```js
 * {
 *  helpers: {
 *     Playwright: {
 *       browser: 'electron',
 *       electron: {
 *         executablePath: require("electron"),
 *         args: [path.join('../', "main.js")],
 *       },
 *     }
 *   },
 * }
 * ```
 *
 * Note: When connecting to remote browser `show` and specific `chrome` options (e.g. `headless` or `devtools`) are ignored.
 *
 * ## Access From Helpers
 *
 * Receive Playwright client from a custom helper by accessing `browser` for the Browser object or `page` for the current Page object:
 *
 * ```js
 * const { browser } = this.helpers.Playwright;
 * await browser.pages(); // List of pages in the browser
 *
 * // get current page
 * const { page } = this.helpers.Playwright;
 * await page.url(); // Get the url of the current page
 *
 * const { browserContext } = this.helpers.Playwright;
 * await browserContext.cookies(); // get current browser context
 * ```
 */
class Playwright extends Helper {
  constructor(config) {
    super(config)

    // playwright will be loaded dynamically in _init method

    // set defaults
    this.isRemoteBrowser = false
    this.isRunning = false
    this.isAuthenticated = false
    this.sessionPages = {}
    this.activeSessionName = ''
    this.isElectron = false
    this.isCDPConnection = false
    this.electronSessions = []
    this.storageState = null

    // for network stuff
    this.requests = []
    this.recording = false
    this.recordedAtLeastOnce = false

    // for websocket messages
    this.webSocketMessages = []
    this.recordingWebSocketMessages = false
    this.recordedWebSocketMessagesAtLeastOnce = false
    this.cdpSession = null

    // Add test failure tracking to prevent false positives
    this.testFailures = []
    this.hasCleanupError = false

    // override defaults with config
    this._setConfig(config)

    // pass storageState directly (string path or object) and let Playwright handle errors/missing file
    if (typeof config.storageState !== 'undefined') {
      this.storageState = config.storageState
    }
  }

  _validateConfig(config) {
    const defaults = {
      // options to emulate context
      emulate: {},
      browser: 'chromium',
      waitForAction: 100,
      waitForTimeout: 1000,
      pressKeyDelay: 10,
      timeout: 5000,
      fullPageScreenshots: false,
      disableScreenshots: false,
      ignoreLog: ['warning', 'log'],
      uniqueScreenshotNames: false,
      manualStart: false,
      getPageTimeout: 30000,
      waitForNavigation: 'load',
      restart: false,
      keepCookies: false,
      keepBrowserState: false,
      show: false,
      defaultPopupAction: 'accept',
      use: { actionTimeout: 0 },
      ignoreHTTPSErrors: false, // Adding it here o that context can be set up to ignore the SSL errors,
      highlightElement: false,
      storageState: undefined,
      onResponse: null,
      strict: false,
    }

    process.env.testIdAttribute = 'data-testid'
    config = Object.assign(defaults, config)

    if (availableBrowsers.indexOf(config.browser) < 0) {
      throw new Error(`Invalid config. Can't use browser "${config.browser}". Accepted values: ${availableBrowsers.join(', ')}`)
    }

    return config
  }

  _getOptionsForBrowser(config) {
    if (config[config.browser]) {
      if (config[config.browser].browserWSEndpoint && config[config.browser].browserWSEndpoint.wsEndpoint) {
        config[config.browser].browserWSEndpoint = config[config.browser].browserWSEndpoint.wsEndpoint
      }
      return {
        ...config[config.browser],
        wsEndpoint: config[config.browser].browserWSEndpoint,
      }
    }
    return {}
  }

  _setConfig(config) {
    this.options = this._validateConfig(config)
    setRestartStrategy(this.options)
    this.playwrightOptions = {
      headless: !this.options.show,
      ...this._getOptionsForBrowser(config),
    }

    if (this.options.channel && this.options.browser === 'chromium') {
      this.playwrightOptions.channel = this.options.channel
    }

    if (this.options.video) {
      // set the video resolution with window size
      let size = parseWindowSize(this.options.windowSize)

      // if the video resolution is passed, set the record resoultion with that resolution
      if (this.options.recordVideo && this.options.recordVideo.size) {
        size = parseWindowSize(this.options.recordVideo.size)
      }
      this.options.recordVideo = { size }
    }
    if (this.options.recordVideo && !this.options.recordVideo.dir) {
      this.options.recordVideo.dir = `${store.outputDir}/videos/`
    }
    this.isRemoteBrowser = !!this.playwrightOptions.browserWSEndpoint
    this.isElectron = this.options.browser === 'electron'
    this.userDataDir = this.playwrightOptions.userDataDir ? `${this.playwrightOptions.userDataDir}_${Date.now().toString()}` : undefined
    this.isCDPConnection = this.playwrightOptions.cdpConnection
    popupStore.defaultAction = this.options.defaultPopupAction
  }

  static _config() {
    return [
      {
        name: 'browser',
        message: 'Browser in which testing will be performed. Possible options: chromium, firefox, webkit or electron',
        default: 'chromium',
      },
      {
        name: 'url',
        message: 'Base url of site to be tested',
        default: 'http://localhost',
        when: answers => answers.Playwright_browser !== 'electron',
      },
      {
        name: 'show',
        message: 'Show browser window',
        default: true,
        type: 'confirm',
        when: answers => answers.Playwright_browser !== 'electron',
      },
    ]
  }

  static _checkRequirements() {
    try {
      // In ESM, playwright will be checked via dynamic import in constructor
      // The import will fail at module load time if playwright is missing
      return null
    } catch (e) {
      return ['playwright@^1.18']
    }
  }

  async _init() {
    // Load playwright dynamically with fallback
    if (!playwright) {
      try {
        playwright = await import('playwright')
        playwright = playwright.default || playwright
      } catch (e) {
        try {
          playwright = await import('playwright-core')
          playwright = playwright.default || playwright
        } catch (e2) {
          throw new Error('Neither playwright nor playwright-core could be loaded. Please install one of them.')
        }
      }
    }

    // register an internal selector engine for reading value property of elements in a selector
    try {
      // Always wrap in try-catch since selectors might be registered globally across workers
      // Check global flag to avoid re-registration in worker processes
      if (!defaultSelectorEnginesInitialized) {
        try {
          await playwright.selectors.register('__value', createValueEngine)
          await playwright.selectors.register('__disabled', createDisabledEngine)
          defaultSelectorEnginesInitialized = true
          defaultSelectorEnginesInitialized = true
        } catch (e) {
          if (!e.message.includes('already registered')) {
            throw e
          }
          // Selector already registered globally by another worker
          defaultSelectorEnginesInitialized = true
          defaultSelectorEnginesInitialized = true
        }
      } else {
        // Selectors already registered in a worker, skip
        defaultSelectorEnginesInitialized = true
        this.debugSection('Init', 'Default selector engines already registered globally, skipping')
      }
      if (process.env.testIdAttribute) {
        try {
          await playwright.selectors.setTestIdAttribute(process.env.testIdAttribute)
        } catch (e) {
          // Ignore if already set
        }
      }
    } catch (e) {
      console.warn(e)
    }
  }

  _beforeSuite() {
    // Skip browser start in dry-run mode (used by check command)
    if (store.dryRun) {
      this.debugSection('Dry Run', 'Skipping browser start')
      return
    }

    // Start browser if not manually started and not already running
    // Browser should start in singleton mode (restart: false) or when restart strategy is enabled
    if (!this.options.manualStart && !this.isRunning) {
      this.debugSection('Session', 'Starting singleton browser session')
      return this._startBrowser()
    }
  }

  async _before(test) {
    // Skip browser operations in dry-run mode (used by check command)
    if (store.dryRun) {
      this.currentRunningTest = test
      return
    }

    this.currentRunningTest = test

    // Reset failure tracking for each test to prevent false positives
    this.hasCleanupError = false
    this.testFailures = []

    // Reset frame context to ensure clean state for each test
    this.context = this.page
    this.frame = null
    this.contextLocator = null

    // Clear popup state to ensure clean state for each test
    popupStore.clear()

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

    // Start browser if needed (initial start or browser restart strategy)
    if (!this.isRunning && !this.options.manualStart) await this._startBrowser()
    else if (restartsBrowser() && !this.options.manualStart) {
      // Browser restart strategy: start browser for each test
      await this._startBrowser()
    }

    this.isAuthenticated = false
    if (this.isElectron) {
      this.browserContext = this.browser.context()
    } else if (this.playwrightOptions.userDataDir) {
      this.browserContext = this.browser
    } else {
      const contextOptions = {
        ignoreHTTPSErrors: this.options.ignoreHTTPSErrors,
        acceptDownloads: true,
        ...this.options.emulate,
      }
      if (this.options.basicAuth) {
        contextOptions.httpCredentials = this.options.basicAuth
        this.isAuthenticated = true
      }
      if (this.options.bypassCSP) contextOptions.bypassCSP = this.options.bypassCSP
      if (this.options.recordVideo) contextOptions.recordVideo = this.options.recordVideo
      if (this.options.recordHar) {
        const harExt = this.options.recordHar.content && this.options.recordHar.content === 'attach' ? 'zip' : 'har'
        const fileName = `${`${store.outputDir}${path.sep}har${path.sep}${uuidv4()}_${clearString(this.currentRunningTest.title)}`.slice(0, 245)}.${harExt}`
        const dir = path.dirname(fileName)
        if (!fileExists(dir)) fs.mkdirSync(dir)
        this.options.recordHar.path = fileName
        this.currentRunningTest.artifacts.har = fileName
        contextOptions.recordHar = this.options.recordHar
      }

      // load pre-saved cookies
      if (test?.opts?.cookies) contextOptions.storageState = { cookies: test.opts.cookies }
      else if (this.storageState) contextOptions.storageState = this.storageState
      if (this.options.userAgent) contextOptions.userAgent = this.options.userAgent
      if (this.options.locale) contextOptions.locale = this.options.locale
      if (this.options.colorScheme) contextOptions.colorScheme = this.options.colorScheme
      this.contextOptions = contextOptions
      if (!this.browserContext || !restartsSession()) {
        if (!this.browser) {
          if (this.options.manualStart) {
            this.debugSection('Manual Start', 'Browser not started - skipping context creation')
            return // Skip context creation when manualStart is true
          } else {
            throw new Error('Browser not started. This should not happen.')
          }
        }
        this.debugSection('New Session', JSON.stringify(this.contextOptions))
        try {
          this.browserContext = await this.browser.newContext(this.contextOptions) // Adding the HTTPSError ignore in the context so that we can ignore those errors
        } catch (err) {
          // In worker mode with Playwright 1.x, there's a known issue where newContext() fails
          // with "selector engine already registered" when selectors are registered globally
          // across worker threads. This is safe to retry without ANY custom options.
          if (err.message && err.message.includes('already registered')) {
            this.debugSection('Worker Mode', 'Selector conflict detected, retrying context creation with no options')
            // Create context with NO options to avoid selector conflicts
            this.browserContext = await this.browser.newContext()
          } else {
            throw err
          }
        }
      }
    }

    let mainPage
    if (this.isElectron) {
      mainPage = await this.browser.firstWindow()
    } else {
      try {
        const existingPages = await this.browserContext.pages()
        mainPage = existingPages[0] || (await this.browserContext.newPage())
      } catch (e) {
        if (this.playwrightOptions.userDataDir) {
          this.browser = await playwright[this.options.browser].launchPersistentContext(this.userDataDir, this.playwrightOptions)
          this.browserContext = this.browser
          const existingPages = await this.browserContext.pages()
          mainPage = existingPages[0]
        }
      }
    }
    await targetCreatedHandler.call(this, mainPage)

    await this._setPage(mainPage)

    try {
      // set metadata for reporting
      test.meta.browser = this.browser.browserType().name()
      test.meta.browserVersion = this.browser.version()
      test.meta.windowSize = `${this.page.viewportSize().width}x${this.page.viewportSize().height}`
    } catch (e) {
      this.debug('Failed to set metadata for reporting')
    }

    if (this.options.trace) await this.browserContext.tracing.start({ screenshots: true, snapshots: true })

    return this.browser
  }

  async _after() {
    if (!this.isRunning) return

    // Clear popup state to prevent leakage between tests
    popupStore.clear()

    if (this.isElectron) {
      try {
        this.browser.close()
        this.electronSessions.forEach(session => session.close())
      } catch (e) {
        console.warn('Warning during electron cleanup:', e.message)
      }
      return
    }

    if (restartsSession()) {
      return refreshContextSession.bind(this)()
    }

    if (restartsBrowser()) {
      // Close browser completely for restart strategy
      if (this.isRunning) {
        try {
          // Close all pages first to release resources
          if (this.browserContext) {
            const pages = await this.browserContext.pages()
            await Promise.allSettled(pages.map(p => p.close().catch(() => {})))
          }
          // Use timeout to prevent hanging (10s should be enough for browser cleanup)
          await Promise.race([this._stopBrowser(), new Promise((_, reject) => setTimeout(() => reject(new Error('Browser stop timeout')), 10000))])
        } catch (e) {
          console.warn('Warning during browser restart in _after:', e.message)
          // Force cleanup even on timeout
          this.browser = null
          this.browserContext = null
          this.isRunning = false
        }
      }
      return
    }

    // close other sessions with timeout protection, but only if restartsContext() is true
    if (restartsContext()) {
      try {
        if ((await this.browser)?._type === 'Browser') {
          const contexts = await Promise.race([this.browser.contexts(), new Promise((_, reject) => setTimeout(() => reject(new Error('Get contexts timeout')), 3000))])
          const currentContext = contexts[0]
          if (currentContext && (this.options.keepCookies || this.options.keepBrowserState)) {
            try {
              this.storageState = await currentContext.storageState()
            } catch (e) {
              console.warn('Warning during storage state save:', e.message)
            }
          }

          await Promise.race([Promise.all(contexts.map(c => c.close())), new Promise((_, reject) => setTimeout(() => reject(new Error('Close contexts timeout')), 5000))])
        }
      } catch (e) {
        console.warn('Warning during context cleanup in _after:', e.message)
      }
    }

    return this.browser
  }

  async _afterSuite() {
    // Reset leftover test-level cleanup state (e.g. screenshot failures)
    // so only errors from this suite teardown are evaluated below.
    this.hasCleanupError = false
    this.testFailures = []

    // Stop browser after suite completes
    // For restart strategies: stop after each suite
    // For session mode (restart:false): stop after the last suite
    if (this.isRunning) {
      try {
        // Add timeout protection to prevent hanging
        await Promise.race([this._stopBrowser(), new Promise((_, reject) => setTimeout(() => reject(new Error('Browser stop timeout in afterSuite')), 10000))])
      } catch (e) {
        console.warn('Warning during suite cleanup:', e.message)
        // Track suite cleanup failures
        this.hasCleanupError = true
        this.testFailures.push(`Suite cleanup failed: ${e.message}`)
        // Force cleanup on timeout
        this.browser = null
        this.browserContext = null
        this.isRunning = false
      } finally {
        this.isRunning = false
      }
    }

    // Force cleanup of any remaining browser processes
    try {
      if (this.browser && (!this.browser.isConnected || this.browser)) {
        await Promise.race([Promise.resolve(), new Promise(resolve => setTimeout(resolve, 1000))])
      }
    } catch (e) {
      console.warn('Final cleanup warning:', e.message)
      this.hasCleanupError = true
      this.testFailures.push(`Final cleanup failed: ${e.message}`)
    }

    // Clean up session pages explicitly to prevent hanging references
    try {
      if (this.sessionPages && Object.keys(this.sessionPages).length > 0) {
        for (const sessionName in this.sessionPages) {
          const sessionPage = this.sessionPages[sessionName]
          if (sessionPage && !sessionPage.isClosed()) {
            try {
              // Remove any remaining event listeners from session pages
              sessionPage.removeAllListeners('dialog')
              sessionPage.removeAllListeners('crash')
              sessionPage.removeAllListeners('close')
              sessionPage.removeAllListeners('error')
              await sessionPage.close()
            } catch (e) {
              console.warn(`Warning closing session page ${sessionName}:`, e.message)
            }
          }
        }
        this.sessionPages = {} // Clear the session pages object
        this.activeSessionName = '' // Reset active session name
      }
    } catch (e) {
      console.warn('Session pages cleanup warning:', e.message)
      this.hasCleanupError = true
      this.testFailures.push(`Session cleanup failed: ${e.message}`)
    }

    // Clear any lingering DOM timeouts by executing cleanup in browser context
    try {
      if (this.page && !this.page.isClosed()) {
        await this.page
          .evaluate(() => {
            // Clear any running highlight timeouts by clearing a range of timeout IDs
            for (let i = 1; i <= 1000; i++) {
              clearTimeout(i)
            }
          })
          .catch(() => {
            // Ignore errors if execution context is destroyed (e.g., due to navigation)
          })
      }
    } catch (e) {
      // Only log if it's not an execution context error
      if (!e.message.includes('Execution context was destroyed')) {
        console.warn('DOM timeout cleanup warning:', e.message)
        this.hasCleanupError = true
        this.testFailures.push(`DOM cleanup failed: ${e.message}`)
      }
    }

    // If we have cleanup errors, throw to fail the test suite
    if (this.hasCleanupError && this.testFailures.length > 0) {
      const errorMessage = `Test suite cleanup failed: ${this.testFailures.join('; ')}`
      console.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  async _finishTest() {
    if (this.isRunning) {
      try {
        await Promise.race([this._stopBrowser(), new Promise((_, reject) => setTimeout(() => reject(new Error('Test finish timeout')), 10000))])
      } catch (e) {
        console.warn('Warning during test finish cleanup:', e.message)
        // Track cleanup failures to prevent false positives
        this.hasCleanupError = true
        this.testFailures.push(`Test finish cleanup failed: ${e.message}`)

        this.isRunning = false
        // Set flags to prevent further operations after cleanup failure
        this.page = null
        this.browserContext = null
        this.browser = null

        // Propagate the error to fail the test properly
        throw new Error(`Test cleanup failed: ${e.message}`)
      }
    }
  }

  async _cleanup() {
    // Final cleanup when test run completes
    if (this.isRunning) {
      try {
        // Add timeout protection to prevent hanging
        await Promise.race([this._stopBrowser(), new Promise((_, reject) => setTimeout(() => reject(new Error('Browser stop timeout in cleanup')), 10000))])
      } catch (e) {
        console.warn('Warning during final cleanup:', e.message)
        // Force cleanup on timeout
        this.browser = null
        this.browserContext = null
        this.isRunning = false
      }
    } else {
      // Check if we still have a browser object despite isRunning being false
      if (this.browser) {
        try {
          // Add timeout protection to prevent hanging
          await Promise.race([this._stopBrowser(), new Promise((_, reject) => setTimeout(() => reject(new Error('Browser stop timeout in forced cleanup')), 10000))])
        } catch (e) {
          console.warn('Warning during forced cleanup:', e.message)
          // Force cleanup on timeout
          this.browser = null
          this.browserContext = null
        }
      }
    }
  }

  _session() {
    const defaultContext = this.browserContext
    return {
      start: async (sessionName = '', config) => {
        this.debugSection('New Context', config ? JSON.stringify(config) : 'opened')
        this.activeSessionName = sessionName

        let browserContext
        let page
        if (this.isElectron) {
          const browser = await playwright._electron.launch(this.playwrightOptions)
          this.electronSessions.push(browser)
          browserContext = browser.context()
          page = await browser.firstWindow()
        } else {
          try {
            // Check if browser is still available before creating context
            if (!this.browser) {
              throw new Error('Browser is not available for session context creation')
            }
            browserContext = await Promise.race([this.browser.newContext(Object.assign(this.contextOptions, config)), new Promise((_, reject) => setTimeout(() => reject(new Error('New context timeout')), 10000))])
            page = await Promise.race([browserContext.newPage(), new Promise((_, reject) => setTimeout(() => reject(new Error('New page timeout')), 5000))])
          } catch (e) {
            console.warn('Warning during context creation:', e.message)
            if (this.playwrightOptions.userDataDir) {
              browserContext = await playwright[this.options.browser].launchPersistentContext(`${this.userDataDir}_${this.activeSessionName}`, this.playwrightOptions)
              this.browser = browserContext
              page = await browserContext.pages()[0]
            } else {
              throw e
            }
          }
        }

        if (this.options.trace) await browserContext.tracing.start({ screenshots: true, snapshots: true })
        await targetCreatedHandler.call(this, page)
        await this._setPage(page)
        // Create a new page inside context.
        return browserContext
      },
      stop: async () => {
        // is closed by _after
      },
      loadVars: async context => {
        if (context) {
          this.browserContext = context
          const existingPages = await context.pages()
          this.sessionPages[this.activeSessionName] = existingPages[0]
          return this._setPage(this.sessionPages[this.activeSessionName])
        }
      },
      restoreVars: async session => {
        this.withinLocator = null
        this.browserContext = defaultContext

        if (!session) {
          this.activeSessionName = ''
        } else {
          this.activeSessionName = session
        }

        // Safety check: ensure browserContext exists before calling pages()
        if (!this.browserContext) {
          this.debug('Cannot restore session vars: browserContext is undefined')
          return
        }

        try {
          const existingPages = await this.browserContext.pages()
          if (existingPages && existingPages.length > 0) {
            await this._setPage(existingPages[0])
            // Reset context-related variables to ensure clean state after session
            this.context = await this.page
            this.contextLocator = null
            this.frame = null
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
   * Use Playwright API inside a test.
   *
   * First argument is a description of an action.
   * Second argument is async function that gets this helper as parameter.
   *
   * { [`page`](https://github.com/microsoft/playwright/blob/main/docs/src/api/class-page.md), [`browserContext`](https://github.com/microsoft/playwright/blob/main/docs/src/api/class-browsercontext.md) [`browser`](https://github.com/microsoft/playwright/blob/main/docs/src/api/class-browser.md) } objects from Playwright API are available.
   *
   * ```js
   * I.usePlaywrightTo('emulate offline mode', async ({ browserContext }) => {
   *   await browserContext.setOffline(true);
   * });
   * ```
   *
   * @param {string} description used to show in logs.
   * @param {function} fn async function that executed with Playwright helper as arguments
   */
  usePlaywrightTo(description, fn) {
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
    // Clean up previous page event listeners
    if (this.page && this.page !== page) {
      try {
        this.page.removeAllListeners('crash')
        this.page.removeAllListeners('dialog')
        this.page.removeAllListeners('load')
        this.page.removeAllListeners('console')
        this.page.removeAllListeners('requestfinished')
      } catch (e) {
        console.warn('Warning cleaning previous page listeners:', e.message)
      }
    }

    page = await page
    this._addPopupListener(page)
    this.page = page
    if (!page) return

    try {
      this.browserContext.setDefaultTimeout(0)
      page.setDefaultNavigationTimeout(this.options.getPageTimeout)
      page.setDefaultTimeout(this.options.timeout)

      page.on('crash', async () => {
        console.log('ERROR: Page has crashed, closing page!')
        try {
          await page.close()
        } catch (e) {
          console.warn('Warning during crashed page cleanup:', e.message)
        }
      })

      this.context = await this.page
      this.contextLocator = null
      await page.bringToFront()
    } catch (e) {
      console.warn('Warning during page setup:', e.message)
      this.context = await this.page
      this.contextLocator = null
    }
  }

  /**
   * Add the 'dialog' event listener to a page
   * @page {playwright.Page}
   *
   * The popup listener handles the dialog with the predefined action when it appears on the page.
   * It also saves a reference to the object which is used in seeInPopup.
   */
  _addPopupListener(page) {
    if (!page) {
      return
    }
    page.removeAllListeners('dialog')
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
    // Ensure custom locator strategies are registered before browser launch
    // Only init once globally to avoid selector re-registration in workers
    if (!defaultSelectorEnginesInitialized) {
      await this._init()
    }

    if (this.isElectron) {
      this.browser = await playwright._electron.launch(this.playwrightOptions)
    } else if (this.isRemoteBrowser && this.isCDPConnection) {
      try {
        this.browser = await playwright[this.options.browser].connectOverCDP(this.playwrightOptions)
      } catch (err) {
        if (err.toString().indexOf('ECONNREFUSED')) {
          throw new RemoteBrowserConnectionRefused(err)
        }
        throw err
      }
    } else if (this.isRemoteBrowser) {
      try {
        this.browser = await playwright[this.options.browser].connect(this.playwrightOptions)
      } catch (err) {
        if (err.toString().indexOf('ECONNREFUSED')) {
          throw new RemoteBrowserConnectionRefused(err)
        }
        throw err
      }
    } else if (this.playwrightOptions.userDataDir) {
      this.browser = await playwright[this.options.browser].launchPersistentContext(this.userDataDir, this.playwrightOptions)
    } else {
      this.browser = await playwright[this.options.browser].launch(this.playwrightOptions)
    }

    // works only for Chromium
    this.browser.on('targetchanged', target => {
      this.debugSection('Url', target.url())
    })

    this.isRunning = true
    return this.browser
  }

  /**
   * Create a new browser context with a page. \
   * Usually it should be run from a custom helper after call of `_startBrowser()`
   * @param {object} [contextOptions] See https://playwright.dev/docs/api/class-browser#browser-new-context
   */
  async _createContextPage(contextOptions) {
    if (!this.browser) {
      throw new Error('Browser not started. Call _startBrowser() first or disable manualStart option.')
    }
    this.browserContext = await this.browser.newContext(contextOptions)

    const page = await this.browserContext.newPage()
    targetCreatedHandler.call(this, page)
    await this._setPage(page)
  }

  _getType() {
    return this.browser._type
  }

  async _stopBrowser() {
    this.withinLocator = null
    await this._setPage(null)
    this.context = null
    this.frame = null
    popupStore.clear()

    // Remove all event listeners to prevent hanging
    if (this.browser) {
      try {
        this.browser.removeAllListeners()
      } catch (e) {
        // Ignore errors if browser is already closed
      }
    }

    // Close browserContext if recordHar is enabled
    if (this.options.recordHar && this.browserContext) {
      try {
        await this.browserContext.close()
      } catch (e) {
        // Ignore errors if context is already closed
      }
    }
    this.browserContext = null

    // Initiate browser close without waiting for it to complete
    // The browser process will be cleaned up when the Node process exits
    if (this.browser) {
      try {
        // Fire and forget - don't wait for close to complete
        this.browser.close().catch(() => {
          // Silently ignore any errors during async close
        })
      } catch (e) {
        // Ignore any synchronous errors
      }
    }
    this.browser = null
    this.isRunning = false
  }

  async _evaluateHandeInContext(...args) {
    const context = await this._getContext()
    return context.evaluateHandle(...args)
  }

  async _withinBegin(locator) {
    if (this.withinLocator) {
      throw new Error("Can't start within block inside another within block")
    }

    const frame = isFrameLocator(locator)

    if (frame) {
      if (Array.isArray(frame)) {
        // For nested frames, build the complete frame path
        await this.switchTo(null)

        // Build nested frame locator from page
        let frameLocatorObj = this.page
        for (const frameSelector of frame) {
          const selector = buildLocatorString(new Locator(frameSelector, 'css'))
          frameLocatorObj = frameLocatorObj.frameLocator(selector)
        }

        this.frame = frameLocatorObj
        this.context = frameLocatorObj
        this.contextLocator = null
        this.withinLocator = new Locator(frame)
        return
      }
      await this.switchTo(frame)
      this.withinLocator = new Locator(frame)
      return
    }

    const el = await this._locateElement(locator)
    assertElementExists(el, locator)
    this.context = el
    this.contextLocator = locator

    this.withinLocator = new Locator(locator)
  }

  async _withinEnd() {
    this.withinLocator = null
    if (this.page) {
      this.context = await this.page
    } else {
      this.context = null
    }
    this.contextLocator = null
    this.frame = null
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
    if (this.isElectron) {
      throw new Error('Cannot open pages inside an Electron container')
    }

    // Prevent navigation attempts only when manual start is enabled and browser is not running
    // Allow auto-initialization for normal operation (e.g., when using BROWSER_RESTART=browser)
    if (!this.isRunning && this.options.manualStart && (!this.browser || !this.browserContext || !this.page)) {
      throw new Error('Cannot navigate: browser is not running or has been closed')
    }

    if (!/^\w+\:(\/\/|.+)/.test(url)) {
      url = this.options.url + (!this.options.url.endsWith('/') && url.startsWith('/') ? url : `/${url}`)
      this.debug(`Changed URL to base url + relative path: ${url}`)
    }

    if (this.options.basicAuth && this.isAuthenticated !== true) {
      if (url.includes(this.options.url)) {
        await this.browserContext.setHTTPCredentials(this.options.basicAuth)
        this.isAuthenticated = true
      }
    }

    // Ensure browser is initialized before page operations
    if (!this.page) {
      this.debugSection('Auto-initializing', `Browser not started properly. page=${!!this.page}, isRunning=${this.isRunning}, browser=${!!this.browser}, browserContext=${!!this.browserContext}`)

      if (!this.browser) {
        await this._startBrowser()
      }

      // Create browser context and page (simplified version of _before logic)
      if (!this.browserContext) {
        if (!this.browser) {
          throw new Error('Browser is not available for context creation. Browser may have been closed.')
        }
        const contextOptions = {
          ignoreHTTPSErrors: this.options.ignoreHTTPSErrors,
          acceptDownloads: true,
          ...this.options.emulate,
        }

        try {
          this.browserContext = await this.browser.newContext(contextOptions)
        } catch (err) {
          // In worker mode with Playwright 1.x, there's a known issue where newContext() fails
          // with "selector engine already registered" when selectors are registered globally
          // across worker threads. This is safe to retry without ANY custom options.
          if (err.message && err.message.includes('already registered')) {
            this.debugSection('Worker Mode', 'Selector conflict in amOnPage, retrying with empty options')
            // Create context with NO options to avoid selector conflicts
            this.browserContext = await this.browser.newContext()
          } else {
            throw err
          }
        }
      }

      let pages
      let mainPage
      try {
        pages = await this.browserContext.pages()
        mainPage = pages[0] || (await this.browserContext.newPage())
      } catch (e) {
        if (e.message.includes('Target page, context or browser has been closed') || e.message.includes('Browser has been closed')) {
          throw new Error('Cannot create page: browser context has been closed')
        }
        throw e
      }
      await this._setPage(mainPage)

      this.debugSection('Auto-initializing', `Completed. page=${!!this.page}, browserContext=${!!this.browserContext}`)
    }

    // Additional safety check
    if (!this.page) {
      throw new Error(`Page is not initialized after auto-initialization. this.page=${this.page}, this.isRunning=${this.isRunning}, this.browser=${!!this.browser}, this.browserContext=${!!this.browserContext}`)
    }

    try {
      // Additional validation before navigation
      if (this.page && this.page.isClosed && this.page.isClosed()) {
        throw new Error('Cannot navigate: page has been closed')
      }

      if (this.browserContext) {
        // Try to check if context is still valid
        try {
          await Promise.race([this.browserContext.pages(), new Promise((_, reject) => setTimeout(() => reject(new Error('Context check timeout')), 1000))])
        } catch (contextError) {
          throw new Error('Cannot navigate: browser context is invalid or closed')
        }
      }

      await this.page.goto(url, { waitUntil: this.options.waitForNavigation })
    } catch (err) {
      // Handle terminal navigation errors that shouldn't be retried
      if (
        err.message &&
        (err.message.includes('ERR_ABORTED') || err.message.includes('frame was detached') || err.message.includes('Target page, context or browser has been closed') || err.message.includes('Cannot navigate'))
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
   * Unlike other drivers Playwright changes the size of a viewport, not the window!
   * Playwright does not control the window of a browser, so it can't adjust its real size.
   * It also can't maximize a window.
   *
   * Update configuration to change real window size on start:
   *
   * ```js
   * // inside codecept.conf.js
   * // @codeceptjs/configure package must be installed
   * { setWindowSize } = require('@codeceptjs/configure');
   * ````
   *
   * {{> resizeWindow }}
   */
  async resizeWindow(width, height) {
    if (width === 'maximize') {
      throw new Error("Playwright can't control windows, so it can't maximize it")
    }

    await this.page.setViewportSize({ width, height })
    return this._waitForAction()
  }

  /**
   * Set headers for all next requests
   *
   * ```js
   * I.setPlaywrightRequestHeaders({
   *    'X-Sent-By': 'CodeceptJS',
   * });
   * ```
   *
   * @param {object} customHeaders headers to set
   */
  async setPlaywrightRequestHeaders(customHeaders) {
    if (!customHeaders) {
      throw new Error('Cannot send empty headers.')
    }
    return this.browserContext.setExtraHTTPHeaders(customHeaders)
  }

  /**
   * {{> moveCursorTo }}
   *
   */
  async moveCursorTo(locator, offsetX = 0, offsetY = 0) {
    let context = null
    if (typeof offsetX !== 'number') {
      context = offsetX
      offsetX = 0
    }

    let el
    if (context) {
      const contextEls = await this._locate(context)
      assertElementExists(contextEls, context, 'Context element')
      el = await findElements.call(this, contextEls[0], locator)
      assertElementExists(el, locator)
      el = el[0]
    } else {
      el = await this._locateElement(locator)
      assertElementExists(el, locator)
    }

    // Use manual mouse.move instead of .hover() so the offset can be added to the coordinates
    const { x, y } = await clickablePoint(el)
    await this.page.mouse.move(x + offsetX, y + offsetY)
    return this._waitForAction()
  }

  /**
   * {{> focus }}
   *
   */
  async focus(locator, options = {}) {
    const el = await this._locateElement(locator)
    assertElementExists(el, locator, 'Element to focus')

    await el.focus(options)
    return this._waitForAction()
  }

  /**
   * {{> blur }}
   *
   */
  async blur(locator, options = {}) {
    const el = await this._locateElement(locator)
    assertElementExists(el, locator, 'Element to blur')

    await el.blur(options)
    return this._waitForAction()
  }
  /**
   * Return the checked status of given element.
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   * @param {object} [options] See https://playwright.dev/docs/api/class-locator#locator-is-checked
   * @return {Promise<boolean>}
   *
   */

  async grabCheckedElementStatus(locator, options = {}) {
    const supportedTypes = ['checkbox', 'radio']
    const el = await this._locateElement(locator)
    const type = await el.getAttribute('type')

    if (supportedTypes.includes(type)) {
      return el.isChecked(options)
    }
    throw new Error(`Element is not a ${supportedTypes.join(' or ')} input`)
  }
  /**
   * Return the disabled status of given element.
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   * @param {object} [options] See https://playwright.dev/docs/api/class-locator#locator-is-disabled
   * @return {Promise<boolean>}
   *
   */

  async grabDisabledElementStatus(locator, options = {}) {
    const el = await this._locateElement(locator)
    return el.isDisabled(options)
  }

  /**
   *
   * ```js
   * // specify coordinates for source position
   * I.dragAndDrop('img.src', 'img.dst', { sourcePosition: {x: 10, y: 10} })
   * ```
   *
   * > When no option is set, custom drag and drop would be used, to use the dragAndDrop API from Playwright, please set options, for example `force: true`
   *
   * {{> dragAndDrop }}
   * @param {any} [options] [Additional options](https://playwright.dev/docs/api/class-page#page-drag-and-drop) can be passed as 3rd argument.
   *
   */
  async dragAndDrop(srcElement, destElement, options) {
    const src = new Locator(srcElement)
    const dst = new Locator(destElement)
    const context = await this._getContext()

    if (options) {
      return context.dragAndDrop(buildLocatorString(src), buildLocatorString(dst), options)
    }

    const _smallWaitInMs = 600
    await context.locator(buildLocatorString(src)).hover()
    await this.page.mouse.down()
    await this.page.waitForTimeout(_smallWaitInMs)

    const destElBox = await context.locator(buildLocatorString(dst)).boundingBox()

    await this.page.mouse.move(destElBox.x + destElBox.width / 2, destElBox.y + destElBox.height / 2)
    await context.locator(buildLocatorString(dst)).hover({ position: { x: 10, y: 10 } })
    await this.page.waitForTimeout(_smallWaitInMs)
    await this.page.mouse.up()
  }

  /**
   * {{> refreshPage }}
   */
  async refreshPage() {
    return this.page.reload({ timeout: this.options.getPageTimeout, waitUntil: this.options.waitForNavigation })
  }

  /**
   * Replaying from HAR
   *
   * ```js
   *  // Replay API requests from HAR.
   *  // Either use a matching response from the HAR,
   *  // or abort the request if nothing matches.
   *    I.replayFromHar('./output/har/something.har', { url: "*\/**\/api/v1/fruits" });
   *    I.amOnPage('https://demo.playwright.dev/api-mocking');
   *    I.see('CodeceptJS');
   * ```
   *
   * @param {string} harFilePath Path to recorded HAR file
   * @param {object} [opts] [Options for replaying from HAR](https://playwright.dev/docs/api/class-page#page-route-from-har)
   *
   * @returns Promise<void>
   */
  async replayFromHar(harFilePath, opts) {
    const file = path.join(store.codeceptDir, harFilePath)

    if (!fileExists(file)) {
      throw new Error(`File at ${file} cannot be found on local system`)
    }

    await this.page.routeFromHAR(harFilePath, opts)
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
  async scrollPageToBottom() {
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
      assertElementExists(el, locator, 'Element')
      await el.scrollIntoViewIfNeeded()
      const elementCoordinates = await clickablePoint(el)
      await this.executeScript((offsetX, offsetY) => window.scrollBy(offsetX, offsetY), {
        offsetX: elementCoordinates.x + offsetX,
        offsetY: elementCoordinates.y + offsetY,
      })
    } else {
      await this.executeScript(({ offsetX, offsetY }) => window.scrollTo(offsetX, offsetY), { offsetX, offsetY })
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
   * const elements = await this.helpers['Playwright']._locate({name: 'password'});
   * ```
   */
  async _locate(locator) {
    const context = await this._getContext()

    if (this.frame) return findElements.call(this, this.frame, locator)

    const els = await findElements.call(this, context, locator)

    if (store.debugMode) {
      const previewElements = els.slice(0, 3)
      let htmls = await Promise.all(previewElements.map(el => elToString(el, previewElements.length)))
      if (els.length > 3) htmls.push('...')
      if (els.length > 1) {
        this.debugSection(`Elements (${els.length})`, htmls.join('|').trim())
      } else if (els.length === 1) {
        this.debugSection('Element', htmls.join('|').trim())
      } else {
        this.debug(`No elements found by ${JSON.stringify(locator).slice(0, 50)}....`)
      }
    }

    return els
  }

  /**
   * Get the first element by different locator types, including strict locator
   * Should be used in custom helpers:
   *
   * ```js
   * const element = await this.helpers['Playwright']._locateElement({name: 'password'});
   * ```
   */
  async _locateElement(locator) {
    const context = await this._getContext()
    const elements = await findElements.call(this, context, locator)
    if (elements.length === 0) {
      throw new ElementNotFound(locator, 'Element', 'was not found')
    }
    return selectElement(elements, locator, this)
  }

  /**
   * Find a checkbox by providing human-readable text:
   * NOTE: Assumes the checkable element exists
   *
   * ```js
   * this.helpers['Playwright']._locateCheckable('I agree with terms and conditions').then // ...
   * ```
   */
  async _locateCheckable(locator, providedContext = null) {
    const context = providedContext || (await this._getContext())
    const els = await findCheckable.call(this, locator, context)
    assertElementExists(els[0], locator, 'Checkbox or radio')
    return selectElement(els, locator, this)
  }

  /**
   * Find a clickable element by providing human-readable text:
   *
   * ```js
   * this.helpers['Playwright']._locateClickable('Next page').then // ...
   * ```
   */
  async _locateClickable(locator) {
    const context = await this._getContext()
    return findClickable.call(this, context, locator)
  }

  /**
   * Find field elements by providing human-readable text:
   *
   * ```js
   * this.helpers['Playwright']._locateFields('Your email').then // ...
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
    const element = await this._locateElement(locator)
    return new WebElement(element, this)
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
    if (this.isElectron) {
      throw new Error('Cannot switch tabs inside an Electron container')
    }
    const pages = await this.browserContext.pages()

    const index = pages.indexOf(this.page)
    this.withinLocator = null
    const page = pages[index + num]

    if (!page) {
      throw new Error(`There is no ability to switch to next tab with offset ${num}`)
    }
    await targetCreatedHandler.call(this, page)
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
    if (this.isElectron) {
      throw new Error('Cannot switch tabs inside an Electron container')
    }
    const pages = await this.browserContext.pages()
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
    if (this.isElectron) {
      throw new Error('Cannot close current tab inside an Electron container')
    }
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
    const pages = await this.browserContext.pages()
    const otherPages = pages.filter(page => page !== this.page)
    if (otherPages.length) {
      this.debug(`Closing ${otherPages.length} tabs`)
      return Promise.all(otherPages.map(p => p.close()))
    }
    return Promise.resolve()
  }

  /**
   * Open new tab and automatically switched to new tab
   *
   * ```js
   * I.openNewTab();
   * ```
   *
   * You can pass in [page options](https://github.com/microsoft/playwright/blob/main/docs/api.md#browsernewpageoptions) to emulate device on this page
   *
   * ```js
   * // enable mobile
   * I.openNewTab({ isMobile: true });
   * ```
   */
  async openNewTab(options) {
    if (this.isElectron) {
      throw new Error('Cannot open new tabs inside an Electron container')
    }
    const page = await this.browserContext.newPage(options)
    await targetCreatedHandler.call(this, page)
    await this._setPage(page)
    return this._waitForAction()
  }

  /**
   * {{> grabNumberOfOpenTabs }}
   */
  async grabNumberOfOpenTabs() {
    const pages = await this.browserContext.pages()
    return pages.length
  }

  /**
   * {{> seeElement }}
   *
   */
  async seeElement(locator, context = null) {
    let els
    if (context) {
      const contextEls = await this._locate(context)
      assertElementExists(contextEls, context, 'Context element')
      els = await findElements.call(this, contextEls[0], locator)
    } else {
      els = await this._locate(locator)
    }
    els = await Promise.all(els.map(el => el.isVisible()))
    try {
      return empty('visible elements').negate(els.filter(v => v).fill('ELEMENT'))
    } catch (e) {
      dontSeeElementError(locator)
    }
  }

  /**
   * {{> dontSeeElement }}
   *
   */
  async dontSeeElement(locator, context = null) {
    let els
    if (context) {
      const contextEls = await this._locate(context)
      assertElementExists(contextEls, context, 'Context element')
      els = await findElements.call(this, contextEls[0], locator)
    } else {
      els = await this._locate(locator)
    }
    els = await Promise.all(els.map(el => el.isVisible()))
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
   * Handles a file download. A file name is required to save the file on disk.
   * Files are saved to "output" directory.
   *
   * Should be used with [FileSystem helper](https://codecept.io/helpers/FileSystem) to check that file were downloaded correctly.
   *
   * ```js
   * I.handleDownloads('downloads/avatar.jpg');
   * I.click('Download Avatar');
   * I.amInPath('output/downloads');
   * I.waitForFile('avatar.jpg', 5);
   *
   * ```
   *
   * @param {string} fileName set filename for downloaded file
   * @return {Promise<void>}
   */
  async handleDownloads(fileName) {
    this.page.waitForEvent('download').then(async download => {
      const filePath = await download.path()
      fileName = fileName || `downloads/${path.basename(filePath)}`

      const downloadPath = path.join(store.outputDir, fileName)
      if (!fs.existsSync(path.dirname(downloadPath))) {
        fs.mkdirSync(path.dirname(downloadPath), '0777')
      }
      fs.copyFileSync(filePath, downloadPath)
      this.debug('Download completed')
      this.debugSection('Downloaded From', await download.url())
      this.debugSection('Downloaded To', downloadPath)
    })
  }

  /**
   * {{> click }}
   *
   * @param {any} [options] [Additional options](https://playwright.dev/docs/api/class-page#page-click) for click available as 3rd argument.
   *
   * @example
   *
   * ```js
   * // click on element at position
   * I.click('canvas', '.model', { position: { x: 20, y: 40 } })
   *
   * // make ctrl-click
   * I.click('.edit', null, { modifiers: ['Ctrl'] } )
   * ```
   *
   */
  async click(locator = '//body', context = null, options = {}) {
    return proceedClick.call(this, locator, context, options)
  }

  /**
   * {{> forceClick }}
   */
  async forceClick(locator, context = null) {
    return proceedClick.call(this, locator, context, { force: true })
  }

  /**
   * {{> doubleClick }}
   */
  async doubleClick(locator, context = null) {
    return proceedClick.call(this, locator, context, { clickCount: 2 })
  }

  /**
   * {{> rightClick }}
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
    const el = await this._locateElement(locator)
    assertElementExists(el, locator, 'Element to click')

    const box = await el.boundingBox()
    if (!box) {
      throw new Error(`Element ${locator} is not visible or has no bounding box`)
    }

    const absoluteX = box.x + x
    const absoluteY = box.y + y

    await this.page.mouse.click(absoluteX, absoluteY)
    return this._waitForAction()
  }

  /**
   *
   * [Additional options](https://playwright.dev/docs/api/class-elementhandle#element-handle-check) for check available as 3rd argument.
   *
   * Examples:
   *
   * ```js
   * // click on element at position
   * I.checkOption('Agree', '.signup', { position: { x: 5, y: 5 } })
   * ```
   * > ⚠️ To avoid flakiness, option `force: true` is set by default
   *
   * {{> checkOption }}
   *
   */
  async checkOption(field, context = null, options = { force: true }) {
    const elm = await this._locateCheckable(field, context)
    await elm.check(options)
    return this._waitForAction()
  }

  /**
   *
   * [Additional options](https://playwright.dev/docs/api/class-elementhandle#element-handle-uncheck) for uncheck available as 3rd argument.
   *
   * Examples:
   *
   * ```js
   * // click on element at position
   * I.uncheckOption('Agree', '.signup', { position: { x: 5, y: 5 } })
   * ```
   * > ⚠️ To avoid flakiness, option `force: true` is set by default
   *
   * {{> uncheckOption }}
   */
  async uncheckOption(field, context = null, options = { force: true }) {
    const elm = await this._locateCheckable(field, context)
    await elm.uncheck(options)
    return this._waitForAction()
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
   *
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

    // Always use page.keyboard.type for any string (including single character and national characters).
    if (!Array.isArray(keys)) {
      keys = keys.toString()
      const typeDelay = typeof delay === 'number' ? delay : this.options.pressKeyDelay
      await this.page.keyboard.type(keys, { delay: typeDelay })
      return
    }

    // For array input, treat each as a key press to keep working combinations such as ['Control', 'A'] or ['T', 'e', 's', 't'].
    for (const key of keys) {
      await this.page.keyboard.press(key)
      if (delay) await this.wait(delay / 1000)
    }
  }

  /**
   * {{> fillField }}
   *
   */
  async fillField(field, value, context = null) {
    const els = await findFields.call(this, field, context)
    assertElementExists(els, field, 'Field')
    const el = selectElement(els, field, this)

    await highlightActiveElement.call(this, el)

    if (await fillRichEditor(this, el, value)) {
      return this._waitForAction()
    }

    await el.clear()
    if (store.debugMode) this.debugSection('Focused', await elToString(el, 1))

    await el.type(value.toString(), { delay: this.options.pressKeyDelay })

    return this._waitForAction()
  }

  /**
   * {{> clearField }}
   */
  async clearField(locator, context = null) {
    const els = await findFields.call(this, locator, context)
    assertElementExists(els, locator, 'Field to clear')

    const el = selectElement(els, locator, this)

    await highlightActiveElement.call(this, el)

    await el.clear()

    return this._waitForAction()
  }

  /**
   * {{> appendField }}
   */
  async appendField(field, value, context = null) {
    const els = await findFields.call(this, field, context)
    assertElementExists(els, field, 'Field')
    const el = selectElement(els, field, this)
    await highlightActiveElement.call(this, el)
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
   * {{> attachFile }}
   *
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
        await el.setInputFiles(file)
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
    const pageContext = await this.context
    const matchedLocator = new Locator(select)

    let contextEl
    if (context) {
      const contextEls = await this._locate(context)
      assertElementExists(contextEls, context, 'Context element')
      contextEl = contextEls[0]
    }

    // Strict locator
    if (!matchedLocator.isFuzzy()) {
      this.debugSection('SelectOption', `Strict: ${JSON.stringify(select)}`)
      const els = contextEl ? await findElements.call(this, contextEl, matchedLocator) : await this._locate(matchedLocator)
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
    els = await findFields.call(this, select, context)
    assertElementExists(els, select, 'Selectable element')
    return proceedSelect.call(this, pageContext, selectElement(els, select, this), option)
  }

  /**
   * {{> grabNumberOfVisibleElements }}
   *
   */
  async grabNumberOfVisibleElements(locator) {
    let els = await this._locate(locator)
    els = await Promise.all(els.map(el => el.isVisible()))
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
   * const logs = await I.grabBrowserLogs();
   * const errors = logs.map(l => ({ type: l.type(), text: l.text() })).filter(l => l.type === 'error');
   * console.log(JSON.stringify(errors));
   * ```
   * [Learn more about console messages](https://playwright.dev/docs/api/class-consolemessage)
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
   *
   */
  async seeNumberOfElements(locator, num) {
    const elements = await this._locate(locator)
    return equals(`expected number of elements (${new Locator(locator)}) is ${num}, but found ${elements.length}`).assert(elements.length, num)
  }

  /**
   * {{> seeNumberOfVisibleElements }}
   *
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
      return this.browserContext.addCookies(cookie)
    }
    return this.browserContext.addCookies([cookie])
  }

  /**
   * {{> seeCookie }}
   *
   */
  async seeCookie(name) {
    const cookies = await this.browserContext.cookies()
    empty(`cookie ${name} to be set`).negate(cookies.filter(c => c.name === name))
  }

  /**
   * {{> dontSeeCookie }}
   */
  async dontSeeCookie(name) {
    const cookies = await this.browserContext.cookies()
    empty(`cookie ${name} not to be set`).assert(cookies.filter(c => c.name === name))
  }

  /**
   * Returns cookie in JSON format. If name not passed returns all cookies for this domain.
   *
   * {{> grabCookie }}
   */
  async grabCookie(name) {
    if (!this.browserContext) {
      throw new Error('Browser context is not available for grabCookie')
    }

    try {
      const cookies = await this.browserContext.cookies()
      if (!name) return cookies
      const cookie = cookies.filter(c => c.name === name)
      if (cookie[0]) return cookie[0]
    } catch (err) {
      if (err.message.includes('Target page, context or browser has been closed') || err.message.includes('Browser has been closed')) {
        throw new Error('Cannot grab cookies: browser context has been closed')
      }
      throw err
    }
  }

  /**
   * Grab the current storage state (cookies, localStorage, etc.) via Playwright's `browserContext.storageState()`.
   * Returns the raw object that Playwright provides.
   *
   * Security: The returned object can contain authentication tokens, session cookies
   * and (when `indexedDB: true` is used) data that may include user PII. Treat it as a secret.
   * Avoid committing it to source control and prefer storing it in a protected secrets store / CI artifact vault.
   *
   * @param {object} [options]
   * @param {boolean} [options.indexedDB] set to true to include IndexedDB in snapshot (Playwright >=1.51)
   *
   * ```js
   * // basic usage
   * const state = await I.grabStorageState();
   * require('fs').writeFileSync('authState.json', JSON.stringify(state));
   *
   * // include IndexedDB when using Firebase Auth, etc.
   * const stateWithIDB = await I.grabStorageState({ indexedDB: true });
   * ```
   */
  async grabStorageState(options = {}) {
    return this.browserContext.storageState(options)
  }

  /**
   * {{> clearCookie }}
   */
  async clearCookie(cookieName) {
    if (!this.browserContext) return
    if (cookieName) {
      return this.browserContext.clearCookies({ name: cookieName })
    }
    return this.browserContext.clearCookies()
  }

  /**
   * Executes a script on the page:
   *
   * ```js
   * I.executeScript(() => window.alert('Hello world'));
   * ```
   *
   * Additional parameters of the function can be passed as an object argument:
   *
   * ```js
   * I.executeScript(({x, y}) => x + y, {x, y});
   * ```
   * You can pass only one parameter into a function,
   * or you can pass in array or object.
   *
   * ```js
   * I.executeScript(([x, y]) => x + y, [x, y]);
   * ```
   * If a function returns a Promise it will wait for its resolution.
   *
   * @param {string|function} fn function to be executed in browser context.
   * @param {any} [arg] optional argument to pass to the function
   * @returns {Promise<any>}
   */
  async executeScript(fn, arg) {
    if (arg && typeof arg.getNativeElement === 'function') arg = arg.getNativeElement()
    if (arg && typeof arg.evaluate === 'function' && typeof arg.locator === 'function') {
      return arg.evaluate(fn)
    }
    if (this.context && typeof this.context.url !== 'function' && typeof this.context.innerText !== 'function') {
      return this.context.locator(':root').evaluate(fn, arg)
    }
    return this.page.evaluate.apply(this.page, [fn, arg])
  }

  /**
   * Grab Locator if called within Context
   *
   * @param {*} locator
   */
  _contextLocator(locator) {
    const locatorObj = new Locator(locator, 'css')

    locator = buildLocatorString(locatorObj)

    if (this.contextLocator) {
      const contextLocatorObj = new Locator(this.contextLocator, 'css')
      const contextLocator = buildLocatorString(contextLocatorObj)
      locator = `${contextLocator} >> ${locator}`
    }

    return locator
  }

  /**
   * {{> grabTextFrom }}
   *
   */
  async grabTextFrom(locator) {
    const roleElements = await handleRoleLocator(this.page, locator)
    if (roleElements && roleElements.length > 0) {
      const text = await roleElements[0].textContent()
      assertElementExists(text, JSON.stringify(locator))
      this.debugSection('Text', text)
      return text
    }

    const locatorObj = new Locator(locator, 'css')

    locator = this._contextLocator(locator)
    try {
      const text = await this.page.textContent(locator)
      assertElementExists(text, locator)
      this.debugSection('Text', text)
      return text
    } catch (error) {
      // Convert Playwright timeout errors to ElementNotFound for consistency
      if (error.message && error.message.includes('Timeout')) {
        throw new ElementNotFound(locator, 'text')
      }
      throw error
    }
  }

  /**
   * {{> grabTextFromAll }}
   *
   */
  async grabTextFromAll(locator) {
    const els = await this._locate(locator)
    const texts = []
    for (const el of els) {
      texts.push(await el.innerText())
    }
    return texts
  }

  /**
   * {{> grabValueFrom }}
   */
  async grabValueFrom(locator) {
    const values = await this.grabValueFromAll(locator)
    assertElementExists(values, locator)
    this.debugSection('Value', values[0])
    return values[0]
  }

  /**
   * {{> grabValueFromAll }}
   */
  async grabValueFromAll(locator) {
    const els = await findFields.call(this, locator)
    return Promise.all(els.map(el => el.inputValue()))
  }

  /**
   * {{> grabHTMLFrom }}
   */
  async grabHTMLFrom(locator) {
    const html = await this.grabHTMLFromAll(locator)
    assertElementExists(html, locator)
    this.debugSection('HTML', html[0])
    return html[0]
  }

  /**
   * {{> grabHTMLFromAll }}
   */
  async grabHTMLFromAll(locator) {
    const els = await this._locate(locator)
    return Promise.all(els.map(el => el.innerHTML()))
  }

  /**
   * {{> grabCssPropertyFrom }}
   *
   */
  async grabCssPropertyFrom(locator, cssProperty) {
    const cssValues = await this.grabCssPropertyFromAll(locator, cssProperty)
    assertElementExists(cssValues, locator)
    this.debugSection('CSS', cssValues[0])
    return cssValues[0]
  }

  /**
   * {{> grabCssPropertyFromAll }}
   *
   */
  async grabCssPropertyFromAll(locator, cssProperty) {
    const els = await this._locate(locator)
    const cssValues = await Promise.all(els.map(el => el.evaluate((el, cssProperty) => getComputedStyle(el).getPropertyValue(cssProperty), cssProperty)))

    return cssValues
  }

  /**
   * {{> seeCssPropertiesOnElements }}
   *
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
   *
   */
  async seeAttributesOnElements(locator, attributes) {
    const res = await this._locate(locator)
    assertElementExists(res, locator)

    const elemAmount = res.length
    const commands = []
    res.forEach(el => {
      Object.keys(attributes).forEach(prop => {
        commands.push(el.evaluate((el, attr) => el[attr] || el.getAttribute(attr), prop))
      })
    })
    let attrs = await Promise.all(commands)
    const values = Object.keys(attributes).map(key => attributes[key])
    if (!Array.isArray(attrs)) attrs = [attrs]
    let chunked = chunkArray(attrs, values.length)
    chunked = chunked.filter(val => {
      for (let i = 0; i < val.length; ++i) {
        // the attribute could be a boolean
        if (typeof val[i] === 'boolean') return val[i] === values[i]
        // if the attribute doesn't exist, returns false as well
        if (!val[i] || !val[i].includes(values[i])) return false
      }
      return true
    })
    return equals(`all elements (${new Locator(locator)}) to have attributes ${JSON.stringify(attributes)}`).assert(chunked.length, elemAmount)
  }

  /**
   * {{> dragSlider }}
   *
   */
  async dragSlider(locator, offsetX = 0) {
    const src = await this._locateElement(locator)
    assertElementExists(src, locator, 'Slider Element')

    // Note: Using clickablePoint private api because the .BoundingBox does not take into account iframe offsets!
    const sliderSource = await clickablePoint(src)

    // Drag start point
    await this.page.mouse.move(sliderSource.x, sliderSource.y, { steps: 5 })
    await this.page.mouse.down()

    // Drag destination
    await this.page.mouse.move(sliderSource.x + offsetX, sliderSource.y, { steps: 5 })
    await this.page.mouse.up()

    return this._waitForAction()
  }

  /**
   * {{> grabAttributeFrom }}
   *
   */
  async grabAttributeFrom(locator, attr) {
    const attrs = await this.grabAttributeFromAll(locator, attr)
    assertElementExists(attrs, locator)
    this.debugSection('Attribute', attrs[0])
    return attrs[0]
  }

  /**
   * {{> grabAttributeFromAll }}
   *
   */
  async grabAttributeFromAll(locator, attr) {
    const els = await this._locate(locator)
    const array = []

    for (let index = 0; index < els.length; index++) {
      array.push(await els[index].getAttribute(attr))
    }

    return array
  }

  /**
   * Retrieves the ARIA snapshot for an element using Playwright's [`locator.ariaSnapshot`](https://playwright.dev/docs/api/class-locator#locator-aria-snapshot).
   * This method returns a YAML representation of the accessibility tree that can be used for assertions.
   * If no locator is provided, it captures the snapshot of the entire page body.
   *
   * ```js
   * const snapshot = await I.grabAriaSnapshot();
   * expect(snapshot).toContain('heading "Sign up"');
   *
   * const formSnapshot = await I.grabAriaSnapshot('#login-form');
   * expect(formSnapshot).toContain('textbox "Email"');
   * ```
   *
   * [Learn more about ARIA snapshots](https://playwright.dev/docs/aria-snapshots)
   *
   * @param {string|object} [locator='//body'] element located by CSS|XPath|strict locator. Defaults to body element.
   * @return {Promise<string>} YAML representation of the accessibility tree
   */
  async grabAriaSnapshot(locator = '//body') {
    const matchedLocator = new Locator(locator)
    const els = await this._locate(matchedLocator)
    assertElementExists(els, locator)
    const snapshot = await els[0].ariaSnapshot()
    this.debugSection('Aria Snapshot', `${snapshot.split('\n').length} lines`)
    return snapshot
  }

  /**
   * {{> saveElementScreenshot }}
   *
   */
  async saveElementScreenshot(locator, fileName) {
    const outputFile = screenshotOutputFolder(fileName)

    const res = await this._locateElement(locator)
    assertElementExists(res, locator)
    const elem = res
    return elem.screenshot({ path: outputFile, type: 'png' })
  }

  /**
   * {{> saveScreenshot }}
   */
  async saveScreenshot(fileName, fullPage) {
    const fullPageOption = fullPage || this.options.fullPageScreenshots
    let outputFile = screenshotOutputFolder(fileName)

    this.debugSection('Screenshot', relativeDir(outputFile))

    if (!this.page || !this.browser || !this.browserContext) {
      this.debug(`Cannot take screenshot: page=${!!this.page}, browser=${!!this.browser}, browserContext=${!!this.browserContext}`)
      return
    }
    if (this.page.isClosed && this.page.isClosed()) {
      this.debug('Cannot take screenshot: page is closed')
      return
    }

    try {
      await Promise.race([
        this.page.screenshot({
          path: outputFile,
          fullPage: fullPageOption,
          type: 'png',
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Screenshot timeout')), 5000)),
      ])
    } catch (err) {
      this.debug(`Failed to take screenshot: ${err.message}`)

      this.hasCleanupError = true
      this.testFailures.push(`Screenshot failed: ${err.message}`)

      if (err.message.includes('closed') || err.message.includes('Protocol error') || err.message.includes('timeout')) {
        this.debug('Screenshot failed due to browser/page closure or timeout, continuing...')
        return
      }
      throw err
    }

    // Handle session screenshots for ALL sessions, not just active one
    if (this.sessionPages && Object.keys(this.sessionPages).length > 0) {
      for (const sessionName in this.sessionPages) {
        const sessionPage = this.sessionPages[sessionName]
        outputFile = screenshotOutputFolder(`${sessionName}_${fileName}`)

        this.debugSection('Screenshot', `${sessionName} - ${relativeDir(outputFile)}`)

        try {
          // Add timeout protection for session screenshots
          await Promise.race([
            (async () => {
              if (sessionPage && !sessionPage.isClosed()) {
                await sessionPage.screenshot({
                  path: outputFile,
                  fullPage: fullPageOption,
                  type: 'png',
                })
              } else {
                this.debug(`Cannot take session screenshot: session page for '${sessionName}' is closed or undefined`)
              }
            })(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Session screenshot timeout')), 3000)),
          ])
        } catch (err) {
          this.debug(`Failed to take session screenshot for '${sessionName}': ${err.message}`)

          // Track session screenshot failures
          this.hasCleanupError = true
          this.testFailures.push(`Session screenshot failed for '${sessionName}': ${err.message}`)

          // Don't throw here - main screenshot was successful and we don't want to hang
          // Just log and continue
        }
      }
    }
  }

  /**
   * Performs [api request](https://playwright.dev/docs/api/class-apirequestcontext#api-request-context-get) using
   * the cookies from the current browser session.
   *
   * ```js
   * const users = await I.makeApiRequest('GET', '/api/users', { params: { page: 1 }});
   * users[0]
   * I.makeApiRequest('PATCH', )
   * ```
   *
   * > This is Playwright's built-in alternative to using REST helper's sendGet, sendPost, etc methods.
   *
   * @param {string} method HTTP method
   * @param {string} url endpoint
   * @param {object} options request options depending on method used
   * @returns {Promise<object>} response
   */
  async makeApiRequest(method, url, options) {
    method = method.toLowerCase()
    const allowedMethods = ['get', 'post', 'patch', 'head', 'fetch', 'delete']
    if (!allowedMethods.includes(method)) {
      throw new Error(`Method ${method} is not allowed, use the one from a list ${allowedMethods} or switch to using REST helper`)
    }

    if (url.startsWith('/')) {
      // local url
      url = this.options.url + url
      this.debugSection('URL', url)
    }

    const response = await this.page.request[method](url, options)
    this.debugSection('Status', response.status())
    this.debugSection('Response', await response.text())

    // hook to allow JSON response handle this
    if (this.options.onResponse) {
      const axiosResponse = {
        data: await response.json(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
      }
      this.options.onResponse(axiosResponse)
    }

    return response
  }

  async _failed(test) {
    await this._withinEnd()

    if (!test.artifacts) {
      test.artifacts = {}
    }

    if (this.options.recordVideo && this.page && this.page.video()) {
      test.artifacts.video = saveVideoForPage(this.page, `${test.title}.failed`)
      for (const sessionName in this.sessionPages) {
        if (sessionName === '') continue
        test.artifacts[`video_${sessionName}`] = saveVideoForPage(this.sessionPages[sessionName], `${sessionName}_${test.title}.failed`)
      }
    }

    if (this.options.trace) {
      test.artifacts.trace = await saveTraceForContext(this.browserContext, `${test.title}.failed`)
      for (const sessionName in this.sessionPages) {
        if (sessionName === '') continue
        const sessionPage = this.sessionPages[sessionName]
        const sessionContext = sessionPage.context()
        if (!sessionContext || !sessionContext.tracing) continue
        test.artifacts[`trace_${sessionName}`] = await saveTraceForContext(sessionContext, `${sessionName}_${test.title}.failed`)
      }
    }

    if (this.options.recordHar) {
      test.artifacts.har = this.currentRunningTest.artifacts.har
    }
  }

  async _passed(test) {
    if (this.options.recordVideo && this.page && this.page.video()) {
      if (this.options.keepVideoForPassedTests) {
        test.artifacts.video = saveVideoForPage(this.page, `${test.title}.passed`)
        for (const sessionName of Object.keys(this.sessionPages)) {
          if (sessionName === '') continue
          test.artifacts[`video_${sessionName}`] = saveVideoForPage(this.sessionPages[sessionName], `${sessionName}_${test.title}.passed`)
        }
      } else {
        this.page
          .video()
          .delete()
          .catch(e => {})
      }
    }

    if (this.options.trace) {
      if (this.options.keepTraceForPassedTests) {
        if (this.options.trace) {
          test.artifacts.trace = await saveTraceForContext(this.browserContext, `${test.title}.passed`)
          for (const sessionName in this.sessionPages) {
            if (sessionName === '') continue
            const sessionPage = this.sessionPages[sessionName]
            const sessionContext = sessionPage.context()
            if (!sessionContext || !sessionContext.tracing) continue
            test.artifacts[`trace_${sessionName}`] = await saveTraceForContext(sessionContext, `${sessionName}_${test.title}.passed`)
          }
        }
      } else {
        await this.browserContext.tracing.stop()
      }
    }

    if (this.options.recordHar) {
      test.artifacts.har = this.currentRunningTest.artifacts.har
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

    let waiter
    const context = await this._getContext()
    if (!locator.isXPath()) {
      const valueFn = function ([locator]) {
        return Array.from(document.querySelectorAll(locator)).filter(el => !el.disabled).length > 0
      }
      waiter = context.waitForFunction(valueFn, [locator.value], { timeout: waitTimeout })
    } else {
      const enabledFn = function ([locator, $XPath]) {
        eval($XPath)
        return $XPath(null, locator).filter(el => !el.disabled).length > 0
      }
      waiter = context.waitForFunction(enabledFn, [locator.value, $XPath.toString()], { timeout: waitTimeout })
    }
    return waiter.catch(err => {
      throw new Error(`element (${locator.toString()}) still not enabled after ${waitTimeout / 1000} sec\n${err.message}`)
    })
  }

  /**
   * {{> waitForDisabled }}
   */
  async waitForDisabled(locator, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout
    locator = new Locator(locator, 'css')

    let waiter
    const context = await this._getContext()
    if (!locator.isXPath()) {
      const valueFn = function ([locator]) {
        return Array.from(document.querySelectorAll(locator)).filter(el => el.disabled).length > 0
      }
      waiter = context.waitForFunction(valueFn, [locator.value], { timeout: waitTimeout })
    } else {
      const disabledFn = function ([locator, $XPath]) {
        eval($XPath)
        return $XPath(null, locator).filter(el => el.disabled).length > 0
      }
      waiter = context.waitForFunction(disabledFn, [locator.value, $XPath.toString()], { timeout: waitTimeout })
    }
    return waiter.catch(err => {
      throw new Error(`element (${locator.toString()}) is still enabled after ${waitTimeout / 1000} sec\n${err.message}`)
    })
  }

  /**
   * {{> waitForValue }}
   */
  async waitForValue(field, value, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout
    const locator = new Locator(field, 'css')
    const matcher = await this.context
    let waiter
    const context = await this._getContext()
    if (!locator.isXPath()) {
      const valueFn = function ([locator, value]) {
        return Array.from(document.querySelectorAll(locator)).filter(el => (el.value || '').indexOf(value) !== -1).length > 0
      }
      waiter = context.waitForFunction(valueFn, [locator.value, value], { timeout: waitTimeout })
    } else {
      const valueFn = function ([locator, $XPath, value]) {
        eval($XPath)
        return $XPath(null, locator).filter(el => (el.value || '').indexOf(value) !== -1).length > 0
      }
      waiter = context.waitForFunction(valueFn, [locator.value, $XPath.toString(), value], {
        timeout: waitTimeout,
      })
    }
    return waiter.catch(err => {
      const loc = locator.toString()
      throw new Error(`element (${loc}) is not in DOM or there is no element(${loc}) with value "${value}" after ${waitTimeout / 1000} sec\n${err.message}`)
    })
  }

  /**
   * {{> waitNumberOfVisibleElements }}
   *
   */
  async waitNumberOfVisibleElements(locator, num, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout
    locator = new Locator(locator, 'css')

    let waiter
    const context = await this._getContext()
    if (locator.isCSS()) {
      const visibleFn = function ([locator, num]) {
        const els = document.querySelectorAll(locator)
        if (!els || els.length === 0) {
          return false
        }
        return Array.prototype.filter.call(els, el => el.offsetParent !== null).length === num
      }
      waiter = context.waitForFunction(visibleFn, [locator.value, num], { timeout: waitTimeout })
    } else {
      const visibleFn = function ([locator, $XPath, num]) {
        eval($XPath)
        return $XPath(null, locator).filter(el => el.offsetParent !== null).length === num
      }
      waiter = context.waitForFunction(visibleFn, [locator.value, $XPath.toString(), num], {
        timeout: waitTimeout,
      })
    }
    return waiter.catch(err => {
      throw new Error(`The number of elements (${locator.toString()}) is not ${num} after ${waitTimeout / 1000} sec\n${err.message}`)
    })
  }

  /**
   * {{> waitForClickable }}
   */
  async waitForClickable(locator, waitTimeout) {
    console.log('I.waitForClickable is DEPRECATED: This is no longer needed, Playwright automatically waits for element to be clickable')
    console.log('Remove usage of this function')
  }

  /**
   * {{> waitForElement }}
   *
   */
  async waitForElement(locator, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout
    locator = new Locator(locator, 'css')

    const context = await this._getContext()
    try {
      await context.locator(buildLocatorString(locator)).first().waitFor({ timeout: waitTimeout, state: 'attached' })
    } catch (e) {
      throw new Error(`element (${locator.toString()}) still not present on page after ${waitTimeout / 1000} sec\n${e.message}`)
    }
  }

  /**
   * {{> waitForVisible }}
   */
  async waitForVisible(locator, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout
    locator = new Locator(locator, 'css')

    const context = await this._getContext()
    let count = 0

    // we have this as https://github.com/microsoft/playwright/issues/26829 is not yet implemented
    let waiter
    if (this.frame) {
      do {
        waiter = await this.frame.locator(buildLocatorString(locator)).first().isVisible()
        await this.wait(1)
        count += 1000
        if (waiter) break
      } while (count <= waitTimeout)

      if (!waiter) throw new Error(`element (${locator.toString()}) still not visible after ${waitTimeout / 1000} sec.`)
    }

    try {
      await context.locator(buildLocatorString(locator)).first().waitFor({ timeout: waitTimeout, state: 'visible' })
    } catch (e) {
      throw new Error(`element (${locator.toString()}) still not visible after ${waitTimeout / 1000} sec\n${e.message}`)
    }
  }

  /**
   * {{> waitForInvisible }}
   */
  async waitForInvisible(locator, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout
    locator = new Locator(locator, 'css')

    const context = await this._getContext()
    let waiter
    let count = 0

    // we have this as https://github.com/microsoft/playwright/issues/26829 is not yet implemented
    if (this.frame) {
      do {
        waiter = await this.frame.locator(buildLocatorString(locator)).first().isHidden()
        await this.wait(1)
        count += 1000
        if (waiter) break
      } while (count <= waitTimeout)

      if (!waiter) throw new Error(`element (${locator.toString()}) still visible after ${waitTimeout / 1000} sec.`)
      return
    }

    try {
      await context.locator(buildLocatorString(locator)).first().waitFor({ timeout: waitTimeout, state: 'hidden' })
    } catch (e) {
      throw new Error(`element (${locator.toString()}) still visible after ${waitTimeout / 1000} sec\n${e.message}`)
    }
  }

  /**
   * {{> waitToHide }}
   */
  async waitToHide(locator, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout
    locator = new Locator(locator, 'css')

    const context = await this._getContext()
    let waiter
    let count = 0

    // we have this as https://github.com/microsoft/playwright/issues/26829 is not yet implemented
    if (this.frame) {
      do {
        waiter = await this.frame.locator(buildLocatorString(locator)).first().isHidden()
        await this.wait(1)
        count += 1000
        if (waiter) break
      } while (count <= waitTimeout)

      if (!waiter) throw new Error(`element (${locator.toString()}) still not hidden after ${waitTimeout / 1000} sec.`)
      return
    }

    return context
      .locator(buildLocatorString(locator))
      .first()
      .waitFor({ timeout: waitTimeout, state: 'hidden' })
      .catch(err => {
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
    if (this.context) {
      return this.context
    }
    if (this.frame) {
      return this.frame
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
        expectedUrl,
        { timeout: waitTimeout },
      )
      .catch(async e => {
        const currUrl = await this._getPageUrl()
        if (/Timeout/i.test(e.message)) {
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

    try {
      await this.page.waitForURL(
        url => url.href === expectedUrl,
        { timeout: waitTimeout },
      )
    } catch (e) {
      const currUrl = await this._getPageUrl()
      if (/Timeout/i.test(e.message)) {
        throw new Error(`expected url to be ${expectedUrl}, but found ${currUrl}`)
      } else {
        throw e
      }
    }
  }

  /**
   * {{> waitCurrentPathEquals }}
   */
  async waitCurrentPathEquals(path, sec = null) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout
    const normalizedPath = normalizePath(path)

    try {
      await this.page.waitForFunction(
        expectedPath => {
          const actualPath = window.location.pathname
          const normalizePath = p => (p === '' || p === '/' ? '/' : p.replace(/\/+/g, '/').replace(/\/$/, '') || '/')
          return normalizePath(actualPath) === expectedPath
        },
        normalizedPath,
        { timeout: waitTimeout },
      )
    } catch (e) {
      const currentUrl = await this._getPageUrl()
      const baseUrl = this.options.url || 'http://localhost'
      const actualPath = new URL(currentUrl, baseUrl).pathname
      if (/Timeout/i.test(e.message)) {
        throw new Error(`expected path to be ${normalizedPath}, but found ${normalizePath(actualPath)}`)
      } else {
        throw e
      }
    }
  }

  /**
   * {{> waitForText }}
   */
  async waitForText(text, sec = null, context = null) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout
    const errorMessage = `Text "${text}" was not found on page after ${waitTimeout / 1000} sec.`

    const contextObject = await this._getContext()

    if (context) {
      const locator = new Locator(context, 'css')
      try {
        if (!locator.isXPath()) {
          return contextObject
            .locator(`${locator.simplify()} >> text=${text}`)
            .first()
            .waitFor({ timeout: waitTimeout, state: 'visible' })
            .catch(e => {
              throw new Error(errorMessage)
            })
        }

        if (locator.isXPath()) {
          return contextObject
            .waitForFunction(
              ([locator, text, $XPath]) => {
                eval($XPath)
                const el = $XPath(null, locator)
                if (!el.length) return false
                return el[0].innerText.indexOf(text) > -1
              },
              [locator.value, text, $XPath.toString()],
              { timeout: waitTimeout },
            )
            .catch(e => {
              throw new Error(errorMessage)
            })
        }
      } catch (e) {
        throw new Error(`${errorMessage}\n${e.message}`)
      }
    }

    // Based on original implementation but fixed to check title text and remove problematic promiseRetry
    // Original used timeoutGap for waitForFunction to give it slightly more time than the locator
    const timeoutGap = waitTimeout + 1000

    return Promise.race([
      // Strategy 1: waitForFunction that checks both body AND title text
      // Use this.page instead of contextObject because FrameLocator doesn't have waitForFunction
      // Original only checked document.body.innerText, missing title text like "TestEd"
      this.page.waitForFunction(
        function (text) {
          // Check body text (original behavior)
          if (document.body && document.body.innerText && document.body.innerText.indexOf(text) > -1) {
            return true
          }
          // Check document title (fixes the TestEd in title issue)
          if (document.title && document.title.indexOf(text) > -1) {
            return true
          }
          return false
        },
        text,
        { timeout: timeoutGap },
      ),
      // Strategy 2: Native Playwright text locator (replaces problematic promiseRetry)
      contextObject
        .locator(`:has-text(${JSON.stringify(text)})`)
        .first()
        .waitFor({ timeout: waitTimeout }),
    ]).catch(err => {
      throw new Error(errorMessage)
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
   * I.waitForResponse(response => response.url() === 'https://example.com' && response.status() === 200);
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

      let childFrames = null
      if (this.context && typeof this.context.childFrames === 'function') {
        childFrames = this.context.childFrames()
      } else {
        childFrames = this.page.mainFrame().childFrames()
      }

      if (locator >= 0 && locator < childFrames.length) {
        try {
          this.context = await Promise.race([this.page.frameLocator('iframe').nth(locator), new Promise((_, reject) => setTimeout(() => reject(new Error('Frame locator timeout')), 5000))])
          this.contextLocator = locator
        } catch (e) {
          console.warn('Warning during frame selection:', e.message)
          throw new Error('Element #invalidIframeSelector was not found by text|CSS|XPath')
        }
      } else {
        throw new Error('Element #invalidIframeSelector was not found by text|CSS|XPath')
      }
      return
    }

    if (!locator) {
      this.context = this.page
      this.contextLocator = null
      this.frame = null
      return
    }

    // iframe by selector
    locator = buildLocatorString(new Locator(locator, 'css'))

    let frame
    try {
      frame = await Promise.race([this._locateElement(locator), new Promise((_, reject) => setTimeout(() => reject(new Error('Locate frame timeout')), 5000))])
    } catch (e) {
      console.warn('Warning during frame location:', e.message)
      frame = null
    }

    if (!frame) {
      throw new Error(`Frame ${JSON.stringify(locator)} was not found by text|CSS|XPath`)
    }

    try {
      // Always create frame locator from page to avoid nested frame paths
      this.frame = await Promise.race([this.page.frameLocator(locator), new Promise((_, reject) => setTimeout(() => reject(new Error('Frame locator timeout')), 5000))])
    } catch (e) {
      console.warn('Warning during frame locator creation:', e.message)
      throw new Error(`Frame ${JSON.stringify(locator)} could not be accessed`)
    }

    const contentFrame = this.frame

    if (contentFrame) {
      this.context = contentFrame
      this.contextLocator = null
    } else {
      try {
        this.context = this.page.frame(this.page.frames()[1].name())
        this.contextLocator = locator
      } catch (e) {
        console.warn('Warning during frame context setup:', e.message)
        this.context = this.page
        this.contextLocator = null
      }
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
    return context.waitForFunction(fn, args, { timeout: waitTimeout })
  }

  /**
   * Waits for navigation to finish. By default, it takes configured `waitForNavigation` option.
   *
   * See [Playwright's reference](https://playwright.dev/docs/api/class-page#page-wait-for-navigation)
   *
   * @param {*} options
   */
  async waitForNavigation(options = {}) {
    console.log(`waitForNavigation deprecated:
    * This method is inherently racy, please use 'waitForURL' instead.`)
    options = {
      timeout: this.options.getPageTimeout,
      waitUntil: this.options.waitForNavigation,
      ...options,
    }
    return this.page.waitForNavigation(options)
  }

  /**
   * Waits for page navigates to a new URL or reloads. By default, it takes configured `waitForNavigation` option.
   *
   * See [Playwright's reference](https://playwright.dev/docs/api/class-page#page-wait-for-url)
   *
   * @param {string|RegExp} url - A glob pattern, regex pattern or predicate receiving URL to match while waiting for the navigation. Note that if the parameter is a string without wildcard characters, the method will wait for navigation to URL that is exactly equal to the string.
   * @param {*} options
   */
  async waitForURL(url, options = {}) {
    options = {
      timeout: this.options.getPageTimeout,
      waitUntil: this.options.waitForNavigation,
      ...options,
    }
    return this.page.waitForURL(url, options)
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
    if (!locator.isXPath()) {
      try {
        await context
          .locator(locator.simplify())
          .first()
          .waitFor({ timeout: waitTimeout, state: 'detached' })
      } catch (e) {
        throw new Error(`element (${locator.toString()}) still on page after ${waitTimeout / 1000} sec\n${e.message}`)
      }
    } else {
      const visibleFn = function ([locator, $XPath]) {
        eval($XPath)
        return $XPath(null, locator).length === 0
      }
      waiter = context.waitForFunction(visibleFn, [locator.value, $XPath.toString()], { timeout: waitTimeout })
      return waiter.catch(err => {
        throw new Error(`element (${locator.toString()}) still on page after ${waitTimeout / 1000} sec\n${err.message}`)
      })
    }
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
          const cookies = await this.browserContext.cookies()
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
    const el = await this._locateElement(locator)
    assertElementExists(el, locator)
    const rect = await el.boundingBox()
    if (prop) return rect[prop]
    return rect
  }

  /**
   * Mocks network request using [`browserContext.route`](https://playwright.dev/docs/api/class-browsercontext#browser-context-route) of Playwright
   *
   * ```js
   * I.mockRoute(/(\.png$)|(\.jpg$)/, route => route.abort());
   * ```
   * This method allows intercepting and mocking requests & responses. [Learn more about it](https://playwright.dev/docs/network#handle-requests)
   *
   * @param {string|RegExp} [url] URL, regex or pattern for to match URL
   * @param {function} [handler] a function to process request
   */
  async mockRoute(url, handler) {
    return this.browserContext.route(...arguments)
  }

  /**
   * Stops network mocking created by `mockRoute`.
   *
   * ```js
   * I.stopMockingRoute(/(\.png$)|(\.jpg$)/);
   * I.stopMockingRoute(/(\.png$)|(\.jpg$)/, previouslySetHandler);
   * ```
   * If no handler is passed, all mock requests for the rote are disabled.
   *
   * @param {string|RegExp} [url] URL, regex or pattern for to match URL
   * @param {function} [handler] a function to process request
   */
  async stopMockingRoute(url, handler) {
    return this.browserContext.unroute(...arguments)
  }

  /**
   * {{> startRecordingTraffic }}
   *
   */
  startRecordingTraffic() {
    this.flushNetworkTraffics()
    this.recording = true
    this.recordedAtLeastOnce = true

    this.page.on('requestfinished', async request => {
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

      this.requests.push(information)
    })
  }

  /**
   * Blocks traffic of a given URL or a list of URLs.
   *
   * Examples:
   *
   * ```js
   * I.blockTraffic('http://example.com/css/style.css');
   * I.blockTraffic('http://example.com/css/*.css');
   * I.blockTraffic('http://example.com/**');
   * I.blockTraffic(/\.css$/);
   * ```
   *
   * ```js
   * I.blockTraffic(['http://example.com/css/style.css', 'http://example.com/css/*.css']);
   * ```
   *
   * @param {string|Array|RegExp} urls URL or a list of URLs to block . URL can contain * for wildcards. Example: https://www.example.com** to block all traffic for that domain. Regexp are also supported.
   */
  blockTraffic(urls) {
    if (Array.isArray(urls)) {
      urls.forEach(url => {
        this.page.route(url, route => {
          route
            .abort()
            // Sometimes it happens that browser has been closed in the meantime. It is ok to ignore error then.
            .catch(e => {})
        })
      })
    } else {
      this.page.route(urls, route => {
        route
          .abort()
          // Sometimes it happens that browser has been closed in the meantime. It is ok to ignore error then.
          .catch(e => {})
      })
    }
  }

  /**
   * Mocks traffic for URL(s).
   * This is a powerful feature to manipulate network traffic. Can be used e.g. to stabilize your tests, speed up your tests or as a last resort to make some test scenarios even possible.
   *
   * Examples:
   *
   * ```js
   * I.mockTraffic('/api/users/1', '{ id: 1, name: 'John Doe' }');
   * I.mockTraffic('/api/users/*', JSON.stringify({ id: 1, name: 'John Doe' }));
   * I.mockTraffic([/^https://api.example.com/v1/, 'https://api.example.com/v2/**'], 'Internal Server Error', 'text/html');
   * ```
   *
   * @param urls string|Array These are the URL(s) to mock, e.g. "/fooapi/*" or "['/fooapi_1/*', '/barapi_2/*']". Regular expressions are also supported.
   * @param responseString string The string to return in fake response's body.
   * @param contentType Content type of fake response. If not specified default value 'application/json' is used.
   */
  mockTraffic(urls, responseString, contentType = 'application/json') {
    // Required to mock cross-domain requests
    const headers = { 'access-control-allow-origin': '*' }

    if (typeof urls === 'string') {
      urls = [urls]
    }

    urls.forEach(url => {
      this.page.route(url, route => {
        if (this.page.isClosed()) {
          // Sometimes it happens that browser has been closed in the meantime.
          // In this case we just don't fulfill to prevent error in test scenario.
          return
        }
        route.fulfill({
          contentType,
          headers,
          body: responseString,
        })
      })
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
  stopRecordingTraffic() {
    stopRecordingTraffic.call(this)
  }

  /**
   * Returns full URL of request matching parameter "urlMatch".
   *
   * Examples:
   *
   * ```js
   * I.grabTrafficUrl('https://api.example.com/session');
   * I.grabTrafficUrl(/session.*start/);
   * ```
   *
   * @param {string|RegExp} urlMatch Expected URL of request in network traffic. Can be a string or a regular expression.
   * @return {Promise<*>}
   */
  grabTrafficUrl(urlMatch) {
    if (!this.recordedAtLeastOnce) {
      throw new Error('Failure in test automation. You use "I.grabTrafficUrl", but "I.startRecordingTraffic" was never called before.')
    }

    for (const i in this.requests) {
      if (this.requests.hasOwnProperty(i)) {
        const request = this.requests[i]

        if (request.url && request.url.match(new RegExp(urlMatch))) {
          return request.url
        }
      }
    }

    assert.fail(`Method "getTrafficUrl" failed: No request found in traffic that matches ${urlMatch}`)
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
   * @return { Array<any> }
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

  /**
   * Return a performance metric from the chrome cdp session.
   * Note: Chrome-only
   *
   * Examples:
   *
   * ```js
   * const metrics = await I.grabMetrics();
   *
   * // returned metrics
   *
   * [
   *   { name: 'Timestamp', value: 1584904.203473 },
   *   { name: 'AudioHandlers', value: 0 },
   *   { name: 'AudioWorkletProcessors', value: 0 },
   *   { name: 'Documents', value: 22 },
   *   { name: 'Frames', value: 10 },
   *   { name: 'JSEventListeners', value: 366 },
   *   { name: 'LayoutObjects', value: 1240 },
   *   { name: 'MediaKeySessions', value: 0 },
   *   { name: 'MediaKeys', value: 0 },
   *   { name: 'Nodes', value: 4505 },
   *   { name: 'Resources', value: 141 },
   *   { name: 'ContextLifecycleStateObservers', value: 34 },
   *   { name: 'V8PerContextDatas', value: 4 },
   *   { name: 'WorkerGlobalScopes', value: 0 },
   *   { name: 'UACSSResources', value: 0 },
   *   { name: 'RTCPeerConnections', value: 0 },
   *   { name: 'ResourceFetchers', value: 22 },
   *   { name: 'AdSubframes', value: 0 },
   *   { name: 'DetachedScriptStates', value: 2 },
   *   { name: 'ArrayBufferContents', value: 1 },
   *   { name: 'LayoutCount', value: 0 },
   *   { name: 'RecalcStyleCount', value: 0 },
   *   { name: 'LayoutDuration', value: 0 },
   *   { name: 'RecalcStyleDuration', value: 0 },
   *   { name: 'DevToolsCommandDuration', value: 0.000013 },
   *   { name: 'ScriptDuration', value: 0 },
   *   { name: 'V8CompileDuration', value: 0 },
   *   { name: 'TaskDuration', value: 0.000014 },
   *   { name: 'TaskOtherDuration', value: 0.000001 },
   *   { name: 'ThreadTime', value: 0.000046 },
   *   { name: 'ProcessTime', value: 0.616852 },
   *   { name: 'JSHeapUsedSize', value: 19004908 },
   *   { name: 'JSHeapTotalSize', value: 26820608 },
   *   { name: 'FirstMeaningfulPaint', value: 0 },
   *   { name: 'DomContentLoaded', value: 1584903.690491 },
   *   { name: 'NavigationStart', value: 1584902.841845 }
   * ]
   *
   * ```
   *
   * @return {Promise<Array<Object>>}
   */
  async grabMetrics() {
    const client = await this.page.context().newCDPSession(this.page)
    await client.send('Performance.enable')
    const perfMetricObject = await client.send('Performance.getMetrics')
    return perfMetricObject?.metrics
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

  async getNewCDPSession() {
    return this.page.context().newCDPSession(this.page)
  }

  _logWebsocketMessages(message) {
    this.webSocketMessages.push(message)
  }
}

export default Playwright

export function buildLocatorString(locator) {
  if (locator.isXPath()) {
    // Make XPath relative so it works correctly within scoped contexts (e.g. within()).
    // Playwright's XPath engine auto-converts "//..." to ".//..." when the root is not a Document,
    // but only when the selector starts with "/". Locator methods like at() wrap XPath in
    // parentheses (e.g. "(//...)[position()=1]"), bypassing that auto-conversion.
    // We fix this by prepending "." before the first "//" that follows any leading parentheses.
    const value = locator.value.replace(/^(\(*)\/\//, '$1.//')
    return `xpath=${value}`
  }
  if (locator.isShadow()) {
    // Convert shadow locator to CSS with >> chaining operator
    // Playwright pierces shadow DOM by default, >> chains selectors
    // { shadow: ['my-app', 'my-form', 'button'] } => 'my-app >> my-form >> button'
    return locator.value.join(' >> ')
  }
  return locator.simplify()
}

/**
 * Handles role locator objects by converting them to Playwright's getByRole() API
 * Accepts both raw objects ({role: 'button', text: 'Submit'}) and Locator-wrapped role objects.
 * Returns elements array if role locator, null otherwise
 */
async function handleRoleLocator(context, locator) {
  const loc = new Locator(locator)
  if (!loc.isRole()) return null

  const roleObj = loc.locator || {}
  const options = {}
  if (roleObj.text) options.name = roleObj.text
  if (roleObj.name) options.name = roleObj.name
  if (roleObj.exact !== undefined) options.exact = roleObj.exact

  return context.getByRole(roleObj.role, Object.keys(options).length > 0 ? options : undefined).all()
}

async function findByRole(context, locator) {
  if (!locator || !locator.role) return null
  const options = {}
  if (locator.name) options.name = locator.name
  if (locator.exact !== undefined) options.exact = locator.exact
  return context.getByRole(locator.role, Object.keys(options).length > 0 ? options : undefined).all()
}

async function findElements(matcher, locator) {
  const isPwLocator = locator.type === 'pw' || (locator.locator && locator.locator.pw) || locator.pw

  if (isPwLocator) return findByPlaywrightLocator.call(this, matcher, locator)

  // Handle role locators with text/exact options (e.g., {role: 'button', text: 'Submit', exact: true})
  const roleElements = await handleRoleLocator(matcher, locator)
  if (roleElements) return roleElements

  locator = new Locator(locator, 'css')

  const locatorString = buildLocatorString(locator)

  return matcher.locator(locatorString).all()
}

async function findElement(matcher, locator) {
  if (locator.pw) return findByPlaywrightLocator.call(this, matcher, locator)

  locator = new Locator(locator, 'css')

  return matcher.locator(buildLocatorString(locator)).first()
}

async function getVisibleElements(elements) {
  const visibleElements = []
  for (const element of elements) {
    if (await element.isVisible()) {
      visibleElements.push(element)
    }
  }
  if (visibleElements.length === 0) {
    return elements
  }
  return visibleElements
}

async function proceedClick(locator, context = null, options = {}) {
  let matcher = await this._getContext()
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

  const opts = store.currentStep?.opts
  let element
  if (opts?.elementIndex != null) {
    element = selectElement(els, locator, this)
  } else {
    const strict = (opts?.exact === false || opts?.strictMode === false) ? false : (this.options.strict || opts?.exact === true || opts?.strictMode === true)
    if (strict) assertOnlyOneElement(els, locator, this)
    element = els.length > 1 ? (await getVisibleElements(els))[0] : els[0]
  }

  await highlightActiveElement.call(this, element)
  if (store.debugMode) this.debugSection('Clicked', await elToString(element, 1))

  if (options.force) {
    await element.dispatchEvent('click')
  } else {
    await element.click(options)
  }
  const promises = []
  if (options.waitForNavigation) {
    promises.push(this.waitForURL(/.*/, { waitUntil: options.waitForNavigation }))
  }
  promises.push(this._waitForAction())

  return Promise.all(promises)
}

async function findClickable(matcher, locator) {
  const matchedLocator = new Locator(locator)

  if (!matchedLocator.isFuzzy()) {
    const els = await findElements.call(this, matcher, matchedLocator)
    return els
  }

  let els
  const literal = xpathLocator.literal(matchedLocator.value)

  try {
    els = await matcher.getByRole('button', { name: matchedLocator.value }).all()
    if (els.length) return els
  } catch (err) {
    // getByRole not supported or failed
  }

  try {
    els = await matcher.getByRole('link', { name: matchedLocator.value }).all()
    if (els.length) return els
  } catch (err) {
    // getByRole not supported or failed
  }

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

  return findElements.call(this, matcher, matchedLocator.value) // by css or xpath
}

async function proceedSee(assertType, text, context, strict = false) {
  let description
  let allText

  if (!context) {
    const el = await this.context

    allText = typeof el.url !== 'function' && typeof el.innerText === 'function'
      ? [await el.innerText()]
      : [await el.locator('body').innerText()]

    description = 'web application'
  } else {
    const locator = new Locator(context, 'css')
    description = `element ${locator.toString()}`
    const els = await this._locate(locator)
    assertElementExists(els, locator.toString())
    allText = await Promise.all(els.map(el => el.innerText()))
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

  // Handle role locators with text/exact options
  const roleElements = await handleRoleLocator(contextEl, locator)
  if (roleElements) return roleElements

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
  return findElements.call(this, contextEl, matchedLocator.value)
}

async function proceedIsChecked(assertType, option) {
  let els = await findCheckable.call(this, option)
  assertElementExists(els, option, 'Checkable')
  els = await Promise.all(els.map(el => el.isChecked()))
  const selected = els.reduce((prev, cur) => prev || cur)
  return truth(`checkable ${option}`, 'to be checked')[assertType](selected)
}

async function findFields(locator, context = null) {
  let contextEl
  if (context) {
    const contextEls = await this._locate(context)
    assertElementExists(contextEls, context, 'Context element')
    contextEl = contextEls[0]
  }

  const locateFn = contextEl
    ? loc => findElements.call(this, contextEl, loc)
    : loc => this._locate(loc)

  const matcher = contextEl || (await this.page)
  const roleElements = await handleRoleLocator(matcher, locator)
  if (roleElements) return roleElements

  const matchedLocator = new Locator(locator)
  if (!matchedLocator.isFuzzy()) {
    return locateFn(matchedLocator)
  }
  const literal = xpathLocator.literal(locator)

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
  return locateFn({ css: locator })
}

async function proceedSelect(context, el, option) {
  const role = await el.getAttribute('role')
  const options = Array.isArray(option) ? option : [option]

  if (role === 'combobox') {
    this.debugSection('SelectOption', 'Expanding combobox')
    await highlightActiveElement.call(this, el)
    const [ariaOwns, ariaControls] = await Promise.all([el.getAttribute('aria-owns'), el.getAttribute('aria-controls')])
    await el.click()
    await this._waitForAction()

    const listboxId = ariaOwns || ariaControls
    let listbox = listboxId ? context.locator(`#${listboxId}`).first() : null
    if (!listbox || !(await listbox.count())) listbox = context.getByRole('listbox').first()

    for (const opt of options) {
      const optEl = listbox.getByRole('option', { name: opt }).first()
      this.debugSection('SelectOption', `Clicking: "${opt}"`)
      await highlightActiveElement.call(this, optEl)
      await optEl.click()
    }
    return this._waitForAction()
  }

  if (role === 'listbox') {
    for (const opt of options) {
      const optEl = el.getByRole('option', { name: opt }).first()
      this.debugSection('SelectOption', `Clicking: "${opt}"`)
      await highlightActiveElement.call(this, optEl)
      await optEl.click()
    }
    return this._waitForAction()
  }

  await highlightActiveElement.call(this, el)
  let optionToSelect = option
  try {
    optionToSelect = (await el.locator('option', { hasText: option }).textContent()).trim()
  } catch (e) {
    optionToSelect = option
  }
  if (!Array.isArray(option)) option = [optionToSelect]
  await el.selectOption(option)
  return this._waitForAction()
}

async function proceedSeeInField(assertType, field, value, context) {
  const els = await findFields.call(this, field, context)
  assertElementExists(els, field, 'Field')
  const el = els[0]
  const tag = await el.evaluate(e => e.tagName)
  const fieldType = await el.getAttribute('type')

  const proceedMultiple = async elements => {
    const fields = Array.isArray(elements) ? elements : [elements]

    const elementValues = []
    for (const element of fields) {
      elementValues.push(await element.inputValue())
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
    if (await el.getAttribute('multiple')) {
      const selectedOptions = await el.all('option:checked')
      if (!selectedOptions.length) return null

      const options = await filterFieldsByValue(selectedOptions, value, true)
      return proceedMultiple(options)
    }

    return el.inputValue()
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

  let fieldVal

  try {
    fieldVal = await el.inputValue()
  } catch (e) {
    if (e.message.includes('Error: Node is not an <input>, <textarea> or <select> element')) {
      fieldVal = await el.innerText()
    }
  }

  return stringIncludes(`fields by ${field}`)[assertType](value, fieldVal)
}

async function filterFieldsByValue(elements, value, onlySelected) {
  const matches = []
  for (const element of elements) {
    const val = await element.getAttribute('value')
    let isSelected = true
    if (onlySelected) {
      isSelected = await elementSelected(element)
    }
    if ((value == null || val.indexOf(value) > -1) && isSelected) {
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
  const type = await element.getAttribute('type')

  if (type === 'checkbox' || type === 'radio') {
    return element.isChecked()
  }
  return element.getAttribute('selected')
}

function isFrameLocator(locator) {
  locator = new Locator(locator)
  if (locator.isFrame()) {
    return locator.value
  }
  return false
}

function assertElementExists(res, locator, prefix, suffix) {
  // if element text is an empty string, just exit this check
  if (typeof res === 'string' && res === '') return
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
      .then(async () => {
        if (this.context && this.context._type === 'Frame') {
          // we are inside iframe via Frame object — refresh handle
          const frameEl = await this.context.frameElement()
          this.context = await frameEl.contentFrame()
          this.contextLocator = null
          return
        }
        if (this.context && this.context.constructor && this.context.constructor.name === 'FrameLocator') {
          // we are inside iframe via FrameLocator — keep it across load events
          return
        }
        // if context element was in iframe - keep it
        // if (await this.context.ownerFrame()) return;
        this.context = page
        this.contextLocator = null
      })
  })
  page.on('console', msg => {
    if (!consoleLogStore.includes(msg) && this.options.ignoreLog && !this.options.ignoreLog.includes(msg.type())) {
      this.debugSection(`Browser:${ucfirst(msg.type())}`, ((msg.text && msg.text()) || msg._text || '') + msg.args().join(' '))
    }
    consoleLogStore.add(msg)
  })

  if (this.options.windowSize && this.options.windowSize.indexOf('x') > 0 && this._getType() === 'Browser') {
    try {
      await page.setViewportSize(parseWindowSize(this.options.windowSize))
    } catch (err) {}
  }
}

function parseWindowSize(windowSize) {
  if (!windowSize) return { width: 800, height: 600 }

  if (windowSize.width && windowSize.height) {
    return { width: parseInt(windowSize.width, 10), height: parseInt(windowSize.height, 10) }
  }

  const dimensions = windowSize.split('x')
  if (dimensions.length < 2 || windowSize === 'maximize') {
    console.log('Invalid window size, setting window to default values')
    return { width: 800, height: 600 } // invalid size
  }
  const width = parseInt(dimensions[0], 10)
  const height = parseInt(dimensions[1], 10)
  return { width, height }
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

async function clickablePoint(el) {
  const rect = await el.boundingBox()
  if (!rect) throw new ElementNotFound(el)
  const { x, y, width, height } = rect
  return { x: x + width / 2, y: y + height / 2 }
}

async function refreshContextSession() {
  // close other sessions with timeout protection, but preserve active session contexts
  try {
    const contexts = await Promise.race([this.browser.contexts(), new Promise((_, reject) => setTimeout(() => reject(new Error('Get contexts timeout')), 3000))])

    // Keep the first context (default) and any contexts that belong to active sessions
    const defaultContext = contexts.shift()
    const activeSessionContexts = new Set()

    // Identify contexts that are still in use by active sessions
    if (this.sessionPages) {
      for (const sessionName in this.sessionPages) {
        const sessionPage = this.sessionPages[sessionName]
        if (sessionPage && sessionPage.context) {
          activeSessionContexts.add(sessionPage.context)
        }
      }
    }

    // Only close contexts that are not in use by active sessions
    const contextsToClose = contexts.filter(context => !activeSessionContexts.has(context))

    if (contextsToClose.length > 0) {
      await Promise.race([Promise.all(contextsToClose.map(c => c.close())), new Promise((_, reject) => setTimeout(() => reject(new Error('Close contexts timeout')), 5000))])
    }
  } catch (e) {
    console.warn('Warning during context cleanup:', e.message)
  }

  if (this.page) {
    try {
      const existingPages = await this.browserContext.pages()
      await this._setPage(existingPages[0])
    } catch (e) {
      console.warn('Warning during page setup:', e.message)
    }
  }

  if (this.options.keepBrowserState) return

  if (!this.options.keepCookies) {
    this.debugSection('Session', 'cleaning cookies and localStorage')
    try {
      await this.clearCookie()
    } catch (e) {
      console.warn('Warning during cookie cleanup:', e.message)
    }
  }

  try {
    if (!this.page || !this.browserContext) {
      this.debugSection('Session', 'Skipping storage cleanup - no active page/context')
      return
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
  } catch (e) {
    console.warn('Warning during storage cleanup:', e.message)
  }
}

function saveVideoForPage(page, name) {
  if (!page.video()) return null
  const fileName = `${`${store.outputDir}${pathSeparator}videos${pathSeparator}${uuidv4()}_${clearString(name)}`.slice(0, 245)}.webm`
  page
    .video()
    .saveAs(fileName)
    .then(() => {
      if (!page) return
      page
        .video()
        .delete()
        .catch(() => {})
    })
  return fileName
}
async function saveTraceForContext(context, name) {
  if (!context) return
  if (!context.tracing) return
  try {
    const fileName = `${`${store.outputDir}${pathSeparator}trace${pathSeparator}${uuidv4()}_${clearString(name)}`.slice(0, 245)}.zip`
    await context.tracing.stop({ path: fileName })
    return fileName
  } catch (err) {
    // Handle the case where tracing was not started or context is invalid
    if (err.message && err.message.includes('Must start tracing before stopping')) {
      // Tracing was never started on this context, silently skip
      return null
    }
    throw err
  }
}

async function highlightActiveElement(element) {
  if ((this.options.highlightElement || store.onPause) && store.debugMode) {
    await element.evaluate(el => {
      const prevStyle = el.style.boxShadow
      el.style.boxShadow = '0px 0px 4px 3px rgba(147, 51, 234, 0.8)' // Bright purple that works on both dark/light modes
      setTimeout(() => (el.style.boxShadow = prevStyle), 2000)
    })
  }
}

async function elToString(el, numberOfElements) {
  const html = await el.evaluate(node => node.outerHTML)
  return (
    html
      .replace(/\n/g, '')
      .replace(/\s+/g, ' ')
      .substring(0, 100 / numberOfElements)
      .trim() + '...'
  )
}
