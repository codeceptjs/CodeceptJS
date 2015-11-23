# codeceptjs [![NPM version][npm-image]][npm-url]


## Modern Era Aceptance Testing Framework for NodeJS

CodeceptJS is a new testing framework for end-to-end testing with WebDriver (or others). 
It abstracts browser interaction to simple steps which is written from a user perspective. 
A simple test that verifies that "Welcome" text is present on a main page of a site will look like:

```js
Feature('CodeceptJS demo');

Scenario('check Welcome page on site', (I) => {
  I.amOnPage('/');
  I.see('Welcome');
}
``` 

Codeception tests are:

* **Synchronous**. You don't need to care about callbacks, or promises, test scenarios are linear, your test should be to.
* Written from **user's perspecitve**. Every action is a method of `I`, which emulates user interaction.
* backend **API agnostic**. We don't know which WebDriver implementation is running this test. We can easily switch from WebDriverIO to Protractor or PhantomJS.




## Install

```sh
$ npm install -g codeceptjs
```


## Usage

```
codeceptjs init
```

WIP

## Examples

```js
var assert = require('assert');
Feature('CodeceptJS Demonstration');

Scenario('test some forms', (I) => {
  I.amOnPage('http://simple-form-bootstrap.plataformatec.com.br/documentation');
  I.fillField('Email', 'hello@world.com');
  I.fillField('Password', '123456');
  I.checkOption('Active');
  I.checkOption('Male');  
  I.click('Create User');
  I.see('User is valid');
  I.dontSeeInCurrentUrl('/documentation');
});

```

WIP

## License

MIT © [DavertMik](http://codegyre.com)


[npm-image]: https://badge.fury.io/js/codeceptjs.svg
[npm-url]: https://npmjs.org/package/codeceptjs
[travis-image]: https://travis-ci.org/Codeception/codeceptjs.svg?branch=master
[travis-url]: https://travis-ci.org/Codeception/codeceptjs
[daviddm-image]: https://david-dm.org/Codeception/codeceptjs.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/Codeception/codeceptjs
[coveralls-image]: https://coveralls.io/repos/Codeception/codeceptjs/badge.svg
[coveralls-url]: https://coveralls.io/r/Codeception/codeceptjs
