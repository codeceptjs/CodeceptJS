'use strict';
let getConfig = require('./utils').getConfig;
let getTestRoot = require('./utils').getTestRoot;
let fail = require('./utils').fail;
let deepMerge = require('./utils').deepMerge;
let Codecept = require('../codecept');
let Config = require('../config');
let fork = require('child_process').fork;
let output = require('../output');
const path = require('path');
const runner = path.join(__dirname, '/../../bin/codecept');
let config, childOpts = {};
const copyOptions = ['steps', 'reporter', 'verbose', 'config', 'reporter-options', 'grep', 'fgrep', 'debug'];

// codeceptjs run:multiple smoke:chrome regression:firefox - will launch smoke suite in chrome and regression in firefox
// codeceptjs run:multiple smoke:chrome regression - will launch smoke suite in chrome and regression in firefox and chrome
// codeceptjs run:multiple all - will launch all suites
// codeceptjs run:multiple smoke regression'

let suiteId = 1;

module.exports = function (suites, options) {
  // registering options globally to use in config
  process.profile = options.profile;
  let configFile = options.config;
  let codecept;

  let testRoot = getTestRoot(configFile);
  config = getConfig(configFile);

  let configMultiple = config.multiple;

  if (!configMultiple) {
    fail(`Multiple suites not configured, add "multiple": { /../ } section to config`);
  }

  // copy opts to run
  Object.keys(options)
    .filter((key) => copyOptions.indexOf(key) > -1)
    .forEach((key) => childOpts[key] = options[key]);

  if (options.all) {
    suites = Object.keys(configMultiple);
  }
  if (!suites.length) {
    fail('No suites provided. Use --all option to run all configured suites');
  }

  //iterate options
  suites.forEach(function (suite) {

    // get suites
    suite = suite.split(':');

    let suiteName = suite[0];
    let browser = suite[1];
    let suiteConf = configMultiple[suiteName];

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

    //throw error if no configuration
    if (suiteConf.browsers.length === 0) throw new Error(`Browser ${browser} not found in multiple suite "${suiteName}" config`);

    runSuite(suiteName, suiteConf);
  });
};

function runSuite(suite, suiteConf, browser) {

  if (!browser) {
    // run configurations
    suiteConf.browsers.forEach((b) => {
      let browserConf = Object.assign({}, suiteConf);
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

  //get configuration
  let browserConfig = suiteConf.browser;

  for (let key in browserConfig) {
    overriddenConfig.helpers = replaceValue(overriddenConfig.helpers, key, browserConfig[key]);
  }

  let outputDir = suite + JSON.stringify(browserConfig).replace(/[^\d\w]+/g, '_') + suiteId;

  // tweaking default output directories and for mochawesome
  overriddenConfig = replaceValue(overriddenConfig, 'output', path.join(config.output, outputDir));
  overriddenConfig = replaceValue(overriddenConfig, 'reportDir', path.join(config.output, outputDir));
  overriddenConfig = replaceValue(overriddenConfig, 'mochaFile', path.join(config.output, outputDir, 'report.xml'));

  // override grep param and collect all params
  let params = ['run',
    '--child', `${suiteId++}.${suite}:${browser}`,
    '--override', JSON.stringify(overriddenConfig)
  ];

  Object.keys(childOpts).forEach((key) => {
    params.push('--' + key);
    if (childOpts[key] !== true) params.push(childOpts[key]);
  });

  if (suiteConf.grep) {
    params.push('--grep');
    params.push(suiteConf.grep);
  }

  fork(runner, params, {stdio: [0, 1, 2, 'ipc']})
    .on('exit', (code) => code === 0 ? null : process.exitCode = 1)
    .on('error', (err) => process.exitCode = 1);
}


/**
 * search key in object recursive and replace value in it
 */
function replaceValue(obj, key, value) {
  if (!obj) return;
  if (obj instanceof Array) {
    for (var i in obj) {
      replaceValue(obj[i], key, value);
    }
  }
  if (obj[key]) obj[key] = value;
  if (typeof obj === "object" && obj !== null) {
    var children = Object.keys(obj);
    for (i = 0; i < children.length; i++) {
      replaceValue(obj[children[i]], key, value);
    }
  }
  return obj;
}
