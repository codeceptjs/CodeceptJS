---
id: basics
title: Basics
---

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

![architecture](https://codecept.io/img/architecture.svg)

All helpers share the same API so it's easy to migrate tests from one backend to other.
However, because of difference in backends and their limitations, they are not guaranteed to be compatible with each other. For instance, you can't set request headers in WebDriver or Protractor, but you can do so in Puppteer or Nightmare.

Please note, you can't run tests by different helpers at once. You can't use some APIs from WebDriver and some from Nightmare. You should **pick one helper, as it defines how tests are executed.** If requirements change it's easy to migrate to another, but don't use few helpers at once. It's just not possible.

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

Tests are written from a user's perspective. There is an actor (represented as `I`) which contains actions taken from helpers. A test is written as a sequence of actions performed by actor:

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

Tests are written in a synchronous way. This improves the readability and maintainability of tests.
While writing tests you should not think about promises. You should focus on the test scenario.

However, behind the scenes **all actions are wrapped in promises** inside of the `I` object.
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


## Debug

CodeceptJS allows to write and debug tests on the fly while keeping your browser opened.
By using interactive shell you can stop execution at any point and type in CodeceptJS commands.

This is especially useful while writing a new scratch. After opening a page call `pause()` to start interacting with a page:

```js
I.amOnPage('/');
pause();
```

Try to perform your scenario step by step. Then copy succesful commands and insert them into a test.

### Pause

Test execution can be paused in any place of a test with `pause()` call.

This launches interactive console where you can call actions of `I` object.

```
 Interactive shell started
 Press ENTER to resume test
 - Use JavaScript syntax to try steps in action
 - Press TAB twice to see all available commands
 - Enter next to run the next step
 I.click

```

Type in different actions to try them, copy valid successful ones to test, update the test file.

Press `ENTER` to resume test execution.

To **debug test step-by-step** type press Enter. The next step will be executed and interactive shell will be shown again.

To see all available commands press TAB two times to see list of all actions included in I.

If a test is failing you can prevent browser from closing by putting `pause()` command into `After()` hook. This is very helpful to debug failing tests. This way you can keep the same session and try different actions on a page to get the idea what went wrong.

```js
After(pause);
```

Interactive shell can be started outside the test context by running

```bash
codeceptjs shell
```


### Screenshot on failure

By default CodeceptJS saves a screenshot of a failed test.
This can be configured in [screenshotOnFail Plugin](https://codecept.io/plugins/#screenshotonfail)

### Step By Step Report

To see how the test was executed, use [stepByStepReport Plugin](https://codecept.io/plugins/#stepbystepreport). It saves a screenshot of each passed step and shows them in a nice slideshow.


## Before

Common preparation steps like opening a web page, logging in a user, can be placed in `Before` or `Background` hook:

```js
Feature('CodeceptJS Demonstration');

Before((I) => { // or Background
  I.amOnPage('/documentation');
});

Scenario('test some forms', (I) => {
  I.click('Create User');
  I.see('User is valid');
  I.dontSeeInCurrentUrl('/documentation');
});

Scenario('test title', (I) => {
  I.seeInTitle('Example application');
});
```

Same as `Before` you can use `After` to run teardown for each scenario.

## BeforeSuite

If you need to run complex setup before all tests and teardown this afterwards you can use `BeforeSuite` and `AfterSuite`
functions. `BeforeSuite` and `AfterSuite` have access to `I` object, but `BeforeSuite/AfterSuite` don't have an access to the browser because it's not running at this moment.
You can use them to execute handlers that will setup your environment. `BeforeSuite/AfterSuite` will work  only for a file where it was declared (so you can declare different setups for files)

```js
BeforeSuite((I) => {
  I.syncDown('testfolder');
});

AfterSuite((I) => {
  I.syncUp('testfolder');
  I.clearDir('testfolder');
});
```

[Here are some ideas](https://github.com/Codeception/CodeceptJS/pull/231#issuecomment-249554933) where to use BeforeSuite hooks.

## Within

To specify the exact area on a page where actions can be performed you can use `within` function.
Everything executed in its context will be narrowed to context specified by locator:

Usage: `within('section', ()=>{})`

```js
I.amOnPage('https://github.com');
within('.js-signup-form', () => {
  I.fillField('user[login]', 'User');
  I.fillField('user[email]', 'user@user.com');
  I.fillField('user[password]', 'user@user.com');
  I.click('button');
});
I.see('There were problems creating your account.');
```

`within` can also work with [iframes](/acceptance/#iframes)

When running steps inside a within block will be shown with a shift:

![within](https://codecept.io/img/within.png)

Within can return a value which can be used in a scenario:

```js
// inside async function
const val = await within('#sidebar', () => {
  return I.grabTextFrom({ css: 'h1' });
});
I.fillField('Description', val);
```

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

## Skipping

Like in Mocha you can use `x` and `only` to skip tests or making a single test to run.

* `xScenario` - skips current test
* `Scenario.only` - executes only the current test


## Retries

### Retry Step

If you have a step which often fails you can retry execution for this single step.
Use `retry()` function before an action to ask CodeceptJS to retry this step on failure:

```js
I.retry().see('Welcome');
```

If you'd like to retry step more than once pass the amount as parameter:

```js
I.retry(3).see('Welcome');
```

Additional options can be provided to retry so you can set the additional options (defined in [promise-retry](https://www.npmjs.com/package/promise-retry) library).


```js
// retry action 3 times waiting for 0.1 second before next try
I.retry({ retries: 3, minTimeout: 100 }).see('Hello');

// retry action 3 times waiting no more than 3 seconds for last retry
I.retry({ retries: 3, maxTimeout: 3000 }).see('Hello');

// retry 2 times if error with message 'Node not visible' happens
I.retry({
  retries: 2,
  when: err => err.message === 'Node not visible'
}).seeElement('#user');
```

Pass a function to `when` option to retry only when error matches the expected one.

### Auto Retry

You can auto-retry a failed step by enabling [retryFailedStep Plugin](https://codecept.io/plugins/#retryfailedstep).

### Retry Scenario

When you need to rerun scenarios few times just add `retries` option added to `Scenario` declaration.

CodeceptJS implements retries the same way [Mocha do](https://mochajs.org#retry-tests);
You can set number of a retries for a feature:

```js
Scenario('Really complex', (I) => {
  // test goes here
}).retry(2);

// alternative
Scenario('Really complex', { retries: 2 }, (I) => {});
```

This scenario will be restarted two times on a failure.

### Retry Feature

To set this option for all scenarios in a file, add retry to a feature:

```js
Feature('Complex JS Stuff').retry(3);
```

Every Scenario inside this feature will be rerun 3 times.
You can make an exception for a specific scenario by passing `retries` option to a Scenario.
