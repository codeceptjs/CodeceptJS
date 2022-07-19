---
permalink: /webdriver
title: Testing with WebDriver
---

# Testing with WebDriver

How does your client, manager, or tester, or any other non-technical person, know your web application is working? By opening the browser, accessing a site, clicking on links, filling in the forms, and actually seeing the content on a web page.

End to End tests can cover standard but complex scenarios from a user's perspective. With e2e tests you can be confident that users, following all defined scenarios, won't get errors. We check **functionality of application and a user interface** (UI) as well.

## What is Selenium WebDriver

The standard and proved way to run browser test automation over years is Selenium WebDriver. Over years this technology was standartized and works over all popular browsers and operating systems. There are cloud services like SauceLabs or BrowserStack which allow executing such browsers in the cloud. The superset of WebDriver protocol is also used to test [native and hybrid mobile applications](/mobile).

Let's clarify the terms:

* Selenium - is a toolset for browser test automation
* WebDriver - a standard protocol for communicating between test framework and browsers
* JSON Wire - an older version of such protocol

We use [webdriverio](https://webdriver.io) library to run tests over WebDriver.

> Popular tool [Protractor](/angular) also uses WebDriver for running end 2 end tests.

To proceed you need to have [CodeceptJS installed](/quickstart#using-selenium-webdriver) and `WebDriver` helper selected.

Selenium WebDriver may be complicated from start, as it requires following tools to be installed and started.

1. Selenium Server - to execute and send commands to browser
2. ChromeDriver or GeckoDriver - to allow browsers to run in automated mode.

> Those tools can be easily installed via NPM. Use [selenium-standalone](https://www.npmjs.com/package/selenium-standalone) to automatically install them.

You can also use `@wdio/selenium-standalone-service` package, to install and start Selenium Server for your tests automatically.

```
npm i @wdio/selenium-standalone-service --save-dev
```

Enable it in config inside plugins section:

```js
exports.config = {
  // ...
  // inside condecept.conf.js
  plugins: {
    wdio: {
      enabled: true,
      services: ['selenium-standalone']
    }
  }
}
```

> ⚠ It is not recommended to use wdio plugin & selenium-standalone when running tests in parallel. Consider **switching to Selenoid** if you need parallel run or using cloud services.


## Configuring WebDriver

WebDriver can be configured to run browser tests in window, headlessly, on a remote server or in a cloud.

> By default CodeceptJS is already configured to run WebDriver tests locally with Chrome or Firefox. If you just need to start running tests - proceed to the next chapter.

Configuration for WebDriver should be provided inside `codecept.conf.js` file under `helpers: WebDriver` section:

```js
  helpers: {
    WebDriver: {
      url: 'https://myapp.com',
      browser: 'chrome',
      host: '127.0.0.1',
      port: 4444,
      restart: false,
      windowSize: '1920x1680',
      desiredCapabilities: {
        chromeOptions: {
          args: [ /*"--headless",*/ "--disable-gpu", "--no-sandbox" ]
        }
      }
    },
  }
```

By default CodeceptJS runs tests in the same browser window but clears cookies and local storage after each test. This behavior can be changed with these options:

```js
// change to true to restart browser between tests
restart: false,
// don't change browser state and not clear cookies between tests
keepBrowserState: true,
keepCookies: true,
```

> ▶ More config options available on [WebDriver helper reference](/helpers/WebDriver#configuration)

### ChromeDriver without Selenium

If you want to run tests using raw ChromeDriver (which also supports WebDriver protocol) avoiding Selenium Server, you should provide following configuration:

```js
port: 9515,
browser: 'chrome',
path: '/',
```

> If you face issues connecting to WebDriver, please check that corresponding server is running on a specified port. If host is other than `localhost` or port is other than `4444`, update the configuration.

### Selenium in Docker (Selenoid)

Browsers can be executed in Docker containers. This is useful when testing on Continous Integration server.
We recommend using [Selenoid](https://aerokube.com/selenoid/) to run browsers in container.

CodeceptJS has [Selenoid plugin](/plugins#selenoid) which can automagically load browser container setup.


### Headless Mode

It is recommended to use `@codeceptjs/configure` package to easily toggle headless mode for WebDriver:

```js
// inside codecept.conf.js
const { setHeadlessWhen, setWindowSize } = require('@codeceptjs/configure');

setHeadlessWhen(process.env.HEADLESS); // enables headless mode when HEADLESS environment variable exists
```
This requires `@codeceptjs/configure` package to be installed.

Alternatively, you can enable headless mode manually via desired capabilities.

### Desired Capabilities

Additional configuration can be passed via `desiredCapabilities` option.
For instance, this is how we can set to **run headless Chrome**:

```js
desiredCapabilities: {
  chromeOptions: {
    args: [ "--headless", "--disable-gpu", "--window-size=1200,1000", "--no-sandbox" ]
  }
}
```

Next popular use case for capabilities is configuring what to do with unhandled alert popups.

```js
desiredCapabilities: {
  // close all unexpected popups
  unexpectedAlertBehaviour: 'dismiss',
}
```

### Cloud Providers

WebDriver protocol works over HTTP, so you need to have a Selenium Server to be running or any other service that will launch a browser for you. That's why you may need to specify `host`, `port`, `protocol`, and `path` parameters.

By default, those parameters are set to connect to local Selenium Server but they should be changed if you want to run tests via [Cloud Providers](/helpers/WebDriver#cloud-providers). You may also need `user` and `key` parameters to authenticate on cloud service.

There are also [browser and platform specific capabilities](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities). Services like SauceLabs, BrowserStack or browser vendors can provide their own specific capabilities for more tuning.

Here is a sample BrowserStack config for running tests on iOS mobile browser:

```js
 helpers: {
   WebDriver: {
     host: 'hub.browserstack.com',
     path: '/wd/hub',
     url: 'http://WEBSITE:8080/renderer',
     user: 'xx', // credentials
     key: 'xx', // credentials
     browser: 'iphone',
     desiredCapabilities: {
       'os_version' : '11',
       'device' : 'iPhone 8', // you can select device
       'real_mobile' : 'true', // real or emulated
       'browserstack.local' : 'true',
       'browserstack.debug' : 'true',
       'browserstack.networkLogs' : 'true',
       'browserstack.appium_version' : '1.9.1',
       'browserstack.user' : 'xx', // credentials
       'browserstack.key' : 'xx' // credentials
     }
   }
```


## Writing Tests

CodeceptJS provides high-level API on top of WebDriver protocol. While most standard implementations focus on dealing with WebElements on page, CodeceptJS is about user scenarios and interactions. That's why you don't have a direct access to web elements inside a test, but it is proved that in majority of cases you don't need it. Tests written from user's perspective are simpler to write, understand, log and debug.

> If you come from Java, Python or Ruby don't be afraid of a new syntax. It is more flexible than you think!

A typical test case may look like this:

```js
Feature('login');

Scenario('login test', ({ I }) => {
  I.amOnPage('/login');
  I.fillField('Username', 'john');
  I.fillField('Password', '123456');
  I.click('Login');
  I.see('Welcome, John');
});
```

An empty test case can be created with `npx codeceptjs gt` command.

```
npx codeceptjs gt
```


### Actions

Tests consist with a scenario of user's action taken on a page. The most widely used ones are:

* `amOnPage` - to open a webpage (accepts relative or absolute url)
* `click` - to locate a button or link and click on it
* `fillField` - to enter a text inside a field
* `selectOption`, `checkOption` - to interact with a form
* `wait*` to wait for some parts of page to be fully rendered (important for testing SPA)
* `grab*` to get values from page sources
* `see`, `dontSee` - to check for a text on a page
* `seeElement`, `dontSeeElement` - to check for elements on a page

> ℹ  All actions are listed in [WebDriver helper reference](https://codecept.io/helpers/WebDriver/).*

All actions which interact with elements **support CSS and XPath locators**. Actions like `click` or `fillField` by locate elements by their name or value on a page:

```js
// search for link or button
I.click('Login');
// locate field by its label
I.fillField('Name', 'Miles');
// we can use input name
I.fillField('user[email]','miles@davis.com');
```

You can also specify the exact locator type with strict locators:

```js
I.click({css: 'button.red'});
I.fillField({name: 'user[email]'},'miles@davis.com');
I.seeElement({xpath: '//body/header'});
```

### Interactive Pause

It's easy to start writing a test if you use [interactive pause](/basics#debug). Just open a web page and pause execution.

```js
Feature('Sample Test');

Scenario('open my website', ({ I }) => {
  I.amOnPage('/');
  pause();
});
```

This is just enough to run a test, open a browser, and think what to do next to write a test case.

When you execute such test with `npx codeceptjs run` command you may see the browser is started

```
npx codeceptjs run --steps
```

After a page is opened a full control of a browser is given to a terminal. Type in different commands such as `click`, `see`, `fillField` to write the test. A successful commands will be saved to `./output/cli-history` file and can be copied into a test.

> ℹ  All actions are listed in [WebDriver helper reference](/helpers/WebDriver).

An interactive shell output may look like this:

```
 Interactive shell started
 Use JavaScript syntax to try steps in action
 - Press ENTER to run the next step
 - Press TAB twice to see all available commands
 - Type exit + Enter to exit the interactive shell
 I.fillField('.new-todo', 'Write a test')
 I.pressKey('Enter')
 I.
 Commands have been saved to /home/davert/demos/codeceptjs/output/cli-history
```
After typing in successful commands you can copy them into a test.

Here is a test checking basic [todo application](https://todomvc.com/).

```js
Feature('TodoMVC');

Scenario('create todo item', ({ I }) => {
  I.amOnPage('/examples/vue/');
  I.waitForElement('.new-todo');
  I.fillField('.new-todo', 'Write a test')
  I.pressKey('Enter');
  I.see('1 item left', '.todo-count');
});
```

> [▶ Working example of CodeceptJS WebDriver tests](https://github.com/DavertMik/codeceptjs-webdriver-example) for TodoMVC application.

WebDriver helper supports standard [CSS/XPath and text locators](/locators) as well as non-trivial [React locators](/react) and [Shadow DOM](/shadow).

### Grabbers

If you need to get element's value inside a test you can use `grab*` methods. They should be used with `await` operator inside `async` function:

```js
const assert = require('assert');
Scenario('get value of current tasks', async ({ I }) => {
  I.fillField('.todo', 'my first item');
  I.pressKey('Enter')
  I.fillField('.todo', 'my second item');
  I.pressKey('Enter')
  let numTodos = await I.grabTextFrom('.todo-count strong');
  assert.equal(2, numTodos);
});
```

### Within

In case some actions should be taken inside one element (a container or modal window or iframe) you can use `within` block to narrow the scope.
Please take a note that you can't use within inside another within in Puppeteer helper:

```js
await within('.todoapp', () => {
  I.fillField('.todo', 'my new item');
  I.pressKey('Enter')
  I.see('1 item left', '.todo-count');
  I.click('.todo-list input.toggle');
});
I.see('0 items left', '.todo-count');
```

### Each Element <Badge text="Since 3.3" type="warning"/>

Usually, CodeceptJS performs an action on the first matched element. 
In case you want to do an action on each element found, use the special function `eachElement` which comes from [eachElement](https://codecept.io/plugins/#eachelement) plugin. 

`eachElement` function matches all elements by locator and performs a callback on each of those element. A callback function receives element of webdriverio. `eachElement` may perform arbitrary actions on a page, so the first argument should by a description of the actions performed. This description will be used for logging purposes.

Usage example

```js
await eachElement(
  'click all checkboxes', 
  'input.custom-checkbox', 
  async (el, index) => {
    await el.click();
  });
);
```

> ℹ Learn more about [eachElement plugin](/plugins/#eachelement)


## Waiting

Web applications do not always respond instantly. That's why WebDriver protocol has methods to wait for changes on a page. CodeceptJS provides such commands prefixed with `wait*` so you could explicitly define what effects we wait for.

Most popular "waiters" are:

* `waitForText` - wait for text to appear on a page
* `waitForElement` - wait for element to appear on a page
* `waitForInvisible` - wait element to become invisible.

By default, they will wait for 1 second. This number can be changed in WebDriver configuration:

```js
// inside codecept.conf.js
exports.config = {
  helpers: {
    WebDriver: {
      // WebDriver config goes here
      // wait for 5 seconds
      waitForTimeout: 5000
    }
  }
}
```

## SmartWait

It is possible to wait for elements pragmatically. If a test uses element which is not on a page yet, CodeceptJS will wait for few extra seconds before failing. This feature is based on [Implicit Wait](https://www.seleniumhq.org/docs/04_webdriver_advanced.jsp#implicit-waits) of Selenium. CodeceptJS enables implicit wait only when searching for a specific element and disables in all other cases. Thus, the performance of a test is not affected.

SmartWait can be enabled by setting wait option in WebDriver config.
Add `smartWait: 5000` to wait for additional 5s.

```js
// inside codecept.conf.js
exports.config = {
  helpers: {
    WebDriver: {
      // WebDriver config goes here
      // smart wait for 5 seconds
      smartWait: 5000
    }
  }
}
```

SmartWait works with a CSS/XPath locators in `click`, `seeElement` and other methods. See where it is enabled and where is not:

```js
I.click('Login'); // DISABLED, not a locator
I.fillField('user', 'davert'); // DISABLED, not a specific locator
I.fillField({name: 'password'}, '123456'); // ENABLED, strict locator
I.click('#login'); // ENABLED, locator is CSS ID
I.see('Hello, Davert'); // DISABLED, Not a locator
I.seeElement('#userbar'); // ENABLED
I.dontSeeElement('#login'); // DISABLED, can't wait for element to hide
I.seeNumberOfElements('button.link', 5); // DISABLED, can wait only for one element

```

SmartWait doesn't check element for visibility, so tests may fail even element is on a page.

Usage example:

```js
// we use smartWait: 5000 instead of
// I.waitForElement('#click-me', 5);
// to wait for element on page
I.click('#click-me');
```

If it's hard to define what to wait, it is recommended to use [retries](/basics/#retries) to rerun flaky steps.

## Configuring CI

To develop tests it's fine to use local Selenium Server and window mode. Setting up WebDriver on remote CI (Continous Integration) server is different. If there is no desktop and no window mode on CI.

There are following options available:

* Use headless Chrome or Firefox.
* Use [Selenoid](/plugins/selenoid) to run browsers inside Docker containers.
* Use paid [cloud services (SauceLabs, BrowserStack, TestingBot)](/helpers/WebDriver#cloud-providers).

## Video Recording

When [Selenoid Plugin](/plugins#selenoid) is enabled video can be automatically recorded for each test.

## Auto Login

To share the same user session across different tests CodeceptJS provides [autoLogin plugin](/plugins#autologin). It simplifies login management and reduces time consuming login operations. Instead of filling in login form before each test it saves the cookies of a valid user session and reuses it for next tests. If a session expires or doesn't exist, logs in a user again.

This plugin requires some configuration but is very simple in use:

```js
Scenario('do something with logged in user', ({ I, login) }) => {
  login('user');
  I.see('Dashboard','h1');
});
```

With `autoLogin` plugin you can save cookies into a file and reuse same session on different runs.

> [▶ How to set up autoLogin plugin](/plugins#autologin)


## Multiple Windows

CodeceptJS allows to use several browser windows inside a test. Sometimes we are testing the functionality of websites that we cannot control, such as a closed-source managed package, and there are popups that either remain open for configuring data on the screen, or close as a result of clicking a window. We can use these functions in order to gain more control over which page is being tested with Codecept at any given time. For example:

```js
const assert = require('assert');

Scenario('should open main page of configured site, open a popup, switch to main page, then switch to popup, close popup, and go back to main page', async ({ I }) => {
    I.amOnPage('/');
    const handleBeforePopup = await I.grabCurrentWindowHandle();
    const urlBeforePopup = await I.grabCurrentUrl();
    const allHandlesBeforePopup = await I.grabAllWindowHandles();
    assert.equal(allHandlesBeforePopup.length, 1, 'Single Window');

    await I.executeScript(() => {
        window.open('https://www.w3schools.com/', 'new window', 'toolbar=yes,scrollbars=yes,resizable=yes,width=400,height=400');
    });

    const allHandlesAfterPopup = await I.grabAllWindowHandles();
    assert.equal(allHandlesAfterPopup.length, 2, 'Two Windows');

    await I.switchToWindow(allHandlesAfterPopup[1]);
    const urlAfterPopup = await I.grabCurrentUrl();
    assert.equal(urlAfterPopup, 'https://www.w3schools.com/', 'Expected URL: Popup');

    assert.equal(handleBeforePopup, allHandlesAfterPopup[0], 'Expected Window: Main Window');
    await I.switchToWindow(handleBeforePopup);
    const currentURL = await I.grabCurrentUrl();
    assert.equal(currentURL, urlBeforePopup, 'Expected URL: Main URL');

    await I.switchToWindow(allHandlesAfterPopup[1]);
    const urlAfterSwitchBack = await I.grabCurrentUrl();
    assert.equal(urlAfterSwitchBack, 'https://www.w3schools.com/', 'Expected URL: Popup');
    await I.closeCurrentTab();

    const allHandlesAfterPopupClosed = await I.grabAllWindowHandles();
    assert.equal(allHandlesAfterPopupClosed.length, 1, 'Single Window');
    const currentWindowHandle = await I.grabCurrentWindowHandle();
    assert.equal(currentWindowHandle, allHandlesAfterPopup[0], 'Expected Window: Main Window');

});
```

## Mocking Requests

When testing web application you can disable some of external requests calls by enabling HTTP mocking.
This is useful when you want to isolate application testing from a backend. For instance, if you don't want to save data to database, and you know the request which performs save, you can mock the request, so application will treat this as valid response, but no data will be actually saved.

  > **WebDriver has limited ability to mock requests**, so you can only mock only requests performed after page is loaded. This means that you can't block Google Analytics, or CDN calls, but you can mock API requests performed on user action.

To mock requests enable additional helper [MockRequest](/helpers/MockRequest) (which is based on Polly.js).

```js
helpers: {
   WebDriver: {
     // regular WebDriver config here
   },
   MockRequest: {}
}
```


The function `mockRequest` will be added to `I` object. You can use it to explicitly define which requests to block and which response they should return instead:

```js
// block all Google Analytics calls
I.mockRequest('/google-analytics/*path', 200);
// return an empty successful response
I.mockRequest('GET', '/api/users', 200);
// block post requests to /api/users and return predefined object
I.mockRequest('POST', '/api/users', { user: 'davert' });
// return error request with body
I.mockRequest('GET', '/api/users/1', 404, { error: 'User not found' });
```

> In WebDriver mocking is disabled every time a new page is loaded. Hence, `startMocking` method should be called and the mocks should be updated, after navigating to a new page. This is a limitation of WebDriver. Consider using Puppeteer with MockRequest instead.

```js
I.amOnPage('/xyz');
I.mockRequest({ ... })
I.click('Go to Next Page');
// new page is loaded, mocking is disabled now. We need to set it up again
// in WebDriver as we can't detect that the page was reloaded, so no mocking :(
```

> See [`mockRequest` API](/helpers/MockRequest#mockrequest)

To see `mockRequest` method in intellisense auto completion don't forget to run `codeceptjs def` command:

```
npx codeceptjs def
```

Mocking rules will be kept while a test is running. To stop mocking use `I.stopMocking()` command


## Accessing webdriverio API

To get [webdriverio browser API](https://webdriver.io/docs/api.html) inside a test use [`I.useWebDriverTo`](/helpers/WebDriver/#usewebdriverto) method with a callback.
To keep test readable provide a description of a callback inside the first parameter.

```js
I.useWebDriverTo('do something with native webdriverio api', async ({ browser }) => {
  // use browser object here
});
```

> webdriverio commands are asynchronous so a callback function must be async.

WebDriver helper can be obtained in this function as well. Use this to get full access to webdriverio elements inside the test.

```js
I.useWebDriverTo('click all Save buttons', async (WebDriver) => {
  const els = await WebDriver._locateClickable('Save');
  for (let el of els) {
    await el.click();
  }
});
```

## Extending WebDriver

CodeceptJS doesn't aim to embrace all possible functionality of WebDriver. At some points you may find that some actions do not exist, however it is easy to add one. You will need to use WebDriver API from [webdriver.io](https://webdriver.io) library.

To create new actions which will be added into `I.` object you need to create a new helper. This can be done with `codeceptjs gh` command.

```
npx codeceptjs gh
```

Name a new helper "Web". Now each method of a created class can be added to I object. Be sure to enable this helper in config:

```js
exports.config = {
  helpers: {
    WebDriver: { /* WebDriver config goes here */ },
    WebHelper: {
      // load custom helper
      require: './web_helper.js'
    }
  }
}
```

> ℹ  See [Custom Helper](/helpers) guide to see more examples.

While implementing custom actions using WebDriver API please note that, there is two versions of protocol: WebDriver and JSON Wire. Depending on a browser version one of those protocols can be used. We can't know for sure which protocol is going to used, so we will need to implement an action using both APIs.

```js
const Helper = codeceptjs.helper;

class Web extends Helper {

  // method to drag an item to coordinates
  async dragToPoint(el, x, y) {
    // access browser object from WebDriver
    const browser = this.helpers.WebDriver.browser;
    await this.helpers.WebDriver.moveCursorTo(el);

    if (browser.isW3C) {
      // we use WebDriver protocol
      return browser.performActions([
        {"type": "pointerDown", "button": 0},
        {"type": "pointerMove", "origin": "pointer", "duration": 1000, x, y },
        {"type": "pointerUp", "button": 0}
      ]);
    }

    // we use JSON Wire protocol
    await browser.buttonDown(0);
    await browser.moveToElement(null, x, y);
    await browser.buttonUp(0);
  }

  // method which restarts browser
  async restartBrowser() {
    const browser = this.helpers.WebDriver.browser;
    await browser.reloadSession();
    await browser.maximizeWindow();
  }

  // method which goes to previous page
  async backToPreviousPage() {
    const browser = this.helpers.WebDriver.browser;
    await browser.back();
  }
}
```

When a helper is created, regenerate your step definitions, so you could see those actions when using [intellisense](/basics#intellisense):

```
npx codeceptjs def
```

