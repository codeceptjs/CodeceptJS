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
   * {{> ../webapi/amOnPage }}
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
   * {{> ../webapi/seeInTitle }}
   */
  seeInTitle(text) {
    return this.browser.title().then((title) => stringIncludes('web page title').assert(text, title));
  }

  /**
   * {{> ../webapi/dontSeeInTitle }}
   */
  dontSeeInTitle(text) {
    return this.browser.title().then((title) => stringIncludes('web page title').negate(text, title));
  }

  /**
   * {{> ../webapi/grabTitle }}
   */
  grabTitle() {
    return this.browser.title();
  }

  /**
   * {{> ../webapi/seeInCurrentUrl }}
   */
  seeInCurrentUrl(url) {
    return this.browser.url().then(function (currentUrl) {
      return stringIncludes('url').assert(url, currentUrl);
    });
  }

  /**
   * {{> ../webapi/dontSeeInCurrentUrl }}
   */
  dontSeeInCurrentUrl(url) {
    return this.browser.url().then(function (currentUrl) {
      return stringIncludes('url').negate(url, currentUrl);
    });
  }

  /**
   * {{> ../webapi/seeCurrentUrlEquals }}
   */
  seeCurrentUrlEquals(url) {
    return this.browser.url().then((currentUrl) => {
      return urlEquals(this.options.url).assert(url, currentUrl);
    });
  }

  /**
   * {{> ../webapi/dontSeeCurrentUrlEquals }}
   */
  dontSeeCurrentUrlEquals(url) {
    return this.browser.url().then((currentUrl) => {
      return urlEquals(this.options.url).negate(url, currentUrl);
    });
  }

  /**
   * {{> ../webapi/see }}
   */
  see(text, context) {
    return proceedSee.call(this, 'assert', text, context);
  }

  /**
   * {{> ../webapi/dontSee }}
   */
  dontSee(text, context) {
    return proceedSee.call(this, 'negate', text, context);
  }

  /**
   * {{> ../webapi/seeElement }}
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
   * {{> ../webapi/dontSeeElement }}
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
   * {{> ../webapi/seeElementInDOM }}
   */
  seeElementInDOM(locator) {
    return this.browser.findElements(guessLocator(locator) || {css: locator}).then((els) => {
      return empty('elements').negate(els.fill('ELEMENT'));
    });
  }

  /**
   * {{> ../webapi/dontSeeElementInDOM }}
   */
  dontSeeElementInDOM(locator) {
    return this.browser.findElements(guessLocator(locator) || {css: locator}).then((els) => {
      return empty('elements').assert(els.fill('ELEMENT'));
    });
  }

  /**
   * {{> ../webapi/seeInSource }}
   */
  seeInSource(text) {
    return this.browser.evaluate(function () {
      return document.documentElement.outerHTML;
    }).then((source) => {
      return stringIncludes('HTML source of a page').assert(text, source);
    });
  }

  /**
   * {{> ../webapi/dontSeeInSource }}
   */
  dontSeeInSource(text) {
    return this.browser.evaluate(function () {
      return document.documentElement.outerHTML;
    }).then((source) => {
      return stringIncludes('HTML source of a page').negate(text, source);
    });
  }


  /**
   * {{> ../webapi/click }}
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
   * {{> ../webapi/doubleClick }}
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
   * {{> ../webapi/moveCursorTo }}
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
   * {{> ../webapi/executeScript }}
   *
   * Wrapper for synchronous [evaluate](https://github.com/segmentio/nightmare#evaluatefn-arg1-arg2)
   */
  executeScript(fn) {
    return this.browser.evaluate.apply(this.browser, arguments);
  }

  /**
   * {{> ../webapi/executeAsyncScript }}
   *
   * Wrapper for asynchronous [evaluate](https://github.com/segmentio/nightmare#evaluatefn-arg1-arg2).
   * Unlike NightmareJS implementation calling `done` will return its first argument.
   */
  executeAsyncScript(fn) {
    return this.browser.evaluate.apply(this.browser, arguments)
      .catch((err) => err); // Nightmare's first argument is error :(
  }

  /**
   * {{> ../webapi/resizeWindow }}
   */
  resizeWindow(width, height) {
    if (width === 'maximize') {
      throw new Error(`Nightmare doesn't support resizeWindow to maximum!`);
    }
    return this.browser.viewport(width, height);
  }

  /**
   * {{> ../webapi/checkOption }}
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
   * {{> ../webapi/fillField }}
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
   * {{> ../webapi/clearField }}
   */
  clearField(field) {
    return this.fillField(field, '');
  }

  /**
   * {{> ../webapi/appendField }}
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
   * {{> ../webapi/seeInField }}
   */
  seeInField(field, value) {
    return co.wrap(proceedSeeInField).call(this, 'assert', field, value);
  }

  /**
   * {{> ../webapi/dontSeeInField }}
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
   * {{> ../webapi/seeCheckboxIsChecked }}
   */
  seeCheckboxIsChecked(field) {
    return co.wrap(proceedIsChecked).call(this, 'assert', field);
  }

  /**
   * {{> ../webapi/dontSeeCheckboxIsChecked }}
   */
  dontSeeCheckboxIsChecked(field) {
    return co.wrap(proceedIsChecked).call(this, 'negate', field);
  }

  /**
   * {{> ../webapi/attachFile }}
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
   * {{> ../webapi/grabTextFrom }}
   */
  grabTextFrom(locator) {
    return this.browser.findElement(guessLocator(locator) || { css: locator}).then((el) => {
      return this.browser.evaluate(function (el) {
        return codeceptjs.fetchElement(el).innerText;
      }, el);
    });
  }

  /**
   * {{> ../webapi/grabValueFrom }}
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
   * {{> ../webapi/grabAttributeFrom }}
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
   * {{> ../webapi/selectOption }}
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
   * {{> ../webapi/setCookie }}
   *
   * Wrapper for `.cookies.set(cookie)`.
   * [See more](https://github.com/segmentio/nightmare/blob/master/Readme.md#cookiessetcookie)
   */
  setCookie(cookie) {
    return this.browser.cookies.set(cookie);
  }

  /**
   * {{> ../webapi/seeCookie}}
   *
   */
  seeCookie(name) {
    return this.browser.cookies.get(name).then(function (res) {
      return truth('cookie ' + name, 'to be set').assert(res);
    });
  }

  /**
   * {{> ../webapi/dontSeeCookie}}
   */
  dontSeeCookie(name) {
    return this.browser.cookies.get(name).then(function (res) {
      return truth('cookie ' + name, 'to be set').negate(res);
    });
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
  grabCookie(name) {
    return this.browser.cookies.get(name);
  }

  /**
   * {{> ../webapi/clearCookie}}
   */
  clearCookie(cookie) {
    if (!cookie) {
      return this.browser.cookies.clearAll();
    }
    return this.browser.cookies.clear(cookie);
  }

  /**
   * {{> ../webapi/wait }}
   */
  wait(sec) {
    return new Promise(function (done) {
      setTimeout(done, sec * 1000);
    });
  }

  /**
   * {{> ../webapi/waitForText }}
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
   * {{> ../webapi/waitForVisible }}
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
   * {{> ../webapi/waitForElement }}
   */
  waitForElement(locator, sec) {
    this.browser.options.waitTimeout = sec * 1000 || this.options.waitForTimeout;
    locator = guessLocator(locator) || { css: locator};

    return this.browser.wait(function (by, locator) {
      return codeceptjs.findElement(by, locator) !== null;
    }, lctype(locator), lcval(locator));
  }

  /**
   * {{> ../webapi/saveScreenshot }}
   */
  saveScreenshot(fileName) {
    let outputFile = path.join(global.output_dir, fileName);
    this.debug('Screenshot is saving to ' + outputFile);
    let recorder = require('../recorder');
    return this.browser.screenshot(outputFile);
  }

  _failed(test) {
    let fileName = test.title.replace(/\W/g, '_') + '.failed.png';
    return this.saveScreenshot(fileName);
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
