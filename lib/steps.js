const StepConfig = require('./step/config')

function stepOpts(opts = {}) {
  return new StepConfig(opts)
}

function stepTimeout(timeout) {
  return new StepConfig().timeout(timeout)
}

function stepRetry(retry) {
  return new StepConfig().retry(retry)
}

// Section function to be added here

const step = {
  opts: stepOpts,
  timeout: stepTimeout,
  retry: stepRetry,
}

module.exports = step
