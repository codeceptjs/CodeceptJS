---
id: installation
title: Installation
---

## Local

Use NPM install CodeceptJS:

```sh
npm install --save-dev codeceptjs
```

and started as

```sh
./node_modules/.bin/codeceptjs
```

To use it with WebDriver install webdriverio package:

```sh
npm install webdriverio --save-dev
```

To use it with Protractor install protractor package:

```sh
npm install protractor --save-dev
```

To use it with Nightmare install nightmare and nightmare-upload packages:

```sh
npm install nightmare --save-dev
```

To use it with Puppeteer install puppeteer package:

```sh
npm install puppeteer --save-dev
```

## WebDriver

WebDriver based helpers like WebDriver, Protractor, Selenium WebDriver will require [Selenium Server](http://codecept.io/helpers/WebDriver/#selenium-installation) or [PhantomJS](http://codecept.io/helpers/WebDriver/#phantomjs-installation) installed. They will also require ChromeDriver or GeckoDriver to run corresponding browsers.

We recommend to install them manually or use NPM packages:

* [Selenium Standalone](https://www.npmjs.com/package/selenium-standalone) to install and run Selenium, ChromeDriver, Firefox Driver with one package.
* [Phantomjs](https://www.npmjs.com/package/phantomjs-prebuilt): to install and execute Phantomjs

or use [Docker](https://github.com/SeleniumHQ/docker-selenium) for headless browser testing.

Launch Selenium with Chrome browser inside a Docker container:

```sh
docker run --net=host selenium/standalone-chrome
```

## Global

CodeceptJS can be installed via NPM globally:

```sh
[sudo] npm install -g codeceptjs webdriverio
# or
[sudo] npm install -g codeceptjs protractor
# or
[sudo] npm install -g codeceptjs puppeteer
# or
[sudo] npm install -g codeceptjs nightmare
```

then it can be started as

```sh
codeceptjs
```
