import axios from 'axios'
import Helper from '@codeceptjs/helper'
import CDPConnection from './extras/CDPConnection.js'
import installCodeceptClient from './clientscripts/cdpBrowserClient.js'
import xpathPolyfillSource from './clientscripts/xpathPolyfill.js'
import Locator from '../locator.js'
import { xpathLocator } from '../utils.js'
import ElementNotFound from './errors/ElementNotFound.js'
import { includes as stringIncludes } from '../assert/include.js'
import { empty } from '../assert/empty.js'
import { truth } from '../assert/truth.js'

/**
 * ## Configuration
 *
 * This helper should be configured in codecept.conf.js
 *
 * @typedef CDPBrowserConfig
 * @type {object}
 * @prop {string} [url=http://localhost] - base url of website to be tested.
 * @prop {string} [endpoint=http://127.0.0.1:9222] - Chrome DevTools Protocol endpoint. Either an `http(s)://` address exposing `/json/version` (from which the `webSocketDebuggerUrl` is resolved) or a raw `ws(s)://` debugger URL.
 * @prop {object} [headers={}] - headers sent with the endpoint resolution request and the WebSocket handshake. Useful for authenticated remote browser providers.
 * @prop {string} [input=auto] - how synthetic user actions (click, fill, etc.) are dispatched by helpers built on top of this class. `auto` picks `cdp` when a real layout engine is detected and `synthetic` otherwise; can be pinned to `cdp` or `synthetic`.
 * @prop {string|boolean} [xpathPolyfill=auto] - whether to inject the bundled XPath polyfill before installing the in-page client. `auto` probes the page and only injects when `document.evaluate` is unavailable or broken; `true`/`false` force the behavior.
 * @prop {object} [capabilities={}] - pre-seed detected browser capabilities (`layout`, `xpath`, `screenshot`) to skip runtime probing. Values set here are never overwritten by `_probeCapabilities`/`_ensureClient`.
 * @prop {number} [waitForTimeout=5] - default wait* timeout in seconds, used by helpers built on top of this class.
 * @prop {number} [waitForAction=100] - poll interval in milliseconds used while waiting for a condition (e.g. page ready state).
 * @prop {number} [getPageTimeout=30] - maximum time in seconds to wait for a page to reach `readyState === 'complete'` after navigation or reload; also used as the CDP command timeout (in ms, x1000).
 */

/**
 * CDPBrowser drives a browser directly over the raw Chrome DevTools Protocol, without depending
 * on Puppeteer, Playwright, or WebDriver. It opens its own WebSocket connection (via `CDPConnection`),
 * creates and attaches to a fresh target per test, and evaluates expressions through `Runtime.evaluate`.
 *
 * It is intended as the minimal, dependency-light base class for helpers that only need navigation,
 * script evaluation, and simple in-page element interaction (installed lazily through the
 * `window.__codecept` client script). It does not launch a browser itself — point `endpoint` at an
 * already-running Chrome (or any CDP-compatible browser) started with `--remote-debugging-port`.
 *
 * ## Example
 *
 * ```js
 * // inside codecept.conf.js
 * {
 *   helpers: {
 *     CDPBrowser: {
 *       url: 'http://localhost',
 *       endpoint: 'http://127.0.0.1:9222',
 *     }
 *   }
 * }
 * ```
 *
 * <!-- configuration -->
 *
 * ## Methods
 */
class CDPBrowser extends Helper {
  /**
   * @param {CDPBrowserConfig} config
   */
  constructor(config) {
    super(config)
    this.options = {
      url: 'http://localhost',
      endpoint: 'http://127.0.0.1:9222',
      headers: {},
      input: 'auto',
      xpathPolyfill: 'auto',
      capabilities: {},
      waitForTimeout: 5,
      waitForAction: 100,
      getPageTimeout: 30,
      ...config,
    }
    this.cdp = null
    this.sessionId = null
    this.targetId = null
    this.capabilities = { layout: null, xpath: null, screenshot: null, ...this.options.capabilities }
  }

  /**
   * No-op hook kept for interface parity with other browser helpers. Connecting to the CDP
   * endpoint is deferred to `_before`, since a fresh target/session is opened per test.
   */
  _init() {}

  /**
   * Resolves `options.endpoint` to a raw WebSocket debugger URL. If the configured endpoint is
   * an `http(s)://` address, this fetches `/json/version` from it and reads `webSocketDebuggerUrl`
   * from the response, matching the discovery flow exposed by Chrome's `--remote-debugging-port`.
   * A `ws(s)://` endpoint is returned unchanged.
   *
   * This is the subclass override point for helpers that connect through a different discovery
   * mechanism (e.g. a cloud browser provider with its own session-creation API).
   *
   * @returns {Promise<string>} a `ws(s)://` debugger URL ready to be passed to `CDPConnection`.
   * @protected
   */
  async _resolveEndpoint() {
    let endpoint = this.options.endpoint
    if (endpoint.startsWith('http')) {
      const res = await axios.get(`${endpoint.replace(/\/$/, '')}/json/version`, { headers: this.options.headers })
      endpoint = res.data.webSocketDebuggerUrl
    }
    return endpoint
  }

  /**
   * Resolves the CDP endpoint and opens the underlying `CDPConnection`, storing it on `this.cdp`.
   *
   * @protected
   */
  async _connect() {
    const endpoint = await this._resolveEndpoint()
    this.cdp = new CDPConnection(endpoint, { headers: this.options.headers, timeout: this.options.getPageTimeout * 1000 })
    await this.cdp.connect()
  }

  /**
   * Hook executed before each test. Ensures a live `CDPConnection` exists (connecting lazily on
   * first use, and reconnecting if a previous connection was closed), then creates a fresh
   * `about:blank` target and attaches to it with `Target.attachToTarget`, storing `this.targetId`
   * and `this.sessionId`. `Page` and `Runtime` domains are enabled on the new session.
   *
   * @protected
   */
  async _before() {
    if (!this.cdp || !this.cdp.isConnected) await this._connect()
    const { targetId } = await this.cdp.send('Target.createTarget', { url: 'about:blank' })
    this.targetId = targetId
    const { sessionId } = await this.cdp.send('Target.attachToTarget', { targetId, flatten: true })
    this.sessionId = sessionId
    await this.cdp.send('Page.enable', {}, this.sessionId).catch(() => null)
    await this.cdp.send('Runtime.enable', {}, this.sessionId).catch(() => null)
  }

  /**
   * Hook executed after each test. Closes the target opened in `_before` via `Target.closeTarget`
   * and clears `this.targetId`/`this.sessionId`. The underlying `CDPConnection` is left open so it
   * can be reused by the next test.
   *
   * @protected
   */
  async _after() {
    if (!this.targetId) return
    await this.cdp.send('Target.closeTarget', { targetId: this.targetId }).catch(() => null)
    this.targetId = null
    this.sessionId = null
  }

  /**
   * Hook executed after all tests are run. Closes the underlying `CDPConnection` (and its
   * WebSocket) and clears `this.cdp`. Must leave no open sockets or pending timers behind, so the
   * process can exit on its own.
   *
   * @protected
   */
  async _finishTest() {
    if (this.cdp) await this.cdp.close()
    this.cdp = null
  }

  /**
   * Evaluates a JavaScript expression in the page attached to the current session via
   * `Runtime.evaluate`, awaiting any returned promise and returning the value by reference
   * (`returnByValue: true`). If the expression throws, the browser-side exception description
   * (or fallback text) is re-thrown as a JS `Error`.
   *
   * @param {string} expression - a JavaScript expression (or IIFE) to run in the page context.
   * @returns {Promise<any>} the evaluated value, or `undefined` if the expression has no result.
   * @protected
   */
  async _evaluate(expression) {
    const res = await this.cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, this.sessionId)
    if (res.exceptionDetails) {
      const detail = res.exceptionDetails.exception ? res.exceptionDetails.exception.description : res.exceptionDetails.text
      throw new Error(`Error in browser script: ${detail}`)
    }
    return res.result ? res.result.value : undefined
  }

  /**
   * Ensures the in-page client (`window.__codecept`, installed from `cdpBrowserClient.js`) is
   * present on the current page, installing it (and the XPath polyfill, if needed) exactly once.
   * Safe to call repeatedly; it is a no-op once the client is detected.
   *
   * @protected
   */
  async _ensureClient() {
    const installed = await this._evaluate(`typeof window.__codecept !== 'undefined'`)
    if (installed) return
    if (await this._needsXPathPolyfill()) {
      await this._evaluate(xpathPolyfillSource())
    }
    await this._evaluate(`(${installCodeceptClient.toString()})()`)
  }

  /**
   * Determines whether the bundled XPath polyfill must be injected before the in-page client is
   * installed. Honors an explicit `options.xpathPolyfill` boolean; otherwise reuses a previously
   * probed `capabilities.xpath`, or probes the page's native `document.evaluate` by resolving a
   * throwaway XPath expression and caches the result on `capabilities.xpath` (`'native'` or
   * `'polyfill'`).
   *
   * @returns {Promise<boolean>} `true` if the polyfill should be injected.
   * @protected
   */
  async _needsXPathPolyfill() {
    if (this.options.xpathPolyfill === true) return true
    if (this.options.xpathPolyfill === false) return false
    if (this.capabilities.xpath) return this.capabilities.xpath === 'polyfill'
    const ok = await this._evaluate(`(function(){
      try {
        var r = document.evaluate('//*[normalize-space(string(.)) != "\\u0000"]', document.body || document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
        return r.snapshotLength > 0
      } catch (e) { return false }
    })()`)
    this.capabilities.xpath = ok ? 'native' : 'polyfill'
    return !ok
  }

  /**
   * Probes and caches capabilities that depend on the actual browser environment (currently
   * `capabilities.layout`, detected via `getComputedStyle(document.documentElement).display`).
   * Already-known capabilities (pre-seeded through `options.capabilities`, or probed on a prior
   * page) are never re-probed. When `options.input` is `'auto'`, resolves it to `'cdp'` for a real
   * layout engine or `'synthetic'` otherwise.
   *
   * @protected
   */
  async _probeCapabilities() {
    if (this.capabilities.layout === null) {
      const display = await this._evaluate(`getComputedStyle(document.documentElement).display`)
      this.capabilities.layout = display === '' ? 'none' : 'real'
    }
    if (this.options.input === 'auto') {
      this.options.input = this.capabilities.layout === 'real' ? 'cdp' : 'synthetic'
    }
  }

  /**
   * Ensures the in-page client is installed, then delegates a find-and-act call to
   * `window.__codecept.run(candidates, action, payload)`. This is the primary extension point
   * used by helpers built on top of this class for element queries and interactions.
   *
   * @param {Array<{type: 'css'|'xpath', value: string}>} candidates - locator strategies to try, in order, until one matches at least one element.
   * @param {string} action - name of the action to run against the matched elements (e.g. `count`, `click`, `fill`).
   * @param {object} [payload] - extra data the action needs (e.g. `{ value }` for `fill`).
   * @returns {Promise<{found: number, result: any}>} number of matched elements and the action's result.
   * @protected
   */
  async _run(candidates, action, payload) {
    await this._ensureClient()
    return this._evaluate(`window.__codecept.run(${JSON.stringify(candidates)}, ${JSON.stringify(action)}, ${JSON.stringify(payload || null)})`)
  }

  /**
   * Repeatedly calls `fn` until it returns a truthy value or `timeoutSec` elapses, waiting
   * `options.waitForAction` milliseconds between attempts.
   *
   * @param {() => Promise<any>} fn - the condition to poll; should resolve to a truthy value once satisfied.
   * @param {number} timeoutSec - maximum time to poll, in seconds.
   * @param {string} message - error message used when the timeout is reached.
   * @returns {Promise<any>} the truthy value returned by `fn`.
   * @throws {Error} with `message` if `timeoutSec` elapses without `fn` returning a truthy value.
   * @protected
   */
  async _poll(fn, timeoutSec, message) {
    const deadline = Date.now() + timeoutSec * 1000
    while (Date.now() < deadline) {
      const result = await fn()
      if (result) return result
      await new Promise(r => setTimeout(r, this.options.waitForAction))
    }
    throw new Error(message)
  }

  /**
   * Resolves a path against `options.url`. Absolute URLs (matching `scheme://`) are returned
   * unchanged; anything else is appended to `options.url` with its trailing slash stripped.
   *
   * @param {string} path - an absolute URL or a path relative to `options.url`.
   * @returns {string} the resolved, absolute URL.
   * @protected
   */
  _url(path) {
    if (/^\w+:\/\//.test(path)) return path
    return this.options.url.replace(/\/$/, '') + path
  }

  /**
   * Opens a web page in the current session.
   *
   * ```js
   * I.amOnPage('/'); // opens main page of website
   * I.amOnPage('https://github.com'); // opens github
   * I.amOnPage('/login'); // opens a login page
   * ```
   *
   * Navigates via `Page.navigate`, then waits (up to `options.getPageTimeout` seconds) for
   * `document.readyState` to reach `'complete'`. Once loaded, capabilities are (re-)probed and
   * the in-page client is (re-)installed, since navigation discards any previously injected script.
   *
   * @param {string} url - url path or global url.
   * @returns {Promise<void>}
   */
  async amOnPage(url) {
    await this.cdp.send('Page.navigate', { url: this._url(url) }, this.sessionId)
    await this._poll(
      () => this._evaluate(`document.readyState === 'complete'`).catch(() => false),
      this.options.getPageTimeout,
      `Page did not reach readyState complete in ${this.options.getPageTimeout}s`,
    )
    await this._probeCapabilities()
    await this._ensureClient()
  }

  /**
   * Reloads the current page.
   *
   * ```js
   * I.refreshPage();
   * ```
   *
   * Triggers `Page.reload` and waits (up to `options.getPageTimeout` seconds) for
   * `document.readyState` to reach `'complete'`.
   *
   * @returns {Promise<void>}
   */
  async refreshPage() {
    await this.cdp.send('Page.reload', {}, this.sessionId)
    await this._poll(
      () => this._evaluate(`document.readyState === 'complete'`).catch(() => false),
      this.options.getPageTimeout,
      `Page did not reload in ${this.options.getPageTimeout}s`,
    )
  }

  /**
   * Executes a JavaScript function in the browser context and returns its result.
   *
   * If a function is passed, it is serialized with `Function.prototype.toString()`, so it must
   * not reference variables from the outer (Node.js) scope — pass any needed data as arguments
   * instead. A string is evaluated as-is.
   *
   * ```js
   * let title = await I.executeScript(() => document.title);
   * let sum = await I.executeScript((a, b) => a + b, 2, 3);
   * ```
   *
   * If the function returns a promise, `executeScript` waits for it to resolve.
   *
   * @param {(string|function)} fn - a JavaScript function to be executed in the browser context, or a string expression.
   * @param {...any} args - arguments to pass into the function.
   * @returns {Promise<any>} the value returned (or resolved) by the function.
   */
  async executeScript(fn, ...args) {
    const body = typeof fn === 'function' ? `(${fn.toString()})(...${JSON.stringify(args)})` : fn
    return this._evaluate(body)
  }

  /**
   * Retrieves the page URL of the current page.
   *
   * ```js
   * let url = await I.grabCurrentUrl();
   * console.log(`Current URL is [${url}]`);
   * ```
   *
   * @returns {Promise<string>} current URL.
   */
  async grabCurrentUrl() {
    return this._evaluate('window.location.href')
  }

  /**
   * Retrieves a page title.
   *
   * ```js
   * let title = await I.grabTitle();
   * ```
   *
   * @returns {Promise<string>} title of the page.
   */
  async grabTitle() {
    return this._evaluate('document.title')
  }

  /**
   * Retrieves the source code of the current page.
   *
   * ```js
   * let pageSource = await I.grabSource();
   * ```
   *
   * @returns {Promise<string>} source code of the current page (the outer HTML of `<html>`).
   */
  async grabSource() {
    return this._evaluate('document.documentElement.outerHTML')
  }

  /**
   * Builds the list of `{type, value}` candidates `_run` should try, in order, for a given
   * locator and `kind`. A strict locator (CSS/XPath/object form) resolves to a single candidate.
   * A fuzzy (plain-text) locator is expanded into a strategy-specific list of XPath expressions
   * mirroring the click/field/checkbox matching used by other browser helpers (matching by
   * visible text, label, name, placeholder, ARIA attributes, etc.), falling back to treating the
   * raw text as a CSS selector.
   *
   * @param {CodeceptJS.LocatorOrString} locator - element located by CSS|XPath|strict locator, or plain fuzzy text.
   * @param {'element'|'clickable'|'field'|'checkable'} [kind='element'] - matching strategy to use when `locator` is fuzzy.
   * @returns {Array<{type: 'css'|'xpath', value: string}>} candidates to pass to `_run`.
   * @protected
   */
  _candidates(locator, kind = 'element') {
    locator = new Locator(locator)
    if (!locator.isFuzzy()) {
      return [{ type: locator.isXPath() ? 'xpath' : 'css', value: locator.simplify() || locator.value }]
    }
    const literal = xpathLocator.literal(locator.value)
    if (kind === 'clickable') {
      return [
        { type: 'xpath', value: Locator.clickable.narrow(literal) },
        { type: 'xpath', value: Locator.clickable.wide(literal) },
        { type: 'xpath', value: Locator.clickable.self(literal) },
        { type: 'css', value: locator.value },
      ]
    }
    if (kind === 'field') {
      return [
        { type: 'xpath', value: Locator.field.labelEquals(literal) },
        { type: 'xpath', value: Locator.field.labelContains(literal) },
        { type: 'xpath', value: Locator.field.byName(literal) },
        { type: 'css', value: locator.value },
      ]
    }
    if (kind === 'checkable') {
      return [
        { type: 'xpath', value: Locator.checkable.byText(literal) },
        { type: 'xpath', value: Locator.checkable.byName(literal) },
        { type: 'css', value: locator.value },
      ]
    }
    return [{ type: 'css', value: locator.value }]
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
   *
   * @param {string} text expected on page.
   * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
   * @returns {Promise<void>}
   */
  async see(text, context = null) {
    const source = context
      ? (await this._run(this._candidates(context), 'texts')).result?.join(' | ') || ''
      : await this._evaluate('document.body ? document.body.innerText : ""')
    return stringIncludes(context ? `element ${new Locator(context).toString()}` : 'web page').assert(text, source)
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
   * @param {?CodeceptJS.LocatorOrString} [context=null] (optional) element located by CSS|XPath|strict locator in which to perform search.
   * @returns {Promise<void>}
   */
  async dontSee(text, context = null) {
    const source = context
      ? (await this._run(this._candidates(context), 'texts')).result?.join(' | ') || ''
      : await this._evaluate('document.body ? document.body.innerText : ""')
    return stringIncludes(context ? `element ${new Locator(context).toString()}` : 'web page').negate(text, source)
  }

  /**
   * Checks that the current page contains the given string in its raw source code.
   *
   * ```js
   * I.seeInSource('<h1>Green eggs &amp; ham</h1>');
   * ```
   *
   * @param {string} text value to check.
   * @returns {Promise<void>}
   */
  async seeInSource(text) {
    return stringIncludes('HTML source of a page').assert(text, await this.grabSource())
  }

  /**
   * Checks that current url contains a provided fragment.
   *
   * ```js
   * I.seeInCurrentUrl('/register'); // we are on registration page
   * ```
   *
   * @param {string} url a fragment to check
   * @returns {Promise<void>}
   */
  async seeInCurrentUrl(url) {
    return stringIncludes('url').assert(url, await this.grabCurrentUrl())
  }

  /**
   * Checks that current url does not contain a provided fragment.
   *
   * @param {string} url value to check.
   * @returns {Promise<void>}
   */
  async dontSeeInCurrentUrl(url) {
    return stringIncludes('url').negate(url, await this.grabCurrentUrl())
  }

  /**
   * Checks that title contains text.
   *
   * ```js
   * I.seeInTitle('Home Page');
   * ```
   *
   * @param {string} text text value to check.
   * @returns {Promise<void>}
   */
  async seeInTitle(text) {
    return stringIncludes('web page title').assert(text, await this.grabTitle())
  }

  /**
   * Checks that a given Element is present in the DOM.
   * Element is located by CSS or XPath.
   *
   * ```js
   * I.seeElementInDOM('#modal');
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   * @returns {Promise<void>}
   */
  async seeElementInDOM(locator) {
    const { found } = await this._run(this._candidates(locator), 'count')
    return empty(`elements of ${new Locator(locator).toString()}`).negate(found === 0 ? null : found)
  }

  /**
   * Opposite to `seeElementInDOM`. Checks that element is not on page.
   *
   * ```js
   * I.dontSeeElementInDOM('.nav'); // checks that element is not on page visible or not
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
   * @returns {Promise<void>}
   */
  async dontSeeElementInDOM(locator) {
    const { found } = await this._run(this._candidates(locator), 'count')
    return empty(`elements of ${new Locator(locator).toString()}`).assert(found === 0 ? null : found)
  }

  /**
   * Throws if the current page has no real layout engine (`capabilities.layout === 'none'`),
   * used to guard visibility-dependent assertions that cannot be evaluated without one.
   *
   * @param {string} action - name of the calling assertion, used in the error message.
   * @throws {Error} if the page has no layout engine.
   * @protected
   */
  _assertLayoutSupported(action) {
    if (this.capabilities.layout === 'none') {
      throw new Error(`${action} requires a layout engine which this browser does not provide. Use ${action}InDOM instead.`)
    }
  }

  /**
   * Checks that a given Element is visible.
   * Element is located by CSS or XPath.
   *
   * ```js
   * I.seeElement('#modal');
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
   * @returns {Promise<void>}
   */
  async seeElement(locator) {
    this._assertLayoutSupported('seeElement')
    const visible = await this._run(this._candidates(locator), 'visibleCount')
    return empty(`visible elements of ${new Locator(locator).toString()}`).negate(visible.result === 0 ? null : visible.result)
  }

  /**
   * Opposite to `seeElement`. Checks that element is not visible.
   *
   * ```js
   * I.dontSeeElement('.modal'); // modal is not shown
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
   * @returns {Promise<void>}
   */
  async dontSeeElement(locator) {
    this._assertLayoutSupported('dontSeeElement')
    const visible = await this._run(this._candidates(locator), 'visibleCount')
    return empty(`visible elements of ${new Locator(locator).toString()}`).assert(visible.result === 0 || visible.result === undefined ? null : visible.result)
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
   * @param {CodeceptJS.LocatorOrString} locator located by label|name|CSS|XPath|strict locator.
   * @returns {Promise<void>}
   */
  async seeCheckboxIsChecked(locator) {
    const res = await this._run(this._candidates(locator, 'checkable'), 'checked')
    if (!res.found) throw new ElementNotFound(locator, 'Checkbox')
    return truth(`checkbox ${new Locator(locator).toString()}`, 'to be checked').assert(res.result)
  }

  /**
   * Verifies that the specified checkbox is not checked.
   *
   * ```js
   * I.dontSeeCheckboxIsChecked('#agree'); // located by ID
   * I.dontSeeCheckboxIsChecked('I agree to terms'); // located by label
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator located by label|name|CSS|XPath|strict locator.
   * @returns {Promise<void>}
   */
  async dontSeeCheckboxIsChecked(locator) {
    const res = await this._run(this._candidates(locator, 'checkable'), 'checked')
    if (!res.found) throw new ElementNotFound(locator, 'Checkbox')
    return truth(`checkbox ${new Locator(locator).toString()}`, 'to be checked').negate(res.result)
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
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   * @returns {Promise<string>} text value
   */
  async grabTextFrom(locator) {
    const res = await this._run(this._candidates(locator), 'texts')
    if (!res.found) throw new ElementNotFound(locator)
    return res.result[0]
  }

  /**
   * Retrieves all texts from elements located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside async with `await`** operator.
   *
   * ```js
   * let pins = await I.grabTextFromAll('#pin li');
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   * @returns {Promise<string[]>} array of text values
   */
  async grabTextFromAll(locator) {
    const res = await this._run(this._candidates(locator), 'texts')
    return res.found ? res.result : []
  }

  /**
   * Retrieves a value from a form element located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside async function with `await`** operator.
   * If more than one element is found - value of first element is returned.
   *
   * ```js
   * let email = await I.grabValueFrom('input[name=email]');
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator field located by label|name|CSS|XPath|strict locator.
   * @returns {Promise<string>} attribute value
   */
  async grabValueFrom(locator) {
    const res = await this._run(this._candidates(locator, 'field'), 'values')
    if (!res.found) throw new ElementNotFound(locator, 'Field')
    return res.result[0]
  }

  /**
   * Retrieves an array of values from fields located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside async function with `await`** operator.
   *
   * ```js
   * let inputs = await I.grabValueFromAll('//form/input');
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator field located by label|name|CSS|XPath|strict locator.
   * @returns {Promise<string[]>} array of attribute values
   */
  async grabValueFromAll(locator) {
    const res = await this._run(this._candidates(locator, 'field'), 'values')
    return res.found ? res.result : []
  }

  /**
   * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside async with `await`** operator.
   * If more than one element is found - attribute of first element is returned.
   *
   * ```js
   * let hint = await I.grabAttributeFrom('#tooltip', 'title');
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   * @param {string} attr attribute name.
   * @returns {Promise<string>} attribute value
   */
  async grabAttributeFrom(locator, attr) {
    const res = await this._run(this._candidates(locator), 'attrs', { name: attr })
    if (!res.found) throw new ElementNotFound(locator)
    return res.result[0]
  }

  /**
   * Retrieves an array of attributes from elements located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside async with `await`** operator.
   *
   * ```js
   * let hints = await I.grabAttributeFromAll('.tooltip', 'title');
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   * @param {string} attr attribute name.
   * @returns {Promise<string[]>} array of attribute values
   */
  async grabAttributeFromAll(locator, attr) {
    const res = await this._run(this._candidates(locator), 'attrs', { name: attr })
    return res.found ? res.result : []
  }

  /**
   * Grab number of elements by locator.
   * Resumes test execution, so **should be used inside async function with `await`** operator.
   *
   * ```js
   * let numOfElements = await I.grabNumberOfElements('p');
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
   * @returns {Promise<number>} number of matched elements.
   */
  async grabNumberOfElements(locator) {
    const { found } = await this._run(this._candidates(locator), 'count')
    return found
  }
}

export default CDPBrowser
