---
permalink: /test-structure
title: Test Structure
---

# Test Structure

A CodeceptJS test file contains one **Feature** (suite) and one or more **Scenarios** (tests).

```js
Feature('User Authentication')

Scenario('user logs in', ({ I }) => {
  I.amOnPage('/login')
  I.fillField('Email', 'user@example.com')
  I.fillField('Password', secret('123456'))
  I.click('Sign In')
  I.see('Welcome')
})
```

## Feature

`Feature(title, config?)` declares a suite. Each test file contains exactly one Feature.

```js
Feature('User Authentication')
```

An optional config object sets defaults for all scenarios:

```js
Feature('Payment Processing', {
  retries: 2,
  timeout: 30000
})
```

Available options:

- `retries` — number of times to retry failed scenarios before marking as failed (see [Retry Mechanisms](/retry))
- `timeout` — maximum time in milliseconds for each scenario to complete (see [Timeouts](/advanced#timeout))
- `retryBefore` — number of times to retry the Before hook if it fails
- `retryAfter` — number of times to retry the After hook if it fails
- `retryBeforeSuite` — number of times to retry the BeforeSuite hook if it fails
- `retryAfterSuite` — number of times to retry the AfterSuite hook if it fails

> Unlike Mocha/Jest, nesting suites is not allowed — each file maps to exactly one feature.

## Scenario

`Scenario(title, config?, fn)` declares a test. The function receives an object with `I` (the actor), `test` object, and any page objects declared in `include` config:

```js
Scenario('guest checkout', ({ I, checkoutPage }) => {
  checkoutPage.open()
  I.see('Order Summary')
})
```

Access the `test` object to store metadata and artifacts for custom reporting:

```js
Scenario('payment processing', ({ I, test }) => {
  test.meta.transactionId = '12345'
  test.artifacts.receipt = 'receipts/order-12345.pdf'
  I.amOnPage('/checkout')
})
```

Available properties:

- `test.title` — test name
- `test.tags` — extracted tags from test name (e.g., `@smoke`, `@critical`)
- `test.steps` — array of executed steps
- `test.artifacts` — store screenshots, videos, logs, or files
- `test.meta` — custom metadata for reporters
- `test.notes` — array for adding notes or annotations
- `test.file` — path to test file
- `test.state` — current state (pending, passed, failed)
- `test.duration` — execution time in milliseconds
- `test.fullTitle()` — full title including suite name

An optional config object can customize the scenario:

```js
Scenario('slow test', { 
  timeout: 60000, 
  retries: 3 
}, ({ I }) => {
  // ...
})
```

Available options:

- `timeout` — maximum time in milliseconds for scenario to complete (see [Timeouts](/timeouts))
- `retries` — number of times to retry the scenario if it fails (see [Retry Mechanisms](/retry))
- `meta` — metadata object with key-value pairs for reporting or filtering
- `[helperName]` — helper-specific configuration (e.g., `Playwright: { headless: false }`)
- `cookies` — pre-loaded cookies for authentication (used by auth plugin)
- `user` — user identifier for session management (used by auth plugin)
- `disableRetryFailedStep` — disable automatic step retries for this scenario

### Dynamic Configuration

Override helper config for a single scenario using `.config()`:

```js
Scenario('run in firefox', ({ I }) => {
  // ...
}).config({ browser: 'firefox' })
```

To target a specific helper, pass its name as the first argument:

```js
Scenario('use v2 API', ({ I }) => {
  // ...
}).config('REST', { endpoint: 'https://api.mysite.com/v2' })
```

Pass a function to derive config from the test object — useful for cloud providers:

```js
Scenario('report to BrowserStack', ({ I }) => {
  // ...
}).config((test) => ({
  desiredCapabilities: {
    project: test.suite.title,
    name: test.title,
  }
}))
```

Apply config to all scenarios in a suite via `Feature`:

```js
Feature('Admin Panel').config({ url: 'https://mysite.com/admin' })
```

Config changes are reverted after the test or suite completes. Some options — such as `browser` when `restart: false` — cannot be changed after the browser has started.

### Data-Driven Scenarios

Use `Data().Scenario` to run the same scenario with multiple datasets:

```js
const users = new DataTable(['role', 'email'])
users.add(['admin', 'admin@example.com'])
users.add(['user', 'user@example.com'])

Data(users).Scenario('user can log in', ({ I, current }) => {
  I.fillField('Email', current.email)
  I.click('Login')
  I.see(`Logged in as ${current.role}`)
})
```

> ▶ See [Data Driven Tests](/data) for more details.

### Tags

Append a tag to the scenario title:

```js
Scenario('update user profile @slow', ...)
```

Or use the `tag()` method:

```js
Scenario('update user profile', ({ I }) => {
  // ...
}).tag('@slow').tag('important')
```

Run tagged tests with `--grep`:

```sh
npx codeceptjs run --grep '@slow'
```

Use regex for complex filtering:

```sh
# both @smoke2 and @smoke3
npx codeceptjs run --grep '(?=.*@smoke2)(?=.*@smoke3)'
# @smoke2 or @smoke3
npx codeceptjs run --grep '@smoke2|@smoke3'
# all except @smoke4
npx codeceptjs run --grep '(?=.*)^(?!.*@smoke4)'
```

### Skipping & Focusing

```js
xScenario('skipped test', ...)       // skip
Scenario.skip('skipped test', ...)   // skip
Scenario.only('focused test', ...)   // run only this test

xFeature('Skipped Suite')            // skip entire file
Feature.skip('Skipped Suite')        // skip entire file
Feature.only('Run Only This Suite')  // focus entire file
```

### Todo Scenarios

Mark scenarios as planned but not yet implemented:

```js
Scenario.todo('user can reset password')

Scenario.todo('user can change avatar', ({ I }) => {
  /**
   * 1. Open profile settings
   * 2. Upload new avatar
   * Result: avatar is updated
   */
})
```

## Hooks

### Before / After

Run code before or after **each scenario** in the file:

```js
Before(({ I }) => {
  I.amOnPage('/')
})

After(({ I }) => {
  I.clearCookie()
})
```

These are equivalent to `beforeEach` / `afterEach` in Mocha/Jest.

Hooks can be retried on failure:

```js
Before(({ I }) => {
  I.amOnPage('/dashboard')
}).retry(3)
```

### BeforeSuite / AfterSuite

Run code once before or after **all scenarios** in the file — equivalent to `beforeAll` / `afterAll`:

```js
BeforeSuite(async ({ I }) => {
  // seed test data before any scenario runs
  await I.executeScript(() => window.resetDatabase())
})

AfterSuite(async ({ I }) => {
  await I.executeScript(() => window.cleanupDatabase())
})
```

> **Note:** The browser is available in `BeforeSuite` when using Playwright or Puppeteer helpers.

Hooks can also be configured at Feature level:

```js
Feature('My Suite', {
  retryBefore: 3,
  retryBeforeSuite: 2,
  retryAfter: 1,
  retryAfterSuite: 3,
})
```
