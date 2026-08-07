import { spawn } from 'child_process'
import axios from 'axios'
import CDPBrowser from './CDPBrowser.js'

/**
 * ## Configuration
 *
 * This helper should be configured in codecept.conf.js. It accepts everything `CDPBrowser`
 * accepts (see its config table), plus:
 *
 * @typedef ObscuraConfig
 * @type {object}
 * @prop {string} [binaryPath] - path to the `obscura` executable. When set, `_connect` spawns
 * `obscura serve --port <port> --allow-private-network` before connecting and kills that process
 * in `_finishTest`. When unset, Obscura is assumed to already be running (e.g. started by hand, or
 * by CI) and this helper only connects to it.
 * @prop {number} [port=9222] - port `obscura serve` listens on, and the port used to build the
 * default `endpoint`.
 * @prop {number} [serverStartTimeout=15000] - milliseconds to wait for a spawned `obscura serve`
 * to answer `/json/version` before `_connect` gives up.
 */
const config = {}

/**
 * Obscura drives [Obscura](https://github.com/h4ckf0r0day/obscura), a minimal headless
 * browser built around a single V8 isolate exposed over the Chrome DevTools Protocol. It has no
 * layout, paint, or compositor — pages are parsed into a DOM and scripted, nothing is rendered.
 * That makes it fast and cheap to run in CI, at the cost of anything that depends on rendering.
 *
 * This helper is a thin `CDPBrowser` subclass: it changes nothing about how locating or acting on
 * elements works, it only pins the config presets a V8-isolate-only browser requires and, optionally,
 * spawns/tears down the `obscura serve` process around the test run.
 *
 * ## Install
 *
 * Download a release binary and put it on your `PATH` (or point `binaryPath` at it directly):
 *
 * ```sh
 * curl -sL https://github.com/h4ckf0r0day/obscura/releases/download/v0.1.11/obscura-x86_64-linux.tar.gz | tar xz
 * ```
 *
 * Then either let this helper manage the process (set `binaryPath`), or start it yourself before
 * the test run:
 *
 * ```sh
 * obscura serve --port 9222 --allow-private-network
 * ```
 *
 * `--allow-private-network` is required to reach apps running on `localhost`/private IPs (e.g. a
 * dev server on `127.0.0.1:8000`) — Obscura blocks private-network requests by default.
 *
 * ## Config presets
 *
 * These are set automatically and only need overriding for unusual setups:
 *
 * | option | value | why |
 * | --- | --- | --- |
 * | `endpoint` | `ws://127.0.0.1:<port>/devtools/browser` | Obscura's fixed CDP endpoint |
 * | `input` | `synthetic` | there is no layout, so there are no element coordinates to dispatch real pointer events at; `click` always takes the `forceClick` path — on Obscura, `click` and `forceClick` are the same thing |
 * | `xpathPolyfill` | `true` | Obscura's DOM has no native `document.evaluate` |
 * | `capabilities.layout` | `'none'` | no layout engine, so `seeElement`/`dontSeeElement` throw a clear error instead of silently misbehaving; use `seeElementInDOM`/`dontSeeElementInDOM` |
 * | `capabilities.xpath` | `'polyfill'` | skips runtime probing, since it's already known |
 * | `capabilities.screenshot` | `false` | there is nothing to paint; `saveScreenshot` throws a clear error |
 *
 * ## Limitations
 *
 * Obscura is not a browser replacement — treat it as a scriptable DOM with a network stack:
 *
 * - No screenshots, ever (`saveScreenshot` always throws).
 * - No visibility assertions (`seeElement`/`dontSeeElement` always throw) — only DOM presence
 *   (`seeElementInDOM`/`dontSeeElementInDOM`) is meaningful without a layout engine.
 * - No CSS, no layout, no rendering: anything that depends on computed styles, bounding boxes, or
 *   what a user would actually see on screen cannot be tested here.
 * - Single V8 isolate: heavy or long-running pages, or many pages in parallel against one
 *   `obscura serve` process, compete for the same isolate.
 *
 * <!-- configuration -->
 *
 * ## Example
 *
 * ```js
 * // inside codecept.conf.js
 * {
 *   helpers: {
 *     Obscura: {
 *       url: 'http://localhost',
 *       binaryPath: '/usr/local/bin/obscura',
 *     }
 *   }
 * }
 * ```
 *
 * ## Methods
 */
class Obscura extends CDPBrowser {
  /**
   * @param {ObscuraConfig} config
   */
  constructor(config) {
    super({
      port: 9222,
      input: 'synthetic',
      xpathPolyfill: true,
      ...config,
      capabilities: { layout: 'none', screenshot: false, xpath: 'polyfill', ...(config.capabilities || {}) },
    })
    if (!this.options.endpoint || this.options.endpoint === 'http://127.0.0.1:9222') {
      this.options.endpoint = `ws://127.0.0.1:${this.options.port}/devtools/browser`
    }
    this.serverProcess = null
    this.serverError = null
  }

  /**
   * Spawns `obscura serve` when `options.binaryPath` is set and no server was spawned yet, waits
   * for it to accept connections, then connects as `CDPBrowser._connect` normally would.
   *
   * A spawn failure (e.g. a bad `binaryPath`) is delivered asynchronously by Node as an `error`
   * event; it is recorded on `this.serverError` and surfaced as a rejection from `_waitForServer`
   * instead of crashing the process as an uncaught exception.
   *
   * @protected
   */
  async _connect() {
    if (this.options.binaryPath && !this.serverProcess) {
      this.serverError = null
      this.serverProcess = spawn(this.options.binaryPath, ['serve', '--port', String(this.options.port), '--allow-private-network'], { stdio: 'ignore' })
      this.serverProcess.on('error', err => {
        this.serverError = err
      })
      await this._waitForServer()
    }
    return super._connect()
  }

  /**
   * Polls `http://127.0.0.1:<port>/json/version` until `obscura serve` responds, `this.serverError`
   * is set by the spawned process' `error` event, or `options.serverStartTimeout` elapses.
   *
   * @protected
   */
  async _waitForServer() {
    const timeout = this.options.serverStartTimeout || 15000
    const deadline = Date.now() + timeout
    while (Date.now() < deadline) {
      if (this.serverError) {
        throw new Error(`Failed to start obscura at ${this.options.binaryPath}: ${this.serverError.message}`)
      }
      try {
        await axios.get(`http://127.0.0.1:${this.options.port}/json/version`)
        return
      } catch (e) {
        await new Promise(r => setTimeout(r, 200))
      }
    }
    if (this.serverError) {
      throw new Error(`Failed to start obscura at ${this.options.binaryPath}: ${this.serverError.message}`)
    }
    throw new Error(`obscura serve did not start on port ${this.options.port} within ${timeout}ms`)
  }

  /**
   * Closes the CDP connection (via `CDPBrowser._finishTest`), then kills the `obscura serve`
   * process spawned by `_connect`, if any. Runs in a `finally` so the process is always reaped
   * even if closing the CDP connection throws. Sends `SIGTERM` first and waits for the process to
   * exit; a process that ignores `SIGTERM` is escalated to `SIGKILL` after 5s. The promise only
   * resolves once the child has actually exited (confirmed via the `exit` event, not merely once
   * `SIGKILL` was sent — the kernel needs a moment to reap it), with a final safety-net timeout so
   * a stuck child can never keep the event loop alive even if that confirmation is somehow lost.
   *
   * @protected
   */
  async _finishTest() {
    try {
      await super._finishTest()
    } finally {
      if (this.serverProcess) {
        const proc = this.serverProcess
        this.serverProcess = null
        await new Promise(resolve => {
          if (proc.exitCode !== null || proc.signalCode !== null) {
            resolve()
            return
          }
          let settled = false
          const finish = () => {
            if (settled) return
            settled = true
            clearTimeout(killTimer)
            clearTimeout(safetyTimer)
            resolve()
          }
          proc.once('exit', finish)
          const killTimer = setTimeout(() => proc.kill('SIGKILL'), 5000)
          const safetyTimer = setTimeout(finish, 5500)
          proc.kill()
        })
      }
    }
  }
}

export default Obscura
