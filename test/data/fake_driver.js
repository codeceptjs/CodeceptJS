
const Helper = require('../../lib/helper');
const output = require('../../lib/output');

let browser;

class FakeDriver extends Helper {
  printBrowser() {
    this.debug(this.config.browser);
  }

  printWindowSize() {
    this.debug(this.config.windowSize);
  }
}

module.exports = FakeDriver;
