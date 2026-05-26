import event from '../event.js'
import recorder from '../recorder.js'
import StepConfig from './config.js'
import output from '../output.js'
import store from '../store.js'
import { TIMEOUT_ORDER } from '../timeout.js'
import retryStep from './retry.js'
import { fixErrorStack } from '../utils/typescript.js'
function recordStep(step, args) {
  step.status = 'queued'

  // apply step configuration
  const lastArg = args[args.length - 1]
  if (StepConfig.isStepConfig(lastArg)) {
    const stepConfig = args.pop()
    const { opts, timeout, retry } = stepConfig.getConfig()

    if (opts) {
      output.debug(`Step ${step.title}: options applied ${JSON.stringify(opts)}`)
      store.stepOptions = opts
      step.opts = opts
    }
    if (timeout) {
      output.debug(`Step ${step.title} timeout ${timeout}s`)
      step.setTimeout(timeout * 1000, TIMEOUT_ORDER.codeLimitTime)
    }
    if (retry) retryStep(retry)
  }

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
    step.timeout,
  )

  event.emit(event.step.after, step)

  recorder.add('step passed', () => {
    step.endTime = +Date.now()
    event.emit(event.step.passed, step, val)
    event.emit(event.step.finished, step)
  })

  recorder.catch(err => {
    step.status = 'failed'
    step.endTime = +Date.now()
    
    // Fix error stack to point to original .ts files (lazy import to avoid circular dependency)
    const fileMapping = store.tsFileMapping
    if (fileMapping) {
      fixErrorStack(err, fileMapping)
    }
    
    event.emit(event.step.failed, step, err)
    event.emit(event.step.finished, step)
    throw err
  })

  recorder.add('return result', () => val)
  // run async after step hooks

  return recorder.promise()
}

export default recordStep
