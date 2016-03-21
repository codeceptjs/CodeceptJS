# WebDriverIO

[lib/helper/WebDriverIO.js:160-871](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L160-L871 "Source code on GitHub")

**Extends Helper**

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
-   `windowSize`: (optional) default window size. Set to `maximize` or a dimension in the format `640x480`.
-   `waitForTimeout`: (optional) sets default wait time in _ms_ for all `wait*` functions. 1000 by default;

Additional configuration params can be used from <http://webdriver.io/guide/getstarted/configuration.html>

### Connect through proxy

CodeceptJS also provides flexible options when you want to execute tests to Selenium servers through proxy. You will
need to update the `helpers.WebDriverIO.desiredCapabilities.proxy` key.

```js
{
    "helpers": {
        "WebDriverIO": {
            "desiredCapabilities": {
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
}
```

For example,

```js
{
    "helpers": {
        "WebDriverIO": {
            "desiredCapabilities": {
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
}
```

Please refer to [Selenium - Proxy Object](https://code.google.com/p/selenium/wiki/DesiredCapabilities#Proxy_JSON_Object) for more information.

## Cloud Providers

WebDriverIO makes it possible to execute tests against services like `Sauce Labs` `BrowserStack` `TestingBot`
Check out their documentation on [available parameters](http://webdriver.io/guide/testrunner/cloudservices.html)

Connecting to `BrowserStack` and `Sauce Labs` is simple. All you need to do
is set the `user` and `key` parameters. WebDriverIO authomatically know which
service provider to connect to.

```js
{
    "helpers":{
        "WebDriverIO": {
            "url": "YOUR_DESIERED_HOST",
            "user": "YOUR_BROWSERSTACK_USER",
            "key": "YOUR_BROWSERSTACK_KEY",
            "desiredCapabilities": {
                "browserName": "chrome",

                // only set this if you're using BrowserStackLocal to test a local domain
                // "browserstack.local": true,

                // set this option to tell browserstack to provide addition debugging info
                // "browserstack.debug": true,
            }
        }
    }
}
```

## Multiremote Capabilities

This is a work in progress but you can control two browsers at a time right out of the box.
Individual control is something that is planned for a later version.

Here is the [webdriverio docs](http://webdriver.io/guide/usage/multiremote.html) on the subject

```js
{
    "helpers": {
        "WebDriverIO": {
            "multiremote": {
                "MyChrome": {
                    "desiredCapabilities": {
                        "browserName": "chrome"
                     }
                },
                "MyFirefox": {
                   "desiredCapabilities": {
                       "browserName": "firefox"
                   }
                }
            }
        }
    }
}
```

## Access From Helpers

Receive a WebDriverIO client from a custom helper by accessing `browser` property:

```js
this.helpers['WebDriverIO'].browser
```

## \_locate

[lib/helper/WebDriverIO.js:269-271](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L269-L271 "Source code on GitHub")

Get elements by different locator types, including strict locator
Should be used in custom helpers:

```js
this.helpers['WebDriverIO']._locate({name: 'password'}).then //...
```

**Parameters**

-   `locator`  

## acceptPopup

[lib/helper/WebDriverIO.js:737-743](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L737-L743 "Source code on GitHub")

Accepts the active JavaScript native popup window, as created by window.alert|window.confirm|window.prompt.
Don't confuse popups with modal windows, as created by [various libraries](http://jster.net/category/windows-modals-popups).

## amOnPage

[lib/helper/WebDriverIO.js:276-281](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L276-L281 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:332-340](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L332-L340 "Source code on GitHub")

Appends text to a input field or textarea.
Field is located by name, label, CSS or XPath

```js
I.appendField('#myTextField', 'appended');
```

**Parameters**

-   `field`  
-   `value`  

## attachFile

[lib/helper/WebDriverIO.js:404-417](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L404-L417 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:748-754](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L748-L754 "Source code on GitHub")

Dismisses the active JavaScript popup, as created by window.alert|window.confirm|window.prompt.

## checkOption

[lib/helper/WebDriverIO.js:422-438](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L422-L438 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:697-699](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L697-L699 "Source code on GitHub")

Clears a cookie by name,
if none provided clears all cookies

```js
I.clearCookie();
I.clearCookie('test');
```

**Parameters**

-   `cookie`  

## clearField

[lib/helper/WebDriverIO.js:704-706](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L704-L706 "Source code on GitHub")

Clears a <textarea> or text <input> element’s value.

```js
I.clearField('#email');
```

**Parameters**

-   `locator`  

## click

[lib/helper/WebDriverIO.js:286-300](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L286-L300 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:519-521](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L519-L521 "Source code on GitHub")

Opposite to `see`. Checks that a text is not present on a page.
Use context parameter to narrow down the search.

```js
I.dontSee('Login'); // assume we are already logged in
```

**Parameters**

-   `text`  
-   `context`  

## dontSeeCheckboxIsChecked

[lib/helper/WebDriverIO.js:547-549](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L547-L549 "Source code on GitHub")

 Verifies that the specified checkbox is not checked.
 
**Parameters**

-   `field`  

## dontSeeCookie

[lib/helper/WebDriverIO.js:720-724](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L720-L724 "Source code on GitHub")

Checks that cookie with given name does not exist.

**Parameters**

-   `name`  

## dontSeeCurrentUrlEquals

[lib/helper/WebDriverIO.js:632-636](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L632-L636 "Source code on GitHub")

Checks that current url is not equal to provided one.
If a relative url provided, a configured url will be prepended to it.

**Parameters**

-   `uri`  

## dontSeeElement

[lib/helper/WebDriverIO.js:563-567](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L563-L567 "Source code on GitHub")

Opposite to `seeElement`. Checks that element is not on page.

**Parameters**

-   `locator`  

## dontSeeInCurrentUrl

[lib/helper/WebDriverIO.js:614-618](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L614-L618 "Source code on GitHub")

Checks that current url does not contain a provided fragment.

**Parameters**

-   `urlFragment`  

## dontSeeInField

[lib/helper/WebDriverIO.js:533-535](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L533-L535 "Source code on GitHub")

Checks that value of input field or textare doesn't equal to given value
Opposite to `seeInField`.

**Parameters**

-   `field`  
-   `value`  

## dontSeeInSource

[lib/helper/WebDriverIO.js:581-585](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L581-L585 "Source code on GitHub")

Checks that the current page contains the given string in its raw source code
**Parameters**

-   `text`  

## dontSeeInTitle

[lib/helper/WebDriverIO.js:493-497](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L493-L497 "Source code on GitHub")

Checks that title does not contain text.
**Parameters**

-   `text`  

## doubleClick

[lib/helper/WebDriverIO.js:305-307](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L305-L307 "Source code on GitHub")

Performs a double-click on an element matched by CSS or XPath.

**Parameters**

-   `locator`  

## executeAsyncScript

[lib/helper/WebDriverIO.js:648-650](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L648-L650 "Source code on GitHub")

Executes async script on page.
Provided function should execute a passed callback (as first argument) to signal it is finished.

**Parameters**

-   `fn`  

## executeScript

[lib/helper/WebDriverIO.js:641-643](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L641-L643 "Source code on GitHub")

Executes sync script on a page.
Pass arguments to function as additional parameters.
Will return execution result to a test.
In this case you should use generator and yield to receive results.

**Parameters**

-   `fn`  

## fillField

[lib/helper/WebDriverIO.js:319-327](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L319-L327 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:475-479](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L475-L479 "Source code on GitHub")

Retrieves an attribute from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let hint = yield I.grabAttributeFrom('#tooltip', 'title');
```

**Parameters**

-   `locator`  
-   `attr`  

## grabCookie

[lib/helper/WebDriverIO.js:729-731](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L729-L731 "Source code on GitHub")

Gets a cookie object by name
* Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let cookie = I.grabCookie('auth');
assert(cookie.value, '123456');
```
**Parameters**

-   `name`  

## grabHTMLFrom

[lib/helper/WebDriverIO.js:457-461](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L457-L461 "Source code on GitHub")

Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let postHTML = yield I.grabHTMLFrom('#post');
```

**Parameters**

-   `locator`  

## grabTextFrom

[lib/helper/WebDriverIO.js:443-447](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L443-L447 "Source code on GitHub")

Retrieves a text from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let pin = yield I.grabTextFrom('#pin');
```

**Parameters**

-   `locator`  

## grabTitle

[lib/helper/WebDriverIO.js:502-507](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L502-L507 "Source code on GitHub")

Retrieves a page title and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let title = yield I.grabTitle();
```

## grabValueFrom

[lib/helper/WebDriverIO.js:466-470](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L466-L470 "Source code on GitHub")

Retrieves a value from a form element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let email = yield I.grabValueFrom('input[name=email]');
```

**Parameters**

-   `locator`  

## moveCursorTo

[lib/helper/WebDriverIO.js:674-676](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L674-L676 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:779-788](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L779-L788 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:793-798](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L793-L798 "Source code on GitHub")

Resize the current window to provided width and height.
First parameter can be set to `maximize`

**Parameters**

-   `width`  
-   `height`  

## rightClick

[lib/helper/WebDriverIO.js:312-314](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L312-L314 "Source code on GitHub")

Performs right click on an element matched by CSS or XPath.

**Parameters**

-   `locator`  

## saveScreenshot

[lib/helper/WebDriverIO.js:681-683](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L681-L683 "Source code on GitHub")

Saves a screenshot to ouput folder (set in codecept.json).
Filename is relative to output folder.

```js
I.saveScreenshot('debug.png');
```

**Parameters**

-   `fileName`  

## scrollTo

[lib/helper/WebDriverIO.js:661-663](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L661-L663 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:512-514](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L512-L514 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:540-542](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L540-L542 "Source code on GitHub")

Verifies that the specified checkbox is checked.

```js
I.seeCheckboxIsChecked('Agree');
I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
```

**Parameters**

-   `field`  

## seeCookie

[lib/helper/WebDriverIO.js:711-715](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L711-L715 "Source code on GitHub")

Checks that cookie with given name exists.

```js
I.seeCookie('Auth');
```
**Parameters**

-   `name`  

## seeCurrentUrlEquals

[lib/helper/WebDriverIO.js:623-627](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L623-L627 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:554-558](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L554-L558 "Source code on GitHub")

Checks that element is present on page.
Element is located by CSS or XPath.

```js
I.seeElement('#modal');
```

**Parameters**

-   `locator`  

## seeInCurrentUrl

[lib/helper/WebDriverIO.js:605-609](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L605-L609 "Source code on GitHub")

Checks that current url contains a provided fragment.

```js
I.seeInCurrentUrl('/register'); // we are on registration page
```

**Parameters**

-   `urlFragment`  

## seeInField

[lib/helper/WebDriverIO.js:526-528](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L526-L528 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:759-766](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L759-L766 "Source code on GitHub")

Checks that the active JavaScript popup, as created by `window.alert|window.confirm|window.prompt`, contains the given string.

**Parameters**

-   `text`  

## seeInSource

[lib/helper/WebDriverIO.js:572-576](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L572-L576 "Source code on GitHub")

Checks that the current page contains the given string in its raw source code.

```js
I.seeInSource('<h1>Green eggs &amp; ham</h1>');
```

**Parameters**

-   `text`  

## seeInTitle

[lib/helper/WebDriverIO.js:484-488](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L484-L488 "Source code on GitHub")

Checks that title contains text.

**Parameters**

-   `text`  

## seeNumberOfElements

[lib/helper/WebDriverIO.js:595-600](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L595-L600 "Source code on GitHub")

asserts that an element appears a given number of times in the DOM
Element is located by label or name or CSS or XPath.

```js
I.seeNumberOfElements('#submitBtn', 1);
```

**Parameters**

-   `selector`  
-   `num`  

## selectOption

[lib/helper/WebDriverIO.js:351-399](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L351-L399 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:690-692](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L690-L692 "Source code on GitHub")

Sets a cookie

```js
I.setCookie({name: 'auth', value: true});
```
Uses Selenium's JSON [cookie format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).

**Parameters**

-   `cookie`  

## wait

[lib/helper/WebDriverIO.js:803-805](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L803-L805 "Source code on GitHub")

Pauses execution for a number of seconds.

**Parameters**

-   `sec`  

## waitForElement

[lib/helper/WebDriverIO.js:818-821](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L818-L821 "Source code on GitHub")

 Waits for element to be present on page (by default waits for 1sec).
 Element can be located by CSS or XPath.
 
**Parameters**

-   `selector`  
-   `sec`  

## waitForEnabled

[lib/helper/WebDriverIO.js:810-813](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L810-L813 "Source code on GitHub")

Waits for element to become enabled (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `selector`  
-   `sec`  

## waitForText

[lib/helper/WebDriverIO.js:826-845](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L826-L845 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:850-853](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L850-L853 "Source code on GitHub")

Waits for an element to become visible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `selector`  
-   `sec`  

## waitToHide

[lib/helper/WebDriverIO.js:859-862](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L859-L862 "Source code on GitHub")

Waits for an element to become invisible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `selector`  
-   `sec`  

## waitUntil

[lib/helper/WebDriverIO.js:867-870](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/WebDriverIO.js#L867-L870 "Source code on GitHub")

Waits for a function to return true (waits for 1sec by default).

**Parameters**

-   `fn`  
-   `sec`  
