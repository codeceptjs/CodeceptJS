'use strict';
let Helper = require('../../lib/helper');
let output = require('../../lib/output');

let browser;

class FakeDriver extends Helper {

  printBrowser() {
    this.debug(this.config.browser);
  }

}

module.exports = FakeDriver;