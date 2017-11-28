'use strict';
const requireg = require('requireg');
const Helper = require('../helper');
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
  }

  async _stopBrowser() {
    await this.browser.close();
  }

  async amOnPage(url) {
    if (url.indexOf('http') !== 0) {
      url = this.options.url + url;
    }
    await this.page.goto(url);
  }

  async seeElement(locator) {
    locator = toStrictLocator(locator) || { css: locator};
    let numElements = await this.page.evaluateHandle(function (by, locator) {
      return window.codeceptjs.findElements(by, locator).filter((e) => e.offsetParent !== null).length;
    }, locatorType(locator), locatorVal(locator));

    return equals('number of elements on a page').negate(0, numElements);
  }

  /**
   * {{> ../webapi/dontSeeElement }}

  }


}

module.exports = Puppeteer;