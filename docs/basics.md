# Basics

CodeceptJS is a modern end to end testing framework with a special BDD-style syntax. The test is written as a linear scenario of user's action on a site.

```js
Feature('CodeceptJS demo');

Scenario('check Welcome page on site', (I) => {
  I.amOnPage('/');
  I.see('Welcome');
});
```

Tests are expected to be written in **ECMAScript 7**.

Each test is described inside a `Scenario` function with `I` object passed into it.
I object is an **actor**, an abstraction for a testing user. I is a proxy object for currently enabled **Helpers**.

## Architecture

CodeceptJS bypasses execution commands to helpers. Depending on helper enabled your tests will be executed differently. If you need cross-browser support you should choose Selenium-based WebDriver or Protractor, if you are interested in speed - use Chrome-based Puppeteer, or Electron-based Nightmare. Those engines can run tests in window mode or headlessly and doesn't require additional tools to be installed.

Here is the diagram of CodeceptJS architecture

![](./images/architecture.svg)

All helpers share the same API so it's easy to migrate tests from one backend to other.
However, because of difference in backends and their limitations, they are not guarantted to compatible between each other. For instance, you can't set request headers in WebDriver or Protractor, but you can do so in Puppteer or Nigthmare.

Please note, you can't run tests by different helpers at once. You can't use some APIs from WebDriver and some from Nightmare. You should **pick one helper, as it definses how tests are executed.** If requirements change it's easy to migrate to another, but don't use few helpers at once. It's just not possible.

A helper should be enabled in main config. Configuration (like base url) should be provided as well:

```json
  "helpers": {
    "WebDriver": {
      "url": "http://localhost",
      "browser": "chrome"
    }
  }
```

In this config config all methods of `I` will be taken from `WebDriver` helper.

## Writing Tests

Tests are written from user's perspective. There is an actor (represented as `I`) which contains actions taken from helpers. A test is written as a sequence of actions performed by actor:

```js
I.amOnPage('/');
I.click('Login');
I.see('Please Login', 'h1');
// ...
```

To list all available commands for current configuration run `codeceptjs list`
or enable [auto-completion by generating TypeScript definitions](#intellisense).

> For most helpers basic actions like `amOnPage`, `fillField`, `click` are the same.
Proceed to [Acceptance Testing Chapter](https://codecept.io/acceptance/) to learn how to use them.

## How It Works

Tests are written in synchronous way. This improves readability and maintainability of tests.
While writing tests you should not think about promises. You should focus on test scenario.

However, behind the scene **all actions are wrapped in promises** inside the `I` object.
[Global promise](https://github.com/Codeception/CodeceptJS/blob/master/lib/recorder.js) chain is initialized before each test and all `I.*` calls will be appended to it as well as setup and teardown.

If you want to get information from a running test you can use `await` inside **async function** and special methods of helpers started with `grab` prefix.

```js
Scenario('try grabbers', async (I) => {
  let title = await I.grabTitle();
});
```

then you can use those variables in assertions:

```js
var title = await I.grabTitle();
var assert = require('assert');
assert.equal(title, 'CodeceptJS');
```

## Running Tests

To launch tests use `run` command. To execute tests in [multiple browsers](https://codecept.io/advanced/#multiple-browsers-execution) or [multiple threads](https://codecept.io/advanced/#parallel-execution) use `run-multiple`.

### Level of Detail

To see step-by-step output of running tests, add `--steps` flag:

```
codeceptjs run --steps
```

To see more detailed output add `--debug` flag:

```
codeceptjs run --debug
```

To see very detailed output system use `--verbose` flag:

```
codeceptjs run --verbose
```

### Filter

A single test file can be executed if you provide a relative path to such file:

```
codeceptjs run github_test.js

# or

codeceptjs run admin/login_test.js
```

To filter a test by name use `--grep` parameter. Which will execute all tests with names matching the regex pattern.

To run all tests with `slow` word in it

```
codeceptjs run --grep "slow"
```

It is recommended to [filter tests by tags](https://codecept.io/advanced/#tags).


> For more options see [full reference of `run` command](https://codecept.io/commands/#run).



## Comments

There is a simple way to add additional comments to your test scenario.
Use `say` command to print information to screen:

```js
I.say('I am going to publish post');
I.say('I enter title and body');
I.say('I expect post is visible on site');
```

Use second parameter to pass in color value (ASCII).

```js
I.say('This is red', 'red'); //red is used
I.say('This is blue', 'blue'); //blue is used
I.say('This is by default'); //cyan is used
```

## IntelliSense

If you are using Visual Studio Code or other IDE that supports TypeScript Definitions,
you can generate step definitions with

```sh
codeceptjs def
```

Now you should include `/// <reference path="./steps.d.ts" />` into your test files to get
method autocompletion while writing tests.



---

### Next: [Acceptance Testing >>>](acceptance.md)

---
