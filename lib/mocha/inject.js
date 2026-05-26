import { getParams } from '../parser.js'

const getInjectedArguments = async (fn, test, suite) => {
  const containerModule = await import('../container.js')
  const container = containerModule.default || containerModule

  const testArgs = {}
  const params = getParams(fn, { warnOnLegacyFormat: true }) || []
  const objects = container.support()

  for (const key of params) {
    testArgs[key] = {}

    // Handle special built-in objects first
    if (key === 'suite') {
      if (test) {
        testArgs[key] = test.parent || test
      } else if (suite) {
        testArgs[key] = suite
      }
      continue
    }
    if (key === 'test') {
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
