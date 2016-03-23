# SeleniumWebdriver

[docs/build/SeleniumWebdriver.js:48-874](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L48-L874 "Source code on GitHub")

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

[docs/build/SeleniumWebdriver.js:139-144](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L139-L144 "Source code on GitHub")

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

[docs/build/SeleniumWebdriver.js:389-396](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L389-L396 "Source code on GitHub")

Appends text to a input field or textarea.
Field is located by name, label, CSS or XPath

```js
I.appendField('#myTextField', 'appended');
```

**Parameters**

-   `field`  located by label|name|CSS|XPath|strict locator
-   `value`  text value

## attachFile

[docs/build/SeleniumWebdriver.js:334-349](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L334-L349 "Source code on GitHub")

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

## checkOption

[docs/build/SeleniumWebdriver.js:412-425](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L412-L425 "Source code on GitHub")

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

[docs/build/SeleniumWebdriver.js:747-752](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L747-L752 "Source code on GitHub")

Clears a cookie by name,
if none provided clears all cookies

```js
I.clearCookie();
I.clearCookie('test');
```

**Parameters**

-   `cookieName`  (optional)
-   `cookie`  

## click

[docs/build/SeleniumWebdriver.js:170-176](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L170-L176 "Source code on GitHub")

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

[docs/build/SeleniumWebdriver.js:215-217](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L215-L217 "Source code on GitHub")

Opposite to `see`. Checks that a text is not present on a page.
Use context parameter to narrow down the search.

```js
I.dontSee('Login'); // assume we are already logged in
```

**Parameters**

-   `text`  is not present
-   `context`  (optional) element located by CSS|XPath|strict locator in which to perfrom search

## dontSeeCheckboxIsChecked

[docs/build/SeleniumWebdriver.js:447-450](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L447-L450 "Source code on GitHub")

Verifies that the specified checkbox is not checked.

**Parameters**

-   `field`  located by label|name|CSS|XPath|strict locator
-   `option`  

## dontSeeCookie

[docs/build/SeleniumWebdriver.js:773-777](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L773-L777 "Source code on GitHub")

Checks that cookie with given name does not exist.

**Parameters**

-   `name`  

## dontSeeCurrentUrlEquals

[docs/build/SeleniumWebdriver.js:685-689](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L685-L689 "Source code on GitHub")

Checks that current url is not equal to provided one.
If a relative url provided, a configured url will be prepended to it.

**Parameters**

-   `url`  
-   `uri`  

## dontSeeElement

[docs/build/SeleniumWebdriver.js:556-562](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L556-L562 "Source code on GitHub")

Opposite to `seeElement`. Checks that element is not visible

**Parameters**

-   `element`  located by CSS|XPath|Strict locator
-   `locator`  

## dontSeeElementInDOM

[docs/build/SeleniumWebdriver.js:584-588](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L584-L588 "Source code on GitHub")

Opposite to `seeElementInDOM`. Checks that element is not on page.

**Parameters**

-   `element`  located by CSS|XPath|Strict locator
-   `locator`  

## dontSeeInCurrentUrl

[docs/build/SeleniumWebdriver.js:656-660](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L656-L660 "Source code on GitHub")

Checks that current url does not contain a provided fragment.

**Parameters**

-   `url`  
-   `urlFragment`  

## dontSeeInField

[docs/build/SeleniumWebdriver.js:375-377](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L375-L377 "Source code on GitHub")

Checks that value of input field or textare doesn't equal to given value
Opposite to `seeInField`.

**Parameters**

-   `field`  located by label|name|CSS|XPath|strict locator
-   `value`  is not expected to be a field value

## dontSeeInSource

[docs/build/SeleniumWebdriver.js:609-613](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L609-L613 "Source code on GitHub")

Checks that the current page contains the given string in its raw source code

**Parameters**

-   `string`  
-   `text`  

## dontSeeInTitle

[docs/build/SeleniumWebdriver.js:513-517](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L513-L517 "Source code on GitHub")

Checks that title does not contain text.

**Parameters**

-   `text`  

## doubleClick

[docs/build/SeleniumWebdriver.js:181-187](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L181-L187 "Source code on GitHub")

Performs a double-click on an element matched by CSS or XPath.

**Parameters**

-   `link`  
-   `context`  

## executeAsyncScript

[docs/build/SeleniumWebdriver.js:633-635](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L633-L635 "Source code on GitHub")

Executes async script on page.
Provided function should execute a passed callback (as first argument) to signal it is finished.

**Parameters**

-   `script`  
-   `fn`  

## executeScript

[docs/build/SeleniumWebdriver.js:623-625](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L623-L625 "Source code on GitHub")

Executes sync script on a page.
Pass arguments to function as additional parameters.
Will return execution result to a test.
In this case you should use generator and yield to receive results.

**Parameters**

-   `script`  
-   `fn`  

## fillField

[docs/build/SeleniumWebdriver.js:284-292](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L284-L292 "Source code on GitHub")

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

[docs/build/SeleniumWebdriver.js:493-495](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L493-L495 "Source code on GitHub")

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

[docs/build/SeleniumWebdriver.js:791-793](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L791-L793 "Source code on GitHub")

Gets a cookie object by name
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let cookie = I.grabCookie('auth');
assert(cookie.value, '123456');
```

**Parameters**

-   `cookie`  Returns cookie in JSON [format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).
-   `name`  

## grabTextFrom

[docs/build/SeleniumWebdriver.js:461-463](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L461-L463 "Source code on GitHub")

Retrieves a text from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let pin = yield I.grabTextFrom('#pin');
```

**Parameters**

-   `element`  located by CSS|XPath|strict locator
-   `locator`  

## grabTitle

[docs/build/SeleniumWebdriver.js:527-532](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L527-L532 "Source code on GitHub")

Retrieves a page title and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let title = yield I.grabTitle();
```

## grabValueFrom

[docs/build/SeleniumWebdriver.js:474-481](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L474-L481 "Source code on GitHub")

Retrieves a value from a form element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let email = yield I.grabValueFrom('input[name=email]');
```

**Parameters**

-   `field`  located by label|name|CSS|XPath|strict locator
-   `locator`  

## pressKey

[docs/build/SeleniumWebdriver.js:305-320](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L305-L320 "Source code on GitHub")

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

[docs/build/SeleniumWebdriver.js:802-807](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L802-L807 "Source code on GitHub")

Resize the current window to provided width and height.
First parameter can be set to `maximize`

**Parameters**

-   `width`  
-   `height`  

## saveScreenshot

[docs/build/SeleniumWebdriver.js:700-712](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L700-L712 "Source code on GitHub")

Saves a screenshot to ouput folder (set in codecept.json).
Filename is relative to output folder.

```js
I.saveScreenshot('debug.png');
```

**Parameters**

-   `filename`  
-   `fileName`  

## see

[docs/build/SeleniumWebdriver.js:201-203](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L201-L203 "Source code on GitHub")

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

[docs/build/SeleniumWebdriver.js:437-440](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L437-L440 "Source code on GitHub")

Verifies that the specified checkbox is checked.

```js
I.seeCheckboxIsChecked('Agree');
I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
```

**Parameters**

-   `field`  located by label|name|CSS|XPath|strict locator
-   `option`  

## seeCookie

[docs/build/SeleniumWebdriver.js:762-766](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L762-L766 "Source code on GitHub")

Checks that cookie with given name exists.

```js
I.seeCookie('Auth');
```

**Parameters**

-   `name`  

## seeCurrentUrlEquals

[docs/build/SeleniumWebdriver.js:673-677](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L673-L677 "Source code on GitHub")

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

[docs/build/SeleniumWebdriver.js:543-549](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L543-L549 "Source code on GitHub")

Checks that a given Element is visible
Element is located by CSS or XPath.

```js
I.seeElement('#modal');
```

**Parameters**

-   `located`  by CSS|XPath|strict locator
-   `locator`  

## seeElementInDOM

[docs/build/SeleniumWebdriver.js:573-577](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L573-L577 "Source code on GitHub")

Checks that a given Element is present in the DOM
Element is located by CSS or XPath.

```js
I.seeElementInDOM('#modal');
```

**Parameters**

-   `element`  located by CSS|XPath|strict locator
-   `locator`  

## seeInCurrentUrl

[docs/build/SeleniumWebdriver.js:645-649](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L645-L649 "Source code on GitHub")

Checks that current url contains a provided fragment.

```js
I.seeInCurrentUrl('/register'); // we are on registration page
```

**Parameters**

-   `url`  
-   `urlFragment`  

## seeInField

[docs/build/SeleniumWebdriver.js:364-366](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L364-L366 "Source code on GitHub")

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

[docs/build/SeleniumWebdriver.js:598-602](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L598-L602 "Source code on GitHub")

Checks that the current page contains the given string in its raw source code.

```js
I.seeInSource('<h1>Green eggs &amp; ham</h1>');
```

**Parameters**

-   `html`  
-   `text`  

## seeInTitle

[docs/build/SeleniumWebdriver.js:502-506](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L502-L506 "Source code on GitHub")

Checks that title contains text.

**Parameters**

-   `text`  

## selectOption

[docs/build/SeleniumWebdriver.js:241-265](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L241-L265 "Source code on GitHub")

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
-   `value`  
-   `select`  
-   `option`  

## setCookie

[docs/build/SeleniumWebdriver.js:724-735](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L724-L735 "Source code on GitHub")

Sets a cookie

```js
I.setCookie({name: 'auth', value: true});
```

**Parameters**

-   `cookie`  Uses Selenium's JSON [cookie format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).

## wait

[docs/build/SeleniumWebdriver.js:812-814](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L812-L814 "Source code on GitHub")

Pauses execution for a number of seconds.

**Parameters**

-   `sec`  

## waitForElement

[docs/build/SeleniumWebdriver.js:828-832](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L828-L832 "Source code on GitHub")

Waits for element to be present on page (by default waits for 1sec).
Element can be located by CSS or XPath.

```js
I.waitForElement('.btn.continue');
I.waitForElement('.btn.continue', 5); // wait for 5 secs
```

**Parameters**

-   `element`  located by CSS|XPath|strict locator
-   `time`  seconds to wait, 1 by default
-   `locator`  
-   `sec`  

## waitForText

[docs/build/SeleniumWebdriver.js:865-872](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L865-L872 "Source code on GitHub")

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

[docs/build/SeleniumWebdriver.js:845-849](https://github.com/Codeception/CodeceptJS/blob/6e124db3371850a45323ea9b87f41ad1ed148371/docs/build/SeleniumWebdriver.js#L845-L849 "Source code on GitHub")

Waits for an element to become visible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

    I.waitForVisible('#popup');

**Parameters**

-   `element`  located by CSS|XPath|strict locator
-   `time`  seconds to wait, 1 by default
-   `locator`  
-   `sec`  
