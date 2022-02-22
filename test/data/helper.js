const Helper = require('../../lib/helper');

class MyHelper extends Helper {
  method() {
    return 'hello world';
  }

  _init() {
    console.log('Helper: I\'m initialized');
  }

  _beforeSuite() {
    console.log('Helper: I\'m simple BeforeSuite hook');
  }

  _before() {
    console.log('Helper: I\'m simple Before hook');
  }

  _after() {
    console.log('Helper: I\'m simple After hook');
  }

  _afterSuite() {
    console.log('Helper: I\'m simple AfterSuite hook');
  }

  _passed() {
    console.log('Event:test.passed (helper)');
  }

  _failed() {
    console.log('Event:test.failed (helper)');
  }

  method2() {
    return 'hello another world';
  }

  _hiddenMethod() {
    return 'hello dark side';
  }

  stringWithHook(hookName) {
    return `Test: I'm generator ${hookName} hook`;
  }

  asyncStringWithHook(hookName) {
    return `Test: I'm async/await ${hookName} hook`;
  }

  stringWithScenarioType(type) {
    return `Test: I'm ${type} test`;
  }

  _locate() {
    return [{ name: 'el1' }, { name: 'el2' }];
  }
}

module.exports = MyHelper;
