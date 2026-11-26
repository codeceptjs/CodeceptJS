import event from '../event.js'
import recorder from '../recorder.js'
import StepConfig from './config.js'
import output from '../output.js'
import store from '../store.js'
import { TIMEOUT_ORDER } from '../timeout.js'
import retryStep, { releaseStepRetry } from './retry.js'
import { fixErrorStack } from '../utils/typescript.js'
import AssertionFailedError from '../assert/error.js'

function applyStepConfig(step, stepConfig) {
  const { opts, timeout, retry, customMessage } = stepConfig.getConfig()

  if (opts) {
    output.debug(`Step ${step.title}: options applied ${JSON.stringify(opts)}`)
    step.opts = { ...step.opts, ...opts }
    store.stepOptions = step.opts
  }
  if (timeout) {
    output.debug(`Step ${step.title} timeout ${timeout}s`)
    step.setTimeout(timeout * 1000, TIMEOUT_ORDER.codeLimitTime)
  }
  if (retry) retryStep(step, retry)
  if (customMessage) step.customMessage = customMessage
}

function addCustomMessage(err, message) {
  if (err instanceof AssertionFailedError) {
    err.params.customMessage = `${message}\n  ${err.params.customMessage || ''}`
    return
  }
  const original = err.message
  const stack = err.stack
  err.message = original ? `${message}\n${original.replace(/^/gm, '  ')}` : message
  if (original && typeof stack === 'string') err.stack = stack.replace(original, () => err.message)
}

function recordStep(step, args) {
  step.status = 'queued'

  // apply step configuration
  const lastArg = args[args.length - 1]
  if (StepConfig.isStepConfig(lastArg)) applyStepConfig(step, args.pop())

  step.setArguments(args)
  // run async before step hooks
  event.emit(event.step.before, step)

  const task = `${step.title}: ${step.humanizeArgs()}`
  let val

  // run step inside promise
  recorder.add(
    task,
    () => {
      if (!step.startTime) {
        // step can be retries
        event.emit(event.step.started, step)
        step.startTime = +Date.now()
      }
      return (val = step.run(...args))
    },
    false,
    undefined,
    () => step.timeout,
  )

  event.emit(event.step.after, step)

  recorder.add('step passed', () => {
    releaseStepRetry(step)
    step.endTime = +Date.now()
    event.emit(event.step.passed, step, val)
    event.emit(event.step.finished, step)
  })

  recorder.catch(err => {
    releaseStepRetry(step)
    step.status = 'failed'
    step.endTime = +Date.now()
    
    // Fix error stack to point to original .ts files (lazy import to avoid circular dependency)
    const fileMapping = store.tsFileMapping
    if (fileMapping) {
      fixErrorStack(err, fileMapping)
    }

    if (step.customMessage && step.startTime) addCustomMessage(err, step.customMessage)
    
    event.emit(event.step.failed, step, err)
    event.emit(event.step.finished, step)
    throw err
  })

  recorder.add('return result', () => val)
  // run async after step hooks

  return recorder.promise()
}

export { applyStepConfig }
export default recordStep
