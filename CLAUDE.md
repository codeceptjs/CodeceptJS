# CodeceptJS ESM Migration Plan

This project is migrating from 3.x to ESM replacing all require() calls with imports.

## Compare with Reference

Each time unsure what to do refer to the same file implementation in **3.x branch**
3.x branch contains stable version of all core classes that work

## Local Development Setup

After `npm install`, run once:

```
npm link && npm link codeceptjs
```

This makes `node_modules/codeceptjs` resolve back to the project root. Required because `@codeceptjs/configure` (a runtime dep) does `import 'codeceptjs'` — and in this repo the project itself IS codeceptjs, so without the link Node has nothing at `node_modules/codeceptjs` to resolve to. CI runs the same two commands automatically (see `.github/workflows/test.yml`). End users don't need this — they install codeceptjs into their own project's node_modules normally.

## Running Tests

Focus on acceptance tests:

For instance this helps to understand if final migration is ok:

```
DEBUG="codeceptjs:*" ./bin/codecept.js run --config test/acceptance/codecept.Playwright.js --verbose

DEBUG="codeceptjs:*" ./bin/codecept.js run --config test/acceptance/codecept.Playwright.js --debug --grep within
```

Do not say: it works befire running specific acceptance test.
Tests may stuck so always run them with timeout call:

```
timeout=30000 ./bin/codecept.js run --config test/acceptance/codecept.Playwright.js --verbose
```

Web Server for this tests are running on port 8000 and it works but responds 500 for HEAD requests.

## Princinples

All unit tests for Playwright/Puppeteer/WebdriverIO are passing. But acceptance tests are failing due to promises composition. Complexity of promises composition comes from promise chaining and async/await syntax. And `session` mechanism from `promise.js` which allows spawning different promises chains and sync them up in the end.

The full test suite extensively uses plugins so refer to plugins and corresponding helpers as well

We are building test framework. So even passing ests are not indicator of successful usage. Side effects like: timeouts, bad output, errors, memory leaks, etc are affecting performance.
For instance, if a tests stuck and won't finish this is very bad.

## Coding Style

- Never add comments unless explicitly required.
- DO not mention plugins or helpers inside core classes
