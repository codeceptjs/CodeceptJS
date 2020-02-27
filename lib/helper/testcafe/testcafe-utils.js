const { ClientFunction } = require('testcafe');

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { getParamNames } = require('../../utils');

function getBasicTest(dir, name) {
  const basicTest =
    `import testControllerHolder from "${dir}/testControllerHolder.js";\n\n
		fixture("${name}")\n
		test\n
		("test", testControllerHolder.capture)`;

  return basicTest;
}

function getTestWithRequestHooks(dir, name, requestLoggerSettings) {
  const filter = requestLoggerSettings.filter.predicate;
  const options = JSON.stringify(requestLoggerSettings.options).replace(/"/g, '');

  let instantHooks =
    `
    const { output } = require('codeceptjs-sravniru');
	  const { MetaStep } = require('codeceptjs-sravniru/lib/step');
	  const hookedLogger = (message) => {
      let stepshift = output.stepShift;
      output.stepShift = 3;
      output.step(new MetaStep(\`[Requests]: \`, message));
      output.stepShift = stepshift;
	  };

    const logger = RequestLogger(${filter}, ${options || 'null'});\n
		function logRequests(logger) {
		const handler = {
			set(target, key, value) {
				hookedLogger(JSON.stringify(value));
				target[key] = value;
				return true;
				}
			};
			logger._internalRequests = new Proxy(logger._internalRequests, handler);
		}
		logRequests(logger);\n`;

  const testWithHooks =
    `import testControllerHolder from "${dir}/testControllerHolder.js";\n\n
		import { RequestLogger } from 'testcafe'\n
		${requestLoggerSettings.isInstant ? instantHooks : ''}
		fixture("${name}")\n
		test.requestHooks(logger)\n
		("test", testControllerHolder.capture)`;

  return testWithHooks;
}

const createTestFile = (customTestName = 'fixture') => {
  assert(global.output_dir, 'global.output_dir must be set');

  const testFile = path.join(global.output_dir, `${Date.now()}_test.js`);
  const testControllerHolderDir = __dirname.replace(/\\/g, '/');
  const requestLoggerSettings = global.settings.helpers.TestCafe.RequestLogger;

  if (requestLoggerSettings) {
    fs.writeFileSync(testFile, getTestWithRequestHooks(testControllerHolderDir, customTestName, requestLoggerSettings));
  } else {
    fs.writeFileSync(testFile, getBasicTest(testControllerHolderDir, customTestName, requestLoggerSettings));
  }

  return testFile;
};

// TODO Better error mapping (actual, expected)
const mapError = (testcafeError) => {
  // console.log('TODO map error better', JSON.stringify(testcafeError, null, 2));
  if (testcafeError.errMsg) {
    throw new Error(testcafeError.errMsg);
  }
  const errorInfo = `${testcafeError.callsite ? JSON.stringify(testcafeError.callsite) : ''} ${testcafeError.apiFnChain || JSON.stringify(testcafeError)}`;
  throw new Error(`TestCafe Error: ${errorInfo}`);
};


function createClientFunction(func, args) {
  if (!args || !args.length) {
    return ClientFunction(func);
  }
  const paramNames = getParamNames(func);
  const dependencies = {};
  paramNames.forEach((param, i) => dependencies[param] = args[i]);

  return ClientFunction(getFuncBody(func), { dependencies });
}

function getFuncBody(func) {
  let fnStr = func.toString();
  const arrowIndex = fnStr.indexOf('=>');
  if (arrowIndex >= 0) {
    fnStr = fnStr.slice(arrowIndex + 2);
    // eslint-disable-next-line no-new-func
    // eslint-disable-next-line no-eval
    return eval(`() => ${fnStr}`);
  }
  // TODO: support general functions
}

module.exports = {
  createTestFile,
  mapError,
  createClientFunction,
};
