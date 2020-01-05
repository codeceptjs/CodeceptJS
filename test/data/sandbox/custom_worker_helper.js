const Helper = require('../../../lib/helper');
const assert = require('assert');

class CustomWorkers extends Helper {
  sayCustomMessage() {
    console.log('hello');
    assert(true, 'this is a custom message');
  }
}

module.exports = CustomWorkers;
