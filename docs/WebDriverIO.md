# WebDriverIO

[lib/helper/WebDriverIO.js:36-438](https://github.com/Codeception/CodeceptJS/blob/919448279732a50d64e9f696895bdd108c50b16d/lib/helper/WebDriverIO.js#L36-L438 "Source code on GitHub")

WebDriverIO helper which wraps [webdriverio](http://webdriver.io/) library to 
manipulate browser using Selenium WebDriver or PhantomJS. 

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

Additional configuration params can be used from <http://webdriver.io/guide/getstarted/configuration.html>

**Parameters**

-   `config`  

## amOnPage

[lib/helper/WebDriverIO.js:71-75](https://github.com/Codeception/CodeceptJS/blob/919448279732a50d64e9f696895bdd108c50b16d/lib/helper/WebDriverIO.js#L71-L75 "Source code on GitHub")

Opens a web page in a browser. Requires relative or absolute url. 
If url starts with `/`, opens a web page of a site defined in `url` config parameter.

```js
I.amOnPage('/'); // opens main page of website
I.amOnPage('https://github.com'); // opens github
I.amOnPage('/login'); // opens a login page
```

**Parameters**

-   `url`  

## attachFile

[lib/helper/WebDriverIO.js:191-193](https://github.com/Codeception/CodeceptJS/blob/919448279732a50d64e9f696895bdd108c50b16d/lib/helper/WebDriverIO.js#L191-L193 "Source code on GitHub")

Attaches a file to element located by CSS or XPath

**Parameters**

-   `locator`  
-   `pathToFile`  

## checkOption

[lib/helper/WebDriverIO.js:206-222](https://github.com/Codeception/CodeceptJS/blob/919448279732a50d64e9f696895bdd108c50b16d/lib/helper/WebDriverIO.js#L206-L222 "Source code on GitHub")

Selects a checkbox or radio button. 
Element is located by label or name or CSS or XPath.

The second parameter is a context (CSS or XPath locator) to narrow the search. 

```js
I.checkOption('#agree');
I.checkOption('I Agree to Terms and Conditions');
```

**Parameters**

-   `option`  
-   `context`  

## click

[lib/helper/WebDriverIO.js:100-113](https://github.com/Codeception/CodeceptJS/blob/919448279732a50d64e9f696895bdd108c50b16d/lib/helper/WebDriverIO.js#L100-L113 "Source code on GitHub")

Perform a click on a link or a button, given by a locator. 
If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string. 
For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched. 
For images, the "alt" attribute and inner text of any parent links are searched.

The second parameter is a context (CSS or XPath locator) to narrow the search.

```js
// simple link
I.click('Logout');
// button of form
I.click('Submit');
// CSS button
I.click('#form input[type=submit]');
// XPath
I.click('//form/*[@type=submit]');
// link in context
I.click('Logout', '#nav');
// using strict locator
I.click({css: 'nav a.login'});
```

**Parameters**

-   `link`  
-   `context`  

## dontSee

[lib/helper/WebDriverIO.js:312-314](https://github.com/Codeception/CodeceptJS/blob/919448279732a50d64e9f696895bdd108c50b16d/lib/helper/WebDriverIO.js#L312-L314 "Source code on GitHub")

Opposite to `see`. Checks that a text is not present on a page.
Use context parameter to narrow down the search.

```js
I.dontSee('Login'); // assume we are already logged in
```

**Parameters**

-   `text`  
-   `context`  

## dontSeeElement

[lib/helper/WebDriverIO.js:333-337](https://github.com/Codeception/CodeceptJS/blob/919448279732a50d64e9f696895bdd108c50b16d/lib/helper/WebDriverIO.js#L333-L337 "Source code on GitHub")

Opposite to `seeElement`. Checks that element is not on page.

**Parameters**

-   `locator`  

## dontSeeInCurrentUrl

[lib/helper/WebDriverIO.js:355-359](https://github.com/Codeception/CodeceptJS/blob/919448279732a50d64e9f696895bdd108c50b16d/lib/helper/WebDriverIO.js#L355-L359 "Source code on GitHub")

Checks that current url does not contain a provided fragment.

**Parameters**

-   `urlFragment`  

## doubleClick

[lib/helper/WebDriverIO.js:118-120](https://github.com/Codeception/CodeceptJS/blob/919448279732a50d64e9f696895bdd108c50b16d/lib/helper/WebDriverIO.js#L118-L120 "Source code on GitHub")

Performs a double-click on an element matched by CSS or XPath.

**Parameters**

-   `locator`  

## executeAsyncScript

[lib/helper/WebDriverIO.js:375-377](https://github.com/Codeception/CodeceptJS/blob/919448279732a50d64e9f696895bdd108c50b16d/lib/helper/WebDriverIO.js#L375-L377 "Source code on GitHub")

Executes async script on page.
Provided function should execute a passed callback (as first argument) to signal it is finished.

**Parameters**

-   `fn`  

## executeScript

[lib/helper/WebDriverIO.js:367-369](https://github.com/Codeception/CodeceptJS/blob/919448279732a50d64e9f696895bdd108c50b16d/lib/helper/WebDriverIO.js#L367-L369 "Source code on GitHub")

Executes sync script on a page.
Pass arguments to function as additional parameters.
Will return execution result to a test. 
In this case you should use generator and yield to receive results.

**Parameters**

-   `fn`  

## fillField

[lib/helper/WebDriverIO.js:137-145](https://github.com/Codeception/CodeceptJS/blob/919448279732a50d64e9f696895bdd108c50b16d/lib/helper/WebDriverIO.js#L137-L145 "Source code on GitHub")

Fills a text field or textarea with the given string.
Field is located by name, label, CSS, or XPath.

```js
// by label
I.fillField('Email', 'hello@world.com');
// by name
I.fillField('password', '123456');
// by CSS
I.fillField('form#login input[name=username]', 'John');
// or by strict locator
I.fillField({css: 'form#login input[name=username]'}, 'John');
```

**Parameters**

-   `field`  
-   `value`  

## grabAttribute

[lib/helper/WebDriverIO.js:260-264](https://github.com/Codeception/CodeceptJS/blob/919448279732a50d64e9f696895bdd108c50b16d/lib/helper/WebDriverIO.js#L260-L264 "Source code on GitHub")

Retrieves an attribute from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let hint = yield I.grabAttributeFrom('#tooltip', 'title');
```

**Parameters**

-   `locator`  
-   `attr`  

## grabTextFrom

[lib/helper/WebDriverIO.js:232-236](https://github.com/Codeception/CodeceptJS/blob/919448279732a50d64e9f696895bdd108c50b16d/lib/helper/WebDriverIO.js#L232-L236 "Source code on GitHub")

Retrieves a text from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let pin = yield I.grabTextFrom('#pin');
```

**Parameters**

-   `locator`  

## grabTitle

[lib/helper/WebDriverIO.js:283-288](https://github.com/Codeception/CodeceptJS/blob/919448279732a50d64e9f696895bdd108c50b16d/lib/helper/WebDriverIO.js#L283-L288 "Source code on GitHub")

Retrieves a page title and returns it to test. 
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let title = yield I.grabTitle();
```

## grabValueFrom

[lib/helper/WebDriverIO.js:246-250](https://github.com/Codeception/CodeceptJS/blob/919448279732a50d64e9f696895bdd108c50b16d/lib/helper/WebDriverIO.js#L246-L250 "Source code on GitHub")

Retrieves a value from a form element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let email = yield I.grabValueFrom('input[name=email]');
```

**Parameters**

-   `locator`  

## see

[lib/helper/WebDriverIO.js:300-302](https://github.com/Codeception/CodeceptJS/blob/919448279732a50d64e9f696895bdd108c50b16d/lib/helper/WebDriverIO.js#L300-L302 "Source code on GitHub")

Checks that a page contains a visible text.
Use context parameter to narrow down the search.

```js
I.see('Welcome'); // text welcome on a page
I.see('Welcome', '.content'); // text inside .content div
I.see('Register', {css: 'form.register'}); // use strict locator
```

**Parameters**

-   `text`  
-   `context`  

## seeElement

[lib/helper/WebDriverIO.js:324-328](https://github.com/Codeception/CodeceptJS/blob/919448279732a50d64e9f696895bdd108c50b16d/lib/helper/WebDriverIO.js#L324-L328 "Source code on GitHub")

Checks that element is present on page.
Element is located by CSS or XPath.

```js
I.seeElement('#modal');
```

**Parameters**

-   `locator`  

## seeInCurrentUrl

[lib/helper/WebDriverIO.js:346-350](https://github.com/Codeception/CodeceptJS/blob/919448279732a50d64e9f696895bdd108c50b16d/lib/helper/WebDriverIO.js#L346-L350 "Source code on GitHub")

Checks that current url contains a provided fragment.

```js
I.seeInCurrentUrl('/register'); // we are on registration page
```

**Parameters**

-   `urlFragment`  

## seeInTitle

[lib/helper/WebDriverIO.js:269-273](https://github.com/Codeception/CodeceptJS/blob/919448279732a50d64e9f696895bdd108c50b16d/lib/helper/WebDriverIO.js#L269-L273 "Source code on GitHub")

Checks that title contains text.

**Parameters**

-   `text`  

## selectOption

[lib/helper/WebDriverIO.js:161-186](https://github.com/Codeception/CodeceptJS/blob/919448279732a50d64e9f696895bdd108c50b16d/lib/helper/WebDriverIO.js#L161-L186 "Source code on GitHub")

Selects an option in a drop-down select.
Field is siearched by label | name | CSS | XPath.
Option is selected by visible text or by value.

```js
I.selectOption('Choose Plan', 'Monthly'); // select by label
I.selectOption('subscription', 'Monthly'); // match option by text
I.selectOption('subscription', '0'); // or by value
I.selectOption('//form/select[@name=account]','Permium');
I.selectOption('form select[name=account]', 'Premium');
I.selectOption({css: 'form select[name=account]'}, 'Premium');
```

**Parameters**

-   `select`  
-   `option`  

## wait

[lib/helper/WebDriverIO.js:382-384](https://github.com/Codeception/CodeceptJS/blob/919448279732a50d64e9f696895bdd108c50b16d/lib/helper/WebDriverIO.js#L382-L384 "Source code on GitHub")

Pauses execution for a number of seconds.

**Parameters**

-   `sec`  

## waitForElement

[lib/helper/WebDriverIO.js:399-402](https://github.com/Codeception/CodeceptJS/blob/919448279732a50d64e9f696895bdd108c50b16d/lib/helper/WebDriverIO.js#L399-L402 "Source code on GitHub")

Waits for element to be present on page (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `selector`  
-   `sec`  

## waitForEnabled

[lib/helper/WebDriverIO.js:390-393](https://github.com/Codeception/CodeceptJS/blob/919448279732a50d64e9f696895bdd108c50b16d/lib/helper/WebDriverIO.js#L390-L393 "Source code on GitHub")

Waits for element to become enabled (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `selector`  
-   `sec`  

## waitForText

[lib/helper/WebDriverIO.js:409-420](https://github.com/Codeception/CodeceptJS/blob/919448279732a50d64e9f696895bdd108c50b16d/lib/helper/WebDriverIO.js#L409-L420 "Source code on GitHub")

Waits for a text to appear (by default waits for 1sec).
Element can be located by CSS or XPath.
Narrow down search results by providing context.

**Parameters**

-   `text`  
-   `sec`  
-   `context`  

## waitForVisible

[lib/helper/WebDriverIO.js:426-429](https://github.com/Codeception/CodeceptJS/blob/919448279732a50d64e9f696895bdd108c50b16d/lib/helper/WebDriverIO.js#L426-L429 "Source code on GitHub")

Waits for an element to become visible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `selector`  
-   `sec`  

## waitUntil

[lib/helper/WebDriverIO.js:434-437](https://github.com/Codeception/CodeceptJS/blob/919448279732a50d64e9f696895bdd108c50b16d/lib/helper/WebDriverIO.js#L434-L437 "Source code on GitHub")

Waits for a function to return true (waits for 1sec by default).

**Parameters**

-   `fn`  
-   `sec`  
