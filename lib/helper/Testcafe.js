const fs = require('fs');
const path = require('path');
const createTestCafe = require('testcafe');
const { Selector } = require('testcafe');
const testControllerHolder = require('./testcafe/testControllerHolder');

const TESTFILE = path.join(__dirname, 'test.js');
let testcafe = null;

function createTestFile() {
  fs.writeFileSync(TESTFILE,
    'import testControllerHolder from "./testcafe/testControllerHolder.js";\n\n' +
    'fixture("fixture")\n' +
    'test\n' +
    '("test", testControllerHolder.capture)',
  );
}

function runTest(iteration, browser = 'chrome') {
  return createTestCafe('localhost', 1338 + iteration, 1339 + iteration)
    .then((tc) => {
      testcafe = tc;
      const runner = tc.createRunner();
      return runner
        .src(TESTFILE)
        .screenshots('./screenshots/', true)
        .browsers(browser)
        .run()
        .catch((error) => {
          // TODO Fix this: If we get an error here tests hang
          console.error('error', error);
        });
    })
    .then((report) => {
      console.log('REPORt', report);
    });
}

/**
 * Uses Testcafe to run tests.
 */
class Testcafe extends Helper {
  constructor(config) {
    super(config);

    this.t = undefined; // testcafe test controller
  }

  _init() {
  }

  async _startBrowser() {
  }

  async _stopBrowser() {

  }

  _beforeSuite() {
    return this._startBrowser();
  }


  async _before() {
    createTestFile();
    runTest(1, 'chrome');

    this.t = await testControllerHolder.get();
  }

  async _after() {
    fs.unlinkSync(TESTFILE);
    testControllerHolder.free();

    testcafe.close();
    this.t = undefined;
  }

  _afterSuite() {
  }

  async amOnPage(url) {
    return this.t.navigateTo(url);
  }

  async click(locator, context = null) {
    return this.t.click(locator);
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
    return this.t.expect(sel).ok(`Expected to see ${text}`);
  }

  async seeElement(locator) {
    const sel =
      Selector(locator)
        .with({ boundTestRun: this.t });
    return this.t.expect(sel).ok(`Expected ${locator} to exist`);
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
      .typeText(sel, value, { replace: true });
  }

  async pressKey(key) {
    return this.t
      .pressKey(key);
  }

  async seeNumberOfVisibleElements(locator, num) {
    const sel = Selector(locator).filterVisible().with({ boundTestRun: this.t });
    return this.t
      .expect(sel.count).eql(num);
  }
}

module.exports = Testcafe;
