/* eslint-disable no-unused-vars */
// const Helper = require('../../lib/helper');

class CustomHelper extends Helper {
  shouldDoSomething(s) {

  }

  fail() {
    throw new Error('Failed from helper');
  }
}

module.exports = CustomHelper;
