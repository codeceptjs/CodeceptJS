/**
 * StepConfig is a configuration object for a step.
 * It is used to create a new step that is a combination of other steps.
 */
class StepConfig {
  constructor(opts = {}) {
    /** @member {{ opts: Record<string, any>, timeout: number|undefined, retry: number|undefined }} */
    this.config = {
      opts,
      timeout: undefined,
      retry: undefined,
    }
  }

  /**
   * Set the options for the step.
   * @param {object} opts - The options for the step.
   * @returns {StepConfig} - The step configuration object.
   */
  opts(opts) {
    this.config.opts = opts
    return this
  }

  /**
   * Set the timeout for the step.
   * @param {number} timeout - The timeout for the step.
   * @returns {StepConfig} - The step configuration object.
   */
  timeout(timeout) {
    this.config.timeout = timeout
    return this
  }

  /**
   * Set the retry for the step.
   * @param {number} retry - The retry for the step.
   * @returns {StepConfig} - The step configuration object.
   */
  retry(retry) {
    this.config.retry = retry
    return this
  }

  getConfig() {
    return this.config
  }
}

module.exports = StepConfig
