# Puppeteer

Uses [Google Chrome's Puppeteer](https://github.com/GoogleChrome/puppeteer) library to run tests inside headless Chrome.
Browser control is executed via DevTools without Selenium.
This helper works with a browser out of the box with no additional tools required to install.

Requires `puppeteer` package to be installed.

## Configuration

This helper should be configured in codecept.json

-   `url`: base url of website to be tested
-   `show`: (optional, default: false) - show Google Chrome window for debug.
-   `restart`: (optional, default: true) - restart browser between tests.
-   `disableScreenshots`: (optional, default: false)  - don't save screenshot on failure.
-   `fullPageScreenshots` (optional, default: false) - make full page screenshots on failure.
-   `uniqueScreenshotNames`: (optional, default: false)  - option to prevent screenshot override if you have scenarios with the same name in different suites.
-   `keepBrowserState`: (optional, default: false) - keep browser state between tests when `restart` is set to false.
-   `keepCookies`: (optional, default: false) - keep cookies between tests when `restart` is set to false.
-   `waitForAction`: (optional) how long to wait after click, doubleClick or PressKey actions in ms. Default: 100.
-   `waitForNavigation`: (optional, default: 'load'). When to consider navigation succeeded. Possible options: `load`, `domcontentloaded`, `networkidle0`, `networkidle2`. See [Puppeteer API](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagewaitfornavigationoptions). Array values are accepted as well.
-   `getPageTimeout` (optional, default: '0') config option to set maximum navigation time in milliseconds.
-   `waitForTimeout`: (optional) default wait* timeout in ms. Default: 1000.
-   `windowSize`: (optional) default window size. Set a dimension like `640x480`.
-   `userAgent`: (optional) user-agent string.
-   `manualStart`: (optional, default: false) - do not start browser before a test, start it manually inside a helper with `this.helpers["Puppeteer"]._startBrowser()`.
-   `chrome`: (optional) pass additional [Puppeteer run options](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions). Example

```js
"chrome": {
  "executablePath" : "/path/to/Chrome"
}
```

#### Example #1: Wait for 0 network connections.

```json
{
   "helpers": {
     "Puppeteer" : {
       "url": "http://localhost",
       "restart": false,
       "waitForNavigation": "networkidle0",
       "waitForAction": 500
     }
   }
}
```

#### Example #2: Wait for DOMContentLoaded event and 0 network connections

```json
{
   "helpers": {
     "Puppeteer" : {
       "url": "http://localhost",
       "restart": false,
       "waitForNavigation": [ "domcontentloaded", "networkidle0" ],
       "waitForAction": 500
     }
   }
}
```

#### Example #3: Debug in window mode

```json
{
   "helpers": {
     "Puppeteer" : {
       "url": "http://localhost",
       "show": true
     }
   }
}
```

## Access From Helpers

Receive Puppeteer client from a custom helper by accessing `browser` for the Browser object or `page` for the current Page object:

```js
const browser = this.helpers['Puppeteer'].browser;
await browser.pages(); // List of pages in the browser

const currentPage = this.helpers['Puppeteer'].page;
await currentPage.url(); // Get the url of the current page
```

**Parameters**

-   `config`  

## _addPopupListener

Add the 'dialog' event listener to a page

**Parameters**

-   `page`  

## _getPageUrl

Gets page URL including hash.

## _locate

Get elements by different locator types, including strict locator
Should be used in custom helpers:

```js
const elements = await this.helpers['Puppeteer']._locate({name: 'password'});
```

**Parameters**

-   `locator`  

## _locateCheckable

Find a checkbox by providing human readable text:

```js
this.helpers['Puppeteer']._locateCheckable('I agree with terms and conditions').then // ...
```

**Parameters**

-   `locator`  

## _locateClickable

Find a clickable element by providing human readable text:

```js
this.helpers['Puppeteer']._locateClickable('Next page').then // ...
```

**Parameters**

-   `locator`  

## _locateFields

Find field elements by providing human readable text:

```js
this.helpers['Puppeteer']._locateFields('Your email').then // ...
```

**Parameters**

-   `locator`  

## _setPage

Set current page

**Parameters**

-   `page` **object** page to set

## acceptPopup

Accepts the active JavaScript native popup window, as created by window.alert|window.confirm|window.prompt.
Don't confuse popups with modal windows, as created by [various
libraries](http://jster.net/category/windows-modals-popups).

## amAcceptingPopups

Set the automatic popup response to Accept.
This must be set before a popup is triggered.

```js
I.amAcceptingPopups();
I.click('#triggerPopup');
I.acceptPopup();
```

## amCancellingPopups

Set the automatic popup response to Cancel/Dismiss.
This must be set before a popup is triggered.

```js
I.amCancellingPopups();
I.click('#triggerPopup');
I.cancelPopup();
```

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

## cancelPopup

Dismisses the active JavaScript popup, as created by window.alert|window.confirm|window.prompt.

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
-   `name`  

## clearField

Clears a `<textarea>` or text `<input>` element's value.

```js
I.clearField('Email');
I.clearField('user[email]');
I.clearField('#email');
```

**Parameters**

-   `field`  located by label|name|CSS|XPath|strict locator

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

## closeCurrentTab

Close current tab and switches to previous.

```js
I.closeCurrentTab();
```

## closeOtherTabs

Close all tabs except for the current one.

```js
I.closeOtherTabs();
```

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

Opposite to `seeElement`. Checks that element is not visible (or in DOM)

**Parameters**

-   `locator`  located by CSS|XPath|Strict locator

## dontSeeElementInDOM

Opposite to `seeElementInDOM`. Checks that element is not on page.

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
-   `context`  

## dragAndDrop

Drag an item to a destination element.

```js
I.dragAndDrop('#dragHandle', '#container');
```

**Parameters**

-   `source`  
-   `destination`  

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
-   `value`  

## grabAttributeFrom

Retrieves an attribute from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside async with `await`** operator.

```js
let hint = await I.grabAttributeFrom('#tooltip', 'title');
```

**Parameters**

-   `locator`  element located by CSS|XPath|strict locator
-   `attr`  

## grabBrowserLogs

Get JS log from browser.

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

-   `name`  Returns cookie in JSON format. If name not passed returns all cookies for this domain.

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

-   Grab number of visible elements by locator

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

## grabTextFrom

Retrieves a text from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside async with `await`** operator.

```js
let pin = await I.grabTextFrom('#pin');
```

If multiple elements found returns an array of texts.

**Parameters**

-   `locator`  element located by CSS|XPath|strict locator

## grabTitle

Retrieves a page title and returns it to test.
Resumes test execution, so **should be used inside async with `await`** operator.

```js
let title = await I.grabTitle();
```

## grabValueFrom

Retrieves a value from a form element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside async function with `await`** operator.

```js
let email = await I.grabValueFrom('input[name=email]');
```

**Parameters**

-   `locator`  field located by label|name|CSS|XPath|strict locator

## haveRequestHeaders

Set headers for all next requests

```js
I.haveRequestHeaders({
   'X-Sent-By': 'CodeceptJS',
});
```

**Parameters**

-   `customHeaders`  

## moveCursorTo

Moves cursor to element matched by locator.
Extra shift can be set with offsetX and offsetY options

```js
I.moveCursorTo('.tooltip');
I.moveCursorTo('#submit', 5,5);
```

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
-   `height`  Unlike other drivers Puppeteer changes the size of a viewport, not the window!
    Puppeteer does not control the window of a browser so it can't adjust its real size.
    It also can't maximize a window.

## rightClick

Performs right click on an element matched by CSS or XPath.

**Parameters**

-   `locator`  
-   `context`   (optional, default `null`)

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

## seeCookie

Checks that cookie with given name exists.

```js
I.seeCookie('Auth');
```

**Parameters**

-   `name`  

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

-   `url`  

## seeElement

Checks that a given Element is visible
Element is located by CSS or XPath.

```js
I.seeElement('#modal');
```

**Parameters**

-   `locator`  located by CSS|XPath|strict locator

## seeElementInDOM

Checks that a given Element is present in the DOM
Element is located by CSS or XPath.

```js
I.seeElementInDOM('#modal');
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

## seeInPopup

Checks that the active JavaScript popup, as created by `window.alert|window.confirm|window.prompt`, contains the
given string.

**Parameters**

-   `text`  

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

## seeNumberOfElements

asserts that an element appears a given number of times in the DOM
Element is located by label or name or CSS or XPath.

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

-   `cookie`  

## switchTo

Switches frame or in case of null locator reverts to parent.

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

## switchToPreviousTab

Switch focus to a particular tab by its number. It waits tabs loading and then switch tab

```js
I.switchToPreviousTab();
I.switchToPreviousTab(2);
```

**Parameters**

-   `num`   (optional, default `1`)

## wait

Pauses execution for a number of seconds.

```js
I.wait(2); // wait 2 secs
```

**Parameters**

-   `sec`  

## waitForDetached

Waits for an element to become not attached to the DOM on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

    I.waitForDetached('#popup');

**Parameters**

-   `locator`  element located by CSS|XPath|strict locator
-   `sec`  time seconds to wait, 1 by default

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

## waitForEnabled

Waits for element to become enabled (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `locator`  element located by CSS|XPath|strict locator
-   `sec`  time seconds to wait, 1 by default

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
-   `sec`  time seconds to wait, 1 by default

## waitForInvisible

Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

    I.waitForInvisible('#popup');

**Parameters**

-   `locator`  element located by CSS|XPath|strict locator
-   `sec`  time seconds to wait, 1 by default

## waitForNavigation

Waits for navigation to finish. By default takes configured `waitForNavigation` option.

See [Pupeteer's reference](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagewaitfornavigationoptions)

**Parameters**

-   `opts` **Any** 

## waitForRequest

Waits for a network request.

```js
I.waitForRequest('http://example.com/resource');
I.waitForRequest(request => request.url() === 'http://example.com' && request.method() === 'GET');
```

**Parameters**

-   `urlOrPredicate` **Any** 
-   `sec` **Any** 

## waitForResponse

Waits for a network request.

```js
I.waitForResponse('http://example.com/resource');
I.waitForResponse(request => request.url() === 'http://example.com' && request.method() === 'GET');
```

**Parameters**

-   `urlOrPredicate` **Any** 
-   `sec` **Any** 

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

## waitForValue

Waits for the specified value to be in value attribute

```js
I.waitForValue('//input', "GoodValue");
```

**Parameters**

-   `field`  input field
-   `locator`  
-   `value`  expected value
-   `sec`  seconds to wait, 1 sec by default

## waitForVisible

Waits for an element to become visible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

    I.waitForVisible('#popup');

**Parameters**

-   `locator`  element located by CSS|XPath|strict locator
-   `sec`  time seconds to wait, 1 by default

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
-   `sec`  

## waitToHide

Waits for an element to hide (by default waits for 1sec).
Element can be located by CSS or XPath.

    I.waitToHide('#popup');

**Parameters**

-   `locator`  element located by CSS|XPath|strict locator
-   `sec`  time seconds to wait, 1 by default

## waitUntil

Waits for a function to return true (waits for 1sec by default).

```js
I.waitUntil(() => window.requests == 0);
I.waitUntil(() => window.requests == 0, 5);
```

**Parameters**

-   `function`  function which is executed in browser context.
-   `fn`  
-   `sec`  time seconds to wait, 1 by default

## waitUrlEquals

Waits for the entire URL to match the expected

```js
I.waitUrlEquals('/info', 2);
I.waitUrlEquals('http://127.0.0.1:8000/info');
```

**Parameters**

-   `urlPart`  
-   `sec`   (optional, default `null`)
