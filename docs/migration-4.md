---
permalink: /migration-4
title: Migrating from 3.x to 4.x
---

# Migrating from 3.x to 4.x

CodeceptJS 4.x is a major release. It moves the codebase from CommonJS to native ESM, drops several long-deprecated helpers and plugins, replaces legacy plugins with first-class APIs, and bumps most third-party dependencies.

## Migrate Automatically with an Agent

The fastest way to upgrade is to let an AI agent do it. This release is mechanical enough that an agent handles most of it end-to-end.

Install CodeceptJS 4:

```bash
npm install codeceptjs@4
```

Then install the skills bundle. It works the same in Claude Code or any other agent:

```bash
npx skills add codeceptjs/skills
```

The bundle ships a `migrate-codeceptjs-4` skill. Point an agent at the project and run it:

```bash
claude "/migrate-codeceptjs-4"
```

It reads your config and tests, applies the mechanical changes, runs the suite, and fixes what breaks.

The rest of this guide documents every change the skill makes — read it if you prefer to migrate by hand, or to review what the agent did.

## 1. Update Node and Package

CodeceptJS 4.x supports Node 16+, but Node 20 or newer is recommended.

```bash
npm install codeceptjs@4
```

If you write tests in TypeScript, install `tsx`:

```bash
npm install --save-dev tsx
```

> 4.x replaces `ts-node/esm` with `tsx`. `ts-node/esm` is no longer recommended and emits a warning.

## 2. Switch Your Project to ESM

CodeceptJS 4.x ships as native ESM (`"type": "module"`). **Convert your project to ESM**.
Add to your `package.json`:

```json
{
  "type": "module"
}
```

Then convert your config, page objects, and custom helpers to ESM (sections below).


### Convert Custom Helpers

3.x:

```js
const Helper = require('@codeceptjs/helper')

class MyHelper extends Helper {
  doSomething() { /* ... */ }
}

module.exports = MyHelper
```

4.x:

```js
import Helper from '@codeceptjs/helper'

class MyHelper extends Helper {
  doSomething() { /* ... */ }
}

export default MyHelper
```

### Convert Page Objects

Replace `module.exports = { ... }` with `export default { ... }`.

Page objects gain new lifecycle hooks in 4.x: `_before`, `_after`, `_afterSuite`. They run automatically around suites that include the page object.

### Convert Programmatic Usage

3.x:

```js
const { codecept, container, event } = require('codeceptjs')
```

4.x:

```js
import codeceptjs, { container, event } from 'codeceptjs'
```

`Container.create()` and `Config.load()` are now **async**. Await them:

```js
const config = await Config.load('./codecept.conf.js')
await Container.create(config, opts)
```

## 3. Remove Helpers That No Longer Exist

| Removed helper | What to do |
|----------------|------------|
| `Nightmare` | Switch to `Playwright`, `Puppeteer`, or `WebDriver`. Nightmare is unmaintained; `Playwright` is the closest drop-in for headless flows. |
| `Protractor` | Switch to `Playwright` or `WebDriver`. Angular apps work without the Protractor-specific waits — use `waitForElement`/`waitForClickable`. |
| `TestCafe` | Switch to `Playwright`. |
| `AI` | Use the top-level `ai:` config option and the new `aiTrace` plugin. |
| `SoftExpectHelper` | Use the `hopeThat` effect instead — see below. |
| `Mochawesome` | Removed. Use the [Testomat.io Reporter](https://github.com/testomatio/reporter) HTML pipe for HTML reports — see below. |

`Container.STANDARD_ACTING_HELPERS` no longer lists `TestCafe`.

If you relied on a removed helper for behavior none of the built-in helpers cover, **write a custom helper**. A helper is a plain class extending `@codeceptjs/helper`; you can wrap any Node library and expose `I.*` actions. See [Custom Helpers](/helpers).

```js
import Helper from '@codeceptjs/helper'

class MyHelper extends Helper {
  async doSomething() { /* wrap any library here */ }
}

export default MyHelper
```

### `SoftExpectHelper` → `hopeThat`

3.x shipped a `SoftExpectHelper` (`I.softAssert`, `I.softExpectEqual`, `I.flushSoftAssertions`, etc.) for soft assertions. It is gone in 4.x. Use the `hopeThat` effect — it works with **any** assertion that throws (built-in `I.see*`, your custom helper, `expect` from chai/jest, Node's `assert`).

3.x:

```js
helpers: { SoftExpectHelper: {} }

// in scenario
I.softExpectEqual(user.name, 'jon')
I.softExpectContain(emails, 'jon@doe.com')
I.flushSoftAssertions()
```

4.x:

```js
import { hopeThat } from 'codeceptjs/effects'

await hopeThat(() => assert.strictEqual(user.name, 'jon'))
await hopeThat(() => assert.ok(emails.includes('jon@doe.com')))
hopeThat.noErrors()
```

Each `hopeThat()` call records the failure as a note on the test and lets the scenario continue; `hopeThat.noErrors()` throws once at the end with every recorded failure if any happened. See [Effects: hopeThat](/effects#hopethat).

### `Mochawesome` → Testomat.io Reporter

3.x bundled a `Mochawesome` helper that pushed steps and screenshots into a [`mochawesome`](https://www.npmjs.com/package/mochawesome) Mocha report. The helper, the `mochawesome` dependency, and the worker-level report-dir wiring are all gone in 4.x.

For an HTML report, use the [Testomat.io Reporter](https://github.com/testomatio/reporter) with the HTML pipe — it includes steps, screenshots, videos, and traces, works under `--workers`, and needs no helper in your config. See [Reports](/reports).

3.x:

```js
helpers: { Mochawesome: { uniqueScreenshotNames: true } }
```

```bash
npx codeceptjs run --reporter mochawesome --reporter-options reportDir=output
```

4.x:

```bash
npm install --save-dev @testomatio/reporter
```

```js
// codecept.conf.js
plugins: {
  testomatio: {
    enabled: true,
    require: '@testomatio/reporter/codecept',
    html: true,
  },
}
```

```bash
npx codeceptjs run
```

The HTML report is written to `output/report/` by default. See [Reports > HTML](/reports) for pipe options.

Reporting notes:

- **JUnit XML** (CI servers, GitHub Actions test tab): enable the [`junitReporter`](/plugins#junitreporter) plugin instead of `mocha-junit-reporter`. It includes CodeceptJS steps. See [Reports → JUnit XML](/reports#junit-xml).
- **Multiple Mocha reporters** via `mocha-multi` / `cmr` is **not recommended** in 4.x — the Testomat.io HTML pipe plus the `junitReporter` plugin cover the HTML + JUnit combination without chaining reporters.

#### Keeping Mochawesome (not recommended)

The `mochawesome` reporter itself is a stock Mocha reporter — it never depended on CodeceptJS bundling it, so it keeps working. Only the bundled **helper** (which embedded failure screenshots into the report) was removed. If you must stay on Mochawesome, you own that glue now.

**Report only — no screenshots embedded.** This works as-is:

```bash
npm install --save-dev mochawesome
npx codeceptjs run --reporter mochawesome --reporter-options reportDir=output
```

**Report with embedded failure screenshots.** Re-create the old helper as a project-local custom helper. This is a faithful port of the 3.x helper:

```js
// helpers/Mochawesome.js
import Helper from '@codeceptjs/helper'
import { createRequire } from 'module'
// ⚠️ Internal, NOT semver-stable subpaths. Pin your codeceptjs version —
// a future minor may move these. This coupling is why core dropped the helper.
import { clearString } from 'codeceptjs/lib/utils.js'
import { testToFileName } from 'codeceptjs/lib/mocha/test.js'

const addContext = createRequire(import.meta.url)('mochawesome/addContext')

class Mochawesome extends Helper {
  constructor(config) {
    super(config)
    this.options = { uniqueScreenshotNames: false, disableScreenshots: false, ...config }
    this.currentTest = ''
    this.currentSuite = null
  }

  _beforeSuite(suite) {
    this.currentSuite = suite
    this.currentTest = ''
  }

  _before() {
    if (this.currentSuite?.ctx) {
      this.currentTest = { test: this.currentSuite.ctx.currentTest }
    }
  }

  _test(test) {
    this.currentTest = { test }
  }

  _failed(test) {
    if (this.options.disableScreenshots) return
    let fileName
    if (test.ctx?.test?.type === 'hook') {
      this.currentTest = { test: test.ctx.test }
      test._retries = -1
      fileName = clearString(`${test.title}_${this.currentTest.test.title}`)
    } else {
      this.currentTest = { test }
      fileName = testToFileName(test)
    }
    if (this.options.uniqueScreenshotNames) {
      fileName = testToFileName(test, { unique: true })
    }
    if (test._retries < 1 || test._retries === test.retryNum) {
      return addContext(this.currentTest, `${fileName}.failed.png`)
    }
  }

  // exposed as I.addMochawesomeContext(...) for manual attachments
  addMochawesomeContext(context) {
    if (this.currentTest === '') this.currentTest = { test: this.currentSuite.ctx.test }
    return addContext(this.currentTest, context)
  }
}

export default Mochawesome
```

Register it and run with the reporter:

```js
// codecept.conf.js
helpers: {
  Mochawesome: {
    require: './helpers/Mochawesome.js',
    uniqueScreenshotNames: true,
  },
}
```

```bash
npx codeceptjs run --reporter mochawesome --reporter-options reportDir=output
```

Two caveats this port cannot fully solve:

- The internal imports (`codeceptjs/lib/utils.js`, `codeceptjs/lib/mocha/test.js`) are reachable but **not part of the public API** — pin `codeceptjs` and re-test on upgrades.
- The 3.x `screenshot`/`screenshotOnFail` plugin read `helpers.Mochawesome.config.uniqueScreenshotNames` to keep the embedded reference and the saved screenshot file in sync. Core no longer does this. Set `uniqueScreenshotNames` to the **same value** on both this helper and the `screenshot` plugin, or the embedded filename and the saved file can diverge on retries.

### Custom Assertion Libraries

No code changes are required for chai, expect, jest-style matchers, or Node's `assert` — just import them in your test files. With `noGlobals: true`, they work the same as before.

Heads up on chai: 3.x pinned `chai@4`; 4.x devDep is `chai@6`, which is **ESM-only** and drops some legacy APIs. If you import chai in your tests, switch to `import { expect } from 'chai'` and verify your matchers still resolve.

## 4. Replace or Remove Plugins

| Removed plugin | Replacement |
|----------------|-------------|
| `autoLogin` | **`auth` plugin** — see [Authorization](/auth). |
| `tryTo` | `import { tryTo } from 'codeceptjs/effects'` |
| `retryTo` | `import { retryTo } from 'codeceptjs/effects'` |
| `eachElement` | `import { eachElement } from 'codeceptjs/els'` |
| `commentStep` | `import step from 'codeceptjs/steps'` then `step.section('name')` / `step.endSection()` |
| `fakerTransform` | Import `@faker-js/faker` directly in tests. |
| `enhancedRetryFailedStep` | Merged into `retryFailedStep`. Rename in config. |
| `allure` | Use [@testomatio/reporter](https://testomat.io). |
| `htmlReporter` | Use the [Testomat.io Reporter](https://github.com/testomatio/reporter) HTML pipe — see [Reports](/reports). |
| `wdio` | Configure WebdriverIO services directly in `helpers.WebDriver`. |
| `selenoid` | Run Selenoid externally. |
| `standardActingHelpers` | No longer needed; the list lives in core. |

### `autoLogin` → `auth`

3.x:

```js
plugins: {
  autoLogin: {
    enabled: true,
    saveToFile: true,
    inject: 'login',
    users: { admin: { login, check, fetch } },
  },
}
```

4.x:

```js
plugins: {
  auth: {
    enabled: true,
    users: {
      admin: {
        login: (I) => { /* ... */ },
        check: (I) => { /* ... */ },
      },
    },
  },
}
```

Inject `login` and call `login('admin')` — same as before.

### Renamed Plugins

4.x unifies four plugins (`screenshot`, `pause`, `aiTrace`, `heal`) under a shared `on=` parameter. The old names live on as deprecated aliases that emit a warning and forward to the new plugin.

| Old plugin          | New plugin                       | Notes                                              |
| :------------------ | :------------------------------- | :------------------------------------------------- |
| `screenshotOnFail`  | `screenshot`                     | Default `on='fail'`, same behavior                 |
| `pauseOnFail`       | `pause`                          | Default `on='fail'`, same behavior                 |
| `stepByStepReport`  | `screenshot` with `slides: true` | Use `on=step` to capture every step                |

### New Plugins You Can Enable

- **`aiTrace`** — captures failure traces (DOM, console, network, screenshots) for AI debugging. See [AI Trace](/aitrace).
- **`pause`** — pauses execution on a chosen event or on failure. See [Debugging](/debugging).
- **`heal`** — self-heals failing steps with AI; narrow with `on=file|url`.

## 5. Update Removed and Changed APIs

### AI Config Now Uses Vercel AI SDK

3.x required a hand-written `request` function that called your provider's SDK directly. 4.x replaces this with [Vercel AI SDK](https://ai-sdk.dev) — pass a `model` and CodeceptJS handles the calls.

Install the SDK and the provider package you want:

```bash
npm install ai @ai-sdk/openai
# or @ai-sdk/anthropic, @ai-sdk/google, @ai-sdk/mistral, @ai-sdk/groq, @ai-sdk/xai, @ai-sdk/azure, @ai-sdk/cohere
```

3.x:

```js
ai: {
  request: async messages => {
    const OpenAI = require('openai')
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
    })
    return completion?.choices[0]?.message?.content
  },
}
```

4.x:

```js
import { openai } from '@ai-sdk/openai'

export default {
  ai: {
    model: openai('gpt-5'),
  },
}
```

The same shape works for every supported provider — swap `openai('gpt-5')` for `anthropic('claude-sonnet-4-6')`, `google('gemini-1.5-flash')`, etc. API keys still come from environment variables (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, ...).

The `request` function is no longer supported. Delete it from your config.

See [Testing with AI](/ai) for the full provider list and prompt customization.

### JSON Schema Validation: Joi → Zod

`I.seeResponseMatchesJsonSchema()` (from the `JSONResponse` helper) now validates with [Zod](https://zod.dev) instead of [Joi](https://joi.dev). Joi is gone from the dependency tree; Zod is bundled.

Rewrite your schemas:

3.x:

```js
const Joi = require('joi')

I.seeResponseMatchesJsonSchema(Joi.object().keys({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(0),
}))
```

4.x:

```js
import { z } from 'zod'

I.seeResponseMatchesJsonSchema(z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().int().min(0),
}))
```

Or pass a callback that receives `z`:

```js
I.seeResponseMatchesJsonSchema(z => z.object({
  name: z.string(),
  id: z.number(),
}))
```

Common rewrites:

| Joi | Zod |
|-----|-----|
| `Joi.object().keys({...})` | `z.object({...})` |
| `Joi.string().required()` | `z.string()` (required by default) |
| `Joi.string().email()` | `z.string().email()` |
| `Joi.number().integer()` | `z.number().int()` |
| `Joi.array().items(...)` | `z.array(...)` |
| `Joi.string().optional()` | `z.string().optional()` |
| `Joi.date()` | `z.string().datetime()` or `z.date()` |
| `Joi.alternatives().try(a, b)` | `z.union([a, b])` |

Uninstall `joi` from your project if you only used it for CodeceptJS schemas:

```bash
npm uninstall joi
```

### `restart: 'browser'` removed (Playwright)

Use one of:

- `restart: 'session'` — reset session per test (default)
- `restart: 'context'` — new browser context per test
- `restart: 'keep'` — keep one browser across tests

### Custom Locator Strategy removed (Playwright)

The `customLocators` strategy registration in Playwright config is removed. Use the `customLocator` plugin or built-in ARIA locators (`{ role: 'button', name: 'Submit' }`).

### React and Vue Locators removed

The `react` component locator and the bare-string `_react=`/`_vue=` Playwright selectors are removed from the Playwright, Puppeteer, and WebDriver helpers. The `resq` dependency is dropped.

```js
// 3.x (removed)
I.click({ react: 'SubmitButton' })
I.seeElement({ react: 'Alert' })
I.fillField({ react: 'EmailInput' }, 'a@b.com')
```

They relied on `resq`, which is unmaintained, supports only React 16, reads React's private internal tree, and breaks under production minification. There is no working path for React 17, 18, or 19.

Use [ARIA locators](/locators#aria-locators) instead — they match how a user perceives the page and survive refactoring and minification:

```js
// 4.x
I.click({ role: 'button', name: 'Submit' })
I.seeElement('[role=alert]')
I.fillField('Email', 'a@b.com')
```

For a component that renders no stable role, label, or text, add a `data-testid` in the JSX and locate by it: `I.click('[data-testid="submit"]')`.

### `I.retry()` and `I.limitTime()` removed

Both were deprecated in 3.x and are **removed in 4.x**. They configured the *next* step through a chained call; the replacement is the step options API — pass a `step.*` config as the **last argument** of the step itself.

```js
import step from 'codeceptjs/steps'

// 3.x (removed)            →  4.x
I.retry(3).click('Submit')  //  I.click('Submit', step.retry(3))
I.limitTime(10).fillField('Email', 'a@b.c') // I.fillField('Email', 'a@b.c', step.timeout(10))
```

`step.*` configs are also composable with the other step options:

```js
I.click('Add', step.opts({ elementIndex: 2 }))
```

The behavior is unchanged — the option applies only to the step it is attached to, not to subsequent steps (this also fixes the 3.x footgun where `I.retry()` could leak retry settings onto the following step). `recorder.retry()` is unaffected and remains available for custom helpers.

### `within` Is Now an Effect

In 3.x, `within(...)` was a global statement available everywhere. In 4.x it's an effect alongside `tryTo`, `retryTo`, and `hopeThat`. Under `noGlobals: true` you must import it:

```js
import { within } from 'codeceptjs/effects'

await within('.signup-form', () => {
  I.fillField('Email', 'a@b.c')
  I.click('Submit')
})
```

`within` returns a Promise — `await` it whenever you need its return value or want subsequent steps to wait for it. The same applies to `session`, which moved from global to a regular import (`import { session } from 'codeceptjs'`).

### Effects and Assertions Are Subpath Imports

```js
import { within, tryTo, retryTo, hopeThat } from 'codeceptjs/effects'
import { hopeThat } from 'codeceptjs/assertions'
import { eachElement, element, expectElement } from 'codeceptjs/els'
import step from 'codeceptjs/steps'
import store from 'codeceptjs/store'
```

`tryTo` and `hopeThat` now return `Promise<boolean>`. The 3.x generic `Promise<T | false>` signature is gone.

`hopeThat.noErrors()` is new — call it once at the end of a scenario to fail the test if any soft assertion failed.

### Globals Are Deprecated — `noGlobals: true` Is the New Default

Up to 3.x, almost everything was global: `Feature`, `Scenario`, `Before`, `pause`, `within`, `session`, `secret`, `Helper`, `actor`, `inject`, `share`, `locate`, `DataTable`, `Given`/`When`/`Then`, `codecept_dir`, `output_dir`.

In 4.x:

- `npx codeceptjs init` writes `noGlobals: true` into new configs.
- Projects without `noGlobals` set keep the old behavior but print a deprecation warning on every run:

  > Global functions are deprecated. Use `import { Helper, pause, within, session } from "codeceptjs"` instead. Set `noGlobals: true` in config to disable globals.

To silence the warning, set `noGlobals: true`:

```js
// codecept.conf.js
export const config = {
  noGlobals: true,
  // ...
}
```

What changes when `noGlobals: true`:

| Symbol | With `noGlobals: true` |
|--------|------------------------|
| `Feature`, `Scenario`, `xFeature`, `xScenario`, `BeforeSuite`, `AfterSuite`, `Before`, `After`, `Background`, `BeforeAll`, `AfterAll` | **Still work in test files** — Mocha injects these into the test context. No import needed. |
| `pause()`, `inject()`, `share()` | **Still global.** Always available (with or without `noGlobals`) — they're the standard wiring/debugging entry points and run before any import would resolve. `pause` and `inject` are also exported from `codeceptjs` if you prefer explicit imports. |
| `codecept_dir`, `output_dir` | **Still global** (kept for backward compatibility with external plugins). |
| `within`, `session`, `secret`, `locate`, `dataTable`, `actor`, `codeceptjs` | Import from `codeceptjs`. |
| `Helper` (base class) | Import from `@codeceptjs/helper`. |
| `Given`, `When`, `Then`, `And`, `DefineParameterType` (BDD step definitions) | Available as globals **inside Gherkin step definition files** (CodeceptJS scope-injects them while loading the step files). No import needed. |

Imports for the new style:

```js
import { within, session, secret, locate, dataTable, actor } from 'codeceptjs'
import Helper from '@codeceptjs/helper'
```

Test files written for 3.x keep working until you flip the flag.

### `wait*` Methods Resolve Relative URLs

`waitInUrl`, `waitUrlEquals`, and `waitCurrentPathEquals` now resolve a relative path against the helper's configured `url` before comparing. In 3.x a literal substring match against `window.location.href` would fail for relative paths.

```js
// helpers: { Playwright: { url: 'https://app.example.com' } }

I.waitUrlEquals('/dashboard')   // matches https://app.example.com/dashboard
I.waitInUrl('/users')           // matches any URL containing /users
```

`waitUrlEquals` error messages now include the actual URL the page was on when the wait timed out — easier to diagnose `/dashboard` vs `/dashboard?session=expired`.

## 6. Adopt New Behaviors

### Strict Mode

Playwright, Puppeteer, and WebDriver helpers support `strict: true`. Any locator that matches more than one element throws `MultipleElementsFound` instead of silently picking the first match.

```js
helpers: {
  Playwright: { url: '...', strict: true },
}
```

Per-step alternative: `I.click('a', step.opts({ exact: true }))`.

The error includes a `fetchDetails()` method that prints XPaths and HTML for every match.

### Element Index

Pick a specific match without writing a more specific locator:

```js
I.click('a', step.opts({ elementIndex: 2 }))
I.click('a', step.opts({ elementIndex: 'last' }))
I.fillField('input', 'x', step.opts({ elementIndex: -1 }))
```

### Unfocused Element Detection

`I.type()` and `I.pressKey()` throw `NonFocusedType` if no element has focus. Click or focus the field first.

### Context Parameter on Form Methods

`appendField`, `clearField`, `attachFile`, and `moveCursorTo` accept an optional second context argument, matching `fillField` and `click`.

### Other New Methods

- `I.seeCurrentPathEquals(path)` / `I.dontSeeCurrentPathEquals(path)` — compare the path ignoring query strings.
- `I.waitCurrentPathEquals(path, sec?)` — wait until the path matches.
- `I.seeFileDownloaded(name)`
- `I.clickXY(locator?, x, y)` — click at coordinates, either page-relative or element-relative.
- `I.grabAriaSnapshot(locator?)` — capture an accessibility-tree snapshot for the page or a region (Playwright).
- `I.grabWebElement(locator)` / `I.grabWebElements(locator)` — return helper-agnostic `WebElement` wrappers.
- `attachFile` — supports drag-and-drop dropzones.
- `fillField` — supports rich text editors (CKEditor, ProseMirror, etc.).
- BDD: `But` keyword is recognized.

### CLI Plugin Arguments

`-p` accepts colon-chained arguments, so plugins can be enabled and configured from the command line without editing config:

```bash
npx codeceptjs run -p pause                                   # pause on every failure
npx codeceptjs run -p pause:on=url:pattern=/checkout/*        # pause when URL matches
npx codeceptjs run -p screenshot:on=step                      # screenshot every step
npx codeceptjs run -p browser:show                            # force visible browser
npx codeceptjs run -p browser:browser=firefox:windowSize=1024x768
npx codeceptjs run -p plugin1,plugin2:arg                     # multiple plugins
```

Each argument after the plugin name is a `key=value` pair. `:` separates pairs. `;` is an inline alternative for visually grouping related pairs (e.g. `path=...;line=...`). Reserved keys: `on`, `path`, `line`, `pattern`.

The `browser` plugin is new in 4.x — it overrides the active browser helper (Playwright, Puppeteer, WebDriver, Appium) from the CLI, useful for ad-hoc local runs and CI matrices. See [Commands](/commands).

The old `-p all` magic keyword is gone (it conflicted with the colon syntax). Enable specific plugins explicitly: `-p pluginA,pluginB`.

### Workers: Events and Plugin Scope

Two notable changes for parallel runs:

- **Event dispatcher fires inside workers.** In 3.x, listeners attached to `event.dispatcher` only saw events from the main process. In 4.x, plugins and listeners observe per-test events inside each worker, so things like custom reporters and screenshot hooks work the same in single-process and worker modes ([#5464](https://github.com/codeceptjs/CodeceptJS/pull/5464)).
- **`runInParent` / `runInMain` plugin option.** Set to `false` on plugins that should only run inside worker children (default is `true`). Useful for plugins that aggregate per-worker state from the parent.

```js
plugins: {
  myReporter: {
    enabled: true,
    runInParent: false,   // only run in worker children
  },
}
```

### TypeScript Improvements

If you write tests in TypeScript, 4.x is significantly better:

- **`tsx` loader** instead of `ts-node/esm` — faster startup, better ESM compatibility. Install `tsx` (optional peer dep). `ts-node/esm` still works but emits a deprecation warning.
- **Error stack traces** point at `.ts` source lines, not transpiled output.
- **`__dirname` / `__filename`** are injected for TypeScript files that use them (ESM normally hides these globals).
- **Path aliases** from `tsconfig.json` (`paths`) are resolved at runtime — `import x from '@/utils'` works without extra runtime config.
- **`codecept.conf.ts`** supports top-level `await` via dynamic imports.
- **`steps_file.ts`** and TypeScript support objects load correctly across files.

## 7. Update Dependency Versions

If your project depends on these directly, check for breakage:

| Package | 3.x | 4.x |
|---------|-----|-----|
| `chai` | ^4 | ^6 (ESM-only) |
| `chai-as-promised` | 7 | 8 (ESM-only) |
| `@cucumber/gherkin` | 35 | 38 |
| `@cucumber/messages` | 29 | 32 |
| `chokidar` | 4 | 5 |
| `commander` | 11 | 14 |
| `@faker-js/faker` | 9 | 10 |
| `webdriverio` | 9.12 | 9.23 |
| `puppeteer` | 24.15 | 24.36 |
| `electron` | 38 | 40 |
| `typescript` | 5.8 | 5.9 |
| `testcafe` | 3.7.2 | **removed** |
| `inquirer-test` | 2.0.1 | **removed** |
| `joi` | 18 | **removed** — use `zod` |
| `resq` | 1.11 | **removed** — `react`/`vue` locators dropped; use ARIA locators |
| `zod` | — | added (^4) — schema validation in `JSONResponse` |
| `tsx` | — | added as optional peer |
| `@modelcontextprotocol/sdk` | — | added |
| `@testomatio/reporter` | — | added |

## 8. New Capabilities Worth Knowing

You don't need these to upgrade, but they unlock new workflows:

- **MCP server** — `bin/mcp-server.js` (also installed as `codeceptjs-mcp`) exposes CodeceptJS to AI agents through Model Context Protocol. See [MCP](/mcp).
- **WebElement wrapper** — `grabWebElements()` returns helper-agnostic `WebElement` instances with a unified API.
- **ARIA-first locators** — `{ role: 'button', name: 'Submit' }` works in Playwright, Puppeteer, and WebDriver. The `role` type is now first-class in `Locator`. See [Locators](/locators#aria-locators).
- **Locator DSL** — `locate(...)` gains `.withClass()`, `.not()` negation, raw-predicate helpers, and a `role` selector type.
- **Workers** — the `event` dispatcher fires inside worker processes, so listeners and plugins observe parallel runs the same way they observe single-process runs.
- **Path normalization** — file-path handling is normalized cross-platform; tests authored on Windows run unchanged on Linux/CI.
- **Test metadata** — the `Scenario` callback receives a `test` object with `test.tags`, `test.artifacts`, `test.meta`, and `test.notes` for custom reporting.
- **Security** — the `emptyFolder` utility (used by output cleanup) no longer shells out via `rm -rf`, closing a command-injection vector ([#5191](https://github.com/codeceptjs/CodeceptJS/pull/5191)).

## 9. Verify the Upgrade

1. `npx codeceptjs check` — surfaces config issues.
2. `npx codeceptjs run --debug` on a small smoke suite. Confirm the run starts and steps execute.
3. `npx codeceptjs run --workers 2` — confirm parallel execution.
4. TypeScript users: run with `tsx` installed and confirm error stack traces point at `.ts` files.
5. If you removed `autoLogin`: confirm sessions restore under the `auth` plugin.
6. If you used `tryTo` / `retryTo` / `eachElement` plugins: grep your tests for the old globals and switch to subpath imports.
7. CI: bump the Node version to 20+ if you were on 18 or below.
