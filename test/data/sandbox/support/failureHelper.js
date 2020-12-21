/* eslint-disable no-unused-vars */
// const Helper = require('../../lib/helper');

class FailureHelper extends Helper {
  constructor() {
    throw new Error('Failed on FailureHelper');
  }
}

module.exports = FailureHelper;
