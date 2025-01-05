const MochaSuite = require('mocha/lib/suite')

/**
 * @typedef {import('mocha')} Mocha
 */

/**
 * Enhances MochaSuite with CodeceptJS specific functionality using composition
 */
function enhanceMochaSuite(suite) {
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

module.exports = {
  createSuite,
  enhanceMochaSuite,
}
