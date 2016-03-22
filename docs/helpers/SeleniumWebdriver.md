# SeleniumWebdriver

[lib/helper/SeleniumWebdriver.js:46-557](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L46-L557 "Source code on GitHub")

**Extends Helper**

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
-   `waitForTimeout`: (optional) sets default wait time in _ms_ for all `wait*` functions. 1000 by default;
-   `driver` - which protrator driver to use (local, direct, session, hosted, sauce, browserstack). By default set to 'hosted' which requires selenium server to be started.
-   `seleniumAddress` - Selenium address to connect (default: <http://localhost:4444/wd/hub>)

other options are the same as in [Protractor config](https://github.com/angular/protractor/blob/master/docs/referenceConf.js).

## amOnPage

[lib/helper/SeleniumWebdriver.js:128-133](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L128-L133 "Source code on GitHub")

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

[lib/helper/SeleniumWebdriver.js:259-266](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L259-L266 "Source code on GitHub")

Appends text to a input field or textarea.
Field is located by name, label, CSS or XPath

```js
I.appendField('#myTextField', 'appended');
```

**Parameters**

-   `field`
-   `value`

## attachFile

[lib/helper/SeleniumWebdriver.js:225-240](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L225-L240 "Source code on GitHub")

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

## checkOption

[lib/helper/SeleniumWebdriver.js:271-284](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L271-L284 "Source code on GitHub")

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

[lib/helper/SeleniumWebdriver.js:476-481](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L476-L481 "Source code on GitHub")

Clears a cookie by name,
if none provided clears all cookies

```js
I.clearCookie();
I.clearCookie('test');
```

**Parameters**

-   `cookie`

## click

[lib/helper/SeleniumWebdriver.js:138-144](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L138-L144 "Source code on GitHub")

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

[lib/helper/SeleniumWebdriver.js:156-158](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L156-L158 "Source code on GitHub")

Opposite to `see`. Checks that a text is not present on a page.
Use context parameter to narrow down the search.

```js
I.dontSee('Login'); // assume we are already logged in
```

**Parameters**

-   `text`
-   `context`

## dontSeeCheckboxIsChecked

[lib/helper/SeleniumWebdriver.js:297-300](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L297-L300 "Source code on GitHub")

 Verifies that the specified checkbox is not checked.

**Parameters**

-   `option`

## dontSeeCookie

[lib/helper/SeleniumWebdriver.js:495-499](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L495-L499 "Source code on GitHub")

Checks that cookie with given name does not exist.

**Parameters**

-   `name`

## dontSeeCurrentUrlEquals

[lib/helper/SeleniumWebdriver.js:437-441](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L437-L441 "Source code on GitHub")

Checks that current url is not equal to provided one.
If a relative url provided, a configured url will be prepended to it.

**Parameters**

-   `uri`

## dontSeeElement

[lib/helper/SeleniumWebdriver.js:368-373](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L368-L373 "Source code on GitHub")

Opposite to `seeElement`. Checks that element is not on page.

**Parameters**

-   `locator`

## dontSeeInCurrentUrl

[lib/helper/SeleniumWebdriver.js:419-423](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L419-L423 "Source code on GitHub")

Checks that current url does not contain a provided fragment.

**Parameters**

-   `urlFragment`

## dontSeeInField

[lib/helper/SeleniumWebdriver.js:252-254](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L252-L254 "Source code on GitHub")

Checks that value of input field or textare doesn't equal to given value
Opposite to `seeInField`.

**Parameters**

-   `field`
-   `value`

## dontSeeInSource

[lib/helper/SeleniumWebdriver.js:387-391](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L387-L391 "Source code on GitHub")

Checks that the current page contains the given string in its raw source code
**Parameters**

-   `text`

## dontSeeInTitle

[lib/helper/SeleniumWebdriver.js:340-344](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L340-L344 "Source code on GitHub")

Checks that title does not contain text.
**Parameters**

-   `text`

## executeAsyncScript

[lib/helper/SeleniumWebdriver.js:403-405](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L403-L405 "Source code on GitHub")

Executes async script on page.
Provided function should execute a passed callback (as first argument) to signal it is finished.

**Parameters**

-   `fn`

## executeScript

[lib/helper/SeleniumWebdriver.js:396-398](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L396-L398 "Source code on GitHub")

Executes sync script on a page.
Pass arguments to function as additional parameters.
Will return execution result to a test.
In this case you should use generator and yield to receive results.

**Parameters**

-   `fn`

## fillField

[lib/helper/SeleniumWebdriver.js:192-200](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L192-L200 "Source code on GitHub")

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

[lib/helper/SeleniumWebdriver.js:324-326](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L324-L326 "Source code on GitHub")

Retrieves an attribute from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let hint = yield I.grabAttributeFrom('#tooltip', 'title');
```

**Parameters**

-   `locator`
-   `attr`

## grabCookie

[lib/helper/SeleniumWebdriver.js:506-508](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L506-L508 "Source code on GitHub")

Gets a cookie object by name
* Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let cookie = I.grabCookie('auth');
assert(cookie.value, '123456');
```
Returns cookie in JSON [format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).

**Parameters**

-   `name`

## grabTextFrom

[lib/helper/SeleniumWebdriver.js:305-307](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L305-L307 "Source code on GitHub")

Retrieves a text from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let pin = yield I.grabTextFrom('#pin');
```

**Parameters**

-   `locator`

## grabTitle

[lib/helper/SeleniumWebdriver.js:349-354](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L349-L354 "Source code on GitHub")

Retrieves a page title and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let title = yield I.grabTitle();
```

## grabValueFrom

[lib/helper/SeleniumWebdriver.js:312-319](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L312-L319 "Source code on GitHub")

Retrieves a value from a form element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let email = yield I.grabValueFrom('input[name=email]');
```

**Parameters**

-   `locator`

## pressKey

[lib/helper/SeleniumWebdriver.js:205-220](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L205-L220 "Source code on GitHub")

Presses a key on a focused element.
Speical keys like 'Enter', 'Control', [etc](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value)
will be replaced with corresponding unicode.
If modiferier key is used (Control, Command, Alt, Shift) in array, it will be released afterwards.
```js
I.pressKey('Enter');
I.pressKey(['Control','a']);
```

**Parameters**

-   `key`

## resizeWindow

[lib/helper/SeleniumWebdriver.js:513-518](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L513-L518 "Source code on GitHub")

Resize the current window to provided width and height.
First parameter can be set to `maximize`

**Parameters**

-   `width`
-   `height`

## see

[lib/helper/SeleniumWebdriver.js:149-151](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L149-L151 "Source code on GitHub")

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

[lib/helper/SeleniumWebdriver.js:289-292](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L289-L292 "Source code on GitHub")

Verifies that the specified checkbox is checked.

```js
I.seeCheckboxIsChecked('Agree');
I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
```

**Parameters**

-   `option`

## seeCookie

[lib/helper/SeleniumWebdriver.js:486-490](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L486-L490 "Source code on GitHub")

Checks that cookie with given name exists.

```js
I.seeCookie('Auth');
```
**Parameters**

-   `name`

## seeCurrentUrlEquals

[lib/helper/SeleniumWebdriver.js:428-432](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L428-L432 "Source code on GitHub")

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

[lib/helper/SeleniumWebdriver.js:359-363](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L359-L363 "Source code on GitHub")

Checks that element is present on page.
Element is located by CSS or XPath.

```js
I.seeElement('#modal');
```

**Parameters**

-   `locator`

## seeInCurrentUrl

[lib/helper/SeleniumWebdriver.js:410-414](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L410-L414 "Source code on GitHub")

Checks that current url contains a provided fragment.

```js
I.seeInCurrentUrl('/register'); // we are on registration page
```

**Parameters**

-   `urlFragment`

## seeInField

[lib/helper/SeleniumWebdriver.js:245-247](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L245-L247 "Source code on GitHub")

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

## seeInSource

[lib/helper/SeleniumWebdriver.js:378-382](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L378-L382 "Source code on GitHub")

Checks that the current page contains the given string in its raw source code.

```js
I.seeInSource('<h1>Green eggs &amp; ham</h1>');
```

**Parameters**

-   `text`

## seeInTitle

[lib/helper/SeleniumWebdriver.js:331-335](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L331-L335 "Source code on GitHub")

Checks that title contains text.

**Parameters**

-   `text`

## selectOption

[lib/helper/SeleniumWebdriver.js:163-187](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L163-L187 "Source code on GitHub")

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

[lib/helper/SeleniumWebdriver.js:460-471](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L460-L471 "Source code on GitHub")

Sets a cookie

```js
I.setCookie({name: 'auth', value: true});
```
Uses Selenium's JSON [cookie format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).

**Parameters**

-   `cookie`

## wait

[lib/helper/SeleniumWebdriver.js:523-525](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L523-L525 "Source code on GitHub")

Pauses execution for a number of seconds.

**Parameters**

-   `sec`

## waitForElement

[lib/helper/SeleniumWebdriver.js:530-534](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L530-L534 "Source code on GitHub")

 Waits for element to be present on page (by default waits for 1sec).
 Element can be located by CSS or XPath.

**Parameters**

-   `locator`
-   `sec`

## waitForText

[lib/helper/SeleniumWebdriver.js:548-555](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L548-L555 "Source code on GitHub")

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

[lib/helper/SeleniumWebdriver.js:539-543](https://github.com/Codeception/CodeceptJS/blob/ab150429d6280421e9267f06b5676e271490ed89/lib/helper/SeleniumWebdriver.js#L539-L543 "Source code on GitHub")

Waits for an element to become visible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `locator`
-   `sec`
