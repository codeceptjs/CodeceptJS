const event = require('./event');
const recorder = require('./recorder');
const assertThrown = require('./assert/throws');
const { getParamNames, isAsyncFunction } = require('./utils');

const injectHook = function (inject, suite) {
  try {
    inject();
  } catch (err) {
    recorder.throw(err);
  }
  recorder.catch((err) => {
    event.emit(event.test.failed, suite, err);
    throw err;
  });
  return recorder.promise();
};

/**
 * Wraps test function, injects support objects from container,
 * starts promise chain with recorder, performs before/after hooks
 * through event system.
 */
module.exports.test = (test) => {
  const testFn = test.fn;
  if (!testFn) {
    return test;
  }

  test.steps = [];
  test.timeout(0);
  test.async = true;

  test.fn = function (done) {
    recorder.errHandler((err) => {
      recorder.session.start('teardown');
      recorder.cleanAsyncErr();
      if (test.throws) { // check that test should actually fail
        try {
          assertThrown(err, test.throws);
          event.emit(event.test.passed, test);
          event.emit(event.test.finished, test);
          recorder.add(() => done());
          return;
        } catch (newErr) {
          err = newErr;
        }
      }
      event.emit(event.test.failed, test, err);
      event.emit(event.test.finished, test);
      recorder.add(() => done(err));
    });

    if (isAsyncFunction(testFn)) {
      event.emit(event.test.started, test);
      testFn.apply(test, getInjectedArguments(testFn, test)).then((res) => {
        recorder.add('fire test.passed', () => {
          event.emit(event.test.passed, test);
          event.emit(event.test.finished, test);
        });
        recorder.add('finish test', () => done());
        recorder.catch();
      }).catch((e) => {
        recorder.throw(e);
        recorder.catch((e) => {
          const err = (recorder.getAsyncErr() === null) ? e : recorder.getAsyncErr();
          recorder.session.start('teardown');
          recorder.cleanAsyncErr();
          event.emit(event.test.failed, test, err);
          event.emit(event.test.finished, test);
          recorder.add(() => done(err));
        });
      });
      return;
    }
    try {
      event.emit(event.test.started, test);
      testFn.apply(test, getInjectedArguments(testFn, test));
    } catch (err) {
      recorder.throw(err);
    } finally {
      recorder.add('fire test.passed', () => {
        event.emit(event.test.passed, test);
        event.emit(event.test.finished, test);
      });
      recorder.add('finish test', () => done());
      recorder.catch();
    }
  };
  return test;
};

/**
 * Injects arguments to function from controller
 */
module.exports.injected = function (fn, suite, hookName) {
  return function (done) {
    const errHandler = (err) => {
      recorder.session.start('teardown');
      recorder.cleanAsyncErr();
      event.emit(event.test.failed, suite, err);
      if (hookName === 'after') event.emit(event.test.after, suite);
      if (hookName === 'afterSuite') event.emit(event.suite.after, suite);
      recorder.add(() => done(err));
    };

    recorder.errHandler((err) => {
      errHandler(err);
    });

    if (!fn) throw new Error('fn is not defined');

    event.emit(event.hook.started, suite);
    if (!recorder.isRunning()) {
      recorder.start();
      recorder.errHandler((err) => {
        errHandler(err);
      });
    }

    this.test.body = fn.toString();

    if (isAsyncFunction(fn)) {
      fn.apply(this, getInjectedArguments(fn)).then(() => {
        recorder.add('fire hook.passed', () => event.emit(event.hook.passed, suite));
        recorder.add(`finish ${hookName} hook`, () => done());
        recorder.catch();
      }).catch((e) => {
        recorder.throw(e);
        recorder.catch((e) => {
          const err = (recorder.getAsyncErr() === null) ? e : recorder.getAsyncErr();
          errHandler(err);
        });
        recorder.add('fire hook.failed', () => event.emit(event.hook.failed, suite, e));
      });
      return;
    }

    try {
      fn.apply(this, getInjectedArguments(fn));
      recorder.add('fire hook.passed', () => event.emit(event.hook.passed, suite));
      recorder.add(`finish ${hookName} hook`, () => done());
      recorder.catch();
    } catch (err) {
      recorder.throw(err);
      recorder.catch((e) => {
        const err = (recorder.getAsyncErr() === null) ? e : recorder.getAsyncErr();
        errHandler(err);
      });
      recorder.add('fire hook.failed', () => event.emit(event.hook.failed, suite, err));
    }
  };
};

/**
 * Starts promise chain, so helpers could enqueue their hooks
 */
module.exports.setup = function (suite) {
  return injectHook(() => {
    recorder.startUnlessRunning();
    event.emit(event.test.before, suite && suite.ctx && suite.ctx.currentTest);
  }, suite);
};

module.exports.teardown = function (suite) {
  return injectHook(() => {
    recorder.startUnlessRunning();
    event.emit(event.test.after, suite && suite.ctx && suite.ctx.currentTest);
  }, suite);
};

module.exports.suiteSetup = function (suite) {
  return injectHook(() => {
    recorder.startUnlessRunning();
    event.emit(event.suite.before, suite);
  }, suite);
};

module.exports.suiteTeardown = function (suite) {
  return injectHook(() => {
    recorder.startUnlessRunning();
    event.emit(event.suite.after, suite);
  }, suite);
};

const getInjectedArguments = (fn, test) => {
  const container = require('./container');
  const testArguments = [];
  const params = getParamNames(fn) || [];
  const objects = container.support();
  for (const key in params) {
    const obj = params[key];
    if (test && test.inject && test.inject[obj]) {
      testArguments.push(test.inject[obj]);
      continue;
    }
    if (!objects[obj]) {
      throw new Error(`Object of type ${obj} is not defined in container`);
    }
    testArguments.push(container.support(obj));
  }
  return testArguments;
};

module.exports.getInjectedArguments = getInjectedArguments;
