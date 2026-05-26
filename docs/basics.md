---
permalink: /basics
title: Getting Started
---

# Getting Started

CodeceptJS is a modern end to end testing framework with a special BDD-style syntax. The tests are written as a linear scenario of the user's action on a site.

```js
Feature('CodeceptJS demo')

Scenario('check Welcome page on site', ({ I }) => {
  I.amOnPage('/')
  I.see('Welcome')
})
```

Tests are written as **ES modules** using modern JavaScript syntax.

Each test is described inside a `Scenario` function with the `I` object passed into it.
The `I` object is an **actor**, an abstraction for a testing user. The `I` is a proxy object for currently enabled **Helpers**.

## How It Works

### Command Delegation to Helpers

**CodeceptJS delegates all test commands to helper backends.** Tests written with the `I` object (the actor) don't directly execute actions. Instead, CodeceptJS routes them through configurable helpers:

- **Playwright** - Chromium, Firefox, WebKit automation
- **WebDriver** - Native browser automation via WebDriver Protocol
- **Appium** - Mobile testing on iOS/Android
- **Puppeteer** - Chromium automation via DevTools Protocol

All helpers share the same API, so it's easy to switch backends. However, due to backend differences and limitations, they aren't guaranteed to be compatible with each other. For example, you can set request headers in Playwright or Puppeteer, but not in WebDriver.

> **Pick one helper to define how your tests execute.** If requirements change, it's straightforward to migrate to another.


### Promise Chain & Async/Await

Tests appear synchronous but **all actions are wrapped in promises and chained together** in a global promise chain. This means:

- **You usually don't need `await` for regular actions** - commands are automatically queued
- Each `I.*` command is appended to the promise chain
- Setup, teardown, and all test steps execute in sequence

```js
// These execute in order WITHOUT await
I.amOnPage('/')
I.click('Login')
I.see('Welcome')
```

Behind the scenes, this is equivalent to:
```js
Promise.resolve()
  .then(() => I.amOnPage('/'))
  .then(() => I.click('Login'))
  .then(() => I.see('Welcome'))
```

When You DO Need `await`:

Use `await` only with **grab** actions (methods that retrieve data from the page):

```js
Scenario('use data from page', async ({ I }) => {
  I.fillField('email', 'user@example.com')
  I.click('Generate Password')
  // grab actions return data - use await here
  const password = await I.grabTextFrom('#password')
  I.fillField('password', password)
  I.click('Login')
})
```

Also **use `await` with imported functions and page object methods**, as they may contain async operations that aren't part of the promise chain (e.g., `await loginPage.login()` if it contains `I.grab` operations inside).

> **Rule:** If an action starts with `grab`, or if calling an imported function/page object method, you must `await` it. Regular actions (`I.click()`, `I.fillField()`, `I.see()`) don't need await.

## Writing Tests

Tests are written from a user's perspective. There is an actor (represented as `I`) which contains actions taken from helpers. A test is written as a sequence of actions performed by an actor:

```js
I.amOnPage('/')
I.click('Login')
I.see('Please Login', 'h1')
// ...
```

A complete test file looks like this:

```js
// suite declaration, like describe() in other frameworks
Feature('User Authentication')

// before each hook
Before(({ I }) => {
  I.amOnPage('/')
})

// a test
Scenario('user can login with valid credentials', ({ I }) => {
  I.click('Login')
  I.fillField('email', 'user@example.com')
  I.fillField('password', 'password123')
  I.click('Sign In')
  I.see('Welcome, User')
})

// after each hook
After(({ I }) => {
  // ...
})
```

> CodeceptJS doesn't allow nested suites or multiple suites in one file.

### Opening a Page

A test should usually start by navigating the browser to a website.

Start a test by opening a page. Use the `I.amOnPage()` command for this:

```js
// When "http://site.com" is url in config
I.amOnPage('/') // -> opens http://site.com/
I.amOnPage('/about') // -> opens http://site.com/about
I.amOnPage('https://google.com') // -> https://google.com
```

When an URL doesn't start with a protocol (http:// or https://) it is considered to be a relative URL and will be appended to the URL which was initially set-up in the config.

> It is recommended to use a relative URL and keep the base URL in the config file, so you can easily switch between development, stage, and production environments.

### Locating Elements

CodeceptJS supports multiple locating strategies. Most actions accept locators as strings or objects:

```js
// Basic CSS/XPath
I.click('.login-btn')
I.fillField('//input[@type="email"]', 'user@test.com')

// Semantic - by text/labels (searches multiple strategies)
I.click('Login')
I.fillField('Email', 'user@test.com')

// ARIA locators - by role and accessible name (most reliable)
I.click({ role: 'button', name: 'Login' })
I.fillField({ role: 'textbox', name: 'Email Address' }, 'user@test.com')
I.seeElement({ role: 'button', name: 'Submit' })

// Accessibility ID or aria-label
I.click('~login-button')
I.seeElement({ aria: 'Username' })

// Complex locators with locate()
I.click(locate('button').withText('Save').inside('.modal'))
I.seeElement(locate({ role: 'button', name: 'Delete' }).inside('.toolbar'))

// ARIA + Context - combine role with section to target specific area
I.click({ role: 'button', name: 'Save' }, '#detail-panel')
I.fillField({ role: 'textbox', name: 'Title' }, 'New Task', '.modal')
I.seeElement({ role: 'button', name: 'Delete' }, { css: '.toolbar' })
I.click({ role: 'button', name: 'Close' }, '.sidebar')
```

**Best practices:**

- **Use ARIA locators** `{ role: 'button', name: '...' }` - resilient to CSS changes and support accessibility
- **Combine with context** when multiple similar elements exist: `I.click({ role: 'button', name: 'Delete' }, '.toolbar')`
- **Use semantic CSS classes and IDs** when available (e.g., `.btn-save`, `#login-form`); avoid style-based names like `.bg-green`
- **Use `locate()` function** for complex queries: `locate(selector).withText(...).inside(...)`

> [▶ Learn more about using locators in CodeceptJS](/locators).

### Clicking Elements

Use the locator strategies from [Locating Elements](#locating-elements) section to click any element:

```js
I.click('Login')                              // by text
I.click({ role: 'button', name: 'Save' })   // by ARIA role
I.click('#signup')                            // by ID
I.click('Delete', '.toolbar')                 // with context
```

| | | | |
|---|---|---|---|
| [click](/web-api#iclick) | [forceClick](/web-api#iforcecclick) | [doubleClick](/web-api#idoubleclick) | [rightClick](/web-api#irightclick) |
| [forceRightClick](/web-api#iforcerightclick) | [moveCursorTo](/web-api#imovecursorto) | [dragAndDrop](/web-api#idraganddrop) | [dragSlider](/web-api#idragslider) |

Use **forceClick** when standard click fails (e.g., hidden elements, animations). Use **rightClick** for context menus, **doubleClick** for multi-select.

### Interacting with Forms

Use form methods to interact with inputs, selects, checkboxes, and other form elements. Fields can be located by label, name, CSS, XPath, or aria-label:

```js
// Fill fields - by label, name, CSS, or aria-label
I.fillField('Email', 'user@test.com')
I.fillField('My Address', 'Home Sweet Home')   // matches aria-label or aria-labelledby
I.fillField('LoginForm[username]', 'davert')   // by field name attribute
I.fillField('Password', secret('123456'))       // use secret() for sensitive data

// Use context (3rd parameter) to narrow search to specific form
I.fillField('Email', 'user@test.com', '#login-form')
I.fillField('Email', 'admin@test.com', '#registration-form')

// Append or clear
I.appendField('Comments', ' — updated')
I.appendField('Message', ' P.S. Thank you!', '.contact-form')  // with context
I.clearField('#search-input')

// Type into focused field - use when fillField doesn't trigger JS events
I.click('Card Number')
I.type('4111111111111111', 100)  // optional delay in ms between keystrokes

// Selects - pass array for multi-select
I.selectOption('Role', 'Admin')
I.selectOption('Role', 'User', '.user-form')                // with context
I.selectOption('Tags', ['Important', 'Urgent'])

// Checkboxes and radios - supports context
I.checkOption('I Agree to Terms and Conditions')
I.checkOption('Remember me', '#login-form')                 // with context
I.uncheckOption('Subscribe')
```

| | | | |
|---|---|---|---|
| [fillField](/web-api#ifillfield) | [clearField](/web-api#iclearfield) | [appendField](/web-api#iappendfield) | [type](/web-api#itype) |
| [selectOption](/web-api#iselectoption) | [checkOption](/web-api#icheckoption) | [uncheckOption](/web-api#iuncheckoption) | [focus](/web-api#ifocus) |
| [blur](/web-api#iblur) | | | |

> Use `secret()` for sensitive data: `I.fillField('password', secret('123456'))` - [won't expose in logs](/secrets/).
>

> [selectOption](/web-api#iselectoption) works with native `<select>` elements as well as custom components using `role="combobox"` or `role="listbox"`.

### Assertions

CodeceptJS provides **built-in browser assertions** instead of generic `expect()` calls. This keeps tests readable and produces clear failure messages without extra assertion libraries.

- **`I.see(text)`** - checks that text is visible on the page
- **`I.seeElement(locator)`** - checks that element exists and is visible in DOM
- All assertions have a `dontSee` / `dontSee*` counterpart

```js
// Text visibility
I.see('Welcome, Miles')
I.see('Error', '.alert')           // with context
I.dontSee('Loading...')

// Element presence
I.seeElement({ role: 'button', name: 'Submit' })
I.seeElement('.success-message', '#checkout')   // with context
I.dontSeeElement('.error')
I.seeElementInDOM('#hidden-input')              // in DOM but may be invisible

// URL, title, fields
I.seeInCurrentUrl('/dashboard')
I.seeInTitle('My App')
I.seeInField('Email', 'miles@davis.com')
I.seeCheckboxIsChecked('Accept Terms')
I.seeCookie('session')
I.seeNumberOfElements('.item', 5)
```

| | | | |
|---|---|---|---|
| [see](/web-api#isee) | [seeElement](/web-api#iseeelement) | [seeElementInDOM](/web-api#iseeelementindom) | [seeInField](/web-api#iseeinfield) |
| [dontSee](/web-api#idontsee) | [dontSeeElement](/web-api#idontseelement) | [dontSeeElementInDOM](/web-api#idontseelementindom) | [dontSeeInField](/web-api#idontseeinfield) |
| [seeInCurrentUrl](/web-api#seeinCurrentUrl) | [seeInTitle](/web-api#seeinTitle) | [seeCheckboxIsChecked](/web-api#iseecheckboxischecked) | [seeCookie](/web-api#iseecookie) |
| [seeNumberOfElements](/web-api#iseenumberofelements) | [seeNumberOfVisibleElements](/web-api#iseenumberofvisibleelements) | [seeTextEquals](/web-api#iseetextequals) | [seeAttributesOnElements](/web-api#iseeattributesonelements) |

For custom assertions use `grab*` methods to retrieve data, then assert with any library

```js
const title = await I.grabTitle(); 
expect(title).toEqual('My App')`
```

### Fetching Content from Page

**Grabbers retrieve data from the page** for use in subsequent steps. They are the equivalent of Playwright's `textContent()`, Cypress's `cy.get().invoke()`, or WebDriver's `getText()` — but integrated into the CodeceptJS promise chain.

**Grabbers always require `await`** since they return data out of the known promise chain.

```js
const title = await I.grabTitle()
const text = await I.grabTextFrom('.user-name')
const val = await I.grabValueFrom('#email-input')
const href = await I.grabAttributeFrom('a.logo', 'href')
const count = await I.grabNumberOfVisibleElements('.item')
```

In complex scenarios, grabbers are used to extract data from page and pass it to next steps.

```js
Scenario('login with generated password', async ({ I }) => {
  I.click('Generate Password')
  const password = await I.grabTextFrom('#generated-password')
  I.fillField('Password', password)
  I.click('Sign In')
  I.see('Welcome')
})
```

| | | | |
|---|---|---|---|
| [grabTextFrom](/web-api#igrabtextfrom) | [grabTextFromAll](/web-api#igrabtextfromall) | [grabValueFrom](/web-api#igrabvaluefrom) | [grabValueFromAll](/web-api#igrabvaluefromall) |
| [grabHTMLFrom](/web-api#igrabhtmlfrom) | [grabAttributeFrom](/web-api#igrabattributefrom) | [grabAttributeFromAll](/web-api#igrabattributefromall) | [grabNumberOfVisibleElements](/web-api#igrabnumberofvisibleelements) |
| [grabCurrentUrl](/web-api#igrabcurrenturl) | [grabTitle](/web-api#igrabtitle) | [grabCookie](/web-api#igrabcookie) | [grabSource](/web-api#igrabsource) |
| [grabWebElement](/web-api#igrabwebelement) | [grabWebElements](/web-api#igrabwebelements) | [grabElementBoundingRect](/web-api#igrabelementboundingrect) | [grabCssPropertyFrom](/web-api#igrabcsspropertyfrom) |

### Waiting

**CodeceptJS automatically waits** for elements before clicking, filling, and most other interactions — so explicit waits are rarely needed. Failed steps are also [automatically retried](/basics#auto-retry).

Use `wait*` methods when you need to explicitly wait for a UI change, such as a modal appearing, a spinner hiding, or a value updating:

```js
I.waitForVisible('.modal')               // wait for modal to appear
I.waitForInvisible('.spinner')           // wait for spinner to hide
I.waitForText('Success', 5, '.alert')   // wait for text in element (5s timeout)
I.waitForEnabled('#submit-btn')          // wait for button to become enabled
I.waitForElement('.results li', 10)      // wait for results to load

I.wait(2)                                // explicit pause in seconds (last resort)
```

Example usage inside scenario:

```js
Scenario('submit and wait for confirmation', ({ I }) => {
  I.click('Submit Order')
  I.waitForVisible('.order-confirmation', 10)
  I.see('Order placed successfully', '.order-confirmation')
})
```

| | | | |
|---|---|---|---|
| [waitForVisible](/web-api#iwaitforvisible) | [waitForInvisible](/web-api#iwaitforinvisible) | [waitForElement](/web-api#iwaitforelement) | [waitForDetached](/web-api#iwaitfordetached) |
| [waitForText](/web-api#iwaitfortext) | [waitForValue](/web-api#iwaitforvalue) | [waitForClickable](/web-api#iwaitforclickable) | [waitForEnabled](/web-api#iwaitforenabled) |
| [waitForDisabled](/web-api#iwaitfordisabled) | [waitForFunction](/web-api#iwaitforfunction) | [waitToHide](/web-api#iwaittohide) | [waitInUrl](/web-api#iwaitinurl) |
| [waitUrlEquals](/web-api#iwaitUrlEquals) | [waitNumberOfVisibleElements](/web-api#iwaitnumberofvisibleelements) | [wait](/web-api#iwait) | |

## Running Tests


```bash
npx codeceptjs run                      # run all tests
npx codeceptjs run tests/login_test.js        # run a single file
npx codeceptjs run --grep "checkout"    # run tests matching name pattern
npx codeceptjs run --grep "@smoke"      # run tests by tag
```

Run tests in parallel using [NodeJS workers](https://nodejs.org/api/worker_threads.html). Tests are split by scenarios, results aggregated in the main process:

```bash
npx codeceptjs run-workers 3    # run with 3 parallel workers
```


### Output Verbosity

```bash
npx codeceptjs run --steps     # print each step
npx codeceptjs run --debug     # print steps + additional debug info
npx codeceptjs run --verbose   # print everything including promises
```

It is recommended to always launch tests in `--debug` mode when developing tests.

### Headless / Headed Mode

By default tests run headless (no browser window). To open a browser during test execution set `show: true` in helper config, or use `@codeceptjs/configure`:

```js
import { setHeadlessWhen } from '@codeceptjs/configure'

setHeadlessWhen(process.env.CI)  // headless only on CI, show browser locally
```

For a single run without editing config, use the `browser` plugin:

```sh
npx codeceptjs run -p browser:show   # force visible browser
npx codeceptjs run -p browser:hide   # force headless
```

See [Plugin Arguments](/commands#plugin-arguments).


## Configuration

Configuration is set in `codecept.conf.js`. The two most important settings are the **helper** (which browser engine to use) and the **base URL** of your application:

```js
export const config = {
  helpers: {
    Playwright: {
      url: 'http://localhost:3000',  // base URL for I.amOnPage('/')
      show: !process.env.CI,         // show browser locally, headless on CI
      browser: 'chromium',
    },
  },
  tests: './**/*_test.js',
  output: './output',
}
```

Use `-c` to switch between config files:

```bash
npx codeceptjs run -c codecept.ci.conf.js
```

> ▶ See complete [configuration reference](/configuration).
