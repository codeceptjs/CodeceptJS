class StepConfig {
  constructor(opts) {
    this.config = {
      opts,
      timeout: undefined,
      retry: undefined,
    }
  }

  opts(opts) {
    this.config.opts = opts
    return this
  }

  timeout(timeout) {
    this.config.timeout = timeout
    return this
  }

  retry(retry) {
    this.config.retry = retry
    return this
  }

  getConfig() {
    return this.config
  }
}

module.exports = StepConfig
