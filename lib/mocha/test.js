const Test = require('mocha/lib/test')
const Suite = require('mocha/lib/suite')
const { test: testWrapper } = require('./asyncWrapper')
const { enhanceMochaSuite } = require('./suite')
const { genTestId } = require('../utils')

/**
 * Factory function to create enhanced tests
 * @param {string} title - Test title
 * @param {Function} fn - Test function
 * @returns {CodeceptJS.Test & Mocha.Test} New enhanced test instance
 */
function createTest(title, fn) {
  const test = new Test(title, fn)
  return enhanceMochaTest(test)
}

/**
 * Enhances Mocha Test with CodeceptJS specific functionality using composition
 * @param {CodeceptJS.Test & Mocha.Test} test - Test instance to enhance
 * @returns {CodeceptJS.Test & Mocha.Test} Enhanced test instance
 */
function enhanceMochaTest(test) {
  // already enhanced
  if (test.codeceptjs) return test

  test.codeceptjs = true
  // Add properties
  test.tags = test.title.match(/(\@[a-zA-Z0-9-_]+)/g) || []
  test.steps = []
  test.config = {}
  test.artifacts = []
  test.inject = {}
  test.opts = {}
  test.meta = {}

  test.notes = []
  test.addNote = (type, note) => {
    test.notes.push({ type, text: note })
  }

  // Add new methods
  /**
   * @param {Mocha.Suite} suite - The Mocha suite to add this test to
   */
  test.addToSuite = function (suite) {
    enhanceMochaSuite(suite)
    suite.addTest(testWrapper(this))
    test.tags = [...(test.tags || []), ...(suite.tags || [])]
    test.fullTitle = () => `${suite.title}: ${test.title}`
    test.uid = genTestId(test)
  }

  test.applyOptions = function (opts) {
    if (!opts) opts = {}
    test.opts = opts
    test.meta = opts.meta || {}
    test.totalTimeout = opts.timeout
    if (opts.retries) this.retries(opts.retries)
  }

  return test
}

function repackTestForWorkersTransport(test) {
  test = Object.assign(new Test(test.title || '', () => {}), test)
  test.parent = Object.assign(new Suite(test.parent.title), test.parent)
  return test
}

module.exports = {
  createTest,
  enhanceMochaTest,
  repackTestForWorkersTransport,
}
