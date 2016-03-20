# Protractor

[lib/helper/Protractor.js:46-226](https://github.com/Codeception/CodeceptJS/blob/38bc177211f550c2617041c773a70ac2d1c711f0/lib/helper/Protractor.js#L46-L226 "Source code on GitHub")

**Extends SeleniumWebdriver**

Protractor helper is based on [Protractor library](http://www.protractortest.org) and used for testing AngularJS applications.

#### Selenium Installation

1.  Download [Selenium Server](http://docs.seleniumhq.org/download/)
2.  Launch the daemon: `java -jar selenium-server-standalone-2.xx.xxx.jar`

#### PhantomJS Installation

PhantomJS is a headless alternative to Selenium Server that implements [the WebDriver protocol](https://code.google.com/p/selenium/wiki/JsonWireProtocol).
It allows you to run Selenium tests on a server without a GUI installed.

1.  Download [PhantomJS](http://phantomjs.org/download.html)
2.  Run PhantomJS in WebDriver mode: `phantomjs --webdriver=4444`

### Configuration

This helper should be configured in codecept.json

-   `url` - base url of website to be tested
-   `browser` - browser in which perform testing
-   `driver` - which protrator driver to use (local, direct, session, hosted, sauce, browserstack). By default set to 'hosted' which requires selenium server to be started.
-   `seleniumAddress` - Selenium address to connect (default: <http://localhost:4444/wd/hub>)

other options are the same as in [Protractor config](https://github.com/angular/protractor/blob/master/docs/referenceConf.js).

## amInsideAngularApp

[lib/helper/Protractor.js:152-165](https://github.com/Codeception/CodeceptJS/blob/38bc177211f550c2617041c773a70ac2d1c711f0/lib/helper/Protractor.js#L152-L165 "Source code on GitHub")

Enters Angular mode (switched on by default)
Should be used after "amOutsideAngularApp"

## amOutsideAngularApp

[lib/helper/Protractor.js:141-146](https://github.com/Codeception/CodeceptJS/blob/38bc177211f550c2617041c773a70ac2d1c711f0/lib/helper/Protractor.js#L141-L146 "Source code on GitHub")

Switch to non-Angular mode,
start using WebDriver instead of Protractor in this session

## waitForClickable

[lib/helper/Protractor.js:179-183](https://github.com/Codeception/CodeceptJS/blob/38bc177211f550c2617041c773a70ac2d1c711f0/lib/helper/Protractor.js#L179-L183 "Source code on GitHub")

Waits for element to become clickable for number of seconds.

**Parameters**

-   `locator`  
-   `sec`  

## waitForElement

[lib/helper/Protractor.js:170-174](https://github.com/Codeception/CodeceptJS/blob/38bc177211f550c2617041c773a70ac2d1c711f0/lib/helper/Protractor.js#L170-L174 "Source code on GitHub")

 Waits for element to be present on page (by default waits for 1sec).
 Element can be located by CSS or XPath.
 
**Parameters**

-   `locator`  
-   `sec`  

## waitForText

[lib/helper/Protractor.js:197-204](https://github.com/Codeception/CodeceptJS/blob/38bc177211f550c2617041c773a70ac2d1c711f0/lib/helper/Protractor.js#L197-L204 "Source code on GitHub")

Waits for a text to appear (by default waits for 1sec).
Element can be located by CSS or XPath.
Narrow down search results by providing context.

```js
I.waitForText('Thank you, form has been submitted');
I.waitForText('Thank you, form has been submitted', 5, '#modal');
```

**Parameters**

-   `text`  
-   `sec`  
-   `context`  

## waitForVisible

[lib/helper/Protractor.js:188-192](https://github.com/Codeception/CodeceptJS/blob/38bc177211f550c2617041c773a70ac2d1c711f0/lib/helper/Protractor.js#L188-L192 "Source code on GitHub")

Waits for an element to become visible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `locator`  
-   `sec`  
