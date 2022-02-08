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

To start a new project initialize CodeceptJS to create main config file: `codecept.conf.js`.

```
npx codeceptjs init
```

Answer questions, agree on defaults, when asked to select helpers choose **Playwright**.

```
? What helpers do you want to use?
❯◉ Playwright
 ◯ WebDriver
 ◯ Protractor
 ◯ Puppeteer
 ◯ Appium
 ◯ Nightmare
 ◯ FileSystem
 ```

Create first feature and test when asked.
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
npm run codeceptjs
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

