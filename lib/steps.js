const StepConfig = require('./step/config')
const Section = require('./step/section')
function stepOpts(opts = {}) {
  return new StepConfig(opts)
}

function stepTimeout(timeout) {
  return new StepConfig().timeout(timeout)
}

function stepRetry(retry) {
  return new StepConfig().retry(retry)
}

function section(name) {
  if (!name) return endSection()
  return new Section(name).start()
}

function endSection() {
  return Section.current().end()
}

// Section function to be added here

const step = {
  // steps.opts syntax
  opts: stepOpts,
  timeout: stepTimeout,
  retry: stepRetry,

  // one-function syntax
  stepTimeout,
  stepRetry,
  stepOpts,

  // sections
  section,
  endSection,

  Section: section,
  EndSection: endSection,

  // shortcuts
  Given: () => section('Given'),
  When: () => section('When'),
  Then: () => section('Then'),
}

module.exports = step
