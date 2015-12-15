var events = require('events');
var dispatcher = new events.EventEmitter();

module.exports = {
  dispatcher,
  test: {
    started: 'test.start',
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
  },
  // for testing only!
  cleanDispatcher: () => {
    var event;
    for (event in this.test) {
      this.dispatcher.removeAllListeners(this.test[event]);
    }
    for (event in this.suite) {
      this.dispatcher.removeAllListeners(this.test[event]);
    }
    for (event in this.step) {
      this.dispatcher.removeAllListeners(this.test[event]);
    }
    for (event in this.all) {
      this.dispatcher.removeAllListeners(this.test[event]);
    }
  }
};
