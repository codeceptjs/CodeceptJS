function errorThrown(actual, expected) {
  if (!expected) return null
  if (!actual) throw new Error(`Expected ${expected} error to be thrown`)
  const msg = actual.inspect ? actual.inspect() : actual.toString()
  if (expected instanceof RegExp) {
    if (msg.match(expected)) return null
    throw new Error(`Expected error to be thrown with message matching ${expected} while '${msg}' caught`)
  }
  if (typeof expected === 'string') {
    if (msg === expected) return null
    throw new Error(`Expected error to be thrown with message ${expected} while '${msg}' caught`)
  }
  if (typeof expected === 'object') {
    if (actual.constructor.name !== expected.constructor.name) throw new Error(`Expected ${expected} error to be thrown but ${actual} was caught`)
    if (expected.message && expected.message !== msg) throw new Error(`Expected error to be thrown with message ${expected.message} while '${msg}' caught`)
  }
  return null
}

module.exports = errorThrown
