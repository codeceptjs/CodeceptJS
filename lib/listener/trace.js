'use strict';

let event = require('../event');
let AssertionFailedError = require('../assert/error');
let output = require('../output');
let ucfirst = require('../utils').ucfirst;

event.dispatcher.on(event.test.failed, function (test, err) {
  let msg = err.message;
  if (err instanceof AssertionFailedError) {
    msg = err.message = err.inspect();
  }
  let steps = test.steps;
  if (steps && steps.length) {
    let scenarioTrace = "";
    steps.reverse().forEach((step, i) => {
      let line = `- ${step.toCode()} ${step.line()}`;
      // if (step.status === 'failed') line = '' + line;
      scenarioTrace += "\n" + line;
    });
    msg += `\n\nScenario Steps:\n${scenarioTrace}\n\n`;
  }

  if (output.level() < 3) {
    err.stack = ''; // hide internal error stack trace in non-verbose mode
  }

  err.stack = msg + err.stack;
  test.err = err;
});
