import { spawn } from 'child_process'
import fs from 'fs'
import net from 'net'
import path from 'path'
import axios from 'axios'
import CDPBrowser from './CDPBrowser.js'
import { isFile, isWindows } from '../utils.js'

/**
 * ## Configuration
 *
 * This helper should be configured in codecept.conf.js
 *
 * @typedef ObscuraConfig
 * @type {object}
 * @prop {string} [endpoint] - connect to a running Obscura instead of starting one (ATTACH mode).
 * @prop {string} [binaryPath] - path to the `obscura` executable. Checked before `OBSCURA_PATH` and `PATH`.
 * @prop {number} [port] - port for `obscura serve`. A free port is picked when unset, so parallel workers never collide.
 * @prop {number} [serverStartTimeout=15000] - how long to wait for `obscura serve` to start, in milliseconds.
 */
const config = {}

/**
 * Obscura drives [Obscura](https://github.com/h4ckf0r0day/obscura), a lightweight headless
 * browser controlled over the Chrome DevTools Protocol. Default builds from v0.2.0 render pages
 * (layout, screenshots); `-no-render` builds and v0.1.x run JavaScript and the DOM only. The helper
 * detects which build it runs against, so the same config works for both.
 *
 * The helper starts and stops `obscura serve` for you, the same way Playwright manages its browser.
 *
 * > Obscura support is experimental in CodeceptJS 4.2. Pin the browser version in CI and keep a
 * > Playwright/WebDriver job for browser-compatibility coverage.
 *
 * ## Compatibility
 *
 * | CodeceptJS | Recommended Obscura | Notes |
 * | --- | --- | --- |
 * | 4.2.x | 0.2.2 | Version used by the CodeceptJS Obscura CI workflow |
 * | 4.2.x | 0.2.x | Supported; capabilities are detected at runtime |
 * | 4.2.x | 0.1.x / `-no-render` | DOM-only mode; no layout, visibility assertions, or screenshots |
 *
 * ## Modes
 *
 * - **ATTACH** — `endpoint` is set explicitly in the config. The helper only connects to it; it
 *   never spawns or kills anything, no matter what `binaryPath`/`port` are set to.
 * - **SELF-LAUNCH** — `endpoint` is unset and a binary can be resolved, in order: `binaryPath` in
 *   the config, then the `OBSCURA_PATH` environment variable, then `obscura` on `PATH`. The helper
 *   spawns `obscura serve --port <port> --allow-private-network --allow-file-access` (`port` from
 *   the config, or a free port picked automatically), waits for it to answer, connects, and stops
 *   it when tests finish.
 * - **COURTESY-ATTACH** — `endpoint` is unset and no binary can be resolved, but something already
 *   answers `http://127.0.0.1:9222/json/version` (e.g. `obscura serve` started by hand, or by CI
 *   before this process ever ran). The helper attaches to it and never kills it — it isn't the
 *   helper's process to kill. If neither a binary nor a running server on :9222 can be found, the
 *   helper throws a loud, actionable error.
 *
 * ## Install
 *
 * Download a release archive from [Obscura releases](https://github.com/h4ckf0r0day/obscura/releases).
 * CodeceptJS 4.2 is tested with Obscura 0.2.2. Rendering archives are available for:
 *
 * | platform | archive |
 * | --- | --- |
 * | Linux x64 | `obscura-x86_64-linux.tar.gz` |
 * | Linux ARM64 | `obscura-aarch64-linux.tar.gz` |
 * | macOS Intel | `obscura-x86_64-macos.tar.gz` |
 * | macOS Apple Silicon | `obscura-aarch64-macos.tar.gz` |
 * | Windows x64 | `obscura-x86_64-windows.zip` |
 *
 * Extract the archive and put `obscura` (`obscura.exe` on Windows) on your `PATH`, or point
 * `binaryPath`/`OBSCURA_PATH` at it. The helper then launches and tears it down automatically.
 * For example, on Linux x64:
 *
 * ```sh
 * curl -sL https://github.com/h4ckf0r0day/obscura/releases/download/v0.2.2/obscura-x86_64-linux.tar.gz | tar xz
 * ```
 *
 * `--allow-private-network` and `--allow-file-access` are always passed by this helper: the first
 * is required to reach apps running on `localhost`/private IPs, e.g. a dev server on
 * `127.0.0.1:8000`, the second to let `attachFile` upload local files. Obscura blocks both by
 * default.
 *
 * ## Config presets
 *
 * These are set automatically and only need overriding for unusual setups:
 *
 * | option | value | why |
 * | --- | --- | --- |
 * | `input` | `synthetic` | clicks that navigate are unreliable in Obscura, so `click` behaves like `forceClick` |
 * | `xpathPolyfill` | `auto` | Obscura's XPath lacks attribute selection and `not()`, so the polyfill is used when needed |
 *
 * `capabilities` are detected at runtime from the Obscura build. Set them in your config to skip
 * detection or to force a mode.
 *
 * ## Limitations
 *
 * - `input` is always `synthetic`, even on rendering builds — see `input` above.
 * - No frames or popups.
 * - On `-no-render` builds and v0.1.x: no screenshots, no visibility assertions
 *   (`seeElement`/`dontSeeElement` always throw) — only DOM presence
 *   (`seeElementInDOM`/`dontSeeElementInDOM`) is meaningful without a layout engine.
 * - On v0.2.0+ default (rendering) builds: layout, screenshots, and CSS work, but it's a new,
 *   independently implemented rendering/CSS engine — expect edge cases and gaps versus a real browser.
 * - Single V8 isolate: heavy or long-running pages, or many pages in parallel against one
 *   `obscura serve` process, compete for the same isolate.
 *
 * <!-- configuration -->
 *
 * ## Example
 *
 * ```js
 * // inside codecept.conf.js — SELF-LAUNCH mode (recommended): the helper finds/starts/stops
 * // obscura serve on its own, on a free port. Ideal for run-workers: every worker gets its own
 * // instance with no config.
 * {
 *   helpers: {
 *     Obscura: {
 *       url: 'http://localhost',
 *     }
 *   }
 * }
 * ```
 *
 * ```js
 * // ATTACH mode — connect to an Obscura instance you manage yourself (remote host, container, etc.)
 * {
 *   helpers: {
 *     Obscura: {
 *       url: 'http://localhost',
 *       endpoint: 'http://127.0.0.1:9222',
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
    const explicitEndpoint = !!(config && config.endpoint)
    super({
      input: 'synthetic',
      xpathPolyfill: 'auto',
      ...config,
    })
    this.mode = explicitEndpoint ? 'attach' : 'self-managed'
    if (!explicitEndpoint) {
      this.options.endpoint = null
    }
    this.serverProcess = null
    this.serverError = null
    this.binaryPath = null
    this._selfManagedResolved = false
  }

  async _connect() {
    if (this.mode !== 'attach' && !this._selfManagedResolved) {
      await this._resolveSelfManaged()
      this._selfManagedResolved = true
    }
    return super._connect()
  }

  async _resolveSelfManaged() {
    const binaryPath = this._resolveBinary()
    if (binaryPath) {
      this.binaryPath = binaryPath
      const port = this.options.port || (await this._findFreePort())
      this.options.port = port
      this.serverError = null
      this.serverProcess = spawn(binaryPath, ['serve', '--port', String(port), '--allow-private-network', '--allow-file-access'], { stdio: 'ignore' })
      this.serverProcess.on('error', err => {
        this.serverError = err
      })
      await this._waitForServer()
      this.options.endpoint = `ws://127.0.0.1:${port}/devtools/browser`
      return
    }
    if (await this._probeUp('http://127.0.0.1:9222/json/version')) {
      this.debugSection('Obscura', 'no binaryPath/OBSCURA_PATH/obscura-on-PATH found — courtesy-attaching to an already-running obscura serve on 127.0.0.1:9222 (this helper will not manage or kill it)')
      this.options.endpoint = 'http://127.0.0.1:9222'
      return
    }
    throw new Error(
      [
        'Obscura has no endpoint configured, no binary could be resolved (checked config.binaryPath, OBSCURA_PATH, and PATH), and nothing answered http://127.0.0.1:9222/json/version.',
        'Start it yourself:  obscura serve --port 9222 --allow-private-network',
        'Or let this helper launch it: put a release binary on PATH, set OBSCURA_PATH=/path/to/obscura, or pass binaryPath in the config.',
        'Releases: https://github.com/h4ckf0r0day/obscura/releases',
      ].join('\n  '),
    )
  }

  _resolveBinary() {
    if (this.options.binaryPath) return this.options.binaryPath
    if (process.env.OBSCURA_PATH) return process.env.OBSCURA_PATH
    const windows = isWindows()
    const extensions = windows ? (process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(';') : ['']
    for (const entry of (process.env.PATH || '').split(path.delimiter)) {
      const dir = windows ? entry.replace(/^"|"$/g, '') : entry
      if (!dir) continue
      for (const extension of extensions) {
        const candidate = path.join(dir, `obscura${extension}`)
        if (!isFile(candidate)) continue
        try {
          fs.accessSync(candidate, fs.constants.X_OK)
          return candidate
        } catch (e) {
          continue
        }
      }
    }
    return null
  }

  async _findFreePort() {
    return new Promise((resolve, reject) => {
      const srv = net.createServer()
      srv.unref()
      srv.on('error', reject)
      srv.listen(0, '127.0.0.1', () => {
        const { port } = srv.address()
        srv.close(() => resolve(port))
      })
    })
  }

  async _probeUp(url) {
    try {
      await axios.get(url, { timeout: 1000 })
      return true
    } catch (e) {
      return false
    }
  }

  async _waitForServer() {
    const timeout = this.options.serverStartTimeout || 15000
    const deadline = Date.now() + timeout
    while (Date.now() < deadline) {
      if (this.serverError) {
        throw new Error(`Failed to start obscura at ${this.binaryPath}: ${this.serverError.message}`)
      }
      try {
        await axios.get(`http://127.0.0.1:${this.options.port}/json/version`)
        return
      } catch (e) {
        await new Promise(r => setTimeout(r, 20))
      }
    }
    if (this.serverError) {
      throw new Error(`Failed to start obscura at ${this.binaryPath}: ${this.serverError.message}`)
    }
    throw new Error(`obscura serve did not start on port ${this.options.port} within ${timeout}ms`)
  }

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
