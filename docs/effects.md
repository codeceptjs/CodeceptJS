---
permalink: /effects
title: Effects
---

# Effects

Effects are functions that can modify scenario flow. They provide ways to handle conditional steps, retries, scoped contexts, and test flow control.

## Installation

Effects can be imported directly from CodeceptJS:

```js
import { tryTo, retryTo, hopeThat, within } from 'codeceptjs/effects'
```

> 📝 Note: Prior to v4, `tryTo` and `retryTo` were enabled via plugins (`tryTo`, `retryTo`) that registered them as globals. Those plugins are removed in v4 — import effects from `codeceptjs/effects` instead.

## tryTo

The `tryTo` effect allows you to attempt steps that may fail without stopping test execution. It's useful for handling optional steps or conditions that aren't critical for the test flow.

```js
import { tryTo } from 'codeceptjs/effects'

// inside a test
const success = await tryTo(() => {
  // These steps may fail but won't stop the test
  I.see('Cookie banner')
  I.click('Accept cookies')
})

if (!success) {
  I.say('Cookie banner was not found')
}
```

If the steps inside `tryTo` fail:

- The test will continue execution
- The failure will be logged in debug output
- `tryTo` returns `false`
- Auto-retries are disabled inside `tryTo` blocks

## hopeThat

`hopeThat` is the soft-assertion effect. It wraps a block of steps; if any step inside fails, the failure is recorded as a note on the test and `hopeThat` returns `false`, but the scenario keeps running. Call `hopeThat.noErrors()` once at the end to fail the scenario if any soft assertion failed.

```js
import { hopeThat } from 'codeceptjs/effects'

Scenario('form shows every validation error', ({ I }) => {
  I.amOnPage('/signup')
  I.click('Submit')

  await hopeThat(() => I.see('Email is required', '#email-error'))
  await hopeThat(() => I.see('Password is required', '#password-error'))
  await hopeThat(() => I.see('You must accept the terms', '#terms-error'))

  hopeThat.noErrors()  // throws once, listing every recorded failure
})
```

`hopeThat` returns `Promise<boolean>` — `true` on success, `false` on caught failure — which is handy for branching:

```js
const cookieAccepted = await hopeThat(() => I.click('Accept cookies'))
if (!cookieAccepted) I.say('No cookie banner')
```

> 💡 In 3.x, soft assertions were provided by `SoftExpectHelper` (`I.softAssert`, `I.softExpectEqual`, `I.flushSoftAssertions`). That helper is gone in 4.x — use `hopeThat()` and `hopeThat.noErrors()` instead. `hopeThat` works with **any** assertion you can write inside a step: built-in `I.see*`, custom-helper assertions, `expect()` from your own assertion library, plain `assert` from Node — anything that throws on failure.

The same `hopeThat` is also re-exported from `codeceptjs/assertions` if you prefer that subpath:

```js
import { hopeThat } from 'codeceptjs/assertions'
```

## retryTo

The `retryTo` effect allows you to retry a set of steps multiple times until they succeed. This is useful for handling flaky elements or conditions that may need multiple attempts.

```js
import { retryTo } from 'codeceptjs/effects'

// Retry up to 5 times with 200ms between attempts
await retryTo(() => {
  I.switchTo('#editor-frame')
  I.fillField('textarea', 'Hello world')
}, 5)
```

Parameters:

- `callback` - Function containing steps to retry
- `maxTries` - Maximum number of retry attempts
- `pollInterval` - (optional) Delay between retries in milliseconds (default: 200ms)

The callback receives the current retry count as an argument:

```js
import { retryTo } from 'codeceptjs/effects'

// inside a test...
await retryTo(tries => {
  I.say(`Attempt ${tries}`)
  I.click('Submit')
  I.see('Success')
}, 3)
```

## within

The `within` effect scopes all actions inside it to a specific element on the page — useful when working with repeated UI components or narrowing interaction to a specific section.

```js
import { within } from 'codeceptjs/effects'

// inside a test...
await within('.js-signup-form', () => {
  I.fillField('user[login]', 'User')
  I.fillField('user[email]', 'user@user.com')
  I.fillField('user[password]', 'user@user.com')
  I.click('button')
})
I.see('There were problems creating your account.')
```

> ⚠ `within` can cause problems when used incorrectly. If you see unexpected behavior, refactor to use the context parameter on individual actions instead (e.g. `I.click('Login', '.nav')`). Keep `within` for the simplest cases.

> ⚠ Since `within` returns a Promise, always `await` it when you need its return value.

### IFrames

Use a `frame` locator to scope actions inside an iframe:

```js
await within({ frame: '#editor' }, () => {
  I.see('Page')
  I.fillField('Body', 'Hello world')
})
```

Nested iframes _(WebDriver & Puppeteer only)_:

```js
await within({ frame: ['.content', '#editor'] }, () => {
  I.see('Page')
})
```

> ℹ IFrames can also be accessed via `I.switchTo` command.

### Returning Values

`within` can return a value for use in the scenario:

```js
const val = await within('#sidebar', () => {
  return I.grabTextFrom({ css: 'h1' })
})
I.fillField('Description', val)
```

When running steps inside a `within` block, they will be shown indented in the output.

## Usage with TypeScript

Effects are fully typed and work well with TypeScript:

```ts
import { tryTo, retryTo, within } from 'codeceptjs/effects'

const success = await tryTo(async () => {
  await I.see('Element')
})
```

