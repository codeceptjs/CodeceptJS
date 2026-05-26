---
permalink: /environment-variables
title: Environment Variables
---

# Environment Variables

CodeceptJS reads several environment variables that change runtime behavior. They are useful for tuning CI runs, enabling extra logging, configuring the MCP server, or wiring values into the generated `codecept.conf.js`.

This page is a reference for every `process.env.*` switch CodeceptJS reads or sets internally.

## Quick Reference

| Variable | Category | Default | Purpose |
| :--- | :--- | :--- | :--- |
| `profile` | Test execution | _unset_ | Profile name forwarded from `--profile`; readable from config and helpers. |
| `CI` | Test execution | _unset_ | Auto-set by every CI provider; enables CI-aware behavior. |
| `DONT_FAIL_ON_EMPTY_RUN` | Test execution | _unset_ | When set, do not fail CI if zero tests were executed. |
| `RUNS_WITH_WORKERS` | Workers | _unset_ | Set to `true` while running in workers; read by helpers/plugins to branch behavior. |
| `CODECEPT_WORKER_TIMEOUT` | Workers | `5m` | Hung-worker watchdog timeout. Accepts [ms](https://github.com/vercel/ms) strings (`30s`, `2m`, `1h`). |
| `CODECEPT_AUTO_EXIT_TIMEOUT` | Workers | `2000` | Time in ms allowed for helper cleanup before forced `process.exit`. Set to `0` to disable. |
| `DEBUG` | Debug | _unset_ | `debug` package namespace filter, e.g. `codeceptjs:*`, `codeceptjs:heal`. |
| `HEADLESS` | Init template | _unset_ | Read by `setHeadlessWhen()` in the generated config to toggle headless mode. |
| `BASE_URL` | Init template | `http://localhost` | Default URL written into the generated Playwright config. |

## Test Execution

### `profile`

Set automatically when you pass `--profile <name>` to `run`, `run-workers`, `run-rerun`, `run-multiple`, or `interactive`. The value is available inside `codecept.conf.js`, helpers, and plugins via `process.env.profile`, which is the standard way to switch configuration based on environment:

```js
exports.config = {
  helpers: {
    Playwright: {
      url: process.env.profile === 'staging' ? 'https://staging.example.com' : 'http://localhost:3000',
    },
  },
}
```

### `CI`

A de-facto standard variable exported by every major CI provider (GitHub Actions, GitLab CI, CircleCI, Jenkins, Travis, etc.). CodeceptJS uses it for two CI-aware behaviors:

- Extends the polling timeout for `submittedData()` to 60s (vs 2s locally).
- Fails the run with exit code `1` if no tests were executed (see `DONT_FAIL_ON_EMPTY_RUN`).

You should not need to set this manually.

### `DONT_FAIL_ON_EMPTY_RUN`

By default, when `CI` is set and no tests are executed (e.g. an over-restrictive `--grep`), CodeceptJS fails the run to surface false-positive green builds. Set `DONT_FAIL_ON_EMPTY_RUN=true` to keep the run green even when nothing ran.

```yaml
# .github/workflows/tests.yml
env:
  DONT_FAIL_ON_EMPTY_RUN: 'true'
```

## Workers

### `RUNS_WITH_WORKERS`

Automatically set to `'true'` while a `run-workers` invocation is active and reset to `'false'` when it finishes. Read it from helpers or plugins when you need to behave differently in worker mode — for example, to disable an interactive feature or change reporter output:

```js
if (process.env.RUNS_WITH_WORKERS === 'true') {
  // running in a worker thread
}
```

Do not set this manually.

### `CODECEPT_WORKER_TIMEOUT`

Per-worker hung-process watchdog. If a worker produces no output for this duration, it is auto-terminated and reported as failed. Accepts any string parsed by the [`ms`](https://github.com/vercel/ms) package: `30s`, `2m`, `5m`, `1h`. Defaults to `5m`.

```sh
CODECEPT_WORKER_TIMEOUT=10m npx codeceptjs run-workers 4
```

### `CODECEPT_AUTO_EXIT_TIMEOUT`

Time in **milliseconds** that CodeceptJS waits for helper `_cleanup()` hooks to complete before calling `process.exit()`. Defaults to `2000`. Set to `0` to disable the auto-exit and let the Node event loop drain naturally — useful when long-running async work (e.g. report uploads) must complete after the test run.

```sh
CODECEPT_AUTO_EXIT_TIMEOUT=0 npx codeceptjs run
```

## Debug

### `DEBUG`

Standard [`debug`](https://www.npmjs.com/package/debug) package selector. CodeceptJS emits debug output under the `codeceptjs:*` namespace. Useful namespaces:

| Namespace | Source |
| :--- | :--- |
| `codeceptjs:*` | All internal logs |
| `codeceptjs:recorder` | Recorder/promise queue |
| `codeceptjs:event` | Event dispatcher |
| `codeceptjs:container` | DI container |
| `codeceptjs:steps` | Step lifecycle |
| `codeceptjs:exit` | Exit listener |
| `codeceptjs:timeout` | Global timeout listener |
| `codeceptjs:pause` | Interactive pause |
| `codeceptjs:ai` | AI features |
| `codeceptjs:heal` | Heal plugin |
| `codeceptjs:analyze` | Analyze plugin |
| `codeceptjs:retryFailedStep` | retryFailedStep plugin |
| `codeceptjs:bdd` | Gherkin/BDD |

```sh
DEBUG="codeceptjs:*" npx codeceptjs run --verbose
DEBUG="codeceptjs:heal" npx codeceptjs run
DEBUG="codeceptjs:retryFailedStep" npx codeceptjs run
```

When `DEBUG` includes a `codeceptjs:` selector, the `heal` plugin keeps healing enabled in `--debug` mode (which otherwise disables it).

## Init Template

These variables are read by the configuration scaffolded by `codeceptjs init`. They have no effect unless your project's generated `codecept.conf.js` references them.

### `HEADLESS`

Read by [`setHeadlessWhen()`](https://www.npmjs.com/package/@codeceptjs/configure) in the generated config. When truthy, the browser starts headless. The init template wires this in so you can run `HEADLESS=true npx codeceptjs run` on CI without changing the config.

### `BASE_URL`

The init template uses `BASE_URL` (falling back to `http://localhost`) as the Playwright `url` value. After scaffolding, edit the generated config to change this default.
