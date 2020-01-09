---
permalink: /best
title: Best Practices
---

# Best Practices

## Focus on Readability

In CodeceptJS we encourage users to follow semantic elements on page while writing tests.
Instead of CSS/XPath locators try to stick to visible keywords on page.

Take a look into the next example:

```js
// it's fine but...
I.click({css: 'nav.user .user-login'});
// can be better
I.click('Login', 'nav.user');
```

If we replace raw CSS selector with a button title we can improve readability of such test.
Even a text on the button changes its much easier to update it.

> If your code goes beyond using `I` object or page objects, you are probably doing something wrong.

When it's hard to match text to element we recommend using [locator builder](/locators#locator-builder). It allows to build complex locators via fluent API.
So if you want to click an element which is not a button or a link and use its text you can use `locate()` to build a readable locator:

```js
// clicks element <span class="button">Click me</span>
I.click(locate('.button').withText('Click me'));
```

## Use Short Cuts

To write simpler and effective tests we encourage to use short cuts.
Make test be focused on one feature and try to simplify everything that is not related directly to test.

* If data is required for a test, try to create that data via API. See how to do it in [Data Management](/data) chapter.
* If user login is required, use [autoLogin plugin](/plugins#autoLogin) instead of putting login steps inside a test.
* Break a long test into few. Long test can be fragile and complicated to follow and update.
* Use [custom steps and page objects](/pageobjects) to hide steps which are not relevant to current test.

Make test as simple as:

```js
Scenario('editing a metric', async (I, loginAs, metricPage) => {
  // login via autoLogin
  loginAs('admin');
  // create data with ApiDataFactory
  const metric = await I.have('metric', { type: 'memory', duration: 'day' })
  // use page object to open a page
  metricPage.open(metric.id);
  I.click('Edit');
  I.see('Editing Metric');
  // using a custom step
  I.selectFromDropdown('duration', 'week');
  I.click('Save');
  I.see('Duration: Week', '.summary');
});
```

## Refactoring and PageObjects

When a project is growing and more and more tests are required, it's time to think about reusing test code across the tests. Some common actions should be moved from tests to other files so to be accessible from different tests.

Here is a recommended strategy what to store where:

* Move site-wide actions into an **Actor** file (`custom_steps.js` file). Such actions like `login`, using site-wide common controls, like drop-downs, rich text editors, calendars.
* Move page-based actions and selectors into **Page Object**. All acitivities made on that page can go into methods of page object. If you test Single Page Application a PageObject should represent a screen of your application.
* When site-wide widgets are used, interactions with them should be placed in **Page Fragments**. This should be applied to global navigation, modals, widgets.
* A custom action that require some low-level driver access, should be placed into a **Helper**. For instance, database connections, complex mouse actions, email testing, filesystem, services access.

> [Learn more](/pageobjects) about different refactoring options

However, it's recommended to not overengineer and keep tests simple. If a test code doesn't require reusage at this point it should not be transformed to use page objects.

