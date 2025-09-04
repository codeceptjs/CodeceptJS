import { getParams } from '../parser.js'

const getInjectedArguments = async (fn, test) => {
  const containerModule = await import('../container.js')
  const container = containerModule.default || containerModule

  const testArgs = {}
  const params = getParams(fn) || []
  const objects = container.support()

  for (const key of params) {
    testArgs[key] = {}

    // Handle special built-in objects first
    if (key === 'suite' && test) {
      testArgs[key] = test.parent || test
      continue
    }
    if (key === 'test' && test) {
      testArgs[key] = test
      continue
    }

    if (test && test.inject && test.inject[key]) {
      // @FIX: need fix got inject
      testArgs[key] = test.inject[key]
      continue
    }
    if (!objects[key]) {
      throw new Error(`Object of type ${key} is not defined in container`)
    }
    testArgs[key] = container.support(key)
  }

  if (test) {
    testArgs.suite = test?.parent
    testArgs.test = test
  }
  return testArgs
}

export { getInjectedArguments }
