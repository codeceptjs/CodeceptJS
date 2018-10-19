# Basics

CodeceptJS is a modern end to end testing framework with a special BDD-style syntax. The test is written as a linear scenario of user's action on a site.

```js
Feature('CodeceptJS demo');

Scenario('check Welcome page on site', (I) => {
  I.amOnPage('/');
  I.see('Welcome');
})
```

Tests are expected to be written in ECMAScript 6.
Each test is described inside a `Scenario` function with `I` object passed into it.
I object is an **actor**, an abstraction for a testing user. I is a proxy object for currently enabled **Helpers**.

```json
  "helpers": {
    "WebDriverIO": {
      "url": "http://localhost",
      "browser": "chrome"
    }
  }
```

For current config all methods of `I` will be taken from `WebDriverIO` helper.
This is done to allow easy switching of running backends so you could replace WebDriverIO with Protractor or Nightmare helpers.

## How It Works

Tests are written in synchronous way. Test scenarios should be linear, so tests by themselves should not include promises or callbacks as well.
However, behind the scene **all actions are wrapped in promises** inside the `I` object.
[Global promise](https://github.com/Codeception/CodeceptJS/blob/master/lib/recorder.js) chain is initialized before each test and all `I.*` calls will be appended to it as well as setup and teardown.

If you want to get information from a running test you can use `await` inside **async function** and special methods of helpers started with `grab` prefix.

```js
Scenario('try grabbers', async (I) => {
  var title = await I.grabTitle();
});
```

then you can use those variables in assertions:

```js
var title = await I.grabTitle();
var assert = require('assert');
assert.equal(title, 'CodeceptJS');
```

## Debug

### Pause

Test execution can be paused in any place of a test with `pause()` call.
This also launches interactive console where you can call actions of `I` object.

![shell](/images/shell.png)

You can also use `pause()` to check the web application in a browser. Press `ENTER` to resume test execution.

To **debug test step-by-step** type `next` and press Enter. The next step will be executed and interactive shell will be shown again.

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

![within](http://codecept.io/images/within.png)

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

Pass a function to `when` option to  retry only when error matches the expected one.


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

## Test Options

Features and Scenarios have their options that can be set by passing a hash after their names:

```js
Feature('My feature', {key: val});

Scenario('My scenario', {key: val}, (I) => {});
```

### Timeout

By default there is no timeout for tests, however you can change this value for a specific suite:

```js
Feature('Stop me').timeout(5000); // set timeout to 5s
```

or for the test:

```js
// set timeout to 1s
Scenario("Stop me faster", (I) => {
  // test goes here
}).timeout(1000);

// alternative
Scenario("Stop me faster", {timeout: 1000}, (I) => {});

// disable timeout for this scenario
Scenario("Don't stop me", {timeout: 0}, (I) => {});
```



---

### done()
