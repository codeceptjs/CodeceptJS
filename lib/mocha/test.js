const Test = require('mocha/lib/test')
const Suite = require('mocha/lib/suite')
const { test: testWrapper } = require('./asyncWrapper')
const { enhanceMochaSuite, createSuite } = require('./suite')
const { genTestId, serializeError, clearString, relativeDir } = require('../utils')
const Step = require('../step/base')
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
  // if no test, create a dummy one
  if (!test) test = createTest('...', () => {})
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
    if (test.file && !suite.file) suite.file = test.file
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

  test.simplify = function () {
    return serializeTest(this)
  }

  return test
}

function deserializeTest(test) {
  test = Object.assign(
    createTest(test.title || '', () => {}),
    test,
  )
  test.parent = Object.assign(new Suite(test.parent?.title || 'Suite'), test.parent)
  enhanceMochaSuite(test.parent)
  if (test.steps) test.steps = test.steps.map(step => Object.assign(new Step(step.title), step))
  return test
}

function serializeTest(test, error = null) {
  // test = { ...test }

  if (test.start && !test.duration) {
    const end = +new Date()
    test.duration = end - test.start
  }

  let err

  if (test.err) {
    err = serializeError(test.err)
    test.state = 'failed'
  } else if (error) {
    err = serializeError(error)
    test.state = 'failed'
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

  let steps = undefined
  if (Array.isArray(test.steps)) {
    steps = test.steps.map(step => (step.simplify ? step.simplify() : step))
  }

  return {
    opts: test.opts || {},
    tags: test.tags || [],
    uid: test.uid,
    retries: test._retries,
    title: test.title,
    state: test.state,
    notes: test.notes || [],
    meta: test.meta || {},
    artifacts: test.artifacts || {},
    duration: test.duration || 0,
    err,
    parent,
    steps,
  }
}

function cloneTest(test) {
  return deserializeTest(serializeTest(test))
}

function testToFileName(test, suffix = '') {
  let fileName = test.title

  if (suffix) fileName = `${fileName}_${suffix}`
  // remove tags with empty string (disable for now)
  // fileName = fileName.replace(/\@\w+/g, '')
  fileName = fileName.slice(0, 100)
  if (fileName.indexOf('{') !== -1) {
    fileName = fileName.substr(0, fileName.indexOf('{') - 3).trim()
  }
  if (test.ctx && test.ctx.test && test.ctx.test.type === 'hook') fileName = clearString(`${test.title}_${test.ctx.test.title}`)
  // TODO: add suite title to file name
  // if (test.parent && test.parent.title) {
  //   fileName = `${clearString(test.parent.title)}_${fileName}`
  // }
  fileName = clearString(fileName).slice(0, 100)
  return fileName
}

module.exports = {
  createTest,
  testToFileName,
  enhanceMochaTest,
  serializeTest,
  deserializeTest,
  cloneTest,
}
