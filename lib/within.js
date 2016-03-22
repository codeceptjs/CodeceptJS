'use strict';
let output = require('./output');
let recorder = require('./recorder');
let container = require('./container');
let event = require('./event');

function within(context, fn) {
  recorder.add(function () {

    recorder.session.start();
    let helpers = container.helpers();
    let locator = typeof context === 'object' ? JSON.parse(context) : context;
    let addContextToStep = function (step) {
      step.prefix = output.colors.grey.bold(`Within ${locator}: `);
    }

    event.dispatcher.on(event.step.after, addContextToStep);
    output.stepShift = 2;
    if (output.level() > 0) output.print(`   Within ${output.colors.yellow.bold(locator)}:`);
    Object.keys(helpers).forEach((helper) => {
      if (helpers[helper]._withinBegin) recorder.add(() => helpers[helper]._withinBegin(context));
    });

    fn();

    Object.keys(helpers).forEach((helper) => {
      if (helpers[helper]._withinEnd) recorder.add(() => helpers[helper]._withinEnd());
    });

    recorder.add(() => recorder.session.restore());
    recorder.add(() => event.dispatcher.removeListener(event.step.after, addContextToStep));
    recorder.add(() => output.stepShift = 1);
    return recorder.promise();
  });
}

module.exports = within;
