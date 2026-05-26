---
permalink: /retry
title: Retry Mechanisms
---

# Retry Mechanisms

CodeceptJS provides flexible retry mechanisms to handle flaky tests. Use retries when dealing with unstable environments, network delays, or timing issues — not to mask bugs in your code.

## Retry Levels

* [helper retries](#helper-retries) — happen low level on browser interaction (resolves rendering of elements)
* [failed step retries](#failed-step-retries) — performed by CodeceptJS on step fail
* [manual step retries](#manual-step-retries) — on known flaky steps
* [multiple steps retry](#multiple-steps-retry) — retry a group of steps together as a single operation
* [self-healing steps](#self-healing-steps) — AI-powered recovery that continues tests without changing test code
* [scenario retry](#scenario-retry) — retry entire test scenarios on failure
* [feature retry](#feature-retry) — retry all scenarios within a feature
* [hook retries](#hook-retries) — retry `Before`/`After` hooks on failure

## Helper Retries

Plawright has a built-in retry mechanism for element interactions. When you call `I.click('Button')`, after the element is located Playwright keeps retrying until it is actionable — up to `timeout` (default 5s).

> WebDriver has a different auto-retry option: [smartWait](/webdriver#smartwait)

Even though the handle exists (from `.all()`), Playwright still waits for it to become visible, stable (not mid-animation), enabled, not covered by an overlay/modal, and not rerendering.

```js
helpers: {
  Playwright: {
    timeout: 5000,      // retry the action until the element is actionable
    waitForAction: 100  // fixed pause AFTER click/doubleClick/pressKey
  }
}
```

What each setting does:

```
find element (no wait — fails instantly if locator matches nothing)
  → wait up to `timeout` for it to become actionable   ← timeout
  → perform action
  → sleep `waitForAction` ms                            ← waitForAction (settle pause, not a wait)
```

`timeout` covers the action. If the locator matches nothing yet, the step fails immediately. Use [Failed Step Retries](#failed-step-retries) to cover that gap.


## Failed Step Retries

CodeceptJS retries all failed steps by default by using the `retryFailedStep` plugin.

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

Defaults: `minTimeout: 150`, `factor: 1.5`, `maxTimeout: 10000`.


> See [plugin reference](/plugins/retry-failed-step) for more options

Retries are calculated via this formula:

```
gap(N) = min(minTimeout × factor^(N-1), maxTimeout)
```

Practically if step fails it will trigger a retry with increasing delay until `maxTimeout` is reached:

```
retries: 2                              => 0.15s-0.4s (150,225ms)
retries: 3                              => 0.15s-0.7s (150,225,338ms)
retries: 3, minTimeout: 1000            => 1s-4.75s   (1s,1.5s,2.25s)
retries: 3, minTimeout: 1000, factor: 2 => 1s-7s      (1s,2s,4s)
retries: 5, minTimeout: 1000, factor: 2 => 1s-25s     (1s,2s,4s,8s,10s)
```

Playwright `timeout` adds to each attempt only when the element is found:

- `Playwright.timeout: 5000`
- `retries: 2, minTimeout: 1000`

```
element not found => 0 + (1s+1s)    = 2s
element found but not interactable  => 3×5s + (1s+1s) = 17s
```

## Manual Step Retries

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

## Multiple Steps Retry

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

## Self-Healing Steps

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

## Scenario Retry

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

## Feature Retry

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

## Hook Retries

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
