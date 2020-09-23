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

> CodeceptJS supports various engines for running browser tests. By default we recommend using **Playwright** which is cross-browser and performant solution.


Use [CodeceptJS all-in-one installer](https://github.com/codeceptjs/create-codeceptjs) to get CodeceptJS, a demo project, and Playwright.

```
npx create-codeceptjs 
```

> To install codeceptjs into a different folder, like `tests` use `npx create-codeceptjs tests`

After CodeceptJS is installed, try running demo tests using this commands:

* `npm run codeceptjs:demo` - executes demo tests in window mode
* `npm run codeceptjs:demo:headless` - executes demo tests in headless mode
* `npm run codeceptjs:demo:ui` - open CodeceptJS app to list and run demo tests. 

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

Create first feature and suite when asked.

4) Enter a test name. Open a generated file in your favorite JavaScript editor.

```js
Feature('My First Test');

Scenario('test something', ({ I }) => {

});
```

5) Write a simple scenario

```js
Feature('My First Test');

Scenario('test something', ({ I }) => {
  I.amOnPage('https://github.com');
  I.see('GitHub');
});
```

7) Run a test:

```
npx codeceptjs run --steps
```

The output should be similar to this:

```bash
My First Test --
  test something
     I am on page "https://github.com"
     I see "GitHub"
 ✓ OK
 ```

> [▶ Next: CodeceptJS Basics](/basics/)

> [▶ Next: CodeceptJS with Playwright](/playwright/)

