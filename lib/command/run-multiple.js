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
const copyOptions = ['steps', 'reporter', 'verbose', 'config', 'reporter-options', 'grep', 'fgrep'];

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

    runSuite(suiteName, suiteConf, browser);
  });
};

function runSuite(suite, suiteConf, browser) {
  let suiteBrowsers = suiteConf.browsers.map((b) => typeof b === 'object' ? b.browser : b);

  if (!browser) {
    // run all browsers in this suite
    suiteBrowsers.forEach((b) => runSuite(suite, suiteConf, b));
    return;
  }

  // clone config
  let overriddenConfig = Object.assign({}, config);

  if (suiteBrowsers.indexOf(browser) === -1) {
    throw new Error(`Browser ${browser} not found in multiple suite "${suite}" config`);
  }

  let browserConfig = suiteConf.browsers
    .map((b) => typeof b === 'object' ? b : { browser: b })
    .filter((b) => b.browser == browser)[0];

  for (let key in browserConfig) {
    overriddenConfig.helpers = replaceValue(overriddenConfig.helpers, key, browserConfig[key]);
  }

  let outputDir = suite + JSON.stringify(browserConfig).replace(/[^\d\w]+/g, '_') + suiteId;

  // tweaking default output directories and for mochawesome
  overriddenConfig = replaceValue(overriddenConfig, 'output', path.join(config.output, outputDir));
  overriddenConfig = replaceValue(overriddenConfig, 'reportDir', path.join(config.output, outputDir));

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
