import debugModule from 'debug'
const debug = debugModule('codeceptjs:steps')
import event from '../event.js'
import store from '../store.js'
import output from '../output.js'
import { BeforeHook, AfterHook, BeforeSuiteHook, AfterSuiteHook } from '../mocha/hooks.js'
import recorder from '../recorder.js'

let currentTest
let currentHook

// Session names that should not contribute steps to the main test trace
const EXCLUDED_SESSIONS = ['tryTo', 'hopeThat']

/**
 * Register steps inside tests
 */
export default function () {
  event.dispatcher.on(event.test.before, test => {
    test.startedAt = +new Date()
  })

  event.dispatcher.on(event.test.started, test => {
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

    if (hook.ctx && hook.ctx.test) debug(`--- STARTED ${hook.ctx.test.title} ---`)
  })

  event.dispatcher.on(event.hook.passed, hook => {
    currentHook = null
    output.hook.passed(hook)
    if (hook.ctx && hook.ctx.test) debug(`--- ENDED ${hook.ctx.test.title} ---`)
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
    store.currentStep = step
    if (currentHook && Array.isArray(currentHook.steps)) {
      return currentHook.steps.push(step)
    }
    if (!currentTest || !currentTest.steps) return

    // Check if we're in a session that should be excluded from main test steps
    const currentSessionId = recorder.getCurrentSessionId()
    if (currentSessionId && EXCLUDED_SESSIONS.includes(currentSessionId)) {
      // Skip adding this step to the main test steps
      return
    }

    currentTest.steps.push(step)
  })

  event.dispatcher.on(event.step.finished, step => {
    store.currentStep = null
    store.stepOptions = null
  })
}
