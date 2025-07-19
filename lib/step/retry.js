import recorderModule from '../recorder.js'
const recorder = recorderModule.default || recorderModule
import event from '../event.js'

function retryStep(opts) {
  if (opts === undefined) opts = 1
  recorder.retry(opts)
  // remove retry once the step passed
  recorder.add(() => event.dispatcher.once(event.step.finished, () => recorder.retries.pop()))
}

export default retryStep
