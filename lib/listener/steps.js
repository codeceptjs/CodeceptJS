const debug = require('debug')('codeceptjs:steps')
const event = require('../event')
const store = require('../store')
const output = require('../output')

let currentTest
let currentHook

/**
 */
module.exports = function () {
  event.dispatcher.on(event.test.started, test => {
    test.startedAt = +new Date()
    currentTest = test
    currentTest.steps = []
    if (!('retryNum' in currentTest)) currentTest.retryNum = 0
    else currentTest.retryNum += 1
    output.scenario.started(test)
  })

  event.dispatcher.on(event.test.after, test => {
    currentTest = null
  })

  event.dispatcher.on(event.test.finished, test => {})

  event.dispatcher.on(event.hook.started, hook => {
    currentHook = hook.ctx.test
    currentHook.steps = []

    output.hook.started(hook)

    if (hook.ctx && hook.ctx.test) debug(`--- STARTED ${hook.title} ---`)
  })

  event.dispatcher.on(event.hook.passed, hook => {
    currentHook = null
    output.hook.passed(hook)
    if (hook.ctx && hook.ctx.test) debug(`--- ENDED ${hook.title} ---`)
  })

  event.dispatcher.on(event.test.failed, () => {
    const cutSteps = function (current) {
      const failureIndex = current.steps.findIndex(el => el.status === 'failed')
      // To be sure that failed test will be failed in report
      current.state = 'failed'
      current.steps.length = failureIndex + 1
      return current
    }
    if (currentHook && Array.isArray(currentHook.steps) && currentHook.steps.length) {
      currentHook = cutSteps(currentHook)
      return (currentHook = null)
    }
    if (!currentTest) return
    // last step is failing step
    if (!currentTest.steps.length) return
    return (currentTest = cutSteps(currentTest))
  })

  event.dispatcher.on(event.test.passed, () => {
    if (!currentTest) return
    // To be sure that passed test will be passed in report
    delete currentTest.err
    currentTest.state = 'passed'
  })

  event.dispatcher.on(event.step.started, step => {
    step.startedAt = +new Date()
    step.test = currentTest
    store.currentStep = step
    if (currentHook && Array.isArray(currentHook.steps)) {
      return currentHook.steps.push(step)
    }
    if (!currentTest || !currentTest.steps) return
    currentTest.steps.push(step)
  })

  event.dispatcher.on(event.step.finished, step => {
    step.finishedAt = +new Date()
    if (step.startedAt) step.duration = step.finishedAt - step.startedAt
    debug(`Step '${step}' finished; Duration: ${step.duration || 0}ms`)
    store.currentStep = null
    store.stepOptions = null
  })

  // listeners to output steps
  let currentMetaStep = []

  event.dispatcher.on(event.bddStep.started, step => {
    if (!printSteps()) return

    output.stepShift = 2
    output.step(step)
  })

  event.dispatcher.on(event.step.started, step => {
    if (!printSteps()) return

    let processingStep = step
    const metaSteps = []
    let isHidden = false
    while (processingStep.metaStep) {
      metaSteps.unshift(processingStep.metaStep)
      processingStep = processingStep.metaStep
      if (processingStep.collapsed) isHidden = true
    }
    const shift = metaSteps.length

    for (let i = 0; i < Math.max(currentMetaStep.length, metaSteps.length); i++) {
      if (currentMetaStep[i] !== metaSteps[i]) {
        output.stepShift = 3 + 2 * i
        if (!metaSteps[i]) continue
        // bdd steps are handled by bddStep.started
        if (metaSteps[i].isBDD()) continue
        output.step(metaSteps[i])
      }
    }
    currentMetaStep = metaSteps

    if (isHidden) return
    output.stepShift = 3 + 2 * shift
    output.step(step)
  })

  event.dispatcher.on(event.step.finished, () => {
    if (!printSteps()) return
    output.stepShift = 0
  })
}

let areStepsPrinted = false
function printSteps() {
  if (output.level() < 1) return false

  // if executed first time, print debug message
  if (!areStepsPrinted) {
    debug('Printing steps', 'Output level', output.level())
    areStepsPrinted = true
  }

  return true
}
