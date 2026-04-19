---
permalink: /assertions
title: Assertions
---

# Assertions

CodeceptJS ships with **browser assertions built into the `I` object** — `I.see('Welcome')`, `I.seeElement('.cart')`, `I.dontSee('Error')`. They read like prose, produce clear failure messages, and cover most day-to-day checks with no extra setup.

When the built-ins are not enough — sort order, business math, JSON shapes, domain rules — you have three ways to assert, in order of preference:

1. **Reusable custom assertions** in a helper: `I.seeTableIsOrdered('Price', 'desc')`
2. **Quick assertions with [ExpectHelper](/helpers/ExpectHelper)** on grabbed data: `I.expectDeepEqualExcluding(order, expected, ['id'])`
3. **Bring your own library** — `chai`, `jest`, or Node's `assert`

This page also covers [element assertions via WebElement](/WebElement), [soft assertions](#soft-assertions) for running many checks in one scenario, and [masking secrets](#masking-secrets) in assertion logs.

## Built-in Assertions

Every browser helper (Playwright, WebDriver, Puppeteer) exposes the same assertion API. Every positive check has a `dontSee*` counterpart.

### Text on the Page

`I.see(text)` asserts that **visible** text appears on the page. A second argument scopes the search.

```js
I.see('Order confirmed')
I.see('Total: $42.00', '.cart-summary')
I.dontSee('Out of stock')
```

`seeTextEquals` is stricter — the element's text must match exactly.

```js
I.seeTextEquals('Welcome, Miles', 'h1')
```

> `see` checks rendered, visible text. For content hidden by CSS, use `seeInSource` or `seeElementInDOM`.

### Elements

ARIA locators make the strongest assertions — they survive CSS refactors and describe what the user sees.

```js
I.seeElement({ role: 'button', name: 'Submit' })
I.seeElement('.alert-success', '#checkout')
I.dontSeeElement('.spinner')

I.seeElementInDOM('#hidden-token')    // in the DOM, possibly invisible
I.dontSeeElementInDOM('.removed-row')
```

### Counts, Forms, URLs

```js
I.seeNumberOfElements('.cart-item', 3)
I.seeNumberOfVisibleElements('.notification', 1)

I.seeInField('Email', 'miles@davis.com')
I.seeCheckboxIsChecked('Accept Terms')

I.seeInCurrentUrl('/dashboard')
I.seeInTitle('Admin — Orders')
I.seeCookie('session')
```

## Custom Assertions

### When You Need Custom Assertions

Reach for a custom assertion when a check is:

- **Repeated across tests** — "is this table sorted?", "does this response match our Order schema?"
- **Domain-specific** — "is the cart total equal to the sum of its items plus tax?"
- **Structural, not textual** — shape of a JSON payload, ordering of a list, layout of elements
- **Too noisy with built-ins** — chains of `I.see` calls that obscure intent

Four options, from least setup to most:

- **[Expect Helper](#quick-assertions-with-expect-helper)** — chai matchers exposed on `I` (`I.expectEqual`, `I.expectDeepEqual`, …). Best for quick, readable one-offs on grabbed data.
- **[Built-in `codeceptjs/assertions`](#built-in-assertion-library)** — the same factories CodeceptJS uses internally. Zero dependencies, failure messages match `I.see` style.
- **[External library](#using-an-external-library)** — `chai`, `jest`, `node:assert`. Use when you need a matcher the others do not cover.
- **[Reusable custom assertions](#reusable-custom-assertions)** — wrap any of the above into your own `I.see*` method via a helper class. Best for checks that repeat across many tests.

### Quick Assertions with Expect Helper

[`ExpectHelper`](/helpers/ExpectHelper) exposes chai's assertions as methods on the `I` object. Use it for one-off checks on data you have already grabbed — no helper class, no boilerplate.

**Install separately:**

```bash
npm i -D @codeceptjs/expect-helper
```

**Configure:**

```js
helpers: {
  Playwright: { /* ... */ },
  ExpectHelper: {},
}
```

**Use it in scenarios:**

```js
Scenario('checkout total matches the sum of line items', async ({ I }) => {
  I.amOnPage('/cart')

  const prices = await I.grabTextFromAll('.line-item .price')
  const total  = await I.grabTextFrom('.cart-total')

  const sum = prices
    .map(p => Number(p.replace(/[^0-9.]/g, '')))
    .reduce((a, b) => a + b, 0)

  I.expectEqual(Number(total.replace(/[^0-9.]/g, '')), sum)
})
```

```js
Scenario('API returns the created order shape', async ({ I }) => {
  const { data } = await I.sendPostRequest('/api/orders', { items: ['SKU-1'] })

  I.expectDeepEqualExcluding(
    data,
    { items: ['SKU-1'], status: 'pending', total: 29.99 },
    ['id', 'createdAt', 'updatedAt'],
  )
  I.expectMatchesPattern(data.id, /^ord_[a-z0-9]{16}$/)
  I.expectLengthOf(data.items, 1)
})
```

Common methods:

| Method | Purpose |
|---|---|
| `expectEqual` / `expectNotEqual` | Shallow equality |
| `expectDeepEqual` / `expectDeepMembers` | Deep equality for objects and arrays |
| `expectDeepEqualExcluding` | Deep equality, ignoring named fields |
| `expectContain` / `expectStartsWith` / `expectEndsWith` | Substring / prefix / suffix |
| `expectMatchesPattern` / `expectMatchRegex` | Regex match |
| `expectAbove` / `expectBelow` / `expectLengthOf` | Numeric and length checks |
| `expectHasProperty` / `expectEmpty` | Object shape |
| `expectJsonSchema` / `expectJsonSchemaUsingAJV` | Full schema validation |

ExpectHelper calls appear in the step log next to browser steps, so failures read in order with the rest of the scenario. See the [full reference](/helpers/ExpectHelper).

### Built-in Assertion Library

CodeceptJS ships a small, dependency-free assertion library at `codeceptjs/assertions`. It powers every built-in `I.see*` method, and you can use it directly in your own scenarios and helpers. Failure messages render with the same formatting as `I.see` failures, so reports stay consistent.

```js
import { equals, includes, empty, truth } from 'codeceptjs/assertions'
```

Each factory takes a **subject** — the noun that appears in the failure message — and returns an assertion with `.assert(actual, expected)` (fails on mismatch) and `.negate(actual, expected)` (the `dontSee*` direction).

Strict equality, comparing a grabbed value to an expected one:

```js
const total = await I.grabTextFrom('.cart-total')
equals('cart total').assert(total, '$42.00')
// expected cart total "$10.00" to equal "$42.00"

// negate — useful when an action should change a value
const sessionAfter = await I.grabCookie('session')
equals('session id').negate(sessionAfter.value, sessionBefore.value)
// expected session id not to equal "abc123"
```

Substring or array contains, working on grabbed text or arrays:

```js
const title = await I.grabTitle()
includes('page title').assert('Welcome', title)
// expected page title to include "Welcome"

const resultTitles = await I.grabTextFromAll('.result h3')
includes('search results').assert('miles', resultTitles)
// expected search results to include "miles"

const logs = await I.grabBrowserLogs()
includes('console logs').negate('Uncaught', logs.map(l => l.text()))
// expected console logs not to include "Uncaught"
```

Empty value or empty array — pairs naturally with `grabTextFromAll` or `grabWebElements`:

```js
I.click('Archive all')
const remaining = await I.grabWebElements('.email-row')
empty('inbox').assert(remaining)
// expected inbox '[ELEMENT, ELEMENT]' to be empty

I.click('Submit')
const errors = await I.grabTextFromAll('.field-error')
empty('form errors').assert(errors)
// expected form errors '[Email is required]' to be empty
```

Truthy value with custom phrasing — the second argument shapes the message:

```js
const cookie = await I.grabCookie('session')
truth('session cookie', 'to be set').assert(cookie)
// expected session cookie to be set

const button = await I.grabWebElement({ role: 'button', name: 'Checkout' })
truth('checkout button', 'to be enabled').assert(await button.isEnabled())
// expected checkout button to be enabled

const stock = Number(await I.grabAttributeFrom('.product', 'data-stock'))
truth('stock level', 'to be positive').assert(stock > 0)
// expected stock level to be positive
```

For comparisons the four factories do not cover, fall through to chai/jest/`node:assert`, or wrap the check in a [reusable custom assertion](#reusable-custom-assertions) helper.

### Using an External Library

When you need a matcher that `ExpectHelper` does not cover, or your team already standardises on a library, grab the data and assert however you like. Any library works — `grab*` methods return plain JavaScript values.

> `grab*` methods always need `await`.

**Node's built-in `assert`** — zero dependencies:

```js
import { strict as assert } from 'node:assert'

Scenario('profile email matches the logged-in user', async ({ I }) => {
  I.amOnPage('/profile')
  const email = await I.grabTextFrom('.user-email')
  assert.equal(email, 'miles@davis.com')
})
```

**Chai:**

```js
import { expect } from 'chai'

Scenario('product list is sorted alphabetically', async ({ I }) => {
  I.amOnPage('/catalog')
  const names = await I.grabTextFromAll('.product .name')
  expect(names).to.deep.equal([...names].sort())
})
```

**Jest's `expect`** (install `expect` standalone if you are not on Jest):

```js
import { expect } from 'expect'

Scenario('dashboard renders every KPI', async ({ I }) => {
  I.amOnPage('/dashboard')
  const kpis = await I.grabTextFromAll('.kpi .value')
  expect(kpis).toHaveLength(6)
  expect(kpis[0]).toMatch(/^\$[\d,]+$/)
})
```

Failures from these libraries fail the scenario normally, but they do not appear as CodeceptJS steps — the failure shows up in the error output. For checks you want visible in the step log, prefer `ExpectHelper` or `codeceptjs/assertions`.

### Reusable Custom Assertions

When the same check appears across many tests, wrap it in a [custom helper](/custom-helpers). The assertion lives in one place, has a name that reads like a requirement, and produces a clean failure message.

Scaffold a helper with `npx codeceptjs gh`, then write a class extending `@codeceptjs/helper`. Public methods — anything not prefixed with `_` — become methods on `I`. Reach other helpers through `this.helpers['<HelperName>']`. **Inside the helper, use `codeceptjs/assertions` (or any of the libraries above) — never `throw new Error(...)` — so failures render as proper assertion errors.**

**`helpers/table_assertions.js`**

```js
import Helper from '@codeceptjs/helper'
import { equals } from 'codeceptjs/assertions'

class TableAssertions extends Helper {
  /**
   * @param {string} columnName - text of the column header
   * @param {'asc'|'desc'} order
   */
  async seeTableIsOrdered(columnName, order = 'asc') {
    const { Playwright } = this.helpers
    const headers = await Playwright.grabTextFromAll('table thead th')
    const col     = headers.findIndex(h => h.trim() === columnName) + 1
    const cells   = await Playwright.grabTextFromAll(`table tbody tr td:nth-child(${col})`)
    const sorted  = [...cells].sort()
    if (order === 'desc') sorted.reverse()

    equals(`column "${columnName}" sorted ${order}`).assert(cells.join(','), sorted.join(','))
  }
}

export default TableAssertions
```

**Wire it up in `codecept.conf.js`:**

```js
helpers: {
  Playwright: { /* ... */ },
  TableAssertions: { require: './helpers/table_assertions.js' },
}
```

**Use it:**

```js
Scenario('orders table sorts by price on click', ({ I }) => {
  I.amOnPage('/orders')
  I.click('Price')
  I.seeTableIsOrdered('Price', 'asc')
  I.click('Price')
  I.seeTableIsOrdered('Price', 'desc')
})
```

> Follow the naming convention: positive assertions start with `see*`, negative with `dontSee*` (use `.negate()` from the same factory). It keeps the custom API consistent with CodeceptJS built-ins.

## Element Assertions

`grabWebElement` and `grabWebElements` return objects with a uniform API across helpers: `isVisible()`, `isEnabled()`, `getText()`, `getAttribute()`, `getBoundingBox()`, `exists()`. See the full [WebElement API](/WebElement).

Use WebElement when you need to loop over many elements and assert on each.

```js
Scenario('every todo row has a label and a checkbox', async ({ I }) => {
  I.amOnPage('/todos')
  const rows = await I.grabWebElements('.todo-item')
  I.expectLengthAboveThan(rows, 0)

  for (const row of rows) {
    const label = await row.getText()
    I.expectNotEmpty(label.trim())

    const checkbox = await row.$('input[type="checkbox"]')
    I.expectTrue(await checkbox.isVisible())
  }
})
```

`getBoundingBox()` enables layout assertions — confirming a sticky header stays pinned, or a tooltip sits inside the viewport.

```js
const header = await I.grabWebElement('.sticky-header')
const box    = await header.getBoundingBox()
I.expectEqual(box.y, 0)
```

## Soft Assertions

Use a soft assertion when one scenario needs to check many independent facts and you want to see **every** failure in one run, not just the first.

CodeceptJS provides `hopeThat` from `codeceptjs/effects`. It wraps a block of `I.*` steps:

- If the steps inside succeed, `hopeThat` returns `true`.
- If any step inside fails, the failure is logged to the report as a note, the scenario keeps running, and `hopeThat` returns `false`.

```js
import { hopeThat } from 'codeceptjs/effects'

Scenario('registration form shows every validation error at once', async ({ I }) => {
  I.amOnPage('/register')
  I.click('Create Account')   // submit empty form

  await hopeThat(() => I.see('Email is required', '#email-error'))
  await hopeThat(() => I.see('Password is required', '#password-error'))
  await hopeThat(() => I.see('You must accept the terms', '#terms-error'))
  await hopeThat(() => I.seeElement('.summary-error'))
})
```

Failures are written to the test log as `Unsuccessful assertion > ...` and attached to the test as notes for reporters that surface them.

`hopeThat` does not fail the scenario on its own — each call logs the failure and lets the scenario continue. Call `hopeThat.noErrors()` once at the end to fail the scenario if any soft assertion failed. It throws a single assertion error listing every recorded failure and clears the state for the next test.

```js
import { hopeThat } from 'codeceptjs/effects'

Scenario('registration form shows every validation error at once', async ({ I }) => {
  I.amOnPage('/register')
  I.click('Create Account')   // submit empty form

  await hopeThat(() => I.see('Email is required', '#email-error'))
  await hopeThat(() => I.see('Password is required', '#password-error'))
  await hopeThat(() => I.see('You must accept the terms', '#terms-error'))
  await hopeThat(() => I.seeElement('.summary-error'))

  hopeThat.noErrors()
})
```

If two checks failed, the scenario fails with a single aggregated message like:

```
expected soft assertions '[expected web application to include "You must accept the terms", expected element (.summary-error) to be visible]' to be empty
```

## Choosing an Approach

| You want to check… | Use |
|---|---|
| Visible text on the page | `I.see` / `I.dontSee` |
| An element by role and accessible name | `I.seeElement({ role, name })` |
| A form field's current value | `I.seeInField` / `I.seeCheckboxIsChecked` |
| URL or page title | `I.seeInCurrentUrl` / `I.seeInTitle` |
| A count of matching elements | `I.seeNumberOfElements` |
| Business logic / JSON shape on grabbed data | [ExpectHelper](/helpers/ExpectHelper) — `expectEqual`, `expectDeepEqualExcluding`, `expectJsonSchema` |
| A lightweight, dependency-free assertion in a scenario | `equals`, `includes`, `empty`, `truth` from `codeceptjs/assertions` |
| Per-element state in a loop | `grabWebElements` + [WebElement API](/WebElement) |
| A matcher the above do not cover | `grab*` + `chai` / `jest` / `node:assert` |
| A **reusable, project-specific** check | [Custom helper](/custom-helpers) with `see*` method using `codeceptjs/assertions` |
| Many independent checks in one run | `hopeThat` from `codeceptjs/effects` |
| Hiding values from logs | `secret()` |
