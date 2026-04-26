import { setBrowserConfig } from '@codeceptjs/configure'
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
 * Values are coerced: `true`/`false` → boolean, numbers → Number, otherwise string.
 */
export default function (config = {}) {
  const args = config._args || []
  if (!args.length) return

  const opts = {}
  for (const arg of args) {
    if (!arg) continue
    if (arg === 'show') {
      opts.show = true
      continue
    }
    if (arg === 'hide') {
      opts.show = false
      continue
    }
    const eq = arg.indexOf('=')
    if (eq < 0) {
      output.error(`browser plugin: unknown arg "${arg}"`)
      continue
    }
    opts[arg.slice(0, eq)] = coerce(arg.slice(eq + 1))
  }

  if (Object.keys(opts).length === 0) return

  setBrowserConfig(opts)

  const summary = Object.entries(opts).map(([k, v]) => `${k}=${v}`).join(', ')
  output.debug(`browser plugin: applied ${summary}`)
}

function coerce(v) {
  if (v === 'true') return true
  if (v === 'false') return false
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v)
  return v
}
