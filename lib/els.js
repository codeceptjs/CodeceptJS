const output = require('./output')
const store = require('./store')
const container = require('./container')
const StepConfig = require('./step/config')
const recordStep = require('./step/record')
const FuncStep = require('./step/func')
const { truth } = require('./assert/truth')
const { isAsyncFunction, humanizeFunction } = require('./utils')

function element(purpose, locator, fn) {
  let stepConfig
  if (arguments[arguments.length - 1] instanceof StepConfig) {
    stepConfig = arguments[arguments.length - 1]
  }

  if (!fn || fn === stepConfig) {
    fn = locator
    locator = purpose
    purpose = 'first element'
  }

  const step = prepareStep(purpose, locator, fn)
  if (!step) return

  return executeStep(
    step,
    async () => {
      const els = await step.helper._locate(locator)
      output.debug(`Found ${els.length} elements, using first element`)

      return fn(els[0])
    },
    stepConfig,
  )
}

function eachElement(purpose, locator, fn) {
  if (!fn) {
    fn = locator
    locator = purpose
    purpose = 'for each element'
  }

  const step = prepareStep(purpose, locator, fn)
  if (!step) return

  return executeStep(step, async () => {
    const els = await step.helper._locate(locator)
    output.debug(`Found ${els.length} elements for each elements to iterate`)

    const errs = []
    let i = 0
    for (const el of els) {
      try {
        await fn(el, i)
      } catch (err) {
        output.error(`eachElement: failed operation on element #${i} ${el}`)
        errs.push(err)
      }
      i++
    }

    if (errs.length) {
      throw errs[0]
    }
  })
}

function expectElement(locator, fn) {
  const step = prepareStep('expect element to be', locator, fn)
  if (!step) return

  return executeStep(step, async () => {
    const els = await step.helper._locate(locator)
    output.debug(`Found ${els.length} elements, first will be used for assertion`)

    const result = await fn(els[0])
    const assertion = truth(`element (${locator})`, fn.toString())
    assertion.assert(result)
  })
}

function expectAnyElement(locator, fn) {
  const step = prepareStep('expect any element to be', locator, fn)
  if (!step) return

  return executeStep(step, async () => {
    const els = await step.helper._locate(locator)
    output.debug(`Found ${els.length} elements, at least one should pass the assertion`)

    const assertion = truth(`any element of (${locator})`, fn.toString())

    let found = false
    for (const el of els) {
      const result = await fn(el)
      if (result) {
        found = true
        break
      }
    }
    if (!found) throw assertion.getException()
  })
}

function expectAllElements(locator, fn) {
  const step = prepareStep('expect all elements', locator, fn)
  if (!step) return

  return executeStep(step, async () => {
    const els = await step.helper._locate(locator)
    output.debug(`Found ${els.length} elements, all should pass the assertion`)

    let i = 1
    for (const el of els) {
      output.debug(`checking element #${i}: ${el}`)
      const result = await fn(el)
      const assertion = truth(`element #${i} of (${locator})`, humanizeFunction(fn))
      assertion.assert(result)
      i++
    }
  })
}

module.exports = {
  element,
  eachElement,
  expectElement,
  expectAnyElement,
  expectAllElements,
}

function prepareStep(purpose, locator, fn) {
  if (store.dryRun) return
  const helpers = Object.values(container.helpers())

  const helper = helpers.filter(h => !!h._locate)[0]

  if (!helper) {
    throw new Error('No helper enabled with _locate method with returns a list of elements.')
  }

  if (!isAsyncFunction(fn)) {
    throw new Error('Async function should be passed into each element')
  }

  const isAssertion = purpose.startsWith('expect')

  const step = new FuncStep(`${purpose} within "${locator}" ${isAssertion ? 'to be' : 'to'}`)
  step.setHelper(helper)
  step.setArguments([humanizeFunction(fn)]) // user defined function is a passed argument

  return step
}

async function executeStep(step, action, stepConfig = {}) {
  step.setCallable(action)
  return recordStep(step, [stepConfig])
}
