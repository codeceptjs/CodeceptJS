'use strict';
let output = require('./output');
let recorder = require('./recorder');
let container = require('./container');
let event = require('./event');

function within(context, fn) {
  recorder.add('register within wrapper', function () {

    recorder.session.start('within');
    let helpers = container.helpers();
    let locator = typeof context === 'object' ? JSON.stringify(context) : context;
    let addContextToStep = function (step) {
      step.prefix = `Within ${locator}: `;
    };

    event.dispatcher.on(event.step.after, addContextToStep);
    output.stepShift = 2;
    if (output.level() > 0) output.print(`   Within ${output.colors.yellow.bold(locator)}:`);
    Object.keys(helpers).forEach((helper) => {
      if (helpers[helper]._withinBegin) recorder.add('start within block', () => helpers[helper]._withinBegin(context));
    });

    fn();

    Object.keys(helpers).forEach((helper) => {
      if (helpers[helper]._withinEnd) recorder.add('finish within block', () => helpers[helper]._withinEnd());
    });

    recorder.add('restore session', () => {
      recorder.session.restore();
      output.stepShift = 1;
      event.dispatcher.removeListener(event.step.after, addContextToStep);
    });
    return recorder.promise();
  });
}

module.exports = within;
