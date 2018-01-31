const getConfig = require('./utils').getConfig;
const getTestRoot = require('./utils').getTestRoot;
const fail = require('./utils').fail;
const deepMerge = require('./utils').deepMerge;
const Codecept = require('../codecept');
const Config = require('../config');
const fork = require('child_process').fork;
const output = require('../output');
const path = require('path');

const runner = path.join(__dirname, '/../../bin/codecept');
let config;
const childOpts = {};
const copyOptions = ['steps', 'reporter', 'verbose', 'config', 'reporter-options', 'grep', 'fgrep', 'debug'];

// codeceptjs run:multiple smoke:chrome regression:firefox - will launch smoke suite in chrome and regression in firefox
// codeceptjs run:multiple smoke:chrome regression - will launch smoke suite in chrome and regression in firefox and chrome
// codeceptjs run:multiple all - will launch all suites
// codeceptjs run:multiple smoke regression'

let suiteId = 1;

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

    runSuite(suiteName, suiteConf);
  });
};

function runSuite(suite, suiteConf, browser) {
  if (!browser) {
    // run configurations
    suiteConf.browsers.forEach((b) => {
      const browserConf = Object.assign({}, suiteConf);
      if (typeof b === 'object') {
        browserConf.browser = b;
        runSuite(suite, browserConf, b.browser);
      } else {
        browserConf.browser = { browser: b };
        runSuite(suite, browserConf, b);
      }
    });
    return;
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

  fork(runner, params, { stdio: [0, 1, 2, 'ipc'] })
    .on('exit', (code) => {
      if (code === 0) {
        return null;
      }
      process.exitCode = 1;
      return process.exitCode;
    })
    .on('error', err => process.exitCode = 1);
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
