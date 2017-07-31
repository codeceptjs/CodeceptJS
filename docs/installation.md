# Installation

## Global

CodeceptJS can be installed via NPM globally

```sh
[sudo] npm install -g codeceptjs
```

then it can be started as

```sh
codeceptjs
```

To use it with WebDriverIO install webdriverio package globally:

```sh
[sudo] npm install -g webdriverio
```

To use it with Protractor install protractor package globally:

```sh
[sudo] npm install -g protractor
```

To use it with Nightmare install nightmare and nightmare-upload packages globally:

```sh
[sudo] npm install -g nightmare nightmare-upload
```

### Local

CodeceptJS can also be installed locally

```sh
npm install --save-dev codeceptjs
```

and started as

```sh
./node_modules/.bin/codeceptjs
```

To use it with WebDriverIO install webdriverio package:

```sh
npm install webdriverio --save-dev
```

To use it with Protractor install protractor package:

```sh
npm install protractor --save-dev
```

To use it with Nightmare install nightmare and nightmare-upload packages:

```sh
npm install nightmare nightmare-upload --save-dev
```

## Meta Packages

By default it doesn't install any backends like Webdriverio, Protractor, or Nightmare, so you need to install corresponding packages manually, or install one of the provided meta-packages:

* [codeceptjs-webdriverio](https://www.npmjs.com/package/codeceptjs-webdriverio) - installs CodeceptJS + WebDriverIO
* [codeceptjs-protractor](https://www.npmjs.com/package/codeceptjs-protractor) - installs CodeceptJS + Protractor
* [codeceptjs-nightmare](https://www.npmjs.com/package/codeceptjs-nightmare) - installs CodeceptJS + Nightmare

They can be installed either globally or locally

## WebDriver

WebDriver based helpers like WebDriverIO, Protractor, Selenium WebDriver will require [Selenium Server](http://codecept.io/helpers/WebDriverIO/#selenium-installation) or [PhantomJS](http://codecept.io/helpers/WebDriverIO/#phantomjs-installation) installed. They will also require ChromeDriver or GeckoDriver to run corresponding browsers.

We recommend to install them manually or use NPM packages:

* [Selenium Standalone](https://www.npmjs.com/package/selenium-standalone) to install and run Selenium, ChromeDriver, Firefox Driver with one package.
* [Phantomjs](https://www.npmjs.com/package/phantomjs-prebuilt): to install and execute Phantomjs

or use [Docker](https://github.com/SeleniumHQ/docker-selenium) for headless browser testing.

Launch Selenium with Chrome browser inside a Docker container:

```sh
docker run --net=host selenium/standalone-chrome
```