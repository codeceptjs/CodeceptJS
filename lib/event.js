var events = require('events');
var dispatcher = new events.EventEmitter();
var log = require('./output').log;

module.exports = {
  dispatcher,
  test: {
    started: 'test.start',
    before: 'test.before',
    after: 'test.after',
    passed: 'test.passed',
    failed: 'test.failed',
  },
  suite: {
    before: 'suite.before',
    after: 'suite.after'
  },
  step: {
    before: 'step.before',
    started: 'step.start',
    after: 'step.after'
  },
  all: {
    before: 'global.before',
    after: 'global.after',
    result: 'global.result'
  },
  emit: function (event, param) {
    var msg = 'Emitted | ' + event;
    if (param && param.toString()) {
      msg += ` (${param.toString()})`;
    }
    log(msg);
    try {
      this.dispatcher.emit.apply(this.dispatcher, arguments);
    } catch (err) {
      log(`Error processing ${event} event:`);
      log(err.stack);
    }
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
