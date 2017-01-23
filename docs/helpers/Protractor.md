# Protractor

Protractor helper is based on [Protractor library](http://www.protractortest.org) and used for testing AngularJS applications.

#### Selenium Installation

1.  Download [Selenium Server](http://docs.seleniumhq.org/download/)
2.  Launch the daemon: `java -jar selenium-server-standalone-2.xx.xxx.jar`

#### PhantomJS Installation

PhantomJS is a headless alternative to Selenium Server that implements the WebDriver protocol.
It allows you to run Selenium tests on a server without a GUI installed.

1.  Download [PhantomJS](http://phantomjs.org/download.html)
2.  Run PhantomJS in WebDriver mode: `phantomjs --webdriver=4444`

### Configuration

This helper should be configured in codecept.json

-   `url` - base url of website to be tested
-   `browser` - browser in which perform testing
-   `driver` - which protrator driver to use (local, direct, session, hosted, sauce, browserstack). By default set to 'hosted' which requires selenium server to be started.
-   `restart` (optional, default: true) - restart browser between tests.
-   `seleniumAddress` - Selenium address to connect (default: <http://localhost:4444/wd/hub>)
-   `rootElement` - Root element of AngularJS application (default: body)
-   `waitForTimeout`: (optional) sets default wait time in _ms_ for all `wait*` functions. 1000 by default.
-   `scriptsTimeout`: (optional) timeout in milliseconds for each script run on the browser, 10000 by default.
-   `windowSize`: (optional) default window size. Set to `maximize` or a dimension in the format `640x480`.
-   `manualStart` (optional, default: false) - do not start browser before a test, start it manually inside a helper with `this.helpers["WebDriverIO"]._startBrowser()`
-   `capabilities`: {} - list of [Desired Capabilities](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities)
-   `proxy`: set proxy settings

other options are the same as in [Protractor config](https://github.com/angular/protractor/blob/master/docs/referenceConf.js).

## Access From Helpers

Receive a WebDriverIO client from a custom helper by accessing `browser` property:

```js
this.helpers['Protractor'].browser
```

**Parameters**

-   `config`  

## _locate

Get elements by different locator types, including strict locator
Should be used in custom helpers:

```js
this.helpers['Protractor']._locate({model: 'newTodo'}).then //...
```

**Parameters**

-   `locator`  

## amInsideAngularApp

Enters Angular mode (switched on by default)
Should be used after "amOutsideAngularApp"

## amOutsideAngularApp

Switch to non-Angular mode,
start using WebDriver instead of Protractor in this session

## haveModule

Injects Angular module.

```js
I.haveModule('modName', function() {
  angular.module('modName', []).value('foo', 'bar');
});
```

**Parameters**

-   `modName`  
-   `fn`  

## moveTo

Moves to url

**Parameters**

-   `path`  

## refresh

Reloads page

## resetModule

Removes mocked Angular module. If modName not specified - clears all mock modules.

```js
I.resetModule(); // clears all
I.resetModule('modName');
```

**Parameters**

-   `modName`  

## waitForClickable

Waits for element to become clickable for number of seconds.

**Parameters**

-   `locator`  
-   `sec`  

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

## waitForInvisible

Waits for an element to become invisible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

    I.waitForInvisible('#popup');

**Parameters**

-   `locator`  element located by CSS|XPath|strict locator
-   `sec`  time seconds to wait, 1 by default

## waitForStalenessOf

Waits for an element to become not attached to the DOM on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

    I.waitForStalenessOf('#popup');

**Parameters**

-   `locator`  element located by CSS|XPath|strict locator
-   `sec`  time seconds to wait, 1 by default

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

## waitForVisible

Waits for an element to become visible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

    I.waitForVisible('#popup');

**Parameters**

-   `locator`  element located by CSS|XPath|strict locator
-   `sec`  time seconds to wait, 1 by default

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

## appendField

Appends text to a input field or textarea.
Field is located by name, label, CSS or XPath

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

```js
I.attachFile('Avatar', 'data/avatar.jpg');
I.attachFile('form input[name=avatar]', 'data/avatar.jpg');
```

**Parameters**

-   `locator`  field located by label|name|CSS|XPath|strict locator
-   `pathToFile`  local file path relative to codecept.json config file

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

## clearCookie

Clears a cookie by name,
if none provided clears all cookies

```js
I.clearCookie();
I.clearCookie('test');
```

**Parameters**

-   `cookie`  (optional)

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

## dontSee

Opposite to `see`. Checks that a text is not present on a page.
Use context parameter to narrow down the search.

```js
I.dontSee('Login'); // assume we are already logged in
```

**Parameters**

-   `text`  is not present
-   `context`  (optional) element located by CSS|XPath|strict locator in which to perfrom search

## dontSeeCheckboxIsChecked

Verifies that the specified checkbox is not checked.

**Parameters**

-   `field`  located by label|name|CSS|XPath|strict locator

## dontSeeCookie

Checks that cookie with given name does not exist.

**Parameters**

-   `name`  

## dontSeeCurrentUrlEquals

Checks that current url is not equal to provided one.
If a relative url provided, a configured url will be prepended to it.

**Parameters**

-   `url`  

## dontSeeElement

Opposite to `seeElement`. Checks that element is not visible

**Parameters**

-   `locator`  located by CSS|XPath|Strict locator

## dontSeeInCurrentUrl

Checks that current url does not contain a provided fragment.

**Parameters**

-   `url`  

## dontSeeInField

Checks that value of input field or textare doesn't equal to given value
Opposite to `seeInField`.

**Parameters**

-   `field`  located by label|name|CSS|XPath|strict locator
-   `value`  is not expected to be a field value

## dontSeeInSource

Checks that the current page contains the given string in its raw source code

**Parameters**

-   `text`  

## dontSeeInTitle

Checks that title does not contain text.

**Parameters**

-   `text`  

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
let val = yield I.executeAsyncScript(function(url, done) {
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
In this case you should use generator and yield to receive results.

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
-   `value`  

## grabAttributeFrom

Retrieves an attribute from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let hint = yield I.grabAttributeFrom('#tooltip', 'title');
```

**Parameters**

-   `locator`  element located by CSS|XPath|strict locator
-   `attr`  

## grabCookie

Gets a cookie object by name
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let cookie = I.grabCookie('auth');
assert(cookie.value, '123456');
```

**Parameters**

-   `name`  

## grabTextFrom

Retrieves a text from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let pin = yield I.grabTextFrom('#pin');
```

**Parameters**

-   `locator`  element located by CSS|XPath|strict locator

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

-   `locator`  field located by label|name|CSS|XPath|strict locator

## pressKey

Presses a key on a focused element.
Speical keys like 'Enter', 'Control', [etc](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value)
will be replaced with corresponding unicode.
If modifier key is used (Control, Command, Alt, Shift) in array, it will be released afterwards.

```js
I.pressKey('Enter');
I.pressKey(['Control','a']);
```

**Parameters**

-   `key`  

## resizeWindow

Resize the current window to provided width and height.
First parameter can be set to `maximize`

**Parameters**

-   `width`  or `maximize`
-   `height`  

## saveScreenshot

Saves a screenshot to ouput folder (set in codecept.json).
Filename is relative to output folder.

```js
I.saveScreenshot('debug.png');
```

**Parameters**

-   `fileName`  

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

## seeCheckboxIsChecked

Verifies that the specified checkbox is checked.

```js
I.seeCheckboxIsChecked('Agree');
I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
```

**Parameters**

-   `field`  located by label|name|CSS|XPath|strict locator

## seeCookie

Checks that cookie with given name exists.

```js
I.seeCookie('Auth');
```

**Parameters**

-   `name`  

## seeCurrentUrlEquals

Checks that current url is equal to provided one.
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

```js
I.seeElement('#modal');
```

**Parameters**

-   `locator`  located by CSS|XPath|strict locator

## seeInCurrentUrl

Checks that current url contains a provided fragment.

```js
I.seeInCurrentUrl('/register'); // we are on registration page
```

**Parameters**

-   `url`  

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
-   `value`  

## seeInSource

Checks that the current page contains the given string in its raw source code.

```js
I.seeInSource('<h1>Green eggs &amp; ham</h1>');
```

**Parameters**

-   `text`  

## seeInTitle

Checks that title contains text.

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

-   `cookie`  
