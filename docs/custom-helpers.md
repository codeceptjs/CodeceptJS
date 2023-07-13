---
permalink: /helpers
title: Custom Helpers
---

# Extending CodeceptJS With Custom Helpers

Helper is the core concept of CodeceptJS. Helper is a wrapper on top of various libraries providing unified interface around them. When `I` object is used in tests it delegates execution of its functions to currently enabled helper classes. 

Use Helpers to introduce low-level API to your tests without polluting test scenarios. Helpers can also be used to share functionality across different project and installed as npm packages.

## Development

Helpers can be created by running a generator command:

```bash
npx codeceptjs gh
```

> or `npx codeceptjs generate:helper`

This command generates a basic helper, append it to `helpers` section of config file:

```js
helpers: {
  WebDriver: {  },
  MyHelper: {
    require: './path/to/module'
  }
}
```

Helpers are classes inherited from [corresponding abstract class](https://github.com/codeceptjs/helper).
Created helper file should look like this:

```js
const Helper = require('@codeceptjs/helper');

class MyHelper extends Helper {

  // before/after hooks
  _before() {
    // remove if not used
  }

  _after() {
    // remove if not used
  }

  // add custom methods here
  // If you need to access other helpers
  // use: this.helpers['helperName']

}

module.exports = MyHelper;
```

When the helper is enabled in config all methods of a helper class are available in `I` object.
For instance, if we add a new method to helper class:

```js
const Helper = require('@codeceptjs/helper');

class MyHelper extends Helper {

  doAwesomeThings() {
    console.log('Hello from MyHelpr');
  }

}
```

We can call a new method from within `I`:

```js
I.doAwesomeThings();
```

> Methods starting with `_` are considered special and won't available in `I` object.


Please note, `I` object can't be used helper class. As `I` object delegates its calls to helper classes, you can't make a circular dependency on it. Instead of calling `I` inside a helper, you can get access to other helpers by using `helpers` property of a helper. This allows you to access any other enabled helper by its name. 

For instance, to perform a click with Playwright helper, do it like this:

```js
doAwesomeThingsWithPlaywright() {
  const { Playwright } = this.helpers;
  Playwright.click('Awesome');    
}
```


After a custom helper is finished you can update CodeceptJS Type Definitions by running:

```sh
npx codeceptjs def .
```

This way, if your tests are written with TypeScript, your IDE will be able to leverage features like autocomplete and so on.

## Accessing Elements

WebDriver, Puppeteer and Playwright drivers provide API for web elements.
However, CodeceptJS do not expose them to tests by design, keeping test to be action focused.
If you need to get access to web elements, it is recommended to implement operations for web elements in a custom helper.

To get access for elements, connect to a corresponding helper and use `_locate` function to match web elements by CSS or XPath, like you usually do:

### Accessing Elements in WebDriver

```js
// inside a custom helper
async clickOnEveryElement(locator) {
  const { WebDriver } = this.helpers;
  const els = await WebDriver._locate(locator);

  for (let el of els) {
    await el.click();
  }
}
```

In this case an an instance of webdriverio element is used.
To get a [complete API of an element](https://webdriver.io/docs/api/) refer to webdriverio docs.

### Accessing Elements in Playwright & Puppeteer

Similar method can be implemented for Playwright & Puppeteer:

```js
// inside a custom helper
async clickOnEveryElement(locator) {
  const { Playwright } = this.helpers;
  const els = await Playwright._locate(locator);

  for (let el of els) {
    await el.click();
  }
}
```

In this case `el` will be an instance of [ElementHandle](https://playwright.dev/#version=master&path=docs%2Fapi.md&q=class-elementhandle) which is similar for Playwright & [Puppeteer](https://pptr.dev/#?product=Puppeteer&version=master&show=api-class-elementhandle).

> ℹ There are more `_locate*` methods in each helper. Take a look on documentation of a helper you use to see which exact method it exposes.

## Configuration

Helpers should be enabled inside `codecept.json` or `codecept.conf.js` files. Command `generate helper`
does that for you, however you can enable them manually by placing helper to `helpers` section inside config file.
You can also pass additional config options to your helper from a config - **(please note, this example contains comments, while JSON format doesn't support them)**:

```js
helpers: {
  // here goes standard helpers:
  // WebDriver, Playwright, etc...
  // and their configuration
  MyHelper: {
    require: "./my_helper.js", // path to module
    defaultHost: "http://mysite.com" // custom config param
  }

}
```

Config values will be stored inside helper in `this.config`. To get `defaultHost` value you can use

```js
this.config.defaultHost
```

in any place of your helper. You can also redefine config options inside a constructor:

```js
constructor(config) {
  config.defaultHost += '/api';
  console.log(config.defaultHost); // http://mysite.com/api
  super(config);
}
```

## Hooks

Helpers may contain several hooks you can use to handle events of a test.
Implement corresponding methods to them.

* `_init` - before all tests
* `_finishTest` - after all tests
* `_before` - before a test
* `_after` - after a test
* `_beforeStep` - before each step
* `_afterStep` - after each step
* `_beforeSuite` - before each suite
* `_afterSuite` - after each suite
* `_passed` - after a test passed
* `_failed` - after a test failed

Each implemented method should return a value as they will be added to global promise chain as well.

## Conditional Retries

It is possible to execute global conditional retries to handle unforseen errors.
Lost connections and network issues are good candidates to be retried whenever they appear.

This can be done inside a helper using the global [promise recorder](/hooks/#api):

Example: Retrying rendering errors in Puppeteer.

```js
_before() {
  const recorder = require('codeceptjs').recorder;
  recorder.retry({
    retries: 2,
    when: err => err.message.indexOf('Cannot find context with specified id') > -1,
  });
}
```

`recorder.retry` acts similarly to `I.retry()` and accepts the same parameters. It expects the `when` parameter to be set so it would handle only specific errors and not to retry for every failed step.

Retry rules are available in array `recorder.retries`. The last retry rule can be disabled by running `recorder.retries.pop()`;

## Using Typescript

With Typescript, just simply replacing `module.exports` with `export` for autocompletion.


## Helper Examples

### Playwright Example

In this example we take the power of Playwright to change geolocation in our tests:

```js
const Helper = require('@codeceptjs/helper');

class MyHelper extends Helper {

  async setGeoLocation(longitude, latitude) {
    const { browserContext } = this.helpers.Playwright;
    await browserContext.setGeolocation({ longitude, latitude });
    await Playwright.refreshPage();
  }
}
```

### WebDriver Example

Next example demonstrates how to use WebDriver library to create your own test action. Method `seeAuthentication` will use `browser` instance of WebDriver to get access to cookies. Standard NodeJS assertion library will be used (you can use any).

```js
const Helper = require('@codeceptjs/helper');

// use any assertion library you like
const assert = require('assert');

class MyHelper extends Helper {
  /**
   * checks that authentication cookie is set
   */
  async seeAuthentication() {
    // access current browser of WebDriver helper
    const { WebDriver } = this.helpers
    const { browser } = WebDriver;

    // get all cookies according to https://webdriver.io/api/protocol/cookie.html
    // any helper method should return a value in order to be added to promise chain
    const res = await browser.cookie();
    // get values
    let cookies = res.value;
    for (let k in cookies) {
      // check for a cookie
      if (cookies[k].name != 'logged_in') continue;
      assert.equal(cookies[k].value, 'yes');
      return;
    }
    assert.fail(cookies, 'logged_in', "Auth cookie not set");
  }
}

module.exports = MyHelper;
```

### Puppeteer Example

Puppeteer has [nice and elegant API](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md) which you can use inside helpers. Accessing `page` instance via `this.helpers.Puppeteer.page` from inside a helper.

Let's see how we can use [emulate](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pageemulateoptions) function to emulate iPhone browser in a test.

```js
const Helper = require('@codeceptjs/helper');
const puppeteer = require('puppeteer');
const iPhone = puppeteer.devices['iPhone 6'];

class MyHelper extends Helper {

  async emulateIPhone() {
    const { page } = this.helpers.Puppeteer;
    await page.emulate(iPhone);
  }

}

module.exports = MyHelper;
```
