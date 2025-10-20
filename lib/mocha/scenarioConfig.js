const { isAsyncFunction } = require('../utils')

/** @class */
class ScenarioConfig {
  /**
   * @param {CodeceptJS.Test} test
   */
  constructor(test) {
    this.test = test
  }

  /**
   * Declares that test throws error.
   * Can pass an Error object or regex matching expected message.
   *
   * @param {*} err
   * @returns {this}
   */
  throws(err) {
    this.test.throws = err
    return this
  }

  /**
   * Declares that test should fail.
   * If test passes - throws an error.
   * Can pass an Error object or regex matching expected message.
   *
   * @returns {this}
   */
  fails() {
    this.test.throws = new Error()
    return this
  }

  /**
   * Retry this test for x times
   *
   * @param {number} retries
   * @returns {this}
   */
  retry(retries) {
    if (process.env.SCENARIO_ONLY) retries = -retries
    this.test.retries(retries)
    return this
  }

  /**
   * Set metadata for this test
   * @param {string} key
   * @param {string} value
   * @returns {this}
   */
  meta(key, value) {
    this.test.meta[key] = value
    return this
  }

  /**
   * Set timeout for this test
   * @param {number} timeout
   * @returns {this}
   */
  timeout(timeout) {
    console.log(`Scenario('${this.test.title}', () => {}).timeout(${timeout}) is deprecated!`)
    console.log(`Please use Scenario('${this.test.title}', { timeout: ${timeout / 1000} }, () => {}) instead`)
    console.log('Timeout should be set in seconds')

    this.test.timeout(timeout)
    return this
  }

  /**
   * Pass in additional objects to inject into test
   * @param {Object<string, any>} obj
   * @returns {this}
   */
  inject(obj) {
    this.test.inject = obj
    return this
  }

  /**
   * @callback ScenarioConfigCallback
   * @param {CodeceptJS.Test} test
   * @returns {Object<string, any>}
   */

  /**
   * Configures a helper.
   * Helper name can be omitted and values will be applied to first helper.
   * @param {string | Object<string, any> | ScenarioConfigCallback} helper
   * @param {Object<string, any>} [obj]
   * @returns {this}
   */
  config(helper, obj) {
    if (!obj) {
      obj = helper
      helper = 0
    }
    if (typeof obj === 'function') {
      if (isAsyncFunction(obj)) {
        obj(this.test).then(res => (this.test.config[helper] = res))
        return this
      }
      obj = obj(this.test)
    }

    this.test.config[helper] = obj
    return this
  }

  /**
   * Append a tag name to scenario title
   * @param {string} tagName
   * @returns {this}
   */
  tag(tagName) {
    if (tagName[0] !== '@') tagName = `@${tagName}`
    this.test.tags.push(tagName)
    this.test.title = `${this.test.title.trim()} ${tagName}`
    return this
  }

  /**
   * Dynamically injects dependencies, see https://codecept.io/pageobjects/#dynamic-injection
   * @param {Object<string, *>} dependencies
   * @returns {this}
   */
  injectDependencies(dependencies) {
    Object.keys(dependencies).forEach(key => {
      this.test.inject[key] = dependencies[key]
    })
    return this
  }
}

module.exports = ScenarioConfig
