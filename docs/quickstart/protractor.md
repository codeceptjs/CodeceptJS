# Protractor Quickstart

## Introduction

[Protractor](http://www.protractortest.org/#/) is an official tool for testing AngularJS applications.
CodeceptJS should not be considered as alternative to Protractor but a testing framework utilizing this powerful library.

There is no magic in testing of AngularJS application in CodeceptJS.
You just execute regular Protractor commands, packed in a simple high-level API.

## Setting up CodeceptJS with Protractor

To start using CodeceptJS you will need to install it via NPM and initialize it in directory with tests.

```bash
[sudo] npm install -g codeceptjs
npm install --save-dev protractor
```

Protractor uses webdriver to talk to the browser, so you need to install Selenium as well.

```bash
[sudo] npm install -g selenium-standalone
selenium-standalone install
selenium-standalone start
```

## Define Test Project

```bash
codeceptjs init

  Welcome to CodeceptJS initialization tool
  It will prepare and configure a test environment for you

Installing 
? Where are your tests located? ./*_test.js

? What helpers do you want to use?
 ◯ WebDriverIO
❯◉ Protractor
 ◯ Puppeteer
 ◯ Appium
 ◯ Nightmare
 ◯ FileSystem

? What helpers do you want to use? Protractor
Configure helpers...
? [Protractor] Base url of site to be tested http://localhost
? [Protractor] Protractor driver (local, direct, session, hosted, sauce, browserstack) hosted
? [Protractor] Browser in which testing will be performed chrome
? [Protractor] Root element of AngularJS application body
```

You will be asked questions about initial configuration, make sure you select Protractor helper.
If you didn't have Protractor library it **will be installed**.

Please use `http://todomvc.com/examples/angularjs/` as a url for Protractor helper.

The following config is created in `codecept.json` file:

```json
{
  "tests": "./*_test.js",
  "output": "./output",
  "helpers": {
    "Protractor": {
      "url": "https://todomvc.com/examples/angularjs/",
      "driver": "hosted",
      "browser": "chrome",
      "rootElement": "body"
    }
  },
  "include": {
    "I": "./steps_file.js"
  },
  "name": "todoangular"
}
```

First test can be generated with `gt` (Generate Test) command:

```bash
codeceptjs gt
```

After that you can start writing your first CodeceptJS/Angular tests.
Please look into the reference of [Protractor helper](../helpers/Protractor.md) for all available actions.
You can also run `list` command to see methods of I:

```bash
codeceptjs list
```

## Writing First Test

At first a page should be opened to proceed, we use `amOnPage` command for that. As we already specified full URL to TodoMVC app,
we can pass relative path into it instead of absolute url:

In CodeceptJS assertion commands have `see` or `dontSee` prefix:

```js
Feature('Todo MVC');

Scenario('create todo item', (I) => {
  I.amOnPage('/');
  I.dontSeeElement('#todo-count');
  I.see('todos')
});
```

## Run the test

A test can be executed with `run` command, we recommend to use `--steps` options to follow step-by-step execution:

```sh
$ codeceptjs run --steps

CodeceptJS 1.2.0
Using the selenium server at http://localhost:4444/wd/hub

TodoMvc --
 create todo item
 • I am on page "/"
 • I dont see element "#todo-count"
```

---

### Next: [CodeceptJS Basics >>>](../basics.md)
