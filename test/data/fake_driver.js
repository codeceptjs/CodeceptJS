import Helper from '../../lib/helper.js'

class FakeDriver extends Helper {
  printBrowser() {
    this.debug(this.config.browser)
  }

  printWindowSize() {
    this.debug(this.config.windowSize)
  }
}

export default FakeDriver
