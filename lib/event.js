import debug from 'debug';

import events from 'events';
import * as output from './output.js';

debug('codeceptjs:event');

const dispatcher = new events.EventEmitter();

dispatcher.setMaxListeners(50);

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
export const test = {
  started: 'test.start', // sync
  before: 'test.before', // async
  after: 'test.after', // async
  passed: 'test.passed', // sync
  failed: 'test.failed', // sync
  finished: 'test.finish', // sync
  skipped: 'test.skipped', // sync
};

/**
 * @type {object}
 * @constant
 * @inner
 * @property {'suite.before'} before
 * @property {'suite.after'} after
 */
export const suite = {
  before: 'suite.before',
  after: 'suite.after',
};
/**
 * @type {object}
 * @constant
 * @inner
 * @property {'hook.start'} started
 * @property {'hook.passed'} passed
 */
export const hook = {
  started: 'hook.start',
  passed: 'hook.passed',
  failed: 'hook.failed',
};
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
export const step = {
  before: 'step.before', // async
  after: 'step.after', // async
  started: 'step.start', // sync
  passed: 'step.passed', // sync
  failed: 'step.failed', // sync
  finished: 'step.finish', // sync
  comment: 'step.comment',
};
/**
 * @type {object}
 * @constant
 * @inner
 * @property {'suite.before'} before
 * @property {'suite.after'} after
 */
export const bddStep = {
  before: 'bddStep.before',
  after: 'bddStep.after',
  started: 'bddStep.started',
  finished: 'bddStep.finished',
};
/**
 * @type {object}
 * @constant
 * @inner
 * @property {'global.before'} before
 * @property {'global.after'} after
 * @property {'global.result'} result
 * @property {'global.failures'} failures
 */
export const all = {
  before: 'global.before',
  after: 'global.after',
  result: 'global.result',
  failures: 'global.failures',
};
/**
 * @type {object}
 * @constant
 * @inner
 * @property {'multiple.before'} before
 * @property {'multiple.after'} after
 */
export const multiple = {
  before: 'multiple.before',
  after: 'multiple.after',
};

/**
 * @type {object}
 * @constant
 * @inner
 * @property {'workers.before'} before
 * @property {'workers.after'} after
 * @property {'workers.result'} result
 */
export const workers = {
  before: 'workers.before',
  after: 'workers.after',
  result: 'workers.result',
};

/** for testing only! */
export function cleanDispatcher() {
  let event;
  for (event in test) {
    dispatcher.removeAllListeners(test[event]);
  }
  for (event in suite) {
    dispatcher.removeAllListeners(test[event]);
  }
  for (event in step) {
    dispatcher.removeAllListeners(test[event]);
  }
  for (event in all) {
    dispatcher.removeAllListeners(test[event]);
  }
}

/**
 * @namespace
 * @alias event
 */
/**
 * @type {NodeJS.EventEmitter}
 * @constant
 * @inner
 */
export { dispatcher };

/**
 * @param {string} event
 * @param {*} [param]
 */
export function emit(event, param) {
  let msg = `Emitted | ${event}`;
  if (param && param.toString()) {
    msg += ` (${param.toString()})`;
  }
  debug(msg);
  try {
    dispatcher.emit.apply(dispatcher, arguments);
  } catch (err) {
    output.output.error(`Error processing ${event} event:`);
    output.output.error(err.stack);
  }
}
