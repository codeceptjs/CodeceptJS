---
permalink: /locators
title: Locators
---

# Locators

CodeceptJS provides flexible strategies for locating elements:

* [CSS and XPath locators](#css-and-xpath)
* [Semantic locators](#semantic-locators): by link text, by button text, by field names, etc.
* [Locator Builder](#locator-builder)
* [ID locators](#id-locators): by CSS id or by accessibility id
* [Custom Locator Strategies](#custom-locators): by data attributes or whatever you prefer.
* [Shadow DOM](/shadow): to access shadow dom elements
* [React](/react): to access React elements by component names and props

Most methods in CodeceptJS use locators which can be either a string or an object.

If the locator is an object, it should have a single element, with the key signifying the locator type (`id`, `name`, `css`, `xpath`, `link`, `react`, `class` or `shadow`) and the value being the locator itself. This is called a "strict" locator.

Examples:

* {id: 'foo'} matches `<div id="foo">`
* {name: 'foo'} matches `<div name="foo">`
* {css: 'input[type=input][value=foo]'} matches `<input type="input" value="foo">`
* {xpath: "//input[@type='submit'][contains(@value, 'foo')]"} matches `<input type="submit" value="foobar">`
* {class: 'foo'} matches `<div class="foo">`

Writing good locators can be tricky.
The Mozilla team has written an excellent guide titled [Writing reliable locators for Selenium and WebDriver tests](https://blog.mozilla.org/webqa/2013/09/26/writing-reliable-locators-for-selenium-and-webdriver-tests/).

If you prefer, you may also pass a string for the locator. This is called a "fuzzy" locator.
In this case, CodeceptJS uses a variety of heuristics (depending on the exact method called) to determine what element you're referring to. If you are locating a clickable element or an input element, CodeceptJS will use [semantic locators](#semantic-locators).

For example, here's the heuristic used for the `fillField` method:

1. Does the locator look like an ID selector (e.g. "#foo")? If so, try to find an input element matching that ID.
2. If nothing found, check if locator looks like a CSS selector. If so, run it.
3. If nothing found, check if locator looks like an XPath expression. If so, run it.
4. If nothing found, check if there is an input element with a corresponding name.
5. If nothing found, check if there is a label with specified text for input element.
6. If nothing found, throw an `ElementNotFound` exception.

> ⚠ Be warned that fuzzy locators can be significantly slower than strict locators. If speed is a concern, it's recommended you stick with explicitly specifying the locator type via object syntax.

It is recommended to avoid using implicit CSS locators in methods like `fillField` or `click`, where semantic locators are allowed.
Use locator type to speed up search by various locator strategies.

```js
// will search for "input[type=password]" text before trying to search by CSS
I.fillField('input[type=password]', '123456');
// replace with strict locator
I.fillField({ css: 'input[type=password]' }, '123456');
```

## CSS and XPath

Both CSS and XPath is supported. Usually CodeceptJS can guess locator's type:

```js
// select by CSS
I.seeElement('.user .profile');
I.seeElement('#user-name');

// select by XPath
I.seeElement('//table/tr/td[position()=3]');
```

To specify exact locator type use **strict locators**:

```js
// it's not clear that 'button' is actual CSS locator
I.seeElement({ css: 'button' });

// it's not clear that 'descendant::table/tr' is actual XPath locator
I.seeElement({ xpath: 'descendant::table/tr' });
```

> ℹ Use [Locator Advicer](https://davertmik.github.io/locator/) to check quality of your locators.

## Semantic Locators

CodeceptJS can guess an element's locator from context.
For example, when clicking CodeceptJS will try to find a link or button by their text
When typing into a field this field can be located by its name, placeholder.

```js
I.click('Sign In');
I.fillField('Username', 'davert');
```

Various strategies are used to locate semantic elements. However, they may run slower than specifying locator by XPath or CSS.

## Locator Builder

CodeceptJS provides a fluent builder to compose custom locators in JavaScript. Use `locate` function to start.

To locate `a` element inside `label` with text: 'Hello' use:

```js
locate('a')
  .withAttr({ href: '#' })
  .inside(locate('label').withText('Hello'));
```

which will produce following XPath:

```
.//a[@href = '#'][ancestor::label[contains(., 'Hello')]]
```

Locator builder accepts both XPath and CSS as parameters but converts them to XPath as more feature-rich format.
Sometimes provided locators can get very long so it's recommended to simplify the output by providing a brief description for generated XPath:

```js
locate('//table')
  .find('a')
  .withText('Edit')
  .as('edit button')
// will be printed as 'edit button'
```

`locate` has following methods:

#### find

Finds an element inside a located.

```js
// find td inside a table
locate('table').find('td');
```
Switches current element to found one.
Can accept another `locate` call or strict locator.

#### withAttr

Find an element with provided attributes

```js
// find input with placeholder 'Type in name'
locate('input').withAttr({ placeholder: 'Type in name' });
```

#### withChild

Finds an element which contains a child element provided:

```js
// finds form with <select> inside it
locate('form').withChild('select');
```

#### withDescendant

Finds an element which contains a descendant element provided:

```js
// finds form with <select> which is the descendant it
locate('form').withDescendant('select');
```

#### withText

Finds element containing a text

```js
locate('span').withText('Warning');
```

#### first

Get first element:

```js
locate('#table td').first();
```

#### last

Get last element:

```js
locate('#table td').last();
```

#### at

Get element at position:

```js
// first element
locate('#table td').at(1);
// second element
locate('#table td').at(2);
// second element from end
locate('#table td').at(-2);
```

#### inside

Finds an element which contains an provided ancestor:

```js
// finds `select` element inside #user_profile
locate('select').inside('form#user_profile');
```

#### before

Finds element located before the provided one

```js
// finds `button` before .btn-cancel
locate('button').before('.btn-cancel');
```

#### after

Finds element located after the provided one

```js
// finds `button` after .btn-cancel
locate('button').after('.btn-cancel');
```

## ID Locators

ID locators are best to select the exact semantic element in web and mobile testing:

* `#user` or `{ id: 'user' }` finds element with id="user"
* `~user` finds element with accessibility id "user" (in Mobile testing) or with `aria-label=user`.

## Custom Locators

CodeceptJS allows to create custom locator strategies and use them in tests. This way you can define your own handling of elements using specially prepared attributes of elements.

What if you use special test attributes for locators such as `data-qa`, `data-test`, `test-id`, etc.
We created [customLocator plugin](/plugins#customlocator) to declare rules for locating element.

Instead of writing a full CSS locator like `[data-qa-id=user_name]` simplify it to `$user_name`.

```js
// replace this:
I.click({ css: '[data-test-id=register_button]'});
// with this:
I.click('$register_button');
```

This plugin requires two options: locator prefix and actual attribute to match.

> ℹ See [customLocator Plugin](/plugins#customlocator) reference to learn how to set it up.

If you need more control over custom locators see how declare them manually without using a customLocator plugin.

#### Custom Strict Locators

If use locators of `data-element` attribute you can implement a strategy, which will allow you to use `{ data: 'my-element' }` as a valid locator.

Custom locators should be implemented in a plugin or a bootstrap script using internal CodeceptJS API:

```js
// inside a plugin or a bootstrap script:
codeceptjs.locator.addFilter((providedLocator, locatorObj) => {
  // providedLocator - a locator in a format it was provided
  // locatorObj - a standrard locator object.
    if (providedLocator.data) {
      locatorObj.type = 'css';
      locatorObj.value = `[data-element=${providedLocator.data}]`
    }
});
```

That's all. New locator type is ready to use:

```js
I.click({ data: 'user-login' });
```

#### Custom String Locators

What if we want to locators prefixed with `=` to match elements with exact text value.
We can do that too:

```js
// inside a plugin or a bootstrap script:
codeceptjs.locator.addFilter((providedLocator, locatorObj) => {
    if (typeof providedLocator === 'string') {
      // this is a string
      if (providedLocator[0] === '=') {
        locatorObj.value = `.//*[text()="${providedLocator.substring(1)}"]`;
        locatorObj.type = 'xpath';
      }
    }
});
```
New locator strategy is ready to use:


```js
I.click('=Login');
```

#### Custom Strategy Locators

CodeceptJS provides the option to specify custom locators that uses Custom Locator Strategies defined in the WebDriver configuration. It uses the WebDriverIO's [custom$](https://webdriver.io/docs/api/browser/custom$.html) locators internally to locate the elements on page.
To use the defined Custom Locator Strategy add your custom strategy to your configuration.

```js
// in codecept.conf.js

const myStrat = (selector) => {
  return document.querySelectorAll(selector)
}

// under WebDriver Helpers Configuration
WebDriver: {
  ...
  customLocatorStrategies: {
    custom: myStrat
  }
}
```

```js
I.click({custom: 'my-shadow-element-unique-css'})
```


> For more details on locator object see [Locator](https://github.com/codeceptjs/CodeceptJS/blob/master/lib/locator.js) class implementation.
