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
module.exports = function() {
  return actor({

    login: function(email, password) {
      this.fillField('Email', email);
      this.fillField('Password', password);
      this.click('Submit');
    }
  });
}
```

> ℹ Instead of `I` you should use `this` in the current context.

## PageObject

If an application has different pages (login, admin, etc) you should use a page object.
CodeceptJS can generate a template for it with the following command:

```sh
npx codeceptjs gpo
```

This will create a sample template for a page object and include it in the `codecept.json` config file.

```js
const { I, otherPage } = inject();

module.exports = {

  // insert your locators and methods here
}
```

As you see, the `I` object is available in scope, so you can use it just like you would do in tests.
A general page object for a login page could look like this:

```js
// enable I and another page object
const { I, registerPage } = inject();

module.exports = {

  // setting locators
  fields: {
    email: '#user_basic_email',
    password: '#user_basic_password'
  },
  submitButton: {css: '#new_user_basic input[type=submit]'},

  // introducing methods
  sendForm(email, password) {
    I.fillField(this.fields.email, email);
    I.fillField(this.fields.password, password);
    I.click(this.submitButton);
  },

  register(email, password) {
    // use another page object inside current one
    registerPage.registerUser({ email, password });
  }
}
```

You can include this pageobject in a test by its name (defined in `codecept.json`). If you created a `loginPage` object,
it should be added to the list of arguments to be included in the test:

```js
Scenario('login', ({ I, loginPage }) => {
  loginPage.sendForm('john@doe.com','123456');
  I.see('Hello, John');
});
```

Also, you can use `async/await` inside a Page Object:

```js
const { I } = inject();

module.exports = {

  // setting locators
  container: "//div[@class = 'numbers']",
  mainItem: {
    number: ".//div[contains(@class, 'numbers__main-number')]",
    title: ".//div[contains(@class, 'numbers__main-title-block')]"
  },

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
```

and use them in your tests:

```js
Scenario('login2', async ({ I, loginPage, basePage }) => {
  let title = await mainPage.openMainArticle()
  basePage.pageShouldBeOpened(title)
});
```

Page Objects can be functions, arrays or classes. When declared as classes you can easily extend them in other page objects.

Here is an example of declaring page object as a class:

```js
const { expect } = require('chai');
const { I } = inject();

class AttachFile {
  constructor() {
    this.inputFileField = 'input[name=fileUpload]';
    this.fileSize = '.file-size';
    this.fileName = '.file-name'
  }

  async attachFileFrom(path) {
    await I.waitForVisible(this.inputFileField)
    await I.attachFile(this.inputFileField, path)
  }

  async hasFileSize(fileSizeText) {
    await I.waitForElement(this.fileSize)
    const size = await I.grabTextFrom(this.fileSize)
    expect(size).toEqual(fileSizeText)
  }

  async hasFileSizeInPosition(fileNameText, position) {
    await I.waitNumberOfVisibleElements(this.fileName, position)
    const text = await I.grabTextFrom(this.fileName)
    expect(text[position - 1]).toEqual(fileNameText)
  }
}

// For inheritance
module.exports = new AttachFile();
module.exports.AttachFile = AttachFile;
```

> ⚠ While building complex page objects it is important to keep all `async` functions to be called with `await`. While CodeceptJS allows to run commands synchronously if async function has `I.grab*` or any custom function that returns a promise it must be called with `await`. If you see `UnhandledPromiseRejectionWarning` it might be caused by async page object function that was called without `await`.

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
// fragments/modal.js
module.exports = {

  root: '#modal',

  // we are clicking "Accept: inside a popup window
  accept() {
    within(this.root, function() {
      I.click('Accept');
    });
  }
}
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

module.exports = {
  doStuff() {
    ...
    modal.accept();
    ...
  }
}
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

module.exports = {

  createUser(name) {
    // action composed from actions of page objects
    userPage.open();
    userPage.create(name);
    permissionPage.activate(name);
  }

};
```

## Dynamic Injection

You can inject objects per test by calling `injectDependencies` function in a Scenario:

```js
Scenario('search @grop', ({ I, Data }) => {
  I.fillField('Username', Data.username);
  I.pressKey('Enter');
}).injectDependencies({ Data: require('./data.js') });
```

This requires the `./data.js` module and assigns it to a `Data` argument in a test.
