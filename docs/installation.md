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

### Local

CodeceptJS can also be installed locally

```
npm install --save-dev codeceptjs
```

and started as

```
./node_modules/.bin/codeceptjs
```

## Meta Packages

By default it doesn't install any backends like Webdriverio, Protracor, or Nightmare, so you need to install corresponding packages manually, or install one of the provided meta-packages:

* `codeceptjs-webdriverio` - installs CodeceptJS + WebDriverIO
* `codeceptjs-protractor` - installs CodeceptJS + Protractor
* `codeceptjs-nightmare` - installs CodeceptJS + Nightmare

They can be installed either globally or locally

## Additional Tools

WebDriver based helpers like WebDriverIO, Protractor, Selenium WebDriver will require [Selenium Server](http://codecept.io/helpers/WebDriverIO/#selenium-installation) or [PhantomJS](http://codecept.io/helpers/WebDriverIO/#phantomjs-installation) installed. They will also require ChromeDriver or GeckoDriver to run corresponding browsers.

We recommend to install them manually or use 3rd-party NPM packages:

* `webdriver-manager`: to install and execute Selenium server
* `chromedriver`: to install ChromeDriver (add `require('chromedriver')` to bootstrap file)
* `geckodriver`: to install GeckoDriver for Firefox browser (add `require('geckodriver')` to bootstrap file)
* `phantomjs-prebuilt`: to install and execute Phantomjs

or use [Docker](https://github.com/SeleniumHQ/docker-selenium) for headless browser testing.

Launch Selenium with Chrome browser inside a Docker container:

```
docker run -d -p 4444:4444 selenium/standalone-chrome
```