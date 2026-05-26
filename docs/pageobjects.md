---
permalink: /pageobjects
title: Page Objects
---

# Page Objects

The UI of your web application has interaction areas which can be shared across different tests.
To avoid code duplication you can put common locators and methods in one place.

## Dependency Injection

All objects described here are injected via Dependency Injection, in a similar way AngularJS does. If you want an object to be injected in a scenario by its name, you can add it to the configuration:

```js
  include: {
    I: "./custom_steps.js",
    Smth: "./pages/Smth.js",
    loginPage: "./pages/Login.js",
    signinFragment: "./fragments/Signin.js"
  }
```

These objects can now be retrieved by the name specified in the configuration.

Required objects can be obtained via parameters in tests or via a global `inject()` call.

```js
// globally inject objects by name
const { I, myPage, mySteps } = inject();

// inject objects for a test by name
Scenario('sample test', ({ I, myPage, mySteps }) => {
  // ...
});
```

## Actor

During initialization, you were asked to create a custom steps file. If you accepted this option, you are now able to use the `custom_steps.js` file to extend `I`. See how the `login` method can be added to `I`:

```js
export default function() {
  return actor({
    login: function(email, password) {
      this.fillField('Email', email);
      this.fillField('Password', password);
      this.click('Submit');
    }
  });
}
```

> Instead of `I` you should use `this` in the current context.

## PageObject

If an application has different pages (login, admin, etc) you should use a page object.
CodeceptJS can generate a template for it with the following command:

```sh
npx codeceptjs gpo
```

This will create a sample template for a page object and include it in the `codecept.json` config file.

**Page objects should be classes.** Use `const { I } = inject()` at the top of the file to access `I` and other page objects. Export the class itself — the DI container will auto-instantiate it.

```js
const { I, registerPage } = inject();

class LoginPage {
  // setting locators
  fields = {
    email: '#user_basic_email',
    password: '#user_basic_password'
  }
  submitButton = { css: '#new_user_basic input[type=submit]' }

  // introducing methods
  sendForm(email, password) {
    I.fillField(this.fields.email, email);
    I.fillField(this.fields.password, password);
    I.click(this.submitButton);
  }

  register(email, password) {
    // use another page object inside current one
    registerPage.registerUser({ email, password });
  }
}

export default LoginPage
```

> The `inject()` call at the top returns a lazy proxy. `I` and other page objects resolve at call time, so it's safe to destructure before class definition.

You can include this pageobject in a test by its name (defined in `codecept.conf.js`). If you created a `loginPage` object,
it should be added to the list of arguments to be included in the test:

```js
Scenario('login', ({ I, loginPage }) => {
  loginPage.sendForm('john@doe.com','123456');
  I.see('Hello, John');
});
```

You can use `async/await` inside a Page Object:

```js
const { I } = inject();

class MainPage {
  // setting locators
  container = "//div[@class = 'numbers']"
  mainItem = {
    number: ".//div[contains(@class, 'numbers__main-number')]",
    title: ".//div[contains(@class, 'numbers__main-title-block')]"
  }

  // introducing methods
  async openMainArticle() {
    I.waitForVisible(this.container)
    let _this = this
    let title;
    await within(this.container, async () => {
      title = await I.grabTextFrom(_this.mainItem.number);
      let subtitle = await I.grabTextFrom(_this.mainItem.title);
      title = title + " " + subtitle.charAt(0).toLowerCase() + subtitle.slice(1);
      await I.click(_this.mainItem.title)
    })
    return title;
  }
}

export default MainPage
```

and use them in your tests:

```js
Scenario('open article', async ({ I, mainPage, basePage }) => {
  let title = await mainPage.openMainArticle()
  basePage.pageShouldBeOpened(title)
});
```

Page objects can also be extended via class inheritance:

```js
const { I } = inject();

class AttachFile {
  inputFileField = 'input[name=fileUpload]'
  fileSize = '.file-size'
  fileName = '.file-name'

  async attachFileFrom(path) {
    await I.waitForVisible(this.inputFileField)
    await I.attachFile(this.inputFileField, path)
  }

  async hasFileSize(fileSizeText) {
    await I.waitForElement(this.fileSize)
    const size = await I.grabTextFrom(this.fileSize)
    expect(size).toEqual(fileSizeText)
  }
}

// Export class for auto-instantiation
export default AttachFile
```

> While building complex page objects it is important to keep all `async` functions to be called with `await`. While CodeceptJS allows to run commands synchronously if async function has `I.grab*` or any custom function that returns a promise it must be called with `await`. If you see `UnhandledPromiseRejectionWarning` it might be caused by async page object function that was called without `await`.

## Page Object Lifecycle Hooks

Page objects support lifecycle hooks that mirror the helper hook system. These methods are called automatically by the framework:

| Hook | When it runs |
|------|-------------|
| `_before()` | Before the first method call on this page object in a test (lazy, per-test) |
| `_after()` | After each test, but only if the page object was used in that test |
| `_beforeSuite()` | Before each Feature/suite (for all page objects that define it) |
| `_afterSuite()` | After each Feature/suite (for all page objects that define it) |

```js
const { I } = inject();

class DashboardPage {
  _before() {
    I.amOnPage('/dashboard');
    I.waitForElement('.dashboard-loaded');
  }

  _after() {
    I.clearCookie();
  }

  _afterSuite() {
    I.sendDeleteRequest('/api/test-data/cleanup');
  }

  grabStats() {
    return I.grabTextFrom('.stats');
  }

  seeWelcomeMessage(name) {
    I.see(`Welcome, ${name}`, '.header');
  }
}

export default DashboardPage
```

```js
Scenario('see dashboard stats', async ({ I, dashboardPage }) => {
  // dashboardPage._before() runs automatically before this line
  dashboardPage.seeWelcomeMessage('John');
  const stats = await dashboardPage.grabStats();
  I.say(`Stats: ${stats}`);
  // dashboardPage._after() runs automatically after test ends
});
```

Key behaviors:
- `_before()` runs **lazily** — only when the page object is first used in a test, not when it's injected
- `_before()` runs **once per test** — calling multiple methods does not re-trigger it
- `_after()` is **skipped** for page objects that were never used in the test
- `_beforeSuite()` and `_afterSuite()` run for **all** page objects that define them, regardless of usage
- Hook methods are **not** shown as test steps in the output

## Page Fragments

Similarly, CodeceptJS allows you to generate **PageFragments** and any other abstractions
by running the `go` command with `--type` (or `-t`) option:

```sh
npx codeceptjs go --type fragment
```

Page Fragments represent autonomous parts of a page, like modal boxes, components, widgets.
Technically, they are the same as PageObject but conceptually they are a bit different.
For instance, it is recommended that Page Fragment includes a root locator of a component.
Methods of page fragments can use `within` block to narrow scope to a root locator:

```js
const { I } = inject();

class Modal {
  root = '#modal'

  accept() {
    within(this.root, function() {
      I.click('Accept');
    });
  }
}

export default Modal
```

To use a Page Fragment within a Test Scenario, just inject it into your Scenario:

```js
Scenario('failed_login', async ({ I, loginPage, modal }) => {
  loginPage.sendForm('john@doe.com','wrong password');
  I.waitForVisible(modal.root);
  within(modal.root, function () {
    I.see('Login failed');
  })
});
```

To use a Page Fragment within a Page Object, you can use `inject` method to get it by its name.

```js
const { I, modal } = inject();

class CheckoutPage {
  confirmOrder() {
    I.click('Place Order');
    modal.accept();
  }
}

export default CheckoutPage
```

> PageObject and PageFragment names are declared inside `include` section of `codecept.conf.js`. See [Dependency Injection](#dependency-injection)

## StepObjects

StepObjects represent complex actions which involve the usage of multiple web pages. For instance, creating users in the backend, changing permissions, etc.
StepObject can be created similarly to PageObjects or PageFragments:

```sh
npx codeceptjs go --type step
```

Technically, they are the same as PageObjects. StepObjects can inject PageObjects and use multiple POs to make a complex scenarios:

```js
const { I, userPage, permissionPage } = inject();

class AdminSteps {
  createUser(name) {
    // action composed from actions of page objects
    userPage.open();
    userPage.create(name);
    permissionPage.activate(name);
  }
}

export default AdminSteps
```

## Data Objects

Page objects can also be used to manage test data via API. **Data Objects** are page object classes that create data using the REST helper and automatically clean it up via the `_after()` hook.

```js
Scenario('user sees their profile', async ({ I, userData }) => {
  const user = await userData.createUser({ name: 'John Doe' });
  I.amOnPage(`/users/${user.id}`);
  I.see('John Doe');
  // userData._after() runs automatically — deletes the created user
});
```

This is useful for tests that need API-created data with automatic cleanup, without the overhead of factory configuration.

**Learn more:** See [Data Objects](/data#data-objects) for complete documentation, examples, and configuration.

## Dynamic Injection

Sometimes you need to use a page object in only one or a few tests without adding it to global configuration. Use `injectDependencies()` to inject page objects dynamically per test:

```js
// pages/searchPage.js
const { I } = inject();

class SearchPage {
  constructor() {
    this.searchField = '#search-input';
    this.searchButton = 'button[type=submit]';
  }

  search(query) {
    I.fillField(this.searchField, query);
    I.click(this.searchButton);
  }
}

export default new SearchPage();
```

Inject the page object into a specific scenario:

```js
import searchPage from './pages/searchPage.js'

Scenario('user searches for products', ({ I, searchPage }) => {
  I.amOnPage('/');
  searchPage.search('laptop');
  I.see('Search Results');
}).injectDependencies({ searchPage });
```

**Use cases:**
- Page objects needed only in a few tests
- Test-specific configurations or data objects
- Experimenting with new page objects before adding them globally

**Note:** For page objects used across multiple tests, add them to the `include` section in `codecept.conf.js` instead.

## Plain Object Page Objects (Legacy)

Plain object page objects are still supported for backward compatibility:

```js
const { I } = inject();

export default {
  fields: {
    email: '#user_basic_email',
    password: '#user_basic_password'
  },
  submitButton: { css: '#new_user_basic input[type=submit]' },

  sendForm(email, password) {
    I.fillField(this.fields.email, email);
    I.fillField(this.fields.password, password);
    I.click(this.submitButton);
  }
}
```

> Class-based page objects are recommended for new code as they support lifecycle hooks and inheritance.
