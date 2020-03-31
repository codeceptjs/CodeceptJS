---
permalink: /helpers
title: Custom Helpers
---

# Extending CodeceptJS with Custom Helopers

Helpers is a core concept of CodeceptJS. Helper is a wrapper on top of various libraries providing unified interface around them.

Methods of Helper class will be available in tests in `I` object. This abstracts test scenarios from the implementation and allows easily switching between backends.

Functionality of CodeceptJS should be extended by writing a custom helpers.

Helpers can also be installed as Node packages and required by corresponding Node modules.

You can either access core Helpers (and underlying libraries) or create a new from scratch.

## Development

Helpers can be created by running a generator command:

```bash
npx codeceptjs gh
```

*(or `generate helper`)*

This command generates a basic helper and appends it to `helpers` section of config file:

```js
helpers: {
  WebDriver: {  },
  MyHelper: {
    require: './path/to/module'
  }
}
```

Helpers are ES6 classes inherited from [corresponding abstract class](https://github.com/Codeception/CodeceptJS/blob/master/lib/helper.js).
Generated Helper will be added to `codecept.conf.js` config. It should look like this:

```js
const Helper = codecept_helper;

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

All methods except those starting from `_` will be added to `I` object and treated as test actions.
Every method should return a value in order to be appended into promise chain.

After writing your own custom helpers here you can always update CodeceptJS TypeScript Type Definitions running:

```sh
npx codeceptjs def .
```

This way, if your tests are written with TypeScript, your IDE will be able to leverage features like autocomplete and so on.

## WebDriver Example

Next example demonstrates how to use WebDriver library to create your own test action.
Method `seeAuthentication` will use `client` instance of WebDriver to get access to cookies.
Standard NodeJS assertion library will be used (you can use any).

```js
const Helper = codecept_helper;

// use any assertion library you like
const assert = require('assert');

class MyHelper extends Helper {
  /**
   * checks that authentication cookie is set
   */
  async seeAuthentication() {
    // access current client of WebDriver helper
    let client = this.helpers['WebDriver'].browser;

    // get all cookies according to http://webdriver.io/api/protocol/cookie.html
    // any helper method should return a value in order to be added to promise chain
    const res = await client.cookie();
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

## Puppeteer Example

Puppeteer has [nice and elegant API](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md) which you can use inside helpers. Access `page` instance via `this.helpers.Puppeteer.page` from inside a helper.

Let's see how we can use [emulate](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pageemulateoptions) function to emulate iPhone browser in a test.

```js
const Helper = codecept_helper;
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

## Protractor Example

Protractor example demonstrates usage of global `element` and `by` objects.
However `browser` should be accessed from a helper instance via `this.helpers['Protractor']`;
We also use `chai-as-promised` library to have nice assertions with promises.

```js
const Helper = codecept_helper;

// use any assertion library you like
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

class MyHelper extends Helper {
  /**
   * checks that authentication cookie is set
   */
  seeInHistory(historyPosition, value) {
    // access browser instance from Protractor helper
    this.helpers['Protractor'].browser.refresh();

    // you can use `element` as well as in protractor
    const history = element.all(by.repeater('result in memory'));

    // use chai as promised for better assertions
    // end your method with `return` to handle promises
    return expect(history.get(historyPosition).getText()).to.eventually.equal(value);
  }
}

module.exports = MyHelper;
```

## Accessing Elements

WebDriver, Puppeteer, Playwright, and Protractor drivers provide API for web elements.
However, CodeceptJS do not expose them to tests by design, keeping test to be action focused.
If you need to get access to web elements, it is recommended to implement operations for web elements in a custom helper.

To get access for elements, connect to a corresponding helper and use `_locate` function to match web elements by CSS or XPath, like you usually do:

### Acessing Elements in WebDriver

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

In this case `el` will be an instance of [ElementHandle](https://github.com/microsoft/playwright/blob/v0.12.1/docs/api.md#class-elementhandle) which is similar for Playwright & [Puppeteer](https://pptr.dev/#?product=Puppeteer&version=v2.1.1&show=api-class-elementhandle).

> ℹ There are more `_locate*` methods in each helper. Take a look on documentation of a helper you use to see which exact method it exposes.

## Configuration

Helpers should be enabled inside `codecept.json` or `codecept.conf.js` files. Command `generate helper`
does that for you, however you can enable them manually by placing helper to `helpers` section inside config file.
You can also pass additional config options to your helper from a config - **(please note, this example contains comments, while JSON format doesn't support them)**:

```js
helpers: {
  // here goes standard helpers:
  // WebDriver, Protractor, Nightmare, etc...
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

### Hook Usage Examples

1)  Failing if JS error occurs in WebDriver:

```js
class JSFailure extends codecept_helper {

  _before() {
    this.err = null;
    this.helpers['WebDriver'].browser.on('error', (e) => this.err = e);
  }

  _afterStep() {
    if (this.err) throw new Error(`Browser JS error ${this.err}`);
  }
}

module.exports = JSFailure;
```

2)  Wait for Ajax requests to complete after `click`:

```js
class JSWait extends codecept_helper {

  _afterStep(step) {
    if (step.name == 'click') {
      var jqueryActive = () => jQuery.active == 0;
      return this.helpers['WebDriver'].waitUntil(jqueryActive);
    }
  }
}

module.exports = JSWait;
```

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

When using typescript, replace `module.exports` with `export` for autocompletion.
