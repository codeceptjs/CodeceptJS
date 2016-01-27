# WebDriverIO

[lib/helper/WebDriverIO.js:99-928](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L99-L928 "Source code on GitHub")

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

    this.helpers['WebDriverIO'].browser

**Parameters**

-   `config`  

## _locate

[lib/helper/WebDriverIO.js:171-173](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L171-L173 "Source code on GitHub")

Get elements by different locator types, including strict locator
Should be used in custom helpers:

```js
this.helpers['WebDriverIO']._locate({name: 'password'}).then //...
```

**Parameters**

-   `locator`  

## acceptPopup

[lib/helper/WebDriverIO.js:774-780](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L774-L780 "Source code on GitHub")

Accepts the active JavaScript native popup window, as created by window.alert|window.confirm|window.prompt.
Don't confuse popups with modal windows, as created by [various libraries](http://jster.net/category/windows-modals-popups).

## amOnPage

[lib/helper/WebDriverIO.js:185-190](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L185-L190 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:278-286](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L278-L286 "Source code on GitHub")

Appends text to a input field or textarea.
Field is located by name, label, CSS or XPath

```js
I.appendField('#myTextField', 'appended');
```

**Parameters**

-   `field`  
-   `value`  

## attachFile

[lib/helper/WebDriverIO.js:368-381](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L368-L381 "Source code on GitHub")

Attaches a file to element located by label, name, CSS or XPath
Path to file is relative current codecept directory (where codecept.json is located).
File will be uploaded to remove system (if tests are running remotely).

    I.attachFile('Avatar', 'data/avatar.jpg');
    I.attachFile('form input[name=avatar]', 'data/avatar.jpg');

**Parameters**

-   `locator`  
-   `pathToFile`  

## cancelPopup

[lib/helper/WebDriverIO.js:785-791](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L785-L791 "Source code on GitHub")

Dismisses the active JavaScript popup, as created by window.alert|window.confirm|window.prompt.

## checkOption

[lib/helper/WebDriverIO.js:397-413](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L397-L413 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:731-733](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L731-L733 "Source code on GitHub")

Clears a cookie by name,
if none provided clears all cookies

```js
I.clearCookie();
I.clearCookie('test');
```

**Parameters**

-   `cookie`  

## click

[lib/helper/WebDriverIO.js:215-229](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L215-L229 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:512-514](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L512-L514 "Source code on GitHub")

Opposite to `see`. Checks that a text is not present on a page.
Use context parameter to narrow down the search.

```js
I.dontSee('Login'); // assume we are already logged in
```

**Parameters**

-   `text`  
-   `context`  

## dontSeeCheckboxIsChecked

[lib/helper/WebDriverIO.js:555-557](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L555-L557 "Source code on GitHub")

Verifies that the specified checkbox is not checked.

**Parameters**

-   `field`  

## dontSeeCookie

[lib/helper/WebDriverIO.js:751-755](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L751-L755 "Source code on GitHub")

Checks that cookie with given name does not exist.

**Parameters**

-   `name`  

## dontSeeCurrentUrlEquals

[lib/helper/WebDriverIO.js:649-653](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L649-L653 "Source code on GitHub")

Checks that current url is not equal to provided one.
If a relative url provided, a configured url will be prepended to it.

**Parameters**

-   `uri`  

## dontSeeElement

[lib/helper/WebDriverIO.js:576-580](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L576-L580 "Source code on GitHub")

Opposite to `seeElement`. Checks that element is not on page.

**Parameters**

-   `locator`  

## dontSeeInCurrentUrl

[lib/helper/WebDriverIO.js:621-625](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L621-L625 "Source code on GitHub")

Checks that current url does not contain a provided fragment.

**Parameters**

-   `urlFragment`  

## dontSeeInField

[lib/helper/WebDriverIO.js:535-537](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L535-L537 "Source code on GitHub")

Checks that value of input field or textare doesn't equal to given value
Opposite to `seeInField`

**Parameters**

-   `field`  
-   `value`  

## dontSeeInSource

[lib/helper/WebDriverIO.js:598-602](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L598-L602 "Source code on GitHub")

Checks that the current page contains the given string in its raw source code

**Parameters**

-   `text`  

## dontSeeInTitle

[lib/helper/WebDriverIO.js:469-473](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L469-L473 "Source code on GitHub")

Checks that title does not contain text.

**Parameters**

-   `text`  

## doubleClick

[lib/helper/WebDriverIO.js:234-236](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L234-L236 "Source code on GitHub")

Performs a double-click on an element matched by CSS or XPath.

**Parameters**

-   `locator`  

## executeAsyncScript

[lib/helper/WebDriverIO.js:669-671](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L669-L671 "Source code on GitHub")

Executes async script on page.
Provided function should execute a passed callback (as first argument) to signal it is finished.

**Parameters**

-   `fn`  

## executeScript

[lib/helper/WebDriverIO.js:661-663](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L661-L663 "Source code on GitHub")

Executes sync script on a page.
Pass arguments to function as additional parameters.
Will return execution result to a test.
In this case you should use generator and yield to receive results.

**Parameters**

-   `fn`  

## fillField

[lib/helper/WebDriverIO.js:260-268](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L260-L268 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:451-455](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L451-L455 "Source code on GitHub")

Retrieves an attribute from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let hint = yield I.grabAttributeFrom('#tooltip', 'title');
```

**Parameters**

-   `locator`  
-   `attr`  

## grabCookie

[lib/helper/WebDriverIO.js:766-768](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L766-L768 "Source code on GitHub")

Gets a cookie object by name

-   Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let cookie = I.grabCookie('auth');
assert(cookie.value, '123456');
```

**Parameters**

-   `name`  

## grabTextFrom

[lib/helper/WebDriverIO.js:423-427](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L423-L427 "Source code on GitHub")

Retrieves a text from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let pin = yield I.grabTextFrom('#pin');
```

**Parameters**

-   `locator`  

## grabTitle

[lib/helper/WebDriverIO.js:483-488](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L483-L488 "Source code on GitHub")

Retrieves a page title and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let title = yield I.grabTitle();
```

## grabValueFrom

[lib/helper/WebDriverIO.js:437-441](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L437-L441 "Source code on GitHub")

Retrieves a value from a form element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let email = yield I.grabValueFrom('input[name=email]');
```

**Parameters**

-   `locator`  

## moveCursorTo

[lib/helper/WebDriverIO.js:695-697](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L695-L697 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:825-834](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L825-L834 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:840-845](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L840-L845 "Source code on GitHub")

Resize the current window to provided width and height.
First parameter can be set to `maximize`

**Parameters**

-   `width`  
-   `height`  

## rightClick

[lib/helper/WebDriverIO.js:241-243](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L241-L243 "Source code on GitHub")

Performs right click on an element matched by CSS or XPath.

**Parameters**

-   `locator`  

## saveScreenshot

[lib/helper/WebDriverIO.js:707-709](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L707-L709 "Source code on GitHub")

Saves a screenshot to ouput folder (set in codecept.json).
Filename is relative to output folder.

```js
I.saveScreenshot('debug.png');
```

**Parameters**

-   `fileName`  

## scrollTo

[lib/helper/WebDriverIO.js:682-684](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L682-L684 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:500-502](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L500-L502 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:548-550](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L548-L550 "Source code on GitHub")

Verifies that the specified checkbox is checked.

```js
I.seeCheckboxIsChecked('Agree');
I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
```

**Parameters**

-   `field`  

## seeCookie

[lib/helper/WebDriverIO.js:742-746](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L742-L746 "Source code on GitHub")

Checks that cookie with given name exists.

```js
I.seeCookie('Auth');
```

**Parameters**

-   `name`  

## seeCurrentUrlEquals

[lib/helper/WebDriverIO.js:639-643](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L639-L643 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:567-571](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L567-L571 "Source code on GitHub")

Checks that element is present on page.
Element is located by CSS or XPath.

```js
I.seeElement('#modal');
```

**Parameters**

-   `locator`  

## seeInCurrentUrl

[lib/helper/WebDriverIO.js:612-616](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L612-L616 "Source code on GitHub")

Checks that current url contains a provided fragment.

```js
I.seeInCurrentUrl('/register'); // we are on registration page
```

**Parameters**

-   `urlFragment`  

## seeInField

[lib/helper/WebDriverIO.js:527-529](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L527-L529 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:796-803](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L796-L803 "Source code on GitHub")

Checks that the active JavaScript popup, as created by `window.alert|window.confirm|window.prompt`, contains the given string.

**Parameters**

-   `text`  

## seeInSource

[lib/helper/WebDriverIO.js:589-593](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L589-L593 "Source code on GitHub")

Checks that the current page contains the given string in its raw source code.

```js
I.seeInSource('<h1>Green eggs &amp; ham</h1>');
```

**Parameters**

-   `text`  

## seeInTitle

[lib/helper/WebDriverIO.js:460-464](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L460-L464 "Source code on GitHub")

Checks that title contains text.

**Parameters**

-   `text`  

## selectOption

[lib/helper/WebDriverIO.js:308-356](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L308-L356 "Source code on GitHub")

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

-   `select`  
-   `option`  

## setCookie

[lib/helper/WebDriverIO.js:718-720](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L718-L720 "Source code on GitHub")

Sets a [cookie](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object) object

```js
I.setCookie({name: 'auth', value: true});
```

**Parameters**

-   `cookie`  

## wait

[lib/helper/WebDriverIO.js:850-852](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L850-L852 "Source code on GitHub")

Pauses execution for a number of seconds.

**Parameters**

-   `sec`  

## waitForElement

[lib/helper/WebDriverIO.js:867-870](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L867-L870 "Source code on GitHub")

Waits for element to be present on page (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `selector`  
-   `sec`  

## waitForEnabled

[lib/helper/WebDriverIO.js:858-861](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L858-L861 "Source code on GitHub")

Waits for element to become enabled (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `selector`  
-   `sec`  

## waitForText

[lib/helper/WebDriverIO.js:882-901](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L882-L901 "Source code on GitHub")

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

[lib/helper/WebDriverIO.js:907-910](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L907-L910 "Source code on GitHub")

Waits for an element to become visible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `selector`  
-   `sec`  

## waitToHide

[lib/helper/WebDriverIO.js:916-919](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L916-L919 "Source code on GitHub")

Waits for an element to become invisible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `selector`  
-   `sec`  

## waitUntil

[lib/helper/WebDriverIO.js:924-927](https://github.com/Codeception/CodeceptJS/blob/3d4a6ac9a8f64ab2a666e8d218d995c541218cf3/lib/helper/WebDriverIO.js#L924-L927 "Source code on GitHub")

Waits for a function to return true (waits for 1sec by default).

**Parameters**

-   `fn`  
-   `sec`  
