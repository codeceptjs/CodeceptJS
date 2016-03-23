'use strict';
let webdriver, protractorWrapper, protractorPlugins, EC;

const SeleniumWebdriver = require('./SeleniumWebdriver');
const stringIncludes = require('../assert/include').includes;
const urlEquals = require('../assert/equal').urlEquals;
const equals = require('../assert/equal').equals;
const empty = require('../assert/empty').empty;
const truth = require('../assert/truth').truth;
const xpathLocator = require('../utils').xpathLocator;
const fileExists = require('../utils').fileExists;
const co = require('co');
const path = require('path');
const recorder = require('../recorder');

let withinStore = {};

/**
 * Protractor helper is based on [Protractor library](http://www.protractortest.org) and used for testing AngularJS applications.
 *
 * #### Selenium Installation
 *
 * 1. Download [Selenium Server](http://docs.seleniumhq.org/download/)
 * 2. Launch the daemon: `java -jar selenium-server-standalone-2.xx.xxx.jar`
 *
 *
 * #### PhantomJS Installation
 *
 * PhantomJS is a headless alternative to Selenium Server that implements [the WebDriver protocol](https://code.google.com/p/selenium/wiki/JsonWireProtocol).
 * It allows you to run Selenium tests on a server without a GUI installed.
 *
 * 1. Download [PhantomJS](http://phantomjs.org/download.html)
 * 2. Run PhantomJS in WebDriver mode: `phantomjs --webdriver=4444`
 *
 * ### Configuration
 *
 * This helper should be configured in codecept.json
 *
 * * `url` - base url of website to be tested
 * * `browser` - browser in which perform testing
 * * `driver` - which protrator driver to use (local, direct, session, hosted, sauce, browserstack). By default set to 'hosted' which requires selenium server to be started.
 * * `seleniumAddress` - Selenium address to connect (default: http://localhost:4444/wd/hub)
 *
 * other options are the same as in [Protractor config](https://github.com/angular/protractor/blob/master/docs/referenceConf.js).
 *
 */
class Protractor extends SeleniumWebdriver {

  constructor(config) {
    super(config);

    webdriver = require('selenium-webdriver');
    protractorWrapper = require('protractor').wrapDriver;
    EC = require('protractor').ExpectedConditions;

    this.options = {
      browser: 'firefox',
      url: 'http://localhost',
      seleniumAddress: 'http://localhost:4444/wd/hub',
      rootElement: 'body',
      scriptsTimeout: 10000,
      driver: 'hosted',
      capabilities: {}
    };

    this.options = Object.assign(this.options, config);
    if (this.options.proxy) this.options.capabilities.proxy = this.options.proxy;
    if (this.options.browser) this.options.capabilities.browserName = this.options.browser;
  }

  _init() {
    global.by = require('protractor').By;
    this.driverProvider = require('protractor/built/driverProviders/'+this.options.driver)(this.options);
    this.driverProvider.setupEnv();
  }

  static _require()
  {
    try {
      require.resolve("protractor");
      require.resolve("selenium-webdriver");
    } catch(e) {
      return ["protractor@^3.0.0"];
    }
  }

  static _config() {
    return [
      { name: 'url', message: "Base url of site to be tested", default: 'http://localhost' },
      { name: 'driver', message: "Protractor driver (local, direct, session, hosted, sauce, browserstack)", default: 'hosted' },
      { name: 'browser', message: 'Browser in which testing will be performed', default: 'firefox' },
      { name: 'rootElement', message: "Root element of AngularJS application", default: 'body' },
    ];
  }

  _before() {
    this.browser = this.driverProvider.getNewDriver();
    this.amInsideAngularApp();
    this.context = this.options.rootElement;
    return this.browser;
  }

  _after() {
    return this.browser.quit().then(() => {
      this.browser.driver = null;
      this.browser = null;
    });
  }

  _failed(test) {
    let fileName = test.name.replace(/ /g, '_') + '.failed.png';
    this.debug('Screenshot has been saved to ' + path.join(global.output_dir, fileName));
    return this.saveScreenshot(fileName);
  }


  _withinBegin(locator) {
    withinStore.elFn = this.browser.findElement;
    withinStore.elsFn = this.browser.findElements;

    this.context = locator;
    if (this.insideAngular) {
        let context = this.browser.element(guessLocator(locator) || by.css(locator));

        this.browser.findElement = (l) => l ? context.element(l).getWebElement() : context.getWebElement();
        this.browser.findElements = (l) => context.all(l).getWebElements();
        return;
    }
    super._withinBegin(locator);
  }

  _withinEnd() {
    this.browser.findElement = withinStore.elFn;
    this.browser.findElements = withinStore.elsFn;
    this.context = this.options.rootElement;
  }

  amOnPage(url) {
    return super.amOnPage(url);
  }

  /**
   * Switch to non-Angular mode,
   * start using WebDriver instead of Protractor in this session
   */
  amOutsideAngularApp() {
     if (this.browser.driver && this.insideAngular) {
       this.browser = this.browser.driver;
       this.insideAngular = false;
     }
  }

  /**
   * Enters Angular mode (switched on by default)
   * Should be used after "amOutsideAngularApp"
   */
  amInsideAngularApp() {
    if (this.browser.driver && this.insideAngular) {
      return; // already inside angular
    }
    this.browser = protractorWrapper(this.browser, this.options.url, this.options.rootElement);
    this.browser.ready = this.browser.manage().timeouts().setScriptTimeout(this.options.scriptsTimeout);

    if (this.options.useAllAngular2AppRoots) this.browser.useAllAngular2AppRoots();
    if (this.options.getPageTimeout) this.browser.getPageTimeout = this.options.getPageTimeout;
    if (this.options.allScriptsTimeout) this.browser.allScriptsTimeout = this.options.allScriptsTimeout;
    if (this.options.debuggerServerPort) this.browser.debuggerServerPort_ = this.options.debuggerServerPort;

    this.insideAngular = true;
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
    sec = sec || 1;
    let el = this.browser.element(guessLocator(locator) || by.css(locator));
    return this.browser.wait(EC.presenceOf(el), sec*1000);
  }

  /**
   * Waits for element to become clickable for number of seconds.
   */
  waitForClickable(locator, sec) {
    sec = sec || 1;
    let el = this.browser.element(guessLocator(locator) || by.css(locator));
    return this.browser.wait(EC.elementToBeClickable(el), sec*1000);
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
    sec = sec || 1;
    let el = this.browser.element(guessLocator(locator) || by.css(locator));
    return this.browser.wait(EC.visibilityOf(el), sec*1000);
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
    let el = this.browser.element(guessLocator(context) || by.css(context));
    sec = sec || 1;
    return this.browser.wait  (EC.textToBePresentInElement(el, text), sec*1000);
  }

  // ANGULAR SPECIFIC

  moveTo(path) {
    return this.browser.setLocation(path);
  }

  refresh() {
    return this.browser.refresh();
  }

  haveModule(modName, fn) {
    return this.browser.addMockModule(modName, fn);
  }

  resetModule(modName) {
    if (!modName) {
      return this.browser.clearMockModules();
    }
    return this.browser.removeMockModule(modName);
  }


}

module.exports = Protractor;

function *findCheckable(client, locator) {
  let matchedLocator = guessLocator(locator);
  if (matchedLocator) {
    return client.findElements(matchedLocator);
  }
  let literal = xpathLocator.literal(locator);
  let byText = xpathLocator.combine([
    `.//input[@type = 'checkbox' or @type = 'radio'][(@id = //label[contains(normalize-space(string(.)), ${literal})]/@for) or @placeholder = ${literal}]`,
    `.//label[contains(normalize-space(string(.)), ${literal})]//input[@type = 'radio' or @type = 'checkbox']`
  ]);
  let els = yield client.findElements(by.xpath(byText));
  if (els.length) {
    return els;
  }
  let byName = `.//input[@type = 'checkbox' or @type = 'radio'][@name = ${literal}]`;
  els = yield client.findElements(by.xpath(byName));
  if (els.length) {
    return els;
  }
  return yield client.findElements(by.css(locator));
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
  let els = yield client.findElements(by.xpath(byLabelEquals));
  if (els.length) {
    return els;
  }

  let byLabelContains = xpathLocator.combine([
    `.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')][(((./@name = ${literal}) or ./@id = //label[contains(normalize-space(string(.)), ${literal})]/@for) or ./@placeholder = ${literal})]`,
    `.//label[contains(normalize-space(string(.)), ${literal})]//.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')]`
  ]);
  els = yield client.findElements(by.xpath(byLabelContains));
  if (els.length) {
    return els;
  }
  let byName = `.//*[self::input | self::textarea | self::select][@name = ${literal}]`;
  els = yield client.findElements(by.xpath(byName));
  if (els.length) {
    return els;
  }
  return yield client.findElements(by.css(locator));
}

function proceedSee(assertType, text, context) {
  let description, locator;
  if (!context) {
    if (this.context === this.options.rootElement) {
      locator = guessLocator(this.context) || by.css(this.context);
      description = 'web application';
    } else {
      locator = null;
      description = 'current context ' + this.context;
    }
  } else {
    locator = guessLocator(context) || by.css(context);
    description = 'element ' + context;
  }
  return this.browser.findElement(locator).getText().then(function (source) {
    return stringIncludes(description)[assertType](text, source);
  });
}

function *proceedSeeInField(assertType, field, value) {
  let els = yield co(findFields(this.browser, field));
  if (!els.length) {
    throw new Error(`Field ${field} not found by name|text|CSS|XPath`);
  }
  let el = els[0];
  let tag = yield el.getTagName();
  let fieldVal = yield el.getAttribute('value');
  if (tag == 'select') {
    // locate option by values and check them
    let text = yield el.findElement(by.xpath(`./option[@value=${xpathLocator.literal(fieldVal)}]`)).getText();
    return equals('select option by ' + field)[assertType](value, text);
  }
  return stringIncludes('field by ' + field)[assertType](value, fieldVal);
}

function *proceedIsChecked(assertType, option) {
  return co(findCheckable(this.browser, option)).then((els) => {
    if (!els.length) {
      throw new Error(`Option ${option} not found by name|text|CSS|XPath`);
    }
    let elsSelected = [];
    els.forEach(function (el) {
      elsSelected.push(el.isSelected());
    });
    return Promise.all(elsSelected).then(function(values) {
      let selected = values.reduce((prev, cur) => prev || cur)
      return truth(`checkable ${option}`, 'to be checked')[assertType](selected);
    });
  });
}

function *findClickable(matcher, locator) {
  let l = guessLocator(locator);
  if (guessLocator(locator)) {
    return matcher.findElement(l);
  }

  let literal = xpathLocator.literal(locator);

  let narrowLocator = xpathLocator.combine([
    `.//a[normalize-space(.)=${literal}]`,
    `.//button[normalize-space(.)=${literal}]`,
    `.//a/img[normalize-space(@alt)=${literal}]/ancestor::a`,
    `.//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][normalize-space(@value)=${literal}]`
  ]);
  let els = yield matcher.findElements(by.xpath(narrowLocator));
  if (els.length) {
    return els[0];
  }

  let wideLocator = xpathLocator.combine([
    `.//a[./@href][((contains(normalize-space(string(.)), ${literal})) or .//img[contains(./@alt, ${literal})])]`,
    `.//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][contains(./@value, ${literal})]`,
    `.//input[./@type = 'image'][contains(./@alt, ${literal})]`,
    `.//button[contains(normalize-space(string(.)), ${literal})]`,
    `.//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][./@name = ${literal}]`,
    `.//button[./@name = ${literal}]`
  ]);

  els = yield matcher.findElements(by.xpath(wideLocator));
  if (els.length) {
    return els[0];
  }
  if (isXPath(locator)) {
    return matcher.findElement(by.xpath(locator));
  }
  return matcher.findElement(by.css(locator));
}

function guessLocator(locator) {
  if (!locator) {
    return;
  }
  if (typeof (locator) === 'object') {
    let key = Object.keys(locator)[0];
    let value = locator[key];
    return by[key](value);
  }
  if (isCSS(locator)) {
    return by.css(locator);
  }
  if (isXPath(locator)) {
    return by.xpath(locator);
  }
}

function isCSS(locator) {
  return locator[0] === '#' || locator[0] === '.';
}

function isXPath(locator) {
  return locator.substr(0, 2) === '//' || locator.substr(0, 3) === './/'
}

// docs for inherited methods

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
 * @name amOnPage
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _amOnPage;

/**
 * Appends text to a input field or textarea.
Field is located by name, label, CSS or XPath

```js
I.appendField('#myTextField', 'appended');
```
@param field located by label|name|CSS|XPath|strict locator
@param value text value
 *
 * @name appendField
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _appendField;

/**
 * Attaches a file to element located by label, name, CSS or XPath
Path to file is relative current codecept directory (where codecept.json is located).
File will be uploaded to remove system (if tests are running remotely).

```js
I.attachFile('Avatar', 'data/avatar.jpg');
I.attachFile('form input[name=avatar]', 'data/avatar.jpg');
```
@param locator field located by label|name|CSS|XPath|strict locator
@param pathToFile local file path relative to codecept.json config file
 *
 * @name attachFile
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _attachFile;

/**
 * Selects a checkbox or radio button.
Element is located by label or name or CSS or XPath.

The second parameter is a context (CSS or XPath locator) to narrow the search.

```js
I.checkOption('#agree');
I.checkOption('I Agree to Terms and Conditions');
I.checkOption('agree', '//form');
```
@param option located by label | name | CSS | XPath | strict locator
@param context (optional) element located by CSS | XPath | strict locator
 *
 * @name checkOption
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _checkOption;

/**
 * Clears a cookie by name,
if none provided clears all cookies

```js
I.clearCookie();
I.clearCookie('test');
```
@param cookie (optional)
 *
 * @name clearCookie
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _clearCookie;

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
@param link clickable link or button located by text, or any element located by CSS|XPath|strict locator
@param context (optional) element to search in CSS|XPath|Strict locator
 *
 * @name click
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _click;

/**
 *  Verifies that the specified checkbox is not checked.

 @param field located by label|name|CSS|XPath|strict locator
 *
 * @name dontSeeCheckboxIsChecked
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _dontSeeCheckboxIsChecked;

/**
 * Checks that cookie with given name does not exist.

@param name
 *
 * @name dontSeeCookie
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _dontSeeCookie;

/**
 * Checks that current url is not equal to provided one.
If a relative url provided, a configured url will be prepended to it.

@param url
 *
 * @name dontSeeCurrentUrlEquals
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _dontSeeCurrentUrlEquals;

/**
 * Opposite to `seeElement`. Checks that element is not visible

@param locator located by CSS|XPath|Strict locator
 *
 * @name dontSeeElement
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _dontSeeElement;

/**
 * Checks that current url does not contain a provided fragment.

@param url
 *
 * @name dontSeeInCurrentUrl
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _dontSeeInCurrentUrl;

/**
 * Checks that value of input field or textare doesn't equal to given value
Opposite to `seeInField`.

@param field located by label|name|CSS|XPath|strict locator
@param value is not expected to be a field value
 *
 * @name dontSeeInField
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _dontSeeInField;

/**
 * Checks that the current page contains the given string in its raw source code

@param text
 *
 * @name dontSeeInSource
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _dontSeeInSource;

/**
 * Checks that title does not contain text.

@param text
 *
 * @name dontSeeInTitle
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _dontSeeInTitle;

/**
 * Opposite to `see`. Checks that a text is not present on a page.
Use context parameter to narrow down the search.

```js
I.dontSee('Login'); // assume we are already logged in
```
@param text is not present
@param context (optional) element located by CSS|XPath|strict locator in which to perfrom search
 *
 * @name dontSee
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _dontSee;

/**
 * Executes async script on page.
Provided function should execute a passed callback (as first argument) to signal it is finished.

@param fn
 *
 * @name executeAsyncScript
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _executeAsyncScript;

/**
 * Executes sync script on a page.
Pass arguments to function as additional parameters.
Will return execution result to a test.
In this case you should use generator and yield to receive results.

@param fn
 *
 * @name executeScript
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _executeScript;

/**
 * Fills a text field or textarea, after clearing its value,  with the given string.
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
 *
 * @name fillField
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _fillField;

/**
 * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let hint = yield I.grabAttributeFrom('#tooltip', 'title');
```
@param locator element located by CSS|XPath|strict locator
@param attr
 *
 * @name grabAttributeFrom
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _grabAttributeFrom;

/**
 * Gets a cookie object by name
* Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let cookie = I.grabCookie('auth');
assert(cookie.value, '123456');
```
@param name
 *
 * @name grabCookie
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _grabCookie;

/**
 * Retrieves a text from an element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let pin = yield I.grabTextFrom('#pin');
```
@param locator element located by CSS|XPath|strict locator
 *
 * @name grabTextFrom
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _grabTextFrom;

/**
 * Retrieves a page title and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let title = yield I.grabTitle();
```
 *
 * @name grabTitle
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _grabTitle;

/**
 * Retrieves a value from a form element located by CSS or XPath and returns it to test.
Resumes test execution, so **should be used inside a generator with `yield`** operator.

```js
let email = yield I.grabValueFrom('input[name=email]');
```
@param locator field located by label|name|CSS|XPath|strict locator
 *
 * @name grabValueFrom
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _grabValueFrom;

/**
 * Presses a key on a focused element.
Speical keys like 'Enter', 'Control', [etc](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value)
will be replaced with corresponding unicode.
If modiferier key is used (Control, Command, Alt, Shift) in array, it will be released afterwards.

```js
I.pressKey('Enter');
I.pressKey(['Control','a']);
```
@param key
 *
 * @name pressKey
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _pressKey;

/**
 * Resize the current window to provided width and height.
First parameter can be set to `maximize`

@param width or `maximize`
@param height
 *
 * @name resizeWindow
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _resizeWindow;

/**
 * Saves a screenshot to ouput folder (set in codecept.json).
Filename is relative to output folder.

```js
I.saveScreenshot('debug.png');
```
@param fileName
 *
 * @name saveScreenshot
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _saveScreenshot;

/**
 * Verifies that the specified checkbox is checked.

```js
I.seeCheckboxIsChecked('Agree');
I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
```
@param field located by label|name|CSS|XPath|strict locator
 *
 * @name seeCheckboxIsChecked
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _seeCheckboxIsChecked;

/**
 * Checks that cookie with given name exists.

```js
I.seeCookie('Auth');
```
@param name
 *
 * @name seeCookie
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _seeCookie;

/**
 * Checks that current url is equal to provided one.
If a relative url provided, a configured url will be prepended to it.
So both examples will work:

```js
I.seeCurrentUrlEquals('/register');
I.seeCurrentUrlEquals('http://my.site.com/register');
```
@param url
 *
 * @name seeCurrentUrlEquals
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _seeCurrentUrlEquals;

/**
 * Checks that a given Element is visible
Element is located by CSS or XPath.

```js
I.seeElement('#modal');
```
@param locator located by CSS|XPath|strict locator
 *
 * @name seeElement
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _seeElement;

/**
 * Checks that current url contains a provided fragment.

```js
I.seeInCurrentUrl('/register'); // we are on registration page
```
@param url
 *
 * @name seeInCurrentUrl
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _seeInCurrentUrl;

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
 *
 * @name seeInField
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _seeInField;

/**
 * Checks that the current page contains the given string in its raw source code.

```js
I.seeInSource('<h1>Green eggs &amp; ham</h1>');
```
@param text
 *
 * @name seeInSource
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _seeInSource;

/**
 * Checks that title contains text.

@param text
 *
 * @name seeInTitle
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _seeInTitle;

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
 *
 * @name see
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _see;

/**
 * Selects an option in a drop-down select.
Field is siearched by label | name | CSS | XPath.
Option is selected by visible text or by value.

```js
I.selectOption('Choose Plan', 'Monthly'); // select by label
I.selectOption('subscription', 'Monthly'); // match option by text
I.selectOption('subscription', '0'); // or by value
I.selectOption('//form/select[@name=account]','Permium');
I.selectOption('form select[name=account]', 'Premium');
I.selectOption({css: 'form select[name=account]'}, 'Premium');
```

Provide an array for the second argument to select multiple options.

```js
I.selectOption('Which OS do you use?', ['Andriod', 'OSX']);
```
@param select field located by label|name|CSS|XPath|strict locator
@param option
 *
 * @name selectOption
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _selectOption;

/**
 * Sets a cookie

```js
I.setCookie({name: 'auth', value: true});
```
@param cookie
 *
 * @name setCookie
 * @kind function
 * @memberof Protractor
 * @scope instance
 */
var _setCookie;