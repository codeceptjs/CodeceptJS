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

Scenario('checkout flow', async ({ I }) => {
  // Use I.* for navigation and high-level actions
  I.amOnPage('/products')
  I.click('Add to Cart')

  // Use element-based for detailed validation
  await element('.cart-summary', async cart => {
    const total = await cart.getAttribute('data-total')
    console.log('Cart total:', total)
  })

  // Continue with I.* actions
  I.click('Checkout')
})
```

This hybrid approach gives you the best of both worlds - readable high-level actions mixed with low-level control when needed.

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

### When to Use Each

| Use `I.*` actions when... | Use element-based when... |
|---------------------------|---------------------------|
| Simple navigation and clicks | Complex DOM traversal |
| Standard form interactions | Custom validation logic |
| Built-in assertions suffice | Need specific element properties |
| Readability is priority | Working with element collections |
| Single-step operations | Chaining multiple operations on same element |

## Element Chaining

Element-based testing allows you to chain queries to find child elements, reducing redundant lookups:

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

## Real-World Examples

### Example 1: Form Validation

Validate complex form requirements that built-in methods don't cover:

```js
import { element, eachElement } from 'codeceptjs/els'
import { expect } from 'chai'

Scenario('validate form fields', async ({ I }) => {
  I.amOnPage('/register')

  // Check all required fields are properly marked
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

Work with tabular data using iteration and child element queries:

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

Wait for and validate dynamic content with custom conditions:

```js
import { element, expectElement } from 'codeceptjs/els'

Scenario('wait for dynamic content', async ({ I }) => {
  I.amOnPage('/search')
  I.fillField('query', 'test')
  I.click('Search')

  // Wait for results with custom validation
  await expectElement('.search-results', async results => {
    const items = await results.$$('.result-item')
    return items.length > 0
  })
})
```

### Example 4: Shopping Cart Operations

Calculate and verify cart totals by iterating through items:

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

  // Verify displayed total matches calculated sum
  await element('.cart-total', async totalEl => {
    const displayedTotal = await totalEl.getText()
    const displayedValue = parseFloat(displayedTotal.replace('$', ''))
    expect(displayedValue).to.equal(total)
  })
})
```

### Example 5: List Filtering and Validation

Validate filtered results meet specific criteria:

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

## Best Practices

1. **Mix styles appropriately** - Use `I.*` for navigation and high-level actions, element-based for complex validation

2. **Use descriptive purposes** - Add purpose strings for better debugging logs:
   ```js
   await element(
     'verify discount applied',
     '.price',
     async el => { /* ... */ }
   )
   ```

3. **Reuse element references** - Chain `$(locator)` to avoid redundant lookups

4. **Handle empty results** - Always check if elements exist before accessing properties

5. **Prefer standard assertions** - Use `I.see()`, `I.dontSee()` when possible for readability

6. **Consider page objects** - Combine with Page Objects for reusable element logic

## API Reference

- **[Element Access](els.md)** - Complete reference for `element()`, `eachElement()`, `expectElement()`, `expectAnyElement()`, `expectAllElements()` functions
- **[WebElement API](web-element.md)** - Complete reference for WebElement class methods (`getText()`, `getAttribute()`, `click()`, `$$()`, etc.)

## Portability

Elements are wrapped in a `WebElement` class that provides a consistent API across all helpers (Playwright, WebDriver, Puppeteer). Your element-based tests will work the same way regardless of which helper you're using:

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
