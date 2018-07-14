# WebDriverIO

WebDriverIO helper which wraps [webdriverio](http://webdriver.io/) library to
manipulate browser using Selenium WebDriver or PhantomJS.

WebDriverIO requires [Selenium Server and ChromeDriver/GeckoDriver to be installed](http://codecept.io/quickstart/#prepare-selenium-server).

### Configuration

This helper should be configured in codecept.json

-   `url`: base url of website to be tested.
-   `browser`: browser in which to perform testing.
-   `host`: (optional, default: localhost) - WebDriver host to connect.
-   `port`: (optional, default: 4444) - WebDriver port to connect.
-   `protocol`: (optional, default: http) - protocol for WebDriver server.
-   `path`: (optional, default: /wd/hub) - path to WebDriver server,
-   `restart`: (optional, default: true) - restart browser between tests.
-   `smartWait`: (optional) **enables [SmartWait](http://codecept.io/acceptance/#smartwait)**; wait for additional milliseconds for element to appear. Enable for 5 secs: "smartWait": 5000.
-   `disableScreenshots`: (optional, default: false) - don't save screenshots on failure.
-   `fullPageScreenshots` (optional, default: false) - make full page screenshots on failure.
-   `uniqueScreenshotNames`: (optional, default: false) - option to prevent screenshot override if you have scenarios with the same name in different suites.
-   `keepBrowserState`: (optional, default: false) - keep browser state between tests when `restart` is set to false.
-   `keepCookies`: (optional, default: false) - keep cookies between tests when `restart` set to false.
-   `windowSize`: (optional) default window size. Set to `maximize` or a dimension in the format `640x480`.
-   `waitForTimeout`: (optional, default: 1000) sets default wait time in _ms_ for all `wait*` functions.
-   `desiredCapabilities`: Selenium's [desired
    capabilities](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities).
-   `manualStart`: (optional, default: false) - do not start browser before a test, start it manually inside a helper
    with `this.helpers["WebDriverIO"]._startBrowser()`.
-   `timeouts`: [WebDriverIO timeouts](http://webdriver.io/guide/testrunner/timeouts.html) defined as hash.

Example:

```json
{
   "helpers": {
     "WebDriverIO" : {
       "smartWait": 5000,
       "browser": "chrome",
       "restart": false,
       "windowSize": "maximize",
       "timeouts": {
         "script": 60000,
         "page load": 10000
       }
     }
   }
}
```

Additional configuration params can be used from [webdriverio
website](http://webdriver.io/guide/getstarted/configuration.html).

### Headless Chrome

```json
{
   "helpers": {
     "WebDriverIO" : {
       "url": "http://localhost",
       "browser": "chrome",
       "desiredCapabilities": {
         "chromeOptions": {
           "args": [ "--headless", "--disable-gpu", "--window-size=800,600" ]
         }
       }
     }
   }
}
```

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

Please refer to [Selenium - Proxy Object](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities) for more
information.

### Cloud Providers

WebDriverIO makes it possible to execute tests against services like `Sauce Labs` `BrowserStack` `TestingBot`
Check out their documentation on [available parameters](http://webdriver.io/guide/usage/cloudservices.html)

Connecting to `BrowserStack` and `Sauce Labs` is simple. All you need to do
is set the `user` and `key` parameters. WebDriverIO automatically know which
service provider to connect to.

```js
{
    "helpers":{
        "WebDriverIO": {
            "url": "YOUR_DESIRED_HOST",
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

### Multiremote Capabilities

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

Get elements by different locator types, including strict locator
Should be used in custom helpers:

```js
this.helpers['WebDriverIO']._locate({name: 'password'}).then //...
```

**Parameters**

-   `locator`  
-   `smartWait`   (optional, default `false`)

## _locateCheckable

Find a checkbox by providing human readable text:

```js
this.helpers['WebDriverIO']._locateCheckable('I agree with terms and conditions').then // ...
```

**Parameters**

-   `locator`  

## _locateClickable

Find a clickable element by providing human readable text:

```js
this.helpers['WebDriverIO']._locateClickable('Next page').then // ...
```

**Parameters**

-   `locator`  

## _locateFields

Find field elements by providing human readable text:

```js
this.helpers['WebDriverIO']._locateFields('Your email').then // ...
```

**Parameters**

-   `locator`  

## acceptPopup

Accepts the active JavaScript native popup window, as created by window.alert|window.confirm|window.prompt.
Don't confuse popups with modal windows, as created by [various
libraries](http://jster.net/category/windows-modals-popups). Appium: support only web testing

## amOnPage

Opens a web page in a browser. Requires relative or absolute url.
If url starts with `/`, opens a web page of a site defined in `url` config parameter.

```js
I.amOnPage('/'); // opens main page of website
I.amOnPage('https://github.com'); // opens github
I.amOnPage('/login'); // opens a login page
```

**Parameters**

-   `url`  url path or global url
    Appium: support only web testing

## appendField

Appends text to a input field or textarea.
Field is located by name, label, CSS or XPath

```js
I.appendField('#myTextField', 'appended');
```

**Parameters**

-   `field`  located by label|name|CSS|XPath|strict locator
-   `value`  text value
    Appium: support, but it's clear a field before insert in apps

## attachFile

Attaches a file to element located by label, name, CSS or XPath
Path to file is relative current codecept directory (where codecept.json is located).
File will be uploaded to remote system (if tests are running remotely).

```js
I.attachFile('Avatar', 'data/avatar.jpg');
I.attachFile('form input[name=avatar]', 'data/avatar.jpg');
```

**Parameters**

-   `locator`  field located by label|name|CSS|XPath|strict locator
-   `pathToFile`  local file path relative to codecept.json config fileAppium: not tested

## cancelPopup

Dismisses the active JavaScript popup, as created by window.alert|window.confirm|window.prompt.
Appium: support only web testing

## checkOption

Selects a checkbox or radio button.
Element is located by label or name or CSS or XPath.

The second parameter is a context (CSS or XPath locator) to narrow the search.

```js
I.checkOption('#agree');
I.checkOption('I Agree to Terms and Conditions');
I.checkOption('agree', '//form');
```

**Parameters**

-   `field`  checkbox located by label | name | CSS | XPath | strict locator
-   `context`  (optional) element located by CSS | XPath | strict locator
    Appium: not tested

## clearCookie

Clears a cookie by name,
if none provided clears all cookies

```js
I.clearCookie();
I.clearCookie('test');
```

**Parameters**

-   `cookie`  (optional)
    Appium: support only web testing

## clearField

Clears a `<textarea>` or text `<input>` element's value.

```js
I.clearField('Email');
I.clearField('user[email]');
I.clearField('#email');
```

**Parameters**

-   `field`  located by label|name|CSS|XPath|strict locator
    Appium: support

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

-   `locator`  clickable link or button located by text, or any element located by CSS|XPath|strict locator
-   `context`  (optional) element to search in CSS|XPath|Strict locator
    Appium: support

## closeCurrentTab

Close current tab

```js
I.closeCurrentTab();
```

## closeOtherTabs

Close all tabs except for the current one.
Appium: support web test

```js
I.closeOtherTabs();
```

## defineTimeout

Set [WebDriverIO timeouts](http://webdriver.io/guide/testrunner/timeouts.html) in realtime.
Appium: support only web testing
Timeouts are expected to be passed as object:

```js
I.defineTimeout({ script: 5000 });
I.defineTimeout({ implicit: 10000, pageLoad: 10000, script: 5000 });
```

**Parameters**

-   `timeouts`  

## dontSee

Opposite to `see`. Checks that a text is not present on a page.
Use context parameter to narrow down the search.

```js
I.dontSee('Login'); // assume we are already logged in
```

**Parameters**

-   `text`  is not present
-   `context`  (optional) element located by CSS|XPath|strict locator in which to perfrom search
    Appium: support with context in apps

## dontSeeCheckboxIsChecked

Verifies that the specified checkbox is not checked.

**Parameters**

-   `field`  located by label|name|CSS|XPath|strict locatorAppium: not tested

## dontSeeCookie

Checks that cookie with given name does not exist.

**Parameters**

-   `name`  Appium: support only web testing

## dontSeeCurrentUrlEquals

Checks that current url is not equal to provided one.
If a relative url provided, a configured url will be prepended to it.

**Parameters**

-   `url`  Appium: support only web testing

## dontSeeElement

Opposite to `seeElement`. Checks that element is not visible (or in DOM)

**Parameters**

-   `locator`  located by CSS|XPath|Strict locator
    Appium: support

## dontSeeElementInDOM

Opposite to `seeElementInDOM`. Checks that element is not on page.

**Parameters**

-   `locator`  located by CSS|XPath|Strict locator
    Appium: support

## dontSeeInCurrentUrl

Checks that current url does not contain a provided fragment.

**Parameters**

-   `url`  Appium: support only web testing

## dontSeeInField

Checks that value of input field or textare doesn't equal to given value
Opposite to `seeInField`.

**Parameters**

-   `field`  located by label|name|CSS|XPath|strict locator
-   `value`  is not expected to be a field value
    Appium: support only web testing

## dontSeeInSource

Checks that the current page contains the given string in its raw source code

**Parameters**

-   `text`  Appium: support

## dontSeeInTitle

Checks that title does not contain text.

**Parameters**

-   `text`  Appium: support only web testing

## doubleClick

Performs a double-click on an element matched by link|button|label|CSS or XPath.
Context can be specified as second parameter to narrow search.

```js
I.doubleClick('Edit');
I.doubleClick('Edit', '.actions');
I.doubleClick({css: 'button.accept'});
I.doubleClick('.btn.edit');
```

**Parameters**

-   `locator`  
-   `context`  Appium: support only web testing

## dragAndDrop

Drag an item to a destination element.
Appium: not tested

```js
I.dragAndDrop('#dragHandle', '#container');
```

**Parameters**

-   `srcElement`  
-   `destElement`  

## executeAsyncScript

Executes async script on page.
Provided function should execute a passed callback (as first argument) to signal it is finished.

Example: In Vue.js to make components completely rendered we are waiting for [nextTick](https://vuejs.org/v2/api/#Vue-nextTick).

```js
I.executeAsyncScript(function(done) {
Vue.nextTick(done); // waiting for next tick
});
```

By passing value to `done()` function you can return values.
Additional arguments can be passed as well, while `done` function is always last parameter in arguments list.

```js
let val = await I.executeAsyncScript(function(url, done) {
// in browser context
$.ajax(url, { success: (data) => done(data); }
}, 'http://ajax.callback.url/');
```

**Parameters**

-   `fn`  function to be executed in browser context

## executeScript

Executes sync script on a page.
Pass arguments to function as additional parameters.
Will return execution result to a test.
In this case you should use async function and await to receive results.

Example with jQuery DatePicker:

```js
// change date of jQuery DatePicker
I.executeScript(function() {
// now we are inside browser context
$('date').datetimepicker('setDate', new Date());
});
```

Can return values. Don't forget to use `await` to get them.

```js
let date = await I.executeScript(function(el) {
// only basic types can be returned
return $(el).datetimepicker('getDate').toString();
}, '#date'); // passing jquery selector
```

**Parameters**

-   `fn`  function to be executed in browser context

## fillField

Fills a text field or textarea, after clearing its value, with the given string.
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
-   `value`  Appium: support

## grabAttributeFrom

Retrieves an attribute from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside async with `await`** operator.

```js
let hint = await I.grabAttributeFrom('#tooltip', 'title');
```

**Parameters**

-   `locator`  element located by CSS|XPath|strict locator
-   `attr`  Appium: can be used for apps only with several values ("contentDescription", "text", "className", "resourceId")

## grabBrowserLogs

Get JS log from browser. Log buffer is reset after each request.

```js
let logs = await I.grabBrowserLogs();
console.log(JSON.stringify(logs))
```

## grabCookie

Gets a cookie object by name
Resumes test execution, so **should be used inside async with `await`** operator.

```js
let cookie = await I.grabCookie('auth');
assert(cookie.value, '123456');
```

**Parameters**

-   `name`  Appium: support only web testing

## grabCssPropertyFrom

Grab CSS property for given locator
Resumes test execution, so **should be used inside an async function with `await`** operator.

```js
const value = await I.grabCssPropertyFrom('h3', 'font-weight');
```

**Parameters**

-   `locator`  
-   `cssProperty`  

## grabCurrentUrl

Get current URL from browser.
Resumes test execution, so should be used inside an async function.

```js
let url = await I.grabCurrentUrl();
console.log(`Current URL is [${url}]`);
```

## grabHTMLFrom

Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside async function with `await`** operator.
Appium: support only web testing

```js
let postHTML = await I.grabHTMLFrom('#post');
```

**Parameters**

-   `locator`  

## grabNumberOfOpenTabs

Grab number of open tabs

```js
I.grabNumberOfOpenTabs();
```

## grabNumberOfVisibleElements

Grab number of visible elements by locator

```js
I.grabNumberOfVisibleElements('p');
```

**Parameters**

-   `locator`  

## grabPageScrollPosition

Retrieves a page scroll position and returns it to test.
Resumes test execution, so **should be used inside an async function with `await`** operator.

```js
let { x, y } = await I.grabPageScrollPosition();
```

## grabPopupText

Grab the text within the popup. If no popup is visible then it will return null

```js
await I.grabPopupText();
```

## grabSource

Retrieves page source and returns it to test.
Resumes test execution, so should be used inside an async function.

```js
let pageSource = await I.grabSource();
```

Appium: support

## grabTextFrom

Retrieves a text from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside async with `await`** operator.

```js
let pin = await I.grabTextFrom('#pin');
```

If multiple elements found returns an array of texts.

**Parameters**

-   `locator`  element located by CSS|XPath|strict locator
    Appium: support

## grabTitle

Retrieves a page title and returns it to test.
Resumes test execution, so **should be used inside async with `await`** operator.

```js
let title = await I.grabTitle();
```

Appium: support only web testing

## grabValueFrom

Retrieves a value from a form element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside async function with `await`** operator.

```js
let email = await I.grabValueFrom('input[name=email]');
```

**Parameters**

-   `locator`  field located by label|name|CSS|XPath|strict locator
    Appium: support only web testing

## moveCursorTo

Moves cursor to element matched by locator.
Extra shift can be set with offsetX and offsetY options

```js
I.moveCursorTo('.tooltip');
I.moveCursorTo('#submit', 5,5);
```

Appium: support only web testing

**Parameters**

-   `locator`  
-   `offsetX`   (optional, default `0`)
-   `offsetY`   (optional, default `0`)

## openNewTab

Open new tab and switch to it

```js
I.openNewTab();
```

## pressKey

Presses a key on a focused element.
Special keys like 'Enter', 'Control', [etc](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value)
will be replaced with corresponding unicode.
If modifier key is used (Control, Command, Alt, Shift) in array, it will be released afterwards.

```js
I.pressKey('Enter');
I.pressKey(['Control','a']);
```

To make combinations with modifier and mouse clicks (like Ctrl+Click) press a modifier, click, then release it.
Appium: support, but clear field before pressing in apps:

```js
I.pressKey('Control');
I.click('#someelement');
I.pressKey('Control');
```

**Parameters**

-   `key`  

## refreshPage

Reload the current page.

```js
`I.refreshPage();
```

## resizeWindow

Resize the current window to provided width and height.
First parameter can be set to `maximize`

**Parameters**

-   `width`  or `maximize`
-   `height`  Appium: not tested in web, in apps doesn't work

## rightClick

Performs right click on an element matched by CSS or XPath.
Appium: support, but in apps works as usual click

**Parameters**

-   `locator`  

## runInWeb

placeholder for ~ locator only test case write once run on both Appium and WebDriverIO

**Parameters**

-   `fn`  

## runOnAndroid

placeholder for ~ locator only test case write once run on both Appium and WebDriverIO

**Parameters**

-   `caps`  
-   `fn`  

## runOnIOS

placeholder for ~ locator only test case write once run on both Appium and WebDriverIO

**Parameters**

-   `caps`  
-   `fn`  

## saveScreenshot

Saves a screenshot to ouput folder (set in codecept.json).
Filename is relative to output folder. 
Optionally resize the window to the full available page `scrollHeight` and `scrollWidth` to capture the entire page by passing `true` in as the second argument.

```js
I.saveScreenshot('debug.png');
I.saveScreenshot('debug.png',true) \\resizes to available scrollHeight and scrollWidth before taking screenshot
```

**Parameters**

-   `fileName`  
-   `fullPage`  (optional)
    Appium: support

## scrollPageToBottom

Scroll page to the bottom

```js
I.scrollPageToBottom();
```

## scrollPageToTop

Scroll page to the top

```js
I.scrollPageToTop();
```

## scrollTo

Scrolls to element matched by locator.
Extra shift can be set with offsetX and offsetY options
Appium: support only web testing

```js
I.scrollTo('footer');
I.scrollTo('#submit', 5,5);
```

**Parameters**

-   `locator`  
-   `offsetX`   (optional, default `0`)
-   `offsetY`   (optional, default `0`)

## see

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
    Appium: support with context in apps

## seeAttributesOnElements

Checks that all elements with given locator have given attributes.

```js
I.seeAttributesOnElements('//form', {'method': "post"});
```

**Parameters**

-   `locator`  
-   `attributes`  

## seeCheckboxIsChecked

Verifies that the specified checkbox is checked.

```js
I.seeCheckboxIsChecked('Agree');
I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
```

**Parameters**

-   `field`  located by label|name|CSS|XPath|strict locator
    Appium: not tested

## seeCookie

Checks that cookie with given name exists.

```js
I.seeCookie('Auth');
```

**Parameters**

-   `name`  Appium: support only web testing

## seeCssPropertiesOnElements

Checks that all elements with given locator have given CSS properties.

```js
I.seeCssPropertiesOnElements('h3', { 'font-weight': "bold"});
```

**Parameters**

-   `locator`  
-   `properties`  
-   `cssProperties`  

## seeCurrentUrlEquals

Checks that current url is equal to provided one.
If a relative url provided, a configured url will be prepended to it.
So both examples will work:

```js
I.seeCurrentUrlEquals('/register');
I.seeCurrentUrlEquals('http://my.site.com/register');
```

**Parameters**

-   `url`  Appium: support only web testing

## seeElement

Checks that a given Element is visible
Element is located by CSS or XPath.

```js
I.seeElement('#modal');
```

**Parameters**

-   `locator`  located by CSS|XPath|strict locator
    Appium: support

## seeElementInDOM

Checks that a given Element is present in the DOM
Element is located by CSS or XPath.

```js
I.seeElementInDOM('#modal');
```

**Parameters**

-   `locator`  located by CSS|XPath|strict locator
    Appium: support

## seeInCurrentUrl

Checks that current url contains a provided fragment.

```js
I.seeInCurrentUrl('/register'); // we are on registration page
```

**Parameters**

-   `url`  Appium: support only web testing

## seeInField

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
-   `value`  Appium: support only web testing

## seeInPopup

Checks that the active JavaScript popup, as created by `window.alert|window.confirm|window.prompt`, contains the
given string. Appium: support only web testing

**Parameters**

-   `text`  

## seeInSource

Checks that the current page contains the given string in its raw source code.

```js
I.seeInSource('<h1>Green eggs &amp; ham</h1>');
```

**Parameters**

-   `text`  Appium: support

## seeInTitle

Checks that title contains text.

**Parameters**

-   `text`  Appium: support only web testing

## seeNumberOfElements

asserts that an element appears a given number of times in the DOM
Element is located by label or name or CSS or XPath.
Appium: support

```js
I.seeNumberOfElements('#submitBtn', 1);
```

**Parameters**

-   `selector`  
-   `num`  

## seeNumberOfVisibleElements

asserts that an element is visible a given number of times
Element is located by CSS or XPath.

```js
I.seeNumberOfVisibleElements('.buttons', 3);
```

**Parameters**

-   `locator`  
-   `num`  

## seeTextEquals

Checks that text is equal to provided one.

```js
I.seeTextEquals('text', 'h1');
```

**Parameters**

-   `text`  
-   `context`   (optional, default `null`)

## seeTitleEquals

Checks that title is equal to provided one.

```js
I.seeTitleEquals('Test title.');
```

**Parameters**

-   `text`  

## selectOption

Selects an option in a drop-down select.
Field is searched by label | name | CSS | XPath.
Option is selected by visible text or by value.

```js
I.selectOption('Choose Plan', 'Monthly'); // select by label
I.selectOption('subscription', 'Monthly'); // match option by text
I.selectOption('subscription', '0'); // or by value
I.selectOption('//form/select[@name=account]','Premium');
I.selectOption('form select[name=account]', 'Premium');
I.selectOption({css: 'form select[name=account]'}, 'Premium');
```

Provide an array for the second argument to select multiple options.

```js
I.selectOption('Which OS do you use?', ['Android', 'iOS']);
```

**Parameters**

-   `select`  field located by label|name|CSS|XPath|strict locator
-   `option`  

## setCookie

Sets a cookie

```js
I.setCookie({name: 'auth', value: true});
```

**Parameters**

-   `cookie`  Appium: support only web testingUses Selenium's JSON [cookie
    format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).

## switchTo

Switches frame or in case of null locator reverts to parent.
Appium: support only web testing

**Parameters**

-   `locator`  

## switchToNextTab

Switch focus to a particular tab by its number. It waits tabs loading and then switch tab

```js
I.switchToNextTab();
I.switchToNextTab(2);
```

**Parameters**

-   `num`   (optional, default `1`)
-   `sec`   (optional, default `null`)

## switchToPreviousTab

Switch focus to a particular tab by its number. It waits tabs loading and then switch tab

```js
I.switchToPreviousTab();
I.switchToPreviousTab(2);
```

**Parameters**

-   `num`   (optional, default `1`)
-   `sec`   (optional, default `null`)

## uncheckOption

Unselects a checkbox or radio button.
Element is located by label or name or CSS or XPath.

The second parameter is a context (CSS or XPath locator) to narrow the search.

```js
I.uncheckOption('#agree');
I.uncheckOption('I Agree to Terms and Conditions');
I.uncheckOption('agree', '//form');
```

**Parameters**

-   `field`  checkbox located by label | name | CSS | XPath | strict locator
-   `context`  (optional) element located by CSS | XPath | strict locatorAppium: not tested

## wait

Pauses execution for a number of seconds.

```js
I.wait(2); // wait 2 secs
```

**Parameters**

-   `sec`  Appium: support

## waitForDetached

Waits for an element to become not attached to the DOM on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

    I.waitForDetached('#popup');

**Parameters**

-   `locator`  element located by CSS|XPath|strict locator
-   `sec`  time seconds to wait, 1 by defaultAppium: support

## waitForElement

Waits for element to be present on page (by default waits for 1sec).
Element can be located by CSS or XPath.

```js
I.waitForElement('.btn.continue');
I.waitForElement('.btn.continue', 5); // wait for 5 secs
```

**Parameters**

-   `locator`  element located by CSS|XPath|strict locator
-   `sec`  time seconds to wait, 1 by default
    Appium: support

## waitForEnabled

Waits for element to become enabled (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `locator`  element located by CSS|XPath|strict locator
-   `sec`  time seconds to wait, 1 by default
    Appium: support

## waitForFunction

Waits for a function to return true (waits for 1 sec by default).
Running in browser context.

```js
I.waitForFunction(fn[, [args[, timeout]])
```

```js
I.waitForFunction(() => window.requests == 0);
I.waitForFunction(() => window.requests == 0, 5); // waits for 5 sec
I.waitForFunction((count) => window.requests == count, [3], 5) // pass args and wait for 5 sec
```

**Parameters**

-   `function`  to be executed in browser context
-   `args`  arguments for function
-   `fn`  
-   `argsOrSec`   (optional, default `null`)
-   `sec`  time seconds to wait, 1 by defaultAppium: support

## waitForInvisible

Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

    I.waitForInvisible('#popup');

**Parameters**

-   `locator`  element located by CSS|XPath|strict locator
-   `sec`  time seconds to wait, 1 by defaultAppium: support

## waitForText

Waits for a text to appear (by default waits for 1sec).
Element can be located by CSS or XPath.
Narrow down search results by providing context.

```js
I.waitForText('Thank you, form has been submitted');
I.waitForText('Thank you, form has been submitted', 5, '#modal');
```

**Parameters**

-   `text`  to wait for
-   `sec`  seconds to wait
-   `context`  element located by CSS|XPath|strict locator
    Appium: support
-   `aContext`   (optional, default `null`)

## waitForValue

Waits for the specified value to be in value attribute

```js
I.waitForValue('//input', "GoodValue");
```

**Parameters**

-   `field`  input field
-   `value`  expected value
-   `sec`  seconds to wait, 1 sec by default

## waitForVisible

Waits for an element to become visible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

    I.waitForVisible('#popup');

**Parameters**

-   `locator`  element located by CSS|XPath|strict locator
-   `sec`  time seconds to wait, 1 by default
    Appium: support

## waitInUrl

Waiting for the part of the URL to match the expected. Useful for SPA to understand that page was changed.

```js
I.waitInUrl('/info', 2);
```

**Parameters**

-   `urlPart`  
-   `sec`   (optional, default `null`)

## waitNumberOfVisibleElements

Waits for a specified number of elements on the page

```js
I.waitNumberOfVisibleElements('a', 3);
```

**Parameters**

-   `locator`  
-   `seconds`  
-   `num`  
-   `sec`   (optional, default `null`)

## waitToHide

Waits for an element to hide (by default waits for 1sec).
Element can be located by CSS or XPath.

    I.waitToHide('#popup');

**Parameters**

-   `locator`  element located by CSS|XPath|strict locator
-   `sec`  time seconds to wait, 1 by defaultAppium: support

## waitUntil

Waits for a function to return true (waits for 1sec by default).

```js
I.waitUntil(() => window.requests == 0);
I.waitUntil(() => window.requests == 0, 5);
```

**Parameters**

-   `function`  function which is executed in browser context.
-   `fn`  
-   `sec`  time seconds to wait, 1 by defaultAppium: support
-   `timeoutMsg`   (optional, default `null`)

## waitUrlEquals

Waits for the entire URL to match the expected

```js
I.waitUrlEquals('/info', 2);
I.waitUrlEquals('http://127.0.0.1:8000/info');
```

**Parameters**

-   `urlPart`  
-   `sec`   (optional, default `null`)

# locator

just press button if no selector is given
