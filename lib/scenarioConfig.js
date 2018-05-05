class ScenarioConfig {
  constructor(test) {
    this.test = test;
  }

  /**
   * Declares that test throws error.
   * Can pass an Error object or regex matching expected message.
   *
   * @param {*} err
   */
  throws(err) {
    this.test.throws = err;
    return this;
  }

  /**
   * Declares that test should fail.
   * If test passes - throws an error.
   * Can pass an Error object or regex matching expected message.
   *
   * @param {*} err
   */
  fails() {
    this.test.throws = new Error();
    return this;
  }

  /**
   * Retry this test for x times
   *
   * @param {*} retries
   */
  retry(retries) {
    this.test.retries(retries);
    return this;
  }

  /**
   * Set timeout for this test
   * @param {*} timeout
   */
  timeout(timeout) {
    this.test.timeout(timeout);
    return this;
  }

  /**
   * Pass in additional objects to inject into test
   * @param {*} obj
   */
  inject(obj) {
    this.test = obj;
    return this;
  }
}

module.exports = ScenarioConfig;
