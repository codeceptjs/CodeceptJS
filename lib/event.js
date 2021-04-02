const debug = require('debug')('codeceptjs:event');
const events = require('events');
const { error } = require('./output');

const dispatcher = new events.EventEmitter();

dispatcher.setMaxListeners(50);
/**
 * @namespace
 * @alias event
 */
module.exports = {
  /**
   * @type {NodeJS.EventEmitter}
   * @constant
   * @inner
   */
  dispatcher,
  /**
   * @type {object}
   * @constant
   * @inner
   * @property {'test.start'} started
   * @property {'test.before'} before
   * @property {'test.after'} after
   * @property {'test.passed'} passed
   * @property {'test.failed'} failed
   * @property {'test.finish'} finished
   * @property {'test.skipped'} skipped
   */
  test: {
    started: 'test.start', // sync
    before: 'test.before', // async
    after: 'test.after', // async
    passed: 'test.passed', // sync
    failed: 'test.failed', // sync
    finished: 'test.finish', // sync
    skipped: 'test.skipped', // sync
  },
  /**
   * @type {object}
   * @constant
   * @inner
   * @property {'suite.before'} before
   * @property {'suite.after'} after
   */
  suite: {
    before: 'suite.before',
    after: 'suite.after',
  },
  /**
   * @type {object}
   * @constant
   * @inner
   * @property {'hook.start'} started
   * @property {'hook.passed'} passed
   */
  hook: {
    started: 'hook.start',
    passed: 'hook.passed',
    failed: 'hook.failed',
  },
  /**
   * @type {object}
   * @constant
   * @inner
   * @property {'step.start'} started
   * @property {'step.before'} before
   * @property {'step.after'} after
   * @property {'step.passed'} passed
   * @property {'step.failed'} failed
   * @property {'step.finish'} finished
   * @property {'step.comment'} comment
   */
  step: {
    before: 'step.before', // async
    after: 'step.after', // async
    started: 'step.start', // sync
    passed: 'step.passed', // sync
    failed: 'step.failed', // sync
    finished: 'step.finish', // sync
    comment: 'step.comment',
  },
  /**
   * @type {object}
   * @constant
   * @inner
   * @property {'suite.before'} before
   * @property {'suite.after'} after
   */
  bddStep: {
    before: 'bddStep.before',
    after: 'bddStep.after',
  },
  /**
   * @type {object}
   * @constant
   * @inner
   * @property {'global.before'} before
   * @property {'global.after'} after
   * @property {'global.result'} result
   * @property {'global.failures'} failures
   */
  all: {
    before: 'global.before',
    after: 'global.after',
    result: 'global.result',
    failures: 'global.failures',
  },
  /**
   * @type {object}
   * @constant
   * @inner
   * @property {'multiple.before'} before
   * @property {'multiple.after'} after
   */
  multiple: {
    before: 'multiple.before',
    after: 'multiple.after',
  },

  /**
   * @type {object}
   * @constant
   * @inner
   * @property {'workers.before'} before
   * @property {'workers.after'} after
   */
  workers: {
    before: 'workers.before',
    after: 'workers.after',
  },

  /**
   * @param {string} event
   * @param {*} [param]
   */
  emit(event, param) {
    let msg = `Emitted | ${event}`;
    if (param && param.toString()) {
      msg += ` (${param.toString()})`;
    }
    debug(msg);
    try {
      this.dispatcher.emit.apply(this.dispatcher, arguments);
    } catch (err) {
      error(`Error processing ${event} event:`);
      error(err.stack);
    }
  },

  /** for testing only! */
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
