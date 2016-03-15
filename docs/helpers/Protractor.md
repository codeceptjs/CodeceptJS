# amOnPage

[lib/helper/Protractor.js:60-65](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L60-L65 "Source code on GitHub")

Opens a web page in a browser. Requires relative or absolute url.
If url starts with `/`, opens a web page of a site defined in `url` config parameter.

```js
I.amOnPage('/'); // opens main page of website
I.amOnPage('https://github.com'); // opens github
I.amOnPage('/login'); // opens a login page
```

**Parameters**

-   `url`  

# appendField

[lib/helper/Protractor.js:148-154](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L148-L154 "Source code on GitHub")

Appends text to a input field or textarea.
Field is located by name, label, CSS or XPath

```js
I.appendField('#myTextField', 'appended');
```

**Parameters**

-   `field`  
-   `value`  

# checkOption

[lib/helper/Protractor.js:159-173](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L159-L173 "Source code on GitHub")

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

# click

[lib/helper/Protractor.js:70-76](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L70-L76 "Source code on GitHub")

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

# donSeeInSource

[lib/helper/Protractor.js:252-256](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L252-L256 "Source code on GitHub")

Checks that the current page contains the given string in its raw source code
**Parameters**

-   `text`  

# dontSee

[lib/helper/Protractor.js:88-90](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L88-L90 "Source code on GitHub")

Opposite to `see`. Checks that a text is not present on a page.
Use context parameter to narrow down the search.

```js
I.dontSee('Login'); // assume we are already logged in
```

**Parameters**

-   `text`  
-   `context`  

# dontSeeCurrentUrlEquals

[lib/helper/Protractor.js:302-306](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L302-L306 "Source code on GitHub")

Checks that current url is not equal to provided one.
If a relative url provided, a configured url will be prepended to it.

**Parameters**

-   `uri`  

# dontSeeElement

[lib/helper/Protractor.js:235-238](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L235-L238 "Source code on GitHub")

Opposite to `seeElement`. Checks that element is not on page.

**Parameters**

-   `locator`  

# dontSeeInCurrentUrl

[lib/helper/Protractor.js:284-288](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L284-L288 "Source code on GitHub")

Checks that current url does not contain a provided fragment.

**Parameters**

-   `urlFragment`  

# dontSeeInField

[lib/helper/Protractor.js:141-143](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L141-L143 "Source code on GitHub")

Checks that value of input field or textare doesn't equal to given value
Opposite to `seeInField`.

**Parameters**

-   `field`  
-   `value`  

# dontSeeInTitle

[lib/helper/Protractor.js:208-212](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L208-L212 "Source code on GitHub")

Checks that title does not contain text.
**Parameters**

-   `text`  

# executeAsyncScript

[lib/helper/Protractor.js:268-270](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L268-L270 "Source code on GitHub")

Executes async script on page.
Provided function should execute a passed callback (as first argument) to signal it is finished.

**Parameters**

-   `fn`  

# executeScript

[lib/helper/Protractor.js:261-263](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L261-L263 "Source code on GitHub")

Executes sync script on a page.
Pass arguments to function as additional parameters.
Will return execution result to a test.
In this case you should use generator and yield to receive results.

**Parameters**

-   `fn`  

# fillField

[lib/helper/Protractor.js:122-129](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L122-L129 "Source code on GitHub")

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

# grabAttribute

[lib/helper/Protractor.js:192-194](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L192-L194 "Source code on GitHub")

Retrieves an attribute from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let hint = yield I.grabAttributeFrom('#tooltip', 'title');
```

**Parameters**

-   `locator`  
-   `attr`  

# grabTextFrom

[lib/helper/Protractor.js:178-180](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L178-L180 "Source code on GitHub")

Retrieves a text from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let pin = yield I.grabTextFrom('#pin');
```

**Parameters**

-   `locator`  

# grabTitle

[lib/helper/Protractor.js:217-222](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L217-L222 "Source code on GitHub")

Retrieves a page title and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let title = yield I.grabTitle();
```

# grabValueFrom

[lib/helper/Protractor.js:185-187](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L185-L187 "Source code on GitHub")

Retrieves a value from a form element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let email = yield I.grabValueFrom('input[name=email]');
```

**Parameters**

-   `locator`  

# resizeWindow

[lib/helper/Protractor.js:311-316](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L311-L316 "Source code on GitHub")

Resize the current window to provided width and height.
First parameter can be set to `maximize`

**Parameters**

-   `width`  
-   `height`  

# see

[lib/helper/Protractor.js:81-83](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L81-L83 "Source code on GitHub")

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

# seeCurrentUrlEquals

[lib/helper/Protractor.js:293-297](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L293-L297 "Source code on GitHub")

Checks that current url is equal to provided one.
If a relative url provided, a configured url will be prepended to it.
So both examples will work:

```js
I.seeCurrentUrlEquals('/register');
I.seeCurrentUrlEquals('http://my.site.com/register');
```

**Parameters**

-   `uri`  

# seeElement

[lib/helper/Protractor.js:227-230](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L227-L230 "Source code on GitHub")

Checks that element is present on page.
Element is located by CSS or XPath.

```js
I.seeElement('#modal');
```

**Parameters**

-   `locator`  

# seeInCurrentUrl

[lib/helper/Protractor.js:275-279](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L275-L279 "Source code on GitHub")

Checks that current url contains a provided fragment.

```js
I.seeInCurrentUrl('/register'); // we are on registration page
```

**Parameters**

-   `urlFragment`  

# seeInField

[lib/helper/Protractor.js:134-136](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L134-L136 "Source code on GitHub")

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

# seeInSource

[lib/helper/Protractor.js:243-247](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L243-L247 "Source code on GitHub")

Checks that the current page contains the given string in its raw source code.

```js
I.seeInSource('<h1>Green eggs &amp; ham</h1>');
```

**Parameters**

-   `text`  

# seeInTitle

[lib/helper/Protractor.js:199-203](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L199-L203 "Source code on GitHub")

Checks that title contains text.

**Parameters**

-   `text`  

# selectOption

[lib/helper/Protractor.js:95-117](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L95-L117 "Source code on GitHub")

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

# waitForClickable

[lib/helper/Protractor.js:330-334](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L330-L334 "Source code on GitHub")

Waits for element to become clickable for number of seconds.

**Parameters**

-   `locator`  
-   `sec`  

# waitForElement

[lib/helper/Protractor.js:321-325](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L321-L325 "Source code on GitHub")

 Waits for element to be present on page (by default waits for 1sec).
 Element can be located by CSS or XPath.
 
**Parameters**

-   `locator`  
-   `sec`  

# waitForText

[lib/helper/Protractor.js:348-355](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L348-L355 "Source code on GitHub")

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

# waitForVisible

[lib/helper/Protractor.js:339-343](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/Protractor.js#L339-L343 "Source code on GitHub")

Waits for an element to become visible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

**Parameters**

-   `locator`  
-   `sec`  
