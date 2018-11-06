const requireg = require('requireg');
const Helper = require('../helper');
const stringIncludes = require('../assert/include').includes;
const urlEquals = require('../assert/equal').urlEquals;
const equals = require('../assert/equal').equals;
const empty = require('../assert/empty').empty;
const truth = require('../assert/truth').truth;
const xpathLocator = require('../utils').xpathLocator;
const fileExists = require('../utils').fileExists;
const clearString = require('../utils').clearString;
const Locator = require('../locator');
const path = require('path');
const ElementNotFound = require('./errors/ElementNotFound');
const urlResolve = require('url').resolve;

const specialKeys = {
  Backspace: '\u0008',
  Enter: '\u000d',
  Delete: '\u007f',
};

let withinStatus = false;

/**
 * Nightmare helper wraps [Nightmare](https://github.com/segmentio/nightmare) library to provide
 * fastest headless testing using Electron engine. Unlike Selenium-based drivers this uses
 * Chromium-based browser with Electron with lots of client side scripts, thus should be less stable and
 * less trusted.
 *
 * Requires `nightmare` package to be installed.
 *
 * ## Configuration
 *
 * This helper should be configured in codecept.json
 *
 * * `url` - base url of website to be tested
 * * `restart` (optional, default: true) - restart browser between tests.
 * * `disableScreenshots` (optional, default: false)  - don't save screenshot on failure.
 * * `uniqueScreenshotNames` (optional, default: false)  - option to prevent screenshot override if you have scenarios with the same name in different suites.
 * * `fullPageScreenshots` (optional, default: false) - make full page screenshots on failure.
 * * `keepBrowserState` (optional, default: false)  - keep browser state between tests when `restart` set to false.
 * * `keepCookies` (optional, default: false)  - keep cookies between tests when `restart` set to false.
 * * `waitForAction`: (optional) how long to wait after click, doubleClick or PressKey actions in ms. Default: 500.
 * * `waitForTimeout`: (optional) default wait* timeout in ms. Default: 1000.
 * * `windowSize`: (optional) default window size. Set a dimension like `640x480`.
 *
 * + options from [Nightmare configuration](https://github.com/segmentio/nightmare#api)
 *
 */
class Nightmare extends Helper {
  constructor(config) {
    super(config);

    this.isRunning = false;

    // override defaults with config
    this._setConfig(config);
  }

  _validateConfig(config) {
    const defaults = {
      waitForAction: 500,
      waitForTimeout: 1000,
      fullPageScreenshots: false,
      disableScreenshots: false,
      uniqueScreenshotNames: false,
      rootElement: 'body',
      restart: true,
      keepBrowserState: false,
      keepCookies: false,
      js_errors: null,
      enableHAR: false,
    };

    return Object.assign(defaults, config);
  }

  static _config() {
    return [
      { name: 'url', message: 'Base url of site to be tested', default: 'http://localhost' },
    ];
  }

  static _checkRequirements() {
    try {
      requireg('nightmare');
    } catch (e) {
      return ['nightmare'];
    }
  }

  async _init() {
    this.Nightmare = requireg('nightmare');

    if (this.options.enableHAR) {
      require('nightmare-har-plugin').install(this.Nightmare);
    }

    this.Nightmare.action('findElements', function (locator, contextEl, done) {
      if (!done) {
        done = contextEl;
        contextEl = null;
      }

      const by = Object.keys(locator)[0];
      const value = locator[by];

      this.evaluate_now((by, locator, contextEl) => window.codeceptjs.findAndStoreElements(by, locator, contextEl), done, by, value, contextEl);
    });

    this.Nightmare.action('findElement', function (locator, contextEl, done) {
      if (!done) {
        done = contextEl;
        contextEl = null;
      }

      const by = Object.keys(locator)[0];
      const value = locator[by];

      this.evaluate_now((by, locator, contextEl) => {
        const res = window.codeceptjs.findAndStoreElement(by, locator, contextEl);
        if (res === null) {
          throw new Error(`Element ${locator} couldn't be located by ${by}`);
        }
        return res;
      }, done, by, value, contextEl);
    });

    this.Nightmare.action('asyncScript', function () {
      let args = Array.prototype.slice.call(arguments);
      const done = args.pop();
      args = args.splice(1, 0, done);
      this.evaluate_now.apply(this, args);
    });

    this.Nightmare.action('enterText', function (el, text, clean, done) {
      const child = this.child;
      const typeFn = () => child.call('type', text, done);

      this.evaluate_now((el, clean) => {
        const element = window.codeceptjs.fetchElement(el);
        if (clean) element.value = '';
        element.focus();
      }, () => {
        if (clean) return typeFn();
        child.call('pressKey', 'End', typeFn); // type End before
      }, el, clean);
    });

    this.Nightmare.action('pressKey', (ns, options, parent, win, renderer, done) => {
      parent.respondTo('pressKey', (ch, done) => {
        win.webContents.sendInputEvent({
          type: 'keyDown',
          keyCode: ch,
        });

        win.webContents.sendInputEvent({
          type: 'char',
          keyCode: ch,
        });

        win.webContents.sendInputEvent({
          type: 'keyUp',
          keyCode: ch,
        });
        done();
      });
      done();
    }, function (key, done) {
      this.child.call('pressKey', key, done);
    });

    this.Nightmare.action('triggerMouseEvent', (ns, options, parent, win, renderer, done) => {
      parent.respondTo('triggerMouseEvent', (evt, done) => {
        win.webContents.sendInputEvent(evt);
        done();
      });
      done();
    }, function (event, done) {
      this.child.call('triggerMouseEvent', event, done);
    });

    this.Nightmare.action(
      'upload',
      (ns, options, parent, win, renderer, done) => {
        parent.respondTo('upload', (selector, pathsToUpload, done) => {
          parent.emit('log', 'paths', pathsToUpload);
          try {
          // attach the debugger
          // NOTE: this will fail if devtools is open
            win.webContents.debugger.attach('1.1');
          } catch (e) {
            parent.emit('log', 'problem attaching', e);
            return done(e);
          }

          win.webContents.debugger.sendCommand('DOM.getDocument', {}, (err, domDocument) => {
            win.webContents.debugger.sendCommand('DOM.querySelector', {
              nodeId: domDocument.root.nodeId,
              selector,
            }, (err, queryResult) => {
            // HACK: chromium errors appear to be unpopulated objects?
              if (Object.keys(err)
                .length > 0) {
                parent.emit('log', 'problem selecting', err);
                return done(err);
              }
              win.webContents.debugger.sendCommand('DOM.setFileInputFiles', {
                nodeId: queryResult.nodeId,
                files: pathsToUpload,
              }, (err, setFileResult) => {
                if (Object.keys(err)
                  .length > 0) {
                  parent.emit('log', 'problem setting input', err);
                  return done(err);
                }
                win.webContents.debugger.detach();
                done(null, pathsToUpload);
              });
            });
          });
        });
        done();
      },
      function (selector, pathsToUpload, done) {
        if (!Array.isArray(pathsToUpload)) {
          pathsToUpload = [pathsToUpload];
        }
        this.child.call('upload', selector, pathsToUpload, (err, stuff) => {
          done(err, stuff);
        });
      },
    );

    return Promise.resolve();
  }

  async _beforeSuite() {
    if (!this.options.restart && !this.isRunning) {
      this.debugSection('Session', 'Starting singleton browser session');
      return this._startBrowser();
    }
  }

  async _before() {
    if (this.options.restart) return this._startBrowser();
    if (!this.isRunning) return this._startBrowser();
    return this.browser;
  }

  async _after() {
    if (!this.isRunning) return;
    if (this.options.restart) {
      this.isRunning = false;
      return this._stopBrowser();
    }
    if (this.options.enableHAR) {
      await this.browser.resetHAR();
    }
    if (this.options.keepBrowserState) return;
    if (this.options.keepCookies) {
      await this.browser.cookies.clearAll();
    }
    this.debugSection('Session', 'cleaning up');
    return this.executeScript(() => localStorage.clear());
  }

  _afterSuite() {
  }

  _finishTest() {
    if (!this.options.restart && this.isRunning) {
      this._stopBrowser();
    }
  }

  async _startBrowser() {
    this.context = this.options.rootElement;
    if (this.options.enableHAR) {
      this.browser = this.Nightmare(Object.assign(require('nightmare-har-plugin').getDevtoolsOptions(), this.options));
      await this.browser;
      await this.browser.waitForDevtools();
    } else {
      this.browser = this.Nightmare(this.options);
      await this.browser;
    }
    await this.browser.goto('about:blank'); // Load a blank page so .saveScreenshot (/evaluate) will work
    this.isRunning = true;
    this.browser.on('dom-ready', () => this._injectClientScripts());
    this.browser.on('did-start-loading', () => this._injectClientScripts());
    this.browser.on('will-navigate', () => this._injectClientScripts());
    this.browser.on('console', (type, message) => {
      this.debug(`${type}: ${message}`);
    });

    if (this.options.windowSize) {
      const size = this.options.windowSize.split('x');
      return this.browser.viewport(parseInt(size[0], 10), parseInt(size[1], 10));
    }
  }

  /**
   * Get HAR
   *
   * ```js
   * let har = await I.grabHAR();
   * fs.writeFileSync('sample.har', JSON.stringify({log: har}));
   * ```
   */
  async grabHAR() {
    return this.browser.getHAR();
  }

  async saveHAR(fileName) {
    const outputFile = path.join(global.output_dir, fileName);
    this.debug(`HAR is saving to ${outputFile}`);

    await this.browser.getHAR().then((har) => {
      require('fs').writeFileSync(outputFile, JSON.stringify({ log: har }));
    });
  }

  async resetHAR() {
    await this.browser.resetHAR();
  }

  async _stopBrowser() {
    return this.browser.end().catch((error) => {
      this.debugSection('Error on End', error);
    });
  }

  async _withinBegin(locator) {
    this.context = locator;
    locator = new Locator(locator, 'css');
    withinStatus = true;
    return this.browser.evaluate((by, locator) => {
      const el = window.codeceptjs.findElement(by, locator);
      if (!el) throw new Error(`Element by ${by}: ${locator} not found`);
      window.codeceptjs.within = el;
    }, locator.type, locator.value);
  }

  _withinEnd() {
    this.context = this.options.rootElement;
    withinStatus = false;
    return this.browser.evaluate(() => {
      window.codeceptjs.within = null;
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
    locator = new Locator(locator, 'css');
    return this.browser.evaluate((by, locator) => {
      return window.codeceptjs.findAndStoreElements(by, locator);
    }, locator.type, locator.value);
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

@param url url path or global url.
   *
   * In a second argument a list of request headers can be passed:
   *
   * ```js
   * I.amOnPage('/auth', { 'x-my-custom-header': 'some value' })
   * ```
   */
  async amOnPage(url, headers = null) {
    if (url.indexOf('http') !== 0) {
      url = urlResolve(this.options.url, url);
    }
    const currentUrl = await this.browser.url();
    if (url === currentUrl) {
      // navigating to the same url will cause an error in nightmare, so don't do it
      return;
    }
    return this.browser.goto(url, headers).then((res) => {
      this.debugSection('URL', res.url);
      this.debugSection('Code', res.code);
      this.debugSection('Headers', JSON.stringify(res.headers));
    });
  }

  /**
   * Checks that title contains text.

@param text text value to check.
   */
  async seeInTitle(text) {
    const title = await this.browser.title();
    stringIncludes('web page title').assert(text, title);
  }

  /**
   * Checks that title does not contain text.

@param text text value to check.
   */
  async dontSeeInTitle(text) {
    const title = await this.browser.title();
    stringIncludes('web page title').negate(text, title);
  }

  /**
   * Retrieves a page title and returns it to test.
Resumes test execution, so **should be used inside async with `await`** operator.

```js
let title = await I.grabTitle();
```
   */
  async grabTitle() {
    return this.browser.title();
  }

  /**
   * Get current URL from browser.
Resumes test execution, so should be used inside an async function.

```js
let url = await I.grabCurrentUrl();
console.log(`Current URL is [${url}]`);
```
   */
  async grabCurrentUrl() {
    return this.browser.url();
  }

  /**
   * Checks that current url contains a provided fragment.

```js
I.seeInCurrentUrl('/register'); // we are on registration page
```

@param url value to check.
   */
  async seeInCurrentUrl(url) {
    const currentUrl = await this.browser.url();
    stringIncludes('url').assert(url, currentUrl);
  }

  /**
   * Checks that current url does not contain a provided fragment.

@param url value to check.
   */
  async dontSeeInCurrentUrl(url) {
    const currentUrl = await this.browser.url();
    stringIncludes('url').negate(url, currentUrl);
  }

  /**
   * Checks that current url is equal to provided one.
If a relative url provided, a configured url will be prepended to it.
So both examples will work:

```js
I.seeCurrentUrlEquals('/register');
I.seeCurrentUrlEquals('http://my.site.com/register');
```

@param url value to check.
   */
  async seeCurrentUrlEquals(url) {
    const currentUrl = await this.browser.url();
    urlEquals(this.options.url).assert(url, currentUrl);
  }

  /**
   * Checks that current url is not equal to provided one.
If a relative url provided, a configured url will be prepended to it.

@param url value to check.
   */
  async dontSeeCurrentUrlEquals(url) {
    const currentUrl = await this.browser.url();
    urlEquals(this.options.url).negate(url, currentUrl);
  }

  /**
   * Checks that a page contains a visible text.
Use context parameter to narrow down the search.

```js
I.see('Welcome'); // text welcome on a page
I.see('Welcome', '.content'); // text inside .content div
I.see('Register', {css: 'form.register'}); // use strict locator
```
@param text expected on page.
@param context (optional) element located by CSS|Xpath|strict locator in which to search for text.
   */
  async see(text, context = null) {
    return proceedSee.call(this, 'assert', text, context);
  }

  /**
   * Opposite to `see`. Checks that a text is not present on a page.
Use context parameter to narrow down the search.

```js
I.dontSee('Login'); // assume we are already logged in
```
@param text is not present.
@param context (optional) element located by CSS|XPath|strict locator in which to perfrom search.
   */
  dontSee(text, context = null) {
    return proceedSee.call(this, 'negate', text, context);
  }

  /**
   * Checks that a given Element is visible
Element is located by CSS or XPath.

```js
I.seeElement('#modal');
```
@param locator located by CSS|XPath|strict locator.
   */
  async seeElement(locator) {
    locator = new Locator(locator, 'css');
    const num = await this.browser.evaluate((by, locator) => {
      return window.codeceptjs.findElements(by, locator).filter(e => e.offsetWidth > 0 && e.offsetHeight > 0).length;
    }, locator.type, locator.value);
    equals('number of elements on a page').negate(0, num);
  }

  /**
   * Opposite to `seeElement`. Checks that element is not visible (or in DOM)

@param locator located by CSS|XPath|Strict locator.
   */
  async dontSeeElement(locator) {
    locator = new Locator(locator, 'css');
    locator = new Locator(locator, 'css');
    const num = await this.browser.evaluate((by, locator) => {
      return window.codeceptjs.findElements(by, locator).filter(e => e.offsetWidth > 0 && e.offsetHeight > 0).length;
    }, locator.type, locator.value);
    equals('number of elements on a page').assert(0, num);
  }

  /**
   * Checks that a given Element is present in the DOM
Element is located by CSS or XPath.

```js
I.seeElementInDOM('#modal');
```
@param locator located by CSS|XPath|strict locator.
   */
  async seeElementInDOM(locator) {
    locator = new Locator(locator, 'css');
    const els = await this.browser.findElements(locator.toStrict());
    empty('elements').negate(els.fill('ELEMENT'));
  }

  /**
   * Opposite to `seeElementInDOM`. Checks that element is not on page.

@param locator located by CSS|XPath|Strict locator.
   */
  async dontSeeElementInDOM(locator) {
    locator = new Locator(locator, 'css');
    const els = await this.browser.findElements(locator.toStrict());
    empty('elements').assert(els.fill('ELEMENT'));
  }

  /**
   * Checks that the current page contains the given string in its raw source code.

```js
I.seeInSource('<h1>Green eggs &amp; ham</h1>');
```
@param text value to check.
   */
  async seeInSource(text) {
    const source = await this.browser.evaluate(() => document.documentElement.outerHTML);
    stringIncludes('HTML source of a page').assert(text, source);
  }

  /**
   * Checks that the current page contains the given string in its raw source code.

@param text value to check.
   */
  async dontSeeInSource(text) {
    const source = await this.browser.evaluate(() => document.documentElement.outerHTML);
    stringIncludes('HTML source of a page').negate(text, source);
  }

  /**
   * asserts that an element appears a given number of times in the DOM
   * Element is located by label or name or CSS or XPath.
   *
   * ```js
   * I.seeNumberOfElements('#submitBtn', 1);
   * ```
   */
  async seeNumberOfElements(selector, num) {
    const elements = await this._locate(selector);
    return equals(`expected number of elements (${selector}) is ${num}, but found ${elements.length}`).assert(elements.length, num);
  }

  /**
   * Asserts that an element is visible a given number of times.
Element is located by CSS or XPath.

```js
I.seeNumberOfVisibleElements('.buttons', 3);
```

@param locator element located by CSS|XPath|strict locator.
@param num number of elements.
   */
  async seeNumberOfVisibleElements(locator, num) {
    const res = await this.grabNumberOfVisibleElements(locator);
    return equals(`expected number of visible elements (${locator}) is ${num}, but found ${res}`).assert(res, num);
  }

  /**
   * Grab number of visible elements by locator.

```js
I.grabNumberOfVisibleElements('p');
```

@param locator located by CSS|XPath|strict locator.
   */
  async grabNumberOfVisibleElements(locator) {
    locator = new Locator(locator, 'css');

    const num = await this.browser.evaluate((by, locator) => {
      return window.codeceptjs.findElements(by, locator)
        .filter(e => e.offsetWidth > 0 && e.offsetHeight > 0).length;
    }, locator.type, locator.value);

    return num;
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

@param locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
@param context (optional) element to search in CSS|XPath|Strict locator.
   */
  async click(locator, context = null) {
    const el = await findClickable.call(this, locator, context);
    assertElementExists(el, locator, 'Clickable');
    return this.browser.evaluate(el => window.codeceptjs.clickEl(el), el)
      .wait(this.options.waitForAction);
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

@param locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
@param context (optional) element to search in CSS|XPath|Strict locator.
   */
  async doubleClick(locator, context = null) {
    const el = await findClickable.call(this, locator, context);
    assertElementExists(el, locator, 'Clickable');
    return this.browser.evaluate(el => window.codeceptjs.doubleClickEl(el), el)
      .wait(this.options.waitForAction);
  }

  /**
   * Moves cursor to element matched by locator.
Extra shift can be set with offsetX and offsetY options.

```js
I.moveCursorTo('.tooltip');
I.moveCursorTo('#submit', 5,5);
```

@param locator located by CSS|XPath|strict locator.
@param offsetX (optional) X-axis offset.
@param offsetY (optional) Y-axis offset.
   */
  async moveCursorTo(locator, offsetX = 0, offsetY = 0) {
    locator = new Locator(locator, 'css');
    const el = await this.browser.findElement(locator.toStrict());
    assertElementExists(el, locator);
    return this.browser.evaluate((el, x, y) => window.codeceptjs.hoverEl(el, x, y), el, offsetX, offsetY)
      .wait(this.options.waitForAction); // wait for hover event to happen
  }


  /**
   * Executes sync script on a page.
Pass arguments to function as additional parameters.
Will return execution result to a test.
In this case you should use async function and await to receive results.

Example with jQuery DatePicker:

```js
// change date of jQuery DatePicker
I.executeScript(function() {
  // now we are inside browser context
  $('date').datetimepicker('setDate', new Date());
});
```
Can return values. Don't forget to use `await` to get them.

```js
let date = await I.executeScript(function(el) {
  // only basic types can be returned
  return $(el).datetimepicker('getDate').toString();
}, '#date'); // passing jquery selector
```

@param fn function to be executed in browser context.
@param ...args args to be passed to function.
   *
   * Wrapper for synchronous [evaluate](https://github.com/segmentio/nightmare#evaluatefn-arg1-arg2)
   */
  async executeScript(fn) {
    return this.browser.evaluate.apply(this.browser, arguments)
      .catch(err => err); // Nightmare's first argument is error :(
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
let val = await I.executeAsyncScript(function(url, done) {
  // in browser context
  $.ajax(url, { success: (data) => done(data); }
}, 'http://ajax.callback.url/');
```

@param fn function to be executed in browser context.
@param ...args args to be passed to function.
   *
   * Wrapper for asynchronous [evaluate](https://github.com/segmentio/nightmare#evaluatefn-arg1-arg2).
   * Unlike NightmareJS implementation calling `done` will return its first argument.
   */
  async executeAsyncScript(fn) {
    return this.browser.evaluate.apply(this.browser, arguments)
      .catch(err => err); // Nightmare's first argument is error :(
  }

  /**
   * Resize the current window to provided width and height.
First parameter can be set to `maximize`.

@param width width in pixels or `maximize`.
@param height height in pixels.
   */
  async resizeWindow(width, height) {
    if (width === 'maximize') {
      throw new Error('Nightmare doesn\'t support resizeWindow to maximum!');
    }
    return this.browser.viewport(width, height).wait(this.options.waitForAction);
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
@param field checkbox located by label | name | CSS | XPath | strict locator.
@param context (optional) element located by CSS | XPath | strict locator.
   */
  async checkOption(field, context = null) {
    const els = await findCheckable.call(this, field, context);
    assertElementExists(els[0], field, 'Checkbox or radio');
    return this.browser.evaluate(els => window.codeceptjs.checkEl(els[0]), els)
      .wait(this.options.waitForAction);
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
@param field located by label|name|CSS|XPath|strict locator.
@param value text value to fill.
   */
  async fillField(field, value) {
    const el = await findField.call(this, field);
    assertElementExists(el, field, 'Field');
    return this.browser.enterText(el, value, true)
      .wait(this.options.waitForAction);
  }

  /**
   * Clears a `<textarea>` or text `<input>` element's value.

```js
I.clearField('Email');
I.clearField('user[email]');
I.clearField('#email');
```
@param field located by label|name|CSS|XPath|strict locator.
   */
  async clearField(field) {
    return this.fillField(field, '');
  }

  /**
   * Appends text to a input field or textarea.
Field is located by name, label, CSS or XPath

```js
I.appendField('#myTextField', 'appended');
```
@param field located by label|name|CSS|XPath|strict locator
@param value text value to append.
   */
  async appendField(field, value) {
    const el = await findField.call(this, field);
    assertElementExists(el, field, 'Field');
    return this.browser.enterText(el, value, false)
      .wait(this.options.waitForAction);
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
@param field located by label|name|CSS|XPath|strict locator.
@param value value to check.
   */
  async seeInField(field, value) {
    return proceedSeeInField.call(this, 'assert', field, value);
  }

  /**
   * Checks that value of input field or textare doesn't equal to given value
Opposite to `seeInField`.

@param field located by label|name|CSS|XPath|strict locator.
@param value value to check.
   */
  async dontSeeInField(field, value) {
    return proceedSeeInField.call(this, 'negate', field, value);
  }

  /**
   * Sends [input event](http://electron.atom.io/docs/api/web-contents/#webcontentssendinputeventevent) on a page.
   * Can submit special keys like 'Enter', 'Backspace', etc
   */
  async pressKey(key) {
    if (Array.isArray(key)) {
      key = key.join('+'); // should work with accelerators...
    }
    if (Object.keys(specialKeys).indexOf(key) >= 0) {
      key = specialKeys[key];
    }
    return this.browser.pressKey(key).wait(this.options.waitForAction);
  }

  /**
   * Sends [input event](http://electron.atom.io/docs/api/web-contents/#contentssendinputeventevent) on a page.
   * Should be a mouse event like:
   *  {
        type: 'mouseDown',
        x: args.x,
        y: args.y,
        button: "left"
      }
   */
  async triggerMouseEvent(event) {
    return this.browser.triggerMouseEvent(event).wait(this.options.waitForAction);
  }

  /**
   * Verifies that the specified checkbox is checked.

```js
I.seeCheckboxIsChecked('Agree');
I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
```
@param field located by label|name|CSS|XPath|strict locator.
   */
  async seeCheckboxIsChecked(field) {
    return proceedIsChecked.call(this, 'assert', field);
  }

  /**
   * Verifies that the specified checkbox is not checked.

@param field located by label|name|CSS|XPath|strict locator.
   */
  async dontSeeCheckboxIsChecked(field) {
    return proceedIsChecked.call(this, 'negate', field);
  }

  /**
   * Attaches a file to element located by label, name, CSS or XPath
Path to file is relative current codecept directory (where codecept.json is located).
File will be uploaded to remote system (if tests are running remotely).

```js
I.attachFile('Avatar', 'data/avatar.jpg');
I.attachFile('form input[name=avatar]', 'data/avatar.jpg');
```

@param locator field located by label|name|CSS|XPath|strict locator.
@param pathToFile local file path relative to codecept.json config file.
   *
   * ##### Limitations:
   *
   * * works only with CSS selectors.
   * * doesn't work if the Chromium DevTools panel is open (as Chromium allows only one attachment to the debugger at a time. [See more](https://github.com/rosshinkley/nightmare-upload#important-note-about-setting-file-upload-inputs))
   */
  async attachFile(locator, pathToFile) {
    const file = path.join(global.codecept_dir, pathToFile);

    locator = new Locator(locator, 'css');
    if (!locator.isCSS()) {
      throw new Error('Only CSS locator allowed for attachFile in Nightmare helper');
    }

    if (!fileExists(file)) {
      throw new Error(`File at ${file} can not be found on local system`);
    }
    return this.browser.upload(locator.value, file);
  }

  /**
   * Retrieves a text from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside async with `await`** operator.

```js
let pin = await I.grabTextFrom('#pin');
```
If multiple elements found returns an array of texts.

@param locator element located by CSS|XPath|strict locator.
   */
  async grabTextFrom(locator) {
    locator = new Locator(locator, 'css');
    const els = await this.browser.findElements(locator.toStrict());
    assertElementExists(els[0], locator);
    const texts = [];
    const getText = el => window.codeceptjs.fetchElement(el).innerText;
    for (const el of els) {
      texts.push(await this.browser.evaluate(getText, el));
    }
    if (texts.length === 1) return texts[0];
    return texts;
  }

  /**
   * Retrieves a value from a form element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside async function with `await`** operator.

```js
let email = await I.grabValueFrom('input[name=email]');
```
@param locator field located by label|name|CSS|XPath|strict locator.
   */
  async grabValueFrom(locator) {
    const el = await findField.call(this, locator);
    assertElementExists(el, locator, 'Field');
    return this.browser.evaluate(el => window.codeceptjs.fetchElement(el).value, el);
  }

  /**
   * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside async with `await`** operator.

```js
let hint = await I.grabAttributeFrom('#tooltip', 'title');
```
@param locator element located by CSS|XPath|strict locator.
@param attr attribute name.
   */
  async grabAttributeFrom(locator, attr) {
    locator = new Locator(locator, 'css');
    const el = await this.browser.findElement(locator.toStrict());
    assertElementExists(el, locator);
    return this.browser.evaluate((el, attr) => window.codeceptjs.fetchElement(el).getAttribute(attr), el, attr);
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
@param select field located by label|name|CSS|XPath|strict locator.
@param option visible text or value of option.
   */
  async selectOption(select, option) {
    const fetchAndCheckOption = function (el, locator) {
      el = window.codeceptjs.fetchElement(el);
      const found = document.evaluate(locator, el, null, 5, null);
      let current = null;
      const items = [];
      while (current = found.iterateNext()) {
        items.push(current);
      }
      for (let i = 0; i < items.length; i++) {
        current = items[i];
        if (current instanceof HTMLOptionElement) {
          current.selected = true;
          if (!el.multiple) el.value = current.value;
        }
        const event = document.createEvent('HTMLEvents');
        event.initEvent('change', true, true);
        el.dispatchEvent(event);
      }
      return !!current;
    };

    const el = await findField.call(this, select);
    assertElementExists(el, select, 'Selectable field');
    if (!Array.isArray(option)) {
      option = [option];
    }
    const promises = [];

    for (const key in option) {
      const opt = xpathLocator.literal(option[key]);
      const checked = await this.browser.evaluate(fetchAndCheckOption, el, Locator.select.byVisibleText(opt));

      if (!checked) {
        await this.browser.evaluate(fetchAndCheckOption, el, Locator.select.byValue(opt));
      }
    }
    return this.browser.wait(this.options.waitForAction);
  }

  /**
   * Sets a cookie.

```js
I.setCookie({name: 'auth', value: true});
```

@param cookie cookie JSON object.
   *
   * Wrapper for `.cookies.set(cookie)`.
   * [See more](https://github.com/segmentio/nightmare/blob/master/Readme.md#cookiessetcookie)
   */
  async setCookie(cookie) {
    return this.browser.cookies.set(cookie);
  }

  /**
   * Checks that cookie with given name exists.

```js
I.seeCookie('Auth');
```

@param name cookie name.
   *
   */
  async seeCookie(name) {
    const res = await this.browser.cookies.get(name);
    truth(`cookie ${name}`, 'to be set').assert(res);
  }

  /**
   * Checks that cookie with given name does not exist.

@param name cookie name.
   */
  async dontSeeCookie(name) {
    const res = await this.browser.cookies.get(name);
    truth(`cookie ${name}`, 'to be set').negate(res);
  }

  /**
   * Gets a cookie object by name.
If none provided gets all cookies.
* Resumes test execution, so **should be used inside async with `await`** operator.

```js
let cookie = await I.grabCookie('auth');
assert(cookie.value, '123456');
```

@param name (optional) cookie name.
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
  async grabCookie(name) {
    return this.browser.cookies.get(name);
  }

  /**
   * Clears a cookie by name,
if none provided clears all cookies.

```js
I.clearCookie();
I.clearCookie('test');
```

@param cookie (optional) cookie name.
   */
  async clearCookie(cookie) {
    if (!cookie) {
      return this.browser.cookies.clearAll();
    }
    return this.browser.cookies.clear(cookie);
  }

  /**
   * Waits for a function to return true (waits for 1 sec by default).
Running in browser context.

```js
I.waitForFunction(fn[, [args[, timeout]])
```

```js
I.waitForFunction(() => window.requests == 0);
I.waitForFunction(() => window.requests == 0, 5); // waits for 5 sec
I.waitForFunction((count) => window.requests == count, [3], 5) // pass args and wait for 5 sec
```

@param fn to be executed in browser context.
@param argsOrSec (optional) arguments for function or seconds.
@param sec (optional) time in seconds to wait, 1 by default.
   */
  async waitForFunction(fn, argsOrSec = null, sec = null) {
    let args = [];
    if (argsOrSec) {
      if (Array.isArray(argsOrSec)) {
        args = argsOrSec;
      } else if (typeof argsOrSec === 'number') {
        sec = argsOrSec;
      }
    }
    this.browser.options.waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;
    return this.browser.wait(fn, ...args);
  }

  /**
   * Pauses execution for a number of seconds.

```js
I.wait(2); // wait 2 secs
```

@param sec number of second to wait.
@param sec time in seconds to wait.
   */
  async wait(sec) {
    return new Promise(((done) => {
      setTimeout(done, sec * 1000);
    }));
  }

  /**
   * Waits for a text to appear (by default waits for 1sec).
Element can be located by CSS or XPath.
Narrow down search results by providing context.

```js
I.waitForText('Thank you, form has been submitted');
I.waitForText('Thank you, form has been submitted', 5, '#modal');
```

@param text to wait for.
@param sec (optional) time in seconds to wait.
@param context (optional) element located by CSS|XPath|strict locator.
   */
  async waitForText(text, sec, context = null) {
    if (!context) {
      context = this.context;
    }
    const locator = new Locator(context, 'css');
    this.browser.options.waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;
    return this.browser.wait((by, locator, text) => {
      return window.codeceptjs.findElement(by, locator).innerText.indexOf(text) > -1;
    }, locator.type, locator.value, text).catch((err) => {
      if (err.message.indexOf('Cannot read property') > -1) {
        throw new Error(`element (${JSON.stringify(context)}) is not in DOM. Unable to wait text.`);
      } else if (err.message && err.message.indexOf('.wait() timed out after') > -1) {
        throw new Error(`there is no element(${JSON.stringify(context)}) with text "${text}" after ${sec} sec`);
      } else throw err;
    });
  }

  /**
   * Waits for an element to become visible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

```
I.waitForVisible('#popup');
```

@param locator element located by CSS|XPath|strict locator.
@param sec (optional) time in seconds to wait, 1 by default.
   */
  waitForVisible(locator, sec) {
    this.browser.options.waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;
    locator = new Locator(locator, 'css');

    return this.browser.wait((by, locator) => {
      const el = window.codeceptjs.findElement(by, locator);
      if (!el) return false;
      return el.offsetWidth > 0 && el.offsetHeight > 0;
    }, locator.type, locator.value).catch((err) => {
      if (err.message && err.message.indexOf('.wait() timed out after') > -1) {
        throw new Error(`element (${JSON.stringify(locator)}) still not visible on page after ${sec} sec`);
      } else throw err;
    });
  }

  /**
   * Waits for an element to hide (by default waits for 1sec).
Element can be located by CSS or XPath.

```
I.waitToHide('#popup');
```

@param locator element located by CSS|XPath|strict locator.
@param sec (optional) time in seconds to wait, 1 by default.
   */
  async waitToHide(locator, sec = null) {
    return this.waitForInvisible(locator, sec);
  }

  /**
   * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

```
I.waitForInvisible('#popup');
```

@param locator element located by CSS|XPath|strict locator.
@param sec (optional) time in seconds to wait, 1 by default.
   */
  waitForInvisible(locator, sec) {
    this.browser.options.waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;
    locator = new Locator(locator, 'css');

    return this.browser.wait((by, locator) => {
      const el = window.codeceptjs.findElement(by, locator);
      if (!el) return true;
      return !(el.offsetWidth > 0 && el.offsetHeight > 0);
    }, locator.type, locator.value).catch((err) => {
      if (err.message && err.message.indexOf('.wait() timed out after') > -1) {
        throw new Error(`element (${JSON.stringify(locator)}) still visible after ${sec} sec`);
      } else throw err;
    });
  }

  /**
   * Waits for element to be present on page (by default waits for 1sec).
Element can be located by CSS or XPath.

```js
I.waitForElement('.btn.continue');
I.waitForElement('.btn.continue', 5); // wait for 5 secs
```

@param locator element located by CSS|XPath|strict locator.
@param sec (optional) time in seconds to wait, 1 by default.
   */
  async waitForElement(locator, sec) {
    this.browser.options.waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;
    locator = new Locator(locator, 'css');

    return this.browser.wait((by, locator) => window.codeceptjs.findElement(by, locator) !== null, locator.type, locator.value).catch((err) => {
      if (err.message && err.message.indexOf('.wait() timed out after') > -1) {
        throw new Error(`element (${JSON.stringify(locator)}) still not present on page after ${sec} sec`);
      } else throw err;
    });
  }

  async waitUntilExists(locator, sec) {
    console.log(`waitUntilExists deprecated:
    * use 'waitForElement' to wait for element to be attached
    * use 'waitForDetached to wait for element to be removed'`);
    return this.waitForDetached(locator, sec);
  }

  /**
   * Waits for an element to become not attached to the DOM on a page (by default waits for 1sec).
Element can be located by CSS or XPath.

```
I.waitForDetached('#popup');
```

@param locator element located by CSS|XPath|strict locator.
@param sec (optional) time in seconds to wait, 1 by default.
   */
  async waitForDetached(locator, sec) {
    this.browser.options.waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;
    sec = this.browser.options.waitForTimeout / 1000;
    locator = new Locator(locator, 'css');

    return this.browser.wait((by, locator) => window.codeceptjs.findElement(by, locator) === null, locator.type, locator.value).catch((err) => {
      if (err.message && err.message.indexOf('.wait() timed out after') > -1) {
        throw new Error(`element (${JSON.stringify(locator)}) still on page after ${sec} sec`);
      } else throw err;
    });
  }

  /**
   * Reload the current page.

````js
`I.refreshPage();
````

   */
  async refreshPage() {
    return this.browser.refresh();
  }

  /**
   * Reload the page
   */
  refresh() {
    console.log('Deprecated in favor of refreshPage');
    return this.browser.refresh();
  }

  /**
   * Saves a screenshot to ouput folder (set in codecept.json).
Filename is relative to output folder. 
Optionally resize the window to the full available page `scrollHeight` and `scrollWidth` to capture the entire page by passing `true` in as the second argument.

```js
I.saveScreenshot('debug.png');
I.saveScreenshot('debug.png', true) //resizes to available scrollHeight and scrollWidth before taking screenshot
```

@param fileName file name to save. 
@param fullPage (optional) flag to enable fullscreen screenshot mode.
   */
  async saveScreenshot(fileName, fullPage = this.options.fullPageScreenshots) {
    const outputFile = path.join(global.output_dir, fileName);
    this.debug(`Screenshot is saving to ${outputFile}`);
    const recorder = require('../recorder');

    if (!fullPage) {
      return this.browser.screenshot(outputFile);
    }
    const { height, width } = await this.browser.evaluate(() => {
      return { height: document.body.scrollHeight, width: document.body.scrollWidth };
    });
    await this.browser.viewport(width, height);
    return this.browser.screenshot(outputFile);
  }

  async _failed(test) {
    if (withinStatus !== false) await this._withinEnd();
  }

  /**
   * Scrolls to element matched by locator.
Extra shift can be set with offsetX and offsetY options.

```js
I.scrollTo('footer');
I.scrollTo('#submit', 5, 5);
```

@param locator located by CSS|XPath|strict locator.
@param offsetX (optional) X-axis offset.
@param offsetY (optional) Y-axis offset.
   */
  async scrollTo(locator, offsetX = 0, offsetY = 0) {
    if (typeof locator === 'number' && typeof offsetX === 'number') {
      offsetY = offsetX;
      offsetX = locator;
      locator = null;
    }
    if (locator) {
      locator = new Locator(locator, 'css');
      return this.browser.evaluate((by, locator, offsetX, offsetY) => {
        const el = window.codeceptjs.findElement(by, locator);
        if (!el) throw new Error(`Element not found ${by}: ${locator}`);
        const rect = el.getBoundingClientRect();
        window.scrollTo(rect.left + offsetX, rect.top + offsetY);
      }, locator.type, locator.value, offsetX, offsetY);
    }
    // eslint-disable-next-line prefer-arrow-callback
    return this.executeScript(function (x, y) { return window.scrollTo(x, y); }, offsetX, offsetY);
  }

  /**
   * Scroll page to the top.

```js
I.scrollPageToTop();
```
   */
  async scrollPageToTop() {
    return this.executeScript(() => window.scrollTo(0, 0));
  }

  /**
   * Scroll page to the bottom.

```js
I.scrollPageToBottom();
```
   */
  async scrollPageToBottom() {
    /* eslint-disable prefer-arrow-callback, comma-dangle */
    return this.executeScript(function () {
      const body = document.body;
      const html = document.documentElement;
      window.scrollTo(0, Math.max(
        body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight
      ));
    });
    /* eslint-enable */
  }

  /**
   * Retrieves a page scroll position and returns it to test.
Resumes test execution, so **should be used inside an async function with `await`** operator.

```js
let { x, y } = await I.grabPageScrollPosition();
```
   */
  async grabPageScrollPosition() {
    /* eslint-disable comma-dangle */
    function getScrollPosition() {
      return {
        x: window.pageXOffset,
        y: window.pageYOffset
      };
    }
    /* eslint-enable comma-dangle */
    return this.executeScript(getScrollPosition);
  }
}

module.exports = Nightmare;

async function proceedSee(assertType, text, context) {
  let description;
  let locator;
  if (!context) {
    if (this.context === this.options.rootElement) {
      locator = new Locator(this.context, 'css');
      description = 'web application';
    } else {
      description = `current context ${this.context}`;
      locator = new Locator({ xpath: './/*' });
    }
  } else {
    locator = new Locator(context, 'css');
    description = `element ${locator.toString()}`;
  }

  const texts = await this.browser.evaluate((by, locator) => {
    return window.codeceptjs.findElements(by, locator).map(el => el.innerText);
  }, locator.type, locator.value);
  const allText = texts.join(' | ');
  return stringIncludes(description)[assertType](text, allText);
}

async function proceedSeeInField(assertType, field, value) {
  const el = await findField.call(this, field);
  assertElementExists(el, field, 'Field');
  const tag = await this.browser.evaluate(el => window.codeceptjs.fetchElement(el).tagName, el);
  const fieldVal = await this.browser.evaluate(el => window.codeceptjs.fetchElement(el).value, el);
  if (tag === 'select') {
    // locate option by values and check them
    const text = await this.browser.evaluate((el, val) => {
      return el.querySelector(`option[value="${val}"]`).innerText;
    }, el, xpathLocator.literal(fieldVal));
    return equals(`select option by ${field}`)[assertType](value, text);
  }
  return stringIncludes(`field by ${field}`)[assertType](value, fieldVal);
}

async function proceedIsChecked(assertType, option) {
  const els = await findCheckable.call(this, option);
  assertElementExists(els, option, 'Checkable');
  const selected = await this.browser.evaluate((els) => {
    return els.map(el => window.codeceptjs.fetchElement(el).checked).reduce((prev, cur) => prev || cur);
  }, els);
  return truth(`checkable ${option}`, 'to be checked')[assertType](selected);
}


async function findCheckable(locator, context) {
  let contextEl = null;
  if (context) {
    contextEl = await this.browser.findElement((new Locator(context, 'css')).toStrict());
  }

  const matchedLocator = new Locator(locator);
  if (!matchedLocator.isFuzzy()) {
    return this.browser.findElements(matchedLocator.toStrict(), contextEl);
  }

  const literal = xpathLocator.literal(locator);
  let els = await this.browser.findElements({ xpath: Locator.checkable.byText(literal) }, contextEl);
  if (els.length) {
    return els;
  }
  els = await this.browser.findElements({ xpath: Locator.checkable.byName(literal) }, contextEl);
  if (els.length) {
    return els;
  }
  return this.browser.findElements({ css: locator }, contextEl);
}

async function findClickable(locator, context) {
  let contextEl = null;
  if (context) {
    contextEl = await this.browser.findElement((new Locator(context, 'css')).toStrict());
  }

  const matchedLocator = new Locator(locator);
  if (!matchedLocator.isFuzzy()) {
    return this.browser.findElement(matchedLocator.toStrict(), contextEl);
  }

  const literal = xpathLocator.literal(locator);

  let els = await this.browser.findElements({ xpath: Locator.clickable.narrow(literal) }, contextEl);
  if (els.length) {
    return els[0];
  }

  els = await this.browser.findElements({ xpath: Locator.clickable.wide(literal) }, contextEl);
  if (els.length) {
    return els[0];
  }

  return this.browser.findElement({ css: locator }, contextEl);
}

async function findField(locator) {
  const matchedLocator = new Locator(locator);
  if (!matchedLocator.isFuzzy()) {
    return this.browser.findElements(matchedLocator.toStrict());
  }
  const literal = xpathLocator.literal(locator);

  let els = await this.browser.findElements({ xpath: Locator.field.labelEquals(literal) });
  if (els.length) {
    return els[0];
  }

  els = await this.browser.findElements({ xpath: Locator.field.labelContains(literal) });
  if (els.length) {
    return els[0];
  }
  els = await this.browser.findElements({ xpath: Locator.field.byName(literal) });
  if (els.length) {
    return els[0];
  }
  return this.browser.findElement({ css: locator });
}

function assertElementExists(el, locator, prefix, suffix) {
  if (el === null) throw new ElementNotFound(locator, prefix, suffix);
}
