const parser = require('../parser')

const getInjectedArguments = (fn, test) => {
  const container = require('../container')
  const testArgs = {}
  const params = parser.getParams(fn) || []
  const objects = container.support()

  for (const key of params) {
    testArgs[key] = {}
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

module.exports.getInjectedArguments = getInjectedArguments
