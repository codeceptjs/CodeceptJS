import CDPBrowser from './CDPBrowser.js'

/**
 * ## Configuration
 *
 * This helper should be configured in codecept.conf.js
 *
 * @typedef MoliConfig
 * @type {object}
 * @prop {string} [endpoint] - explicit CDP endpoint. Setting this switches the helper to ATTACH
 * mode: it only connects, and never spawns or kills a process, no matter what else is configured.
 * Leave it unset for SELF-MANAGED mode (see below).
 * @prop {string} [binaryPath] - path to the `moli` executable, used in SELF-MANAGED mode
 * (`endpoint` unset). Checked before `MOLI_PATH` and `PATH`.
 * @prop {number} [port] - port `moli serve` listens on, in SELF-MANAGED mode. When unset, a free
 * port is picked automatically, which is what makes `run-workers` collision-free — every worker
 * gets its own instance on its own port with zero config.
 * @prop {number} [serverStartTimeout=15000] - milliseconds to wait for a spawned `moli serve` to
 * answer `/json/version` before `_connect` gives up.
 */
const config = {}

/**
 * Moli drives [Moli](https://github.com/lexmount/moli), an open-source headless browser written
 * in Rust for automation, exposed over the Chrome DevTools Protocol. It runs real JavaScript in V8
 * and computes styles with Servo's Stylo, but by default skips layout and painting: element boxes
 * use deterministic placeholder geometry, so there are no screenshots and no coordinate input.
 *
 * This helper is a thin `CDPBrowser` subclass: it changes nothing about how locating or acting on
 * elements works, it only pins the config presets Moli requires and manages the `moli serve`
 * process lifecycle, the same way Playwright manages its own browser process.
 *
 * > Moli support is experimental. Pin the browser version in CI and keep a
 * > Playwright/WebDriver job for browser-compatibility coverage.
 *
 * ## Modes
 *
 * - **ATTACH** — `endpoint` is set explicitly in the config. The helper only connects to it; it
 *   never spawns or kills anything, no matter what `binaryPath`/`port` are set to.
 * - **SELF-LAUNCH** — `endpoint` is unset and a binary can be resolved, in order: `binaryPath` in
 *   the config, then the `MOLI_PATH` environment variable, then `moli` on `PATH`. The helper
 *   spawns `moli serve --host 127.0.0.1 --port <port>` (`port` from the config, or a free port
 *   picked automatically), waits for it to answer, connects, and kills it in `_finishTest`.
 * - **COURTESY-ATTACH** — `endpoint` is unset and no binary can be resolved, but something already
 *   answers `http://127.0.0.1:9222/json/version` (e.g. `moli serve` started by hand). The helper
 *   attaches to it and never kills it. If neither a binary nor a running server on :9222 can be
 *   found, the helper throws a loud, actionable error.
 *
 * ## Install
 *
 * Follow the [official installation instructions](https://github.com/lexmount/moli#direct-installation),
 * then put `moli` on your `PATH`, or point `binaryPath`/`MOLI_PATH` at it. The helper then
 * launches and tears it down automatically.
 *
 * ## Config presets
 *
 * These are set automatically and only need overriding for unusual setups:
 *
 * | option | value | why |
 * | --- | --- | --- |
 * | `input` | `synthetic` | without layout Moli rejects coordinate mouse input, so `click` always takes the `forceClick` path |
 * | `xpathPolyfill` | `auto` | probed per binary/page |
 * | `capabilities.layout` | `real` | Moli computes real styles and gives displayed elements a non-empty placeholder box, which is enough for `seeElement` and the `waitForVisible` family; it is pinned because the runtime probe would also enable coordinate input |
 * | `capabilities.screenshot` | `false` | screenshots require `moli serve --layout`, which this helper does not use: its layout is a snapshot that goes stale when the page changes |
 *
 * ## Limitations
 *
 * - No screenshots and no screencast: `saveScreenshot` and `saveElementScreenshot` do nothing (a debug message is printed).
 * - No coordinate-based input (`clickXY`).
 * - No frames or popups.
 * - Uploaded files are sent as `application/octet-stream` regardless of their extension.
 * - The default stylesheet does not color links: `a` computes `color: rgb(0, 0, 0)`.
 *
 * <!-- configuration -->
 *
 * ## Example
 *
 * ```js
 * // inside codecept.conf.js — SELF-LAUNCH mode (recommended): the helper finds/starts/stops
 * // moli serve on its own, on a free port. Ideal for run-workers: every worker gets its own
 * // instance with no config.
 * {
 *   helpers: {
 *     Moli: {
 *       url: 'http://localhost',
 *     }
 *   }
 * }
 * ```
 *
 * ```js
 * // ATTACH mode — connect to a Moli instance you manage yourself (remote host, container, etc.)
 * {
 *   helpers: {
 *     Moli: {
 *       url: 'http://localhost',
 *       endpoint: 'http://127.0.0.1:9222',
 *     }
 *   }
 * }
 * ```
 *
 * ## Methods
 */
class Moli extends CDPBrowser {
  /**
   * @param {MoliConfig} config
   */
  constructor(config) {
    super({
      input: 'synthetic',
      xpathPolyfill: 'auto',
      ...config,
      capabilities: { layout: 'real', screenshot: false, ...((config && config.capabilities) || {}) },
    })
    this._manageServer(config, {
      name: 'moli',
      envVar: 'MOLI_PATH',
      args: port => ['serve', '--host', '127.0.0.1', '--port', String(port)],
      releases: 'https://github.com/lexmount/moli/releases',
    })
  }
}

export default Moli
