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
    currentTest = { test }
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
    return this._addContext(currentTest, context)
  }
}

module.exports = Mochawesome
