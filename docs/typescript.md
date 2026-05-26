---
permalink: /typescript
title: TypeScript
---

# TypeScript

CodeceptJS ships [type declarations](https://github.com/codeceptjs/CodeceptJS/tree/master/typings), so you can write tests, page objects, and custom helpers in TypeScript and get autocomplete and type checking in your editor.

## Getting started

`npx codeceptjs init` scaffolds a TypeScript project when you answer **Yes** to:

```
? Do you plan to write tests in TypeScript? Yes
```

It writes `codecept.conf.ts` and `*_test.ts` files. The **config file** and helpers are transpiled automatically. **Test files** need a loader — CodeceptJS 4.x is ESM, and Mocha loads test files through CommonJS hooks, so use [`tsx`](https://tsx.is) (fast, esbuild-based, no `tsconfig.json` required):

```sh
npm i tsx --save-dev
```

```ts
// codecept.conf.ts
export const config = {
  tests: './**/*_test.ts',
  require: ['tsx/cjs'],   // loads the *_test.ts files
  helpers: {
    Playwright: { url: 'http://localhost', browser: 'chromium' },
  },
}
```

Run the tests with `npx codeceptjs run`.

> Adding TypeScript to an existing project: set `"type": "module"` in `package.json`, rename the config to `codecept.conf.ts` with `export const config = {}`, install `tsx`, and add `require: ['tsx/cjs']`.

## Writing tests

Test files use the full TypeScript syntax — imports, enums, interfaces, types:

```ts
// fixtures.ts
export interface User { email: string; password: string }
export const admin: User = { email: 'admin@example.com', password: 's3cret' }

// login_test.ts
import { admin } from './fixtures'

Feature('Login')

Scenario('admin signs in', ({ I }) => {
  I.amOnPage('/login')
  I.fillField('email', admin.email)
  I.fillField('password', admin.password)
  I.click('Login')
  I.see('Welcome')
})
```

> **Cannot find module** or **Unexpected token** while running tests means the loader isn't wired up — check that `tsx` is installed and `require: ['tsx/cjs']` is in the config.

## Promise-based typings

CodeceptJS tests read synchronously even though every `I.*` call returns a promise:

```ts
I.amOnPage('/')
I.click('Login')
I.see('Hello')
```

The default typings declare these methods as returning `void`, so a linter won't demand `await` on every line. To follow TypeScript conventions and `await` each command instead — some teams find explicit flow control improves stability — enable promise-based typings in `codecept.conf.ts`:

```ts
export const config = {
  fullPromiseBased: true,
  // ...
}
```

Rebuild the type definitions:

```sh
npx codeceptjs def
```

Now the typings return promises:

```ts
await I.amOnPage('/')
await I.click('Login')
await I.see('Hello')
```

## Types for page objects and custom helpers

`npx codeceptjs def` regenerates `steps.d.ts` from your config — run it after adding a page object or a custom helper so autocomplete picks them up.

For a custom helper:

```ts
// CustomHelper.ts
export class CustomHelper extends Helper {
  printMessage(msg: string) {
    console.log(msg)
  }
}
```

Register it in `codecept.conf.ts` ([helper configuration](/helpers#configuration)), run `npx codeceptjs def`, and `steps.d.ts` becomes:

```ts
/// <reference types='codeceptjs' />
type CustomHelper = import('./CustomHelper')

declare namespace CodeceptJS {
  interface SupportObject { I: I }
  interface Methods extends Playwright, CustomHelper {}
  interface I extends WithTranslation<Methods> {}
}
```

Page objects appear the same way — `def` adds a `type` for each and lists them in `SupportObject`:

```ts
type loginPage = typeof import('./loginPage')
type homePage = typeof import('./homePage')

declare namespace CodeceptJS {
  interface SupportObject { I: I, loginPage: loginPage, homePage: homePage }
  // ...
}
```

## Types for custom locators

If you use [custom locators](/locators#custom-locators) — for example `I.click({ data: 'user-login' })` — declare their shape in the `CustomLocators` interface in `steps.d.ts` so they're accepted wherever a locator is expected:

```ts
/// <reference types='codeceptjs' />

declare namespace CodeceptJS {
  interface CustomLocators {
    data: { data: string }
  }
}
```

Only the property *types* matter, not the keys. Locators with several (optional) properties work too:

```ts
declare namespace CodeceptJS {
  interface CustomLocators {
    data: { data: string; value?: number; flag?: boolean }
  }
}
```
