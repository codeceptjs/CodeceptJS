---
permalink: /retry
title: Retry Mechanisms
---

# Retry Mechanisms

CodeceptJS provides flexible retry mechanisms to handle flaky tests. Use retries when dealing with unstable environments, network delays, or timing issues — not to mask bugs in your code.

## Helper Retries

Browser automation helpers (Playwright, Puppeteer, WebDriver) have **built-in retry mechanisms** for element interactions. When you call `I.click('Button')`, Playwright automatically waits for the element to exist, be visible, stable, and enabled — retrying for up to 5 seconds.

Configure the timeout in your helper settings:

```js
helpers: {
  Playwright: {
    timeout: 5000,      // retry actions for up to 5 seconds
    waitForAction: 100  // wait 100ms before each action
  }
}
```

**Learn more:** [Playwright Helper](/helpers/Playwright), [Timeouts](/timeouts)

## CodeceptJS Retry Levels

When helper retries aren't enough, CodeceptJS adds retry layers on top.

### 1. Manual Step Retry

Retry a specific step known to be flaky:

```js
import step from 'codeceptjs/steps'

Scenario('checkout', ({ I }) => {
  I.amOnPage('/cart')
  I.click('Proceed to Checkout', step.retry(5))  // retry up to 5 times
  I.see('Payment')
})
```

Configure timing with exponential backoff:

```js
I.click('Submit', step.retry({
  retries: 3,
  minTimeout: 1000,  // wait 1 second before first retry
  maxTimeout: 5000,  // max 5 seconds between retries
  factor: 1.5        // exponential backoff multiplier
}))
```

Pass `0` for infinite retries.

### 2. Automatic Step Retry

Automatically retry all failed steps without modifying test code:

```js
plugins: {
  retryFailedStep: {
    enabled: true,
    retries: 3
  }
}
```

Steps matching `amOnPage`, `wait*`, `send*`, `execute*`, `run*`, `have*` are skipped by default.

When a scenario has its own retries, step retries are disabled by default (`deferToScenarioRetries: true`). This prevents excessive execution time:

```js
Scenario('test', { retries: 2 }, ({ I }) => {
  I.click('Button')  // step retries disabled; scenario retries run instead
})
```

To disable step retries for a specific test:

```js
Scenario('manual retries only', { disableRetryFailedStep: true }, ({ I }) => {
  I.click('Button', step.retry(5))
})
```

Full plugin options:

| Option | Default | Description |
|--------|---------|-------------|
| `retries` | — | Retries per step |
| `minTimeout` | — | Milliseconds before first retry |
| `maxTimeout` | `Infinity` | Max milliseconds between retries |
| `factor` | — | Exponential backoff multiplier |
| `randomize` | `false` | Randomize timeout intervals |
| `ignoredSteps` | `[]` | Patterns/regex of steps to never retry |
| `deferToScenarioRetries` | `true` | Disable step retries when scenario retries exist |
| `when` | `() => true` | Function receiving error; return `true` to retry |

### 3. Multiple Steps Retry (retryTo)

Retry a group of steps together as a single operation:

```js
import { retryTo } from 'codeceptjs/effects'

await retryTo(() => {
  I.click('Load More')
  I.see('New Content')
}, 3)
```

If any step inside fails, the entire block retries. Use this for sequences that must succeed together — switching into an iframe and filling a form, for example.

**Learn more:** [Effects](/effects#retryto)

### 4. Self-Healing Steps

When a step fails, a healing recipe runs recovery actions and continues the test — without touching test code. With AI healing enabled:

```js
Scenario('checkout', ({ I }) => {
  I.click('Proceed to Checkout')
  I.see('Payment')
})
```

- `I.click('Proceed to Checkout')` fails — button was renamed or moved
  - failed step, error message, and page HTML are sent to an LLM
  - AI scans page elements and suggests valid replacement actions
  - CodeceptJS executes the suggestions until one succeeds
- test continues with `I.see('Payment')`

Run with `--ai` to activate:

```bash
npx codeceptjs run --ai
```

You can also write custom recipes for non-UI failures — network errors, data glitches, UI migrations.

**Learn more:** [Self-Healing Tests](/heal), [AI Configuration](/ai)

### 5. Scenario Retry

Retry an entire test when it fails:

```js
Scenario('API integration', { retries: 3 }, ({ I }) => {
  I.sendGetRequest('/api/users')
  I.seeResponseCodeIs(200)
})
```

Retry all scenarios globally, or by grep pattern:

```js
export const config = {
  retry: [
    { Scenario: 3, grep: 'API' },       // retry scenarios containing "API" 3 times
    { Scenario: 5, grep: '@flaky' }      // retry @flaky-tagged scenarios 5 times
  ]
}
```

### 6. Feature Retry

Retry all scenarios within a feature:

```js
Feature('Payment Processing', { retries: 2 })

Scenario('credit card payment', ({ I }) => { ... })  // retries 2 times
Scenario('paypal payment', ({ I }) => { ... })        // retries 2 times
```

Or target features by pattern in config:

```js
export const config = {
  retry: [
    { Feature: 3, grep: 'Integration' }
  ]
}
```

### 7. Hook Retries

Retry `Before`/`After` hooks when they fail:

```js
Before(({ I }) => {
  I.amOnPage('/')
}).retry(2)
```

Set per feature:

```js
Feature('My Suite', {
  retryBefore: 2,
  retryAfter: 1,
  retryBeforeSuite: 3,
  retryAfterSuite: 1
})
```

Or globally:

```js
export const config = {
  retry: [
    { BeforeSuite: 2, Before: 1, After: 1 }
  ]
}
```

## Retry Priority

When multiple retry configurations exist, higher-priority retries take precedence:

| Priority | Type | Description |
|----------|------|-------------|
| **Highest** | Manual Step (`step.retry()`) | Explicit retries in test code |
| | Automatic Step | `retryFailedStep` plugin |
| | Multiple Steps (`retryTo`) | Retry groups of steps together |
| | Scenario Config | Retry entire scenarios |
| | Feature Config | Retry all scenarios in a feature |
| **Lowest** | Hook Config | Retry failed hooks |

`retryTo` operates independently from step-level retries. If a step inside `retryTo` fails, the entire block retries.

## Best Practices

1. **Understand helper retries first** — Playwright/Puppeteer/WebDriver already retry actions internally
2. **Start with scenario retries** — simpler and less likely to cause issues
3. **Use manual retries for known flaky steps** — most predictable behavior
4. **Enable `deferToScenarioRetries`** — prevents excessive retries (default)
5. **Don't over-retry** — if tests fail consistently, fix the root cause
6. **Use grep patterns** — apply retries only where needed
7. **Retry timeouts, not bugs** — retries handle environmental issues, not code defects
8. **Consider healing for complex recovery** — see [Self-Healing Tests](/heal)

## Troubleshooting

### Tests running too long

- Confirm `deferToScenarioRetries: true` (the default)
- Reduce retry counts
- Use `grep` patterns to target specific tests
- Add problematic steps to `ignoredSteps`

### Retries not working

1. Check configuration syntax
2. Check the priority table — a higher-priority retry may be overriding
3. Confirm `disableRetryFailedStep: true` is not set on the scenario
4. Confirm the step isn't in `ignoredSteps`

Debug with:

```bash
DEBUG_RETRY_PLUGIN=1 npx codeceptjs run
```

### `step.retry()` is undefined

Import `step` from codeceptjs:

```js
import step from 'codeceptjs/steps'
```
