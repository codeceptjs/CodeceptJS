/** @class */
class FeatureConfig {
  constructor(suite) {
    this.suite = suite;
  }

  /**
   * Retry this suite for x times
   *
   * @param {number} retries
   * @returns {this}
   */
  retry(retries) {
    this.suite.retries(retries);
    return this;
  }

  /**
   * Set timeout for this suite
   * @param {number} timeout
   * @returns {this}
   */
  timeout(timeout) {
    this.suite.timeout(timeout);
    return this;
  }

  /**
   * Configures a helper.
   * Helper name can be omitted and values will be applied to first helper.
   * @param {string | Object<string, *>} helper
   * @param {Object<string, *>} [obj]
   * @returns {this}
   */
  config(helper, obj) {
    if (!obj) {
      obj = helper;
      helper = 0;
    }
    if (typeof obj === 'function') {
      obj = obj(this.suite);
    }
    if (!this.suite.config) {
      this.suite.config = {};
    }
    this.suite.config[helper] = obj;
    return this;
  }

  /**
   * Append a tag name to scenario title
   * @param {string} tagName
   * @returns {this}
   */
  tag(tagName) {
    if (tagName[0] !== '@') {
      tagName = `@${tagName}`;
    }
    this.suite.tags.push(tagName);
    this.suite.title = `${this.suite.title.trim()} ${tagName}`;
    return this;
  }
}

module.exports = FeatureConfig;
