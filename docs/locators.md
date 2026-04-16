---
permalink: /locators
title: Locators
---

# Locators

Locators tell CodeceptJS which element on the page a step acts on. Every action that touches the DOM — `click`, `fillField`, `see`, `waitForVisible` — accepts one.

CodeceptJS accepts locators in two forms:

- **Strict locator** — an object whose single key names the strategy: `{ css: 'button' }`, `{ role: 'button', name: 'Submit' }`, `{ xpath: '//td[1]' }`, `{ id: 'email' }`. The strategy is explicit, so the helper runs exactly one query.
- **Fuzzy locator** — a plain string. CodeceptJS guesses the strategy from shape (`#foo` → id, `//td` → xpath, `.row` → css) and falls back to semantic matching (labels, button text, placeholders). Convenient, but slower and sometimes ambiguous.

Prefer strict locators in stable test suites. Reach for fuzzy strings when prototyping.

Supported strategies: `css`, `xpath`, `id`, `name`, `role`, `frame`, `shadow`, `pw`. Shadow DOM and React selectors have their own pages — see [Shadow DOM](/shadow) and [React](/react). Playwright-specific locators (`_react`, `_vue`, `data-testid`) use the `pw` strategy: `{ pw: '_react=Button[name="Save"]' }`.

## Locator types at a glance

| Type | Example | Strengths | Weaknesses | Reach for it when |
|------|---------|-----------|------------|-------------------|
| **ARIA role** | `{ role: 'button', name: 'Save' }` | Survives markup changes; matches how users and screen readers identify elements; exposes accessibility gaps | Needs correct ARIA roles and accessible names; slower than CSS | The app follows accessibility guidelines and you want tests that mirror user intent |
| **CSS** | `{ css: '.btn-save' }` or `.btn-save` | Fast; familiar to every web developer; composes with class, attribute, and pseudo-selectors | Couples tests to styling; breaks on CSS refactors; cannot match by visible text | A stable class, id, or data-attribute exists on the target |
| **XPath** | `{ xpath: '//table//tr[2]/td[last()]' }` | Walks the tree in any direction (`ancestor`, `following-sibling`); matches visible text | Verbose; slow; harder to read than CSS | You need text matching or axis navigation that CSS cannot express |
| **Semantic (fuzzy)** | `'Sign In'`, `'Email'` | No locator to maintain; reads like prose | Several lookups per call; ambiguous when labels repeat | Writing a quick scenario or prototyping |
| **ID / name** | `#email`, `{ name: 'user[email]' }` | Shortest possible locator; unambiguous | Requires an `id` or `name` attribute to exist | Forms and elements with stable ids |
| **Accessibility id** | `~login-button` | Works in both web (`aria-label`) and mobile | Mobile apps need to expose the id | Cross-platform web and mobile tests |
| **Custom (`$foo`)** | `$register_button` | Encodes team convention (`data-qa`, `data-test`) in two characters | Needs the [customLocator plugin](/plugins#customlocator) | Your team uses dedicated test attributes |

## ARIA locators

ARIA role locators are the modern default. They identify elements the way assistive technology does — by role and accessible name — and they survive layout and class refactors that break CSS.

```js
I.click({ role: 'button', name: 'Login' })
I.fillField({ role: 'textbox', name: 'Email Address' }, 'user@test.com')
I.seeElement({ role: 'heading', name: 'Dashboard' })
I.selectOption({ role: 'combobox', name: 'Country' }, 'Ukraine')
```

The `name` matches the element's accessible name — its visible text, `aria-label`, or the text referenced by `aria-labelledby`.

Common roles: `button`, `link`, `textbox`, `checkbox`, `radio`, `combobox`, `listbox`, `menuitem`, `tab`, `dialog`, `alert`, `heading`, `navigation`, `banner`, `main`.

**Prefer ARIA when:**

- The element has a visible label or accessible text.
- You want the test to double as an accessibility smoke check.
- The UI is rewritten often and class names drift.

**Reach for something else when:**

- The element has no accessible name (purely decorative icons, unlabeled inputs).
- The page predates ARIA annotation and you cannot change it.
- A hot loop runs thousands of locator calls and needs the speed of a direct CSS query.

> ARIA locators rely on the accessibility tree of the underlying helper. Playwright and modern WebDriver support them natively.

## CSS selectors

CSS is the fastest locator type and most frontend developers read it fluently.

```js
I.seeElement('.user-profile .avatar')
I.click('#checkout-btn')
I.fillField('input[name="email"]', 'user@test.com')
```

Pair CSS with stable test attributes — `data-testid`, `data-qa` — rather than style classes. Style classes drift with every design update; test attributes exist to be locators.

```js
I.click('[data-testid="submit-order"]')
```

Tie locators to structure, not to presentation: `.btn-primary` survives a redesign; `.bg-green-500` does not.

Force CSS when a bare string would trigger fuzzy matching:

```js
I.fillField({ css: 'input[type=password]' }, '123456')
```

## XPath

XPath reaches where CSS cannot. Use it for:

- Text matching: `//button[contains(., 'Save changes')]`
- Axis navigation: `ancestor`, `following-sibling`, `preceding-sibling`
- Positional selection deep in a table or list

```js
I.click({ xpath: "//tr[td[text()='Acme Corp']]//button[contains(., 'Edit')]" })
```

Long XPath expressions become unreadable fast. The [`locate()` builder](#combining-locators) produces the same XPath with a fluent syntax — prefer it for anything beyond two conditions.

## Semantic locators

When you pass a plain string to a form or click action, CodeceptJS tries several strategies in order: links, buttons, labels, placeholders, `aria-label`.

```js
I.click('Sign In')                      // matches <a>, <button>, or <input type="submit">
I.fillField('Email', 'u@t.com')         // matches label, placeholder, or name
I.checkOption('I accept the terms')
```

The order `fillField` actually uses is:

1. Is the locator an ARIA role locator (`{ role: 'textbox', name: 'Email' }`)? If so, resolve through the accessibility tree and stop.
2. Is it a strict locator (`{ css: ... }`, `{ xpath: ... }`, `{ id: ... }`, …)? Run it directly and stop.
3. Otherwise treat the string as fuzzy and try, in order:
   1. A field whose `name`, `id`+`label[for]`, or `placeholder` **equals** the string — or a `<label>` with that exact text wrapping an input.
   2. The same match with **contains**, extended to `aria-label`, `aria-labelledby`, and `title`.
   3. An input with that `name` attribute.
   4. Finally, the string as a CSS selector.
4. Nothing matched? Throw `ElementNotFound`.

So fuzzy `fillField` already covers labels, placeholders, names, ids referenced by labels, and the ARIA attributes (`aria-label`, `aria-labelledby`, `title`) — no extra syntax needed. Each lookup runs several queries, though, so switch to strict locators (`{ role: ... }` or `{ css: ... }`) once a scenario is stable.

## ID locators

Three short forms cover id-based matching:

- `#user` or `{ id: 'user' }` — element with `id="user"`
- `{ name: 'email' }` — form field with `name="email"`
- `~login-button` — accessibility id (mobile) or `aria-label` (web)

```js
I.fillField('#email', 'user@test.com')
I.seeElement({ id: 'confirmation' })
I.tap('~submit')   // mobile
```

## Picking a specific element

When a locator matches several elements on the page, CodeceptJS acts on the first one by default. To target a different match, pass `elementIndex` via `step.opts()`:

```js
import step from 'codeceptjs/steps'

I.click('a', step.opts({ elementIndex: 2 }))       // the 2nd link
I.click('a', step.opts({ elementIndex: 'last' }))  // the last link
I.fillField('.email-input', 'u@t.com', step.opts({ elementIndex: -1 }))
```

`elementIndex` accepts positive numbers (1-based), negative numbers (`-1` is last), or the aliases `'first'` and `'last'`. It works with `click`, `fillField`, `selectOption`, `checkOption`, and other single-element actions.

To catch ambiguous locators during development rather than silently using the first match, enable `strict: true` in the helper config, or pass `step.opts({ exact: true })` on a single step:

```js
I.click('a', step.opts({ exact: true }))
// throws MultipleElementsFound if more than one link matches
```

See [Element Selection](/element-selection) for full details on `elementIndex`, strict mode, and iterating over matches with `eachElement`.

## Combining locators

Two mechanisms narrow a locator to a region of the page:

- **Context** — the last argument of most actions. Works with every locator type. In `I.click('Save', '.toolbar')` it is the second argument; in `I.fillField('Email', 'u@t.com', '#login-form')` it is the third.
- **`locate()` builder** — a fluent API that composes CSS and XPath into a single XPath expression. Does **not** accept ARIA role locators.

### Context: scope any locator to a region

Every action that targets an element accepts a context locator as its last argument. The action searches only inside the context.

```js
I.click('Login', '#login-form')
I.fillField('Email', 'u@t.com', '.modal')
I.seeElement({ role: 'button', name: 'Delete' }, '.toolbar')
```

Context is the right tool when the locator types differ on each side — for example, an ARIA button inside a CSS-selected container.

**Example: a dropdown inside a top bar**

A complex app often has several menus on screen at once: the top navigation bar, a left sidebar, a right-click context menu. Each may contain a "Settings" item. Without scoping, `I.click('Settings')` is a coin toss.

```js
// Open the user dropdown in the top bar, then pick Settings
I.click({ role: 'button', name: 'User menu' }, '.top-bar')
I.click({ role: 'menuitem', name: 'Settings' }, '.top-bar')

// The same label in the sidebar goes to a different screen
I.click({ role: 'link', name: 'Settings' }, '.sidebar')
```

The context itself accepts any locator type: a bare string, a strict object, or a [`locate()`](#locate-builder-compose-css-and-xpath) chain.

```js
I.click({ role: 'menuitem', name: 'Log out' }, locate('.dropdown-menu').inside('header'))
```

### `locate()` builder: compose CSS and XPath

`locate()` chains CSS and XPath conditions into a single XPath expression. Each method returns the builder so you keep composing.

```js
locate('a')
  .withAttr({ href: '#' })
  .inside(locate('label').withText('Hello'))
// .//a[@href = '#'][ancestor::label[contains(., 'Hello')]]
```

Give long chains a name for readable logs:

```js
locate('//table').find('a').withText('Edit').as('row edit button')
```

> **`locate()` does not wrap ARIA role locators.** The builder produces XPath; ARIA role matching relies on the accessibility tree provided by the helper. To scope an ARIA locator to a region, pass the region as a [**context** argument](#context-scope-any-locator-to-a-region) rather than wrapping it in `locate()`.

**Example: the dropdown from the top bar, expressed with `locate()`**

When menu items expose no useful ARIA role (custom components built from `<div>` elements and click handlers), fall back to CSS and XPath inside a `locate()` chain:

```js
const userMenu = locate('.dropdown-menu').inside('.top-bar').as('user menu')

I.click('.user-avatar', '.top-bar')
I.click(locate('a').withText('Settings').inside(userMenu))
```

**Example: the Edit button in a specific table row**

```js
const editAcme = locate('tr')
  .withDescendant(locate('td').withText('Acme Corp'))
  .find('button')
  .withText('Edit')
  .as('Edit button for Acme')

I.click(editAcme)
```

#### Builder methods

| Method | Purpose | Example |
|--------|---------|---------|
| `find(loc)` | Descendant lookup | `locate('table').find('td')` |
| `withAttr(obj)` | Match attributes | `locate('input').withAttr({ placeholder: 'Name' })` |
| `withClassAttr(str)` | Class contains substring | `locate('div').withClassAttr('form')` |
| `withText(str)` | Visible text contains | `locate('span').withText('Warning')` |
| `withTextEquals(str)` | Visible text matches exactly | `locate('button').withTextEquals('Add')` |
| `withChild(loc)` | Has a direct child | `locate('form').withChild('select')` |
| `withDescendant(loc)` | Has a descendant anywhere below | `locate('tr').withDescendant('img.avatar')` |
| `inside(loc)` | Sits inside an ancestor | `locate('select').inside('form#user')` |
| `before(loc)` | Appears before another element | `locate('button').before('.btn-cancel')` |
| `after(loc)` | Appears after another element | `locate('button').after('.btn-cancel')` |
| `first()` / `last()` | Bound position | `locate('#table td').first()` |
| `at(n)` | Pick nth element (negative counts from end) | `locate('#table td').at(-2)` |
| `as(name)` | Rename in logs | `locate('//table').as('orders table')` |

## Custom locators

Teams that tag elements with `data-qa`, `data-test`, or similar attributes can register a short-form syntax instead of typing `{ css: '[data-qa-id=register_button]' }` every time.

The [`customLocator` plugin](/plugins#customlocator) maps a prefix to an attribute:

```js
// with plugin enabled: $name → [data-qa=name]
I.click('$register_button')
I.fillField('$email', 'user@test.com')
```

For more control, register a filter from a bootstrap script or plugin:

```js
codeceptjs.locator.addFilter((providedLocator, locatorObj) => {
  if (providedLocator.data) {
    locatorObj.type = 'css'
    locatorObj.value = `[data-element=${providedLocator.data}]`
  }
})
```

After registration, `{ data: 'user-login' }` is a valid strict locator:

```js
I.click({ data: 'user-login' })
```

Further reading: Mozilla's [Writing reliable locators for Selenium and WebDriver tests](https://blog.mozilla.org/webqa/2013/09/26/writing-reliable-locators-for-selenium-and-webdriver-tests/) and the [Locator Advicer](https://davertmik.github.io/locator/).
