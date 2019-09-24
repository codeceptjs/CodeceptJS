const Step = require('./step');
const container = require('./container');
const methodsOfObject = require('./utils').methodsOfObject;
const recorder = require('./recorder');
const event = require('./event');
const output = require('./output');

/**
 * Fetches all methods from all enabled helpers,
 * and makes them available to use from I. object
 * Wraps helper methods into promises.
 */
module.exports = function (obj) {
  obj = obj || {};

  const helpers = container.helpers();

  // add methods from enabled helpers
  Object.keys(helpers)
    .map(key => helpers[key])
    .forEach((helper) => {
      methodsOfObject(helper, 'Helper')
        .filter(method => method !== 'constructor' && method[0] !== '_')
        .forEach((action) => {
          const actionAlias = container.translation().actionAliasFor(action);

          obj[action] = obj[actionAlias] = function () {
            const step = new Step(helper, action);
            if (container.translation().loaded) {
              step.name = actionAlias;
              step.actor = container.translation().I;
            }
            // add methods to promise chain
            return recordStep(step, Array.from(arguments));
          };
        });
    });

  // add print comment method`
  obj.say = (msg, color = 'cyan') => recorder.add(`say ${msg}`, () => {
    event.emit(event.step.comment, msg);
    output.say(msg, `${color}`);
  });
  obj.retry = retryStep;

  return obj;
};

function retryStep(opts) {
  if (opts === undefined) opts = 1;
  recorder.retry(opts);
  // adding an empty promise to clear retries
  recorder.add(_ => null);
  // remove retry once the step passed
  recorder.add(_ => event.dispatcher.once(event.step.finished, _ => recorder.retries.pop()));
  return this;
}

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
