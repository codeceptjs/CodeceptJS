const output = require('./output');
const store = require('./store');
const recorder = require('./recorder');
const container = require('./container');
const event = require('./event');
const Step = require('./step');
const { isAsyncFunction } = require('./utils');

/**
 * @param {CodeceptJS.LocatorOrString}  context
 * @param {Function}  fn
 * @return {Promise<*> | undefined}
 */
function within(context, fn) {
  const helpers = store.dryRun ? {} : container.helpers();
  const locator = typeof context === 'object' ? JSON.stringify(context) : context;

  return recorder.add('register within wrapper', () => {
    const metaStep = new Step.MetaStep('Within', `"${locator}"`);
    const defineMetaStep = step => step.metaStep = metaStep;
    recorder.session.start('within');

    event.dispatcher.prependListener(event.step.before, defineMetaStep);

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
      res = fn();
    } catch (err) {
      recorder.throw(err);
    } finally {
      finishHelpers();
      recorder.catch((err) => {
        output.stepShift = 1;
        throw err;
      });
    }
    finalize();
    return recorder.promise().then(() => res);
  }, false, false);
}

module.exports = within;
