# Acceptance Testing

How does your client, manager, or tester, or any other non-technical person, know your web application is working? By opening the browser, accessing a site, clicking on links, filling in the forms, and actually seeing the content on a web page.

Acceptance (also called End to End) tests can cover standard but complex scenarios from a user's perspective. With acceptance tests you can be confident that users, following all defined scenarios, won't get errors. We check **not just functionality of application but a user interface** (UI) as well.

By default CodeceptJS uses [WebDriverIO](/helpers/WebDriverIO/) helper and **Selenium** to automate browser. Within web page you can locate elements, interact with them, and check that expected elements are present on a page.
However, you can also choose [Nightmare](/helpers/Nightmare) or [Protractor](/helpers/Protractor) helpers, driven by corresponding libraries.
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
in WebDriverIO helper accept them both.

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
// locate element by text
I.seeElement({text: 'press me'});
// locate element by id
I.seeElement({id: 'users'});
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
I.fillField('email', 'miles@davis.com')
I.click('Generate Password');
$password = yield I.grabTextFrom('#password');
I.click('Login');
I.fillField('email', 'miles@davis.com');
I.fillField('password', $password);
I.click('Log in!');
```

`grabTextFrom` action is used here to retrieve text from an element. All actions starting with `grab` prefix are expected to return data. In order to synchronize this step with a scenario you should pause test execution with `yield` keyword of ES6. To make it work your test should be written inside a generator function (notice `*` in its definition):

```js
Scenario('use page title', function*(I) {
  // ...
  var password = yield I.grabTextFrom('#password');
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

## IFrames

[within](/basics/#within) operator can be used to work inside IFrames. Special `frame` locator is required to locate the iframe and get into its context.

See example:

```js
within({frame: "#editor"}, () => {
  I.see('Page');
});
```

Nested IFrames can be set by passing array *(Nightmare only)*:

```js
within({frame: [".content", "#editor"]);
```

---

### done()

CodeceptJS through helpers provides user friendly API to interact with a webpage. In this section we described using WebDriverIO helper which allows to control browser through Selenium WebDriver.
