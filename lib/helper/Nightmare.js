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
    this.Nightmare.action('findElements', function (locator, prop, done) {

      let by = Object.keys(locator)[0];
      let value = locator[by];

      this.evaluate_now(function(by, locator, prop) {

        if (by == 'name') {
          by = 'css';
          locator = `*[name="${locator}"]`;
        }

        // emulating webdriver by
        if (by == 'css') {
          let found = document.querySelectorAll(locator);
          let res = [];
          for (let i = 0; i < found.length; i++) {
              res.push(found[i][prop]);
          }
          return res;
        }

        if (by == 'xpath') {
          let found = document.evaluate(locator, document.body, null, 5);
          let res = [];
          let current = null;
          while (current = found.iterateNext()) {
            res.push(current[prop]);
          };
          return res;
        }

        if (by == 'name') {
          return document.querySelectorAll(`*[name="${locator}"]`).map((el) => el[prop]);
        }

        if (by == 'id') {
          return [this.getElementById(locator)].map((el) => el[prop]);
        }

      }, done, by, value, prop);
    });
  }

  _before() {
    this.browser = this.Nightmare(this.options);

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
}

module.exports = Nightmare;

function proceedSee(assertType, text, context) {
  let description, locator;
  if (!context) {
    locator = guessLocator(this.context);
    if (this.context === this.options.rootElement) {
      description = 'web application';
    } else {
      description = 'current context ' + this.context;
    }
  } else {
    locator = guessLocator(context);
    description = 'element ' + context;
  }
  return this.browser.findElements(locator, 'innerText').then(co.wrap(function*(els) {
    let allText = els.reduce((source, el) => source += '| ' + el);
    return stringIncludes(description)[assertType](text, allText);
  }));
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
  return { css: locator };
}

function isCSS(locator) {
  return locator[0] === '#' || locator[0] === '.';
}

function isXPath(locator) {
  return locator.substr(0, 2) === '//' || locator.substr(0, 3) === './/'
}
