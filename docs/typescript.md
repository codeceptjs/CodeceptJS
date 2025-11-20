---
permalink: /typescript
title: TypeScript
---

# TypeScript

CodeceptJS supports [type declaration](https://github.com/codeceptjs/CodeceptJS/tree/master/typings) for [TypeScript](https://www.typescriptlang.org/). It means that you can write your tests in TS. Also, all of your custom steps can be written in TS

# Why TypeScript?

With the TypeScript writing CodeceptJS tests becomes much easier. If you configure TS properly in your project as well as your IDE, you will get the following features:
- [Autocomplete (with IntelliSense)](https://code.visualstudio.com/docs/editor/intellisense) - a tool that streamlines your work by suggesting when you typing what function or property which exists in a class, what arguments can be passed to that method, what it returns, etc.
Example:

![Auto Complete](/img/Auto_comlete.gif)

- To show additional information for a step in a test. Example:

![Quick Info](/img/Quick_info.gif)

- Checks types - thanks to TypeScript support in CodeceptJS now allow to tests your tests. TypeScript can prevent some errors:
  - invalid type of variables passed to function;
  - calls no-exist method from PageObject or `I` object;
  - incorrectly used CodeceptJS features;


## Getting Started <Badge text="Since 3.3.5" type="warning"/>

CodeceptJS can initialize tests as a TypeScript project.
When starting a new project with a standard installation via 

```
npx codeceptjs init
``` 
Then select TypeScript as the first question:

```
? Do you plan to write tests in TypeScript? Yes
```

Then a config file and new tests will be created in TypeScript format.

If a config file is set in TypeScript format (`codecept.conf.ts`) package `ts-node` will be used to run tests. 

## TypeScript Tests in ESM (CodeceptJS 4.x) <Badge text="Since 4.0.0" type="tip"/>

CodeceptJS 4.x uses ES Modules (ESM) which requires a different approach for TypeScript test files. While TypeScript **config files** (`codecept.conf.ts`) are automatically transpiled, TypeScript **test files** need a loader.

### Using tsx (Recommended)

[tsx](https://tsx.is) is a modern, fast TypeScript loader built on esbuild. It's the recommended way to run TypeScript tests in CodeceptJS 4.x.

**Installation:**
```bash
npm install --save-dev tsx
```

**Configuration:**
```typescript
// codecept.conf.ts
export const config = {
  tests: './**/*_test.ts',
  require: ['tsx/cjs'],  // ← Enable TypeScript loader for test files
  helpers: {
    Playwright: {
      url: 'http://localhost',
      browser: 'chromium'
    }
  }
}
```

That's it! Now you can write tests in TypeScript with full language support:

```typescript
// login_test.ts
Feature('Login')

Scenario('successful login', ({ I }) => {
  I.amOnPage('/login')
  I.fillField('email', 'user@example.com')
  I.fillField('password', 'password123')
  I.click('Login')
  I.see('Welcome')
})
```

**Why tsx?**
- ⚡ **Fast:** Built on esbuild, much faster than ts-node
- 🎯 **Zero config:** Works without tsconfig.json  
- 🚀 **Works with Mocha:** Uses CommonJS hooks that Mocha understands
- ✅ **Complete:** Handles all TypeScript features (enums, decorators, etc.)

### Using ts-node/esm (Alternative)

If you prefer ts-node:

**Installation:**
```bash
npm install --save-dev ts-node
```

**Configuration:**
```typescript
// codecept.conf.ts
export const config = {
  tests: './**/*_test.ts',
  require: ['ts-node/esm'],  // ← Use ts-node ESM loader
  helpers: { /* ... */ }
}
```

**Required tsconfig.json:**
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "target": "ES2022",
    "moduleResolution": "node",
    "esModuleInterop": true
  },
  "ts-node": {
    "esm": true
  }
}
```

**Required package.json:**
```json
{
  "name": "your-project",
  "version": "1.0.0"
  // ⚠️ DO NOT include "type": "module" when using ts-node/esm
  // ts-node/esm works with CommonJS-style loading
}
```

**⚠️ Important Notes:**

1. **Do not use `"type": "module"`** in your package.json when using `ts-node/esm`. The ts-node/esm loader uses CommonJS-style module loading internally and is incompatible with `"type": "module"`.

2. **Use `.js` extensions in imports**: When writing TypeScript code for ESM, you must use `.js` extensions in your imports, even when importing TypeScript files:

```typescript
// ❌ Wrong - will cause "Cannot find module" error
import loginPage from "./pages/Login"

// ✅ Correct - use .js extension
import loginPage from "./pages/Login.js"
```

TypeScript will automatically resolve `.js` imports to `.ts` files during type-checking. This is the standard approach for ESM + TypeScript projects as documented in the [TypeScript handbook](https://www.typescriptlang.org/docs/handbook/modules/theory.html#typescript-imitates-the-hosts-module-resolution-but-with-types).

3. **For `"type": "module"` projects, use `tsx` instead**: If you need `"type": "module"` in your package.json, use `tsx/cjs` which is designed to work in both CommonJS and ESM contexts.

### Full TypeScript Features in Tests

With tsx or ts-node/esm, you can use complete TypeScript syntax including imports, enums, interfaces, and types:

```typescript
// types.ts
export enum Environment {
  TEST = 'test',
  STAGING = 'staging',
  PRODUCTION = 'production'
}

export interface User {
  email: string
  password: string
}

// login_test.ts
import { Environment, User } from './types'

const testUser: User = {
  email: 'test@example.com',
  password: 'password123'
}

Feature('Login')

Scenario(`Login on ${Environment.TEST}`, ({ I }) => {
  I.amOnPage('/login')
  I.fillField('email', testUser.email)
  I.fillField('password', testUser.password)
  I.click('Login')
  I.see('Welcome')
})
```

### Troubleshooting TypeScript Tests

**Error: "Cannot find module" or "Unexpected token"**

This means the TypeScript loader isn't configured. Make sure:
1. You have `tsx` or `ts-node` installed: `npm install --save-dev tsx`
2. Your config includes the loader in `require` array: `require: ['tsx/cjs']`
3. The loader is specified before test files are loaded

**Error: Module not found when importing from `.ts` files**

When using `ts-node/esm` with ESM, you need to use `.js` extensions in imports:

```typescript
// This will cause an error in ESM mode:
import loginPage from "./pages/Login"

// Use .js extension instead:
import loginPage from "./pages/Login.js"
```

TypeScript will resolve the `.js` import to your `.ts` file during compilation. This is the standard behavior for ESM + TypeScript.

Alternatively, use `tsx/cjs` which doesn't require explicit extensions.

**TypeScript config files vs test files**

Note the difference:
- **Config files** (`codecept.conf.ts`, helpers): Automatically transpiled by CodeceptJS
- **Test files** (`*_test.ts`): Need a loader specified in `config.require`

### Migration from CodeceptJS 3.x

If you're upgrading from CodeceptJS 3.x (CommonJS) to 4.x (ESM):

**Old setup (3.x):**
```javascript
// codecept.conf.js
module.exports = {
  tests: './*_test.ts',
  require: ['ts-node/register'],  // CommonJS loader
  helpers: {}
}
```

**New setup (4.x):**
```typescript
// codecept.conf.ts
export const config = {
  tests: './*_test.ts',
  require: ['tsx/cjs'],  // TypeScript loader
  helpers: {}
}
```

**Migration steps:**
1. Install tsx: `npm install --save-dev tsx`
2. Update package.json: `"type": "module"`
3. Rename config to `codecept.conf.ts` and use `export const config = {}`
4. Change `require: ['ts-node/register']` to `require: ['tsx/cjs']`
5. Run tests: `npx codeceptjs run`

## Promise-Based Typings

By default, CodeceptJS tests are written in synchronous mode. This is a regular CodeceptJS test:

```js
I.amOnPage('/')
I.click('Login')
I.see('Hello!')
```

Even thought we don't see any `await`, those commands are executed synchronously, one by one.
All methods of `I` object actually return promise and TypeScript linter requires to use `await` operator for those promises.
To trick TypeScript and allow writing tests in CodeceptJS manner we create typings where `void` is returned instead of promises. This way linter won't complain on async code without await, as no promise is returned. 

Our philosophy here is: use `await` only when it is actually needed, don't add visual mess to your code prefixing each line with `await`. However, you might want to get a better control of your tests and follow TypeScript conventions.
This is why you might want to **enable promise-based typings**.

A previous test should be rewritten with `await`s:

```js
await I.amOnPage('/')
await I.click('Login')
await I.see('Hello!')
```

Using `await` explicitly provides a beter control of execution flow. Some CodeceptJS users report that they increased stability of tests by adopting `await` for all CodeceptJS commands in their codebase.

If you select to use promise-based typings, type definitions will be generated so all actions to return a promise. 
Otherwise they will still return promises but it won't be relfected in type definitions.

To introduce promise-based typings into a current project edit `codecept.conf.ts`:

```ts
fullPromiseBased: true;
```

and rebuild type definitions with

```
npx codeceptjs def
```

## Types for custom helper or page object

If you want to get types for your [custom helper](https://codecept.io/helpers/#configuration), you can add their automatically with CodeceptJS command `npx codeceptjs def`.

For example, if you add the new step `printMessage` for your custom helper like this:
```js
// customHelper.ts
export class CustomHelper extends Helper {
  printMessage(msg: string) {
    console.log(msg)
  }
}

```

Then you need to add this helper to your `codecept.conf.js` like in this [docs](https://codecept.io/helpers/#configuration).
And then run the command `npx codeceptjs def`.

As result our `steps.d.ts` file will be updated like this:
```ts
/// <reference types='codeceptjs' />
type CustomHelper = import('./CustomHelper');

declare namespace CodeceptJS {
  interface SupportObject { I: I }
  interface Methods extends Puppeteer, CustomHelper {}
  interface I extends WithTranslation<Methods> {}
  namespace Translation {
    interface Actions {}
  }
}
```

And now you can use autocomplete on your test.

Generation types for PageObject looks like for a custom helper, but `steps.d.ts` will look like:
```ts
/// <reference types='codeceptjs' />
type loginPage = typeof import('./loginPage');
type homePage = typeof import('./homePage');
type CustomHelper = import('./CustomHelper');

declare namespace CodeceptJS {
  interface SupportObject { I: I, loginPage: loginPage, homePage: homePage }
  interface Methods extends Puppeteer, CustomHelper {}
  interface I extends WithTranslation<Methods> {}
  namespace Translation {
    interface Actions {}
  }
}
```

## Types for custom strict locators

You can define [custom strict locators](https://codecept.io/locators/#custom-strict-locators) that can be used in all methods taking a locator (parameter type `LocatorOrString`).

Example: A custom strict locator with a `data` property, which can be used like this:

```ts
I.click({ data: 'user-login' });
```

In order to use the custom locator in TypeScript code, its type shape needs to be registered in the interface `CustomLocators` in your `steps.d.ts` file:

```ts
/// <reference types='codeceptjs' />
...

declare namespace CodeceptJS {
  ...

  interface CustomLocators {
    data: { data: string };
  }
}
```

The property keys used in the `CustomLocators` interface do not matter (only the *types* of the interface properties are used). For simplicity it is recommended to use the name that is also used in your custom locator itself.

You can also define more complicated custom locators with multiple (also optional) properties:

```ts
/// <reference types='codeceptjs' />
...

declare namespace CodeceptJS {
  ...

  interface CustomLocators {
    data: { data: string, value?: number, flag?: boolean };
  }
}
```
