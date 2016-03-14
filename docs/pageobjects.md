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
    I = require('codeceptjs/actor')();
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
    I = require('codeceptjs/actor')();
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

In a similar manner CodeceptJS allows you to generate **StepObjects**, **PageFragments** and any other are abstraction
by running `go` command with `--type` option:

```
codeceptjs go --type fragment
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
  return require('./lib/actor')({
        
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
