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
      "browser": "firefox"
    }
  }
```

For current config all methods of `I` will be taken from `WebDriverIO` helper.
This is done to allow easy switching of running backends so you could replace WebDriverIO with Protractor or Nightmare helpers.

## How It Works

Tests are written in synchronous way. Test scenarios should be linear, so tests by themseleves should not include promises or callbacks as well.
However, behind the scene **all actions are wrapped in promises** inside the `I` object.
[Global promise](https://github.com/Codeception/CodeceptJS/blob/master/lib/recorder.js) chain is initialized before each test and all `I.*` calls will be appended to it as well as setup and teardown.

If you want to get information from a running test you can use `yield` inside a **generator function** and special methods of helpers started with `grab` prefix.

```js
Scenario('try grabbers', function* (I) {
  var title = yield I.grabTitle();
});
```

then you can use those variables in assertions:

```js
var title = yield I.grabTitle();
var assert = require('assert');
assert.equal(title, 'CodeceptJS');
```

## Pause

Test execution can be paused in any place of a test with `pause()` call.
This also launches interactive console where you can call actions of `I` object.

![shell](/images/shell.png)

You can also use `pause()` to check the web application in a browser. Press `ENTER` to resume test execution.

Interactive shell can be started outside test context by running

```bash
codeceptjs shell
```

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
})
```

[Here are some ideas](https://github.com/Codeception/CodeceptJS/pull/231#issuecomment-249554933) where to use BeforeSuite hooks.

## Within

To specify the exact area on a page where actions can be performed you can use `within` function.
Everything executed in its context will be narrowed to context specified by locator:

```js
I.amOnPage('https://github.com');
within('.form-signup-home', function () {
  I.fillField('user[login]', 'User');
  I.fillField('user[email]', 'user@user.com');
  I.fillField('user[password]', 'user@user.com');
  I.click('button');
});
I.see('There were problems creating your account.');
```

When running steps inside a within block will be shown with a shift:

![within](http://codecept.io/images/within.png)

## Comments

There is a simple way to add additional comments to your test scenario.
Use `say` command to print information to screen:

```js
I.say('I am going to publish post');
I.say('I enter title and body');
I.say('I expect post is visible on site');
```

## Skipping

Like in Mocha you can use `x` and `only` to skip tests or making a single test to run.

* `xScenario` - skips current test
* `Scenario.only` - executes only the current test

## Reporters

CodeceptJS supports [Mocha Reporters](https://mochajs.org/#reporters).
They can be used with `--reporter` options.
By default a custom console reporter is enabled.

We are currently working on improving reporters support.

## Bootstrap

In case you need to execute arbitrary code before the tests,
you can place it into your bootstrap file and provide a relative path to it in `codecept.json`

```json
"bootstrap": "./run_server.js"
```

To run `bootstrap` async, just export a function in your bootstrap file

```js
module.exports = function(done) {
  // async instructions
  // call done() to continue execution
  // otherwise call done('error description')
}
```

## Teardown

In case you need to execute arbitrary code after the tests have run,
you can place it into your teardown file and provide a relative path to it in `codecept.json`

```json
"teardown": "./stop_server.js"
```

## Test Options

Features and Scenarios have their options that can be set by passing a hash after their names:

```js
Feature('My feature', {key: val});

Scenario('My scenario', {key: val}, (I) => {});
```

### Timeout

By default there is no timeout for tests, however you can change this value for a specific suite:

```js
Feature('Stop me', {timeout: 5000}); // set timeout to 5s
```

or for the test:

```js
// set timeout to 1s
Scenario("Stop me faster", {timeout: 1000}, (I) => {});

// disable timeout for this scenario
Scenario("Don't stop me", {timeout: 0}, (I) => {});
```

### Retries

Browser tests can be very fragile and some time you need to re run the few times just to make them pass.
This can be done with `retries` option added to `Feature` declaration.

CodeceptJS implements retries the same way [Mocha do](https://mochajs.org#retry-tests);
You can set number of a retries for a feature:

```js
Feature('Complex JS Stuff', {retries: 3})
```
Every Scenario inside this feature will be rerun 3 times.
You can make an exception for a specific scenario by passing `retries` option to it:

```js
Feature('Complex JS Stuff', {retries: 3})

Scenario('Not that complex', {retries: 1}, (I) => {
  // test goes here
});

Scenario('Really complex', (I) => {
  // test goes here
});
```
"Really complex" test will be restarted 3 times,
while "Not that complex" test will be rerun only once.

---

### done()
