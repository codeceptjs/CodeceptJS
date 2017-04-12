# CodeceptJS [![NPM version][npm-image]][npm-url] [![Build Status](https://travis-ci.org/Codeception/CodeceptJS.svg?branch=master)](https://travis-ci.org/Codeception/CodeceptJS) [![Join the chat at https://gitter.im/Codeception/CodeceptJS](https://badges.gitter.im/Codeception/CodeceptJS.svg)](https://gitter.im/Codeception/CodeceptJS?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Reference: [Helpers API](https://github.com/Codeception/CodeceptJS/blob/master/docs) | [Demo](https://github.com/Codeception/codeceptjs-demo)

## Modern Era Acceptance Testing Framework for NodeJS

CodeceptJS is a new testing framework for end-to-end testing with WebDriver (or others).
It abstracts browser interaction to simple steps which is written from a user perspective.
A simple test that verifies that "Welcome" text is present on a main page of a site will look like:

```js
Feature('CodeceptJS demo');

Scenario('check Welcome page on site', (I) => {
  I.amOnPage('/');
  I.see('Welcome');
});
```

Codeception tests are:

* **Synchronous**. You don't need to care about callbacks, or promises, test scenarios are linear, your test should be too.
* Written from **user's perspective**. Every action is a method of `I`. That makes test easy to read, write and maintain even for non-tech persons.
* Backend **API agnostic**. We don't know which WebDriver implementation is running this test. We can easily switch from WebDriverIO to Protractor or PhantomJS.

Codeception uses **Helper** modules to provide actions to `I` object. Currently CodeceptJS has these helpers:

* [**WebDriverIO**](https://github.com/Codeception/CodeceptJS/blob/master/docs/helpers/WebDriverIO.md) - wrapper on top of Selenium bindings library [WebDriverIO](http://webdriver.io/)
* [**Protractor**](https://github.com/Codeception/CodeceptJS/blob/master/docs/helpers/Protractor.md) - helper enpowered by [Protractor](http://protractortest.org/) framework for AngularJS testing
* [**Nightmare**](https://github.com/Codeception/CodeceptJS/blob/master/docs/helpers/Nightmare.md) - helper which for testing web applications indi Electron  using NightmareJS.
* [**SeleniumWebdriver**](https://github.com/Codeception/CodeceptJS/blob/master/docs/helpers/SeleniumWebdriver.md) - helper which for selenium testing using official Selenium Webdriver JS bindings.
* [**FileSystem**](https://github.com/Codeception/CodeceptJS/blob/master/docs/helpers/FileSystem.md) - simple helper for testing filesystem.

And more to come...

## Why CodeceptJS?

CodeceptJS is a successor of [Codeception](http://codeception.com), a popular full-stack testing framework for PHP.
With CodeceptJS your scenario-driven functional and acceptance tests will be as simple and clean as they can be.
You don't need to worry about asynchronous nature of NodeJS or about various APIs of Selenium, PhantomJS, Protractor, etc,
as CodeceptJS unifies them and makes them work as they were synchronous.

## Features

* Based on [Mocha](https://mochajs.org/) testing framework.
* Designed for scenario driven acceptance testing in BDD-style
* Uses ES6 natively without transpiler.
* Also plays nice with TypeScript.
* Selenium WebDriver integration using [webdriverio](http://webdriver.io).
* Smart locators: use names, labels, matching text, CSS or XPath to locate elements.
* Interactive debugging shell: pause test at any point and try different commands in a browser.
* Easily create tests, pageobjects, stepobjects with CLI generators.


## Install

```sh
$ npm install -g codeceptjs
```

Move to directory where you'd like to have your tests (and codeceptjs config) stored, and run

```
codeceptjs init
```

to create and configure test environment. It is recommended to select WebDriverIO from the list of helpers,
if you need to write Selenium WebDriver tests.

After that create your first test by executing:

```
codeceptjs generate:test
```

Now test is created and can be executed with

```
codeceptjs run
```

If you want to write your tests using TypeScript just generate standard Type Definitions by executing:

```
codeceptjs def .
```

Later you can even automagically update Type Definitions to include your own custom [helpers methods](docs/helpers.md).

## Usage

Learn CodeceptJS by examples. Let's assume we have CodeceptJS installed and WebDriverIO helper enabled.

### Basics

Let's see how we can handle basic form testing:
```js
Feature('CodeceptJS Demonstration');

Scenario('test some forms', (I) => {
  I.amOnPage('http://simple-form-bootstrap.plataformatec.com.br/documentation');
  I.fillField('Email', 'hello@world.com');
  I.fillField('Password', '123456');
  I.checkOption('Active');
  I.checkOption('Male');
  I.click('Create User');
  I.see('User is valid');
  I.dontSeeInCurrentUrl('/documentation');
});
```

All actions are performed by I object; assertions functions start with `see` function.
In this examples all methods of `I` are taken from WebDriverIO helper, see [reference](https://github.com/Codeception/CodeceptJS/blob/master/docs/helpers/WebDriverIO.md) to learn how to use them.

Let's execute this test with `run` command. Additional option `--steps` will show us the running process. We recommend use `--steps` or `--debug` during development.

```
codeceptjs run --steps
```

This will produce an output:

```
CodeceptJS Demonstration --
 test some forms
 • I am on page "http://simple-form-bootstrap.plataformatec.com.br/documentation"
 • I fill field "Email", "hello@world.com"
 • I fill field "Password", "123456"
 • I check option "Active"
 • I check option "Male"
 • I click "Create User"
 • I see "User is valid"
 • I dont see in current url "/documentation"
 ✓ OK in 17752ms
```

CodeceptJS has an ultimate feature to help you develop and debug you test.
You can **pause execution of test in any place and use interactive shell** to try different actions and locators.
Just add `pause()` call at any place in a test and run it.

Interactive shell can be started outside test context by running:

```
codeceptjs shell
```

### Actions

We filled form with `fillField` methods, which located form elements by their label.
The same way you can locate element by name, CSS or XPath locators in tests:

```js
// by name
I.fillField('user_basic[email]', 'hello@world.com');
// by CSS
I.fillField('#user_basic_email', 'hello@world.com');
// don't make us guess locator type, specify it
I.fillField({css: '#user_basic_email'}, 'hello@world.com');
```

Other methods like `checkOption`, and `click` work in a similar manner. They can take labels or CSS or XPath locators to find elements to interact.

### Assertions

Assertions start with `see` or `dontSee` prefix. In our case we are asserting that string 'User is valid' is somewhere in a webpage.
However, we can narrow the search to particular element by providing a second parameter:

```js
I.see('User is valid');
// better to specify context:
I.see('User is valid', '.alert-success');
```

In this case 'User is valid' string will be searched only inside elements located by CSS `.alert-success`.

### Grabbers

In case you need to return a value from a webpage and use it directly in test, you should use methods with `grab` prefix.
They are expected to be used inside a generator functions, and their results will be available in test:

```js
var assert = require('assert');

Feature('CodeceptJS Demonstration');

Scenario('test page title', function*(I) {
  I.amOnPage('http://simple-form-bootstrap.plataformatec.com.br/documentation');
  var title = yield I.grabTitle();
  assert.equal(title, 'Example application with SimpleForm and Twitter Bootstrap');
});
```

The same way you can grab text, attributes, or form values and use them in next test steps.

### Before/After

Common preperation steps like opening a web page, logging in a user, can be placed in `Before` or `Background`:

```js
Feature('CodeceptJS Demonstration');

Before((I) => { // or Background
  I.amOnPage('http://simple-form-bootstrap.plataformatec.com.br/documentation');
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

## PageObjects

CodeceptJS provides the most simple way to create and use page objects in your test.
You can create one by running

```
codeceptjs generate pageobject
```

It will create a page object file for you and add it to config.
Let's assume we created one named `docsPage`:

```js
'use strict';

let I;

module.exports = {

  _init() {
    I = actor();
  },

  fields: {
    email: '#user_basic_email',
    password: '#user_basic_password'
  },
  submitButton: {css: '#new_user_basic input[type=submit]'},

  sendForm(email, password) {
    I.fillField(this.fields.email, email);
    I.fillField(this.fields.password, password);
    I.click(this.submitButton);
  }
}
```

You can easily inject it to test by providing its name in test arguments:

```js
Feature('CodeceptJS Demonstration');

Before((I) => { // or Background
  I.amOnPage('http://simple-form-bootstrap.plataformatec.com.br/documentation');
});

Scenario('test some forms', (I, docsPage) => {
  docsPage.sendForm('hello@world.com','123456');
  I.see('User is valid');
  I.dontSeeInCurrentUrl('/documentation');
});
```

## Current State

CodeceptJS is in its early days. Any feedback, issues, and pull requests are welcome. Try it, and if you like it - help us make it better!

## License

MIT © [DavertMik](http://codegyre.com)


[npm-image]: https://badge.fury.io/js/codeceptjs.svg
[npm-url]: https://npmjs.org/package/codeceptjs
[travis-image]: https://travis-ci.org/Codeception/codeceptjs.svg?branch=master
[travis-url]: https://travis-ci.org/Codeception/codeceptjs
[daviddm-image]: https://david-dm.org/Codeception/codeceptjs.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/Codeception/codeceptjs
[coveralls-image]: https://coveralls.io/repos/Codeception/codeceptjs/badge.svg
[coveralls-url]: https://coveralls.io/r/Codeception/codeceptjs
