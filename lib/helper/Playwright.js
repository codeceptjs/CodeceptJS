const path = require('path')
const fs = require('fs')

const Helper = require('@codeceptjs/helper')
const { v4: uuidv4 } = require('uuid')
const assert = require('assert')
const promiseRetry = require('promise-retry')
const Locator = require('../locator')
const recorder = require('../recorder')
const stringIncludes = require('../assert/include').includes
const { urlEquals } = require('../assert/equal')
const { equals } = require('../assert/equal')
const { empty } = require('../assert/empty')
const { truth } = require('../assert/truth')
const {
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
} = require('../utils')
const { isColorProperty, convertColorToRGBA } = require('../colorUtils')
const ElementNotFound = require('./errors/ElementNotFound')
const RemoteBrowserConnectionRefused = require('./errors/RemoteBrowserConnectionRefused')
const Popup = require('./extras/Popup')
const Console = require('./extras/Console')
const { findReact, findVue, findByPlaywrightLocator } = require('./extras/PlaywrightReactVueLocator')

let playwright
let perfTiming
let defaultSelectorEnginesInitialized = false

const popupStore = new Popup()
const consoleLogStore = new Console()
const availableBrowsers = ['chromium', 'webkit', 'firefox', 'electron']

const {
  setRestartStrategy,
  restartsSession,
  restartsContext,
  restartsBrowser,
} = require('./extras/PlaywrightRestartOpts')
const { createValueEngine, createDisabledEngine } = require('./extras/PlaywrightPropEngine')
const {
  seeElementError,
  dontSeeElementError,
  dontSeeElementInDOMError,
  seeElementInDOMError,
} = require('./errors/ElementAssertion')
const {
  dontSeeTraffic,
  seeTraffic,
  grabRecordedNetworkTraffics,
  stopRecordingTraffic,
  flushNetworkTraffics,
} = require('./network/actions')

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
 *   * 'browser' or **true** - closes browser and opens it again between tests.
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

    playwright = requireWithFallback('playwright', 'playwright-core')

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

    // override defaults with config
    this._setConfig(config)
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
    }

    process.env.testIdAttribute = 'data-testid'
    config = Object.assign(defaults, config)

    if (availableBrowsers.indexOf(config.browser) < 0) {
      throw new Error(
        `Invalid config. Can't use browser "${config.browser}". Accepted values: ${availableBrowsers.join(', ')}`,
      )
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
      this.options.recordVideo.dir = `${global.output_dir}/videos/`
    }
    this.isRemoteBrowser = !!this.playwrightOptions.browserWSEndpoint
    this.isElectron = this.options.browser === 'electron'
    this.userDataDir = this.playwrightOptions.userDataDir
      ? `${this.playwrightOptions.userDataDir}_${Date.now().toString()}`
      : undefined
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
        when: (answers) => answers.Playwright_browser !== 'electron',
      },
      {
        name: 'show',
        message: 'Show browser window',
        default: true,
        type: 'confirm',
        when: (answers) => answers.Playwright_browser !== 'electron',
      },
    ]
  }

  static _checkRequirements() {
    try {
      requireWithFallback('playwright', 'playwright-core')
    } catch (e) {
      return ['playwright@^1.18']
    }
  }

  async _init() {
    // register an internal selector engine for reading value property of elements in a selector
    if (defaultSelectorEnginesInitialized) return
    defaultSelectorEnginesInitialized = true
    try {
      await playwright.selectors.register('__value', createValueEngine)
      await playwright.selectors.register('__disabled', createDisabledEngine)
      if (process.env.testIdAttribute) await playwright.selectors.setTestIdAttribute(process.env.testIdAttribute)
    } catch (e) {
      console.warn(e)
    }
  }

  _beforeSuite() {
    if ((restartsSession() || restartsContext()) && !this.options.manualStart && !this.isRunning) {
      this.debugSection('Session', 'Starting singleton browser session')
      return this._startBrowser()
    }
  }

  async _before(test) {
    this.currentRunningTest = test
    recorder.retry({
      retries: process.env.FAILED_STEP_RETRIES || 3,
      when: (err) => {
        if (!err || typeof err.message !== 'string') {
          return false
        }
        // ignore context errors
        return err.message.includes('context')
      },
    })

    if (restartsBrowser() && !this.options.manualStart) await this._startBrowser()
    if (!this.isRunning && !this.options.manualStart) await this._startBrowser()

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
        const fileName = `${`${global.output_dir}${path.sep}har${path.sep}${uuidv4()}_${clearString(this.currentRunningTest.title)}`.slice(0, 245)}.${harExt}`
        const dir = path.dirname(fileName)
        if (!fileExists(dir)) fs.mkdirSync(dir)
        this.options.recordHar.path = fileName
        this.currentRunningTest.artifacts.har = fileName
        contextOptions.recordHar = this.options.recordHar
      }
      if (this.storageState) contextOptions.storageState = this.storageState
      if (this.options.userAgent) contextOptions.userAgent = this.options.userAgent
      if (this.options.locale) contextOptions.locale = this.options.locale
      if (this.options.colorScheme) contextOptions.colorScheme = this.options.colorScheme
      this.contextOptions = contextOptions
      if (!this.browserContext || !restartsSession()) {
        this.browserContext = await this.browser.newContext(this.contextOptions) // Adding the HTTPSError ignore in the context so that we can ignore those errors
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
          this.browser = await playwright[this.options.browser].launchPersistentContext(
            this.userDataDir,
            this.playwrightOptions,
          )
          this.browserContext = this.browser
          const existingPages = await this.browserContext.pages()
          mainPage = existingPages[0]
        }
      }
    }
    await targetCreatedHandler.call(this, mainPage)

    await this._setPage(mainPage)

    if (this.options.trace) await this.browserContext.tracing.start({ screenshots: true, snapshots: true })

    return this.browser
  }

  async _after() {
    if (!this.isRunning) return

    if (this.isElectron) {
      this.browser.close()
      this.electronSessions.forEach((session) => session.close())
      return
    }

    if (restartsSession()) {
      return refreshContextSession.bind(this)()
    }

    if (restartsBrowser()) {
      this.isRunning = false
      return this._stopBrowser()
    }

    // close other sessions
    try {
      if ((await this.browser)._type === 'Browser') {
        const contexts = await this.browser.contexts()
        const currentContext = contexts[0]
        if (currentContext && (this.options.keepCookies || this.options.keepBrowserState)) {
          this.storageState = await currentContext.storageState()
        }

        await Promise.all(contexts.map((c) => c.close()))
      }
    } catch (e) {
      console.log(e)
    }

    // await this.closeOtherTabs();
    return this.browser
  }

  _afterSuite() {}

  async _finishTest() {
    if ((restartsSession() || restartsContext()) && this.isRunning) return this._stopBrowser()
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
            browserContext = await this.browser.newContext(Object.assign(this.contextOptions, config))
            page = await browserContext.newPage()
          } catch (e) {
            if (this.playwrightOptions.userDataDir) {
              browserContext = await playwright[this.options.browser].launchPersistentContext(
                `${this.userDataDir}_${this.activeSessionName}`,
                this.playwrightOptions,
              )
              this.browser = browserContext
              page = await browserContext.pages()[0]
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
      loadVars: async (context) => {
        if (context) {
          this.browserContext = context
          const existingPages = await context.pages()
          this.sessionPages[this.activeSessionName] = existingPages[0]
          return this._setPage(this.sessionPages[this.activeSessionName])
        }
      },
      restoreVars: async (session) => {
        this.withinLocator = null
        this.browserContext = defaultContext

        if (!session) {
          this.activeSessionName = ''
        } else {
          this.activeSessionName = session
        }
        const existingPages = await this.browserContext.pages()
        await this._setPage(existingPages[0])

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
    page = await page
    this._addPopupListener(page)
    this.page = page
    if (!page) return
    this.browserContext.setDefaultTimeout(0)
    page.setDefaultNavigationTimeout(this.options.getPageTimeout)
    page.setDefaultTimeout(this.options.timeout)

    page.on('crash', async () => {
      console.log('ERROR: Page has crashed, closing page!')
      await page.close()
    })
    this.context = await this.page
    this.contextLocator = null
    await page.bringToFront()
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
    page.on('dialog', async (dialog) => {
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
      this.browser = await playwright[this.options.browser].launchPersistentContext(
        this.userDataDir,
        this.playwrightOptions,
      )
    } else {
      this.browser = await playwright[this.options.browser].launch(this.playwrightOptions)
    }

    // works only for Chromium
    this.browser.on('targetchanged', (target) => {
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
    if (this.options.recordHar) await this.browserContext.close()
    await this.browser.close()
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
        await this.switchTo(null)
        return frame.reduce((p, frameLocator) => p.then(() => this.switchTo(frameLocator)), Promise.resolve())
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
    this.context = await this.page
    this.contextLocator = null
    this.frame = null
  }

  _extractDataFromPerformanceTiming(timing, ...dataNames) {
    const navigationStart = timing.navigationStart

    const extractedData = {}
    dataNames.forEach((name) => {
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
    if (!/^\w+\:(\/\/|.+)/.test(url)) {
      url = this.options.url + (url.startsWith('/') ? url : `/${url}`)
    }

    if (this.options.basicAuth && this.isAuthenticated !== true) {
      if (url.includes(this.options.url)) {
        await this.browserContext.setHTTPCredentials(this.options.basicAuth)
        this.isAuthenticated = true
      }
    }

    await this.page.goto(url, { waitUntil: this.options.waitForNavigation })

    const performanceTiming = JSON.parse(await this.page.evaluate(() => JSON.stringify(window.performance.timing)))

    perfTiming = this._extractDataFromPerformanceTiming(
      performanceTiming,
      'responseEnd',
      'domInteractive',
      'domContentLoadedEventEnd',
      'loadEventEnd',
    )

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
    const el = await this._locateElement(locator)
    assertElementExists(el, locator)

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

    if (options) {
      return this.page.dragAndDrop(buildLocatorString(src), buildLocatorString(dst), options)
    }

    const _smallWaitInMs = 600
    await this.page.locator(buildLocatorString(src)).hover()
    await this.page.mouse.down()
    await this.page.waitForTimeout(_smallWaitInMs)

    const destElBox = await this.page.locator(buildLocatorString(dst)).boundingBox()

    await this.page.mouse.move(destElBox.x + destElBox.width / 2, destElBox.y + destElBox.height / 2)
    await this.page.locator(buildLocatorString(dst)).hover({ position: { x: 10, y: 10 } })
    await this.page.waitForTimeout(_smallWaitInMs)
    await this.page.mouse.up()
  }

  /**
   * Restart browser with a new context and a new page
   *
   * ```js
   * // Restart browser and use a new timezone
   * I.restartBrowser({ timezoneId: 'America/Phoenix' });
   * // Open URL in a new page in changed timezone
   * I.amOnPage('/');
   * // Restart browser, allow reading/copying of text from/into clipboard in Chrome
   * I.restartBrowser({ permissions: ['clipboard-read', 'clipboard-write'] });
   * ```
   *
   * @param {object} [contextOptions] [Options for browser context](https://playwright.dev/docs/api/class-browser#browser-new-context) when starting new browser
   */
  async restartBrowser(contextOptions) {
    await this._stopBrowser()
    await this._startBrowser()
    await this._createContextPage(contextOptions)
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
    const file = path.join(global.codecept_dir, harFilePath)

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
      window.scrollTo(
        0,
        Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight),
      )
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
    /* eslint-disable comma-dangle */
    function getScrollPosition() {
      return {
        x: window.pageXOffset,
        y: window.pageYOffset,
      }
    }
    /* eslint-enable comma-dangle */
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
    const context = (await this.context) || (await this._getContext())

    if (this.frame) return findElements(this.frame, locator)

    return findElements(context, locator)
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
    const context = (await this.context) || (await this._getContext())
    return findElement(context, locator)
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
    return els[0]
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
    return this._locate(locator)
  }

  /**
   * {{> grabWebElement }}
   *
   */
  async grabWebElement(locator) {
    return this._locateElement(locator)
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
    const otherPages = pages.filter((page) => page !== this.page)
    if (otherPages.length) {
      this.debug(`Closing ${otherPages.length} tabs`)
      return Promise.all(otherPages.map((p) => p.close()))
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
  async seeElement(locator) {
    let els = await this._locate(locator)
    els = await Promise.all(els.map((el) => el.isVisible()))
    try {
      return empty('visible elements').negate(els.filter((v) => v).fill('ELEMENT'))
    } catch (e) {
      dontSeeElementError(locator)
    }
  }

  /**
   * {{> dontSeeElement }}
   *
   */
  async dontSeeElement(locator) {
    let els = await this._locate(locator)
    els = await Promise.all(els.map((el) => el.isVisible()))
    try {
      return empty('visible elements').assert(els.filter((v) => v).fill('ELEMENT'))
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
      return empty('elements on page').negate(els.filter((v) => v).fill('ELEMENT'))
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
      return empty('elements on a page').assert(els.filter((v) => v).fill('ELEMENT'))
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
    this.page.waitForEvent('download').then(async (download) => {
      const filePath = await download.path()
      fileName = fileName || `downloads/${path.basename(filePath)}`

      const downloadPath = path.join(global.output_dir, fileName)
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
  async click(locator, context = null, options = {}) {
    return proceedClick.call(this, locator, context, options)
  }

  /**
   * Clicks link and waits for navigation (deprecated)
   */
  async clickLink(locator, context = null) {
    console.log('clickLink deprecated: Playwright automatically waits for navigation to happen.')
    console.log('Replace I.clickLink with I.click')
    return this.click(locator, context)
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
   * _Note:_ Shortcuts like `'Meta'` + `'A'` do not work on macOS ([GoogleChrome/Puppeteer#1313](https://github.com/GoogleChrome/puppeteer/issues/1313)).
   *
   * {{> pressKeyWithKeyNormalization }}
   */
  async pressKey(key) {
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
   *
   */
  async fillField(field, value) {
    const els = await findFields.call(this, field)
    assertElementExists(els, field, 'Field')
    const el = els[0]

    await el.clear()

    await highlightActiveElement.call(this, el)

    await el.type(value.toString(), { delay: this.options.pressKeyDelay })

    return this._waitForAction()
  }

  /**
   * Clears the text input element: `<input>`, `<textarea>` or `[contenteditable]` .
   *
   *
   * Examples:
   *
   * ```js
   * I.clearField('.text-area')
   *
   * // if this doesn't work use force option
   * I.clearField('#submit', { force: true })
   * ```
   * Use `force` to bypass the [actionability](https://playwright.dev/docs/actionability) checks.
   *
   * @param {CodeceptJS.LocatorOrString} locator field located by label|name|CSS|XPath|strict locator.
   * @param {any} [options] [Additional options](https://playwright.dev/docs/api/class-locator#locator-clear) for available options object as 2nd argument.
   */
  async clearField(locator, options = {}) {
    const els = await findFields.call(this, locator)
    assertElementExists(els, locator, 'Field to clear')

    const el = els[0]

    await highlightActiveElement.call(this, el)

    await el.clear()

    return this._waitForAction()
  }

  /**
   * {{> appendField }}
   */
  async appendField(field, value) {
    const els = await findFields.call(this, field)
    assertElementExists(els, field, 'Field')
    await highlightActiveElement.call(this, els[0])
    await els[0].press('End')
    await els[0].type(value.toString(), { delay: this.options.pressKeyDelay })
    return this._waitForAction()
  }

  /**
   * {{> seeInField }}
   */
  async seeInField(field, value) {
    const _value = typeof value === 'boolean' ? value : value.toString()
    return proceedSeeInField.call(this, 'assert', field, _value)
  }

  /**
   * {{> dontSeeInField }}
   */
  async dontSeeInField(field, value) {
    const _value = typeof value === 'boolean' ? value : value.toString()
    return proceedSeeInField.call(this, 'negate', field, _value)
  }

  /**
   * {{> attachFile }}
   *
   */
  async attachFile(locator, pathToFile) {
    const file = path.join(global.codecept_dir, pathToFile)

    if (!fileExists(file)) {
      throw new Error(`File at ${file} can not be found on local system`)
    }
    const els = await findFields.call(this, locator)
    assertElementExists(els, locator, 'Field')
    await els[0].setInputFiles(file)
    return this._waitForAction()
  }

  /**
   * {{> selectOption }}
   */
  async selectOption(select, option) {
    const els = await findFields.call(this, select)
    assertElementExists(els, select, 'Selectable field')
    const el = els[0]

    await highlightActiveElement.call(this, el)
    let optionToSelect = ''

    try {
      optionToSelect = (await el.locator('option', { hasText: option }).textContent()).trim()
    } catch (e) {
      optionToSelect = option
    }

    if (!Array.isArray(option)) option = [optionToSelect]

    await el.selectOption(option)
    return this._waitForAction()
  }

  /**
   * {{> grabNumberOfVisibleElements }}
   *
   */
  async grabNumberOfVisibleElements(locator) {
    let els = await this._locate(locator)
    els = await Promise.all(els.map((el) => el.isVisible()))
    return els.filter((v) => v).length
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
    return equals(
      `expected number of elements (${new Locator(locator)}) is ${num}, but found ${elements.length}`,
    ).assert(elements.length, num)
  }

  /**
   * {{> seeNumberOfVisibleElements }}
   *
   *
   */
  async seeNumberOfVisibleElements(locator, num) {
    const res = await this.grabNumberOfVisibleElements(locator)
    return equals(`expected number of visible elements (${new Locator(locator)}) is ${num}, but found ${res}`).assert(
      res,
      num,
    )
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
    empty(`cookie ${name} to be set`).negate(cookies.filter((c) => c.name === name))
  }

  /**
   * {{> dontSeeCookie }}
   */
  async dontSeeCookie(name) {
    const cookies = await this.browserContext.cookies()
    empty(`cookie ${name} not to be set`).assert(cookies.filter((c) => c.name === name))
  }

  /**
   * Returns cookie in JSON format. If name not passed returns all cookies for this domain.
   *
   * {{> grabCookie }}
   */
  async grabCookie(name) {
    const cookies = await this.browserContext.cookies()
    if (!name) return cookies
    const cookie = cookies.filter((c) => c.name === name)
    if (cookie[0]) return cookie[0]
  }

  /**
   * {{> clearCookie }}
   */
  async clearCookie() {
    // Playwright currently doesn't support to delete a certain cookie
    // https://github.com/microsoft/playwright/blob/main/docs/src/api/class-browsercontext.md#async-method-browsercontextclearcookies
    if (!this.browserContext) return
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
    if (this.context && this.context.constructor.name === 'FrameLocator') {
      // switching to iframe context
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
    locator = buildLocatorString(new Locator(locator, 'css'))

    if (this.contextLocator) {
      const contextLocator = buildLocatorString(new Locator(this.contextLocator, 'css'))
      locator = `${contextLocator} >> ${locator}`
    }

    return locator
  }

  /**
   * {{> grabTextFrom }}
   *
   */
  async grabTextFrom(locator) {
    locator = this._contextLocator(locator)
    const text = await this.page.textContent(locator)
    assertElementExists(text, locator)
    this.debugSection('Text', text)
    return text
  }

  /**
   * {{> grabTextFromAll }}
   *
   */
  async grabTextFromAll(locator) {
    const els = await this._locate(locator)
    const texts = []
    for (const el of els) {
      texts.push(await await el.innerText())
    }
    this.debug(`Matched ${els.length} elements`)
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
    this.debug(`Matched ${els.length} elements`)
    return Promise.all(els.map((el) => el.inputValue()))
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
    this.debug(`Matched ${els.length} elements`)
    return Promise.all(els.map((el) => el.innerHTML()))
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
    this.debug(`Matched ${els.length} elements`)
    const cssValues = await Promise.all(
      els.map((el) =>
        el.evaluate((el, cssProperty) => getComputedStyle(el).getPropertyValue(cssProperty), cssProperty),
      ),
    )

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

    const values = Object.keys(cssPropertiesCamelCase).map((key) => cssPropertiesCamelCase[key])
    if (!Array.isArray(props)) props = [props]
    let chunked = chunkArray(props, values.length)
    chunked = chunked.filter((val) => {
      for (let i = 0; i < val.length; ++i) {
        // eslint-disable-next-line eqeqeq
        if (val[i] != values[i]) return false
      }
      return true
    })
    return equals(
      `all elements (${new Locator(locator)}) to have CSS property ${JSON.stringify(cssProperties)}`,
    ).assert(chunked.length, elemAmount)
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
    res.forEach((el) => {
      Object.keys(attributes).forEach((prop) => {
        commands.push(el.evaluate((el, attr) => el[attr] || el.getAttribute(attr), prop))
      })
    })
    let attrs = await Promise.all(commands)
    const values = Object.keys(attributes).map((key) => attributes[key])
    if (!Array.isArray(attrs)) attrs = [attrs]
    let chunked = chunkArray(attrs, values.length)
    chunked = chunked.filter((val) => {
      for (let i = 0; i < val.length; ++i) {
        // the attribute could be a boolean
        if (typeof val[i] === 'boolean') return val[i] === values[i]
        // if the attribute doesn't exist, returns false as well
        if (!val[i] || !val[i].includes(values[i])) return false
      }
      return true
    })
    return equals(`all elements (${new Locator(locator)}) to have attributes ${JSON.stringify(attributes)}`).assert(
      chunked.length,
      elemAmount,
    )
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
    this.debug(`Matched ${els.length} elements`)
    const array = []

    for (let index = 0; index < els.length; index++) {
      array.push(await els[index].getAttribute(attr))
    }

    return array
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

        if (activeSessionPage) {
          await activeSessionPage.screenshot({
            path: outputFile,
            fullPage: fullPageOption,
            type: 'png',
          })
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
      throw new Error(
        `Method ${method} is not allowed, use the one from a list ${allowedMethods} or switch to using REST helper`,
      )
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
    if (this.config.onResponse) {
      const axiosResponse = {
        data: await response.json(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
      }
      this.config.onResponse(axiosResponse)
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
        test.artifacts[`video_${sessionName}`] = saveVideoForPage(
          this.sessionPages[sessionName],
          `${test.title}_${sessionName}.failed`,
        )
      }
    }

    if (this.options.trace) {
      test.artifacts.trace = await saveTraceForContext(this.browserContext, `${test.title}.failed`)
      for (const sessionName in this.sessionPages) {
        if (!this.sessionPages[sessionName].context) continue
        test.artifacts[`trace_${sessionName}`] = await saveTraceForContext(
          this.sessionPages[sessionName].context,
          `${test.title}_${sessionName}.failed`,
        )
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
          test.artifacts[`video_${sessionName}`] = saveVideoForPage(
            this.sessionPages[sessionName],
            `${test.title}_${sessionName}.passed`,
          )
        }
      } else {
        this.page
          .video()
          .delete()
          .catch((e) => {})
      }
    }

    if (this.options.trace) {
      if (this.options.keepTraceForPassedTests) {
        if (this.options.trace) {
          test.artifacts.trace = await saveTraceForContext(this.browserContext, `${test.title}.passed`)
          for (const sessionName in this.sessionPages) {
            if (!this.sessionPages[sessionName].context) continue
            test.artifacts[`trace_${sessionName}`] = await saveTraceForContext(
              this.sessionPages[sessionName].context,
              `${test.title}_${sessionName}.passed`,
            )
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
    return new Promise((done) => {
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
        return Array.from(document.querySelectorAll(locator)).filter((el) => !el.disabled).length > 0
      }
      waiter = context.waitForFunction(valueFn, [locator.value], { timeout: waitTimeout })
    } else {
      const enabledFn = function ([locator, $XPath]) {
        eval($XPath) // eslint-disable-line no-eval
        return $XPath(null, locator).filter((el) => !el.disabled).length > 0
      }
      waiter = context.waitForFunction(enabledFn, [locator.value, $XPath.toString()], { timeout: waitTimeout })
    }
    return waiter.catch((err) => {
      throw new Error(
        `element (${locator.toString()}) still not enabled after ${waitTimeout / 1000} sec\n${err.message}`,
      )
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
        return Array.from(document.querySelectorAll(locator)).filter((el) => el.disabled).length > 0
      }
      waiter = context.waitForFunction(valueFn, [locator.value], { timeout: waitTimeout })
    } else {
      const disabledFn = function ([locator, $XPath]) {
        eval($XPath) // eslint-disable-line no-eval
        return $XPath(null, locator).filter((el) => el.disabled).length > 0
      }
      waiter = context.waitForFunction(disabledFn, [locator.value, $XPath.toString()], { timeout: waitTimeout })
    }
    return waiter.catch((err) => {
      throw new Error(
        `element (${locator.toString()}) is still enabled after ${waitTimeout / 1000} sec\n${err.message}`,
      )
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
        return (
          Array.from(document.querySelectorAll(locator)).filter((el) => (el.value || '').indexOf(value) !== -1).length >
          0
        )
      }
      waiter = context.waitForFunction(valueFn, [locator.value, value], { timeout: waitTimeout })
    } else {
      const valueFn = function ([locator, $XPath, value]) {
        eval($XPath) // eslint-disable-line no-eval
        return $XPath(null, locator).filter((el) => (el.value || '').indexOf(value) !== -1).length > 0
      }
      waiter = context.waitForFunction(valueFn, [locator.value, $XPath.toString(), value], {
        timeout: waitTimeout,
      })
    }
    return waiter.catch((err) => {
      const loc = locator.toString()
      throw new Error(
        `element (${loc}) is not in DOM or there is no element(${loc}) with value "${value}" after ${waitTimeout / 1000} sec\n${err.message}`,
      )
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
        return Array.prototype.filter.call(els, (el) => el.offsetParent !== null).length === num
      }
      waiter = context.waitForFunction(visibleFn, [locator.value, num], { timeout: waitTimeout })
    } else {
      const visibleFn = function ([locator, $XPath, num]) {
        eval($XPath) // eslint-disable-line no-eval
        return $XPath(null, locator).filter((el) => el.offsetParent !== null).length === num
      }
      waiter = context.waitForFunction(visibleFn, [locator.value, $XPath.toString(), num], {
        timeout: waitTimeout,
      })
    }
    return waiter.catch((err) => {
      throw new Error(
        `The number of elements (${locator.toString()}) is not ${num} after ${waitTimeout / 1000} sec\n${err.message}`,
      )
    })
  }

  /**
   * {{> waitForClickable }}
   */
  async waitForClickable(locator, waitTimeout) {
    console.log(
      'I.waitForClickable is DEPRECATED: This is no longer needed, Playwright automatically waits for element to be clickable',
    )
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
      throw new Error(
        `element (${locator.toString()}) still not present on page after ${waitTimeout / 1000} sec\n${e.message}`,
      )
    }
  }

  /**
   * This method accepts [React selectors](https://codecept.io/react).
   *
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
      .catch((err) => {
        throw new Error(
          `element (${locator.toString()}) still not hidden after ${waitTimeout / 1000} sec\n${err.message}`,
        )
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
    if (this.context && this.context.constructor.name === 'FrameLocator') {
      return this.context
    }
    return this.page
  }

  /**
   * {{> waitInUrl }}
   */
  async waitInUrl(urlPart, sec = null) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout

    return this.page
      .waitForFunction(
        (urlPart) => {
          const currUrl = decodeURIComponent(decodeURIComponent(decodeURIComponent(window.location.href)))
          return currUrl.indexOf(urlPart) > -1
        },
        urlPart,
        { timeout: waitTimeout },
      )
      .catch(async (e) => {
        const currUrl = await this._getPageUrl() // Required because the waitForFunction can't return data.
        if (/Timeout/i.test(e.message)) {
          throw new Error(`expected url to include ${urlPart}, but found ${currUrl}`)
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

    const baseUrl = this.options.url
    if (urlPart.indexOf('http') < 0) {
      urlPart = baseUrl + urlPart
    }

    return this.page
      .waitForFunction(
        (urlPart) => {
          const currUrl = decodeURIComponent(decodeURIComponent(decodeURIComponent(window.location.href)))
          return currUrl.indexOf(urlPart) > -1
        },
        urlPart,
        { timeout: waitTimeout },
      )
      .catch(async (e) => {
        const currUrl = await this._getPageUrl() // Required because the waitForFunction can't return data.
        if (/Timeout/i.test(e.message)) {
          throw new Error(`expected url to be ${urlPart}, but found ${currUrl}`)
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
    const errorMessage = `Text "${text}" was not found on page after ${waitTimeout / 1000} sec.`
    let waiter

    const contextObject = await this._getContext()

    if (context) {
      const locator = new Locator(context, 'css')
      if (!locator.isXPath()) {
        try {
          await contextObject
            .locator(`${locator.isCustom() ? `${locator.type}=${locator.value}` : locator.simplify()} >> text=${text}`)
            .first()
            .waitFor({ timeout: waitTimeout, state: 'visible' })
        } catch (e) {
          throw new Error(`${errorMessage}\n${e.message}`)
        }
      }

      if (locator.isXPath()) {
        try {
          await contextObject.waitForFunction(
            ([locator, text, $XPath]) => {
              eval($XPath) // eslint-disable-line no-eval
              const el = $XPath(null, locator)
              if (!el.length) return false
              return el[0].innerText.indexOf(text) > -1
            },
            [locator.value, text, $XPath.toString()],
            { timeout: waitTimeout },
          )
        } catch (e) {
          throw new Error(`${errorMessage}\n${e.message}`)
        }
      }
    } else {
      // we have this as https://github.com/microsoft/playwright/issues/26829 is not yet implemented
      // eslint-disable-next-line no-lonely-if
      const _contextObject = this.frame ? this.frame : contextObject
      let count = 0
      do {
        waiter = await _contextObject.locator(`:has-text("${text}")`).first().isVisible()
        if (waiter) break
        await this.wait(1)
        count += 1000
      } while (count <= waitTimeout)

      if (!waiter) throw new Error(`${errorMessage}`)
    }
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
        this.context = await this.page.frameLocator('iframe').nth(locator)
        this.contextLocator = locator
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
    const frame = await this._locateElement(locator)

    if (!frame) {
      throw new Error(`Frame ${JSON.stringify(locator)} was not found by text|CSS|XPath`)
    }

    if (this.frame) {
      this.frame = await this.frame.frameLocator(locator)
    } else {
      this.frame = await this.page.frameLocator(locator)
    }

    const contentFrame = this.frame

    if (contentFrame) {
      this.context = contentFrame
      this.contextLocator = null
    } else {
      this.context = this.page.frame(this.page.frames()[1].name())
      this.contextLocator = locator
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
   * See [Playwright's reference](https://playwright.dev/docs/api/class-page?_highlight=waitfornavi#pagewaitfornavigationoptions)
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
          .locator(`${locator.isCustom() ? `${locator.type}=${locator.value}` : locator.simplify()}`)
          .first()
          .waitFor({ timeout: waitTimeout, state: 'detached' })
      } catch (e) {
        throw new Error(`element (${locator.toString()}) still on page after ${waitTimeout / 1000} sec\n${e.message}`)
      }
    } else {
      const visibleFn = function ([locator, $XPath]) {
        eval($XPath) // eslint-disable-line no-eval
        return $XPath(null, locator).length === 0
      }
      waiter = context.waitForFunction(visibleFn, [locator.value, $XPath.toString()], { timeout: waitTimeout })
      return waiter.catch((err) => {
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
        const _grabCookie = async (name) => {
          const cookies = await this.browserContext.cookies()
          const cookie = cookies.filter((c) => c.name === name)
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

    this.page.on('requestfinished', async (request) => {
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
      urls.forEach((url) => {
        this.page.route(url, (route) => {
          route
            .abort()
            // Sometimes it happens that browser has been closed in the meantime. It is ok to ignore error then.
            .catch((e) => {})
        })
      })
    } else {
      this.page.route(urls, (route) => {
        route
          .abort()
          // Sometimes it happens that browser has been closed in the meantime. It is ok to ignore error then.
          .catch((e) => {})
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

    urls.forEach((url) => {
      this.page.route(url, (route) => {
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
      throw new Error(
        'Failure in test automation. You use "I.grabTrafficUrl", but "I.startRecordingTraffic" was never called before.',
      )
    }

    for (const i in this.requests) {
      // eslint-disable-next-line no-prototype-builtins
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

    this.cdpSession.on('Network.webSocketFrameReceived', (payload) => {
      this._logWebsocketMessages(this._getWebSocketLog('RECEIVED', payload))
    })

    this.cdpSession.on('Network.webSocketFrameSent', (payload) => {
      this._logWebsocketMessages(this._getWebSocketLog('SENT', payload))
    })

    this.cdpSession.on('Network.webSocketFrameError', (payload) => {
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
        throw new Error(
          'Failure in test automation. You use "I.grabWebSocketMessages", but "I.startRecordingWebSocketMessages" was never called before.',
        )
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
    this.webSocketMessages += message
  }
}

module.exports = Playwright

function buildLocatorString(locator) {
  if (locator.isCustom()) {
    return `${locator.type}=${locator.value}`
  }
  if (locator.isXPath()) {
    return `xpath=${locator.value}`
  }
  return locator.simplify()
}

async function findElements(matcher, locator) {
  if (locator.react) return findReact(matcher, locator)
  if (locator.vue) return findVue(matcher, locator)
  if (locator.pw) return findByPlaywrightLocator.call(this, matcher, locator)
  locator = new Locator(locator, 'css')

  return matcher.locator(buildLocatorString(locator)).all()
}

async function findElement(matcher, locator) {
  if (locator.react) return findReact(matcher, locator)
  if (locator.vue) return findVue(matcher, locator)
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
    assertElementExists(
      els,
      locator,
      'Clickable element',
      `was not found inside element ${new Locator(context).toString()}`,
    )
  } else {
    assertElementExists(els, locator, 'Clickable element')
  }

  await highlightActiveElement.call(this, els[0])

  /*
    using the force true options itself but instead dispatching a click
  */
  if (options.force) {
    await els[0].dispatchEvent('click')
  } else {
    const element = els.length > 1 ? (await getVisibleElements(els))[0] : els[0]
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
  if (locator.react) return findReact(matcher, locator)
  if (locator.vue) return findVue(matcher, locator)
  if (locator.pw) return findByPlaywrightLocator.call(this, matcher, locator)

  locator = new Locator(locator)
  if (!locator.isFuzzy()) return findElements.call(this, matcher, locator)

  let els
  const literal = xpathLocator.literal(locator.value)

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

  return findElements.call(this, matcher, locator.value) // by css or xpath
}

async function proceedSee(assertType, text, context, strict = false) {
  let description
  let allText

  if (!context) {
    const el = await this.context

    allText = el.constructor.name !== 'Locator' ? [await el.locator('body').innerText()] : [await el.innerText()]

    description = 'web application'
  } else {
    const locator = new Locator(context, 'css')
    description = `element ${locator.toString()}`
    const els = await this._locate(locator)
    assertElementExists(els, locator.toString())
    allText = await Promise.all(els.map((el) => el.innerText()))
  }

  if (strict) {
    return allText.map((elText) => equals(description)[assertType](text, elText))
  }
  return stringIncludes(description)[assertType](
    normalizeSpacesInString(text),
    normalizeSpacesInString(allText.join(' | ')),
  )
}

async function findCheckable(locator, context) {
  let contextEl = await this.context
  if (typeof context === 'string') {
    contextEl = await findElements.call(this, contextEl, new Locator(context, 'css').simplify())
    contextEl = contextEl[0]
  }

  const matchedLocator = new Locator(locator)
  if (!matchedLocator.isFuzzy()) {
    return findElements.call(this, contextEl, matchedLocator.simplify())
  }

  const literal = xpathLocator.literal(locator)
  let els = await findElements.call(this, contextEl, Locator.checkable.byText(literal))
  if (els.length) {
    return els
  }
  els = await findElements.call(this, contextEl, Locator.checkable.byName(literal))
  if (els.length) {
    return els
  }
  return findElements.call(this, contextEl, locator)
}

async function proceedIsChecked(assertType, option) {
  let els = await findCheckable.call(this, option)
  assertElementExists(els, option, 'Checkable')
  els = await Promise.all(els.map((el) => el.isChecked()))
  const selected = els.reduce((prev, cur) => prev || cur)
  return truth(`checkable ${option}`, 'to be checked')[assertType](selected)
}

async function findFields(locator) {
  const matchedLocator = new Locator(locator)
  if (!matchedLocator.isFuzzy()) {
    return this._locate(matchedLocator)
  }
  const literal = xpathLocator.literal(locator)

  let els = await this._locate({ xpath: Locator.field.labelEquals(literal) })
  if (els.length) {
    return els
  }

  els = await this._locate({ xpath: Locator.field.labelContains(literal) })
  if (els.length) {
    return els
  }
  els = await this._locate({ xpath: Locator.field.byName(literal) })
  if (els.length) {
    return els
  }
  return this._locate({ css: locator })
}

async function proceedSeeInField(assertType, field, value) {
  const els = await findFields.call(this, field)
  assertElementExists(els, field, 'Field')
  const el = els[0]
  const tag = await el.evaluate((e) => e.tagName)
  const fieldType = await el.getAttribute('type')

  const proceedMultiple = async (elements) => {
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
      elementValues.forEach((val) => stringIncludes(`fields by ${field}`)[assertType](value, val))
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
  if (!res || res.length === 0) {
    throw new ElementNotFound(locator, prefix, suffix)
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
          // we are inside iframe?
          const frameEl = await this.context.frameElement()
          this.context = await frameEl.contentFrame()
          this.contextLocator = null
          return
        }
        // if context element was in iframe - keep it
        // if (await this.context.ownerFrame()) return;
        this.context = page
        this.contextLocator = null
      })
  })
  page.on('console', (msg) => {
    if (!consoleLogStore.includes(msg) && this.options.ignoreLog && !this.options.ignoreLog.includes(msg.type())) {
      this.debugSection(
        `Browser:${ucfirst(msg.type())}`,
        ((msg.text && msg.text()) || msg._text || '') + msg.args().join(' '),
      )
    }
    consoleLogStore.add(msg)
  })

  if (this.options.windowSize && this.options.windowSize.indexOf('x') > 0 && this._getType() === 'Browser') {
    try {
      await page.setViewportSize(parseWindowSize(this.options.windowSize))
    } catch (err) {
      this.debug('Target can be already closed, ignoring...')
    }
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
  /* eslint-disable quote-props */
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
  /* eslint-enable quote-props */
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
  // close other sessions
  try {
    const contexts = await this.browser.contexts()
    contexts.shift()

    await Promise.all(contexts.map((c) => c.close()))
  } catch (e) {
    console.log(e)
  }

  if (this.page) {
    const existingPages = await this.browserContext.pages()
    await this._setPage(existingPages[0])
  }

  if (this.options.keepBrowserState) return

  if (!this.options.keepCookies) {
    this.debugSection('Session', 'cleaning cookies and localStorage')
    await this.clearCookie()
  }
  const currentUrl = await this.grabCurrentUrl()

  if (currentUrl.startsWith('http')) {
    await this.executeScript('localStorage.clear();').catch((err) => {
      if (!(err.message.indexOf("Storage is disabled inside 'data:' URLs.") > -1)) throw err
    })
    await this.executeScript('sessionStorage.clear();').catch((err) => {
      if (!(err.message.indexOf("Storage is disabled inside 'data:' URLs.") > -1)) throw err
    })
  }
}

function saveVideoForPage(page, name) {
  if (!page.video()) return null
  const fileName = `${`${global.output_dir}${pathSeparator}videos${pathSeparator}${uuidv4()}_${clearString(name)}`.slice(0, 245)}.webm`
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
  const fileName = `${`${global.output_dir}${pathSeparator}trace${pathSeparator}${uuidv4()}_${clearString(name)}`.slice(0, 245)}.zip`
  await context.tracing.stop({ path: fileName })
  return fileName
}

async function highlightActiveElement(element) {
  if (this.options.highlightElement && global.debugMode) {
    await element.evaluate((el) => {
      const prevStyle = el.style.boxShadow
      el.style.boxShadow = '0px 0px 4px 3px rgba(255, 0, 0, 0.7)'
      setTimeout(() => (el.style.boxShadow = prevStyle), 2000)
    })
  }
}
