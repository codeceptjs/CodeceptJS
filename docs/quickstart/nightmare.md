# Nightmare Quickstart

[NightmareJS](http://www.nightmarejs.org) is a modern Electron based testing framework which allows to execute tests in headless mode as well as in window mode for debug purposes.
Nightmare is in active development and has nice API for writing acceptance tests.
Unfortunately, as all other JavaScript testing frameworks it has its own very custom API.
What if you choose it for a project and suddenly you realize that you need something more powerful, like Selenium?
Yes, that might be a problem if you are not using CodeceptJS.
The one idea behind CodeceptJS is to unify different testing backends under one API, so you could easily write tests the same way no matter what engines you use: webdriverio, Protractor, or Nightmare.

## Install Codecept and Nightmare

To start you need CodeceptJS and Nightmare installed.

```bash
npm install -g codeceptjs nightmare
```

## Setup a test

And a basic Codecept test project initialized

```sh
codeceptjs init
```

You will be asked for a Helper to use, you should select Nightmare and provide the url of a website you are testing.
We will test `https://github.com`

Answer the questions. Agree on defaults, when asked to select helpers choose **Nightmare**.

```sh
? What helpers do you want to use?
 ◯ WebDriver
 ◯ Protractor
 ◯ Puppeteer
 ◯ Appium
❯◉ Nightmare
 ◯ FileSystem
```

Create First Test. The `gt` command *Generates a Test* file for us. and adds it to the Codecept configuration file.

```bash
./node_modules/.bin/codeceptjs gt
```

Enter a test name. Open a generated file in your favorite JavaScript editor.

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

## Run the test

```
./node_modules/.bin/codeceptjs run --steps
```

The output should be similar to this:

```bash
My First Test --
  test something
   • I am on page "https://github.com"
   • I see "GitHub"
 ✓ OK
```


## Configuring Nightmare

Enable `Nightmare` helper in `codecept.json` config:

```js
{ // ..
  "helpers": {
    "Nightmare": {
      "url": "http://localhost",
      "show": false,
      "restart": false
    }
  }
  // ..
}
```

Turn on the `show` option if you want to follow test progress in a window. This is very useful for debugging.
All other options can be taken from [NightmareJS API](https://github.com/segmentio/nightmare#api).

Turn off the `restart` option if you want to run your suite in a single browser instance.

Option `waitForAction` defines how long to wait after a click, doubleClick or pressKey action is performed.
Test execution may happen much faster than the response is rendered, so make sure you set a proper delay value.
By default CodeceptJS waits for 500ms.


## Additional Links

* [Nightmare Tutorial](http://codenroll.it/acceptance-testing-with-codecept-js/) by jploskonka.

