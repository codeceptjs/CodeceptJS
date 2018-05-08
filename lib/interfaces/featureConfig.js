class FeatureConfig {
  constructor(suite) {
    this.suite = suite;
  }

  /**
   * Retry this suite for x times
   *
   * @param {*} retries
   */
  retry(retries) {
    this.suite.retries(retries);
    return this;
  }

  /**
   * Set timeout for this suite
   * @param {*} timeout
   */
  timeout(timeout) {
    this.suite.timeout(timeout);
    return this;
  }

  /**
   * Configures a helper.
   * Helper name can be omitted and values will be applied to first helper.
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
}

module.exports = FeatureConfig;
