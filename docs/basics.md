---
permalink: /basics
title: Getting Started
---

# Getting Started

CodeceptJS is a modern end to end testing framework with a special BDD-style syntax. The tests are written as a linear scenario of the user's action on a site.

```js
Feature('CodeceptJS demo');

Scenario('check Welcome page on site', ({ I }) => {
  I.amOnPage('/');
  I.see('Welcome');
});
```

Tests are expected to be written in **ECMAScript 7**.

Each test is described inside a `Scenario` function with the `I` object passed into it.
The `I` object is an **actor**, an abstraction for a testing user. The `I` is a proxy object for currently enabled **Helpers**.

## Architecture

CodeceptJS bypasses execution commands to helpers. Depending on the helper enabled, your tests will be executed differently. If you need cross-browser support you should choose Selenium-based WebDriver or TestCafé. If you are interested in speed - you should use Chrome-based Puppeteer.

The following is a diagram of the CodeceptJS architecture:

![architecture](/img/architecture.svg)

All helpers share the same API, so it's easy to migrate tests from one backend to another.
However, because of the difference in backends and their limitations, they are not guaranteed to be compatible with each other. For instance, you can't set request headers in WebDriver or Protractor, but you can do so in Puppeteer or Nightmare.

**Pick one helper, as it defines how tests are executed.** If requirements change it's easy to migrate to another.

---

Refer to following guides to more information on:

* [▶ Playwright](/playwright)
* [▶ WebDriver](/webdriver)
* [▶ Puppeteer](/puppeteer)
* [▶ Nightmare](/nightmare)
* [▶ TestCafe](/testcafe)

> ℹ Depending on a helper selected a list of available actions may change.

To list all available commands for the current configuration run `codeceptjs list`
or enable [auto-completion by generating TypeScript definitions](#intellisense).

> 🤔 It is possible to access API of a backend you use inside a test or a [custom helper](/helpers/). For instance, to use Puppeteer API inside a test use [`I.usePuppeteerTo`](/helpers/Puppeteer/#usepuppeteerto) inside a test. Similar methods exist for each helper.


## Writing Tests

Tests are written from a user's perspective. There is an actor (represented as `I`) which contains actions taken from helpers. A test is written as a sequence of actions performed by an actor:

```js
I.amOnPage('/');
I.click('Login');
I.see('Please Login', 'h1');
// ...
```

### Opening a Page

A test should usually start by navigating the browser to a website.

Start a test by opening a page. Use the `I.amOnPage()` command for this:

```js
// When "http://site.com" is url in config
I.amOnPage('/'); // -> opens http://site.com/
I.amOnPage('/about'); // -> opens http://site.com/about
I.amOnPage('https://google.com'); // -> https://google.com
```

When an URL doesn't start with a protocol (http:// or https://) it is considered to be a relative URL and will be appended to the URL which was initially set-up in the config.

> It is recommended to use a relative URL and keep the base URL in the config file, so you can easily switch between development, stage, and production environments.


### Locating Element

Element can be found by CSS or XPath locators.

```js
I.seeElement('.user'); // element with CSS class user
I.seeElement('//button[contains(., "press me")]'); // button
```

By default CodeceptJS tries to guess the locator type.
In order to specify the exact locator type you can pass an object called **strict locator**.

```js
I.seeElement({css: 'div.user'});
I.seeElement({xpath: '//div[@class=user]'});
```

Strict locators allow to specify additional locator types:

```js
// locate form element by name
I.seeElement({name: 'password'});
// locate element by React component and props
I.seeElement({react: 'user-profile', props: {name: 'davert'}});
```

In [mobile testing](https://codecept.io/mobile/#locating-elements) you can use `~` to specify the accessibility id to locate an element. In web application you can locate elements by their `aria-label` value.

```js
// locate element by [aria-label] attribute in web
// or by accessibility id in mobile
I.seeElement('~username');
```

> [▶ Learn more about using locators in CodeceptJS](/locators).

### Clicking

CodeceptJS provides a flexible syntax to specify an element to click.

By default CodeceptJS tries to find the button or link with the exact text on it

```js
// search for link or button
I.click('Login');
```

If none was found, CodeceptJS tries to find a link or button containing that text. In case an image is clickable its `alt` attribute will be checked for text inclusion. Form buttons will also be searched by name.

To narrow down the results you can specify a context in the second parameter.

```js
I.click('Login', '.nav'); // search only in .nav
I.click('Login', {css: 'footer'}); // search only in footer
```

> To skip guessing the locator type, pass in a strict locator - A locator starting with '#' or '.' is considered to be CSS. Locators starting with '//' or './/' are considered to be XPath.

You are not limited to buttons and links. Any element can be found by passing in valid CSS or XPath:

```js
// click element by CSS
I.click('#signup');
// click element located by special test-id attribute
I.click('//dev[@test-id="myid"]');
```

> ℹ If click doesn't work in a test but works for user, it is possible that frontend application is not designed for automated testing. To overcome limitation of standard click in this edgecase use `forceClick` method. It will emulate click instead of sending native event. This command will click an element no matter if this element is visible or animating. It will send JavaScript "click" event to it.

### Filling Fields

Clicking the links is not what takes the most time during testing a web site. If your site consists only of links you can skip test automation. The most waste of time goes into the testing of forms. CodeceptJS provides several ways of doing that.

Let's submit this sample form for a test:

![](https://user-images.githubusercontent.com/220264/80355863-494a8280-8881-11ea-9b41-ba1f07abf094.png)

```html
<form method="post" action="/update" id="update_form">
     <label for="user_name">Name</label>
     <input type="text" name="user[name]" id="user_name" /><br>
     <label for="user_email">Email</label>
     <input type="text" name="user[email]" id="user_email" /><br>
     <label for="user_role">Role</label>
     <select id="user_role" name="user[role]">
          <option value="0">Admin</option>
          <option value="1">User</option>
     </select><br>
     <input type="checkbox" id="accept" /> <label for="accept">Accept changes</label>
     <div>
     <input type="submit" name="submitButton" class="btn btn-primary" value="Save" />
     </div>
</form>
```

We need to fill in all those fields and click the "Update" button. CodeceptJS matches form elements by their label, name, or by CSS or XPath locators.

```js
// we are using label to match user_name field
I.fillField('Name', 'Miles');
// we can use input name
I.fillField('user[email]','miles@davis.com');
// select element by label, choose option by text
I.selectOption('Role','Admin');
// click 'Save' button, found by text
I.checkOption('Accept');
I.click('Save');
```

> ℹ `selectOption` works only with standard `<select>` <select></select> HTML elements. If your selectbox is created by React, Vue, or as a component of any other framework, this method potentially won't work with it. Use `click` to manipulate it.

> ℹ `checkOption` also works only with standard `<input type="checkbox">` <input type="checkbox"> HTML elements. If your checkbox is created by React, Vue, or as a component of any other framework, this method potentially won't work with it. Use `click` to manipulate it.

Alternative scenario:

```js
// we are using CSS
I.fillField('#user_name', 'Miles');
I.fillField('#user_email','miles@davis.com');
// select element by label, option by value
I.selectOption('#user_role','1');
// click 'Update' button, found by name
I.click('submitButton', '#update_form');
```

To fill in sensitive data use the `secret` function, it won't expose actual value in logs.

```js
I.fillField('password', secret('123456'));
```

> ℹ️ Learn more about [masking secret](/secrets/) output

### Assertions

In order to verify the expected behavior of a web application, its content should be checked.
CodeceptJS provides built-in assertions for that. They start with a `see` (or `dontSee`) prefix.

The most general and common assertion is `see`, which checks visilibility of a text on a page:

```js
// Just a visible text on a page
I.see('Hello');
// text inside .msg element
I.see('Hello', '.msg');
// opposite
I.dontSee('Bye');
```

You should provide a text as first argument and, optionally, a locator to search for a text in a context.

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

To see all possible assertions, check the helper's reference.

> ℹ If you need custom assertions, you can install an assertion libarary like `chai`, use grabbers to obtain information from a browser and perform assertions. However, it is recommended to put custom assertions into a helper for further reuse.

### Grabbing

Sometimes you need to retrieve data from a page to use it in the following steps of a scenario.
Imagine the application generates a password, and you want to ensure that user can login using this password.

```js
Scenario('login with generated password', async ({ I }) => {
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

The `grabTextFrom` action is used to retrieve the text from an element. All actions starting with the `grab` prefix are expected to return data. In order to synchronize this step with a scenario you should pause the test execution with the `await` keyword of ES6. To make it work, your test should be written inside a async function (notice `async` in its definition).

```js
Scenario('use page title', async ({ I }) => {
  // ...
  const password = await I.grabTextFrom('#password');
  I.fillField('password', password);
});
```

### Waiting

In modern web applications, rendering is done on the client-side.
Sometimes that may cause delays. A test may fail while trying to click an element which has not appeared on a page yet.
To handle these cases, the `wait*` methods has been introduced.

```js
I.waitForElement('#agree_button', 30); // secs
// clicks a button only when it is visible
I.click('#agree_button');
```
> ℹ See [helpers reference](/reference) for a complete list of all available commands for the helper you use.

## How It Works

Tests are written in a synchronous way. This improves the readability and maintainability of tests.
While writing tests you should not think about promises, and instead should focus on the test scenario.

However, behind the scenes **all actions are wrapped in promises**, inside of the `I` object.
[Global promise](https://github.com/codeceptjs/CodeceptJS/blob/master/lib/recorder.js) chain is initialized before each test and all `I.*` calls will be appended to it, as well as setup and teardown.

> 📺 [Learn how CodeceptJS](https://www.youtube.com/watch?v=MDLLpHAwy_s) works with promises by watching video on YouTube

If you want to get information from a running test you can use `await` inside the **async function**, and utilize special methods of helpers started with the `grab` prefix.

```js
Scenario('try grabbers', async ({ I }) => {
  let title = await I.grabTitle();
});
```

then you can use those variables in assertions:

```js
var title = await I.grabTitle();
var assert = require('assert');
assert.equal(title, 'CodeceptJS');
```

It is important to understand the usage of **async** functions in CodeceptJS. While non-returning actions can be called without await, if an async function uses `grab*` action it must be called with `await`:

```js
// a helper function
async function getAllUsers(I) {
   const users = await I.grabTextFrom('.users');
   return users.filter(u => u.includes('active'))
}

// a test
Scenario('try helper functions', async ({ I }) => {
  // we call function with await because it includes `grab`
  const users = await getAllUsers(I);
});
```

If you miss `await` you get commands unsynchrhonized. And this will result to an error like this:

```
(node:446390) UnhandledPromiseRejectionWarning: ...
    at processTicksAndRejections (internal/process/task_queues.js:95:5)
(node:446390) UnhandledPromiseRejectionWarning: Unhandled promise rejection. This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). To terminate the node process on unhandled promise rejection, use the CLI flag `--unhandled-rejections=strict` (see https://nodejs.org/api/cli.html#cli_unhandled_rejections_mode). (rejection id: 2)
```

If you face that error please make sure that all async functions are called with `await`.

## Running Tests

To launch tests use the `run` command, and to execute tests in [multiple browsers](/advanced/#multiple-browsers-execution) or [multiple threads](/advanced/#parallel-execution) use the `run-multiple` command.

### Level of Detail

To see the step-by-step output of running tests, add the `--steps` flag:

```
npx codeceptjs run --steps
```

To see a more detailed output add the `--debug` flag:

```
npx codeceptjs run --debug
```

To see very detailed output informations use the `--verbose` flag:

```
npx codeceptjs run --verbose
```

### Filter

A single test file can be executed if you provide a relative path to such a file:

```
npx codeceptjs run github_test.js

# or

npx codeceptjs run admin/login_test.js
```

To filter a test by name use the `--grep` parameter, which will execute all tests with names matching the regex pattern.

To run all tests with the `slow` word in it:

```
npx codeceptjs run --grep "slow"
```

It is recommended to [filter tests by tags](/advanced/#tags).


> For more options see [full reference of `run` command](/commands/#run).

### Parallel Run

Since CodeceptJS 2.3, you can run tests in parallel by using NodeJS workers. This feature requires NodeJS >= 11.6. Use `run-workers` command with the number of workers (threads) to split tests.

```
npx codeceptjs run-workers 3
```

Tests are split by scenarios, not by files. Results are aggregated and shown up in the main process.

## Configuration

Configuration is set in the `codecept.conf.js` file which was created during the `init` process.
Inside the config file you can enable and configure helpers and plugins, and set bootstrap and teardown scripts.

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

> ▶ See complete [configuration reference](/configuration).

You can have multiple configuration files for a the same project, in this case you can specify a config file to be used with `-c` when running.

```
npx codeceptjs run -c codecept.ci.conf.js
```

Tuning configuration for helpers like WebDriver, Puppeteer can be hard, as it requires good understanding of how these technologies work. Use the [`@codeceptjs/configure`](https://github.com/codeceptjs/configure) package with common configuration recipes.

For instance, you can set the window size or toggle headless mode, no matter of which helpers are actually used.

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

> ▶ See more [configuration recipes](https://github.com/codeceptjs/configure)

## Debug

CodeceptJS allows to write and debug tests on the fly while keeping your browser opened.
By using the interactive shell you can stop execution at any point and type in any CodeceptJS commands.

This is especially useful while writing a new scratch. After opening a page call `pause()` to start interacting with a page:

```js
I.amOnPage('/');
pause();
```

Try to perform your scenario step by step. Then copy succesful commands and insert them into a test.

### Pause

Test execution can be paused in any place of a test with `pause()` call.
Variables can also be passed to `pause({data: 'hi', func: () => console.log('hello')})` which can be accessed in Interactive shell.

This launches the interactive console where you can call any action from the `I` object.

```
 Interactive shell started
 Press ENTER to resume test
 Use JavaScript syntax to try steps in action
 - Press ENTER to run the next step
 - Press TAB twice to see all available commands
 - Type exit + Enter to exit the interactive shell
 - Prefix => to run js commands
 I.
```

Type in different actions to try them, copy and paste successful ones into the test file.

Press `ENTER` to resume test execution.

To **debug test step-by-step** press Enter, the next step will be executed and interactive shell will be shown again.

To see all available commands, press TAB two times to see list of all actions included in the `I` object.

> The interactive shell can be started outside of test context by running `npx codeceptjs shell`

PageObjects and other variables can also be passed to as object:

```js
pause({ loginPage, data: 'hi', func: () => console.log('hello') });
```

Inside a pause mode you can use `loginPage`, `data`, `func` variables.
Arbitrary JavaScript code can be executed when used `=> ` prefix:

```js
I.=> loginPage.open()
I.=> func()
I.=> 2 + 5
```

### Pause on Fail

To start interactive pause automatically for a failing test you can run tests with [pauseOnFail Plugin](/plugins/#pauseonfail).
When a test fails, the pause mode will be activated, so you can inspect current browser session before it is closed.

> **[pauseOnFail plugin](/plugins/#pauseOnFail) can be used** for new setups

To run tests with pause on fail enabled use `-p pauseOnFail` option

```
npx codeceptjs run -p pauseOnFail
```

> To enable pause after a test without a plugin you can use `After(pause)` inside a test file.


### Screenshot on Failure

By default CodeceptJS saves a screenshot of a failed test.
This can be configured in [screenshotOnFail Plugin](/plugins/#screenshotonfail)

> **[screenshotOnFail plugin](/plugins/#screenshotonfail) is enabled by default** for new setups

### Step By Step Report

To see how the test was executed, use [stepByStepReport Plugin](/plugins/#stepbystepreport). It saves a screenshot of each passed step and shows them in a nice slideshow.

## Retries

### Auto Retry

You can auto-retry a failed step by enabling [retryFailedStep Plugin](/plugins/#retryfailedstep).

> **[retryFailedStep plugin](/plugins/#retryfailedstep) is enabled by default** for new setups

### Retry Step

Unless you use retryFailedStep plugin you can manually control retries in your project.

If you have a step which often fails, you can retry execution for this single step.
Use the `retry()` function before an action to ask CodeceptJS to retry it on failure:

```js
I.retry().see('Welcome');
```

If you'd like to retry a step more than once, pass the amount as a parameter:

```js
I.retry(3).see('Welcome');
```

Additional options can be provided to `retry`, so you can set the additional options (defined in [promise-retry](https://www.npmjs.com/package/promise-retry) library).


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

Pass a function to the `when` option to retry only when an error matches the expected one.


### Retry Scenario

When you need to rerun scenarios a few times, add the `retries` option to the `Scenario` declaration.

CodeceptJS implements retries the same way [Mocha does](https://mochajs.org#retry-tests);
You can set the number of a retries for a feature:

```js
Scenario('Really complex', ({ I }) => {
  // test goes here
}).retry(2);

// alternative
Scenario('Really complex', { retries: 2 },({ I }) => {});
```

This scenario will be restarted two times on a failure.
Unlike retry step, there is no `when` condition supported for retries on a scenario level.

### Retry Feature

To set this option for all scenarios in a file, add `retry` to a feature:

```js
Feature('Complex JS Stuff').retry(3);
```

Every Scenario inside this feature will be rerun 3 times.
You can make an exception for a specific scenario by passing the `retries` option to a Scenario.


## Before

Common preparation steps like opening a web page or logging in a user, can be placed in the `Before` or `Background` hooks:

```js
Feature('CodeceptJS Demonstration');

Before(({ I }) => { // or Background
  I.amOnPage('/documentation');
});

Scenario('test some forms', ({ I }) => {
  I.click('Create User');
  I.see('User is valid');
  I.dontSeeInCurrentUrl('/documentation');
});

Scenario('test title', ({ I }) => {
  I.seeInTitle('Example application');
});
```

Same as `Before` you can use `After` to run teardown for each scenario.

## BeforeSuite

If you need to run complex a setup before all tests and have to teardown this afterwards, you can use the `BeforeSuite` and `AfterSuite` functions.
`BeforeSuite` and `AfterSuite` have access to the `I` object, but `BeforeSuite/AfterSuite` don't have any access to the browser, because it's not running at this moment.
You can use them to execute handlers that will setup your environment. `BeforeSuite/AfterSuite` will work only for the file it was declared in (so you can declare different setups for files)

```js
BeforeSuite(({ I }) => {
  I.syncDown('testfolder');
});

AfterSuite(({ I }) => {
  I.syncUp('testfolder');
  I.clearDir('testfolder');
});
```

[Here are some ideas](https://github.com/codeceptjs/CodeceptJS/pull/231#issuecomment-249554933) on where to use BeforeSuite hooks.

## Within

To specify the exact area on a page where actions can be performed you can use the `within` function.
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

> ⚠ `within` can cause problems when used incorrectly. If you see a weird behavior of a test try to refactor it to not use `within`. It is recommended to keep within for simplest cases when possible.
> Since `within` returns a Promise, it may be necessary to `await` the result even when you're not intending to use the return value.

`within` can also work with IFrames. A special `frame` locator is required to locate the iframe and get into its context.


See example:

```js
within({frame: "#editor"}, () => {
  I.see('Page');
});
```

> ℹ IFrames can also be accessed via `I.switchTo` command of a corresponding helper.

Nested IFrames can be set by passing an array *(WebDriver, Nightmare & Puppeteer only)*:

```js
within({frame: [".content", "#editor"]}, () => {
  I.see('Page');
});
```

When running steps inside, a within block will be shown with a shift:

![within](/img/within.png)

Within can return a value, which can be used in a scenario:

```js
// inside async function
const val = await within('#sidebar', () => {
  return I.grabTextFrom({ css: 'h1' });
});
I.fillField('Description', val);
```

## Conditional Actions

There is a way to execute unsuccessful actions to without failing a test. 
This might be useful when you might need to click "Accept cookie" button but probably cookies were already accepted.
To handle these cases `tryTo` function was introduced:

```js
tryTo(() => I.click('Accept', '.cookies'));
```

You may also use `tryTo` for cases when you deal with uncertainty on page:

* A/B testing
* soft assertions
* cookies & gdpr

`tryTo` function is enabled by default via [tryTo plugin](/plugins/#tryto)

## Comments

There is a simple way to add additional comments to your test scenario:
Use the `say` command to print information to screen:

```js
I.say('I am going to publish post');
I.say('I enter title and body');
I.say('I expect post is visible on site');
```

Use the second parameter to pass in a color value (ASCII).

```js
I.say('This is red', 'red'); //red is used
I.say('This is blue', 'blue'); //blue is used
I.say('This is by default'); //cyan is used
```


## IntelliSense

![Edit](/img/edit.gif)

To get autocompletion when working with CodeceptJS, use Visual Studio Code or another IDE that supports TypeScript Definitions.

Generate step definitions with:

```sh
npx codeceptjs def
```

Create a file called `jsconfig.json` in your project root directory, unless you already have one.

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

CodeceptJS allows to run several browser sessions inside a test. This can be useful for testing communication between users inside a chat or other systems. To open another browser use the `session()` function as shown in the example:

```js
Scenario('test app', ({ I }) => {
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

The `session` function expects the first parameter to be the name of the session. You can switch back to this session by using the same name.

You can override the configuration for the session by passing a second parameter:

```js
session('john', { browser: 'firefox' } , () => {
  // run this steps in firefox
  I.amOnPage('/');
});
```

or just start the session without switching to it. Call `session` passing only its name:

```js
Scenario('test', ({ I }) => {
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
`session` can return a value which can be used in a scenario:

```js
// inside async function
const val = await session('john', () => {
  I.amOnPage('/info');
  return I.grabTextFrom({ css: 'h1' });
});
I.fillField('Description', val);
```

Functions passed into a session can use the `I` object, page objects, and any other objects declared for the scenario.
This function can also be declared as async (but doesn't work as generator).

Also, you can use `within` inside a session, but you can't call session from inside `within`.


## Skipping

Like in Mocha you can use `x` and `only` to skip tests or to run a single test.

* `xScenario` - skips current test
* `Scenario.skip` - skips current test
* `Scenario.only` - executes only the current test
* `xFeature` - skips current suite <Badge text="Since 2.6.6" type="warning"/>
* `Feature.skip` - skips the current suite <Badge text="Since 2.6.6" type="warning"/>


## Todo Test

You can use `Scenario.todo` when you are planning on writing tests.

This test will be skipped like with regular `Scenario.skip` but with additional message "Test not implemented!":

Use it with a test body as a test plan:

```js
Scenario.todo('Test',  I => {
/**
 * 1. Click to field
 * 2. Fill field
 *
 * Result:
 * 3. Field contains text
 */
});
```

Or even without a test body:

```js
Scenario.todo('Test');
```
