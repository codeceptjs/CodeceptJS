const requireg = require('requireg');
const Helper = require('../helper');
const Locator = require('../locator');
const stringIncludes = require('../assert/include').includes;
const { urlEquals } = require('../assert/equal');
const { equals } = require('../assert/equal');
const { empty } = require('../assert/empty');
const { truth } = require('../assert/truth');
const {
  xpathLocator, fileExists, clearString, decodeUrl, chunkArray,
} = require('../utils');
const path = require('path');
const ElementNotFound = require('./errors/ElementNotFound');

const puppeteer = requireg('puppeteer');

class Puppeteer extends Helper {
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
      show: false,
    };

    this.isRunning = false;

    // override defaults with config
    Object.assign(this.options, config);
    this.puppeteerOptions = Object.assign({ headless: !this.options.show }, this.options.chrome);
  }

  static _config() {
    return [
      { name: 'url', message: 'Base url of site to be tested', default: 'http://localhost' },
    ];
  }

  static _checkRequirements() {
    try {
      requireg('puppeteer');
    } catch (e) {
      return ['puppeteer'];
    }
  }

  _init() {
  }

  _before() {
    return this._startBrowser();
  }

  _after() {
    return this._stopBrowser();
  }

  async _startBrowser() {
    this.browser = await puppeteer.launch(this.puppeteerOptions);
    this.page = await this.browser.newPage();

    this.page.on('load', frame => this.context = this.page.$('body'));
  }

  async _stopBrowser() {
    await this.browser.close();
  }

  async _withinBegin(locator) {
    const els = await findElements(this.page, locator);
    this.context = els[0];
  }

  async _withinEnd() {
    this.context = this.page.mainFrame().$('body');
  }

  async amOnPage(url) {
    if (url.indexOf('http') !== 0) {
      url = this.options.url + url;
    }
    await this.page.goto(url);
  }

  async _locate(locator) {
    return findElements(await this.context, locator);
  }

  async seeElement(locator) {
    let els = await this._locate(locator);
    els = await Promise.all(els.map(el => el.boundingBox()));
    return empty('visible elements').negate(els.filter(v => v).fill('ELEMENT'));
  }

  async dontSeeElement(locator) {
    let els = await this._locate(locator);
    els = await Promise.all(els.map(el => el.boundingBox()));
    return empty('visible elements').assert(els.filter(v => v).fill('ELEMENT'));
  }

  async seeElementInDOM(locator) {
    const els = await this._locate(locator);
    return empty('elements on page').negate(els.filter(v => v).fill('ELEMENT'));
  }

  async dontSeeElementInDOM(locator) {
    const els = await this._locate(locator);
    return empty('elements on a page').assert(els.filter(v => v).fill('ELEMENT'));
  }

  /**
   * {{> ../webapi/click }}
   */
  async click(locator, context = null) {
    return proceedClick.call(this, locator, context);
  }

  /**
   * {{> ../webapi/doubleClick }}
   */
  async doubleClick(locator, context = null) {
    return proceedClick.call(this, locator, context, { clickCount: 2 });
  }


  /**
   * {{> ../webapi/checkOption }}
   */
  async checkOption(field, context = null) {
    const els = await findCheckable.call(this, field, context);
    assertElementExists(els[0], field, 'Checkbox or radio');
    if (await els[0].getProperty('checked') === true) return;
    await els[0].click();
    return this._waitForAction();
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
   * {{> ../webapi/fillField }}
   */
  async fillField(field, value) {
    const els = await findFields.call(this, field);
    assertElementExists(els, field, 'Field');
    const el = els[0];
    // await el.focus();
    const tag = await el.getProperty('tagName').then(el => el.jsonValue());
    const editable = await el.getProperty('contenteditable').then(el => el.jsonValue());
    if (tag === 'TEXTAREA' || editable) {
      await this.page.evaluateHandle(el => el.innerHTML = '', el);
    }
    if (tag === 'INPUT') {
      await this.page.evaluateHandle(el => el.value = '', el);
    }
    await el.type(value, { delay: 10 });
    return this._waitForAction();
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
    const els = await findFields.call(this, field);
    assertElementExists(els, field, 'Field');
    await els[0].press('End');
    await els[0].type(value, { delay: 10 });
    return this._waitForAction();
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
   * {{> ../webapi/attachFile }}
   *
   */
  async attachFile(locator, pathToFile) {
    const file = path.join(global.codecept_dir, pathToFile);

    if (!fileExists(file)) {
      throw new Error(`File at ${file} can not be found on local system`);
    }
    const els = await findFields.call(this, locator);
    assertElementExists(els, 'Field');
    await els[0].uploadFile(file);
    return this._waitForAction();
  }

  /**
   * {{> ../webapi/seeInCurrentUrl }}
   */
  async seeInCurrentUrl(url) {
    const currentUrl = this.page.url();
    stringIncludes('url').assert(url, currentUrl);
  }

  /**
   * {{> ../webapi/dontSeeInCurrentUrl }}
   */
  async dontSeeInCurrentUrl(url) {
    const currentUrl = this.page.url();
    stringIncludes('url').negate(url, currentUrl);
  }

  /**
   * {{> ../webapi/seeCurrentUrlEquals }}
   */
  async seeCurrentUrlEquals(url) {
    const currentUrl = this.page.url();
    urlEquals(this.options.url).assert(url, currentUrl);
  }

  /**
   * {{> ../webapi/dontSeeCurrentUrlEquals }}
   */
  async dontSeeCurrentUrlEquals(url) {
    const currentUrl = this.page.url();
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
   * {{> ../webapi/wait }}
   */
  async wait(sec) {
    return new Promise(((done) => {
      setTimeout(done, sec * 1000);
    }));
  }

  async _waitForAction() {
    return this.wait(this.options.waitForAction / 1000);
  }
}

module.exports = Puppeteer;

async function findElements(matcher, locator) {
  locator = new Locator(locator, 'css');
  if (!locator.isXPath()) return matcher.$$(locator.simplify());

  let context = null;
  if (matcher.constructor.name === 'ElementHandle') {
    context = matcher;
  }
  const arrayHandle = await matcher.executionContext().evaluateHandle((element, selector) => {
    const found = document.evaluate(selector, element || document.body, null, 5, null);
    const res = [];
    let current = null;
    while (current = found.iterateNext()) {
      res.push(current);
    }
    return res;
  }, context, locator.value);

  const properties = await arrayHandle.getProperties();
  await arrayHandle.dispose();
  const result = [];
  for (const property of properties.values()) {
    const elementHandle = property.asElement();
    if (elementHandle) result.push(elementHandle);
  }
  return result;
}

async function proceedClick(locator, context = null, options = {}) {
  let matcher = await this.context;
  if (context) {
    const els = await this._locate(context);
    assertElementExists(els, context);
    matcher = els[0];
  }
  const els = await findClickable.call(this, matcher, locator);
  if (context) {
    assertElementExists(els, locator, 'Clickable element', `was not found inside element ${new Locator(context).toString()}`);
  } else {
    assertElementExists(els, locator, 'Clickable element');
  }
  await els[0].click(options);
  await this._waitForAction();
}

async function findClickable(matcher, locator) {
  locator = new Locator(locator);
  if (!locator.isFuzzy()) return findElements.call(this, matcher, locator.simplify());

  let els;
  const literal = xpathLocator.literal(locator.value);

  els = await findElements.call(this, matcher, Locator.clickable.narrow(literal));
  if (els.length) return els;

  els = await findElements.call(this, matcher, Locator.clickable.wide(literal));
  if (els.length) return els;

  els = await findElements.call(this, matcher, Locator.clickable.self(literal));
  if (els.length) return els;

  return findElements.call(this, matcher, locator.value); // by css or xpath
}

async function proceedSee(assertType, text, context) {
  let description;
  let allText;
  if (!context) {
    // console.log('con', await this.context);
    const el = await this.context;
    allText = [await el.getProperty('innerText')];
    description = 'web application';
  } else {
    const locator = new Locator(context, 'css');
    description = `element ${locator.toString()}`;
    const els = await this._locate(locator);
    allText = await Promise.all(els.map(el => el.getProperty('innerText')));
  }

  return stringIncludes(description)[assertType](text, allText.join(' | '));
}

async function findCheckable(locator, context) {
  let contextEl = await this.context;
  if (context) {
    contextEl = await findElements.call(this, contextEl, (new Locator(context, 'css')).simplify());
    contextEl = contextEl[0];
  }

  const matchedLocator = new Locator(locator);
  if (!matchedLocator.isFuzzy()) {
    return findElements.call(this, contextEl, matchedLocator.simplify());
  }

  const literal = xpathLocator.literal(locator);
  let els = await findElements.call(this, contextEl, Locator.checkable.byText(literal));
  if (els.length) {
    return els;
  }
  els = await findElements.call(this, contextEl, Locator.checkable.byName(literal));
  if (els.length) {
    return els;
  }
  return findElements.call(this, contextEl, locator);
}

async function proceedIsChecked(assertType, option) {
  let els = await findCheckable.call(this, option);
  assertElementExists(els, option, 'Checkable');
  els = await Promise.all(els.map(el => el.getProperty('checked')));
  els = await Promise.all(els.map(el => el.jsonValue()));
  const selected = els.reduce((prev, cur) => prev || cur);
  return truth(`checkable ${option}`, 'to be checked')[assertType](selected);
}

async function findFields(locator) {
  const matchedLocator = new Locator(locator);
  if (!matchedLocator.isFuzzy()) {
    return this._locate(matchedLocator);
  }
  const literal = xpathLocator.literal(locator);

  let els = await this._locate({ xpath: Locator.field.labelEquals(literal) });
  if (els.length) {
    return els;
  }

  els = await this._locate({ xpath: Locator.field.labelContains(literal) });
  if (els.length) {
    return els;
  }
  els = await this._locate({ xpath: Locator.field.byName(literal) });
  if (els.length) {
    return els;
  }
  return this._locate({ css: locator });
}

async function proceedSeeInField(assertType, field, value) {
  const els = await findFields.call(this, field);
  assertElementExists(els, field, 'Field');
  const el = els[0];
  const tag = await el.getProperty('tagName').then(el => el.jsonValue());
  const fieldVal = await el.getProperty('value').then(el => el.jsonValue());
  if (tag === 'SELECT') {
    // locate option by values and check them
    const option = await el.$(`option[value="${fieldVal}"]`);
    assertElementExists(option, `Option with value ${fieldVal}`);
    const text = await option.getProperty('innerText');
    return equals(`select option by ${field}`)[assertType](value, text);
  }
  return stringIncludes(`field by ${field}`)[assertType](value, fieldVal);
}


function assertElementExists(res, locator, prefix, suffix) {
  if (!res || res.length === 0) {
    throw new ElementNotFound(locator, prefix, suffix);
  }
}
