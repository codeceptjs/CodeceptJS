'use strict';
let getConfig = require('./utils').getConfig;
let getTestRoot = require('./utils').getTestRoot;
let deepMerge = require('./utils').deepMerge;
let Codecept = require('../codecept');
var fork = require('child_process').fork
let output = require('../output');

module.exports = function (suite, test, options) {
  // registering options globally to use in config
  process.profile = options.profile;
  let configFile = options.config;
  let codecept;

  let testRoot = getTestRoot(suite);
  let config = getConfig(testRoot, configFile);

  let outputDir = config.output;

  // override config with options
  if (options.override) {
    config = deepMerge(config, JSON.parse(options.override));
  }

  // run multiple codeceptjs with options
  if (options.multiple) {

    // get list of multiple options
    let multipleOptions = options.multiple.replace(/ /g, "").split(';');
    let browserList = ['chrome', 'firefox', 'ie', 'safari', 'edge'];

    //iterate all multipleOptions
    for (let i = 0; i < multipleOptions.length; i++) {

      // get suites
      let browserSuites = multipleOptions[i].split(':');

      // if key in browser list, then seach suites for this browser
      if (browserList.indexOf(browserSuites[0]) > -1) {
        let finalSuites = browserSuites[1].split(',')

        // iterate suites for browser
        for (let j = 0; j < finalSuites.length; j++) {

          runnerHelper(browserSuites[0], finalSuites[j], config)

        }
      } else if (browserSuites[0] == 'all' && browserSuites.length == 1) {

        //get all suites for all browsers and run them all
        for (let l = 0; l < Object.keys(config.multiple).length; l++) {
          let browser = Object.keys(config.multiple)[l];
          let configuration = config.multiple[browser];
          if (Object.keys(configuration).length > 0) {
            for (let j = 0; j < Object.keys(configuration).length; j++) {
              let suite = Object.keys(configuration)[j]

              runnerHelper(browser, suite, config)

            }
          }

        }
      } else if (browserSuites.length == 1 && browserSuites[0] != '') {

        //run suite in all browsers
        let suites = browserSuites[0].split(',');


        for (let j = 0; j < suites.length; j++) {
          for (let l = 0; l < Object.keys(config.multiple).length; l++) {
            let browser = Object.keys(config.multiple)[l];
            let configuration = config.multiple[browser];

            runnerHelper(browser, suites[j], config)

          }
        }
      } else throw new Error('Error while running codeceptjs multiply. Suites list:' + multipleOptions);
    }
  } else {
    try {
      codecept = new Codecept(config, options);
      codecept.init(testRoot, function (err) {
        if (err) throw new Error('Error while running bootstrap file :' + err);
        codecept.loadTests();
        codecept.run(test);
      });
    } catch (err) {
      output.print('');
      output.error(err.message);
      output.print('');
      output.print(output.colors.grey(err.stack.replace(err.message, '')));
    }
  }


  function runnerHelper(browser, suite, config) {
    if (Object.prototype.toString.call(config.multiple[browser][suite]) === '[object Array]') {
      let suiteConf = config.multiple[browser][suite];
      let sizes = (suiteConf[1] === undefined) ? ['default'] : suiteConf[1].replace(/ /g, "").split(',')
      // override browser
      let override_br = replaceValue(new getConfig(testRoot, configFile), 'browser', (browser === 'ie') ? 'internet explorer' : browser)

      for (let k = 0; k < sizes.length; k++) {
        if (sizes[k] != 'default') {
          //override windowSize
          override_br = replaceValue(override_br, 'windowSize', sizes[k])

          override_br = replaceValue(override_br, 'output', outputDir+ browser + '_' + suite + '_' + sizes[k]+ '/')
          override_br = replaceValue(override_br, 'reportDir', outputDir+ browser + '_' + suite + '_' + sizes[k]+ '/')
        } else {
          override_br = replaceValue(override_br, 'output', outputDir + browser + '_' + suite + '/')
          override_br = replaceValue(override_br, 'reportDir', outputDir+ browser + '_' + suite + '/')
        }

        //override grep param and collect all params
        let params = ['run', '--child', browser + '_' + suite +'_' + sizes[k], '--grep', suiteConf[0], '--override', JSON.stringify(override_br)];
        for (let m = 3; m < process.argv.length; m++) {
          if (process.argv[m].indexOf('--multiple=') < 0)
            if (process.argv[m].indexOf('--multiple') < 0) {
              params.push(process.argv[m]);
            } else m++
        }
        fork(__dirname.replace('/lib/command', '/bin/codecept'), params, {
          stdio: [0, 1, 2, 'ipc']
        }).on('exit', (code) => {
          if (code != 0) process.exitCode = 1;
        }).on('error', (err) => {
          process.exitCode = 1;
        });
      }

    }
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


    if ((typeof obj == "object") && (obj !== null)) {
      var children = Object.keys(obj);
      if (children.length > 0) {
        for (i = 0; i < children.length; i++) {
          replaceValue(obj[children[i]], key, value);
        }
      }
    }
    return obj;
  };
};
