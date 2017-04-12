'use strict';
let getConfig = require('./utils').getConfig;
let getTestRoot = require('./utils').getTestRoot;
let deepMerge = require('./utils').deepMerge;
let Codecept = require('../codecept');
var fork = require('child_process').fork;
let output = require('../output');

module.exports = function (suite, test, options) {
  // registering options globally to use in config
  process.profile = options.profile;
  let configFile = options.config;
  let codecept;

  let testRoot = getTestRoot(suite);
  let config = getConfig(testRoot, configFile);

  // override config with options
  if (options.override) {
    config = deepMerge(config, JSON.parse(options.override));
  }

  let outputDir = config.output;
  let defaultWindowSize = searchValueInObj('windowSize', config.helpers);

  // run multiple codeceptjs with options
  if (options.multiple) {
    // get list of multiple options
    let multipleOptions = options.multiple.replace(/ /g, "").split(';');
    let browserList = ['chrome', 'firefox', 'ie', 'safari', 'edge'];
    //iterate all multipleOptions
    multipleOptions.forEach(function (multipleOption) {
      // get suites
      let browserSuites = multipleOption.split(':');
      // if key in browser list, then seach suites for this browser
      if (browserList.indexOf(browserSuites[0]) > -1) {
        let browser = browserSuites[0];
        let suites = browserSuites[1].split(',');
        // iterate suites for browser
        suites.forEach(function (suite) {
          runnerHelper(browser, suite, config);
        });
      } else if (browserSuites[0] == 'all' && browserSuites.length == 1) {
        let browsersConfig = Object.keys(config.multiple);
        browsersConfig.forEach(function (browser) {
          let suites = Object.keys(config.multiple[browser]);
          suites.forEach(function (suite) {
            runnerHelper(browser, suite, config);
          });
        });
      } else if (browserSuites.length == 1 && browserSuites[0] != '') {
        //run suite in all browsers
        let suites = browserSuites[0].split(',');
        suites.forEach(function (suite) {
          let browserConfiguration = Object.keys(config.multiple);
          browserConfiguration.forEach(function (browser) {
            let configuration = config.multiple[browser];
            if (configuration[suite]) {
              runnerHelper(browser, suite, config);
            }
          });
        });
      } else throw new Error('Error while running codeceptjs multiply. Suites list:' + multipleOptions);
    });
  }


  function runnerHelper(browser, suite, config) {
    let suiteConf = config.multiple[browser][suite];
    let sizes = suiteConf.windowSizes || ['default'];
    // override browser
    let overriddenConfig = replaceValue(new getConfig(testRoot, configFile), 'browser',
      browser === 'ie' ? 'internet explorer' : browser);

    sizes.forEach(function (size) {
      if (size != 'default') {
        //override windowSize
        overriddenConfig = replaceValue(overriddenConfig, 'windowSize', size);
        overriddenConfig =
          replaceValue(overriddenConfig, 'output', outputDir + browser + '_' + suite + '_' + size + '/');
        overriddenConfig =
          replaceValue(overriddenConfig, 'reportDir', outputDir + browser + '_' + suite + '_' + size + '/');
      } else {
        overriddenConfig = replaceValue(overriddenConfig, 'windowSize', defaultWindowSize);
        overriddenConfig = replaceValue(overriddenConfig, 'output', outputDir + browser + '_' + suite + '/');
        overriddenConfig = replaceValue(overriddenConfig, 'reportDir', outputDir + browser + '_' + suite + '/');
      }

      //override grep param and collect all params
      let params = ['run', '--child', browser + '_' + suite + '_' + size, '--grep', suiteConf.grep,
        '--override', JSON.stringify(overriddenConfig)];

      for (let i = 3; i < process.argv.length; i++) {
        if (process.argv[i].indexOf('--multiple=') < 0) {
          if (process.argv[i].indexOf('--multiple') < 0) {
            params.push(process.argv[i]);
          } else i++;
        }
      }
      fork(__dirname.replace('/lib/command', '/bin/codecept'), params, {
        stdio: [0, 1, 2, 'ipc']
      }).on('exit', (code) => {
        if (code != 0) process.exitCode = 1;
      }).on('error', (err) => {
        process.exitCode = 1;
      });
    });
  }

  function replaceValue(obj, key, value) {
    /* search key in object recursive and replace value in it
     */
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

  function searchValueInObj(_for, _in) {
    var r;
    for (var p in _in) {
      if (p === _for) {
        return _in[p];
      }
      if (typeof _in[p] === 'object') {
        if ((r = searchValueInObj(_for, _in[p])) !== null) {
          return r;
        }
      }
    }
    return null;
  }
};
