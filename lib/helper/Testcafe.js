const fs = require('fs');
const assert = require('assert');
const path = require('path');
const requireg = require('requireg');
const createTestCafe = require('testcafe');
const { Selector, ClientFunction } = require('testcafe');

const testControllerHolder = require('./testcafe/testControllerHolder');

const stringIncludes = require('../assert/include').includes;
const { urlEquals } = require('../assert/equal');
const Helper = require('../helper');
const Locator = require('../locator');

/**
 * Client Functions
 */
const getPageUrl = t => ClientFunction(() => document.location.href).with({ boundTestRun: t });

// TODO Generate unique test files (concurrent test runs)
const TESTFILE = path.join(__dirname, '_test.js');
function createTestFile() {
  fs.writeFileSync(
    TESTFILE,
    'import testControllerHolder from "./testcafe/testControllerHolder.js";\n\n' +
    'fixture("fixture")\n' +
    'test\n' +
    '("test", testControllerHolder.capture)',
  );
}

// TODO Better error mapping (actual, expected)
const mapError = (testcafeError) => {
  console.log('TODO map error better', JSON.stringify(testcafeError, null, 2));
  throw new Error(testcafeError.errMsg);
};

const elementByXPath = Selector((xpath) => {
  const iterator = document.evaluate(xpath, document, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null)
  const items = [];

  let item = iterator.iterateNext();

  while (item) {
    items.push(item);
    item = iterator.iterateNext();
  }

  return items;
});

const toSelector = (t, locator) => {
  if (!locator) throw new Error('locator is required');
  if (locator.react) throw new Error('react selectors are currently not supported');

  locator = new Locator(locator, 'css');
  if (!locator.isXPath()) return Selector(locator.simplify()).with({ boundTestRun: t });

  return Selector(elementByXPath(locator.value)).with({ boundTestRun: t });
};

/**
 * Uses Testcafe to run tests.
 */
class Testcafe extends Helper {
  constructor(config) {
    super(config);

    this.iteration = 1;
    this.testcafe = undefined; // testcafe instance
    this.t = undefined; // testcafe test controller

    this.options = Object.assign({
      url: 'http://localhost',
      show: false,
      browser: 'chrome',
      waitForTimeout: 10000,
      fullPageScreenshots: false,
      disableScreenshots: false,
    }, config);
  }

  // TOOD Do a requirements check
  static _checkRequirements() {
    try {
      requireg('testcafe');
    } catch (e) {
      return ['testcafe@^1.1.0'];
    }
  }

  _init() {}

  _beforeSuite() {
  }


  async _before() {
    createTestFile(); // create a dummy test file to get hold of the test controller

    this.iteration += 2;
    this.testcafe = await createTestCafe('localhost', 1338 + this.iteration, 1339 + this.iteration);

    const runner = this.testcafe.createRunner();

    this.debugSection('_before', 'Starting testcafe...');

    runner
      .src(TESTFILE)
      .screenshots(global.output_dir, true)
      // .video(global.output_dir)
      .browsers(this.options.show ? this.options.browser : `${this.options.browser}:headless`)
      .reporter('minimal')
      .run({
        skipJsErrors: true,
        skipUncaughtErrors: true,
        quarantineMode: true,
        selectorTimeout: this.options.waitForTimeout,
      })
      .catch((err) => {
        this.debugSection('_before', `Error ${err.toString()}`);
        this.testcafe.close();
      });

    this.t = await testControllerHolder.get();
  }

  async _after() {
    this.debugSection('_after', 'Closing testcafe...');

    testControllerHolder.free();
    if (this.testcafe) {
      this.testcafe.close();
    }

    fs.unlinkSync(TESTFILE); // remove the dummy test
    this.t = undefined;
  }

  _afterSuite() {
  }

  /**
   * {{> amOnPage }}
   */
  async amOnPage(url) {
    if (!(/^\w+\:\/\//.test(url))) {
      url = this.options.url + url;
    }

    return this.t.navigateTo(url)
      .catch(mapError);
  }


  /**
   * {{> resizeWindow }}
   *
   * Unlike other drivers Puppeteer changes the size of a viewport, not the window!
   * Puppeteer does not control the window of a browser so it can't adjust its real size.
   * It also can't maximize a window.
   */
  async resizeWindow(width, height) {
    if (width === 'maximize') {
      return this.t.maximizeWindow().catch(mapError);
    }

    return this.t.resizeWindow(width, height).catch(mapError);
  }

  /**
   * {{> click }}
   *
   * {{ react }}
   */
  async click(locator, context = null) {
    if (context) {
      const sel = toSelector(this.t, context).withExactText(locator);
      return this.t.click(sel).catch(mapError);
    }
    // TODO use context
    return this.t.click(toSelector(this.t, locator))
      .catch(mapError);
  }


  /**
   * {{> refreshPage }}
   */
  async refreshPage() {
    return this.t.eval(() => location.reload(true), { boundTestRun: this.t }).catch(mapError);
  }

  /**
   * {{> waitForVisible }}
   *
   * This method accepts [React selectors](https://codecept.io/react).
   */
  async waitForVisible(locator, sec) {
    const timeout = sec ? sec * 1000 : undefined;

    return toSelector(this.t, locator)
      .with({ visibilityCheck: true, timeout })()
      .catch(mapError);
  }

  /**
   * {{> fillField }}
   * {{ react }}
   */
  async fillField(field, value) {
    return this.t
      .typeText(toSelector(this.t, field), value, { replace: true })
      .catch(mapError);
  }

  /**
   * {{> pressKey }}
   *
   * {{ keys }}
   */
  async pressKey(key) {
    assert(key, 'Expected a sequence of keys or key combinations');

    return this.t
      .pressKey(key.toLowerCase()) // testcafe keys are lowercase
      .catch(mapError);
  }

  /**
   * {{> hover }}
   *
   * {{ locator }}
   */
  async hover(locator) {
    return this.t.hover(toSelector(this.t, locator)).catch(mapError);
  }

  /**
   * {{> doubleClick }}
   *
   * {{ react }}
   */
  async doubleClick(locator, context = null) {
    return this.t.doubleClick(toSelector(this.t, locator)).catch(mapError);
  }


  /**
   * {{> seeInCurrentUrl }}
   */
  async seeInCurrentUrl(url) {
    stringIncludes('url').assert(url, await getPageUrl(this.t)().catch(mapError));
  }

  /**
    * {{> dontSeeInCurrentUrl }}
    */
  async dontSeeInCurrentUrl(url) {
    stringIncludes('url').negate(url, await getPageUrl(this.t)().catch(mapError));
  }

  /**
    * {{> seeCurrentUrlEquals }}
    */
  async seeCurrentUrlEquals(url) {
    urlEquals(this.options.url).assert(url, await getPageUrl(this.t)().catch(mapError));
  }

  /**
    * {{> dontSeeCurrentUrlEquals }}
    */
  async dontSeeCurrentUrlEquals(url) {
    urlEquals(this.options.url).negate(url, await getPageUrl(this.t)().catch(mapError));
  }

  /**
   * {{> see }}
   *
   * {{ react }}
   */
  async see(text, context = null) {
    let sel;
    if (context) {
      sel = toSelector(this.t, context)
        .withText(text)
        .with({ boundTestRun: this.t });
    } else {
      sel = Selector(elementByXPath(`//*[contains(text(),'${text}')]`))
        .with({ boundTestRun: this.t });
    }
    return this.t.expect(sel).ok(`Expected to see ${text}`)
      .catch(mapError);
  }

  /**
   * {{> seeElement }}
   * {{ react }}
   */
  async seeElement(locator) {
    const exists = toSelector(this.t, locator).exists;
    return this.t
      .expect(exists).ok()
      .catch(mapError);
  }

  /**
   * {{> seeNumberOfVisibleElements }}
   *
   * {{ react }}
   */
  async seeNumberOfVisibleElements(locator, num) {
    const count = toSelector(this.t, locator).filterVisible().count;
    return this.t
      .expect(count).eql(num)
      .catch(mapError);
  }

  /**
   * {{> seeInField }}
   */
  async seeInField(field, value) {
    const expectedValue = toSelector(this.t, field).value;
    return this.t
      .expect(expectedValue).eql(value)
      .catch(mapError);
  }

  /**
   * Checks that text is equal to provided one.
   *
   * ```js
   * I.seeTextEquals('text', 'h1');
   * ```
   */
  async seeTextEquals(text, context = null) {
    const expectedText = toSelector(this.t, context).textContent;
    return this.t
      .expect(expectedText).eql(text)
      .catch(mapError);
  }

  /**
   * {{> saveScreenshot }}
   */
  async saveScreenshot(fileName, fullPage) {
    // TODO Implement full page screenshots
    const fullPageOption = fullPage || this.options.fullPageScreenshots;

    const outputFile = path.join(global.output_dir, fileName);
    this.debug(`Screenshot is saving to ${outputFile}`);

    // TODO testcafe automatically creates thumbnail images (which cant be turned off)
    return this.t.takeScreenshot(fileName);
  }

  /**
   * {{> executeScript }}
   *
   * If a function returns a Promise It will wait for it resolution.
   */
  async executeScript(fn, ...rest) {
    // TODO parse parameters from fn and convert to dependencies object
    return ClientFunction(fn, { dependencies: { ...rest } }).with({ boundTestRun: this.t });
  }

  /**
   * {{> executeAsyncScript }}
   *
   * Asynchronous scripts can also be executed with `executeScript` if a function returns a Promise.
   */
  async executeAsyncScript(fn) {
    throw new Error('executeAsyncScript is not yet implemented');
  }

  /**
   * {{> grabTextFrom }}
   * {{ react }}
   */
  async grabTextFrom(locator) {
    const sel = toSelector(this.t, locator);

    return sel.innerText;
  }

  /**
   * {{> grabAttributeFrom }}
   * {{ react }}
   */
  async grabAttributeFrom(locator, attr) {
    const sel = toSelector(this.t, locator);

    return sel.getAttribute(attr);
  }

  /**
   * {{> grabSource }}
   */
  async grabSource() {
    return ClientFunction(() => document.documentElement.innerHTML).with({ boundTestRun: this.t });
  }

  /**
   * Get JS log from browser.
   *
   * ```js
   * let logs = await I.grabBrowserLogs();
   * console.log(JSON.stringify(logs))
   * ```
   */
  async grabBrowserLogs() {
    // TODO Must map?
    return this.t.getBrowserConsoleMessages();
  }

  /**
   * {{> switchTo }}
   */
  async switchTo(locator) {
    return this.t.switchToIframe(toSelector(this.t, locator));
  }

  // TODO Add url assertions

  /**
   * {{> setCookie }}
   */
  async setCookie(cookie) {
    if (Array.isArray(cookie)) {
      throw new Error('cookie array is not supported');
    }

    cookie.path = cookie.path || '/';
    cookie.expires = cookie.expires || (new Date).toUTCString();

    const setCookie = ClientFunction(() => {
      document.cookie = `${cookie.name}=${cookie.value};path=${cookie.path};expires=${cookie.expires};`;
    }, { dependencies: { cookie } }).with({ boundTestRun: this.t });

    return setCookie();
  }

  /**
   * {{> seeCookie }}
   *
   */
  // async seeCookie(name) {
  //   const cookies = await this.page.cookies();
  //   empty(`cookie ${name} to be set`).negate(cookies.filter(c => c.name === name));
  // }

  /**
   * {{> dontSeeCookie }}
   */
  // async dontSeeCookie(name) {
  //   const cookies = await this.page.cookies();
  //   empty(`cookie ${name} to be set`).assert(cookies.filter(c => c.name === name));
  // }

  /**
   * {{> grabCookie }}
   *
   * Returns cookie in JSON format. If name not passed returns all cookies for this domain.
   */
  async grabCookie(name) {
    const getCookie = ClientFunction(() => {
      const v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
      return v ? v[2] : null;
    }, { dependencies: { name } }).with({ boundTestRun: this.t });
    return getCookie();
  }

  /**
   * {{> clearCookie }}
   */
  async clearCookie(cookieName) {
    const clearCookies = ClientFunction(() => {
      const cookies = document.cookie.split(';');

      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        if (cookieName === undefined || name === cookieName) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
      }
    }, { dependencies: { cookieName } }).with({ boundTestRun: this.t });

    return clearCookies();
  }
}

module.exports = Testcafe;
