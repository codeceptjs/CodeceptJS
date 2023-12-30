---
permalink: /vue
layout: Section
sidebar: false
title: Testing Vue Apps
---


# vue-cli-plugin-e2e-codeceptjs

*Hey, how about some end 2 end testing for your Vue apps?* 🤔

*Let's do it together! Vue, me, [CodeceptJS](https://codecept.io) & [Puppeteer](https://pptr.dev).* 🤗

*Browser testing was never that simple. Just see it!* 😍

```js
I.amOnPage('/');
I.click('My Component Button');
I.see('My Component');
I.say('I am happy!');
// that's right, this is a valid test!
```

## How to try it?

**Requirements:**

* NodeJS >= 8.9
* NPM / Yarn
* Vue CLI installed globally

```
npm i vue-cli-plugin-codeceptjs-puppeteer --save-dev
```

This will install CodeceptJS, CodeceptUI & Puppeteer with Chrome browser.

To add CodeceptJS to your project invoke installer:

```
vue invoke vue-cli-plugin-codeceptjs-puppeteer
```

> You will be asked about installing a demo component. If you start a fresh project **it is recommended to agree and install a demo component**, so you could see tests passing.


## Running Tests

We added npm scripts:

* `test:e2e` - will execute tests with browser opened. If you installed test component, and started a test server, running this command will show you a brower window passed test.
  * Use `--headless` option to run browser headlessly
  * Use `--serve` option to start a dev server before tests


Examples:

```
npm run test:e2e
npm run test:e2e -- --headless
npm run test:e2e -- --serve
```

> This command is a wrapper for `codecept run --steps`. You can use the [Run arguments and options](/commands#run) here.

* `test:e2e:parallel` - will execute tests headlessly in parallel processes (workers). By default runs tests in 2 workers.
  * Use an argument to set number of workers
  * Use `--serve` option to start dev server before running

Examples:

```
npm run test:e2e:parallel
npm run test:e2e:parallel -- 3
npm run test:e2e:parallel -- 3 --serve
```

> This command is a wrapper for `codecept run-workers 2`. You can use the [Run arguments and options](/commands#run-workers) here.

* `test:e2e:open` - this opens interactive web test runner. So you could see, review & run your tests from a browser.

![](https://user-images.githubusercontent.com/220264/70399222-b7a1bc00-1a2a-11ea-8f0b-2878b0328161.gif)

```
npm run test:e2e:open
```

## Directory Structure

Generator has created these files:

```js
codecept.conf.js          👈 codeceptjs config
jsconfig.json             👈 enabling type definitons
tests
├── e2e
│   ├── app_test.js       👈 demo test, edit it!
│   ├── output            👈 temp directory for screenshots, reports, etc
│   └── support
│       └── steps_file.js 👈 common steps
└── steps.d.ts            👈 type definitions
```

If you agreed to create a demo component, you will also see `TestMe` component in `src/components` folder.

## Locators

For Vue apps a special `vue` locator is available. It allows to select an element by its component name, and props.

```js
{ vue: 'MyComponent' }
{ vue: 'Button', props: { title: 'Click Me' }}
```

With Playwright, you can use Vue locators in any method where locator is required:

```js
I.click({ vue: 'Tab', props: { title: 'Click Me!' }});
I.seeElement({ vue: 't', props: { title: 'Clicked' }});
```

To find Vue element names and props in a tree use [Vue DevTools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) extension.

> Turn off minification for application builds otherwise component names will be uglified as well

Vue locators work via [Playwright Vue Locator](https://playwright.dev/docs/other-locators#vue-locator).

## How to write tests?

* Open `tests/e2e/app_js` and see the demo test
* Execute a test & use interactive pause to see how CodeceptJS works
* [Learn CodeceptJS basics](/basics)
* [Learn how to write CodeceptJS tests with Puppeteer](/puppeteer)
* [See full reference for CodeceptJS Puppeteer Helper](/helpers/Puppeteer)
* Ask your questions in [Slack](https://bit.ly/chat-codeceptjs) & [Forum](https://codecept.discourse.group/)

## Enjoy testing!

Testing is simple & fun, enjoy it!

With ❤ [CodeceptJS Team](https://codecept.io)

