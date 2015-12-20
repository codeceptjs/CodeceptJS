
'use strict';

let I;

module.exports = {

  _init() {
    I = require('../custom_steps.js')();
  },

  openFeatures() {
    I.click('Features');
  }

  // insert your locators and methods here
}
