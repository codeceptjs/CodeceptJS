'use strict';
let webdriver, protractorWrapper, protractorPlugins, EC;

const SeleniumWebdriver = require('./SeleniumWebdriver');
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

/**
 * Protractor helper is based on [Protractor library](http://www.protractortest.org) and used for testing AngularJS applications.
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
 * * `url` - base url of website to be tested
 * * `browser` - browser in which perform testing
 * * `driver` - which protrator driver to use (local, direct, session, hosted, sauce, browserstack). By default set to 'hosted' which requires selenium server to be started.
 * * `seleniumAddress` - Selenium address to connect (default: http://localhost:4444/wd/hub)
 *
 * other options are the same as in [Protractor config](https://github.com/angular/protractor/blob/master/docs/referenceConf.js).
 *
 * @extends SeleniumWebdriver
 */
class Protractor extends SeleniumWebdriver {

  constructor(config) {
    super(config);

    webdriver = require('selenium-webdriver');
    protractorWrapper = require('protractor').wrapDriver;
    EC = require('protractor').ExpectedConditions;

    this.options = {
      browser: 'firefox',
      url: 'http://localhost',
      seleniumAddress: 'http://localhost:4444/wd/hub',
      rootElement: 'body',
      scriptsTimeout: 10000,
      driver: 'hosted',
      capabilities: {}
    };

    this.options = Object.assign(this.options, config);
    if (this.options.proxy) this.options.capabilities.proxy = this.options.proxy;
    if (this.options.browser) this.options.capabilities.browserName = this.options.browser;
  }

  _init() {
    global.by = require('protractor').By;
    this.driverProvider = require('protractor/built/driverProviders/'+this.options.driver)(this.options);
    this.driverProvider.setupEnv();
  }

  static _require()
  {
    try {
      require.resolve("protractor");
      require.resolve("selenium-webdriver");
    } catch(e) {
      return ["protractor@^3.0.0"];
    }
  }

  static _config() {
    return [
      { name: 'url', message: "Base url of site to be tested", default: 'http://localhost' },
      { name: 'driver', message: "Protractor driver (local, direct, session, hosted, sauce, browserstack)", default: 'hosted' },
      { name: 'browser', message: 'Browser in which testing will be performed', default: 'firefox' },
      { name: 'rootElement', message: "Root element of AngularJS application", default: 'body' },
    ];
  }

  _before() {
    this.browser = this.driverProvider.getNewDriver();
    this.amInsideAngularApp();
    this.context = this.options.rootElement;
    return this.browser;
  }

  _after() {
    return this.browser.quit().then(() => {
      this.browser.driver = null;
      this.browser = null;
    });
  }

  _failed(test) {
    let fileName = test.name.replace(/ /g, '_') + '.failed.png';
    this.debug('Screenshot has been saved to ' + path.join(global.output_dir, fileName));
    return this.saveScreenshot(fileName);
  }


  _withinBegin(locator) {
    withinStore.elFn = this.browser.findElement;
    withinStore.elsFn = this.browser.findElements;

    this.context = locator;
    if (this.insideAngular) {
        let context = this.browser.element(guessLocator(locator) || by.css(locator));

        this.browser.findElement = (l) => l ? context.element(l).getWebElement() : context.getWebElement();
        this.browser.findElements = (l) => context.all(l).getWebElements();
        return;
    }
    super._withinBegin(locator);
  }

  _withinEnd() {
    this.browser.findElement = withinStore.elFn;
    this.browser.findElements = withinStore.elsFn;
    this.context = this.options.rootElement;
  }

  amOnPage(url) {
    return super.amOnPage(url);
  }

  /**
   * Switch to non-Angular mode,
   * start using WebDriver instead of Protractor in this session
   */
  amOutsideAngularApp() {
     if (this.browser.driver && this.insideAngular) {
       this.browser = this.browser.driver;
       this.insideAngular = false;
     }
  }

  /**
   * Enters Angular mode (switched on by default)
   * Should be used after "amOutsideAngularApp"
   */
  amInsideAngularApp() {
    if (this.browser.driver && this.insideAngular) {
      return; // already inside angular
    }
    this.browser = protractorWrapper(this.browser, this.options.url, this.options.rootElement);
    this.browser.ready = this.browser.manage().timeouts().setScriptTimeout(this.options.scriptsTimeout);

    if (this.options.useAllAngular2AppRoots) this.browser.useAllAngular2AppRoots();
    if (this.options.getPageTimeout) this.browser.getPageTimeout = this.options.getPageTimeout;
    if (this.options.allScriptsTimeout) this.browser.allScriptsTimeout = this.options.allScriptsTimeout;
    if (this.options.debuggerServerPort) this.browser.debuggerServerPort_ = this.options.debuggerServerPort;

    this.insideAngular = true;
  }

  /**
   * {{> ../webapi/waitForElement }}
   */
  waitForElement(locator, sec) {
    sec = sec || 1;
    let el = this.browser.element(guessLocator(locator) || by.css(locator));
    return this.browser.wait(EC.presenceOf(el), sec*1000);
  }

  /**
   * Waits for element to become clickable for number of seconds.
   */
  waitForClickable(locator, sec) {
    sec = sec || 1;
    let el = this.browser.element(guessLocator(locator) || by.css(locator));
    return this.browser.wait(EC.elementToBeClickable(el), sec*1000);
  }

  /**
   * {{> ../webapi/waitForVisible }}
   */
  waitForVisible(locator, sec) {
    sec = sec || 1;
    let el = this.browser.element(guessLocator(locator) || by.css(locator));
    return this.browser.wait(EC.visibilityOf(el), sec*1000);
  }

  /**
   * {{> ../webapi/waitForText }}
   */
  waitForText(text, sec, context) {
    if (!context) {
      context = this.context;
    }
    let el = this.browser.element(guessLocator(context) || by.css(context));
    sec = sec || 1;
    return this.browser.wait  (EC.textToBePresentInElement(el, text), sec*1000);
  }

  // ANGULAR SPECIFIC

  moveTo(path) {
    return this.browser.setLocation(path);
  }

  refresh() {
    return this.browser.refresh();
  }

  haveModule(modName, fn) {
    return this.browser.addMockModule(modName, fn);
  }

  resetModule(modName) {
    if (!modName) {
      return this.browser.clearMockModules();
    }
    return this.browser.removeMockModule(modName);
  }
}

module.exports = Protractor;

function *findCheckable(client, locator) {
  let matchedLocator = guessLocator(locator);
  if (matchedLocator) {
    return client.findElements(matchedLocator);
  }
  let literal = xpathLocator.literal(locator);
  let byText = xpathLocator.combine([
    `.//input[@type = 'checkbox' or @type = 'radio'][(@id = //label[contains(normalize-space(string(.)), ${literal})]/@for) or @placeholder = ${literal}]`,
    `.//label[contains(normalize-space(string(.)), ${literal})]//input[@type = 'radio' or @type = 'checkbox']`
  ]);
  let els = yield client.findElements(by.xpath(byText));
  if (els.length) {
    return els;
  }
  let byName = `.//input[@type = 'checkbox' or @type = 'radio'][@name = ${literal}]`;
  els = yield client.findElements(by.xpath(byName));
  if (els.length) {
    return els;
  }
  return yield client.findElements(by.css(locator));
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
  let els = yield client.findElements(by.xpath(byLabelEquals));
  if (els.length) {
    return els;
  }

  let byLabelContains = xpathLocator.combine([
    `.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')][(((./@name = ${literal}) or ./@id = //label[contains(normalize-space(string(.)), ${literal})]/@for) or ./@placeholder = ${literal})]`,
    `.//label[contains(normalize-space(string(.)), ${literal})]//.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')]`
  ]);
  els = yield client.findElements(by.xpath(byLabelContains));
  if (els.length) {
    return els;
  }
  let byName = `.//*[self::input | self::textarea | self::select][@name = ${literal}]`;
  els = yield client.findElements(by.xpath(byName));
  if (els.length) {
    return els;
  }
  return yield client.findElements(by.css(locator));
}

function proceedSee(assertType, text, context) {
  let description, locator;
  if (!context) {
    if (this.context === this.options.rootElement) {
      locator = guessLocator(this.context) || by.css(this.context);
      description = 'web application';
    } else {
      locator = null;
      description = 'current context ' + this.context;
    }
  } else {
    locator = guessLocator(context) || by.css(context);
    description = 'element ' + context;
  }
  return this.browser.findElement(locator).getText().then(function (source) {
    return stringIncludes(description)[assertType](text, source);
  });
}

function *proceedSeeInField(assertType, field, value) {
  let els = yield co(findFields(this.browser, field));
  if (!els.length) {
    throw new Error(`Field ${field} not found by name|text|CSS|XPath`);
  }
  let el = els[0];
  let tag = yield el.getTagName();
  let fieldVal = yield el.getAttribute('value');
  if (tag == 'select') {
    // locate option by values and check them
    let text = yield el.findElement(by.xpath(`./option[@value=${xpathLocator.literal(fieldVal)}]`)).getText();
    return equals('select option by ' + field)[assertType](value, text);
  }
  return stringIncludes('field by ' + field)[assertType](value, fieldVal);
}

function *proceedIsChecked(assertType, option) {
  return co(findCheckable(this.browser, option)).then((els) => {
    if (!els.length) {
      throw new Error(`Option ${option} not found by name|text|CSS|XPath`);
    }
    let elsSelected = [];
    els.forEach(function (el) {
      elsSelected.push(el.isSelected());
    });
    return Promise.all(elsSelected).then(function(values) {
      let selected = values.reduce((prev, cur) => prev || cur)
      return truth(`checkable ${option}`, 'to be checked')[assertType](selected);
    });
  });
}

function *findClickable(matcher, locator) {
  let l = guessLocator(locator);
  if (guessLocator(locator)) {
    return matcher.findElement(l);
  }

  let literal = xpathLocator.literal(locator);

  let narrowLocator = xpathLocator.combine([
    `.//a[normalize-space(.)=${literal}]`,
    `.//button[normalize-space(.)=${literal}]`,
    `.//a/img[normalize-space(@alt)=${literal}]/ancestor::a`,
    `.//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][normalize-space(@value)=${literal}]`
  ]);
  let els = yield matcher.findElements(by.xpath(narrowLocator));
  if (els.length) {
    return els[0];
  }

  let wideLocator = xpathLocator.combine([
    `.//a[./@href][((contains(normalize-space(string(.)), ${literal})) or .//img[contains(./@alt, ${literal})])]`,
    `.//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][contains(./@value, ${literal})]`,
    `.//input[./@type = 'image'][contains(./@alt, ${literal})]`,
    `.//button[contains(normalize-space(string(.)), ${literal})]`,
    `.//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][./@name = ${literal}]`,
    `.//button[./@name = ${literal}]`
  ]);

  els = yield matcher.findElements(by.xpath(wideLocator));
  if (els.length) {
    return els[0];
  }
  if (isXPath(locator)) {
    return matcher.findElement(by.xpath(locator));
  }
  return matcher.findElement(by.css(locator));
}

function guessLocator(locator) {
  if (!locator) {
    return;
  }
  if (typeof (locator) === 'object') {
    let key = Object.keys(locator)[0];
    let value = locator[key];
    return by[key](value);
  }
  if (isCSS(locator)) {
    return by.css(locator);
  }
  if (isXPath(locator)) {
    return by.xpath(locator);
  }
}

function isCSS(locator) {
  return locator[0] === '#' || locator[0] === '.';
}

function isXPath(locator) {
  return locator.substr(0, 2) === '//' || locator.substr(0, 3) === './/'
}

/**
 * Methods below are inherited from SeleniumWebdriver helper,
 * in a similar manner as Protractor is extending SeleniumWebdriverJS.

 * @name Protractor_InheritedMethods
 * @see SeleniumWebdriver
 * @extends SeleniumWebdriver
 */
var Protractor_InheritedMethods = {

/**
 * {{> ../webapi/amOnPage }}
 */
amOnPage: null,
/**
 * {{> ../webapi/appendField }}
 */
appendField: null,
/**
 * {{> ../webapi/attachFile }}
 */
attachFile: null,
/**
 * {{> ../webapi/checkOption }}
 */
checkOption: null,
/**
 * {{> ../webapi/clearCookie }}
 */
clearCookie: null,
/**
 * {{> ../webapi/click }}
 */
click: null,
/**
 * {{> ../webapi/dontSeeCheckboxIsChecked }}
 */
dontSeeCheckboxIsChecked: null,
/**
 * {{> ../webapi/dontSeeCookie }}
 */
dontSeeCookie: null,
/**
 * {{> ../webapi/dontSeeCurrentUrlEquals }}
 */
dontSeeCurrentUrlEquals: null,
/**
 * {{> ../webapi/dontSeeElement }}
 */
dontSeeElement: null,
/**
 * {{> ../webapi/dontSeeInCurrentUrl }}
 */
dontSeeInCurrentUrl: null,
/**
 * {{> ../webapi/dontSeeInField }}
 */
dontSeeInField: null,
/**
 * {{> ../webapi/dontSeeInSource }}
 */
dontSeeInSource: null,
/**
 * {{> ../webapi/dontSeeInTitle }}
 */
dontSeeInTitle: null,
/**
 * {{> ../webapi/dontSee }}
 */
dontSee: null,
/**
 * {{> ../webapi/executeAsyncScript }}
 */
executeAsyncScript: null,
/**
 * {{> ../webapi/executeScript }}
 */
executeScript: null,
/**
 * {{> ../webapi/fillField }}
 */
fillField: null,
/**
 * {{> ../webapi/grabAttribute }}
 */
grabAttribute: null,
/**
 * {{> ../webapi/grabCookie }}
 */
grabCookie: null,
/**
 * {{> ../webapi/grabTextFrom }}
 */
grabTextFrom: null,
/**
 * {{> ../webapi/grabTitle }}
 */
grabTitle: null,
/**
 * {{> ../webapi/grabValueFrom }}
 */
grabValueFrom: null,
/**
 * {{> ../webapi/pressKey }}
 */
pressKey: null,
/**
 * {{> ../webapi/resizeWindow }}
 */
resizeWindow: null,
/**
 * {{> ../webapi/saveScreenshot }}
 */
saveScreenshot: null,
/**
 * {{> ../webapi/seeCheckboxIsChecked }}
 */
seeCheckboxIsChecked: null,
/**
 * {{> ../webapi/seeCookie }}
 */
seeCookie: null,
/**
 * {{> ../webapi/seeCurrentUrlEquals }}
 */
seeCurrentUrlEquals: null,
/**
 * {{> ../webapi/seeElement }}
 */
seeElement: null,
/**
 * {{> ../webapi/seeInCurrentUrl }}
 */
seeInCurrentUrl: null,
/**
 * {{> ../webapi/seeInField }}
 */
seeInField: null,
/**
 * {{> ../webapi/seeInSource }}
 */
seeInSource: null,
/**
 * {{> ../webapi/seeInTitle }}
 */
seeInTitle: null,
/**
 * {{> ../webapi/see }}
 */
see: null,
/**
 * {{> ../webapi/selectOption }}
 */
selectOption: null,
/**
 * {{> ../webapi/setCookie }}
 */
setCookie: null,
/**
 * {{> ../webapi/waitForElement }}
 */
waitForElement: null,
/**
 * {{> ../webapi/waitForEnabled }}
 */
waitForEnabled: null,
/**
 * {{> ../webapi/waitForText }}
 */
waitForText: null,
/**
 * {{> ../webapi/waitForVisible }}
 */
waitForVisible: null,
}
