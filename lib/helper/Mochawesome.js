'use strict';
let addMochawesomeContext;
let currentTest;
let currentSuite;
const Helper = require('../helper');
const hashCode = require('../utils').hashCode;
const clearString = require('../utils').clearString;
const requireg = require('requireg');
const path = require('path');


class Mochawesome extends Helper {

  constructor(config) {
    super(config);
    addMochawesomeContext = requireg('mochawesome/addContext');
    this._createConfig(config);
  }

  _createConfig(config) {

    // set defaults

    this.options = {
      uniqueScreenshotNames: false,
      disableScreenshots: false
    };

    // override defaults with config
    Object.assign(this.options, config);
  }

  _beforeSuite(suite) {
    currentSuite = suite;
  }

  _before() {
    currentTest = {test: currentSuite.ctx.currentTest};
  }

  _test(test) {
    currentTest = {test: test};
  }


  _failed(test) {
    if (this.options.disableScreenshots) return;
    let fileName = clearString(test.title);
    if (this.options.uniqueScreenshotNames) {
      fileName =
        fileName.substring(0, 10) + '-' + hashCode(test.title) + '-' +
        hashCode(test.file)
    }
    if (test._retries < 1 || test._retries == test.retryNum) {
      fileName = `${fileName}.failed.png`
      return addMochawesomeContext(currentTest, path.join(global.output_dir, fileName));
    }
  }

  addMochawesomeContext(context) {
    return addMochawesomeContext(currentTest, context);
  }

}

module.exports = Mochawesome;
