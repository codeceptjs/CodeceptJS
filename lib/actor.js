const Step = require('./step');
const { MetaStep } = require('./step');
const container = require('./container');
const methodsOfObject = require('./utils').methodsOfObject;
const recorder = require('./recorder');
const event = require('./event');
const output = require('./output');

class Actor {
  /**
   * add print comment method`
   * @param {string} msg
   * @param {string} color
   * @return {Promise<any> | undefined}
   * @inner
   */
  say(msg, color = 'cyan') {
    return recorder.add(`say ${msg}`, () => {
      event.emit(event.step.comment, msg);
      output.say(msg, `${color}`);
    });
  }

  /**
   * @function
   * @param {*} opts
   * @return {this}
   * @inner
   */
  retry(opts) {
    if (opts === undefined) opts = 1;
    recorder.retry(opts);
    // adding an empty promise to clear retries
    recorder.add(() => null);
    // remove retry once the step passed
    recorder.add(() => event.dispatcher.once(event.step.finished, () => recorder.retries.pop()));
    return this;
  }
}

const actor = new Actor();

/**
 * Fetches all methods from all enabled helpers,
 * and makes them available to use from I. object
 * Wraps helper methods into promises.
 * @ignore
 */
module.exports = function (obj) {
  /**
   * @interface
   * @alias ActorStatic
   */
  obj = obj || {};


  if (Object.keys(obj).length > 0) {
    Object.keys(obj)
      .forEach(action => {
        const actionAlias = container.translation().actionAliasFor(action);

        const currentMethod = obj[action];
        const ms = new MetaStep('I', action);
        if (container.translation().loaded) {
          ms.name = actionAlias;
          ms.actor = container.translation().I;
        }
        actor[action] = actor[actionAlias] = ms.run.bind(ms, currentMethod, actor);
      });
  }

  const helpers = container.helpers();

  // add methods from enabled helpers
  Object.keys(helpers)
    .map(key => helpers[key])
    .forEach((helper) => {
      methodsOfObject(helper, 'Helper')
        .filter(method => method !== 'constructor' && method[0] !== '_')
        .forEach((action) => {
          const actionAlias = container.translation().actionAliasFor(action);
          if (!actor[action]) {
            actor[action] = actor[actionAlias] = function () {
              const step = new Step(helper, action);
              if (container.translation().loaded) {
                step.name = actionAlias;
                step.actor = container.translation().I;
              }
              // add methods to promise chain
              return recordStep(step, Array.from(arguments));
            };
          }
        });
    });

  return actor;
};

function recordStep(step, args) {
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
  });

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
