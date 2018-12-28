# Installation

## Global Installation

CodeceptJS can be installed together with a suitable driver via NPM globally:

```sh
[sudo] npm install -g codeceptjs webdriverio
# or
[sudo] npm install -g codeceptjs protractor
# or
[sudo] npm install -g codeceptjs puppeteer
# or
[sudo] npm install -g codeceptjs nightmare
```

then it can be started anywhere using

```sh
codeceptjs
```

Global installations are easier to use on the command-line, but are not registered in the `package.json` manifest for your project, so they won't be automatically installed for others who download your source code. It also means you need to install these tools on the CI/Build servers before you can run the tests there.

## Local Installation

Use NPM install CodeceptJS:

```sh
npm install --save-dev codeceptjs
```

```sh
npm install --save-dev codeceptjs webdriver
# or
npm install --save-dev codeceptjs protractor
# or
npm install --save-dev codeceptjs puppeteer
# or
npm install --save-dev codeceptjs nightmare
```

and started as

```sh
./node_modules/.bin/codeceptjs
```

## WebDriver

WebDriver based helpers like WebDriver, Protractor, Selenium WebDriver will require [Selenium Server](http://codecept.io/helpers/WebDriver/#selenium-installation) or [PhantomJS](http://codecept.io/helpers/WebDriver/#phantomjs-installation) installed. They will also require ChromeDriver or GeckoDriver to run corresponding browsers.

We recommend to install them manually or use NPM packages:

* [Selenium Standalone](https://www.npmjs.com/package/selenium-standalone) to install and run Selenium, ChromeDriver, Firefox Driver with one package.
   ```sh
   npm install selenium-standalone --save-dev
   ```
   Selenium is [Java](https://www.java.com/en/download/) based, so you may need to install or update that first.

* [Phantomjs](https://www.npmjs.com/package/phantomjs-prebuilt): to install and execute Phantomjs

or use [Docker with Selenium](https://github.com/SeleniumHQ/docker-selenium) for headless browser testing in a container.

Launch Selenium with Chrome browser inside a Docker container:

```sh
docker run --net=host selenium/standalone-chrome
```

