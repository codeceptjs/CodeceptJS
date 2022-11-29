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
Even if the text on the button changes, it's much easier to update it.

> If your code goes beyond using `I` object or page objects, you are probably doing something wrong.

When it's hard to match text to element we recommend using [locator builder](/locators#locator-builder). It allows to build complex locators via fluent API.
So if you want to click an element which is not a button or a link and use its text you can use `locate()` to build a readable locator:

```js
// clicks element <span class="button">Click me</span>
I.click(locate('.button').withText('Click me'));
```

## Short Cuts

To write simpler and effective tests we encourage to use short cuts.
Make test be focused on one feature and try to simplify everything that is not related directly to test.

* If data is required for a test, try to create that data via API. See how to do it in [Data Management](/data) chapter.
* If user login is required, use [autoLogin plugin](/plugins#autoLogin) instead of putting login steps inside a test.
* Break a long test into few. Long test can be fragile and complicated to follow and update.
* Use [custom steps and page objects](/pageobjects) to hide steps which are not relevant to current test.

Make test as simple as:

```js
Scenario('editing a metric', async ({ I, loginAs, metricPage }) => {
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
## Locators

* If you don't use multi-lingual website or you don't update texts often it is OK to click on links by their texts or match fields by their placeholders.
* If you don't want to rely on guessing locators, specify them manually with `{ css: 'button' }` or `{ xpath: '//button' }`.  We call them strict locators. Those locators will be faster but less readable.
* Even better if you have a convention on active elements with special attributes like `data-test` or `data-qa`. Use `customLocator` plugin to easily add them to tests.
* Keep tests readable which will make them maintainable.

## Page Objects

When a project is growing and more and more tests are required, it's time to think about reusing test code across the tests. Some common actions should be moved from tests to other files so to be accessible from different tests.

Here is a recommended strategy what to store where:

* Move site-wide actions into an **Actor** file (`custom_steps.js` file). Such actions like `login`, using site-wide common controls, like drop-downs, rich text editors, calendars.
* Move page-based actions and selectors into **Page Object**. All acitivities made on that page can go into methods of page object. If you test Single Page Application a PageObject should represent a screen of your application.
* When site-wide widgets are used, interactions with them should be placed in **Page Fragments**. This should be applied to global navigation, modals, widgets.
* A custom action that requires some low-level driver access, should be placed into a **Helper**. For instance, database connections, complex mouse actions, email testing, filesystem, services access.

> [Learn more](/pageobjects) about different refactoring options

However, it's recommended to not overengineer and keep tests simple. If a test code doesn't require reusage at this point it should not be transformed to use page objects.


* use page objects to store common actions
* don't make page objects for every page! Only for pages shared across different tests and suites.
* use classes for page objects, this allows inheritace. Export instance of that classes.
* if a page object is focused around a form with multiple fields in it, use a flexible set of arguments in it:

```js
class CheckoutForm {

  fillBillingInformation(data = {}) {
    // take data in a flexible format
    // iterate over fields to fill them all
    for (let key of Object.keys(data)) {
      I.fillField(key, data[key]); // like this one
    }
  }

}
module.exports = new CheckoutForm();
module.exports.CheckoutForm = CheckoutForm; // for inheritance
```

* for components that are repeated accross a website (widgets) but don't belong to any page, use component objects. They are the same as page objects but focused only aroung one element:

```js
class DropDownComponent {

  selectFirstItem(locator) {
    I.click(locator);
    I.click('#dropdown-items li');
  }

  selectItemByName(locator, name) {
    I.click(locator);
    I.click(locate('li').withText(name), '#dropdown-items');
  }
}
```
* another good example is datepicker component:
```js
const { I } = inject();

/**
 * Calendar works
 */
class DatePicker {

  selectToday(locator) {
    I.click(locator);
    I.click('.currentDate', '.date-picker');
  }

  selectInNextMonth(locator, date = '15') {
    I.click(locator);
    I.click('show next month', '.date-picker')
    I.click(date, '.date-picker')
  }

}


module.exports = new DatePicker();
module.exports.DatePicker = DatePicker; // for inheritance
```

## Configuration

* create multiple config files for different setups/enrionments:
  * `codecept.conf.js` - default one
  * `codecept.ci.conf.js` - for CI
  * `codecept.windows.conf.js` - for Windows, etc
* use `.env` files and dotenv package to load sensitive data

```js
require('dotenv').config({ path: '.env' });
```

* move similar parts in those configs by moving them to modules and putting them to `config` dir
* when you need to load lots of page objects/components, you can get components/pageobjects file declaring them:

```js
// inside config/components.js
module.exports = {
    DatePicker: "./components/datePicker",
    Dropdown: "./components/dropdown",
}
```

include them like this:

```js
  include: {
      I: './steps_file',
      ...require('./config/pages'), // require POs and DOs for module
      ...require('./config/components'), // require all components
  },
```

* move long helpers configuration into `config/plugins.js` and export them
* move long configuration into `config/plugins.js` and export them
* inside config files import the exact helpers or plugins needed for this setup & environment
* to pass in data from config to a test use a container:

```js
// inside codecept conf file
bootstrap: () => {
  codeceptjs.container.append({
    testUser: {
      email: 'test@test.com',
      password: '123456'
    }
  });
}
// now `testUser` can be injected into a test
```
* (alternatively) if you have more test data to pass into tests, create a separate file for them and import them similarly to page object:

```js
include: {
  // ...
  testData: './config/testData'

}
```
* .env / different configs / different test data allows you to get configs for multiple environments

## Data Access Objects

* Concept is similar to page objects but Data access objects can act like factories or data providers for tests
* Data Objects require REST or GraphQL helpers to be enabled for data interaction
* When you need to customize access to API and go beyond what ApiDataFactory provides, implement DAO:

```js
const faker = require('@faker-js/faker');
const { I } = inject();
const { output } = require('codeceptjs');

class InterfaceData {

  async getLanguages() {
      const { data } = await I.sendGetRequest('/api/languages');
      const { records } = data;
      output.debug(`Languages ${records.map(r => r.language)}`);
      return records;
  }

  async getUsername() {
    return faker.user.name();
  }
}

module.exports = new InterfaceData;
```
