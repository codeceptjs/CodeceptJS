const { StepConfig } = require('./step')

function stepConfig(opts) {
  return new StepConfig(opts)
}

module.exports = {
  stepConfig,
}
