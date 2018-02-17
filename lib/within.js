const output = require('./output');
const recorder = require('./recorder');
const container = require('./container');
const event = require('./event');
const { isGenerator, isAsyncFunction } = require('./utils');
const resumeTest = require('./scenario').resumeTest;

function within(context, fn) {
  const helpers = container.helpers();
  const locator = typeof context === 'object' ? JSON.stringify(context) : context;
  const addContextToStep = function (step) {
    step.prefix = `Within ${locator}: `;
  };

  recorder.add('register within wrapper', () => {
    recorder.session.start('within');

    event.dispatcher.on(event.step.after, addContextToStep);
    output.stepShift = 2;
    if (output.level() > 0) output.print(`   Within ${output.colors.yellow.bold(locator)}:`);

    Object.keys(helpers).forEach((helper) => {
      if (helpers[helper]._withinBegin) recorder.add(`[${helper}] start within`, () => helpers[helper]._withinBegin(context));
    });

    const finalize = () => {
      recorder.add('Finalize session within session', () => {
        output.stepShift = 1;
        event.dispatcher.removeListener(event.step.after, addContextToStep);
        recorder.session.restore('within');
      });
    };
    const finishHelpers = () => {
      Object.keys(helpers).forEach((helper) => {
        if (helpers[helper]._withinEnd) recorder.add(`[${helper}] finish within`, () => helpers[helper]._withinEnd());
      });
    };

    if (isAsyncFunction(fn)) {
      return fn().then(() => {
        finishHelpers();
        finalize();
        return recorder.promise();
      }).catch((e) => {
        finalize();
        recorder.throw(e);
      });
    }

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
          finishHelpers();
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
        finishHelpers();
        recorder.catch((err) => {
          output.stepShift = 1;
          event.dispatcher.removeListener(event.step.after, addContextToStep);
          throw err;
        });
      }
    }
    finalize();
    return recorder.promise();
  });
}

module.exports = within;
