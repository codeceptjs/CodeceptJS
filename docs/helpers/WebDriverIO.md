# WebDriverIO

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:99-942](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L99-L942 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:98-760](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L98-L760 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

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
-   `window_size`: (optional) default window size. Set to `maximize` or a dimension in the format `640x480`.

Additional configuration params can be used from <http://webdriver.io/guide/getstarted/configuration.html>

### Connect through proxy

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

## Access From Helpers

Receive a WebDriverIO client from a custom helper by accessing `browser` property:

```js
this.helpers['WebDriverIO'].browser
```

**Parameters**

-   `config`  

## _locate

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:171-173](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L171-L173 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:170-172](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L170-L172 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Get elements by different locator types, including strict locator
Should be used in custom helpers:

```js
this.helpers['WebDriverIO']._locate({name: 'password'}).then //...
```

**Parameters**

-   `locator`  

## acceptPopup

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:788-794](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L788-L794 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:626-632](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L626-L632 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Accepts the active JavaScript native popup window, as created by window.alert|window.confirm|window.prompt.
Don't confuse popups with modal windows, as created by [various libraries](http://jster.net/category/windows-modals-popups).

## amOnPage

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:185-190](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L185-L190 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:177-182](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L177-L182 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Opens a web page in a browser. Requires relative or absolute url.
If url starts with `/`, opens a web page of a site defined in `url` config parameter.

```js
I.amOnPage('/'); // opens main page of website
I.amOnPage('https://github.com'); // opens github
I.amOnPage('/login'); // opens a login page
```

**Parameters**

-   `url`  

## appendField

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:278-286](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L278-L286 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:233-241](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L233-L241 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Appends text to a input field or textarea.
Field is located by name, label, CSS or XPath

```js
I.appendField('#myTextField', 'appended');
```

**Parameters**

-   `field`  
-   `value`  

## attachFile

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:368-381](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L368-L381 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:305-318](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L305-L318 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Attaches a file to element located by label, name, CSS or XPath
Path to file is relative current codecept directory (where codecept.json is located).
File will be uploaded to remove system (if tests are running remotely).

```js
I.attachFile('Avatar', 'data/avatar.jpg');
I.attachFile('form input[name=avatar]', 'data/avatar.jpg');
```

**Parameters**

-   `locator`  
-   `pathToFile`  

## cancelPopup

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:799-805](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L799-L805 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:637-643](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L637-L643 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Dismisses the active JavaScript popup, as created by window.alert|window.confirm|window.prompt.

## checkOption

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:397-413](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L397-L413 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:323-339](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L323-L339 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Selects a checkbox or radio button.
Element is located by label or name or CSS or XPath.

The second parameter is a context (CSS or XPath locator) to narrow the search.

```js
I.checkOption('#agree');
I.checkOption('I Agree to Terms and Conditions');
I.checkOption('agree', '//form');
```

**Parameters**

-   `option`  
-   `context`  

## clearCookie

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:745-747](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L745-L747 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:583-585](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L583-L585 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Clears a cookie by name,
if none provided clears all cookies

```js
I.clearCookie();
I.clearCookie('test');
```

**Parameters**

-   `cookie`  

## click

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:215-229](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L215-L229 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:187-201](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L187-L201 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

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

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:512-514](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L512-L514 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:406-408](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L406-L408 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Opposite to `see`. Checks that a text is not present on a page.
Use context parameter to narrow down the search.

```js
I.dontSee('Login'); // assume we are already logged in
```

**Parameters**

-   `text`  
-   `context`  

## dontSeeCheckboxIsChecked

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:555-557](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L555-L557 "Source code on GitHub")

Verifies that the specified checkbox is not checked.
=======
[lib/helper/WebDriverIO.js:434-436](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L434-L436 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

 Verifies that the specified checkbox is not checked.
 
**Parameters**

-   `field`  

## dontSeeCookie

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:765-769](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L765-L769 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:603-607](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L603-L607 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Checks that cookie with given name does not exist.

**Parameters**

-   `name`  

## dontSeeCurrentUrlEquals

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:663-667](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L663-L667 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:505-509](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L505-L509 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Checks that current url is not equal to provided one.
If a relative url provided, a configured url will be prepended to it.

**Parameters**

-   `uri`  

## dontSeeElement

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:576-580](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L576-L580 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:450-454](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L450-L454 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Opposite to `seeElement`. Checks that element is not on page.

**Parameters**

-   `locator`  

## dontSeeInCurrentUrl

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:635-639](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L635-L639 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:487-491](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L487-L491 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Checks that current url does not contain a provided fragment.

**Parameters**

-   `urlFragment`  

## dontSeeInField

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:535-537](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L535-L537 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:420-422](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L420-L422 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Checks that value of input field or textare doesn't equal to given value
Opposite to `seeInField`.

**Parameters**

-   `field`  
-   `value`  

## dontSeeInSource

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:598-602](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L598-L602 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:468-472](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L468-L472 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Checks that the current page contains the given string in its raw source code
**Parameters**

-   `text`  

## dontSeeInTitle

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:469-473](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L469-L473 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:380-384](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L380-L384 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Checks that title does not contain text.
**Parameters**

-   `text`  

## doubleClick

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:234-236](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L234-L236 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:206-208](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L206-L208 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Performs a double-click on an element matched by CSS or XPath.

**Parameters**

-   `locator`  

## executeAsyncScript

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:683-685](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L683-L685 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:521-523](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L521-L523 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Executes async script on page.
Provided function should execute a passed callback (as first argument) to signal it is finished.

**Parameters**

-   `fn`  

## executeScript

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:675-677](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L675-L677 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:514-516](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L514-L516 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Executes sync script on a page.
Pass arguments to function as additional parameters.
Will return execution result to a test.
In this case you should use generator and yield to receive results.

**Parameters**

-   `fn`  

## fillField

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:260-268](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L260-L268 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:220-228](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L220-L228 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

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

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:451-455](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L451-L455 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:362-366](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L362-L366 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Retrieves an attribute from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let hint = yield I.grabAttributeFrom('#tooltip', 'title');
```

**Parameters**

-   `locator`  
-   `attr`  

## grabCookie

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:780-782](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L780-L782 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:618-620](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L618-L620 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Gets a cookie object by name

-   Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let cookie = I.grabCookie('auth');
assert(cookie.value, '123456');
```

**Parameters**

-   `name`  

## grabTextFrom

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:423-427](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L423-L427 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:344-348](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L344-L348 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Retrieves a text from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let pin = yield I.grabTextFrom('#pin');
```

**Parameters**

-   `locator`  

## grabTitle

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:483-488](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L483-L488 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:389-394](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L389-L394 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Retrieves a page title and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let title = yield I.grabTitle();
```

## grabValueFrom

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:437-441](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L437-L441 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:353-357](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L353-L357 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Retrieves a value from a form element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let email = yield I.grabValueFrom('input[name=email]');
```

**Parameters**

-   `locator`  

## moveCursorTo

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:709-711](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L709-L711 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:547-549](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L547-L549 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Moves cursor to element matched by locator.
Extra shift can be set with offsetX and offsetY options

```js
I.moveCursorTo('.tooltip');
I.moveCursorTo('#submit', 5,5);
```

**Parameters**

-   `locator`  
-   `offsetX`  
-   `offsetY`  

## pressKey

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:839-848](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L839-L848 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:677-686](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L677-L686 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Presses a key on a focused element.
Speical keys like 'Enter', 'Control', [etc](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value)
will be replaced with corresponding unicode.

If modiferier key is used (Control, Command, Alt, Shift) in array, it will be released afterwards.

```js
I.pressKey('Enter');
I.pressKey(['Control','a']);
```

To make combinations with modifier and mouse clicks (like Ctrl+Click) press a modifier, click, then release it.

```js
I.pressKey('Control');
I.click('#someelement');
I.pressKey('Control');
```

**Parameters**

-   `key`  

## resizeWindow

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:854-859](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L854-L859 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:691-696](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L691-L696 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Resize the current window to provided width and height.
First parameter can be set to `maximize`

**Parameters**

-   `width`  
-   `height`  

## rightClick

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:241-243](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L241-L243 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:213-215](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L213-L215 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Performs right click on an element matched by CSS or XPath.

**Parameters**

-   `locator`  

## saveScreenshot

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:721-723](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L721-L723 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:559-561](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L559-L561 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Saves a screenshot to ouput folder (set in codecept.json).
Filename is relative to output folder.

```js
I.saveScreenshot('debug.png');
```

**Parameters**

-   `fileName`  

## scrollTo

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:696-698](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L696-L698 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:534-536](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L534-L536 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Scrolls to element matched by locator.
Extra shift can be set with offsetX and offsetY options

```js
I.scrollTo('footer');
I.scrollTo('#submit', 5,5);
```

**Parameters**

-   `locator`  
-   `offsetX`  
-   `offsetY`  

## see

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:500-502](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L500-L502 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:399-401](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L399-L401 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

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

## seeCheckboxIsChecked

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:548-550](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L548-L550 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:427-429](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L427-L429 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Verifies that the specified checkbox is checked.

```js
I.seeCheckboxIsChecked('Agree');
I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
```

**Parameters**

-   `field`  

## seeCookie

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:756-760](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L756-L760 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:594-598](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L594-L598 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Checks that cookie with given name exists.

```js
I.seeCookie('Auth');
```

**Parameters**

-   `name`  

## seeCurrentUrlEquals

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:653-657](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L653-L657 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:496-500](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L496-L500 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Checks that current url is equal to provided one.
If a relative url provided, a configured url will be prepended to it.
So both examples will work:

```js
I.seeCurrentUrlEquals('/register');
I.seeCurrentUrlEquals('http://my.site.com/register');
```

**Parameters**

-   `uri`  

## seeElement

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:567-571](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L567-L571 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:441-445](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L441-L445 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Checks that element is present on page.
Element is located by CSS or XPath.

```js
I.seeElement('#modal');
```

**Parameters**

-   `locator`  

## seeInCurrentUrl

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:626-630](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L626-L630 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:478-482](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L478-L482 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Checks that current url contains a provided fragment.

```js
I.seeInCurrentUrl('/register'); // we are on registration page
```

**Parameters**

-   `urlFragment`  

## seeInField

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:527-529](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L527-L529 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:413-415](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L413-L415 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Checks that the given input field or textarea equals to given value.
For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.

```js
I.seeInField('Username', 'davert');
I.seeInField({css: 'form textarea'},'Type your comment here');
I.seeInField('form input[type=hidden]','hidden_value');
I.seeInField('#searchform input','Search');
```

**Parameters**

-   `field`  
-   `value`  

## seeInPopup

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:810-817](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L810-L817 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:648-655](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L648-L655 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Checks that the active JavaScript popup, as created by `window.alert|window.confirm|window.prompt`, contains the given string.

**Parameters**

-   `text`  

## seeInSource

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:589-593](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L589-L593 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:459-463](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L459-L463 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Checks that the current page contains the given string in its raw source code.

```js
I.seeInSource('<h1>Green eggs &amp; ham</h1>');
```

**Parameters**

-   `text`  

## seeInTitle

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:460-464](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L460-L464 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:371-375](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L371-L375 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Checks that title contains text.

**Parameters**

-   `text`  

## seeNumberOfElements

[lib/helper/WebDriverIO.js:612-617](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L612-L617 "Source code on GitHub")

asserts that an element appears a given number of times in the DOM
Element is located by label or name or CSS or XPath.

```js
I.seeNumberOfElements('#submitBtn', 1);
```

**Parameters**

-   `selector`  
-   `num`  

## selectOption

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:308-356](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L308-L356 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:252-300](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L252-L300 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

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

Provide an array for the second argument to select multiple options.

```js
I.selectOption('Which OS do you use?', ['Andriod', 'OSX']);
```

Provide an array for the second argument to select multiple options.

```js
I.selectOption('Which OS do you use?', ['Andriod', 'OSX']);
```

**Parameters**

-   `select`  
-   `option`  

## setCookie

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:732-734](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L732-L734 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:570-572](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L570-L572 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Sets a [cookie](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object) object

```js
I.setCookie({name: 'auth', value: true});
```

**Parameters**

-   `cookie`  

## wait

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:864-866](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L864-L866 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:701-703](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L701-L703 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Pauses execution for a number of seconds.

**Parameters**

-   `sec`  

## waitForElement

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:881-884](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L881-L884 "Source code on GitHub")

Waits for element to be present on page (by default waits for 1sec).
Element can be located by CSS or XPath.
=======
[lib/helper/WebDriverIO.js:716-719](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L716-L719 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

 Waits for element to be present on page (by default waits for 1sec).
 Element can be located by CSS or XPath.
 
**Parameters**

-   `selector`  
-   `sec`  

## waitForEnabled

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:872-875](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L872-L875 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:708-711](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L708-L711 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Waits for element to become enabled (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `selector`  
-   `sec`  

## waitForText

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:896-915](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L896-L915 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:724-743](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L724-L743 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

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

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:921-924](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L921-L924 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:748-751](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L748-L751 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Waits for an element to become visible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `selector`  
-   `sec`  

## waitToHide

[lib/helper/WebDriverIO.js:930-933](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L930-L933 "Source code on GitHub")

Waits for an element to become invisible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `selector`  
-   `sec`  

## waitUntil

<<<<<<< HEAD
[lib/helper/WebDriverIO.js:938-941](https://github.com/Codeception/CodeceptJS/blob/9b1ae95dec15055e27362833c6510cff045b8e17/lib/helper/WebDriverIO.js#L938-L941 "Source code on GitHub")
=======
[lib/helper/WebDriverIO.js:756-759](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebDriverIO.js#L756-L759 "Source code on GitHub")
>>>>>>> 49b583e... moved shared method docs to snippets

Waits for a function to return true (waits for 1sec by default).

**Parameters**

-   `fn`  
-   `sec`  
