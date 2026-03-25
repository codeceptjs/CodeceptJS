---
permalink: /effects
title: Effects
---

# Effects

Effects are functions that can modify scenario flow. They provide ways to handle conditional steps, retries, scoped contexts, and test flow control.

## Installation

Effects can be imported directly from CodeceptJS:

```js
// ESM
import { tryTo, retryTo, within } from 'codeceptjs/effects'

// CommonJS
const { tryTo, retryTo, within } = require('codeceptjs/effects')
```

> 📝 Note: Prior to v3.7, `tryTo` and `retryTo` were available globally via plugins. This behavior is deprecated and will be removed in v4.0.

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

This documentation covers the main effects functionality while providing practical examples and important notes about deprecation and future changes. Let me know if you'd like me to expand any section or add more examples!
