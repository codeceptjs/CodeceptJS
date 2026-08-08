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
 * @prop {string} [endpoint=http://127.0.0.1:9222] - Chrome DevTools Protocol endpoint. Either an `http(s)://` address exposing `/json/version` (from which the `webSocketDebuggerUrl` is resolved) or a raw `ws(s)://` debugger URL.
 * @prop {object} [headers={}] - headers sent with the endpoint resolution request and the WebSocket handshake. Useful for authenticated remote browser providers.
 * @prop {string} [input=auto] - how synthetic user actions (click, fill, etc.) are dispatched by helpers built on top of this class. `auto` picks `cdp` when a real layout engine is detected and `synthetic` otherwise; can be pinned to `cdp` or `synthetic`.
 * @prop {string|boolean} [xpathPolyfill=auto] - whether to inject the bundled XPath polyfill before installing the in-page client. `auto` probes the page and only injects when `document.evaluate` is unavailable or broken; `true`/`false` force the behavior.
 * @prop {object} [capabilities={}] - pre-seed detected browser capabilities (`layout`, `xpath`, `screenshot`, `innerText`) to skip runtime probing. Values set here are never overwritten by `_probeCapabilities`/`_ensureClient`.
 * @prop {number} [waitForTimeout=5] - default wait* timeout in seconds, used by helpers built on top of this class.
 * @prop {number} [waitForAction=100] - how long to wait in milliseconds after click, type, or other interactions, mirroring the pacing pause other browser helpers apply between actions.
 * @prop {number} [pollInterval=25] - interval in milliseconds between retries while polling for a condition (e.g. page ready state, `waitFor*`). Distinct from `waitForAction`.
 * @prop {number} [getPageTimeout=30] - maximum time in seconds to wait for a page to finish loading after navigation or reload; also used as the CDP command timeout (in ms, x1000).
 * @prop {string} [waitForNavigation=load] - when to consider a navigation finished: `load`, `domcontentloaded`, or `networkidle`. Mirrors the Puppeteer helper's option name. `networkidle` waits for the CDP `networkIdle` lifecycle event, which on a busy page can lag `load` by a second or more — only opt in if the extra wait is actually needed.
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
   * and `this.sessionId`. `Page` and `Runtime` domains are enabled on the new session, and engine
   * capabilities are probed here (against `about:blank`, uncontended) rather than only lazily on
   * the first real page — see `_probeCapabilities`.
   *
   * Also resets `_navStartWaiters` and `_lastMainFrameNav`: both are scoped to a single
   * `sessionId`/`targetId`, which are about to change, so anything left over from the previous test
   * (e.g. an action-settle waiter still armed because its test threw between arming and settling)
   * can never legitimately resolve against the new session — better to drop it here than leave it
   * waiting for the rest of the run.
   *
   * @protected
   */
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

  /**
   * Lazily installs a single, persistent `Page.lifecycleEvent` listener on the underlying
   * `CDPConnection` and drains it into whichever `_waitForLoadEvent` calls are currently pending,
   * matched by `loaderId`. Installed once per helper instance (the connection outlives individual
   * tests), never removed — `CDPConnection` has no listener-removal API, so a single persistent
   * dispatcher (rather than one listener per navigation) is what keeps this leak-free.
   *
   * Also, for the main frame (`params.frameId === this.targetId`, which holds for a page target's
   * own top-level frame) only:
   * - Drains `_navStartWaiters` (armed by `_armActionSettle`, before an action, for `_waitForAction`'s
   *   event-aware settle) on an `'init'` event — confirmed via a raw probe (against both Obscura and
   *   Chrome, through the actual CLI path) to be the earliest signal CDP emits when a new top-level
   *   navigation begins. Arming happens *before* the action is dispatched, not after: the same probe
   *   found `'init'` can arrive while the action's own CDP round trip is still in flight, sometimes
   *   only a millisecond or two after it started — a listener installed only once the action's
   *   promise resolves can already be too late, not merely unlucky.
   * - Maintains `_lastMainFrameNav`, a rolling `{loaderId, events}` record of every lifecycle event
   *   name seen for the current main-frame navigation (reset whenever `loaderId` changes). On a
   *   fast/local navigation, the same raw probe found the *entire* sequence — `init` through
   *   `networkIdle` — arriving as one batch while the triggering action's own round trip was still
   *   in flight. Without this cache, `_waitForAction` would correctly detect that a navigation
   *   started, then arm a *fresh* wait for the `load` event specifically — which, in that common
   *   case, had already fired and will never fire again, paying the full grace-window-plus-poll cost
   *   of `_waitForPageLoad` on every single navigating action instead of settling immediately.
   *
   * @protected
   */
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

  /**
   * Starts waiting for a `Page.lifecycleEvent` named `eventName` for the given `loaderId` on the
   * current session. `loaderId` (from the `Page.navigate` response) discriminates the awaited
   * navigation from any other in-flight or stale lifecycle events (e.g. the `about:blank` target
   * created in `_before`), which is essential since Chrome emits the target's initial `about:blank`
   * lifecycle sequence asynchronously, sometimes after this listener is already installed.
   *
   * Returns a `{promise, cancel}` pair rather than a bare promise: `_waitForPageLoad` races this
   * against a readyState poll, and whichever side loses must be actively torn down (not just have
   * its rejection swallowed) — an abandoned-but-still-pending wait would sit in `_pageLoadWaiters`
   * for the full timeout on every single navigation, for no purpose.
   *
   * @param {string} loaderId - the loader id of the navigation to wait for, from `Page.navigate`'s response.
   * @param {string} eventName - the `Page.lifecycleEvent` name to wait for (e.g. `load`, `DOMContentLoaded`, `networkIdle`).
   * @param {number} timeoutSec - maximum time to wait, in seconds.
   * @returns {{promise: Promise<void>, cancel: function}}
   * @protected
   */
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

  /**
   * Arms the event-aware settle's navigation-start listener. Must be called *before* the action
   * that might trigger a navigation is dispatched, not after — see `_ensureLifecycleListener` for
   * why. Returns `null` when `options.waitForAction` was set explicitly, since `_waitForAction`
   * ignores the armed listener entirely in that case (a literal fixed sleep, as before this round).
   *
   * No timeout here: `_waitForAction` applies the grace window itself, starting from when *it*
   * runs (after the action's own dispatch already resolved), racing this already-armed listener
   * against a fresh timer instead of one that started ticking before the action even began.
   *
   * @returns {?{promise: Promise<string|null>, cancel: function}}
   * @protected
   */
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

  /**
   * Waits for a page to finish loading after `Page.navigate`/`Page.reload`, per `options.waitForNavigation`.
   *
   * Purely event-driven for the first `PAGE_LOAD_GRACE_MS`: only the push-based
   * `Page.lifecycleEvent` signal (matched by `loaderId`) is awaited, issuing zero `_evaluate` calls
   * — this matters because an `_evaluate` sent while the page's own JavaScript is still busy (e.g.
   * a real-world page doing post-load hydration/analytics work) can queue behind it for hundreds of
   * ms to multiple seconds, measured directly against a JS-heavy page. Only if the grace window
   * elapses without the event (an engine that doesn't emit it, or a genuinely slow navigation) does
   * the `document.readyState` poll (via `_poll`) start, racing the still-pending lifecycle wait —
   * both bounded by the same `options.getPageTimeout`, so a lifecycle-less engine costs at most
   * `PAGE_LOAD_GRACE_MS` more than the poll alone would have, never double the timeout. No
   * `loaderId` (e.g. from `Page.reload`, which returns none) skips straight to the poll.
   *
   * Whichever side ultimately loses is actively cancelled, not merely abandoned — an abandoned poll
   * or lifecycle wait would otherwise keep running (issuing readyState `_evaluate` calls every
   * `pollInterval`, or holding a `_pageLoadWaiters` entry) for up to the full timeout on every
   * navigation, competing for the same CDP connection with real work.
   *
   * @param {string|null} loaderId - loader id from the triggering `Page.navigate` response, if any.
   * @param {string} timeoutMessage - error message used if the readyState poll times out.
   * @returns {Promise<void>}
   * @protected
   */
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
    await this._installClient()
  }

  /**
   * Installs the in-page client unconditionally — no `typeof window.__codecept` presence check.
   * Used by callers that already know, from a sentinel value returned alongside a failed action,
   * that the client is missing on the current page, so re-checking would just be a redundant
   * contended round trip.
   *
   * The 171KB XPath polyfill is only injected alongside the client when `needsXPath` is true (the
   * default, for callers without candidate information) *and* the engine actually needs it
   * (`capabilities.xpath === 'polyfill'`, cached from `_before`'s probe). Callers that know their
   * candidates never resolve to an `xpath` strategy (e.g. `_runSelected`, once it has inspected
   * `candidates`/`within`) can pass `false` to skip that inject — the client is still told, via the
   * `xpathNeedsPolyfill` flag baked in at install time, that the *engine* will eventually need it,
   * so a later call that does hit an xpath candidate gets a clean `'__NO_XPATH__'` miss signal
   * (from `window.__codecept.run`) instead of silently falling through to a broken native
   * `document.evaluate` — `_runSelected` reacts to that sentinel by injecting the polyfill and
   * retrying once, mirroring the `'__NO_CLIENT__'` handling right next to it.
   *
   * @param {boolean} [needsXPath=true]
   * @protected
   */
  async _installClient(needsXPath = true) {
    const enginePolyfillNeeded = await this._needsXPathPolyfill()
    if (needsXPath && enginePolyfillNeeded) {
      await this._evaluate(xpathPolyfillSource())
    }
    await this._evaluate(`(${installCodeceptClient.toString()})(${JSON.stringify(enginePolyfillNeeded)})`)
  }

  /**
   * Whether any candidate strategy — in `candidates` itself, or in any of the `within` scoping
   * `layers` searched before it — is an `xpath` locator. Used to decide, before the client is even
   * installed, whether the XPath polyfill needs to be bundled into that install or can be deferred.
   *
   * @param {?Array<{type: string, value: string}>} candidates
   * @param {Array<Array<{type: string, value: string}>>} layers
   * @returns {boolean}
   * @protected
   */
  _candidatesNeedXPath(candidates, layers) {
    const hasXPath = arr => Array.isArray(arr) && arr.some(c => c && c.type === 'xpath')
    if (hasXPath(candidates)) return true
    return layers.some(hasXPath)
  }

  /**
   * Determines whether the bundled XPath polyfill must be injected before the in-page client is
   * installed. Honors an explicit `options.xpathPolyfill` boolean; otherwise reuses a previously
   * probed `capabilities.xpath`, or probes the page's native `document.evaluate`. The probe appends
   * two throwaway elements distinguished only by text content and asserts that a text-value XPath
   * predicate (`normalize-space(string(.))=...`, the basis of every fuzzy/clickable locator) resolves
   * to exactly the matching one — merely checking that `document.evaluate` runs without throwing is
   * not enough, since some engines execute a text-value predicate without actually filtering by it,
   * silently returning every candidate node instead of none or one. The result is cached on
   * `capabilities.xpath` (`'native'` or `'polyfill'`).
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

  /**
   * Determines whether `see`/`dontSee`/`waitForText` should read whole-page text through the
   * client's own visibility-aware `visibleText()` walker instead of the native
   * `document.body.innerText`. Probes once per page by appending a `display:none` element and a
   * `<script>` element, each with distinguishing text, and checking that native `innerText`
   * excludes both — some engines return an `innerText` that does not honor computed visibility or
   * exclude script/style content, even when `getComputedStyle`/layout are otherwise reliable. The
   * result is cached on `capabilities.innerText` (`'native'` or `'computed'`).
   *
   * @returns {Promise<boolean>} `true` if the `visibleText()` fallback should be used.
   * @protected
   */
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

  /**
   * Probes and caches capabilities that depend on the actual browser *engine* rather than any
   * particular page's content: `capabilities.layout` (via `getComputedStyle`), `capabilities.screenshot`
   * (inferred from `layout`), `capabilities.xpath` (via `_needsXPathPolyfill`), and
   * `capabilities.innerText` (via `_needsVisibleTextFallback`). Already-known capabilities
   * (pre-seeded through `options.capabilities`, or probed earlier) are never re-probed — so, across
   * a whole run, this issues a handful of `_evaluate` calls exactly once and is a no-op afterward.
   *
   * Called from `_before`, against the fresh `about:blank` target created there, specifically so
   * these probes run before any real navigation — measured directly (a full stall ledger against
   * `github.com`) that running them on the first *real* page instead can cost seconds each, since
   * every one is an `_evaluate` competing with that page's own JavaScript for the V8 isolate.
   * `about:blank` has no such competition. Also called (cheaply, already cached by then) from
   * `amOnPage`, so a helper that skips `_before` for some reason still probes correctly.
   *
   * The `xpath`/`innerText` probes determine *whether* their respective fallback is needed; they
   * do not install anything — injection stays deferred to `_ensureClient`'s reactive install and
   * `_textSource`'s own read, matching `amOnPage` no longer eagerly installing the client.
   *
   * @protected
   */
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

  /**
   * Delegates a find-and-act call to `window.__codecept.run(candidates, action, payload)`. This is
   * the primary extension point used by helpers built on top of this class for element queries and
   * interactions.
   *
   * A per-call `context` locator, when given, is resolved and layered on top of any active
   * `within` block (searched inside it, not instead of it), so `context` narrows the search
   * without breaking out of a surrounding `within`.
   *
   * @param {Array<{type: 'css'|'xpath', value: string}>} candidates - locator strategies to try, in order, until one matches at least one element.
   * @param {string} action - name of the action to run against the matched elements (e.g. `count`, `click`, `fill`).
   * @param {object} [payload] - extra data the action needs (e.g. `{ value }` for `fill`).
   * @param {?CodeceptJS.LocatorOrString} [context=null] - element to search in, narrowing the candidates below it.
   * @returns {Promise<{found: number, result: any}>} number of matched elements and the action's result.
   * @protected
   */
  async _run(candidates, action, payload, context = null) {
    return this._runSelected(candidates, action, payload, this._selectionDescriptor(), context)
  }

  /**
   * Same as `_run`, but takes an explicit selection descriptor instead of reading one from
   * `store.currentStep`/`options.strict`. Used internally by `CDPElementHandle` to address one
   * specific element out of a candidate set by its 1-based index.
   *
   * The in-page client's presence is checked in the same round-trip as the action itself: the
   * evaluated expression resolves to a sentinel string when `window.__codecept` is missing (e.g.
   * right after a navigation the registered script didn't reach), in which case the client is
   * installed and the call is retried exactly once. Separately, if the client is already present
   * but reports (via its own `'__NO_XPATH__'` sentinel) that this call needs the XPath polyfill and
   * it was not bundled into that earlier install, the polyfill is injected and the call is retried
   * once more — see `_installClient`.
   *
   * @param {Array<{type: 'css'|'xpath', value: string}>} candidates
   * @param {string} action
   * @param {object|null} payload
   * @param {object|null} selection - `{index}` or `{strict: true}`, mirroring `_selectionDescriptor`.
   * @param {?CodeceptJS.LocatorOrString} [context=null]
   * @returns {Promise<{found: number, result: any}>}
   * @protected
   */
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

  /**
   * Builds the `{index, strict}` element-selection descriptor from the current step's options
   * (`store.currentStep.opts`) and `options.strict`, mirroring the semantics of
   * `lib/helper/extras/elementSelection.js` (used by Puppeteer/WebDriver): a per-step
   * `elementIndex` (numeric, or the `'first'`/`'last'` aliases) always takes precedence and
   * disables strict mode for that step; otherwise `exact`/`strictMode` per-step options
   * override `options.strict` to enable or cancel strict mode.
   *
   * @returns {object|null} descriptor with optional `index` and `strict` keys, or `null` when neither applies.
   * @protected
   */
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

  /**
   * A short, human-readable label built from `candidates`, used in `_run`'s elementIndex/strict
   * error messages when no locator string is otherwise available.
   *
   * @param {?Array<{type: 'css'|'xpath', value: string}>} candidates
   * @returns {string}
   * @protected
   */
  _candidatesLabel(candidates) {
    return (candidates || []).map(c => c.value).join(' | ')
  }

  /**
   * Starts a `within` block, scoping every subsequent `_run` call (and therefore every element
   * lookup performed by this helper) to the descendants of the element matched by `locator`.
   * Verifies the element exists (against the full document, i.e. unscoped) before narrowing.
   *
   * @param {CodeceptJS.LocatorOrString} locator - element located by CSS|XPath|strict locator.
   * @returns {Promise<void>}
   * @throws {ElementNotFound} if no element matches `locator`.
   */
  async _withinBegin(locator) {
    const candidates = this._candidates(locator)
    const { found } = await this._run(candidates, 'count')
    if (!found) throw new ElementNotFound(locator, 'Element for within context')
    this.withinCandidates = candidates
  }

  /**
   * Ends the current `within` block, restoring unscoped element lookups.
   *
   * @returns {Promise<void>}
   */
  async _withinEnd() {
    this.withinCandidates = null
  }

  /**
   * Repeatedly calls `fn` until it returns a truthy value or `timeoutSec` elapses, checking
   * immediately and waiting `options.pollInterval` milliseconds between subsequent attempts.
   *
   * @param {function} fn - the condition to poll; should resolve to a truthy value once satisfied.
   * @param {number} timeoutSec - maximum time to poll, in seconds.
   * @param {string} message - error message used when the timeout is reached.
   * @param {?{cancelled: boolean}} [cancelToken] - when `cancelled` becomes `true` (set by the caller from outside), polling stops early with an error instead of continuing to `timeoutSec`. Used by `_waitForPageLoad` to tear down the losing side of a race instead of leaving it running.
   * @returns {Promise<any>} the truthy value returned by `fn`.
   * @throws {Error} with `message` if `timeoutSec` elapses without `fn` returning a truthy value, or a cancellation error if `cancelToken.cancelled` is set first.
   * @protected
   */
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
   * Navigates via `Page.navigate`, then waits (up to `options.getPageTimeout` seconds) for the page
   * to finish loading, preferring the push-based `Page.lifecycleEvent` signal (per
   * `options.waitForNavigation`) over polling `document.readyState`. Capabilities are (re-)probed
   * (a no-op after the first page, since they're cached for the helper's lifetime).
   *
   * The in-page client is deliberately *not* eagerly (re-)installed here — navigation discards any
   * previously injected script, but installing it is deferred to the first actual action after
   * this call, via `_runSelected`'s sentinel-and-retry. This keeps `amOnPage` itself down to the
   * navigate command plus the push-based wait: no `_evaluate` call is issued on this hot path,
   * which matters most right when the page's own JavaScript may still be busy (measured directly:
   * an `_evaluate` sent in that window can queue behind it for hundreds of ms to multiple seconds
   * on a JS-heavy real-world page, regardless of how small the evaluated expression is).
   *
   * @param {string} url - url path or global url.
   * @returns {Promise<void>}
   */
  async amOnPage(url) {
    const navRes = await this.cdp.send('Page.navigate', { url: this._url(url) }, this.sessionId)
    await this._waitForPageLoad(navRes && navRes.loaderId, `Page did not reach readyState complete in ${this.options.getPageTimeout}s`)
    await this._probeCapabilities()
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
    await this._waitForPageLoad(null, `Page did not reload in ${this.options.getPageTimeout}s`)
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
   * A role locator (`{role, text, exact}`) resolves to a single `role`-type candidate, resolved
   * in-page by the client's implicit ARIA role mapping (native elements) plus explicit `role`
   * attributes, filtered by accessible name/text when `text` is given.
   *
   * @param {CodeceptJS.LocatorOrString} locator - element located by CSS|XPath|strict locator, or plain fuzzy text.
   * @param {'element'|'clickable'|'field'|'checkable'} [kind='element'] - matching strategy to use when `locator` is fuzzy.
   * @returns {Array<{type: 'css'|'xpath'|'role', value: (string|object)}>} candidates to pass to `_run`.
   * @protected
   */
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

  /**
   * Resolves the text to search `see`/`dontSee`/`waitForText` against, when no explicit `context`
   * locator is given. An explicit `context` is always resolved through `_run`, so it is implicitly
   * scoped to the active `within` block, if any. Without a `context`, this reads the `within` root's
   * text when a `within` block is active, or the whole page's text otherwise — via native
   * `document.body.innerText`, or the client's `visibleText()` walker when
   * `_needsVisibleTextFallback` determines native `innerText` is not trustworthy.
   *
   * @param {?CodeceptJS.LocatorOrString} context
   * @returns {Promise<string>}
   * @protected
   */
  async _textSource(context) {
    if (context) return (await this._texts(this._candidates(context))).result?.join(' | ') || ''
    if (this.withinCandidates) return (await this._texts(null)).result?.join(' | ') || ''
    await this._ensureClient()
    if (await this._needsVisibleTextFallback()) {
      return this._evaluate('document.body ? window.__codecept.visibleText(document.body) : ""')
    }
    return this._evaluate('document.body ? document.body.innerText : ""')
  }

  /**
   * Runs the in-page `containsText` check against the whole page (no `context`/`within` scoping —
   * those stay on `_textSource`'s per-element path, already small). Returns only `{found, snippet}`
   * instead of the full haystack: on a page with a large body, serializing that whole string across
   * the CDP wire (and, on engines where `capabilities.innerText` requires the `visibleText()`
   * walker, holding it in memory) is avoidable work `see`/`dontSee`/`waitForText` don't actually
   * need on their common, non-throwing path.
   *
   * Also folds the client's install into the very same round trip when it is still missing, instead
   * of a separate presence-check evaluate followed by an install evaluate before the check itself
   * can even run — mirroring `_runSelected`'s sentinel-retry design, but collapsed into one evaluate
   * since the install source itself is known and cacheable up front. That install is client-only,
   * never the 171KB XPath polyfill: `containsText` never calls `document.evaluate`, so bundling it
   * here would be pure waste for a scenario that never resolves an xpath locator. The client is
   * still told, via `installCodeceptClient`'s `xpathNeedsPolyfill` flag, whether the *engine*
   * (`capabilities.xpath`, cached by `_before`'s `about:blank` probe) will eventually need it, so a
   * later xpath-resolving action on the same page gets a clean `'__NO_XPATH__'` miss signal from
   * `window.__codecept.run` instead of silently hitting a broken native `document.evaluate` —
   * `_runSelected` reacts to that sentinel already. The bootstrap source is built once and reused
   * for the life of the instance, since whether the engine needs the polyfill never changes.
   *
   * @param {string} text
   * @param {{ignoreCase: boolean, useWalker: boolean}} opts
   * @returns {Promise<{found: boolean, snippet: (string|null)}>}
   * @protected
   */
  async _runTextCheck(text, opts) {
    if (!this._textCheckBootstrap) {
      const needsPolyfill = await this._needsXPathPolyfill()
      this._textCheckBootstrap = `(${installCodeceptClient.toString()})(${JSON.stringify(needsPolyfill)});`
    }
    const expression = `(function(){ if (!window.__codecept) { ${this._textCheckBootstrap} } return window.__codecept.containsText(${JSON.stringify(text)}, ${JSON.stringify(opts)}) })()`
    return this._evaluate(expression)
  }

  /**
   * Shared implementation for `see`/`dontSee`. Without a `context` locator and outside any `within`
   * block, checks presence via `_runTextCheck`'s fast, boolean-only round trip; the full haystack is
   * only fetched (one extra, rare evaluate) when the assertion is about to fail, to build the same
   * `stringIncludes` error as before this optimization. With a `context` or inside `within`, this is
   * unchanged from before — already a small, per-element read, not the identified cost.
   *
   * @param {string} text
   * @param {?CodeceptJS.LocatorOrString} context
   * @param {boolean} negate
   * @returns {Promise<void>}
   * @protected
   */
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
    return this._checkText(text, context, false)
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
    return this._checkText(text, context, true)
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
   * Checks that the current page does not contain the given string in its raw source code.
   *
   * @param {string} text value to check.
   * @returns {Promise<void>}
   */
  async dontSeeInSource(text) {
    return stringIncludes('HTML source of a page').negate(text, await this.grabSource())
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
   * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
   * @returns {Promise<void>}
   */
  async seeElement(locator, context = null) {
    this._assertLayoutSupported('seeElement')
    const visible = await this._run(this._candidates(locator), 'visibleCount', null, context)
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
   * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
   * @returns {Promise<void>}
   */
  async dontSeeElement(locator, context = null) {
    this._assertLayoutSupported('dontSeeElement')
    const visible = await this._run(this._candidates(locator), 'visibleCount', null, context)
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
    const res = await this._texts(this._candidates(locator))
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
    const res = await this._texts(this._candidates(locator))
    return res.found ? res.result : []
  }

  /**
   * Retrieves an array of `WebElement`s matching a locator (`lib/element/WebElement.js`,
   * wrapping a `CDPElementHandle`). Element handles are re-resolved on demand by re-running
   * `candidates` and picking the matching index, since `CDPBrowser` never keeps a persistent
   * handle to a DOM node on the Node side.
   *
   * ```js
   * const buttons = await I.grabWebElements({ role: 'button' });
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   * @returns {Promise<object[]>} array of WebElement instances.
   */
  async grabWebElements(locator) {
    const candidates = this._candidates(locator)
    const { found } = await this._run(candidates, 'count')
    return Array.from({ length: found }, (_, i) => new WebElement(new CDPElementHandle(this, candidates, i + 1), this))
  }

  /**
   * Retrieves the first `WebElement` matching a locator.
   *
   * ```js
   * const button = await I.grabWebElement({ role: 'button', text: 'Submit' });
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   * @returns {Promise<object>} a WebElement instance.
   * @throws {ElementNotFound} if no element matches `locator`.
   */
  async grabWebElement(locator) {
    const elements = await this.grabWebElements(locator)
    if (!elements.length) throw new ElementNotFound(locator, 'Element')
    return elements[0]
  }

  /**
   * Resolves whether the `texts` action should read via the client's `visibleText()` walker
   * (probed once via `_needsVisibleTextFallback` and cached on `capabilities.innerText`) instead
   * of each element's native `innerText`, then runs it.
   *
   * @param {Array<{type: string, value: (string|object)}>} candidates
   * @returns {Promise<{found: number, result: any}>}
   * @protected
   */
  async _texts(candidates) {
    const visible = await this._needsVisibleTextFallback()
    return this._run(candidates, 'texts', { visible })
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
    const armed = this._armActionSettle()
    const res = await this._run(this._candidates(locator, 'clickable'), 'click', null, context)
    if (!res.found) throw new ElementNotFound(locator, 'Clickable element')
    return this._waitForAction(armed)
  }

  /**
   * Settles after an interaction (click, key press, etc.) before the next step runs, using the
   * listener `_armActionSettle` started *before* the interaction was dispatched (`armed`; a fresh
   * one is armed here too, as a safety net, if a call site forgot to).
   *
   * If `options.waitForAction` was set explicitly in the config, honors it literally as a fixed
   * pacing sleep, exactly as before this round — an explicit value is a deliberate choice
   * (slow-motion debugging, a known-slow app) this never second-guesses.
   *
   * Otherwise, event-aware: races the armed listener against a *fresh* `ACTION_SETTLE_GRACE_MS`
   * window (started now, not when it was armed — the action's own dispatch already ran concurrently
   * with the arm, so this is genuinely bounded extra time, not a guess). If nothing declares a
   * navigation, returns immediately once the window elapses — the common case for most actions
   * (typing, toggling a checkbox, focusing a field) — instead of a fixed `options.waitForAction`
   * (100ms by default) sleep on every single action regardless of whether anything is happening.
   *
   * If a navigation *did* start, `_lastMainFrameNav` (see `_ensureLifecycleListener`) is checked
   * first: on a fast/local page, the entire lifecycle sequence through the target event has
   * typically already arrived in the same batch that announced the navigation started, in which
   * case this returns immediately. Only a navigation still genuinely in flight falls through to
   * `_waitForPageLoad` (the same mechanism `amOnPage`/`refreshPage` use) — which waits for it to
   * actually finish, rather than a fixed sleep that has no relationship to how long the navigation
   * actually takes: strictly more correct for a slow navigation, not just faster for a fast one.
   *
   * @param {?{promise: Promise<string|null>, cancel: function}} [armed] - from `_armActionSettle`, called before the action.
   * @returns {Promise<void>}
   * @protected
   */
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
   * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
   * @returns {Promise<void>}
   */
  async fillField(field, value, context = null) {
    const res = await this._run(this._candidates(field, 'field'), 'fill', { value: String(value) }, context)
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
   * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
   * @returns {Promise<void>}
   */
  async appendField(field, value, context = null) {
    const res = await this._run(this._candidates(field, 'field'), 'append', { value: String(value) }, context)
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
   * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
   * @returns {Promise<void>}
   */
  async clearField(field, context = null) {
    const res = await this._run(this._candidates(field, 'field'), 'clear', null, context)
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
   * @param {string|string[]} option visible text or value of option, or an array of them for a multi-select.
   * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
   * @returns {Promise<void>}
   */
  async selectOption(select, option, context = null) {
    const value = Array.isArray(option) ? option.map(String) : String(option)
    const res = await this._run(this._candidates(select, 'field'), 'select', { value }, context)
    if (!res.found) throw new ElementNotFound(select, 'Selectable field')
    if (res.result === false) throw new Error(`Option "${Array.isArray(option) ? option.join(',') : option}" not found in ${new Locator(select).toString()}`)
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
    const res = await this._run(this._candidates(field, 'checkable'), 'check', null, context)
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
    const res = await this._run(this._candidates(field, 'checkable'), 'uncheck', null, context)
    if (!res.found) throw new ElementNotFound(field, 'Checkable')
  }

  /**
   * Attaches a file to a file input field, or drops it onto a drag-and-drop dropzone element,
   * resolved by label|name|CSS|XPath|strict locator. `pathToFile` is resolved relative to
   * `codecept_dir` (matching Puppeteer/WebDriver). Since `CDPBrowser` never brings element handles
   * back to Node, the resolved element is marked with a throwaway `data-codecept-upload` attribute
   * in-page (respecting `context`/`within`/elementIndex exactly like every other action). A real
   * `<input type="file">` is then addressed by that attribute through the CDP `DOM` domain, which
   * `CDPBrowser` otherwise never uses, to call `DOM.setFileInputFiles`; any other element (a
   * drag-and-drop dropzone) instead gets a synthetic `dragenter`/`dragover`/`drop` sequence with a
   * `DataTransfer` built from the file's contents, entirely in-page. The marker is removed again in
   * a `finally`.
   *
   * ```js
   * I.attachFile('Avatar', 'data/avatar.jpg');
   * I.attachFile('#file', 'data/avatar.jpg');
   * I.attachFile('#dropzone', 'data/avatar.jpg');
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
   * @param {string} pathToFile path to file, relative to `codecept_dir`.
   * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
   * @returns {Promise<void>}
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
    const expectedUrl = resolveUrl(urlPart, this.options.url)
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
      throw new Error(`expected url to include ${expectedUrl}, but found ${lastUrl}`)
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
   * @param {string|null} [name=null] cookie name.
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
   * @param {string|null} [name=null] (optional, `null` by default) cookie name
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

  /**
   * Saves a screenshot of a single element to the output folder.
   *
   * ```js
   * I.saveElementScreenshot('#logo', 'logo.png');
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   * @param {string} fileName file name to save.
   * @returns {Promise<void>}
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
   * Pauses execution for a number of seconds.
   *
   * ```js
   * I.wait(2); // waits 2 secs
   * ```
   *
   * @param {number} sec number of seconds to wait.
   * @returns {Promise<void>}
   */
  async wait(sec) {
    return new Promise(r => setTimeout(r, sec * 1000))
  }

  /**
   * Checks that title does not contain text.
   *
   * @param {string} text value to check.
   * @returns {Promise<void>}
   */
  async dontSeeInTitle(text) {
    return stringIncludes('web page title').negate(text, await this.grabTitle())
  }

  /**
   * Checks that current url is equal to provided one.
   * Unlike `seeInCurrentUrl` performs a strict comparison.
   *
   * ```js
   * I.seeCurrentUrlEquals('/register');
   * ```
   *
   * @param {string} url value to check.
   * @returns {Promise<void>}
   */
  async seeCurrentUrlEquals(url) {
    return urlEquals(this.options.url).assert(url, await this.grabCurrentUrl())
  }

  /**
   * Checks that current url is not equal to provided one.
   * Unlike `dontSeeInCurrentUrl` performs a strict comparison.
   *
   * @param {string} url value to check.
   * @returns {Promise<void>}
   */
  async dontSeeCurrentUrlEquals(url) {
    return urlEquals(this.options.url).negate(url, await this.grabCurrentUrl())
  }

  /**
   * Resolves the current page URL to a `pathname`, ignoring the origin, query string, and hash.
   *
   * @returns {Promise<string>} the pathname of the current page.
   * @protected
   */
  async _grabCurrentPath() {
    const currentUrl = await this.grabCurrentUrl()
    const baseUrl = this.options.url || 'http://localhost'
    return new URL(currentUrl, baseUrl).pathname
  }

  /**
   * Checks that current url path (ignoring query string and hash) equals to provided one.
   *
   * ```js
   * I.seeCurrentPathEquals('/info');
   * ```
   *
   * @param {string} path value to check.
   * @returns {Promise<void>}
   */
  async seeCurrentPathEquals(path) {
    return equals('url path').assert(normalizePath(path), normalizePath(await this._grabCurrentPath()))
  }

  /**
   * Opposite to `seeCurrentPathEquals`.
   *
   * @param {string} path value to check.
   * @returns {Promise<void>}
   */
  async dontSeeCurrentPathEquals(path) {
    return equals('url path').negate(normalizePath(path), normalizePath(await this._grabCurrentPath()))
  }

  /**
   * Waits for the entire URL to match the expected (by default waits for `options.waitForTimeout` seconds).
   *
   * ```js
   * I.waitUrlEquals('/info', 2);
   * ```
   *
   * @param {string} urlPart value to check.
   * @param {number} [sec] (optional, `options.waitForTimeout` by default) time in seconds to wait
   * @returns {Promise<void>}
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
   * Waits for current url path (ignoring query string and hash) to equal to the expected.
   *
   * ```js
   * I.waitCurrentPathEquals('/info', 2);
   * ```
   *
   * @param {string} path value to check.
   * @param {number} [sec] (optional, `options.waitForTimeout` by default) time in seconds to wait
   * @returns {Promise<void>}
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
   * Checks that the given input field or textarea equals (contains) the given value.
   * For fuzzy locators, the field is searched by label|name|CSS|XPath|strict locator.
   *
   * ```js
   * I.seeInField('Username', 'davert');
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
   * @param {CodeceptJS.StringOrSecret} value value to check.
   * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
   * @returns {Promise<void>}
   */
  async seeInField(field, value, context = null) {
    return this._seeInField('assert', field, value, context)
  }

  /**
   * Opposite to `seeInField`.
   *
   * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
   * @param {CodeceptJS.StringOrSecret} value value to check.
   * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
   * @returns {Promise<void>}
   */
  async dontSeeInField(field, value, context = null) {
    return this._seeInField('negate', field, value, context)
  }

  /**
   * Shared implementation for `seeInField`/`dontSeeInField`.
   *
   * @param {'assert'|'negate'} assertType
   * @param {CodeceptJS.LocatorOrString} field
   * @param {CodeceptJS.StringOrSecret} value
   * @param {?CodeceptJS.LocatorOrString} [context=null]
   * @returns {Promise<void>}
   * @protected
   */
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
   * Grab number of visible elements by locator.
   *
   * ```js
   * let numOfVisibleElements = await I.grabNumberOfVisibleElements('p');
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
   * @returns {Promise<number>} number of visible matched elements.
   */
  async grabNumberOfVisibleElements(locator) {
    this._assertLayoutSupported('grabNumberOfVisibleElements')
    const res = await this._run(this._candidates(locator), 'visibleCount')
    return res.result || 0
  }

  /**
   * Asserts that an element appears a given number of times on the page, and that all matching elements are visible.
   *
   * ```js
   * I.seeNumberOfVisibleElements('.buttons', 3);
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
   * @param {number} num expected number of elements.
   * @returns {Promise<void>}
   */
  async seeNumberOfVisibleElements(locator, num) {
    const found = await this.grabNumberOfVisibleElements(locator)
    return equals(`expected number of visible elements (${new Locator(locator).toString()}) is ${num}, but found ${found}`).assert(found, num)
  }

  /**
   * Retrieves the current page scroll position.
   *
   * ```js
   * let { x, y } = await I.grabPageScrollPosition();
   * ```
   *
   * @returns {Promise<{x: number, y: number}>} scroll position.
   */
  async grabPageScrollPosition() {
    return this.executeScript(() => ({ x: window.pageXOffset, y: window.pageYOffset }))
  }

  /**
   * Scrolls to the top of the page.
   *
   * ```js
   * I.scrollPageToTop();
   * ```
   *
   * @returns {Promise<void>}
   */
  scrollPageToTop() {
    return this.executeScript(() => window.scrollTo(0, 0))
  }

  /**
   * Scrolls to the bottom of the page.
   *
   * ```js
   * I.scrollPageToBottom();
   * ```
   *
   * @returns {Promise<void>}
   */
  scrollPageToBottom() {
    return this.executeScript(() => {
      const body = document.body
      const html = document.documentElement
      window.scrollTo(0, Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight))
    })
  }

  /**
   * Scrolls to the element matched by locator, or to given coordinates.
   *
   * ```js
   * I.scrollTo('#submit');
   * I.scrollTo(100, 200);
   * ```
   *
   * @param {CodeceptJS.LocatorOrString|number} locator element to scroll to, or an X coordinate if no element.
   * @param {number} [offsetX=0] X offset, or Y coordinate if `locator` is a number.
   * @param {number} [offsetY=0] Y offset applied when scrolling to an element.
   * @returns {Promise<void>}
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
   * Retrieves a CSS property from an element located by CSS or XPath.
   * If more than one element is found - value of first element is returned.
   *
   * ```js
   * const value = await I.grabCssPropertyFrom('h3', 'font-weight');
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   * @param {string} cssProperty CSS property name.
   * @returns {Promise<string>} CSS value
   */
  async grabCssPropertyFrom(locator, cssProperty) {
    const values = await this.grabCssPropertyFromAll(locator, cssProperty)
    if (!values.length) throw new ElementNotFound(locator)
    return values[0]
  }

  /**
   * Retrieves an array of CSS properties from elements located by CSS or XPath.
   *
   * ```js
   * const values = await I.grabCssPropertyFromAll('h3', 'font-weight');
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   * @param {string} cssProperty CSS property name.
   * @returns {Promise<string[]>} array of CSS values
   */
  async grabCssPropertyFromAll(locator, cssProperty) {
    const camelProperty = toCamelCase(cssProperty)
    const res = await this._run(this._candidates(locator), 'cssProps', { props: [camelProperty] })
    if (!res.found) return []
    return res.result.map(props => props[camelProperty])
  }

  /**
   * Checks that all elements matched by locator have the given CSS properties.
   *
   * ```js
   * I.seeCssPropertiesOnElements('h3', { 'font-weight': 'bold', display: 'block' });
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   * @param {object} cssProperties object with CSS properties and their values to check.
   * @returns {Promise<void>}
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
   * Checks that all elements matched by locator have the given attribute values.
   * An expected value is matched either as an exact match or as a regular expression against the actual value.
   *
   * ```js
   * I.seeAttributesOnElements('//form', { method: 'post' });
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   * @param {object} attributes object with attribute names and expected values.
   * @returns {Promise<void>}
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
   * Focuses a given element.
   *
   * ```js
   * I.focus('#name');
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   * @returns {Promise<void>}
   */
  async focus(locator) {
    const armed = this._armActionSettle()
    const res = await this._run(this._candidates(locator), 'focus')
    if (!res.found) throw new ElementNotFound(locator, 'Element to focus')
    return this._waitForAction(armed)
  }

  /**
   * Removes focus from a given element.
   *
   * ```js
   * I.blur('#name');
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   * @returns {Promise<void>}
   */
  async blur(locator) {
    const armed = this._armActionSettle()
    const res = await this._run(this._candidates(locator), 'blur')
    if (!res.found) throw new ElementNotFound(locator, 'Element to blur')
    return this._waitForAction(armed)
  }

  /**
   * Types characters into the currently focused element (as set by `click`, `focus`, etc). Each
   * character dispatches a real `keydown` → `keypress` → (value mutated) → `input` → `keyup`
   * sequence, and mutates a `contenteditable` host's `textContent` instead of `.value`, so this
   * works on rich-text/contenteditable targets as well as `input`/`textarea`. Mirrors Puppeteer's
   * `type(text, options)` semantics.
   *
   * Without a `delay`, every character is dispatched in a single round-trip to the page. With a
   * `delay`, characters are dispatched one round-trip at a time so the requested pause actually
   * elapses between key presses.
   *
   * ```js
   * I.click('Name');
   * I.type('CodeceptJS');
   * I.type(['C', 'o', 'd', 'e']);
   * ```
   *
   * @param {string|string[]} keys characters to type, either as a string or an array of characters.
   * @param {number} [delay] (optional) delay in milliseconds between key presses.
   * @returns {Promise<void>}
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
   * Presses a key or key combination on the currently focused element.
   * Under `options.strict`, a modifier+editing-key combination (e.g. `Ctrl+A`) dispatched with no
   * element focused throws `NonFocusedType`, mirroring `focusCheck.js`'s behavior on other helpers.
   *
   * ```js
   * I.pressKey('Enter');
   * I.pressKey(['Control', 'a']);
   * ```
   *
   * @param {string|string[]} key a key or an array of keys to combine (modifiers first).
   * @returns {Promise<void>}
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
   * Resizes the browser viewport.
   *
   * ```js
   * I.resizeWindow(1024, 768);
   * ```
   *
   * @param {number|'maximize'} width window width, or `'maximize'`.
   * @param {number} [height] window height.
   * @returns {Promise<void>}
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
   * Performs a double-click on an element matched by locator.
   *
   * ```js
   * I.doubleClick('Edit');
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator clickable element located by text, or any element located by CSS|XPath|strict locator.
   * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default, currently ignored by this helper).
   * @returns {Promise<void>}
   */
  async doubleClick(locator, context = null) {
    const armed = this._armActionSettle()
    const res = await this._run(this._candidates(locator, 'clickable'), 'dblclick')
    if (!res.found) throw new ElementNotFound(locator, 'Clickable element')
    return this._waitForAction(armed)
  }

  /**
   * Performs a right-click on an element matched by locator.
   *
   * ```js
   * I.rightClick('Menu');
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator clickable element located by text, or any element located by CSS|XPath|strict locator.
   * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default, currently ignored by this helper).
   * @returns {Promise<void>}
   */
  async rightClick(locator, context = null) {
    const armed = this._armActionSettle()
    const res = await this._run(this._candidates(locator, 'clickable'), 'rightclick')
    if (!res.found) throw new ElementNotFound(locator, 'Clickable element')
    return this._waitForAction(armed)
  }

  /**
   * Clicks at global page coordinates, or at coordinates relative to an element.
   * Dispatches a real CDP mouse click and therefore requires a real layout engine.
   *
   * ```js
   * I.clickXY(100, 200); // global coordinates
   * I.clickXY('#area', 50, 30); // relative to #area
   * ```
   *
   * @param {CodeceptJS.LocatorOrString|number} locator element to click relative to, or a global X coordinate.
   * @param {number} [x] X coordinate relative to element, or global Y coordinate if `locator` is a number.
   * @param {number} [y] Y coordinate relative to element.
   * @returns {Promise<void>}
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
   * Waits for an element to become visible (by default waits for `options.waitForTimeout` seconds).
   *
   * ```js
   * I.waitForVisible('#popup', 5);
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   * @param {number} [sec] (optional, `options.waitForTimeout` by default) time in seconds to wait
   * @returns {Promise<void>}
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
   * Waits for an element to become invisible (by default waits for `options.waitForTimeout` seconds).
   *
   * ```js
   * I.waitForInvisible('#popup', 5);
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   * @param {number} [sec] (optional, `options.waitForTimeout` by default) time in seconds to wait
   * @returns {Promise<void>}
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
   * Waits for an element to be hidden. Alias of `waitForInvisible`.
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   * @param {number} [sec] (optional, `options.waitForTimeout` by default) time in seconds to wait
   * @returns {Promise<void>}
   */
  async waitToHide(locator, sec = null) {
    return this.waitForInvisible(locator, sec)
  }

  /**
   * Waits for an element to be removed from the DOM (by default waits for `options.waitForTimeout` seconds).
   *
   * ```js
   * I.waitForDetached('#popup', 5);
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   * @param {number} [sec] (optional, `options.waitForTimeout` by default) time in seconds to wait
   * @returns {Promise<void>}
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
   * Checks that a cookie with the given name is set.
   *
   * @param {string} name cookie name.
   * @returns {Promise<void>}
   */
  async seeCookie(name) {
    const cookies = await this.grabCookies()
    return empty(`cookie ${name} to be set`).negate(cookies.filter(c => c.name === name))
  }

  /**
   * Checks that a cookie with the given name is not set.
   *
   * @param {string} name cookie name.
   * @returns {Promise<void>}
   */
  async dontSeeCookie(name) {
    const cookies = await this.grabCookies()
    return empty(`cookie ${name} not to be set`).assert(cookies.filter(c => c.name === name))
  }

  /**
   * Waits for a cookie with the given name to be set (by default waits for `options.waitForTimeout` seconds).
   *
   * ```js
   * I.waitForCookie('auth', 5);
   * ```
   *
   * @param {string} name cookie name.
   * @param {number} [sec] (optional, `options.waitForTimeout` by default) time in seconds to wait
   * @returns {Promise<void>}
   */
  async waitForCookie(name, sec = null) {
    const timeout = sec || this.options.waitForTimeout
    return this._poll(async () => (await this.grabCookies()).some(c => c.name === name), timeout, `Cookie ${name} is not found after ${timeout}s`)
  }

  /**
   * Retrieves the inner HTML from an element located by CSS or XPath.
   * If more than one element is found - HTML of first element is returned.
   *
   * ```js
   * let postHTML = await I.grabHTMLFrom('#post');
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   * @returns {Promise<string>} HTML code for an element
   */
  async grabHTMLFrom(locator) {
    const html = await this.grabHTMLFromAll(locator)
    if (!html.length) throw new ElementNotFound(locator)
    return html[0]
  }

  /**
   * Retrieves the inner HTML from elements located by CSS or XPath.
   *
   * ```js
   * let postHTMLs = await I.grabHTMLFromAll('.post');
   * ```
   *
   * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
   * @returns {Promise<string[]>} HTML code for matched elements
   */
  async grabHTMLFromAll(locator) {
    const res = await this._run(this._candidates(locator), 'innerHtml')
    return res.found ? res.result : []
  }

  /**
   * Executes an asynchronous script (callback-style, in the same way `window.setTimeout` works)
   * in the browser context and returns the value passed to `done`.
   *
   * ```js
   * const val = await I.executeAsyncScript(function(val, done) {
   *   setTimeout(() => done(val + 1), 100)
   * }, 5)
   * ```
   *
   * @param {function} fn - an asynchronous function to be executed in the browser context; its last argument is a `done` callback.
   * @param {...any} args - arguments to pass into the function (before `done`).
   * @returns {Promise<any>} the value passed to `done`.
   */
  async executeAsyncScript(fn, ...args) {
    const fnBody = typeof fn === 'function' ? fn.toString() : fn
    return this._evaluate(`new Promise((done) => { (${fnBody})(...${JSON.stringify(args)}, done) })`)
  }

  /**
   * Starts recording network traffic via CDP's `Network.requestWillBeSent`/`responseReceived`
   * events, in the same shape (`{url, method, requestHeaders, requestPostData, response}` per
   * request, `response` a promise of `{url(), status(), statusText(), body()}`) the shared
   * `lib/helper/network` actions expect from Puppeteer/Playwright. The CDP listeners are
   * installed once (lazily) and left in place afterwards, since `CDPConnection` has no listener
   * removal and `this.cdp` is reused across tests; they filter by `this.sessionId`, so only the
   * currently active test/page's requests are recorded.
   *
   * ```js
   * I.startRecordingTraffic();
   * ```
   *
   * @returns {Promise<void>}
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

  /**
   * `Network.requestWillBeSent` handler, pushed into `this.requests` when it belongs to the
   * currently active session and recording is on.
   *
   * @protected
   */
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

  /**
   * `Network.responseReceived` handler, resolving the matching pending `response` promise pushed
   * by `_onTrafficRequest` with a Puppeteer-`HTTPResponse`-like object.
   *
   * @protected
   */
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

  /**
   * `Network.loadingFailed` handler, resolving a still-pending `response` promise to `null`
   * (matching Puppeteer's `request.response()` for a failed request) so `grabRecordedNetworkTraffics`
   * never awaits a promise that would otherwise never settle.
   *
   * @protected
   */
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
   * Stops recording network traffic started by `startRecordingTraffic`. Already-recorded requests
   * in `this.requests` are kept; only new requests stop being appended.
   *
   * ```js
   * I.stopRecordingTraffic();
   * ```
   *
   * @returns {void}
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
   * Starts recording a CDP `Page.startScreencast` session for the current test's target: frames
   * arrive as `Page.screencastFrame` events, are acknowledged immediately (`Page.screencastFrameAck`,
   * required or the browser stops sending more), and buffered in `this._screencastFrames`. The
   * underlying `Page.screencastFrame` listener is installed once (lazily) and left in place, like
   * `startRecordingTraffic`'s listeners, since `CDPConnection` has no listener-removal API; it
   * filters by `this.sessionId` so only the currently active test's frames are buffered. Call
   * `stopScreencast` to end the capture and assemble the buffered frames into an APNG.
   *
   * ```js
   * I.startScreencast();
   * ```
   *
   * @param {object} [options] {maxWidth: number, maxHeight: number, quality: number, everyNthFrame: number} — CDP `Page.startScreencast` pass-throughs. `format` is always `'png'`.
   * @returns {Promise<void>}
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

  /**
   * `Page.screencastFrame` handler: ignores frames from a session other than the currently active
   * one (stale frames from a previous test, since the listener is never removed), acknowledges the
   * frame so the browser keeps sending more, and buffers `{data, timestamp}` for `stopScreencast`
   * to assemble.
   *
   * @protected
   */
  _onScreencastFrame(params, sessionId) {
    if (!this._screencastActive || sessionId !== this.sessionId) return
    this._screencastFrames.push({ data: params.data, timestamp: params.metadata && params.metadata.timestamp })
    this.cdp.send('Page.screencastFrameAck', { sessionId: params.sessionId }, this.sessionId).catch(() => null)
  }

  /**
   * Stops the screencast started by `startScreencast` and assembles the buffered frames into a
   * single APNG (Animated PNG) file, returned as a Buffer. Frame delays are derived from the CDP
   * frame metadata's `timestamp` deltas (frame arrival is activity-driven — Obscura and Chrome both
   * only emit a frame on damage — so this reproduces the actual pacing of what happened, not a
   * fixed frame rate); the last frame is held for `options.lastFrameDelayMs` (default 1000ms) since
   * it has no "next" frame to derive a delay from. Every frame is checked for the PNG signature
   * before assembly — CDP's `format: 'png'` is honored by both Chrome and Obscura (verified
   * directly), but if some other engine ever sends a different format regardless, this reports it
   * via `debugSection` and returns `null` instead of muxing a broken file. Returns `null` if no
   * frames were captured (screencast never started, or stopped immediately after starting).
   *
   * ```js
   * const apngBuffer = await I.stopScreencast();
   * ```
   *
   * @param {object} [options] {lastFrameDelayMs: number} — hold time in milliseconds for the final frame (default 1000).
   * @returns {Promise<object>} a Buffer with the assembled APNG, or null if there was nothing to assemble.
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
