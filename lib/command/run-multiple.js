const getConfig = require('./utils').getConfig;
const getTestRoot = require('./utils').getTestRoot;
const fail = require('./utils').fail;
const deepMerge = require('./utils').deepMerge;
const Codecept = require('../codecept');
const Config = require('../config');
const fork = require('child_process').fork;
const output = require('../output');
const path = require('path');
const runHook = require('../hooks');
const event = require('../event');
const suite = require('../suite');

const runner = path.join(__dirname, '/../../bin/codecept');
let config;
const childOpts = {};
const copyOptions = ['steps', 'reporter', 'verbose', 'config', 'reporter-options', 'grep', 'fgrep', 'debug'];

// codeceptjs run:multiple smoke:chrome regression:firefox - will launch smoke suite in chrome and regression in firefox
// codeceptjs run:multiple smoke:chrome regression - will launch smoke suite in chrome and regression in firefox and chrome
// codeceptjs run:multiple all - will launch all suites
// codeceptjs run:multiple smoke regression'

// Changelog:
// - added: suite.prepareSuites - creates unified suites coniguration based on preferredSuites
// - added: suite.prepareSuitesChunks - expands configuration by (n) chunks if chunks are configured
// - added: suite.prepareSuitesBrowsers - expands configuration by (n) browsers if browsers are configured
// - added: suite.filterSuitesBrowsers - filters configuration by requested browsers set via preferredSuites
// - updated: runSuite
//  - browser argument is removed, it is now retrieved through a unified browser config
//  - forking over multiple browsers is removed, it became obsolete as soon as we prepared
//    and expanded the whole configuration beforehand, including chunks and browsers

let suiteId = 1;
let subprocessCount = 0;
let totalSubprocessCount = 0;
let processesDone;

module.exports = function (preferredSuites, options) {
  // registering options globally to use in config
  process.profile = options.profile;
  const configFile = options.config;
  let codecept;

  const testRoot = getTestRoot(configFile);
  config = getConfig(configFile);

  // copy opts to run
  Object.keys(options)
    .filter(key => copyOptions.indexOf(key) > -1)
    .forEach((key) => {
      childOpts[key] = options[key];
    });

  if (!config.multiple) {
    fail('Multiple suites not configured, add "multiple": { /../ } section to config');
  }

  preferredSuites = options.all ? Object.keys(config.multiple) : preferredSuites;
  if (!preferredSuites.length) {
    fail('No suites provided. Use --all option to run all configured suites');
  }

  const done = () => event.emit(event.multiple.before, null);
  runHook(config.bootstrapAll, done, 'multiple.bootstrap');

  const childProcessesPromise = new Promise((resolve, reject) => {
    processesDone = resolve;
  });

  const forksToExecute = [];
  const suites = suite.prepareSuites(preferredSuites, config);

  Object.entries(suites).forEach((suite) => {
    const [suiteName, suiteConfig] = suite;
    forksToExecute.push(runSuite(suiteConfig.parentSuiteName || suiteName, suiteConfig));
  });

  // Execute all forks
  totalSubprocessCount = forksToExecute.length;
  forksToExecute.forEach(currentForkFunc => currentForkFunc.call(this));

  return childProcessesPromise.then(() => {
    // fire hook
    const done = () => event.emit(event.multiple.after, null);
    runHook(config.teardownAll, done, 'multiple.teardown');
  });
};

function runSuite(suiteName, suiteConfig) {
  // clone config
  let overriddenConfig = Object.assign({}, config);

  // get configuration
  const browserConfig = suiteConfig.browser;
  const browserName = browserConfig.browser;

  for (const key in browserConfig) {
    overriddenConfig.helpers = replaceValue(overriddenConfig.helpers, key, browserConfig[key]);
  }

  let outputDir = `${suiteName}_`;
  if (browserConfig.outputName) {
    outputDir += typeof browserConfig.outputName === 'function' ? browserConfig.outputName() : browserConfig.outputName;
  } else {
    outputDir += JSON.stringify(browserConfig).replace(/[^\d\w]+/g, '_');
  }
  outputDir += `_${suiteId}`;

  // tweaking default output directories and for mochawesome
  overriddenConfig = replaceValue(overriddenConfig, 'output', path.join(config.output, outputDir));
  overriddenConfig = replaceValue(overriddenConfig, 'reportDir', path.join(config.output, outputDir));
  overriddenConfig = replaceValue(overriddenConfig, 'mochaFile', path.join(config.output, outputDir, `${browserName}_report.xml`));

  // override tests configuration
  if (overriddenConfig.tests) {
    overriddenConfig.tests = suiteConfig.tests;
  }

  // override grep param and collect all params
  const params = ['run',
    '--child', `${suiteId++}.${suiteName}:${browserName}`,
    '--override', JSON.stringify(overriddenConfig),
  ];

  Object.keys(childOpts).forEach((key) => {
    params.push(`--${key}`);
    if (childOpts[key] !== true) params.push(childOpts[key]);
  });

  if (suiteConfig.grep) {
    params.push('--grep');
    params.push(suiteConfig.grep);
  }

  const onProcessEnd = (errorCode) => {
    if (errorCode !== 0) {
      process.exitCode = errorCode;
    }
    subprocessCount += 1;
    if (subprocessCount === totalSubprocessCount) {
      processesDone();
    }
    return errorCode;
  };

  // Return function of fork for later execution
  return () => fork(runner, params, { stdio: [0, 1, 2, 'ipc'] })
    .on('exit', (code) => {
      return onProcessEnd(code);
    })
    .on('error', (err) => {
      return onProcessEnd(1);
    });
}


/**
 * search key in object recursive and replace value in it
 */
function replaceValue(obj, key, value) {
  if (!obj) return;
  if (obj instanceof Array) {
    for (const i in obj) {
      replaceValue(obj[i], key, value);
    }
  }
  if (obj[key]) obj[key] = value;
  if (typeof obj === 'object' && obj !== null) {
    const children = Object.keys(obj);
    for (let childIndex = 0; childIndex < children.length; childIndex++) {
      replaceValue(obj[children[childIndex]], key, value);
    }
  }
  return obj;
}
