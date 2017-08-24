'use strict';
let Helper = require('../../lib/helper');
let output = require('../../lib/output');

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
