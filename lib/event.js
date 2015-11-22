var events = require('events');
var dispatcher = new events.EventEmitter();

module.exports = {
  dispatcher,
  test: {
    before: 'test.before',
    after: 'test.after',    
    failed: 'test.failed',    
  },
  suite: {
    before: 'suite.before',
    after: 'suite.after'
  },  
  step: {
    init: 'step.init',    
    before: 'step.before',
    after: 'step.after'
  },
  all: {  
    before: 'global.before',
    after: 'global.after',
    result: 'global.result'
  }
}