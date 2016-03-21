'use strict';
let webdriver, until;

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
 */
class SeleniumWebdriver extends Helper {

  constructor(config) {
    super(config);

    webdriver = require('selenium-webdriver');
    until = require('selenium-webdriver').until;

    this.options = {
      browser: 'firefox',
      url: 'http://localhost',
      seleniumAddress: 'http://localhost:4444/wd/hub',
      capabilities: {}
    };
    this.options = Object.assign(this.options, config);

  }

  _init() {
    global.by = require('selenium-webdriver').By;
    this.context = 'body'
    this.options.rootElement = 'body' // protractor compat

    this.browserBuilder = new webdriver.Builder()
      .withCapabilities(this.options.capabilities)
      .forBrowser(this.options.browser)
      .usingServer(this.options.seleniumAddress);

    if (this.options.proxy) this.browserBuilder.setProxy(this.options.proxy);
  }

  static _require()
  {
    try {
      require.resolve("selenium-webdriver");
    } catch(e) {
      return ["selenium-webdriver@~2.48.2"];
    }
  }

  static _config() {
    return [
      { name: 'url', message: "Base url of site to be tested", default: 'http://localhost' },
      { name: 'browser', message: 'Browser in which testing will be performed', default: 'firefox' },
    ];
  }

  _before() {
    return this.browser = this.browserBuilder.build();
  }

  _after() {
    return this.browser.quit();
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
    let context = this.browser.findElement(guessLocator(locator) || by.css(locator));

    this.browser.findElement = (l) => context.findElement(l);
    this.browser.findElements = (l) => context.findElements(l);
  }

  _withinEnd() {
    this.browser.findElement = withinStore.elFn;
    this.browser.findElements = withinStore.elsFn;
    this.context = this.options.rootElement;
  }

  /**
   * {{> ../webapi/amOnPage }}
   */
  amOnPage(url) {
    if (url.indexOf('http') !== 0) {
      url = this.options.url + url;
    }
    return this.browser.get(url);
  }

  /**
   * {{> ../webapi/click }}
   */
  click(link, context) {
    let matcher = this.browser;
    if (context) {
      matcher = matcher.findElement(guessLocator(context) || by.css(context));
    }
    return co(findClickable(matcher, link)).then((el) => el.click());
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
   * {{> ../webapi/selectOption }}
   */
  selectOption(select, option) {
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
        let els = yield field.findElements(by.xpath(byVisibleText));
        if (!els.length) {
          let normalizedValue = `[normalize-space(@value) = "${opt.trim() }"]`;
          let byValue = `./option${normalizedValue}|./optgroup/option${normalizedValue}`;
          els = yield field.findElements(by.xpath(byValue));
        }
        els.forEach((el) => promises.push(el.click()));
      }
      return Promise.all(promises);
    }));
  }

  /**
   * {{> ../webapi/fillField }}
   */
  fillField(field, value) {
    return co(findFields(this.browser, field)).then(co.wrap(function*(els) {
      if (!els.length) {
        throw new Error(`Field ${field} not found by name|text|CSS|XPath`);
      }
      yield els[0].clear();
      return els[0].sendKeys(value);
    }));
  }

  /**
   * {{> ../webapi/pressKey }}
   */
  pressKey(key) {
    let modifier;
    if (Array.isArray(key) && ~['Control','Command','Shift','Alt'].indexOf(key[0])) {
      modifier = webdriver.Key[key[0].toUpperCase()];
      key = key[1];
    }
    if (key == 'Enter') {
       key = webdriver.Key.ENTER;
    }

    let action = new webdriver.ActionSequence(this.browser);
    if (modifier) action.keyDown(modifier)
    action.sendKeys(key);
    if (modifier) action.keyUp(modifier)
    return action.perform();
  }

  /**
   * {{> ../webapi/attachFile }}
   */
  attachFile(locator, pathToFile) {
    let file = path.join(global.codecept_dir, pathToFile);
    if (!fileExists(file)) {
      throw new Error(`File at ${file} can not be found on local system`);
    }
    return co(findFields(this.browser, locator)).then((els) => {
      if (!els.length) {
        throw new Error(`Field ${locator} not found by name|text|CSS|XPath`);
      }
      if (this.options.browser !== 'phantomjs') {
        var remote = require('selenium-webdriver/remote');
        this.browser.setFileDetector(new remote.FileDetector());
      }
      return els[0].sendKeys(file);
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
   * {{> ../webapi/appendField }}
   */
  appendField(field, value) {
    return co(findFields(this.browser, field)).then(co.wrap(function*(els) {
      if (!els.length) {
        throw new Error(`Field ${field} not found by name|text|CSS|XPath`);
      }
      return els[0].sendKeys(value);
    }));
  }

  /**
   * {{> ../webapi/checkOption }}
   */
  checkOption(option, context) {
    let matcher = this.browser;
    if (context) {
      matcher = matcher.findElement(guessLocator(context) || by.css(context));
    }
    return co(findCheckable(matcher, option)).then((els) => {
      if (!els.length) {
        throw new Error(`Option ${option} not found by name|text|CSS|XPath`);
      }
      return els[0].isSelected().then((selected) => {
        if (!selected) return els[0].click();
      });
    });
  }

  /**
   * {{> ../webapi/seeCheckboxIsChecked }}
   */
  seeCheckboxIsChecked(option)
  {
    return co.wrap(proceedIsChecked).call(this, 'assert', option);
  }

  /**
   * {{> ../webapi/dontSeeCheckboxIsChecked }}
   */
  dontSeeCheckboxIsChecked(option)
  {
    return co.wrap(proceedIsChecked).call(this, 'negate', option);
  }

  /**
   * {{> ../webapi/grabTextFrom }}
   */
  grabTextFrom(locator) {
    return this.browser.findElement(guessLocator(locator) || by.css(locator)).getText();
  }

  /**
   * {{> ../webapi/grabValueFrom }}
   */
  grabValueFrom(locator) {
    return co(findFields(this.browser, locator)).then(function(els) {
      if (!els.length) {
        throw new Error(`Field ${locator} was not located by name|label|CSS|XPath`);
      }
      return els[0].getAttribute('value');
    });
  }

  /**
   * {{> ../webapi/grabAttribute }}
   */
  grabAttribute(locator, attr) {
    return this.browser.findElement(guessLocator(locator) || by.css(locator)).getAttribute(attr);
  }

  /**
   * {{> ../webapi/seeInTitle }}
   */
  seeInTitle(text) {
    return this.browser.getTitle().then((title) => {
      return stringIncludes('web page title').assert(text, title);
    });
  }

  /**
   * {{> ../webapi/dontSeeInTitle }}
   */
  dontSeeInTitle(text) {
    return this.browser.getTitle().then((title) => {
      return stringIncludes('web page title').negate(text, title);
    });
  }

  /**
   * {{> ../webapi/grabTitle }}
   */
  grabTitle() {
    return this.browser.getTitle().then((title) => {
      this.debugSection('Title', title);
      return title;
    });
  }

  /**
   * {{> ../webapi/seeElement }}
   */
  seeElement(locator) {
    return this.browser.findElements(guessLocator(locator) || by.css(locator)).then((els) => {
      return Promise.all(els.map((el) => el.isDisplayed())).then((els) => {
        return empty('elements').negate(els.filter((v) => v).fill('ELEMENT'));
      });
    });
  }

  /**
   * {{> ../webapi/dontSeeElement }}
   */
  dontSeeElement(locator) {
    return this.browser.findElements(guessLocator(locator) || by.css(locator)).then((els) => {
      return Promise.all(els.map((el) => el.isDisplayed())).then((els) => {
        return empty('elements').assert(els.filter((v) => v).fill('ELEMENT'));
      });
    });
  }

  /**
   * {{> ../webapi/seeElementInDOM }}
   */
  seeElementInDOM(locator) {
    return this.browser.findElements(guessLocator(locator) || by.css(locator)).then((els) => {
      return empty('elements').negate(els.fill('ELEMENT'));
    });
  }

  /**
   * {{> ../webapi/dontSeeElementInDOM }}
   */
  dontSeeElementInDOM(locator) {
    return this.browser.findElements(guessLocator(locator) || by.css(locator)).then((els) => {
      return empty('elements').assert(els.fill('ELEMENT'));
    });
  }

  /**
   * {{> ../webapi/seeInSource }}
   */
  seeInSource(text) {
    return this.browser.getPageSource().then((source) => {
      return stringIncludes('HTML source of a page').assert(text, source);
    });
  }

  /**
   * {{> ../webapi/dontSeeInSource }}
   */
  dontSeeInSource(text) {
    return this.browser.getPageSource().then((source) => {
      return stringIncludes('HTML source of a page').negate(text, source);
    });
  }

  /**
   * {{> ../webapi/executeScript }}
   */
  executeScript(fn) {
    return this.browser.execute.apply(this.browser, arguments);
  }

  /**
   * {{> ../webapi/executeAsyncScript }}
   */
  executeAsyncScript(fn) {
    return this.browser.executeAsync.apply(this.browser, arguments);
  }

  /**
   * {{> ../webapi/seeInCurrentUrl }}
   */
  seeInCurrentUrl(urlFragment) {
    return this.browser.getCurrentUrl().then(function (currentUrl) {
      return stringIncludes('url').assert(urlFragment, currentUrl);
    });
  }

  /**
   * {{> ../webapi/dontSeeInCurrentUrl }}
   */
  dontSeeInCurrentUrl(urlFragment) {
    return this.browser.getCurrentUrl().then(function (currentUrl) {
      return stringIncludes('url').negate(urlFragment, currentUrl);
    });
  }

  /**
   * {{> ../webapi/seeCurrentUrlEquals }}
   */
  seeCurrentUrlEquals(uri) {
    return this.browser.getCurrentUrl().then((currentUrl) => {
      return urlEquals(this.options.url).assert(uri, currentUrl);
    });
  }

  /**
   * {{> ../webapi/dontSeeCurrentUrlEquals }}
   */
  dontSeeCurrentUrlEquals(uri) {
    return this.browser.getCurrentUrl().then((currentUrl) => {
      return urlEquals(this.options.url).negate(uri, currentUrl);
    });
  }

  saveScreenshot(fileName) {
    return this.browser.takeScreenshot().then(function(png) {
      let fs = require('fs');
      var stream = fs.createWriteStream(path.join(global.output_dir, fileName));
      stream.write(new Buffer(png, 'base64'));
      stream.end();
      return new Promise(function(resolve) {
        return stream.on('finish', resolve);
      });
    });
  }

  /**
   * {{> ../webapi/setCookie}}
   *
   * Uses Selenium's JSON [cookie format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).
   */
  setCookie(cookie) {
    let cookieArray = [];
    if (cookie.name) cookieArray.push(cookie.name);
    if (cookie.value) cookieArray.push(cookie.value);
    if (cookie.path) cookieArray.push(cookie.path);
    if (cookie.domain) cookieArray.push(cookie.domain);
    if (cookie.secure) cookieArray.push(cookie.secure);
    if (cookie.expiry) cookieArray.push(cookie.expiry);

    let manage = this.browser.manage();
    return manage.addCookie.apply(manage, cookieArray);
  }

  /**
   * {{> ../webapi/clearCookie}}
   */
  clearCookie(cookie) {
    if (cookie) {
      return this.browser.manage().deleteAllCookies();
    }
    return this.browser.manage().deleteCookie(cookie);
  }

  /**
   * {{> ../webapi/seeCookie}}
   */
  seeCookie(name) {
    return this.browser.manage().getCookie(name).then(function (res) {
      return truth('cookie ' + name, 'to be set').assert(res);
    });
  }

  /**
   * {{> ../webapi/dontSeeCookie}}
   */
  dontSeeCookie(name) {
    return this.browser.manage().getCookie(name).then(function (res) {
      return truth('cookie ' + name, 'to be set').negate(res);
    });
  }

  /**
   * {{> ../webapi/grabCookie}}
   *
   * Returns cookie in JSON [format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).
   */
  grabCookie(name) {
    return this.browser.manage().getCookie(name);
  }

  /**
   * {{> ../webapi/resizeWindow }}
   */
  resizeWindow(width, height) {
    if (width === 'maximize') {
      return this.browser.manage().window().maximize();
    }
    return this.browser.manage().window().setSize(width, height);
  }

  /**
   * Pauses execution for a number of seconds.
   */
  wait(sec) {
    return this.browser.sleep(sec * 1000);
  }

  /**
   * {{> ../webapi/waitForElement }}
   */
  waitForElement(locator, sec) {
    sec = sec || 1;
    let el = this.browser.findElement(guessLocator(locator) || by.css(locator));
    return this.browser.wait(until.elementIsVisible(el), sec*1000);
  }

  /**
   * {{> ../webapi/waitForVisible }}
   */
  waitForVisible(locator, sec) {
    sec = sec || 1;
    let el = this.browser.findElement(guessLocator(locator) || by.css(locator));
    return this.browser.wait(until.visibilityOf(el), sec*1000);
  }

  /**
   * {{> ../webapi/waitForText }}
   */
  waitForText(text, sec, context) {
    if (!context) {
      context = this.context;
    }
    let el = this.browser.findElement(guessLocator(context) || by.css(context));
    sec = sec || 1;
    return this.browser.wait(until.elementTextContains(el, text), sec*1000);
  }

}

module.exports = SeleniumWebdriver;

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
  return this.browser.findElements(locator).then(co.wrap(function*(els) {
    let promises = [];
    let source = '';
    els.forEach(el => promises.push(el.getText().then((elText) => source+= '| ' + elText)));
    yield Promise.all(promises);
    return stringIncludes(description)[assertType](text, source);
  }));
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
    locator.toString = () => `{${key}: '${value}'}`;
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