let currentTest
let currentSuite

import Helper from '@codeceptjs/helper'
import { clearString } from '../utils.js'
import { testToFileName } from '../mocha/test.js'

class Mochawesome extends Helper {
  constructor(config) {
    super(config)

    // set defaults
    this.options = {
      uniqueScreenshotNames: false,
      disableScreenshots: false,
    }

    this._addContext = null

    this._createConfig(config)
  }

  async _ensureAddContext() {
    if (!this._addContext) {
      this._addContext = (await import('mochawesome/addContext')).default
    }
    return this._addContext
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

  async _failed(test) {
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
      const addContext = await this._ensureAddContext()
      return addContext(currentTest, fileName)
    }
  }

  async addMochawesomeContext(context) {
    if (currentTest === '') currentTest = { test: currentSuite.ctx.test }
    const addContext = await this._ensureAddContext()
    return addContext(currentTest, context)
  }
}

export default Mochawesome
;