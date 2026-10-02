import CDPBrowser from './CDPBrowser.js'

/**
 * ## Configuration
 *
 * This helper should be configured in codecept.conf.js
 *
 * @typedef LightpandaConfig
 * @type {object}
 * @prop {string} [endpoint] - explicit CDP endpoint. Setting this switches the helper to ATTACH
 * mode: it only connects, and never spawns or kills a process, no matter what else is configured.
 * Leave it unset for SELF-MANAGED mode (see below).
 * @prop {string} [binaryPath] - path to the `lightpanda` executable, used in SELF-MANAGED mode
 * (`endpoint` unset). Checked before `LIGHTPANDA_PATH` and `PATH`.
 * @prop {number} [port] - port `lightpanda serve` listens on, in SELF-MANAGED mode. When unset, a
 * free port is picked automatically, which is what makes `run-workers` collision-free — every
 * worker gets its own instance on its own port with zero config.
 * @prop {number} [serverStartTimeout=15000] - milliseconds to wait for a spawned `lightpanda serve`
 * to answer `/json/version` before `_connect` gives up.
 */
const config = {}

/**
 * Lightpanda drives [Lightpanda](https://lightpanda.io), a headless browser written from scratch
 * for automation, exposed over the Chrome DevTools Protocol. It executes real JavaScript in V8 and
 * implements the DOM and Web APIs, but has no graphical rendering engine: nothing is ever painted,
 * so there are no screenshots.
 *
 * This helper is a thin `CDPBrowser` subclass: it changes nothing about how locating or acting on
 * elements works, it only pins the config presets Lightpanda requires and manages the
 * `lightpanda serve` process lifecycle, the same way Playwright manages its own browser process.
 *
 * > Lightpanda support is experimental. Pin the browser version in CI and keep a
 * > Playwright/WebDriver job for browser-compatibility coverage.
 *
 * ## Compatibility
 *
 * | CodeceptJS | Recommended Lightpanda | Notes |
 * | --- | --- | --- |
 * | 4.2.x | 1.0.0 | Version used by the CodeceptJS Lightpanda CI workflow |
 *
 * ## Modes
 *
 * - **ATTACH** — `endpoint` is set explicitly in the config. The helper only connects to it; it
 *   never spawns or kills anything, no matter what `binaryPath`/`port` are set to.
 * - **SELF-LAUNCH** — `endpoint` is unset and a binary can be resolved, in order: `binaryPath` in
 *   the config, then the `LIGHTPANDA_PATH` environment variable, then `lightpanda` on `PATH`. The
 *   helper spawns `lightpanda serve --host 127.0.0.1 --port <port>` (`port` from the config, or a
 *   free port picked automatically), waits for it to answer, connects, and kills it in
 *   `_finishTest`.
 * - **COURTESY-ATTACH** — `endpoint` is unset and no binary can be resolved, but something already
 *   answers `http://127.0.0.1:9222/json/version` (e.g. `lightpanda serve` started by hand, or the
 *   `lightpanda/browser` Docker image). The helper attaches to it and never kills it. If neither a
 *   binary nor a running server on :9222 can be found, the helper throws a loud, actionable error.
 *
 * ## Install
 *
 * Download a binary from [Lightpanda releases](https://github.com/lightpanda-io/browser/releases).
 * CodeceptJS is tested with Lightpanda 1.0.0. Binaries are available for:
 *
 * | platform | binary |
 * | --- | --- |
 * | Linux x64 | `lightpanda-x86_64-linux` |
 * | Linux ARM64 | `lightpanda-aarch64-linux` |
 * | macOS Intel | `lightpanda-x86_64-macos` |
 * | macOS Apple Silicon | `lightpanda-aarch64-macos` |
 *
 * There is no native Windows binary; use WSL2. Linux binaries require glibc.
 *
 * Put `lightpanda` on your `PATH`, or point `binaryPath`/`LIGHTPANDA_PATH` at it. The helper then
 * launches and tears it down automatically. For example, on Linux x64:
 *
 * ```sh
 * curl -L -o lightpanda https://github.com/lightpanda-io/browser/releases/download/1.0.0/lightpanda-x86_64-linux
 * chmod +x lightpanda
 * ```
 *
 * Lightpanda sends usage telemetry by default. This helper always spawns it with
 * `LIGHTPANDA_DISABLE_TELEMETRY=true`; set that variable yourself when you start the server by hand.
 *
 * Lightpanda is licensed under AGPL-3.0. It runs as a separate process that CodeceptJS talks to
 * over a WebSocket, so it does not change the license of CodeceptJS or of your tests.
 *
 * ## Config presets
 *
 * These are set automatically and only need overriding for unusual setups:
 *
 * | option | value | why |
 * | --- | --- | --- |
 * | `input` | `synthetic` | nothing is painted, so coordinates are not hit-tested; `click` always takes the `forceClick` path |
 * | `xpathPolyfill` | `auto` | probed per binary/page |
 * | `capabilities.layout` | `real` | Lightpanda computes visibility-related styles and element boxes without painting, which is enough for `seeElement` and the `waitForVisible` family; it is pinned because the runtime layout probe cannot run on Lightpanda's `about:blank` |
 * | `capabilities.screenshot` | `false` | there is no rendering engine |
 *
 * ## Limitations
 *
 * - No screenshots and no screencast: `saveScreenshot` throws.
 * - No frames or popups.
 * - No scrolling: scroll positions always stay at 0.
 * - Computed styles cover what visibility checks need (`display`, `visibility`, `opacity`,
 *   `pointer-events`); `grabCssPropertyFrom` and `seeCssPropertiesOnElements` are unreliable for
 *   other properties.
 * - No coordinate-based input (`clickXY`).
 * - No clipboard access.
 * - Some rich text editors (TinyMCE, Trix, Monaco) never finish initialising.
 *
 * <!-- configuration -->
 *
 * ## Example
 *
 * ```js
 * // inside codecept.conf.js — SELF-LAUNCH mode (recommended): the helper finds/starts/stops
 * // lightpanda serve on its own, on a free port. Ideal for run-workers: every worker gets its
 * // own instance with no config.
 * {
 *   helpers: {
 *     Lightpanda: {
 *       url: 'http://localhost',
 *     }
 *   }
 * }
 * ```
 *
 * ```js
 * // ATTACH mode — connect to a Lightpanda instance you manage yourself (remote host, container, etc.)
 * {
 *   helpers: {
 *     Lightpanda: {
 *       url: 'http://localhost',
 *       endpoint: 'http://127.0.0.1:9222',
 *     }
 *   }
 * }
 * ```
 *
 * ## Methods
 */
class Lightpanda extends CDPBrowser {
  /**
   * @param {LightpandaConfig} config
   */
  constructor(config) {
    super({
      input: 'synthetic',
      xpathPolyfill: 'auto',
      ...config,
      capabilities: { layout: 'real', screenshot: false, ...((config && config.capabilities) || {}) },
    })
    this._manageServer(config, {
      name: 'lightpanda',
      envVar: 'LIGHTPANDA_PATH',
      args: port => ['serve', '--host', '127.0.0.1', '--port', String(port)],
      env: { LIGHTPANDA_DISABLE_TELEMETRY: 'true' },
      releases: 'https://github.com/lightpanda-io/browser/releases',
    })
  }
}

export default Lightpanda
