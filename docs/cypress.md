---
permalink: /cypress
title: Cypress
---

# Cypress

Uses [Cypress](https://cypress.io/) library to run end-to-end tests.

Cypress is a modern testing framework with a unique architecture that runs tests directly in the browser.
This helper allows you to use Cypress within CodeceptJS, combining the best of both frameworks.

## Setup

To use Cypress helper, install `cypress` package:

```bash
npm i cypress --save-dev
```

## Configuration

This helper should be configured in codecept.conf.js or codecept.conf.ts

- `url` - base URL of the website to be tested
- `browser` - browser to run tests in (`chrome`, `firefox`, `electron`, `edge`). Default: `chrome`
- `show` - show browser window during test execution. Default: `true`
- `timeout` - default timeout for all cypress commands. Default: `4000`ms
- `defaultCommandTimeout` - timeout for cypress commands. Default: `4000`ms
- `requestTimeout` - timeout for network requests. Default: `5000`ms
- `responseTimeout` - timeout for server responses. Default: `30000`ms
- `pageLoadTimeout` - timeout for page loads. Default: `60000`ms
- `configFile` - path to cypress configuration file
- `env` - environment variables for cypress

### Example Configuration

```js
{
  helpers: {
    Cypress: {
      url: "http://localhost:3000",
      browser: "chrome",
      show: true,
      timeout: 5000
    }
  }
}
```

### Headless Configuration

```js
{
  helpers: {
    Cypress: {
      url: "http://localhost:3000",
      browser: "electron",
      show: false
    }
  }
}
```

## Usage

The Cypress helper provides standard CodeceptJS actions while leveraging Cypress's powerful testing capabilities:

```js
Feature('My Feature')

Scenario('test something', ({ I }) => {
  I.amOnPage('/')
  I.see('Welcome')
  I.click('Login')
  I.fillField('email', 'user@example.com')
  I.fillField('password', 'password')
  I.click('Submit')
  I.see('Dashboard')
})
```

## Advanced Usage

You can access Cypress API directly using the `useCypressTo` method:

```js
I.useCypressTo('intercept API calls', async ({ cy }) => {
  cy.intercept('GET', '/api/users', { fixture: 'users.json' })
})

I.useCypressTo('custom assertions', async ({ cy }) => {
  cy.get('[data-cy=submit]').should('be.disabled')
})
```

## Methods

### Navigation

#### amOnPage

Opens a web page in the browser. Requires relative or absolute url.

```js
I.amOnPage('/') // opens main page of website
I.amOnPage('https://github.com') // opens github
I.amOnPage('/login') // opens a login page
```

**Parameters**

- `url` - url path or global url.

#### grabCurrentUrl

Get current URL from browser.

```js
const url = await I.grabCurrentUrl()
console.log(`Current URL is ${url}`)
```

**Returns**: `Promise<string>` - current URL

#### refreshPage

Refreshes the current page.

```js
I.refreshPage()
```

### Interactions

#### click

Perform a click on a link or a button, given by a locator.

```js
I.click('Logout')
I.click('#login')
I.click({ css: 'button.accept' })
```

**Parameters**

- `locator` - clickable element

#### doubleClick

Double clicks on a clickable element.

```js
I.doubleClick('#edit-button')
```

**Parameters**

- `locator` - clickable element

#### fillField

Fills a text field or textarea, given by a locator, with the given string.

```js
I.fillField('Email', 'hello@world.com')
I.fillField('#email', 'hello@world.com')
```

**Parameters**

- `locator` - field locator
- `value` - text value

#### appendField

Appends text to a input field or textarea.

```js
I.appendField('#notes', 'Additional notes')
```

**Parameters**

- `locator` - field locator
- `value` - text to append

#### clearField

Clears a text field.

```js
I.clearField('#email')
```

**Parameters**

- `locator` - field locator

#### selectOption

Selects option from dropdown.

```js
I.selectOption('Country', 'United States')
I.selectOption('#country', 'us')
```

**Parameters**

- `locator` - select element
- `option` - option value or text

### Assertions

#### see

Checks that the current page contains the given string.

```js
I.see('Welcome') // text welcome on a page
I.see('Welcome', '.content') // text inside .content div
```

**Parameters**

- `text` - expected text
- `context` (optional) - element to search in

#### dontSee

Checks that the current page does not contain the given string.

```js
I.dontSee('Login') // assume we are already logged in
I.dontSee('Login', '.nav') // no login link in navigation
```

**Parameters**

- `text` - expected not to be present
- `context` (optional) - element to search in

#### seeElement

Checks that element is present on page.

```js
I.seeElement('#submit-button')
I.seeElement('.form')
```

**Parameters**

- `locator` - element to check

#### dontSeeElement

Checks that element is not present on page.

```js
I.dontSeeElement('#error-message')
```

**Parameters**

- `locator` - element that should not be present

#### seeInTitle

Checks that title matches given text.

```js
I.seeInTitle('Home Page')
```

**Parameters**

- `text` - text to check in title

#### dontSeeInTitle

Checks that title does not match given text.

```js
I.dontSeeInTitle('Error')
```

**Parameters**

- `text` - text that should not be in title

#### seeInCurrentUrl

Checks that current url contains provided fragment.

```js
I.seeInCurrentUrl('/login') // we are on login page
```

**Parameters**

- `url` - fragment to check

#### dontSeeInCurrentUrl

Checks that current url does not contain provided fragment.

```js
I.dontSeeInCurrentUrl('/login') // we are not on login page
```

**Parameters**

- `url` - fragment that should not be present

### Page Information

#### grabTitle

Get page title from browser.

```js
const title = await I.grabTitle()
console.log(`Page title is ${title}`)
```

**Returns**: `Promise<string>` - page title

### Waiting

#### waitForElement

Waits for element to be present on page.

```js
I.waitForElement('#submit-button', 5)
```

**Parameters**

- `locator` - element to wait for
- `sec` (optional) - timeout in seconds, default: 1

#### waitForText

Waits for text to be present on page.

```js
I.waitForText('Welcome', 5)
I.waitForText('Welcome', 5, '.header')
```

**Parameters**

- `text` - text to wait for
- `sec` (optional) - timeout in seconds, default: 1
- `context` (optional) - element to search in

### Utility

#### saveScreenshot

Takes a screenshot and saves it to output folder.

```js
I.saveScreenshot('login.png')
```

**Parameters**

- `fileName` - screenshot filename

### Advanced

#### useCypressTo

Use Cypress API inside a test.

First argument is a description of an action.
Second argument is async function that gets `cy` object as parameter.

```js
I.useCypressTo('intercept API calls', async ({ cy }) => {
  cy.intercept('GET', '/api/users', { fixture: 'users.json' })
})

I.useCypressTo('check custom assertion', async ({ cy }) => {
  cy.get('[data-cy=submit]').should('be.disabled')
})
```

**Parameters**

- `description` - used to show in logs
- `fn` - async function that executed with Cypress cy object as argument

## Cypress vs CodeceptJS

While both frameworks offer similar capabilities, they have different architectures:

- **Cypress** runs tests inside the browser, providing direct access to application objects
- **CodeceptJS** runs tests in Node.js and controls the browser externally

This helper bridges the gap, allowing you to:

- Use CodeceptJS's readable syntax and organizational features
- Leverage Cypress's powerful browser integration and debugging tools
- Access both ecosystems' plugins and utilities

## Best Practices

1. **Start with CodeceptJS actions** - Use standard `I.click()`, `I.see()` methods for most interactions
2. **Use `useCypressTo` for advanced cases** - Access Cypress API for network stubbing, custom assertions, or advanced selectors
3. **Configure timeouts appropriately** - Cypress has different timeout behavior than other browsers
4. **Leverage Cypress fixtures** - Use Cypress's fixture system for test data management

## Troubleshooting

### Browser Installation

Cypress automatically downloads browsers on first run. If you encounter browser installation issues:

```bash
npx cypress install
```

### Network Issues

Cypress handles network requests differently. Use the `useCypressTo` method to configure network stubbing:

```js
I.useCypressTo('setup network stubs', async ({ cy }) => {
  cy.intercept('GET', '/api/**', { delay: 100 })
})
```

### Configuration Issues

Cypress uses its own configuration system. You can provide a custom config file:

```js
{
  helpers: {
    Cypress: {
      configFile: 'cypress.config.js'
    }
  }
}
```
