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


    try {
      let res = fn.apply();
      if (isGenerator(fn)) {
        try {
          res.next();
        } catch (err) {
          event.emit(event.test.failed, test, err);
          recorder.throw(err);
        }
        recorder.catch((err) => {
          output.stepShift = 1;
          event.dispatcher.removeListener(event.step.after, addContextToStep);
          throw err;
        }); // catching possible errors in promises
        let resumeTest = function () {
          recorder.add('create new promises queue for within generator', function (data) {
            recorder.session.start('within_generator'); // creating a new promise chain
            try {
              let resume = res.next(data);
              if (resume.done) {
                Object.keys(helpers).forEach((helper) => {
                  if (helpers[helper]._withinEnd) recorder.add('finish within block', () => helpers[helper]._withinEnd());
                });
                recorder.add('Finalize session within_generator', () => {
                  recorder.session.restore('within_generator');
                });
              } else {
                resumeTest();
              }
            } catch (err) {
              recorder.throw(err); // catch error in test and rethrow into promise
            }
            recorder.catch((err) => {
              output.stepShift = 1;
              event.dispatcher.removeListener(event.step.after, addContextToStep);
              throw err;
            }); // catching possible errors in promises
            return recorder.promise();
          });
        };
        resumeTest();
      }
    } catch (err) {
      recorder.throw(err);
    } finally {
      if (!isGenerator(fn)) {
        Object.keys(helpers).forEach((helper) => {
          if (helpers[helper]._withinEnd) recorder.add('finish within block', () => helpers[helper]._withinEnd());
        });
        recorder.catch((err) => {
          throw err;
        });
      }
    }
    recorder.add('Finilize within session', () => {
      recorder.session.restore('within');
      output.stepShift = 1;
      event.dispatcher.removeListener(event.step.after, addContextToStep);
    });
    return recorder.promise();
  });
}

function isGenerator(fn) {
  return fn.constructor.name === 'GeneratorFunction';
}

module.exports = within;
