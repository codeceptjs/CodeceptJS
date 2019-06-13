---
id: acceptance
title: Acceptance Testing
---

How does your client, manager, or tester, or any other non-technical person, know your web application is working? By opening the browser, accessing a site, clicking on links, filling in the forms, and actually seeing the content on a web page.

Acceptance (also called End to End) tests can cover standard but complex scenarios from a user's perspective. With acceptance tests you can be confident that users, following all defined scenarios, won't get errors. We check **not just functionality of application but a user interface** (UI) as well.

By default CodeceptJS uses [WebDriver](/helpers/WebDriver/) helper and **Selenium** to automate browser. Within web page you can locate elements, interact with them, and check that expected elements are present on a page.
However, you can also choose [Puppeteer](/helpers/Puppeteer), [Nightmare](/helpers/Nightmare) or [Protractor](/helpers/Protractor) helpers, driven by corresponding libraries.
No matter of helper and library you use for acceptance testing, CodeceptJS should execute same actions in similar manner.

In case of CodeceptJS you can be sure that in code it will be as easy as it sounds. You just describe a test scenario with JavaScript DSL and allow the framework to handle the rest.

Within web page you can locate elements, interact with them, and check that expected elements are present on a page. That is what a test look like.
That is what a test look like.

```js
I.amOnPage('/login');
I.fillField('Username', 'john');
I.fillField('Password', '123456');
I.click('Login');
I.see('Welcome, John');
```

This is how we can check that login form of a simple web application works. At first we opened `/login` page, then filled forms and in the end we saw the greetings text.

## Locating Element

Element can be found by CSS or XPath locators. Practically every steps
in WebDriver helper accept them both.

```js
I.seeElement('.user'); // element with CSS class user
I.seeElement('//button[contains(., "press me")]'); // button
```

By default CodeceptJS tries to guess the locator type.
In order to specify exact locator type you can pass a hash called **strict locator**.

```js
I.seeElement({css: 'div.user'});
I.seeElement({xpath: '//div[@class=user]'});
```

Strict locators allow to specify additional locator types:

```js
// locate form element by name
I.seeElement({name: 'password'});
// locate element by id
I.seeElement({id: 'users'});
```

In [mobile testing](http://codecept.io/mobile/#locating-elements) you can use `~` to specify accessibility id to locate an element. In web application you can locate element by their `aria-label` value.

```js
// locate element by [aria-label] attribute in web
// or by accessibility id in mobile
I.seeElement('~username');
```

## Clicking

CodeceptJS provides a flexible syntax to specify an element to click.

By default CodeceptJS tries to find button or link with exact text on it

```js
// search for link or button
I.click('Login');
```

If none found, CodeceptJS tries to find link or button containing that text. In case an image is clickable its `alt` attribute will be checked for text inclusion. Form buttons will also be searched by name.

To narrow down the results you can specify a context in second parameter.

```js
I.click('Login', '.nav'); // search only in .nav
I.click('Login', {css: 'footer'}); // search only in footer
```

To skip the global search pass exact strict locator (or start locator with `//` or `.` or `#`).
In this case you are not limited to buttons and links. Any element found by that locator is clicked.

```js
// click element by CSS
I.click('#signup');
// click element located by name inside a form
I.click({name: 'submit'}, '#user>form');
```

## Filling Fields

Clicking the links is not what takes the most time during testing a web site. If your site consists only of links you can skip test automation. The most routine waste of time goes into the testing of forms. CodeceptJS provides several ways of doing that.

Let's submit this sample form for a test:

```html
<form method="post" action="/update" id="update_form">
     <label for="user_name">Name</label>
     <input type="text" name="user[name]" id="user_name" />
     <label for="user_email">Email</label>
     <input type="text" name="user[email]" id="user_email" />
     <label for="user_gender">Gender</label>
     <select id="user_gender" name="user[gender]">
          <option value="m">Male</option>
          <option value="f">Female</option>
     </select>
     <input type="submit" name="submitButton" value="Update" />
</form>
```

We need to fill in all those fields and click "Update" button. CodeceptJS matches form elements by their label, name, or by CSS or XPath locators.

```js
// we are using label to match user_name field
I.fillField('Name', 'Miles');
// we can use input name
I.fillField('user[email]','miles@davis.com');
// select element by label, choose option by text
I.selectOption('Gender','Male');
// click 'Update' button, found by text
I.click('Update');
```

Alternative scenario:

```js
// we are using CSS
I.fillField('#user_name', 'Miles');
I.fillField('#user_email','miles@davis.com');
// select element by label, option by value
I.selectOption('#user_gender','m');
// click 'Update' button, found by name
I.click('submitButton', '#update_form');
```

To fill in sensitive data use `secret` function:

```js
I.fillField('password', secret('123456'));
```

## Assertions

In order to verify the expected behavior of a web application, web page connects should be checked.
CodeceptJS provides built-in assertions for that. They start with `see` (or `dontSee`) prefix, as they describe user's current vision.

The most general and common assertion is `see`:

```js
// Just a visible text on a page
I.see('Hello');
// text inside .msg element
I.see('Hello', '.msg');
// opposite
I.dontSee('Bye');
```

You should provide a text as first argument, and optionally a locator to narrow the search context.

You can check that specific element exists (or not) on a page, as it was described in [Locating Element](#locating-element) section.

```js
I.seeElement('.notice');
I.dontSeeElement('.error');
```

Additional assertions:

```js
I.seeInCurrentUrl('/user/miles');
I.seeInField('user[name]', 'Miles');
I.seeInTitle('My Website');
```

To see all possible assertions see the helper's reference.

## Grabbing

Sometimes you need to retrieve a data from a page to use it in next steps of a scenario.
Imagine, application generates a password and you want to ensure that user can login using this password.

```js
Scenario('login with generated password', async (I) => {
  I.fillField('email', 'miles@davis.com');
  I.click('Generate Password');
  const password = await I.grabTextFrom('#password');
  I.click('Login');
  I.fillField('email', 'miles@davis.com');
  I.fillField('password', password);
  I.click('Log in!');
  I.see('Hello, Miles');
});
```

`grabTextFrom` action is used here to retrieve text from an element. All actions starting with `grab` prefix are expected to return data. In order to synchronize this step with a scenario you should pause test execution with `await` keyword of ES6. To make it work your test should be written inside a async function (notice `async` in its definition).

```js
Scenario('use page title', async (I) => {
  // ...
  const password = await I.grabTextFrom('#password');
  I.fillField('password', password);
});
```

## Waiting

In modern web applications rendering is happen on client side.
Sometimes that may cause delays. A test may fail while trying to click an element which has not appeared on a page yet.
To handle this cases `wait*` methods introduced.

```js
I.waitForElement('#agree_button', 30); // secs
// clicks a button only when it is visible
I.click('#agree_button');
```

More wait actions can be found in helper's reference.

## SmartWait

It is possible to wait for elements pragmatically. If a test uses element which is not on a page yet, CodeceptJS will wait for few extra seconds before failing. This feature is based on [Implicit Wait](http://www.seleniumhq.org/docs/04_webdriver_advanced.jsp#implicit-waits) of Selenium. CodeceptJS enables implicit wait only when searching for a specific element and disables in all other cases. Thus, the performance of a test is not affected.

SmartWait can be enabled by setting wait option in WebDriver config.
Add `"smartWait": 5000` to wait for additional 5s.

SmartWait works with a CSS/XPath locators in `click`, `seeElement` and other methods. See where it is enabled and where is not:

```js
I.click('Login'); // DISABLED, not a locator
I.fillField('user', 'davert'); // DISABLED, not a specific locator
I.fillField({name: 'password'}, '123456'); // ENABLED, strict locator
I.click('#login'); // ENABLED, locator is CSS ID
I.see('Hello, Davert'); // DISABLED, Not a locator
I.seeElement('#userbar'); // ENABLED
I.dontSeeElement('#login'); // DISABLED, can't wait for element to hide
I.seeNumberOfElements('button.link', 5); // DISABLED, can wait only for one element

```

SmartWait doesn't check element for visibility, so tests may fail even element is on a page.

Usage example:

```js
// we use smartWait: 5000 instead of
// I.waitForElement('#click-me', 5);
// to wait for element on page
I.click('#click-me');
```

If it's hard to define what to wait, it is recommended to use [retries](https://codecept.io/basics/#retries) to rerun flaky steps.

## IFrames

[within](/basics/#within) operator can be used to work inside IFrames. Special `frame` locator is required to locate the iframe and get into its context.

See example:

```js
within({frame: "#editor"}, () => {
  I.see('Page');
});
```

Nested IFrames can be set by passing array *(WebDriver, Nightmare & Puppeteer only)*:

```js
within({frame: [".content", "#editor"]}, () => {
  I.see('Page');
});
```


## Auto Login

To share the same user session across different tests CodeceptJS provides [autoLogin plugin](https://codecept.io/plugins#autologin). It simplifies login management and reduces time consuming login operations. Instead of filling in login form before each test it saves the cookies of a valid user session and reuses it for next tests. If a session expires or doesn't exist, logs in a user again.

This plugin requires some configuration but is very simple in use:

```js
Scenario('do something with logged in user', (I, login)) => {
  login('user');
  I.see('Dashboard','h1');
});
```

With `autoLogin` plugin you can save cookies into a file and reuse same session on different runs.

> Read more about setting up [autoLogin](https://codecept.io/plugins#autologin)


## Multiple Sessions

CodeceptJS allows to run several browser sessions inside a test. This can be useful for testing communication between users inside a system, for instance in chats. To open another browser use `session()` function as shown in example:

```js
Scenario('test app', (I) => {
  I.amOnPage('/chat');
  I.fillField('name', 'davert');
  I.click('Sign In');
  I.see('Hello, davert');
  session('john', () => {
    // another session started
    I.amOnPage('/chat');
    I.fillField('name', 'john');
    I.click('Sign In');
    I.see('Hello, john');
  });
  // switching back to default session
  I.fillField('message', 'Hi, john');
  // there is a message from current user
  I.see('me: Hi, john', '.messages');
  session('john', () => {
    // let's check if john received it
    I.see('davert: Hi, john', '.messages');
  });
});
```

`session` function expects a first parameter to be a name of a session. You can switch back to session by using the same name.

You can override config for session by passing second parameter:

```js
session('john', { browser: 'firefox' } , () => {
  // run this steps in firefox
  I.amOnPage('/');
});
```

or just start session without switching to it. Call `session` passing only its name:

```js
Scenario('test', (I) => {
  // opens 3 additional browsers
  session('john');
  session('mary');
  session('jane');

  I.amOnPage('/');

  // switch to session by its name
  session('mary', () => {
    I.amOnPage('/login');
  });
}
```
`session` can return value which can be used in scenario:

```js
// inside async function
const val = await session('john', () => {
  I.amOnPage('/info');
  return I.grabTextFrom({ css: 'h1' });
});
I.fillField('Description', val);
```

Function passed into session can use `I`, page objects, and any objects declared for the scenario.
This function can also be declared as async (but doesn't work as generator).

Also, you can use `within` inside a session but you can't call session from inside `within`.

## Multiple Windows

CodeceptJS allows to use several browser windows inside a test. Sometimes we are testing the functionality of websites that we cannot control, such as a closed-source managed package, and there are popups that either remain open for configuring data on the screen, or close as a result of clicking a window. We can use these functions in order to gain more control over which page is being tested with Codecept at any given time. For example:

```js
const assert = require('assert');

Scenario('should open main page of configured site, open a popup, switch to main page, then switch to popup, close popup, and go back to main page', async (I) => {
    I.amOnPage('/');
    const handleBeforePopup = await I.grabCurrentWindowHandle();
    const urlBeforePopup = await I.grabCurrentUrl();
    const allHandlesBeforePopup = await I.grabAllWindowHandles();
    assert.equal(allHandlesBeforePopup.length, 1, 'Single Window');

    await I.executeScript(() => {
        window.open('https://www.w3schools.com/', 'new window', 'toolbar=yes,scrollbars=yes,resizable=yes,width=400,height=400');
    });

    const allHandlesAfterPopup = await I.grabAllWindowHandles();    
    assert.equal(allHandlesAfterPopup.length, 2, 'Two Windows');

    await I.switchToWindow(allHandlesAfterPopup[1]);
    const urlAfterPopup = await I.grabCurrentUrl();    
    assert.equal(urlAfterPopup, 'https://www.w3schools.com/', 'Expected URL: Popup');
    
    assert.equal(handleBeforePopup, allHandlesAfterPopup[0], 'Expected Window: Main Window');
    await I.switchToWindow(handleBeforePopup);
    const currentURL = await I.grabCurrentUrl();
    assert.equal(currentURL, urlBeforePopup, 'Expected URL: Main URL');    

    await I.switchToWindow(allHandlesAfterPopup[1]);
    const urlAfterSwitchBack = await I.grabCurrentUrl();
    assert.equal(urlAfterSwitchBack, 'https://www.w3schools.com/', 'Expected URL: Popup');        
    await I.closeCurrentTab();

    const allHandlesAfterPopupClosed = await I.grabAllWindowHandles();    
    assert.equal(allHandlesAfterPopupClosed.length, 1, 'Single Window');
    const currentWindowHandle = await I.grabCurrentWindowHandle();    
    assert.equal(currentWindowHandle, allHandlesAfterPopup[0], 'Expected Window: Main Window');

}).tag('@ProofOfConcept').tag('@grabAllWindowHandles').tag('@grabCurrentWindowHandle').tag('@switchToWindow');
```