'use strict';
let webdriverio;
const Helper = require('../helper');
const stringIncludes = require('../assert/include').includes;
const urlEquals = require('../assert/equal').urlEquals;
const equals = require('../assert/equal').equals;
const empty = require('../assert/empty').empty;
const truth = require('../assert/truth').truth;
const xpathLocator = require('../utils').xpathLocator;
const fileExists = require('../utils').fileExists;
const assert = require('assert');
const path = require('path');
const requireg = require('requireg');

let withinStore = {};

/**
 WebDriverIO helper which wraps [webdriverio](http://webdriver.io/) library to
 manipulate browser using Selenium WebDriver, PhantomJS or Appium.

 #### Selenium Installation

 1.  Download [Selenium Server](http://docs.seleniumhq.org/download/)
 2.  Launch the daemon: `java -jar selenium-server-standalone-2.xx.xxx.jar`

 #### PhantomJS Installation

 PhantomJS is a headless alternative to Selenium Server that implements the WebDriver protocol.
 It allows you to run Selenium tests on a server without a GUI installed.

 1.  Download [PhantomJS](http://phantomjs.org/download.html)
 2.  Run PhantomJS in WebDriver mode: `phantomjs --webdriver=4444`

 #### Appium Installation

 Appium is an open source test automation framework for use with native, hybrid and mobile web apps that implements the WebDriver protocol.
 It allows you to run Selenium tests on mobile devices and also test native, hybrid and mobile web apps.

 1.  Download and install [Appium](http://appium.io/)
 2.  Launch the daemon: `appium`

 ### Configuration

 This helper should be configured in codecept.conf.js

 #### Desktop configuration

 -   `url` - base url of website to be tested
 -   `browser` - browser in which perform testing
 -   `restart` - restart browser between tests (default: true), if set to false cookies will be cleaned but browser window will be kept.
 -   `windowSize`: (optional) default window size. Set to `maximize` or a dimension in the format `640x480`.
 -   `waitForTimeout`: (optional) sets default wait time in _ms_ for all `wait*` functions. 1000 by default;
 -   `desiredCapabilities`: Selenium capabilities
 -   `manualStart` (optional, default: false) - do not start browser before a test, start it manually inside a helper with `this.helpers["WebDriverIO"]._startBrowser()`
 -   `timeouts`: [WebDriverIO timeouts](http://webdriver.io/guide/testrunner/timeouts.html) defined as hash.

 Example:

 ```js
 {
    helpers: {
      WebDriverIO : {
        browser: "chrome",
        restart: false,
        windowSize: "maximize",
        timeouts: {
          script: 60000,
          page load: 10000,
          implicit : 5000
        }
      }
    }
 }
 ```

 Additional configuration params can be used from <http://webdriver.io/guide/getstarted/configuration.html>

 ### Connect through proxy

 CodeceptJS also provides flexible options when you want to execute tests to Selenium servers through proxy. You will
 need to update the `helpers.WebDriverIO.desiredCapabilities.proxy` key.

 ```js
 {
     helpers: {
         WebDriverIO: {
             desiredCapabilities: {
                 proxy: {
                     proxyType: "manual|pac",
                     proxyAutoconfigUrl: "URL TO PAC FILE",
                     httpProxy: "PROXY SERVER",
                     sslProxy: "PROXY SERVER",
                     ftpProxy: "PROXY SERVER",
                     socksProxy: "PROXY SERVER",
                     socksUsername: "USERNAME",
                     socksPassword: "PASSWORD",
                     noProxy: "BYPASS ADDRESSES"
                 }
             }
         }
     }
 }
 ```

 For example,

 ```js
 {
     helpers: {
         WebDriverIO: {
             desiredCapabilities: {
                 proxy: {
                     proxyType: "manual",
                     httpProxy: "http://corporate.proxy:8080",
                     socksUsername: "codeceptjs",
                     socksPassword: "secret",
                     noProxy: "127.0.0.1,localhost"
                 }
             }
         }
     }
 }
 ```

 Please refer to [Selenium - Proxy Object](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities) for more information.

 ### Cloud Providers

 WebDriverIO makes it possible to execute tests against services like `Sauce Labs` `BrowserStack` `TestingBot`
 Check out their documentation on [available parameters](http://webdriver.io/guide/testrunner/cloudservices.html)

 Connecting to `BrowserStack` and `Sauce Labs` is simple. All you need to do
 is set the `user` and `key` parameters. WebDriverIO authomatically know which
 service provider to connect to.

 ```js
 {
     helpers:{
         WebDriverIO: {
             url: "YOUR_DESIERED_HOST",
             user: "YOUR_BROWSERSTACK_USER",
             key: "YOUR_BROWSERSTACK_KEY",
             desiredCapabilities: {
                 browserName: "chrome",

                 // only set this if you're using BrowserStackLocal to test a local domain
                 // "browserstack.local": true,

                 // set this option to tell browserstack to provide addition debugging info
                 // "browserstack.debug": true,
             }
         }
     }
 }
 ```

 ### Multiremote Capabilities

 This is a work in progress but you can control two browsers at a time right out of the box.
 Individual control is something that is planned for a later version.

 Here is the [webdriverio docs](http://webdriver.io/guide/usage/multiremote.html) on the subject

 ```js
 {
     helpers: {
         WebDriverIO: {
             multiremote: {
                 MyChrome: {
                     desiredCapabilities: {
                         browserName: "chrome"
                      }
                 },
                 MyFirefox: {
                    desiredCapabilities: {
                        browserName: "firefox"
                    }
                 }
             }
         }
     }
 }
 ```

 #### Appium configuration

 -   `port`: Appium serverport
 -   `restart`: restart browser or app between tests (default: true), if set to false cookies will be cleaned but browser window will be kept and for apps nothing will be changed.
 -   `desiredCapabilities`: Appium capabilities
 --   `platformName` - Which mobile OS platform to use
 --   `appPackage` - Java package of the Android app you want to run
 --   `appActivity` - Activity name for the Android activity you want to launch from your package.
 --   `deviceName`: The kind of mobile device or emulator to use
 --   `platformVersion`: Mobile OS version
 --   `app` - The absolute local path or remote http URL to an .ipa or .apk file, or a .zip containing one of these. Appium will attempt to install this app binary on the appropriate device first.
 --   `browserName`: Name of mobile web browser to automate. Should be an empty string if automating an app instead.

 Example:

 ```js
 {
   helpers: {
       WebDriverIO: {
           desiredCapabilities: {
               platformName: "Android",
               appPackage: "com.example.android.myApp",
               appActivity: "MainActivity",
               deviceName: "OnePlus3",
               platformVersion: "6.0.1"
           },
           port: 4723,
           restart: false
       }
    }
 }
 ```
 Additional configuration params can be used from <https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/caps.md>


 ## Access From Helpers

 Receive a WebDriverIO client from a custom helper by accessing `browser` property:

 ```js
 this.helpers['WebDriverIO'].browser
 ```
 */
class WebDriverIO extends Helper {

  constructor(config) {
    super(config);
    webdriverio = requireg('webdriverio');

    // set defaults
    this.options = {
      waitForTimeout: 1000, // ms
      desiredCapabilities: {},
      restart: true,
      manualStart: false,
      timeouts: {
        script: 1000 // ms
      }
    };

    // override defaults with config
    Object.assign(this.options, config);

    this.options.baseUrl = this.options.url || this.options.baseUrl;
    this.options.desiredCapabilities.browserName = this.options.browser || this.options.desiredCapabilities.browserName;
    this.options.waitForTimeout /= 1000; // convert to seconds

    if (!this.options.desiredCapabilities.platformName) {
      if (!this.options.url || !this.options.browser) {
        throw new Error(`
        WebDriverIO requires at least these parameters
        Check your codeceptjs config file to ensure these are set properly
          {
            "helpers": {
              "WebDriverIO": {
                "url": "YOUR_HOST"
                "browser": "YOUR_PREFERED_TESTING_BROWSER"
              }
            }
          }
      `);
      }
    } else {
      if ((this.options.desiredCapabilities.platformName == "iOS") && ((!this.options.desiredCapabilities.app || !this.options.desiredCapabilities.deviceName || !this.options.desiredCapabilities.platformVersion) && (!this.options.desiredCapabilities.browserName))) {
        throw new Error(`
          WebDriverIO requires at least these parameters to run in Appium mode for iOS
          Check your codeceptjs config file to ensure these are set properly
            {
              "helpers": {
                "WebDriverIO": {
                  desiredCapabilities: {
                      platformName: "iOS",
                      app: "http://myapp.com/app.ipa",
                      deviceName: "iPhone Simulator",
                      platformVersion: "7.1"
                  }
                }
              }
            }
            or
            {
              "helpers": {
                "WebDriverIO": {
                  desiredCapabilities: {
                      platformName: "iOS",
                      browserName: "Safari",
                      deviceName: "iPhone Simulator",
                      platformVersion: "7.1"
                  }
                }
              }
            }
        `);
      } else if ((this.options.desiredCapabilities.platformName == "Android") && ((!this.options.desiredCapabilities.appPackage || !this.options.desiredCapabilities.appActivity || !this.options.desiredCapabilities.platformVersion) && (!this.options.desiredCapabilities.browserName))) {
        throw new Error(`
          WebDriverIO requires at least these parameters to run in Appium mode for Android
          Check your codeceptjs config file to ensure these are set properly
            {
              "helpers": {
                "WebDriverIO": {
                  desiredCapabilities: {
                      platformName: "Android",
                      appPackage: "com.aim.condition",
                      appActivity: "com.aim.condition.activities.MainActivity",
                      platformVersion: "6.0.1"
                  }
                }
              }
            }
          or
          {
            "helpers": {
              "WebDriverIO": {
                desiredCapabilities: {
                    platformName: "Android",
                    browserName: "Chrome",
                    platformVersion: "6.0.1"
                }
              }
            }
          }
        `);
      }
    }

  }

  static _checkRequirements() {
    try {
      requireg("webdriverio");
    } catch (e) {
      return ["webdriverio"];
    }
  }

  static _config() {
    return [{
      name: 'url',
      message: "Base url of site to be tested",
      default: 'http://localhost'
    }, {
      name: 'browser',
      message: 'Browser in which testing will be performed',
      default: 'firefox'
    }];
  }

  _beforeSuite() {
    if (!this.options.restart && !this.options.manualStart) {
      this.debugSection('Session', 'Starting singleton browser session');
      return this._startBrowser();
    }
  }

  _startBrowser() {
    if (this.options.multiremote) {
      this.browser = webdriverio.multiremote(this.options.multiremote).init();
    } else {
      this.browser = webdriverio.remote(this.options).init();
    }

    if (this.options.desiredCapabilities.browserName) {
      this.defineTimeout(this.options.timeouts);
    }

    if (this.options.windowSize === 'maximize') {
      this.browser.windowHandleMaximize(false);
    }
    if (this.options.windowSize && this.options.windowSize.indexOf('x') > 0) {
      let dimensions = this.options.windowSize.split('x');
      this.browser.windowHandleSize({
        width: dimensions[0],
        height: dimensions[1]
      });
    }
    return this.browser;
  }

  _before() {
    if (this.options.restart && !this.options.manualStart) this._startBrowser();
    this.failedTestName = null;
    this.context = 'body';
    return this.browser;
  }

  _after() {
    if (this.options.restart) return this.browser.end();
    if (this.options.desiredCapabilities.browserName) {
      this.debugSection('Session', 'cleaning cookies and localStorage');
      return this.browser.execute('localStorage.clear();').then(() => {
        return this.browser.deleteCookie();
      });
    }
  }

  _afterSuite() {
    if (!this.options.restart) return this.browser.end();
  }

  _failed(test) {
    let fileName = test.title.replace(/ /g, '_') + '.failed.png';
    return this.saveScreenshot(fileName);
  }

  _withinBegin(locator) {
    withinStore.elFn = this.browser.element;
    withinStore.elsFn = this.browser.elements;
    this.context = locator;
    return this.browser.element(withStrictLocator(locator, this.options.desiredCapabilities.browserName)).then((res) => {
      this.browser.element = function(l) {
        return this.elementIdElement(res.value.ELEMENT, l);
      };
      this.browser.elements = function(l) {
        return this.elementIdElements(res.value.ELEMENT, l);
      };
    });
  }

  _withinEnd() {
    this.context = 'body';
    this.browser.element = withinStore.elFn;
    this.browser.elements = withinStore.elsFn;
  }

  /**
   * Get elements by different locator types, including strict locator
   * Should be used in custom helpers:
   *
   * ```js
   * this.helpers['WebDriverIO']._locate({name: 'password'}).then //...
   * ```
   */
  _locate(locator) {
    return this.browser.elements(withStrictLocator(locator, this.options.desiredCapabilities.browserName));
  }

  /**
   * Find a checkbox by providing human readable text:
   *
   * ```js
   * this.helpers['WebDriverIO']._locateCheckable('I agree with terms and conditions').then // ...
   * ```
   */
  _locateCheckable(locator) {
    return findCheckable(this.browser, locator, this.options.desiredCapabilities.browserName).then(function(res) {
      return res.value;
    })
  }

  /**
   * Find a clickable element by providing human readable text:
   *
   * ```js
   * this.helpers['WebDriverIO']._locateClickable('Next page').then // ...
   * ```
   */
  _locateClickable(locator) {
    return findClickable(this.browser, locator, this.options.desiredCapabilities.browserName).then(function(res) {
      return res.value;
    })
  }

  /**
   * Find field elements by providing human readable text:
   *
   * ```js
   * this.helpers['WebDriverIO']._locateFields('Your email').then // ...
   * ```
   */
  _locateFields(locator) {
    return findFields(this.browser, locator).then(function(res) {
      return res.value;
    })
  }

  /**
   * Set [WebDriverIO timeouts](http://webdriver.io/guide/testrunner/timeouts.html) in realtime.
   * Appium: support only web testing
   * Timeouts are expected to be passed as object:
   *
   * ```js
   * I.defineTimeout({ script: 5000 });
   * I.defineTimeout({ implicit: 10000, "page load": 10000, script: 5000 });
   * ```
   */
  defineTimeout(timeouts) {
    if (this.options.desiredCapabilities.browserName) {
      if (timeouts.implicit) {
        this.browser.timeouts('implicit', timeouts.implicit);
      }
      if (timeouts['page load']) {
        this.browser.timeouts('page load', timeouts['page load']);
      }
      if (timeouts.script) {
        this.browser.timeouts('script', timeouts.script);
      }
    }
  }

  /**
   * {{> ../webapi/amOnPage }}
   * Appium: support only web testing
   */
  amOnPage(url) {
    if (this.options.desiredCapabilities.browserName) {
      return this.browser.url(url).url((err, res) => {
        if (err) throw err;
        this.debugSection('Url', res.value);
      });
    } else {
      throw new Error(`amOnPage method can't be used in apps testing`);
    }
  }

  /**
   * {{> ../webapi/click }}
   * Appium: support
   */
  click(locator, context) {
    let client = this.browser;
    let browserCap = this.options.desiredCapabilities.browserName
    let clickMethod = this.browser.isMobile ? 'touchClick' : 'elementIdClick';
    if (context) {
      client = client.element(context);
    }
    return findClickable(client, locator, browserCap).then(function(res) {
      if (!res.value || res.value.length === 0) {
        if (typeof(locator) === "object") locator = JSON.stringify(locator);
        throw new Error(`Clickable element ${locator.toString()} was not found by text|CSS|XPath`);
      }
      let elem = res.value[0];
      return this[clickMethod](elem.ELEMENT);
    });
  }

  /**
   * {{> ../webapi/doubleClick }}
   * Appium: support only web testing
   */
  doubleClick(locator, context) {
    if (this.options.desiredCapabilities.browserName) {
      let client = this.browser;
      let browserCap = this.options.desiredCapabilities.browserName
      if (context) {
        client = client.element(context);
      }
      return findClickable(client, locator, browserCap).then(function(res) {
        if (!res.value || res.value.length === 0) {
          if (typeof(locator) === "object") locator = JSON.stringify(locator);
          throw new Error(`Clickable element ${locator.toString()} was not found by text|CSS|XPath`);
        }
        let elem = res.value[0];
        return this.moveTo(elem.ELEMENT).doDoubleClick();
      });
    } else {
      throw new Error(`doubleClick method can't be used in apps testing`);
    }
  }

  /**
   * Performs right click on an element matched by CSS or XPath.
   * Appium: support, but in apps works as usual click
   */
  rightClick(locator) {
    return this.browser.rightClick(withStrictLocator(locator, this.options.desiredCapabilities.browserName));
  }

  /**
   * {{> ../webapi/fillField }}
   * Appium: support
   */
  fillField(field, value) {
    return findFields(this.browser, field).then(function(res) {
      if (!res.value || res.value.length === 0) {
        throw new Error(`Field ${field} not found by name|text|CSS|XPath`);
      }
      let elem = res.value[0];
      return this.elementIdClear(elem.ELEMENT).elementIdValue(elem.ELEMENT, value);
    });
  }

  /**
   * {{> ../webapi/appendField }}
   * Appium: support, but it's clear a field before insert in apps
   */
  appendField(field, value) {
    return findFields(this.browser, field).then(function(res) {
      if (!res.value || res.value.length === 0) {
        throw new Error(`Field ${field} not found by name|text|CSS|XPath`);
      }
      let elem = res.value[0];
      return this.elementIdValue(elem.ELEMENT, value);
    });
  }

  /**
   * {{> ../webapi/selectOption}}
   * Appium: support only web testing
   */
  selectOption(select, option) {
    return findFields(this.browser, select).then(function(res) {
      if (!res.value || res.value.length === 0) {
        throw new Error(`Selectable field ${select} not found by name|text|CSS|XPath`);
      }
      let elem = res.value[0];

      let normalized, byVisibleText;
      let commands = [];

      if (!Array.isArray(option)) {
        option = [option];
      }

      option.forEach((opt) => {
        normalized = `[normalize-space(.) = "${opt.trim() }"]`;
        byVisibleText = `./option${normalized}|./optgroup/option${normalized}`;
        commands.push(this.elementIdElements(elem.ELEMENT, byVisibleText));
      });
      return this.unify(commands, {
        extractValue: true
      }).then((els) => {
        commands = [];
        let clickOptionFn = (el) => {
          if (el[0]) el = el[0];
          if (el && el.ELEMENT) commands.push(this.elementIdClick(el.ELEMENT));
        };

        if (els.length) {
          els.forEach(clickOptionFn);
          return this.unify(commands);
        }
        let normalized, byValue;

        option.forEach((opt) => {
          normalized = `[normalize-space(@value) = "${opt.trim() }"]`;
          byValue = `./option${normalized}|./optgroup/option${normalized}`;
          commands.push(this.elementIdElements(elem.ELEMENT, byValue));
        });
        // try by value
        return this.unify(commands, {
          extractValue: true
        }).then((els) => {
          if (els.length === 0) {
            throw new Error(`Option ${option} in ${select} was found neither by visible text not by value`);
          }
          commands = [];
          els.forEach(clickOptionFn);
          return this.unify(commands);
        });
      });
    });
  }

  /**
   * {{> ../webapi/attachFile }}
   * Appium: not tested
   */
  attachFile(locator, pathToFile) {
    let file = path.join(global.codecept_dir, pathToFile);
    if (!fileExists(file)) {
      throw new Error(`File at ${file} can not be found on local system`);
    }
    return findFields(this.browser, locator).then((el) => {
      this.debug("Uploading " + file);
      return this.browser.uploadFile(file).then((res) => {
        if (!el.value || el.value.length === 0) {
          throw new Error(`File field ${locator} not found by name|text|CSS|XPath`);
        }
        return this.browser.elementIdValue(el.value[0].ELEMENT, res.value);
      });
    });
  }

  /**
   * {{> ../webapi/checkOption }}
   * Appium: not tested
   */
  checkOption(field, context) {
    let client = this.browser;
    let browserCap = this.options.desiredCapabilities.browserName
    let clickMethod = this.browser.isMobile ? 'touchClick' : 'elementIdClick';
    if (context) {
      client = client.element(withStrictLocator(context));
    }
    return findCheckable(client, field, browserCap).then((res) => {
      if (!res.value || res.value.length === 0) {
        throw new Error(`Checkable ${field} cant be located by name|text|CSS|XPath`);
      }
      let elem = res.value[0];
      return client.elementIdSelected(elem.ELEMENT).then(function(isSelected) {
        if (isSelected.value) return true;
        return this[clickMethod](elem.ELEMENT);
      });
    });
  }

  /**
   * {{> ../webapi/grabTextFrom }}
   * Appium: support
   */
  grabTextFrom(locator) {
    return this.browser.getText(withStrictLocator(locator, this.options.desiredCapabilities.browserName)).then(function(text) {
      return text;
    });
  }

  /**
   * Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
   * Resumes test execution, so **should be used inside a generator with `yield`** operator.
   * Appium: support only web testing
   *
   * ```js
   * let postHTML = yield I.grabHTMLFrom('#post');
   * ```
   */
  grabHTMLFrom(locator) {
    if (this.options.desiredCapabilities.browserName) {
      return this.browser.getHTML(withStrictLocator(locator, this.options.desiredCapabilities.browserName)).then(function(html) {
        return html;
      });
    } else {
      throw new Error(`grabHTMLFrom method can't be used in apps testing`);
    }
  }

  /**
   * {{> ../webapi/grabValueFrom }}
   * Appium: support only web testing
   */
  grabValueFrom(locator) {
    if (this.options.desiredCapabilities.browserName) {
      return this.browser.getValue(withStrictLocator(locator, this.options.desiredCapabilities.browserName)).then(function(text) {
        return text;
      });
    } else {
      throw new Error(`grabValueFrom method can't be used in apps testing, use grabTextFrom or grabAttributeFrom`);
    }
  }

  /**
   * {{> ../webapi/grabAttributeFrom }}
   * Appium: can be used for apps only with several values ("contentDescription", "text", "className", "resourceId")
   */
  grabAttributeFrom(locator, attr) {
    if ((this.options.desiredCapabilities.browserName) || (attr === "contentDescription" || attr === "text" || attr === "className" || attr === "resourceId")) {
      return this.browser.getAttribute(withStrictLocator(locator, this.options.desiredCapabilities.browserName), attr).then(function(text) {
        return text;
      });
    } else {
      throw new Error(`grabValueFrom method can't be used in apps testing, use grabTextFrom or grabAttributeFrom`);
    }
  }

  /**
   * {{> ../webapi/seeInTitle }}
   * Appium: support only web testing
   */
  seeInTitle(text) {
    if (this.options.desiredCapabilities.browserName) {
      return this.browser.getTitle().then((title) => {
        return stringIncludes('web page title').assert(text, title);
      });
    } else {
      throw new Error(`seeInTitle method can't be used in apps testing, there is no title in app`);
    }
  }

  /**
   * {{> ../webapi/dontSeeInTitle }}
   * Appium: support only web testing
   */
  dontSeeInTitle(text) {
    if (this.options.desiredCapabilities.browserName) {
      return this.browser.getTitle().then((title) => {
        return stringIncludes('web page title').negate(text, title);
      });
    } else {
      throw new Error(`dontSeeInTitle method can't be used in apps testing, there is no title in app`);
    }
  }

  /**
   * {{> ../webapi/grabTitle }}
   * Appium: support only web testing
   */
  grabTitle() {
    if (this.options.desiredCapabilities.browserName) {
      return this.browser.getTitle().then((title) => {
        this.debugSection('Title', title);
        return title;
      });
    } else {
      throw new Error(`grabTitle method can't be used in apps testing, there is no title in app`);
    }
  }

  /**
   * {{> ../webapi/see }}
   * Appium: support with context in apps
   */
  see(text, context) {
    if ((this.options.desiredCapabilities.browserName) || (context)) {
      return proceedSee.call(this, 'assert', text, context);
    } else {
      throw new Error(`see method can be used in apps testing only with context`);
    }
  }

  /**
   * {{> ../webapi/dontSee }}
   * Appium: support with context in apps
   */
  dontSee(text, context) {
    if ((this.options.desiredCapabilities.browserName) || (context)) {
      return proceedSee.call(this, 'negate', text, context);
    } else {
      throw new Error(`dontSee method can be used in apps testing only with context`);
    }
  }

  /**
   * {{> ../webapi/seeInField }}
   * Appium: support only web testing
   */
  seeInField(field, value) {
    if (this.options.desiredCapabilities.browserName) {
      return proceedSeeField.call(this, 'assert', field, value);
    } else {
      throw new Error(`seeInField method can't be used in apps testing`);
    }
  }

  /**
   * {{> ../webapi/dontSeeInField }}
   * Appium: support only web testing
   */
  dontSeeInField(field, value) {
    if (this.options.desiredCapabilities.browserName) {
      return proceedSeeField.call(this, 'negate', field, value);
    } else {
      throw new Error(`dontSeeInField method can't be used in apps testing`);
    }
  }

  /**
   * {{> ../webapi/seeCheckboxIsChecked }}
   * Appium: not tested
   */
  seeCheckboxIsChecked(field) {
    return proceedSeeCheckbox.call(this, 'assert', field);
  }

  /**
   * {{> ../webapi/dontSeeCheckboxIsChecked }}
   * Appium: not tested
   */
  dontSeeCheckboxIsChecked(field) {
    return proceedSeeCheckbox.call(this, 'negate', field);
  }

  /**
   * {{> ../webapi/seeElement }}
   * Appium: support
   */
  seeElement(locator) {
    return this.browser.isVisible(withStrictLocator(locator, this.options.desiredCapabilities.browserName)).then(function(res) {
      return truth(`elements of ${locator}`, 'to be seen').assert(res);
    });
  }

  /**
   * {{> ../webapi/dontSeeElement}}
   * Appium: support
   */
  dontSeeElement(locator) {
    return this.browser.isVisible(withStrictLocator(locator, this.options.desiredCapabilities.browserName)).then(function(res) {
      return truth(`elements of ${locator}`, 'to be seen').negate(res);
    });
  }

  /**
   * {{> ../webapi/seeElementInDOM }}
   * Appium: support
   */
  seeElementInDOM(locator) {
    return this.browser.elements(withStrictLocator(locator, this.options.desiredCapabilities.browserName)).then(function(res) {
      return empty('elements').negate(res.value);
    });
  }

  /**
   * {{> ../webapi/dontSeeElementInDOM }}
   * Appium: support
   */
  dontSeeElementInDOM(locator) {
    return this.browser.elements(withStrictLocator(locator, this.options.desiredCapabilities.browserName)).then(function(res) {
      return empty('elements').assert(res.value);
    });
  }

  /**
   * {{> ../webapi/seeInSource }}
   * Appium: support
   */
  seeInSource(text) {
    return this.browser.getSource().then((source) => {
      return stringIncludes('HTML source of a page').assert(text, source);
    });
  }

  /**
   * {{> ../webapi/dontSeeInSource }}
   * Appium: support
   */
  dontSeeInSource(text) {
    return this.browser.getSource().then((source) => {
      return stringIncludes('HTML source of a page').negate(text, source);
    });
  }

  /**
   * asserts that an element appears a given number of times in the DOM
   * Element is located by label or name or CSS or XPath.
   * Appium: support
   *
   * ```js
   * I.seeNumberOfElements('#submitBtn', 1);
   * ```
   */
  seeNumberOfElements(selector, num) {
    return this.browser.elements(withStrictLocator(selector))
      .then(function(res) {
        return assert.equal(res.value.length, num);
      });
  }

  /**
   * {{> ../webapi/seeInCurrentUrl }}
   * Appium: support only web testing
   */
  seeInCurrentUrl(url) {
    if (this.options.desiredCapabilities.browserName) {
      return this.browser.url().then(function(res) {
        return stringIncludes('url').assert(url, res.value);
      });
    } else {
      throw new Error(`seeInCurrentUrl method can't be used in apps. There is no URL`);
    }
  }

  /**
   * {{> ../webapi/dontSeeInCurrentUrl }}
   * Appium: support only web testing
   */
  dontSeeInCurrentUrl(url) {
    if (this.options.desiredCapabilities.browserName) {
      return this.browser.url().then(function(res) {
        return stringIncludes('url').negate(url, res.value);
      });
    } else {
      throw new Error(`dontSeeInCurrentUrl method can't be used in apps. There is no URL`);
    }
  }

  /**
   * {{> ../webapi/seeCurrentUrlEquals }}
   * Appium: support only web testing
   */
  seeCurrentUrlEquals(url) {
    if (this.options.desiredCapabilities.browserName) {
      return this.browser.url().then((res) => {
        return urlEquals(this.options.url).assert(url, res.value);
      });
    } else {
      throw new Error(`seeCurrentUrlEquals method can't be used in apps. There is no URL`);
    }
  }

  /**
   * {{> ../webapi/dontSeeCurrentUrlEquals }}
   * Appium: support only web testing
   */
  dontSeeCurrentUrlEquals(url) {
    if (this.options.desiredCapabilities.browserName) {
      return this.browser.url().then((res) => {
        return urlEquals(this.options.url).negate(url, res.value);
      });
    } else {
      throw new Error(`seeCurrentUrlEquals method can't be used in apps. There is no URL`);
    }
  }

  /**
   * {{> ../webapi/executeScript }}
   * Appium: support only web testing
   *
   * Wraps [execute](http://webdriver.io/api/protocol/execute.html) command.
   */
  executeScript(fn) {
    if (this.options.desiredCapabilities.browserName) {
      return this.browser.execute.apply(this.browser, arguments).then((res) => res.value);
    } else {
      throw new Error(`executeScript method can't be used in apps.`);
    }
  }

  /**
   * {{> ../webapi/executeAsyncScript }}
   * Appium: support only web testing
   */
  executeAsyncScript(fn) {
    if (this.options.desiredCapabilities.browserName) {
      return this.browser.executeAsync.apply(this.browser, arguments).then((res) => res.value);
    } else {
      throw new Error(`executeAsyncScript method can't be used in apps.`);
    }
  }

  /**
   * Scrolls to element matched by locator.
   * Extra shift can be set with offsetX and offsetY options
   * Appium: support only web testing
   *
   * ```js
   * I.scrollTo('footer');
   * I.scrollTo('#submit', 5,5);
   * ```
   */
  scrollTo(locator, offsetX, offsetY) {
    if (this.options.desiredCapabilities.browserName) {
      return this.browser.scroll(withStrictLocator(locator, this.options.desiredCapabilities.browserName), offsetX, offsetY);
    } else {
      throw new Error(`scrollTo method can't be used in apps.`);
    }
  }

  /**
   * {{> ../webapi/moveCursorTo}}
   * Appium: support only web testing
   */
  moveCursorTo(locator, offsetX, offsetY) {
    if (this.options.desiredCapabilities.browserName) {
      return this.browser.moveToObject(withStrictLocator(locator, this.options.desiredCapabilities.browserName), offsetX, offsetY);
    } else {
      throw new Error(`moveCursorTo method can't be used in apps.`);
    }
  }

  /**
   * {{> ../webapi/saveScreenshot}}
   * Appium: support
   */
  saveScreenshot(fileName) {
    let outputFile = path.join(global.output_dir, fileName);
    this.debug('Screenshot has been saved to ' + outputFile);
    return this.browser.saveScreenshot(outputFile);
  }

  /**
   * {{> ../webapi/setCookie}}
   * Appium: support only web testing
   *
   * Uses Selenium's JSON [cookie format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).
   */
  setCookie(cookie) {
    if (this.options.desiredCapabilities.browserName) {
      return this.browser.setCookie(cookie);
    } else {
      throw new Error(`setCookie method can't be used in apps. it hasn't Cookie storage`);
    }
  }

  /**
   * {{> ../webapi/clearCookie}}
   * Appium: support only web testing
   */
  clearCookie(cookie) {
    if (this.options.desiredCapabilities.browserName) {
      return this.browser.deleteCookie(cookie);
    } else {
      throw new Error(`clearCookie method can't be used in apps. it hasn't Cookie storage`);
    }
  }

  /**
   * {{> ../webapi/clearField}}
   * Appium: support
   */
  clearField(locator) {
    return this.browser.clearElement(withStrictLocator(locator, this.options.desiredCapabilities.browserName));
  }

  /**
   * {{> ../webapi/seeCookie}}
   * Appium: support only web testing
   */
  seeCookie(name) {
    if (this.options.desiredCapabilities.browserName) {
      return this.browser.getCookie(name).then(function(res) {
        return truth('cookie ' + name, 'to be set').assert(res);
      });
    } else {
      throw new Error(`seeCookie method can't be used in apps. it hasn't Cookie storage`);
    }
  }

  /**
   * {{> ../webapi/dontSeeCookie}}
   * Appium: support only web testing
   */
  dontSeeCookie(name) {
    if (this.options.desiredCapabilities.browserName) {
      return this.browser.getCookie(name).then(function(res) {
        return truth('cookie ' + name, 'to be set').negate(res);
      });
    } else {
      throw new Error(`dontSeeCookie method can't be used in apps. it hasn't Cookie storage`);
    }
  }

  /**
   * {{> ../webapi/grabCookie}}
   * Appium: support only web testing
   */
  grabCookie(name) {
    if (this.options.desiredCapabilities.browserName) {
      return this.browser.getCookie(name);
    } else {
      throw new Error(`grabCookie method can't be used in apps. it hasn't Cookie storage`);
    }
  }

  /**
   * Accepts the active JavaScript native popup window, as created by window.alert|window.confirm|window.prompt.
   * Don't confuse popups with modal windows, as created by [various libraries](http://jster.net/category/windows-modals-popups).
   * Appium: support only web testing
   */
  acceptPopup() {
    if (this.options.desiredCapabilities.browserName) {
      return this.browser.alertText().then(function(res) {
        if (res !== null) {
          return this.alertAccept();
        }
      });
    } else {
      throw new Error(`acceptPopup method can't be used in apps. There is no JavaScript native popup in apps`);
    }
  }

  /**
   * Dismisses the active JavaScript popup, as created by window.alert|window.confirm|window.prompt.
   * Appium: support only web testing
   */
  cancelPopup() {
    if (this.options.desiredCapabilities.browserName) {
      return this.browser.alertText().then(function(res) {
        if (res !== null) {
          return this.alertDismiss();
        }
      });
    } else {
      throw new Error(`cancelPopup method can't be used in apps. There is no JavaScript native popup in apps`);
    }
  }

  /**
   * Checks that the active JavaScript popup, as created by `window.alert|window.confirm|window.prompt`, contains the given string.
   * Appium: support only web testing
   */
  seeInPopup(text) {
    if (this.options.desiredCapabilities.browserName) {
      return this.browser.alertText().then(function(res) {
        if (res === null) {
          throw new Error('Popup is not opened');
        }
        stringIncludes('text in popup').assert(text, res);
      });
    } else {
      throw new Error(`seeInPopup method can't be used in apps. There is no JavaScript native popup in apps`);
    }
  }

  /**
   * {{> ../webapi/pressKey }}
   *
   * To make combinations with modifier and mouse clicks (like Ctrl+Click) press a modifier, click, then release it.
   * Appium: support, but clear field before pressing in apps
   *
   * ```js
   * I.pressKey('Control');
   * I.click('#someelement');
   * I.pressKey('Control');
   * ```
   */
  pressKey(key) {
    let modifier;
    if (Array.isArray(key) && ~['Control', 'Command', 'Shift', 'Alt'].indexOf(key[0])) {
      modifier = key[0];
    }
    return this.browser.keys(key).then(function() {
      if (!modifier) return true;
      return this.keys(modifier); // release modifeier
    });
  }

  /**
   * {{> ../webapi/resizeWindow }}
   * Appium: not tested in web, in apps doesn't work
   */
  resizeWindow(width, height) {
    if (this.options.desiredCapabilities.browserName) {
      if (width === 'maximize') {
        return this.browser.windowHandleMaximize(false);
      }
      return this.browser.windowHandleSize({
        width,
        height
      });
    } else {
      throw new Error(`resizeWindow method can't be used in apps. You can't resize app on mobile`);
    }
  }

  /**
   * Drag an item to a destination element.
   * Appium: not tested
   *
   * ```js
   * I.dragAndDrop('#dragHandle', '#container');
   * ```
   */
  dragAndDrop(srcElement, destElement) {
    return this.browser.dragAndDrop(
      withStrictLocator(srcElement),
      withStrictLocator(destElement)
    );
  }

  /**
   * {{> ../webapi/wait }}
   * Appium: support
   */
  wait(sec) {
    return this.browser.pause(sec * 1000);
  }

  /**
   * {{> ../webapi/waitForEnabled }}
   * Appium: support
   */
  waitForEnabled(locator, sec) {
    sec = sec || this.options.waitForTimeout;
    return this.browser.waitForEnabled(withStrictLocator(locator, this.options.desiredCapabilities.browserName), sec * 1000);
  }

  /**
   * {{> ../webapi/waitForElement }}
   * Appium: support
   */
  waitForElement(locator, sec) {
    sec = sec || this.options.waitForTimeout;
    return this.browser.waitForExist(withStrictLocator(locator, this.options.desiredCapabilities.browserName), sec * 1000);
  }

  /**
   * {{> ../webapi/waitForText }}
   * Appium: support
   */
  waitForText(text, sec, context) {
    sec = sec || this.options.waitForTimeout;
    context = context || 'body';
    return this.browser.waitUntil(function() {
        return this.getText(withStrictLocator(context)).then(function(source) {
          if (Array.isArray(source)) {
            return source.filter(part => part.indexOf(text) >= 0).length > 0;
          }
          return source.indexOf(text) >= 0;
        });
      }, sec * 1000)
      .catch((e) => {
        if (e.type === 'WaitUntilTimeoutError') {
          return proceedSee.call(this, 'assert', text, withStrictLocator(context));
        } else {
          throw e;
        }
      });
  }

  /**
   * {{> ../webapi/waitForVisible }}
   * Appium: support
   */
  waitForVisible(locator, sec) {
    sec = sec || this.options.waitForTimeout;
    return this.browser.waitForVisible(withStrictLocator(locator, this.options.desiredCapabilities.browserName), sec * 1000);
  }

  /**
   * {{> ../webapi/waitForInvisible }}
   * Appium: support
   */
  waitForInvisible(locator, sec) {
    sec = sec || this.options.waitForTimeout;
    return this.browser.waitForVisible(withStrictLocator(locator, this.options.desiredCapabilities.browserName), sec * 1000, true);
  }

  /**
   * Waits for an element to become invisible on a page (by default waits for 1sec).
   * Element can be located by CSS or XPath.
   * Appium: support
   */
  waitToHide(locator, sec) {
    return this.waitForInvisible(locator, sec);
  }

  /**
   * {{> ../webapi/waitForStalenessOf }}
   * Appium: support
   */
  waitForStalenessOf(locator, sec) {
    sec = sec || this.options.waitForTimeout;
    return this.browser.waitForExist(withStrictLocator(locator, this.options.desiredCapabilities.browserName), sec * 1000, true);
  }

  /**
   * Waits for a function to return true (waits for 1sec by default).
   * Appium: support
   */
  waitUntil(fn, sec) {
    sec = sec || this.options.waitForTimeout;
    return this.browser.waitUntil(fn, sec);
  }

  /**
   * Switches frame or in case of null locator reverts to parent.
   * Appium: support only web testing
   */
  switchTo(locator) {
    if (this.options.desiredCapabilities.browserName) {
      locator = locator || null;
      return this.browser.frame(locator);
    } else {
      throw new Error(`resizeWindow method can't be used in apps. You can't resize app on mobile`);
    }
  }


  /**
   * Appium Special Methods for Mobile only
   */

  /**
   * Send the currently active app to the background and return it back.
   * Appium: support only Android
   */
  sendAppToBackground(seconds) {
    if (this.options.desiredCapabilities.platformName == "Android") {
      seconds = seconds || this.options.waitForTimeout;
      return this.browser.background(seconds);
    } else
      throw new Error(`sendAppToBackground method can be used only with Android apps`);
  }

  /**
   * Close the given application.
   * Appium: support only iOS
   */
  closeApp() {
    if (this.options.desiredCapabilities.platformName == "iOS") {
      return this.browser.closeApp();
    } else
      throw new Error(`closeApp method can be used only with iOS apps`);
  }

  /**
   * Retrieve current context
   * Appium: support Android and iOS
   */
  getContext() {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.context();
    } else
      throw new Error(`getContext method can be used only with apps`);
  }

  /**
   * Switch to the specified context
   * Appium: support Android and iOS
   */
  switchToContext(id) {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.context(id);
    } else
      throw new Error(`switchToContext method can be used only with apps`);
  }

  /**
   * Get list of all available contexts
   * Appium: support Android and iOS
   */
  getAllContexts() {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.contexts();
    } else
      throw new Error(`getAllContexts method can be used only with apps`);
  }

  /**
   * Receive the current activity on an Android device.
   * Appium: support only Android
   */
  getCurrentActivity() {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.currentActivity();
    } else
      throw new Error(`getCurrentActivity method can be used only with Android apps`);
  }

  /**
   * send a key event to the device
   * Appium: support only Android
   */
  sendDeviceKeyEvent(keyValue) {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.deviceKeyEvent(keyValue);
    } else
      throw new Error(`sendDeviceKeyEvent method can be used only with Android apps`);
  }

  /**
   * Get all defined Strings from an app for the default language.
   * Appium: support only Android
   */
  getAppStrings(language) {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.getAppStrings(language);
    } else
      throw new Error(`getAppStrings method can be used only with Android apps`);
  }

  /**
   * Get current device activity.
   * Appium: support only Android
   */
  getCurrentDeviceActivity() {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.getCurrentDeviceActivity();
    } else
      throw new Error(`getCurrentDeviceActivity method can be used only with Android apps`);
  }

  /**
   * Captures iOS device date and time (command works only for real devices).
   * Appium: support only iOS
   */
  getDeviceTime() {
    if (this.options.desiredCapabilities.platformName == "iOS") {
      return this.browser.getDeviceTime();
    } else
      throw new Error(`getDeviceTime method can be used only with iOS apps`);
  }

  /**
   * Get the current geolocation.
   * Appium: support ???
   */
  getGeoLocation() {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.getGeoLocation();
    } else
      throw new Error(`getGeoLocation method can be used only with apps`);
  }

  /**
   * Get informations about the current network connection (Data/WIFI/Airplane).
   * The actual server value will be a number (see getNetworkConnection.js example).
   * However WebdriverIO additional properties to the response object to allow easier
   * assertions (see getNetworkConnectionEasier.js example).
   * Appium: support only Android
   */
  getNetworkConnection() {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.getNetworkConnection();
    } else
      throw new Error(`getNetworkConnection method can be used only with Android apps`);
  }

  /**
   * Get the current browser orientation.
   * Appium: support Android and iOS
   */
  getOrientation() {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.getOrientation();
    } else
      throw new Error(`getOrientation method can be used only with apps`);
  }

  /**
   * Hide the keyboard. (taps outside to hide keyboard per default)
   * Appium: support Android and iOS
   */
  hideDeviceKeyboard(strategy, key) {
    if (this.options.desiredCapabilities.platformName) {
      strategy = strategy || 'tapOutside'
      return this.browser.hideDeviceKeyboard(strategy, key);
    } else
      throw new Error(`hideDeviceKeyboard method can be used only with apps`);
  }

  /**
   * Long press on an element using finger motion events.
   * Appium: support ??
   */
  hold(locator) {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.hold(withStrictLocator(locator, this.options.desiredCapabilities.browserName));
    } else
      throw new Error(`hold method can be used only with apps`);
  }

  /**
   * Long press on an element using finger motion events.
   * Appium: support only Android
   */
  installApp(path) {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.installApp(path);
    } else
      throw new Error(`installApp method can be used only with Android apps`);
  }

  /**
   * Check if an app is installed.
   * Appium: support only Android
   */
  checkAppInstallation(bundleId) {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.isAppInstalled(bundleId);
    } else
      throw new Error(`checkAppInstallation method can be used only with Android apps`);
  }

  /**
   * Check if an app is installed.
   * Appium: support only Android
   */
  checkDeviceLock() {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.isLocked();
    } else
      throw new Error(`checkDeviceLock method can be used only with Android apps`);
  }

  /**
   * Lock the device.
   * Appium: support only Android
   */
  lockDevice(seconds) {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.lock(seconds);
    } else
      throw new Error(`lockDevice method can be used only with Android apps`);
  }

  /**
   * Press a particular key code on the device.
   * Appium: support only Android
   */
  longPressKeycode(keycode, metastate) {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.longPressKeycode(keycode, metastate);
    } else
      throw new Error(`longPressKeycode method can be used only with Android apps`);
  }

  /**
   * Open the notifications pane on the device.
   * Appium: support only Android
   */
  openNotifications() {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.openNotifications();
    } else
      throw new Error(`openNotifications method can be used only with Android apps`);
  }

  /**
   * Protocol bindings for all mobile orientation operations.
   * Appium: support only Android
   */
  getDeviceOrientation() {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.orientation();
    } else
      throw new Error(`getDeviceOrientation method can be used only with apps`);
  }

  /**
   * Protocol bindings for all mobile orientation operations.
   * Appium: support Android and iOS
   */
  setDeviceOrientation(deviceOrientation) {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.setOrientation(deviceOrientation);
    } else
      throw new Error(`setDeviceOrientation method can be used only with apps`);
  }

  /**
   * Protocol bindings for all mobile orientation operations.
   * Appium: support Android and iOS
   */
  performMultiTouchAction(touchAttr) {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.performMultiAction(touchAttr);
    } else
      throw new Error(`performMultiTouchAction method can be used only with apps`);
  }

  /**
   * Perform touch action
   * Appium: support Android and iOS
   */
  performTouchAction(touchAttr) {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.performMultiAction(touchAttr);
    } else
      throw new Error(`performTouchAction method can be used only with apps`);
  }

  /**
   * Press a particular key code on the device.
   * Appium: support only Android
   */
  pressKeycode(keycode, metastate) {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.pressKeycode(keycode, metastate);
    } else
      throw new Error(`pressKeycode method can be used only with Android apps`);
  }

  /**
   * Pulls a file from the device.
   * Appium: support Android and iOS
   */
  pullFile(path) {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.pullFile(path);
    } else
      throw new Error(`pullFile method can be used only with apps`);
  }

  /**
   * Pulls a folder from the device’s file system.
   * Appium: support Android and iOS
   */
  pullFolder(path) {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.pullFolder(path);
    } else
      throw new Error(`pullFolder method can be used only with apps`);
  }

  /**
   * Release touch sequence on specific element.
   * Appium: support Android and iOS
   */
  release(locator) {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.release(withStrictLocator(locator, this.options.desiredCapabilities.browserName));
    } else
      throw new Error(`release method can be used only with apps`);
  }

  /**
   * Remove an app from the device.
   * Appium: support only Android
   */
  removeApp(bundleId) {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.removeApp(bundleId);
    } else
      throw new Error(`removeApp method can be used only with Android apps`);
  }

  /**
   * Reset the device by clearing the device un- and reinstalling app package (if existing).
   * Appium: support only Android
   */
  resetDevice(bundleId) {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.reset();
    } else
      throw new Error(`resetDevice method can be used only with Android apps`);
  }

  /**
   * Perform a rotation gesture centered on the specified element.
   * Appium: support only iOS
   */
  rotate(x, y, duration, radius, rotation, touchCount) {
    if (this.options.desiredCapabilities.platformName == "iOS") {
      return this.browser.rotate(x, y, duration, radius, rotation, touchCount);
    } else
      throw new Error(`rotate method can be used only with iOS apps`);
  }

  /**
   * Set the current geo location.
   * Appium: support ??
   */
  setGeoLocation(location) {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.setGeoLocation(location);
    } else
      throw new Error(`setGeoLocation method can be used only with apps`);
  }

  /**
   * Set immediate value in app.
   * Appium: support only iOS
   */
  setImmediateValue(id, value) {
    if (this.options.desiredCapabilities.platformName = "iOS") {
      return this.browser.setImmediateValue(id, value);
    } else
      throw new Error(`setImmediateValue method can be used only with iOS apps`);
  }

  /**
   * Set network connection.
   * Appium: support only Android
   */
  setNetworkConnection(value) {
    if (this.options.desiredCapabilities.platformName = "Android") {
      return this.browser.setImmediateValue(value);
    } else
      throw new Error(`setNetworkConnection method can be used only with Android apps`);
  }

  /**
   * Either retrieve a JSON hash of all the currently specified settings or update the current setting on the device.
   * Appium: support ??
   */
  getSettings() {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.settings();
    } else
      throw new Error(`getSettings method can be used only with apps`);
  }

  /**
   * Either retrieve a JSON hash of all the currently specified settings or update the current setting on the device.
   * Appium: support ??
   */
  setSettings(settings) {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.settings(settings);
    } else
      throw new Error(`setSettings method can be used only with apps`);
  }

  /**
   * Perform a shake action on the device.
   * Appium: support only iOS
   */
  makeShake() {
    if (this.options.desiredCapabilities.platformName == "iOS") {
      return this.browser.shake();
    } else
      throw new Error(`makeShake method can be used only with iOS apps`);
  }

  /**
   * Start an arbitrary Android activity during a session.
   * Appium: support only Android
   */
  startActivity(appPackage, appActivity) {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.startActivity(appPackage, appActivity);
    } else
      throw new Error(`startActivity method can be used only with Android apps`);
  }

  /**
   * Returns application strings of the application in a specific language.
   * Appium: support only Android is it the same with getAppStrings?
   */
  getAllStrings(language) {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.strings(language);
    } else
      throw new Error(`getAllStrings method can be used only with Android apps`);
  }

  /**
   * Perform a swipe on the screen or an element.
   * If you want to swipe on a specific element make sure you provide a selector
   * argument. If not just pass xoffset and yoffset as command arguments.
   * Appium: support ??
   */
  swipe(locator, xoffset, yoffset, speed) {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.swipe(withStrictLocator(locator, this.options.desiredCapabilities.browserName), xoffset, yoffset, speed);
    } else
      throw new Error(`swipe method can be used only with apps`);
  }

  /**
   * Perform a swipe down on an element.
   * Appium: support ??
   */
  swipeDown(locator, speed) {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.swipeDown(withStrictLocator(locator, this.options.desiredCapabilities.browserName), speed);
    } else
      throw new Error(`swipeDown method can be used only with apps`);
  }

  /**
   * Perform a swipe left on an element.
   * Appium: support ??
   */
  swipeLeft(locator, speed) {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.swipeLeft(withStrictLocator(locator, this.options.desiredCapabilities.browserName), speed);
    } else
      throw new Error(`swipeLeft method can be used only with apps`);
  }

  /**
   * Perform a swipe right on an element.
   * Appium: support ??
   */
  swipeRight(locator, speed) {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.swipeRight(withStrictLocator(locator, this.options.desiredCapabilities.browserName), speed);
    } else
      throw new Error(`swipeRight method can be used only with apps`);
  }

  /**
   * Perform a swipe up on an element.
   * Appium: support ??
   */
  swipeUp(locator, speed) {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.swipeUp(withStrictLocator(locator, this.options.desiredCapabilities.browserName), speed);
    } else
      throw new Error(`swipeUp method can be used only with apps`);
  }

  /**
   * Perform a swipe up on an element.
   * Appium: support only Android
   */
  toggleAirplaneMode() {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.toggleAirplaneMode();
    } else
      throw new Error(`toggleAirplaneMode method can be used only with Android apps`);
  }

  /**
   * Switch the state (enabled/disabled) of data service.
   * Appium: support only Android
   */
  toggleData() {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.toggleData();
    } else
      throw new Error(`toggleData method can be used only with Android apps`);
  }

  /**
   * Switch the state (enabled/disabled) of the location service.
   * Appium: support only Android
   */
  toggleLocationServices() {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.toggleLocationServices();
    } else
      throw new Error(`toggleLocationServices method can be used only with Android apps`);
  }

  /**
   * Switch the state (enabled/disabled) of the wifi service.
   * Appium: support only Android
   */
  toggleWiFi() {
    if (this.options.desiredCapabilities.platformName == "Android") {
      return this.browser.toggleWiFi();
    } else
      throw new Error(`toggleWiFi method can be used only with Android apps`);
  }

  /**
   * Put finger on an element (only in mobile context).
   * Appium: support ??
   */
  touch(locator, longClick) {
    if (this.options.desiredCapabilities.platformName) {
      longClick = longClick || false;
      return this.browser.touch(withStrictLocator(locator, this.options.desiredCapabilities.browserName), longClick);
    } else
      throw new Error(`touch method can be used only with apps`);
  }

  /**
   * The Touch Action API provides the basis of all gestures that can be
   * automated in Appium. At its core is the ability to chain together ad hoc
   * individual actions, which will then be applied to an element in the
   * application on the device.
   * Appium: support Android and iOS
   */
  makeTouchAction(locator, action) {
    if (this.options.desiredCapabilities.platformName) {
      longClick = longClick || false;
      return this.browser.touchAction(withStrictLocator(locator, this.options.desiredCapabilities.browserName), action);
    } else
      throw new Error(`makeTouchAction method can be used only with apps`);
  }

  /**
   * Simulate Touch ID with either valid (match == true) or invalid (match == false) fingerprint.
   * Appium: support only iOS
   */
  simulateTouchId(match) {
    if (this.options.desiredCapabilities.platformName) {
      match = match || true;
      return this.browser.touch(match);
    } else
      throw new Error(`simulateTouchId method can be used only with iOS apps`);
  }

  /**
   * Performs multiple touch actions. The action object is an array and its
   * objects have to contain the action name
   * Appium: support Android and iOS
   */
  touchMultiPerform(actions) {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.touchMultiPerform(actions);
    } else
      throw new Error(`touchMultiPerform method can be used only with apps`);
  }

  /**
   * Performs a specific touch action. The action object need to contain the action name
   * Appium: support Android and iOS
   */
  touchPerform(actions) {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.touchPerform(actions);
    } else
      throw new Error(`touchPerform method can be used only with apps`);
  }

  /**
   * Unlock the device.
   * Appium: support only Android
   */
  unlockDevice() {
    if (this.options.desiredCapabilities.platformName) {
      return this.browser.unlock();
    } else
      throw new Error(`unlockDevice method can be used only with Android apps`);
  }

  /*
   * End Appium Methods
   */

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
  return this.browser.getText(withStrictLocator(context)).then(function(source) {
    return stringIncludes(description)[assertType](text, source);
  });
}

function findClickable(client, locator, browserCap) {
  if (typeof(locator) === 'object') return client.elements(withStrictLocator(locator, browserCap));
  if (isCSSorXPathLocator(locator, browserCap)) return client.elements(locator);

  let literal = xpathLocator.literal(locator);

  let narrowLocator = xpathLocator.combine([
    `.//a[normalize-space(.)=${literal}]`,
    `.//button[normalize-space(.)=${literal}]`,
    `.//a/img[normalize-space(@alt)=${literal}]/ancestor::a`,
    `.//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][normalize-space(@value)=${literal}]`
  ]);
  return client.elements(narrowLocator).then(function(els) {
    if (els.value.length) {
      return els;
    }
    let wideLocator = xpathLocator.combine([
      `.//a[./@href][((contains(normalize-space(string(.)), ${literal})) or .//img[contains(./@alt, ${literal})])]`,
      `.//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][contains(./@value, ${literal})]`,
      `.//input[./@type = 'image'][contains(./@alt, ${literal})]`,
      `.//button[contains(normalize-space(string(.)), ${literal})]`,
      `.//input[./@type = 'submit' or ./@type = 'image' or ./@type = 'button'][./@name = ${literal}]`,
      `.//button[./@name = ${literal}]`
    ]);
    return client.elements(wideLocator).then(function(els) {
      if (els.value.length) {
        return els;
      }
      return client.elements(locator); // by css or xpath
    });
  });
}

function findFields(client, locator) {
  if (typeof(locator) === 'object') return client.elements(withStrictLocator(locator, this.options.desiredCapabilities.browserName));
  if (isCSSorXPathLocator(locator, this.options.desiredCapabilities.browserName)) return client.elements(locator);

  let literal = xpathLocator.literal(locator);
  let byText = xpathLocator.combine([
    `.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')][(((./@name = ${literal}) or ./@id = //label[contains(normalize-space(string(.)), ${literal})]/@for) or ./@placeholder = ${literal})]`,
    `.//label[contains(normalize-space(string(.)), ${literal})]//.//*[self::input | self::textarea | self::select][not(./@type = 'submit' or ./@type = 'image' or ./@type = 'hidden')]`
  ]);
  return client.elements(byText).then((els) => {
    if (els.value.length) return els;
    let byName = `.//*[self::input | self::textarea | self::select][@name = ${literal}]`;
    return client.elements(byName).then((els) => {
      if (els.value.length) return els;
      return client.elements(locator); // by css or xpath
    });
  });
}

function proceedSeeField(assertType, field, value) {
  return findFields(this.browser, field).then(function(res) {
    if (!res.value || res.value.length === 0) {
      throw new Error(`Field ${field} not found by name|text|CSS|XPath`);
    }

    var proceedMultiple = (fields) => {
      let commands = [];
      fields.forEach((el) => commands.push(this.elementIdSelected(el.ELEMENT)));
      this.unify(commands).then((res) => {
        commands = [];
        fields.forEach((el) => {
          if (el.value === false) return;
          commands.push(this.elementIdAttribute(el.ELEMENT, 'value'));
        });
        this.unify(commands, {
          extractValue: true
        }).then((val) => {
          return stringIncludes('fields by ' + field)[assertType](value, val);
        });
      });
    }

    var proceedSingle = (el) => {
      return this.elementIdAttribute(el.ELEMENT, 'value').then((res) => {
        return stringIncludes('fields by ' + field)[assertType](value, res.value);
      });
    }

    return this.elementIdName(res.value[0].ELEMENT).then((tag) => {
      if (tag.value == 'select') {
        return proceedMultiple(res.value);
      }

      if (tag.value == 'input') {
        return this.elementIdAttribute(res.value[0].ELEMENT, 'type').then((type) => {
          if (type.value == 'checkbox' || type.value == 'radio') {
            return proceedMultiple(res.value);
          }
          return proceedSingle(res.value[0]);
        });
      }
      return proceedSingle(res.value[0]);
    });
  });
}

function proceedSeeCheckbox(assertType, field) {
  return findFields(this.browser, field).then(function(res) {
    if (!res.value || res.value.length === 0) {
      throw new Error(`Field ${field} not found by name|text|CSS|XPath`);
    }
    let commands = [];
    res.value.forEach((el) => commands.push(this.elementIdSelected(el.ELEMENT)));
    return this.unify(commands, {
      extractValue: true
    }).then((selected) => {
      return truth(`checkable field ${field}`, 'to be checked')[assertType](selected);
    });
  });
}

function findCheckable(client, locator, browserCap) {
  if (typeof(locator) === 'object') return client.elements(withStrictLocator(locator, browserCap));
  if (isCSSorXPathLocator(locator, browserCap)) return client.elements(locator);

  let literal = xpathLocator.literal(locator);
  let byText = xpathLocator.combine([
    `.//input[@type = 'checkbox' or @type = 'radio'][(@id = //label[contains(normalize-space(string(.)), ${literal})]/@for) or @placeholder = ${literal}]`,
    `.//label[contains(normalize-space(string(.)), ${literal})]//input[@type = 'radio' or @type = 'checkbox']`
  ]);
  return client.elements(byText).then(function(els) {
    if (els.value.length) return els;
    let byName = `.//input[@type = 'checkbox' or @type = 'radio'][@name = ${literal}]`;
    return client.elements(byName).then(function(els) {
      if (els.value.length) return els;
      return client.elements(locator); // by css or xpath
    });
  });
}

function isCSSorXPathLocator(locator, browserCap) {
  if (locator[0] === '#' || locator[0] === '.') {
    if (this.options.desiredCapabilities.browserName)
      return true;
    //TODO: add accessibility id, -android uiauto support
    else throw new Error(`Unable to use css locators in apps. Locator strategies for this request: xpath, id, class name`);
  }
  if (locator.substr(0, 2) === '//') {
    return true;
  }
  return false;
}

function withStrictLocator(locator, browserCap) {
  if (!locator) return null;
  if (typeof(locator) !== 'object') return locator;
  let key = Object.keys(locator)[0];
  let value = locator[key];

  locator.toString = () => `{${key}: '${value}'}`;

  switch (key) {
    case 'by':
    case 'xpath':
      return value;
    case 'css':
      if (browserCap)
        return value;
      else throw new Error(`Unable to use css locators in apps. Locator strategies for this request: xpath, id, class name`);
    case 'id':
      return '#' + value;
    case 'name':
      return `[name="${value}"]`;
  }
}

module.exports = WebDriverIO;
