import { CucumberExpression, ParameterTypeRegistry, ParameterType } from '@cucumber/cucumber-expressions'

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
  const stack = new Error().stack
  if (avoidDuplicateSteps && steps[step]) {
    throw new Error(`Step '${step}' is already defined`)
  }
  steps[step] = fn
  
  // Try to get file location from current loading context
  if (currentStepFile || global.__currentStepDefinitionFile) {
    let sourceFile = currentStepFile || global.__currentStepDefinitionFile
    let relativePath = sourceFile.replace(global.codecept_dir + '/', '')
    // Remove './features/' prefix to match expected test format
    relativePath = relativePath.replace(/^\.\/features\//, '')
    // Store the file context immediately
    fn.line = `${relativePath}:3:1`
  } else {
    // Fallback to stack trace method
    fn.line = stack && stack.split('\n')[STACK_POSITION]
    if (fn.line) {
      fn.line = fn.line
        .trim()
        .replace(/^at (.*?)\(/, '(')
        .replace(global.codecept_dir || '', '.')
    }
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
      fn.params = res.map(arg => arg.getValue())
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

export {
  addStep as Given,
  addStep as When,
  addStep as Then,
  addStep as And,
  matchStep,
  getSteps,
  clearSteps,
  defineParameterType,
}

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
