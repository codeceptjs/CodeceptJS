# WebDriverIO

[lib/helper/WebDriverIO.js:160-863](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L160-L863 "Source code on GitHub")

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

**Parameters**

-   `config`  

## _locate

[lib/helper/WebDriverIO.js:259-261](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L259-L261 "Source code on GitHub")

Get elements by different locator types, including strict locator
Should be used in custom helpers:

```js
this.helpers['WebDriverIO']._locate({name: 'password'}).then //...
```

**Parameters**

-   `locator`  

## acceptPopup

[lib/helper/WebDriverIO.js:720-726](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L720-L726 "Source code on GitHub")

Accepts the active JavaScript native popup window, as created by window.alert|window.confirm|window.prompt.
Don't confuse popups with modal windows, as created by [various libraries](http://jster.net/category/windows-modals-popups).

## amOnPage

[lib/helper/WebDriverIO.js:266-271](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L266-L271 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:322-330](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L322-L330 "Source code on GitHub")

Appends text to a input field or textarea.
Field is located by name, label, CSS or XPath

```js
I.appendField('#myTextField', 'appended');
```

**Parameters**

-   `field`  
-   `value`  

## attachFile

[lib/helper/WebDriverIO.js:394-407](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L394-L407 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:731-737](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L731-L737 "Source code on GitHub")

Dismisses the active JavaScript popup, as created by window.alert|window.confirm|window.prompt.

## checkOption

[lib/helper/WebDriverIO.js:412-428](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L412-L428 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:687-689](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L687-L689 "Source code on GitHub")

Clears a cookie by name,
if none provided clears all cookies

```js
I.clearCookie();
I.clearCookie('test');
```

**Parameters**

-   `cookie`  

## click

[lib/helper/WebDriverIO.js:276-290](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L276-L290 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:509-511](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L509-L511 "Source code on GitHub")

Opposite to `see`. Checks that a text is not present on a page.
Use context parameter to narrow down the search.

```js
I.dontSee('Login'); // assume we are already logged in
```

**Parameters**

-   `text`  
-   `context`  

## dontSeeCheckboxIsChecked

[lib/helper/WebDriverIO.js:537-539](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L537-L539 "Source code on GitHub")

 Verifies that the specified checkbox is not checked.
 
**Parameters**

-   `field`  

## dontSeeCookie

[lib/helper/WebDriverIO.js:703-707](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L703-L707 "Source code on GitHub")

Checks that cookie with given name does not exist.
**Parameters**

-   `name`  

## dontSeeCurrentUrlEquals

[lib/helper/WebDriverIO.js:622-626](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L622-L626 "Source code on GitHub")

Checks that current url is not equal to provided one.
If a relative url provided, a configured url will be prepended to it.

**Parameters**

-   `uri`  

## dontSeeElement

[lib/helper/WebDriverIO.js:553-557](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L553-L557 "Source code on GitHub")

Opposite to `seeElement`. Checks that element is not on page.

**Parameters**

-   `locator`  

## dontSeeInCurrentUrl

[lib/helper/WebDriverIO.js:604-608](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L604-L608 "Source code on GitHub")

Checks that current url does not contain a provided fragment.

**Parameters**

-   `urlFragment`  

## dontSeeInField

[lib/helper/WebDriverIO.js:523-525](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L523-L525 "Source code on GitHub")

Checks that value of input field or textare doesn't equal to given value
Opposite to `seeInField`.

**Parameters**

-   `field`  
-   `value`  

## dontSeeInSource

[lib/helper/WebDriverIO.js:571-575](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L571-L575 "Source code on GitHub")

Checks that the current page contains the given string in its raw source code
**Parameters**

-   `text`  

## dontSeeInTitle

[lib/helper/WebDriverIO.js:483-487](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L483-L487 "Source code on GitHub")

Checks that title does not contain text.
**Parameters**

-   `text`  

## doubleClick

[lib/helper/WebDriverIO.js:295-297](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L295-L297 "Source code on GitHub")

Performs a double-click on an element matched by CSS or XPath.

**Parameters**

-   `locator`  

## executeAsyncScript

[lib/helper/WebDriverIO.js:638-640](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L638-L640 "Source code on GitHub")

Executes async script on page.
Provided function should execute a passed callback (as first argument) to signal it is finished.

**Parameters**

-   `fn`  

## executeScript

[lib/helper/WebDriverIO.js:631-633](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L631-L633 "Source code on GitHub")

Executes sync script on a page.
Pass arguments to function as additional parameters.
Will return execution result to a test.
In this case you should use generator and yield to receive results.

**Parameters**

-   `fn`  

## fillField

[lib/helper/WebDriverIO.js:309-317](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L309-L317 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:465-469](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L465-L469 "Source code on GitHub")

Retrieves an attribute from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let hint = yield I.grabAttributeFrom('#tooltip', 'title');
```

**Parameters**

-   `locator`  
-   `attr`  

## grabCookie

[lib/helper/WebDriverIO.js:712-714](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L712-L714 "Source code on GitHub")

Gets a cookie object by name
* Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let cookie = I.grabCookie('auth');
assert(cookie.value, '123456');
```
**Parameters**

-   `name`  

## grabHTMLFrom

[lib/helper/WebDriverIO.js:447-451](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L447-L451 "Source code on GitHub")

Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let postHTML = yield I.grabHTMLFrom('#post');
```

**Parameters**

-   `locator`  

## grabTextFrom

[lib/helper/WebDriverIO.js:433-437](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L433-L437 "Source code on GitHub")

Retrieves a text from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let pin = yield I.grabTextFrom('#pin');
```

**Parameters**

-   `locator`  

## grabTitle

[lib/helper/WebDriverIO.js:492-497](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L492-L497 "Source code on GitHub")

Retrieves a page title and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let title = yield I.grabTitle();
```

## grabValueFrom

[lib/helper/WebDriverIO.js:456-460](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L456-L460 "Source code on GitHub")

Retrieves a value from a form element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let email = yield I.grabValueFrom('input[name=email]');
```

**Parameters**

-   `locator`  

## moveCursorTo

[lib/helper/WebDriverIO.js:664-666](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L664-L666 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:771-780](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L771-L780 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:785-790](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L785-L790 "Source code on GitHub")

Resize the current window to provided width and height.
First parameter can be set to `maximize`

**Parameters**

-   `width`  
-   `height`  

## rightClick

[lib/helper/WebDriverIO.js:302-304](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L302-L304 "Source code on GitHub")

Performs right click on an element matched by CSS or XPath.

**Parameters**

-   `locator`  

## saveScreenshot

[lib/helper/WebDriverIO.js:671-673](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L671-L673 "Source code on GitHub")

Saves a screenshot to ouput folder (set in codecept.json).
Filename is relative to output folder.

```js
I.saveScreenshot('debug.png');
```

**Parameters**

-   `fileName`  

## scrollTo

[lib/helper/WebDriverIO.js:651-653](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L651-L653 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:502-504](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L502-L504 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:530-532](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L530-L532 "Source code on GitHub")

Verifies that the specified checkbox is checked.

```js
I.seeCheckboxIsChecked('Agree');
I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
```

**Parameters**

-   `field`  

## seeCookie

[lib/helper/WebDriverIO.js:694-698](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L694-L698 "Source code on GitHub")

Checks that cookie with given name exists.

```js
I.seeCookie('Auth');
```
**Parameters**

-   `name`  

## seeCurrentUrlEquals

[lib/helper/WebDriverIO.js:613-617](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L613-L617 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:544-548](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L544-L548 "Source code on GitHub")

Checks that element is present on page.
Element is located by CSS or XPath.

```js
I.seeElement('#modal');
```

**Parameters**

-   `locator`  

## seeInCurrentUrl

[lib/helper/WebDriverIO.js:595-599](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L595-L599 "Source code on GitHub")

Checks that current url contains a provided fragment.

```js
I.seeInCurrentUrl('/register'); // we are on registration page
```

**Parameters**

-   `urlFragment`  

## seeInField

[lib/helper/WebDriverIO.js:516-518](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L516-L518 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:742-749](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L742-L749 "Source code on GitHub")

Checks that the active JavaScript popup, as created by `window.alert|window.confirm|window.prompt`, contains the given string.

**Parameters**

-   `text`  

## seeInSource

[lib/helper/WebDriverIO.js:562-566](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L562-L566 "Source code on GitHub")

Checks that the current page contains the given string in its raw source code.

```js
I.seeInSource('<h1>Green eggs &amp; ham</h1>');
```

**Parameters**

-   `text`  

## seeInTitle

[lib/helper/WebDriverIO.js:474-478](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L474-L478 "Source code on GitHub")

Checks that title contains text.

**Parameters**

-   `text`  

## seeNumberOfElements

[lib/helper/WebDriverIO.js:585-590](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L585-L590 "Source code on GitHub")

asserts that an element appears a given number of times in the DOM
Element is located by label or name or CSS or XPath.

```js
I.seeNumberOfElements('#submitBtn', 1);
```

**Parameters**

-   `selector`  
-   `num`  

## selectOption

[lib/helper/WebDriverIO.js:341-389](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L341-L389 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:680-682](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L680-L682 "Source code on GitHub")

Sets a cookie

```js
I.setCookie({name: 'auth', value: true});
```
Uses Selenium's JSON [cookie format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).

**Parameters**

-   `cookie`  

## wait

[lib/helper/WebDriverIO.js:795-797](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L795-L797 "Source code on GitHub")

Pauses execution for a number of seconds.

**Parameters**

-   `sec`  

## waitForElement

[lib/helper/WebDriverIO.js:810-813](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L810-L813 "Source code on GitHub")

 Waits for element to be present on page (by default waits for 1sec).
 Element can be located by CSS or XPath.
 
**Parameters**

-   `selector`  
-   `sec`  

## waitForEnabled

[lib/helper/WebDriverIO.js:802-805](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L802-L805 "Source code on GitHub")

Waits for element to become enabled (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `selector`  
-   `sec`  

## waitForText

[lib/helper/WebDriverIO.js:818-837](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L818-L837 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:842-845](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L842-L845 "Source code on GitHub")

Waits for an element to become visible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `selector`  
-   `sec`  

## waitToHide

[lib/helper/WebDriverIO.js:851-854](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L851-L854 "Source code on GitHub")

Waits for an element to become invisible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `selector`  
-   `sec`  

## waitUntil

[lib/helper/WebDriverIO.js:859-862](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/WebDriverIO.js#L859-L862 "Source code on GitHub")

Waits for a function to return true (waits for 1sec by default).

**Parameters**

-   `fn`  
-   `sec`  
