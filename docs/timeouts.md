---
permalink: /timeouts
title: Timeouts
---

# Timeouts

CodeceptJS provides multiple timeout configurations to control test execution time at different levels.

## Step Timeout

Set timeout for individual steps using `step.timeout()`:

```js
import step from 'codeceptjs/steps'

Scenario('test with step timeouts', ({ I }) => {
  I.amOnPage('/')
  I.click('Slow Button', step.timeout(30))
  I.fillField('Email', 'user@example.com', step.timeout(10))
})
```

## Scenario Timeout

Override timeout for specific scenarios:

```js
Scenario('quick test', { timeout: 5 }, ({ I }) => {
  I.amOnPage('/')
})

Scenario('slow test', { timeout: 120 }, ({ I }) => {
  I.amOnPage('/dashboard')
})
```

## Feature Timeout

Set timeout for all scenarios in a feature:

```js
Feature('Slow Operations', { timeout: 60 })

Scenario('first test', ({ I }) => {
  // has 60 second timeout
})

Scenario('second test', ({ I }) => {
  // has 60 second timeout
})
```

## Global Timeout

Set default timeout for all tests in `codecept.conf.js`:

```js
export const config = {
  timeout: 10  // 10 seconds for all tests
}
```

Use advanced configuration with grep patterns for conditional timeouts:

```js
export const config = {
  timeout: [
    10,  // default timeout
    {
      grep: '@slow',
      Feature: 60  // 60 seconds for features tagged @slow
    },
    {
      grep: /critical/,
      Scenario: 30  // 30 seconds for scenarios matching pattern
    }
  ]
}
```

## Helper Timeouts

Each helper (Playwright, Puppeteer, WebDriver, Appium, REST) has its own timeout settings for browser actions, API requests, and element interactions. These are configured separately from test timeouts and are measured in milliseconds.

Refer to helper-specific documentation for timeout configuration:

- [Playwright Helper](/helpers/Playwright) — `timeout`, `waitForTimeout`, `getPageTimeout`
- [Puppeteer Helper](/helpers/Puppeteer) — `waitForTimeout`, `getPageTimeout`
- [WebDriver Helper](/helpers/WebDriver) — `waitForTimeout`, `smartWait`, `timeouts` object
- [Appium Helper](/helpers/Appium) — `timeouts` object
- [REST Helper](/helpers/REST) — `timeout`

## stepTimeout Plugin

Automatically apply timeouts to all steps:

```js
plugins: {
  stepTimeout: {
    enabled: true,
    timeout: 150,                // default step timeout in seconds
    overrideStepLimits: false,   // override step.timeout() if true
    noTimeoutSteps: [
      'amOnPage',
      'wait*'                    // wildcard patterns supported
    ],
    customTimeoutSteps: [
      ['slowAction*', 30],       // 30 seconds for matching steps
      [/critical.*/, 60]         // regex patterns supported
    ]
  }
}
```

### Timeout Priority

When multiple timeouts are configured, CodeceptJS applies them in priority order:

1. **stepTimeoutHard** — plugin with `overrideStepLimits: true`
2. **codeLimitTime** — `step.timeout()`
3. **stepTimeoutSoft** — plugin with `overrideStepLimits: false`
4. **testOrSuite** — global test/suite timeout

Higher priority timeouts override lower priority ones.

## Disabling Timeouts

Disable all timeouts for debugging:

```bash
npx codeceptjs run --no-timeouts
```

## Complete Example

```js
// codecept.conf.js
export const config = {
  timeout: [
    10,
    { grep: '@slow', Feature: 60 },
    { grep: '@critical', Scenario: 30 }
  ],
  
  helpers: {
    Playwright: {
      timeout: 5000,
      waitForTimeout: 1000,
      getPageTimeout: 30000
    }
  },
  
  plugins: {
    stepTimeout: {
      enabled: true,
      timeout: 150,
      noTimeoutSteps: ['amOnPage', 'wait*'],
      customTimeoutSteps: [
        ['slowAction*', 30]
      ]
    }
  }
}
```

```js
// test file
import step from 'codeceptjs/steps'

Feature('User Management @slow', { timeout: 60 })

Scenario('create user', { timeout: 20 }, ({ I }) => {
  I.amOnPage('/users')
  I.click('Create', step.timeout(10))
  I.fillField('Name', 'John', step.timeout(5).retry(2))
})
```

## Timeout Units

- **Global, Feature, Scenario, Step, stepTimeout plugin** — seconds
- **Helper timeouts** — milliseconds
