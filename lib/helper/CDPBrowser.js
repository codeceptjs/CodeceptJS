import path from 'path'
import fs from 'fs'
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
const config = {}

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
   * @param {function} fn - the condition to poll; should resolve to a truthy value once satisfied.
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

  /**
   * Perform a click on a link or a button, given by a locator.
   * If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
   * For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
   * For images, the "alt" attribute and inner text of any parent links are searched.
   *
   * When `options.input` is `'cdp'`, the click is dispatched as real `Input.dispatchMouseEvent` mouse events
   * (`mouseMoved` / `mousePressed` / `mouseReleased`) at the center of the element's bounding box, so it
   * exercises the same input pipeline a real user would. Otherwise it delegates to `forceClick`. A matched
   * element with a zero-size bounding box (e.g. `display: none`) has no valid coordinate to click and throws;
   * use `forceClick` to dispatch a synthetic click on such elements instead.
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
   * // using strict locator
   * I.click({css: 'nav a.login'});
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
   * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
   * @returns {Promise<void>}
   * @throws {Error} if the matched element has a zero-size bounding box.
   */
  async click(locator, context = null) {
    if (this.options.input !== 'cdp') return this.forceClick(locator, context)
    const candidates = this._candidates(locator, 'clickable')
    const res = await this._run(candidates, 'rect')
    if (!res.found) throw new ElementNotFound(locator, 'Clickable element')
    if (!res.result.width && !res.result.height) {
      throw new Error(`Clickable element ${new Locator(locator).toString()} has zero size and cannot receive a coordinate click. Use forceClick to dispatch a synthetic click.`)
    }
    const x = Math.round(res.result.x + res.result.width / 2)
    const y = Math.round(res.result.y + res.result.height / 2)
    await this.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none', buttons: 0 }, this.sessionId)
    await this.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 }, this.sessionId)
    await this.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 }, this.sessionId)
    return this._waitForAction()
  }

  /**
   * Perform an emulated click on a link or a button, given by a locator.
   * Unlike `click`, this always dispatches a synthetic in-page `el.click()` instead of sending native
   * CDP input events. This works on hidden, animated or inactive elements as well.
   *
   * If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
   * For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
   * For images, the "alt" attribute and inner text of any parent links are searched.
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
   * // using strict locator
   * I.forceClick({css: 'nav a.login'});
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
   * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
   * @returns {Promise<void>}
   */
  async forceClick(locator, context = null) {
    const res = await this._run(this._candidates(locator, 'clickable'), 'click')
    if (!res.found) throw new ElementNotFound(locator, 'Clickable element')
    return this._waitForAction()
  }

  /**
   * Waits `options.waitForAction` milliseconds after an interaction, mirroring the pacing pause
   * other browser helpers apply between actions.
   *
   * @returns {Promise<void>}
   * @protected
   */
  async _waitForAction() {
    return new Promise(r => setTimeout(r, this.options.waitForAction))
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
   *
   * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
   * @param {CodeceptJS.StringOrSecret} value text value to fill.
   * @returns {Promise<void>}
   */
  async fillField(field, value) {
    const res = await this._run(this._candidates(field, 'field'), 'fill', { value: String(value) })
    if (!res.found) throw new ElementNotFound(field, 'Field')
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
   *
   * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator
   * @param {string} value text value to append.
   * @returns {Promise<void>}
   */
  async appendField(field, value) {
    const res = await this._run(this._candidates(field, 'field'), 'append', { value: String(value) })
    if (!res.found) throw new ElementNotFound(field, 'Field')
  }

  /**
   * Clears a `<textarea>` or text `<input>` element's value.
   *
   * ```js
   * I.clearField('Email');
   * I.clearField('user[email]');
   * I.clearField('#email');
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} field editable field located by label|name|CSS|XPath|strict locator.
   * @returns {Promise<void>}
   */
  async clearField(field) {
    const res = await this._run(this._candidates(field, 'field'), 'clear')
    if (!res.found) throw new ElementNotFound(field, 'Field')
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
   * @param {CodeceptJS.LocatorOrString} select field located by label|name|CSS|XPath|strict locator.
   * @param {string} option visible text or value of option.
   * @returns {Promise<void>}
   */
  async selectOption(select, option) {
    const res = await this._run(this._candidates(select, 'field'), 'select', { value: String(option) })
    if (!res.found) throw new ElementNotFound(select, 'Selectable field')
    if (res.result === false) throw new Error(`Option "${option}" not found in ${new Locator(select).toString()}`)
  }

  /**
   * Selects a checkbox or radio button.
   * Element is located by label or name or CSS or XPath.
   *
   * ```js
   * I.checkOption('#agree');
   * I.checkOption('I Agree to Terms and Conditions');
   * I.checkOption('agree', '//form');
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} field checkbox located by label | name | CSS | XPath | strict locator.
   * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
   * @returns {Promise<void>}
   */
  async checkOption(field, context = null) {
    const res = await this._run(this._candidates(field, 'checkable'), 'check')
    if (!res.found) throw new ElementNotFound(field, 'Checkable')
  }

  /**
   * Unselects a checkbox or radio button.
   * Element is located by label or name or CSS or XPath.
   *
   * ```js
   * I.uncheckOption('#agree');
   * I.uncheckOption('I Agree to Terms and Conditions');
   * I.uncheckOption('agree', '//form');
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} field checkbox located by label | name | CSS | XPath | strict locator.
   * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
   * @returns {Promise<void>}
   */
  async uncheckOption(field, context = null) {
    const res = await this._run(this._candidates(field, 'checkable'), 'uncheck')
    if (!res.found) throw new ElementNotFound(field, 'Checkable')
  }

  /**
   * Waits for element to be present on page (by default waits for `options.waitForTimeout` seconds).
   * Element can be located by CSS or XPath.
   *
   * ```js
   * I.waitForElement('.btn.continue');
   * I.waitForElement('.btn.continue', 5); // wait for 5 secs
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   * @param {number} [sec] (optional, `options.waitForTimeout` by default) time in seconds to wait
   * @returns {Promise<void>}
   */
  async waitForElement(locator, sec = null) {
    const timeout = sec || this.options.waitForTimeout
    const candidates = this._candidates(locator)
    return this._poll(
      async () => (await this._run(candidates, 'count').catch(() => ({ found: 0 }))).found > 0,
      timeout,
      `Element ${new Locator(locator).toString()} was not found on page after ${timeout} sec`,
    )
  }

  /**
   * Waits for a text to appear (by default waits for `options.waitForTimeout` seconds).
   * Element can be located by CSS or XPath.
   * Narrow down search results by providing context.
   *
   * ```js
   * I.waitForText('Thank you, form has been submitted');
   * I.waitForText('Thank you, form has been submitted', 5, '#modal');
   * ```
   *
   * @param {string} text to wait for.
   * @param {number} [sec] (optional, `options.waitForTimeout` by default) time in seconds to wait
   * @param {?CodeceptJS.LocatorOrString} [context=null] (optional) element located by CSS|XPath|strict locator.
   * @returns {Promise<void>}
   */
  async waitForText(text, sec = null, context = null) {
    const timeout = sec || this.options.waitForTimeout
    const candidates = context ? this._candidates(context) : null
    return this._poll(
      async () => {
        try {
          const source = candidates
            ? ((await this._run(candidates, 'texts')).result || []).join(' ')
            : await this._evaluate('document.body ? document.body.innerText : ""')
          return source.includes(text)
        } catch (e) {
          return false
        }
      },
      timeout,
      `Text "${text}" was not found on page after ${timeout} sec`,
    )
  }

  /**
   * Waiting for the part of the URL to match the expected. Useful for SPA to understand that page was changed.
   *
   * ```js
   * I.waitInUrl('/info', 2);
   * ```
   *
   * @param {string} urlPart value to check.
   * @param {number} [sec] (optional, `options.waitForTimeout` by default) time in seconds to wait
   * @returns {Promise<void>}
   */
  async waitInUrl(urlPart, sec = null) {
    const timeout = sec || this.options.waitForTimeout
    let lastUrl = ''
    try {
      return await this._poll(
        async () => {
          lastUrl = await this.grabCurrentUrl().catch(() => lastUrl)
          return lastUrl.includes(urlPart)
        },
        timeout,
        'placeholder',
      )
    } catch (e) {
      throw new Error(`expected url to include ${urlPart}, but found ${lastUrl}`)
    }
  }

  /**
   * Waits for a function to return true (waits for `options.waitForTimeout` seconds by default).
   * Running in browser context.
   *
   * ```js
   * I.waitForFunction(() => window.requests == 0);
   * I.waitForFunction(() => window.requests == 0, 5); // waits for 5 sec
   * I.waitForFunction((count) => window.requests == count, [3], 5) // pass args and wait for 5 sec
   * ```
   *
   * @param {(string|function)} fn to be executed in browser context.
   * @param {any[]|number} [argsOrSec] (optional) arguments for function or, if a number, seconds to wait.
   * @param {number} [sec] (optional, `options.waitForTimeout` by default) time in seconds to wait
   * @returns {Promise<void>}
   */
  async waitForFunction(fn, argsOrSec = null, sec = null) {
    let args = []
    if (Array.isArray(argsOrSec)) args = argsOrSec
    else if (typeof argsOrSec === 'number') sec = argsOrSec
    const timeout = sec || this.options.waitForTimeout
    const body = typeof fn === 'function' ? `(${fn.toString()})(...${JSON.stringify(args)})` : fn
    return this._poll(
      () => this._evaluate(body).catch(() => false),
      timeout,
      `Function did not return truthy within ${timeout} sec`,
    )
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
   * @param {CodeceptJS.Cookie|Array<CodeceptJS.Cookie>} cookie a cookie object or array of cookie objects.
   * @returns {Promise<void>}
   */
  async setCookie(cookie) {
    const cookies = Array.isArray(cookie) ? cookie : [cookie]
    const url = await this.grabCurrentUrl()
    for (const c of cookies) {
      await this.cdp.send('Network.setCookie', { url, ...c }, this.sessionId).catch(async () => {
        await this.cdp.send('Storage.setCookies', { cookies: [{ url, ...c }] }, this.sessionId)
      })
    }
  }

  /**
   * Retrieves all cookies visible to the current page.
   * Resumes test execution, so **should be used inside async function with `await`** operator.
   *
   * ```js
   * let cookies = await I.grabCookies();
   * ```
   *
   * @returns {Promise<Array<CodeceptJS.Cookie>>} array of cookie objects.
   */
  async grabCookies() {
    const res = await this.cdp.send('Network.getCookies', {}, this.sessionId).catch(() => this.cdp.send('Storage.getCookies', {}, this.sessionId))
    return res.cookies || []
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
   * @returns {Promise<CodeceptJS.Cookie|Array<CodeceptJS.Cookie>>} a cookie object, or an array of all cookies when `name` is not provided.
   */
  async grabCookie(name) {
    const cookies = await this.grabCookies()
    if (!name) return cookies
    return cookies.find(c => c.name === name)
  }

  /**
   * Clears a cookie by name,
   * if none provided clears all cookies.
   *
   * ```js
   * I.clearCookie();
   * I.clearCookie('test');
   * ```
   *
   * @param {?string} [name=null] (optional, `null` by default) cookie name
   * @returns {Promise<void>}
   */
  async clearCookie(name) {
    const cookies = await this.grabCookies()
    for (const c of cookies) {
      if (name && c.name !== name) continue
      await this.cdp.send('Network.deleteCookies', { name: c.name, domain: c.domain, path: c.path }, this.sessionId).catch(async () => {
        await this.cdp.send('Storage.deleteCookies', { name: c.name, domain: c.domain, path: c.path }, this.sessionId)
      })
    }
  }

  /**
   * Saves a screenshot to the output folder (set in codecept.conf.ts or codecept.conf.js).
   * Filename is relative to the output folder.
   *
   * ```js
   * I.saveScreenshot('debug.png');
   * ```
   *
   * @param {string} fileName file name to save.
   * @returns {Promise<void>}
   */
  async saveScreenshot(fileName) {
    if (this.capabilities.screenshot === false) {
      throw new Error('saveScreenshot is not supported: this browser has no rendering engine')
    }
    const outputDir = global.output_dir || '.'
    const res = await this.cdp.send('Page.captureScreenshot', { format: 'png' }, this.sessionId)
    fs.writeFileSync(path.join(outputDir, fileName), Buffer.from(res.data, 'base64'))
  }
}

export default CDPBrowser
