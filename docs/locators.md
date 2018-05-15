# Locators

CodeceptJS provides flexible strategies for locating elements:

* [CSS and XPath locators](#css-and-xpath)
* [Semantic locators](#semantic-locators): by link text, by button text, by field names, etc.
* [Locator Builder](#locator-builder)
* [ID locators](#id-locators): by CSS id or by accessibility id

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

// it's not clear that 'descendant::table/tr' is actual CSS locator
I.seeElement({ xpath: 'descendant::table/tr' });
```

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

To locate `a` element inside `label` with test: 'Hello' use:

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
