# SeleniumWebdriver

[lib/helper/SeleniumWebdriver.js:48-596](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L48-L596 "Source code on GitHub")

**Extends Helper**

SeleniumWebdriver helper is based on the official [Selenium Webdriver JS](https://www.npmjs.com/package/selenium-webdriver)
library. It implements common web api methods (amOnPage, click, see).

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
-   `waitForTimeout`: (optional) sets default wait time in _ms_ for all `wait*` functions. 1000 by default;

other options are the same as in [Protractor config](https://github.com/angular/protractor/blob/master/docs/referenceConf.js).

## amOnPage

[lib/helper/SeleniumWebdriver.js:130-135](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L130-L135 "Source code on GitHub")

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

[lib/helper/SeleniumWebdriver.js:272-279](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L272-L279 "Source code on GitHub")

Appends text to a input field or textarea.
Field is located by name, label, CSS or XPath

```js
I.appendField('#myTextField', 'appended');
```

**Parameters**

-   `field`  
-   `value`  

## attachFile

[lib/helper/SeleniumWebdriver.js:238-253](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L238-L253 "Source code on GitHub")

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

[lib/helper/SeleniumWebdriver.js:284-297](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L284-L297 "Source code on GitHub")

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

[lib/helper/SeleniumWebdriver.js:515-520](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L515-L520 "Source code on GitHub")

Clears a cookie by name,
if none provided clears all cookies

```js
I.clearCookie();
I.clearCookie('test');
```

**Parameters**

-   `cookie`  

## click

[lib/helper/SeleniumWebdriver.js:140-146](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L140-L146 "Source code on GitHub")

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

[lib/helper/SeleniumWebdriver.js:169-171](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L169-L171 "Source code on GitHub")

Opposite to `see`. Checks that a text is not present on a page.
Use context parameter to narrow down the search.

```js
I.dontSee('Login'); // assume we are already logged in
```

**Parameters**

-   `text`  
-   `context`  

## dontSeeCheckboxIsChecked

[lib/helper/SeleniumWebdriver.js:310-313](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L310-L313 "Source code on GitHub")

 Verifies that the specified checkbox is not checked.
 
**Parameters**

-   `option`  

## dontSeeCookie

[lib/helper/SeleniumWebdriver.js:534-538](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L534-L538 "Source code on GitHub")

Checks that cookie with given name does not exist.

**Parameters**

-   `name`  

## dontSeeCurrentUrlEquals

[lib/helper/SeleniumWebdriver.js:471-475](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L471-L475 "Source code on GitHub")

Checks that current url is not equal to provided one.
If a relative url provided, a configured url will be prepended to it.

**Parameters**

-   `uri`  

## dontSeeElement

[lib/helper/SeleniumWebdriver.js:383-389](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L383-L389 "Source code on GitHub")

Opposite to `seeElement`. Checks that element is not visible

**Parameters**

-   `locator`  

## dontSeeElementInDOM

[lib/helper/SeleniumWebdriver.js:403-407](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L403-L407 "Source code on GitHub")

Opposite to `seeElementInDOM`. Checks that element is not on page.

**Parameters**

-   `locator`  

## dontSeeInCurrentUrl

[lib/helper/SeleniumWebdriver.js:453-457](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L453-L457 "Source code on GitHub")

Checks that current url does not contain a provided fragment.

**Parameters**

-   `urlFragment`  

## dontSeeInField

[lib/helper/SeleniumWebdriver.js:265-267](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L265-L267 "Source code on GitHub")

Checks that value of input field or textare doesn't equal to given value
Opposite to `seeInField`.

**Parameters**

-   `field`  
-   `value`  

## dontSeeInSource

[lib/helper/SeleniumWebdriver.js:421-425](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L421-L425 "Source code on GitHub")

Checks that the current page contains the given string in its raw source code
**Parameters**

-   `text`  

## dontSeeInTitle

[lib/helper/SeleniumWebdriver.js:353-357](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L353-L357 "Source code on GitHub")

Checks that title does not contain text.
**Parameters**

-   `text`  

## doubleClick

[lib/helper/SeleniumWebdriver.js:151-157](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L151-L157 "Source code on GitHub")

Performs a double-click on an element matched by CSS or XPath.

**Parameters**

-   `link`  
-   `context`  

## executeAsyncScript

[lib/helper/SeleniumWebdriver.js:437-439](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L437-L439 "Source code on GitHub")

Executes async script on page.
Provided function should execute a passed callback (as first argument) to signal it is finished.

**Parameters**

-   `fn`  

## executeScript

[lib/helper/SeleniumWebdriver.js:430-432](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L430-L432 "Source code on GitHub")

Executes sync script on a page.
Pass arguments to function as additional parameters.
Will return execution result to a test.
In this case you should use generator and yield to receive results.

**Parameters**

-   `fn`  

## fillField

[lib/helper/SeleniumWebdriver.js:205-213](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L205-L213 "Source code on GitHub")

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

-   `field`  
-   `value`  

## grabAttributeFrom

[lib/helper/SeleniumWebdriver.js:337-339](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L337-L339 "Source code on GitHub")

Retrieves an attribute from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let hint = yield I.grabAttributeFrom('#tooltip', 'title');
```

**Parameters**

-   `locator`  
-   `attr`  

## grabCookie

[lib/helper/SeleniumWebdriver.js:545-547](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L545-L547 "Source code on GitHub")

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

[lib/helper/SeleniumWebdriver.js:318-320](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L318-L320 "Source code on GitHub")

Retrieves a text from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let pin = yield I.grabTextFrom('#pin');
```

**Parameters**

-   `locator`  

## grabTitle

[lib/helper/SeleniumWebdriver.js:362-367](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L362-L367 "Source code on GitHub")

Retrieves a page title and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let title = yield I.grabTitle();
```

## grabValueFrom

[lib/helper/SeleniumWebdriver.js:325-332](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L325-L332 "Source code on GitHub")

Retrieves a value from a form element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let email = yield I.grabValueFrom('input[name=email]');
```

**Parameters**

-   `locator`  

## pressKey

[lib/helper/SeleniumWebdriver.js:218-233](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L218-L233 "Source code on GitHub")

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

[lib/helper/SeleniumWebdriver.js:552-557](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L552-L557 "Source code on GitHub")

Resize the current window to provided width and height.
First parameter can be set to `maximize`

**Parameters**

-   `width`  
-   `height`  

## saveScreenshot

[lib/helper/SeleniumWebdriver.js:480-492](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L480-L492 "Source code on GitHub")

Saves a screenshot to ouput folder (set in codecept.json).
Filename is relative to output folder.

```js
I.saveScreenshot('debug.png');
```

**Parameters**

-   `fileName`  

## see

[lib/helper/SeleniumWebdriver.js:162-164](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L162-L164 "Source code on GitHub")

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

[lib/helper/SeleniumWebdriver.js:302-305](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L302-L305 "Source code on GitHub")

Verifies that the specified checkbox is checked.

```js
I.seeCheckboxIsChecked('Agree');
I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
```

**Parameters**

-   `option`  

## seeCookie

[lib/helper/SeleniumWebdriver.js:525-529](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L525-L529 "Source code on GitHub")

Checks that cookie with given name exists.

```js
I.seeCookie('Auth');
```
**Parameters**

-   `name`  

## seeCurrentUrlEquals

[lib/helper/SeleniumWebdriver.js:462-466](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L462-L466 "Source code on GitHub")

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

[lib/helper/SeleniumWebdriver.js:372-378](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L372-L378 "Source code on GitHub")

Checks that a given Element is visible
Element is located by CSS or XPath.

```js
I.seeElement('#modal');
```

**Parameters**

-   `locator`  

## seeElementInDOM

[lib/helper/SeleniumWebdriver.js:394-398](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L394-L398 "Source code on GitHub")

Checks that a given Element is present in the DOM
Element is located by CSS or XPath.

```js
I.seeElementInDOM('#modal');
```

**Parameters**

-   `locator`  

## seeInCurrentUrl

[lib/helper/SeleniumWebdriver.js:444-448](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L444-L448 "Source code on GitHub")

Checks that current url contains a provided fragment.

```js
I.seeInCurrentUrl('/register'); // we are on registration page
```

**Parameters**

-   `urlFragment`  

## seeInField

[lib/helper/SeleniumWebdriver.js:258-260](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L258-L260 "Source code on GitHub")

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

[lib/helper/SeleniumWebdriver.js:412-416](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L412-L416 "Source code on GitHub")

Checks that the current page contains the given string in its raw source code.

```js
I.seeInSource('<h1>Green eggs &amp; ham</h1>');
```

**Parameters**

-   `text`  

## seeInTitle

[lib/helper/SeleniumWebdriver.js:344-348](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L344-L348 "Source code on GitHub")

Checks that title contains text.

**Parameters**

-   `text`  

## selectOption

[lib/helper/SeleniumWebdriver.js:176-200](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L176-L200 "Source code on GitHub")

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

[lib/helper/SeleniumWebdriver.js:499-510](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L499-L510 "Source code on GitHub")

Sets a cookie

```js
I.setCookie({name: 'auth', value: true});
```
Uses Selenium's JSON [cookie format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).

**Parameters**

-   `cookie`  

## wait

[lib/helper/SeleniumWebdriver.js:562-564](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L562-L564 "Source code on GitHub")

Pauses execution for a number of seconds.

**Parameters**

-   `sec`  

## waitForElement

[lib/helper/SeleniumWebdriver.js:569-573](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L569-L573 "Source code on GitHub")

 Waits for element to be present on page (by default waits for 1sec).
 Element can be located by CSS or XPath.
 
**Parameters**

-   `locator`  
-   `sec`  

## waitForText

[lib/helper/SeleniumWebdriver.js:587-594](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L587-L594 "Source code on GitHub")

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

[lib/helper/SeleniumWebdriver.js:578-582](https://github.com/Codeception/CodeceptJS/blob/b8d01e3fea9f43246c606eddefc9a1209721daff/lib/helper/SeleniumWebdriver.js#L578-L582 "Source code on GitHub")

Waits for an element to become visible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `locator`  
-   `sec`  
