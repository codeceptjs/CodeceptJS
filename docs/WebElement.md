# WebElement API

The WebElement class provides a unified interface for interacting with elements across different CodeceptJS helpers (Playwright, WebDriver, Puppeteer). It wraps native element instances and provides consistent methods regardless of the underlying helper.

## Basic Usage

```javascript
// Get WebElement instances from any helper
const element = await I.grabWebElement('#button')
const elements = await I.grabWebElements('.items')

// Use consistent API across all helpers
const text = await element.getText()
const isVisible = await element.isVisible()
await element.click()
await element.type('Hello World')

// Find child elements
const childElement = await element.$('.child-selector')
const childElements = await element.$$('.child-items')
```

## API Methods

### Element Properties

#### `getText()`

Get the text content of the element.

```javascript
const text = await element.getText()
console.log(text) // "Button Text"
```

#### `getAttribute(name)`

Get the value of a specific attribute.

```javascript
const id = await element.getAttribute('id')
const className = await element.getAttribute('class')
```

#### `getProperty(name)`

Get the value of a JavaScript property.

```javascript
const value = await element.getProperty('value')
const checked = await element.getProperty('checked')
```

#### `getInnerHTML()`

Get the inner HTML content of the element.

```javascript
const html = await element.getInnerHTML()
console.log(html) // "<span>Content</span>"
```

#### `getValue()`

Get the value of input elements.

```javascript
const inputValue = await element.getValue()
```

### Element State

#### `isVisible()`

Check if the element is visible.

```javascript
const visible = await element.isVisible()
if (visible) {
  console.log('Element is visible')
}
```

#### `isEnabled()`

Check if the element is enabled (not disabled).

```javascript
const enabled = await element.isEnabled()
if (enabled) {
  await element.click()
}
```

#### `exists()`

Check if the element exists in the DOM.

```javascript
const exists = await element.exists()
if (exists) {
  console.log('Element exists')
}
```

#### `getBoundingBox()`

Get the element's bounding box (position and size).

```javascript
const box = await element.getBoundingBox()
console.log(box) // { x: 100, y: 200, width: 150, height: 50 }
```

### Element Interactions

#### `click(options)`

Click the element.

```javascript
await element.click()
// With options (Playwright/Puppeteer)
await element.click({ button: 'right' })
```

#### `type(text, options)`

Type text into the element.

```javascript
await element.type('Hello World')
// With options (Playwright/Puppeteer)
await element.type('Hello', { delay: 100 })
```

### Child Element Search

#### `$(locator)`

Find the first child element matching the locator.

```javascript
const childElement = await element.$('.child-class')
if (childElement) {
  await childElement.click()
}
```

#### `$$(locator)`

Find all child elements matching the locator.

```javascript
const childElements = await element.$$('.child-items')
for (const child of childElements) {
  const text = await child.getText()
  console.log(text)
}
```

### Native Access

#### `getNativeElement()`

Get the original native element instance.

```javascript
const nativeElement = element.getNativeElement()
// For Playwright: ElementHandle
// For WebDriver: WebElement
// For Puppeteer: ElementHandle
```

#### `getHelper()`

Get the helper instance that created this WebElement.

```javascript
const helper = element.getHelper()
console.log(helper.constructor.name) // "Playwright", "WebDriver", or "Puppeteer"
```

## Locator Support

The `$()` and `$$()` methods support various locator formats:

```javascript
// CSS selectors
await element.$('.class-name')
await element.$('#element-id')

// CodeceptJS locator objects
await element.$({ css: '.my-class' })
await element.$({ xpath: '//div[@class="test"]' })
await element.$({ id: 'element-id' })
await element.$({ name: 'field-name' })
await element.$({ className: 'my-class' })
```

## Cross-Helper Compatibility

The same WebElement code works across all supported helpers:

```javascript
// This code works identically with Playwright, WebDriver, and Puppeteer
const loginForm = await I.grabWebElement('#login-form')
const usernameField = await loginForm.$('[name="username"]')
const passwordField = await loginForm.$('[name="password"]')
const submitButton = await loginForm.$('button[type="submit"]')

await usernameField.type('user@example.com')
await passwordField.type('password123')
await submitButton.click()
```

## Migration from Native Elements

If you were previously using native elements, you can gradually migrate:

```javascript
// Old way - helper-specific
const nativeElements = await I.grabWebElements('.items')
// Different API for each helper

// New way - unified
const webElements = await I.grabWebElements('.items')
// Same API across all helpers

// Backward compatibility
const nativeElement = webElements[0].getNativeElement()
// Use native methods if needed
```

## Error Handling

WebElement methods will throw appropriate errors when operations fail:

```javascript
try {
  const element = await I.grabWebElement('#nonexistent')
} catch (error) {
  console.log('Element not found')
}

try {
  await element.click()
} catch (error) {
  console.log('Click failed:', error.message)
}
```
