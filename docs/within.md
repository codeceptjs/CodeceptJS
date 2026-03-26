---
permalink: /within
title: within
---

# within

`within` narrows the execution context to a specific element or iframe on the page. All actions called inside a `within` block are scoped to the matched element.

```js
import { within } from 'codeceptjs/effects'
```

## Begin / Leave Pattern

The simplest way to use `within` is the begin/leave pattern. Call `within` with a locator to start — it returns a context object. Call `.leave()` on it when done:

```js
const area = within('.signup-form')
I.fillField('Email', 'user@example.com')
I.fillField('Password', 'secret')
I.click('Sign Up')
area.leave()
```

Steps between `within('.signup-form')` and `area.leave()` are scoped to `.signup-form`. After `leave()`, the context resets to the full page.

You can also end a context by calling `within()` with no arguments:

```js
within('.signup-form')
I.fillField('Email', 'user@example.com')
within()
```

### Auto-end previous context

Starting a new `within` automatically ends the previous one:

```js
within('.sidebar')
I.click('Dashboard')

within('.main-content') // ends .sidebar, begins .main-content
I.see('Welcome')
within()
```

### Forgetting to close

If you forget to call `leave()` or `within()` at the end, the context is automatically cleaned up when the test finishes. However, it is good practice to always close it explicitly.

## Callback Pattern

The callback pattern wraps actions in a function. The context is automatically closed when the function returns:

```js
within('.signup-form', () => {
  I.fillField('Email', 'user@example.com')
  I.fillField('Password', 'secret')
  I.click('Sign Up')
})
I.see('Account created')
```

### Returning values

The callback pattern supports returning values. Use `await` on both the `within` call and the inner action:

```js
const text = await within('#sidebar', async () => {
  return await I.grabTextFrom('h1')
})
I.fillField('Search', text)
```

## When to use `await`

**Begin/leave pattern** does not need `await`:

```js
const area = within('.form')
I.fillField('Name', 'John')
area.leave()
```

**Callback pattern** needs `await` when:

- The callback is `async`
- You need a return value from `within`

```js
// async callback — await required
await within('.form', async () => {
  await I.click('Submit')
  await I.waitForText('Done')
})
```

```js
// sync callback — no await needed
within('.form', () => {
  I.fillField('Name', 'John')
  I.click('Submit')
})
```

## Working with IFrames

Use the `frame` locator to scope actions inside an iframe:

```js
// Begin/leave
const area = within({ frame: 'iframe' })
I.fillField('Email', 'user@example.com')
I.click('Submit')
area.leave()

// Callback
within({ frame: '#editor-frame' }, () => {
  I.see('Page content')
})
```

### Nested IFrames

Pass an array of selectors to reach nested iframes:

```js
within({ frame: ['.wrapper', '#content-frame'] }, () => {
  I.fillField('Name', 'John')
  I.see('Sign in!')
})
```

Each selector in the array navigates one level deeper into the iframe hierarchy.

### switchTo auto-disables within

If you call `I.switchTo()` while inside a `within` context, the within context is automatically ended. This prevents conflicts between the two scoping mechanisms:

```js
const area = within('.sidebar')
I.click('Open editor')
I.switchTo('#editor-frame') // automatically ends within('.sidebar')
I.fillField('content', 'Hello')
I.switchTo() // exits iframe
```

## Usage in Page Objects

In page objects, import `within` directly:

```js
// pages/Login.js
import { within } from 'codeceptjs/effects'

export default {
  loginForm: '.login-form',

  fillCredentials(email, password) {
    const area = within(this.loginForm)
    I.fillField('Email', email)
    I.fillField('Password', password)
    area.leave()
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
import { within } from 'codeceptjs/effects'

export default {
  async getTotal() {
    return await within('.order-summary', async () => {
      return await I.grabTextFrom('.total')
    })
  },
}
```

## Output

When running steps inside a `within` block, the output shows them indented under the context:

```
  Within ".signup-form"
    I fill field "Email", "user@example.com"
    I fill field "Password", "secret"
    I click "Sign Up"
  I see "Account created"
```

## Tips

- Prefer the begin/leave pattern for simple linear flows — it's more readable.
- Use the callback pattern when you need return values or want guaranteed cleanup.
- Avoid deeply nesting `within` blocks. If you find yourself needing nested contexts, consider restructuring your test.
- `within` cannot be used inside a `session`. Use `session` at the top level and `within` inside it, not the other way around.
