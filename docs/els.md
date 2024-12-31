## Element Access

The `els` module provides low-level element manipulation functions for CodeceptJS tests, allowing for more granular control over element interactions and assertions. However, because element representation differs between frameworks, tests using element functions are not portable between helpers. So if you set to use Playwright you won't be able to witch to WebDriver with one config change in CodeceptJS.

### Usage

Import the els functions in your test file:

```js
const { element, eachElement, expectElement, expectAnyElement, expectAllElements } = require('codeceptjs/els');
```

## element

The `element` function allows you to perform custom operations on the first matching element found by a locator. It provides a low-level way to interact with elements when the built-in helper methods aren't sufficient.

### Syntax

```js
element(purpose, locator, fn);
// or
element(locator, fn);
```

### Parameters

- `purpose` (optional) - A string describing the operation being performed. If omitted, a default purpose will be generated from the function.
- `locator` - A locator string/object to find the element(s).
- `fn` - An async function that receives the element as its argument and performs the desired operation. `el` argument represents an element of an underlying engine used: Playwright, WebDriver, or Puppeteer.

### Returns

Returns the result of the provided async function executed on the first matching element.

### Example

```js
Scenario('my test', async ({ I }) => {
  // combine element function with standard steps:
  I.amOnPage('/cart');

  // but use await every time you use element function
  await element(
    // with explicit purpose
    'check custom attribute',
    '.button',
    async el => await el.getAttribute('data-test'),
  );

  // or simply
  await element('.button', async el => {
    return await el.isEnabled();
  });
});
```

### Notes

- Only works with helpers that implement the `_locate` method
- The function will only operate on the first element found, even if multiple elements match the locator
- The provided callback must be an async function
- Throws an error if no helper with `_locate` method is enabled

## eachElement

The `eachElement` function allows you to perform operations on each element that matches a locator. It's useful for iterating through multiple elements and performing the same operation on each one.

### Syntax

```js
eachElement(purpose, locator, fn);
// or
eachElement(locator, fn);
```

### Parameters

- `purpose` (optional) - A string describing the operation being performed. If omitted, a default purpose will be generated from the function.
- `locator` - A locator string/object to find the element(s).
- `fn` - An async function that receives two arguments:
  - `el` - The current element being processed
  - `index` - The index of the current element in the collection

### Returns

Returns a promise that resolves when all elements have been processed. If any element operation fails, the function will throw the first encountered error.

### Example

```js
Scenario('my test', async ({ I }) => {
  // combine element function with standard steps:
  I.click('/hotels');

  // iterate over elements but don't forget to put await
  await eachElement(
    'validate list items', // explain your actions for future review
    '.list-item', // locator
    async (el, index) => {
      const text = await el.getText();
      console.log(`Item ${index}: ${text}`);
    },
  );

  // Or simply check if all checkboxes are checked
  await eachElement('input[type="checkbox"]', async el => {
    const isChecked = await el.isSelected();
    if (!isChecked) {
      throw new Error('Found unchecked checkbox');
    }
  });
});
```

### Notes

- Only works with helpers that implement the `_locate` method
- The function will process all elements that match the locator
- The provided callback must be an async function
- If an operation fails on any element, the error is logged and the function continues processing remaining elements
- After all elements are processed, if any errors occurred, the first error is thrown
- Throws an error if no helper with `_locate` method is enabled

## expectElement

The `expectElement` function allows you to perform assertions on the first element that matches a locator. It's designed for validating element properties or states and will throw an assertion error if the condition is not met.

### Syntax

```js
expectElement(locator, fn);
```

### Parameters

- `locator` - A locator string/object to find the element(s).
- `fn` - An async function that receives the element as its argument and should return a boolean value:
  - `true` - The assertion passed
  - `false` - The assertion failed

### Returns

Returns a promise that resolves when the assertion is complete. Throws an assertion error if the condition is not met.

### Example

```js
// Check if a button is enabled
await expectElement('.submit-button', async el => {
  return await el.isEnabled();
});

// Verify element has specific text content
await expectElement('.header', async el => {
  const text = await el.getText();
  return text === 'Welcome';
});

// Check for specific attribute value
await expectElement('#user-profile', async el => {
  const role = await el.getAttribute('role');
  return role === 'button';
});
```

### Notes

- Only works with helpers that implement the `_locate` method
- The function will only check the first element found, even if multiple elements match the locator
- The provided callback must be an async function that returns a boolean
- The assertion message will include both the locator and the function used for validation
- Throws an error if no helper with `_locate` method is enabled

## expectAnyElement

The `expectAnyElement` function allows you to perform assertions where at least one element from a collection should satisfy the condition. It's useful when you need to verify that at least one element among many matches your criteria.

### Syntax

```js
expectAnyElement(locator, fn);
```

### Parameters

- `locator` - A locator string/object to find the element(s).
- `fn` - An async function that receives the element as its argument and should return a boolean value:
  - `true` - The assertion passed for this element
  - `false` - The assertion failed for this element

### Returns

Returns a promise that resolves when the assertion is complete. Throws an assertion error if no elements satisfy the condition.

### Example

```js
Scenario('validate any element matches criteria', async ({ I }) => {
  // Navigate to the page
  I.amOnPage('/products');

  // Check if any product is marked as "in stock"
  await expectAnyElement('.product-item', async el => {
    const status = await el.getAttribute('data-status');
    return status === 'in-stock';
  });

  // Verify at least one price is below $100
  await expectAnyElement('.price-tag', async el => {
    const price = await el.getText();
    return parseFloat(price.replace('$', '')) < 100;
  });

  // Check if any button in the list is enabled
  await expectAnyElement('.action-button', async el => {
    return await el.isEnabled();
  });
});
```

### Notes

- Only works with helpers that implement the `_locate` method
- The function will check all matching elements until it finds one that satisfies the condition
- Stops checking elements once the first matching condition is found
- The provided callback must be an async function that returns a boolean
- Throws an assertion error if no elements satisfy the condition
- Throws an error if no helper with `_locate` method is enabled

## expectAllElements

The `expectAllElements` function verifies that every element matching the locator satisfies the given condition. It's useful when you need to ensure that all elements in a collection meet specific criteria.

### Syntax

```js
expectAllElements(locator, fn);
```

### Parameters

- `locator` - A locator string/object to find the element(s).
- `fn` - An async function that receives the element as its argument and should return a boolean value:
  - `true` - The assertion passed for this element
  - `false` - The assertion failed for this element

### Returns

Returns a promise that resolves when all assertions are complete. Throws an assertion error as soon as any element fails the condition.

### Example

```js
Scenario('validate all elements meet criteria', async ({ I }) => {
  // Navigate to the page
  I.amOnPage('/dashboard');

  // Verify all required fields have the required attribute
  await expectAllElements('.required-field', async el => {
    const required = await el.getAttribute('required');
    return required !== null;
  });

  // Check if all checkboxes in a form are checked
  await expectAllElements('input[type="checkbox"]', async el => {
    return await el.isSelected();
  });

  // Verify all items in a list have non-empty text
  await expectAllElements('.list-item', async el => {
    const text = await el.getText();
    return text.trim().length > 0;
  });

  // Ensure all buttons in a section are enabled
  await expectAllElements('#action-section button', async el => {
    return await el.isEnabled();
  });
});
```

### Notes

- Only works with helpers that implement the `_locate` method
- The function checks every element that matches the locator
- Fails fast: stops checking elements as soon as one fails the condition
- The provided callback must be an async function that returns a boolean
- The assertion message will include which element number failed (e.g., "element #2 of...")
- Throws an error if no helper with `_locate` method is enabled
