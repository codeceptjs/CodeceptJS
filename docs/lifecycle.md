# Test Lifecycle

CodeceptJS running-a-test lifecycle

1. Run `BeforeSuite()` function
2. Start browser for test
3. Run `Before()` function to set up test
4. Run the test
5. Run the `After()` function to clean up
6. Close the browser
7. Run `AfterSuite()` function


## Mocha

CodeceptJS is built on top of the [Mocha testing framework](https://mochajs.org/), but for the most part it is hidden beneath the CodeceptJS API.

There are two places Mocha shows up.

1. [Mocha Reports](reports.md) allow you to customize the result output into various formats.

2. Configuring the test runner behavior so that it stops on the first failure, using Mocha's **bail** feature.

## Feature

Features name and group a bunch of scenarios.
The feature name can contain tags to help with filtering tests to run.


## Scenario

Each test is a `Scenario`.

It takes an actor `I` as a parameter, and possible other parameters representing page objects that the test needs.

```js
Feature('CodeceptJS Demonstration');

Scenario('test some forms', (I) => {
  I.amOnPage('/documentation');
  I.click('Create User');
  I.see('User is valid');
});

Scenario('test title is Example', (I) => {
  I.amOnPage('/documentation');
  I.seeInTitle('Example application');
});
```


* `xScenario` - skips this test
* `Scenario.only` - executes only this test

```js
Feature('CodeceptJS Demonstration');

xScenario('test some forms', (I) => {
  I.amOnPage('/documentation');
  I.click('Create User');
  I.see('User is valid');
  I.dontSeeInCurrentUrl('/documentation');
});

Scenario.only('test title is Example', (I) => {
  I.amOnPage('/documentation');
  I.seeInTitle('Example application');
});
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

## After

Common cleanup that is run after each test, but before the browser is closed.

```js
Feature('CodeceptJS Demonstration');

After((I) => { // or Background
  I.click('Logout');
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


## AfterSuite


## Skipping

Like in Mocha you can use `x` and `only` to skip tests or making a single test to run.

* `xScenario` - skips current test
* `Scenario.only` - executes only the current test

---

### Next: [Locators >>>](locators.md)

---
