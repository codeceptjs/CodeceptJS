'use strict';
const requireg = require('requireg');
const Helper = require('../helper');
const Locator = require('../locator');
const stringIncludes = require('../assert/include').includes;
const { urlEquals } = require('../assert/equal');
const { equals } = require('../assert/equal');
const { empty } = require('../assert/empty');
const { truth } = require('../assert/truth');
const { toStrictLocator, isCSS, isXPath, locatorType, locatorVal } = require('../locator');
const { xpathLocator, fileExists, clearString } = require('../utils');
const puppeteer = requireg('puppeteer');
const path = require('path');

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
      js_errors: null
    };

    this.isRunning = false;

    // override defaults with config
    Object.assign(this.options, config);

    this.context = this.options.rootElement;
  }

  static _config() {
    return [
      { name: 'url', message: "Base url of site to be tested", default: 'http://localhost' },
    ];
  }

  static _checkRequirements() {
    try {
      requireg("puppeteer");
    } catch(e) {
      return ["puppeteer"];
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
    this.browser = await puppeteer.launch();
    this.page = await this.browser.newPage();
    this.context = await this.page.mainFrame();
  }

  async _stopBrowser() {
    await this.browser.close();
  }

  async _withinBegin(locator) {
    const els = await findElements(this.page, locator);
    this.context = els[0];
  }

  async _withinEnd() {
    this.context = this.page.mainFrame();
  }


  async amOnPage(url) {
    if (url.indexOf('http') !== 0) {
      url = this.options.url + url;
    }
    await this.page.goto(url);
  }

  async _locate(locator) {
    return findElements(this.context, locator);
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


}

module.exports = Puppeteer;

async function findElements(matcher, locator) {
  locator = new Locator(locator, 'css');
  if (!locator.isXPath()) return matcher.$$(locator.simplify());

  let context = null;
  if (!matcher.constructor === 'Frame') {
    context = await matcher.executionContext().evaluateHandle(() => Promise.resolve(this));
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
