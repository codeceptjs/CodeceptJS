const Test = require('mocha/lib/test')
const Suite = require('mocha/lib/suite')
const { test: testWrapper } = require('./asyncWrapper')
const { enhanceMochaSuite } = require('./suite')
const { genTestId, serializeError, clearString } = require('../utils')

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

  test.toFileName = function () {
    let fileName = clearString(test.title)
    if (fileName.indexOf('{') !== -1) {
      fileName = fileName.substr(0, fileName.indexOf('{') - 3).trim()
    }
    // TODO: add suite title to file name
    // if (test.parent && test.parent.title) {
    //   fileName = `${clearString(test.parent.title)}_${fileName}`
    // }
    return fileName
  }

  test.applyOptions = function (opts) {
    if (!opts) opts = {}
    test.opts = opts
    test.meta = opts.meta || {}
    test.totalTimeout = opts.timeout
    if (opts.retries) this.retries(opts.retries)
  }

  test.simplify = function () {
    return serializeTest(this)
  }

  return test
}

function deserializeTest(test) {
  test = Object.assign(new Test(test.title || '', () => {}), test)
  test.parent = Object.assign(new Suite(test.parent.title), test.parent)
  enhanceMochaTest(test)
  enhanceMochaSuite(test.parent)
  return test
}

function serializeTest(test, err = null) {
  test = { ...test }

  if (test.start && !test.duration) {
    const end = +new Date()
    test.duration = end - test.start
  }

  if (test.err) {
    err = serializeError(test.err)
    test.status = 'failed'
  } else if (err) {
    err = serializeError(err)
    test.status = 'failed'
  }
  const parent = {}
  if (test.parent) {
    parent.title = test.parent.title
  }

  if (test.opts) {
    Object.keys(test.opts).forEach(k => {
      if (typeof test.opts[k] === 'object') delete test.opts[k]
      if (typeof test.opts[k] === 'function') delete test.opts[k]
    })
  }

  return {
    opts: test.opts || {},
    tags: test.tags || [],
    uid: test.uid,
    retries: test._retries,
    title: test.title,
    status: test.status,
    notes: test.notes || [],
    meta: test.meta || {},
    artifacts: test.artifacts || [],
    duration: test.duration || 0,
    err,
    parent,
    steps: [...test.steps].map(step => step.simplify()),
  }
}

function cloneTest(test) {
  return deserializeTest(serializeTest(test))
}

module.exports = {
  createTest,
  enhanceMochaTest,
  serializeTest,
  deserializeTest,
  cloneTest,
}
