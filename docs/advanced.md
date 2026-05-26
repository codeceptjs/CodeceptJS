---
permalink: /advanced
title: Advanced Usage
---

# Advanced Usage

## Data Driven Tests

Execute the same scenario on a different data set.

Let's say you want to test login for different user accounts.
In this case, you need to create a datatable and fill it in with credentials.
Then use `Data().Scenario` to include this data and generate multiple scenarios:

```js
// Define data table inside a test or load from another module
let accounts = new DataTable(['login', 'password']); //
accounts.add(['davert', '123456']); // adding records to a table
accounts.add(['admin', '123456']);

// You can skip some data. But add them to report as skipped (just like with usual scenarios):
accounts.xadd(['admin', '23456'])

// Pass dataTable to Data()
// Use special param `current` to get current data set
Data(accounts).Scenario('Test Login', ({ I, current }) => {
  I.fillField('Username', current.login); // current is reserved!
  I.fillField('Password', current.password);
  I.click('Sign In');
  I.see('Welcome '+ current.login);
});


// Also you can set only for Data tests. It will launch executes only the current test but with all data options
Data(accounts).only.Scenario('Test Login', ({ I, current }) => {
  I.fillField('Username', current.login); // current is reserved!
  I.fillField('Password', current.password);
  I.click('Sign In');
  I.see('Welcome '+ current.login);
});
```

*Important: you can't use name `current` for pageObjects or helpers in data scenarios*

This will produce 2 tests with different data sets.
Current data set is appended to a test name in output:

```sh
✓ Test Login | {"login":"davert","password":"123456"}
✓ Test Login | {"login":"admin","password":"123456"}
S Test Login | {"login":"admin","password":"23456"}
```

```js
// You can filter your data table
Data(accounts.filter(account => account.login == 'admin')
.Scenario('Test Login', ({ I, current }) => {
  I.fillField('Username', current.login);
  I.fillField('Password', current.password);
  I.click('Sign In');
  I.see('Welcome '+ current.login);
});
```

This will limit data sets accoring passed function:

```sh
✓ Test Login | {"login":"admin","password":"123456"}
S Test Login | {"login":"admin","password":"23456"}
```

Data sets can also be defined with array, generator, or a function.

```js
Data(function*() {
  yield { user: 'davert'};
  yield { user: 'andrey'};
}).Scenario() // ...
```

*HINT: If you don't use DataTable. add `toString()` method to each object added to data set, so the data could be pretty printed in a test name*


## Debug

CodeceptJS provides a debug mode in which additional information is printed.
It can be turned on with `--debug` flag.

```sh
npx codeceptjs run --debug
```

to receive even more information turn on `--verbose` flag:

```sh
npx codeceptjs run --verbose
```

> You can pause execution and enter **interactive console** mode by calling `pause()` inside your test.

To see a complete internal debug of CodeceptJS use `DEBUG` env variable:

```sh
DEBUG=codeceptjs:* npx codeceptjs run
```

For an interactive debugging use NodeJS debugger. In **WebStorm**:

```sh
node $NODE_DEBUG_OPTION ./node_modules/.bin/codeceptjs run
```

For **Visual Studio Code**, add the following configuration in launch.json:

```json
{
  "type": "node",
  "request": "launch",
  "name": "codeceptjs",
  "args": ["run", "--grep", "@your_test_tag"],
  "program": "${workspaceFolder}/node_modules/codeceptjs/bin/codecept.js"
}
```


## Test Options

Features and Scenarios have their options that can be set by passing a hash after their names:

```js
Feature('My feature', {key: val});

Scenario('My scenario', {key: val},({ I }) => {});
```

You can use these options to build your own [plugins](https://codecept.io/hooks#plugins) with [event listeners](https://codecept.io/architecture#events). Example: 

```js
  // for test
  event.dispatcher.on(event.test.before, (test) => {
    ...
    if (test.opts.key) {
      ...
    }
    ...
  });
  // or for suite
  event.dispatcher.on(event.suite.before, (suite) => {
    ...
    if (suite.opts.key) {
      ...
    }
    ...
  });
```

## Direct Helper Access

Some scenarios need the underlying SDK directly — a raw `page.evaluate`, a `page.on('request')` listener, an experimental Playwright API, or a wdio command the `WebDriver` helper doesn't expose. The `expose` plugin injects helper internals as scenario arguments so you can call them inline.

```js
Scenario('intercept network', async ({ I, page }) => {
  page.on('request', req => console.log(req.method(), req.url()))
  I.amOnPage('/')
  const title = await page.evaluate(() => document.title)
  I.see(title)
})
```
Enable `expose` plugin in config and use public properties from a corresponding helper.
Map each injection name to `HelperName.propertyName`:

```js
plugins: {
  expose: {
    enabled: true,
    inject: {
      page: 'Playwright.page',
      browser: 'Playwright.browser',
      browserContext: 'Playwright.browserContext',
      wdio: 'WebDriver.browser',
    }
  }
}
```

There is a shorthand mode:

```js
plugins: {
  expose: {
    enabled: true,
    inject: { page: 'page' }   // resolves Playwright.page or Puppeteer.page
  }
}
```
A value with no dot is shorthand for "the first configured browser helper that exposes this property". Allowed properties: `page`, `browser`, `browserContext`, `context`.

The injected value is a live proxy. Every property access reads the current helper property at that moment, so tab switches (`I.openNewTab`, `I.switchToNextTab`) propagate automatically — the next call through `page` targets the new tab.

Calls pass straight to the underlying SDK. They aren't wrapped as CodeceptJS steps and don't appear in step output, so `await page.evaluate(...)` behaves as native Playwright.
