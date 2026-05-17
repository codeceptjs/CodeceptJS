---
permalink: /react
title: Testing React Applications
---

# Testing React Applications

React applications need extra care in end-to-end testing. Many React apps were never designed to be tested. While building components, developers often drop the element's semantics.

Generated HTML often looks like this:

```js
<div class="jss607 jss869 jss618 jss871 jss874 jss876" tabindex="0" role="tab" aria-selected="true" style="pointer-events: auto;">
  <span class="jss877">
    <span class="jss878">
      <span class="jss879">Click Me!</span>
    </span>
  </span>
<span class="jss610"></span></div>
```

Clickable elements are often not real `a` or `button` elements. So `I.click('Click Me!')` won't work, and neither will `fillField('name', 'value')`. Finding a stable locator for such markup is hard.

Test engineers have two options:

1. Update the JSX, fix the output HTML, and rebuild the app.
2. Test the app as it is.

For long-running projects, choose the first option. The cleaner your HTML, the less fragile your tests. Replace `div`s with correct HTML elements, add `data-` attributes, and add labels and names to input fields so CodeceptJS magic — like clicking a link by its text — works.

If you can't change the code, choose the second option. Bind locators to visible text and semantic attributes. Instead of a generated locator like this:

```
//*[@id="document"]/div[2]/div/div[2]/div
```

use the [Locator Builder](/locators#locator-builder) to write a clean semantic locator:

```js
locate('[role=tab]').withText('Click Me!');
```

This builds flexible, stable locators even on an app never designed for testing.

## How to Locate Elements

Locate elements the way a user perceives them: by visible text, label, or accessibility role. These locators survive refactoring and minification, and they read clearly:

```js
I.click('Click Me!');
I.click(locate('[role=tab]').withText('Click Me!'));
I.fillField('Email', 'user@example.com');
I.click({ role: 'button', name: 'Submit' });
```

When the rendered markup gives you nothing stable and you cannot change the source, fall back to a [`pw` locator](/locators) — a raw Playwright selector — under the Playwright helper:

```js
I.click({ pw: '[data-testid="save"]' });
```

## React Component Locators Were Removed

Earlier versions shipped a `react` locator that selected elements by React component name, props, and state:

```js
// no longer supported
I.click({ react: 'Button', props: { title: 'Click Me' } });
```

This locator was removed in CodeceptJS 4. It relied on the [resq](https://github.com/baruchvlz/resq) library, which is unmaintained, pinned to an old release, and supports only React 16. It read React's private internal tree, broke under production minification, and had no working path for React 17, 18, or 19. WebdriverIO's `react$`/`react$$` and Playwright's `_react=`/`_vue=` selector engines share the same limitations, and Playwright has since removed its engines.

### Migrating Away From `react` Locators

Replace component locators with user-facing locators:

| Before                                                  | After                                            |
|---------------------------------------------------------|--------------------------------------------------|
| `I.click({ react: 'SubmitButton' })`                    | `I.click({ role: 'button', name: 'Submit' })`    |
| `I.seeElement({ react: 'Alert' })`                      | `I.seeElement('[role=alert]')`                   |
| `I.fillField({ react: 'EmailInput' }, 'a@b.com')`       | `I.fillField('Email', 'a@b.com')`                |
| `I.click({ react: 'Tab', props: { title: 'Stats' } })` | `I.click(locate('[role=tab]').withText('Stats'))`|

If a component renders no stable text, role, or attribute, add a `data-testid` (or your configured test-id attribute) in the JSX and locate by it. This is the most robust option for components you control:

```jsx
<button data-testid="submit">Save</button>
```

```js
I.click('[data-testid="submit"]');
```
