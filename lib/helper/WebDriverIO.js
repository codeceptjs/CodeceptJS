'use strict';
let Helper = require('../helper');
let webdriverio = require('webdriverio');
let stringIncludes = require('../assert/include').includes;
let urlEquals = require('../assert/equal').urlEquals;
let empty = require('../assert/empty').empty;
let xpathLocator = require('../utils').xpathLocator;

/**
 * WebDriverIO helper which wraps [webdriverio](http://webdriver.io/) library to 
 * manipulate browser using Selenium WebDriver or PhantomJS. 
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
 *   
 * 
 * Additional configuration params can be used from http://webdriver.io/guide/getstarted/configuration.html
 * 
 * ### Connect through proxy
 * 
 * CodeceptJS also provides flexible options when you want to execute tests to Selenium servers through proxy. You will
 * need to update the `helpers.WebDriverIO.proxy` key.
 * 
 * ```js
 * {
 *     "helpers": {
 *         "WebDriverIO": {
 *             "proxy": {
 *                 "proxyType": "manual|pac",
 *                 "proxyAutoconfigUrl": "URL TO PAC FILE",
 *                 "httpProxy": "PROXY SERVER",
 *                 "sslProxy": "PROXY SERVER",
 *                 "ftpProxy": "PROXY SERVER",
 *                 "socksProxy": "PROXY SERVER",
 *                 "socksUsername": "USERNAME",
 *                 "socksPassword": "PASSWORD",
 *                 "noProxy": "BYPASS ADDRESSES"
 *             }
 *         }
 *     }
 * }
 * ```
 * 
 * For example,
 * 
 * ```js
 * {
 *     "helpers": {
 *         "WebDriverIO": {
 *             "proxy": {
 *                 "proxyType": "manual",
 *                 "httpProxy": "http://corporate.proxy:8080",
 *                 "socksUsername": "codeceptjs",
 *                 "socksPassword": "secret",
 *                 "noProxy": "127.0.0.1,localhost"
 *             }
 *         }
 *     }
 * }
 * ```
 *  
 * Please refer to [Selenium - Proxy Object](https://code.google.com/p/selenium/wiki/DesiredCapabilities#Proxy_JSON_Object) for more information.
 *
 * ## Access From Helpers
 * 
 * Receive a WebDriverIO client from a custom helper by accessing `brorwser` property:
 * 
 * ```
 * this.helpers['WebDriverIO'].browser
 * ``` 
 *
 */
class WebDriverIO extends Helper {
  
  constructor(config) {
    super(config);
    this.options = config;
    if (!this.options.desiredCapabilities) this.options.desiredCapabilities = {};
    this.options.desiredCapabilities.browserName = config.browser;
    this.options.baseUrl = config.url;
    if (config.proxy) {
      this.options.desiredCapabilities.proxy = config.proxy;
    }
  }
  
  static _config() {
    return [
      { name: 'url', message: "Base url of site to be tested", default: 'http://localhost' },
      { name: 'browser', message: 'Browser in which testing will be performed', default: 'firefox'}
    ];
  }
  
  _before() {
    return this.browser = webdriverio.remote(this.options).init();
  }
  
  _after() {
    return this.browser.end();
  }
    
  /**
   * Opens a web page in a browser. Requires relative or absolute url. 
   * If url starts with `/`, opens a web page of a site defined in `url` config parameter.
   * 
   * ```js
   * I.amOnPage('/'); // opens main page of website
   * I.amOnPage('https://github.com'); // opens github
   * I.amOnPage('/login'); // opens a login page
   * ```
   */
  amOnPage(url) {
    return this.browser.url(url).url((err, res) => {
      this.debugSection('Url', res.value);
    });
  }   
  
  /**
   * Perform a click on a link or a button, given by a locator. 
   * If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string. 
   * For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched. 
   * For images, the "alt" attribute and inner text of any parent links are searched.
   * 
   * The second parameter is a context (CSS or XPath locator) to narrow the search.
   * 
   * ```js
   * // simple link
   * I.click('Logout');
   * // button of form
   * I.click('Submit');
   * // CSS button
   * I.click('#form input[type=submit]');
   * // XPath
   * I.click('//form/*[@type=submit]');
   * // link in context
   * I.click('Logout', '#nav');
   * // using strict locator
   * I.click({css: 'nav a.login'});
   * ```
   */
  click(link, context) {
    let client = this.browser;
    let clickMethod = this.browser.isMobile ? 'touchClick' : 'elementIdClick';
    if (context) {
      client = client.element(context);
    }
    return findClickable(client, link).then(function(res) {
      if (!res.value || res.value.length === 0) {
        throw new Error(`Clickable element ${link} was not found by text|CSS|XPath`);
      };
      let elem = res.value[0];
      return this[clickMethod](elem.ELEMENT);            
    });
  }
  
  /**
   * Performs a double-click on an element matched by CSS or XPath.
   */
  doubleClick(locator) {
    return this.browser.doubleClick(withStrictLocator(locator));
  }
  
  /**
   * Fills a text field or textarea with the given string.
   * Field is located by name, label, CSS, or XPath.
   * 
   * ```js
   * // by label
   * I.fillField('Email', 'hello@world.com');
   * // by name
   * I.fillField('password', '123456');
   * // by CSS
   * I.fillField('form#login input[name=username]', 'John');
   * // or by strict locator
   * I.fillField({css: 'form#login input[name=username]'}, 'John');
   * ``` 
   */   
  fillField(field, value) {
    return findFields(this.browser, field).then(function(res) {
      if (!res.value || res.value.length === 0) {
        throw new Error(`Field ${field} not found by name|text|CSS|XPath`);
      };
      let elem = res.value[0];
      return this.elementIdClear(elem.ELEMENT).elementIdValue(elem.ELEMENT, value);
    });
  }
  
  /**
   * Selects an option in a drop-down select.
   * Field is siearched by label | name | CSS | XPath.
   * Option is selected by visible text or by value.
   * 
   * ```js
   * I.selectOption('Choose Plan', 'Monthly'); // select by label
   * I.selectOption('subscription', 'Monthly'); // match option by text
   * I.selectOption('subscription', '0'); // or by value
   * I.selectOption('//form/select[@name=account]','Permium');
   * I.selectOption('form select[name=account]', 'Premium');
   * I.selectOption({css: 'form select[name=account]'}, 'Premium');
   * ```
   */
  selectOption(select, option) {
    return findFields(this.browser, select).then(function(res) {
      if (!res.value || res.value.length === 0) {
        throw new Error(`Selectable field ${select} not found by name|text|CSS|XPath`);
      };
      let elem = res.value[0];
      let normalized = `[normalize-space(.) = "${option.trim()}"]`;
      let byVisibleText = `./option${normalized}|./optgroup/option${normalized}`;
      
      // try by visible text
      return this.elementIdElements(elem.ELEMENT, byVisibleText).then(function(res) {
        if (res.value && res.value.length) {
          return this.elementIdClick(res.value[0].ELEMENT);
        }
        // try by value
        let normalized = `[normalize-space(@value) = "${option.trim()}"]`;
        let byValue = `./option${normalized}|./optgroup/option${normalized}`;
        return this.elementIdElements(elem.ELEMENT, byValue).then(function(res) {
          if (!res.value || res.value.length === 0) {
            throw new Error(`Option ${option} in ${select} was found neither by visible text not by value`);
          };
          return this.elementIdClick(res.value[0].ELEMENT);
        });          
      });
    });        
  }
  
  /**
   * Attaches a file to element located by CSS or XPath
   */
  attachFile(locator, pathToFile) {
    return this.browser.chooseFile(withStrictLocator(locator), pathToFile);
  }  
  
  /**
   * Selects a checkbox or radio button. 
   * Element is located by label or name or CSS or XPath.
   * 
   * The second parameter is a context (CSS or XPath locator) to narrow the search. 
   * 
   * ```js
   * I.checkOption('#agree');
   * I.checkOption('I Agree to Terms and Conditions');
   * I.checkOption('agree', '//form');
   * ```
   */
  checkOption(option, context) {
    let client = this.browser;
    let clickMethod = this.browser.isMobile ? 'touchClick' : 'elementIdClick';    
    if (context) {
      client = client.element(withStrictLocator(context));
    }
    return findCheckable(client, option).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new Error(`Checkable ${option} cant be located by name|text|CSS|XPath`);
      }
      let elem = res.value[0];
      return client.elementIdSelected(elem.ELEMENT).then(function(isSelected) {
        if (isSelected.value) return true;
        return this[clickMethod](elem.ELEMENT);
      });                 
    });
  }
  
  /**
   * Retrieves a text from an element located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside a generator with `yield`** operator.
   * 
   * ```js
   * let pin = yield I.grabTextFrom('#pin');
   * ``` 
   */
  grabTextFrom(locator) {
    return this.browser.getText(withStrictLocator(locator)).then(function(text) {
      return text;
    });   
  }

  /**
   * Retrieves a value from a form element located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside a generator with `yield`** operator.
   * 
   * ```js
   * let email = yield I.grabValueFrom('input[name=email]');
   * ```
   */  
  grabValueFrom(locator) {
    return this.browser.getValue(withStrictLocator(locator)).then(function(text) {
      return text;
    });        
  }
  
  /**
   * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside a generator with `yield`** operator.
   * 
   * ```js
   * let hint = yield I.grabAttributeFrom('#tooltip', 'title');
   * ```
   */
  grabAttribute(locator, attr) {
    return this.browser.getAttribute(withStrictLocator(locator), attr).then(function(text) {
      return text;
    });
  }
  
  /**
   * Checks that title contains text.
   */
  seeInTitle(text) {
    return this.browser.getTitle().then((title) => {
      return stringIncludes('web page title').assert(text, title);
    });
  }

  /**
   * Retrieves a page title and returns it to test. 
   * Resumes test execution, so **should be used inside a generator with `yield`** operator.
   * 
   * ```js
   * let title = yield I.grabTitle();
   * ```
   */  
  grabTitle() {
    return this.browser.getTitle().then((title) => {      
      this.debugSection('Title', title);
      return title;
    });
  }
  
  /**
   * Checks that a page contains a visible text.
   * Use context parameter to narrow down the search.
   * 
   * ```js
   * I.see('Welcome'); // text welcome on a page
   * I.see('Welcome', '.content'); // text inside .content div
   * I.see('Register', {css: 'form.register'}); // use strict locator
   * ```
   */
  see(text, context) {
    return proceedSee.call(this, 'assert', text,context);
  }
  
  /**
   * Opposite to `see`. Checks that a text is not present on a page.
   * Use context parameter to narrow down the search.
   * 
   * ```js
   * I.dontSee('Login'); // assume we are already logged in
   * ```
   */
  dontSee(text, context) {
    return proceedSee.call(this, 'negate', text,context);
  }
  
  /**
   * Checks that element is present on page.
   * Element is located by CSS or XPath.
   * 
   * ```js
   * I.seeElement('#modal');
   * ```
   */
  seeElement(locator) {
    return this.browser.elements(withStrictLocator(locator)).then(function(res) {
      return empty('elements').negate(res.value);
    });
  }
  
  /**
   * Opposite to `seeElement`. Checks that element is not on page.
   */
  dontSeeElement(locator) {
    return this.browser.elements(withStrictLocator(locator)).then(function(res) {
      return empty('elements').assert(res.value);
    });    
  }
 
  /**
   * Checks that current url contains a provided fragment.
   * 
   * ```js
   * I.seeInCurrentUrl('/register'); // we are on registration page
   * ```
   */
  seeInCurrentUrl(urlFragment) {
    return this.browser.url().then(function(res) {
      return stringIncludes('url').assert(urlFragment, res.value);
    });
  }

  /**
   * Checks that current url does not contain a provided fragment.
   */
  dontSeeInCurrentUrl(urlFragment) {
    return this.browser.url().then(function(res) {
      return stringIncludes('url').negate(urlFragment, res.value);
    });
  }
  
  
  /** 
   * Checks that current url is equal to provided one. 
   * If a relative url provided, a configured url will be prepended to it.
   * So both examples will work:
   * 
   * ```js
   * I.seeCurrentUrlEquals('/register');
   * I.seeCurrentUrlEquals('http://my.site.com/register');
   * ```
   * 
   */
  seeCurrentUrlEquals(uri, includeDomain) {
    includeDomain = includeDomain || false;
    return this.browser.url().then((res) => {
      return urlEquals(includeDomain ? '' : this.options.url).assert(uri, res.value);
    });    
  }
  
  /**
   * Checks that current url is not equal to provided one.
   * If a relative url provided, a configured url will be prepended to it.
   */
  dontSeeCurrentUrlEquals(uri, includeDomain) {
    includeDomain = includeDomain || false;
    return this.browser.url().then((res) => {
      return urlEquals(this.options.url).negate(uri, res.value);
    });    
  }  
  
  /**
   * Executes sync script on a page.
   * Pass arguments to function as additional parameters.
   * Will return execution result to a test. 
   * In this case you should use generator and yield to receive results. 
   */
  executeScript(fn) {
    return this.browser.execute.apply(this.browser, arguments);
  }
  
  /**
   * Executes async script on page.
   * Provided function should execute a passed callback (as first argument) to signal it is finished.
   */
  executeAsyncScript(fn) {
    return this.browser.executeAsync.apply(this.browser, arguments);
  }  
  
  /**
   * Pauses execution for a number of seconds.
   */  
  wait(sec) {
    return this.browser.pause(sec * 1000);
  }
  
  /**
   * Waits for element to become enabled (by default waits for 1sec).
   * Element can be located by CSS or XPath.
   */
  waitForEnabled(selector, sec) {
    sec = sec || 1;
    return this.browser.waitForEnabled(withStrictLocator(selector), sec*1000);
  }
  
  /**
   * Waits for element to be present on page (by default waits for 1sec).
   * Element can be located by CSS or XPath.
   */
  waitForElement(selector, sec) {
    sec = sec || 1;
    return this.browser.waitForExist(withStrictLocator(selector), sec*1000);
  }
  
  /**
   * Waits for a text to appear (by default waits for 1sec).
   * Element can be located by CSS or XPath.
   * Narrow down search results by providing context.
   */
  waitForText(text, sec, context) {
    sec = sec || 1;
    context = context || 'body';
    return this.browser.waitUntil(function() {
      this.getText(context).then(function(source) {
        if(Array.isArray(source)) {
          return source.filter(part => part.indexOf(text) >= 0).length > 0
        }
        return source.indexOf(text) >= 0;          
      });
    }, sec*1000);
  }
  
  /**
   * Waits for an element to become visible on a page (by default waits for 1sec).
   * Element can be located by CSS or XPath.
   */
  waitForVisible(selector, sec) {
    sec = sec || 1;
    return this.browser.waitForVisible(withStrictLocator(selector), sec*1000);
  }
  
  /**
   * Waits for a function to return true (waits for 1sec by default).
   */
  waitUntil(fn, sec) {
    sec = sec || 1;
    return this.browser.waitUntil(fn, sec);
  }  
}

function proceedSee(assertType, text, context) {
    let description = 'element '+context;
    if (!context) {
      context = 'body';
      description = 'web page';
    }
    return this.browser.getText(withStrictLocator(context)).then(function(source) {
      return stringIncludes(description)[assertType](text, source);
    });  
}

function findClickable(client, locator) {
  if (typeof(locator) === 'object') return client.elements(withStrictLocator(locator));       
  if (isCSSorXPathLocator(locator)) return client.elements(locator);
  
  let literal = xpathLocator.literal(locator);

  let narrowLocator = xpathLocator.combine([
      `//a[normalize-space(.)=${literal}]`,
      `//button[normalize-space(.)=${literal}]`,
      `//a/img[normalize-space(@alt)=${literal}]/ancestor::a`,
      `//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][normalize-space(@value)=${literal}]`
  ]);
  return client.elements(narrowLocator).then(function(els) {
    if (els.value.length) {
      return els;
    }
    let wideLocator = xpathLocator.combine([
      `//a[./@href][((contains(normalize-space(string(.)), ${literal})) or .//img[contains(./@alt, ${literal})])]`,
      `//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][contains(./@value, ${literal})]`,
      `//input[./@type = 'image'][contains(./@alt, ${literal})]`,
      `//button[contains(normalize-space(string(.)), ${literal})]`,
      `//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][./@name = ${literal}]`,
      `//button[./@name = ${literal}]`      
    ]);
    return this.elements(wideLocator).then(function(els) {
      if (els.value.length) {
        return els;
      }
      return this.elements(locator); // by css or xpath      
    });    
  });
}

function findFields(client, locator) {
  if (typeof(locator) === 'object') return client.elements(withStrictLocator(locator));       
  if (isCSSorXPathLocator(locator)) return client.elements(locator);
  
  let literal = xpathLocator.literal(locator);  
  let byText = xpathLocator.combine([
    `//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')][(((./@name = ${literal}) or ./@id = //label[contains(normalize-space(string(.)), ${literal})]/@for) or ./@placeholder = ${literal})]`,
    `//label[contains(normalize-space(string(.)), ${literal})]//.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')]`    
  ]);
  return client.elements(byText).then(function(els) {
    if (els.value.length) return els;
    let byName = `//*[self::input | self::textarea | self::select][@name = ${literal}]`
    return this.elements(byName).then(function(els) {
      if (els.value.length) return els;
      return this.elements(locator); // by css or xpath      
    });        
  });
}

function findCheckable(client, locator) {
  if (typeof(locator) === 'object') return client.elements(withStrictLocator(locator));       
  if (isCSSorXPathLocator(locator)) return client.elements(locator);  
  
  let literal = xpathLocator.literal(locator);  
  let byText = xpathLocator.combine([
    `//input[@type = 'checkbox' or @type = 'radio'][(@id = //label[contains(normalize-space(string(.)), ${literal})]/@for) or @placeholder = ${literal}]`,
    `//label[contains(normalize-space(string(.)), ${literal})]//input[@type = 'radio' or @type = 'checkbox']`    
  ]);
  return client.elements(byText).then(function(els) {
    if (els.value.length) return els;
    let byName = `//input[@type = 'checkbox' or @type = 'radio'][@name = ${literal}]`
    return this.elements(byName).then(function(els) {
      if (els.value.length) return els;
      return this.elements(locator); // by css or xpath      
    });        
  });  
}

function isCSSorXPathLocator(locator) {
  if (locator[0] == '#' || locator[0] == '.') {
    return true;
  }
  if (locator.substr(0,2) == '//') {
    return true;
  }
  return false;
}

function withStrictLocator(locator) {
  if (typeof(locator) !== 'object') return locator;
  let key = Object.keys(locator)[0];
  let value = locator[key];
  switch (key) {
    case 'by':
    case 'xpath':
    case 'css': return value;
    case 'id': return '#'+value;
    case 'name': return `[name="value"]`;
  }  
}

module.exports = WebDriverIO;
