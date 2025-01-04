/**
 * Configuration for a test
 * Can inject values and add custom configuration.
 */
class ScenarioConfig {
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
   * Retry this test for number of times
   *
   * @param {number} retries
   * @returns {this}
   */
  retry(retries) {
    this.test.retries(retries)
    return this
  }

  /**
   * Set timeout for this test
   * @param {number} timeout
   * @returns {this}
   */
  timeout(timeout) {
    this.test.timeout(timeout)
    return this
  }

  /**
   * Pass in additional objects to inject into test
   * @param {*} obj
   * @returns {this}
   */
  inject(obj) {
    this.test.inject = obj
    return this
  }

  /**
   * Configures a helper.
   * Helper name can be omitted and values will be applied to first helper.
   * @param {string|number} helper
   * @param {*} obj
   * @returns {this}
   */
  config(helper, obj) {
    if (!obj) {
      obj = helper
      helper = 0
    }
    if (typeof obj === 'function') {
      obj = obj(this.test)
    }
    if (!this.test.config) {
      this.test.config = {}
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
    if (!this.test.tags) this.test.tags = []
    this.test.tags.push(tagName)
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
