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

Now, 

### Configure tsconfig.json

We recommended the following configuration in a [tsconfig.json](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html):

```json
```



