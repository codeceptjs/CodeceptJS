# Element-Based Testing

CodeceptJS offers multiple ways to write tests. While the traditional `I.*` actions provide a clean, readable syntax, element-based testing gives you more control and flexibility when working with complex DOM structures.

## Why Element-Based Testing?

Element-based testing is useful when:

- **You need direct access to DOM properties** - Inspect attributes, computed styles, or form values
- **Working with lists and collections** - Iterate over multiple elements with custom logic
- **Complex assertions** - Validate conditions that built-in methods don't cover
- **Performance optimization** - Reduce redundant lookups by reusing element references
- **Custom interactions** - Perform actions not available in standard helper methods

## The CodeceptJS Hybrid Approach

CodeceptJS uniquely combines both styles. You can freely mix `I.*` actions with element-based operations in the same test:

```js
// Import element functions
import { element, eachElement, expectElement } from 'codeceptjs/els'
import { expect } from 'chai'

Scenario('checkout flow', async ({ I }) => {
  // Use I.* for navigation and high-level actions
  I.amOnPage('/products')
  I.click('Add to Cart')

  // Use element-based for detailed validation
  await element('.cart-summary', async cart => {
    const total = await cart.getAttribute('data-total')
    expect(parseFloat(total)).to.be.above(0)
  })

  // Continue with I.* actions
  I.click('Checkout')
})
```

## Quick Comparison

### Traditional I.* Approach

```js
Scenario('form validation', async ({ I }) => {
  I.amOnPage('/register')
  I.fillField('Email', 'test@example.com')
  I.fillField('Password', 'secret123')
  I.click('Register')
  I.see('Welcome')
})
```

### Element-Based Approach

```js
import { element, expectElement } from 'codeceptjs/els'

Scenario('form validation', async ({ I }) => {
  I.amOnPage('/register')

  // Direct form manipulation
  await element('#email', async input => {
    await input.type('test@example.com')
  })

  await element('#password', async input => {
    await input.type('secret123')
  })

  await element('button[type="submit"]', async btn => {
    await btn.click()
  })

  // Custom assertion
  await expectElement('.welcome-message', async msg => {
    const text = await msg.getText()
    return text.includes('Welcome')
  })
})
```

### Using Element Chaining

```js
import { element } from 'codeceptjs/els'

Scenario('product list', async ({ I }) => {
  I.amOnPage('/products')

  // Chain into child elements
  await element('.product-list', async list => {
    const firstProduct = await list.$('.product-item')
    const title = await firstProduct.$('.title')
    const price = await firstProduct.$('.price')

    const titleText = await title.getText()
    const priceValue = await price.getText()

    console.log(`${titleText}: ${priceValue}`)
  })
})
```

## WebElement API Reference

Elements returned by `element()`, `eachElement()`, and `expectElement()` functions are wrapped in a `WebElement` class that provides a consistent API across all helpers (Playwright, WebDriver, Puppeteer).

### Getting Element Information

#### `getText()`
Get the visible text content of an element.

```js
await element('.status', async el => {
  const text = await el.getText()
  console.log(text) // "Active"
})
```

#### `getAttribute(name)`
Get the value of an attribute.

```js
await element('input', async el => {
  const type = await el.getAttribute('type')
  const placeholder = await el.getAttribute('placeholder')
})
```

#### `getProperty(name)`
Get the value of a JavaScript property.

```js
await element('input', async el => {
  const value = await el.getProperty('value')
  const checked = await el.getProperty('checked')
})
```

#### `getInnerHTML()`
Get the inner HTML of an element.

```js
await element('.content', async el => {
  const html = await el.getInnerHTML()
})
```

#### `getValue()`
Get the current value of an input element.

```js
await element('#username', async el => {
  const value = await el.getValue()
})
```

### Checking Element State

#### `isVisible()`
Check if an element is visible.

```js
await element('.modal', async el => {
  const visible = await el.isVisible()
  if (visible) {
    console.log('Modal is shown')
  }
})
```

#### `isEnabled()`
Check if an element is enabled (typically for inputs and buttons).

```js
await element('button', async el => {
  const enabled = await el.isEnabled()
  if (!enabled) {
    throw new Error('Button should be enabled')
  }
})
```

#### `exists()`
Check if an element exists in the DOM.

```js
await element('.notification', async el => {
  const exists = await el.exists()
})
```

### Element Interactions

#### `click(options)`
Click the element.

```js
await element('.submit-btn', async el => {
  await el.click()
})

// With options (Playwright/Puppeteer)
await element('.btn', async el => {
  await el.click({ button: 'right' })
})
```

#### `type(text, options)`
Type text into an input element.

```js
await element('#search', async el => {
  await el.type('search query')
})
```

### Element Location

#### `getBoundingBox()`
Get the position and size of an element.

```js
await element('.hero', async el => {
  const box = await el.getBoundingBox()
  console.log(`x: ${box.x}, y: ${box.y}, width: ${box.width}, height: ${box.height}`)
})
```

### Child Element Queries

#### `$(locator)`
Find the first child element matching the locator.

```js
await element('.container', async container => {
  const button = await container.$('button')
  await button.click()
})
```

#### `$$(locator)`
Find all child elements matching the locator.

```js
await element('.list', async list => {
  const items = await list.$$('.item')
  for (const item of items) {
    console.log(await item.getText())
  }
})
```

## Element Functions

### `element(locator, fn)`

Execute a function on the first matching element.

```js
import { element } from 'codeceptjs/els'
import { expect } from 'chai'

// Basic usage
await element('.submit-button', async btn => {
  await btn.click()
})

// With custom purpose for better logging
await element(
  'check button state',
  '.submit-button',
  async btn => {
    const enabled = await btn.isEnabled()
    expect(enabled).to.be.true
  }
)

// Return values
const text = await element('.title', async el => {
  return await el.getText()
})
console.log(text)
```

### `eachElement(locator, fn)`

Execute a function on each matching element.

```js
import { eachElement } from 'codeceptjs/els'

// Iterate over list items
await eachElement('.todo-item', async (item, index) => {
  const text = await item.getText()
  console.log(`Item ${index}: ${text}`)
})

// Validate all checkboxes are checked
await eachElement('input[type="checkbox"]', async checkbox => {
  const checked = await checkbox.getProperty('checked')
  if (!checked) {
    throw new Error('Found unchecked checkbox')
  }
})
```

### `expectElement(locator, fn)`

Assert that the first matching element meets a condition.

```js
import { expectElement } from 'codeceptjs/els'

// Check if button is enabled
await expectElement('.submit-btn', async btn => {
  return await btn.isEnabled()
})

// Verify element has specific attribute
await expectElement('#user-profile', async el => {
  const role = await el.getAttribute('role')
  return role === 'button'
})

// Check text content
await expectElement('.header', async el => {
  const text = await el.getText()
  return text === 'Welcome'
})
```

### `expectAnyElement(locator, fn)`

Assert that at least one matching element meets a condition.

```js
import { expectAnyElement } from 'codeceptjs/els'

// Check if any product is in stock
await expectAnyElement('.product-item', async product => {
  const status = await product.getAttribute('data-status')
  return status === 'in-stock'
})

// Verify at least one button is enabled
await expectAnyElement('.action-btn', async btn => {
  return await btn.isEnabled()
})
```

### `expectAllElements(locator, fn)`

Assert that all matching elements meet a condition.

```js
import { expectAllElements } from 'codeceptjs/els'

// Verify all required fields have the required attribute
await expectAllElements('.required-field', async field => {
  const required = await field.getAttribute('required')
  return required !== null
})

// Check all links have valid href
await expectAllElements('a', async link => {
  const href = await link.getAttribute('href')
  return href && href.startsWith('http')
})
```

## Real-World Examples

### Example 1: Form Validation

```js
import { element, eachElement } from 'codeceptjs/els'
import { expect } from 'chai'

Scenario('validate form fields', async ({ I }) => {
  I.amOnPage('/register')

  // Check all required fields are marked
  await eachElement('[required]', async field => {
    const ariaRequired = await field.getAttribute('aria-required')
    const required = await field.getAttribute('required')
    if (!ariaRequired && !required) {
      throw new Error('Required field missing indicators')
    }
  })

  // Fill form with custom validation
  await element('#email', async input => {
    await input.type('test@example.com')
    const value = await input.getValue()
    expect(value).to.include('@')
  })

  I.click('Submit')
})
```

### Example 2: Data Table Processing

```js
import { eachElement, element } from 'codeceptjs/els'

Scenario('verify table data', async ({ I }) => {
  I.amOnPage('/dashboard')

  // Get table row count
  await element('table tbody', async tbody => {
    const rows = await tbody.$$('tr')
    console.log(`Table has ${rows.length} rows`)
  })

  // Verify each row has expected structure
  await eachElement('table tbody tr', async (row, index) => {
    const cells = await row.$$('td')
    if (cells.length < 3) {
      throw new Error(`Row ${index} should have at least 3 columns`)
    }
  })
})
```

### Example 3: Dynamic Content Waiting

```js
import { element, expectElement } from 'codeceptjs/els'

Scenario('wait for dynamic content', async ({ I }) => {
  I.amOnPage('/search')
  I.fillField('query', 'test')
  I.click('Search')

  // Wait for results with custom timeout
  const hasResults = await expectElement('.search-results', async results => {
    const items = await results.$$('.result-item')
    return items.length > 0
  })
})
```

### Example 4: Shopping Cart Operations

```js
import { element, eachElement } from 'codeceptjs/els'
import { expect } from 'chai'

Scenario('calculate cart total', async ({ I }) => {
  I.amOnPage('/cart')

  let total = 0

  // Sum up all item prices
  await eachElement('.cart-item .price', async priceEl => {
    const priceText = await priceEl.getText()
    const price = parseFloat(priceText.replace('$', ''))
    total += price
  })

  // Verify displayed total matches
  await element('.cart-total', async totalEl => {
    const displayedTotal = await totalEl.getText()
    const displayedValue = parseFloat(displayedTotal.replace('$', ''))
    expect(displayedValue).to.equal(total)
  })
})
```

### Example 5: List Filtering and Validation

```js
import { element, eachElement, expectAnyElement } from 'codeceptjs/els'
import { expect } from 'chai'

Scenario('filter products by price', async ({ I }) => {
  I.amOnPage('/products')
  I.click('Under $100')

  // Verify all displayed products are under $100
  await eachElement('.product-item', async product => {
    const priceEl = await product.$('.price')
    const priceText = await priceEl.getText()
    const price = parseFloat(priceText.replace('$', ''))
    expect(price).to.be.below(100)
  })

  // Check at least one product exists
  await expectAnyElement('.product-item', async () => true)
})
```

## Portability Across Helpers

The WebElement wrapper provides a consistent API whether you're using Playwright, WebDriver, or Puppeteer. Your element-based tests will work the same way across all helpers:

```js
// This test works identically with Playwright, WebDriver, or Puppeteer
import { element } from 'codeceptjs/els'

Scenario('portable test', async ({ I }) => {
  I.amOnPage('/')

  await element('.main-title', async title => {
    const text = await title.getText()        // Works on all helpers
    const className = await title.getAttribute('class')
    const visible = await title.isVisible()
    const enabled = await title.isEnabled()
  })
})
```

## Best Practices

1. **Mix styles appropriately** - Use `I.*` for navigation and high-level actions, element-based for complex validation
2. **Use descriptive purposes** - Add purpose strings for better debugging logs
3. **Reuse element references** - Chain `$(locator)` to avoid redundant lookups
4. **Handle empty results** - Always check if elements exist before accessing properties
5. **Prefer standard assertions** - Use `I.see()`, `I.dontSee()` when possible for readability
6. **Consider page objects** - Combine with Page Objects for reusable element logic

## Limitations

- Element-based tests access helper-specific features, making them less portable than pure `I.*` tests
- The WebElement wrapper adds a small performance overhead
- Some helper-specific features may not be available through the unified API
