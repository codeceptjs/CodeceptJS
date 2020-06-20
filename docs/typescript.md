---
permalink: /typescript
title: TypeScript
---

# Typescript

CodeceptJS supports [type declaration](https://github.com/codecept-js/CodeceptJS/tree/master/typings) for [TypeScript](https://www.typescriptlang.org/). It means that allow you to write your tests in TypeScript. Also, all of your custom steps could be write in TypeScript.

# Why TypeScript?

With the TypeScript writing CodeceptJS tests becomes much easier. If correctly configured TypeScript in your project and correctly configured your IDE, then you can get the following features as result:
- [Autocomplete (with InteleSence)](https://code.visualstudio.com/docs/editor/intellisense) - a tool that tries complete your thoughts for you and suggest you which function or property exist in class, what arguments can be passed to the method, what method return etc. 
Example:

![Auto Complete](/img/Auto_comlete.gif)

- Quick info about members - show info about each of your steps right in your tests. Example:

![Quick Info](/img/Quick_info.gif)

- Checks types - thanks to TypeScript support in CodeceptJS now allow to tests your tests. TypeScript can prevent some errors: 
  - invalid type of variables passed to function;
  - calls no-exist method from PageObject or `I` object;
  - incorrect used CodeceptJS features; 


## Getting Started
### Instal TypeScipt

For writing tests in TypeScript you`ll need to install TypeScript and ts-node in your project.

`npm install typescript ts-node`

### Configure codecept.conf.js

To configure TypeScript in your project, you need to add [`ts-node/register`](https://github.com/TypeStrong/ts-node) on first line in your config. Like in the following config file:

```js
require('ts-node/register')

exports.config = {
  tests: './*_test.ts',
  output: './output',
  helpers: {
    Puppeteer: {
      url: 'http://example.com',
    },
  },
  name: 'project name',
}
```

### Configure tsconfig.json

We recommended the following configuration in a [tsconfig.json](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html):

```json
{
  "ts-node": {
    "files": true
  },
  "compilerOptions": {
    "target": "es2018",
    "lib": ["es2018", "DOM"],
    "esModuleInterop": true,
    "module": "commonjs",
    "strictNullChecks": true,
    "types": ["codeceptjs"],
  },
}
```

> You can find an example project with TypeScript and CodeceptJS on our project [typescript-boilerplate](https://github.com/codecept-js/typescript-boilerplate).

### Set up steps.d.ts

Not enough to configure `tsconfig.json` and `codecept.cong.js`. Also need to configure `steps.d.ts` file with custom steps. For it need to run def command:

`npx codeceptjs def`

As a result, a file will be created on your root folder with following content:

```ts
/// <reference types='codeceptjs' />

declare namespace CodeceptJS {
  interface SupportObject { I: I }
  interface Methods extends Puppeteer {}
  interface I extends WithTranslation<Methods> {}
  namespace Translation {
    interface Actions {}
  }
}

```
