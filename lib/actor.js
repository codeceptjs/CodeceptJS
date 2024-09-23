import { Step, MetaStep } from './step.js';
import container from './container.js';
import { methodsOfObject } from './utils.js';
import recorder from './recorder.js';
import * as event from './event.js';
import { store } from './store.js';
import * as output from './output.js';

/**
 * @interface
 * @alias ActorStatic
 */
export class Actor {
  /**
   * Print the comment on log. Also, adding a step in the `Test.steps` object
   * @param {string} msg
   * @param {string} color
   * @inner
   *
   * ⚠️ returns a promise which is synchronized internally by recorder
   */
  async say(msg, color = 'cyan') {
    const step = new Step('say', 'say');
    step.status = 'passed';
    return recordStep(step, [msg]).then(() => {
      // this is backward compatibility as this event may be used somewhere
      event.emit(event.step.comment, msg);
      output.say(msg, `${color}`);
    });
  }

  /**
   * set the maximum execution time for the next step
   * @function
   * @param {number} timeout - step timeout in seconds
   * @return {this}
   * @inner
   */
  limitTime(timeout) {
    if (!store.timeouts) return this;

    event.dispatcher.prependOnceListener(event.step.before, (step) => {
      output.output.log(`Timeout to ${step}: ${timeout}s`);
      step.setTimeout(timeout * 1000, Step.TIMEOUT_ORDER.codeLimitTime);
    });

    return this;
  }

  /**
   * @function
   * @param {*} [opts]
   * @return {this}
   * @inner
   */
  retry(opts) {
    if (opts === undefined) opts = 1;
    recorder.retry(opts);
    // remove retry once the step passed
    recorder.add(() => event.dispatcher.once(event.step.finished, () => recorder.retries.pop()));
    return this;
  }
}

/**
 * Fetches all methods from all enabled helpers,
 * and makes them available to use from I. object
 * Wraps helper methods into promises.
 * @ignore
 */
// eslint-disable-next-line import/prefer-default-export
export function actor(obj = {}) {
  if (!store.actor) {
    store.actor = new Actor();
  }
  const actor = store.actor;

  const translation = container.translation();

  if (Object.keys(obj).length > 0) {
    Object.keys(obj)
      .forEach(action => {
        const actionAlias = translation.actionAliasFor(action);

        const currentMethod = obj[action];
        const ms = new MetaStep('I', action);
        if (translation.loaded) {
          ms.name = actionAlias;
          ms.actor = translation.I;
        }
        ms.setContext(actor);
        actor[action] = actor[actionAlias] = ms.run.bind(ms, currentMethod);
      });
  }

  const helpers = container.helpers();

  // add methods from enabled helpers
  Object.values(helpers)
    .forEach((helper) => {
      methodsOfObject(helper, 'Helper')
        .filter(method => method !== 'constructor' && method[0] !== '_')
        .forEach((action) => {
          const actionAlias = translation.actionAliasFor(action);
          if (!actor[action]) {
            actor[action] = actor[actionAlias] = function () {
              const step = new Step(helper, action);
              if (translation.loaded) {
                step.name = actionAlias;
                step.actor = translation.I;
              }
              // add methods to promise chain
              return recordStep(step, Array.from(arguments));
            };
          }
        });
    });

  return actor;
}

export function recordStep(step, args) {
  step.status = 'queued';
  step.setArguments(args);

  // run async before step hooks
  event.emit(event.step.before, step);

  const task = `${step.name}: ${step.humanizeArgs()}`;
  let val;

  // run step inside promise
  recorder.add(task, () => {
    if (!step.startTime) { // step can be retries
      event.emit(event.step.started, step);
      step.startTime = Date.now();
    }
    return val = step.run(...args);
  }, false, undefined, step.getTimeout());

  event.emit(event.step.after, step);

  recorder.add('step passed', () => {
    step.endTime = Date.now();
    event.emit(event.step.passed, step, val);
    event.emit(event.step.finished, step);
  });

  recorder.catchWithoutStop((err) => {
    step.status = 'failed';
    step.endTime = Date.now();
    event.emit(event.step.failed, step);
    event.emit(event.step.finished, step);
    throw err;
  });

  recorder.add('return result', () => val);
  // run async after step hooks

  return recorder.promise();
}
