# Protractor

[lib/helper/Protractor.js:47-233](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L47-L233 "Source code on GitHub")

**Extends SeleniumWebdriver**

Protractor helper is based on [Protractor library](http://www.protractortest.org) and used for testing AngularJS applications.

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
-   `driver` - which protrator driver to use (local, direct, session, hosted, sauce, browserstack). By default set to 'hosted' which requires selenium server to be started.
-   `seleniumAddress` - Selenium address to connect (default: <http://localhost:4444/wd/hub>)

other options are the same as in [Protractor config](https://github.com/angular/protractor/blob/master/docs/referenceConf.js).

## amInsideAngularApp

[lib/helper/Protractor.js:157-170](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L157-L170 "Source code on GitHub")

Enters Angular mode (switched on by default)
Should be used after "amOutsideAngularApp"

## amOutsideAngularApp

[lib/helper/Protractor.js:146-151](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L146-L151 "Source code on GitHub")

Switch to non-Angular mode,
start using WebDriver instead of Protractor in this session

## waitForClickable

[lib/helper/Protractor.js:184-188](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L184-L188 "Source code on GitHub")

Waits for element to become clickable for number of seconds.

**Parameters**

-   `locator`  
-   `sec`  

## waitForElement

[lib/helper/Protractor.js:175-179](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L175-L179 "Source code on GitHub")

 Waits for element to be present on page (by default waits for 1sec).
 Element can be located by CSS or XPath.
 
**Parameters**

-   `locator`  
-   `sec`  

## waitForText

[lib/helper/Protractor.js:202-209](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L202-L209 "Source code on GitHub")

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

[lib/helper/Protractor.js:193-197](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L193-L197 "Source code on GitHub")

Waits for an element to become visible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `locator`  
-   `sec`  

## amOnPage

[lib/helper/Protractor.js:415-415](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L415-L415 "Source code on GitHub")

Opens a web page in a browser. Requires relative or absolute url.
If url starts with `/`, opens a web page of a site defined in `url` config parameter.

```js
I.amOnPage('/'); // opens main page of website
I.amOnPage('https://github.com'); // opens github
I.amOnPage('/login'); // opens a login page
```

## appendField

[lib/helper/Protractor.js:425-425](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L425-L425 "Source code on GitHub")

Appends text to a input field or textarea.
Field is located by name, label, CSS or XPath

```js
I.appendField('#myTextField', 'appended');
```

## attachFile

[lib/helper/Protractor.js:435-435](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L435-L435 "Source code on GitHub")

Attaches a file to element located by label, name, CSS or XPath
Path to file is relative current codecept directory (where codecept.json is located).
File will be uploaded to remove system (if tests are running remotely).

```js
I.attachFile('Avatar', 'data/avatar.jpg');
I.attachFile('form input[name=avatar]', 'data/avatar.jpg');
```

## checkOption

[lib/helper/Protractor.js:445-445](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L445-L445 "Source code on GitHub")

Selects a checkbox or radio button.
Element is located by label or name or CSS or XPath.

The second parameter is a context (CSS or XPath locator) to narrow the search.

```js
I.checkOption('#agree');
I.checkOption('I Agree to Terms and Conditions');
I.checkOption('agree', '//form');
```

## clearCookie

[lib/helper/Protractor.js:455-455](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L455-L455 "Source code on GitHub")

Clears a cookie by name,
if none provided clears all cookies

```js
I.clearCookie();
I.clearCookie('test');
```

## click

[lib/helper/Protractor.js:465-465](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L465-L465 "Source code on GitHub")

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

## dontSee

[lib/helper/Protractor.js:555-555](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L555-L555 "Source code on GitHub")

Opposite to `see`. Checks that a text is not present on a page.
Use context parameter to narrow down the search.

```js
I.dontSee('Login'); // assume we are already logged in
```

## dontSeeCheckboxIsChecked

[lib/helper/Protractor.js:475-475](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L475-L475 "Source code on GitHub")

 Verifies that the specified checkbox is not checked.
 
## dontSeeCookie

[lib/helper/Protractor.js:485-485](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L485-L485 "Source code on GitHub")

Checks that cookie with given name does not exist.

## dontSeeCurrentUrlEquals

[lib/helper/Protractor.js:495-495](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L495-L495 "Source code on GitHub")

Checks that current url is not equal to provided one.
If a relative url provided, a configured url will be prepended to it.

## dontSeeElement

[lib/helper/Protractor.js:505-505](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L505-L505 "Source code on GitHub")

Opposite to `seeElement`. Checks that element is not visible

## dontSeeInCurrentUrl

[lib/helper/Protractor.js:515-515](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L515-L515 "Source code on GitHub")

Checks that current url does not contain a provided fragment.

## dontSeeInField

[lib/helper/Protractor.js:525-525](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L525-L525 "Source code on GitHub")

Checks that value of input field or textare doesn't equal to given value
Opposite to `seeInField`.

## dontSeeInSource

[lib/helper/Protractor.js:535-535](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L535-L535 "Source code on GitHub")

Checks that the current page contains the given string in its raw source code
## dontSeeInTitle

[lib/helper/Protractor.js:545-545](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L545-L545 "Source code on GitHub")

Checks that title does not contain text.
## executeAsyncScript

[lib/helper/Protractor.js:565-565](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L565-L565 "Source code on GitHub")

Executes async script on page.
Provided function should execute a passed callback (as first argument) to signal it is finished.

## executeScript

[lib/helper/Protractor.js:575-575](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L575-L575 "Source code on GitHub")

Executes sync script on a page.
Pass arguments to function as additional parameters.
Will return execution result to a test.
In this case you should use generator and yield to receive results.

## fillField

[lib/helper/Protractor.js:585-585](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L585-L585 "Source code on GitHub")

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

## grabAttributeFrom

[lib/helper/Protractor.js:595-595](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L595-L595 "Source code on GitHub")

Retrieves an attribute from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let hint = yield I.grabAttributeFrom('#tooltip', 'title');
```

## grabCookie

[lib/helper/Protractor.js:605-605](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L605-L605 "Source code on GitHub")

Gets a cookie object by name
* Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let cookie = I.grabCookie('auth');
assert(cookie.value, '123456');
```
## grabTextFrom

[lib/helper/Protractor.js:615-615](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L615-L615 "Source code on GitHub")

Retrieves a text from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let pin = yield I.grabTextFrom('#pin');
```

## grabTitle

[lib/helper/Protractor.js:625-625](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L625-L625 "Source code on GitHub")

Retrieves a page title and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let title = yield I.grabTitle();
```

## grabValueFrom

[lib/helper/Protractor.js:635-635](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L635-L635 "Source code on GitHub")

Retrieves a value from a form element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let email = yield I.grabValueFrom('input[name=email]');
```

## pressKey

[lib/helper/Protractor.js:645-645](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L645-L645 "Source code on GitHub")

Presses a key on a focused element.
Speical keys like 'Enter', 'Control', [etc](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value)
will be replaced with corresponding unicode.
If modiferier key is used (Control, Command, Alt, Shift) in array, it will be released afterwards.
```js
I.pressKey('Enter');
I.pressKey(['Control','a']);
```

## resizeWindow

[lib/helper/Protractor.js:655-655](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L655-L655 "Source code on GitHub")

Resize the current window to provided width and height.
First parameter can be set to `maximize`

## saveScreenshot

[lib/helper/Protractor.js:665-665](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L665-L665 "Source code on GitHub")

Saves a screenshot to ouput folder (set in codecept.json).
Filename is relative to output folder.

```js
I.saveScreenshot('debug.png');
```

## see

[lib/helper/Protractor.js:755-755](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L755-L755 "Source code on GitHub")

Checks that a page contains a visible text.
Use context parameter to narrow down the search.

```js
I.see('Welcome'); // text welcome on a page
I.see('Welcome', '.content'); // text inside .content div
I.see('Register', {css: 'form.register'}); // use strict locator
```

## seeCheckboxIsChecked

[lib/helper/Protractor.js:675-675](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L675-L675 "Source code on GitHub")

Verifies that the specified checkbox is checked.

```js
I.seeCheckboxIsChecked('Agree');
I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
```

## seeCookie

[lib/helper/Protractor.js:685-685](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L685-L685 "Source code on GitHub")

Checks that cookie with given name exists.

```js
I.seeCookie('Auth');
```
## seeCurrentUrlEquals

[lib/helper/Protractor.js:695-695](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L695-L695 "Source code on GitHub")

Checks that current url is equal to provided one.
If a relative url provided, a configured url will be prepended to it.
So both examples will work:

```js
I.seeCurrentUrlEquals('/register');
I.seeCurrentUrlEquals('http://my.site.com/register');
```

## seeElement

[lib/helper/Protractor.js:705-705](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L705-L705 "Source code on GitHub")

Checks that a given Element is visible
Element is located by CSS or XPath.

```js
I.seeElement('#modal');
```

## seeInCurrentUrl

[lib/helper/Protractor.js:715-715](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L715-L715 "Source code on GitHub")

Checks that current url contains a provided fragment.

```js
I.seeInCurrentUrl('/register'); // we are on registration page
```

## seeInField

[lib/helper/Protractor.js:725-725](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L725-L725 "Source code on GitHub")

Checks that the given input field or textarea equals to given value.
For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.

```js
I.seeInField('Username', 'davert');
I.seeInField({css: 'form textarea'},'Type your comment here');
I.seeInField('form input[type=hidden]','hidden_value');
I.seeInField('#searchform input','Search');
```

## seeInSource

[lib/helper/Protractor.js:735-735](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L735-L735 "Source code on GitHub")

Checks that the current page contains the given string in its raw source code.

```js
I.seeInSource('<h1>Green eggs &amp; ham</h1>');
```

## seeInTitle

[lib/helper/Protractor.js:745-745](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L745-L745 "Source code on GitHub")

Checks that title contains text.

## selectOption

[lib/helper/Protractor.js:765-765](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L765-L765 "Source code on GitHub")

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

## setCookie

[lib/helper/Protractor.js:775-775](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L775-L775 "Source code on GitHub")

Sets a cookie

```js
I.setCookie({name: 'auth', value: true});
```
## waitForElement

[lib/helper/Protractor.js:785-785](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L785-L785 "Source code on GitHub")

 Waits for element to be present on page (by default waits for 1sec).
 Element can be located by CSS or XPath.
 
## waitForEnabled

[lib/helper/Protractor.js:795-795](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L795-L795 "Source code on GitHub")

Waits for element to become enabled (by default waits for 1sec).
Element can be located by CSS or XPath.

## waitForText

[lib/helper/Protractor.js:805-805](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L805-L805 "Source code on GitHub")

Waits for a text to appear (by default waits for 1sec).
Element can be located by CSS or XPath.
Narrow down search results by providing context.

```js
I.waitForText('Thank you, form has been submitted');
I.waitForText('Thank you, form has been submitted', 5, '#modal');
```

## waitForVisible

[lib/helper/Protractor.js:815-815](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/Protractor.js#L815-L815 "Source code on GitHub")

Waits for an element to become visible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.
