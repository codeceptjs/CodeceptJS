---
permalink: /within
title: Within
---

# Within

`Within` narrows the execution context to a specific element or iframe on the page. All actions called inside a `Within` block are scoped to the matched element.

```js
import { Within } from 'codeceptjs/effects'
```

## Begin / End Pattern

The simplest way to use `Within` is the begin/end pattern. Call `Within` with a locator to start, perform actions, then call `Within()` with no arguments to end:

```js
Within('.signup-form')
I.fillField('Email', 'user@example.com')
I.fillField('Password', 'secret')
I.click('Sign Up')
Within()
```

Steps between `Within('.signup-form')` and `Within()` are scoped to `.signup-form`. After `Within()`, the context resets to the full page.

### Auto-end previous context

Starting a new `Within` automatically ends the previous one:

```js
Within('.sidebar')
I.click('Dashboard')

Within('.main-content') // ends .sidebar, begins .main-content
I.see('Welcome')
Within()
```

### Forgetting to close

If you forget to call `Within()` at the end, the context is automatically cleaned up when the test finishes. However, it is good practice to always close it explicitly.

## Callback Pattern

The callback pattern wraps actions in a function. The context is automatically closed when the function returns:

```js
Within('.signup-form', () => {
  I.fillField('Email', 'user@example.com')
  I.fillField('Password', 'secret')
  I.click('Sign Up')
})
I.see('Account created')
```

### Returning values

The callback pattern supports returning values. Use `await` on both the `Within` call and the inner action:

```js
const text = await Within('#sidebar', async () => {
  return await I.grabTextFrom('h1')
})
I.fillField('Search', text)
```

## When to use `await`

**Begin/end pattern** does not need `await`:

```js
Within('.form')
I.fillField('Name', 'John')
Within()
```

**Callback pattern** needs `await` when:

- The callback is `async`
- You need a return value from `Within`

```js
// async callback — await required
await Within('.form', async () => {
  await I.click('Submit')
  await I.waitForText('Done')
})
```

```js
// sync callback — no await needed
Within('.form', () => {
  I.fillField('Name', 'John')
  I.click('Submit')
})
```

## Working with IFrames

Use the `frame` locator to scope actions inside an iframe:

```js
// Begin/end
Within({ frame: 'iframe' })
I.fillField('Email', 'user@example.com')
I.click('Submit')
Within()

// Callback
Within({ frame: '#editor-frame' }, () => {
  I.see('Page content')
})
```

### Nested IFrames

Pass an array of selectors to reach nested iframes:

```js
Within({ frame: ['.wrapper', '#content-frame'] }, () => {
  I.fillField('Name', 'John')
  I.see('Sign in!')
})
```

Each selector in the array navigates one level deeper into the iframe hierarchy.

### switchTo auto-disables Within

If you call `I.switchTo()` while inside a `Within` context, the within context is automatically ended. This prevents conflicts between the two scoping mechanisms:

```js
Within('.sidebar')
I.click('Open editor')
I.switchTo('#editor-frame') // automatically ends Within('.sidebar')
I.fillField('content', 'Hello')
I.switchTo() // exits iframe
```

## Usage in Page Objects

In page objects, import `Within` directly:

```js
// pages/Login.js
import { Within } from 'codeceptjs/effects'

export default {
  loginForm: '.login-form',

  fillCredentials(email, password) {
    Within(this.loginForm)
    I.fillField('Email', email)
    I.fillField('Password', password)
    Within()
  },

  submitLogin(email, password) {
    this.fillCredentials(email, password)
    I.click('Log In')
  },
}
```

```js
// tests/login_test.js
Scenario('user can log in', ({ I, loginPage }) => {
  I.amOnPage('/login')
  loginPage.submitLogin('user@example.com', 'password')
  I.see('Dashboard')
})
```

The callback pattern also works in page objects:

```js
// pages/Checkout.js
import { Within } from 'codeceptjs/effects'

export default {
  async getTotal() {
    return await Within('.order-summary', async () => {
      return await I.grabTextFrom('.total')
    })
  },
}
```

## Deprecated: lowercase `within`

The lowercase `within()` is still available as a global function for backward compatibility, but it is deprecated:

```js
// deprecated — still works, shows a one-time warning
within('.form', () => {
  I.fillField('Name', 'John')
})

// recommended
import { Within } from 'codeceptjs/effects'
Within('.form', () => {
  I.fillField('Name', 'John')
})
```

The global `within` only supports the callback pattern. For the begin/end pattern, you must import `Within`.

## Output

When running steps inside a `Within` block, the output shows them indented under the context:

```
  Within ".signup-form"
    I fill field "Email", "user@example.com"
    I fill field "Password", "secret"
    I click "Sign Up"
  I see "Account created"
```

## Tips

- Prefer the begin/end pattern for simple linear flows — it's more readable.
- Use the callback pattern when you need return values or want guaranteed cleanup.
- Avoid deeply nesting `Within` blocks. If you find yourself needing nested contexts, consider restructuring your test.
- `Within` cannot be used inside a `session`. Use `session` at the top level and `Within` inside it, not the other way around.
