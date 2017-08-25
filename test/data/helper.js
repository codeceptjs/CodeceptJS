'use strict';
let Helper = require('../../lib/helper');

class MyHelper extends Helper {

  method() {
    return 'hello world';
  }

  method2() {
    return 'hello another world';
  }

  _hiddenMethod() {
    return 'hello dark side';
  }

  stringWithHook(hookName) {
    return `I'm generator ${hookName} hook`;
  }

}

module.exports = MyHelper;
