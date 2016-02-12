# WebHelper

[lib/helper/WebHelper.js:8-46](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebHelper.js#L8-L46 "Source code on GitHub")

Contains common abstract methods for helper which is expected to act as browser.

**Parameters**

-   `url`  

## amOnPage

[lib/helper/WebHelper.js:20-20](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebHelper.js#L20-L20 "Source code on GitHub")

Opens a web page in a browser. Requires relative or absolute url.
If url starts with `/`, opens a web page of a site defined in `url` config parameter.

```js
I.amOnPage('/'); // opens main page of website
I.amOnPage('https://github.com'); // opens github
I.amOnPage('/login'); // opens a login page
```

**Parameters**

-   `url`  

## click

[lib/helper/WebHelper.js:45-45](https://github.com/Codeception/CodeceptJS/blob/376b261c61d058554076196788d551fb528c5ade/lib/helper/WebHelper.js#L45-L45 "Source code on GitHub")

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
