# Installation

### Global

CodeceptJS can be installed via NPM globally

```
[sudo] npm install -g codeceptjs
```

then it can be started as

```
codeceptjs
```

To use it with WebDriverIO install webdriverio package globally:

```
[sudo] npm install -g webdriverio
```

To use it with Protractor install protractor package globally:

```
[sudo] npm install -g protractor
```

To use it with Nightmare install nightmare and nightmare-upload packages globally:

```
[sudo] npm install -g nightmare nightmare-upload
```


### Local

CodeceptJS can also be installed locally

```
npm install --save-dev codeceptjs
```

and started as

```
./node_modules/.bin/codeceptjs
```

To use it with WebDriverIO install webdriverio package:

```
npm install webdriverio --save-dev
```

To use it with Protractor install protractor package:

```
npm install protractor --save-dev
```

To use it with Nightmare install nightmare and nightmare-upload packages:

```
npm install nightmare nightmare-upload --save-dev
```


## Meta Packages

By default it doesn't install any backends like Webdriverio, Protracor, or Nightmare, so you need to install corresponding packages manually, or install one of the provided meta-packages:

* [codecept-webdriverio](https://www.npmjs.com/package/codecept-webdriverio) - installs CodeceptJS + WebDriverIO
* [codecept-protractor](https://www.npmjs.com/package/codecept-protractor) - installs CodeceptJS + Protractor
* [codecept-nightmare](https://www.npmjs.com/package/codecept-nightmare) - installs CodeceptJS + Nightmare

They can be installed either globally or locally

## WebDriver

WebDriver based helpers like WebDriverIO, Protractor, Selenium WebDriver will require [Selenium Server](http://codecept.io/helpers/WebDriverIO/#selenium-installation) or [PhantomJS](http://codecept.io/helpers/WebDriverIO/#phantomjs-installation) installed. They will also require ChromeDriver or GeckoDriver to run corresponding browsers.

We recommend to install them manually or use NPM packages:

* [Selenium Standalone](https://www.npmjs.com/package/selenium-standalone) to install and run Selenium, ChromeDriver, Firefox Driver with one package.
* [Phantomjs](https://www.npmjs.com/package/phantomjs-prebuilt): to install and execute Phantomjs

or use [Docker](https://github.com/SeleniumHQ/docker-selenium) for headless browser testing.

Launch Selenium with Chrome browser inside a Docker container:

```
docker run --net=host selenium/standalone-chrome
```