'use strict';
let event = require('./event');
let container = require('./container');
let recorder = require('./recorder');
let getParamNames = require('./utils').getParamNames;
let isGenerator = require('./utils').isGenerator;


var resumeTest = module.exports.resumeTest = function(res, done, error, returnStatement) {
  recorder.add('create new promises queue for generator', function(data) {
    recorder.session.start('generator'); // creating a new promise chain
    try {
      let resume = res.next(data);
      if (resume.done) {
        done();
      } else {
        resumeTest(res, done, error, returnStatement);
      }
    } catch (err) {
      recorder.throw(err); // catch error in test and rethrow into promise
    }
    recorder.catch(error); // handle all errors in promise chain
    if (returnStatement) {
      return recorder.promise();
    }
  });
};

var injectHook = function(inject, suite) {
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
  let testFn = test.fn;
  if (!testFn) {
    return test;
  }

  test.steps = [];

  test.fn = function(done) {
    recorder.errHandler(function(err) {
      recorder.session.start('teardown');
      event.emit(event.test.failed, test, err);
      recorder.add(() => done(err));
    });

    process.on('unhandledRejection', (reason, p) => {
      console.log('Unhandled Rejection at: Promise', p, 'reason:', reason.stack);
      // application specific logging, throwing an error, or other logic here
    });

    if (testFn[Symbol.toStringTag] === 'AsyncFunction') {
      event.emit(event.test.started, test);
      testFn.apply(test, getInjectedArguments(testFn, test)).then((res) => {
        recorder.add('fire test.passed', () => event.emit(event.test.passed, test));
        recorder.add('finish test', () => done());
        recorder.catch();
      }).catch(e => {
        console.log('scenario', e)
        recorder.saveFirstAsyncError(e)
        recorder.session.start('teardown');
        event.emit(event.test.failed, test, recorder.getAsyncErr());
        recorder.add(() => done(recorder.getAsyncErr()));
      })
    } else {
      try {
        event.emit(event.test.started, test);
        let res = testFn.apply(test, getInjectedArguments(testFn, test));
        if (isGenerator(testFn)) {
          try {
            res.next(); // running test
          } catch (err) {
            event.emit(event.test.failed, test, err);
            done(err);
            return test;
          }
          recorder.catch(); // catching possible errors in promises
          resumeTest(res, () => {
            recorder.add('fire test.passed', () => event.emit(event.test.passed, test));
            recorder.add('finish generator with no error', () => done()); // finish him
          });
        }
      } catch (err) {
        recorder.throw(err);
      } finally {
        if (!isGenerator(testFn)) {
          recorder.add('fire test.passed', () => event.emit(event.test.passed, test));
          recorder.add('finish test', () => done());
          recorder.catch();
        }
      }
    }
  };
  return test;
};

/**
 * Injects arguments to function from controller
 */
module.exports.injected = function(fn, suite, hookName) {
  return function(done) {
    recorder.errHandler(function(err) {
      recorder.session.start('teardown');
      event.emit(event.test.failed, suite, err);
      if (hookName === 'after') event.emit(event.test.after, suite);
      if (hookName === 'afterSuite') event.emit(event.suite.after, suite);
      recorder.add(() => done(err));
    });

    if (fn[Symbol.toStringTag] === 'AsyncFunction') {
      event.emit(event.hook.started, suite);
      recorder.startUnlessRunning();
      this.test.body = fn.toString();
      fn.apply(this, getInjectedArguments(fn)).then(() => {
        recorder.add('fire hook.passed', () => event.emit(event.hook.passed, suite));
        recorder.add(`finish ${hookName} hook`, () => done());
        recorder.catch();
      }).catch(e => {
        recorder.saveFirstAsyncError(e)
        recorder.session.start('teardown');
        event.emit(event.test.failed, suite, recorder.getAsyncErr());
        if (hookName === 'after') event.emit(event.test.after, suite);
        if (hookName === 'afterSuite') event.emit(event.suite.after, suite);
        recorder.add(() => done(recorder.getAsyncErr()));
      });
    } else {
      try {
        event.emit(event.hook.started, suite);
        recorder.startUnlessRunning();
        this.test.body = fn.toString();
        let res = fn.apply(this, getInjectedArguments(fn));
        if (isGenerator(fn)) {
          try {
            res.next(); // running test
          } catch (err) {
            event.emit(event.test.failed, event.test, err);
            done(err);
          }
          recorder.catch(); // catching possible errors in promises
          resumeTest(res, () => {
            recorder.add('fire hook.passed', () => event.emit(event.hook.passed, suite));
            recorder.add(`finish ${hookName} hook`, () => done());
          });
        }
      } catch (err) {
        recorder.throw(err);
      } finally {
        if (!isGenerator(fn)) {
          recorder.add('fire hook.passed', () => event.emit(event.hook.passed, suite));
          recorder.add(`finish ${hookName} hook`, () => done());
          recorder.catch();
        }
      }
    }
  };
};

/**
 * Starts promise chain, so helpers could enqueue their hooks
 */
module.exports.setup = function(suite) {
  return injectHook(() => {
    recorder.startUnlessRunning();
    event.emit(event.test.before);
  }, suite);
};

module.exports.teardown = function(suite) {
  return injectHook(() => {
    recorder.startUnlessRunning();
    event.emit(event.test.after);
  }, suite);
};

module.exports.suiteSetup = function(suite) {
  return injectHook(() => {
    recorder.startUnlessRunning();
    event.emit(event.suite.before, suite);
  }, suite);
};

module.exports.suiteTeardown = function(suite) {
  return injectHook(() => {
    recorder.startUnlessRunning();
    event.emit(event.suite.after, suite);
  }, suite);
};

function getInjectedArguments(fn, test) {
  let testArguments = [];
  let params = getParamNames(fn) || [];
  let objects = container.support();
  for (var key in params) {
    let obj = params[key];
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
}
