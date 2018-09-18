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
   */
  static _config() {

  }

  /**
   * Abstract method to validate config
   * @param {*} config
   */
  _validateConfig(config) {
    return config;
  }

  /**
   * Sets config for current test
   */
  _setConfig(opts) {
    this.options = this._validateConfig(opts);
  }

  /**
   * Hook executed before all tests
   */
  _init() {

  }

  /**
   * Hook executed before each test.
   */
  _before() {

  }

  /**
   * Hook executed after each test
   */
  _after() {

  }

  /**
   * Hook provides a test details
   * Executed in the very beginning of a test
   *
   * @param {*} test
   */
  _test(test) {

  }

  /**
   * Hook executed after each passed test
   *
   * @param {*} test
   */
  _passed(test) {

  }

  /**
   * Hook executed after each failed test
   *
   * @param {*} test
   */
  _failed(test) {

  }

  /**
   * Hook executed before each step
   *
   * @param {*} step
   * @override
   */
  _beforeStep(step) {

  }

  /**
   * Hook executed after each step
   *
   * @param {*} step
   * @override
   */
  _afterStep(step) {

  }

  /**
   * Hook executed before each suite
   *
   * @param {*} suite
   */
  _beforeSuite(suite) {

  }

  /**
   * Hook executed after each suite
   *
   * @param {*} suite
   */
  _afterSuite(suite) {

  }

  /**
   * Hook executed after all tests are executed
   *
   * @param {*} suite
   */
  _finishTest(suite) {

  }

  /**
   * Access another configured helper: `this.helpers['AnotherHelper']`
   */
  get helpers() {
    return container.helpers();
  }

  /**
   * Print debug message to console (outputs only in debug mode)
   */
  debug(msg) {
    output.debug(msg);
  }

  debugSection(section, msg) {
    output.debug(`[${section}] ${msg}`);
  }
}

module.exports = Helper;
