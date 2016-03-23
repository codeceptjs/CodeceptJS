# WebDriverIO

[docs/build/WebDriverIO.js:160-1191](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L160-L1191 "Source code on GitHub")

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

[docs/build/WebDriverIO.js:268-270](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L268-L270 "Source code on GitHub")

Get elements by different locator types, including strict locator
Should be used in custom helpers:

```js
this.helpers['WebDriverIO']._locate({name: 'password'}).then //...
```

**Parameters**

-   `locator`  

## acceptPopup

[docs/build/WebDriverIO.js:999-1005](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L999-L1005 "Source code on GitHub")

Accepts the active JavaScript native popup window, as created by window.alert|window.confirm|window.prompt.
Don't confuse popups with modal windows, as created by [various libraries](http://jster.net/category/windows-modals-popups).

## amOnPage

[docs/build/WebDriverIO.js:284-289](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L284-L289 "Source code on GitHub")

Opens a web page in a browser. Requires relative or absolute url.
If url starts with `/`, opens a web page of a site defined in `url` config parameter.

```js
I.amOnPage('/'); // opens main page of website
I.amOnPage('https://github.com'); // opens github
I.amOnPage('/login'); // opens a login page
```

**Parameters**

-   `url`  url path or global url

## appendField

[docs/build/WebDriverIO.js:382-390](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L382-L390 "Source code on GitHub")

Appends text to a input field or textarea.
Field is located by name, label, CSS or XPath

```js
I.appendField('#myTextField', 'appended');
```

**Parameters**

-   `field`  located by label|name|CSS|XPath|strict locator
-   `value`  text value

## attachFile

[docs/build/WebDriverIO.js:482-495](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L482-L495 "Source code on GitHub")

Attaches a file to element located by label, name, CSS or XPath
Path to file is relative current codecept directory (where codecept.json is located).
File will be uploaded to remove system (if tests are running remotely).

```js
I.attachFile('Avatar', 'data/avatar.jpg');
I.attachFile('form input[name=avatar]', 'data/avatar.jpg');
```

**Parameters**

-   `field`  located by label|name|CSS|XPath|strict locator
-   `file`  local file path relative to codecept.json config file
-   `locator`  
-   `pathToFile`  

## cancelPopup

[docs/build/WebDriverIO.js:1010-1016](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L1010-L1016 "Source code on GitHub")

Dismisses the active JavaScript popup, as created by window.alert|window.confirm|window.prompt.

## checkOption

[docs/build/WebDriverIO.js:511-527](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L511-L527 "Source code on GitHub")

Selects a checkbox or radio button.
Element is located by label or name or CSS or XPath.

The second parameter is a context (CSS or XPath locator) to narrow the search.

```js
I.checkOption('#agree');
I.checkOption('I Agree to Terms and Conditions');
I.checkOption('agree', '//form');
```

**Parameters**

-   `field`  located by label|name|CSS|XPath|strict locator
-   `option`  
-   `context`  (optional) element located by CSS|XPath|strict locator

## clearCookie

[docs/build/WebDriverIO.js:940-942](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L940-L942 "Source code on GitHub")

Clears a cookie by name,
if none provided clears all cookies

```js
I.clearCookie();
I.clearCookie('test');
```

**Parameters**

-   `cookieName`  (optional)
-   `cookie`  

## clearField

[docs/build/WebDriverIO.js:952-954](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L952-L954 "Source code on GitHub")

Clears a `<textarea>` or text `<input>` element's value.

```js
I.clearField('#email');
```

**Parameters**

-   `field`  located by label|name|CSS|XPath|strict locator
-   `locator`  

## click

[docs/build/WebDriverIO.js:315-329](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L315-L329 "Source code on GitHub")

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

-   `locator`  link or button located by text, or any element located by CSS|XPath|strict locator
-   `link`  
-   `context`  

## dontSee

[docs/build/WebDriverIO.js:652-654](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L652-L654 "Source code on GitHub")

Opposite to `see`. Checks that a text is not present on a page.
Use context parameter to narrow down the search.

```js
I.dontSee('Login'); // assume we are already logged in
```

**Parameters**

-   `text`  is not present
-   `context`  (optional) element located by CSS|XPath|strict locator in which to perfrom search

## dontSeeCheckboxIsChecked

[docs/build/WebDriverIO.js:703-705](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L703-L705 "Source code on GitHub")

Verifies that the specified checkbox is not checked.

**Parameters**

-   `field`  located by label|name|CSS|XPath|strict locator

## dontSeeCookie

[docs/build/WebDriverIO.js:975-979](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L975-L979 "Source code on GitHub")

Checks that cookie with given name does not exist.

**Parameters**

-   `name`  

## dontSeeCurrentUrlEquals

[docs/build/WebDriverIO.js:847-851](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L847-L851 "Source code on GitHub")

Checks that current url is not equal to provided one.
If a relative url provided, a configured url will be prepended to it.

**Parameters**

-   `url`  
-   `uri`  

## dontSeeElement

[docs/build/WebDriverIO.js:727-731](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L727-L731 "Source code on GitHub")

Opposite to `seeElement`. Checks that element is not visible

**Parameters**

-   `element`  located by CSS|XPath|Strict locator
-   `locator`  

## dontSeeElementInDOM

[docs/build/WebDriverIO.js:753-757](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L753-L757 "Source code on GitHub")

Opposite to `seeElementInDOM`. Checks that element is not on page.

**Parameters**

-   `element`  located by CSS|XPath|Strict locator
-   `locator`  

## dontSeeInCurrentUrl

[docs/build/WebDriverIO.js:818-822](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L818-L822 "Source code on GitHub")

Checks that current url does not contain a provided fragment.

**Parameters**

-   `url`  
-   `urlFragment`  

## dontSeeInField

[docs/build/WebDriverIO.js:680-682](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L680-L682 "Source code on GitHub")

Checks that value of input field or textare doesn't equal to given value
Opposite to `seeInField`.

**Parameters**

-   `field`  located by label|name|CSS|XPath|strict locator
-   `value`  is not expected to be a field value

## dontSeeInSource

[docs/build/WebDriverIO.js:778-782](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L778-L782 "Source code on GitHub")

Checks that the current page contains the given string in its raw source code

**Parameters**

-   `string`  
-   `text`  

## dontSeeInTitle

[docs/build/WebDriverIO.js:605-609](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L605-L609 "Source code on GitHub")

Checks that title does not contain text.

**Parameters**

-   `text`  

## doubleClick

[docs/build/WebDriverIO.js:334-336](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L334-L336 "Source code on GitHub")

Performs a double-click on an element matched by CSS or XPath.

**Parameters**

-   `locator`  

## dragAndDrop

[docs/build/WebDriverIO.js:1081-1086](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L1081-L1086 "Source code on GitHub")

Drag an item to a destination element.

```js
I.dragAndDrop('#dragHandle', '#container');
```

**Parameters**

-   `srcElement`  
-   `destElement`  

## executeAsyncScript

[docs/build/WebDriverIO.js:871-873](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L871-L873 "Source code on GitHub")

Executes async script on page.
Provided function should execute a passed callback (as first argument) to signal it is finished.

**Parameters**

-   `script`  
-   `fn`  

## executeScript

[docs/build/WebDriverIO.js:861-863](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L861-L863 "Source code on GitHub")

Executes sync script on a page.
Pass arguments to function as additional parameters.
Will return execution result to a test.
In this case you should use generator and yield to receive results.

**Parameters**

-   `script`  
-   `fn`  

## fillField

[docs/build/WebDriverIO.js:362-370](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L362-L370 "Source code on GitHub")

Fills a text field or textarea, after clearing its value,  with the given string.
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

-   `field`  located by label|name|CSS|XPath|strict locator
-   `value`  

## grabAttributeFrom

[docs/build/WebDriverIO.js:583-587](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L583-L587 "Source code on GitHub")

Retrieves an attribute from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let hint = yield I.grabAttributeFrom('#tooltip', 'title');
```

**Parameters**

-   `element`  located by CSS|XPath|strict locator
-   `attribute`  
-   `locator`  
-   `attr`  

## grabCookie

[docs/build/WebDriverIO.js:991-993](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L991-L993 "Source code on GitHub")

Gets a cookie object by name
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let cookie = I.grabCookie('auth');
assert(cookie.value, '123456');
```

**Parameters**

-   `cookie`  
-   `name`  

## grabHTMLFrom

[docs/build/WebDriverIO.js:552-556](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L552-L556 "Source code on GitHub")

Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let postHTML = yield I.grabHTMLFrom('#post');
```

**Parameters**

-   `locator`  

## grabTextFrom

[docs/build/WebDriverIO.js:538-542](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L538-L542 "Source code on GitHub")

Retrieves a text from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let pin = yield I.grabTextFrom('#pin');
```

**Parameters**

-   `element`  located by CSS|XPath|strict locator
-   `locator`  

## grabTitle

[docs/build/WebDriverIO.js:619-624](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L619-L624 "Source code on GitHub")

Retrieves a page title and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let title = yield I.grabTitle();
```

## grabValueFrom

[docs/build/WebDriverIO.js:567-571](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L567-L571 "Source code on GitHub")

Retrieves a value from a form element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let email = yield I.grabValueFrom('input[name=email]');
```

**Parameters**

-   `field`  located by label|name|CSS|XPath|strict locator
-   `locator`  

## moveCursorTo

[docs/build/WebDriverIO.js:897-899](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L897-L899 "Source code on GitHub")

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

[docs/build/WebDriverIO.js:1049-1058](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L1049-L1058 "Source code on GitHub")

Presses a key on a focused element.
Speical keys like 'Enter', 'Control', [etc](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value)
will be replaced with corresponding unicode.
If modiferier key is used (Control, Command, Alt, Shift) in array, it will be released afterwards.

```js
I.pressKey('Enter');
I.pressKey(['Control','a']);
```

**Parameters**

-   `key`  To make combinations with modifier and mouse clicks (like Ctrl+Click) press a modifier, click, then release it.```js
    I.pressKey('Control');
    I.click('#someelement');
    I.pressKey('Control');
    ```

## resizeWindow

[docs/build/WebDriverIO.js:1067-1072](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L1067-L1072 "Source code on GitHub")

Resize the current window to provided width and height.
First parameter can be set to `maximize`

**Parameters**

-   `width`  
-   `height`  

## rightClick

[docs/build/WebDriverIO.js:341-343](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L341-L343 "Source code on GitHub")

Performs right click on an element matched by CSS or XPath.

**Parameters**

-   `locator`  

## saveScreenshot

[docs/build/WebDriverIO.js:910-914](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L910-L914 "Source code on GitHub")

Saves a screenshot to ouput folder (set in codecept.json).
Filename is relative to output folder.

```js
I.saveScreenshot('debug.png');
```

**Parameters**

-   `filename`  
-   `fileName`  

## scrollTo

[docs/build/WebDriverIO.js:884-886](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L884-L886 "Source code on GitHub")

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

[docs/build/WebDriverIO.js:638-640](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L638-L640 "Source code on GitHub")

Checks that a page contains a visible text.
Use context parameter to narrow down the search.

```js
I.see('Welcome'); // text welcome on a page
I.see('Welcome', '.content'); // text inside .content div
I.see('Register', {css: 'form.register'}); // use strict locator
```

**Parameters**

-   `text`  expected on page
-   `context`  (optional) element located by CSS|Xpath|strict locator in which to search for text

## seeCheckboxIsChecked

[docs/build/WebDriverIO.js:694-696](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L694-L696 "Source code on GitHub")

Verifies that the specified checkbox is checked.

```js
I.seeCheckboxIsChecked('Agree');
I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
```

**Parameters**

-   `field`  located by label|name|CSS|XPath|strict locator

## seeCookie

[docs/build/WebDriverIO.js:964-968](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L964-L968 "Source code on GitHub")

Checks that cookie with given name exists.

```js
I.seeCookie('Auth');
```

**Parameters**

-   `name`  

## seeCurrentUrlEquals

[docs/build/WebDriverIO.js:835-839](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L835-L839 "Source code on GitHub")

Checks that current url is equal to provided one.
If a relative url provided, a configured url will be prepended to it.
So both examples will work:

```js
I.seeCurrentUrlEquals('/register');
I.seeCurrentUrlEquals('http://my.site.com/register');
```

**Parameters**

-   `url`  
-   `uri`  

## seeElement

[docs/build/WebDriverIO.js:716-720](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L716-L720 "Source code on GitHub")

Checks that a given Element is visible
Element is located by CSS or XPath.

```js
I.seeElement('#modal');
```

**Parameters**

-   `located`  by CSS|XPath|strict locator
-   `locator`  

## seeElementInDOM

[docs/build/WebDriverIO.js:742-746](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L742-L746 "Source code on GitHub")

Checks that a given Element is present in the DOM
Element is located by CSS or XPath.

```js
I.seeElementInDOM('#modal');
```

**Parameters**

-   `element`  located by CSS|XPath|strict locator
-   `locator`  

## seeInCurrentUrl

[docs/build/WebDriverIO.js:807-811](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L807-L811 "Source code on GitHub")

Checks that current url contains a provided fragment.

```js
I.seeInCurrentUrl('/register'); // we are on registration page
```

**Parameters**

-   `url`  
-   `urlFragment`  

## seeInField

[docs/build/WebDriverIO.js:669-671](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L669-L671 "Source code on GitHub")

Checks that the given input field or textarea equals to given value.
For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.

```js
I.seeInField('Username', 'davert');
I.seeInField({css: 'form textarea'},'Type your comment here');
I.seeInField('form input[type=hidden]','hidden_value');
I.seeInField('#searchform input','Search');
```

**Parameters**

-   `field`  located by label|name|CSS|XPath|strict locator
-   `value`  

## seeInPopup

[docs/build/WebDriverIO.js:1021-1028](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L1021-L1028 "Source code on GitHub")

Checks that the active JavaScript popup, as created by `window.alert|window.confirm|window.prompt`, contains the given string.

**Parameters**

-   `text`  

## seeInSource

[docs/build/WebDriverIO.js:767-771](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L767-L771 "Source code on GitHub")

Checks that the current page contains the given string in its raw source code.

```js
I.seeInSource('<h1>Green eggs &amp; ham</h1>');
```

**Parameters**

-   `html`  
-   `text`  

## seeInTitle

[docs/build/WebDriverIO.js:594-598](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L594-L598 "Source code on GitHub")

Checks that title contains text.

**Parameters**

-   `text`  

## seeNumberOfElements

[docs/build/WebDriverIO.js:792-797](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L792-L797 "Source code on GitHub")

asserts that an element appears a given number of times in the DOM
Element is located by label or name or CSS or XPath.

```js
I.seeNumberOfElements('#submitBtn', 1);
```

**Parameters**

-   `selector`  
-   `num`  

## selectOption

[docs/build/WebDriverIO.js:420-468](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L420-L468 "Source code on GitHub")

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

**Parameters**

-   `field`  located by label|name|CSS|XPath|strict locator
-   `value`  Provide an array for the second argument to select multiple options.```js
    I.selectOption('Which OS do you use?', ['Andriod', 'OSX']);
    ```
-   `select`  
-   `option`  

## setCookie

[docs/build/WebDriverIO.js:926-928](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L926-L928 "Source code on GitHub")

Sets a cookie

```js
I.setCookie({name: 'auth', value: true});
```

**Parameters**

-   `cookie`  Uses Selenium's JSON [cookie format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).

## wait

[docs/build/WebDriverIO.js:1091-1093](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L1091-L1093 "Source code on GitHub")

Pauses execution for a number of seconds.

**Parameters**

-   `sec`  

## waitForElement

[docs/build/WebDriverIO.js:1119-1122](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L1119-L1122 "Source code on GitHub")

Waits for element to be present on page (by default waits for 1sec).
Element can be located by CSS or XPath.

```js
I.waitForElement('.btn.continue');
I.waitForElement('.btn.continue', 5); // wait for 5 secs
```

**Parameters**

-   `element`  located by CSS|XPath|strict locator
-   `time`  seconds to wait, 1 by default
-   `selector`  
-   `sec`  

## waitForEnabled

[docs/build/WebDriverIO.js:1102-1105](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L1102-L1105 "Source code on GitHub")

Waits for element to become enabled (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `element`  located by CSS|XPath|strict locator
-   `time`  seconds to wait, 1 by default
-   `selector`  
-   `sec`  

## waitForText

[docs/build/WebDriverIO.js:1138-1157](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L1138-L1157 "Source code on GitHub")

Waits for a text to appear (by default waits for 1sec).
Element can be located by CSS or XPath.
Narrow down search results by providing context.

```js
I.waitForText('Thank you, form has been submitted');
I.waitForText('Thank you, form has been submitted', 5, '#modal');
```

**Parameters**

-   `text`  to wait for
-   `time`  seconds to wait, 1 by default
-   `sec`  
-   `context`  element located by CSS|XPath|strict locator

## waitForVisible

[docs/build/WebDriverIO.js:1170-1173](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L1170-L1173 "Source code on GitHub")

Waits for an element to become visible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

    I.waitForVisible('#popup');

**Parameters**

-   `element`  located by CSS|XPath|strict locator
-   `time`  seconds to wait, 1 by default
-   `selector`  
-   `sec`  

## waitToHide

[docs/build/WebDriverIO.js:1179-1182](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L1179-L1182 "Source code on GitHub")

Waits for an element to become invisible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `selector`  
-   `sec`  

## waitUntil

[docs/build/WebDriverIO.js:1187-1190](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/WebDriverIO.js#L1187-L1190 "Source code on GitHub")

Waits for a function to return true (waits for 1sec by default).

**Parameters**

-   `fn`  
-   `sec`  
