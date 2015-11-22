# FileSystem

Helper for testing filesystem.
Can be easily used to check file structures:

```js
I.amInPath('test');
I.seeFile('codecept.json');
I.seeInThisFile('FileSystem');
I.dontSeeInThisFile("WebDriverIO");
```

## amInPath

Enters a directory In local filesystem. 
Starts from a current directory

**Parameters**

-   `openPath`  

## dontSeeFileContentsEqual

Checks that contents of file found by `seeFile` doesn't equal to text.

**Parameters**

-   `text`  
-   `encoding`  

## dontSeeInThisFile

Checks that file found by `seeFile` doesn't include text.

**Parameters**

-   `text`  
-   `encoding`  

## seeFile

Checks that file exists

**Parameters**

-   `name`  

## seeFileContentsEqual

Checks that contents of file found by `seeFile` equal to text.

**Parameters**

-   `text`  
-   `encoding`  

## seeInThisFile

Checks that file found by `seeFile` includes a text.

**Parameters**

-   `text`  
-   `encoding`  

## writeToFile

Writes test to file

**Parameters**

-   `name`  
-   `text`  

# WebDriverIO

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

Attaches a file to element located by CSS or XPath

**Parameters**

-   `locator`  
-   `pathToFile`  

## checkOption

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

Opposite to `see`. Checks that a text is not present on a page.
Use context parameter to narrow down the search.

```js
I.dontSee('Login'); // assume we are already logged in
```

**Parameters**

-   `text`  
-   `context`  

## dontSeeElement

Opposite to `seeElement`. Checks that element is not on page.

**Parameters**

-   `locator`  

## dontSeeInCurrentUrl

Checks that current url does not contain a provided fragment.

**Parameters**

-   `urlFragment`  

## doubleClick

Performs a double-click on an element matched by CSS or XPath.

**Parameters**

-   `locator`  

## executeAsyncScript

Executes async script on page.
Provided function should execute a passed callback (as first argument) to signal it is finished.

**Parameters**

-   `fn`  

## executeScript

Executes sync script on a page.
Pass arguments to function as additional parameters.
Will return execution result to a test. 
In this case you should use generator and yield to receive results.

**Parameters**

-   `fn`  

## fillField

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

Retrieves an attribute from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let hint = yield I.grabAttributeFrom('#tooltip', 'title');
```

**Parameters**

-   `locator`  
-   `attr`  

## grabTextFrom

Retrieves a text from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let pin = yield I.grabTextFrom('#pin');
```

**Parameters**

-   `locator`  

## grabTitle

Retrieves a page title and returns it to test. 
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let title = yield I.grabTitle();
```

## grabValueFrom

Retrieves a value from a form element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let email = yield I.grabValueFrom('input[name=email]');
```

**Parameters**

-   `locator`  

## see

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

Checks that element is present on page.
Element is located by CSS or XPath.

```js
I.seeElement('#modal');
```

**Parameters**

-   `locator`  

## seeInCurrentUrl

Checks that current url contains a provided fragment.

```js
I.seeInCurrentUrl('/register'); // we are on registration page
```

**Parameters**

-   `urlFragment`  

## seeInTitle

Checks that title contains text.

**Parameters**

-   `text`  

## selectOption

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

Pauses execution for a number of seconds.

**Parameters**

-   `sec`  

## waitForElement

Waits for element to be present on page (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `selector`  
-   `sec`  

## waitForEnabled

Waits for element to become enabled (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `selector`  
-   `sec`  

## waitForText

Waits for a text to appear (by default waits for 1sec).
Element can be located by CSS or XPath.
Narrow down search results by providing context.

**Parameters**

-   `text`  
-   `sec`  
-   `context`  

## waitForVisible

Waits for an element to become visible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `selector`  
-   `sec`  

## waitUntil

Waits for a function to return true (waits for 1sec by default).

**Parameters**

-   `fn`  
-   `sec`  
