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

const runner = path.join(__dirname, '/../../bin/codecept');
let config;
const childOpts = {};
const copyOptions = ['steps', 'reporter', 'verbose', 'config', 'reporter-options', 'grep', 'fgrep', 'debug'];

// codeceptjs run:multiple smoke:chrome regression:firefox - will launch smoke suite in chrome and regression in firefox
// codeceptjs run:multiple smoke:chrome regression - will launch smoke suite in chrome and regression in firefox and chrome
// codeceptjs run:multiple all - will launch all suites
// codeceptjs run:multiple smoke regression'

let suiteId = 1;
let subprocessCount = 0;
let totalSubprocessCount = 0;
let processesDone;

module.exports = function (suites, options) {
  // registering options globally to use in config
  process.profile = options.profile;
  const configFile = options.config;
  let codecept;

  const testRoot = getTestRoot(configFile);
  config = getConfig(configFile);

  const configMultiple = config.multiple;

  if (!configMultiple) {
    fail('Multiple suites not configured, add "multiple": { /../ } section to config');
  }

  // copy opts to run
  Object.keys(options)
    .filter(key => copyOptions.indexOf(key) > -1)
    .forEach((key) => {
      childOpts[key] = options[key];
    });

  if (options.all) {
    suites = Object.keys(configMultiple);
  }
  if (!suites.length) {
    fail('No suites provided. Use --all option to run all configured suites');
  }

  const done = () => event.emit(event.multiple.before, null);
  runHook(config.bootstrapAll, done, 'multiple.bootstrap');

  const childProcessesPromise = new Promise((resolve, reject) => {
    processesDone = resolve;
  });

  const forksToExecute = [];
  // iterate options
  suites.forEach((suite) => {
    // get suites
    suite = suite.split(':');

    const suiteName = suite[0];
    const browser = suite[1];
    const suiteConf = configMultiple[suiteName];

    if (!suiteConf) {
      throw new Error(`Suite ${suiteName} was not configured in "multiple" section of config`);
    }

    // filter run configurations by browser if exists
    if (browser) {
      suiteConf.browsers = suiteConf.browsers.filter((b) => {
        if (typeof b === 'object') {
          return b.browser === browser;
        }
        return b === browser;
      });
    }
    // throw error if no configuration
    if (suiteConf.browsers.length === 0) throw new Error(`Browser ${browser} not found in multiple suite "${suiteName}" config`);

    const suiteForks = runSuite(suiteName, suiteConf);
    if (Array.isArray(suiteForks)) {
      forksToExecute.push(...suiteForks);
    } else {
      forksToExecute.push(suiteForks);
    }
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

function runSuite(suite, suiteConf, browser) {
  if (!browser) {
    // run configurations
    return suiteConf.browsers.map((b) => {
      const browserConf = Object.assign({}, suiteConf);
      if (typeof b === 'object') {
        browserConf.browser = b;
        return runSuite(suite, browserConf, b.browser);
      }
      browserConf.browser = { browser: b };
      return runSuite(suite, browserConf, b);
    });
  }

  // clone config
  let overriddenConfig = Object.assign({}, config);

  // get configuration
  const browserConfig = suiteConf.browser;

  for (const key in browserConfig) {
    overriddenConfig.helpers = replaceValue(overriddenConfig.helpers, key, browserConfig[key]);
  }

  let outputDir = `${suite}_`;
  if (browserConfig.outputName) {
    outputDir += typeof browserConfig.outputName === 'function' ? browserConfig.outputName() : browserConfig.outputName;
  } else {
    outputDir += JSON.stringify(browserConfig).replace(/[^\d\w]+/g, '_');
  }
  outputDir += `_${suiteId}`;

  // tweaking default output directories and for mochawesome
  overriddenConfig = replaceValue(overriddenConfig, 'output', path.join(config.output, outputDir));
  overriddenConfig = replaceValue(overriddenConfig, 'reportDir', path.join(config.output, outputDir));
  overriddenConfig = replaceValue(overriddenConfig, 'mochaFile', path.join(config.output, outputDir, `${browser}_report.xml`));
  
  // override tests configuration
  if (overriddenConfig.tests) {
    overriddenConfig.tests = suiteConf.tests;
  }
  
  // override grep param and collect all params
  const params = ['run',
    '--child', `${suiteId++}.${suite}:${browser}`,
    '--override', JSON.stringify(overriddenConfig),
  ];

  Object.keys(childOpts).forEach((key) => {
    params.push(`--${key}`);
    if (childOpts[key] !== true) params.push(childOpts[key]);
  });

  if (suiteConf.grep) {
    params.push('--grep');
    params.push(suiteConf.grep);
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
