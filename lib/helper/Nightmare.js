'use strict';
let until;

const requireg = require('requireg')
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
const recorder = require('../recorder');

let withinStore = {};

class Nightmare extends Helper {

  constructor(config) {
    super(config);
    this.options = config;
    this.options.rootElement = this.options.rootElement || 'body';
    this.context = this.options.rootElement
  }

  static _config() {
    return [
      { name: 'url', message: "Base url of site to be tested", default: 'http://localhost' },
    ];
  }

  static _checkRequirements()
  {
    try {
      requireg("nightmare");
      requireg("nightmare-upload")
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

      this.evaluate_now(function(by, locator, contextEl) {
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

      this.evaluate_now(function(by, locator, contextEl) {
        let res = window.codeceptjs.findAndStoreElement(by, locator);
        if (res === null) {
          throw new Error(`Element ${locator} couldn't be located by ${by}`);
        }
        return res;
      }, done, by, value, contextEl);
    });

    this.Nightmare.action('enterText', function (el, text, clean, done) {

      let child = this.child;
      let typeFn = () => child.call('type', text, done);

      this.evaluate_now(function(el, clean) {
        var el = window.codeceptjs.fetchElement(el);
        if (clean) el.value = '';
        el.focus();
      }, () => {
        if (clean) return typeFn();
        child.call('pressKey', 'End', typeFn); // type End before
      }, el, clean);
    });

    this.Nightmare.action('pressKey', function(ns, options, parent, win, renderer, done) {
      parent.respondTo('pressKey', function(ch, done) {
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
    }, function(key, done) {
      this.child.call('pressKey', key, done);
    });
  }

  _before() {
    this.browser = this.Nightmare(this.options);
    this.browser.on('dom-ready', () => this._injectClientScripts());
    this.browser.on('console', function(type, message) {
      this.debug(`${type}: ${message}`);
    });
    return this.browser;
  }

  _after() {
    return this.browser.end();
  }

  /**
   * {{> ../webapi/amOnPage }}
   */
  amOnPage(url) {
    if (url.indexOf('http') !== 0) {
      url = this.options.url + url;
    }
    return this.browser.goto(url);
  }

  /**
   * {{> ../webapi/seeInTitle }}
   */
  seeInTitle(text) {
    return stringIncludes('web page title').assert(text, this.browser.title());
  }

  /**
   * {{> ../webapi/dontSeeInTitle }}
   */
  dontSeeInTitle(text) {
    return stringIncludes('web page title').negate(text, this.browser.title());
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
   * {{> ../webapi/click }}
   */
  click(locator, context) {
    if (context) {
      context = guessLocator(context) || {css: context};
    }
    return co(findClickable.call(this, locator, context)).then((el) => {
      return this.browser.evaluate(function(el) {
        return window.codeceptjs.clickEl(el);
      }, el).wait(100); // wait for click event to happen
    });
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
      return this.browser.evaluate(function(els) {
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
      key = key.join('+');
    }
    return this.browser.pressKey(key);
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
  dontSeeCheckboxIsChecked(field)
  {
    return co.wrap(proceedIsChecked).call(this, 'negate', field);
  }

  /**
   * {{> ../webapi/attachFile }}
   *
   * Due to technical limitation this **works only with CSS selectors**
   */
  attachFile(locator, pathToFile) {
    let file = path.join(global.codecept_dir, pathToFile);

    if (!isCSS(locator)) {
      throw new Error(`Only CSS locator allowed for attachFile`);
    }

    if (!fileExists(file)) {
      throw new Error(`File at ${file} can not be found on local system`);
    }
    return this.browser.upload(locator, pathToFile);
  }

  /**
   * {{> ../webapi/grabTextFrom }}
   */
  grabTextFrom(locator) {
    return this.browser.findElement(guessLocator(locator) || { css: locator}).then((el) => {
      return this.browser.evaluate(function(el) {
        return codeceptjs.fetchElement(el).innerText;
      }, el)
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
      return this.browser.evaluate(function(el) {
        return codeceptjs.fetchElement(el).value;
      }, els[0]);
    });
  }

  /**
   * {{> ../webapi/grabAttributeFrom }}
   */
  grabAttributeFrom(locator, attr) {
    return this.browser.findElement(guessLocator(locator) || { css: locator}).then((el) => {
      return this.browser.evaluate(function(el, attr) {
        return codeceptjs.fetchElement(el)[attr];
      }, el, attr)
    });
  }


  _injectClientScripts() {
    return this.browser.inject('js', path.join(__dirname, 'clientscripts', 'nightmare.js'));
  }

  /**
   * {{> ../webapi/selectOption }}
   */
  selectOption(select, option) {
    let fetchAndCheckOption = function(el, locator) {
        el = codeceptjs.fetchElement(el);
        let found = document.evaluate(locator, el, null, 5);
        var current = null;
        while (current = found.iterateNext()) {
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

        let checked = yield browser.evaluate(fetchAndCheckOption, field, byVisibleText)

        if (!checked) {
          let normalizedValue = `[normalize-space(@value) = "${opt.trim() }"]`;
          let byValue = `./option${normalizedValue}|./optgroup/option${normalizedValue}`;
          yield browser.evaluate(fetchAndCheckOption, field, byValue)
        }
      }
    }));
  }

  wait(sec) {
    return new Promise(function(done) {
      setTimeout(done, sec * 1000);
    });
  }
}

module.exports = Nightmare;

function proceedSee(assertType, text, context) {
  let description, locator;
  if (!context) {
    locator = guessLocator(this.context)  || {css: this.context};
    if (this.context === this.options.rootElement) {
      description = 'web application';
    } else {
      description = 'current context ' + this.context;[]
    }
  } else {
    locator = guessLocator(context) || {css: context};
    description = 'element ' + context;
  }
  return this.browser.findElements(locator).evaluate(function(els) {
    return els.map((id) => fetchElement(id)).map((el) => el.innerText);
  }).then(function (texts) {
    let allText = texts.reduce((source, el) => source += '| ' + el);
    return stringIncludes(description)[assertType](text, allText);
  });
}

function *proceedSeeInField(assertType, field, value) {
  let els = yield co(findFields(this.browser, field));
  if (!els.length) {
    throw new Error(`Field ${field} not found by name|text|CSS|XPath`);
  }
  let el = els[0];
  let tag = yield this.browser.evaluate(function(el) {
    return codeceptjs.fetchElement(el).tagName;
  }, el);
  let fieldVal = yield this.browser.evaluate(function(el) {
    return codeceptjs.fetchElement(el).value; }
  , el);
  if (tag == 'select') {
    // locate option by values and check them
    let text = yield this.browser.evaluate(function(el, val)  {
      return el.querySelector(`option[value="${val}"]`).innerText
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
  let selected = yield this.browser.evaluate(function(els) {
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
    `.//button[./@name = ${literal}]`
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
  if (typeof (locator) === 'object') {
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
  return locator.substr(0, 2) === '//' || locator.substr(0, 3) === './/'
}