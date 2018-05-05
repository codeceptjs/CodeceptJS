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
}

module.exports = FeatureConfig;
