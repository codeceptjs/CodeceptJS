const output = require('./output');
const recorder = require('./recorder');
const container = require('./container');
const event = require('./event');
const Step = require('./step');
const { isGenerator, isAsyncFunction } = require('./utils');
const resumeTest = require('./scenario').resumeTest;

function within(context, fn) {
  const helpers = container.helpers();
  const locator = typeof context === 'object' ? JSON.stringify(context) : context;

  return recorder.add('register within wrapper', () => {
    const metaStep = new Step.MetaStep('Within', `"${locator}"`);
    const defineMetaStep = step => step.metaStep = metaStep;
    recorder.session.start('within');

    event.dispatcher.on(event.step.before, defineMetaStep);

    Object.keys(helpers).forEach((helper) => {
      if (helpers[helper]._withinBegin) recorder.add(`[${helper}] start within`, () => helpers[helper]._withinBegin(context));
    });

    const finalize = () => {
      event.dispatcher.removeListener(event.step.before, defineMetaStep);
      recorder.add('Finalize session within session', () => {
        output.stepShift = 1;
        recorder.session.restore('within');
      });
    };
    const finishHelpers = () => {
      Object.keys(helpers).forEach((helper) => {
        if (helpers[helper]._withinEnd) recorder.add(`[${helper}] finish within`, () => helpers[helper]._withinEnd());
      });
    };

    if (isAsyncFunction(fn)) {
      return fn().then((res) => {
        finishHelpers();
        finalize();
        return recorder.promise().then(() => res);
      }).catch((e) => {
        finalize();
        recorder.throw(e);
      });
    }

    let res;
    try {
      res = fn.apply();
      if (isGenerator(fn)) {
        try {
          res.next();
        } catch (err) {
          recorder.throw(err);
        }
        recorder.catch((err) => {
          output.stepShift = 1;
          throw err;
        }); // catching possible errors in promises
        resumeTest(res, () => {
          finishHelpers();
        }, (err) => {
          output.stepShift = 1;
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
          throw err;
        });
      }
    }
    finalize();
    return recorder.promise().then(() => res);
  });
}

module.exports = within;
