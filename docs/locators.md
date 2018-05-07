# Locators

CodeceptJS provides flexible strategies for locating elements:

* CSS and XPath locators
* semantic locators: by link text, by buntton text, by field names, etc.
* id locators: by CSS id, by accessibility id
* locator builder

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

CodeceptJS provides a flexible builder to compose custom locators in JavaScript. Use `locate` function to start.

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

`locate` has following methods:

#### find

Finds an element inside a located.

```js
// find td inside a table
locate('table').find('td');
```

Switches current element to found one.

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

```


#### first



#### last



#### at



#### inside



#### before



#### after






## ID Locators

