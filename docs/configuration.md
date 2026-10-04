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
- `webServer` — start the application under test before the run and stop it after. See [Web Server](#web-server).

**Test runner**

- `timeout` — default per-test timeout in seconds; a test is killed if it stops responding.
- `mocha` — [Mocha options](https://mochajs.org/#configuring-mocha-nodejs), including extra reporters. See [Reporters](/reports).
- `workerInitializationDelay` — delay in milliseconds between spinning up parallel workers to prevent CPU spikes and stagger browser startup. Defaults to `200`. Set to `0` to disable.
- `workerInitializationMaxDelay` — maximum total delay (in milliseconds) for worker initialization staggering. Defaults to `10000` (10 s). Set to `0` to disable capping.

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
  require: ['tsx/esm'],
  helpers: {},
  include: {},
}
```

This requires `"type": "module"` in `package.json` so `.ts` test files are compiled as ES Modules.

Combine several modules:

```ts
require: ['tsx/esm', 'should', './lib/testSetup']
```

The config file itself (`codecept.conf.ts`) and helpers are transpiled automatically — only test files need the loader. See [TypeScript](/typescript) for the full setup.

## Web Server

`webServer` starts your application before tests run and stops it when they finish, so you don't need a `bootstrap` script for it:

```js
export const config = {
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    timeout: 60000,
  },
  // ...
}
```

- `command` — shell command that starts the app.
- `url` — CodeceptJS sends GET requests here until it gets any HTTP response, then starts the tests.
- `reuseExistingServer` — if `url` already responds, use that server instead of starting a new one. Defaults to `!process.env.CI`: locally a running dev server is reused, on CI a fresh one is always started. When it is `false` and `url` is already taken, the run fails.
- `timeout` — milliseconds to wait for `url`. Default `60000`.
- `cwd` — working directory for `command`, relative to the config file. Default is the config directory.
- `env` — extra environment variables for `command`.

If the server exits early or doesn't respond within `timeout`, the run fails and prints the last 20 lines of its output. Run with `--debug` to see all of its output.

To start several services, pass an array. They start in order and stop in reverse order:

```js
webServer: [
  { command: 'npm run api', url: 'http://localhost:4000/health' },
  { command: 'npm run start', url: 'http://localhost:3000' },
],
```

The server starts once in the main process for `run`, `run-workers`, `run-multiple` and `run-rerun`, before `bootstrapAll`/`bootstrap`, and stops after `teardownAll`/`teardown`. Workers and child processes reuse it. `dry-run`, `list`, `check`, `def` and `info` don't start it. CodeceptJS stops the command and every process it spawned, including when the run is interrupted with Ctrl+C.

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
