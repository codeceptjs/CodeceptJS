# QuickStart

**NodeJS v 4.2.0** and higher required to start.
Install **CodeceptJS** with NPM:

<<<<<<< HEAD
```bash
npm install -g codeceptjs
=======
You can install it globally:

```
[sudo] npm install -g codeceptjs
>>>>>>> master
```

or locally

```
npm install --save-dev codeceptjs
```

## Setup

Initialize CodeceptJS by running:

```bash
codeceptjs init
```

It will create `codecept.json` config in current directory (or provide path in the first argument).

You will be asked for tests location (they will be searched in current dir by default).

On next step you are asked to select **Helpers**. Helpers include actions which can be used in tests.
We recommend to start with **WebDriverIO** helper in order to write acceptance tests using webdriverio library and Selenium Server as test runner.
If you want to test AngularJS application, use Protractor helper, or if you are more familiar with official Selenium Webdriver JS library, choose it.
No matter what helper you've chosen they will be similar in use.

```bash
? What helpers do you want to use?
```
❯◉ WebDriverIO
 ◯ Protractor
 ◯ SeleniumWebdriver
 ◯ FileSystem
```

Then you will be asked for an output directory. Logs, reports, and failure screenshots will be placed there.

```bash
? Where should logs, screenshots, and reports to be stored? ./output
```

If you are going to extend test suite by writing custom steps you should probably agree to create `steps_file.js`

```bash
? Would you like to extend I object with custom steps? Yes
? Where would you like to place custom steps? ./steps_file.js
```

WebDriverIO helper will ask for additional configuration as well:

```bash
? [WebDriverIO] Base url of site to be tested http://localhost
? [WebDriverIO] Browser in which testing will be performed firefox
```

If you agree with defaults press enter and finish the installation.

Depending on a helper you've chosen you will be asked to install corresponding package manually in the end of init.
In case of webdriver you will need to run

```
[sudo] npm install -g webdriverio
```

for global installation. In case CodeceptJS is installed locally, webdriverio can be installed locally as well.
In a similar way you may install `protractor` or `selenium-webdriver`.

## Creating First Test

<<<<<<< HEAD
Tests can be easily created by running
=======
Tests can be easily created by running
>>>>>>> master

```bash
codeceptjs gt
```

*(or `generate test`)*

Provide a test name and open generated file in your favorite JavaScript editor (with ES6 support).

```js
Feature('My First Test');

Scenario('test something', (I) => {
<<<<<<< HEAD

=======

>>>>>>> master
});
```

Inside the scenario block you can write your first test scenario by using [actions from WebDriverIO helper](/helpers/WebDriverIO/). Let's assume we have a web server on `localhost` is running and there is a **Welcome** text on the first page. The simplest test will look like this:

```js
Feature('My First Test');

Scenario('test something', (I) => {
  I.amOnPage('/');
  I.see('Welcome');
});
```

<<<<<<< HEAD
Before running this test we should ensure that [Selenium Web Server is running](/helpers/WebDriverIO/#selenium-installation). Then we can execute tests with
=======
Before running this test we should ensure that [Selenium Web Server is running](/helpers/WebDriverIO/#selenium-installation). Then we can execute tests with
>>>>>>> master

```bash
codeceptjs run --steps
```

*steps option will display test execution process in console*

If everything is done right, you will see in console:

```bash
My First Test --
  test something
   • I am on page "/"
   • I see "Welcome"
<<<<<<< HEAD
 ✓ OK
=======
 ✓ OK
>>>>>>> master
```

## Congrats! Your first test is running.

<<<<<<< HEAD
Wasn't it hard, right?

=======
Wasn't it hard, right?
>>>>>>> master
