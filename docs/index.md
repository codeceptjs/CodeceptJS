---
layout: Landing
sidebar: false
actionText: Quickstart
actionLink: /quickstart
---

::: slot pause
## Write a Test with Interactive Pause

Open a browser on an empty page and pause execution.
Type in commands to complete the test scenario.

Successful commands will be saved into a file.

```js
Scenario('Checkout test', ({ I }) => {
  I.amOnPage('/checkout');
  pause();
})
```
Copy commands from a file into a test. A test is ready!
:::

::: slot write
## Write Tests from UI

With CodeceptUI you can write your tests without closing a browser at all.

Write initial commands and execute a test. An interactive pause will be started when test finishes.

Share one browser accross test runs to save time on opening a browser.
:::


::: slot autocomplete
## Powered with IntelliSense

Use auto-completion writing a test fast.

We use TypeScript type definitions that are automatically updated for custom steps and page objects.

Writing a test in Visual Studio Code is as easy as picking a correct action and putting a parameter. It's really that nice!

:::


::: slot ui

## Watch & Run Tests from UI

We have a flexible interactive web runner which allows you to watch, debug, and write your tests in a web mode.

Features:

* Toggle headless/window mode with one click
* See HTML snapshot of each step
* Works with WebDriver, Puppeteer, TestCafe
* Shows step-by-step execution
* Integrated with your local IDE

:::


::: slot run

## Print a Test

Each executed step will be printed on screen when running with `--steps`
```js
Scenario('Checkout test', ({ I }) => {
  I.amOnPage('/checkout');
  I.fillField('First name', 'davert');
  I.fillField('#lastName', 'mik');
  I.fillField('Promo code', '123345')
  //...
})
```

:::

::: slot code

## Realworld Example

Can we use it for long scenarios? Sure!

```js
const { faker } = require('@faker-js/faker');                               // Use 3rd-party JS code

Feature('Store');

Scenario('Create a new store', async ({ I, login, SettingsPage }) => {
  const storeName = faker.lorem.slug();
  login('customer');                                          // Login customer from saved cookies
  SettingsPage.open();                                        // Use Page objects
  I.dontSee(storeName, '.settings');                          // Assert text not present inside an element (located by CSS)
  I.click('Add', '.settings');                                // Click link by text inside element (located by CSS)
  I.fillField('Store Name', storeName);                       // Fill fields by labels or placeholders
  I.fillField('Email', faker.internet.email());
  I.fillField('Telephone', faker.phone.phoneNumberFormat());
  I.selectInDropdown('Status', 'Active');                     // Use custom methods
  I.retry(2).click('Create');                                 // Retry flaky step
  I.waitInUrl('/settings/setup/stores');                      // Explicit waiter
  I.see(storeName, '.settings');                              // Assert text present inside an element (located by CSS)
  const storeId = await I.grabTextFrom('#store-id');          // Use await to get information from browser
  I.say(`Created a store with ${storeId}`);                   // Print custom comments
}).tag('stores');`;

```
:::
