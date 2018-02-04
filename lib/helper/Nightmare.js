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
const co = require('co');
const path = require('path');
const ElementNotFound = require('./errors/ElementNotFound');

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
 * Requires `nightmare` and `nightmare-upload` packages to be installed.
 *
 * ## Configuration
 *
 * This helper should be configured in codecept.json
 *
 * * `url` - base url of website to be tested
 * * `restart` (optional, default: true) - restart browser between tests.
 * * `disableScreenshots` (optional, default: false)  - don't save screenshot on failure.
 * * `uniqueScreenshotNames` (optional, default: false)  - option to prevent screenshot override if you have scenarios with the same name in different suites.
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

    // set defaults
    this.options = {
      waitForAction: 500,
      waitForTimeout: 1000,
      fullPageScreenshots: true,
      disableScreenshots: false,
      uniqueScreenshotNames: false,
      rootElement: 'body',
      restart: true,
      keepBrowserState: false,
      keepCookies: false,
      js_errors: null,
      enableHAR: false,
    };

    this.isRunning = false;

    // override defaults with config
    Object.assign(this.options, config);

    this.context = this.options.rootElement;
  }

  static _config() {
    return [
      { name: 'url', message: 'Base url of site to be tested', default: 'http://localhost' },
    ];
  }

  static _checkRequirements() {
    try {
      requireg('nightmare');
      requireg('nightmare-upload');
    } catch (e) {
      return ['nightmare', 'nightmare-upload'];
    }
  }

  async _init() {
    this.Nightmare = requireg('nightmare');

    require('nightmare-upload')(this.Nightmare);
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
    if (this.options.enableHAR) {
      this.browser = this.Nightmare(Object.assign(require('nightmare-har-plugin').getDevtoolsOptions(), this.options));
      await this.browser;
      await this.browser.waitForDevtools();
    } else {
      this.browser = this.Nightmare(this.options);
      await this.browser;
    }
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
   * let har = yield I.grabHAR();
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
   * {{> ../webapi/amOnPage }}
   *
   * In a second argument a list of request headers can be passed:
   *
   * ```js
   * I.amOnPage('/auth', [{'x-my-custom-header': 'some value'}])
   * ```
   */
  async amOnPage(url, headers = null) {
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
   * {{> ../webapi/seeInTitle }}
   */
  async seeInTitle(text) {
    const title = await this.browser.title();
    stringIncludes('web page title').assert(text, title);
  }

  /**
   * {{> ../webapi/dontSeeInTitle }}
   */
  async dontSeeInTitle(text) {
    const title = await this.browser.title();
    stringIncludes('web page title').negate(text, title);
  }

  /**
   * {{> ../webapi/grabTitle }}
   */
  async grabTitle() {
    return this.browser.title();
  }

  /**
   * {{> ../webapi/seeInCurrentUrl }}
   */
  async seeInCurrentUrl(url) {
    const currentUrl = await this.browser.url();
    stringIncludes('url').assert(url, currentUrl);
  }

  /**
   * {{> ../webapi/dontSeeInCurrentUrl }}
   */
  async dontSeeInCurrentUrl(url) {
    const currentUrl = await this.browser.url();
    stringIncludes('url').negate(url, currentUrl);
  }

  /**
   * {{> ../webapi/seeCurrentUrlEquals }}
   */
  async seeCurrentUrlEquals(url) {
    const currentUrl = await this.browser.url();
    urlEquals(this.options.url).assert(url, currentUrl);
  }

  /**
   * {{> ../webapi/dontSeeCurrentUrlEquals }}
   */
  async dontSeeCurrentUrlEquals(url) {
    const currentUrl = await this.browser.url();
    urlEquals(this.options.url).negate(url, currentUrl);
  }

  /**
   * {{> ../webapi/see }}
   */
  async see(text, context = null) {
    return proceedSee.call(this, 'assert', text, context);
  }

  /**
   * {{> ../webapi/dontSee }}
   */
  dontSee(text, context = null) {
    return proceedSee.call(this, 'negate', text, context);
  }

  /**
   * {{> ../webapi/seeElement }}
   */
  async seeElement(locator) {
    locator = new Locator(locator, 'css');
    const num = await this.browser.evaluate((by, locator) => {
      return window.codeceptjs.findElements(by, locator).filter(e => e.offsetParent !== null).length;
    }, locator.type, locator.value);
    equals('number of elements on a page').negate(0, num);
  }

  /**
   * {{> ../webapi/dontSeeElement }}
   */
  async dontSeeElement(locator) {
    locator = new Locator(locator, 'css');
    locator = new Locator(locator, 'css');
    const num = await this.browser.evaluate((by, locator) => {
      return window.codeceptjs.findElements(by, locator).filter(e => e.offsetParent !== null).length;
    }, locator.type, locator.value);
    equals('number of elements on a page').assert(0, num);
  }

  /**
   * {{> ../webapi/seeElementInDOM }}
   */
  async seeElementInDOM(locator) {
    locator = new Locator(locator, 'css');
    const els = await this.browser.findElements(locator.toStrict());
    empty('elements').negate(els.fill('ELEMENT'));
  }

  /**
   * {{> ../webapi/dontSeeElementInDOM }}
   */
  async dontSeeElementInDOM(locator) {
    locator = new Locator(locator, 'css');
    const els = await this.browser.findElements(locator.toStrict());
    empty('elements').assert(els.fill('ELEMENT'));
  }

  /**
   * {{> ../webapi/seeInSource }}
   */
  async seeInSource(text) {
    const source = await this.browser.evaluate(() => document.documentElement.outerHTML);
    stringIncludes('HTML source of a page').assert(text, source);
  }

  /**
   * {{> ../webapi/dontSeeInSource }}
   */
  async dontSeeInSource(text) {
    const source = await this.browser.evaluate(() => document.documentElement.outerHTML);
    stringIncludes('HTML source of a page').negate(text, source);
  }


  /**
   * {{> ../webapi/click }}
   */
  async click(locator, context = null) {
    const el = await findClickable.call(this, locator, context);
    assertElementExists(el, locator, 'Clickable');
    return this.browser.evaluate(el => window.codeceptjs.clickEl(el), el)
      .wait(this.options.waitForAction);
  }

  /**
   * {{> ../webapi/doubleClick }}
   */
  async doubleClick(locator, context = null) {
    const el = await findClickable.call(this, locator, context);
    assertElementExists(el, locator, 'Clickable');
    return this.browser.evaluate(el => window.codeceptjs.doubleClickEl(el), el)
      .wait(this.options.waitForAction);
  }

  /**
   * {{> ../webapi/moveCursorTo }}
   */
  async moveCursorTo(locator, offsetX = 0, offsetY = 0) {
    locator = new Locator(locator, 'css');
    const el = await this.browser.findElement(locator.toStrict());
    assertElementExists(el, locator);
    return this.browser.evaluate((el, x, y) => window.codeceptjs.hoverEl(el, x, y), el, offsetX, offsetY)
      .wait(this.options.waitForAction); // wait for hover event to happen
  }


  /**
   * {{> ../webapi/executeScript }}
   *
   * Wrapper for synchronous [evaluate](https://github.com/segmentio/nightmare#evaluatefn-arg1-arg2)
   */
  async executeScript(fn) {
    return this.browser.evaluate.apply(this.browser, arguments)
      .catch(err => err); // Nightmare's first argument is error :(
  }

  /**
   * {{> ../webapi/executeAsyncScript }}
   *
   * Wrapper for asynchronous [evaluate](https://github.com/segmentio/nightmare#evaluatefn-arg1-arg2).
   * Unlike NightmareJS implementation calling `done` will return its first argument.
   */
  async executeAsyncScript(fn) {
    return this.browser.evaluate.apply(this.browser, arguments)
      .catch(err => err); // Nightmare's first argument is error :(
  }

  /**
   * {{> ../webapi/resizeWindow }}
   */
  async resizeWindow(width, height) {
    if (width === 'maximize') {
      throw new Error('Nightmare doesn\'t support resizeWindow to maximum!');
    }
    return this.browser.viewport(width, height).wait(this.options.waitForAction);
  }

  /**
   * {{> ../webapi/checkOption }}
   */
  async checkOption(field, context = null) {
    const els = await findCheckable.call(this, field, context);
    assertElementExists(els[0], field, 'Checkbox or radio');
    return this.browser.evaluate(els => window.codeceptjs.checkEl(els[0]), els)
      .wait(this.options.waitForAction);
  }

  /**
   * {{> ../webapi/fillField }}
   */
  async fillField(field, value) {
    const el = await findField.call(this, field);
    assertElementExists(el, field, 'Field');
    return this.browser.enterText(el, value, true)
      .wait(this.options.waitForAction);
  }

  /**
   * {{> ../webapi/clearField }}
   */
  async clearField(field) {
    return this.fillField(field, '');
  }

  /**
   * {{> ../webapi/appendField }}
   */
  async appendField(field, value) {
    const el = await findField.call(this, field);
    assertElementExists(el, field, 'Field');
    return this.browser.enterText(el, value, false)
      .wait(this.options.waitForAction);
  }

  /**
   * {{> ../webapi/seeInField }}
   */
  async seeInField(field, value) {
    return proceedSeeInField.call(this, 'assert', field, value);
  }

  /**
   * {{> ../webapi/dontSeeInField }}
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
   * {{> ../webapi/seeCheckboxIsChecked }}
   */
  async seeCheckboxIsChecked(field) {
    return proceedIsChecked.call(this, 'assert', field);
  }

  /**
   * {{> ../webapi/dontSeeCheckboxIsChecked }}
   */
  async dontSeeCheckboxIsChecked(field) {
    return proceedIsChecked.call(this, 'negate', field);
  }

  /**
   * {{> ../webapi/attachFile }}
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
   * {{> ../webapi/grabTextFrom }}
   */
  async grabTextFrom(locator) {
    locator = new Locator(locator, 'css');
    const el = await this.browser.findElement(locator.toStrict());
    assertElementExists(el, locator);
    return this.browser.evaluate(el => window.codeceptjs.fetchElement(el).innerText, el);
  }

  /**
   * {{> ../webapi/grabValueFrom }}
   */
  async grabValueFrom(locator) {
    const el = await findField.call(this, locator);
    assertElementExists(el, locator, 'Field');
    return this.browser.evaluate(el => window.codeceptjs.fetchElement(el).value, el);
  }

  /**
   * {{> ../webapi/grabAttributeFrom }}
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
   * {{> ../webapi/selectOption }}
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
   * {{> ../webapi/setCookie }}
   *
   * Wrapper for `.cookies.set(cookie)`.
   * [See more](https://github.com/segmentio/nightmare/blob/master/Readme.md#cookiessetcookie)
   */
  async setCookie(cookie) {
    return this.browser.cookies.set(cookie);
  }

  /**
   * {{> ../webapi/seeCookie}}
   *
   */
  async seeCookie(name) {
    const res = await this.browser.cookies.get(name);
    truth(`cookie ${name}`, 'to be set').assert(res);
  }

  /**
   * {{> ../webapi/dontSeeCookie}}
   */
  async dontSeeCookie(name) {
    const res = await this.browser.cookies.get(name);
    truth(`cookie ${name}`, 'to be set').negate(res);
  }

  /**
   * {{> ../webapi/grabCookie}}
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
   * {{> ../webapi/clearCookie}}
   */
  async clearCookie(cookie) {
    if (!cookie) {
      return this.browser.cookies.clearAll();
    }
    return this.browser.cookies.clear(cookie);
  }

  /**
   * {{> ../webapi/wait }}
   */
  async wait(sec) {
    return new Promise(((done) => {
      setTimeout(done, sec * 1000);
    }));
  }

  /**
   * {{> ../webapi/waitForText }}
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
   * {{> ../webapi/waitForVisible }}
   */
  waitForVisible(locator, sec) {
    this.browser.options.waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;
    locator = new Locator(locator, 'css');

    return this.browser.wait((by, locator) => {
      const el = window.codeceptjs.findElement(by, locator);
      if (!el) return false;
      return el.offsetParent !== null;
    }, locator.type, locator.value).catch((err) => {
      if (err.message && err.message.indexOf('.wait() timed out after') > -1) {
        throw new Error(`element (${JSON.stringify(locator)}) still not visible on page after ${sec} sec`);
      } else throw err;
    });
  }

  /**
   * {{> ../webapi/waitForVisible }}
   */
  waitForInvisible(locator, sec) {
    this.browser.options.waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;
    locator = new Locator(locator, 'css');

    return this.browser.wait((by, locator) => {
      const el = window.codeceptjs.findElement(by, locator);
      if (!el) return false;
      return el.offsetParent === null;
    }, locator.type, locator.value).catch((err) => {
      if (err.message && err.message.indexOf('.wait() timed out after') > -1) {
        throw new Error(`element (${JSON.stringify(locator)}) still visible after ${sec} sec`);
      } else throw err;
    });
  }

  /**
   * {{> ../webapi/waitForElement }}
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

  /**
   * {{> ../webapi/waitUntilExists }}
   */
  async waitUntilExists(locator, sec) {
    this.browser.options.waitTimeout = sec ? sec * 1000 : this.options.waitForTimeout;
    sec = this.browser.options.waitForTimeout / 1000;
    locator = new Locator(locator, 'css');

    return this.browser.wait((by, locator) => window.codeceptjs.findElement(by, locator) === null, locator.type, locator.value).catch((err) => {
      if (err.message && err.message.indexOf('.wait() timed out after') > -1) {
        throw new Error(`element (${JSON.stringify(locator)}) still present on page after ${sec} sec`);
      } else throw err;
    });
  }

  /**
   * {{> ../webapi/refreshPage }}
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
   * {{> ../webapi/saveScreenshot }}
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
    const promisesList = [];
    if (withinStatus !== false) promisesList.push(this._withinEnd());
    if (!this.options.disableScreenshots) {
      let fileName = clearString(test.title);
      if (test.ctx && test.ctx.test && test.ctx.test.type === 'hook') fileName = clearString(`${test.title}_${test.ctx.test.title}`);
      if (this.options.uniqueScreenshotNames) {
        const uuid = test.uuid || test.ctx.test.uuid;
        fileName = `${fileName.substring(0, 10)}_${uuid}.failed.png`;
      } else {
        fileName += '.failed.png';
      }
      promisesList.push(this.saveScreenshot(fileName, true));
    }
    return Promise.all(promisesList);
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
  async scrollTo(locator, offsetX = 0, offsetY = 0) {
    locator = new Locator(locator, 'css');
    return this.browser.evaluate((by, locator, offsetX, offsetY) => {
      const el = window.codeceptjs.findElement(by, locator);
      if (!el) throw new Error(`Element not found ${by}: ${locator}`);
      const rect = el.getBoundingClientRect();
      window.scrollTo(rect.left + offsetX, rect.top + offsetY);
    }, locator.type, locator.value, offsetX, offsetY);
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
