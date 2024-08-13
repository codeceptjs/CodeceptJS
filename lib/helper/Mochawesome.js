let addMochawesomeContext
let currentTest
let currentSuite

const Helper = require('@codeceptjs/helper')
const { clearString } = require('../utils')

class Mochawesome extends Helper {
  constructor(config) {
    super(config)

    // set defaults
    this.options = {
      uniqueScreenshotNames: false,
      disableScreenshots: false,
    }

    addMochawesomeContext = require('mochawesome/addContext')
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
    if (test.ctx.test.type === 'hook') {
      currentTest = { test: test.ctx.test }
      // ignore retries if we are in hook
      test._retries = -1
      fileName = clearString(`${test.title}_${currentTest.test.title}`)
    } else {
      currentTest = { test }
      fileName = clearString(test.title)
    }
    if (this.options.uniqueScreenshotNames) {
      const uuid = test.uuid || test.ctx.test.uuid
      fileName = `${fileName.substring(0, 10)}_${uuid}`
    }
    if (test._retries < 1 || test._retries === test.retryNum) {
      fileName = `${fileName}.failed.png`
      return addMochawesomeContext(currentTest, fileName)
    }
  }

  addMochawesomeContext(context) {
    if (currentTest === '') currentTest = { test: currentSuite.ctx.test }
    return addMochawesomeContext(currentTest, context)
  }
}

module.exports = Mochawesome
