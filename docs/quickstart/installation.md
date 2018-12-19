# Installation


## [Installation](https://www.youtube.com/watch?v=FPFG1rBNJ64)

<iframe width="854" height="480" src="https://www.youtube.com/embed/FPFG1rBNJ64" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

Video provided by our community member **[@ontytoom](http://github.com/ontytoom)**.


## Local Installation

CodeceptJS can be installed via NPM, together with a suitable driver to connect to the browser:

```sh
npm install --save-dev codeceptjs webdriverio
# or
npm install --save-dev codeceptjs protractor
# or
npm install --save-dev codeceptjs puppeteer
# or
npm install --save-dev codeceptjs nightmare
```

then it can be started as

```sh
./node_modules/.bin/codeceptjs
```

Local installations are easier to reproduce on other machines. This is useful on CI/Build servers that should install all the needed tools automatically.

## WebDriver

WebDriver based helpers like WebDriverIO, Protractor, Selenium WebDriver will require [Selenium Server](http://codecept.io/helpers/WebDriverIO/#selenium-installation) or [PhantomJS](http://codecept.io/helpers/WebDriverIO/#phantomjs-installation) installed. They will also require ChromeDriver or GeckoDriver to run corresponding browsers.

We recommend to install them using an NPM package:

[Selenium Standalone](https://www.npmjs.com/package/selenium-standalone) will install and run Selenium, ChromeDriver, Firefox Driver with one package.

```sh
npm install --save-dev codeceptjs webdriverio
[sudo] npm install -g selenium-standalone
selenium-standalone install
selenium-standalone start
```

This installs Selenium globally, which makes the `selenium-standalone` command available in the PATH.

Note that Selenium is [Java](https://www.java.com/en/download/) based, so you may need to install or update that first.
