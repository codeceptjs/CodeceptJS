---
permalink: /effects
title: Effects
---

# Effects

Effects are functions that can modify scenario flow. They provide ways to handle conditional steps, retries, scoped contexts, and test flow control.

## Installation

Effects can be imported directly from CodeceptJS:

```js
import { tryTo, retryTo, within } from 'codeceptjs/effects'
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

The `within` effect scopes actions to a specific element or iframe. It supports both a begin/leave pattern and a callback pattern:

```js
import { within } from 'codeceptjs/effects'

// Begin/leave pattern
const area = within('.modal')
I.see('Modal title')
I.click('Close')
area.leave()

// Callback pattern
within('.modal', () => {
  I.see('Modal title')
  I.click('Close')
})
```

See the full [within documentation](/within) for details on iframes, page objects, and `await` usage.

## Usage with TypeScript

Effects are fully typed and work well with TypeScript:

```ts
import { tryTo, retryTo, within } from 'codeceptjs/effects'

const success = await tryTo(async () => {
  await I.see('Element')
})
```
