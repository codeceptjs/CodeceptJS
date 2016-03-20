'use strict';

let container = require('./container');
let debug = require('./output').debug;

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

  construtor(config) {
    this.config = config;
  }

  /**
   * Abstract method to provide requried config options
   */
  static _config() {

  }

  /**
   * Hook executed before all tests
   */
  _init() {

  }

  /**
   * Hook executed before each test.
   *
   * @param test
   */
  _before() {

  }

  /**
   * Hook executed after each test
   *
   * @param test
   */
  _after() {

  }

  /**
   * Hook executed before each step
   *
   * @param step
   */
  _beforeStep() {

  }

  /**
   * Hook executed after each step
   *
   * @param step
   */
  _afterStep() {

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
    debug(msg);
  }

  debugSection(section, msg) {
    debug(`[${section}] ${msg}`);
  }

}

module.exports = Helper;
