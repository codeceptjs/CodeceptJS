const assert = require('assert')
const HelperModule = require('../../../lib/helper')
const Helper = HelperModule.default || HelperModule

class CustomWorkers extends Helper {
  sayCustomMessage() {
    assert(true, 'this is a custom message')
  }
}

module.exports = CustomWorkers
