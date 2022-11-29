---
permalink: quickstart
title: Quickstart
layout: Section
sidebar: true
---

::: slot sidebar

#### Use WebDriver for classical Selenium setup

<small>
This gives you access to rich Selenium ecosystem and cross-browser support for majority of browsers and devices.
</small>


<a href="/webdriver" class="button extended" >Start with WebDriver &raquo;</a>

<small> WebDriver support is implemented via [webdriverio](https://webdriver.io) library </small>

---

#### Use TestCafe for cross-browser testing without Selenium

<small>
TestCafe provides cross-browser support without Selenium. TestCafe tests are faster, require no extra tooling and faster than regular Selenium. However, can be less stable.
</small>

<a href="/testcafe" class="button green extended" >Start with TestCafe &raquo;</a>

---

* [Mobile Testing with Appium »](/mobile)
* [Testing with Protractor »](/angular)

:::

# Quickstart


Use [CodeceptJS all-in-one installer](https://github.com/codeceptjs/create-codeceptjs) to get CodeceptJS, a demo project, and Playwright.

```
npx create-codeceptjs .
```

If you prefer not to use Playwright see other [installation options](/installation/).

![Installation](/img/codeceptinstall.gif)

> To install codeceptjs into a different folder, like `tests` use `npx create-codeceptjs tests`

After CodeceptJS is installed, try running **demo tests** using this commands:

* `npm run codeceptjs:demo` - executes demo tests in window mode
* `npm run codeceptjs:demo:headless` - executes demo tests in headless mode
* `npm run codeceptjs:demo:ui` - open CodeceptJS UI to list and run demo tests. 

[CodeceptJS UI](/ui) application:

![](https://user-images.githubusercontent.com/220264/93860826-4d5fbc80-fcc8-11ea-99dc-af816f3db466.png)

---

### Init

To start a new project initialize CodeceptJS to create main config file: `codecept.conf.js`.

```
npx codeceptjs init
```

Answer questions, agree on defaults:


| Question | Default Answer  | Alternative
|---|---|---|
| Do you plan to write tests in TypeScript?  | **n** (No)  | or [learn how to use TypeScript](/typescript)
| Where are your tests located? | `**./*_test.js` | or any glob pattern like `**.spec.js`
| What helpers do you want to use? | **Playwright** | Which helper to use for: [web testing](https://codecept.io/basics/#architecture), [mobile testing](https://codecept.io/mobile/), [API testing](https://codecept.io/api/)
| Where should logs, screenshots, and reports to be stored? | `./output` | path to store artifacts and temporary files 
| Do you want to enable localization for tests? | **n** English (no localization) | or write [localized tests](https://codecept.io/translation/) in your language
  

Sample output:

```js
? Do you plan to write tests in TypeScript? 'No'
? Where are your tests located? '**./*_test.js'
? What helpers do you want to use? 'Playwright'
? Where should logs, screenshots, and reports to be stored? '**./output**'
? Do you want to enable localization for tests? 'English (no localization)'
```

For Playwright helper provide a website to be tested and browser to be used:

| Question | Default Answer  | Alternative
|---|---|---|
| Base url of site to be tested | http://localhost | Base URL of website you plan to test. Use http://github.com or [sample checkout page](https://getbootstrap.com/docs/5.2/examples/checkout/) if you just want to play around
| Show browser window | **y** Yes | or run browser in **headless mode** 
| Browser in which testing will be performed | **chromium** | or run tests in firefox, webkit (which is opensource version of Safari) or launch electron app

```js
? [Playwright] Base url of site to be tested 'http://mysite.com'
? [Playwright] Show browser window 'Yes'
? [Playwright] Browser in which testing will be performed. Possible options: chromium, firefox, webkit or electron 'chromium'

```

Create first feature and test when asked

Open a newly created file in your favorite JavaScript editor. 
The file should look like this:

```js
Feature('My First Test');

Scenario('test something', ({ I }) => {

});
```
Write a simple test scenario:

```js
Feature('My First Test');

Scenario('test something', ({ I }) => {
  I.amOnPage('https://github.com');
  I.see('GitHub');
});
```

Run a test:

```
npx codeceptjs run
```

The output should be similar to this:

```bash
My First Test --
  test something
     I am on page "https://github.com"
     I see "GitHub"
 ✓ OK
```

To quickly execute tests use following npm scripts:

After CodeceptJS is installed, try running **demo tests** using this commands:

* `npm run codeceptjs` - executes tests in window mode
* `npm run codeceptjs:headless` - executes tests in headless mode
* `npm run codeceptjs:ui` - open CodeceptJS UI to list and run tests. 

More commands available in [CodeceptJS CLI runner](https://codecept.io/commands/).


> [▶ Next: CodeceptJS Basics](/basics/)

> [▶ Next: CodeceptJS with Playwright](/playwright/)

