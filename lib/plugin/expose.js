import Container from '../container.js'

const RESERVED_NAMES = new Set(['I', 'test', 'suite'])
const SHORTHAND_PROPERTIES = new Set(['page', 'browser', 'browserContext', 'context'])

const defaultConfig = {
  inject: {},
}

/**
 * Exposes properties from helper instances as injectable test arguments.
 * Use it to access the underlying Playwright/Puppeteer `page`, the wdio `browser` client,
 * or any other helper internal directly from a Scenario:
 *
 * ```js
 * Scenario('listen for requests', async ({ I, page, browser }) => {
 *   page.on('request', r => console.log(r.url()))
 *   await page.evaluate(() => 1 + 1)
 *   I.amOnPage('/')
 * })
 * ```
 *
 * The injected value is a live proxy: every property access reads the *current*
 * helper property, so mid-test reassignments (popups, `switchToNextTab`,
 * `openNewTab`) are reflected automatically. Calls are not wrapped as
 * CodeceptJS steps — `await page.evaluate(...)` runs as native Playwright.
 *
 * #### Configuration
 *
 * `inject` maps an injection name to a `HelperName.propertyName` string. A
 * value with no dot is shorthand for "first configured browser helper that
 * exposes this property" (allowed properties: `page`, `browser`,
 * `browserContext`, `context`).
 *
 * ```js
 * plugins: {
 *   expose: {
 *     enabled: true,
 *     inject: {
 *       page: 'Playwright.page',
 *       browser: 'Playwright.browser',
 *       browserContext: 'Playwright.browserContext',
 *       frame: 'Playwright.context',  // current frame set by switchTo
 *       wdio: 'WebDriver.browser',
 *     }
 *   }
 * }
 * ```
 *
 * Shorthand:
 *
 * ```js
 * plugins: {
 *   expose: {
 *     enabled: true,
 *     inject: {
 *       page: 'page',  // resolves to Playwright.page or Puppeteer.page
 *     }
 *   }
 * }
 * ```
 *
 * #### Caveats
 *
 * - The injected value is a `Proxy`, not the actual `Page`/`Browser` instance,
 *   so `page instanceof Page` is `false`. Use duck typing instead.
 * - Cached method references lose the live binding. Call `page.click(...)`,
 *   not `const click = page.click; click(...)`.
 * - In dry-run mode the underlying helper property is `undefined`; accessing
 *   any property on the proxy returns `undefined` rather than throwing.
 */
export default function (config = {}) {
  config = { ...defaultConfig, ...config }

  const mappings = parseMappings(config.inject)

  const support = {}
  for (const [name, { helperName, property }] of Object.entries(mappings)) {
    support[name] = makeLiveProxy(helperName, property)
  }
  Container.append({ support })
}

function parseMappings(inject) {
  const out = {}
  for (const [name, value] of Object.entries(inject || {})) {
    if (RESERVED_NAMES.has(name)) {
      throw new Error(`expose plugin: inject name '${name}' is reserved`)
    }
    if (typeof value !== 'string' || !value) {
      throw new Error(`expose plugin: inject value for '${name}' must be a non-empty string`)
    }

    let helperName
    let property

    if (value.includes('.')) {
      const dot = value.indexOf('.')
      helperName = value.slice(0, dot)
      property = value.slice(dot + 1)
      if (!helperName || !property) {
        throw new Error(`expose plugin: invalid inject value '${value}' for '${name}' (expected 'HelperName.propertyName')`)
      }
      if (!Container.helpers(helperName)) {
        throw new Error(`expose plugin: helper '${helperName}' is not configured (needed for inject '${name}')`)
      }
    } else {
      property = value
      if (!SHORTHAND_PROPERTIES.has(property)) {
        throw new Error(`expose plugin: shorthand '${property}' is not a known helper property for '${name}' (use 'HelperName.${property}' instead)`)
      }
      helperName = Container.STANDARD_ACTING_HELPERS.find(h => Container.helpers(h))
      if (!helperName) {
        throw new Error(`expose plugin: no standard browser helper configured (needed for inject '${name}')`)
      }
    }

    out[name] = { helperName, property }
  }
  return out
}

function makeLiveProxy(helperName, property) {
  const resolve = () => Container.helpers(helperName)?.[property]
  return new Proxy(function () {}, {
    get(_, prop) {
      const target = resolve()
      if (target == null) return undefined
      const value = target[prop]
      if (typeof value === 'function') return value.bind(target)
      return value
    },
    has(_, prop) {
      const target = resolve()
      return target != null && prop in target
    },
    apply(_, thisArg, args) {
      const target = resolve()
      return target?.apply(thisArg, args)
    },
    set(_, prop, value) {
      const target = resolve()
      if (target != null) target[prop] = value
      return true
    },
    getPrototypeOf() {
      const target = resolve()
      return target != null ? Object.getPrototypeOf(target) : null
    },
    ownKeys() {
      const target = resolve()
      return target != null ? Reflect.ownKeys(target) : []
    },
    getOwnPropertyDescriptor(_, prop) {
      const target = resolve()
      return target != null ? Object.getOwnPropertyDescriptor(target, prop) : undefined
    },
  })
}
