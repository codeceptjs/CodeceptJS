# WebDriverIO

WebDriverIO helper which wraps [webdriverio](http://webdriver.io/) library to
manipulate browser using Selenium WebDriver, PhantomJS or Appium.

#### Selenium Installation

1.  Download [Selenium Server](http://docs.seleniumhq.org/download/)
2.  Launch the daemon: `java -jar selenium-server-standalone-2.xx.xxx.jar`

#### PhantomJS Installation

PhantomJS is a headless alternative to Selenium Server that implements the WebDriver protocol.
It allows you to run Selenium tests on a server without a GUI installed.

1.  Download [PhantomJS](http://phantomjs.org/download.html)
2.  Run PhantomJS in WebDriver mode: `phantomjs --webdriver=4444`

#### Appium Installation

Appium is an open source test automation framework for use with native, hybrid and mobile web apps that implements the WebDriver protocol.
It allows you to run Selenium tests on mobile devices and also test native, hybrid and mobile web apps.

1.  Download and install [Appium](http://appium.io/)
2.  Launch the daemon: `appium`

### Configuration

This helper should be configured in codecept.conf.js

#### Desktop configuration

-   `url` - base url of website to be tested
-   `browser` - browser in which perform testing
-   `restart` - restart browser between tests (default: true), if set to false cookies will be cleaned but browser window will be kept.
-   `windowSize`: (optional) default window size. Set to `maximize` or a dimension in the format `640x480`.
-   `waitForTimeout`: (optional) sets default wait time in _ms_ for all `wait*` functions. 1000 by default;
-   `desiredCapabilities`: Selenium capabilities
-   `manualStart` (optional, default: false) - do not start browser before a test, start it manually inside a helper with `this.helpers["WebDriverIO"]._startBrowser()`
-   `timeouts`: [WebDriverIO timeouts](http://webdriver.io/guide/testrunner/timeouts.html) defined as hash.

Example:

```js
{
   helpers: {
     WebDriverIO : {
       browser: "chrome",
       restart: false,
       windowSize: "maximize",
       timeouts: {
         script: 60000,
         page load: 10000,
         implicit : 5000
       }
     }
   }
}
```

Additional configuration params can be used from <http://webdriver.io/guide/getstarted/configuration.html>

### Connect through proxy

CodeceptJS also provides flexible options when you want to execute tests to Selenium servers through proxy. You will
need to update the `helpers.WebDriverIO.desiredCapabilities.proxy` key.

```js
{
    helpers: {
        WebDriverIO: {
            desiredCapabilities: {
                proxy: {
                    proxyType: "manual|pac",
                    proxyAutoconfigUrl: "URL TO PAC FILE",
                    httpProxy: "PROXY SERVER",
                    sslProxy: "PROXY SERVER",
                    ftpProxy: "PROXY SERVER",
                    socksProxy: "PROXY SERVER",
                    socksUsername: "USERNAME",
                    socksPassword: "PASSWORD",
                    noProxy: "BYPASS ADDRESSES"
                }
            }
        }
    }
}
```

For example,

```js
{
    helpers: {
        WebDriverIO: {
            desiredCapabilities: {
                proxy: {
                    proxyType: "manual",
                    httpProxy: "http://corporate.proxy:8080",
                    socksUsername: "codeceptjs",
                    socksPassword: "secret",
                    noProxy: "127.0.0.1,localhost"
                }
            }
        }
    }
}
```

Please refer to [Selenium - Proxy Object](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities) for more information.

### Cloud Providers

WebDriverIO makes it possible to execute tests against services like `Sauce Labs` `BrowserStack` `TestingBot`
Check out their documentation on [available parameters](http://webdriver.io/guide/testrunner/cloudservices.html)

Connecting to `BrowserStack` and `Sauce Labs` is simple. All you need to do
is set the `user` and `key` parameters. WebDriverIO authomatically know which
service provider to connect to.

```js
{
    helpers:{
        WebDriverIO: {
            url: "YOUR_DESIERED_HOST",
            user: "YOUR_BROWSERSTACK_USER",
            key: "YOUR_BROWSERSTACK_KEY",
            desiredCapabilities: {
                browserName: "chrome",

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
    helpers: {
        WebDriverIO: {
            multiremote: {
                MyChrome: {
                    desiredCapabilities: {
                        browserName: "chrome"
                     }
                },
                MyFirefox: {
                   desiredCapabilities: {
                       browserName: "firefox"
                   }
                }
            }
        }
    }
}
```

#### Appium configuration

-   `port`: Appium server port
-   `restart`: restart browser or app between tests (default: true), if set to false cookies will be cleaned but browser window will be kept and for apps nothing will be changed.
-   `platformName` - Which mobile OS platform to use
-   `appPackage` - Java package of the Android app you want to run
   `appActivity` - Activity name for the Android activity you want to launch from your package.
-   `deviceName`: The kind of mobile device or emulator to use
-   `platformVersion`: Mobile OS version
-   `app` - The absolute local path or remote http URL to an .ipa or .apk file, or a .zip containing one of these. Appium will attempt to install this app binary on the appropriate device first.
-   `browserName`: Name of mobile web browser to automate. Should be an empty string if automating an app instead.

Example:

```js
{
  helpers: {
      WebDriverIO: {
          desiredCapabilities: {
              platformName: "Android",
              appPackage: "com.example.android.myApp",
              appActivity: "MainActivity",
              deviceName: "OnePlus3",
              platformVersion: "6.0.1"
          },
          port: 4723,
          restart: false
      }
   }
}
```
Additional configuration params can be used from <https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/caps.md>


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
Don't confuse popups with modal windows, as created by [various libraries](http://jster.net/category/windows-modals-popups).

Appium: support only web testing

## amOnPage

Opens a web page in a browser. Requires relative or absolute url.
If url starts with `/`, opens a web page of a site defined in `url` config parameter.

Appium: support only web testing

```js
I.amOnPage('/'); // opens main page of website
I.amOnPage('https://github.com'); // opens github
I.amOnPage('/login'); // opens a login page
```

**Parameters**

-   `url`  url path or global url

## appendField

Appends text to a input field or textarea.
Field is located by name, label, CSS or XPath

Appium: support, but it's clear a field before insert in apps

```js
I.appendField('#myTextField', 'appended');
```

**Parameters**

-   `field`  located by label|name|CSS|XPath|strict locator
-   `value`  text value

## attachFile

Attaches a file to element located by label, name, CSS or XPath
Path to file is relative current codecept directory (where codecept.json is located).
File will be uploaded to remote system (if tests are running remotely).

Appium: not tested

```js
I.attachFile('Avatar', 'data/avatar.jpg');
I.attachFile('form input[name=avatar]', 'data/avatar.jpg');
```

**Parameters**

-   `locator`  field located by label|name|CSS|XPath|strict locator
-   `pathToFile`  local file path relative to codecept.json config file

## cancelPopup

Dismisses the active JavaScript popup, as created by window.alert|window.confirm|window.prompt.

Appium: support only web testing

## checkOption

Selects a checkbox or radio button.
Element is located by label or name or CSS or XPath.

Appium: support only web testing

The second parameter is a context (CSS or XPath locator) to narrow the search.

```js
I.checkOption('#agree');
I.checkOption('I Agree to Terms and Conditions');
I.checkOption('agree', '//form');
```

**Parameters**

-   `field`  checkbox located by label | name | CSS | XPath | strict locator
-   `context`  (optional) element located by CSS | XPath | strict locator

## clearCookie

Clears a cookie by name,
if none provided clears all cookies

Appium: support only web testing

```js
I.clearCookie();
I.clearCookie('test');
```

**Parameters**

-   `cookie`  (optional)

## clearField

Clears a `<textarea>` or text `<input>` element's value.

Appium: support

```js
I.clearField('#email');
```

**Parameters**

-   `locator`  field located by label|name|CSS|XPath|strict locator

## click

Perform a click on a link or a button, given by a locator.
If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
For images, the "alt" attribute and inner text of any parent links are searched.

Appium: support

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

## defineTimeout

Set [WebDriverIO timeouts](http://webdriver.io/guide/testrunner/timeouts.html) in realtime.

Appium: support only web testing

Timeouts are expected to be passed as object:

```js
I.defineTimeout({ script: 5000 });
I.defineTimeout({ implicit: 10000, "page load": 10000, script: 5000 });
```

**Parameters**

-   `timeouts`  

## dontSee

Opposite to `see`. Checks that a text is not present on a page.
Use context parameter to narrow down the search.

Appium: support with context in apps

```js
I.dontSee('Login'); // assume we are already logged in
```

**Parameters**

-   `text`  is not present
-   `context`  (optional) element located by CSS|XPath|strict locator in which to perfrom search

## dontSeeCheckboxIsChecked

Verifies that the specified checkbox is not checked.

Appium: not tested

**Parameters**

-   `field`  located by label|name|CSS|XPath|strict locator

## dontSeeCookie

Checks that cookie with given name does not exist.

Appium: support only web testing

**Parameters**

-   `name`  

## dontSeeCurrentUrlEquals

Checks that current url is not equal to provided one.
If a relative url provided, a configured url will be prepended to it.

Appium: support only web testing

**Parameters**

-   `url`  

## dontSeeElement

Opposite to `seeElement`. Checks that element is not visible

Appium: support

**Parameters**

-   `locator`  located by CSS|XPath|Strict locator

## dontSeeElementInDOM

Opposite to `seeElementInDOM`. Checks that element is not on page.

Appium: support

**Parameters**

-   `locator`  located by CSS|XPath|Strict locator

## dontSeeInCurrentUrl

Checks that current url does not contain a provided fragment.

Appium: support only web testing

**Parameters**

-   `url`  

## dontSeeInField

Checks that value of input field or textare doesn't equal to given value
Opposite to `seeInField`.

Appium: support only web testing

**Parameters**

-   `field`  located by label|name|CSS|XPath|strict locator
-   `value`  is not expected to be a field value

## dontSeeInSource

Checks that the current page contains the given string in its raw source code

Appium: support

**Parameters**

-   `text`  

## dontSeeInTitle

Checks that title does not contain text.

Appium: support only web testing

**Parameters**

-   `text`  

## doubleClick

Performs a double-click on an element matched by link|button|label|CSS or XPath.
Context can be specified as second parameter to narrow search.

Appium: support only web testing

```js
I.doubleClick('Edit');
I.doubleClick('Edit', '.actions');
I.doubleClick({css: 'button.accept'});
I.doubleClick('.btn.edit');
```

**Parameters**

-   `locator`  
-   `context`  

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

Appium: support only web testing

**Parameters**

-   `fn`  
-   `args`  Examples for Vue.js.
    In order to make components completely rendered we are waiting for [nextTick](https://vuejs.org/v2/api/#Vue-nextTick).```js
    I.executeAsyncScript(function(done) {
    Vue.nextTick(done); // waiting for next tick
    })
    ```By passing value to `done()` function you can return values.
    Additional arguments can be passed as well, while `done` function is always last parameter in arguments list.```js
    let val = yield I.executeAsyncScript(function(url, done) {
    // in browser context
    $.ajax(url, { success: (data) => done(data); }
    }, 'http://ajax.callback.url/');
    ```

## executeScript

Executes sync script on a page.
Pass arguments to function as additional parameters.
Will return execution result to a test.
In this case you should use generator and yield to receive results.

Appium: support only web testing

Example with jQuery DatePicker:

```js
// change date of jQuery DatePicker
I.executeScript(function() {
// now we are inside browser context
$('date')).datetimepicker('setDate', new Date());
});
```

Can return values. Don't forget to use `yield` to get them.

```js
let date = yield I.executeScript(function(el) {
// only basic types can be returned
return $(el)).datetimepicker('getDate').toString();
}, '#date'); // passing selector
```

**Parameters**

-   `fn`  

## fillField

Fills a text field or textarea, after clearing its value, with the given string.
Field is located by name, label, CSS, or XPath.

Appium: support

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

Retrieves an attribute from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

Appium: can be used for apps only with several values ("contentDescription", "text", "className", "resourceId")

```js
let hint = yield I.grabAttributeFrom('#tooltip', 'title');
```

**Parameters**

-   `locator`  element located by CSS|XPath|strict locator
-   `attr`  

## grabCookie

Gets a cookie object by name
Resumes test execution, so **should be used inside a generator with `yield`** operator.

Appium: support only web testing

```js
let cookie = I.grabCookie('auth');
assert(cookie.value, '123456');
```

**Parameters**

-   `name`  

## grabHTMLFrom

Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

Appium: support only web testing

```js
let postHTML = yield I.grabHTMLFrom('#post');
```

**Parameters**

-   `locator`  

## grabTextFrom

Retrieves a text from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

Appium: support

```js
let pin = yield I.grabTextFrom('#pin');
```

**Parameters**

-   `locator`  element located by CSS|XPath|strict locator

## grabTitle

Retrieves a page title and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

Appium: support only web testing

```js
let title = yield I.grabTitle();
```

## grabValueFrom

Retrieves a value from a form element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

Appium: support only web testing

```js
let email = yield I.grabValueFrom('input[name=email]');
```

**Parameters**

-   `locator`  field located by label|name|CSS|XPath|strict locator

## moveCursorTo

Moves cursor to element matched by locator.
Extra shift can be set with offsetX and offsetY options

Appium: support only web testing

```js
I.moveCursorTo('.tooltip');
I.moveCursorTo('#submit', 5,5);
```

**Parameters**

-   `locator`  
-   `offsetX`  
-   `offsetY`  

## pressKey

Presses a key on a focused element.
Speical keys like 'Enter', 'Control', [etc](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value)
will be replaced with corresponding unicode.
If modifier key is used (Control, Command, Alt, Shift) in array, it will be released afterwards.

Appium: support, but clear field before pressing in apps

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

Resize the current window to provided width and height.
First parameter can be set to `maximize`

Appium: not tested in web, in apps doesn't work

**Parameters**

-   `width`  or `maximize`
-   `height`  

## rightClick

Performs right click on an element matched by CSS or XPath.

Appium: support, but in apps works as usual click

**Parameters**

-   `locator`  

## saveScreenshot

Saves a screenshot to ouput folder (set in codecept.json).
Filename is relative to output folder.

Appium: support

```js
I.saveScreenshot('debug.png');
```

**Parameters**

-   `fileName`  

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
-   `offsetX`  
-   `offsetY`  

## see

Checks that a page contains a visible text.
Use context parameter to narrow down the search.

Appium: support with context in apps

```js
I.see('Welcome'); // text welcome on a page
I.see('Welcome', '.content'); // text inside .content div
I.see('Register', {css: 'form.register'}); // use strict locator
```

**Parameters**

-   `text`  expected on page
-   `context`  (optional) element located by CSS|Xpath|strict locator in which to search for text

## seeCheckboxIsChecked

Verifies that the specified checkbox is checked.

Appium: not tested

```js
I.seeCheckboxIsChecked('Agree');
I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
```

**Parameters**

-   `field`  located by label|name|CSS|XPath|strict locator

## seeCookie

Checks that cookie with given name exists.

Appium: support only web testing

```js
I.seeCookie('Auth');
```

**Parameters**

-   `name`  

## seeCurrentUrlEquals

Checks that current url is equal to provided one.

Appium: support only web testing

If a relative url provided, a configured url will be prepended to it.
So both examples will work:

```js
I.seeCurrentUrlEquals('/register');
I.seeCurrentUrlEquals('http://my.site.com/register');
```

**Parameters**

-   `url`  

## seeElement

Checks that a given Element is visible
Element is located by CSS or XPath.

Appium: support

```js
I.seeElement('#modal');
```

**Parameters**

-   `locator`  located by CSS|XPath|strict locator

## seeElementInDOM

Checks that a given Element is present in the DOM
Element is located by CSS or XPath.

Appium: support

```js
I.seeElementInDOM('#modal');
```

**Parameters**

-   `locator`  located by CSS|XPath|strict locator

## seeInCurrentUrl

Checks that current url contains a provided fragment.

Appium: support only web testing

```js
I.seeInCurrentUrl('/register'); // we are on registration page
```

**Parameters**

-   `url`  

## seeInField

Checks that the given input field or textarea equals to given value.
For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.

Appium: support only web testing

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

Checks that the active JavaScript popup, as created by `window.alert|window.confirm|window.prompt`, contains the given string.

Appium: support only web testing

**Parameters**

-   `text`  

## seeInSource

Checks that the current page contains the given string in its raw source code.

Appium: support

```js
I.seeInSource('<h1>Green eggs &amp; ham</h1>');
```

**Parameters**

-   `text`  

## seeInTitle

Checks that title contains text.

Appium: support only web testing

**Parameters**

-   `text`  

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

## selectOption

Selects an option in a drop-down select.
Field is searched by label | name | CSS | XPath.
Option is selected by visible text or by value.

Appium: support only web testing

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

Appium: support only web testing

```js
I.setCookie({name: 'auth', value: true});
```

**Parameters**

-   `cookie`  Uses Selenium's JSON [cookie format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).

## switchTo

Switches frame or in case of null locator reverts to parent.

Appium: support only web testing

**Parameters**

-   `locator`  

## wait

Pauses execution for a number of seconds.

Appium: support

```js
I.wait(2); // wait 2 secs
```

**Parameters**

-   `sec`  

## waitForElement

Waits for element to be present on page (by default waits for 1sec).
Element can be located by CSS or XPath.

Appium: support

```js
I.waitForElement('.btn.continue');
I.waitForElement('.btn.continue', 5); // wait for 5 secs
```

**Parameters**

-   `locator`  element located by CSS|XPath|strict locator
-   `sec`  time seconds to wait, 1 by default

## waitForEnabled

Waits for element to become enabled (by default waits for 1sec).
Element can be located by CSS or XPath.

Appium: support

**Parameters**

-   `locator`  element located by CSS|XPath|strict locator
-   `sec`  time seconds to wait, 1 by default

## waitForInvisible

Waits for an element to become invisible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

Appium: support

    I.waitForInvisible('#popup');

**Parameters**

-   `locator`  element located by CSS|XPath|strict locator
-   `sec`  time seconds to wait, 1 by default

## waitForStalenessOf

Waits for an element to become not attached to the DOM on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

Appium: support

    I.waitForStalenessOf('#popup');

**Parameters**

-   `locator`  element located by CSS|XPath|strict locator
-   `sec`  time seconds to wait, 1 by default

## waitForText

Waits for a text to appear (by default waits for 1sec).
Element can be located by CSS or XPath.
Narrow down search results by providing context.

Appium: support

```js
I.waitForText('Thank you, form has been submitted');
I.waitForText('Thank you, form has been submitted', 5, '#modal');
```

**Parameters**

-   `text`  to wait for
-   `sec`  seconds to wait
-   `context`  element located by CSS|XPath|strict locator

## waitForVisible

Waits for an element to become visible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

Appium: support

    I.waitForVisible('#popup');

**Parameters**

-   `locator`  element located by CSS|XPath|strict locator
-   `sec`  time seconds to wait, 1 by default

## waitToHide

Waits for an element to become invisible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

Appium: support

**Parameters**

-   `locator`  
-   `sec`  

## waitUntil

Waits for a function to return true (waits for 1sec by default).

Appium: support

**Parameters**

-   `fn`  
-   `sec`  


#### Appium extra methods

## checkAppIsInstalled

Check if an app is installed.

Appium: support only Android

```js
I.checkAppIsInstalled("com.MainApp");
```

**Parameters**

-   `bundleId` -	ID of bundled app

## checkAppIsNotInstalled

Check if an app is not installed.

Appium: support only Android

```js
I.checkAppIsNotInstalled("com.MainApp");
```

**Parameters**

-   `bundleId` -	ID of bundled app

## checkCurrentActivityIs

check current activity on an Android device.

Appium: support only Android

```js
I.checkCurrentActivityIs(".MainActivity");
```

**Parameters**

-   `currentActivity` -	expected current activity

## checkDeviceIsLocked

Check whether the device is locked.

Appium: support only Android

```js
I.checkDeviceIsLocked()
```

## checkDeviceIsNotLocked

Check whether the device is not locked.

Appium: support only Android

```js
I.checkDeviceIsNotLocked()
```

## checkOrientationIs

Check the device orientation

Appium: support Android and iOS

```js
I.checkOrientationIs("landscape");
```

**Parameters**

-   `orientation` -	expected orientation ("landscape" or "portrait")

## grabAllContexts

Get list of all available contexts

Appium: support Android and iOS

```js
let contexts = yield I.grabAllContexts()
/*
{ status: 0,
value: 'NATIVE_APP',
sessionId: '4238eb4c-0737-4c74-8d7f-e9e69be087e9' }
*/
```

## grabContext

Retrieve current context

Appium: support Android and iOS

```js
let context = yield I.grabContext()
/*
{ status: 0,
value: 'NATIVE_APP',
sessionId: '4238eb4c-0737-4c74-8d7f-e9e69be087e9' }
*/
```

## grabCurrentActivity

Get current device activity.

Appium: support only Android

```js
let currentActivity = yield I.grabCurrentActivity()
/*
.ui.WalkthroughActivity
*/
```

## grabGeoLocation

Get the current geolocation.
Only for browser, firstly you sould setGeoLocation

Appium: support Android and iOS

```js
let geoLocation = yield I.grabGeoLocation()
/*
{ accuracy: 100, altitude: 0, latitude: 2, longitude: 6 }
*/
```

## grabNetworkConnection

Get informations about the current network connection (Data/WIFI/Airplane). The actual server value will be a number. However WebdriverIO additional properties to the response object to allow easier assertions.

Appium: support only Android

```js
let networkConnection = yield I.grabNetworkConnection()
/*
{ status: 0,
value: 6,
sessionId: '24781a27-4d0e-45ee-b964-6b3934d63fb7',
inAirplaneMode: false,
hasWifi: true,
hasData: true }
*/
```

## grabOrientation

Get current orientation.

Appium: support Android and iOS

```js
let orientation = yield I.grabOrientation()
/*
portrait
*/
```

## grabSettings

Get all the currently specified settings

Appium: support only Android

```js
let settings = yield I.grabSettings()
/*
{ status: 0,
value: { ignoreUnimportantViews: false },
sessionId: 'ef9e1a42-0f1c-48dc-a5d3-ebc127e7952f' }
*/
```

## hideDeviceKeyboard

Hide the keyboard. (taps outside to hide keyboard per default)

Appium: support Android and iOS

```js
I.hideDeviceKeyboard('tapOutside');
I.hideDeviceKeyboard('pressKey', 'Done');
```

**Parameters**

-   `strategy` - desired strategy to close keyboard (‘tapOutside’ or ‘pressKey’)
-   `key` - key to close keyboard

## installApp

Install an app on device.

Appium: support only Android

```js
I.installApp('/path/to/my/App.apk');
```

**Parameters**

-   `path` - path to Android application


## lockDevice

Lock the device.

Appium: support only Android

```js
I.lockDevice()
```

## longPressKeycode

Press a particular key code on the device.

Appium: support only Android

```js
I.longPressKeycode(3)
```

## makeTouchAction

The Touch Action API provides the basis of all gestures that can be automated in Appium. At its core is the ability to chain together ad hoc individual actions, which will then be applied to an element in the application on the device.
Full documentation http://webdriver.io/api/mobile/touchAction.html

Appium: support Android and iOS

```js
I.makeTouchAction('//UITextbox', 'tap');
```

**Parameters**

-   `locator` - selector to execute the touchAction on
-   `action` - action to execute

## openNotifications

Open the notifications panel on the device.

Appium: support only Android

```js
I.openNotifications()
```

## pullFile

Pulls a file from the device.

Appium: support Android and iOS

```js
I.pullFile('/sdcard/myfile.txt', 'c:/tmp/myfile.txt');
```

**Parameters**

-   `path` - device path to file
-   `dest` - destination path to file

## removeApp

Remove an app from the device.

Appium: support only Android

```js
I.removeApp('com.Myapp');
```

**Parameters**

-   `bundleId` -  bundle ID of application

## sendAppToBackground

Send the currently active app to the background and return it back.

Appium: support only Android

```js
I.sendAppToBackground(5);
```

**Parameters**

-   `seconds` -  number of seconds after the app will open again

## sendDeviceKeyEvent

Send a key event to the device
list of keys: https://developer.android.com/reference/android/view/KeyEvent.html

Appium: support only Android

```js
I.sendDeviceKeyEvent(3)
```

**Parameters**

-   `keyValue` - device specific key value.

## setOrientation

Set a device orientation. Will fail, if app will not change orientation

Appium: support Android and iOS

```js
I.setOrientation('landscape')
```

**Parameters**

-   `orientation` - orientation (landscape/portrait)

## setGeoLocation

Set the current geolocation. Only for browser. (don't know usage).

Appium: support only Android

```js
I.setGeoLocation(30, 50.33, 551)
```

**Parameters**

-   `latitude`
-   `longitude`
-   `altitude`

## setNetworkConnection

Set network connection.

Appium: support only Android

```js
I.setNetworkConnection(1)
```

**Parameters**

-   `value` - bitmasks of network connection. See http://webdriver.io/api/mobile/setNetworkConnection.html

## setSettings

Update the current setting on the device

Appium: support Android and iOS

```js
I.setSettings({ cyberdelia: 'open' })
```

**Parameters**

-   `settings` - key/value pairs defining settings on the device

## startActivity

Start an arbitrary Android activity during a session.

Appium: support only Android

```js
I.startActivity('io.appium.android.apis','.view.DragAndDropDemo')
```

**Parameters**

-   `appPackage` - name of app
-   `appActivity` - name of activity


## swipe

Perform a swipe on the screen or an element.

Appium: support Android and iOS

```js
I.swipe('//elem', 300, 200, 150);
```

**Parameters**

-   `locator` - element to swipe on
-   `xoffset` - x offset of swipe gesture (in pixels or relative units)
-   `yoffset` - y offset of swipe gesture (in pixels or relative units)
-   `speed` - time (in seconds) to spend performing the swipe

## swipeDown

Perform a swipe down on an element.

Appium: support Android and iOS

```js
I.swipeDown('//elem', 300, 200);
```

**Parameters**

-   `locator` - element to swipe on
-   `yoffset` - y offset of swipe gesture (in pixels or relative units)
-   `speed` - time (in seconds) to spend performing the swipe

## swipeLeft

Perform a swipe left on an element.

Appium: support Android and iOS

```js
I.swipeDown('//elem', 300, 200);
```

**Parameters**

-   `locator` - element to swipe on
-   `xoffset` - x offset of swipe gesture (in pixels or relative units)
-   `speed` - time (in seconds) to spend performing the swipe

## swipeRight

Perform a swipe right on an element.

Appium: support Android and iOS

```js
I.swipeRight('//elem', 300, 200);
```

**Parameters**

-   `locator` - element to swipe on
-   `xoffset` - x offset of swipe gesture (in pixels or relative units)
-   `speed` - time (in seconds) to spend performing the swipe

## swipeTo

Perform a swipe in selected direction on an element to seachable element.

Appium: support Android and iOS

```js
I.swipeTo("//searchelem", "//elem", 'left', 30, 400, 100);
```

**Parameters**

-   `seachableLocator` - element to search
-   `scrollLocator` - element to swipe on
-   `direction` - direction to swipe ('down', 'up', 'left', 'right')
-   `timeout` - seconds to wait
-   `offset` - offset of swipe gesture (in pixels or relative units)
-   `speed` - time (in seconds) to spend performing the swipe

## swipeUp

Perform a swipe right on an element.

Appium: support Android and iOS

```js
I.swipeUp('//elem', 300, 200);
```

**Parameters**

-   `locator` - element to swipe on
-   `yoffset` - y offset of swipe gesture (in pixels or relative units)
-   `speed` - time (in seconds) to spend performing the swipe


## switchToContext

Switch to the specified context

Appium: support only Android

```js
I.switchToContext('NATIVE_APP')
```

**Parameters**

-   `value` - name of context


## toggleAirplaneMode

Switch the state (enabled/disabled) of airplane mode.

Appium: support only Android

```js
I.toggleAirplaneMode();
```

## toggleLocationServices

Switch the state (enabled/disabled) of the location service.

Appium: support only Android

```js
I.toggleLocationServices();
```

## toggleWiFi

Switch the state (enabled/disabled) of the wifi service.

Appium: support only Android

```js
I.toggleWiFi();
```

## touchPerform

Performs a specific touch action. The action object need to contain the action name, x/y coordinates

Appium: support Android and iOS

```js
I.touchPerform([{
    action: 'press',
    options: {
        x: 100,
        y: 250
    }
}]);
```

**Parameters**

-   `actions` - touch action as object or object[] with attributes like touchCount, x, y, duration

## unlockDevice

Unlock the device. Works only with slide and unlock. Performs wery slow

Appium: support only Android

```js
I.unlockDevice();
```
