---
permalink: /sessions
title: Multiple Sessions
---

# Multiple Sessions

CodeceptJS can run several browser sessions in a single test. This is useful for testing real-time features like chat, notifications, or multi-user workflows.

```js
Scenario('two users chat', ({ I }) => {
  I.amOnPage('/chat')
  I.fillField('name', 'davert')
  I.click('Sign In')
  I.see('Hello, davert')

  session('john', () => {
    I.amOnPage('/chat')
    I.fillField('name', 'john')
    I.click('Sign In')
    I.see('Hello, john')
  })

  // back in default session (davert)
  I.fillField('message', 'Hi, john')
  I.see('me: Hi, john', '.messages')

  session('john', () => {
    I.see('davert: Hi, john', '.messages')
  })
})
```

Switch back to a session at any point by using the same name.

## Session Configuration

Override the browser config for a specific session:

```js
session('mobile', { browser: 'webkit', viewport: { width: 375, height: 812 } }, () => {
  I.amOnPage('/')
  I.see('Mobile View')
})
```

## Opening Sessions Without Switching

Open sessions in the background without switching to them immediately:

```js
Scenario('multi-user test', ({ I }) => {
  session('john')
  session('mary')
  session('jane')

  I.amOnPage('/')

  session('mary', () => {
    I.amOnPage('/login')
  })
})
```

## Returning Values

`session` can return a value for use in the main scenario:

```js
const profileName = await session('john', () => {
  I.amOnPage('/profile')
  return I.grabTextFrom({ css: 'h1' })
})
I.fillField('Recipient', profileName)
```

## Notes

- Sessions can use the `I` object, page objects, and any other objects declared for the scenario
- `within` can be used inside a session, but `session` cannot be called from inside `within`
