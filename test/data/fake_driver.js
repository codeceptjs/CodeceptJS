const Helper = require('../../lib/helper');

class FakeDriver extends Helper {
  printBrowser() {
    this.debug(this.config.browser);
  }

  printWindowSize() {
    this.debug(this.config.windowSize);
  }
}

module.exports = FakeDriver;
