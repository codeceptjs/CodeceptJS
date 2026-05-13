---
permalink: /configuration
title: Configuration
---

# Configuration

`codeceptjs init` creates a `codecept.conf.js` (or `codecept.conf.ts`) in your test root. It exports a `config` object:

```js
export const config = {
  tests: './**/*_test.js',
  output: './output',
  helpers: {
    Playwright: { url: 'http://localhost', browser: 'chromium' },
  },
  include: {
    I: './steps_file.js',
  },
}
```

## Options

**Tests and files**

- `tests` — glob pattern (or array of patterns) locating your test files, e.g. `'tests/**/*_test.js'` (or `*_test.ts` for TypeScript).
- `output` — directory for failure screenshots, artifacts, and temporary files. Default `./output`.
- `include` — page objects and support objects exposed via dependency injection: `{ I: './steps_file.js', loginPage: './pages/Login.js' }`. They can then be injected by name — `Scenario('test', ({ I, loginPage }) => …)`.
- `require` — extra modules to load before tests run: assertion libraries, TypeScript loaders, setup files. See [Require](#require).
- `grep` — run only tests whose name matches this pattern, e.g. `grep: '@firefox'`. Handy when you keep separate configs per environment.

**Helpers and plugins**

- `helpers` — enable and configure [helpers](/helpers): `{ Playwright: { url: 'https://mysite.com', browser: 'firefox' } }`.
- `plugins` — enable [plugins](/plugins): `{ autoDelay: { enabled: true } }`.

**Hooks**

- `bootstrap` / `teardown` — run code before / after the whole run; an async function or a path to a JS module. See [Bootstrap](/bootstrap).
- `bootstrapAll` / `teardownAll` — run once around a parallel run (before any worker starts / after all finish). See [bootstrapAll / teardownAll](/bootstrap#bootstrapall-teardownall).

**Test runner**

- `timeout` — default per-test timeout in seconds; a test is killed if it stops responding.
- `mocha` — [Mocha options](https://mochajs.org/#configuring-mocha-nodejs), including extra reporters. See [Reporters](/reports).

**BDD**

- `gherkin` — enable [BDD features](/bdd#configuration): `{ features: './features/*.feature', steps: ['./step_definitions/steps.js'] }`.
  - `gherkin.features` — feature file glob, or an array of globs.
  - `gherkin.steps` — JS files with step definitions.

**TypeScript**

- `fullPromiseBased` — generate typings where `I.*` methods return promises, so you can `await` each command. See [TypeScript](/typescript#promise-based-typings).

**Other**

- `translation` — enable [localized commands](/translation).
- `maskSensitiveData` — mask secrets in console output.
- `noGlobals` — don't register the global functions (`Feature`, `Scenario`, `Before`, …). Not recommended.

## Require

`require` loads modules before tests run — assertion libraries (`'should'`), setup files (`'./lib/setup'`), and TypeScript loaders. Modules load in the order listed.

For TypeScript test files in CodeceptJS 4.x, use the [`tsx`](https://tsx.is) loader:

```ts
// codecept.conf.ts
export const config = {
  tests: './**/*_test.ts',
  require: ['tsx/cjs'],
  helpers: {},
  include: {},
}
```

Combine several modules:

```ts
require: ['tsx/cjs', 'should', './lib/testSetup']
```

The config file itself (`codecept.conf.ts`) and helpers are transpiled automatically — only test files need the loader. See [TypeScript](/typescript) for the full setup.

## Dynamic configuration

A JS/TS config file is plain code, so you can read environment variables and build the config at runtime:

```js
export const config = {
  helpers: {
    WebDriver: {
      url: process.env.CODECEPT_URL || 'http://localhost:3000',
      user: process.env.CLOUDSERVICE_USER,
      key: process.env.CLOUDSERVICE_KEY,
      waitForTimeout: 10000,
    },
  },
  include: {
    I: './src/steps_file.js',
    loginPage: './src/pages/login_page.js',
  },
}
```

Override config values at runtime with `--override` / `-o`, passing JSON:

```sh
npx codeceptjs run -o '{ "helpers": { "WebDriver": { "browser": "firefox" } } }'
```

Point at a non-default config file with `--config` / `-c`:

```sh
npx codeceptjs run --config ./path/to/config.js
```

## Common configuration patterns

[`@codeceptjs/configure`](https://github.com/codeceptjs/configure) ships with CodeceptJS as a dependency. It holds shared recipes for config that's independent of the active helper.

Toggle headless mode, set window size, and so on:

```js
import { setHeadlessWhen, setWindowSize } from '@codeceptjs/configure'

setHeadlessWhen(process.env.HEADLESS || process.env.CI)
setWindowSize(1600, 1200)

export const config = {
  // ...
}
```

For one-shot bundles use `setBrowserConfig` — pass any subset of `{ browser, show, windowSize, url }` and the right per-helper translation happens automatically (Puppeteer gets `product`, WebDriver gets `--headless` injected, …). Keys whose value is `undefined` are skipped, so an unset env var won't clobber existing config:

```js
import { setBrowserConfig } from '@codeceptjs/configure'

setBrowserConfig({
  browser: process.env.BROWSER,     // optional engine override
  show: !process.env.HEADLESS,      // headed unless HEADLESS is set
  windowSize: '1280x720',
  url: process.env.URL,             // overrides helper.url when set
})
```

`setCommonPlugins()` enables a curated set of plugins and registers a few more as discoverable, so they can be switched on ad-hoc with [`-p` plugin arguments](/commands#plugin-arguments) without editing the config:

```js
import { setCommonPlugins } from '@codeceptjs/configure'

setCommonPlugins()
```

- `retryFailedStep` — *enabled*. Retries steps that fail with transient errors.
- `screenshot` — *enabled*. Screenshot on `fail` (default), or `test` / `step` / `file` / `url`.
- `pause` — *registered*. Pause on failure / step / file / URL: `-p pause:on=fail`, `-p pause:on=step`, `-p pause:on=file:path=tests/login_test.js`, `-p pause:on=url:pattern=/checkout/*`.
- `browser` — *registered*. CLI overrides for browser helpers: `-p browser:show`, `-p browser:browser=firefox`. See [browser control](/commands#browser-control).
- `aiTrace` — *registered*. Capture AI traces: `-p aiTrace`, narrow with `on=fail|test|step|file|url`.
- `heal` — *registered*. Self-heal failing steps: `-p heal`, narrow with `on=file|url`.

> `eachElement`, `tryTo`, and `retryTo` are no longer plugins in 4.x — import them from `codeceptjs/effects`.

## Profile

`process.env.profile` carries the value of the `--profile` CLI option, so you can branch the config on it:

```sh
npx codeceptjs run --profile firefox
```

```js
export const config = {
  helpers: {
    WebDriver: {
      url: 'http://localhost:3000',
      browser: process.env.profile || 'chrome',
    },
  },
}
```
