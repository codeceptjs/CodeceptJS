---
permalink: /element-selection
title: Element Selection
---

# Element Selection

When you write `I.click('a')` and there are multiple links on a page, CodeceptJS clicks the **first** one it finds. Most of the time this is exactly what you need — your locators are specific enough that there's only one match, or the first match happens to be the right one.

But what happens when it's not?

## Picking a Specific Element

Say you have a list of items and you want to click the second one. You could write a more specific CSS selector, but sometimes the simplest approach is to tell CodeceptJS which element you want by position:

```js
import step from 'codeceptjs/steps'

// click the 2nd link
I.click('a', step.opts({ elementIndex: 2 }))

// click the last link
I.click('a', step.opts({ elementIndex: 'last' }))

// fill the last matching input
I.fillField('.email-input', 'test@example.com', step.opts({ elementIndex: -1 }))
```

The `elementIndex` option accepts:

* **Positive numbers** (1-based) — `1` is first, `2` is second, `3` is third
* **Negative numbers** — `-1` is last, `-2` is second-to-last
* **`'first'`** and **`'last'`** as readable aliases

This works with any action that targets a single element: `click`, `doubleClick`, `rightClick`, `fillField`, `appendField`, `clearField`, `checkOption`, `selectOption`, `attachFile`, and others.

If only one element matches the locator, `elementIndex` is silently ignored — you always get that single element regardless of the index value. This is convenient when the number of matches depends on page state: you won't get an error if the list happens to have just one item.

When multiple elements exist but the index is out of range, CodeceptJS throws a clear error:

```
elementIndex 100 exceeds the number of elements found (3) for "a"
```

You can combine `elementIndex` with other step options:

```js
I.click('a', step.opts({ elementIndex: 2 }).timeout(5).retry(3))
```

## Strict Mode

If you'd rather not silently click the first of many matches, enable `strict: true` in your helper configuration. This makes CodeceptJS throw an error whenever a locator matches more than one element, forcing you to write precise locators:

```js
// codecept.conf.js
helpers: {
  Playwright: {
    url: 'http://localhost',
    browser: 'chromium',
    strict: true,
  }
}
```

Now any ambiguous locator will fail immediately:

```js
I.click('a') // MultipleElementsFound: Multiple elements (3) found for "a" in strict mode
```

This is useful on projects where you want to catch accidental matches early — clicking the wrong button because of a vague locator is a common source of flaky tests.

When a test fails in strict mode, the error includes a `fetchDetails()` method that lists the matched elements with their XPath and simplified HTML, so you can see exactly what was found and write a better locator:

```js
// Multiple elements (3) found for "a" in strict mode. Call fetchDetails() for full information.
// After fetchDetails():
// /html/body/div/a[1] <a id="first-link">First</a>
// /html/body/div/a[2] <a id="second-link">Second</a>
// /html/body/div/a[3] <a id="third-link">Third</a>
// Use a more specific locator or grabWebElements() to work with multiple elements
```

Strict mode is supported in **Playwright**, **Puppeteer**, and **WebDriver** helpers.

### Per-Step Strict Mode with `exact`

You don't have to enable strict mode globally. Use `exact: true` to enforce it on a single step — handy when most of your tests are fine with default behavior but a particular action needs to be precise:

```js
import step from 'codeceptjs/steps'

I.click('a', step.opts({ exact: true }))
// throws MultipleElementsFound if more than one link matches
```

`strictMode: true` is an alias if you prefer a more descriptive name:

```js
I.click('a', step.opts({ strictMode: true }))
```

It works the other way too. If your helper has `strict: true` globally but you need to relax it for one step, use `exact: false`:

```js
// strict: true in config, but this step allows multiple matches
I.click('a', step.opts({ exact: false }))
```

And when you know there are multiple matches and want a specific one, `elementIndex` also overrides the strict check — no error is thrown because you've explicitly chosen which element to use:

```js
// strict: true in config, but this works without error
I.click('a', step.opts({ elementIndex: 2 }))
```

## Summary

| Situation | Approach |
|-----------|----------|
| You want to catch ambiguous locators early | Enable `strict: true` in helper config |
| You need a specific element from a known list | Use `step.opts({ elementIndex: N })` |
| You want to iterate over all matching elements | Use [`eachElement`](/els) from the `els` module |
| You need full control over element inspection | Use [`grabWebElements`](/WebElement) to get all matches |
