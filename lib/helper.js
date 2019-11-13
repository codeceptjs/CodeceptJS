const container = require('./container');
const output = require('./output');

/**
 * @inner
 * Abstract class.
 * Helpers abstracts test execution backends.
 *
 * Methods of Helper class will be available in tests in `I` object.
 * They provide user-friendly abstracted actions over NodeJS libraries.
 *
 * Hooks (methods starting with `_`) can be used to setup/teardown,
 * or handle execution flow.
 *
 * Methods are expected to return a value in order to be wrapped in promise.
 */
class Helper {
  constructor(config) {
    this.config = config;
  }

  /**
   * Abstract method to provide required config options
   * @return {*}
   * @protected
   */
  static _config() {

  }

  /**
   * Abstract method to validate config
   * @param {*} config
   * @returns {*}
   * @protected
   */
  _validateConfig(config) {
    return config;
  }

  /**
   * Sets config for current test
   * @param {*} opts
   * @protected
   */
  _setConfig(opts) {
    this.options = this._validateConfig(opts);
  }

  /**
   * Hook executed before all tests
   * @protected
   */
  _init() {

  }

  /**
   * Hook executed before each test.
   * @protected
   */
  _before() {

  }

  /**
   * Hook executed after each test
   * @protected
   */
  _after() {

  }

  /**
   * Hook provides a test details
   * Executed in the very beginning of a test
   *
   * @param {Mocha.Test} test
   * @protected
   */
  _test(test) {

  }

  /**
   * Hook executed after each passed test
   *
   * @param {Mocha.Test} test
   * @protected
   */
  _passed(test) {

  }

  /**
   * Hook executed after each failed test
   *
   * @param {Mocha.Test} test
   * @protected
   */
  _failed(test) {

  }

  /**
   * Hook executed before each step
   *
   * @param {CodeceptJS.Step} step
   * @protected
   */
  _beforeStep(step) {

  }

  /**
   * Hook executed after each step
   *
   * @param {CodeceptJS.Step} step
   * @protected
   */
  _afterStep(step) {

  }

  /**
   * Hook executed before each suite
   *
   * @param {Mocha.Suite} suite
   * @protected
   */
  _beforeSuite(suite) {

  }

  /**
   * Hook executed after each suite
   *
   * @param {Mocha.Suite} suite
   * @protected
   */
  _afterSuite(suite) {

  }

  /**
   * Hook executed after all tests are executed
   *
   * @param {Mocha.Suite} suite
   * @protected
   */
  _finishTest(suite) {

  }

  /**
   * Access another configured helper: `this.helpers['AnotherHelper']`
   *
   * @readonly
   * @type {*}
   */
  get helpers() {
    return container.helpers();
  }

  /**
   * Print debug message to console (outputs only in debug mode)
   *
   * @param {string} msg
   */
  debug(msg) {
    output.debug(msg);
  }

  /**
   * @param {string}  section
   * @param {string}  msg
   */
  debugSection(section, msg) {
    output.debug(`[${section}] ${msg}`);
  }
}

module.exports = Helper;
