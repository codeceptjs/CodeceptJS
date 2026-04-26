import output from '../output.js'
import Config from '../config.js'

const BROWSER_HELPERS = ['Playwright', 'Puppeteer', 'WebDriver', 'Appium']

const PUPPETEER_BROWSERS = ['chrome', 'firefox']
const PLAYWRIGHT_BROWSERS = ['chromium', 'webkit', 'firefox']

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
 * * **`<key>=<value>`** — sets `helpers.<eachBrowserHelper>.<key> = <value>`. Three keys
 *   get per-helper translation:
 *     * `browser=<name>` — Puppeteer receives `product`, Playwright receives `browser`,
 *       WebDriver receives `browser`. Validated per helper.
 *     * `windowSize=WxH` — sets `windowSize` on each helper, plus `--window-size=W,H`
 *       chromium/chrome args for Playwright/Puppeteer.
 *     * `show=true|false` — sets `show` on Playwright/Puppeteer; injects/strips
 *       `--headless` in WebDriver chrome/firefox capability args.
 *
 * Values are coerced: `true`/`false` → boolean, numbers → Number, otherwise string.
 * Keys whose value is `undefined` are skipped.
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

  Config.addHook(cfg => applyToHelpers(cfg, opts))

  const summary = Object.entries(opts).map(([k, v]) => `${k}=${v}`).join(', ')
  output.debug(`browser plugin: applied ${summary}`)
}

function applyToHelpers(cfg, opts) {
  if (!cfg.helpers) return
  const { browser, show, windowSize, ...rest } = opts

  for (const name of BROWSER_HELPERS) {
    const helper = cfg.helpers[name]
    if (!helper) continue

    if (browser !== undefined && browser !== null && browser !== '') {
      applyBrowser(name, helper, browser)
    }
    if (show === true) applyHeaded(name, helper)
    else if (show === false) applyHeadless(name, helper)
    if (windowSize) applyWindowSize(name, helper, String(windowSize))

    for (const k of Object.keys(rest)) {
      if (rest[k] !== undefined) helper[k] = rest[k]
    }
  }
}

function applyBrowser(helperName, helper, browser) {
  if (helperName === 'Puppeteer') {
    if (!PUPPETEER_BROWSERS.includes(browser)) {
      throw new Error(`Browser ${browser} is not supported by Puppeteer engine`)
    }
    helper.product = browser
    return
  }
  if (helperName === 'Playwright') {
    if (!PLAYWRIGHT_BROWSERS.includes(browser)) {
      throw new Error(`Browser ${browser} is not supported by Playwright engine`)
    }
    helper.browser = browser
    return
  }
  helper.browser = browser
}

function applyHeaded(helperName, helper) {
  if (helperName === 'Playwright' || helperName === 'Puppeteer') {
    helper.show = true
    return
  }
  if (helperName === 'WebDriver') {
    stripHeadlessArgs(helper, 'desiredCapabilities')
    stripHeadlessArgs(helper, 'capabilities')
  }
}

function applyHeadless(helperName, helper) {
  if (helperName === 'Playwright' || helperName === 'Puppeteer') {
    helper.show = false
    return
  }
  if (helperName === 'WebDriver') {
    if (helper.browser === 'chrome') {
      injectHeadlessArgs(helper, 'chromeOptions', ['--headless', '--disable-gpu'])
    } else if (helper.browser === 'firefox') {
      injectHeadlessArgs(helper, 'firefoxOptions', ['--headless'])
    }
  }
}

function applyWindowSize(helperName, helper, windowSize) {
  if (!/^\d+x\d+$/.test(windowSize)) return
  helper.windowSize = windowSize
  const [w, h] = windowSize.split('x')

  if (helperName === 'Playwright') {
    helper.chromium = helper.chromium || {}
    helper.chromium.args = (helper.chromium.args || []).concat(['--no-sandbox', `--window-size=${w},${h}`])
    helper.chromium.defaultViewport = null
    return
  }
  if (helperName === 'Puppeteer') {
    helper.chrome = helper.chrome || {}
    helper.chrome.args = (helper.chrome.args || []).concat(['--no-sandbox', `--window-size=${w},${h}`])
    helper.chrome.defaultViewport = null
  }
}

function injectHeadlessArgs(helper, optsKey, args) {
  helper.desiredCapabilities = helper.desiredCapabilities || {}
  helper.desiredCapabilities[optsKey] = helper.desiredCapabilities[optsKey] || {}
  helper.desiredCapabilities[optsKey].args = (helper.desiredCapabilities[optsKey].args || []).concat(args)
}

function stripHeadlessArgs(helper, capsKey) {
  const caps = helper[capsKey]
  if (!caps) return
  for (const optsKey of ['chromeOptions', 'firefoxOptions']) {
    if (caps[optsKey] && Array.isArray(caps[optsKey].args)) {
      caps[optsKey].args = caps[optsKey].args.filter(a => a !== '--headless')
    }
  }
}

function coerce(v) {
  if (v === 'true') return true
  if (v === 'false') return false
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v)
  return v
}
