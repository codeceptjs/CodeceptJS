# PageObjects

UI of your web application has interaction areas which can be shared across different tests.
To avoid code duplication you can put common locators and methods into one place.

## PageObjects

In case an application has different pages (login, admin, etc) you should use a page object.
CodeceptJS can generate a template for it with next command

```
codeceptjs gpo
```
*(or generate pageobject)*

This will create a sample template for a page object and include it into `codecept.json` config.

```js
'use strict';
let I;

module.exports = {

  _init() {
    I = actor();
  }

  // insert your locators and methods here
}
```

As you see, `I` object is available there so you can use it as you do in tests.
General page object for a login page may look like this:

```js
'use strict';
let I;

module.exports = {

  _init() {
    I = actor();
  },

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

## Page Fragments

In a similar manner CodeceptJS allows you to generate **PageFragments** and any other are abstraction
by running `go` command with `--type` (or `-t`) option:

```
codeceptjs go --type fragment
```

Page Fragments represent autonomous parts of a page, like modal boxes, components, widgets.
Technically they are the same as PageObject but conceptually they are a bit different.
For instance, it is recommended that Page Fragment to include a root locator of a component.
Methods of page fragment can use `within` block to narrow scope to a root locator:

```js
let I;
// fragments/modal.js
module.exports = {

  _init() {
    I = actor();
  },

  root: '#modal',

  // we are clicking "Accept: inside a popup window
  accept() {
    within(this.root, function() {
      I.click('Accept');
    });
  }
}
```

## StepObjects

StepObjects represent complex actions which involve usage of multiple web pages. For instance, creating users in backend, chaning permissions, etc.
StepObject can be created similarly to PageObjects or PageFragments:

```
codeceptjs go --type step
```

Technically they are the same as PageObjects but with no locators inside them. StepObjects can inject PageObjects and use multiple POs to make a complex scenarios:

```js
let I, userPage, permissionPage;
module.exports = {

  _init() {
    I = actor();
    userPage = require('../pages/user');
    userPage._init();
    permissionPage = require('../pages/permissions');
    permissionPage._init();

  },

  createUser(name) {
    // action composed from actions of page objects
    userPage.open();
    userPage.create(name);
    permissionPage.activate(name);
  }

};
```

## Actor

Login example above can be reworked so the method `login` would be available in `I` object itself.
This is recommended if most of tests require user authentication and for not to require `loginPage` every time.

At initialization you were asked to create custom steps file. If you accepted this option you may use `custom_steps.js` file to extend `I`.
See how `login` method can be added to `I`:

```js
'use strict';
// in this file you can append custom step methods to 'I' object

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
Please notice that instead of `I` you should use `this` in current context.

### done()
