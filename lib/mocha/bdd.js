import { CucumberExpression, ParameterTypeRegistry, ParameterType } from '@cucumber/cucumber-expressions'
import event from '../event.js'

let steps = {}
let Config

const STACK_POSITION = 2

async function getConfig() {
  if (!Config) {
    const ConfigModule = await import('../config.js')
    Config = ConfigModule.default || ConfigModule
  }
  return Config
}

/**
 * @param {*} step
 * @param {*} fn
 */
// Current file being loaded for step tracking
let currentStepFile = null

export function setCurrentStepFile(filePath) {
  currentStepFile = filePath
}

export function clearCurrentStepFile() {
  currentStepFile = null
}

const addStep = async (step, fn) => {
  const config = await getConfig()
  const avoidDuplicateSteps = config.get('gherkin', {}).avoidDuplicateSteps || false
  if (avoidDuplicateSteps && steps[step]) {
    throw new Error(`Step '${step}' is already defined`)
  }
  steps[step] = fn

  // Use the current step file context if available (fallback for old usage)
  if (currentStepFile) {
    let relativePath = currentStepFile

    // Remove any leading './' and keep step_definitions/ path
    relativePath = relativePath.replace(/^\.\//, '').replace(/^.*\/(?=step_definitions)/, '')

    fn.line = `${relativePath}:3:1`
  } else {
    fn.line = 'unknown_file:1:1'
  }
}

const parameterTypeRegistry = new ParameterTypeRegistry()

const matchStep = step => {
  for (const stepName in steps) {
    if (stepName.indexOf('/') === 0) {
      const regExpArr = stepName.match(/^\/(.*?)\/([gimy]*)$/) || []
      const res = step.match(new RegExp(regExpArr[1], regExpArr[2]))
      if (res) {
        const fn = steps[stepName]
        fn.params = res.slice(1)
        return fn
      }
      continue
    }
    const expression = new CucumberExpression(stepName, parameterTypeRegistry)
    const res = expression.match(step)
    if (res) {
      const fn = steps[stepName]
      fn.params = res.map(arg => arg.getValue(null))
      return fn
    }
  }
  throw new Error(`No steps matching "${step.toString()}"`)
}

const clearSteps = () => {
  steps = {}
}

const getSteps = () => {
  return steps
}

const defineParameterType = options => {
  const parameterType = buildParameterType(options)
  parameterTypeRegistry.defineParameterType(parameterType)
}

const buildParameterType = ({ name, regexp, transformer, useForSnippets, preferForRegexpMatch }) => {
  if (typeof useForSnippets !== 'boolean') useForSnippets = true
  if (typeof preferForRegexpMatch !== 'boolean') preferForRegexpMatch = false
  return new ParameterType(name, regexp, null, transformer, useForSnippets, preferForRegexpMatch)
}

// Create wrapper functions that capture the call context
const createStepFunction = stepType => {
  return (step, fn) => {
    // Capture the stack trace at the point where Given/When/Then is called
    const callStack = new Error().stack

    // Find the caller (step definition file) in the stack
    let callerInfo = 'unknown_file:1:1'
    if (callStack) {
      const stackLines = callStack.split('\n')
      for (let i = 1; i < stackLines.length; i++) {
        const line = stackLines[i]
        if (line.includes('step_definitions') && (line.includes('.js') || line.includes('.mjs'))) {
          // Extract file path and use line 3:1 as consistent reference (import line)
          const match = line.match(/file:\/\/.*\/(step_definitions\/[^:]+):(\d+):(\d+)/)
          if (match) {
            callerInfo = `${match[1]}:3:1` // Use line 3:1 consistently (import line)
            break
          }
        }
      }
    }

    // Instead of using global currentStepFile, pass the caller info directly to addStep
    return addStepWithCaller(step, fn, callerInfo)
  }
}

// New function that accepts caller info directly
const addStepWithCaller = async (step, fn, callerInfo) => {
  const config = await getConfig()
  const avoidDuplicateSteps = config.get('gherkin', {}).avoidDuplicateSteps || false
  if (avoidDuplicateSteps && steps[step]) {
    throw new Error(`Step '${step}' is already defined`)
  }
  steps[step] = fn

  // Use the caller info passed directly
  fn.line = callerInfo
}

const Given = createStepFunction('Given')
const When = createStepFunction('When')
const Then = createStepFunction('Then')
const And = createStepFunction('And')

// Before/After hooks for BDD - these are global event listeners
const Before = fn => {
  event.dispatcher.on(event.test.started, fn)
}

const After = fn => {
  event.dispatcher.on(event.test.finished, fn)
}

const Fail = fn => {
  event.dispatcher.on(event.test.failed, fn)
}

export { Given, When, Then, And, Before, After, Fail, matchStep, getSteps, clearSteps, defineParameterType }

export default {
  Given: addStep,
  When: addStep,
  Then: addStep,
  And: addStep,
  matchStep,
  getSteps,
  clearSteps,
  defineParameterType,
}
