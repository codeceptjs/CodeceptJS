const fork = require('child_process').fork;
const path = require('path');
const crypto = require('crypto');

const runHook = require('../hooks');
const event = require('../event');
const collection = require('./run-multiple/collection');
const clearString = require('../utils').clearString;
const replaceValueDeep = require('../utils').replaceValueDeep;
const {
  getConfig, getTestRoot, fail,
} = require('./utils');

const runner = path.join(__dirname, '/../../bin/codecept');
let config;
const childOpts = {};
const copyOptions = ['override', 'steps', 'reporter', 'verbose', 'config', 'reporter-options', 'grep', 'fgrep', 'invert', 'debug', 'plugins', 'colors'];
let overrides = {};

// codeceptjs run-multiple smoke:chrome regression:firefox - will launch smoke run in chrome and regression in firefox
// codeceptjs run-multiple smoke:chrome regression - will launch smoke run in chrome and regression in firefox and chrome
// codeceptjs run-multiple --all - will launch all runs
// codeceptjs run-multiple smoke regression'

let runId = 1;
let subprocessCount = 0;
let totalSubprocessCount = 0;
let processesDone;

module.exports = function (selectedRuns, options) {
  // registering options globally to use in config
  process.env.profile = options.profile;
  const configFile = options.config;
  let codecept;

  const testRoot = getTestRoot(configFile);
  global.codecept_dir = testRoot;

  // copy opts to run
  Object.keys(options)
    .filter(key => copyOptions.indexOf(key) > -1)
    .forEach((key) => {
      childOpts[key] = options[key];
    });

  try {
    overrides = JSON.parse(childOpts.override);
    delete childOpts.override;
  } catch (e) {
    overrides = {};
  }

  config = {
    ...getConfig(configFile),
    ...overrides,
  };

  if (!config.multiple) {
    fail('Multiple runs not configured, add "multiple": { /../ } section to config');
  }

  selectedRuns = options.all ? Object.keys(config.multiple) : selectedRuns;
  if (!selectedRuns.length) {
    fail('No runs provided. Use --all option to run all configured runs');
  }

  const done = () => {
    event.emit(event.multiple.before, null);
    if (options.config) { // update paths to config path
      if (config.tests) {
        config.tests = path.resolve(testRoot, config.tests);
      }
      if (config.gherkin && config.gherkin.features) {
        config.gherkin.features = path.resolve(testRoot, config.gherkin.features);
      }
    }

    if (options.features) {
      config.tests = '';
    }

    if (options.tests && config.gherkin) {
      config.gherkin.features = '';
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
      runHook(config.teardownAll, done, 'teardownAll');
    });
  };

  runHook(config.bootstrapAll, done, 'bootstrapAll');
};

function executeRun(runName, runConfig) {
  // clone config
  let overriddenConfig = { ...config };

  // get configuration
  const browserConfig = runConfig.browser;
  const browserName = browserConfig.browser;

  for (const key in browserConfig) {
    overriddenConfig.helpers = replaceValueDeep(overriddenConfig.helpers, key, browserConfig[key]);
  }

  let outputDir = `${runName}_`;
  if (browserConfig.outputName) {
    outputDir += typeof browserConfig.outputName === 'function' ? browserConfig.outputName() : browserConfig.outputName;
  } else {
    const hash = crypto.createHash('md5');
    hash.update(JSON.stringify(browserConfig));
    outputDir += hash.digest('hex');
  }
  outputDir += `_${runId}`;

  outputDir = clearString(outputDir);

  // tweaking default output directories and for mochawesome
  overriddenConfig = replaceValueDeep(overriddenConfig, 'output', path.join(config.output, outputDir));
  overriddenConfig = replaceValueDeep(overriddenConfig, 'reportDir', path.join(config.output, outputDir));
  overriddenConfig = replaceValueDeep(overriddenConfig, 'mochaFile', path.join(config.output, outputDir, `${browserName}_report.xml`));

  // override tests configuration
  if (overriddenConfig.tests) {
    overriddenConfig.tests = runConfig.tests;
  }

  if (overriddenConfig.gherkin && runConfig.gherkin && runConfig.gherkin.features) {
    overriddenConfig.gherkin.features = runConfig.gherkin.features;
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
