---
permalink: /playwright
title: Testing with Playwright
---

# Testing with Playwright

Playwright is a Node library to automate the [Chromium](https://www.chromium.org/Home), [WebKit](https://webkit.org/) and [Firefox](https://www.mozilla.org/en-US/firefox/new/) browsers as well as [Electron](https://www.electronjs.org/) apps with a single API. It enables **cross-browser** web automation that is **ever-green**, **capable**, **reliable** and **fast**.

Playwright was built similarly to [Puppeteer](https://github.com/puppeteer/puppeteer), using its API and so is very different in usage. However, Playwright has cross browser support with better design for test automation.

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

Or see [alternative installation options](https://codecept.io/installation/)

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

> ▶ More options are listed in [helper reference](https://codecept.io/helpers/Playwright/).

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

> ℹ  All actions are listed in [Playwright helper reference](https://codecept.io/helpers/Playwright/).*

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
  I.fillField('.todo', 'my first item');
  I.pressKey('Enter')
  I.fillField('.todo', 'my second item');
  I.pressKey('Enter')
  let numTodos = await I.grabTextFrom('.todo-count strong');
  assert.equal(2, numTodos);
});
```

### Within

In case some actions should be taken inside one element (a container or modal window or iframe) you can use `within` block to narrow the scope.
Please take a note that you can't use within inside another within in Playwright helper:

```js
await within('.todoapp', () => {
  I.fillField('.todo', 'my new item');
  I.pressKey('Enter')
  I.see('1 item left', '.todo-count');
  I.click('.todo-list input.toggle');
});
I.see('0 items left', '.todo-count');
```

### Each Element <Badge text="Since 3.3" type="warning"/>

Usually, CodeceptJS performs an action on the first matched element. 
In case you want to do an action on each element found, use the special function `eachElement` which comes from [eachElement](https://codecept.io/plugins/#eachelement) plugin. 

`eachElement` function matches all elements by locator and performs a callback on each of those element. A callback function receives [ElementHandle instance](https://playwright.dev/docs/api/class-elementhandle) from Playwright API. `eachElement` may perform arbitrary actions on a page, so the first argument should by a description of the actions performed. This description will be used for logging purposes.

Usage example

```js
await eachElement(
  'tick all checkboxes', 
  'input.custom-checkbox', 
  async (el, index) => {
    await el.check();
  });
);
```

> ℹ Learn more about [eachElement plugin](/plugins/#eachelement)

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

Sometimes, the Electron app is built with [electron-forge](https://www.electronforge.io/), then configuring may a bit different.

- First, you should run your electron-forge command to build and pack your app.
- Then, you would find `index.js` file inside `.webpack/main/index.js`

`codecept.conf.js` - CodeceptJS configuration file
```js
const path = require("path");

exports.config = {
  helpers: {
    Playwright: {
      browser: "electron",
      electron: {
        executablePath: require("electron"),
        args: [path.join(__dirname, ".webpack/main/index.js")],
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

Playwright contains a [list of predefined devices](https://github.com/microsoft/playwright/blob/master/src/server/deviceDescriptors.js) to emulate, for instance this is how you can enable iPhone 6 emulation for all tests:

```js
const { devices } = require('playwright');

helpers: {
  Playwright: {
    // regular config goes here
    emulate: devices['iPhone 6'],
  }
}
```
To adjust browser settings you can pass [custom options](https://github.com/microsoft/playwright/blob/master/docs/src/api/class-browsercontext.md)

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

## API Requests

CodeceptJS has [REST](/helpers/REST) and [GraphQL]((/helpers/GraphQL)) helpers to perform requests to external APIs. This may be helpful to implement [data management](https://codecept.io/data/) strategy. 

However, Playwright since 1.18 has its own [API for making request](https://playwright.dev/docs/api/class-apirequestcontext#api-request-context-get). It uses cookies from browser session to authenticate requests. So you can use it via [`makeApiRequest`](/helpers/Playwright#makeApiRequest) method:

```js
I.makeApiRequest('GET', '/users')
```

It is also possible to test JSON responses by adding [`JSONResponse`](/helpers/JSONResponse) and connecting it to Playwright:

```js
// inside codecept.conf.js
{
  helpers: {
    Playwright: {
      // current config
    },
    JSONResponse: {
      requestHelper: 'Playwright',
    }
  }
}
```
This helper provides you methods for [API testing](/api). For instance, you can check for status code, data inclusion and structure:

```js
I.makeApiRequest('GET', '/users/1');
I.seeResponseCodeIs(200);
I.seeResponseContainsKeys(['user']);
```
This way you can do full fledged API testing via Playwright.

## Accessing Playwright API

To get [Playwright API](https://playwright.dev/docs/api/class-playwright) inside a test use `I.usePlaywrightTo` method with a callback.

`usePlaywrightTo` passes in an instance of Playwright helper from which you can obtain access to main Playwright classes:

* [`browser`](https://playwright.dev/docs/api/class-browser)
* [`browserContext`](https://playwright.dev/docs/api/class-browsercontext)
* [`page`](https://playwright.dev/docs/api/class-page)

To keep test readable provide a description of a callback inside the first parameter.

```js
I.usePlaywrightTo('emulate offline mode', async ({ browser, browserContext, page }) => {
  // use browser, page, context objects inside this function
  await browserContext.setOffline(true);
});
```

Playwright commands are asynchronous so a callback function must be async.

A Playwright helper is passed as argument for callback, so you can combine Playwright API with CodeceptJS API:

```js
I.usePlaywrightTo('emulate offline mode', async (Playwright) => {
  // access internal objects browser, page, context of helper
  await Playwright.browserContext.setOffline(true);
  // call a method of helper, await is required here
  await Playwright.click('Reload');
});
```

## Mocking Network Requests <Badge text="Since 3.1" type="warning"/>

Network requests & responses can be mocked and modified. Use `mockRequest` which strictly follows [Playwright's `route` API](https://playwright.dev/docs/api/class-browsercontext#browser-context-route).

```js
I.mockRoute('/api/**', route => {
  if (route.request().postData().includes('my-string'))
    route.fulfill({ body: 'mocked-data' });
  else
    route.continue();
});

I.mockRoute('**/*.{png,jpg,jpeg}', route => route.abort());

// To disable mocking for a route call `stopMockingRoute`
// for previously mocked URL
I.stopMockingRoute('**/*.{png,jpg,jpeg}'
```

To master request intercepting [use `route` object](https://playwright.dev/docs/api/class-route) object passed into mock request handler.

## Video <Badge text="Since 3.1" type="warning"/>

Playwright may record videos for failed tests. This can be enabled in a config with `video: true` option:

```js
exports.config = {
  helpers: {
    Playwright: {
      // ...
      video: true
    }
  }
}
```
When a test fails and video was enabled a video file is shown under the `artifacts` section in the error message:

```
-- FAILURES:

  1) GitHub
       open:
    
  Scenario Steps:
  - I.amOnPage("https://gothub11.com/search") at Test.<anonymous> (./github_test.js:16:5)
  
  Artifacts:
  - screenshot: /home/davert/projects/codeceptjs/examples/output/open.failed.png
  - video: /home/davert/projects/codeceptjs/examples/output/videos/5ecf6aaa78865bce14d271b55de964fd.webm
```

Open video and use it to debug a failed test case. Video helps when running tests on CI. Configure your CI system to enable artifacts storage for `output/video` and review videos of failed test case to understand failures. 

It is recommended to enable [subtitles](https://codecept.io/plugins/#subtitles) plugin which will generate subtitles from steps in `.srt` format. Subtitles file will be saved into after a video file so video player (like VLC) would load them automatically:

![](https://user-images.githubusercontent.com/220264/131644090-38d1ca55-1ba1-41fa-8fd1-7dea2b7ae995.png)


## Trace <Badge text="Since 3.1" type="warning"/>

If video is not enough to descover why a test failed a [trace](https://playwright.dev/docs/trace-viewer/) can be recorded.

![](https://user-images.githubusercontent.com/220264/128403246-7e1b9b33-9ce2-42d5-b87b-b8749d5d7a78.png)

Inside a trace you get screenshots, DOM snapshots, console logs, network requests and playwright commands logged and showed on a timeline. This may help for a deep debug of a failed test cases. Trace file is saved into ZIP archive and can be viewed with Trace Viewer built into Playwright.


Enable trace with `trace: true` option in a config:

```js
exports.config = {
  helpers: {
    Playwright: {
      // ...
      trace: true
    }
  }
}
```

When a test fails and trace was enabled, a trace file is shown under the `artifacts` section in the error message:

```
-- FAILURES:

  1) GitHub
       open:
    
  Scenario Steps:
  - I.amOnPage("https://gothub11.com/search") at Test.<anonymous> (./github_test.js:16:5)
  
  Artifacts:
  - screenshot: /home/davert/projects/codeceptjs/examples/output/open.failed.png
  - trace: /home/davert/projects/codeceptjs/examples/output/trace/open.zip
```

Use Playwright's trace viewer to analyze the trace:

```
npx playwright show-trace {path-to-trace-file}
```

For instance, this is how you can read a trace for a failed test from an example:

```
npx playwright show-trace /home/davert/projects/codeceptjs/examples/output/trace/open.zip
```

## Capturing Code Coverage

Code coverage can be captured, by enabling the `coverage` plugin in `codecept.config.js`.

```js
{
  plugins: {
    coverage: {
      enabled: true
    }
  }
}
```

Once all the tests are completed, `codecept` will create and store coverage in `output/coverage` folder, as shown below.

![](https://private-user-images.githubusercontent.com/7845001/313117208-f7165429-426a-44c5-af27-df5536ef492d.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3MTA0OTEyNTIsIm5iZiI6MTcxMDQ5MDk1MiwicGF0aCI6Ii83ODQ1MDAxLzMxMzExNzIwOC1mNzE2NTQyOS00MjZhLTQ0YzUtYWYyNy1kZjU1MzZlZjQ5MmQucG5nP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9QUtJQVZDT0RZTFNBNTNQUUs0WkElMkYyMDI0MDMxNSUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNDAzMTVUMDgyMjMyWiZYLUFtei1FeHBpcmVzPTMwMCZYLUFtei1TaWduYXR1cmU9NjRmNTFmOWUyYzJjYWE3ZWE0MDA0MGI3ODY5NzY5MDRlYjQyNTMxODRjZGU1ZWM5ZDdjNDJiNGRmZGUxM2FlOCZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QmYWN0b3JfaWQ9MCZrZXlfaWQ9MCZyZXBvX2lkPTAifQ._gfEYZn2AK0NVA0bt-sFmzMoMKlyBVpxd7m4590Ux1M)

Open `index.html` in your browser to view the full interactive coverage report.

![](https://private-user-images.githubusercontent.com/7845001/313117882-cb77beea-c478-49ea-8677-b025d5614545.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3MTA0OTEzOTAsIm5iZiI6MTcxMDQ5MTA5MCwicGF0aCI6Ii83ODQ1MDAxLzMxMzExNzg4Mi1jYjc3YmVlYS1jNDc4LTQ5ZWEtODY3Ny1iMDI1ZDU2MTQ1NDUucG5nP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9QUtJQVZDT0RZTFNBNTNQUUs0WkElMkYyMDI0MDMxNSUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNDAzMTVUMDgyNDUwWiZYLUFtei1FeHBpcmVzPTMwMCZYLUFtei1TaWduYXR1cmU9YmY0YTkxOTM0ZjUyNjZmMzk0NmM4MjU5MGFjZTZlZDc0Njc3OTZkNTNjMjc5YzQxODI3OWUyODJkNTU2NGViZSZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QmYWN0b3JfaWQ9MCZrZXlfaWQ9MCZyZXBvX2lkPTAifQ.LATp5aqrvm-8Nn4tRGSuMrOjJQ4L-NIJEwsB3BbB5po)

![](https://private-user-images.githubusercontent.com/7845001/313117886-92a11844-0a2b-4bcb-8c73-aef5cf518dbf.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3MTA0OTEzOTAsIm5iZiI6MTcxMDQ5MTA5MCwicGF0aCI6Ii83ODQ1MDAxLzMxMzExNzg4Ni05MmExMTg0NC0wYTJiLTRiY2ItOGM3My1hZWY1Y2Y1MThkYmYucG5nP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9QUtJQVZDT0RZTFNBNTNQUUs0WkElMkYyMDI0MDMxNSUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNDAzMTVUMDgyNDUwWiZYLUFtei1FeHBpcmVzPTMwMCZYLUFtei1TaWduYXR1cmU9MTQ4ODUyMTVlM2MwODRhMzE0Yjg2YWQxYTRiNmYzOWJkYWU2ZWIyNDA2YWMyYjIxYTMyNTZkYjg5NGU3Zjk4OCZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QmYWN0b3JfaWQ9MCZrZXlfaWQ9MCZyZXBvX2lkPTAifQ.gxyQ9RgAAtFcCUIqqjzponc53ZRn9sG0hN4cBeQovMg)

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

> [▶ Learn more about BrowserContext](https://github.com/microsoft/playwright/blob/master/docs/src/api/class-browsercontext.md)

> [▶ Learn more about Helpers](https://codecept.io/helpers/)

## Timezone change

Sometimes it's useful to test browser in different timezones. You can change timezone this way:

```js
Scenario("Test in a different timezone", ({ I }) => {
  I.restartBrowser({ timezoneId: 'America/Phoenix' });
  I.amOnPage("/");
  // ...
  // Reset timezone to default one (taken from OS)
  I.restartBrowser();
});
```
Other context options: https://playwright.dev/docs/api/class-browser#browser-new-context

## Configuring CI

### GitHub Actions

Playwright can be added to GitHub Actions using [official action](https://github.com/microsoft/playwright-github-action). Use it before starting CodeceptJS tests to install all dependencies. It is important to run tests in headless mode ([otherwise you will need to enable xvfb to emulate desktop](https://github.com/microsoft/playwright-github-action#run-in-headful-mode)).

```yml
# from workflows/tests.yml
- uses: microsoft/playwright-github-action@v1
- name: run CodeceptJS tests
  run: npx codeceptjs run
```
