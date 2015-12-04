# QuickStart

**NodeJS v 4.2.0** and higher required to start. 
Install **CodeceptJS** with NPM:

```bash
npm install -g codeceptjs
```

(you may need `sudo` to do it).

## Setup

Initialize CodeceptJS by running:

```bash
codeceptjs init
```

It will create `codecept.js` config in current directory (or provide path in the first argument).

You will be asked for tests location (they will be searched in current dir by default). 

On next step you are asked to select **Helpers**. Helpers include actions which can be used in tests.
We recommend to start with **WebDriverIO** helper in order to write acceptance tests using webdriverio library and Selenium Server as test runner.

```bash
? What helpers do you want to use? 
❯◉ WebDriverIO
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

## Creating First Test

Tests can be easily created by running 

```bash
codeceptjs gt
```

*(or `generate test`)*

Provide a test name and open generated file in your favorite JavaScript editor (with ES6 support).

```js
Feature('My First Test');

Scenario('test something', (I) => {
  
});
```

Inside the scenario block you can write your first test scenario by using [actions from WebDriverIO helper](http://127.0.0.1:8000/helpers/WebDriverIO/). Let's assume we have a web server on `localhost` is running and there is a **Welcome** text on the first page. The simplest test will look like this:

```js
Feature('My First Test');

Scenario('test something', (I) => {
  I.amOnPage('/');
  I.see('Welcome');
});
```

Before running this test we should ensure that [Selenium Web Server is running](http://127.0.0.1:8000/helpers/WebDriverIO/#selenium-installation). Then we can execute tests with 

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
 ✓ OK    
```

## Congrats! Your first test is running.

Wasn't it hard, right?

