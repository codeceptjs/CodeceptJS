const event = require('../event')
const recorder = require('../recorder')
const StepConfig = require('./config')
const store = require('../store')
const { TIMEOUT_ORDER } = require('./timeout')
const retryStep = require('./retry')
function recordStep(step, args) {
  step.status = 'queued'

  // apply step configuration
  const lastArg = args[args.length - 1]
  if (lastArg instanceof StepConfig) {
    const stepConfig = args.pop()
    const { options, timeout, retry } = stepConfig.getConfig()

    if (options) {
      store.stepOptions = options
      step.opts = options
    }
    if (timeout) step.setTimeout(timeout, TIMEOUT_ORDER.codeLimitTime)
    if (retry) retryStep(retry)
  }

  step.setArguments(args)
  // run async before step hooks
  event.emit(event.step.before, step)

  const task = `${step.name}: ${step.humanizeArgs()}`
  let val

  // run step inside promise
  recorder.add(
    task,
    () => {
      if (!step.startTime) {
        // step can be retries
        event.emit(event.step.started, step)
        step.startTime = Date.now()
      }
      return (val = step.run(...args))
    },
    false,
    undefined,
    step.timeout,
  )

  event.emit(event.step.after, step)

  recorder.add('step passed', () => {
    step.endTime = Date.now()
    event.emit(event.step.passed, step, val)
    event.emit(event.step.finished, step)
  })

  recorder.catchWithoutStop(err => {
    step.status = 'failed'
    step.endTime = Date.now()
    event.emit(event.step.failed, step)
    event.emit(event.step.finished, step)
    throw err
  })

  recorder.add('return result', () => val)
  // run async after step hooks

  return recorder.promise()
}

module.exports = recordStep
