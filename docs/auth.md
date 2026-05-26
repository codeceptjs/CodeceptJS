---
permalink: /auth
title: Authorization
---

# Authorization

The `auth` plugin logs a user in once and reuses that session for every test that follows. After the first login it stores the cookies (in memory or in a file) and replays them on later tests. If the session expires, the plugin notices and logs in again.

## Quick Start

Enable the plugin in `codecept.conf.js` and define one user with `login` and `check` functions:

```js
plugins: {
  auth: {
    enabled: true,
    users: {
      admin: {
        login: (I) => {
          I.amOnPage('/login')
          I.fillField('email', 'admin@site.com')
          I.fillField('password', secret('123456'))
          I.click('Sign in')
        },
        check: (I) => {
          I.amOnPage('/')
          I.see('Admin', '.navbar')
        },
      },
    },
  },
}
```

Inject `login` into a test and call it with the user name:

```js
Feature('Dashboard')

Before(({ login }) => {
  login('admin')
})

Scenario('admin sees the dashboard', ({ I }) => {
  I.amOnPage('/dashboard')
  I.see('Welcome, Admin')
})
```

## How It Works

When you call `login('admin')`:

1. **`restore`** opens a page and applies the saved cookies.
2. **`check`** verifies the user is signed in. If it throws or fails an assertion, the plugin assumes the session is dead.
3. **`login`** runs the sign-in flow when `restore` + `check` fail (or no cookies exist yet).
4. **`fetch`** reads the new cookies and stores them for the next test.

Defaults cover the common case: `fetch` calls `I.grabCookie()`, `restore` calls `I.amOnPage('/')` then `I.setCookie(cookies)`, and `check` is a no-op. Override any of them when your app needs something different.

## Configuration

| Option       | Default   | Purpose                                                  |
| ------------ | --------- | -------------------------------------------------------- |
| `users`      | —         | Map of session names to user definitions.                |
| `inject`     | `'login'` | Name of the function injected into tests.                |
| `saveToFile` | `false`   | Write cookies to `<output>/<name>_session.json`.         |

Each user accepts four functions:

- `login(I)` — sign-in flow. Required.
- `check(I, session)` — verify the session is still valid. Throw to force a re-login.
- `fetch(I)` — return the cookies (or token) to store. Defaults to `I.grabCookie()`.
- `restore(I, session)` — replay the stored session. Defaults to `I.amOnPage('/')` + `I.setCookie()`.

## When to Log In: `Before` vs `BeforeSuite`

You can call `login()` in either hook. Pick based on how many users a suite touches.

### `Before` — one login per test

The default and the safe choice. Use it whenever a suite mixes users, or when you are not on Playwright.

```js
Feature('Mixed users')

Scenario('admin can ban a user', ({ I, login }) => {
  login('admin')
  I.amOnPage('/users/42')
  I.click('Ban')
})

Scenario('regular user cannot see the ban button', ({ I, login }) => {
  login('user')
  I.amOnPage('/users/42')
  I.dontSee('Ban')
})
```

When the user changes between tests, the plugin clears the previous user's cookies before applying the new ones.

### `BeforeSuite` — one login per suite (Playwright only)

Calling `login()` from `BeforeSuite` lets Playwright load cookies *before* it opens the browser, which removes the extra navigation that `restore` would otherwise need. Use this only when every test in the suite runs as the same user.

```js
Feature('Admin reports')

BeforeSuite(({ login }) => {
  login('admin')
})

Scenario('export sales report', ({ I }) => {
  I.amOnPage('/reports/sales')
  I.click('Export')
})

Scenario('export traffic report', ({ I }) => {
  I.amOnPage('/reports/traffic')
  I.click('Export')
})
```

> ⚠ If a test inside the suite calls `login()` with a different user, the plugin resets the cookies and signs in again. That cancels the speed-up. When the suite needs more than one user, prefer `Before`.

## Persisting Sessions to a File

Set `saveToFile: true` to keep sessions across test runs. The plugin writes one JSON file per user into the output directory and reloads them on the next start.

```js
plugins: {
  auth: {
    enabled: true,
    saveToFile: true,
    users: { admin: { login: (I) => I.loginAsAdmin() } },
  },
}
```

This is most useful while writing tests: you log in once, then iterate without paying the sign-in cost on every run. Delete the JSON file (or let it expire on the server) to force a fresh login.

## Examples

### Reuse a `steps_file.js` helper

Move the sign-in flow into a custom step and call it from the plugin:

```js
plugins: {
  auth: {
    enabled: true,
    saveToFile: true,
    users: {
      admin: {
        login: (I) => I.loginAdmin(),
        check: (I) => {
          I.amOnPage('/')
          I.see('Admin')
        },
      },
    },
  },
}
```

### Multiple users with a custom inject name

Rename the injected function to `loginAs` for readability:

```js
plugins: {
  auth: {
    enabled: true,
    inject: 'loginAs',
    users: {
      user: {
        login: (I) => {
          I.amOnPage('/login')
          I.fillField('email', 'user@site.com')
          I.fillField('password', secret('123456'))
          I.click('Login')
        },
        check: (I) => I.see('User', '.navbar'),
      },
      admin: {
        login: (I) => {
          I.amOnPage('/login')
          I.fillField('email', 'admin@site.com')
          I.fillField('password', secret('123456'))
          I.click('Login')
        },
        check: (I) => I.see('Admin', '.navbar'),
      },
    },
  },
}
```

Inside a test:

```js
Before(({ loginAs }) => loginAs('user'))
```

### Let the helper keep cookies, skip `fetch`/`restore`

If your helper already keeps cookies between tests (e.g. WebDriver's `keepCookies: true`), disable `fetch` and `restore` so the plugin only handles the first login:

```js
helpers: {
  WebDriver: { keepCookies: true },
},
plugins: {
  auth: {
    enabled: true,
    users: {
      admin: {
        login: (I) => {
          I.amOnPage('/login')
          I.fillField('email', 'admin@site.com')
          I.fillField('password', secret('123456'))
          I.click('Login')
        },
        check: (I) => {
          I.amOnPage('/dashboard')
          I.see('Admin', '.navbar')
        },
        fetch: () => {},
        restore: () => {},
      },
    },
  },
}
```

### Sessions stored in local storage

Override `fetch` and `restore` to read and write a token instead of cookies:

```js
plugins: {
  auth: {
    enabled: true,
    users: {
      admin: {
        login: (I) => I.loginAsAdmin(),
        check: (I) => I.see('Admin', '.navbar'),
        fetch: (I) => I.executeScript(() => localStorage.getItem('session_id')),
        restore: (I, session) => {
          I.amOnPage('/')
          I.executeScript((s) => localStorage.setItem('session_id', s), session)
        },
      },
    },
  },
}
```

### Async login

When `login`, `check`, `restore`, or `fetch` is `async`, the plugin awaits it. Inside your test, `await` the injected function:

```js
plugins: {
  auth: {
    enabled: true,
    users: {
      admin: {
        login: async (I) => {
          const phrase = await I.grabTextFrom('#phrase')
          I.fillField('username', 'admin')
          I.fillField('password', secret('password'))
          I.fillField('phrase', phrase)
        },
        check: (I) => {
          I.amOnPage('/')
          I.see('Admin')
        },
      },
    },
  },
}
```

```js
Scenario('login', async ({ login }) => {
  await login('admin')
})
```

### Validate the session inside `check`

`check` receives the value returned by `fetch` as its second argument. Throw from `check` to force a fresh login:

```js
plugins: {
  auth: {
    enabled: true,
    users: {
      admin: {
        login: (I) => I.loginAsAdmin(),
        check: (I, session) => {
          if (session.profile.email !== 'admin@site.com') {
            throw new Error('Wrong user signed in')
          }
        },
      },
    },
  },
}
```

## Tips

- **Force a re-login** by throwing inside `check` — the plugin treats it as an expired session and runs `login` again.
- **Mask credentials** with `secret()` so passwords never appear in the test output. See [Secrets](/secrets).
- **Switch users mid-test** with `session()` when one scenario needs two browsers signed in as different users. See [Multiple Sessions](/sessions).
