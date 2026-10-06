---
permalink: /lint
title: Lint
---

# Lint

`codeceptjs lint` checks tests, page objects and helpers for CodeceptJS anti-patterns: fixed sleeps, missing `await` on grabbers, plain-text credentials, leftover `pause()` and `.only`. It parses files into an AST, so it never runs a browser and finishes in a second.

```bash
npx codeceptjs lint                     # tests, include and helpers from codecept.conf.js
npx codeceptjs lint tests/checkout_test.js pages/
npx codeceptjs lint --json              # machine-readable output
npx codeceptjs lint -c path/to/codecept.conf.js
```

Each finding is printed on one line:

```
tests/checkout_test.js:14:3  error  no-fixed-wait  I.wait(5) sleeps unconditionally. Wait for a condition: I.waitForElement / I.waitForText / I.see
```

Without paths, lint checks files matched by `tests`, local files from `include` (page objects, steps file) and custom helpers loaded with `require`. JavaScript and TypeScript files are supported.

Exit codes: `0` no errors (warnings allowed), `1` errors found, `2` bad input or a file that can't be parsed.

## Rules

| Rule | Default | Detects |
| --- | --- | --- |
| `no-fixed-wait` | error | `I.wait(5)` with a number. Use `I.waitForElement`, `I.waitForText`, `I.see` |
| `no-sleep` | error | `setTimeout` (including `new Promise(r => setTimeout(r, ms))`) in a Scenario, hook or page object method |
| `no-only` | error on CI, warning locally | `Scenario.only`, `Feature.only`, `Data(...).only.Scenario` |
| `no-pause` | error on CI, warning locally | `pause()` |
| `secret-credentials` | error | `I.fillField` on a password, token, secret or API key field without `secret()`; `process.env.*` with such a name passed to an `I.*` call without `secret()` |
| `await-grab` | error | `I.grab*()` result assigned, returned or passed on without `await` |
| `no-actor-in-helper` | error | `I` (including `const { I } = inject()`) inside a class extending `Helper`. Use `this.helpers[...]` |
| `raw-browser-in-test` | warning | `I.usePlaywrightTo`, `I.usePuppeteerTo`, `I.useWebDriverTo` and other `use*To`, `I.executeScript` in a Scenario body. Move it into a helper or page object |

"On CI" means the `CI` environment variable is set, which every CI provider does. Locally `pause()` and `.only` stay warnings, so a debugging stub doesn't fail the lint.

## Configuration

Add an optional `lint` section to `codecept.conf.js`:

```js
lint: {
  rules: { 'raw-browser-in-test': 'off', 'no-fixed-wait': 'warn' },
  ignore: ['tests/legacy/**'],
}
```

Rule levels are `error`, `warn` or `off`. `ignore` takes glob patterns relative to the config file.

To allow a single case, suppress it inline. The rule id is required:

```js
I.wait(1) // codeceptjs-lint-disable-line no-fixed-wait

// codeceptjs-lint-disable-next-line no-fixed-wait
I.wait(1)
```

## CI

Run lint before the tests:

```yaml
- run: npx codeceptjs lint
- run: npx codeceptjs run
```

## Claude Code Hook

Lint can block a bad edit before an agent writes it. Add a `PreToolUse` hook to `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [{ "type": "command", "command": "npx codeceptjs lint --hook claude" }]
      }
    ]
  }
}
```

The hook builds the file as it would look after the edit and lints it. The edit is blocked only when it adds a new error. The agent receives the findings and rewrites the edit. Errors already in the file and warnings never block, so an agent can still add a `pause()` stub or touch a legacy test. If the hook fails or the resulting file can't be parsed, the edit is allowed.
