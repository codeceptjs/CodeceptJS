const path = require('path');

const urlResolve = require('url').resolve;

const Helper = require('@codeceptjs/helper');
const { includes: stringIncludes } = require('../assert/include');
const { urlEquals } = require('../assert/equal');
const { equals } = require('../assert/equal');
const { empty } = require('../assert/empty');
const { truth } = require('../assert/truth');
const Locator = require('../locator');
const ElementNotFound = require('./errors/ElementNotFound');
const {
  xpathLocator,
  fileExists,
  screenshotOutputFolder,
  toCamelCase,
} = require('../utils');

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
 * This helper should be configured in codecept.conf.ts or codecept.conf.js
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
 * ## Methods
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
      {
        name: 'show', message: 'Show browser window', default: true, type: 'confirm',
      },
    ];
  }

  static _checkRequirements() {
    try {
      require('nightmare');
    } catch (e) {
      return ['nightmare'];
    }
  }

  async _init() {
    this.Nightmare = require('nightmare');

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
          throw new Error(`Element ${(new Locator(locator))} couldn't be located by ${by}`);
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
              }, (err) => {
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
   * If url starts with `/`, opens a web page of a site defined in `url` config parameter.
   * 
   * ```js
   * I.amOnPage('/'); // opens main page of website
   * I.amOnPage('https://github.com'); // opens github
   * I.amOnPage('/login'); // opens a login page
   * ```
   * 
   * @param {string} url url path or global url.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   * @param {?object} headers list of request headers can be passed
   *
   */
  async amOnPage(url, headers = null) {
    if (!(/^\w+\:\/\//.test(url))) {
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
   * 
   * ```js
   * I.seeInTitle('Home Page');
   * ```
   * 
   * @param {string} text text value to check.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async seeInTitle(text) {
    const title = await this.browser.title();
    stringIncludes('web page title').assert(text, title);
  }

  /**
   * Checks that title does not contain text.
   * 
   * ```js
   * I.dontSeeInTitle('Error');
   * ```
   * 
   * @param {string} text value to check.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async dontSeeInTitle(text) {
    const title = await this.browser.title();
    stringIncludes('web page title').negate(text, title);
  }

  /**
   * Retrieves a page title and returns it to test.
   * Resumes test execution, so **should be used inside async with `await`** operator.
   * 
   * ```js
   * let title = await I.grabTitle();
   * ```
   * 
   * @returns {Promise<string>} title
   */
  async grabTitle() {
    return this.browser.title();
  }

  /**
   * Get current URL from browser.
   * Resumes test execution, so should be used inside an async function.
   * 
   * ```js
   * let url = await I.grabCurrentUrl();
   * console.log(`Current URL is [${url}]`);
   * ```
   * 
   * @returns {Promise<string>} current URL
   */
  async grabCurrentUrl() {
    return this.browser.url();
  }

  /**
   * Checks that current url contains a provided fragment.
   * 
   * ```js
   * I.seeInCurrentUrl('/register'); // we are on registration page
   * ```
   * 
   * @param {string} url a fragment to check
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async seeInCurrentUrl(url) {
    const currentUrl = await this.browser.url();
    stringIncludes('url').assert(url, currentUrl);
  }

  /**
   * Checks that current url does not contain a provided fragment.
   * 
   * @param {string} url value to check.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async dontSeeInCurrentUrl(url) {
    const currentUrl = await this.browser.url();
    stringIncludes('url').negate(url, currentUrl);
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
   * @param {string} url value to check.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async seeCurrentUrlEquals(url) {
    const currentUrl = await this.browser.url();
    urlEquals(this.options.url).assert(url, currentUrl);
  }

  /**
   * Checks that current url is not equal to provided one.
   * If a relative url provided, a configured url will be prepended to it.
   * 
   * ```js
   * I.dontSeeCurrentUrlEquals('/login'); // relative url are ok
   * I.dontSeeCurrentUrlEquals('http://mysite.com/login'); // absolute urls are also ok
   * ```
   * 
   * @param {string} url value to check.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async dontSeeCurrentUrlEquals(url) {
    const currentUrl = await this.browser.url();
    urlEquals(this.options.url).negate(url, currentUrl);
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
   * @param {string} text expected on page.
   * @param {?string | object} [context=null] (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async see(text, context = null) {
    return proceedSee.call(this, 'assert', text, context);
  }

  /**
   * Opposite to `see`. Checks that a text is not present on a page.
   * Use context parameter to narrow down the search.
   * 
   * ```js
   * I.dontSee('Login'); // assume we are already logged in.
   * I.dontSee('Login', '.nav'); // no login inside .nav element
   * ```
   * 
   * @param {string} text which is not present.
   * @param {string | object} [context] (optional) element located by CSS|XPath|strict locator in which to perfrom search.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  dontSee(text, context = null) {
    return proceedSee.call(this, 'negate', text, context);
  }

  /**
   * Checks that a given Element is visible
   * Element is located by CSS or XPath.
   * 
   * ```js
   * I.seeElement('#modal');
   * ```
   * @param {string | object} locator located by CSS|XPath|strict locator.
   * @returns {void} automatically synchronized promise through #recorder
   * 
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
   * 
   * ```js
   * I.dontSeeElement('.modal'); // modal is not shown
   * ```
   * 
   * @param {string | object} locator located by CSS|XPath|Strict locator.
   * @returns {void} automatically synchronized promise through #recorder
   * 
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
   * Element is located by CSS or XPath.
   * 
   * ```js
   * I.seeElementInDOM('#modal');
   * ```
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async seeElementInDOM(locator) {
    locator = new Locator(locator, 'css');
    const els = await this.browser.findElements(locator.toStrict());
    empty('elements').negate(els.fill('ELEMENT'));
  }

  /**
   * Opposite to `seeElementInDOM`. Checks that element is not on page.
   * 
   * ```js
   * I.dontSeeElementInDOM('.nav'); // checks that element is not on page visible or not
   * ```
   * 
   * @param {string | object} locator located by CSS|XPath|Strict locator.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async dontSeeElementInDOM(locator) {
    locator = new Locator(locator, 'css');
    const els = await this.browser.findElements(locator.toStrict());
    empty('elements').assert(els.fill('ELEMENT'));
  }

  /**
   * Checks that the current page contains the given string in its raw source code.
   * 
   * ```js
   * I.seeInSource('<h1>Green eggs &amp; ham</h1>');
   * ```
   * @param {string} text value to check.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async seeInSource(text) {
    const source = await this.browser.evaluate(() => document.documentElement.outerHTML);
    stringIncludes('HTML source of a page').assert(text, source);
  }

  /**
   * Checks that the current page does not contains the given string in its raw source code.
   * 
   * ```js
   * I.dontSeeInSource('<!--'); // no comments in source
   * ```
   * 
   * @param {string} value to check.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async dontSeeInSource(text) {
    const source = await this.browser.evaluate(() => document.documentElement.outerHTML);
    stringIncludes('HTML source of a page').negate(text, source);
  }

  /**
   * Asserts that an element appears a given number of times in the DOM.
   * Element is located by label or name or CSS or XPath.
   * 
   * 
   * ```js
   * I.seeNumberOfElements('#submitBtn', 1);
   * ```
   * 
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {number} num number of elements.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async seeNumberOfElements(locator, num) {
    const elements = await this._locate(locator);
    return equals(`expected number of elements (${(new Locator(locator))}) is ${num}, but found ${elements.length}`).assert(elements.length, num);
  }

  /**
   * Asserts that an element is visible a given number of times.
   * Element is located by CSS or XPath.
   * 
   * ```js
   * I.seeNumberOfVisibleElements('.buttons', 3);
   * ```
   * 
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {number} num number of elements.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async seeNumberOfVisibleElements(locator, num) {
    const res = await this.grabNumberOfVisibleElements(locator);
    return equals(`expected number of visible elements (${(new Locator(locator))}) is ${num}, but found ${res}`).assert(res, num);
  }

  /**
   * Grab number of visible elements by locator.
   * Resumes test execution, so **should be used inside async function with `await`** operator.
   * 
   * ```js
   * let numOfElements = await I.grabNumberOfVisibleElements('p');
   * ```
   * 
   * @param {string | object} locator located by CSS|XPath|strict locator.
   * @returns {Promise<number>} number of visible elements
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
   * 
   * @param {string | object} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
   * @param {?string | object | null} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async click(locator, context = null) {
    const el = await findClickable.call(this, locator, context);
    assertElementExists(el, locator, 'Clickable');
    return this.browser.evaluate(el => window.codeceptjs.clickEl(el), el)
      .wait(this.options.waitForAction);
  }

  /**
   * Performs a double-click on an element matched by link|button|label|CSS or XPath.
   * Context can be specified as second parameter to narrow search.
   * 
   * ```js
   * I.doubleClick('Edit');
   * I.doubleClick('Edit', '.actions');
   * I.doubleClick({css: 'button.accept'});
   * I.doubleClick('.btn.edit');
   * ```
   * 
   * @param {string | object} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
   * @param {?string | object} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async doubleClick(locator, context = null) {
    const el = await findClickable.call(this, locator, context);
    assertElementExists(el, locator, 'Clickable');
    return this.browser.evaluate(el => window.codeceptjs.doubleClickEl(el), el)
      .wait(this.options.waitForAction);
  }

  /**
   * Performs right click on a clickable element matched by semantic locator, CSS or XPath.
   * 
   * ```js
   * // right click element with id el
   * I.rightClick('#el');
   * // right click link or button with text "Click me"
   * I.rightClick('Click me');
   * // right click button with text "Click me" inside .context
   * I.rightClick('Click me', '.context');
   * ```
   * 
   * @param {string | object} locator clickable element located by CSS|XPath|strict locator.
   * @param {?string | object} [context=null] (optional, `null` by default) element located by CSS|XPath|strict locator.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async rightClick(locator, context = null) {
    const el = await findClickable.call(this, locator, context);
    assertElementExists(el, locator, 'Clickable');
    return this.browser.evaluate(el => window.codeceptjs.rightClickEl(el), el)
      .wait(this.options.waitForAction);
  }

  /**
   * Moves cursor to element matched by locator.
   * Extra shift can be set with offsetX and offsetY options.
   * 
   * ```js
   * I.moveCursorTo('.tooltip');
   * I.moveCursorTo('#submit', 5,5);
   * ```
   * 
   * @param {string | object} locator located by CSS|XPath|strict locator.
   * @param {number} [offsetX=0] (optional, `0` by default) X-axis offset.
   * @param {number} [offsetY=0] (optional, `0` by default) Y-axis offset.
   * @returns {void} automatically synchronized promise through #recorder
   * 
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
   * Pass arguments to function as additional parameters.
   * Will return execution result to a test.
   * In this case you should use async function and await to receive results.
   * 
   * Example with jQuery DatePicker:
   * 
   * ```js
   * // change date of jQuery DatePicker
   * I.executeScript(function() {
   *   // now we are inside browser context
   *   $('date').datetimepicker('setDate', new Date());
   * });
   * ```
   * Can return values. Don't forget to use `await` to get them.
   * 
   * ```js
   * let date = await I.executeScript(function(el) {
   *   // only basic types can be returned
   *   return $(el).datetimepicker('getDate').toString();
   * }, '#date'); // passing jquery selector
   * ```
   * 
   * @param {string|function} fn function to be executed in browser context.
   * @param {...any} args to be passed to function.
   * @returns {Promise<any>} script return value
   * 
   *
   * Wrapper for synchronous [evaluate](https://github.com/segmentio/nightmare#evaluatefn-arg1-arg2)
   */
  async executeScript(...args) {
    return this.browser.evaluate.apply(this.browser, args)
      .catch(err => err); // Nightmare's first argument is error :(
  }

  /**
   * Executes async script on page.
   * Provided function should execute a passed callback (as first argument) to signal it is finished.
   * 
   * Example: In Vue.js to make components completely rendered we are waiting for [nextTick](https://vuejs.org/v2/api/#Vue-nextTick).
   * 
   * ```js
   * I.executeAsyncScript(function(done) {
   *   Vue.nextTick(done); // waiting for next tick
   * });
   * ```
   * 
   * By passing value to `done()` function you can return values.
   * Additional arguments can be passed as well, while `done` function is always last parameter in arguments list.
   * 
   * ```js
   * let val = await I.executeAsyncScript(function(url, done) {
   *   // in browser context
   *   $.ajax(url, { success: (data) => done(data); }
   * }, 'http://ajax.callback.url/');
   * ```
   * 
   * @param {string|function} fn function to be executed in browser context.
   * @param {...any} args to be passed to function.
   * @returns {Promise<any>} script return value
   * 
   *
   * Wrapper for asynchronous [evaluate](https://github.com/segmentio/nightmare#evaluatefn-arg1-arg2).
   * Unlike NightmareJS implementation calling `done` will return its first argument.
   */
  async executeAsyncScript(...args) {
    return this.browser.evaluate.apply(this.browser, args)
      .catch(err => err); // Nightmare's first argument is error :(
  }

  /**
   * Resize the current window to provided width and height.
   * First parameter can be set to `maximize`.
   * 
   * @param {number} width width in pixels or `maximize`.
   * @param {number} height height in pixels.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async resizeWindow(width, height) {
    if (width === 'maximize') {
      throw new Error('Nightmare doesn\'t support resizeWindow to maximum!');
    }
    return this.browser.viewport(width, height).wait(this.options.waitForAction);
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
   * @param {string | object} field checkbox located by label | name | CSS | XPath | strict locator.
   * @param {?string | object} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async checkOption(field, context = null) {
    const els = await findCheckable.call(this, field, context);
    assertElementExists(els[0], field, 'Checkbox or radio');
    return this.browser.evaluate(els => window.codeceptjs.checkEl(els[0]), els)
      .wait(this.options.waitForAction);
  }

  /**
   * Unselects a checkbox or radio button.
   * Element is located by label or name or CSS or XPath.
   * 
   * The second parameter is a context (CSS or XPath locator) to narrow the search.
   * 
   * ```js
   * I.uncheckOption('#agree');
   * I.uncheckOption('I Agree to Terms and Conditions');
   * I.uncheckOption('agree', '//form');
   * ```
   * @param {string | object} field checkbox located by label | name | CSS | XPath | strict locator.
   * @param {?string | object} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async uncheckOption(field, context = null) {
    const els = await findCheckable.call(this, field, context);
    assertElementExists(els[0], field, 'Checkbox or radio');
    return this.browser.evaluate(els => window.codeceptjs.unCheckEl(els[0]), els)
      .wait(this.options.waitForAction);
  }

  /**
   * Fills a text field or textarea, after clearing its value, with the given string.
   * Field is located by name, label, CSS, or XPath.
   * 
   * ```js
   * // by label
   * I.fillField('Email', 'hello@world.com');
   * // by name
   * I.fillField('password', secret('123456'));
   * // by CSS
   * I.fillField('form#login input[name=username]', 'John');
   * // or by strict locator
   * I.fillField({css: 'form#login input[name=username]'}, 'John');
   * ```
   * @param {string | object} field located by label|name|CSS|XPath|strict locator.
   * @param {string | object} value text value to fill.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async fillField(field, value) {
    const el = await findField.call(this, field);
    assertElementExists(el, field, 'Field');
    return this.browser.enterText(el, value.toString(), true)
      .wait(this.options.waitForAction);
  }

  /**
   * Clears a `<textarea>` or text `<input>` element's value.
   * 
   * ```js
   * I.clearField('Email');
   * I.clearField('user[email]');
   * I.clearField('#email');
   * ```
   * @param {string | object} editable field located by label|name|CSS|XPath|strict locator.
   * @returns {void} automatically synchronized promise through #recorder.
   * 
   */
  async clearField(field) {
    return this.fillField(field, '');
  }

  /**
   * Appends text to a input field or textarea.
   * Field is located by name, label, CSS or XPath
   * 
   * ```js
   * I.appendField('#myTextField', 'appended');
   * // typing secret
   * I.appendField('password', secret('123456'));
   * ```
   * @param {string | object} field located by label|name|CSS|XPath|strict locator
   * @param {string} value text value to append.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async appendField(field, value) {
    const el = await findField.call(this, field);
    assertElementExists(el, field, 'Field');
    return this.browser.enterText(el, value.toString(), false)
      .wait(this.options.waitForAction);
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
   * @param {string | object} field located by label|name|CSS|XPath|strict locator.
   * @param {string | object} value value to check.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async seeInField(field, value) {
    const _value = (typeof value === 'boolean') ? value : value.toString();
    return proceedSeeInField.call(this, 'assert', field, _value);
  }

  /**
   * Checks that value of input field or textarea doesn't equal to given value
   * Opposite to `seeInField`.
   * 
   * ```js
   * I.dontSeeInField('email', 'user@user.com'); // field by name
   * I.dontSeeInField({ css: 'form input.email' }, 'user@user.com'); // field by CSS
   * ```
   * 
   * @param {string | object} field located by label|name|CSS|XPath|strict locator.
   * @param {string | object} value value to check.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async dontSeeInField(field, value) {
    const _value = (typeof value === 'boolean') ? value : value.toString();
    return proceedSeeInField.call(this, 'negate', field, _value);
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
   * 
   * ```js
   * I.seeCheckboxIsChecked('Agree');
   * I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
   * I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
   * ```
   * 
   * @param {string | object} field located by label|name|CSS|XPath|strict locator.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async seeCheckboxIsChecked(field) {
    return proceedIsChecked.call(this, 'assert', field);
  }

  /**
   * Verifies that the specified checkbox is not checked.
   * 
   * ```js
   * I.dontSeeCheckboxIsChecked('#agree'); // located by ID
   * I.dontSeeCheckboxIsChecked('I agree to terms'); // located by label
   * I.dontSeeCheckboxIsChecked('agree'); // located by name
   * ```
   * 
   * @param {string | object} field located by label|name|CSS|XPath|strict locator.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async dontSeeCheckboxIsChecked(field) {
    return proceedIsChecked.call(this, 'negate', field);
  }

  /**
   * Attaches a file to element located by label, name, CSS or XPath
   * Path to file is relative current codecept directory (where codecept.conf.ts or codecept.conf.js is located).
   * File will be uploaded to remote system (if tests are running remotely).
   * 
   * ```js
   * I.attachFile('Avatar', 'data/avatar.jpg');
   * I.attachFile('form input[name=avatar]', 'data/avatar.jpg');
   * ```
   * 
   * @param {string | object} locator field located by label|name|CSS|XPath|strict locator.
   * @param {string} pathToFile local file path relative to codecept.conf.ts or codecept.conf.js config file.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   *
   * Doesn't work if the Chromium DevTools panel is open (as Chromium allows only one attachment to the debugger at a time. [See more](https://github.com/rosshinkley/nightmare-upload#important-note-about-setting-file-upload-inputs))
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
   * Retrieves all texts from an element located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside async with `await`** operator.
   * 
   * ```js
   * let pins = await I.grabTextFromAll('#pin li');
   * ```
   * 
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @returns {Promise<string[]>} attribute value
   * 
   */
  async grabTextFromAll(locator) {
    locator = new Locator(locator, 'css');
    const els = await this.browser.findElements(locator.toStrict());
    const texts = [];
    const getText = el => window.codeceptjs.fetchElement(el).innerText;
    for (const el of els) {
      texts.push(await this.browser.evaluate(getText, el));
    }
    return texts;
  }

  /**
   * Retrieves a text from an element located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside async with `await`** operator.
   * 
   * ```js
   * let pin = await I.grabTextFrom('#pin');
   * ```
   * If multiple elements found returns first element.
   * 
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @returns {Promise<string>} attribute value
   * 
   */
  async grabTextFrom(locator) {
    locator = new Locator(locator, 'css');
    const els = await this.browser.findElement(locator.toStrict());
    assertElementExists(els, locator);
    const texts = await this.grabTextFromAll(locator);
    if (texts.length > 1) {
      this.debugSection('GrabText', `Using first element out of ${texts.length}`);
    }

    return texts[0];
  }

  /**
   * Retrieves an array of value from a form located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside async function with `await`** operator.
   * 
   * ```js
   * let inputs = await I.grabValueFromAll('//form/input');
   * ```
   * @param {string | object} locator field located by label|name|CSS|XPath|strict locator.
   * @returns {Promise<string[]>} attribute value
   * 
   */
  async grabValueFromAll(locator) {
    locator = new Locator(locator, 'css');
    const els = await this.browser.findElements(locator.toStrict());
    const values = [];
    const getValues = el => window.codeceptjs.fetchElement(el).value;
    for (const el of els) {
      values.push(await this.browser.evaluate(getValues, el));
    }

    return values;
  }

  /**
   * Retrieves a value from a form element located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside async function with `await`** operator.
   * If more than one element is found - value of first element is returned.
   * 
   * ```js
   * let email = await I.grabValueFrom('input[name=email]');
   * ```
   * @param {string | object} locator field located by label|name|CSS|XPath|strict locator.
   * @returns {Promise<string>} attribute value
   * 
   */
  async grabValueFrom(locator) {
    const el = await findField.call(this, locator);
    assertElementExists(el, locator, 'Field');
    const values = await this.grabValueFromAll(locator);
    if (values.length > 1) {
      this.debugSection('GrabValue', `Using first element out of ${values.length}`);
    }

    return values[0];
  }

  /**
   * Retrieves an array of attributes from elements located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside async with `await`** operator.
   * 
   * ```js
   * let hints = await I.grabAttributeFromAll('.tooltip', 'title');
   * ```
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {string} attr attribute name.
   * @returns {Promise<string[]>} attribute value
   * 
   */
  async grabAttributeFromAll(locator, attr) {
    locator = new Locator(locator, 'css');
    const els = await this.browser.findElements(locator.toStrict());
    const array = [];

    for (let index = 0; index < els.length; index++) {
      const el = els[index];
      array.push(await this.browser.evaluate((el, attr) => window.codeceptjs.fetchElement(el).getAttribute(attr), el, attr));
    }

    return array;
  }

  /**
   * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside async with `await`** operator.
   * If more than one element is found - attribute of first element is returned.
   * 
   * ```js
   * let hint = await I.grabAttributeFrom('#tooltip', 'title');
   * ```
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {string} attr attribute name.
   * @returns {Promise<string>} attribute value
   * 
   */
  async grabAttributeFrom(locator, attr) {
    locator = new Locator(locator, 'css');
    const els = await this.browser.findElement(locator.toStrict());
    assertElementExists(els, locator);

    const attrs = await this.grabAttributeFromAll(locator, attr);
    if (attrs.length > 1) {
      this.debugSection('GrabAttribute', `Using first element out of ${attrs.length}`);
    }

    return attrs[0];
  }

  /**
   * Retrieves all the innerHTML from elements located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside async function with `await`** operator.
   * 
   * ```js
   * let postHTMLs = await I.grabHTMLFromAll('.post');
   * ```
   * 
   * @param {string | object} element located by CSS|XPath|strict locator.
   * @returns {Promise<string[]>} HTML code for an element
   * 
   */
  async grabHTMLFromAll(locator) {
    locator = new Locator(locator, 'css');
    const els = await this.browser.findElements(locator.toStrict());
    const array = [];

    for (let index = 0; index < els.length; index++) {
      const el = els[index];
      array.push(await this.browser.evaluate(el => window.codeceptjs.fetchElement(el).innerHTML, el));
    }
    this.debugSection('GrabHTML', array);

    return array;
  }

  /**
   * Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside async function with `await`** operator.
   * If more than one element is found - HTML of first element is returned.
   * 
   * ```js
   * let postHTML = await I.grabHTMLFrom('#post');
   * ```
   * 
   * @param {string | object} element located by CSS|XPath|strict locator.
   * @returns {Promise<string>} HTML code for an element
   * 
   */
  async grabHTMLFrom(locator) {
    locator = new Locator(locator, 'css');
    const els = await this.browser.findElement(locator.toStrict());
    assertElementExists(els, locator);
    const html = await this.grabHTMLFromAll(locator);
    if (html.length > 1) {
      this.debugSection('GrabHTML', `Using first element out of ${html.length}`);
    }

    return html[0];
  }

  /**
   * Grab CSS property for given locator
   * Resumes test execution, so **should be used inside an async function with `await`** operator.
   * If more than one element is found - value of first element is returned.
   * 
   * ```js
   * const value = await I.grabCssPropertyFrom('h3', 'font-weight');
   * ```
   * 
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {string} cssProperty CSS property name.
   * @returns {Promise<string>} CSS value
   * 
   */
  async grabCssPropertyFrom(locator, cssProperty) {
    locator = new Locator(locator, 'css');
    const els = await this.browser.findElements(locator.toStrict());
    const array = [];

    const getCssPropForElement = async (el, prop) => {
      return (await this.browser.evaluate((el) => {
        return window.getComputedStyle(window.codeceptjs.fetchElement(el));
      }, el))[toCamelCase(prop)];
    };

    for (const el of els) {
      assertElementExists(el, locator);
      const cssValue = await getCssPropForElement(el, cssProperty);
      array.push(cssValue);
    }
    this.debugSection('HTML', array);

    return array.length > 1 ? array : array[0];
  }

  _injectClientScripts() {
    return this.browser.inject('js', path.join(__dirname, 'clientscripts', 'nightmare.js'));
  }

  /**
   * Selects an option in a drop-down select.
   * Field is searched by label | name | CSS | XPath.
   * Option is selected by visible text or by value.
   * 
   * ```js
   * I.selectOption('Choose Plan', 'Monthly'); // select by label
   * I.selectOption('subscription', 'Monthly'); // match option by text
   * I.selectOption('subscription', '0'); // or by value
   * I.selectOption('//form/select[@name=account]','Premium');
   * I.selectOption('form select[name=account]', 'Premium');
   * I.selectOption({css: 'form select[name=account]'}, 'Premium');
   * ```
   * 
   * Provide an array for the second argument to select multiple options.
   * 
   * ```js
   * I.selectOption('Which OS do you use?', ['Android', 'iOS']);
   * ```
   * @param {string | object} select field located by label|name|CSS|XPath|strict locator.
   * @param {string|Array<*>} option visible text or value of option.
   * @returns {void} automatically synchronized promise through #recorder
   * 
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
   * Sets cookie(s).
   * 
   * Can be a single cookie object or an array of cookies:
   * 
   * ```js
   * I.setCookie({name: 'auth', value: true});
   * 
   * // as array
   * I.setCookie([
   *   {name: 'auth', value: true},
   *   {name: 'agree', value: true}
   * ]);
   * ```
   * 
   * @param {Cookie|Array<Cookie>} cookie a cookie object or array of cookie objects.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   *
   * Wrapper for `.cookies.set(cookie)`.
   * [See more](https://github.com/segmentio/nightmare/blob/master/Readme.md#cookiessetcookie)
   */
  async setCookie(cookie) {
    return this.browser.cookies.set(cookie);
  }

  /**
   * Checks that cookie with given name exists.
   * 
   * ```js
   * I.seeCookie('Auth');
   * ```
   * 
   * @param {string} name cookie name.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   *
   */
  async seeCookie(name) {
    const res = await this.browser.cookies.get(name);
    truth(`cookie ${name}`, 'to be set').assert(res);
  }

  /**
   * Checks that cookie with given name does not exist.
   * 
   * ```js
   * I.dontSeeCookie('auth'); // no auth cookie
   * ```
   * 
   * @param {string} name cookie name.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async dontSeeCookie(name) {
    const res = await this.browser.cookies.get(name);
    truth(`cookie ${name}`, 'to be set').negate(res);
  }

  /**
   * Gets a cookie object by name.
   * If none provided gets all cookies.
   * Resumes test execution, so **should be used inside async function with `await`** operator.
   * 
   * ```js
   * let cookie = await I.grabCookie('auth');
   * assert(cookie.value, '123456');
   * ```
   * 
   * @param {?string} [name=null] cookie name.
   * @returns {any} attribute value
   * 
   *
   * Cookie in JSON format. If name not passed returns all cookies for this domain.
   *
   * Multiple cookies can be received by passing query object `I.grabCookie({ secure: true});`. If you'd like get all cookies for all urls, use: `.grabCookie({ url: null }).`
   */
  async grabCookie(name) {
    return this.browser.cookies.get(name);
  }

  /**
   * Clears a cookie by name,
   * if none provided clears all cookies.
   * 
   * ```js
   * I.clearCookie();
   * I.clearCookie('test'); // Playwright currently doesn't support clear a particular cookie name
   * ```
   * 
   * @param {?string} [cookie=null] (optional, `null` by default) cookie name
   * 
   */
  async clearCookie(cookie) {
    if (!cookie) {
      return this.browser.cookies.clearAll();
    }
    return this.browser.cookies.clear(cookie);
  }

  /**
   * Waits for a function to return true (waits for 1 sec by default).
   * Running in browser context.
   * 
   * ```js
   * I.waitForFunction(fn[, [args[, timeout]])
   * ```
   * 
   * ```js
   * I.waitForFunction(() => window.requests == 0);
   * I.waitForFunction(() => window.requests == 0, 5); // waits for 5 sec
   * I.waitForFunction((count) => window.requests == count, [3], 5) // pass args and wait for 5 sec
   * ```
   * 
   * @param {string|function} fn to be executed in browser context.
   * @param {any[]|number} [argsOrSec] (optional, `1` by default) arguments for function or seconds.
   * @param {number} [sec] (optional, `1` by default) time in seconds to wait
   * @returns {void} automatically synchronized promise through #recorder
   * 
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
   * 
   * ```js
   * I.wait(2); // wait 2 secs
   * ```
   * 
   * @param {number} sec number of second to wait.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async wait(sec) {
    return new Promise(((done) => {
      setTimeout(done, sec * 1000);
    }));
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
   * 
   * @param {string }text to wait for.
   * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
   * @param {string | object} [context] (optional) element located by CSS|XPath|strict locator.
   * @returns {void} automatically synchronized promise through #recorder
   * 
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
   * Element can be located by CSS or XPath.
   * 
   * ```js
   * I.waitForVisible('#popup');
   * ```
   * 
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
   * @returns {void} automatically synchronized promise through #recorder
   * 
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
   * Element can be located by CSS or XPath.
   * 
   * ```js
   * I.waitToHide('#popup');
   * ```
   * 
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async waitToHide(locator, sec = null) {
    return this.waitForInvisible(locator, sec);
  }

  /**
   * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
   * Element can be located by CSS or XPath.
   * 
   * ```js
   * I.waitForInvisible('#popup');
   * ```
   * 
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
   * @returns {void} automatically synchronized promise through #recorder
   * 
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
   * Element can be located by CSS or XPath.
   * 
   * ```js
   * I.waitForElement('.btn.continue');
   * I.waitForElement('.btn.continue', 5); // wait for 5 secs
   * ```
   * 
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {number} [sec] (optional, `1` by default) time in seconds to wait
   * @returns {void} automatically synchronized promise through #recorder
   * 
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
   * Element can be located by CSS or XPath.
   * 
   * ```js
   * I.waitForDetached('#popup');
   * ```
   * 
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
   * @returns {void} automatically synchronized promise through #recorder
   * 
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
   * 
   * ```js
   * I.refreshPage();
   * ```
   * @returns {void} automatically synchronized promise through #recorder
   * 
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
   * Saves screenshot of the specified locator to ouput folder (set in codecept.conf.ts or codecept.conf.js).
   * Filename is relative to output folder.
   * 
   * ```js
   * I.saveElementScreenshot(`#submit`,'debug.png');
   * ```
   * 
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {string} fileName file name to save.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   *
   */
  async saveElementScreenshot(locator, fileName) {
    const outputFile = screenshotOutputFolder(fileName);

    const rect = await this.grabElementBoundingRect(locator);

    const button_clip = {
      x: Math.floor(rect.x),
      y: Math.floor(rect.y),
      width: Math.floor(rect.width),
      height: Math.floor(rect.height),
    };

    this.debug(`Screenshot of ${(new Locator(locator))} element has been saved to ${outputFile}`);
    // take the screenshot
    await this.browser.screenshot(outputFile, button_clip);
  }

  /**
   * Grab the width, height, location of given locator.
   * Provide `width` or `height`as second param to get your desired prop.
   * Resumes test execution, so **should be used inside an async function with `await`** operator.
   * 
   * Returns an object with `x`, `y`, `width`, `height` keys.
   * 
   * ```js
   * const value = await I.grabElementBoundingRect('h3');
   * // value is like { x: 226.5, y: 89, width: 527, height: 220 }
   * ```
   * 
   * To get only one metric use second parameter:
   * 
   * ```js
   * const width = await I.grabElementBoundingRect('h3', 'width');
   * // width == 527
   * ```
   * @param {string | object} locator element located by CSS|XPath|strict locator.
   * @param {string=} elementSize x, y, width or height of the given element.
   * @returns {Promise<DOMRect>|Promise<number>} Element bounding rectangle
   * 
   */
  async grabElementBoundingRect(locator, prop) {
    locator = new Locator(locator, 'css');

    const rect = await this.browser.evaluate(async (by, locator) => {
      // store the button in a variable

      const build_cluster_btn = await window.codeceptjs.findElement(by, locator);

      // use the getClientRects() function on the button to determine
      // the size and location
      const rect = build_cluster_btn.getBoundingClientRect();

      // convert the rectangle to a clip object and return it
      return {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      };
    }, locator.type, locator.value);

    if (prop) return rect[prop];
    return rect;
  }

  /**
   * Saves a screenshot to ouput folder (set in codecept.conf.ts or codecept.conf.js).
   * Filename is relative to output folder.
   * Optionally resize the window to the full available page `scrollHeight` and `scrollWidth` to capture the entire page by passing `true` in as the second argument.
   * 
   * ```js
   * I.saveScreenshot('debug.png');
   * I.saveScreenshot('debug.png', true) //resizes to available scrollHeight and scrollWidth before taking screenshot
   * ```
   * 
   * @param {string} fileName file name to save.
   * @param {boolean} [fullPage=false] (optional, `false` by default) flag to enable fullscreen screenshot mode.
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async saveScreenshot(fileName, fullPage = this.options.fullPageScreenshots) {
    const outputFile = screenshotOutputFolder(fileName);

    this.debug(`Screenshot is saving to ${outputFile}`);

    if (!fullPage) {
      return this.browser.screenshot(outputFile);
    }
    const { height, width } = await this.browser.evaluate(() => {
      return { height: document.body.scrollHeight, width: document.body.scrollWidth };
    });
    await this.browser.viewport(width, height);
    return this.browser.screenshot(outputFile);
  }

  async _failed() {
    if (withinStatus !== false) await this._withinEnd();
  }

  /**
   * Scrolls to element matched by locator.
   * Extra shift can be set with offsetX and offsetY options.
   * 
   * ```js
   * I.scrollTo('footer');
   * I.scrollTo('#submit', 5, 5);
   * ```
   * 
   * @param {string | object} locator located by CSS|XPath|strict locator.
   * @param {number} [offsetX=0] (optional, `0` by default) X-axis offset.
   * @param {number} [offsetY=0] (optional, `0` by default) Y-axis offset.
   * @returns {void} automatically synchronized promise through #recorder
   * 
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
   * 
   * ```js
   * I.scrollPageToTop();
   * ```
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async scrollPageToTop() {
    return this.executeScript(() => window.scrollTo(0, 0));
  }

  /**
   * Scroll page to the bottom.
   * 
   * ```js
   * I.scrollPageToBottom();
   * ```
   * @returns {void} automatically synchronized promise through #recorder
   * 
   */
  async scrollPageToBottom() {
    /* eslint-disable prefer-arrow-callback, comma-dangle */
    return this.executeScript(function () {
      const body = document.body;
      const html = document.documentElement;
      window.scrollTo(0, Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
      ));
    });
    /* eslint-enable */
  }

  /**
   * Retrieves a page scroll position and returns it to test.
   * Resumes test execution, so **should be used inside an async function with `await`** operator.
   * 
   * ```js
   * let { x, y } = await I.grabPageScrollPosition();
   * ```
   * 
   * @returns {Promise<PageScrollPosition>} scroll position
   * 
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
