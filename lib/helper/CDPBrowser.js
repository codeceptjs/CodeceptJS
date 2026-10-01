import path from 'path'
import fs from 'fs'
import axios from 'axios'
import Helper from '@codeceptjs/helper'
import CDPConnection from './extras/CDPConnection.js'
import installCodeceptClient from './clientscripts/cdpBrowserClient.js'
import xpathPolyfillSource from './clientscripts/xpathPolyfill.js'
import Locator from '../locator.js'
import store from '../store.js'
import { xpathLocator, normalizePath, resolveUrl, toCamelCase, convertCssPropertiesToCamelCase, normalizeSpacesInString, fileExists, base64EncodeFile, getMimeType } from '../utils.js'
import ElementNotFound from './errors/ElementNotFound.js'
import MultipleElementsFound from './errors/MultipleElementsFound.js'
import { includes as stringIncludes } from '../assert/include.js'
import { empty } from '../assert/empty.js'
import { truth } from '../assert/truth.js'
import { equals, urlEquals } from '../assert/equal.js'
import { isColorProperty, convertColorToRGBA } from '../colorUtils.js'
import WebElement from '../element/WebElement.js'
import CDPElementHandle from './extras/CDPElementHandle.js'
import { checkFocusBeforeType, checkFocusBeforePressKey } from './extras/focusCheck.js'
import { CLIPBOARD_READ_TIMEOUT_MS, readClipboardScript, writeClipboardScript, clipboardExpression } from './extras/clipboard.js'
import { dontSeeTraffic, seeTraffic, grabRecordedNetworkTraffics, flushNetworkTraffics } from './network/actions.js'
import { assembleApng, isPng } from './extras/apngAssembler.js'

/**
 * ## Configuration
 *
 * This helper should be configured in codecept.conf.js
 *
 * @typedef CDPBrowserConfig
 * @type {object}
 * @prop {string} [url=http://localhost] - base url of website to be tested.
 * @prop {string} [endpoint=http://127.0.0.1:9222] - Chrome DevTools Protocol endpoint: an `http(s)://` address or a `ws(s)://` debugger URL.
 * @prop {object} [headers={}] - headers sent when connecting to the endpoint, e.g. for authenticated remote browsers.
 * @prop {string} [input=auto] - how actions are dispatched: `cdp` (real mouse and keyboard events) or `synthetic` (DOM events). `auto` picks `cdp` when the browser renders layout.
 * @prop {string|boolean} [xpathPolyfill=auto] - inject an XPath polyfill for browsers with incomplete XPath support. `auto` detects when it is needed.
 * @prop {object} [capabilities={}] - browser capabilities (`layout`, `xpath`, `screenshot`, `innerText`) to use instead of detecting them at runtime.
 * @prop {number} [waitForTimeout=5] - default timeout for wait* actions, in seconds.
 * @prop {number} [waitForAction] - fixed delay after each action, in milliseconds. When unset, actions wait only for the navigation they trigger.
 * @prop {number} [pollInterval=25] - interval between checks while waiting, in milliseconds.
 * @prop {number} [getPageTimeout=30] - maximum time to wait for a page to load, in seconds.
 * @prop {string} [waitForNavigation=load] - when a navigation is considered finished: `load`, `domcontentloaded`, or `networkidle`.
 */
const config = {}

// Maps a `waitForNavigation` value to the `Page.lifecycleEvent` name to wait for.
const LIFECYCLE_EVENT_BY_WAIT_UNTIL = {
  load: 'load',
  domcontentloaded: 'DOMContentLoaded',
  networkidle: 'networkIdle',
}

// Maps a `waitForNavigation` value to the `document.readyState`-based fallback expression, used
// when no push-based lifecycle event arrives in time. `networkidle` has no `readyState`
// equivalent, so it falls back to the same check as `load`.
const READY_STATE_EXPR_BY_WAIT_UNTIL = {
  load: `document.readyState === 'complete'`,
  domcontentloaded: `document.readyState !== 'loading'`,
  networkidle: `document.readyState === 'complete'`,
}

// How long `_waitForPageLoad` waits for the push-based lifecycle event alone before also starting
// the `document.readyState` poll as a fallback. Comfortably above both engines' observed
// lifecycle-event latency (Obscura: all events at once, tens of ms; Chrome: staggered, `load`
// within tens of ms even under real network load) — this keeps the common case free of any
// `_evaluate` calls competing with the page's own JavaScript during the load window, which is
// where they are most likely to queue behind a busy V8 isolate.
const PAGE_LOAD_GRACE_MS = 300

// How long `_waitForAction`'s event-aware settle waits, after an action, for a navigation to
// declare itself (via the `'init'` lifecycle event) before concluding none started. Confirmed via a
// raw probe (both engines) that a navigating action's `init` event fires within ~20ms; a
// non-navigating action never emits one at all, so this window is pure, bounded overhead on the
// (common) non-navigating case, not a guess at how long a real navigation takes.
const ACTION_SETTLE_GRACE_MS = 20

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
      pollInterval: 25,
      getPageTimeout: 30,
      waitForNavigation: 'load',
      ...config,
    }
    this.cdp = null
    this.sessionId = null
    this.targetId = null
    this.capabilities = { layout: null, xpath: null, screenshot: null, innerText: null, ...this.options.capabilities }
    this.withinCandidates = null
    this.requests = []
    this.recording = false
    this.recordedAtLeastOnce = false
    this._pendingTrafficResponses = new Map()
    this._trafficListenersInstalled = false
    this._screencastFrames = []
    this._screencastActive = false
    this._screencastListenerInstalled = false
    this._lifecycleListenerInstalled = false
    this._pageLoadWaiters = []
    this._navStartWaiters = []
    this._lastMainFrameNav = { loaderId: null, events: {} }
    this._textCheckBootstrap = null
    this._waitForActionExplicit = config?.waitForAction !== undefined
  }

  _init() {}

  async _resolveEndpoint() {
    let endpoint = this.options.endpoint
    if (endpoint.startsWith('http')) {
      const res = await axios.get(`${endpoint.replace(/\/$/, '')}/json/version`, { headers: this.options.headers })
      endpoint = res.data.webSocketDebuggerUrl
    }
    return endpoint
  }

  async _connect() {
    const endpoint = await this._resolveEndpoint()
    this.cdp = new CDPConnection(endpoint, { headers: this.options.headers, timeout: this.options.getPageTimeout * 1000 })
    await this.cdp.connect()
  }

  async _before() {
    if (!this.cdp || !this.cdp.isConnected) await this._connect()
    this._navStartWaiters = []
    this._lastMainFrameNav = { loaderId: null, events: {} }
    const { targetId } = await this.cdp.send('Target.createTarget', { url: 'about:blank' })
    this.targetId = targetId
    const { sessionId } = await this.cdp.send('Target.attachToTarget', { targetId, flatten: true })
    this.sessionId = sessionId
    await this.cdp.send('Page.enable', {}, this.sessionId).catch(() => null)
    await this.cdp.send('Runtime.enable', {}, this.sessionId).catch(() => null)
    await this.cdp.send('Page.setLifecycleEventsEnabled', { enabled: true }, this.sessionId).catch(() => null)
    await this._probeCapabilities()
  }

  _ensureLifecycleListener() {
    if (this._lifecycleListenerInstalled) return
    this._lifecycleListenerInstalled = true
    this.cdp.on('Page.lifecycleEvent', (params, sessionId) => {
      if (sessionId !== this.sessionId) return
      this._pageLoadWaiters = this._pageLoadWaiters.filter(waiter => {
        if (waiter.loaderId !== params.loaderId || waiter.eventName !== params.name) return true
        waiter.resolve()
        return false
      })
      if (params.frameId !== this.targetId) return
      if (this._lastMainFrameNav.loaderId !== params.loaderId) {
        this._lastMainFrameNav = { loaderId: params.loaderId, events: {} }
      }
      this._lastMainFrameNav.events[params.name] = true
      if (params.name === 'init' && this._navStartWaiters.length) {
        const waiters = this._navStartWaiters
        this._navStartWaiters = []
        waiters.forEach(w => w.resolve(params.loaderId))
      }
    })
  }

  _waitForLoadEvent(loaderId, eventName, timeoutSec) {
    this._ensureLifecycleListener()
    let waiter
    const promise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this._pageLoadWaiters = this._pageLoadWaiters.filter(w => w !== waiter)
        reject(new Error('lifecycle load event timed out'))
      }, timeoutSec * 1000)
      waiter = {
        loaderId,
        eventName,
        resolve: () => {
          clearTimeout(timer)
          resolve()
        },
        cancel: () => {
          clearTimeout(timer)
          this._pageLoadWaiters = this._pageLoadWaiters.filter(w => w !== waiter)
        },
      }
      this._pageLoadWaiters.push(waiter)
    })
    return { promise, cancel: () => waiter.cancel() }
  }

  _armActionSettle() {
    if (this._waitForActionExplicit) return null
    this._ensureLifecycleListener()
    let waiter
    const promise = new Promise(resolve => {
      waiter = { resolve }
      this._navStartWaiters.push(waiter)
    })
    return { promise, cancel: () => { this._navStartWaiters = this._navStartWaiters.filter(w => w !== waiter) } }
  }

  async _waitForPageLoad(loaderId, timeoutMessage) {
    const waitUntil = READY_STATE_EXPR_BY_WAIT_UNTIL[this.options.waitForNavigation] ? this.options.waitForNavigation : 'load'
    const readyStateCheck = () => this._evaluate(READY_STATE_EXPR_BY_WAIT_UNTIL[waitUntil]).catch(() => false)
    if (!loaderId) return this._poll(readyStateCheck, this.options.getPageTimeout, timeoutMessage)

    const eventName = LIFECYCLE_EVENT_BY_WAIT_UNTIL[waitUntil]
    const cancelToken = { cancelled: false }
    const { promise: lifecyclePromise, cancel: cancelLifecycle } = this._waitForLoadEvent(loaderId, eventName, this.options.getPageTimeout)
    let lifecycleLoaded = false
    lifecyclePromise.then(
      () => {
        lifecycleLoaded = true
      },
      () => {},
    )
    let pollPromise = null
    let graceTimer = null
    const gracePromise = new Promise(resolve => {
      graceTimer = setTimeout(resolve, PAGE_LOAD_GRACE_MS)
    })
    try {
      await Promise.race([lifecyclePromise.catch(() => {}), gracePromise])
      if (lifecycleLoaded) return
      clearTimeout(graceTimer)
      pollPromise = this._poll(readyStateCheck, this.options.getPageTimeout, timeoutMessage, cancelToken)
      await Promise.race([lifecyclePromise, pollPromise])
    } finally {
      clearTimeout(graceTimer)
      cancelToken.cancelled = true
      cancelLifecycle()
      lifecyclePromise.catch(() => {})
      if (pollPromise) pollPromise.catch(() => {})
    }
  }

  async _after() {
    if (!this.targetId) return
    await this.cdp.send('Target.closeTarget', { targetId: this.targetId }).catch(() => null)
    this.targetId = null
    this.sessionId = null
  }

  async _finishTest() {
    if (this.cdp) await this.cdp.close()
    this.cdp = null
  }

  async _evaluate(expression) {
    const res = await this.cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, this.sessionId)
    if (res.exceptionDetails) {
      const detail = res.exceptionDetails.exception ? res.exceptionDetails.exception.description : res.exceptionDetails.text
      throw new Error(`Error in browser script: ${detail}`)
    }
    return res.result ? res.result.value : undefined
  }

  async _ensureClient() {
    const installed = await this._evaluate(`typeof window.__codecept !== 'undefined'`)
    if (installed) return
    await this._installClient()
  }

  async _installClient(needsXPath = true) {
    const enginePolyfillNeeded = await this._needsXPathPolyfill()
    if (needsXPath && enginePolyfillNeeded) {
      await this._evaluate(xpathPolyfillSource())
    }
    await this._evaluate(`(${installCodeceptClient.toString()})(${JSON.stringify(enginePolyfillNeeded)})`)
  }

  _candidatesNeedXPath(candidates, layers) {
    const hasXPath = arr => Array.isArray(arr) && arr.some(c => c && c.type === 'xpath')
    if (hasXPath(candidates)) return true
    return layers.some(hasXPath)
  }

  async _needsXPathPolyfill() {
    if (this.options.xpathPolyfill === true) return true
    if (this.options.xpathPolyfill === false) return false
    if (this.capabilities.xpath) return this.capabilities.xpath === 'polyfill'
    const ok = await this._evaluate(`(function(){
      try {
        var parent = document.body || document.documentElement
        var probe = document.createElement('span')
        probe.textContent = '\\u0001codecept-xpath-probe-match'
        var decoy = document.createElement('span')
        decoy.textContent = '\\u0001codecept-xpath-probe-nomatch'
        parent.appendChild(probe)
        parent.appendChild(decoy)
        var r = document.evaluate(".//*[normalize-space(string(.))='\\u0001codecept-xpath-probe-match']", parent, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
        var ok = r.snapshotLength === 1 && r.snapshotItem(0) === probe
        probe.remove()
        decoy.remove()
        return ok
      } catch (e) { return false }
    })()`)
    this.capabilities.xpath = ok ? 'native' : 'polyfill'
    return !ok
  }

  async _needsVisibleTextFallback() {
    if (this.capabilities.innerText) return this.capabilities.innerText === 'computed'
    const ok = await this._evaluate(`(function(){
      try {
        var parent = document.body || document.documentElement
        var hidden = document.createElement('div')
        hidden.style.display = 'none'
        hidden.textContent = '\\u0001codecept-innertext-probe-hidden'
        var script = document.createElement('script')
        script.textContent = '/* \\u0001codecept-innertext-probe-script */'
        parent.appendChild(hidden)
        parent.appendChild(script)
        var text = parent.innerText || ''
        var ok = text.indexOf('codecept-innertext-probe-hidden') === -1 && text.indexOf('codecept-innertext-probe-script') === -1
        hidden.remove()
        script.remove()
        return ok
      } catch (e) { return false }
    })()`)
    this.capabilities.innerText = ok ? 'native' : 'computed'
    return !ok
  }

  async _probeCapabilities() {
    if (this.capabilities.layout === null) {
      const display = await this._evaluate(`getComputedStyle(document.documentElement).display`)
      this.capabilities.layout = display === '' ? 'none' : 'real'
    }
    if (this.capabilities.screenshot === null) {
      this.capabilities.screenshot = this.capabilities.layout === 'real'
    }
    if (this.options.input === 'auto') {
      this.options.input = this.capabilities.layout === 'real' ? 'cdp' : 'synthetic'
    }
    if (this.capabilities.xpath === null) {
      await this._needsXPathPolyfill()
    }
    if (this.capabilities.innerText === null) {
      await this._needsVisibleTextFallback()
    }
  }

  async _run(candidates, action, payload, context = null) {
    return this._runSelected(candidates, action, payload, this._selectionDescriptor(), context)
  }

  async _runSelected(candidates, action, payload, selection, context = null) {
    const layers = []
    if (this.withinCandidates) layers.push(this.withinCandidates)
    if (context) layers.push(this._candidates(context))
    const scope = layers.length ? layers : null
    const expression = `window.__codecept ? window.__codecept.run(${JSON.stringify(candidates)}, ${JSON.stringify(action)}, ${JSON.stringify(payload || null)}, ${JSON.stringify(scope)}, ${JSON.stringify(selection)}) : '__NO_CLIENT__'`
    let res = await this._evaluate(expression)
    if (res === '__NO_CLIENT__') {
      await this._installClient(this._candidatesNeedXPath(candidates, layers))
      res = await this._evaluate(expression)
      if (res === '__NO_CLIENT__') throw new Error('Failed to install the CodeceptJS in-page client')
    }
    if (res === '__NO_XPATH__') {
      await this._evaluate(xpathPolyfillSource())
      res = await this._evaluate(expression)
      if (res === '__NO_XPATH__') throw new Error('Failed to install the CodeceptJS XPath polyfill')
    }
    if (res?.outOfBounds) {
      throw new Error(`elementIndex ${res.requestedIndex} exceeds the number of elements found (${res.found}) for "${this._candidatesLabel(candidates)}"`)
    }
    if (res?.strictViolation) {
      const webElements = Array.from({ length: res.found }, (_, i) => new WebElement(new CDPElementHandle(this, candidates, i + 1), this))
      throw new MultipleElementsFound(this._candidatesLabel(candidates), webElements)
    }
    return res
  }

  _selectionDescriptor() {
    const opts = store.currentStep?.opts
    let index = opts?.elementIndex
    if (index === 'first') index = 1
    else if (index === 'last') index = -1
    if (index !== undefined && index !== null) return { index }
    let strict = !!this.options.strict
    if (opts?.exact === true || opts?.strictMode === true) strict = true
    else if (opts?.exact === false || opts?.strictMode === false) strict = false
    return strict ? { strict: true } : null
  }

  _candidatesLabel(candidates) {
    return (candidates || []).map(c => c.value).join(' | ')
  }

  async _withinBegin(locator) {
    const candidates = this._candidates(locator)
    const { found } = await this._run(candidates, 'count')
    if (!found) throw new ElementNotFound(locator, 'Element for within context')
    this.withinCandidates = candidates
  }

  async _withinEnd() {
    this.withinCandidates = null
  }

  async _poll(fn, timeoutSec, message, cancelToken) {
    const deadline = Date.now() + timeoutSec * 1000
    while (Date.now() < deadline) {
      if (cancelToken?.cancelled) throw new Error('polling cancelled')
      const result = await fn()
      if (result) return result
      if (cancelToken?.cancelled) throw new Error('polling cancelled')
      await new Promise(r => setTimeout(r, this.options.pollInterval))
    }
    throw new Error(message)
  }

  _url(path) {
    if (/^\w+:\/\//.test(path)) return path
    return this.options.url.replace(/\/$/, '') + path
  }

  /**
   * {{> amOnPage }}
   */
  async amOnPage(url) {
    const navRes = await this.cdp.send('Page.navigate', { url: this._url(url) }, this.sessionId)
    await this._waitForPageLoad(navRes && navRes.loaderId, `Page did not reach readyState complete in ${this.options.getPageTimeout}s`)
    await this._probeCapabilities()
  }

  /**
   * {{> refreshPage }}
   */
  async refreshPage() {
    await this.cdp.send('Page.reload', {}, this.sessionId)
    await this._waitForPageLoad(null, `Page did not reload in ${this.options.getPageTimeout}s`)
  }

  /**
   * {{> executeScript }}
   */
  async executeScript(fn, ...args) {
    const body = typeof fn === 'function' ? `(${fn.toString()})(...${JSON.stringify(args)})` : fn
    return this._evaluate(body)
  }

  /**
   * {{> grabCurrentUrl }}
   */
  async grabCurrentUrl() {
    return this._evaluate('window.location.href')
  }

  /**
   * {{> grabTitle }}
   */
  async grabTitle() {
    return this._evaluate('document.title')
  }

  /**
   * {{> grabSource }}
   */
  async grabSource() {
    return this._evaluate('document.documentElement.outerHTML')
  }

  _candidates(locator, kind = 'element') {
    locator = new Locator(locator)
    if (locator.isShadow()) {
      return [{ type: 'shadow', value: locator.value }]
    }
    if (locator.isRole()) {
      const { text, exact } = locator.locator || {}
      return [{ type: 'role', value: { role: locator.value, text, exact: exact === true } }]
    }
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

  async _textSource(context) {
    if (context) return (await this._texts(this._candidates(context))).result?.join(' | ') || ''
    if (this.withinCandidates) return (await this._texts(null)).result?.join(' | ') || ''
    await this._ensureClient()
    if (await this._needsVisibleTextFallback()) {
      return this._evaluate('document.body ? window.__codecept.visibleText(document.body) : ""')
    }
    return this._evaluate('document.body ? document.body.innerText : ""')
  }

  async _runTextCheck(text, opts) {
    if (!this._textCheckBootstrap) {
      const needsPolyfill = await this._needsXPathPolyfill()
      this._textCheckBootstrap = `(${installCodeceptClient.toString()})(${JSON.stringify(needsPolyfill)});`
    }
    const expression = `(function(){ if (!window.__codecept) { ${this._textCheckBootstrap} } return window.__codecept.containsText(${JSON.stringify(text)}, ${JSON.stringify(opts)}) })()`
    return this._evaluate(expression)
  }

  async _checkText(text, context, negate) {
    const label = context ? `element ${new Locator(context).toString()}` : 'web page'
    const ignoreCase = store.currentStep?.opts?.ignoreCase === true
    if (context || this.withinCandidates) {
      let source = await this._textSource(context)
      let needle = text
      if (ignoreCase) {
        needle = needle.toLowerCase()
        source = source.toLowerCase()
      }
      const assertion = stringIncludes(label)
      return negate ? assertion.negate(normalizeSpacesInString(needle), normalizeSpacesInString(source)) : assertion.assert(normalizeSpacesInString(needle), normalizeSpacesInString(source))
    }
    const useWalker = await this._needsVisibleTextFallback()
    const res = await this._runTextCheck(text, { ignoreCase, useWalker })
    if (negate ? !res.found : res.found) return
    let source = await this._textSource(null)
    let needle = text
    if (ignoreCase) {
      needle = needle.toLowerCase()
      source = source.toLowerCase()
    }
    const assertion = stringIncludes(label)
    return negate ? assertion.negate(normalizeSpacesInString(needle), normalizeSpacesInString(source)) : assertion.assert(normalizeSpacesInString(needle), normalizeSpacesInString(source))
  }

  /**
   * {{> see }}
   */
  async see(text, context = null) {
    return this._checkText(text, context, false)
  }

  /**
   * {{> dontSee }}
   */
  async dontSee(text, context = null) {
    return this._checkText(text, context, true)
  }

  /**
   * {{> seeInSource }}
   */
  async seeInSource(text) {
    return stringIncludes('HTML source of a page').assert(text, await this.grabSource())
  }

  /**
   * {{> dontSeeInSource }}
   */
  async dontSeeInSource(text) {
    return stringIncludes('HTML source of a page').negate(text, await this.grabSource())
  }

  /**
   * {{> seeInCurrentUrl }}
   */
  async seeInCurrentUrl(url) {
    return stringIncludes('url').assert(url, await this.grabCurrentUrl())
  }

  /**
   * {{> dontSeeInCurrentUrl }}
   */
  async dontSeeInCurrentUrl(url) {
    return stringIncludes('url').negate(url, await this.grabCurrentUrl())
  }

  /**
   * {{> seeInTitle }}
   */
  async seeInTitle(text) {
    return stringIncludes('web page title').assert(text, await this.grabTitle())
  }

  /**
   * {{> seeElementInDOM }}
   */
  async seeElementInDOM(locator) {
    const { found } = await this._run(this._candidates(locator), 'count')
    return empty(`elements of ${new Locator(locator).toString()}`).negate(found === 0 ? null : found)
  }

  /**
   * {{> dontSeeElementInDOM }}
   */
  async dontSeeElementInDOM(locator) {
    const { found } = await this._run(this._candidates(locator), 'count')
    return empty(`elements of ${new Locator(locator).toString()}`).assert(found === 0 ? null : found)
  }

  _assertLayoutSupported(action) {
    if (this.capabilities.layout === 'none') {
      throw new Error(`${action} requires a layout engine which this browser does not provide. Use ${action}InDOM instead.`)
    }
  }

  /**
   * {{> seeElement }}
   */
  async seeElement(locator, context = null) {
    this._assertLayoutSupported('seeElement')
    const visible = await this._run(this._candidates(locator), 'visibleCount', null, context)
    return empty(`visible elements of ${new Locator(locator).toString()}`).negate(visible.result === 0 ? null : visible.result)
  }

  /**
   * {{> dontSeeElement }}
   */
  async dontSeeElement(locator, context = null) {
    this._assertLayoutSupported('dontSeeElement')
    const visible = await this._run(this._candidates(locator), 'visibleCount', null, context)
    return empty(`visible elements of ${new Locator(locator).toString()}`).assert(visible.result === 0 || visible.result === undefined ? null : visible.result)
  }

  /**
   * {{> seeCheckboxIsChecked }}
   */
  async seeCheckboxIsChecked(locator) {
    const res = await this._run(this._candidates(locator, 'checkable'), 'checked')
    if (!res.found) throw new ElementNotFound(locator, 'Checkbox')
    return truth(`checkbox ${new Locator(locator).toString()}`, 'to be checked').assert(res.result)
  }

  /**
   * {{> dontSeeCheckboxIsChecked }}
   */
  async dontSeeCheckboxIsChecked(locator) {
    const res = await this._run(this._candidates(locator, 'checkable'), 'checked')
    if (!res.found) throw new ElementNotFound(locator, 'Checkbox')
    return truth(`checkbox ${new Locator(locator).toString()}`, 'to be checked').negate(res.result)
  }

  /**
   * {{> grabTextFrom }}
   */
  async grabTextFrom(locator) {
    const res = await this._texts(this._candidates(locator))
    if (!res.found) throw new ElementNotFound(locator)
    return res.result[0]
  }

  /**
   * {{> grabTextFromAll }}
   */
  async grabTextFromAll(locator) {
    const res = await this._texts(this._candidates(locator))
    return res.found ? res.result : []
  }

  /**
   * {{> grabWebElements }}
   */
  async grabWebElements(locator) {
    const candidates = this._candidates(locator)
    const { found } = await this._run(candidates, 'count')
    return Array.from({ length: found }, (_, i) => new WebElement(new CDPElementHandle(this, candidates, i + 1), this))
  }

  /**
   * {{> grabWebElement }}
   */
  async grabWebElement(locator) {
    const elements = await this.grabWebElements(locator)
    if (!elements.length) throw new ElementNotFound(locator, 'Element')
    return elements[0]
  }

  async _texts(candidates) {
    const visible = await this._needsVisibleTextFallback()
    return this._run(candidates, 'texts', { visible })
  }

  /**
   * {{> grabValueFrom }}
   */
  async grabValueFrom(locator) {
    const res = await this._run(this._candidates(locator, 'field'), 'values')
    if (!res.found) throw new ElementNotFound(locator, 'Field')
    return res.result[0]
  }

  /**
   * {{> grabValueFromAll }}
   */
  async grabValueFromAll(locator) {
    const res = await this._run(this._candidates(locator, 'field'), 'values')
    return res.found ? res.result : []
  }

  /**
   * {{> grabAttributeFrom }}
   */
  async grabAttributeFrom(locator, attr) {
    const res = await this._run(this._candidates(locator), 'attrs', { name: attr })
    if (!res.found) throw new ElementNotFound(locator)
    return res.result[0]
  }

  /**
   * {{> grabAttributeFromAll }}
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
   * {{> click }}
   */
  async click(locator, context = null) {
    if (this.options.input !== 'cdp') return this.forceClick(locator, context)
    const candidates = this._candidates(locator, 'clickable')
    const res = await this._run(candidates, 'rect', null, context)
    if (!res.found) throw new ElementNotFound(locator, 'Clickable element')
    if (!res.result.width && !res.result.height) {
      throw new Error(`Clickable element ${new Locator(locator).toString()} has zero size and cannot receive a coordinate click. Use forceClick to dispatch a synthetic click.`)
    }
    const x = Math.round(res.result.x + res.result.width / 2)
    const y = Math.round(res.result.y + res.result.height / 2)
    const armed = this._armActionSettle()
    await this.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none', buttons: 0 }, this.sessionId)
    await this.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 }, this.sessionId)
    await this.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 }, this.sessionId)
    return this._waitForAction(armed)
  }

  /**
   * {{> forceClick }}
   */
  async forceClick(locator, context = null) {
    const armed = this._armActionSettle()
    const res = await this._run(this._candidates(locator, 'clickable'), 'click', null, context)
    if (!res.found) throw new ElementNotFound(locator, 'Clickable element')
    return this._waitForAction(armed)
  }

  async _waitForAction(armed) {
    if (this._waitForActionExplicit) {
      return new Promise(r => setTimeout(r, this.options.waitForAction))
    }
    if (!armed) armed = this._armActionSettle()
    let timer
    const graceTimeout = new Promise(resolve => {
      timer = setTimeout(() => resolve(null), ACTION_SETTLE_GRACE_MS)
    })
    const loaderId = await Promise.race([armed.promise, graceTimeout])
    clearTimeout(timer)
    if (!loaderId) {
      armed.cancel()
      return
    }
    const waitUntil = READY_STATE_EXPR_BY_WAIT_UNTIL[this.options.waitForNavigation] ? this.options.waitForNavigation : 'load'
    const eventName = LIFECYCLE_EVENT_BY_WAIT_UNTIL[waitUntil]
    if (this._lastMainFrameNav.loaderId === loaderId && this._lastMainFrameNav.events[eventName]) {
      return
    }
    await this._waitForPageLoad(loaderId, `Page did not finish loading after an action within ${this.options.getPageTimeout}s`)
  }

  /**
   * {{> fillField }}
   */
  async fillField(field, value, context = null) {
    const res = await this._run(this._candidates(field, 'field'), 'fill', { value: String(value) }, context)
    if (!res.found) throw new ElementNotFound(field, 'Field')
  }

  /**
   * {{> appendField }}
   */
  async appendField(field, value, context = null) {
    const res = await this._run(this._candidates(field, 'field'), 'append', { value: String(value) }, context)
    if (!res.found) throw new ElementNotFound(field, 'Field')
  }

  /**
   * {{> clearField }}
   */
  async clearField(field, context = null) {
    const res = await this._run(this._candidates(field, 'field'), 'clear', null, context)
    if (!res.found) throw new ElementNotFound(field, 'Field')
  }

  /**
   * {{> selectOption }}
   */
  async selectOption(select, option, context = null) {
    const value = Array.isArray(option) ? option.map(String) : String(option)
    const res = await this._run(this._candidates(select, 'field'), 'select', { value }, context)
    if (!res.found) throw new ElementNotFound(select, 'Selectable field')
    if (res.result === '__RADIOGROUP_MULTI__') {
      throw new Error(`selectOption: a radio group holds one value, but ${value.length} options were passed: ${value.join(', ')}`)
    }
    if (res.result === false) throw new Error(`Option "${Array.isArray(option) ? option.join(',') : option}" not found in ${new Locator(select).toString()}`)
  }

  /**
   * {{> checkOption }}
   */
  async checkOption(field, context = null) {
    const res = await this._run(this._candidates(field, 'checkable'), 'check', null, context)
    if (!res.found) throw new ElementNotFound(field, 'Checkable')
  }

  /**
   * {{> uncheckOption }}
   */
  async uncheckOption(field, context = null) {
    const res = await this._run(this._candidates(field, 'checkable'), 'uncheck', null, context)
    if (!res.found) throw new ElementNotFound(field, 'Checkable')
  }

  /**
   * {{> attachFile }}
   */
  async attachFile(field, pathToFile, context = null) {
    const file = path.join(store.codeceptDir, pathToFile)
    if (!fileExists(file)) {
      throw new Error(`File at ${file} can not be found on local system`)
    }
    const candidates = this._candidates(field, 'field')
    const marker = 'data-codecept-upload'
    const marked = await this._run(candidates, 'mark', { attr: marker }, context)
    if (!marked.found) throw new ElementNotFound(field, 'Field')
    const armed = this._armActionSettle()
    try {
      if (marked.result?.isFileInput) {
        await this._ensureClient()
        const { root } = await this.cdp.send('DOM.getDocument', { depth: -1 }, this.sessionId)
        const { nodeId } = await this.cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `[${marker}]` }, this.sessionId)
        if (!nodeId) throw new ElementNotFound(field, 'File input')
        await this.cdp.send('DOM.setFileInputFiles', { files: [file], nodeId }, this.sessionId)
      } else {
        await this._run(
          candidates,
          'dropFile',
          { base64Content: base64EncodeFile(file), fileName: path.basename(file), mimeType: getMimeType(path.basename(file)) },
          context,
        )
      }
    } finally {
      await this._run(candidates, 'unmark', { attr: marker }, context).catch(() => null)
    }
    return this._waitForAction(armed)
  }

  /**
   * {{> waitForElement }}
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
   * {{> waitForText }}
   */
  async waitForText(text, sec = null, context = null) {
    const timeout = sec || this.options.waitForTimeout
    if (context || this.withinCandidates) {
      return this._poll(
        async () => {
          try {
            const source = await this._textSource(context)
            return source.includes(text)
          } catch (e) {
            return false
          }
        },
        timeout,
        `Text "${text}" was not found on page after ${timeout} sec`,
      )
    }
    // No context/within: poll the fast, boolean-only in-page check instead of re-fetching (and, on
    // engines needing the `visibleText()` fallback, re-walking) the whole page's text on every tick.
    return this._poll(
      async () => {
        try {
          const useWalker = await this._needsVisibleTextFallback()
          const res = await this._runTextCheck(text, { ignoreCase: false, useWalker })
          return res.found
        } catch (e) {
          return false
        }
      },
      timeout,
      `Text "${text}" was not found on page after ${timeout} sec`,
    )
  }

  /**
   * {{> waitInUrl }}
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
   * {{> waitForFunction }}
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
   * {{> setCookie }}
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
   * {{> grabCookie }}
   */
  async grabCookie(name) {
    const cookies = await this.grabCookies()
    if (!name) return cookies
    return cookies.find(c => c.name === name)
  }

  /**
   * {{> clearCookie }}
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
   * {{> seeInClipboard }}
   */
  async seeInClipboard(text) {
    const clipboard = await this.grabFromClipboard()
    return stringIncludes('clipboard').assert(text, clipboard)
  }

  /**
   * {{> seeClipboardEquals }}
   */
  async seeClipboardEquals(text) {
    const clipboard = await this.grabFromClipboard()
    return equals('clipboard').assert(clipboard, text)
  }

  /**
   * {{> clearClipboard }}
   */
  async clearClipboard() {
    await this._grantClipboardAccess()
    await this._evaluate(clipboardExpression(writeClipboardScript, ''))
  }

  /**
   * {{> grabFromClipboard }}
   */
  async grabFromClipboard() {
    await this._grantClipboardAccess()
    const clipboard = await this._evaluate(clipboardExpression(readClipboardScript, CLIPBOARD_READ_TIMEOUT_MS))
    this.debugSection('Clipboard', clipboard)
    return clipboard
  }

  async _grantClipboardAccess() {
    await this.cdp.send('Page.bringToFront', {}, this.sessionId).catch(() => null)
    const origin = await this._evaluate('window.location.origin').catch(() => null)
    if (!origin || !origin.startsWith('http')) return
    await this.cdp.send('Browser.grantPermissions', { origin, permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] }).catch(() => null)
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
   * @returns {void} automatically synchronized promise through #recorder
   */
  async saveScreenshot(fileName) {
    if (this.capabilities.screenshot === false) {
      throw new Error('saveScreenshot is not supported: this browser has no rendering engine')
    }
    const outputDir = global.output_dir || '.'
    const res = await this.cdp.send('Page.captureScreenshot', { format: 'png' }, this.sessionId)
    fs.writeFileSync(path.join(outputDir, fileName), Buffer.from(res.data, 'base64'))
  }

  /**
   * {{> saveElementScreenshot }}
   */
  async saveElementScreenshot(locator, fileName) {
    if (this.capabilities.screenshot === false) {
      throw new Error('saveElementScreenshot is not supported: this browser has no rendering engine')
    }
    const res = await this._run(this._candidates(locator), 'rect')
    if (!res.found) throw new ElementNotFound(locator)
    const outputDir = global.output_dir || '.'
    const { x, y, width, height } = res.result
    const shot = await this.cdp.send('Page.captureScreenshot', { format: 'png', clip: { x, y, width, height, scale: 1 } }, this.sessionId)
    fs.writeFileSync(path.join(outputDir, fileName), Buffer.from(shot.data, 'base64'))
  }

  /**
   * {{> wait }}
   */
  async wait(sec) {
    return new Promise(r => setTimeout(r, sec * 1000))
  }

  /**
   * {{> dontSeeInTitle }}
   */
  async dontSeeInTitle(text) {
    return stringIncludes('web page title').negate(text, await this.grabTitle())
  }

  /**
   * {{> seeCurrentUrlEquals }}
   */
  async seeCurrentUrlEquals(url) {
    return urlEquals(this.options.url).assert(url, await this.grabCurrentUrl())
  }

  /**
   * {{> dontSeeCurrentUrlEquals }}
   */
  async dontSeeCurrentUrlEquals(url) {
    return urlEquals(this.options.url).negate(url, await this.grabCurrentUrl())
  }

  async _grabCurrentPath() {
    const currentUrl = await this.grabCurrentUrl()
    const baseUrl = this.options.url || 'http://localhost'
    return new URL(currentUrl, baseUrl).pathname
  }

  /**
   * {{> seeCurrentPathEquals }}
   */
  async seeCurrentPathEquals(path) {
    return equals('url path').assert(normalizePath(path), normalizePath(await this._grabCurrentPath()))
  }

  /**
   * {{> dontSeeCurrentPathEquals }}
   */
  async dontSeeCurrentPathEquals(path) {
    return equals('url path').negate(normalizePath(path), normalizePath(await this._grabCurrentPath()))
  }

  /**
   * {{> waitUrlEquals }}
   */
  async waitUrlEquals(urlPart, sec = null) {
    const timeout = sec || this.options.waitForTimeout
    const expectedUrl = resolveUrl(urlPart, this.options.url)
    let lastUrl = ''
    try {
      return await this._poll(
        async () => {
          lastUrl = await this.grabCurrentUrl().catch(() => lastUrl)
          return lastUrl === expectedUrl
        },
        timeout,
        'placeholder',
      )
    } catch (e) {
      throw new Error(`expected url to be ${expectedUrl}, but found ${lastUrl}`)
    }
  }

  /**
   * Waits for the current URL path to match the expected path.
   * Query strings and URL fragments are ignored.
   *
   * ```js
   * I.waitCurrentPathEquals('/info', 5);
   * ```
   *
   * @param {string} path value to check.
   * @param {number} [sec] (optional, `waitForTimeout` by default) time in seconds to wait
   * @returns {void} automatically synchronized promise through #recorder
   */
  async waitCurrentPathEquals(path, sec = null) {
    const timeout = sec || this.options.waitForTimeout
    const normalizedPath = normalizePath(path)
    let lastPath = ''
    try {
      return await this._poll(
        async () => {
          lastPath = await this._grabCurrentPath().catch(() => lastPath)
          return normalizePath(lastPath) === normalizedPath
        },
        timeout,
        'placeholder',
      )
    } catch (e) {
      throw new Error(`expected path to be ${normalizedPath}, but found ${normalizePath(lastPath)}`)
    }
  }

  /**
   * {{> seeInField }}
   */
  async seeInField(field, value, context = null) {
    return this._seeInField('assert', field, value, context)
  }

  /**
   * {{> dontSeeInField }}
   */
  async dontSeeInField(field, value, context = null) {
    return this._seeInField('negate', field, value, context)
  }

  async _seeInField(assertType, field, value, context = null) {
    const locatorText = new Locator(field).toString()
    if (typeof value === 'boolean') {
      const res = await this._run(this._candidates(field, 'field'), 'checked', null, context)
      if (!res.found) throw new ElementNotFound(field, 'Field')
      return truth(`checkbox ${locatorText}`, 'to be checked')[assertType](res.result === value)
    }
    const res = await this._run(this._candidates(field, 'field'), 'values', null, context)
    if (!res.found) throw new ElementNotFound(field, 'Field')
    const values = res.result || []
    const expected = String(value)
    return stringIncludes(`fields by ${locatorText}`)[assertType](expected, values[0])
  }

  /**
   * {{> grabNumberOfVisibleElements }}
   */
  async grabNumberOfVisibleElements(locator) {
    this._assertLayoutSupported('grabNumberOfVisibleElements')
    const res = await this._run(this._candidates(locator), 'visibleCount')
    return res.result || 0
  }

  /**
   * {{> seeNumberOfVisibleElements }}
   */
  async seeNumberOfVisibleElements(locator, num) {
    const found = await this.grabNumberOfVisibleElements(locator)
    return equals(`expected number of visible elements (${new Locator(locator).toString()}) is ${num}, but found ${found}`).assert(found, num)
  }

  /**
   * {{> grabPageScrollPosition }}
   */
  async grabPageScrollPosition() {
    return this.executeScript(() => ({ x: window.pageXOffset, y: window.pageYOffset }))
  }

  /**
   * {{> scrollPageToTop }}
   */
  scrollPageToTop() {
    return this.executeScript(() => window.scrollTo(0, 0))
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
    const armed = this._armActionSettle()
    if (locator) {
      const res = await this._run(this._candidates(locator), 'rect')
      if (!res.found) throw new ElementNotFound(locator, 'Element to scroll into view')
      await this.executeScript((x, y) => window.scrollBy(x, y), res.result.x + offsetX, res.result.y + offsetY)
    } else {
      await this.executeScript((x, y) => window.scrollTo(x, y), offsetX, offsetY)
    }
    return this._waitForAction(armed)
  }

  /**
   * {{> grabCssPropertyFrom }}
   */
  async grabCssPropertyFrom(locator, cssProperty) {
    const values = await this.grabCssPropertyFromAll(locator, cssProperty)
    if (!values.length) throw new ElementNotFound(locator)
    return values[0]
  }

  /**
   * {{> grabCssPropertyFromAll }}
   */
  async grabCssPropertyFromAll(locator, cssProperty) {
    const camelProperty = toCamelCase(cssProperty)
    const res = await this._run(this._candidates(locator), 'cssProps', { props: [camelProperty] })
    if (!res.found) return []
    return res.result.map(props => props[camelProperty])
  }

  /**
   * {{> seeCssPropertiesOnElements }}
   */
  async seeCssPropertiesOnElements(locator, cssProperties) {
    const cssPropertiesCamelCase = convertCssPropertiesToCamelCase(cssProperties)
    const keys = Object.keys(cssPropertiesCamelCase)
    const res = await this._run(this._candidates(locator), 'cssProps', { props: keys })
    if (!res.found) throw new ElementNotFound(locator)
    const matching = res.result.filter(props =>
      keys.every(key => {
        let actual = props[key]
        if (isColorProperty(key)) actual = convertColorToRGBA(actual)
        return actual == cssPropertiesCamelCase[key]
      }),
    ).length
    return equals(`all elements (${new Locator(locator).toString()}) to have CSS property ${JSON.stringify(cssProperties)}`).assert(matching, res.result.length)
  }

  /**
   * {{> seeAttributesOnElements }}
   */
  async seeAttributesOnElements(locator, attributes) {
    const attrs = Object.keys(attributes)
    const res = await this._run(this._candidates(locator), 'attrsMap', { attrs })
    if (!res.found) throw new ElementNotFound(locator)
    const matching = res.result.filter(elAttrs =>
      attrs.every(attr => {
        const actual = elAttrs[attr]
        const expected = attributes[attr]
        if (!actual) return false
        if (actual.toString().match(new RegExp(expected.toString()))) return true
        return expected === actual
      }),
    ).length
    return equals(`all elements (${new Locator(locator).toString()}) to have attributes ${JSON.stringify(attributes)}`).assert(matching, res.result.length)
  }

  /**
   * {{> focus }}
   */
  async focus(locator) {
    const armed = this._armActionSettle()
    const res = await this._run(this._candidates(locator), 'focus')
    if (!res.found) throw new ElementNotFound(locator, 'Element to focus')
    return this._waitForAction(armed)
  }

  /**
   * {{> blur }}
   */
  async blur(locator) {
    const armed = this._armActionSettle()
    const res = await this._run(this._candidates(locator), 'blur')
    if (!res.found) throw new ElementNotFound(locator, 'Element to blur')
    return this._waitForAction(armed)
  }

  /**
   * {{> type }}
   */
  async type(keys, delay = null) {
    await checkFocusBeforeType(this)
    if (!Array.isArray(keys)) keys = String(keys).split('')
    const dispatchKey = key => `(function(){
        var el = document.activeElement
        if (!el) return false
        var key = ${JSON.stringify(key)}
        var opts = { key: key, bubbles: true, cancelable: true }
        el.dispatchEvent(new KeyboardEvent('keydown', opts))
        el.dispatchEvent(new KeyboardEvent('keypress', opts))
        var isEditable = el.isContentEditable === true || el.getAttribute('contenteditable') === 'true'
        if (isEditable) el.textContent = (el.textContent || '') + key
        else el.value = (el.value || '') + key
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new KeyboardEvent('keyup', opts))
        return true
      })()`
    if (!delay) {
      const ok = await this._evaluate(`(function(){
        if (!document.activeElement) return false
        var keys = ${JSON.stringify(keys)}
        for (var i = 0; i < keys.length; i++) {
          var el = document.activeElement
          if (!el) return false
          var key = keys[i]
          var opts = { key: key, bubbles: true, cancelable: true }
          el.dispatchEvent(new KeyboardEvent('keydown', opts))
          el.dispatchEvent(new KeyboardEvent('keypress', opts))
          var isEditable = el.isContentEditable === true || el.getAttribute('contenteditable') === 'true'
          if (isEditable) el.textContent = (el.textContent || '') + key
          else el.value = (el.value || '') + key
          el.dispatchEvent(new Event('input', { bubbles: true }))
          el.dispatchEvent(new KeyboardEvent('keyup', opts))
        }
        return true
      })()`)
      if (!ok) throw new Error('No element is in focus. Use click or focus to set the active element before typing.')
      return
    }
    for (const key of keys) {
      const ok = await this._evaluate(dispatchKey(key))
      if (!ok) throw new Error('No element is in focus. Use click or focus to set the active element before typing.')
      await new Promise(r => setTimeout(r, delay))
    }
  }

  /**
   * Presses a key or a key combination on the focused element.
   *
   * ```js
   * I.pressKey('Enter');
   * I.pressKey(['Control', 'a']);
   * ```
   *
   * @param {string|string[]} key a key or an array of keys to combine (modifiers first).
   * @returns {void} automatically synchronized promise through #recorder
   */
  async pressKey(key) {
    const originalKey = Array.isArray(key) ? key : [key]
    await checkFocusBeforePressKey(this, originalKey)
    const mainKey = originalKey[originalKey.length - 1]
    const modifiers = originalKey.slice(0, -1)
    const armed = this._armActionSettle()
    await this._evaluate(`(function(){
      var el = document.activeElement || document.body
      var modifiers = ${JSON.stringify(modifiers)}
      var key = ${JSON.stringify(mainKey)}
      var opts = { key: key, bubbles: true, cancelable: true }
      modifiers.forEach(function(m){
        if (/^(control|ctrl)$/i.test(m)) opts.ctrlKey = true
        if (/^(meta|cmd|command)$/i.test(m)) opts.metaKey = true
        if (/^(alt|option)$/i.test(m)) opts.altKey = true
        if (/^shift$/i.test(m)) opts.shiftKey = true
      })
      el.dispatchEvent(new KeyboardEvent('keydown', opts))
      el.dispatchEvent(new KeyboardEvent('keyup', opts))
    })()`)
    return this._waitForAction(armed)
  }

  /**
   * {{> resizeWindow }}
   */
  async resizeWindow(width, height) {
    if (width === 'maximize') {
      throw new Error("CDPBrowser can't control windows, so it can't maximize it")
    }
    const armed = this._armActionSettle()
    await this.cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 0, mobile: false }, this.sessionId)
    return this._waitForAction(armed)
  }

  /**
   * {{> doubleClick }}
   */
  async doubleClick(locator, context = null) {
    const armed = this._armActionSettle()
    const res = await this._run(this._candidates(locator, 'clickable'), 'dblclick')
    if (!res.found) throw new ElementNotFound(locator, 'Clickable element')
    return this._waitForAction(armed)
  }

  /**
   * {{> rightClick }}
   */
  async rightClick(locator, context = null) {
    const armed = this._armActionSettle()
    const res = await this._run(this._candidates(locator, 'clickable'), 'rightclick')
    if (!res.found) throw new ElementNotFound(locator, 'Clickable element')
    return this._waitForAction(armed)
  }

  /**
   * Clicks at page coordinates, or at coordinates relative to an element.
   * Requires a browser that renders layout.
   *
   * ```js
   * I.clickXY(100, 200); // page coordinates
   * I.clickXY('#area', 50, 30); // relative to #area
   * ```
   *
   * @param {CodeceptJS.LocatorOrString|number} locator element to click relative to, or the X page coordinate.
   * @param {number} [x] X coordinate relative to the element, or the Y page coordinate if `locator` is a number.
   * @param {number} [y] Y coordinate relative to the element.
   * @returns {void} automatically synchronized promise through #recorder
   */
  async clickXY(locator, x, y) {
    this._assertLayoutSupported('clickXY')
    let px
    let py
    if (typeof locator === 'number') {
      px = locator
      py = x
    } else {
      const res = await this._run(this._candidates(locator), 'rect')
      if (!res.found) throw new ElementNotFound(locator, 'Element to click')
      px = res.result.x + x
      py = res.result.y + y
    }
    px = Math.round(px)
    py = Math.round(py)
    const armed = this._armActionSettle()
    await this.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: px, y: py, button: 'none', buttons: 0 }, this.sessionId)
    await this.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: px, y: py, button: 'left', buttons: 1, clickCount: 1 }, this.sessionId)
    await this.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: px, y: py, button: 'left', buttons: 0, clickCount: 1 }, this.sessionId)
    return this._waitForAction(armed)
  }

  /**
   * {{> waitForVisible }}
   */
  async waitForVisible(locator, sec = null) {
    this._assertLayoutSupported('waitForVisible')
    const timeout = sec || this.options.waitForTimeout
    const candidates = this._candidates(locator)
    return this._poll(
      async () => (await this._run(candidates, 'visibleCount').catch(() => ({ result: 0 }))).result > 0,
      timeout,
      `element (${new Locator(locator).toString()}) still not visible after ${timeout} sec`,
    )
  }

  /**
   * {{> waitForInvisible }}
   */
  async waitForInvisible(locator, sec = null) {
    this._assertLayoutSupported('waitForInvisible')
    const timeout = sec || this.options.waitForTimeout
    const candidates = this._candidates(locator)
    return this._poll(
      async () => (await this._run(candidates, 'visibleCount').catch(() => ({ result: 0 }))).result === 0,
      timeout,
      `element (${new Locator(locator).toString()}) still visible after ${timeout} sec`,
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
    const timeout = sec || this.options.waitForTimeout
    const candidates = this._candidates(locator)
    return this._poll(
      async () => (await this._run(candidates, 'count').catch(() => ({ found: 0 }))).found === 0,
      timeout,
      `element (${new Locator(locator).toString()}) still on page after ${timeout} sec`,
    )
  }

  /**
   * {{> seeCookie }}
   */
  async seeCookie(name) {
    const cookies = await this.grabCookies()
    return empty(`cookie ${name} to be set`).negate(cookies.filter(c => c.name === name))
  }

  /**
   * {{> dontSeeCookie }}
   */
  async dontSeeCookie(name) {
    const cookies = await this.grabCookies()
    return empty(`cookie ${name} not to be set`).assert(cookies.filter(c => c.name === name))
  }

  /**
   * {{> waitForCookie }}
   */
  async waitForCookie(name, sec = null) {
    const timeout = sec || this.options.waitForTimeout
    return this._poll(async () => (await this.grabCookies()).some(c => c.name === name), timeout, `Cookie ${name} is not found after ${timeout}s`)
  }

  /**
   * {{> grabHTMLFrom }}
   */
  async grabHTMLFrom(locator) {
    const html = await this.grabHTMLFromAll(locator)
    if (!html.length) throw new ElementNotFound(locator)
    return html[0]
  }

  /**
   * {{> grabHTMLFromAll }}
   */
  async grabHTMLFromAll(locator) {
    const res = await this._run(this._candidates(locator), 'innerHtml')
    return res.found ? res.result : []
  }

  /**
   * {{> executeAsyncScript }}
   */
  async executeAsyncScript(fn, ...args) {
    const fnBody = typeof fn === 'function' ? fn.toString() : fn
    return this._evaluate(`new Promise((done) => { (${fnBody})(...${JSON.stringify(args)}, done) })`)
  }

  /**
   * {{> startRecordingTraffic }}
   */
  async startRecordingTraffic() {
    this.flushNetworkTraffics()
    this.recording = true
    this.recordedAtLeastOnce = true
    await this._ensureClient()
    await this.cdp.send('Network.enable', {}, this.sessionId).catch(() => null)
    if (this._trafficListenersInstalled) return
    this._trafficListenersInstalled = true
    this.cdp.on('Network.requestWillBeSent', (params, sessionId) => this._onTrafficRequest(params, sessionId))
    this.cdp.on('Network.responseReceived', (params, sessionId) => this._onTrafficResponse(params, sessionId))
    this.cdp.on('Network.loadingFailed', (params, sessionId) => this._onTrafficLoadingFailed(params, sessionId))
  }

  _onTrafficRequest(params, sessionId) {
    if (!this.recording || sessionId !== this.sessionId) return
    let resolveResponse
    const response = new Promise(r => {
      resolveResponse = r
    })
    this._pendingTrafficResponses.set(params.requestId, resolveResponse)
    let requestPostData = params.request.postData
    if (requestPostData) {
      try {
        requestPostData = JSON.parse(requestPostData)
      } catch (e) {
        // not JSON, keep as string
      }
    }
    this.requests.push({
      url: params.request.url,
      method: params.request.method,
      requestHeaders: params.request.headers,
      requestPostData,
      response,
    })
  }

  _onTrafficResponse(params, sessionId) {
    if (sessionId !== this.sessionId) return
    const resolve = this._pendingTrafficResponses.get(params.requestId)
    if (!resolve) return
    this._pendingTrafficResponses.delete(params.requestId)
    const { response } = params
    resolve({
      url: () => response.url,
      status: () => response.status,
      statusText: () => response.statusText,
      body: async () => {
        try {
          const res = await this.cdp.send('Network.getResponseBody', { requestId: params.requestId }, this.sessionId)
          return res.base64Encoded ? Buffer.from(res.body, 'base64') : Buffer.from(res.body)
        } catch (e) {
          return Buffer.from('')
        }
      },
    })
  }

  _onTrafficLoadingFailed(params, sessionId) {
    if (sessionId !== this.sessionId) return
    const resolve = this._pendingTrafficResponses.get(params.requestId)
    if (!resolve) return
    this._pendingTrafficResponses.delete(params.requestId)
    resolve(null)
  }

  /**
   * {{> grabRecordedNetworkTraffics }}
   */
  async grabRecordedNetworkTraffics() {
    return grabRecordedNetworkTraffics.call(this)
  }

  /**
   * {{> seeTraffic }}
   */
  async seeTraffic(opts) {
    return seeTraffic.call(this, opts)
  }

  /**
   * {{> dontSeeTraffic }}
   */
  dontSeeTraffic(opts) {
    return dontSeeTraffic.call(this, opts)
  }

  /**
   * {{> stopRecordingTraffic }}
   */
  stopRecordingTraffic() {
    this.recording = false
  }

  /**
   * {{> flushNetworkTraffics }}
   */
  flushNetworkTraffics() {
    return flushNetworkTraffics.call(this)
  }

  /**
   * Starts recording a video of the page. Stop it with `stopScreencast`.
   * Usually enabled through the `screencast` plugin rather than called directly.
   *
   * ```js
   * I.startScreencast();
   * ```
   *
   * @param {object} [options] `{ maxWidth, maxHeight, quality, everyNthFrame }`
   * @returns {void} automatically synchronized promise through #recorder
   */
  async startScreencast(options = {}) {
    if (!this._screencastListenerInstalled) {
      this._screencastListenerInstalled = true
      this.cdp.on('Page.screencastFrame', (params, sessionId) => this._onScreencastFrame(params, sessionId))
    }
    this._screencastFrames = []
    this._screencastActive = true
    const params = { format: 'png' }
    if (options.maxWidth) params.maxWidth = options.maxWidth
    if (options.maxHeight) params.maxHeight = options.maxHeight
    if (options.quality != null) params.quality = options.quality
    if (options.everyNthFrame) params.everyNthFrame = options.everyNthFrame
    await this.cdp.send('Page.startScreencast', params, this.sessionId)
  }

  _onScreencastFrame(params, sessionId) {
    if (!this._screencastActive || sessionId !== this.sessionId) return
    this._screencastFrames.push({ data: params.data, timestamp: params.metadata && params.metadata.timestamp })
    this.cdp.send('Page.screencastFrameAck', { sessionId: params.sessionId }, this.sessionId).catch(() => null)
  }

  /**
   * Stops the recording started by `startScreencast` and returns it as an animated PNG.
   *
   * ```js
   * const video = await I.stopScreencast();
   * ```
   *
   * @param {object} [options] `{ lastFrameDelayMs }`: how long the last frame is shown, in milliseconds (1000 by default).
   * @returns {Promise<Buffer|null>} APNG data, or `null` if no frames were recorded.
   */
  async stopScreencast(options = {}) {
    this._screencastActive = false
    if (this.cdp && this.cdp.isConnected && this.sessionId) {
      await this.cdp.send('Page.stopScreencast', {}, this.sessionId).catch(() => null)
    }
    const frames = this._screencastFrames
    this._screencastFrames = []
    if (!frames.length) return null

    const buffers = frames.map(f => Buffer.from(f.data, 'base64'))
    const nonPngIndex = buffers.findIndex(b => !isPng(b))
    if (nonPngIndex !== -1) {
      this.debugSection('Screencast', `frame ${nonPngIndex} is not a PNG (first bytes: ${buffers[nonPngIndex].subarray(0, 8).toString('hex')}) — this engine isn't honoring format: 'png'; skipping APNG assembly`)
      return null
    }

    const apngFrames = buffers.map((buffer, i) => {
      const delayMs = i < frames.length - 1 && frames[i + 1].timestamp && frames[i].timestamp ? Math.max(1, Math.round((frames[i + 1].timestamp - frames[i].timestamp) * 1000)) : options.lastFrameDelayMs ?? 1000
      return { buffer, delayMs }
    })

    return assembleApng(apngFrames, {
      lastFrameDelayMs: options.lastFrameDelayMs ?? 1000,
      onDropFrame: info => this.debugSection('Screencast', `dropped a frame with size ${info.width}x${info.height}, expected ${info.expectedWidth}x${info.expectedHeight}`),
    })
  }
}

export default CDPBrowser
