# Protractor

[lib/helper/Protractor.js:49-594](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L49-L594 "Source code on GitHub")

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

**Parameters**

-   `config`  

## amOnPage

[lib/helper/Protractor.js:156-161](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L156-L161 "Source code on GitHub")

Opens a web page in a browser. Requires relative or absolute url.
If url starts with `/`, opens a web page of a site defined in `url` config parameter.

```js
I.amOnPage('/'); // opens main page of website
I.amOnPage('https://github.com'); // opens github
I.amOnPage('/login'); // opens a login page
```

**Parameters**

-   `url`  

## amOutsideAngularApp

[lib/helper/Protractor.js:131-136](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L131-L136 "Source code on GitHub")

Switch to non-Angular mode, 
start using WebDriver instead of Protractor in this session

## appendField

[lib/helper/Protractor.js:267-274](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L267-L274 "Source code on GitHub")

Appends text to a input field or textarea.
Field is located by name, label, CSS or XPath

```js
I.appendField('#myTextField', 'appended');
```

**Parameters**

-   `field`  
-   `value`  

## attachFile

[lib/helper/Protractor.js:233-248](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L233-L248 "Source code on GitHub")

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

[lib/helper/Protractor.js:279-292](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L279-L292 "Source code on GitHub")

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

[lib/helper/Protractor.js:484-489](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L484-L489 "Source code on GitHub")

Clears a cookie by name,
if none provided clears all cookies

```js
I.clearCookie();
I.clearCookie('test');
```

**Parameters**

-   `cookie`  

## click

[lib/helper/Protractor.js:166-172](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L166-L172 "Source code on GitHub")

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

[lib/helper/Protractor.js:184-186](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L184-L186 "Source code on GitHub")

Opposite to `see`. Checks that a text is not present on a page.
Use context parameter to narrow down the search.

```js
I.dontSee('Login'); // assume we are already logged in
```

**Parameters**

-   `text`  
-   `context`  

## dontSeeCheckboxIsChecked

[lib/helper/Protractor.js:305-308](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L305-L308 "Source code on GitHub")

 Verifies that the specified checkbox is not checked.
 
**Parameters**

-   `option`  

## dontSeeCookie

[lib/helper/Protractor.js:503-507](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L503-L507 "Source code on GitHub")

Checks that cookie with given name does not exist.
**Parameters**

-   `name`  

## dontSeeCurrentUrlEquals

[lib/helper/Protractor.js:445-449](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L445-L449 "Source code on GitHub")

Checks that current url is not equal to provided one.
If a relative url provided, a configured url will be prepended to it.

**Parameters**

-   `uri`  

## dontSeeElement

[lib/helper/Protractor.js:376-381](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L376-L381 "Source code on GitHub")

Opposite to `seeElement`. Checks that element is not on page.

**Parameters**

-   `locator`  

## dontSeeInCurrentUrl

[lib/helper/Protractor.js:427-431](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L427-L431 "Source code on GitHub")

Checks that current url does not contain a provided fragment.

**Parameters**

-   `urlFragment`  

## dontSeeInField

[lib/helper/Protractor.js:260-262](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L260-L262 "Source code on GitHub")

Checks that value of input field or textare doesn't equal to given value
Opposite to `seeInField`.

**Parameters**

-   `field`  
-   `value`  

## dontSeeInSource

[lib/helper/Protractor.js:395-399](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L395-L399 "Source code on GitHub")

Checks that the current page contains the given string in its raw source code
**Parameters**

-   `text`  

## dontSeeInTitle

[lib/helper/Protractor.js:348-352](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L348-L352 "Source code on GitHub")

Checks that title does not contain text.
**Parameters**

-   `text`  

## executeAsyncScript

[lib/helper/Protractor.js:411-413](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L411-L413 "Source code on GitHub")

Executes async script on page.
Provided function should execute a passed callback (as first argument) to signal it is finished.

**Parameters**

-   `fn`  

## executeScript

[lib/helper/Protractor.js:404-406](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L404-L406 "Source code on GitHub")

Executes sync script on a page.
Pass arguments to function as additional parameters.
Will return execution result to a test.
In this case you should use generator and yield to receive results.

**Parameters**

-   `fn`  

## fillField

[lib/helper/Protractor.js:220-228](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L220-L228 "Source code on GitHub")

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

[lib/helper/Protractor.js:332-334](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L332-L334 "Source code on GitHub")

Retrieves an attribute from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let hint = yield I.grabAttributeFrom('#tooltip', 'title');
```

**Parameters**

-   `locator`  
-   `attr`  

## grabCookie

[lib/helper/Protractor.js:514-516](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L514-L516 "Source code on GitHub")

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

[lib/helper/Protractor.js:313-315](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L313-L315 "Source code on GitHub")

Retrieves a text from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let pin = yield I.grabTextFrom('#pin');
```

**Parameters**

-   `locator`  

## grabTitle

[lib/helper/Protractor.js:357-362](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L357-L362 "Source code on GitHub")

Retrieves a page title and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let title = yield I.grabTitle();
```

## grabValueFrom

[lib/helper/Protractor.js:320-327](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L320-L327 "Source code on GitHub")

Retrieves a value from a form element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let email = yield I.grabValueFrom('input[name=email]');
```

**Parameters**

-   `locator`  

## resizeWindow

[lib/helper/Protractor.js:521-526](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L521-L526 "Source code on GitHub")

Resize the current window to provided width and height.
First parameter can be set to `maximize`

**Parameters**

-   `width`  
-   `height`  

## see

[lib/helper/Protractor.js:177-179](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L177-L179 "Source code on GitHub")

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

[lib/helper/Protractor.js:297-300](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L297-L300 "Source code on GitHub")

Verifies that the specified checkbox is checked.

```js
I.seeCheckboxIsChecked('Agree');
I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
```

**Parameters**

-   `option`  

## seeCookie

[lib/helper/Protractor.js:494-498](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L494-L498 "Source code on GitHub")

Checks that cookie with given name exists.

```js
I.seeCookie('Auth');
```
**Parameters**

-   `name`  

## seeCurrentUrlEquals

[lib/helper/Protractor.js:436-440](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L436-L440 "Source code on GitHub")

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

[lib/helper/Protractor.js:367-371](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L367-L371 "Source code on GitHub")

Checks that element is present on page.
Element is located by CSS or XPath.

```js
I.seeElement('#modal');
```

**Parameters**

-   `locator`  

## seeInCurrentUrl

[lib/helper/Protractor.js:418-422](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L418-L422 "Source code on GitHub")

Checks that current url contains a provided fragment.

```js
I.seeInCurrentUrl('/register'); // we are on registration page
```

**Parameters**

-   `urlFragment`  

## seeInField

[lib/helper/Protractor.js:253-255](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L253-L255 "Source code on GitHub")

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

[lib/helper/Protractor.js:386-390](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L386-L390 "Source code on GitHub")

Checks that the current page contains the given string in its raw source code.

```js
I.seeInSource('<h1>Green eggs &amp; ham</h1>');
```

**Parameters**

-   `text`  

## seeInTitle

[lib/helper/Protractor.js:339-343](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L339-L343 "Source code on GitHub")

Checks that title contains text.

**Parameters**

-   `text`  

## selectOption

[lib/helper/Protractor.js:191-215](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L191-L215 "Source code on GitHub")

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

[lib/helper/Protractor.js:468-479](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L468-L479 "Source code on GitHub")

Sets a cookie

```js
I.setCookie({name: 'auth', value: true});
```
Uses Selenium's JSON [cookie format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).

**Parameters**

-   `cookie`  

## wait

[lib/helper/Protractor.js:531-533](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L531-L533 "Source code on GitHub")

Pauses execution for a number of seconds.

**Parameters**

-   `sec`  

## waitForClickable

[lib/helper/Protractor.js:547-551](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L547-L551 "Source code on GitHub")

Waits for element to become clickable for number of seconds.

**Parameters**

-   `locator`  
-   `sec`  

## waitForElement

[lib/helper/Protractor.js:538-542](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L538-L542 "Source code on GitHub")

 Waits for element to be present on page (by default waits for 1sec).
 Element can be located by CSS or XPath.
 
**Parameters**

-   `locator`  
-   `sec`  

## waitForText

[lib/helper/Protractor.js:565-572](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L565-L572 "Source code on GitHub")

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

[lib/helper/Protractor.js:556-560](https://github.com/Codeception/CodeceptJS/blob/71da1bc25ff73b5ff5e52b4c41482d422104ac40/lib/helper/Protractor.js#L556-L560 "Source code on GitHub")

Waits for an element to become visible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `locator`  
-   `sec`  
