const {
  getConfig, getTestRoot, fail, deepMerge,
} = require('./utils');
const Codecept = require('../codecept');
const Config = require('../config');
const fork = require('child_process').fork;
const output = require('../output');
const path = require('path');
const runHook = require('../hooks');
const event = require('../event');
const collection = require('./run-multiple/collection');
const clearString = require('../utils').clearString;

const runner = path.join(__dirname, '/../../bin/codecept');
let config;
const childOpts = {};
const copyOptions = ['override', 'steps', 'reporter', 'verbose', 'config', 'reporter-options', 'grep', 'fgrep', 'debug', 'plugins'];

// codeceptjs run:multiple smoke:chrome regression:firefox - will launch smoke run in chrome and regression in firefox
// codeceptjs run:multiple smoke:chrome regression - will launch smoke run in chrome and regression in firefox and chrome
// codeceptjs run:multiple all - will launch all runs
// codeceptjs run:multiple smoke regression'

let runId = 1;
let subprocessCount = 0;
let totalSubprocessCount = 0;
let processesDone;

module.exports = function (selectedRuns, options) {
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
    fail('Multiple runs not configured, add "multiple": { /../ } section to config');
  }

  selectedRuns = options.all ? Object.keys(config.multiple) : selectedRuns;
  if (!selectedRuns.length) {
    fail('No runs provided. Use --all option to run all configured runs');
  }

  const done = () => event.emit(event.multiple.before, null);
  runHook(config.bootstrapAll, done, 'multiple.bootstrap');

  if (options.config) { // update paths to config path
    config.tests = path.resolve(testRoot, config.tests);
  }


  const childProcessesPromise = new Promise((resolve, reject) => {
    processesDone = resolve;
  });

  const runsToExecute = [];
  collection.createRuns(selectedRuns, config).forEach((run) => {
    const runName = run.getOriginalName() || run.getName();
    const runConfig = run.getConfig();
    runsToExecute.push(executeRun(runName, runConfig));
  });

  if (!runsToExecute.length) {
    fail('Nothing scheduled for execution');
  }

  // Execute all forks
  totalSubprocessCount = runsToExecute.length;
  runsToExecute.forEach(runToExecute => runToExecute.call(this));

  return childProcessesPromise.then(() => {
    // fire hook
    const done = () => event.emit(event.multiple.after, null);
    runHook(config.teardownAll, done, 'multiple.teardown');
  });
};

function executeRun(runName, runConfig) {
  // clone config
  let overriddenConfig = Object.assign({}, config);

  // get configuration
  const browserConfig = runConfig.browser;
  const browserName = browserConfig.browser;

  for (const key in browserConfig) {
    overriddenConfig.helpers = replaceValue(overriddenConfig.helpers, key, browserConfig[key]);
  }

  let outputDir = `${runName}_`;
  if (browserConfig.outputName) {
    outputDir += typeof browserConfig.outputName === 'function' ? browserConfig.outputName() : browserConfig.outputName;
  } else {
    outputDir += JSON.stringify(browserConfig).replace(/[^\d\w]+/g, '_');
  }
  outputDir += `_${runId}`;

  outputDir = clearString(outputDir);

  // tweaking default output directories and for mochawesome
  overriddenConfig = replaceValue(overriddenConfig, 'output', path.join(config.output, outputDir));
  overriddenConfig = replaceValue(overriddenConfig, 'reportDir', path.join(config.output, outputDir));
  overriddenConfig = replaceValue(overriddenConfig, 'mochaFile', path.join(config.output, outputDir, `${browserName}_report.xml`));

  // override tests configuration
  if (overriddenConfig.tests) {
    overriddenConfig.tests = runConfig.tests;
  }

  // override grep param and collect all params
  const params = ['run',
    '--child', `${runId++}.${runName}:${browserName}`,
    '--override', JSON.stringify(overriddenConfig),
  ];

  Object.keys(childOpts).forEach((key) => {
    params.push(`--${key}`);
    if (childOpts[key] !== true) params.push(childOpts[key]);
  });

  if (runConfig.grep) {
    params.push('--grep');
    params.push(runConfig.grep);
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
