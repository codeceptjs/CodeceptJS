# QuickStart

**NodeJS v 8.9** and higher required to start.
CodeceptJS is multi-backend testing framework. It can execute tests using different libraries like webdriverio, Puppeteer, Protractor, etc.

* In this guide we will use [Google Chrome **Puppeteer**](https://github.com/GoogleChrome/puppeteer) as a driver for browsers. This allows us to start in a minutes with no extra tools installed.
* If you are familiar with Selenium, you can choose classical [**Selenium WebDriver** setup](#using-selenium-webdriver).
* Also, look at [complete installation reference](https://codecept.io/installation/).


## Using Puppeteer


<video onclick="this.paused ? this.play() : this.pause();" src="/images/codeceptjs-install.mp4" style="width: 100%" controls></video>


1) Install CodeceptJS with Puppeteer

```
npm install codeceptjs puppeteer --save-dev
```

(due to [this issue in Puppeteer](https://github.com/GoogleChrome/puppeteer/issues/375), we install it locally)


2) Initialize CodeceptJS in current directory by running:

```sh
./node_modules/.bin/codeceptjs init
```

(use `node node_modules/.bin/codeceptjs` on Windows)

3) Answer questions. Agree on defaults, when asked to select helpers choose **Puppeteer**.

```sh
? What helpers do you want to use?
 ◯ WebDriverIO
 ◯ Protractor
❯◉ Puppeteer
 ◯ Appium
 ◯ Nightmare
 ◯ FileSystem
```

4) Create First Test.

```bash
./node_modules/.bin/codeceptjs gt
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
./node_modules/.bin/codeceptjs run --steps
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

---

### Next: [CodeceptJS with Puppeteer >>>](https://codecept.io/puppeteer/)
### Next: [CodeceptJS Basics >>>](https://codecept.io/basics/)

---

## Using Selenium WebDriver

1) Install CodeceptJS with webdriverio library

```
[sudo] npm install -g codeceptjs webdriverio
```

2) Initialize CodeceptJS in current directory by running:

```sh
codeceptjs init
```

3) Answer questions. Agree on defaults, when asked to select helpers choose **WebDriverIO**.

```sh
? What helpers do you want to use?
❯◉ WebDriverIO
 ◯ Protractor
 ◯ Puppeteer
 ◯ Appium
 ◯ Nightmare
 ◯ FileSystem
```

4) Create First Test.

```bash
codeceptjs gt
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

To execute tests in Google Chrome browser running Selenium Server with ChromeDriver is required.

Use [selenium-standalone](https://www.npmjs.com/package/selenium-standalone) from NPM to install and run them:

```sh
[sudo] npm install -g selenium-standalone
selenium-standalone install
selenium-standalone start
```


8) Run a test:

```
codeceptjs run --steps
```

If everything is done right, you will see in console:

```bash
My First Test --
  test something
   • I am on page "https://github.com"
   • I see "GitHub"
 ✓ OK
```

---

### Next: [CodeceptJS Basics >>>](https://codecept.io/basics/)
### Next: [Acceptance Testing in CodeceptJS >>>](https://codecept.io/puppeteer/)

---

## Using Protractor

[**Follow corresponding guide >>**](https://codecept.io/angular/)

## Using Appium

[**Follow corresponding guide >>**](https://codecept.io/mobile/)

## Using NightmareJS

[**Follow corresponding guide >>**](https://codecept.io/nightmare/)
