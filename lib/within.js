
const output = require('./output');
const recorder = require('./recorder');
const container = require('./container');
const event = require('./event');
const isGenerator = require('./utils').isGenerator;
const resumeTest = require('./scenario').resumeTest;

function within(context, fn) {
  recorder.add('register within wrapper', () => {
    recorder.session.start('within');
    const helpers = container.helpers();
    const locator = typeof context === 'object' ? JSON.stringify(context) : context;
    const addContextToStep = function (step) {
      step.prefix = `Within ${locator}: `;
    };

    event.dispatcher.on(event.step.after, addContextToStep);
    output.stepShift = 2;
    if (output.level() > 0) output.print(`   Within ${output.colors.yellow.bold(locator)}:`);
    Object.keys(helpers).forEach((helper) => {
      if (helpers[helper]._withinBegin) recorder.add('start within block', () => helpers[helper]._withinBegin(context));
    });


    try {
      const res = fn.apply();
      if (isGenerator(fn)) {
        try {
          res.next();
        } catch (err) {
          recorder.throw(err);
        }
        recorder.catch((err) => {
          output.stepShift = 1;
          event.dispatcher.removeListener(event.step.after, addContextToStep);
          throw err;
        }); // catching possible errors in promises
        resumeTest(res, () => {
          Object.keys(helpers).forEach((helper) => {
            if (helpers[helper]._withinEnd) recorder.add('finish within block', () => helpers[helper]._withinEnd());
          });
          recorder.add('Finalize session within_generator', () => {
            recorder.session.restore('within');
          });
        }, (err) => {
          output.stepShift = 1;
          event.dispatcher.removeListener(event.step.after, addContextToStep);
          throw err;
        }, true);
      }
    } catch (err) {
      recorder.throw(err);
    } finally {
      if (!isGenerator(fn)) {
        Object.keys(helpers).forEach((helper) => {
          if (helpers[helper]._withinEnd) recorder.add('finish within block', () => helpers[helper]._withinEnd());
        });
        recorder.catch((err) => {
          output.stepShift = 1;
          event.dispatcher.removeListener(event.step.after, addContextToStep);
          throw err;
        });
      }
    }
    recorder.add('Finalize within session', () => {
      recorder.session.restore('within');
      output.stepShift = 1;
      event.dispatcher.removeListener(event.step.after, addContextToStep);
    });
    return recorder.promise();
  });
}

module.exports = within;
