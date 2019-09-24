---
id: pageobjects
title: Page Objects
---

UI of your web application has interaction areas which can be shared across different tests.
To avoid code duplication you can put common locators and methods into one place.

## Dependency Injection

All objects described here are injected with Dependency Injection. The similar way it happens in AngularJS framework. If you want an object to be injected in scenario by its name add it to configuration:

```js
  include: {
    I: "./custom_steps.js",
    Smth: "./pages/Smth.js",
    loginPage: "./pages/Login.js",
    signinFragment: "./fragments/Signin.js"
  }
```

Now this objects can be retrieved by the name specified in configuration.

Required objects can be obtained via parameters in tests or via global `inject()` call.

```js
// globally inject objects by name
const { I, myPage, mySteps } = inject();

// inject objects for a test by name
Scenario('sample test', (I, myPage, mySteps) => {
  // ...
})
```

## Actor

At initialization you were asked to create custom steps file. If you accepted this option you may use `custom_steps.js` file to extend `I`. See how `login` method can be added to `I`:

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

> ℹ Instead of `I` you should use `this` in current context.

## PageObject

In case an application has different pages (login, admin, etc) you should use a page object.
CodeceptJS can generate a template for it with the command:

```sh
npx codeceptjs gpo
```

This will create a sample template for a page object and include it into `codecept.json` config.

```js
const { I, otherPage } = inject();

module.exports = {

  // insert your locators and methods here
}
```

As you see, `I` object is available there so you can use it as you do in tests.
General page object for a login page may look like this:

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

You can include this pageobject in test by its name (defined in `codecept.json`). In case you created a `loginPage` object
it should be added to list of test arguments to be included in test:

```js
Scenario('login', (I, loginPage) => {
  loginPage.sendForm('john@doe.com','123456');
  I.see('Hello, John');
});
```

Also you can use `async/await` inside PageObject:

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
Scenario('login2', async (I, loginPage, basePage) => {
  let title = await mainPage.openMainArticle()
  basePage.pageShouldBeOpened(title)
});
```

Page Objects can be be functions, arrays or classes. When declared page objects as classes you can easily extend them in other page objects.

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
exports.AttachFile = AttachFile
module.exports = new AttachFile();
```

## Page Fragments

In a similar manner CodeceptJS allows you to generate **PageFragments** and any other are abstraction
by running `go` command with `--type` (or `-t`) option:

```sh
npx codeceptjs go --type fragment
```

Page Fragments represent autonomous parts of a page, like modal boxes, components, widgets.
Technically they are the same as PageObject but conceptually they are a bit different.
For instance, it is recommended that Page Fragment to include a root locator of a component.
Methods of page fragment can use `within` block to narrow scope to a root locator:

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

To use a Page Fragment within a Test Scenario just inject it into your Scenario:

```js
Scenario('failed_login', async (I, loginPage, modal) => {
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

StepObjects represent complex actions which involve usage of multiple web pages. For instance, creating users in backend, changing permissions, etc.
StepObject can be created similarly to PageObjects or PageFragments:

```sh
npx codeceptjs go --type step
```

Technically they are the same as PageObjects. StepObjects can inject PageObjects and use multiple POs to make a complex scenarios:

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

You can inject objects per test by calling `injectDependencies` function on Scenario:

```js
Scenario('search @grop', (I, Data) => {
  I.fillField('Username', Data.username);
  I.pressKey('Enter');
}).injectDependencies({ Data: require('./data.js') });
```

This requires `./data.js` module and assigns it to `Data` argument in a test.
