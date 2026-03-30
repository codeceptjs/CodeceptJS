/**
 * @typedef {Object} StepOptions
 * @property {number|'first'|'last'} [elementIndex] - Select a specific element when multiple match. 1-based positive index, negative from end, or 'first'/'last'.
 * @property {boolean} [exact] - Enable strict mode for this step. Throws if multiple elements match.
 * @property {boolean} [strictMode] - Alias for exact.
 * @property {boolean} [ignoreCase] - Perform case-insensitive text matching.
 */

/**
 * StepConfig is a configuration object for a step.
 * It is used to create a new step that is a combination of other steps.
 */
class StepConfig {
  constructor(opts = {}) {
    /** @member {{ opts: StepOptions, timeout: number|undefined, retry: number|undefined }} */
    this.config = {
      opts,
      timeout: undefined,
      retry: undefined,
    }
    this.__isStepConfig = true
  }

  static isStepConfig(obj) {
    return obj && (obj instanceof StepConfig || obj.__isStepConfig === true)
  }

  /**
   * Set the options for the step.
   * @param {StepOptions} opts - The options for the step.
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

export default StepConfig
