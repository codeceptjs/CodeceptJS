---
permalink: /playwright
title: Testing with Playwright
---

# Testing with Playwright <Badge text="Since 2.5" type="warning"/>

Playwright is a Node library to automate the [Chromium](https://www.chromium.org/Home), [WebKit](https://webkit.org/) and [Firefox](https://www.mozilla.org/en-US/firefox/new/) browsers as well as [Electron](https://www.electronjs.org/) apps with a single API. It enables **cross-browser** web automation that is **ever-green**, **capable**, **reliable** and **fast**.

Playwright was built similarly to [Puppeteer](https://github.com/puppeteer/puppeteer), using its API and so is very different in usage. However, Playwright has cross browser support with better design for test automaiton.

Take a look at a sample test:

```js
I.amOnPage('https://github.com');
I.click('Sign in', '//html/body/div[1]/header');
I.see('Sign in to GitHub', 'h1');
I.fillField('Username or email address', 'something@totest.com');
I.fillField('Password', '123456');
I.click('Sign in');
I.see('Incorrect username or password.', '.flash-error');
```

It's readable and simple and working using Playwright API!

## Setup

To start you need CodeceptJS with Playwright packages installed

```bash
npm install codeceptjs playwright --save
```

Or see [alternative installation options](http://codecept.io/installation/)

> If you already have CodeceptJS project, just install `playwright` package and enable a helper it in config.

And a basic project initialized

```sh
npx codeceptjs init
```

You will be asked for a Helper to use, you should select Playwright and provide url of a website you are testing.

## Configuring

Make sure `Playwright` helper is enabled in `codecept.conf.js` config:

```js
{ // ..
  helpers: {
    Playwright: {
      url: "http://localhost",
      show: true,
      browser: 'chromium'
    }
  }
  // ..
}
```

> Turn off the `show` option if you want to run test in headless mode.
> If you don't specify the browser here, `chromium` will be used. Possible browsers are: `chromium`, `firefox` and `webkit`

Playwright uses different strategies to detect if a page is loaded. In configuration use `waitForNavigation` option for that:

When to consider navigation succeeded, defaults to `load`. Given an array of event strings, navigation is considered to be successful after all events have been fired. Events can be either:
- `load` - consider navigation to be finished when the load event is fired.
- `domcontentloaded` - consider navigation to be finished when the DOMContentLoaded event is fired.
- `networkidle` - consider navigation to be finished when there are no network connections for at least 500 ms.

```js
  helpers: {
    Playwright: {
      url: "http://localhost",
      show: true,
      browser: 'chromium',
      waitForNavigation: "networkidle0"
    }
  }
```

When a test runs faster than application it is recommended to increase `waitForAction` config value.
It will wait for a small amount of time (100ms) by default after each user action is taken.

> ▶ More options are listed in [helper reference](http://codecept.io/helpers/Playwright/).

## Writing Tests

Additional CodeceptJS tests should be created with `gt` command:

```sh
npx codeceptjs gt
```

As an example we will use `ToDoMvc` app for testing.

### Actions

Tests consist with a scenario of user's action taken on a page. The most widely used ones are:

* `amOnPage` - to open a webpage (accepts relative or absolute url)
* `click` - to locate a button or link and click on it
* `fillField` - to enter a text inside a field
* `selectOption`, `checkOption` - to interact with a form
* `wait*` to wait for some parts of page to be fully rendered (important for testing SPA)
* `grab*` to get values from page sources
* `see`, `dontSee` - to check for a text on a page
* `seeElement`, `dontSeeElement` - to check for elements on a page

> ℹ  All actions are listed in [Playwright helper reference](http://codecept.io/helpers/Playwright/).*

All actions which interact with elements can use **[CSS or XPath locators](https://codecept.io/locators/#css-and-xpath)**. Actions like `click` or `fillField` can locate elements by their name or value on a page:

```js
// search for link or button
I.click('Login');
// locate field by its label
I.fillField('Name', 'Miles');
// we can use input name
I.fillField('user[email]','miles@davis.com');
```

You can also specify the exact locator type with strict locators:

```js
I.click({css: 'button.red'});
I.fillField({name: 'user[email]'},'miles@davis.com');
I.seeElement({xpath: '//body/header'});
```

### Interactive Pause

It's easy to start writing a test if you use [interactive pause](/basics#debug). Just open a web page and pause execution.

```js
Feature('Sample Test');

Scenario('open my website', ({ I }) => {
  I.amOnPage('http://todomvc.com/examples/react/');
  pause();
});
```

This is just enough to run a test, open a browser, and think what to do next to write a test case.

When you execute such test with `codeceptjs run` command you may see the browser is started

```
npx codeceptjs run --steps
```

After a page is opened a full control of a browser is given to a terminal. Type in different commands such as `click`, `see`, `fillField` to write the test. A successful commands will be saved to `./output/cli-history` file and can be copied into a test.

A complete ToDo-MVC test may look like:

```js
Feature('ToDo');

Scenario('create todo item', ({ I }) => {
  I.amOnPage('http://todomvc.com/examples/react/');
  I.dontSeeElement('.todo-count');
  I.fillField('What needs to be done?', 'Write a guide');
  I.pressKey('Enter');
  I.see('Write a guide', '.todo-list');
  I.see('1 item left', '.todo-count');
});
```

### Grabbers

If you need to get element's value inside a test you can use `grab*` methods. They should be used with `await` operator inside `async` function:

```js
const assert = require('assert');
Scenario('get value of current tasks', async ({ I }) => {
  I.createTodo('do 1');
  I.createTodo('do 2');
  let numTodos = await I.grabTextFrom('.todo-count strong');
  assert.equal(2, numTodos);
});
```

### Within

In case some actions should be taken inside one element (a container or modal window or iframe) you can use `within` block to narrow the scope.
Please take a note that you can't use within inside another within in Playwright helper:

```js
within('.todoapp', () => {
  I.createTodo('my new item');
  I.see('1 item left', '.todo-count');
  I.click('.todo-list input.toggle');
});
I.see('0 items left', '.todo-count');
```

> [▶ Learn more about basic commands](/basics#writing-tests)

CodeceptJS allows you to implement custom actions like `I.createTodo` or use **PageObjects**. Learn how to improve your tests in [PageObjects](http://codecept.io/pageobjects/) guide.

## Multi Session Testing

To launch additional browser context (or incognito window) use `session` command.

```js
Scenario('I try to open this site as anonymous user', ({ I }) => {
  I.amOnPage('/');
  I.dontSee('Agree to cookies');
  session('anonymous user', () => {
    I.amOnPage('/');
    I.see('Agree to cookies');
  });
})
```

> ℹ Learn more about [multi-session testing](/basics/#multiple-sessions)

## Electron Testing

CodeceptJS allows you to make use of [Playwright's Electron flavor](https://github.com/microsoft/playwright/blob/master/packages/playwright-electron/README.md).
To use this functionality, all you need to do is set the browser to `electron` in the CodeceptJS configuration file and, according to the [Playwright BrowserType API](https://playwright.dev/docs/api/class-browsertype/#browsertypelaunchoptions), set the launch options to point to your Electron application.

`main.js` - main Electron application file
```js
const { app, BrowserWindow } = require("electron");

function createWindow() {
  const window = new BrowserWindow({ width: 800, height: 600 });
  window.loadURL("https://example.com");
}

app.whenReady().then(createWindow);
```

`codecept.conf.js` - CodeceptJS configuration file
```js
const path = require("path");

exports.config = {
  helpers: {
    Playwright: {
      browser: "electron",
      electron: {
        executablePath: require("electron"),
        args: [path.join(__dirname, "main.js")],
      },
    },
  },
  // rest of config
}
```

### Headless Mode

With Electron, headless mode must be set when creating the window. Therefore, CodeceptJS's `show` configuration parameter will not work. However, you can set it in the `main.js` file as shown below:

```js
function createWindow() {
  const window = new BrowserWindow({ width: 800, height: 600, show: false });
  window.loadURL("https://example.com");
}
```


## Device Emulation

Playwright can emulate browsers of mobile devices. Instead of paying for expensive devices for mobile tests you can adjust Playwright settings so it could emulate mobile browsers on iPhone, Samsung Galaxy, etc.

Device emulation can be enabled in CodeceptJS globally in a config or per session.

Playwright contains a [list of predefined devices](https://github.com/Microsoft/playwright/blob/master/src/deviceDescriptors.ts) to emulate, for instance this is how you can enable iPhone 6 emulation for all tests:

```js
const { devices } = require('playwright');

helpers: {
  Playwright: {
    // regular config goes here
    emulate: devices['iPhone 6'],
  }
}
```
To adjust browser settings you can pass [custom options](https://github.com/microsoft/playwright/blob/master/docs/api.md#browsernewcontextoptions)

```js
helpers: {
  Playwright: {
    // regular config goes here
    // put on mobile device
    emulate: { isMobile: true, deviceScaleFactor: 2 }
  }
}
```

To enable device emulation for a specific test, create an additional browser session and pass in config as a second parameter:

```js
const { devices } = require('playwright');

Scenario('website looks nice on iPhone', () => {
  session('mobile user', devices['iPhone 6'], () => {
    I.amOnPage('/');
    I.see('Hello, iPhone user!')
  })
});
```

## Configuring CI

### GitHub Actions

Playwright can be added to GitHub Actions using [official action](https://github.com/microsoft/playwright-github-action). Use it before starting CodeceptJS tests to install all dependencies. It is important to run tests in headless mode ([otherwise you will need to enable xvfb to emulate desktop](https://github.com/microsoft/playwright-github-action#run-in-headful-mode)).

```yml
# from workflows/tests.yml
- uses: microsoft/playwright-github-action@v1
- name: run CodeceptJS tests
  run: npx codeceptjs run
```

## Accessing Playwright API

To get [Playwright API](https://github.com/microsoft/playwright/blob/master/docs/api.md) inside a test use `I.usePlaywrightTo` method with a callback.
To keep test readable provide a description of a callback inside the first parameter.

```js
I.usePlaywrightTo('emulate offline mode', async ({ browser, context, page }) => {
  // use browser, page, context objects inside this function
  await context.setOffline(true);
});
```

Playwright commands are asynchronous so a callback function must be async.

A Playwright helper is passed as argument for callback, so you can combine Playwrigth API with CodeceptJS API:

```js
I.usePlaywrightTo('emulate offline mode', async (Playwright) => {
  // access internal objects browser, page, context of helper
  await Playwright.context.setOffline(true);
  // call a method of helper, await is required here
  await Playwright.click('Reload');
});

```

## Extending Helper

To create custom `I.*` commands using Playwright API you need to create a custom helper.

Start with creating an `MyPlaywright` helper using `generate:helper` or `gh` command:

```sh
npx codeceptjs gh
```

Then inside a Helper you can access `Playwright` helper of CodeceptJS.
Let's say you want to create `I.grabDimensionsOfCurrentPage` action. In this case you need to call `evaluate` method of `page` object

```js
// inside a MyPlaywright helper
async grabDimensionsOfCurrentPage() {
  const { page } = this.helpers.Playwright;
  await page.goto('https://www.example.com/');
  return page.evaluate(() => {
    return {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
      deviceScaleFactor: window.devicePixelRatio
    }
  })
}
```

The same way you can also access `browser` object to implement more actions or handle events. For instance, you want to set the permissions, you can approach it with:

```js
// inside a MyPlaywright helper
async setPermissions() {
  const { browser } = this.helpers.Playwright;
  const context = browser.defaultContext()
  return context.setPermissions('https://html5demos.com', ['geolocation']);
}
```

> [▶ Learn more about BrowserContext](https://github.com/microsoft/playwright/blob/master/docs/api.md#class-browsercontext)

> [▶ Learn more about Helpers](http://codecept.io/helpers/)
