let webdriverio

import fs from 'fs'
import assert from 'assert'
import path from 'path'
import crypto from 'crypto'

import Helper from '@codeceptjs/helper'
import promiseRetry from 'promise-retry'
import { includes as stringIncludes } from '../assert/include.js'
import { urlEquals, equals } from '../assert/equal.js'
import store from '../store.js'
import { checkFocusBeforeType, checkFocusBeforePressKey } from './extras/focusCheck.js'
import output from '../output.js'
const { debug } = output
import { empty } from '../assert/empty.js'
import { truth } from '../assert/truth.js'
import {
  xpathLocator,
  fileExists,
  decodeUrl,
  chunkArray,
  convertCssPropertiesToCamelCase,
  screenshotOutputFolder,
  getNormalizedKeyAttributeValue,
  modifierKeys,
  normalizePath,
  resolveUrl,
  getMimeType,
  base64EncodeFile,
} from '../utils.js'
import { isColorProperty, convertColorToRGBA } from '../colorUtils.js'
import ElementNotFound from './errors/ElementNotFound.js'
import MultipleElementsFound from './errors/MultipleElementsFound.js'
import ConnectionRefused from './errors/ConnectionRefused.js'
import Locator from '../locator.js'
import { highlightElement } from './scripts/highlightElement.js'
import { focusElement } from './scripts/focusElement.js'
import { blurElement } from './scripts/blurElement.js'
import { dontSeeElementError, seeElementError, seeElementInDOMError, dontSeeElementInDOMError } from './errors/ElementAssertion.js'
import { dropFile } from './scripts/dropFile.js'
import { dontSeeTraffic, seeTraffic, grabRecordedNetworkTraffics, stopRecordingTraffic, flushNetworkTraffics } from './network/actions.js'
import WebElement from '../element/WebElement.js'
import { selectElement } from './extras/elementSelection.js'
import { fillRichEditor } from './extras/richTextEditor.js'

const SHADOW = 'shadow'
const webRoot = 'body'
let browserLogs = []

/**
 * Wraps error objects that don't have a proper message property
 * This is needed for ESM compatibility with WebdriverIO error handling
 */
function wrapError(e) {
  if (e && typeof e === 'object' && !e.message) {
    const err = new Error(e.error || e.timeoutMsg || String(e))
    err.stack = e.stack
    return err
  }
  return e
}

/**
 * ## Configuration
 *
 * This helper should be configured in codecept.conf.js
 *
 * @typedef WebDriverConfig
 * @type {object}
 * @prop {string} url - base url of website to be tested.
 * @prop {string} browser - Browser in which to perform testing.
 * @prop {boolean} [bidiProtocol=false] - WebDriver Bidi Protocol. Default: false. More info: https://webdriver.io/docs/api/webdriverBidi/
 * @prop {string} [basicAuth] - (optional) the basic authentication to pass to base url. Example: {username: 'username', password: 'password'}
 * @prop {string} [host=localhost] - WebDriver host to connect.
 * @prop {number} [port=4444] - WebDriver port to connect.
 * @prop {string} [protocol=http] - protocol for WebDriver server.
 * @prop {string} [path=/wd/hub] - path to WebDriver server.
 * @prop {boolean} [restart=true] - restart browser between tests.
 * @prop {boolean|number} [smartWait=false] - **enables [SmartWait](http://codecept.io/acceptance/#smartwait)**; wait for additional milliseconds for element to appear. Enable for 5 secs: "smartWait": 5000.
 * @prop {boolean} [disableScreenshots=false] - don't save screenshots on failure.
 * @prop {boolean} [fullPageScreenshots=false] (optional - make full page screenshots on failure.
 * @prop {boolean} [uniqueScreenshotNames=false] - option to prevent screenshot override if you have scenarios with the same name in different suites.
 * @prop {boolean} [keepBrowserState=false] - keep browser state between tests when `restart` is set to false.
 * @prop {boolean} [keepCookies=false] - keep cookies between tests when `restart` set to false.
 * @prop {string} [windowSize=window] default window size. Set to `maximize` or a dimension in the format `640x480`.
 * @prop {number} [waitForTimeout=1000] sets default wait time in *ms* for all `wait*` functions.
 * @prop {object} [desiredCapabilities] Selenium's [desired capabilities](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities).
 * @prop {boolean} [manualStart=false] - do not start browser before a test, start it manually inside a helper with `this.helpers["WebDriver"]._startBrowser()`.
 * @prop {object} [timeouts] [WebDriver timeouts](http://webdriver.io/docs/timeouts.html) defined as hash.
 * @prop {boolean} [highlightElement] - highlight the interacting elements. Default: false. Note: only activate under verbose mode (--verbose).
 * @prop {string} [logLevel=silent] - level of logging verbosity. Default: silent. Options: trace | debug | info | warn | error | silent. More info: https://webdriver.io/docs/configuration/#loglevel
 */
const config = {}

/**
 * WebDriver helper which wraps [webdriverio](http://webdriver.io/) library to
 * manipulate browser using Selenium WebDriver or PhantomJS.
 *
 * No Selenium Server, ChromeDriver, or GeckoDriver to install or start. Since WebdriverIO 9, driver management is fully automatic — WebdriverIO downloads and starts the matching driver for you. Read more [here](https://webdriver.io/blog/2023/07/31/driver-management/). Please check [Testing with WebDriver](https://codecept.io/webdriver/#testing-with-webdriver) for more details.
 *
 * For those who require custom driver options, fear not; WebDriver Helper allows you to pass in driver options through custom WebDriver configuration.
 * If you have a custom grid, use a cloud service, or prefer to run your own driver, there's no need to worry since WebDriver Helper will only start a driver when there are no other connection information settings like hostname or port specified.
 *
 * <!-- configuration -->
 *
 * Example:
 *
 * ```js
 * {
 *    helpers: {
 *      WebDriver : {
 *        smartWait: 5000,
 *        browser: "chrome",
 *        restart: false,
 *        windowSize: "maximize",
 *        timeouts: {
 *          "script": 60000,
 *          "page load": 10000
 *        }
 *      }
 *    }
 * }
 * ```
 *
 * Testing Chrome locally is now more convenient than ever. You can define a browser channel, and WebDriver Helper will take care of downloading the specified browser version for you.
 * For example:
 *
 * ```js
 * {
 *    helpers: {
 *      WebDriver : {
 *        smartWait: 5000,
 *        browser: "chrome",
 *        browserVersion: '116.0.5793.0', // or 'stable', 'beta', 'dev' or 'canary'
 *        restart: false,
 *        windowSize: "maximize",
 *        timeouts: {
 *          "script": 60000,
 *          "page load": 10000
 *        }
 *      }
 *    }
 * }
 * ```
 *
 *
 * Example with basic authentication
 * ```js
 * {
 *    helpers: {
 *      WebDriver : {
 *        smartWait: 5000,
 *        browser: "chrome",
 *        basicAuth: {username: 'username', password: 'password'},
 *        restart: false,
 *        windowSize: "maximize",
 *        timeouts: {
 *          "script": 60000,
 *          "page load": 10000
 *        }
 *      }
 *    }
 * }
 * ```
 *
 * Additional configuration params can be used from [webdriverio
 * website](http://webdriver.io/guide/getstarted/configuration.html).
 *
 * ### Headless Chrome
 *
 * ```js
 * {
 *    helpers: {
 *      WebDriver : {
 *        url: "http://localhost",
 *        browser: "chrome",
 *        desiredCapabilities: {
 *          chromeOptions: {
 *            args: [ "--headless", "--disable-gpu", "--no-sandbox" ]
 *          }
 *        }
 *      }
 *    }
 * }
 * ```
 *
 * ### Running with devtools protocol
 *
 * ```js
 * {
 *    helpers: {
 *      WebDriver : {
 *        url: "http://localhost",
 *        browser: "chrome",
 *        desiredCapabilities: {
 *          chromeOptions: {
 *            args: [ "--headless", "--disable-gpu", "--no-sandbox" ]
 *          }
 *        }
 *      }
 *    }
 * }
 * ```
 *
 * ### Internet Explorer
 *
 * Additional configuration params can be used from [IE options](https://seleniumhq.github.io/selenium/docs/api/rb/Selenium/WebDriver/IE/Options.html)
 *
 * ```js
 * {
 *    helpers: {
 *      WebDriver : {
 *        url: "http://localhost",
 *        browser: "internet explorer",
 *        desiredCapabilities: {
 *          ieOptions: {
 *            "ie.browserCommandLineSwitches": "-private",
 *            "ie.usePerProcessProxy": true,
 *            "ie.ensureCleanSession": true,
 *          }
 *        }
 *      }
 *    }
 * }
 * ```
 *
 * ### Selenoid Options
 *
 * [Selenoid](https://aerokube.com/selenoid/latest/) is a modern way to run Selenium inside Docker containers.
 * Selenoid is easy to set up and provides more features than original Selenium Server. Use `selenoidOptions` to set Selenoid capabilities
 *
 * ```js
 * {
 *    helpers: {
 *      WebDriver : {
 *        url: "http://localhost",
 *        browser: "chrome",
 *        desiredCapabilities: {
 *          selenoidOptions: {
 *            enableVNC: true,
 *          }
 *        }
 *      }
 *    }
 * }
 * ```
 *
 * ### Connect Through proxy
 *
 * CodeceptJS also provides flexible options when you want to execute tests to Selenium servers through proxy. You will
 * need to update the `helpers.WebDriver.capabilities.proxy` key.
 *
 * ```js
 * {
 *     helpers: {
 *         WebDriver: {
 *             capabilities: {
 *                 proxy: {
 *                     "proxyType": "manual|pac",
 *                     "proxyAutoconfigUrl": "URL TO PAC FILE",
 *                     "httpProxy": "PROXY SERVER",
 *                     "sslProxy": "PROXY SERVER",
 *                     "ftpProxy": "PROXY SERVER",
 *                     "socksProxy": "PROXY SERVER",
 *                     "socksUsername": "USERNAME",
 *                     "socksPassword": "PASSWORD",
 *                     "noProxy": "BYPASS ADDRESSES"
 *                 }
 *             }
 *         }
 *     }
 * }
 * ```
 * For example,
 *
 * ```js
 * {
 *     helpers: {
 *         WebDriver: {
 *             capabilities: {
 *                 proxy: {
 *                     "proxyType": "manual",
 *                     "httpProxy": "http://corporate.proxy:8080",
 *                     "socksUsername": "codeceptjs",
 *                     "socksPassword": "secret",
 *                     "noProxy": "127.0.0.1,localhost"
 *                 }
 *             }
 *         }
 *     }
 * }
 * ```
 *
 * Please refer to [Selenium - Proxy Object](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities) for more
 * information.
 *
 * ### Cloud Providers
 *
 * WebDriver makes it possible to execute tests against services like `Sauce Labs` `BrowserStack` `TestingBot`
 * Check out their documentation on [available parameters](http://webdriver.io/guide/usage/cloudservices.html)
 *
 * Connecting to `BrowserStack` and `Sauce Labs` is simple. All you need to do
 * is set the `user` and `key` parameters. WebDriver automatically know which
 * service provider to connect to.
 *
 * ```js
 * {
 *     helpers:{
 *         WebDriver: {
 *             url: "YOUR_DESIRED_HOST",
 *             user: "YOUR_BROWSERSTACK_USER",
 *             key: "YOUR_BROWSERSTACK_KEY",
 *             capabilities: {
 *                 "browserName": "chrome",
 *
 *                 // only set this if you're using BrowserStackLocal to test a local domain
 *                 // "browserstack.local": true,
 *
 *                 // set this option to tell browserstack to provide addition debugging info
 *                 // "browserstack.debug": true,
 *             }
 *         }
 *     }
 * }
 * ```
 *
 * #### SauceLabs
 *
 * SauceLabs can be configured via wdio service, which should be installed additionally:
 *
 * ```
 * npm i @wdio/sauce-service --save
 * ```
 *
 * It is important to make sure it is compatible with current webdriverio version.
 *
 * Enable `wdio` plugin in plugins list and add `sauce` service:
 *
 * ```js
 * plugins: {
 *    wdio: {
 *       enabled: true,
 *        services: ['sauce'],
 *        user: ... ,// saucelabs username
 *        key: ... // saucelabs api key
 *        // additional config, from sauce service
 *    }
 * }
 * ```
 *
 * See [complete reference on webdriver.io](https://webdriver.io/docs/sauce-service.html).
 *
 * > Alternatively, use [codeceptjs-saucehelper](https://github.com/puneet0191/codeceptjs-saucehelper/) for better reporting.
 *
 * #### BrowserStack
 *
 * BrowserStack can be configured via wdio service, which should be installed additionally:
 *
 * ```
 * npm i @wdio/browserstack-service --save
 * ```
 *
 * It is important to make sure it is compatible with current webdriverio version.
 *
 * Enable `wdio` plugin in plugins list and add `browserstack` service:
 *
 * ```js
 * plugins: {
 *    wdio: {
 *       enabled: true,
 *        services: ['browserstack'],
 *        user: ... ,// browserstack username
 *        key: ... // browserstack api key
 *        // additional config, from browserstack service
 *    }
 * }
 * ```
 *
 * See [complete reference on webdriver.io](https://webdriver.io/docs/browserstack-service.html).
 *
 * > Alternatively, use [codeceptjs-bshelper](https://github.com/PeterNgTr/codeceptjs-bshelper) for better reporting.
 *
 * #### TestingBot
 *
 * > **Recommended**: use official [TestingBot Helper](https://github.com/testingbot/codeceptjs-tbhelper).
 *
 * Alternatively, TestingBot can be configured via wdio service, which should be installed additionally:
 *
 * ```
 * npm i @wdio/testingbot-service --save
 * ```
 *
 * It is important to make sure it is compatible with current webdriverio version.
 *
 * Enable `wdio` plugin in plugins list and add `testingbot` service:
 *
 * ```js
 * plugins: {
 *   wdio: {
 *       enabled: true,
 *       services: ['testingbot'],
 *       user: ... ,// testingbot key
 *       key: ... // testingbot secret
 *       // additional config, from testingbot service
 *   }
 * }
 * ```
 *
 * See [complete reference on webdriver.io](https://webdriver.io/docs/testingbot-service.html).
 *
 * #### Applitools
 *
 * Visual testing via Applitools service
 *
 * > Use [CodeceptJS Applitools Helper](https://github.com/PeterNgTr/codeceptjs-applitoolshelper) with Applitools wdio service.
 *
 *
 * ### Multiremote Capabilities
 *
 * This is a work in progress but you can control two browsers at a time right out of the box.
 * Individual control is something that is planned for a later version.
 *
 * Here is the [webdriverio docs](http://webdriver.io/guide/usage/multiremote.html) on the subject
 *
 * ```js
 * {
 *     helpers: {
 *         WebDriver: {
 *             "multiremote": {
 *                 "MyChrome": {
 *                     "desiredCapabilities": {
 *                         "browserName": "chrome"
 *                      }
 *                 },
 *                 "MyFirefox": {
 *                    "desiredCapabilities": {
 *                        "browserName": "firefox"
 *                    }
 *                 }
 *             }
 *         }
 *     }
 * }
 * ```
 *
 * ## Access From Helpers
 *
 * Receive a WebDriver client from a custom helper by accessing `browser` property:
 *
 * ```js
 * const { WebDriver } = this.helpers;
 * const browser = WebDriver.browser
 * ```
 *
 * ## Methods
 */
class WebDriver extends Helper {
  constructor(config) {
    super(config)
    // webdriverio will be loaded dynamically in _init method

    // set defaults
    this.root = webRoot
    this.isWeb = true
    this.isRunning = false
    this.sessionWindows = {}
    this.activeSessionName = ''
    this.customLocatorStrategies = config.customLocatorStrategies

    // for network stuff
    this.requests = []
    this.recording = false
    this.recordedAtLeastOnce = false

    this._setConfig(config)

    Locator.addFilter((locator, result) => {
      if (typeof locator === 'string' && locator.indexOf('~') === 0) {
        // accessibility locator
        if (this.isWeb) {
          result.value = `[aria-label="${locator.slice(1)}"]`
          result.type = 'css'
          result.output = `aria-label=${locator.slice(1)}`
        }
      }
    })
  }

  _validateConfig(config) {
    const defaults = {
      logLevel: 'silent',
      // codeceptjs
      remoteFileUpload: true,
      smartWait: 0,
      waitForTimeout: 1000, // ms
      capabilities: {},
      restart: true,
      uniqueScreenshotNames: false,
      disableScreenshots: false,
      fullPageScreenshots: false,
      manualStart: false,
      keepCookies: false,
      keepBrowserState: false,
      deprecationWarnings: false,
      highlightElement: false,
      strict: false,
    }

    // override defaults with config
    config = Object.assign(defaults, config)

    if (config.host) {
      // webdriverio spec
      config.hostname = config.host
      config.path = config.path ? config.path : '/wd/hub'
    }

    config.baseUrl = config.url || config.baseUrl
    if (config.desiredCapabilities && Object.keys(config.desiredCapabilities).length) {
      config.capabilities = config.desiredCapabilities
    }
    config.capabilities.browserName = config.browser || config.capabilities.browserName

    // WebDriver Bidi Protocol. Default: true
    config.capabilities.webSocketUrl = config.bidiProtocol ?? config.capabilities.webSocketUrl ?? true

    config.capabilities.browserVersion = config.browserVersion || config.capabilities.browserVersion
    if (config.capabilities.chromeOptions) {
      config.capabilities['goog:chromeOptions'] = config.capabilities.chromeOptions
      delete config.capabilities.chromeOptions
    }
    if (config.capabilities.firefoxOptions) {
      config.capabilities['moz:firefoxOptions'] = config.capabilities.firefoxOptions
      delete config.capabilities.firefoxOptions
    }
    if (config.capabilities.ieOptions) {
      config.capabilities['se:ieOptions'] = config.capabilities.ieOptions
      delete config.capabilities.ieOptions
    }
    if (config.capabilities.selenoidOptions) {
      config.capabilities['selenoid:options'] = config.capabilities.selenoidOptions
      delete config.capabilities.selenoidOptions
    }

    config.waitForTimeoutInSeconds = config.waitForTimeout / 1000 // convert to seconds

    if (!config.capabilities.platformName && (!config.url || !config.browser)) {
      throw new Error(`
        WebDriver requires at url and browser to be set.
        Check your codeceptjs config file to ensure these are set properly
          {
            "helpers": {
              "WebDriver": {
                "url": "YOUR_HOST"
                "browser": "YOUR_PREFERRED_TESTING_BROWSER"
              }
            }
          }
      `)
    }

    return config
  }

  static _checkRequirements() {
    try {
      // In ESM, webdriverio will be checked via dynamic import in _init
      // The import will fail at module load time if webdriverio is missing
      return null
    } catch (e) {
      return ['webdriverio@^6.12.1']
    }
  }

  async _init() {
    // Load webdriverio dynamically
    if (!webdriverio) {
      try {
        webdriverio = await import('webdriverio')
        webdriverio = webdriverio.default || webdriverio
      } catch (e) {
        throw new Error('webdriverio could not be loaded. Please install webdriverio.')
      }
    }
  }

  static _config() {
    return [
      {
        name: 'url',
        message: 'Base url of site to be tested',
        default: 'http://localhost',
      },
      {
        name: 'browser',
        message: 'Browser in which testing will be performed',
        default: 'chrome',
      },
    ]
  }

  _beforeSuite() {
    if (!this.options.restart && !this.options.manualStart && !this.isRunning) {
      this.debugSection('Session', 'Starting singleton browser session')
      return this._startBrowser()
    }
  }

  _lookupCustomLocator(customStrategy) {
    if (typeof this.customLocatorStrategies !== 'object') {
      return null
    }
    const strategy = this.customLocatorStrategies[customStrategy]
    return typeof strategy === 'function' ? strategy : null
  }

  _isCustomLocator(locator) {
    const locatorObj = new Locator(locator)
    if (locatorObj.isCustom()) {
      const customLocator = this._lookupCustomLocator(locatorObj.type)
      if (customLocator) {
        return true
      }
      throw new Error('Please define "customLocatorStrategies" as an Object and the Locator Strategy as a "function".')
    }
    return false
  }

  async _res(locator) {
    const res = this._isShadowLocator(locator) || this._isCustomLocator(locator) ? await this._locate(locator) : await this.$$(withStrictLocator(locator))
    return res
  }

  async _startBrowser() {
    try {
      if (this.options.multiremote) {
        this.browser = await webdriverio.multiremote(this.options.multiremote)
      } else {
        // remove non w3c capabilities
        delete this.options.capabilities.protocol
        delete this.options.capabilities.hostname
        delete this.options.capabilities.port
        delete this.options.capabilities.path
        this.browser = await webdriverio.remote(this.options)
      }
    } catch (err) {
      if (err.toString().indexOf('ECONNREFUSED')) {
        throw new ConnectionRefused(err)
      }
      throw err
    }

    this.isRunning = true
    if (this.options.timeouts && this.isWeb) {
      await this.defineTimeout(this.options.timeouts)
    }

    await this._resizeWindowIfNeeded(this.browser, this.options.windowSize)

    this.$$ = this.browser.$$.bind(this.browser)

    if (this._isCustomLocatorStrategyDefined()) {
      Object.keys(this.customLocatorStrategies).forEach(async customLocator => {
        this.debugSection('Weddriver', `adding custom locator strategy: ${customLocator}`)
        const locatorFunction = this._lookupCustomLocator(customLocator)
        this.browser.addLocatorStrategy(customLocator, locatorFunction)
      })
    }

    if (this.browser.capabilities && this.browser.capabilities.platformName) {
      this.browser.capabilities.platformName = this.browser.capabilities.platformName.toLowerCase()
    }

    this.browser.on('dialog', () => {})

    // Check for Bidi, because "sessionSubscribe" is an exclusive Bidi protocol feature. Otherwise, error will be thrown.
    if (this.browser.capabilities && this.browser.capabilities.webSocketUrl) {
      await this.browser.sessionSubscribe({ events: ['log.entryAdded'] })
      this.browser.on('log.entryAdded', logEvents)
    }

    return this.browser
  }

  _isCustomLocatorStrategyDefined() {
    return this.customLocatorStrategies && Object.keys(this.customLocatorStrategies).length
  }

  async _stopBrowser() {
    if (this.browser && this.isRunning) await this.browser.deleteSession()
  }

  async _before() {
    if (!webdriverio) await this._init()
    this.context = this.root
    if (this.options.restart && !this.options.manualStart) return this._startBrowser()
    if (!this.isRunning && !this.options.manualStart) return this._startBrowser()
    if (this.browser) this.$$ = this.browser.$$.bind(this.browser)
    return this.browser
  }

  async _after() {
    if (!this.isRunning) return
    if (this.options.restart) {
      this.isRunning = false
      return this.browser.deleteSession()
    }
    if (this.browser.isInsideFrame) await this.browser.switchFrame(null)

    if (this.options.keepBrowserState) return

    if (!this.options.keepCookies && this.options.capabilities.browserName) {
      this.debugSection('Session', 'cleaning cookies and localStorage')
      await this.browser.deleteCookies()
    }
    await this.browser.execute('localStorage.clear();').catch(err => {
      if (!(err.message.indexOf("Storage is disabled inside 'data:' URLs.") > -1)) throw err
    })
    await this.closeOtherTabs()
    browserLogs = []
    return this.browser
  }

  _afterSuite() {}

  _finishTest() {
    if (!this.options.restart && this.isRunning) return this._stopBrowser()
  }

  _session() {
    const defaultSession = this.browser
    return {
      start: async (sessionName, opts) => {
        // opts.disableScreenshots = true; // screenshots cant be saved as session will be already closed
        opts = this._validateConfig(Object.assign(this.options, opts))
        this.debugSection('New Browser', JSON.stringify(opts))
        const browser = await webdriverio.remote(opts)
        this.activeSessionName = sessionName
        if (opts.timeouts && this.isWeb) {
          await this._defineBrowserTimeout(browser, opts.timeouts)
        }

        await this._resizeWindowIfNeeded(browser, opts.windowSize)

        return browser
      },
      stop: async browser => {
        if (!browser) return
        return browser.deleteSession()
      },
      loadVars: async browser => {
        if (this.context !== this.root) throw new Error("Can't start session inside within block")
        this.browser = browser
        this.$$ = this.browser.$$.bind(this.browser)
        this.sessionWindows[this.activeSessionName] = browser
      },
      restoreVars: async session => {
        if (!session) {
          this.activeSessionName = ''
        }
        this.browser = defaultSession
        this.$$ = this.browser.$$.bind(this.browser)
      },
    }
  }

  /**
   * Use [webdriverio](https://webdriver.io/docs/api.html) API inside a test.
   *
   * First argument is a description of an action.
   * Second argument is async function that gets this helper as parameter.
   *
   * { [`browser`](https://webdriver.io/docs/api.html)) } object from WebDriver API is available.
   *
   * ```js
   * I.useWebDriverTo('open multiple windows', async ({ browser }) {
   *    // create new window
   *    await browser.newWindow('https://webdriver.io');
   * });
   * ```
   *
   * @param {string} description used to show in logs.
   * @param {function} fn async functuion that executed with WebDriver helper as argument
   */
  useWebDriverTo(description, fn) {
    return this._useTo(...arguments)
  }

  async _failed() {
    if (this.context !== this.root) await this._withinEnd()
  }

  async _withinBegin(locator) {
    const frame = isFrameLocator(locator)
    if (frame) {
      this.browser.isInsideFrame = true
      if (Array.isArray(frame)) {
        // this.switchTo(null);
        await forEachAsync(frame, async f => this.switchTo(f))
        return
      }
      await this.switchTo(frame)
      return
    }
    this.context = locator

    let res = await this.browser.$$(withStrictLocator(locator))
    assertElementExists(res, locator)
    res = usingFirstElement(res)
    this.context = res.selector
    this.$$ = res.$$.bind(res)
  }

  async _withinEnd() {
    if (this.browser.isInsideFrame) {
      this.browser.isInsideFrame = false
      return this.switchTo(null)
    }
    this.context = this.root
    this.$$ = this.browser.$$.bind(this.browser)
  }

  /**
   * Check if locator is type of "Shadow"
   *
   * @param {object} locator
   */
  _isShadowLocator(locator) {
    return locator.type === SHADOW || locator[SHADOW]
  }

  /**
   * Locate Element within the Shadow Dom
   *
   * @param {object} locator
   */
  async _locateShadow(locator) {
    const shadow = locator.value ? locator.value : locator[SHADOW]
    const shadowSequence = []
    let elements

    if (!Array.isArray(shadow)) {
      throw new Error(`Shadow '${shadow}' should be defined as an Array of elements.`)
    }

    // traverse through the Shadow locators in sequence
    for (let index = 0; index < shadow.length; index++) {
      const shadowElement = shadow[index]
      shadowSequence.push(shadowElement)

      if (!elements) {
        elements = await this.browser.$$(shadowElement)
      } else if (Array.isArray(elements)) {
        elements = await elements[0].shadow$$(shadowElement)
      } else if (elements) {
        elements = await elements.shadow$$(shadowElement)
      }

      if (!elements || !elements[0]) {
        throw new Error(
          `Shadow Element '${shadowElement}' is not found. It is possible the element is incorrect or elements sequence is incorrect. Please verify the sequence '${shadowSequence.join('>')}' is correctly chained.`,
        )
      }
    }

    this.debugSection('Elements', `Found ${elements.length} '${SHADOW}' elements`)

    return elements
  }

  /**
   * Smart Wait to locate an element
   *
   * @param {object} locator
   */
  async _smartWait(locator) {
    this.debugSection(`SmartWait (${this.options.smartWait}ms)`, `Locating ${JSON.stringify(locator)} in ${this.options.smartWait}`)
    await this.defineTimeout({ implicit: this.options.smartWait })
  }

  /**
   * Get elements by different locator types, including strict locator.
   * Should be used in custom helpers:
   *
   * ```js
   * this.helpers['WebDriver']._locate({name: 'password'}).then //...
   * ```
   *
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   */
  async _locate(locator, smartWait = false) {
    if (store.debugMode) smartWait = false

    // special locator type for Shadow DOM
    if (this._isShadowLocator(locator)) {
      if (!this.options.smartWait || !smartWait) {
        const els = await this._locateShadow(locator)
        return els
      }

      const els = await this._locateShadow(locator)
      return els
    }

    // special locator type for ARIA roles
    if (locator.role) {
      return this._locateByRole(locator)
    }

    // Handle role locators passed as Locator instances
    const matchedLocator = new Locator(locator)
    if (matchedLocator.isRole()) {
      return this._locateByRole(matchedLocator.locator)
    }

    if (!this.options.smartWait || !smartWait) {
      if (this._isCustomLocator(locator)) {
        const locatorObj = new Locator(locator)
        return this.browser.custom$$(locatorObj.type, locatorObj.value)
      }

      const els = await this.$$(withStrictLocator(locator))
      return els
    }

    await this._smartWait(locator)

    if (this._isCustomLocator(locator)) {
      const locatorObj = new Locator(locator)
      return this.browser.custom$$(locatorObj.type, locatorObj.value)
    }

    const els = await this.$$(withStrictLocator(locator))
    await this.defineTimeout({ implicit: 0 })
    return els
  }

  _grabCustomLocator(locator) {
    if (typeof locator === 'string') {
      locator = new Locator(locator)
    }
    return locator.value ? locator.value : locator.custom
  }

  /**
   * Find a checkbox by providing human-readable text:
   *
   * ```js
   * this.helpers['WebDriver']._locateCheckable('I agree with terms and conditions').then // ...
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   */
  async _locateCheckable(locator) {
    return findCheckable.call(this, locator, this.$$.bind(this)).then(res => res)
  }

  /**
   * Find a clickable element by providing human-readable text:
   *
   * ```js
   * const els = await this.helpers.WebDriver._locateClickable('Next page');
   * const els = await this.helpers.WebDriver._locateClickable('Next page', '.pages');
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   */
  async _locateClickable(locator, context) {
    const locateFn = prepareLocateFn.call(this, context)
    return findClickable.call(this, locator, locateFn)
  }

  /**
   * Find field elements by providing human-readable text:
   *
   * ```js
   * this.helpers['WebDriver']._locateFields('Your email').then // ...
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   */
  async _locateFields(locator) {
    return findFields.call(this, locator).then(res => res)
  }

  /**
   * Locate elements by ARIA role using WebdriverIO accessibility selectors
   *
   * @param {object} locator - role locator object { role: string, text?: string, exact?: boolean }
   */
  async _locateByRole(locator) {
    const role = locator.role

    if (!locator.text) {
      return this.browser.$$(`[role="${role}"]`)
    }

    const elements = await this.browser.$$(`[role="${role}"]`)
    const filteredElements = []
    const matchFn = locator.exact === true
      ? t => t === locator.text
      : t => t && t.includes(locator.text)

    for (const element of elements) {
      const texts = await getElementTextAttributes.call(this, element)
      if (texts.some(matchFn)) {
        filteredElements.push(element)
      }
    }

    return filteredElements
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

  /**
   * Set [WebDriver timeouts](https://webdriver.io/docs/timeouts.html) in realtime.
   *
   * Timeouts are expected to be passed as object:
   *
   * ```js
   * I.defineTimeout({ script: 5000 });
   * I.defineTimeout({ implicit: 10000, pageLoad: 10000, script: 5000 });
   * ```
   *
   * @param {*} timeouts WebDriver timeouts object.
   */
  defineTimeout(timeouts) {
    return this._defineBrowserTimeout(this.browser, timeouts)
  }

  _defineBrowserTimeout(browser, timeouts) {
    return browser.setTimeout(timeouts)
  }

  /**
   * {{> amOnPage }}
   *
   */
  amOnPage(url) {
    let split_url
    if (this.options.basicAuth) {
      if (url.startsWith('/')) {
        url = this.options.url + url
      }
      split_url = url.split('//')
      url = `${split_url[0]}//${this.options.basicAuth.username}:${this.options.basicAuth.password}@${split_url[1]}`
    }
    return this.browser.url(url)
  }

  /**
   * {{> click }}
   *
   */
  async click(locator, context = null) {
    const clickMethod = this.browser.isMobile && this.browser.capabilities.platformName !== 'android' ? 'touchClick' : 'elementClick'
    const locateFn = prepareLocateFn.call(this, context)

    const res = await findClickable.call(this, locator, locateFn)
    if (context) {
      assertElementExists(res, locator, 'Clickable element', `was not found inside element ${new Locator(context)}`)
    } else {
      assertElementExists(res, locator, 'Clickable element')
    }
    const elem = selectElement(res, locator, this)
    highlightActiveElement.call(this, elem)
    return this.browser[clickMethod](getElementId(elem))
  }

  /**
   * {{> forceClick }}
   *
   */
  async forceClick(locator, context = null) {
    const locateFn = prepareLocateFn.call(this, context)

    const res = await findClickable.call(this, locator, locateFn)
    if (context) {
      assertElementExists(res, locator, 'Clickable element', `was not found inside element ${new Locator(context)}`)
    } else {
      assertElementExists(res, locator, 'Clickable element')
    }
    const elem = selectElement(res, locator, this)
    highlightActiveElement.call(this, elem)

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
   * {{> doubleClick }}
   *
   */
  async doubleClick(locator, context = null) {
    const locateFn = prepareLocateFn.call(this, context)

    const res = await findClickable.call(this, locator, locateFn)
    if (context) {
      assertElementExists(res, locator, 'Clickable element', `was not found inside element ${new Locator(context)}`)
    } else {
      assertElementExists(res, locator, 'Clickable element')
    }

    const elem = selectElement(res, locator, this)
    highlightActiveElement.call(this, elem)
    return elem.doubleClick()
  }

  /**
   * {{> rightClick }}
   *
   */
  async rightClick(locator, context) {
    const locateFn = prepareLocateFn.call(this, context)

    const res = await findClickable.call(this, locator, locateFn)
    if (context) {
      assertElementExists(res, locator, 'Clickable element', `was not found inside element ${new Locator(context)}`)
    } else {
      assertElementExists(res, locator, 'Clickable element')
    }

    const el = selectElement(res, locator, this)

    await el.moveTo()

    if (this.browser.isW3C) {
      return el.click({ button: 'right' })
    }
    // JSON Wire version
    await this.browser.buttonDown(2)
  }

  /**
   * Performs click at specific coordinates.
   * If locator is provided, the coordinates are relative to the element's top-left corner.
   * If locator is not provided, the coordinates are relative to the body element.
   *
   * ```js
   * // Click at coordinates (100, 200) relative to body
   * I.clickXY(100, 200);
   *
   * // Click at coordinates (50, 30) relative to element's top-left corner
   * I.clickXY('#someElement', 50, 30);
   * ```
   *
   * @param {CodeceptJS.LocatorOrString|number} locator Element to click on or X coordinate if no element.
   * @param {number} [x] X coordinate relative to element's top-left, or Y coordinate if locator is a number.
   * @param {number} [y] Y coordinate relative to element's top-left.
   * @returns {Promise<void>}
   */
  async clickXY(locator, x, y) {
    // If locator is a number, treat it as X coordinate and use body as base
    if (typeof locator === 'number') {
      const globalX = locator
      const globalY = x
      locator = '//body'
      x = globalX
      y = globalY
    }

    // Locate the base element
    const res = await this._locate(withStrictLocator(locator), true)
    assertElementExists(res, locator, 'Element to click')
    const el = usingFirstElement(res)

    // Get element position and size to calculate top-left corner
    const location = await el.getLocation()
    const size = await el.getSize()

    // WebDriver clicks at center by default, so we need to offset from center to top-left
    // then add our desired x, y coordinates
    const offsetX = -(size.width / 2) + x
    const offsetY = -(size.height / 2) + y

    if (this.browser.isW3C) {
      // Use performActions for W3C WebDriver
      return this.browser.performActions([
        {
          type: 'pointer',
          id: 'pointer1',
          parameters: { pointerType: 'mouse' },
          actions: [
            {
              type: 'pointerMove',
              origin: el,
              duration: 0,
              x: Math.round(offsetX),
              y: Math.round(offsetY),
            },
            { type: 'pointerDown', button: 0 },
            { type: 'pointerUp', button: 0 },
          ],
        },
      ])
    }

    // Fallback for non-W3C browsers
    await el.moveTo({ xOffset: Math.round(offsetX), yOffset: Math.round(offsetY) })
    return el.click()
  }

  /**
   * {{> forceRightClick }}
   *
   */
  async forceRightClick(locator, context = null) {
    const locateFn = prepareLocateFn.call(this, context)

    const res = await findClickable.call(this, locator, locateFn)
    if (context) {
      assertElementExists(res, locator, 'Clickable element', `was not found inside element ${new Locator(context)}`)
    } else {
      assertElementExists(res, locator, 'Clickable element')
    }
    const elem = usingFirstElement(res)

    return this.executeScript(el => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
      const event = document.createEvent('MouseEvent')
      event.initEvent('contextmenu', true, true)
      return el.dispatchEvent(event)
    }, elem)
  }

  /**
   * {{> fillField }}
   * {{ custom }}
   *
   */
  async fillField(field, value, context = null) {
    const res = await findFields.call(this, field, context)
    assertElementExists(res, field, 'Field')
    const elem = selectElement(res, field, this)
    highlightActiveElement.call(this, elem)

    if (this.isWeb !== false && await fillRichEditor(this, elem, value)) {
      return
    }

    try {
      await elem.clearValue()
    } catch (err) {
      if (err.message && err.message.includes('invalid element state')) {
        await this.executeScript(el => {
          el.value = ''
        }, elem)
      } else {
        throw err
      }
    }
    await elem.setValue(value.toString())
  }

  /**
   * {{> appendField }}
   */
  async appendField(field, value, context = null) {
    const res = await findFields.call(this, field, context)
    assertElementExists(res, field, 'Field')
    const elem = selectElement(res, field, this)
    highlightActiveElement.call(this, elem)
    return elem.addValue(value.toString())
  }

  /**
   * {{> clearField }}
   *
   */
  async clearField(field, context = null) {
    const res = await findFields.call(this, field, context)
    assertElementExists(res, field, 'Field')
    const elem = selectElement(res, field, this)
    highlightActiveElement.call(this, elem)
    return elem.clearValue(getElementId(elem))
  }

  /**
   * {{> selectOption }}
   */
  async selectOption(select, option, context = null) {
    const locateFn = prepareLocateFn.call(this, context)
    const matchedLocator = new Locator(select)

    // Strict locator
    if (!matchedLocator.isFuzzy()) {
      this.debugSection('SelectOption', `Strict: ${JSON.stringify(select)}`)
      const els = await locateFn(select)
      assertElementExists(els, select, 'Selectable element')
      return proceedSelectOption.call(this, selectElement(els, select, this), option)
    }

    // Fuzzy: try combobox
    this.debugSection('SelectOption', `Fuzzy: "${matchedLocator.value}"`)
    let els = await this._locateByRole({ role: 'combobox', text: matchedLocator.value })
    if (els?.length) return proceedSelectOption.call(this, selectElement(els, select, this), option)

    // Fuzzy: try listbox
    els = await this._locateByRole({ role: 'listbox', text: matchedLocator.value })
    if (els?.length) return proceedSelectOption.call(this, selectElement(els, select, this), option)

    // Fuzzy: try native select
    const res = await findFields.call(this, select, context)
    assertElementExists(res, select, 'Selectable field')
    return proceedSelectOption.call(this, selectElement(res, select, this), option)
  }

  /**
   * Appium: not tested
   *
   * {{> attachFile }}
   */
  async attachFile(locator, pathToFile, context = null) {
    let file = path.join(store.codeceptDir, pathToFile)
    if (!fileExists(file)) {
      throw new Error(`File at ${file} can not be found on local system`)
    }

    const res = await findFields.call(this, locator, context)
    this.debug(`Uploading ${file}`)

    if (res.length) {
      const el = selectElement(res, locator, this)
      const tag = await this.browser.execute(function (elem) { return elem.tagName }, el)
      const type = await this.browser.execute(function (elem) { return elem.type }, el)
      if (tag === 'INPUT' && type === 'file') {
        if (this.options.remoteFileUpload) {
          try {
            this.debugSection('File', 'Uploading file to remote server')
            file = await this.browser.uploadFile(file)
          } catch (err) {
            throw new Error(`File can't be transferred to remote server. Set \`remoteFileUpload: false\` in config to upload file locally.\n${err.message}`)
          }
        }
        return el.addValue(file)
      }
    }

    const targetRes = res.length ? res : await this._locate(locator)
    assertElementExists(targetRes, locator, 'Element')
    const targetEl = selectElement(targetRes, locator, this)
    const fileData = {
      base64Content: base64EncodeFile(file),
      fileName: path.basename(file),
      mimeType: getMimeType(path.basename(file)),
    }
    return this.browser.execute(dropFile, targetEl, fileData)
  }

  /**
   * Appium: not tested
   * {{> checkOption }}
   */
  async checkOption(field, context = null) {
    const clickMethod = this.browser.isMobile && this.browser.capabilities.platformName !== 'android' ? 'touchClick' : 'elementClick'
    const locateFn = prepareLocateFn.call(this, context)

    const res = await findCheckable.call(this, field, locateFn)

    assertElementExists(res, field, 'Checkable')
    const elem = selectElement(res, field, this)
    const elementId = getElementId(elem)
    highlightActiveElement.call(this, elem)

    const isSelected = await isElementChecked(this.browser, elementId)

    if (isSelected) return Promise.resolve(true)
    return this.browser[clickMethod](elementId)
  }

  /**
   * Appium: not tested
   * {{> uncheckOption }}
   */
  async uncheckOption(field, context = null) {
    const clickMethod = this.browser.isMobile && this.browser.capabilities.platformName !== 'android' ? 'touchClick' : 'elementClick'
    const locateFn = prepareLocateFn.call(this, context)

    const res = await findCheckable.call(this, field, locateFn)

    assertElementExists(res, field, 'Checkable')
    const elem = selectElement(res, field, this)
    const elementId = getElementId(elem)
    highlightActiveElement.call(this, elem)

    const isSelected = await isElementChecked(this.browser, elementId)

    if (!isSelected) return Promise.resolve(true)
    return this.browser[clickMethod](elementId)
  }

  /**
   * {{> grabTextFromAll }}
   *
   */
  async grabTextFromAll(locator) {
    const res = await this._locate(locator, true)
    let val = []
    await forEachAsync(res, async el => {
      const text = await this.browser.getElementText(getElementId(el))
      val.push(text)
    })
    this.debugSection('GrabText', String(val))
    return val
  }

  /**
   * {{> grabTextFrom }}
   *
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
   * {{> grabHTMLFromAll }}
   *
   */
  async grabHTMLFromAll(locator) {
    const elems = await this._locate(locator, true)
    const html = await forEachAsync(elems, elem => elem.getHTML(false))
    this.debugSection('GrabHTML', String(html))
    return html
  }

  /**
   * {{> grabHTMLFrom }}
   *
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
   * {{> grabValueFromAll }}
   *
   */
  async grabValueFromAll(locator) {
    const res = await this._locate(locator, true)
    const val = await forEachAsync(res, el => el.getValue())
    this.debugSection('GrabValue', String(val))

    return val
  }

  /**
   * {{> grabValueFrom }}
   *
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
   * {{> grabCssPropertyFromAll }}
   */
  async grabCssPropertyFromAll(locator, cssProperty) {
    const res = await this._locate(locator, true)
    const val = await forEachAsync(res, async el => this.browser.getElementCSSValue(getElementId(el), cssProperty))
    this.debugSection('Grab', String(val))
    return val
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
   * {{> grabAttributeFromAll }}
   */
  async grabAttributeFromAll(locator, attr) {
    const res = await this._locate(locator, true)
    const val = await forEachAsync(res, async el => el.getAttribute(attr))
    this.debugSection('GrabAttribute', String(val))
    return val
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
   * {{> seeInTitle }}
   */
  async seeInTitle(text) {
    const title = await this.browser.getTitle()
    return stringIncludes('web page title').assert(text, title)
  }

  /**
   * {{> seeTitleEquals }}
   */
  async seeTitleEquals(text) {
    const title = await this.browser.getTitle()
    return assert.equal(title, text, `expected web page title to be ${text}, but found ${title}`)
  }

  /**
   * {{> dontSeeInTitle }}
   */
  async dontSeeInTitle(text) {
    const title = await this.browser.getTitle()
    return stringIncludes('web page title').negate(text, title)
  }

  /**
   * {{> grabTitle }}
   */
  async grabTitle() {
    const title = await this.browser.getTitle()
    this.debugSection('Title', title)
    return title
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
   * {{> seeInField }}
   *
   */
  async seeInField(field, value, context = null) {
    const _value = typeof value === 'boolean' ? value : value.toString()
    return proceedSeeField.call(this, 'assert', field, _value, context)
  }

  /**
   * {{> dontSeeInField }}
   *
   */
  async dontSeeInField(field, value, context = null) {
    const _value = typeof value === 'boolean' ? value : value.toString()
    return proceedSeeField.call(this, 'negate', field, _value, context)
  }

  /**
   * Appium: not tested
   * {{> seeCheckboxIsChecked }}
   */
  async seeCheckboxIsChecked(field) {
    return proceedSeeCheckbox.call(this, 'assert', field)
  }

  /**
   * Appium: not tested
   * {{> dontSeeCheckboxIsChecked }}
   */
  async dontSeeCheckboxIsChecked(field) {
    return proceedSeeCheckbox.call(this, 'negate', field)
  }

  /**
   * {{> seeElement }}
   *
   */
  async seeElement(locator, context = null) {
    const locateFn = prepareLocateFn.call(this, context)
    const res = context ? await locateFn(locator) : await this._locate(locator, true)
    assertElementExists(res, locator)
    const selected = await forEachAsync(res, async el => el.isDisplayed())
    try {
      return truth(`elements of ${new Locator(locator)}`, 'to be seen').assert(selected)
    } catch (e) {
      dontSeeElementError(locator)
    }
  }

  /**
   * {{> dontSeeElement }}
   */
  async dontSeeElement(locator, context = null) {
    const locateFn = prepareLocateFn.call(this, context)
    const res = context ? await locateFn(locator) : await this._locate(locator, false)
    if (!res || res.length === 0) {
      return truth(`elements of ${new Locator(locator)}`, 'to be seen').negate(false)
    }
    const selected = await forEachAsync(res, async el => el.isDisplayed())
    try {
      return truth(`elements of ${new Locator(locator)}`, 'to be seen').negate(selected)
    } catch (e) {
      seeElementError(locator)
    }
  }

  /**
   * {{> seeElementInDOM }}
   *
   */
  async seeElementInDOM(locator) {
    const res = await this._res(locator)
    try {
      return empty('elements').negate(res)
    } catch (e) {
      dontSeeElementInDOMError(locator)
    }
  }

  /**
   * {{> dontSeeElementInDOM }}
   *
   */
  async dontSeeElementInDOM(locator) {
    const res = await this._res(locator)
    try {
      return empty('elements').assert(res)
    } catch (e) {
      seeElementInDOMError(locator)
    }
  }

  /**
   * {{> seeInSource }}
   *
   */
  async seeInSource(text) {
    const source = await this.browser.getPageSource()
    return stringIncludes('HTML source of a page').assert(text, source)
  }

  /**
   * {{> grabSource }}
   *
   */
  async grabSource() {
    return this.browser.getPageSource()
  }

  /**
   * {{> grabBrowserLogs }}
   */
  async grabBrowserLogs() {
    return browserLogs
  }

  /**
   * {{> grabCurrentUrl }}
   */
  async grabCurrentUrl() {
    const res = await this.browser.getUrl()
    this.debugSection('Url', res)
    return res
  }

  /**
   * {{> dontSeeInSource }}
   */
  async dontSeeInSource(text) {
    const source = await this.browser.getPageSource()
    return stringIncludes('HTML source of a page').negate(text, source)
  }

  /**
   * {{> seeNumberOfElements }}
   */
  async seeNumberOfElements(locator, num) {
    const res = await this._locate(locator)
    return assert.equal(res.length, num, `expected number of elements (${new Locator(locator)}) is ${num}, but found ${res.length}`)
  }

  /**
   * {{> seeNumberOfVisibleElements }}
   */
  async seeNumberOfVisibleElements(locator, num) {
    const res = await this.grabNumberOfVisibleElements(locator)
    return assert.equal(res, num, `expected number of visible elements (${new Locator(locator)}) is ${num}, but found ${res}`)
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
    const res = await this._locate(locator)
    assertElementExists(res, locator)
    const elemAmount = res.length

    let attrs = await forEachAsync(res, async el => {
      return forEachAsync(Object.keys(attributes), async attr => el.getAttribute(attr))
    })

    const values = Object.keys(attributes).map(key => attributes[key])
    if (!Array.isArray(attrs)) attrs = [attrs]
    let chunked = chunkArray(attrs, values.length)
    chunked = chunked.filter(val => {
      for (let i = 0; i < val.length; ++i) {
        const _actual = Number.isNaN(val[i]) || typeof values[i] === 'string' ? val[i] : Number.parseInt(val[i], 10)
        const _expected = Number.isNaN(values[i]) || typeof values[i] === 'string' ? values[i] : Number.parseInt(values[i], 10)
        // the attribute could be a boolean
        if (typeof _actual === 'boolean') return _actual === _expected
        if (_actual !== _expected) return false
      }
      return true
    })
    return assert.ok(chunked.length === elemAmount, `expected all elements (${new Locator(locator)}) to have attributes ${JSON.stringify(attributes)}`)
  }

  /**
   * {{> grabNumberOfVisibleElements }}
   */
  async grabNumberOfVisibleElements(locator) {
    const res = await this._locate(locator)

    let selected = await forEachAsync(res, async el => el.isDisplayed())
    if (!Array.isArray(selected)) selected = [selected]
    selected = selected.filter(val => val === true)
    return selected.length
  }

  /**
   * {{> seeInCurrentUrl }}
   *
   */
  async seeInCurrentUrl(url) {
    const res = await this.browser.getUrl()
    return stringIncludes('url').assert(url, decodeUrl(res))
  }

  /**
   * {{> dontSeeInCurrentUrl }}
   *
   */
  async dontSeeInCurrentUrl(url) {
    const res = await this.browser.getUrl()
    return stringIncludes('url').negate(url, decodeUrl(res))
  }

  /**
   * {{> seeCurrentUrlEquals }}
   *
   */
  async seeCurrentUrlEquals(url) {
    const res = await this.browser.getUrl()
    return urlEquals(this.options.url).assert(url, decodeUrl(res))
  }

  /**
   * {{> dontSeeCurrentUrlEquals }}
   *
   */
  async dontSeeCurrentUrlEquals(url) {
    const res = await this.browser.getUrl()
    return urlEquals(this.options.url).negate(url, decodeUrl(res))
  }

  /**
   * {{> seeCurrentPathEquals }}
   */
  async seeCurrentPathEquals(path) {
    const currentUrl = await this.browser.getUrl()
    const baseUrl = this.options.url || 'http://localhost'
    const actualPath = new URL(currentUrl, baseUrl).pathname
    return equals('url path').assert(normalizePath(path), normalizePath(actualPath))
  }

  /**
   * {{> dontSeeCurrentPathEquals }}
   */
  async dontSeeCurrentPathEquals(path) {
    const currentUrl = await this.browser.getUrl()
    const baseUrl = this.options.url || 'http://localhost'
    const actualPath = new URL(currentUrl, baseUrl).pathname
    return equals('url path').negate(normalizePath(path), normalizePath(actualPath))
  }

  /**
   * Wraps [execute](http://webdriver.io/api/protocol/execute.html) command.
   *
   * {{> executeScript }}
   */
  executeScript(...args) {
    return this.browser.execute.apply(this.browser, args)
  }

  /**
   * {{> executeAsyncScript }}
   *
   */
  executeAsyncScript(...args) {
    return this.browser.executeAsync.apply(this.browser, args)
  }

  /**
   * {{> scrollIntoView }}
   *
   */
  async scrollIntoView(locator, scrollIntoViewOptions) {
    const res = await this._locate(withStrictLocator(locator), true)
    assertElementExists(res, locator)
    const elem = usingFirstElement(res)
    return elem.scrollIntoView(scrollIntoViewOptions)
  }

  /**
   * {{> scrollTo }}
   *
   */
  async scrollTo(locator, offsetX = 0, offsetY = 0) {
    if (typeof locator === 'number' && typeof offsetX === 'number') {
      offsetY = offsetX
      offsetX = locator
      locator = null
    }

    if (locator) {
      const res = await this._locate(withStrictLocator(locator), true)
      assertElementExists(res, locator)
      const elem = usingFirstElement(res)
      const elementId = getElementId(elem)
      if (this.browser.isMobile && !this.browser.isW3C) return this.browser.touchScroll(offsetX, offsetY, elementId)
      const location = await elem.getLocation()
      assertElementExists(location, locator, 'Failed to receive', 'location')

      return this.browser.execute(
        function (x, y) {
          return window.scrollTo(x, y)
        },
        location.x + offsetX,
        location.y + offsetY,
      )
    }

    if (this.browser.isMobile && !this.browser.isW3C) return this.browser.touchScroll(locator, offsetX, offsetY)

    return this.browser.execute(
      function (x, y) {
        return window.scrollTo(x, y)
      },
      offsetX,
      offsetY,
    )
  }

  /**
   * {{> moveCursorTo }}
   */
  async moveCursorTo(locator, xOffset, yOffset) {
    let context = null
    if (typeof xOffset !== 'number' && xOffset !== undefined) {
      context = xOffset
      xOffset = undefined
    }

    let res
    if (context) {
      const contextRes = await this._locate(withStrictLocator(context), true)
      assertElementExists(contextRes, context, 'Context element')
      res = await contextRes[0].$$(withStrictLocator(locator))
      assertElementExists(res, locator)
    } else {
      res = await this._locate(withStrictLocator(locator), true)
      assertElementExists(res, locator)
    }
    const elem = usingFirstElement(res)
    try {
      await elem.moveTo({ xOffset, yOffset })
    } catch (e) {
      output.debug(e.message)
    }
  }

  /**
   * {{> saveElementScreenshot }}
   *
   */
  async saveElementScreenshot(locator, fileName) {
    const outputFile = screenshotOutputFolder(fileName)

    const res = await this._locate(withStrictLocator(locator), true)
    assertElementExists(res, locator)
    const elem = usingFirstElement(res)

    this.debug(`Screenshot of ${new Locator(locator)} element has been saved to ${outputFile}`)
    return elem.saveScreenshot(outputFile)
  }

  /**
   * {{> saveScreenshot }}
   */
  async saveScreenshot(fileName, fullPage = false) {
    let outputFile = screenshotOutputFolder(fileName)

    if (this.activeSessionName) {
      const browser = this.sessionWindows[this.activeSessionName]

      for (const sessionName in this.sessionWindows) {
        const activeSessionPage = this.sessionWindows[sessionName]
        outputFile = screenshotOutputFolder(`${sessionName}_${fileName}`)

        this.debug(`${sessionName} - Screenshot is saving to ${outputFile}`)

        if (browser) {
          this.debug(`Screenshot of ${sessionName} session has been saved to ${outputFile}`)
          await browser.saveScreenshot(outputFile)
        }
      }
    }

    if (!fullPage) {
      this.debug(`Screenshot has been saved to ${outputFile}`)
      await this.browser.saveScreenshot(outputFile)
    }

    const originalWindowSize = await this.browser.getWindowSize()

    // this case running on device, so we could not set the windowSize
    if (this.browser.isMobile) {
      this.debug(`Screenshot has been saved to ${outputFile}, size: ${originalWindowSize.width}x${originalWindowSize.height}`)
      const buffer = await this.browser.saveScreenshot(outputFile)
      return buffer
    }

    let { width, height } = await this.browser
      .execute(function () {
        return {
          height: document.body.scrollHeight,
          width: document.body.scrollWidth,
        }
      })
      .then(res => res)

    if (height < 100) height = 500 // errors for very small height

    await this.browser.setWindowSize(width, height)
    this.debug(`Screenshot has been saved to ${outputFile}, size: ${width}x${height}`)
    const buffer = await this.browser.saveScreenshot(outputFile)
    await this.browser.setWindowSize(originalWindowSize.width, originalWindowSize.height)
    return buffer
  }

  /**
   * Uses Selenium's JSON [cookie format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).
   * {{> setCookie }}
   */
  async setCookie(cookie) {
    return this.browser.setCookies(cookie)
  }

  /**
   * {{> clearCookie }}
   */
  async clearCookie(cookie) {
    return this.browser.deleteCookies(cookie)
  }

  /**
   * {{> seeCookie }}
   */
  async seeCookie(name) {
    const cookie = await this.browser.getCookies([name])
    return truth(`cookie ${name}`, 'to be set').assert(cookie)
  }

  /**
   * {{> dontSeeCookie }}
   */
  async dontSeeCookie(name) {
    const cookie = await this.browser.getCookies([name])
    return truth(`cookie ${name}`, 'to be set').negate(cookie)
  }

  /**
   * {{> grabCookie }}
   */
  async grabCookie(name) {
    if (!name) return this.browser.getCookies()
    const cookie = await this.browser.getCookies([name])
    this.debugSection('Cookie', JSON.stringify(cookie))
    return cookie[0]
  }

  /**
   * {{> waitForCookie }}
   */
  async waitForCookie(name, sec) {
    // by default, we will retry 3 times
    let retries = 3
    const waitTimeout = sec || this.options.waitForTimeoutInSeconds

    if (sec) {
      retries = sec
    } else {
      retries = waitTimeout - 1
    }

    return promiseRetry(
      async (retry, number) => {
        const _grabCookie = async name => {
          const cookie = await this.browser.getCookies([name])
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
   * Accepts the active JavaScript native popup window, as created by window.alert|window.confirm|window.prompt.
   * Don't confuse popups with modal windows, as created by [various
   * libraries](http://jster.net/category/windows-modals-popups).
   */
  async acceptPopup() {
    const text = await this.browser.getAlertText()
    if (text) {
      return await this.browser.acceptAlert()
    }
  }

  /**
   * Dismisses the active JavaScript popup, as created by `window.alert|window.confirm|window.prompt`.
   *
   */
  async cancelPopup() {
    const text = await this.browser.getAlertText()
    if (text) {
      return await this.browser.dismissAlert()
    }
  }

  /**
   * Checks that the active JavaScript popup, as created by `window.alert|window.confirm|window.prompt`, contains the
   * given string.
   *
   * @param {string} text value to check.
   */
  async seeInPopup(text) {
    return await this.browser.getAlertText().then(res => {
      if (res === null) {
        throw new Error('Popup is not opened')
      }
      stringIncludes('text in popup').assert(text, res)
    })
  }

  /**
   * {{> grabPopupText }}
   */
  async grabPopupText() {
    try {
      return await this.browser.getAlertText()
    } catch (err) {
      this.debugSection('Popup', 'Error getting text from popup')
    }
  }

  /**
   * {{> pressKeyDown }}
   */
  async pressKeyDown(key) {
    key = getNormalizedKey.call(this, key)
    if (!this.browser.isW3C) {
      return this.browser.sendKeys([key])
    }
    return this.browser.performActions([
      {
        type: 'key',
        id: 'keyboard',
        actions: [
          {
            type: 'keyDown',
            value: key,
          },
        ],
      },
    ])
  }

  /**
   * {{> pressKeyUp }}
   */
  async pressKeyUp(key) {
    key = getNormalizedKey.call(this, key)
    if (!this.browser.isW3C) {
      return this.browser.sendKeys([key])
    }
    return this.browser.performActions([
      {
        type: 'key',
        id: 'keyboard',
        actions: [
          {
            type: 'keyUp',
            value: key,
          },
        ],
      },
    ])
  }

  /**
   * _Note:_ In case a text field or textarea is focused be aware that some browsers do not respect active modifier when combining modifier keys with other keys.
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
      await this.pressKeyDown(modifier)
    }
    if (!this.browser.isW3C) {
      await this.browser.sendKeys([key])
    } else {
      await this.browser.performActions([
        {
          type: 'key',
          id: 'keyboard',
          actions: [
            {
              type: 'keyDown',
              value: key,
            },
            {
              type: 'keyUp',
              value: key,
            },
          ],
        },
      ])
    }
    for (const modifier of modifiers) {
      await this.pressKeyUp(modifier)
    }
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
    if (delay) {
      for (const key of keys) {
        await this.browser.keys(key)
        await this.wait(delay / 1000)
      }
      return
    }
    await this.browser.keys(keys)
  }

  /**
   * Appium: not tested in web, in apps doesn't work
   *
   * {{> resizeWindow }}
   */
  async resizeWindow(width, height) {
    return this.browser.setWindowSize(width, height)
  }

  async _resizeBrowserWindow(browser, width, height) {
    if (width === 'maximize') {
      const size = await browser.maximizeWindow()
      this.debugSection('Window Size', size)
      return
    }
    if (browser.isW3C) {
      return browser.setWindowRect(null, null, parseInt(width, 10), parseInt(height, 10))
    }
    return browser.setWindowSize(parseInt(width, 10), parseInt(height, 10))
  }

  async _resizeWindowIfNeeded(browser, windowSize) {
    if (this.isWeb && windowSize === 'maximize') {
      await this._resizeBrowserWindow(browser, 'maximize')
    } else if (this.isWeb && windowSize && windowSize.indexOf('x') > 0) {
      const dimensions = windowSize.split('x')
      await this._resizeBrowserWindow(browser, dimensions[0], dimensions[1])
    }
  }

  /**
   * {{> focus }}
   *
   */
  async focus(locator) {
    const els = await this._locate(locator)
    assertElementExists(els, locator, 'Element to focus')
    const el = usingFirstElement(els)

    await focusElement(el, this.browser)
  }

  /**
   * {{> blur }}
   *
   */
  async blur(locator) {
    const els = await this._locate(locator)
    assertElementExists(els, locator, 'Element to blur')
    const el = usingFirstElement(els)

    await blurElement(el, this.browser)
  }

  /**
   * Appium: not tested
   * {{> dragAndDrop }}
   */
  async dragAndDrop(srcElement, destElement) {
    let sourceEl = await this._locate(srcElement)
    assertElementExists(sourceEl, srcElement)
    sourceEl = usingFirstElement(sourceEl)

    let destEl = await this._locate(destElement)
    assertElementExists(destEl, destElement)
    destEl = usingFirstElement(destEl)

    return sourceEl.dragAndDrop(destEl)
  }

  /**
   * {{> dragSlider }}
   */
  async dragSlider(locator, offsetX = 0) {
    const browser = this.browser
    await this.moveCursorTo(locator)

    // for chrome
    if (browser.isW3C) {
      const xOffset = await this.grabElementBoundingRect(locator, 'x')
      const yOffset = await this.grabElementBoundingRect(locator, 'y')

      return browser.performActions([
        {
          type: 'pointer',
          id: 'pointer1',
          parameters: { pointerType: 'mouse' },
          actions: [
            {
              type: 'pointerMove',
              origin: 'pointer',
              duration: 1000,
              x: xOffset,
              y: yOffset,
            },
            { type: 'pointerDown', button: 0 },
            {
              type: 'pointerMove',
              origin: 'pointer',
              duration: 1000,
              x: offsetX,
              y: 0,
            },
            { type: 'pointerUp', button: 0 },
          ],
        },
      ])
    }

    await browser.buttonDown(0)
    await browser.moveToElement(null, offsetX, 0)
    await browser.buttonUp(0)
  }

  /**
   * {{> grabAllWindowHandles }}
   */
  async grabAllWindowHandles() {
    return this.browser.getWindowHandles()
  }

  /**
   * {{> grabCurrentWindowHandle }}
   */
  async grabCurrentWindowHandle() {
    return this.browser.getWindowHandle()
  }

  /**
   * Switch to the window with a specified handle.
   *
   * ```js
   * const windows = await I.grabAllWindowHandles();
   * // ... do something
   * await I.switchToWindow( windows[0] );
   *
   * const window = await I.grabCurrentWindowHandle();
   * // ... do something
   * await I.switchToWindow( window );
   * ```
   * @param {string} window name of window handle.
   */
  async switchToWindow(window) {
    await this.browser.switchToWindow(window)
  }

  /**
   * {{> closeOtherTabs }}
   */
  async closeOtherTabs() {
    const handles = await this.browser.getWindowHandles()
    const currentHandle = await this.browser.getWindowHandle()
    const otherHandles = handles.filter(handle => handle !== currentHandle)

    await forEachAsync(otherHandles, async handle => {
      await this.browser.switchToWindow(handle)
      await this.browser.closeWindow()
    })
    await this.browser.switchToWindow(currentHandle)
  }

  /**
   * {{> wait }}
   */
  async wait(sec) {
    return new Promise(resolve => {
      setTimeout(resolve, sec * 1000)
    })
  }

  /**
   * {{> waitForEnabled }}
   */
  async waitForEnabled(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeoutInSeconds

    return this.browser.waitUntil(
      async () => {
        const res = await this._res(locator)
        if (!res || res.length === 0) {
          return false
        }
        const selected = await forEachAsync(res, async el => this.browser.isElementEnabled(getElementId(el)))
        if (Array.isArray(selected)) {
          return selected.filter(val => val === true).length > 0
        }
        return selected
      },
      {
        timeout: aSec * 1000,
        timeoutMsg: `element (${new Locator(locator)}) still not enabled after ${aSec} sec`,
      },
    )
  }

  /**
   * {{> waitForElement }}
   */
  async waitForElement(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeoutInSeconds

    return this.browser.waitUntil(
      async () => {
        const res = await this._res(locator)
        return res && res.length
      },
      {
        timeout: aSec * 1000,
        timeoutMsg: `element (${new Locator(locator)}) still not present on page after ${aSec} sec`,
      },
    )
  }

  /**
   * {{> waitForClickable }}
   */
  async waitForClickable(locator, waitTimeout) {
    waitTimeout = waitTimeout || this.options.waitForTimeoutInSeconds
    let res = await this._locate(locator)
    res = usingFirstElement(res)
    assertElementExists(res, locator)

    return res
      .waitForClickable({
        timeout: waitTimeout * 1000,
        timeoutMsg: `element ${res.selector} still not clickable after ${waitTimeout} sec`,
      })
      .catch(e => {
        throw wrapError(e)
      })
  }

  /**
   * {{> waitInUrl }}
   */
  async waitInUrl(urlPart, sec = null) {
    const client = this.browser
    const aSec = sec || this.options.waitForTimeoutInSeconds
    const expectedUrl = resolveUrl(urlPart, this.options.url)
    let currUrl = ''

    return client
      .waitUntil(
        function () {
          return this.getUrl().then(res => {
            currUrl = decodeUrl(res)
            return currUrl.indexOf(expectedUrl) > -1
          })
        },
        { timeout: aSec * 1000 },
      )
      .catch(e => {
        e = wrapError(e)
        if (e.message.indexOf('timeout')) {
          throw new Error(`expected url to include ${expectedUrl}, but found ${currUrl}`)
        }
        throw e
      })
  }

  /**
   * {{> waitUrlEquals }}
   */
  async waitUrlEquals(urlPart, sec = null) {
    const aSec = sec || this.options.waitForTimeoutInSeconds
    const expectedUrl = resolveUrl(urlPart, this.options.url)
    let currUrl = ''
    return this.browser
      .waitUntil(function () {
        return this.getUrl().then(res => {
          currUrl = decodeUrl(res)
          return currUrl === expectedUrl
        })
      }, aSec * 1000)
      .catch(e => {
        e = wrapError(e)
        if (e.message.indexOf('timeout')) {
          throw new Error(`expected url to be ${expectedUrl}, but found ${currUrl}`)
        }
        throw e
      })
  }

  /**
   * {{> waitCurrentPathEquals }}
   */
  async waitCurrentPathEquals(path, sec = null) {
    const aSec = sec || this.options.waitForTimeoutInSeconds
    const normalizedPath = normalizePath(path)
    const baseUrl = this.options.url || 'http://localhost'
    let actualPath = ''

    return this.browser
      .waitUntil(
        async () => {
          const currUrl = await this.browser.getUrl()
          const url = new URL(currUrl, baseUrl)
          actualPath = url.pathname
          return normalizePath(actualPath) === normalizedPath
        },
        { timeout: aSec * 1000 },
      )
      .catch(e => {
        e = wrapError(e)
        if (e.message.indexOf('timeout')) {
          throw new Error(`expected path to be ${normalizedPath}, but found ${normalizePath(actualPath)}`)
        }
        throw e
      })
  }

  /**
   * {{> waitForText }}
   *
   */
  async waitForText(text, sec = null, context = null) {
    const aSec = sec || this.options.waitForTimeoutInSeconds
    const _context = context || this.root

    return this.browser.waitUntil(
      async () => {
        const res = await this.$$(withStrictLocator.call(this, _context))
        if (!res || res.length === 0) return false
        const selected = await forEachAsync(res, async el => this.browser.getElementText(getElementId(el)))
        if (Array.isArray(selected)) {
          return selected.filter(part => part.indexOf(text) >= 0).length > 0
        }
        return selected.indexOf(text) >= 0
      },
      {
        timeout: aSec * 1000,
        timeoutMsg: `element (${_context}) is not in DOM or there is no element(${_context}) with text "${text}" after ${aSec} sec`,
      },
    )
  }

  /**
   * {{> waitForValue }}
   */
  async waitForValue(field, value, sec = null) {
    const client = this.browser
    const aSec = sec || this.options.waitForTimeoutInSeconds

    return client.waitUntil(
      async () => {
        const res = await findFields.call(this, field)
        if (!res || res.length === 0) return false
        const selected = await forEachAsync(res, async el => el.getValue())
        if (Array.isArray(selected)) {
          return selected.filter(part => part.indexOf(value) >= 0).length > 0
        }
        return selected.indexOf(value) >= 0
      },
      {
        timeout: aSec * 1000,
        timeoutMsg: `element (${field}) is not in DOM or there is no element(${field}) with value "${value}" after ${aSec} sec`,
      },
    )
  }

  /**
   * {{> waitForVisible }}
   *
   */
  async waitForVisible(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeoutInSeconds

    return this.browser.waitUntil(
      async () => {
        const res = await this._res(locator)
        if (!res || res.length === 0) return false
        const selected = await forEachAsync(res, async el => el.isDisplayed())
        if (Array.isArray(selected)) {
          return selected.filter(val => val === true).length > 0
        }
        return selected
      },
      {
        timeout: aSec * 1000,
        timeoutMsg: `element (${new Locator(locator)}) still not visible after ${aSec} sec`,
      },
    )
  }

  /**
   * {{> waitNumberOfVisibleElements }}
   */
  async waitNumberOfVisibleElements(locator, num, sec = null) {
    const aSec = sec || this.options.waitForTimeoutInSeconds

    return this.browser
      .waitUntil(
        async () => {
          const res = await this._res(locator)
          if (!res || res.length === 0) return false
          let selected = await forEachAsync(res, async el => el.isDisplayed())

          if (!Array.isArray(selected)) selected = [selected]
          selected = selected.filter(val => val === true)
          return selected.length === num
        },
        {
          timeout: aSec * 1000,
          timeoutMsg: `The number of elements (${new Locator(locator)}) is not ${num} after ${aSec} sec`,
        },
      )
      .catch(e => {
        throw wrapError(e)
      })
  }

  /**
   * {{> waitForInvisible }}
   */
  async waitForInvisible(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeoutInSeconds

    return this.browser.waitUntil(
      async () => {
        const res = await this._res(locator)
        if (!res || res.length === 0) return true
        const selected = await forEachAsync(res, async el => el.isDisplayed())
        return !selected.length
      },
      { timeout: aSec * 1000, timeoutMsg: `element (${new Locator(locator)}) still visible after ${aSec} sec` },
    )
  }

  /**
   * {{> waitToHide }}
   */
  async waitToHide(locator, sec = null) {
    return this.waitForInvisible(locator, sec)
  }

  /**
   * {{> waitForDetached }}
   */
  async waitForDetached(locator, sec = null) {
    const aSec = sec || this.options.waitForTimeoutInSeconds

    return this.browser.waitUntil(
      async () => {
        const res = await this._res(locator)
        if (!res || res.length === 0) {
          return true
        }
        return false
      },
      { timeout: aSec * 1000, timeoutMsg: `element (${new Locator(locator)}) still on page after ${aSec} sec` },
    )
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

    const aSec = sec || this.options.waitForTimeoutInSeconds

    return this.browser.waitUntil(async () => this.browser.execute(fn, ...args), {
      timeout: aSec * 1000,
      timeoutMsg: '',
    })
  }

  /**
   * {{> waitForNumberOfTabs }}
   */
  async waitForNumberOfTabs(expectedTabs, sec) {
    const waitTimeout = sec ? sec * 1000 : this.options.waitForTimeoutInSeconds
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

  /**
   * {{> switchTo }}
   */
  async switchTo(locator) {
    this.browser.isInsideFrame = true
    if (!locator) {
      return this.browser.switchFrame(null)
    }

    let res = await this._locate(locator, true)
    assertElementExists(res, locator)
    res = usingFirstElement(res)
    return this.browser.switchFrame(res)
  }

  /**
   * {{> switchToNextTab }}
   */
  async switchToNextTab(num = 1, sec = null) {
    const aSec = sec || this.options.waitForTimeoutInSeconds
    let target
    const current = await this.browser.getWindowHandle()

    await this.browser.waitUntil(
      async () => {
        await this.browser.getWindowHandles().then(handles => {
          if (handles.indexOf(current) + num + 1 <= handles.length) {
            target = handles[handles.indexOf(current) + num]
          }
        })
        return target
      },
      { timeout: aSec * 1000, timeoutMsg: `There is no ability to switch to next tab with offset ${num}` },
    )
    return this.browser.switchToWindow(target)
  }

  /**
   * {{> switchToPreviousTab }}
   */
  async switchToPreviousTab(num = 1, sec = null) {
    const aSec = sec || this.options.waitForTimeoutInSeconds
    const current = await this.browser.getWindowHandle()
    let target

    await this.browser.waitUntil(
      async () => {
        await this.browser.getWindowHandles().then(handles => {
          if (handles.indexOf(current) - num > -1) {
            target = handles[handles.indexOf(current) - num]
          }
        })
        return target
      },
      { timeout: aSec * 1000, timeoutMsg: `There is no ability to switch to previous tab with offset ${num}` },
    )
    return this.browser.switchToWindow(target)
  }

  /**
   * {{> closeCurrentTab }}
   */
  async closeCurrentTab() {
    await this.browser.closeWindow()
    const handles = await this.browser.getWindowHandles()
    if (handles[0]) await this.browser.switchToWindow(handles[0])
  }

  /**
   * {{> openNewTab }}
   */
  async openNewTab(url = 'about:blank', windowName = null) {
    const client = this.browser
    if (windowName == null) {
      windowName = crypto.randomBytes(32).toString('hex')
    }
    return client.newWindow(url, windowName)
  }

  /**
   * {{> grabNumberOfOpenTabs }}
   */
  async grabNumberOfOpenTabs() {
    const pages = await this.browser.getWindowHandles()
    this.debugSection('Tabs', `Total ${pages.length}`)
    return pages.length
  }

  /**
   * {{> refreshPage }}
   */
  async refreshPage() {
    const client = this.browser
    return client.refresh()
  }

  /**
   * {{> scrollPageToTop }}
   */
  scrollPageToTop() {
    const client = this.browser

    return client.execute(function () {
      window.scrollTo(0, 0)
    })
  }

  /**
   * {{> scrollPageToBottom }}
   */
  scrollPageToBottom() {
    const client = this.browser

    return client.execute(function () {
      const body = document.body
      const html = document.documentElement
      window.scrollTo(0, Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight))
    })
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
   * {{> grabElementBoundingRect }}
   */
  async grabElementBoundingRect(locator, prop) {
    const res = await this._locate(locator, true)
    assertElementExists(res, locator)
    const el = usingFirstElement(res)

    const rect = {
      ...(await el.getLocation()),
      ...(await el.getSize()),
    }
    if (prop) return rect[prop]
    return rect
  }

  /**
   * Placeholder for ~ locator only test case write once run on both Appium and WebDriver.
   * @param {*} caps
   * @param {*} fn
   */

  runOnIOS(caps, fn) {}

  /**
   * Placeholder for ~ locator only test case write once run on both Appium and WebDriver.
   * @param {*} caps
   * @param {*} fn
   */
  runOnAndroid(caps, fn) {}

  /**
   * Placeholder for ~ locator only test case write once run on both Appium and WebDriver.
   */
  async runInWeb(fn) {
    return fn()
  }
}

async function proceedSee(assertType, text, context, strict = false) {
  let description
  if (!context) {
    if (this.context === webRoot) {
      context = this.context
      description = 'web page'
    } else {
      description = `current context ${this.context}`
      context = './/*'
    }
  } else {
    description = `element ${context}`
  }

  const smartWaitEnabled = assertType === 'assert'
  const res = await this._locate(withStrictLocator(context), smartWaitEnabled)
  assertElementExists(res, context)
  let selected = await forEachAsync(res, async el => this.browser.getElementText(getElementId(el)))

  // apply ignoreCase option
  if (store?.currentStep?.opts?.ignoreCase === true) {
    text = text.toLowerCase()
    selected = selected.map(elText => elText.toLowerCase())
  }

  if (strict) {
    if (Array.isArray(selected) && selected.length !== 0) {
      return selected.map(elText => equals(description)[assertType](text, elText))
    }
    return equals(description)[assertType](text, selected)
  }
  return stringIncludes(description)[assertType](text, selected)
}

/**
 * Mimic Array.forEach() API, but with an async callback function.
 * Execute each callback on each array item serially. Useful when using WebDriver API.
 *
 * Added due because of problem with chrome driver when too many requests
 * are made simultaneously. https://bugs.chromium.org/p/chromedriver/issues/detail?id=2152#c9
 * @private
 * @param {Array} array Input array items to iterate over.
 * @param {Function} callback - Async function to excute on each array item.
 * @param {object} [options] - Configurable options.
 * @param {boolean} [options.expandArrayResults=true] - Flag to flat one dimension array results.
 * @return {Promise<Array>} - Array of values.
 */
async function forEachAsync(array, callback, options = { expandArrayResults: true }) {
  const { expandArrayResults = true } = options
  const inputArray = Array.isArray(array) ? array : [array]
  const values = []
  for (let index = 0; index < inputArray.length; index++) {
    const res = await callback(inputArray[index], index, inputArray)

    if (Array.isArray(res) && expandArrayResults) {
      res.forEach(val => values.push(val))
    } else if (res) {
      values.push(res)
    }
  }
  return values
}

/**
 * Mimic Array.filter() API, but with an async callback function.
 * Execute each callback on each array item serially. Useful when using WebDriver API.
 *
 * Added due because of problem with chrome driver when too many requests
 * are made simultaneously. https://bugs.chromium.org/p/chromedriver/issues/detail?id=2152#c9
 * @private
 * @param {Array} array - Input array items to iterate over.
 * @param {Function} callback - Async functin to excute on each array item.
 * @return {Promise<Array>} - Array of values.
 */
async function filterAsync(array, callback) {
  const inputArray = Array.isArray(array) ? array : [array]
  const values = []
  for (let index = 0; index < inputArray.length; index++) {
    const res = await callback(inputArray[index], index, inputArray)
    const value = Array.isArray(res) ? res[0] : res

    if (value) {
      values.push(inputArray[index])
    }
  }
  return values
}

async function findClickable(locator, locateFn) {
  locator = new Locator(locator)

  if (this._isCustomLocator(locator)) {
    return locateFn(locator.value)
  }

  if (locator.isAccessibilityId() && !this.isWeb) return locateFn(locator, true)
  if (locator.isRole()) return locateFn(locator, true)
  if (!locator.isFuzzy()) return locateFn(locator, true)

  let els
  const literal = xpathLocator.literal(locator.value)

  els = await locateFn(Locator.clickable.narrow(literal))
  if (els.length) return els

  // Try ARIA selector for accessible name
  try {
    els = await locateFn(`aria/${locator.value}`)
    if (els.length) return els
  } catch (e) {
    // ARIA selector not supported or failed
  }

  els = await locateFn(Locator.clickable.wide(literal))
  if (els.length) return els

  els = await locateFn(Locator.clickable.self(literal))
  if (els.length) return els

  return await locateFn(locator.value) // by css or xpath
}

async function findFields(locator, context = null) {
  const locateFn = prepareLocateFn.call(this, context)
  locator = new Locator(locator)

  if (this._isCustomLocator(locator)) {
    return locateFn(locator)
  }

  if (locator.isAccessibilityId() && !this.isWeb) return locateFn(locator)
  if (locator.isRole()) return locateFn(locator)
  if (!locator.isFuzzy()) return locateFn(locator)

  const literal = xpathLocator.literal(locator.value)
  let els = await locateFn(Locator.field.labelEquals(literal))
  if (els.length) return els

  els = await locateFn(Locator.field.labelContains(literal))
  if (els.length) return els

  els = await locateFn(Locator.field.byName(literal))
  if (els.length) return els

  return await locateFn(locator.value) // by css or xpath
}

async function proceedSeeField(assertType, field, value, context) {
  const res = await findFields.call(this, field, context)
  assertElementExists(res, field, 'Field')
  const elem = usingFirstElement(res)
  const elemId = getElementId(elem)

  const proceedMultiple = async fields => {
    const fieldResults = toArray(
      await forEachAsync(fields, async el => {
        const elementId = getElementId(el)
        return this.browser.getElementAttribute(elementId, 'value')
      }),
    )

    if (typeof value === 'boolean') {
      equals(`no. of items matching > 0: ${field}`)[assertType](value, !!fieldResults.length)
    } else {
      // Assert that results were found so the forEach assert does not silently pass
      equals(`no. of items matching > 0:  ${field}`)[assertType](true, !!fieldResults.length)
      fieldResults.forEach(val => stringIncludes(`fields by ${field}`)[assertType](value, val))
    }
  }

  const proceedSingle = async el => {
    let res = await el.getValue()

    if (res === null) {
      res = await el.getText()
    }

    if (res === null || res === undefined) {
      throw new Error(`Element ${el.selector} has no value attribute`)
    }

    stringIncludes(`fields by ${field}`)[assertType](value, res)
  }

  const filterBySelected = async elements => filterAsync(elements, async el => this.browser.isElementSelected(getElementId(el)))

  const filterSelectedByValue = async (elements, value) => {
    return filterAsync(elements, async el => {
      const elementId = getElementId(el)
      const currentValue = await this.browser.getElementAttribute(elementId, 'value')
      const isSelected = await this.browser.isElementSelected(elementId)
      return currentValue === value && isSelected
    })
  }

  const tag = await elem.getTagName()
  if (tag === 'select') {
    let subOptions

    try {
      subOptions = await this.browser.findElementsFromElement(elemId, 'css', 'option')
    } catch (e) {
      subOptions = await this.browser.findElementsFromElement(elemId, 'xpath', 'option')
    }

    if (value === '') {
      // Don't filter by value
      const selectedOptions = await filterBySelected(subOptions)
      return proceedMultiple(selectedOptions)
    }

    const options = await filterSelectedByValue(subOptions, value)
    return proceedMultiple(options)
  }

  if (tag === 'input') {
    const fieldType = await elem.getAttribute('type')

    if (fieldType === 'checkbox' || fieldType === 'radio') {
      if (typeof value === 'boolean') {
        // Support boolean values
        const options = await filterBySelected(res)
        return proceedMultiple(options)
      }

      const options = await filterSelectedByValue(res, value)
      return proceedMultiple(options)
    }
    return proceedSingle(elem)
  }
  return proceedSingle(elem)
}

function toArray(item) {
  if (!Array.isArray(item)) {
    return [item]
  }
  return item
}

async function proceedSeeCheckbox(assertType, field) {
  const res = await findFields.call(this, field)
  assertElementExists(res, field, 'Field')

  const selected = await forEachAsync(res, async el => {
    const elementId = getElementId(el)
    return isElementChecked(this.browser, elementId)
  })

  return truth(`checkable field "${field}"`, 'to be checked')[assertType](selected)
}

async function getElementTextAttributes(element) {
  const elementId = getElementId(element)
  const ariaLabel = await this.browser.getElementAttribute(elementId, 'aria-label').catch(() => '')
  const placeholder = await this.browser.getElementAttribute(elementId, 'placeholder').catch(() => '')
  const innerText = await this.browser.getElementText(elementId).catch(() => '')

  // Handle aria-labelledby
  const labelledBy = await this.browser.getElementAttribute(elementId, 'aria-labelledby').catch(() => '')
  let labelText = ''
  if (labelledBy) {
    try {
      const labelId = labelledBy.split(' ')[0]
      const labelEls = await this.browser.$$(`#${labelId}`)
      if (labelEls?.length) {
        labelText = await this.browser.getElementText(getElementId(labelEls[0])).catch(() => '')
      }
    } catch (e) {
      // Ignore errors when resolving aria-labelledby
    }
  }

  return [ariaLabel, placeholder, innerText, labelText]
}

async function isElementChecked(browser, elementId) {
  let isChecked = await browser.isElementSelected(elementId)
  if (!isChecked) {
    const ariaChecked = await browser.getElementAttribute(elementId, 'aria-checked')
    isChecked = ariaChecked === 'true'
  }
  return isChecked
}

async function findCheckable(locator, locateFn) {
  let els
  locator = new Locator(locator)

  if (this._isCustomLocator(locator)) {
    return locateFn(locator.value)
  }

  if (locator.isAccessibilityId() && !this.isWeb) return locateFn(locator, true)
  if (locator.isRole()) return locateFn(locator, true)
  if (!locator.isFuzzy()) return locateFn(locator, true)

  const literal = xpathLocator.literal(locator.value)
  els = await locateFn(Locator.checkable.byText(literal))
  if (els.length) return els

  // Try ARIA selector for accessible name
  try {
    els = await locateFn(`aria/${locator.value}`)
    if (els.length) return els
  } catch (e) {
    // ARIA selector not supported or failed
  }

  els = await locateFn(Locator.checkable.byName(literal))
  if (els.length) return els

  return await locateFn(locator.value) // by css or xpath
}

function withStrictLocator(locator) {
  locator = new Locator(locator)
  return locator.simplify()
}

function isFrameLocator(locator) {
  locator = new Locator(locator)
  if (locator.isFrame()) return locator.value
  return false
}

function assertElementExists(res, locator, prefix, suffix) {
  if (!res || res.length === 0) {
    throw new ElementNotFound(locator, prefix, suffix)
  }
}

function usingFirstElement(els) {
  const rawIndex = store.currentStep?.opts?.elementIndex
  if (rawIndex != null && els.length > 1) {
    let elementIndex = rawIndex
    if (elementIndex === 'first') elementIndex = 1
    if (elementIndex === 'last') elementIndex = -1
    if (Number.isInteger(elementIndex) && elementIndex !== 0) {
      const idx = elementIndex > 0 ? elementIndex - 1 : els.length + elementIndex
      if (idx >= 0 && idx < els.length) {
        debug(`[Elements] Using element #${rawIndex} out of ${els.length}`)
        return els[idx]
      }
    }
  }
  if (els.length > 1) debug(`[Elements] Using first element out of ${els.length}`)
  return els[0]
}

function assertOnlyOneElement(elements, locator, helper) {
  if (elements.length > 1) {
    const webElements = Array.from(elements).map(el => new WebElement(el, helper))
    throw new MultipleElementsFound(locator, webElements)
  }
}

function getElementId(el) {
  // W3C WebDriver web element identifier
  // https://w3c.github.io/webdriver/#dfn-web-element-identifier
  if (el['element-6066-11e4-a52e-4f735466cecf']) {
    return el['element-6066-11e4-a52e-4f735466cecf']
  }
  // (deprecated) JsonWireProtocol identifier
  // https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#webelement-json-object
  if (el.ELEMENT) {
    return el.ELEMENT
  }

  return null
}

// List of known key values to unicode code points
// https://www.w3.org/TR/webdriver/#keyboard-actions
const keyUnicodeMap = {
  Unidentified: '\uE000',
  Cancel: '\uE001',
  Clear: '\uE005',
  Help: '\uE002',
  Pause: '\uE00B',
  Backspace: '\uE003',
  Return: '\uE006',
  Enter: '\uE007',
  Escape: '\uE00C',
  Alt: '\uE00A',
  AltLeft: '\uE00A',
  AltRight: '\uE052',
  Control: '\uE009',
  ControlLeft: '\uE009',
  ControlRight: '\uE051',
  Meta: '\uE03D',
  MetaLeft: '\uE03D',
  MetaRight: '\uE053',
  Shift: '\uE008',
  ShiftLeft: '\uE008',
  ShiftRight: '\uE050',
  Space: '\uE00D',
  ' ': '\uE00D',
  Tab: '\uE004',
  Insert: '\uE016',
  Delete: '\uE017',
  End: '\uE010',
  Home: '\uE011',
  PageUp: '\uE00E',
  PageDown: '\uE00F',
  ArrowDown: '\uE015',
  ArrowLeft: '\uE012',
  ArrowRight: '\uE014',
  ArrowUp: '\uE013',
  F1: '\uE031',
  F2: '\uE032',
  F3: '\uE033',
  F4: '\uE034',
  F5: '\uE035',
  F6: '\uE036',
  F7: '\uE037',
  F8: '\uE038',
  F9: '\uE039',
  F10: '\uE03A',
  F11: '\uE03B',
  F12: '\uE03C',
  Numpad0: '\uE01A',
  Numpad1: '\uE01B',
  Numpad2: '\uE01C',
  Numpad3: '\uE01D',
  Numpad4: '\uE01E',
  Numpad5: '\uE01F',
  Numpad6: '\uE020',
  Numpad7: '\uE021',
  Numpad8: '\uE022',
  Numpad9: '\uE023',
  NumpadMultiply: '\uE024',
  NumpadAdd: '\uE025',
  NumpadSubtract: '\uE027',
  NumpadDecimal: '\uE028',
  NumpadDivide: '\uE029',
  NumpadEnter: '\uE007',
  NumpadInsert: '\uE05C', // 'Numpad0' alternate (when NumLock off)
  NumpadDelete: '\uE05D', // 'NumpadDecimal' alternate (when NumLock off)
  NumpadEnd: '\uE056', // 'Numpad1' alternate (when NumLock off)
  NumpadHome: '\uE057', // 'Numpad7' alternate (when NumLock off)
  NumpadPageDown: '\uE055', // 'Numpad3' alternate (when NumLock off)
  NumpadPageUp: '\uE054', // 'Numpad9' alternate (when NumLock off)
  NumpadArrowDown: '\uE05B', // 'Numpad2' alternate (when NumLock off)
  NumpadArrowLeft: '\uE058', // 'Numpad4' alternate (when NumLock off)
  NumpadArrowRight: '\uE05A', // 'Numpad6' alternate (when NumLock off)
  NumpadArrowUp: '\uE059', // 'Numpad8' alternate (when NumLock off)
  Comma: '\uE026', // ',' alias
  Digit0: '0', // '0' alias
  Digit1: '1', // '1' alias
  Digit2: '2', // '2' alias
  Digit3: '3', // '3' alias
  Digit4: '4', // '4' alias
  Digit5: '5', // '5' alias
  Digit6: '6', // '6' alias
  Digit7: '7', // '7' alias
  Digit8: '8', // '8' alias
  Digit9: '9', // '9' alias
  Equal: '\uE019', // '=' alias
  KeyA: 'a', // 'a' alias
  KeyB: 'b', // 'b' alias
  KeyC: 'c', // 'c' alias
  KeyD: 'd', // 'd' alias
  KeyE: 'e', // 'e' alias
  KeyF: 'f', // 'f' alias
  KeyG: 'g', // 'g' alias
  KeyH: 'h', // 'h' alias
  KeyI: 'i', // 'i' alias
  KeyJ: 'j', // 'j' alias
  KeyK: 'k', // 'k' alias
  KeyL: 'l', // 'l' alias
  KeyM: 'm', // 'm' alias
  KeyN: 'n', // 'n' alias
  KeyO: 'o', // 'o' alias
  KeyP: 'p', // 'p' alias
  KeyQ: 'q', // 'q' alias
  KeyR: 'r', // 'r' alias
  KeyS: 's', // 's' alias
  KeyT: 't', // 't' alias
  KeyU: 'u', // 'u' alias
  KeyV: 'v', // 'v' alias
  KeyW: 'w', // 'w' alias
  KeyX: 'x', // 'x' alias
  KeyY: 'y', // 'y' alias
  KeyZ: 'z', // 'z' alias
  Period: '.', // '.' alias
  Semicolon: '\uE018', // ';' alias
  Slash: '/', // '/' alias
  ZenkakuHankaku: '\uE040',
}

function convertKeyToRawKey(key) {
  if (Object.prototype.hasOwnProperty.call(keyUnicodeMap, key)) {
    return keyUnicodeMap[key]
  }
  // Key is raw key when no representative unicode code point for value
  return key
}

function getNormalizedKey(key) {
  let normalizedKey = getNormalizedKeyAttributeValue(key)
  // Always use "left" modifier keys for non-W3C sessions,
  // as JsonWireProtocol does not support "right" modifier keys
  if (!this.browser.isW3C) {
    normalizedKey = normalizedKey.replace(/^(Alt|Control|Meta|Shift)Right$/, '$1')
  }
  if (key !== normalizedKey) {
    this.debugSection('Input', `Mapping key '${key}' to '${normalizedKey}'`)
  }
  return convertKeyToRawKey(normalizedKey)
}

const unicodeModifierKeys = modifierKeys.map(k => convertKeyToRawKey(k))
function isModifierKey(key) {
  return unicodeModifierKeys.includes(key)
}

function highlightActiveElement(element) {
  if (this.options.highlightElement && store.debugMode) {
    highlightElement(element, this.browser)
  }
}

function prepareLocateFn(context) {
  if (!context) return this._locate.bind(this)
  return l => {
    l = new Locator(l, 'css')
    return this._locate(context, true).then(async res => {
      assertElementExists(res, context, 'Context element')
      return res[0].$$(l.simplify())
    })
  }
}

function logEvents(event) {
  browserLogs.push(event.text) // add log message to the array
}

async function proceedSelectOption(elem, option) {
  const elementId = getElementId(elem)
  const role = await this.browser.getElementAttribute(elementId, 'role').catch(() => null)
  const options = Array.isArray(option) ? option : [option]

  if (role === 'combobox') {
    this.debugSection('SelectOption', 'Expanding combobox')
    highlightActiveElement.call(this, elem)
    const ariaOwns = await this.browser.getElementAttribute(elementId, 'aria-owns').catch(() => null)
    const ariaControls = await this.browser.getElementAttribute(elementId, 'aria-controls').catch(() => null)
    const ariaLabelledBy = await this.browser.getElementAttribute(elementId, 'aria-labelledby').catch(() => null)
    await this.browser.elementClick(elementId)

    const listboxId = ariaOwns || ariaControls
    let listbox = null
    if (listboxId) {
      const listboxEls = await this.browser.$$(`#${listboxId}`)
      if (listboxEls?.length) listbox = listboxEls[0]
    }
    if (!listbox && ariaLabelledBy) {
      // Find listbox with the same aria-labelledby
      const listboxEls = await this.browser.$$(`[role="listbox"][aria-labelledby="${ariaLabelledBy}"]`)
      if (listboxEls?.length) listbox = listboxEls[0]
    }
    if (!listbox) {
      // Fallback: find any listbox with the same label
      const allListboxes = await this.browser.$$(`[role="listbox"]`)
      for (const lb of allListboxes) {
        const lbLabelledBy = await this.browser.getElementAttribute(getElementId(lb), 'aria-labelledby').catch(() => '')
        if (lbLabelledBy === ariaLabelledBy) {
          listbox = lb
          break
        }
      }
    }

    if (listbox) {
      const listboxElementId = getElementId(listbox)
      for (const opt of options) {
        const optEls = await this.browser.findElementsFromElement(listboxElementId, 'xpath', `.//*[@role="option"]`)
        if (optEls?.length) {
          for (const optEl of optEls) {
            const optElId = getElementId(optEl)
            const text = await this.browser.getElementText(optElId).catch(() => '')
            if (text && text.includes(opt)) {
              this.debugSection('SelectOption', `Clicking: "${opt}"`)
              highlightActiveElement.call(this, optEl)
              await this.browser.elementClick(optElId)
              break
            }
          }
        }
      }
    }
    return
  }

  if (role === 'listbox') {
    for (const opt of options) {
      const optEls = await this.browser.findElementsFromElement(elementId, 'xpath', `.//*[@role="option"]`)
      if (optEls?.length) {
        for (const optEl of optEls) {
          const optElId = getElementId(optEl)
          const text = await this.browser.getElementText(optElId).catch(() => '')
          if (text && text.includes(opt)) {
            this.debugSection('SelectOption', `Clicking: "${opt}"`)
            highlightActiveElement.call(this, optEl)
            await this.browser.elementClick(optElId)
            break
          }
        }
      }
    }
    return
  }

  // Native <select> element
  highlightActiveElement.call(this, elem)

  if (!Array.isArray(option)) {
    option = [option]
  }

  const clickOptionFn = async el => {
    if (el[0]) el = el[0]
    const elId = getElementId(el)
    if (elId) return this.browser.elementClick(elId)
  }

  // select options by visible text
  let els = await forEachAsync(option, async opt => this.browser.findElementsFromElement(elementId, 'xpath', Locator.select.byVisibleText(xpathLocator.literal(opt))))

  if (Array.isArray(els) && els.length) {
    return forEachAsync(els, clickOptionFn)
  }
  // select options by value
  els = await forEachAsync(option, async opt => this.browser.findElementsFromElement(elementId, 'xpath', Locator.select.byValue(xpathLocator.literal(opt))))
  if (els.length === 0) {
    throw new ElementNotFound(elem, `Option "${option}" in`, 'was not found neither by a visible text nor by a value')
  }
  return forEachAsync(els, clickOptionFn)
}

export { WebDriver as default }
