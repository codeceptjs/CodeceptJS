import recorder from '../recorder.js'

function retryStep(step, opts) {
  releaseStepRetry(step)
  let rule = opts
  if (Number.isInteger(opts)) rule = { retries: opts }
  recorder.retry(rule)
  step.retryRule = rule
}

function releaseStepRetry(step) {
  if (!step.retryRule) return
  recorder.retries = recorder.retries.filter(rule => rule !== step.retryRule)
  step.retryRule = null
}

export { releaseStepRetry }
export default retryStep
