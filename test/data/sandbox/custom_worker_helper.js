const assert = require('assert');
const Helper = require('../../../lib/helper');

class CustomWorkers extends Helper {
  sayCustomMessage() {
    assert(true, 'this is a custom message');
  }
}

module.exports = CustomWorkers;
