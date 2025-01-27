const event = require('../event')
const recorder = require('../recorder')
const StepConfig = require('./config')
const { debug } = require('../output')
const store = require('../store')
const { TIMEOUT_ORDER } = require('../timeout')
const retryStep = require('./retry')
function recordStep(step, args) {
  step.status = 'queued'

  // apply step configuration
  const lastArg = args[args.length - 1]
  if (lastArg instanceof StepConfig) {
    const stepConfig = args.pop()
    const { opts, timeout, retry } = stepConfig.getConfig()

    if (opts) {
      debug(`Step ${step.name}: options applied ${JSON.stringify(opts)}`)
      store.stepOptions = opts
      step.opts = opts
    }
    if (timeout) {
      debug(`Step ${step.name} timeout ${timeout}s`)
      step.setTimeout(timeout * 1000, TIMEOUT_ORDER.codeLimitTime)
    }
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

  recorder.catchWithoutStop(err => {
    step.status = 'failed'
    step.endTime = +Date.now()
    event.emit(event.step.failed, step, err)
    event.emit(event.step.finished, step)
    throw err
  })

  recorder.add('return result', () => val)
  // run async after step hooks

  return recorder.promise()
}

module.exports = recordStep
