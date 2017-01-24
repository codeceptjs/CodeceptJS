'use strict';
let event = require('./event');
let container = require('./container');
let recorder = require('./recorder');
let getParamNames = require('./utils').getParamNames;

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

  test.fn = function (done) {
    recorder.errHandler(function (err) {
      recorder.session.start('teardown');
      event.emit(event.test.failed, test, err);
      recorder.add(() => done(err));
    });

    try {
      event.emit(event.test.started, test);
      let res = testFn.apply(test, getInjectedArguments(testFn));
      if (isGenerator(testFn)) {
        try {
          res.next(); // running test
        } catch (err) {
          event.emit(event.test.failed, test, err);
          done(err);
          return test;
        }
        recorder.catch(); // catching possible errors in promises
        let resumeTest = function () {
          recorder.add('create new promises queue for generator', function (data) {
            recorder.session.start('generator'); // creating a new promise chain
            try {
              let resume = res.next(data);
              if (resume.done) {
                recorder.add('fire test.passed', () => event.emit(event.test.passed, test));
                recorder.add('finish generator with no error', () => done()); // finish him
              } else {
                resumeTest();
              }
            } catch (err) {
              recorder.throw(err); // catch error in test and rethrow into promise
            }
            recorder.catch(); // handle all errors in promise chain
          });
        };
        resumeTest();
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
  };
  return test;
};

/**
 * Injects arguments to function from controller
 */
module.exports.injected = function (fn, suite) {
  return function () {
    try {
      fn.apply(this, getInjectedArguments(fn));
    } catch (err) {
      recorder.throw(err);
    }
    recorder.catch((err) => {
      event.emit(event.test.failed, suite, err); // emit
      throw err;
    });
    return recorder.promise();
  };
};

/**
 * Starts promise chain, so helpers could enqueue their hooks
 */
module.exports.setup = function () {
  recorder.start();
  event.emit(event.test.before);
};

module.exports.teardown = function () {
  event.emit(event.test.after);
};

module.exports.suiteSetup = function () {
  recorder.start();
  event.emit(event.suite.before);
};

module.exports.suiteTeardown = function () {
  recorder.start();
  event.emit(event.suite.after);
};

function isGenerator(fn) {
  return fn.constructor.name === 'GeneratorFunction';
}

function getInjectedArguments(fn) {
  let testArguments = [];
  let params = getParamNames(fn) || [];
  let objects = container.support();
  for (var key in params) {
    let obj = params[key];
    if (!objects[obj]) {
      throw new Error(`Object of type ${obj} is not defined in container`);
    }
    testArguments.push(container.support(obj));
  }
  return testArguments;
}
