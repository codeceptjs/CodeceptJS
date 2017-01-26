'use strict';
let Step = require('./step');
let container = require('./container');
let methodsOfObject = require('./utils').methodsOfObject;
let recorder = require('./recorder');
let event = require('./event');
let output = require('./output');

/**
 * Fetches all methods from all enabled helpers,
 * and makes them available to use from I. object
 * Wraps helper methods into promises.
 */
module.exports = function (obj) {
  obj = obj || {};

  let helpers = container.helpers();

  // add methods from enabled helpers
  Object.keys(helpers)
    .map((key) => helpers[key])
    .forEach((helper) => {
      methodsOfObject(helper, 'Helper')
      .filter((method) => {
        return method !== 'constructor' && method[0] !== '_';
      })
      .forEach((action) => {
        let actionAlias = container.translation().actionAliasFor(action);

        obj[action] = obj[actionAlias] = function () {
          let step = new Step(helper, action);
          if (container.translation().loaded) {
            step.name = actionAlias;
            step.actor = container.translation().I;
          }
          // add methods to promise chain
          return recordStep(step, Array.prototype.slice.call(arguments));
        };
      });
    });

  // add print comment method`
  obj.say = (msg) => recorder.add(`say ${msg}`, () => output.say(msg));

  return obj;
};

function recordStep(step, args) {
  step.status = 'queued';
  step.setArguments(args);

  // run async before step hooks
  event.emit(event.step.before, step);

  let task = `${step.name}: ${step.humanizeArgs()}`;
  let val;

  // run step inside promise
  recorder.add(task, () => {
    event.emit(event.step.started, step);
    val = step.run.apply(step, args);
  });

  // run async after step hooks
  event.emit(event.step.after, step);

  // ensure step result is passed to next step
  recorder.add('return step result', () => val);
  return recorder.promise();
}
