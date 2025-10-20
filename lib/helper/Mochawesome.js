let currentTest
let currentSuite

const Helper = require('@codeceptjs/helper')
const { clearString } = require('../utils')
const { testToFileName } = require('../mocha/test')

class Mochawesome extends Helper {
  constructor(config) {
    super(config)

    // set defaults
    this.options = {
      uniqueScreenshotNames: false,
      disableScreenshots: false,
    }

    this._addContext = require('mochawesome/addContext')

    this._createConfig(config)
  }

  _createConfig(config) {
    // override defaults with config
    Object.assign(this.options, config)
  }

  _beforeSuite(suite) {
    currentSuite = suite
    currentTest = ''
  }

  _before() {
    if (currentSuite && currentSuite.ctx) {
      currentTest = { test: currentSuite.ctx.currentTest }
    }
  }

  _test(test) {
    // If this is a retried test, we want to add context to the retried test
    // but also potentially preserve context from the original test
    const originalTest = test.retriedTest && test.retriedTest()
    if (originalTest) {
      // This is a retried test - use the retried test for context
      currentTest = { test }

      // Optionally copy context from original test if it exists
      // Note: mochawesome context is stored in test.ctx, but we need to be careful
      // not to break the mocha context structure
    } else {
      // Normal test (not a retry)
      currentTest = { test }
    }
  }

  _failed(test) {
    if (this.options.disableScreenshots) return
    let fileName
    // Get proper name if we are fail on hook
    if (test.ctx?.test?.type === 'hook') {
      currentTest = { test: test.ctx.test }
      // ignore retries if we are in hook
      test._retries = -1
      fileName = clearString(`${test.title}_${currentTest.test.title}`)
    } else {
      currentTest = { test }
      fileName = testToFileName(test)
    }
    if (this.options.uniqueScreenshotNames) {
      fileName = testToFileName(test, { unique: true })
    }
    if (test._retries < 1 || test._retries === test.retryNum) {
      fileName = `${fileName}.failed.png`
      return this._addContext(currentTest, fileName)
    }
  }

  addMochawesomeContext(context) {
    if (currentTest === '') currentTest = { test: currentSuite.ctx.test }

    // For retried tests, make sure we're adding context to the current (retried) test
    // not the original test
    let targetTest = currentTest
    if (currentTest.test && currentTest.test.retriedTest && currentTest.test.retriedTest()) {
      // This test has been retried, make sure we're using the current test for context
      targetTest = { test: currentTest.test }
    }

    return this._addContext(targetTest, context)
  }
}

module.exports = Mochawesome
