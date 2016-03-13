'use strict';
let _ = require('lodash');
let Helper = require('../helper');
let webdriverio = require('webdriverio');
let stringIncludes = require('../assert/include').includes;
let urlEquals = require('../assert/equal').urlEquals;
let equals = require('../assert/equal').equals;
let empty = require('../assert/empty').empty;
let truth = require('../assert/truth').truth;
let xpathLocator = require('../utils').xpathLocator;
let fileExists = require('../utils').fileExists;
let assert = require('assert');
let path = require('path');

let withinStore = {};

/**
 * WebDriverIO helper which wraps [webdriverio](http://webdriver.io/) library to
 * manipulate browser using Selenium WebDriver or PhantomJS.
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
 * * `baseUrl` - base url of website to be tested
 * * `desiredCapabilities.browserName` - browser in which perform testing
 * * `window_size`: (optional) default window size. Set to `maximize` or a dimension in the format `640x480`.
 *
 *
 * Additional configuration params can be used from http://webdriver.io/guide/getstarted/configuration.html
 *
 * ### Connect through proxy
 *
 * CodeceptJS also provides flexible options when you want to execute tests to Selenium servers through proxy. You will
 * need to update the `helpers.WebDriverIO.desiredCapabilities.proxy` key.
 *
 * ```js
 * {
 *     "helpers": {
 *         "WebDriverIO": {
 *             "desiredCapabilities": {
 *                 "proxy": {
 *                     "proxyType": "manual|pac",
 *                     "proxyAutoconfigUrl": "URL TO PAC FILE",
 *                     "httpProxy": "PROXY SERVER",
 *                     "sslProxy": "PROXY SERVER",
 *                     "ftpProxy": "PROXY SERVER",
 *                     "socksProxy": "PROXY SERVER",
 *                     "socksUsername": "USERNAME",
 *                     "socksPassword": "PASSWORD",
 *                     "noProxy": "BYPASS ADDRESSES"
 *                 }
 *             }
 *         }
 *     }
 * }
 * ```
 *
 * For example,
 *
 * ```js
 * {
 *     "helpers": {
 *         "WebDriverIO": {
 *             "desiredCapabilities": {
 *                 "proxy": {
 *                     "proxyType": "manual",
 *                     "httpProxy": "http://corporate.proxy:8080",
 *                     "socksUsername": "codeceptjs",
 *                     "socksPassword": "secret",
 *                     "noProxy": "127.0.0.1,localhost"
 *                 }
 *             }
 *         }
 *     }
 * }
 * ```
 *
 * Please refer to [Selenium - Proxy Object](https://code.google.com/p/selenium/wiki/DesiredCapabilities#Proxy_JSON_Object) for more information.
 *
 * ## Cloud Providers
 * WebDriverIO makes it possible to execute tests against services like `Sauce Labs` `BrowserStack` `TestingBot`
 * Check out their documentation on [available parameters](http://webdriver.io/guide/testrunner/cloudservices.html)
 *
 * Connecting to `BrowserStack` and `Sauce Labs` is simple. All you need to do
 * is set the `user` and `key` parameters. WebDriverIO authomatically know which
 * service provider to connect to.
 *
 * ```js
 * {
 *     "helpers":{
 *         "WebDriverIO": {
 *             "baseUrl": "YOUR_DESIERED_HOST",
 *             "user": "YOUR_BROWSERSTACK_USER",
 *             "key": "YOUR_BROWSERSTACK_KEY",
 *             "desiredCapabilities": {
 *                 "browserName": "chrome",
 *
 *                 // only set this if you're using BrowserStackLocal to test a local domain
 *                 // "browserstack.local": true,
 *
 *                 // set this option to tell browserstack to provide addition debugging info
 *                 // "browserstack.debug": true,
 *             }
 *         }
 *     }
 * }
 * ```
 *
 * ## Multiremote Capabilities
 * This is a work in progress but you can control two browsers at a time right out of the box.
 * Individual control is something that is planned for a later version.
 *
 * Here is the [webdriverio docs](http://webdriver.io/guide/usage/multiremote.html) on the subject
 *
 * ```js
 * {
 *     "helpers": {
 *         "WebDriverIO": {
 *             "multiremote": {
 *                 "MyChrome": {
 *                     "desiredCapabilities": {
 *                         "browserName": "chrome"
 *                      }
 *                 },
 *                 "MyFirefox": {
 *                    "desiredCapabilities": {
 *                        "browserName": "firefox"
 *                    }
 *                 }
 *             }
 *         }
 *     }
 * }
 * ```
 *
 *
 * ## Access From Helpers
 *
 * Receive a WebDriverIO client from a custom helper by accessing `browser` property:
 *
 * ```
 * this.helpers['WebDriverIO'].browser
 * ```
 *
 */
class WebDriverIO extends Helper {

  constructor(config) {
    super(config);

    // set defaults
    this.options = {
      desiredCapabilities: {}
    };

    // override defaults with config
    _.assign(this.options, config);

    if (!this.options.baseUrl || !this.options.desiredCapabilities.browserName) {
      throw new Error(`
        WebDriverIO requires at least these parameters
        Check your codeceptjs config file to ensure these are set properly
          {
            "helpers": {
              "WebDriverIO": {
                "baseUrl": "YOUR_HOST"
                "desiredCapabilities": {
                  "browserName": "YOUR_PREFERED_TESTING_BROWSER"
                }
              }
            }
          }
      `)
    }
  }

  static _config() {
    return [
      { name: 'url', message: "Base url of site to be tested", default: 'http://localhost' },
      { name: 'browser', message: 'Browser in which testing will be performed', default: 'firefox' }
    ];
  }

  _before() {

    if (this.options.multiremote) {
      this.browser = webdriverio.multiremote(this.options.multiremote);
    } else {
      this.browser = webdriverio.remote(this.options).init();
    }


    let window_size = this.options.window_size;

    if (window_size === 'maximize') {
      this.browser.client.windowHandleMaximize(false);
    }
    if (window_size && window_size.indexOf('x') > 0) {
      let dimensions = window_size.split('x');
      this.browser.windowHandleSize({ width: dimensions[0], height: dimensions[1] });
    }
    this.context = 'body';
    return this.browser;
  }

  _after() {
    return this.browser.end();
  }

  _failed(test) {
    let fileName = test.name.replace(/ /g, '_') + '.failed.png';
    this.debug('Screenshot has been saved to ' + path.join(global.output_dir, fileName));
    return this.saveScreenshot(fileName);
  }

  _withinBegin(locator) {
    withinStore.elFn = this.browser.element;
    withinStore.elsFn = this.browser.elements;
    this.context = locator;
    return this.browser.element(withStrictLocator(locator)).then((res) => {
      this.browser.element = function (l) {
        return this.elementIdElement(res.value.ELEMENT, l);
      };
      this.browser.elements = function (l) {
        return this.elementIdElements(res.value.ELEMENT, l);
      };
    });
  }

  _withinEnd() {
    this.context = 'body';
    this.browser.element = withinStore.elFn;
    this.browser.elements = withinStore.elsFn;
  }

  /**
   * Get elements by different locator types, including strict locator
   * Should be used in custom helpers:
   *
   * ```js
   * this.helpers['WebDriverIO']._locate({name: 'password'}).then //...
   * ```
   */
  _locate(locator) {
    return this.browser.elements(withStrictLocator(locator));
  }

  /**
   * Opens a web page in a browser. Requires relative or absolute url.
   * If url starts with `/`, opens a web page of a site defined in `url` config parameter.
   *
   * ```js
   * I.amOnPage('/'); // opens main page of website
   * I.amOnPage('https://github.com'); // opens github
   * I.amOnPage('/login'); // opens a login page
   * ```
   */
  amOnPage(url) {
    return this.browser.url(url).url((err, res) => {
      if (err) throw err;
      this.debugSection('Url', res.value);
    });
  }

  /**
   * Perform a click on a link or a button, given by a locator.
   * If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
   * For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
   * For images, the "alt" attribute and inner text of any parent links are searched.
   *
   * The second parameter is a context (CSS or XPath locator) to narrow the search.
   *
   * ```js
   * // simple link
   * I.click('Logout');
   * // button of form
   * I.click('Submit');
   * // CSS button
   * I.click('#form input[type=submit]');
   * // XPath
   * I.click('//form/*[@type=submit]');
   * // link in context
   * I.click('Logout', '#nav');
   * // using strict locator
   * I.click({css: 'nav a.login'});
   * ```
   */
  click(link, context) {
    let client = this.browser;
    let clickMethod = this.browser.isMobile ? 'touchClick' : 'elementIdClick';
    if (context) {
      client = client.element(context);
    }
    return findClickable(client, link).then(function (res) {
      if (!res.value || res.value.length === 0) {
        if (typeof(link) === "object") link = JSON.stringify(link);
        throw new Error(`Clickable element ${link.toString()} was not found by text|CSS|XPath`);
      }
      let elem = res.value[0];
      return this[clickMethod](elem.ELEMENT);
    });
  }

  /**
   * Performs a double-click on an element matched by CSS or XPath.
   */
  doubleClick(locator) {
    return this.browser.doubleClick(withStrictLocator(locator));
  }

  /**
   * Performs right click on an element matched by CSS or XPath.
   */
  rightClick(locator) {
    return this.browser.rightClick(withStrictLocator(locator));
  }

  /**
   * Fills a text field or textarea with the given string.
   * Field is located by name, label, CSS, or XPath.
   *
   * ```js
   * // by label
   * I.fillField('Email', 'hello@world.com');
   * // by name
   * I.fillField('password', '123456');
   * // by CSS
   * I.fillField('form#login input[name=username]', 'John');
   * // or by strict locator
   * I.fillField({css: 'form#login input[name=username]'}, 'John');
   * ```
   */
  fillField(field, value) {
    return findFields(this.browser, field).then(function (res) {
      if (!res.value || res.value.length === 0) {
        throw new Error(`Field ${field} not found by name|text|CSS|XPath`);
      }
      let elem = res.value[0];
      return this.elementIdClear(elem.ELEMENT).elementIdValue(elem.ELEMENT, value);
    });
  }

  /**
   * Appends text to a input field or textarea.
   * Field is located by name, label, CSS or XPath
   *
   * ```js
   * I.appendField('#myTextField', 'appended');
   * ```
   */
  appendField(field, value) {
    return findFields(this.browser, field).then(function (res) {
      if (!res.value || res.value.length === 0) {
        throw new Error(`Field ${field} not found by name|text|CSS|XPath`);
      }
      let elem = res.value[0];
      return this.elementIdValue(elem.ELEMENT, value);
    });
  }

  /**
   * Selects an option in a drop-down select.
   * Field is siearched by label | name | CSS | XPath.
   * Option is selected by visible text or by value.
   *
   * ```js
   * I.selectOption('Choose Plan', 'Monthly'); // select by label
   * I.selectOption('subscription', 'Monthly'); // match option by text
   * I.selectOption('subscription', '0'); // or by value
   * I.selectOption('//form/select[@name=account]','Permium');
   * I.selectOption('form select[name=account]', 'Premium');
   * I.selectOption({css: 'form select[name=account]'}, 'Premium');
   * ```
   *
   * Provide an array for the second argument to select multiple options.
   *
   * ```js
   * I.selectOption('Which OS do you use?', ['Andriod', 'OSX']);
   * ```
   */
  selectOption(select, option) {
    return findFields(this.browser, select).then(function (res) {
      if (!res.value || res.value.length === 0) {
        throw new Error(`Selectable field ${select} not found by name|text|CSS|XPath`);
      }
      let elem = res.value[0];

      let normalized, byVisibleText;
      let commands = [];

      if (!Array.isArray(option)) {
        option = [option];
      }

      option.forEach((opt) => {
        normalized = `[normalize-space(.) = "${opt.trim() }"]`;
        byVisibleText = `./option${normalized}|./optgroup/option${normalized}`;
        commands.push(this.elementIdElements(elem.ELEMENT, byVisibleText));
      });
      return this.unify(commands, { extractValue: true }).then((els) => {
        commands = [];
        let clickOptionFn = (el) => {
          if (el[0]) el = el[0];
          if (el && el.ELEMENT) commands.push(this.elementIdClick(el.ELEMENT));
        };

        if (els.length) {
          els.forEach(clickOptionFn);
          return this.unify(commands);
        }
        let normalized, byValue;

        option.forEach((opt) => {
          normalized = `[normalize-space(@value) = "${opt.trim() }"]`;
          byValue = `./option${normalized}|./optgroup/option${normalized}`;
          commands.push(this.elementIdElements(elem.ELEMENT, byValue));
        });
        // try by value
        return this.unify(commands, { extractValue: true }).then((els) => {
          if (els.length === 0) {
            throw new Error(`Option ${option} in ${select} was found neither by visible text not by value`);
          }
          commands = [];
          els.forEach(clickOptionFn);
          return this.unify(commands);
        });
      });
    });
  }

  /**
   * Attaches a file to element located by label, name, CSS or XPath
   * Path to file is relative current codecept directory (where codecept.json is located).
   * File will be uploaded to remove system (if tests are running remotely).
   *
   * ```
   * I.attachFile('Avatar', 'data/avatar.jpg');
   * I.attachFile('form input[name=avatar]', 'data/avatar.jpg');
   * ```
   */
  attachFile(locator, pathToFile) {
    let file = path.join(global.codecept_dir, pathToFile);
    if (!fileExists(file)) {
      throw new Error(`File at ${file} can not be found on local system`);
    }
    return findFields(this.browser, locator).then((el) => {
      this.browser.uploadFile(file).then((res) => {
        if (!el.length) {
          throw new Error(`File field ${locator} not found by name|text|CSS|XPath`);
        }
        return this.browser.elementIdValue(el[0].ELEMENT, res.value);
      });
    });
  }



  /**
   * Selects a checkbox or radio button.
   * Element is located by label or name or CSS or XPath.
   *
   * The second parameter is a context (CSS or XPath locator) to narrow the search.
   *
   * ```js
   * I.checkOption('#agree');
   * I.checkOption('I Agree to Terms and Conditions');
   * I.checkOption('agree', '//form');
   * ```
   */
  checkOption(option, context) {
    let client = this.browser;
    let clickMethod = this.browser.isMobile ? 'touchClick' : 'elementIdClick';
    if (context) {
      client = client.element(withStrictLocator(context));
    }
    return findCheckable(client, option).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new Error(`Checkable ${option} cant be located by name|text|CSS|XPath`);
      }
      let elem = res.value[0];
      return client.elementIdSelected(elem.ELEMENT).then(function (isSelected) {
        if (isSelected.value) return true;
        return this[clickMethod](elem.ELEMENT);
      });
    });
  }

  /**
   * Retrieves a text from an element located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside a generator with `yield`** operator.
   *
   * ```js
   * let pin = yield I.grabTextFrom('#pin');
   * ```
   */
  grabTextFrom(locator) {
    return this.browser.getText(withStrictLocator(locator)).then(function (text) {
      return text;
    });
  }

  /**
   * Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside a generator with `yield`** operator.
   *
   * ```js
   * let postHTML = yield I.grabHTMLFrom('#post');
   * ```
   */
  grabHTMLFrom(locator) {
    return this.browser.getHTML(withStrictLocator(locator)).then(function (html) {
      return html;
    });
  }

  /**
   * Retrieves a value from a form element located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside a generator with `yield`** operator.
   *
   * ```js
   * let email = yield I.grabValueFrom('input[name=email]');
   * ```
   */
  grabValueFrom(locator) {
    return this.browser.getValue(withStrictLocator(locator)).then(function (text) {
      return text;
    });
  }

  /**
   * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside a generator with `yield`** operator.
   *
   * ```js
   * let hint = yield I.grabAttributeFrom('#tooltip', 'title');
   * ```
   */
  grabAttribute(locator, attr) {
    return this.browser.getAttribute(withStrictLocator(locator), attr).then(function (text) {
      return text;
    });
  }

  /**
   * Checks that title contains text.
   */
  seeInTitle(text) {
    return this.browser.getTitle().then((title) => {
      return stringIncludes('web page title').assert(text, title);
    });
  }

  /**
   * Checks that title does not contain text.
   */
  dontSeeInTitle(text) {
    return this.browser.getTitle().then((title) => {
      return stringIncludes('web page title').negate(text, title);
    });
  }

  /**
   * Retrieves a page title and returns it to test.
   * Resumes test execution, so **should be used inside a generator with `yield`** operator.
   *
   * ```js
   * let title = yield I.grabTitle();
   * ```
   */
  grabTitle() {
    return this.browser.getTitle().then((title) => {
      this.debugSection('Title', title);
      return title;
    });
  }

  /**
   * Checks that a page contains a visible text.
   * Use context parameter to narrow down the search.
   *
   * ```js
   * I.see('Welcome'); // text welcome on a page
   * I.see('Welcome', '.content'); // text inside .content div
   * I.see('Register', {css: 'form.register'}); // use strict locator
   * ```
   */
  see(text, context) {
    return proceedSee.call(this, 'assert', text, context);
  }

  /**
   * Opposite to `see`. Checks that a text is not present on a page.
   * Use context parameter to narrow down the search.
   *
   * ```js
   * I.dontSee('Login'); // assume we are already logged in
   * ```
   */
  dontSee(text, context) {
    return proceedSee.call(this, 'negate', text, context);
  }

  /**
   * Checks that the given input field or textarea equals to given value.
   * For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.
   *
   * ```js
   * I.seeInField('Username', 'davert');
   * I.seeInField({css: 'form textarea'},'Type your comment here');
   * I.seeInField('form input[type=hidden]','hidden_value');
   * I.seeInField('#searchform input','Search');
   * ```
   */
  seeInField(field, value) {
    return proceedSeeField.call(this, 'assert', field, value);
  }

  /**
   * Checks that value of input field or textare doesn't equal to given value
   * Opposite to `seeInField`
   */
  dontSeeInField(field, value) {
    return proceedSeeField.call(this, 'negate', field, value);
  }

  /**
   * Verifies that the specified checkbox is checked.
   *
   * ```js
   * I.seeCheckboxIsChecked('Agree');
   * I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
   * I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
   * ```
   */
  seeCheckboxIsChecked(field) {
    return proceedSeeCheckbox.call(this, 'assert', field);
  }

  /**
   * Verifies that the specified checkbox is not checked.
   */
  dontSeeCheckboxIsChecked(field) {
    return proceedSeeCheckbox.call(this, 'negate', field);
  }

  /**
   * Checks that element is present on page.
   * Element is located by CSS or XPath.
   *
   * ```js
   * I.seeElement('#modal');
   * ```
   */
  seeElement(locator) {
    return this.browser.elements(withStrictLocator(locator)).then(function (res) {
      return empty('elements').negate(res.value);
    });
  }

  /**
   * Opposite to `seeElement`. Checks that element is not on page.
   */
  dontSeeElement(locator) {
    return this.browser.elements(withStrictLocator(locator)).then(function (res) {
      return empty('elements').assert(res.value);
    });
  }

  /**
   * Checks that the current page contains the given string in its raw source code.
   *
   * ```js
   * I.seeInSource('<h1>Green eggs &amp; ham</h1>');
   * ```
   */
  seeInSource(text) {
    return this.browser.getSource().then((source) => {
      return stringIncludes('HTML source of a page').assert(text, source);
    });
  }

  /**
   * Checks that the current page contains the given string in its raw source code
   */
  dontSeeInSource(text) {
    return this.browser.getSource().then((source) => {
      return stringIncludes('HTML source of a page').negate(text, source);
    });
  }

  /**
  * asserts that an element appears a given number of times in the DOM
  * Element is located by label or name or CSS or XPath.
  *
  * ```js
  * I.seeNumberOfElements('#submitBtn', 1);
  * ```
  */
  seeNumberOfElements(selector, num) {
    return this.browser.elements(withStrictLocator(selector))
    .then(function (res) {
      return assert.equal(res.value.length, num);
    });
  }

  /**
   * Checks that current url contains a provided fragment.
   *
   * ```js
   * I.seeInCurrentUrl('/register'); // we are on registration page
   * ```
   */
  seeInCurrentUrl(urlFragment) {
    return this.browser.url().then(function (res) {
      return stringIncludes('url').assert(urlFragment, res.value);
    });
  }

  /**
   * Checks that current url does not contain a provided fragment.
   */
  dontSeeInCurrentUrl(urlFragment) {
    return this.browser.url().then(function (res) {
      return stringIncludes('url').negate(urlFragment, res.value);
    });
  }


  /**
   * Checks that current url is equal to provided one.
   * If a relative url provided, a configured url will be prepended to it.
   * So both examples will work:
   *
   * ```js
   * I.seeCurrentUrlEquals('/register');
   * I.seeCurrentUrlEquals('http://my.site.com/register');
   * ```
   *
   */
  seeCurrentUrlEquals(uri) {
    return this.browser.url().then((res) => {
      return urlEquals(this.options.url).assert(uri, res.value);
    });
  }

  /**
   * Checks that current url is not equal to provided one.
   * If a relative url provided, a configured url will be prepended to it.
   */
  dontSeeCurrentUrlEquals(uri) {
    return this.browser.url().then((res) => {
      return urlEquals(this.options.url).negate(uri, res.value);
    });
  }

  /**
   * Executes sync script on a page.
   * Pass arguments to function as additional parameters.
   * Will return execution result to a test.
   * In this case you should use generator and yield to receive results.
   */
  executeScript(fn) {
    return this.browser.execute.apply(this.browser, arguments);
  }

  /**
   * Executes async script on page.
   * Provided function should execute a passed callback (as first argument) to signal it is finished.
   */
  executeAsyncScript(fn) {
    return this.browser.executeAsync.apply(this.browser, arguments);
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
    return this.browser.scrollTo(withStrictLocator(locator), offsetX, offsetY);
  }

  /**
   * Moves cursor to element matched by locator.
   * Extra shift can be set with offsetX and offsetY options
   *
   * ```js
   * I.moveCursorTo('.tooltip');
   * I.moveCursorTo('#submit', 5,5);
   * ```
   */
  moveCursorTo(locator, offsetX, offsetY) {
    return this.browser.moveToObject(withStrictLocator(locator), offsetX, offsetY);
  }

  /**
   * Saves a screenshot to ouput folder (set in codecept.json).
   * Filename is relative to output folder.
   *
   * ```js
   * I.saveScreenshot('debug.png');
   * ```
   */
  saveScreenshot(fileName) {
    return this.browser.saveScreenshot(path.join(global.output_dir, fileName));
  }

  /**
   * Sets a [cookie](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object) object
   *
   * ```js
   * I.setCookie({name: 'auth', value: true});
   * ```
   */
  setCookie(cookie) {
    return this.browser.setCookie(cookie);
  }

  /**
   * Clears a cookie by name,
   * if none provided clears all cookies
   *
   * ```js
   * I.clearCookie();
   * I.clearCookie('test');
   * ```
   */
  clearCookie(cookie) {
    return this.browser.deleteCookie(cookie);
  }

  /**
   * Checks that cookie with given name exists.
   *
   * ```js
   * I.seeCookie('Auth');
   * ```
   */
  seeCookie(name) {
    return this.browser.getCookie(name).then(function (res) {
      return truth('cookie ' + name, 'to be set').assert(res);
    });
  }

  /**
   * Checks that cookie with given name does not exist.
   */
  dontSeeCookie(name) {
    return this.browser.getCookie(name).then(function (res) {
      return truth('cookie ' + name, 'to be set').negate(res);
    });
  }

  /**
   * Gets a cookie object by name
   * * Resumes test execution, so **should be used inside a generator with `yield`** operator.
   *
   * ```js
   * let cookie = I.grabCookie('auth');
   * assert(cookie.value, '123456');
   * ```
   */
  grabCookie(name) {
    return this.browser.getCookie(name);
  }

  /**
   * Accepts the active JavaScript native popup window, as created by window.alert|window.confirm|window.prompt.
   * Don't confuse popups with modal windows, as created by [various libraries](http://jster.net/category/windows-modals-popups).
   */
  acceptPopup() {
    return this.browser.alertText(function (err, res) {
      if (res !== null) {
        return this.alertAccept();
      }
    });
  }

  /**
   * Dismisses the active JavaScript popup, as created by window.alert|window.confirm|window.prompt.
   */
  cancelPopup() {
    return this.browser.alertText(function (err, res) {
      if (res !== null) {
        return this.alertDismiss();
      }
    });
  }

  /**
   * Checks that the active JavaScript popup, as created by `window.alert|window.confirm|window.prompt`, contains the given string.
   */
  seeInPopup(text) {
    return this.browser.alertText(function (err, res) {
      if (res === null) {
        throw new Error('Popup is not opened');
      }
      stringIncludes('text in popup').assert(text, res);
    });
  }

  /**
   * Presses a key on a focused element.
   * Speical keys like 'Enter', 'Control', [etc](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value)
   * will be replaced with corresponding unicode.
   *
   * If modiferier key is used (Control, Command, Alt, Shift) in array, it will be released afterwards.
   *
   * ```js
   * I.pressKey('Enter');
   * I.pressKey(['Control','a']);
   * ```
   *
   * To make combinations with modifier and mouse clicks (like Ctrl+Click) press a modifier, click, then release it.
   *
   * ```js
   * I.pressKey('Control');
   * I.click('#someelement');
   * I.pressKey('Control');
   * ```
   */
  pressKey(key) {
    let modifier;
    if (Array.isArray(key) && ~['Control','Command','Shift','Alt'].indexOf(key[0])) {
      modifier = key[0];
    }
    return this.browser.keys(key).then(function() {
      if (!modifier) return true;
      return this.keys(modifier); // release modifeier
    });
  }

  /**
   * Resize the current window to provided width and height.
   * First parameter can be set to `maximize`
   */
  resizeWindow(width, height) {
    if (width === 'maximize') {
      return this.browser.windowHandleMaximize(false);
    }
    return this.browser.windowHandleSize({ width, height });
  }

  /**
   * Pauses execution for a number of seconds.
   */
  wait(sec) {
    return this.browser.pause(sec * 1000);
  }

  /**
   * Waits for element to become enabled (by default waits for 1sec).
   * Element can be located by CSS or XPath.
   */
  waitForEnabled(selector, sec) {
    sec = sec || 1;
    return this.browser.waitForEnabled(withStrictLocator(selector), sec * 1000);
  }

  /**
   * Waits for element to be present on page (by default waits for 1sec).
   * Element can be located by CSS or XPath.
   */
  waitForElement(selector, sec) {
    sec = sec || 1;
    return this.browser.waitForExist(withStrictLocator(selector), sec * 1000);
  }

  /**
   * Waits for a text to appear (by default waits for 1sec).
   * Element can be located by CSS or XPath.
   * Narrow down search results by providing context.
   *
   * ```js
   * I.waitForText('Thank you, form has been submitted');
   * I.waitForText('Thank you, form has been submitted', 5, '#modal');
   * ```
   */
  waitForText(text, sec, context) {
    sec = sec || 1;
    context = context || 'body';
    return this.browser
      .waitUntil(function () {
        return this.getText(context).then(function (source) {
          if (Array.isArray(source)) {
            return source.filter(part => part.indexOf(text) >= 0).length > 0;
          }
          return source.indexOf(text) >= 0;
        });
      }, sec * 1000)
      .catch((e) => {
        if (e.type === 'CommandError') {
          return proceedSee.call(this, 'assert', text, context);
        } else {
          throw e;
        }
      });
  }

  /**
   * Waits for an element to become visible on a page (by default waits for 1sec).
   * Element can be located by CSS or XPath.
   */
  waitForVisible(selector, sec) {
    sec = sec || 1;
    return this.browser.waitForVisible(withStrictLocator(selector), sec * 1000);
  }

  /**
   * Waits for an element to become invisible on a page (by default waits for 1sec).
   * Element can be located by CSS or XPath.
   */
  waitToHide(selector, sec) {
    sec = sec || 1;
    return this.browser.waitForVisible(withStrictLocator(selector), sec * 1000, true);
  }

  /**
   * Waits for a function to return true (waits for 1sec by default).
   */
  waitUntil(fn, sec) {
    sec = sec || 1;
    return this.browser.waitUntil(fn, sec);
  }
}

function proceedSee(assertType, text, context) {
  let description;
  if (!context) {
    context = this.context;
    if (this.context === 'body') {
      description = 'web page';
    } else {
      description = 'current context ' + this.context;
    }
  } else {
    description = 'element ' + context;
  }
  return this.browser.getText(withStrictLocator(context)).then(function (source) {
    return stringIncludes(description)[assertType](text, source);
  });
}

function findClickable(client, locator) {
  if (typeof (locator) === 'object') return client.elements(withStrictLocator(locator));
  if (isCSSorXPathLocator(locator)) return client.elements(locator);

  let literal = xpathLocator.literal(locator);

  let narrowLocator = xpathLocator.combine([
    `.//a[normalize-space(.)=${literal}]`,
    `.//button[normalize-space(.)=${literal}]`,
    `.//a/img[normalize-space(@alt)=${literal}]/ancestor::a`,
    `.//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][normalize-space(@value)=${literal}]`
  ]);
  return client.elements(narrowLocator).then(function (els) {
    if (els.value.length) {
      return els;
    }
    let wideLocator = xpathLocator.combine([
      `.//a[./@href][((contains(normalize-space(string(.)), ${literal})) or .//img[contains(./@alt, ${literal})])]`,
      `.//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][contains(./@value, ${literal})]`,
      `.//input[./@type = 'image'][contains(./@alt, ${literal})]`,
      `.//button[contains(normalize-space(string(.)), ${literal})]`,
      `.//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][./@name = ${literal}]`,
      `.//button[./@name = ${literal}]`
    ]);
    return client.elements(wideLocator).then(function (els) {
      if (els.value.length) {
        return els;
      }
      return client.elements(locator); // by css or xpath
    });
  });
}

function findFields(client, locator) {
  if (typeof (locator) === 'object') return client.elements(withStrictLocator(locator));
  if (isCSSorXPathLocator(locator)) return client.elements(locator);

  let literal = xpathLocator.literal(locator);
  let byText = xpathLocator.combine([
    `.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')][(((./@name = ${literal}) or ./@id = //label[contains(normalize-space(string(.)), ${literal})]/@for) or ./@placeholder = ${literal})]`,
    `.//label[contains(normalize-space(string(.)), ${literal})]//.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')]`
  ]);
  return client.elements(byText).then((els) => {
    if (els.value.length) return els;
    let byName = `.//*[self::input | self::textarea | self::select][@name = ${literal}]`;
    return client.elements(byName).then((els) => {
      if (els.value.length) return els;
      return client.elements(locator); // by css or xpath
    });
  });
}

function proceedSeeField(assertType, field, value) {
  return findFields(this.browser, field).then(function (res) {
    if (!res.value || res.value.length === 0) {
      throw new Error(`Field ${field} not found by name|text|CSS|XPath`);
    }

    var proceedMultiple = (fields) => {
      let commands = [];
      fields.forEach((el) => commands.push(this.elementIdSelected(el.ELEMENT)));
      this.unify(commands).then((res) => {
        commands = [];
        fields.forEach((el) => {
          if (el.value === false) return;
          commands.push(this.elementIdAttribute(el.ELEMENT, 'value'));
        });
        this.unify(commands, { extractValue: true }).then((val) => {
          return stringIncludes('fields by ' + field)[assertType](value, val);
        });
      });
    }

    var proceedSingle = (el) => {
      return this.elementIdAttribute(el.ELEMENT, 'value').then((res) => {
        return stringIncludes('fields by ' + field)[assertType](value, res.value);
      });
    }

    return this.elementIdName(res.value[0].ELEMENT).then((tag) => {
      if (tag.value == 'select') {
        return proceedMultiple(res.value);
      }

      if (tag.value == 'input') {
        return this.elementIdAttribute(res.value[0].ELEMENT, 'type').then((type) => {
          if (type.value == 'checkbox' || type.value == 'radio') {
            return proceedMultiple(res.value);
          }
          return proceedSingle(res.value[0]);
        });
      }
      return proceedSingle(res.value[0]);
    });
  });
}

function proceedSeeCheckbox(assertType, field) {
  return findFields(this.browser, field).then(function (res) {
    if (!res.value || res.value.length === 0) {
      throw new Error(`Field ${field} not found by name|text|CSS|XPath`);
    }
    let commands = [];
    res.value.forEach((el) => commands.push(this.elementIdSelected(el.ELEMENT)));
    return this.unify(commands, { extractValue: true }).then((selected) => {
      return truth(`checkable field ${field}`, 'to be checked')[assertType](selected);
    });
  });
}

function findCheckable(client, locator) {
  if (typeof (locator) === 'object') return client.elements(withStrictLocator(locator));
  if (isCSSorXPathLocator(locator)) return client.elements(locator);

  let literal = xpathLocator.literal(locator);
  let byText = xpathLocator.combine([
    `.//input[@type = 'checkbox' or @type = 'radio'][(@id = //label[contains(normalize-space(string(.)), ${literal})]/@for) or @placeholder = ${literal}]`,
    `.//label[contains(normalize-space(string(.)), ${literal})]//input[@type = 'radio' or @type = 'checkbox']`
  ]);
  return client.elements(byText).then(function (els) {
    if (els.value.length) return els;
    let byName = `.//input[@type = 'checkbox' or @type = 'radio'][@name = ${literal}]`;
    return client.elements(byName).then(function (els) {
      if (els.value.length) return els;
      return client.elements(locator); // by css or xpath
    });
  });
}

function isCSSorXPathLocator(locator) {
  if (locator[0] === '#' || locator[0] === '.') {
    return true;
  }
  if (locator.substr(0, 2) === '//') {
    return true;
  }
  return false;
}

function withStrictLocator(locator) {
  if (!locator) return null;
  if (typeof (locator) !== 'object') return locator;
  let key = Object.keys(locator)[0];
  let value = locator[key];
  switch (key) {
  case 'by':
  case 'xpath':
  case 'css': return value;
  case 'id': return '#' + value;
  case 'name': return `[name="value"]`;
  }
}

module.exports = WebDriverIO;
