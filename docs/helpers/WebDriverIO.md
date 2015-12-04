# WebDriverIO

[lib/helper/WebDriverIO.js:82-487](https://github.com/Codeception/CodeceptJS/blob/d8291463c033201c9ee70f96b4ef33137782c548/lib/helper/WebDriverIO.js#L82-L487 "Source code on GitHub")

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

 Connect through proxy

CodeceptJS also provides flexible options when you want to execute tests to Selenium servers through proxy. You will
need to update the `helpers.WebDriverIO.proxy` key.

```js
{
    "helpers": {
        "WebDriverIO": {
            "proxy": {
                "proxyType": "manual|pac",
                "proxyAutoconfigUrl": "URL TO PAC FILE",
                "httpProxy": "PROXY SERVER",
                "sslProxy": "PROXY SERVER",
                "ftpProxy": "PROXY SERVER",
                "socksProxy": "PROXY SERVER",
                "socksUsername": "USERNAME",
                "socksPassword": "PASSWORD",
                "noProxy": "BYPASS ADDRESSES"
            }
        }
    }
}
```

For example,

```js
{
    "helpers": {
        "WebDriverIO": {
            "proxy": {
                "proxyType": "manual",
                "httpProxy": "http://corporate.proxy:8080",
                "socksUsername": "codeceptjs",
                "socksPassword": "secret",
                "noProxy": "127.0.0.1,localhost"
            }
        }
    }
}
```

Please refer to [Selenium - Proxy Object](https://code.google.com/p/selenium/wiki/DesiredCapabilities#Proxy_JSON_Object) for more information.

**Parameters**

-   `config`  

## amOnPage

[lib/helper/WebDriverIO.js:120-124](https://github.com/Codeception/CodeceptJS/blob/d8291463c033201c9ee70f96b4ef33137782c548/lib/helper/WebDriverIO.js#L120-L124 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:240-242](https://github.com/Codeception/CodeceptJS/blob/d8291463c033201c9ee70f96b4ef33137782c548/lib/helper/WebDriverIO.js#L240-L242 "Source code on GitHub")

Attaches a file to element located by CSS or XPath

**Parameters**

-   `locator`  
-   `pathToFile`  

## checkOption

[lib/helper/WebDriverIO.js:255-271](https://github.com/Codeception/CodeceptJS/blob/d8291463c033201c9ee70f96b4ef33137782c548/lib/helper/WebDriverIO.js#L255-L271 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:149-162](https://github.com/Codeception/CodeceptJS/blob/d8291463c033201c9ee70f96b4ef33137782c548/lib/helper/WebDriverIO.js#L149-L162 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:361-363](https://github.com/Codeception/CodeceptJS/blob/d8291463c033201c9ee70f96b4ef33137782c548/lib/helper/WebDriverIO.js#L361-L363 "Source code on GitHub")

Opposite to `see`. Checks that a text is not present on a page.
Use context parameter to narrow down the search.

```js
I.dontSee('Login'); // assume we are already logged in
```

**Parameters**

-   `text`  
-   `context`  

## dontSeeElement

[lib/helper/WebDriverIO.js:382-386](https://github.com/Codeception/CodeceptJS/blob/d8291463c033201c9ee70f96b4ef33137782c548/lib/helper/WebDriverIO.js#L382-L386 "Source code on GitHub")

Opposite to `seeElement`. Checks that element is not on page.

**Parameters**

-   `locator`  

## dontSeeInCurrentUrl

[lib/helper/WebDriverIO.js:404-408](https://github.com/Codeception/CodeceptJS/blob/d8291463c033201c9ee70f96b4ef33137782c548/lib/helper/WebDriverIO.js#L404-L408 "Source code on GitHub")

Checks that current url does not contain a provided fragment.

**Parameters**

-   `urlFragment`  

## doubleClick

[lib/helper/WebDriverIO.js:167-169](https://github.com/Codeception/CodeceptJS/blob/d8291463c033201c9ee70f96b4ef33137782c548/lib/helper/WebDriverIO.js#L167-L169 "Source code on GitHub")

Performs a double-click on an element matched by CSS or XPath.

**Parameters**

-   `locator`  

## executeAsyncScript

[lib/helper/WebDriverIO.js:424-426](https://github.com/Codeception/CodeceptJS/blob/d8291463c033201c9ee70f96b4ef33137782c548/lib/helper/WebDriverIO.js#L424-L426 "Source code on GitHub")

Executes async script on page.
Provided function should execute a passed callback (as first argument) to signal it is finished.

**Parameters**

-   `fn`  

## executeScript

[lib/helper/WebDriverIO.js:416-418](https://github.com/Codeception/CodeceptJS/blob/d8291463c033201c9ee70f96b4ef33137782c548/lib/helper/WebDriverIO.js#L416-L418 "Source code on GitHub")

Executes sync script on a page.
Pass arguments to function as additional parameters.
Will return execution result to a test. 
In this case you should use generator and yield to receive results.

**Parameters**

-   `fn`  

## fillField

[lib/helper/WebDriverIO.js:186-194](https://github.com/Codeception/CodeceptJS/blob/d8291463c033201c9ee70f96b4ef33137782c548/lib/helper/WebDriverIO.js#L186-L194 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:309-313](https://github.com/Codeception/CodeceptJS/blob/d8291463c033201c9ee70f96b4ef33137782c548/lib/helper/WebDriverIO.js#L309-L313 "Source code on GitHub")

Retrieves an attribute from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let hint = yield I.grabAttributeFrom('#tooltip', 'title');
```

**Parameters**

-   `locator`  
-   `attr`  

## grabTextFrom

[lib/helper/WebDriverIO.js:281-285](https://github.com/Codeception/CodeceptJS/blob/d8291463c033201c9ee70f96b4ef33137782c548/lib/helper/WebDriverIO.js#L281-L285 "Source code on GitHub")

Retrieves a text from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let pin = yield I.grabTextFrom('#pin');
```

**Parameters**

-   `locator`  

## grabTitle

[lib/helper/WebDriverIO.js:332-337](https://github.com/Codeception/CodeceptJS/blob/d8291463c033201c9ee70f96b4ef33137782c548/lib/helper/WebDriverIO.js#L332-L337 "Source code on GitHub")

Retrieves a page title and returns it to test. 
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let title = yield I.grabTitle();
```

## grabValueFrom

[lib/helper/WebDriverIO.js:295-299](https://github.com/Codeception/CodeceptJS/blob/d8291463c033201c9ee70f96b4ef33137782c548/lib/helper/WebDriverIO.js#L295-L299 "Source code on GitHub")

Retrieves a value from a form element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let email = yield I.grabValueFrom('input[name=email]');
```

**Parameters**

-   `locator`  

## see

[lib/helper/WebDriverIO.js:349-351](https://github.com/Codeception/CodeceptJS/blob/d8291463c033201c9ee70f96b4ef33137782c548/lib/helper/WebDriverIO.js#L349-L351 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:373-377](https://github.com/Codeception/CodeceptJS/blob/d8291463c033201c9ee70f96b4ef33137782c548/lib/helper/WebDriverIO.js#L373-L377 "Source code on GitHub")

Checks that element is present on page.
Element is located by CSS or XPath.

```js
I.seeElement('#modal');
```

**Parameters**

-   `locator`  

## seeInCurrentUrl

[lib/helper/WebDriverIO.js:395-399](https://github.com/Codeception/CodeceptJS/blob/d8291463c033201c9ee70f96b4ef33137782c548/lib/helper/WebDriverIO.js#L395-L399 "Source code on GitHub")

Checks that current url contains a provided fragment.

```js
I.seeInCurrentUrl('/register'); // we are on registration page
```

**Parameters**

-   `urlFragment`  

## seeInTitle

[lib/helper/WebDriverIO.js:318-322](https://github.com/Codeception/CodeceptJS/blob/d8291463c033201c9ee70f96b4ef33137782c548/lib/helper/WebDriverIO.js#L318-L322 "Source code on GitHub")

Checks that title contains text.

**Parameters**

-   `text`  

## selectOption

[lib/helper/WebDriverIO.js:210-235](https://github.com/Codeception/CodeceptJS/blob/d8291463c033201c9ee70f96b4ef33137782c548/lib/helper/WebDriverIO.js#L210-L235 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:431-433](https://github.com/Codeception/CodeceptJS/blob/d8291463c033201c9ee70f96b4ef33137782c548/lib/helper/WebDriverIO.js#L431-L433 "Source code on GitHub")

Pauses execution for a number of seconds.

**Parameters**

-   `sec`  

## waitForElement

[lib/helper/WebDriverIO.js:448-451](https://github.com/Codeception/CodeceptJS/blob/d8291463c033201c9ee70f96b4ef33137782c548/lib/helper/WebDriverIO.js#L448-L451 "Source code on GitHub")

Waits for element to be present on page (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `selector`  
-   `sec`  

## waitForEnabled

[lib/helper/WebDriverIO.js:439-442](https://github.com/Codeception/CodeceptJS/blob/d8291463c033201c9ee70f96b4ef33137782c548/lib/helper/WebDriverIO.js#L439-L442 "Source code on GitHub")

Waits for element to become enabled (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `selector`  
-   `sec`  

## waitForText

[lib/helper/WebDriverIO.js:458-469](https://github.com/Codeception/CodeceptJS/blob/d8291463c033201c9ee70f96b4ef33137782c548/lib/helper/WebDriverIO.js#L458-L469 "Source code on GitHub")

Waits for a text to appear (by default waits for 1sec).
Element can be located by CSS or XPath.
Narrow down search results by providing context.

**Parameters**

-   `text`  
-   `sec`  
-   `context`  

## waitForVisible

[lib/helper/WebDriverIO.js:475-478](https://github.com/Codeception/CodeceptJS/blob/d8291463c033201c9ee70f96b4ef33137782c548/lib/helper/WebDriverIO.js#L475-L478 "Source code on GitHub")

Waits for an element to become visible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `selector`  
-   `sec`  

## waitUntil

[lib/helper/WebDriverIO.js:483-486](https://github.com/Codeception/CodeceptJS/blob/d8291463c033201c9ee70f96b4ef33137782c548/lib/helper/WebDriverIO.js#L483-L486 "Source code on GitHub")

Waits for a function to return true (waits for 1sec by default).

**Parameters**

-   `fn`  
-   `sec`  
