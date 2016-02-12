'use strict';
let Helper = require('../helper');
let webdriver = require('selenium-webdriver');
let by = require('protractor').By;
let protractor = require('protractor');
let stringIncludes = require('../assert/include').includes;
let urlEquals = require('../assert/equal').urlEquals;
let equals = require('../assert/equal').equals;
let empty = require('../assert/empty').empty;
let truth = require('../assert/truth').truth;
let xpathLocator = require('../utils').xpathLocator;
let EC = protractor.ExpectedConditions;

class Protractor extends Helper {

  constructor(config) {
    super(config);
    this.options = {
      browser: 'firefox',
      url: 'http://localhost',
      seleniumServer: 'localhost',
      seleniumPort: '4444',
      rootElement: 'body',
      scriptsTimeout: 10000
    };   
    this.options = Object.assign(this.options, config);
    if (config.proxy) {
      this.options.desiredCapabilities.proxy = config.proxy;
    }
    global.by = by;
  }  
  
  static _config() {
    return [
      { name: 'url', message: "Base url of site to be tested", default: 'http://localhost' },
      { name: 'browser', message: 'Browser in which testing will be performed', default: 'firefox' },
      { name: 'rootElement', message: "Root element of AngularJS application", default: 'body' },
    ];
  }
  
  _before() {
    let browser = new webdriver.Builder()
      .usingServer(`http://${this.options.seleniumServer}:${this.options.seleniumPort}/wd/hub`)
      .forBrowser(this.options.browser)
      .build();
      
    this.browser = protractor.wrapDriver(browser, this.options.url, this.options.rootElement);
    this.browser.ready = this.browser.manage().timeouts().setScriptTimeout(this.options.scriptsTimeout);    
    this.context = this.options.rootElement;
    return this.browser;
  }  
  
  _after() {
    return this.browser.quit();
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
    let matcher = this.browser.element;
    if (context) {
      matcher = matcher(guessLocator(context));
    }
    return findClickable(matcher, link).click();
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
    let fields = findFields(this.browser, select);
    if (!fields.count()) {
      throw new Error(`Selectable field ${select} not found by name|text|CSS|XPath`);
    }
    if (!Array.isArray(option)) {
      option = [option];
    }
    
    let promises = [];
    option.forEach((opt) => {
      let normalizedText = `[normalize-space(.) = "${opt.trim() }"]`;
      let byVisibleText = `./option${normalizedText}|./optgroup/option${normalizedText}`;
      let el = fields.all(by.xpath(byVisibleText));
      if (!el.count()) {
        let normalizedValue = `[normalize-space(@value) = "${opt.trim() }"]`;
        let byValue = `./option${normalizedValue}|./optgroup/option${normalizedValue}`;
        el = fields.all(by.xpath(byValue));
      }
      promises.push(el.click()); 
    });
    return Promise.all(promises);    
  }
  
  /**
   * {{> ../webapi/fillField }}
   */  
  fillField(field, value) {
    let els = findFields(this.browser, field);
    if (!els.count()) {
      throw new Error(`Field ${field} not found by name|text|CSS|XPath`);
    }
    els.clear();
    return els.sendKeys(value); 
  }
  
  /**
   * {{> ../webapi/seeInField }}
   */  
  seeInField(field, value) {
    return proceedSeeInField.call(this, 'assert', field, value);
  }

  /**
   * {{> ../webapi/dontSeeInField }}
   */  
  dontSeeInField(field, value) {
    return proceedSeeInField.call(this, 'negate', field, value);
  }  
  
  /**
   * {{> ../webapi/appendField }}
   */    
  appendField(field, value) {
    let els = findFields(this.browser, field);
    if (!els.count()) {
      throw new Error(`Field ${field} not found by name|text|CSS|XPath`);
    }
    return els.sendKeys(value);    
  }
  
  /**
   * {{> ../webapi/checkOption }}
   */      
  checkOption(option, context) {
    let element = this.browser.element;
    if (context) {
      element = element(guessLocator(context) || by.css(context)).first();
    }
    let els = findCheckable(element, option);
    if (!els.count()) {
      throw new Error(`Checkable ${option} can't be located by name|text|CSS|XPath`);
    }
    let el = els.first();
    return el.isSelected().then((selected) => {
      if (selected) return;
      return el.click();
    });
  }
  
  /**
   * {{> ../webapi/grabTextFrom }}
   */      
  grabTextFrom(locator) {
    return this.browser.element(guessLocator(locator) || by.css(locator)).getText();
  }
  
  /**
   * {{> ../webapi/grabValueFrom }}
   */      
  grabValueFrom(locator) {    
    return findFields(this.browser, locator).first().getAttribute('value');
  }
  
  /**
   * {{> ../webapi/grabAttribute }}
   */      
  grabAttribute(locator, attr) {
    return this.browser.element(guessLocator(locator) || by.css(locator)).getAttribute(attr);
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
    let els = this.browser.element.all(guessLocator(locator) || by.css(locator));
    return empty('elements').negate(els.count());
  }
  
  /**
   * {{> ../webapi/dontSeeElement }}
   */      
  dontSeeElement(locator) {
    let els = this.browser.element.all(guessLocator(locator) || by.css(locator));
    return empty('elements').assert(els.count());
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
  donSeeInSource(text) {
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
  
  /**
   * {{> ../webapi/resizeWindow }}
   */      
  resizeWindow(width, height) {
    if (width === 'maximize') {
      return this.browser.window().maximize();
    }
    return this.browser.window().setSize(width, height);
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
    return this.browser.wait(EC.textToBePresentInElement(el), text, sec*1000);    
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

function findCheckable(client, locator) {
  let matchedLocator = guessLocator(locator); 
  if (matchedLocator) {
    return client.element.all(matchedLocator);
  }
  let literal = xpathLocator.literal(locator);
  let byText = xpathLocator.combine([
    `.//input[@type = 'checkbox' or @type = 'radio'][(@id = //label[contains(normalize-space(string(.)), ${literal})]/@for) or @placeholder = ${literal}]`,
    `.//label[contains(normalize-space(string(.)), ${literal})]//input[@type = 'radio' or @type = 'checkbox']`
  ]);
  let els = client.element.all(byText);
  if (els.count()) {
    return els;
  }
  let byName = `.//input[@type = 'checkbox' or @type = 'radio'][@name = ${literal}]`;
  els = client.element.all(byName);
  if (els.count()) {
    return els;
  }
  return client.element.all(by.css(locator));   
}

function findFields(client, locator) {
  let matchedLocator = guessLocator(locator); 
  if (matchedLocator) {
    return client.element.all(matchedLocator);
  }
  let literal = xpathLocator.literal(locator);
  let byText = xpathLocator.combine([
    `.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')][(((./@name = ${literal}) or ./@id = //label[contains(normalize-space(string(.)), ${literal})]/@for) or ./@placeholder = ${literal})]`,
    `.//label[contains(normalize-space(string(.)), ${literal})]//.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')]`
  ]);
  let els = client.element.all(by.xpath(byText));
  if (els.count()) {
    return els;
  }
  
  let byName = `.//*[self::input | self::textarea | self::select][@name = ${literal}]`;
  els = client.element.all(by.xpath(byName));
  if (els.count()) {
    return els;
  }
  return client.element.all(by.css(locator));
}

function proceedSee(assertType, text, context) {
  let description;
  if (!context) {
    context = this.context;
    if (this.context === 'body') {
      description = 'web page';
    } else {
      description = 'current context ' + this.context;
    }
  } else {
    description = 'element ' + context;
  }
  return this.browser.element(guessLocator(context) || by.css(context)).getText().then(function (source) {
    return stringIncludes(description)[assertType](text, source);
  });
}

function proceedSeeInField(assertType, field, value) {
  let el = findFields(this.browser, field);
  if (!el.count()) {
    throw new Error(`Field ${field} not found by name|text|CSS|XPath`);
  }
  return el.first().getTagName().then((tag) => {
    if (tag == 'select') {
      // locate option by values and check them      
      return el.first().getAttribute('value').then((value) => {
        return el.first().element(by.xpath(`./option[@value=${xpathLocator.literal(value)}]`)).getText((text) => {
          return equals('select option by ' + field)[assertType](value, text);
        });
      });
    }
    return el.getAttribute('value').then((fieldVal) => {
      return stringIncludes('field by ' + field)[assertType](value, fieldVal);
    });
  });
}

function findClickable(element, locator) {
  if (guessLocator(locator)) {
    return element(locator);
  }

  let literal = xpathLocator.literal(locator);

  let narrowLocator = xpathLocator.combine([
    `.//a[normalize-space(.)=${literal}]`,
    `.//button[normalize-space(.)=${literal}]`,
    `.//a/img[normalize-space(@alt)=${literal}]/ancestor::a`,
    `.//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][normalize-space(@value)=${literal}]`
  ]);
  let els = element.all(by.xpath(narrowLocator));
  if (els.count()) {
    return els.first();
  }
  
  let wideLocator = xpathLocator.combine([
    `.//a[./@href][((contains(normalize-space(string(.)), ${literal})) or .//img[contains(./@alt, ${literal})])]`,
    `.//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][contains(./@value, ${literal})]`,
    `.//input[./@type = 'image'][contains(./@alt, ${literal})]`,
    `.//button[contains(normalize-space(string(.)), ${literal})]`,
    `.//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][./@name = ${literal}]`,
    `.//button[./@name = ${literal}]`
  ]);

  els = element.all(by.xpath(wideLocator));
  if (els.count()) {
    return els.first();
  }  
  if (isXPath(locator)) {
    return element(by.xpath(locator));
  }
  return element(by.css(locator));
}

function guessLocator(locator) {
  if (typeof (locator) === 'object') {
    let key = Object.keys(locator)[0];
    let value = locator[key];
    return by.key(value);
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