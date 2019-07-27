---
id: quickstart
title: Quickstart
---

**NodeJS v 8.9** and higher required to start.
CodeceptJS is an end 2 end testing framework which supports multiple browser drivers like WebDriver, Puppeteer, Protractor, TestCafe etc.

> **⬇️ TLDR [Fastest and simplest setup with Puppeteer and CodeceptJS](#using-puppeteer) ⬇️**

How to choose the right driver for your web application?
Here is a brief comparison of all tools you can use with CodeceptJS.


| Driver  | Cross-Browser | Limitations | Headless | Selenuim | Speed |
|---|---|---|--|--|--|
| WebDriver  | ✔️ | headers, downloads | ⁉ | ✔️ | normal |
| Puppeteer  | chrome | cross-browser support | ✔️ | | fast |
| Protractor | ✔️ | headers, downloads | ⁉ | ✔️ | normal |
| TestCafe | ✔️  | multiple tabs | ✔️ | | fast |
| Nightmare | electron (chromium) | multiple tabs, cross-browser  | ✔️ | | fast |

⁉ - headless mode requires additional tools and configuration.

#### How to choose browser driver

* **[Choose Puppeteer](#Using-Puppeteer)** for simplest setup, fast tests, full browser control. Limited to Chrome and Firefox only. Cloud browsers via browserless.io.
* **[Choose WebDriver](#Using-WebDriver)** or Protractor for classical Selenium. Rich ecosystem and cross browser support with cloud browsers via Sauce Labs, BrowserStack, TestingBot. **Selenium server requried** for local start.
* **[Choose TestCafe](#Using-TestCafe)** for cheap and fast cross-browser tests. Has stability and feature limitation comparing to WebDriver.

Each driver has its own pros and cons which can't be described in this paragraph. However, in CodeceptJS it is easy to switch between them. In most cases you just need to update a config to run tests differently.

## Using Puppeteer


<video onclick="this.paused ? this.play() : this.pause();" src="/img/codeceptjs-install.mp4" style="width: 100%" controls></video>

0) If you start an empty project, initialize npm first:

```
npm init -y
```

1) Install CodeceptJS with Puppeteer

```
npm install codeceptjs puppeteer --save-dev
```


2) Initialize CodeceptJS in current directory by running:

```sh
npx codeceptjs init
```

(use `node node_modules/.bin/codeceptjs` if you have issues with npx)

3) Answer questions. Agree on defaults, when asked to select helpers choose **Puppeteer**.

```sh
? What helpers do you want to use?
 ◯ WebDriver
 ◯ Protractor
❯◉ Puppeteer
 ◯ Appium
 ◯ Nightmare
 ◯ FileSystem
```

4) Create First Test.

```bash
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
   • I am on page "https://github.com"
   • I see "GitHub"
 ✓ OK
```

Puppeteer starts a browser without showing its window. To see the browser, edit `codecept.json` config and set `show: true` for Puppeteer:

```js
{
  "helpers": {
    "Puppeteer": {
      "url": "http://localhost",
      "show": true,
    }
  }
}
```

Rerun the test to see the browser.

> [▶ Next: CodeceptJS Basics](https://codecept.io/basics/)

> [▶ Next: CodeceptJS with Puppeteer](https://codecept.io/puppeteer/)




---

## Using Selenium WebDriver

0) If you start an empty project, initialize npm first:

```
npm init -y
```


1) Install CodeceptJS with webdriverio library

```
npm install codeceptjs webdriverio --save-dev
```

2) Initialize CodeceptJS in current directory by running:

```sh
npx codeceptjs init
```

(use `node node_modules/.bin/codeceptjs init` if you have issues with npx)

3) Answer questions. Agree on defaults, when asked to select helpers choose **WebDriver**.

```sh
? What helpers do you want to use?
❯◉ WebDriver
 ◯ Protractor
 ◯ Puppeteer
 ◯ Appium
 ◯ Nightmare
 ◯ FileSystem
```

4) Create First Test.

```bash
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

7) Prepare Selenium Server

Install `@wdio/selenium-standalone-service` package to automatically start and stop selenium service.

```
npm i @wdio/selenium-standalone-service --save
```

Enable it in config inside plugins section:

```js
exports.config = {
  // ...
  // inside condecept.conf.js
  plugins: {
    wdio: {
      enabled: true,
      services: ['selenium-standalone']
    }
  }
}
```

> Alternatively, use [selenium-standalone](https://www.npmjs.com/package/selenium-standalone) to install, start and stop Selenium Server manually.


8) Run a test:

```
npx codeceptjs run --steps
```

If everything is done right, you will see in console:

```bash
My First Test --
  test something
   • I am on page "https://github.com"
   • I see "GitHub"
 ✓ OK
```


> [▶ Next: CodeceptJS Basics](https://codecept.io/basics/)

> [▶ Next: WebDriver Testing](https://codecept.io/webdriver/)


## Using Protractor

> [▶ Follow corresponding guide](https://codecept.io/angular/)

## Using Appium

> [▶ Follow corresponding guide](https://codecept.io/mobile/)

## Using NightmareJS

> [▶ Follow corresponding guide](https://codecept.io/nightmare/)

## Using TestCafe

> [▶ Follow corresponding guide](https://codecept.io/testcafe/)
