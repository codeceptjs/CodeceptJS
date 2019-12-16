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

<small>

WebDriver support is implemented via [webdriverio](https://webdriver.io) library

</small>

---

#### Use TestCafe for cross-browser testing without Selenium

<small>
TestCafe provides cross-browser support without Selenium. TestCafe tests are faster, require no extra tooling and faster than regular Selenium. However, can be less stable.
</small>

<a href="/testcafe" class="button green extended" >Start with TestCafe &raquo;</a>

---

* [Mobile Testing with Appium »](/mobile)
* [Testing with Protractor »](/angular)
* [Testing with NigthmareJS »](/nightmare)

:::

# Quickstart

> Puppeteer is a great way to start if you need fast end 2 end tests in Chrome browser. No Selenium required!

If you need cross-browser support check alternative installations with WebDriver or TestCafe &rarr;

<video onclick="this.paused ? this.play() : this.pause();" src="/img/install.mp4" style="width: 100%" controls></video>

If you start with empty project initialize npm first:

```
npm init -y
```

1) Install CodeceptJS with Puppeteer

```
npm install codeceptjs puppeteer --save-dev
```


2) Initialize CodeceptJS in current directory by running:

```
npx codeceptjs init
```

(use `node node_modules/.bin/codeceptjs` if you have issues with npx)

3) Answer questions. Agree on defaults, when asked to select helpers choose **Puppeteer**.

```
? What helpers do you want to use?
 ◯ WebDriver
 ◯ Protractor
❯◉ Puppeteer
 ◯ Appium
 ◯ Nightmare
 ◯ FileSystem
 ```

4) Create First Test.

```
npx codeceptjs gt
```

5) Enter a test name. Open a generated file in your favorite JavaScript editor.

```js
Feature('My First Test');

Scenario('test something', (I) => {

});
```

6) Write a simple scenario

```js
Feature('My First Test');

Scenario('test something', (I) => {
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

> [▶ Next: CodeceptJS with Puppeteer](/puppeteer/)

