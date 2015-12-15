# Basics

CodeceptJS is a modern end to end testing framework with a special BDD-style syntax. The test is written as a linear scenario of user's action on a site.

```js
Feature('CodeceptJS demo');

Scenario('check Welcome page on site', (I) => {
  I.amOnPage('/');
  I.see('Welcome');
}
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

Test execuition can be paused in any place of a test with `pause()` call. 
This also launches interactive console where you can call actions of `I` object.

![shell](/images/shell.png)

You can also the pause to check the web application in a browser. Press `ENTER` to resumet test execution.   

Interactive shell can be started outside test context by running

```bash
codeceptjs shell
```

## Before

Common preperation steps like opening a web page, logging in a user, can be placed in `Before` or `Background` hook:

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

## Within 

To specify the exact area on a page where actions can be performed you can use `within` function.
Everything executed in its context will be narrowed to context specified by locator:

```js
I.amOnPage('/');
within('form.user', function () {
  I.fillField('name', 'miles');
  I.fillField('email', 'miles@davis.com');
  I.click('button');
});
```

---

### done()