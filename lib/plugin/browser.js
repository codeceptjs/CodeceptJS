import output from '../output.js'

/**
 * Overrides browser helper config from the command line. Works for all browser helpers
 * (Playwright, Puppeteer, WebDriver, Appium) without touching `codecept.conf`.
 *
 * Enable it via `-p` option with one or more colon-chained args:
 *
 * ```
 * npx codeceptjs run -p browser:show
 * npx codeceptjs run -p browser:hide
 * npx codeceptjs run -p browser:browser=firefox
 * npx codeceptjs run -p browser:windowSize=1024x768:video=false
 * npx codeceptjs run -p browser:hide:browser=webkit:windowSize=800x600
 * ```
 *
 * #### Args
 *
 * * **show** — force visible browser
 * * **hide** — force headless (also injects `--headless` into WebDriver chrome/firefox capability args)
 * * **`<key>=<value>`** — set `helpers.<eachBrowserHelper>.<key> = <value>`. Three keys
 *   get per-helper translation via `setBrowserConfig`:
 *     * `browser=<name>` — Puppeteer receives `product`, Playwright receives `browser`
 *     * `windowSize=WxH` — also adds `--window-size=W,H` chromium/chrome args
 *     * `show=true|false` — toggles `show` on Playwright/Puppeteer; injects/strips
 *       `--headless` in WebDriver chrome/firefox capability args
 *
 * Values stay as strings. `true` / `false` are coerced to booleans.
 *
 * Requires `@codeceptjs/configure` to be installed; if missing, the plugin
 * logs a hint and skips the override.
 */
export default async function (config = {}) {
  const { _args, enabled, ...rest } = config
  const opts = { ...rest, ...parseArgs(_args || []) }
  if (Object.keys(opts).length === 0) return

  const configure = await tryImportConfigure()
  if (!configure) return

  configure.setBrowserConfig(opts)
  output.debug(`browser plugin: applied ${formatOpts(opts)}`)
}

async function tryImportConfigure() {
  try {
    return await import('@codeceptjs/configure')
  } catch (err) {
    output.error("browser plugin: '@codeceptjs/configure' is not installed; CLI overrides are skipped. Run `npm i @codeceptjs/configure` to enable.")
    return null
  }
}

function parseArgs(args) {
  return args.filter(Boolean).reduce((acc, arg) => Object.assign(acc, parseArg(arg)), {})
}

function parseArg(arg) {
  if (arg === 'show') return { show: true }
  if (arg === 'hide') return { show: false }
  if (arg.includes('=')) {
    const [key, ...rest] = arg.split('=')
    return { [key]: parseValue(rest.join('=')) }
  }
  output.error(`browser plugin: unknown arg "${arg}"`)
  return {}
}

function parseValue(v) {
  if (v === 'true') return true
  if (v === 'false') return false
  return v
}

function formatOpts(opts) {
  return Object.entries(opts).map(([k, v]) => `${k}=${v}`).join(', ')
}
