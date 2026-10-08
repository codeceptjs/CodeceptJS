import CDPBrowser from './CDPBrowser.js'

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
    super({
      input: 'synthetic',
      xpathPolyfill: 'auto',
      ...config,
    })
    this._manageServer(config, {
      name: 'obscura',
      envVar: 'OBSCURA_PATH',
      args: port => ['serve', '--port', String(port), '--allow-private-network', '--allow-file-access'],
      releases: 'https://github.com/h4ckf0r0day/obscura/releases',
    })
  }
}

export default Obscura
