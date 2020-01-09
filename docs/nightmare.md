---
permalink: /nightmare
title: Testing with Nightmare
---

# Testing with Nightmare

Selenium WebDriver is considered to be standard for end to end testing of web applications.
Despite its popularity it have its drawbacks, it requires a real browser and Selenium server to control it.
This hardens setting it up testing environment for CI server and slows down test execution.

Is there a sane alternative to Selenium?

Yes, how about [NightmareJS](http://www.nightmarejs.org)?

It is modern Electron based testing framework which allows to execute tests in headless mode as well as in window mode for debug purposes.
This makes Nightmare very useful, much more handy than PhantomJS. Nightmare is in active development and has nice API for writing acceptance tests.
Unfortunately, as all other JavaScript testing frameworks it has its own very custom API.
What if you choose it for a project and suddenly you realize that you need something more powerful, like Selenium?
Yes, that might be a problem if you are not using CodeceptJS.
The one idea behind CodeceptJS is to unify different testing backends under one API, so you could easily write tests the same way no matter what engines you use: webdriverio, Protractor, or Nightmare.

Compare a test written using Nightmare API:

```js
nightmare
  .goto('http://yahoo.com')
  .type('form[action*="/search"] [name=p]', 'github nightmare')
  .click('form[action*="/search"] [type=submit]')
  .wait('#main')
  .evaluate(function () {
    return document.querySelector('#main .searchCenterMiddle li a').href
  })
```

with a similar CodeceptJS test:

```js
  I.amOnPage('http://yahoo.com');
  I.fillField('p', 'github nightmare');
  I.click('Search Web');
  I.waitForElement('#main');
  I.seeElement('#main .searchCenterMiddle li a');
  I.seeElement("//a[contains(@href,'github.com/segmentio/nightmare')]");
  I.see('segmentio/nightmare','#main li a');
```

NightmareJS support only CSS locators for web elements, while CodeceptJS improves it to use XPath as well.
This is how form can be located by labels, and buttons by text in examples above. It is done by injecting
client-side scrips (for element location) to every loaded page. Also all events like click, doubleClick, keyPress are **simulated** by JavaScript,
this makes testing less relevant, as they are not native to operating systems.

## How Fast Is Nightmare JS?

Let's execute the test above within WebDriver using headless Firefox + Selenium Server packed in Docker container.

```sh
docker run -d -p 4444:4444 selenium/standalone-firefox:2.53.0
codeceptjs run yahoo_test.js --steps
```

This provides use with output:

```sh
 Yahoo basic test
 > WebDriver._before
 • I am on page "http://yahoo.com"
 • I fill field "p", "github nightmare"
 • I click "Search Web"
 • I wait for element "#main", 2
 • I see element "#main .searchCenterMiddle li a"
 • I see "segmentio/nightmare", "li a"
 ✓ OK in 17591ms
```

When we switch helper to Nightmare:

```sh
 Yahoo basic test
 > Nightmare._before
 • I am on page "http://yahoo.com"
 • I fill field "p", "github nightmare"
 • I click "Search Web"
 • I wait for element "#main", 2
 • I see element "#main .searchCenterMiddle li a"
 • I see "segmentio/nightmare", "li a"
 ✓ OK in 5490ms
```

As you see the Nightmare test was almost **3 times faster** than Selenium test.
Sure, this can't be taken as a valuable benchmark but more like a proof of concept.

## Setup

To start you need CodeceptJS with nightmare package installed.

```bash
npm install -g nightmare
```

And a basic project initialized

```sh
codeceptjs init
```

You will be asked for a Helper to use, you should select Nightmare and provide url of a website you are testing.
Setup process is explained on [QuickStart page](http://codecept.io/quickstart/).

(If you already have CodeceptJS project, just install nightmare globally or locally and enable it in config)

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

## Opening a Web Page

Nightmare provides you with more control to browser engine than Selenium does.
This allows you to use headers in your tests. For instance, CodeceptJS provides `haveHeader` method
to set default headers for all your HTTP requests:

```js
I.haveHeader('x-tested-with', 'codeceptjs');
```

When opening a web page you can set headers as well. `amOnPage` methods can take headers as second parameter:

```js
// use basic http auth
I.amOnPage('/admin', { 'Authorization': 'Basic '+token });
```

As a small bonus: all `console.log` calls on a page will be also shown in `--debug` mode.

## Manipulating Web Page

Nightmare helper is supposed to work in the same manner as WebDriver or Protractor.
This means that all CodeceptJS actions like `click`, `fillField`, `selectOption` and others are supposed to work in the very same manner.
They are expressive and flexible to accept CSS, XPath, names, values, or strict locators. Follow the helper reference for detailed description.

Assertions start with `see` prefix. You can check text on a page, elements on page and others.

## Extending Nightmare Helper

CodeceptJS allows you to define and connect own helpers. If some functionality of
Nightmare helper is missing you can easily create `ExtendedNightmare` helper by running:

```sh
codeceptjs gh
```

Learn more about [Helpers](http://codecept.io/helpers/).

Nightmare instance can be accessed by custom helper:

```js
// returns current nightmare instance
this.helpers['Nightmare'].browser;
```

This way you can call [native Nightmare commands](https://github.com/segmentio/nightmare#interact-with-the-page).

It is important to understand that Nightmare executes JavaScript on client and on server side.
If you need to find an element you should search for it using client side script, but if you want
to do an assertion you should return a data to server side.

Nightmare provides `evaluate` method to execute client-side JavaScript. CodeceptJS registers `codeceptjs`
object globally on client side with `findElement` and `findElements` methods in it. They return IDs of matched elements
so you can access them in next calls to `evaluate`:

```js
// inside a custom helper class
async seeAttributeContains(locator, attribute, expectedValue) {
  // let's use chai assertion library
  const assert = require('chai').assert;
  // get nightmare instance
  const browser = this.helpers['Nightmare'].browser;
  // find an element by CSS or XPath:
  const els = await this.helpers['Nightmare']._locate(locator);
    // we received an array with IDs of matched elements
    // now let's execute client-side script to get attribute for the first element
  const attributeValue = await browser.evaluate(function(el, attribute) {
      // this is executed inside a web page!
      return codeceptjs.fetchElement(el).getAttribute(attribute);
  }, els[0], attribute); // function + its params

    // get attribute value and back to server side
    // execute an assertion
  assert.include(attributeValue, expectedValue);
}
```

It can be used in tests like:

```js
I.seeAttributeContains('#main img', 'src', '/cat.jpg');
```

This sample assertion used `_locate` helper method which searched for elements
by CSS/XPath or a strict locator. Then `browser.evaluate` method was called to
use locate found elements on a page and return attribute from the first of them.

## Additional Links

* [Nightmare Tutorial](http://codenroll.it/acceptance-testing-with-codecept-js/) by jploskonka.

