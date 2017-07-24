'use strict';
let addMochawesomeContext;
let currentTest;
const Helper = require('../helper');
const hashCode = require('../utils').hashCode;
const clearString = require('../utils').clearString;
const requireg = require('requireg');


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

  _test(test) {
    currentTest = {test: test};
  }


  _failed(test) {
    if (this.options.disableScreenshots) return;
    let fileName = clearString(test.title);
    if (this.options.uniqueScreenshotNames) {
      fileName =
        fileName.substring(0, 10) + '-' + hashCode(test.title) + '-' +
        hashCode(test.file) +
        '.failed.png';
    } else {
      fileName = fileName + '.failed.png';
    }
    return addMochawesomeContext(currentTest, fileName);
  }

  addMochawesomeContext(context) {
    return addMochawesomeContext(currentTest, context);
  }

}

module.exports = Mochawesome;
