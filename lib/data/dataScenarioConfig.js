class DataScenarioConfig {
  constructor(scenarios) {
    this.scenarios = scenarios;
  }

  /**
     * Declares that test throws error.
     * Can pass an Error object or regex matching expected message.
     *
     * @param {*} err
     */
  throws(err) {
    this.scenarios.forEach(scenario => scenario.throws(err));
    return this;
  }

  /**
     * Declares that test should fail.
     * If test passes - throws an error.
     * Can pass an Error object or regex matching expected message.
     *
     */
  fails() {
    this.scenarios.forEach(scenario => scenario.fails());
    return this;
  }

  /**
     * Retry this test for x times
     *
     * @param {*} retries
     */
  retry(retries) {
    this.scenarios.forEach(scenario => scenario.retry(retries));
    return this;
  }

  /**
     * Set timeout for this test
     * @param {*} timeout
     */
  timeout(timeout) {
    this.scenarios.forEach(scenario => scenario.timeout(timeout));
    return this;
  }

  /**
     * Configures a helper.
     * Helper name can be omitted and values will be applied to first helper.
     */
  config(helper, obj) {
    this.scenarios.forEach(scenario => scenario.config(helper, obj));
    return this;
  }

  /**
     * Append a tag name to scenario title
     * @param {*} tagName
     */
  tag(tagName) {
    this.scenarios.forEach(scenario => scenario.tag(tagName));
    return this;
  }
}

module.exports = DataScenarioConfig;
