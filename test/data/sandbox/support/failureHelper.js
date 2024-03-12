/* eslint-disable no-unused-vars */
// const Helper = require('../../lib/helper');

class FailureHelper extends Helper {
  constructor() {
    super();
    throw new Error('Failed on FailureHelper');
  }
}

export default FailureHelper;
