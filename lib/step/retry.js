const recorder = require('../recorder')
const event = require('../event')

function retryStep(opts) {
  if (opts === undefined) opts = 1
  recorder.retry(opts)
  // remove retry once the step passed
  recorder.add(() => event.dispatcher.once(event.step.finished, () => recorder.retries.pop()))
}

module.exports = retryStep
