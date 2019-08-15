const events = require('events');

const dispatcher = new events.EventEmitter();
const log = require('./output').log;

module.exports = {
  dispatcher,
  test: {
    started: 'test.start', // sync
    before: 'test.before', // async
    after: 'test.after', // async
    passed: 'test.passed', // sync
    failed: 'test.failed', // sync
    finished: 'test.finish', // sync
  },
  suite: {
    before: 'suite.before',
    after: 'suite.after',
  },
  hook: {
    started: 'hook.start',
    passed: 'hook.passed',
    failed: 'hook.failed',
  },
  step: {
    before: 'step.before', // async
    after: 'step.after', // async
    started: 'step.start', // sync
    passed: 'step.passed', // sync
    failed: 'step.failed', // sync
    finished: 'step.finish', // sync
    comment: 'step.comment',
  },
  all: {
    before: 'global.before',
    after: 'global.after',
    result: 'global.result',
  },
  multiple: {
    before: 'multiple.before',
    after: 'multiple.after',
  },

  emit(event, param) {
    let msg = `Emitted | ${event}`;
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
    let event;
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
  },
};
