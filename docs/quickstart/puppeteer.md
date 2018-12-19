# Puppeteer Quickstart


## Install CodeceptJS with Puppeteer

```sh
npm install codeceptjs puppeteer --save-dev

> puppeteer@1.10.0 install C:\\Temp\\c1\\node_modules\\puppeteer
> node install.js

Downloading Chromium r599821 - 135.9 Mb [====================] 98% 
```

(due to [this issue in Puppeteer](https://github.com/GoogleChrome/puppeteer/issues/375), we install it locally)

The Puppeteer package includes a full chromium browser that runs independent of your standard Chrome browser. This means your normal browser has no effect on your test runs, which is good. Your tests should be isolated from the local environment.

## Define test project 

Initialize CodeceptJS in current directory by running:

```sh
./node_modules/.bin/codeceptjs init
```

(use `node node_modules/.bin/codeceptjs` on Windows)

Answer questions. Agree on defaults, when asked to select helpers choose **Puppeteer**.
We will test `https://github.com` so enter that when asked for a URL

```sh

  Welcome to CodeceptJS initialization tool
  It will prepare and configure a test environment for you

Installing 
? Where are your tests located? ./*_test.js

? What helpers do you want to use?
 ◯ WebDriverIO
 ◯ Protractor
❯◉ Puppeteer
 ◯ Appium
 ◯ Nightmare
 ◯ FileSystem

? What helpers do you want to use? Puppeteer
? Where should logs, screenshots, and reports to be stored? ./output
? Would you like to extend I object with custom steps? Yes
? Do you want to choose localization for tests? English (no localization)
? Where would you like to place custom steps? ./steps_file.js
Configure helpers...
? [Puppeteer] Base url of site to be tested https://github.com
Steps file created at ./steps_file.js
Config created at ./codecept.json
Directory for temporary output files created at `_output`
```

The `codecept.json` configuration file stores our choices. It looks like this:

```json
{
  "tests": "./*_test.js",
  "timeout": 10000,
  "output": "./output",
  "helpers": {
    "Puppeteer": {
      "url": "https://github.com"
    }
  },
  "include": {
    "I": "./steps_file.js"
  },
  "bootstrap": false,
  "mocha": {},
  "name": "dirname"
}
```

## Create First Test

Use the command GT (for *Generate Test*) to create our first test:

```bash
./node_modules/.bin/codeceptjs gt

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
  I.amOnPage('/');
  I.see('GitHub');
  I.dontSee('Microsoft');
});
```

First we need to go to a page; we use `amOnPage` command for that. As we already specified full URL to TodoMVC app,
we can pass relative path into it instead of absolute url.

In CodeceptJS assertion commands have `see` or `dontSee` prefix.

## Run test

```
./node_modules/.bin/codeceptjs run --steps
```
The `--steps` flag tells Codecept to list out the steps as they are completed. 
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
      "url": "https://github.com",
      "show": true
    }
  }
}
```

Rerun the test to see the browser performing the test actions.

---

### Next: [CodeceptJS Basics >>>](../basics.md)

### Next: [Demo Project](https://github.com/DavertMik/codeceptjs-todomvc-puppeteer)
