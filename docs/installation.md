---
permalink: /installation
title: Installation
---

# Installation

## QuickStart Via Installer

Creating a new project via [`create-codeceptjs` installer](https://github.com/codeceptjs/create-codeceptjs) is the simplest way to start

Install CodeceptJS + Playwright into current directory

```
npx create-codeceptjs .
```

Install CodeceptJS + Puppeteer into current directory

```
npx create-codeceptjs . --puppeteer
```

Install CodeceptJS + webdriverio into current directory

```
npx create-codeceptjs . --webdriverio
```

Install CodeceptJS + webdriverio into `e2e-tests` directory:

```
npx create-codeceptjs e2e-tests --webdriverio
```

If you plan to use CodeceptJS for **API testing** only proceed to standard installation

## Standard Installation

Open a directory where you want to install CodeceptJS tests.
If it is an empty directory - create a new NPM package with 

```
npm init -y
```

Install CodeceptJS with NPM:

```sh
npx codeceptjs init
```

After choosing default helper (Playwright, Puppeteer, WebDriver, etc) a corresponding package should be installed automatically. 

> If you face issues installing additional packages while running `npx codeceptjs init` command, install required packages manually using npm

Unless you are using WebDriver - CodeceptJS is ready to go!
For WebDriver installation Selenium Server is required 👇 

## WebDriver

WebDriver based helpers like WebDriver will require [Selenium Server](https://codecept.io/helpers/WebDriver/#selenium-installation) installed. They will also require ChromeDriver or GeckoDriver to run corresponding browsers.

We recommend to install them manually or use NPM packages:

[Selenium Standalone](https://www.npmjs.com/package/selenium-standalone) to install and run Selenium, ChromeDriver, Firefox Driver with one package.


Alternatively, you can execute headless Selenium in [Docker](https://github.com/SeleniumHQ/docker-selenium) for headless browser testing.

Launch Selenium with Chrome browser inside a Docker container:

```sh
docker run --net=host selenium/standalone-chrome
```
