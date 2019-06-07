const Helper = require('../helper');

let detox;
let by;
let element;
let expect;
let waitFor;

class Detox extends Helper {
  constructor(config) {
    super(config);
    const platform = require('detox/src/platform');
    platform.set(config.type, config.name);
    detox = require('detox');
    this.device = detox.device;
    by = detox.by;
    element = detox.element;
    expect = detox.expect;
    waitFor = detox.waitFor;

    // override defaults with config
    this._setConfig(config);
  }

  _validateConfig(config) {
    const defaults = {
      launchApp: true,
      reuse: false,
      reloadReactNative: false,
    };

    if (!config.type) throw new Error('Type is not defined. android or ios');
    if (!config.name) throw new Error('Device name is not defined.');

    const configurations = {
      first: {
        type: config.type,
        name: config.name,
        binaryPath: config.binaryPath,
        testBinaryPath: config.testBinaryPath,
      },
    };

    return Object.assign(defaults, { configurations }, config);
  }


  static _checkRequirements() {
    try {
      require('detox');
    } catch (e) {
      return ['detox@^12'];
    }
  }

  async _beforeSuite() {
    const { reuse, launchApp } = this.options;
    await detox.init(this.options, { reuse, launchApp });

    if (this.options.reloadReactNative) {
      return this.device.launchApp({ newInstance: true });
    }
  }

  async _afterSuite() {
    await detox.cleanup();
  }

  async _before(test) {
    if (this.options.reloadReactNative) {
      await this.device.reloadReactNative();
    } else {
      await this.device.launchApp({ newInstance: true });
    }
  }

  async _test(test) {
    await detox.beforeEach({
      title: test.title,
      fullName: test.fullTitle(),
    });
  }

  async _passed(test) {
    await detox.afterEach({
      title: test.title,
      fullName: test.fullTitle(),
      status: 'passed',
    });
  }

  async _failed(test) {
    await detox.afterEach({
      title: test.title,
      fullName: test.fullTitle(),
      status: 'failed',
    });
  }

  tap(locator) {
    return this.click(locator);
  }

  async click(locator, context) {
    locator = detectLocator(locator);
    if (context) locator = detectLocator(context).withDescendant(locator);
    await element(detectLocator(locator)).tap();
  }

  see(text, context = null) {
    if (context) {
      return expect(element(detectLocator(context))).toHaveText(text);
    }
    return expect(element(by.text(text))).toExist();
  }

  dontSee(text, context = null) {
    let locator = by.text(text);
    if (context) locator = detectLocator(context).withDescendant(locator);
    return expect(element(locator)).toNotExist();
  }

  seeElement(locator, context = null) {
    locator = detectLocator(locator);
    if (context) locator = detectLocator(context).withDescendant(locator);
    return expect(element(locator)).toExist();
  }

  dontSeeElement(locator, context = null) {
    locator = detectLocator(locator);
    if (context) locator = detectLocator(context).withDescendant(locator);
    return expect(element(locator)).toNotExist();
  }

  async fillField(field, value) {
    await element(field).tap();
    await element(field).replaceText(value);
  }

  async clearField(field) {
    await element(field).tap();
    await element(field).clearText();
  }

  async appendField(field, value) {
    await element(field).tap();
    await element(field).typeText(value);
  }

  /**
   * @param locator
   * @param sec
   */
  async waitForElement(locator, sec = 5) {
    return waitFor(element(detectLocator(locator))).toExist().withTimeout(sec * 1000);
  }

  async waitForElementVisible(locator, sec = 5) {
    return waitFor(element(detectLocator(locator))).toBeVisible().withTimeout(sec * 1000);
  }

  async waitToHide(locator, sec = 5) {
    return waitFor(element(detectLocator(locator))).toBeNotVisible().withTimeout(sec * 1000);
  }
}

function detectLocator(locator) {
  if (typeof locator === 'object') {
    if (locator.id) return by.id(locator.id);
    if (locator.label) return by.label(locator.label);
    if (locator.text) return by.text(locator.text);
    if (locator.type) return by.type(locator.type);
    if (locator.traits) return by.traits(locator.traits);
    return locator;
  }

  if (locator[0] === '#') {
    return by.id(locator.slice(1));
  }
  if (locator[0] === '~') {
    return by.label(locator.slice(1));
  }
  return by.text(locator);
}

module.exports = Detox;
