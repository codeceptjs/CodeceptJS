# Custom Locator Strategies - Playwright Helper

This document describes how to configure and use custom locator strategies in the CodeceptJS Playwright helper.

## Configuration

Custom locator strategies can be configured in your `codecept.conf.js` file:

```js
exports.config = {
  helpers: {
    Playwright: {
      url: 'http://localhost:3000',
      browser: 'chromium',
      customLocatorStrategies: {
        byRole: (selector, root) => {
          return root.querySelector(`[role="${selector}"]`)
        },
        byTestId: (selector, root) => {
          return root.querySelector(`[data-testid="${selector}"]`)
        },
        byDataQa: (selector, root) => {
          const elements = root.querySelectorAll(`[data-qa="${selector}"]`)
          return Array.from(elements) // Return array for multiple elements
        },
        byAriaLabel: (selector, root) => {
          return root.querySelector(`[aria-label="${selector}"]`)
        },
        byPlaceholder: (selector, root) => {
          return root.querySelector(`[placeholder="${selector}"]`)
        },
      },
    },
  },
}
```

## Usage

Once configured, custom locator strategies can be used with the same syntax as other locator types:

### Basic Usage

```js
// Find and interact with elements
I.click({ byRole: 'button' })
I.fillField({ byTestId: 'username' }, 'john_doe')
I.see('Welcome', { byAriaLabel: 'greeting' })
I.seeElement({ byDataQa: 'navigation' })
```

### Advanced Usage

```js
// Use with within() blocks
within({ byRole: 'form' }, () => {
  I.fillField({ byTestId: 'email' }, 'test@example.com')
  I.click({ byRole: 'button' })
})

// Mix with standard locators
I.seeElement({ byRole: 'main' })
I.seeElement('#sidebar') // Standard CSS selector
I.seeElement({ xpath: '//div[@class="content"]' }) // Standard XPath

// Use with grabbing methods
const text = I.grabTextFrom({ byTestId: 'status' })
const value = I.grabValueFrom({ byPlaceholder: 'Enter email' })

// Use with waiting methods
I.waitForElement({ byRole: 'alert' }, 5)
I.waitForVisible({ byDataQa: 'loading-spinner' }, 3)
```

## Locator Function Requirements

Custom locator functions must follow these requirements:

### Function Signature

```js
(selector, root) => HTMLElement | HTMLElement[] | null
```

- **selector**: The selector value passed to the locator
- **root**: The DOM element to search within (usually `document` or a parent element)
- **Return**: Single element, array of elements, or null/undefined if not found

### Example Functions

```js
customLocatorStrategies: {
  // Single element selector
  byRole: (selector, root) => {
    return root.querySelector(`[role="${selector}"]`);
  },

  // Multiple elements selector (returns first for interactions)
  byDataQa: (selector, root) => {
    const elements = root.querySelectorAll(`[data-qa="${selector}"]`);
    return Array.from(elements);
  },

  // Complex selector with validation
  byCustomAttribute: (selector, root) => {
    if (!selector) return null;
    try {
      return root.querySelector(`[data-custom="${selector}"]`);
    } catch (error) {
      console.warn('Invalid selector:', selector);
      return null;
    }
  },

  // Case-insensitive text search
  byTextIgnoreCase: (selector, root) => {
    const elements = Array.from(root.querySelectorAll('*'));
    return elements.find(el =>
      el.textContent &&
      el.textContent.toLowerCase().includes(selector.toLowerCase())
    );
  }
}
```

## Error Handling

The framework provides graceful error handling:

### Undefined Strategies

```js
// This will throw an error
I.click({ undefinedStrategy: 'value' })
// Error: Please define "customLocatorStrategies" as an Object and the Locator Strategy as a "function".
```

### Malformed Functions

If a custom locator function throws an error, it will be caught and logged:

```js
byBrokenLocator: (selector, root) => {
  throw new Error('This locator is broken')
}

// Usage will log warning but not crash the test:
I.seeElement({ byBrokenLocator: 'test' }) // Logs warning, returns null
```

## Best Practices

### 1. Naming Conventions

Use descriptive names that clearly indicate what the locator does:

```js
// Good
byRole: (selector, root) => root.querySelector(`[role="${selector}"]`),
byTestId: (selector, root) => root.querySelector(`[data-testid="${selector}"]`),

// Avoid
by1: (selector, root) => root.querySelector(`[role="${selector}"]`),
custom: (selector, root) => root.querySelector(`[data-testid="${selector}"]`),
```

### 2. Error Handling

Always include error handling in your custom functions:

```js
byRole: (selector, root) => {
  if (!selector || !root) return null
  try {
    return root.querySelector(`[role="${selector}"]`)
  } catch (error) {
    console.warn(`Error in byRole locator:`, error)
    return null
  }
}
```

### 3. Multiple Elements

For selectors that may return multiple elements, return an array:

```js
byClass: (selector, root) => {
  const elements = root.querySelectorAll(`.${selector}`)
  return Array.from(elements) // Convert NodeList to Array
}
```

### 4. Performance

Keep locator functions simple and fast:

```js
// Good - simple querySelector
byTestId: (selector, root) => root.querySelector(`[data-testid="${selector}"]`),

// Avoid - complex DOM traversal
byComplexSearch: (selector, root) => {
  // Avoid complex searches that iterate through many elements
  return Array.from(root.querySelectorAll('*'))
    .find(el => /* complex condition */);
}
```

## Testing Custom Locators

### Unit Testing

Test your custom locator functions independently:

```js
describe('Custom Locators', () => {
  it('should find elements by role', () => {
    const mockRoot = {
      querySelector: sinon.stub().returns(mockElement),
    }

    const result = customLocatorStrategies.byRole('button', mockRoot)
    expect(mockRoot.querySelector).to.have.been.calledWith('[role="button"]')
    expect(result).to.equal(mockElement)
  })
})
```

### Integration Testing

Create acceptance tests that verify the locators work with real DOM:

```js
Scenario('should use custom locators', I => {
  I.amOnPage('/test-page')
  I.seeElement({ byRole: 'navigation' })
  I.click({ byTestId: 'submit-button' })
  I.see('Success', { byAriaLabel: 'status-message' })
})
```

## Migration from Other Helpers

If you're migrating from WebDriver helper that already supports custom locators, the syntax is identical:

```js
// WebDriver and Playwright both support this syntax:
I.click({ byTestId: 'submit' })
I.fillField({ byRole: 'textbox' }, 'value')
```

## Troubleshooting

### Common Issues

1. **Locator not recognized**: Ensure the strategy is defined in `customLocatorStrategies` and is a function.

2. **Elements not found**: Check that your locator function returns the correct element or null.

3. **Multiple elements**: If your function returns an array, interactions will use the first element.

4. **Timing issues**: Custom locators work with all waiting methods (`waitForElement`, etc.).

### Debug Mode

Enable debug mode to see locator resolution:

```js
// In codecept.conf.js
exports.config = {
  helpers: {
    Playwright: {
      // ... other config
    },
  },
  plugins: {
    stepByStepReport: {
      enabled: true,
    },
  },
}
```

### Verbose Logging

Custom locator registration is logged when the helper starts:

```
Playwright: registering custom locator strategy: byRole
Playwright: registering custom locator strategy: byTestId
```
