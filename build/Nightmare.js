'use strict';
const requireg = require('requireg');
const Helper = require('../helper');
const stringIncludes = require('../assert/include').includes;
const urlEquals = require('../assert/equal').urlEquals;
const equals = require('../assert/equal').equals;
const empty = require('../assert/empty').empty;
const truth = require('../assert/truth').truth;
const xpathLocator = require('../utils').xpathLocator;
const fileExists = require('../utils').fileExists;
const co = require('co');
const path = require('path');

let specialKeys = {
  Backspace: '\u0008',
  Enter: '\u000d',
  Delete: '\u007f'
};

/**
 * Nightmare helper wraps [Nightmare](https://github.com/segmentio/nightmare) library to provide
 * fastest headless testing using Electron engine. Unlike Selenium-based drivers this uses
 * Chromium-based browser with Electron with lots of client side scripts, thus should be less stable and
 * less trusted.
 *
 * Requires `nightmare` and `nightmare-upload` packages to be installed.
 *
 * ### Configuration
 *
 * This helper should be configured in codecept.json
 *
 * * `url` - base url of website to be tested
 * * `restart` (optional, default: true) - restart browser between tests.
 * * `keepCookies` (optional, default: false)  - keep cookies between tests when `restart` set to false.
 * * `waitForAction`: (optional) how long to wait after click, doubleClick or PressKey actions in ms. Default: 500
 * * `waitForTimeout`: (optional) default wait* timeout
 * * `windowSize`: (optional) default window size. Set a dimension like `640x480`.
 *
 * + options from [Nightmare configuration](https://github.com/segmentio/nightmare#api)
 *
 */
class Nightmare extends Helper {

  constructor(config) {
    super(config);

    // set defaults
    this.options = {
      waitForAction: 500,
      waitForTimeout: 1000,
      rootElement: 'body',
      restart: true,
      keepCookies: false,
      js_errors: null
    };

    // override defaults with config
    Object.assign(this.options, config);

    this.context = this.options.rootElement;
    this.options.waitForTimeout;
  }

  static _config() {
    return [
      { name: 'url', message: "Base url of site to be tested", default: 'http://localhost' },
    ];
  }

  static _checkRequirements() {
    try {
      requireg("nightmare");
      requireg("nightmare-upload");
    } catch(e) {
      return ["nightmare", "nightmare-upload"];
    }
  }

  _init() {
    this.Nightmare = requireg('nightmare');

    require('nightmare-upload')(this.Nightmare);

    this.Nightmare.action('findElements', function (locator, contextEl, done) {

      if (!done) {
        done = contextEl;
        contextEl = null;
      }

      let by = Object.keys(locator)[0];
      let value = locator[by];

      this.evaluate_now(function (by, locator, contextEl) {
        return window.codeceptjs.findAndStoreElements(by, locator);
      }, done, by, value, contextEl);
    });

    this.Nightmare.action('findElement', function (locator, contextEl, done) {
      if (!done) {
        done = contextEl;
        contextEl = null;
      }

      let by = Object.keys(locator)[0];
      let value = locator[by];

      this.evaluate_now(function (by, locator, contextEl) {
        let res = window.codeceptjs.findAndStoreElement(by, locator);
        if (res === null) {
          throw new Error(`Element ${locator} couldn't be located by ${by}`);
        }
        return res;
      }, done, by, value, contextEl);
    });

    this.Nightmare.action('asyncScript', function () {
      let args = Array.prototype.slice.call(arguments);
      let done = args.pop();
      args = args.splice(1, 0, done);
      this.evaluate_now.apply(this, args);
    });

    this.Nightmare.action('enterText', function (el, text, clean, done) {

      let child = this.child;
      let typeFn = () => child.call('type', text, done);

      this.evaluate_now(function (el, clean) {
        var el = window.codeceptjs.fetchElement(el);
        if (clean) el.value = '';
        el.focus();
      }, () => {
        if (clean) return typeFn();
        child.call('pressKey', 'End', typeFn); // type End before
      }, el, clean);
    });

    this.Nightmare.action('pressKey', function (ns, options, parent, win, renderer, done) {
      parent.respondTo('pressKey', function (ch, done) {
        win.webContents.sendInputEvent({
          type: 'keyDown',
          keyCode: ch
        });

        win.webContents.sendInputEvent({
          type: 'char',
          keyCode: ch
        });

        win.webContents.sendInputEvent({
          type: 'keyUp',
          keyCode: ch
        });
        done();
      });
      done();
    }, function (key, done) {
      this.child.call('pressKey', key, done);
    });
  }

  _beforeSuite() {
    if (!this.options.restart) {
      return this._startBrowser();
    }
  }

  _before() {
    if (this.options.restart) {
      return this._startBrowser();
    }
    return this.browser;
  }

  _after() {
    if (this.options.restart) {
      return this._stopBrowser();
    }
    if (this.options.keepCookies) return;
    return this.browser.cookies.clearAll();
  }

  _afterSuite() {
    if (!this.options.restart) {
      this._stopBrowser();
    }
  }

  _startBrowser() {
    this.browser = this.Nightmare(this.options);
    this.browser.on('dom-ready', () => this._injectClientScripts());
    this.browser.on('console', (type, message) => {
      this.debug(`${type}: ${message}`);
    });

    if (this.options.windowSize) {
      let size = this.options.windowSize.split('x');
      return this.browser.viewport(parseInt(size[0]), parseInt(size[1]));
    }
  }

  _stopBrowser() {
    return this.browser.end().catch((error) => {
      this.debugSection('Error on End', error);
    });
  }

  _withinBegin(locator) {
    this.context = locator;
    locator = guessLocator(locator) || {css: locator};
    this.browser.evaluate(function (by, locator) {
      var el = codeceptjs.findElement(by, locator);
      if (!el) throw new Error(`Element by ${by}: ${locator} not found`);
      window.codeceptjs.within = el;
    }, lctype(locator), lcval(locator));
  }

  _withinEnd() {
    this.context = this.options.rootElement;
    return this.browser.evaluate(function () {
      codeceptjs.within = null;
    });
  }

  /**
   * Locate elements by different locator types, including strict locator.
   * Should be used in custom helpers.
   *
   * This method return promise with array of IDs of found elements.
   * Actual elements can be accessed inside `evaluate` by using `codeceptjs.fetchElement()`
   * client-side function:
   *
   * ```js
   * // get an inner text of an element
   *
   * let browser = this.helpers['Nightmare'].browser;
   * let value = this.helpers['Nightmare']._locate({name: 'password'}).then(function(els) {
   *   return browser.evaluate(function(el) {
   *     return codeceptjs.fetchElement(el).value;
   *   }, els[0]);
   * });
   * ```
   */
  _locate(locator) {
    locator = guessLocator(locator) || { css: locator};
    return this.browser.evaluate(function (by, locator) {
      return codeceptjs.findElements(by, locator);
    }, lctype(locator), lcval(locator));
  }


  /**
   * Add a header override for all HTTP requests. If header is undefined, the header overrides will be reset.
   *
   * ```js
   * I.haveHeader('x-my-custom-header', 'some value');
   * I.haveHeader(); // clear headers
   * ```
   */
  haveHeader(header, value) {
    return this.browser.header(header, value);
  }

  /**
   * Opens a web page in a browser. Requires relative or absolute url.
If url starts with `/`, opens a web page of a site defined in `url` config parameter.

```js
I.amOnPage('/'); // opens main page of website
I.amOnPage('https://github.com'); // opens github
I.amOnPage('/login'); // opens a login page
```

@param url url path or global url
   *
   * In a second argument a list of request headers can be passed:
   *
   * ```js
   * I.amOnPage('/auth', [{'x-my-custom-header': 'some value'}])
   * ```
   */
  amOnPage(url, headers) {
    if (url.indexOf('http') !== 0) {
      url = this.options.url + url;
    }
    return this.browser.goto(url, headers).then((res) => {
      this.debugSection('URL', res.url);
      this.debugSection('Code', res.code);
      this.debugSection('Headers', JSON.stringify(res.headers));
    });
  }

  /**
   * Checks that title contains text.

@param text
   */
  seeInTitle(text) {
    return this.browser.title().then((title) => stringIncludes('web page title').assert(text, title));
  }

  /**
   * Checks that title does not contain text.

@param text
   */
  dontSeeInTitle(text) {
    return this.browser.title().then((title) => stringIncludes('web page title').negate(text, title));
  }

  /**
   * Retrieves a page title and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let title = yield I.grabTitle();
```
   */
  grabTitle() {
    return this.browser.title();
  }

  /**
   * Checks that current url contains a provided fragment.

```js
I.seeInCurrentUrl('/register'); // we are on registration page
```
@param url
   */
  seeInCurrentUrl(url) {
    return this.browser.url().then(function (currentUrl) {
      return stringIncludes('url').assert(url, currentUrl);
    });
  }

  /**
   * Checks that current url does not contain a provided fragment.

@param url
   */
  dontSeeInCurrentUrl(url) {
    return this.browser.url().then(function (currentUrl) {
      return stringIncludes('url').negate(url, currentUrl);
    });
  }

  /**
   * Checks that current url is equal to provided one.
If a relative url provided, a configured url will be prepended to it.
So both examples will work:

```js
I.seeCurrentUrlEquals('/register');
I.seeCurrentUrlEquals('http://my.site.com/register');
```
@param url
   */
  seeCurrentUrlEquals(url) {
    return this.browser.url().then((currentUrl) => {
      return urlEquals(this.options.url).assert(url, currentUrl);
    });
  }

  /**
   * Checks that current url is not equal to provided one.
If a relative url provided, a configured url will be prepended to it.

@param url
   */
  dontSeeCurrentUrlEquals(url) {
    return this.browser.url().then((currentUrl) => {
      return urlEquals(this.options.url).negate(url, currentUrl);
    });
  }

  /**
   * Checks that a page contains a visible text.
Use context parameter to narrow down the search.

```js
I.see('Welcome'); // text welcome on a page
I.see('Welcome', '.content'); // text inside .content div
I.see('Register', {css: 'form.register'}); // use strict locator
```
@param text expected on page
@param context (optional) element located by CSS|Xpath|strict locator in which to search for text
   */
  see(text, context) {
    return proceedSee.call(this, 'assert', text, context);
  }

  /**
   * Opposite to `see`. Checks that a text is not present on a page.
Use context parameter to narrow down the search.

```js
I.dontSee('Login'); // assume we are already logged in
```
@param text is not present
@param context (optional) element located by CSS|XPath|strict locator in which to perfrom search
   */
  dontSee(text, context) {
    return proceedSee.call(this, 'negate', text, context);
  }

  /**
   * Checks that a given Element is visible
Element is located by CSS or XPath.

```js
I.seeElement('#modal');
```
@param locator located by CSS|XPath|strict locator
   */
  seeElement(locator) {
    locator = guessLocator(locator) || { css: locator};
    return this.browser.evaluate(function (by, locator) {
      return codeceptjs.findElements(by, locator).filter((e) => e.offsetParent !== null).length;
    }, lctype(locator), lcval(locator)).then((num) => {
      return equals('number of elements on a page').negate(0, num);
    });
  }

  /**
   * Opposite to `seeElement`. Checks that element is not visible

@param locator located by CSS|XPath|Strict locator
   */
  dontSeeElement(locator) {
    locator = guessLocator(locator) || { css: locator};
    return this.browser.evaluate(function (by, locator) {
      return codeceptjs.findElements(by, locator).filter((e) => e.offsetParent !== null).length;
    }, lctype(locator), lcval(locator)).then((num) => {
      return equals('number of elements on a page').assert(0, num);
    });
  }

  /**
   * Checks that a given Element is present in the DOM
Element is located by CSS or XPath.

```js
I.seeElementInDOM('#modal');
```
@param locator located by CSS|XPath|strict locator
   */
  seeElementInDOM(locator) {
    return this.browser.findElements(guessLocator(locator) || {css: locator}).then((els) => {
      return empty('elements').negate(els.fill('ELEMENT'));
    });
  }

  /**
   * Opposite to `seeElementInDOM`. Checks that element is not on page.

@param locator located by CSS|XPath|Strict locator
   */
  dontSeeElementInDOM(locator) {
    return this.browser.findElements(guessLocator(locator) || {css: locator}).then((els) => {
      return empty('elements').assert(els.fill('ELEMENT'));
    });
  }

  /**
   * Checks that the current page contains the given string in its raw source code.

```js
I.seeInSource('<h1>Green eggs &amp; ham</h1>');
```
@param text
   */
  seeInSource(text) {
    return this.browser.evaluate(function () {
      return document.documentElement.outerHTML;
    }).then((source) => {
      return stringIncludes('HTML source of a page').assert(text, source);
    });
  }

  /**
   * Checks that the current page contains the given string in its raw source code

@param text
   */
  dontSeeInSource(text) {
    return this.browser.evaluate(function () {
      return document.documentElement.outerHTML;
    }).then((source) => {
      return stringIncludes('HTML source of a page').negate(text, source);
    });
  }


  /**
   * Perform a click on a link or a button, given by a locator.
If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
For images, the "alt" attribute and inner text of any parent links are searched.

The second parameter is a context (CSS or XPath locator) to narrow the search.

```js
// simple link
I.click('Logout');
// button of form
I.click('Submit');
// CSS button
I.click('#form input[type=submit]');
// XPath
I.click('//form/*[@type=submit]');
// link in context
I.click('Logout', '#nav');
// using strict locator
I.click({css: 'nav a.login'});
```
@param locator clickable link or button located by text, or any element located by CSS|XPath|strict locator
@param context (optional) element to search in CSS|XPath|Strict locator
   */
  click(locator, context) {
    if (context) {
      context = guessLocator(context) || {css: context};
    }
    return co(findClickable.call(this, locator, context)).then((el) => {
      if (el === null) throw new Error(`Clickable element "${locator}" not found by name|text|title|CSS|XPath`);
      return this.browser.evaluate(function (el) {
        return window.codeceptjs.clickEl(el);
      }, el).wait(this.options.waitForAction); // wait for click event to happen
    });
  }

  /**
   * Performs a double-click on an element matched by link|button|label|CSS or XPath.
Context can be specified as second parameter to narrow search.

```js
I.doubleClick('Edit');
I.doubleClick('Edit', '.actions');
I.doubleClick({css: 'button.accept'});
I.doubleClick('.btn.edit');
```

@param locator
@param context
   */
  doubleClick(locator, context) {
    if (context) {
      context = guessLocator(context) || {css: context};
    }
    return co(findClickable.call(this, locator, context)).then((el) => {
      if (el === null) throw new Error(`Clickable element "${locator}" not found by name|text|title|CSS|XPath`);
      return this.browser.evaluate(function (el) {
        return window.codeceptjs.doubleClickEl(el);
      }, el).wait(this.options.waitForAction); // wait for click event to happen
    });
  }

  /**
   * Moves cursor to element matched by locator.
Extra shift can be set with offsetX and offsetY options

```js
I.moveCursorTo('.tooltip');
I.moveCursorTo('#submit', 5,5);
```

   */
  moveCursorTo(locator, offsetX, offsetY) {
    return this.browser.findElement(guessLocator(locator) || { css: locator}).then((el) => {
      if (el === null) throw new Error(`Element ${locator} not found`);
      return this.browser.evaluate(function (el, x, y) {
        return window.codeceptjs.hoverEl(el, x, y);
      }, el, offsetX, offsetY).wait(this.options.waitForAction); // wait for hover event to happen
    });
  }


  /**
   * Executes sync script on a page.
Pass arguments to function as additional parameters.
Will return execution result to a test.
In this case you should use generator and yield to receive results.

Example with jQuery DatePicker:

```js
// change date of jQuery DatePicker
I.executeScript(function() {
  // now we are inside browser context
  $('date').datetimepicker('setDate', new Date());
});
```
Can return values. Don't forget to use `yield` to get them.

```js
let date = yield I.executeScript(function(el) {
  // only basic types can be returned
  return $(el).datetimepicker('getDate').toString();
}, '#date'); // passing jquery selector
```

@param fn function to be executed in browser context
@param ...args args to be passed to function

   *
   * Wrapper for synchronous [evaluate](https://github.com/segmentio/nightmare#evaluatefn-arg1-arg2)
   */
  executeScript(fn) {
    return this.browser.evaluate.apply(this.browser, arguments);
  }

  /**
   * Executes async script on page.
Provided function should execute a passed callback (as first argument) to signal it is finished.

Example: In Vue.js to make components completely rendered we are waiting for [nextTick](https://vuejs.org/v2/api/#Vue-nextTick).

```js
I.executeAsyncScript(function(done) {
  Vue.nextTick(done); // waiting for next tick
});
```

By passing value to `done()` function you can return values.
Additional arguments can be passed as well, while `done` function is always last parameter in arguments list.

```js
let val = yield I.executeAsyncScript(function(url, done) {
 // in browser context
 $.ajax(url, { success: (data) => done(data); }
}, 'http://ajax.callback.url/');
```

@param fn function to be executed in browser context
@param ...args args to be passed to function
   *
   * Wrapper for asynchronous [evaluate](https://github.com/segmentio/nightmare#evaluatefn-arg1-arg2).
   * Unlike NightmareJS implementation calling `done` will return its first argument.
   */
  executeAsyncScript(fn) {
    return this.browser.evaluate.apply(this.browser, arguments)
      .catch((err) => err); // Nightmare's first argument is error :(
  }

  /**
   * Resize the current window to provided width and height.
First parameter can be set to `maximize`

@param width or `maximize`
@param height
   */
  resizeWindow(width, height) {
    if (width === 'maximize') {
      throw new Error(`Nightmare doesn't support resizeWindow to maximum!`);
    }
    return this.browser.viewport(width, height);
  }

  /**
   * Selects a checkbox or radio button.
Element is located by label or name or CSS or XPath.

The second parameter is a context (CSS or XPath locator) to narrow the search.

```js
I.checkOption('#agree');
I.checkOption('I Agree to Terms and Conditions');
I.checkOption('agree', '//form');
```
@param field checkbox located by label | name | CSS | XPath | strict locator
@param context (optional) element located by CSS | XPath | strict locator
   */
  checkOption(field, context) {
    if (context) {
      context = guessLocator(context) || {css: context};
    }
    return co(findCheckable.call(this, field, context)).then((els) => {
      if (!els.length) {
        throw new Error(`Option ${field} not found by name|text|CSS|XPath`);
      }
      return this.browser.evaluate(function (els) {
        window.codeceptjs.checkEl(els[0]);
      }, els);
    });
  }

  /**
   * Fills a text field or textarea, after clearing its value, with the given string.
Field is located by name, label, CSS, or XPath.

```js
// by label
I.fillField('Email', 'hello@world.com');
// by name
I.fillField('password', '123456');
// by CSS
I.fillField('form#login input[name=username]', 'John');
// or by strict locator
I.fillField({css: 'form#login input[name=username]'}, 'John');
```
@param field located by label|name|CSS|XPath|strict locator
@param value

   */
  fillField(field, value) {
    return co(findFields(this.browser, field)).then((els) => {
      if (!els.length) {
        throw new Error(`Field ${field} not found by name|text|CSS|XPath`);
      }
      return this.browser.enterText(els[0], value, true);
    });
  }

  /**
   * Clears a `<textarea>` or text `<input>` element's value.

```js
I.clearField('Email');
I.clearField('user[email]');
I.clearField('#email');
```
@param field located by label|name|CSS|XPath|strict locator
   */
  clearField(field) {
    return this.fillField(field, '');
  }

  /**
   * Appends text to a input field or textarea.
Field is located by name, label, CSS or XPath

```js
I.appendField('#myTextField', 'appended');
```
@param field located by label|name|CSS|XPath|strict locator
@param value text value
   */
  appendField(field, value) {
    return co(findFields(this.browser, field)).then((els) => {
      if (!els.length) {
        throw new Error(`Field ${field} not found by name|text|CSS|XPath`);
      }
      return this.browser.enterText(els[0], value, false);
    });
  }

  /**
   * Checks that the given input field or textarea equals to given value.
For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.

```js
I.seeInField('Username', 'davert');
I.seeInField({css: 'form textarea'},'Type your comment here');
I.seeInField('form input[type=hidden]','hidden_value');
I.seeInField('#searchform input','Search');
```
@param field located by label|name|CSS|XPath|strict locator
@param value
   */
  seeInField(field, value) {
    return co.wrap(proceedSeeInField).call(this, 'assert', field, value);
  }

  /**
   * Checks that value of input field or textare doesn't equal to given value
Opposite to `seeInField`.

@param field located by label|name|CSS|XPath|strict locator
@param value is not expected to be a field value
   */
  dontSeeInField(field, value) {
    return co.wrap(proceedSeeInField).call(this, 'negate', field, value);
  }

  /**
   * Sends [input event](http://electron.atom.io/docs/api/web-contents/#webcontentssendinputeventevent) on a page.
   * Can submit special keys like 'Enter', 'Backspace', etc
   */
  pressKey(key) {
    if (Array.isArray(key)) {
      key = key.join('+'); // should work with accelerators...
    }
    if (Object.keys(specialKeys).indexOf(key) >= 0) {
      key = specialKeys[key];
    }
    return this.browser.pressKey(key).wait(this.options.waitForAction);
  }

  /**
   * Verifies that the specified checkbox is checked.

```js
I.seeCheckboxIsChecked('Agree');
I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
```
@param field located by label|name|CSS|XPath|strict locator
   */
  seeCheckboxIsChecked(field) {
    return co.wrap(proceedIsChecked).call(this, 'assert', field);
  }

  /**
   * Verifies that the specified checkbox is not checked.

@param field located by label|name|CSS|XPath|strict locator

   */
  dontSeeCheckboxIsChecked(field) {
    return co.wrap(proceedIsChecked).call(this, 'negate', field);
  }

  /**
   * Attaches a file to element located by label, name, CSS or XPath
Path to file is relative current codecept directory (where codecept.json is located).
File will be uploaded to remote system (if tests are running remotely).

```js
I.attachFile('Avatar', 'data/avatar.jpg');
I.attachFile('form input[name=avatar]', 'data/avatar.jpg');
```
@param locator field located by label|name|CSS|XPath|strict locator
@param pathToFile local file path relative to codecept.json config file

   *
   * ##### Limitations:
   *
   * * works only with CSS selectors.
   * * doesn't work if the Chromium DevTools panel is open (as Chromium allows only one attachment to the debugger at a time. [See more](https://github.com/rosshinkley/nightmare-upload#important-note-about-setting-file-upload-inputs))
   */
  attachFile(locator, pathToFile) {
    let file = path.join(global.codecept_dir, pathToFile);

    if (!isCSS(locator)) {
      throw new Error(`Only CSS locator allowed for attachFile in Nightmare helper`);
    }

    if (!fileExists(file)) {
      throw new Error(`File at ${file} can not be found on local system`);
    }
    return this.browser.upload(locator, file);
  }

  /**
   * Retrieves a text from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let pin = yield I.grabTextFrom('#pin');
```
@param locator element located by CSS|XPath|strict locator
   */
  grabTextFrom(locator) {
    return this.browser.findElement(guessLocator(locator) || { css: locator}).then((el) => {
      return this.browser.evaluate(function (el) {
        return codeceptjs.fetchElement(el).innerText;
      }, el);
    });
  }

  /**
   * Retrieves a value from a form element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let email = yield I.grabValueFrom('input[name=email]');
```
@param locator field located by label|name|CSS|XPath|strict locator
   */
  grabValueFrom(locator) {
    return co(findFields(this.browser, locator)).then((els) => {
      if (!els.length) {
        throw new Error(`Field ${locator} was not located by name|label|CSS|XPath`);
      }
      return this.browser.evaluate(function (el) {
        return codeceptjs.fetchElement(el).value;
      }, els[0]);
    });
  }

  /**
   * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let hint = yield I.grabAttributeFrom('#tooltip', 'title');
```
@param locator element located by CSS|XPath|strict locator
@param attr
   */
  grabAttributeFrom(locator, attr) {
    return this.browser.findElement(guessLocator(locator) || { css: locator}).then((el) => {
      return this.browser.evaluate(function (el, attr) {
        return codeceptjs.fetchElement(el).getAttribute(attr);
      }, el, attr);
    });
  }


  _injectClientScripts() {
    return this.browser.inject('js', path.join(__dirname, 'clientscripts', 'nightmare.js'));
  }

  /**
   * Selects an option in a drop-down select.
Field is searched by label | name | CSS | XPath.
Option is selected by visible text or by value.

```js
I.selectOption('Choose Plan', 'Monthly'); // select by label
I.selectOption('subscription', 'Monthly'); // match option by text
I.selectOption('subscription', '0'); // or by value
I.selectOption('//form/select[@name=account]','Premium');
I.selectOption('form select[name=account]', 'Premium');
I.selectOption({css: 'form select[name=account]'}, 'Premium');
```

Provide an array for the second argument to select multiple options.

```js
I.selectOption('Which OS do you use?', ['Android', 'iOS']);
```
@param select field located by label|name|CSS|XPath|strict locator
@param option

   */
  selectOption(select, option) {
    let fetchAndCheckOption = function (el, locator) {
      el = codeceptjs.fetchElement(el);
      let found = document.evaluate(locator, el, null, 5);
      var current = null;
      var items = [];
      while (current = found.iterateNext()) {
        items.push(current);
      }
      for (var i = 0; i < items.length; items++) {
        current = items[i];
        current.selected = true;
        var event = document.createEvent('HTMLEvents');
        if (!el.multiple) el.value = current.value;
        event.initEvent('change', true, true);
        el.dispatchEvent(event);
      }
      return !!current;
    };
    let browser = this.browser;
    return co(findFields(this.browser, select)).then(co.wrap(function*(fields) {
      if (!fields.length) {
        throw new Error(`Selectable field ${select} not found by name|text|CSS|XPath`);
      }
      if (!Array.isArray(option)) {
        option = [option];
      }
      let field = fields[0];
      let promises = [];
      for (let key in option) {
        let opt = option[key];
        let normalizedText = `[normalize-space(.) = "${opt.trim() }"]`;
        let byVisibleText = `./option${normalizedText}|./optgroup/option${normalizedText}`;

        let checked = yield browser.evaluate(fetchAndCheckOption, field, byVisibleText);

        if (!checked) {
          let normalizedValue = `[normalize-space(@value) = "${opt.trim() }"]`;
          let byValue = `./option${normalizedValue}|./optgroup/option${normalizedValue}`;
          yield browser.evaluate(fetchAndCheckOption, field, byValue);
        }
      }
    }));
  }

  /**
   * Sets a cookie

```js
I.setCookie({name: 'auth', value: true});
```
@param cookie
   *
   * Wrapper for `.cookies.set(cookie)`.
   * [See more](https://github.com/segmentio/nightmare/blob/master/Readme.md#cookiessetcookie)
   */
  setCookie(cookie) {
    return this.browser.cookies.set(cookie);
  }

  /**
   * Checks that cookie with given name exists.

```js
I.seeCookie('Auth');
```
@param name
   *
   */
  seeCookie(name) {
    return this.browser.cookies.get(name).then(function (res) {
      return truth('cookie ' + name, 'to be set').assert(res);
    });
  }

  /**
   * Checks that cookie with given name does not exist.

@param name
   */
  dontSeeCookie(name) {
    return this.browser.cookies.get(name).then(function (res) {
      return truth('cookie ' + name, 'to be set').negate(res);
    });
  }

  /**
   * Gets a cookie object by name
* Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let cookie = I.grabCookie('auth');
assert(cookie.value, '123456');
```
@param name
   *
   * Returns cookie in JSON format. If name not passed returns all cookies for this domain.
   *
   * Multiple cookies can be received by passing query object:
   *
   * ```js
   * I.grabCookie({ secure: true});
   * ```
   *
   * If you'd like get all cookies for all urls, use: `.grabCookie({ url: null }).`
   */
  grabCookie(name) {
    return this.browser.cookies.get(name);
  }

  /**
   * Clears a cookie by name,
if none provided clears all cookies

```js
I.clearCookie();
I.clearCookie('test');
```
@param cookie (optional)
   */
  clearCookie(cookie) {
    if (!cookie) {
      return this.browser.cookies.clearAll();
    }
    return this.browser.cookies.clear(cookie);
  }

  /**
   * Pauses execution for a number of seconds.

```js
I.wait(2); // wait 2 secs
```

@param sec
   */
  wait(sec) {
    return new Promise(function (done) {
      setTimeout(done, sec * 1000);
    });
  }

  /**
   * Waits for a text to appear (by default waits for 1sec).
Element can be located by CSS or XPath.
Narrow down search results by providing context.

```js
I.waitForText('Thank you, form has been submitted');
I.waitForText('Thank you, form has been submitted', 5, '#modal');
```

@param text to wait for
@param sec seconds to wait
@param context element located by CSS|XPath|strict locator
   */
  waitForText(text, sec, context) {
    if (!context) {
      context = this.context;
    }
    let locator = guessLocator(context) || { css: context};
    this.browser.options.waitTimeout = sec * 1000 || this.options.waitForTimeout;

    return this.browser.wait(function (by, locator, text) {
      return codeceptjs.findElement(by, locator).innerText.indexOf(text) > -1;
    }, lctype(locator), lcval(locator), text);
  }

  /**
   * Waits for an element to become visible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

```
I.waitForVisible('#popup');
```

@param locator element located by CSS|XPath|strict locator
@param sec time seconds to wait, 1 by default
   */
  waitForVisible(locator, sec) {
    this.browser.options.waitTimeout = sec * 1000 || this.options.waitForTimeout;
    locator = guessLocator(locator) || { css: locator};

    return this.browser.wait(function (by, locator) {
      var el = codeceptjs.findElement(by, locator);
      if (!el) return false;
      return el.offsetParent !== null;
    }, lctype(locator), lcval(locator));
  }

  /**
   * Waits for element to be present on page (by default waits for 1sec).
Element can be located by CSS or XPath.

```js
I.waitForElement('.btn.continue');
I.waitForElement('.btn.continue', 5); // wait for 5 secs
```

@param locator element located by CSS|XPath|strict locator
@param sec time seconds to wait, 1 by default
   */
  waitForElement(locator, sec) {
    this.browser.options.waitTimeout = sec * 1000 || this.options.waitForTimeout;
    locator = guessLocator(locator) || { css: locator};

    return this.browser.wait(function (by, locator) {
      return codeceptjs.findElement(by, locator) !== null;
    }, lctype(locator), lcval(locator));
  }

    /**
     * Saves a screenshot to ouput folder (set in codecept.json).
Filename is relative to output folder. 
Optionally resize the window to the full available page `scrollHeight` and `scrollWidth` to capture the entire page by passing `true` in as the second argument.

```js
I.saveScreenshot('debug.png');
I.saveScreenshot('debug.png',true) \\resizes to available scrollHeight and scrollWidth before taking screenshot
```
@param fileName
@param fullPage (optional)
     */
  saveScreenshot(fileName, fullPage = false) {
    let outputFile = path.join(global.output_dir, fileName);
    this.debug('Screenshot is saving to ' + outputFile);
    let recorder = require('../recorder');

    if (!fullPage) {
      return this.browser.screenshot(outputFile);
    }
    return this.browser.evaluate(() => ({
      height: document.body.scrollHeight,
      width: document.body.scrollWidth
    })).then(({
        width,
        height
      }) => {
      this.browser.viewport(width, height);
      return this.browser.screenshot(outputFile);
    });
  }

  _failed(test) {
    let fileName = test.title.replace(/\W/g, '_') + '.failed.png';
    return this.saveScreenshot(fileName, true);
  }

  /**
   * Scrolls to element matched by locator.
   * Extra shift can be set with offsetX and offsetY options
   *
   * ```js
   * I.scrollTo('footer');
   * I.scrollTo('#submit', 5,5);
   * ```
   */
  scrollTo(locator, offsetX, offsetY) {
    locator = guessLocator(locator) || {css: locator};
    return this.browser.evaluate(function (by, locator, offsetX, offsetY) {
      let el = codeceptjs.findElement(by, locator);
      if (!el) throw new Error(`Element not found ${by}: ${locator}`);
      let rect = el.getBoundingClientRect();
      window.scrollTo(rect.left + offsetX, rect.top + offsetY);
    }, lctype(locator), lcval(locator), offsetX, offsetY);
  }

}

module.exports = Nightmare;

function proceedSee(assertType, text, context) {
  let description, locator;
  if (!context) {
    locator = guessLocator(this.context) || {css: this.context};
    if (this.context === this.options.rootElement) {
      description = 'web application';
    } else {
      description = 'current context ' + this.context; [];
    }
  } else {
    locator = guessLocator(context) || {css: context};
    description = 'element ' + context;
  }

  return this.browser.evaluate(function (by, locator) {
    return codeceptjs.findElements(by, locator).map((el) => el.innerText);
  }, lctype(locator), lcval(locator)).then(function (texts) {
    let allText = texts.join(' | ');
    return stringIncludes(description)[assertType](text, allText);
  });
}

function *proceedSeeInField(assertType, field, value) {
  let els = yield co(findFields(this.browser, field));
  if (!els.length) {
    throw new Error(`Field ${field} not found by name|text|CSS|XPath`);
  }
  let el = els[0];
  let tag = yield this.browser.evaluate(function (el) {
    return codeceptjs.fetchElement(el).tagName;
  }, el);
  let fieldVal = yield this.browser.evaluate(function (el) {
    return codeceptjs.fetchElement(el).value;
  }
  , el);
  if (tag == 'select') {
    // locate option by values and check them
    let text = yield this.browser.evaluate(function (el, val) {
      return el.querySelector(`option[value="${val}"]`).innerText;
    }, el, xpathLocator.literal(fieldVal));
    return equals('select option by ' + field)[assertType](value, text);
  }
  return stringIncludes('field by ' + field)[assertType](value, fieldVal);
}

function *proceedIsChecked(assertType, option) {
  let els = yield co(findCheckable.call(this, option));
  if (!els.length) {
    throw new Error(`Option ${option} not found by name|text|CSS|XPath`);
  }
  let selected = yield this.browser.evaluate(function (els) {
    return els.map((el) => codeceptjs.fetchElement(el).checked)
      .reduce((prev, cur) => prev || cur);
  }, els);

  return truth(`checkable ${option}`, 'to be checked')[assertType](selected);
}


function *findCheckable(locator, context) {
  let contextEl = null;
  if (context) {
    contextEl = yield this.browser.findElement(context);
  }

  let matchedLocator = guessLocator(locator);
  if (matchedLocator) {
    return this.browser.findElements(matchedLocator, contextEl);
  }

  let literal = xpathLocator.literal(locator);
  let byText = xpathLocator.combine([
    `.//input[@type = 'checkbox' or @type = 'radio'][(@id = //label[contains(normalize-space(string(.)), ${literal})]/@for) or @placeholder = ${literal}]`,
    `.//label[contains(normalize-space(string(.)), ${literal})]//input[@type = 'radio' or @type = 'checkbox']`
  ]);
  let els = yield this.browser.findElements({ xpath: byText}, contextEl);
  if (els.length) {
    return els;
  }
  let byName = `.//input[@type = 'checkbox' or @type = 'radio'][@name = ${literal}]`;
  els = yield this.browser.findElements({ xpath: byName}, contextEl);
  if (els.length) {
    return els;
  }
  return yield this.browser.findElements({ css: locator}, contextEl);
}

function *findClickable(locator, context) {
  let contextEl = null;
  if (context) {
    contextEl = yield this.browser.findElement(context);
  }

  let l = guessLocator(locator);
  if (guessLocator(locator)) {
    return this.browser.findElement(l, contextEl);
  }

  let literal = xpathLocator.literal(locator);

  let narrowLocator = xpathLocator.combine([
    `.//a[normalize-space(.)=${literal}]`,
    `.//button[normalize-space(.)=${literal}]`,
    `.//a/img[normalize-space(@alt)=${literal}]/ancestor::a`,
    `.//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][normalize-space(@value)=${literal}]`
  ]);
  let els = yield this.browser.findElements({xpath: narrowLocator}, contextEl);
  if (els.length) {
    return els[0];
  }

  let wideLocator = xpathLocator.combine([
    `.//a[./@href][((contains(normalize-space(string(.)), ${literal})) or .//img[contains(./@alt, ${literal})])]`,
    `.//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][contains(./@value, ${literal})]`,
    `.//input[./@type = 'image'][contains(./@alt, ${literal})]`,
    `.//button[contains(normalize-space(string(.)), ${literal})]`,
    `.//label[contains(normalize-space(string(.)), ${literal})]`,
    `.//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][./@name = ${literal}]`,
    `.//button[./@name = ${literal} or ./@title=${literal}]`,
  ]);

  els = yield this.browser.findElements({xpath: wideLocator}, contextEl);
  if (els.length) {
    return els[0];
  }

  if (isXPath(locator)) {
    return this.browser.findElement({xpath: locator}, contextEl);
  }
  return this.browser.findElement({css: locator}, contextEl);
}

function *findFields(client, locator) {
  let matchedLocator = guessLocator(locator);
  if (matchedLocator) {
    return client.findElements(matchedLocator);
  }
  let literal = xpathLocator.literal(locator);

  let byLabelEquals = xpathLocator.combine([
    `.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')][((./@name = ${literal}) or ./@id = //label[normalize-space(string(.)) = ${literal}]/@for or ./@placeholder = ${literal})]`,
    `.//label[normalize-space(string(.)) = ${literal}]//.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')]`
  ]);
  let els = yield client.findElements({ xpath: byLabelEquals});
  if (els.length) {
    return els;
  }

  let byLabelContains = xpathLocator.combine([
    `.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')][(((./@name = ${literal}) or ./@id = //label[contains(normalize-space(string(.)), ${literal})]/@for) or ./@placeholder = ${literal})]`,
    `.//label[contains(normalize-space(string(.)), ${literal})]//.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')]`
  ]);
  els = yield client.findElements({ xpath: byLabelContains});
  if (els.length) {
    return els;
  }
  let byName = `.//*[self::input | self::textarea | self::select][@name = ${literal}]`;
  els = yield client.findElements({ xpath: byName});
  if (els.length) {
    return els;
  }
  return yield client.findElements({ css: locator});
}


function guessLocator(locator) {
  if (typeof locator === 'object') {
    let key = Object.keys(locator)[0];
    let value = locator[key];
    locator.toString = () => `{${key}: '${value}'}`;
    return locator;
  }
  if (isCSS(locator)) {
    return { css: locator };
  }
  if (isXPath(locator)) {
    return { xpath: locator };
  }
}

function isCSS(locator) {
  return locator[0] === '#' || locator[0] === '.';
}

function isXPath(locator) {
  return locator.substr(0, 2) === '//' || locator.substr(0, 3) === './/';
}

function lctype(locator) {
  return Object.keys(locator)[0];
}

function lcval(locator) {
  return locator[Object.keys(locator)[0]];
}
