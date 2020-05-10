const { ClientFunction } = require('testcafe');

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { getParamNames } = require('../../utils');
const v4 = require('uuid').v4;

function getBasicTest(dir, name) {
  let basicTest =
    `import testControllerHolder from "${dir}/testControllerHolder.js";\

	fixture("Codecept+TestcafeFixture")

	test("${name}", testControllerHolder.capture)`;

  return basicTest;
}

function getTestWithRequestHooks(dir, name, requestLoggerSettings) {

  let filter = requestLoggerSettings.filter.predicate;
  let options = JSON.stringify(requestLoggerSettings.options).replace(/"/g, '');

  let instantHooks =
    `import { RequestHook } from 'testcafe'
			class RequestConsoleLogger extends RequestHook {
				async onRequest(event) {
				this.logSpecific(event);
			}

			async onResponse(event) {
				this.logSpecific(event);
			}

			async logSpecific(event) {
				const logObject = event._requestInfo;

				if (logObject) console.dir(JSON.stringify(logObject), { depth: null });
			}
		}`;

  let testWithHooks =
    `import testControllerHolder from "${dir}/testControllerHolder.js";

	${requestLoggerSettings.isInstant ? instantHooks : ''}

	fixture("Codecept+TestcafeFixture");

	test("${name}", testControllerHolder.capture).requestHooks(new RequestConsoleLogger([${filter}], ${options || 'null'}));`;

  return testWithHooks;
}

const createTestFile = (customTestName = 'fixture') => {
  assert(global.output_dir, 'global.output_dir must be set');

  const testFile = path.join(global.output_dir, `${v4()}_test.js`);
  const testControllerHolderDir = __dirname.replace(/\\/g, '/');
  let requestLoggerSettings = global.settings.helpers.TestCafe.RequestLogger;

  if (requestLoggerSettings) {
    fs.writeFileSync(testFile, getTestWithRequestHooks(testControllerHolderDir, customTestName, requestLoggerSettings));
  }
  else {
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
