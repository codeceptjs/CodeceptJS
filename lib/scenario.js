const event = require('./event');
const container = require('./container');
const recorder = require('./recorder');
const { getParamNames, isGenerator, isAsyncFunction } = require('./utils');
const transpile = require('./transpile');

const resumeTest = function (res, done, error, returnStatement) {
  recorder.add('create new promises queue for generator', (data) => {
    recorder.session.start('generator'); // creating a new promise chain
    try {
      const resume = res.next(data);
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

module.exports.resumeTest = resumeTest;

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

  test.fn = function (done) {
    recorder.errHandler((err) => {
      recorder.session.start('teardown');
      recorder.cleanAsyncErr();
      event.emit(event.test.failed, test, err);
      recorder.add(() => done(err));
    });

    if (isAsyncFunction(testFn)) {
      event.emit(event.test.started, test);
      testFn.apply(test, getInjectedArguments(testFn, test)).then((res) => {
        recorder.add('fire test.passed', () => event.emit(event.test.passed, test));
        recorder.add('finish test', () => done());
        recorder.catch();
      }).catch((e) => {
        const err = (recorder.getAsyncErr() === null) ? e : recorder.getAsyncErr();
        recorder.session.start('teardown');
        recorder.cleanAsyncErr();
        event.emit(event.test.failed, test, err);
        recorder.add(() => done(err));
      });
      return;
    }
    try {
      event.emit(event.test.started, test);
      const res = testFn.apply(test, getInjectedArguments(testFn, test));
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
  };
  return test;
};

/**
 * Injects arguments to function from controller
 */
module.exports.injected = function (fn, suite, hookName) {
  return function (done) {
    recorder.errHandler((err) => {
      recorder.session.start('teardown');
      recorder.cleanAsyncErr();
      event.emit(event.test.failed, suite, err);
      if (hookName === 'after') event.emit(event.test.after, suite);
      if (hookName === 'afterSuite') event.emit(event.suite.after, suite);
      recorder.add(() => done(err));
    });

    if (isAsyncFunction(fn)) {
      event.emit(event.hook.started, suite);
      recorder.startUnlessRunning();
      this.test.body = fn.toString();
      fn.apply(this, getInjectedArguments(fn, suite, hookName)).then(() => {
        recorder.add('fire hook.passed', () => event.emit(event.hook.passed, suite));
        recorder.add(`finish ${hookName} hook`, () => done());
        recorder.catch();
      }).catch((e) => {
        const err = (recorder.getAsyncErr() === null) ? e : recorder.getAsyncErr();
        recorder.session.start('teardown');
        recorder.cleanAsyncErr();
        event.emit(event.test.failed, suite, err);
        if (hookName === 'after') event.emit(event.test.after, suite);
        if (hookName === 'afterSuite') event.emit(event.suite.after, suite);
        recorder.add(() => done(err));
      });
      return;
    }

    try {
      event.emit(event.hook.started, suite);
      recorder.startUnlessRunning();
      this.test.body = fn.toString();
      const res = fn.apply(this, getInjectedArguments(fn, suite, hookName));
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
  };
};

/**
 * Starts promise chain, so helpers could enqueue their hooks
 */
module.exports.setup = function (suite) {
  return injectHook(() => {
    recorder.startUnlessRunning();
    event.emit(event.test.before);
  }, suite);
};

module.exports.teardown = function (suite) {
  return injectHook(() => {
    recorder.startUnlessRunning();
    event.emit(event.test.after);
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

function getInjectedArguments(fn, test, hookName) {
  const testArguments = [];
  if (transpile.status()) {
    const esprima = require('esprima');
    const escodegen = require('escodegen');
    const babel = require('babel-core');
    const fs = require('fs');
    const data = fs.readFileSync(test.file, 'utf8');
    const transformReact = babel.transform(data, {
      presets: ['es2015'],
      plugins: ['transform-react-jsx']
    });
    const parsed = esprima.parse(transformReact.code);
    if (hookName) {
      parsed.body.forEach((parse) => {
        if (parse.type === 'ExpressionStatement' && parse.expression && parse.expression.callee &&
          parse.expression.callee.name && parse.expression.callee.name.toLowerCase() === hookName) {
          const testFunction = parse.expression.arguments[0];
          const testCode = escodegen.generate(testFunction);
          test.ctx.test.body = testCode.toString();
          const args = testFunction.params ? testFunction.params : testFunction.arguments[0].params;
          args.forEach((arg) => {
            testArguments.push(container.support(arg.name));
          });
        }
      });
    } else {
      const testName = test.title;
      parsed.body.forEach((parse) => {
        if (parse.type === 'ExpressionStatement' && parse.expression && parse.expression.callee &&
          parse.expression.callee.name && parse.expression.callee.name === 'Scenario' &&
          parse.expression.arguments[0].value === testName) {
          const testFunction = parse.expression.arguments[1].type === 'FunctionExpression' ?
            parse.expression.arguments[1] : parse.expression.arguments[2];
          const testCode = escodegen.generate(testFunction);
          test.body = testCode.toString();
          const args = testFunction.params ? testFunction.params : testFunction.arguments[0].params;
          args.forEach((arg) => {
            testArguments.push(container.support(arg.name));
          });
        }
        if (parse.type === 'ExpressionStatement' && parse.expression && parse.expression.callee &&
          parse.expression.callee.property && parse.expression.callee.property.name === 'Scenario' &&
          parse.expression.callee.object && parse.expression.callee.object.callee &&
          parse.expression.callee.object.callee.name === 'Data' &&
          testName.indexOf(`${parse.expression.arguments[0].value} |`) === 0) {
          const testFunction = parse.expression.arguments[1].type === 'FunctionExpression' ?
            parse.expression.arguments[1] : parse.expression.arguments[1].arguments[0];
          const testCode = escodegen.generate(testFunction);
          test.body = testCode.toString();
          const args = testFunction.params ? testFunction.params : testFunction.arguments[0].params;
          args.forEach((arg) => {
            if (arg.name !== 'current') {
              testArguments.push(container.support(arg.name));
            } else {
              testArguments.push(test.inject.current);
            }
          });
        }
      });
    }
  } else {
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
  }
  return testArguments;
}
