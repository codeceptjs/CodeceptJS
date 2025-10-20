const MochaSuite = require('mocha/lib/suite')
/**
 * @typedef {import('mocha')} Mocha
 */

/**
 * Enhances MochaSuite with CodeceptJS specific functionality using composition
 */
function enhanceMochaSuite(suite) {
  if (!suite) suite = new MochaSuite('Suite', null, false)
  // already enhanced
  if (suite.codeceptjs) return suite

  suite.codeceptjs = true
  // Add properties
  suite.tags = suite.title.match(/(\@[a-zA-Z0-9-_]+)/g) || []
  suite.opts = {}
  // suite.totalTimeout = undefined

  // Override fullTitle method
  suite.fullTitle = () => `${suite.title}:`

  // Add new methods
  suite.applyOptions = function (opts) {
    if (!opts) opts = {}
    suite.opts = opts

    if (opts.retries) suite.retries(opts.retries)
    if (opts.timeout) suite.totalTimeout = opts.timeout

    if (opts.skipInfo && opts.skipInfo.skipped) {
      suite.pending = true
      suite.opts = { ...this.opts, skipInfo: opts.skipInfo }
    }
  }

  suite.simplify = function () {
    return serializeSuite(this)
  }

  return suite
}

/**
 * Factory function to create enhanced suites
 * @param {Mocha.Suite} parent - Parent suite
 * @param {string} title - Suite title
 * @returns {CodeceptJS.Suite & Mocha.Suite} New enhanced suite instance
 */
function createSuite(parent, title) {
  const suite = MochaSuite.create(parent, title)
  suite.timeout(0)
  return enhanceMochaSuite(suite)
}

function serializeSuite(suite) {
  suite = { ...suite }

  return {
    opts: suite.opts || {},
    tags: suite.tags || [],
    retries: suite._retries,
    title: suite.title,
    status: suite.status,
    notes: suite.notes || [],
    meta: suite.meta || {},
    duration: suite.duration || 0,
  }
}

function deserializeSuite(suite) {
  suite = Object.assign(new MochaSuite(suite.title), suite)
  enhanceMochaSuite(suite)
  return suite
}

module.exports = {
  createSuite,
  enhanceMochaSuite,
  serializeSuite,
  deserializeSuite,
}
