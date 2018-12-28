# Quickstart with Selenium WebDriver

Selenium is the original browser-driver, and it provides a standard interface to many different browsers. It is popular for cross-browser testing, and for testing via cloud-based services like SauceLabs.

## Install CodeceptJS and Selenium Server

Install CodeceptJS with webdriverio library globally.

```
[sudo] npm install -g codeceptjs webdriverio
```

## Install Selenium Server. 

To execute tests in Google Chrome browser running Selenium Server with ChromeDriver is required.

Use [selenium-standalone](https://www.npmjs.com/package/selenium-standalone) from NPM to install and run them, then install and start the Selenium server.
The Selenium server listens for commands from Codecept, and controls the browser for us.

```sh
[sudo] npm install -g selenium-standalone
selenium-standalone install
```

## Setup a test

Initialize CodeceptJS in current directory by running:

```sh
codeceptjs init
```

Answer questions. Agree on defaults, when asked to select helpers choose **WebDriver**.
We will test `https://github.com` so enter that when asked for a URL

```sh
  Welcome to CodeceptJS initialization tool
  It will prepare and configure a test environment for you

Installing 
? Where are your tests located? ./*_test.js

? What helpers do you want to use?
❯◉ WebDriver
 ◯ Protractor
 ◯ Puppeteer
 ◯ Appium
 ◯ Nightmare
 ◯ FileSystem

? What helpers do you want to use? WebDriver
? Where should logs, screenshots, and reports to be stored? ./output
? Would you like to extend I object with custom steps? Yes
? Do you want to choose localization for tests? English (no localization)
? Where would you like to place custom steps? ./steps_file.js
Configure helpers...
? [WebDriver] Base url of site to be tested https://github.com
? [WebDriver] Browser in which testing will be performed chrome
```

The `codecept.json` configuration file stores our choices. It looks like this:

```json
{
  "tests": "./*_test.js",
  "output": "./output",
  "helpers": {
    "WebDriver": {
      "url": "https://github.com",
      "browser": "chrome"
    }
  },
  "include": {
    "I": "./steps_file.js"
  },
  "name": "dirname"
}
```

## Create First Test

The `gt` command *Generates a Test* file for us. and adds it to the Codecept configuration file.

```bash
codeceptjs gt

Creating a new test...
----------------------
? Filename of a test              First
? Feature which is being tested   My First Test
Test for First was created in ./First_test.js
```

Enter a test name. Open the generated file in your favorite JavaScript editor.

```js
Feature('My First Test');

Scenario('test something', (I) => {

});
```

Write a simple scenario

```js
Feature('My First Test');

Scenario('test something', (I) => {
  I.amOnPage('https://github.com');
  I.see('GitHub');
});
```

## Start Selenium

Before we can run the tests, we need to make sure that the Selenium server is running.

```sh
selenium-standalone start
```

The selenium server should start up, and be ready to accept commands.

## Run tests

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

You should also see commands fly past on the selenium server log.

```
00:12:44.758 INFO [GridLauncherV3.parse] - Selenium server version: 3.141.0, revision: 2ecb7d9a
00:12:44.890 INFO [GridLauncherV3.lambda$buildLaunchers$3] - Launching a standalone Selenium Server on port 4444
00:12:45.843 INFO [SeleniumServer.boot] - Selenium Server is up and running on port 4444
Selenium started
00:13:41.097 INFO [ActiveSessionFactory.apply] - Capabilities are: {
  "browserName": "chrome"
}
00:13:41.100 INFO [ActiveSessionFactory.lambda$apply$11] - Matched factory org.openqa.selenium.grid.session.remote.ServicedSession$Factory (provider: org.openqa.selenium.chrome.ChromeDriverService)
Starting ChromeDriver 2.43.600210 (68dcf5eebde37173d4027fa8635e332711d2874a) on port 48064
Only local connections are allowed.
00:13:45.642 INFO [ProtocolHandshake.createSession] - Detected dialect: OSS
00:13:46.097 INFO [RemoteSession$Factory.lambda$performHandshake$0] - Started new session b49e851599110caac64391de22a1183a (org.openqa.selenium.chrome.ChromeDriverService)
00:13:50.870 INFO [ActiveSessions$1.onStop] - Removing session b49e851599110caac64391de22a1183a (org.openqa.selenium.chrome.ChromeDriverService)
```

---

### Next: [CodeceptJS Basics >>>](../basics.md)

---
