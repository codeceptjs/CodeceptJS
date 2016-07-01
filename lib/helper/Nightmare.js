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
    } catch(e) {
      return ["nightmare"];
    }
  }

  _init() {
    this.Nightmare = requireg('nightmare');

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
        return window.codeceptjs.findAndStoreElement(by, locator);
      }, done, by, value, contextEl);
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
      this.browser.evaluate(function(el) {
        return window.codeceptjs.clickEl(el);
      }, el);
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
      this.browser.evaluate(function(els) {
        window.codeceptjs.checkEl(els[0]);
      }, els);
    });
  }


  _injectClientScripts() {
    return this.browser.inject('js', path.join(__dirname, 'clientscripts', 'nightmare.js'));
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