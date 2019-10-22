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

**Pick one helper, as it defines how tests are executed.** If requirements change it's easy to migrate to another, but don't use few helpers of same kind at once.

---

Refer to following guides to more information on:

* [▶ WebDriver](https://codecept.io/webdriver)
* [▶ Protractor](https://codecept.io/angular)
* [▶ Puppeteer](https://codecept.io/puppeteer)
* [▶ Nightmare](https://codecept.io/nightmare)
* [▶ TestCafe](https://codecept.io/testcafe)

> ℹ Depending on a helper selected a list of available actions may change.

To list all available commands for current configuration run `codeceptjs list`
or enable [auto-completion by generating TypeScript definitions](#intellisense).


## Writing Tests

Tests are written from a user's perspective. There is an actor (represented as `I`) which contains actions taken from helpers. A test is written as a sequence of actions performed by actor:

```js
I.amOnPage('/');
I.click('Login');
I.see('Please Login', 'h1');
// ...
```

### Opening a Page

A test should usually start with navigating browser to the website.

Start a test by opening a page. Use `I.amOnPage()` command for this:

```js
// When "http://site.com" is url in config
I.amOnPage('/'); // -> opens http://site.com/
I.amOnPage('/about'); // -> opens http://site.com/about
I.amOnPage('https://google.com'); // -> https://google.com
```

When URL doesn't start with a protocol (http:// or https://) it is considered to be a relative URL and appended to URL which was initially set in the config.

> It is recommended to use relative URLs and keep base URL in config file, so you could easily switch between development, staging, and production environments.


### Locating Element

Element can be found by CSS or XPath locators.

```js
I.seeElement('.user'); // element with CSS class user
I.seeElement('//button[contains(., "press me")]'); // button
```

By default CodeceptJS tries to guess the locator type.
In order to specify exact locator type you can pass an object called **strict locator**.

```js
I.seeElement({css: 'div.user'});
I.seeElement({xpath: '//div[@class=user]'});
```

Strict locators allow to specify additional locator types:

```js
// locate form element by name
I.seeElement({name: 'password'});
// locate element by id
I.seeElement({id: 'users'});
// locate element by React component and props
I.seeElement({react: 'user-profile', props: {name: 'davert'}});
```

In [mobile testing](http://codecept.io/mobile/#locating-elements) you can use `~` to specify accessibility id to locate an element. In web application you can locate element by their `aria-label` value.

```js
// locate element by [aria-label] attribute in web
// or by accessibility id in mobile
I.seeElement('~username');
```

> [▶ Learn more about using locators in CodeceptJS](https://codecept.io/locators).

### Clicking

CodeceptJS provides a flexible syntax to specify an element to click.

By default CodeceptJS tries to find button or link with exact text on it

```js
// search for link or button
I.click('Login');
```

If none found, CodeceptJS tries to find link or button containing that text. In case an image is clickable its `alt` attribute will be checked for text inclusion. Form buttons will also be searched by name.

To narrow down the results you can specify a context in second parameter.

```js
I.click('Login', '.nav'); // search only in .nav
I.click('Login', {css: 'footer'}); // search only in footer
```

> To skip guessing locator type pass in a strict locator. A locator starting with '#' or '.' is considered to be CSS. Locator starting with '//' or './/' is considered to be XPath.

You are not limited to buttons and links. Any element can be found by passing in valid CSS or XPath:

```js
// click element by CSS
I.click('#signup');
// click element located by special test-id attribute
I.click('//dev[@test-id="myid"]');
```

### Filling Fields

Clicking the links is not what takes the most time during testing a web site. If your site consists only of links you can skip test automation. The most routine waste of time goes into the testing of forms. CodeceptJS provides several ways of doing that.

Let's submit this sample form for a test:

```html
<form method="post" action="/update" id="update_form">
     <label for="user_name">Name</label>
     <input type="text" name="user[name]" id="user_name" />
     <label for="user_email">Email</label>
     <input type="text" name="user[email]" id="user_email" />
     <label for="user_gender">Gender</label>
     <select id="user_gender" name="user[gender]">
          <option value="m">Male</option>
          <option value="f">Female</option>
     </select>
     <input type="submit" name="submitButton" value="Update" />
</form>
```

We need to fill in all those fields and click "Update" button. CodeceptJS matches form elements by their label, name, or by CSS or XPath locators.

```js
// we are using label to match user_name field
I.fillField('Name', 'Miles');
// we can use input name
I.fillField('user[email]','miles@davis.com');
// select element by label, choose option by text
I.selectOption('Gender','Male');
// click 'Update' button, found by text
I.click('Update');
```

Alternative scenario:

```js
// we are using CSS
I.fillField('#user_name', 'Miles');
I.fillField('#user_email','miles@davis.com');
// select element by label, option by value
I.selectOption('#user_gender','m');
// click 'Update' button, found by name
I.click('submitButton', '#update_form');
```

To fill in sensitive data use `secret` function:

```js
I.fillField('password', secret('123456'));
```

### Assertions

In order to verify the expected behavior of a web application, a content should be checked.
CodeceptJS provides built-in assertions for that. They start with `see` (or `dontSee`) prefix.

The most general and common assertion is `see`, which checks visilibility of a text on a page:

```js
// Just a visible text on a page
I.see('Hello');
// text inside .msg element
I.see('Hello', '.msg');
// opposite
I.dontSee('Bye');
```

You should provide a text as first argument and optionally a locator to search for a text in a context.

You can check that specific element exists (or not) on a page, as it was described in [Locating Element](#locating-element) section.

```js
I.seeElement('.notice');
I.dontSeeElement('.error');
```

Additional assertions:

```js
I.seeInCurrentUrl('/user/miles');
I.seeInField('user[name]', 'Miles');
I.seeInTitle('My Website');
```

To see all possible assertions see the helper's reference.

### Grabbing

Sometimes you need to retrieve a data from a page to use it in next steps of a scenario.
Imagine, application generates a password and you want to ensure that user can login using this password.

```js
Scenario('login with generated password', async (I) => {
  I.fillField('email', 'miles@davis.com');
  I.click('Generate Password');
  const password = await I.grabTextFrom('#password');
  I.click('Login');
  I.fillField('email', 'miles@davis.com');
  I.fillField('password', password);
  I.click('Log in!');
  I.see('Hello, Miles');
});
```

`grabTextFrom` action is used here to retrieve text from an element. All actions starting with `grab` prefix are expected to return data. In order to synchronize this step with a scenario you should pause test execution with `await` keyword of ES6. To make it work your test should be written inside a async function (notice `async` in its definition).

```js
Scenario('use page title', async (I) => {
  // ...
  const password = await I.grabTextFrom('#password');
  I.fillField('password', password);
});
```

### Waiting

In modern web applications rendering is happen on client side.
Sometimes that may cause delays. A test may fail while trying to click an element which has not appeared on a page yet.
To handle this cases `wait*` methods introduced.

```js
I.waitForElement('#agree_button', 30); // secs
// clicks a button only when it is visible
I.click('#agree_button');
```

> ℹ See [helpers reference](https://codecept.io/reference) for a complete list of all available commands for a helper you use.

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
npx codeceptjs run --steps
```

To see more detailed output add `--debug` flag:

```
npx codeceptjs run --debug
```

To see very detailed output system use `--verbose` flag:

```
npx codeceptjs run --verbose
```

### Filter

A single test file can be executed if you provide a relative path to such file:

```
npx codeceptjs run github_test.js

# or

npx codeceptjs run admin/login_test.js
```

To filter a test by name use `--grep` parameter. Which will execute all tests with names matching the regex pattern.

To run all tests with `slow` word in it

```
npx codeceptjs run --grep "slow"
```

It is recommended to [filter tests by tags](https://codecept.io/advanced/#tags).


> For more options see [full reference of `run` command](https://codecept.io/commands/#run).

### Parallel Run

Since CodeceptJS 2.3 you can run tests in parallel by using NodeJS workers. This feature requires NodeJS >= 11.6. Use `run-workers` command with the number of workers (threads) to split tests.

```
npx codeceptjs run-workers 3
```

Tests are split by scenarios, not by files. Results are aggregated and shown in the main process.

## Configuration

Configuration is set in `codecept.conf.js` file which was created during `init` process.
Inside config file you can enable and configure helpers, plugins, set bootstrap and teardown scripts.

```js
exports.config = {
  helpers: {
    // enabled helpers with their configs
  },
  plugins: {
    // list of used plugins
  },
  include: {
    // current actor and page objects
  }
}
```

> ▶ See complete [configuration reference](https://codecept.io/configuration).

You can have multiple configuration files for a one project. In this case specify a config file to be used with `-c` when running.

```
npx codeceptjs run -c codecept.ci.conf.js
```

Tuning configuration for helpers like WebDriver, Puppeteer can be hard, as it requires good understanding of how those technologies work. Use [`@codeceptjs/configure`](https://github.com/codecept-js/configure) package with common configuration recipes.

For instance, you can set window size or toggle headless mode no matter of which helpers are actually used.

```js
const { setHeadlessWhen, setWindowSize } = require('@codeceptjs/configure');

// run headless when CI environment variable set
setHeadlessWhen(process.env.CI);
// set window size for any helper: Puppeteer, WebDriver, TestCafe
setWindowSize(1600, 1200);

exports.config = {
  // ...
}
```

> ▶ See more [configuration recipes](https://github.com/codecept-js/configure)

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

`within` can also work with IFrames. Special `frame` locator is required to locate the iframe and get into its context.

See example:

```js
within({frame: "#editor"}, () => {
  I.see('Page');
});
```

Nested IFrames can be set by passing array *(WebDriver, Nightmare & Puppeteer only)*:

```js
within({frame: [".content", "#editor"]}, () => {
  I.see('Page');
});
```

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

![](/img/edit.gif)

To get autocompletion when working with CodeceptJS use  Visual Studio Code or other IDE that supports TypeScript Definitions.

Generate step definitions with

```sh
npx codeceptjs def
```

Create `jsconfig.json` in your project root directory unless it is already there.

```jsconfig.json
{
  "compilerOptions": {
    "allowJs": true,
  }
}
```

Alternatively, you can include `/// <reference path="./steps.d.ts" />` into your test files
to get method autocompletion while writing tests.


## Multiple Sessions

CodeceptJS allows to run several browser sessions inside a test. This can be useful for testing communication between users inside a system, for instance in chats. To open another browser use `session()` function as shown in example:

```js
Scenario('test app', (I) => {
  I.amOnPage('/chat');
  I.fillField('name', 'davert');
  I.click('Sign In');
  I.see('Hello, davert');
  session('john', () => {
    // another session started
    I.amOnPage('/chat');
    I.fillField('name', 'john');
    I.click('Sign In');
    I.see('Hello, john');
  });
  // switching back to default session
  I.fillField('message', 'Hi, john');
  // there is a message from current user
  I.see('me: Hi, john', '.messages');
  session('john', () => {
    // let's check if john received it
    I.see('davert: Hi, john', '.messages');
  });
});
```

`session` function expects a first parameter to be a name of a session. You can switch back to session by using the same name.

You can override config for session by passing second parameter:

```js
session('john', { browser: 'firefox' } , () => {
  // run this steps in firefox
  I.amOnPage('/');
});
```

or just start session without switching to it. Call `session` passing only its name:

```js
Scenario('test', (I) => {
  // opens 3 additional browsers
  session('john');
  session('mary');
  session('jane');

  I.amOnPage('/');

  // switch to session by its name
  session('mary', () => {
    I.amOnPage('/login');
  });
}
```
`session` can return value which can be used in scenario:

```js
// inside async function
const val = await session('john', () => {
  I.amOnPage('/info');
  return I.grabTextFrom({ css: 'h1' });
});
I.fillField('Description', val);
```

Function passed into session can use `I`, page objects, and any objects declared for the scenario.
This function can also be declared as async (but doesn't work as generator).

Also, you can use `within` inside a session but you can't call session from inside `within`.


## Skipping

Like in Mocha you can use `x` and `only` to skip tests or making a single test to run.

* `xScenario` - skips current test
* `Scenario.only` - executes only the current test
