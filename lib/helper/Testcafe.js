const fs = require('fs');
const assert = require('assert');
const path = require('path');
const createTestCafe = require('testcafe');
const { Selector } = require('testcafe');


const testControllerHolder = require('./testcafe/testControllerHolder');

const Helper = require('../helper');

const TESTFILE = path.join(__dirname, 'test.js');

function createTestFile() {
  fs.writeFileSync(TESTFILE,
    'import testControllerHolder from "./testcafe/testControllerHolder.js";\n\n' +
    'fixture("fixture")\n' +
    'test\n' +
    '("test", testControllerHolder.capture)',
  );
}

const mapError = (testcafeError) => {
  throw new Error(testcafeError.errMsg);
}

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
      show: false,
      browser: 'chrome',
      waitForTimeout: 10000,
      fullPageScreenshots: false,
      disableScreenshots: false,
    }, config);
  }

  _init() {}

  async _startBrowser() {}

  async _stopBrowser() {}

  _beforeSuite() {
    return this._startBrowser();
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
      .browsers(this.options.show ? this.options.browser : `${this.options.browser}:headless`)
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

  async amOnPage(url) {
    return this.t.navigateTo(url)
      .catch(mapError);
  }

  async click(locator, context = null) {
    return this.t.click(locator)
      .catch(mapError);
  }

  async see(text, context = null) {
    let sel;
    if (context) {
      sel = Selector(context)
        .withText(text)
        .with({ boundTestRun: this.t });
    } else {
      sel = Selector('body').withText(text).with({ boundTestRun: this.t });
    }
    return this.t.expect(sel).ok(`Expected to see ${text}`)
      .catch(mapError);
  }

  async seeElement(locator) {
    const exists =
      Selector(locator)
        .with({ boundTestRun: this.t })
        .exists;
    return this.t
      .expect(exists).ok()
      .catch(mapError);
  }

  async refreshPage() {
    return this.t.eval(() => location.reload(true), { boundTestRun: this.t });
  }

  async waitForVisible(locator, sec) {
    const timeout = sec ? sec * 1000 : undefined;
    return Selector(locator)
      .with({ visibilityCheck: true, timeout })
      .with({ boundTestRun: this.t })();
  }

  async fillField(field, value) {
    const sel = Selector(field).with({ boundTestRun: this.t });
    return this.t
      .typeText(sel, value, { replace: true })
      .catch(mapError);
  }

  async pressKey(key) {
    assert(key, 'Expected a sequence of keys or key combinations');

    return this.t
      .pressKey(key.toLowerCase()) // testcafe keys are lowercase
      .catch(mapError);
  }

  async seeNumberOfVisibleElements(locator, num) {
    const count = Selector(locator).filterVisible().with({ boundTestRun: this.t }).count;
    return this.t
      .expect(count).eql(num)
      .catch(mapError);
  }

  /**
   * {{> seeInField }}
   */
  async seeInField(field, value) {
    const expectedValue = Selector(field).with({ boundTestRun: this.t }).value;
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
    const expectedText = Selector(context).with({ boundTestRun: this.t }).textContent;
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
}

module.exports = Testcafe;
