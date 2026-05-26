---
permalink: /within
title: Within
---

# Within

`within` scopes all actions inside it to a specific element on the page — useful when working with repeated UI components or narrowing interaction to a specific section.

```js
within('.js-signup-form', () => {
  I.fillField('user[login]', 'User')
  I.fillField('user[email]', 'user@user.com')
  I.fillField('user[password]', 'user@user.com')
  I.click('button')
})
I.see('There were problems creating your account.')
```

> ⚠ `within` can cause problems when used incorrectly. If you see unexpected behavior, refactor to use the context parameter on individual actions instead (e.g. `I.click('Login', '.nav')`). Keep `within` for the simplest cases.
> Since `within` returns a Promise, always `await` it when you need its return value.

## IFrames

Use a `frame` locator to scope actions inside an iframe:

```js
within({ frame: '#editor' }, () => {
  I.see('Page')
  I.fillField('Body', 'Hello world')
})
```

Nested iframes _(WebDriver & Puppeteer only)_:

```js
within({ frame: ['.content', '#editor'] }, () => {
  I.see('Page')
})
```

> ℹ IFrames can also be accessed via `I.switchTo` command.

## Returning Values

`within` can return a value for use in the scenario:

```js
const val = await within('#sidebar', () => {
  return I.grabTextFrom({ css: 'h1' })
})
I.fillField('Description', val)
```

When running steps inside a `within` block, they will be shown indented in the output.
