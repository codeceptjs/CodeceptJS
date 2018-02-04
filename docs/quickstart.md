# QuickStart

**NodeJS v 8.9** and higher required to start.
CodeceptJS is multi-backend testing framework. In this guide we will use webdriverio as backend but the same rules applies to other backends like Protractor or Nightmare.

### Install Globally:

```sh
[sudo] npm install -g codeceptjs
```
Execute codeceptjs as:

```
codeceptjs
```

### Install Locally

```sh
npm install codeceptjs --save-dev
```

Execute codeceptjs as:

```
./node_modules/.bin/codeceptjs
```

## Setup

Initialize CodeceptJS running:

```sh
codeceptjs init
```

It will create `codecept.json` config in current directory (or provide path in the first argument).

You will be asked for tests location (they will be searched in current dir by default).

On next step you are asked to select **Helpers**. Helpers include actions which can be used in tests.
We recommend to start with **WebDriverIO** helper in order to write acceptance tests using webdriverio library and Selenium Server as test runner.

If you want to test AngularJS application, use Protractor helper, or if you are more familiar with official Selenium Webdriver JS library, choose it.
No matter what helper you've chosen they will be similar in use.

```sh
? What helpers do you want to use?
❯◉ WebDriverIO
 ◯ Protractor
 ◯ Puppeteer
 ◯ Appium
 ◯ Nightmare
 ◯ FileSystem
```

Then you will be asked for an output directory. Logs, reports, and failure screenshots will be placed there.

```sh
? Where should logs, screenshots, and reports to be stored? ./output
```

If you are going to extend test suite by writing custom steps you should probably agree to create `steps_file.js`

```sh
? Would you like to extend I object with custom steps? Yes
? Where would you like to place custom steps? ./steps_file.js
```

WebDriverIO helper will ask for additional configuration as well:

```sh
? [WebDriverIO] Base url of site to be tested http://localhost
? [WebDriverIO] Browser in which testing will be performed (chrome)
```

If you agree with defaults, finish the installation.

## Installing Backends

To run CodeceptJS you will need to install a corresponding backend for the helepr you've choosen. `WebDriverIO` helper requires `webdriverio` package to be installed. The init command will notify you what libraries are missing so you could install it:

* Global installation

```
Please install dependent packages globally: npm -g install  webdriverio@^4.0.0
```

* Local installation

```
Please install dependent packages locally: npm install --save-dev webdriverio@^4.0.0
```

Please follow this steps and install required package.

## Creating First Test

Tests can be easily created by running

```bash
codeceptjs gt
```

*(or `generate test`)*

Provide a test name and open generated file in your favorite JavaScript editor (with ES6 support).

```js
Feature('My First Test');

Scenario('test something', (I) => {

});
```

Inside the scenario block you can write your first test scenario by using [actions from WebDriverIO helper](http://codecept.io/helpers/WebDriverIO/). Let's assume we have a web server on `localhost` is running and there is a **Welcome** text on the first page. The simplest test will look like this:

```js
Feature('My First Test');

Scenario('test something', (I) => {
  I.amOnPage('/');
  I.see('Welcome');
});
```

## Prepare Selenium Server

To execute tests in Google Chrome browser running Selenium Server with ChromeDriver is required.

Use [selenium-standalone](https://www.npmjs.com/package/selenium-standalone) from NPM to install and run them:

```sh
[sudo] npm install -g selenium-standalone
selenium-standalone install
selenium-standalone start
```

Alternatively [Selenium Server](http://codecept.io/helpers/WebDriverIO/#selenium-installation) with [ChromeDriver](https://sites.google.com/a/chromium.org/chromedriver/getting-started) can be installed and started manually.

## Run

Execute tests:

```bash
codeceptjs run --steps
```

( *steps option will display test execution process in console.* )

If everything is done right, you will see in console:

```bash
My First Test --
  test something
   • I am on page "/"
   • I see "Welcome"
 ✓ OK
```

## Congrats! Your first test is running

Wasn't so hard, right?
