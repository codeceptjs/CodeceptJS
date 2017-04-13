'use strict';
let getConfig = require('./utils').getConfig;
let getTestRoot = require('./utils').getTestRoot;
let deepMerge = require('./utils').deepMerge;
let Codecept = require('../codecept');
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

module.exports = function (suites, options) {
  // registering options globally to use in config
  process.profile = options.profile;
  let configFile = options.config;
  let codecept;
  let testRoot = getTestRoot(configFile);
  config = getConfig(configFile);
  let outputFolder = config.output;

  let configMultiple = config.multiple;

  if (!configMultiple) {
    throw new Error(`Multiple suites not configured, add "multiple": { /../ } section to config`);
  }

  // copy opts to run
  Object.keys(options)
    .filter((key) => copyOptions.indexOf(key) > -1)
    .forEach((key) => childOpts[key] = options[key]);

  if (options.all) {
    suites = Object.keys(configMultiple);
  }

  //iterate options
  suites.forEach(function (suite) {

    // get suites
    suite = suite.split(':');

    let suiteName = suite[0];
    let browserConfig = [ suite[1], suite[2] ];
    let suiteConf = configMultiple[suiteName];

    if (!suiteConf) {
      throw new Error(`Suite ${suiteName} was not configured in "multiple" section of config`);
    }

    runSuite(suiteName, suiteConf, browserConfig, outputFolder);
  });
};

function runSuite(suite, suiteConf, configuration, outputFolder) {
  let suiteBrowsers = suiteConf.browsers.map((b) => typeof b === 'object' ? b : { browser: b })

  if (!configuration.browser) {
    // run all browsers in this suite
    suiteBrowsers.forEach((configuration) => runSuite(suite, suiteConf, configuration, outputFolder));
    return;
  }

  let overriddenConfig = config;

  for (let key in configuration) {
    overriddenConfig.helpers = replaceValue(overriddenConfig.helpers, key, configuration[key]);
  }

  let windowSize = configuration.windowSize || 'default'

  // tweaking default output directories and for mochawesome
  overriddenConfig = replaceValue(overriddenConfig, 'output', `${outputFolder}/${suite}_${configuration.browser}_${windowSize}/`);
  overriddenConfig = replaceValue(overriddenConfig, 'reportDir', `${outputFolder}/${suite}_${configuration.browser}_${windowSize}/`);

  // override grep param and collect all params
  let params = ['run',
    '--child', `${suite}:${configuration.browser}:${windowSize}`,
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
  if (obj instanceof Array) {
    for (var i in obj) {
      replaceValue(obj[i], key, value);
    }
  }
  if (obj[key]) obj[key] = value;
  if (typeof obj === "object" && obj !== null) {
    var children = Object.keys(obj);
    if (children.length > 0) {
      for (i = 0; i < children.length; i++) {
        replaceValue(obj[children[i]], key, value);
      }
    }
  }
  return obj;
}
