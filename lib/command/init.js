'use strict';
let print = require('../output').print;
let success = require('../output').success;
let error = require('../output').error;
let colors = require('colors');
let fs = require('fs');
let path = require('path');
let fileExists = require('../utils').fileExists;
let inquirer = require("inquirer");
let getTestRoot = require("./utils").getTestRoot;
let isLocal = require('../utils').installedLocally();

let defaultConfig = {
  "tests": "./*_test.js",
  "timeout": 10000,
  "output": null,
  "helpers": {},
  "include": {},
  "bootstrap": false,
  "mocha": {}
};

let helpers = ['WebDriverIO', 'Protractor', 'SeleniumWebdriver','FileSystem'];
let packages;

let defaultActor = `
'use strict';
// in this file you can append custom step methods to 'I' object

module.exports = function() {
  return actor({

    // Define custom steps here, use 'this' to access default methods of I.
    // It is recommended to place a general 'login' function here.

  });
}
`;


module.exports = function (initPath) {
  let testsPath = getTestRoot(initPath);

  print();
  print(`  Welcome to ${colors.magenta.bold('CodeceptJS')} initialization tool`);
  print("  It will prepare and configure a test environment for you");
  print();


  if (!path) {
    print(`No test root specified.`);
    print(`Test root is assumed to be ${colors.yellow.bold(testsPath)}`);
    print('----------------------------------');
  } else {
    print(`Installing to ${colors.bold(testsPath)}`);
  }

  if (!fileExists(testsPath)) {
    print(`Directory ${testsPath} does not exist, creating...`);
    fs.mkdirSync(testsPath);
  }

  let configFile = path.join(testsPath, 'codecept.json');
  if (fileExists(configFile)) {
    error(`Config is already created at ${configFile}`);
    return;
  }


  inquirer.prompt(
    [
      {
        name: "tests",
        type: "input",
        default: "./*_test.js",
        message: "Where are your tests located?"
      },
      {
        name: "helpers",
        type: "checkbox",
        choices: helpers,
        message: "What helpers do you want to use?"
      },
      {
        name: "output",
        default: "./output",
        message: "Where should logs, screenshots, and reports to be stored?"
      },
      {
        name: "steps",
        type: "confirm",
        message: "Would you like to extend I object with custom steps?",
        default: true
      },
      {
        name: "steps_file",
        type: "input",
        message: "Where would you like to place custom steps?",
        default: "./steps_file.js",
        when: function (answers) {
          return answers.steps;
        }
      }
    ], (result) => {
    let config = defaultConfig;
    config.name = testsPath.split(path.sep).pop();
    config.output = result.output;
    config.tests = result.tests;
    result.helpers.forEach((helper) => config.helpers[helper] = {});
    if (result.steps_file) config.include.I = result.steps_file;

    let helperConfigs = [];

    result.helpers.forEach((helperName) => {
      try {
        let Helper = require('../helper/' + helperName);
        if (Helper._checkRequirements) {
          packages = Helper._checkRequirements();
        }

        if (!Helper._config()) return;
        helperConfigs = helperConfigs.concat(Helper._config().map((config) => {
          config.message = `[${helperName}] ${config.message}`;
          config.name = `${helperName}_${config.name}`;
          config.type = config.type || 'input';
          return config;
        }));
      } catch (err) {
        error(err);
      }
    });

    if (result.helpers.length) {
      print("Configure helpers...");
    }

    inquirer.prompt(helperConfigs, (helperResult) => {

      Object.keys(helperResult).forEach((key) => {
        let helperName, configName;
        let parts = key.split('_');
        helperName = parts[0];
        configName = parts[1];
        if (!configName) return;
        config.helpers[helperName][configName] = helperResult[key];
      });

      if (result.steps_file) {
        let stepFile = path.join(testsPath, result.steps_file);
        if (!fileExists(path.dirname(stepFile))) fs.mkdirSync(path.dirname(stepFile));
        fs.writeFileSync(stepFile, defaultActor);
        config.include.I = result.steps_file;
        success('Steps file created at ' + stepFile);
      }

      fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
      success(`Config created at ${configFile}`);


      if (config.output) {
        if (!fileExists(config.output)) {
          fs.mkdirSync(path.join(testsPath, config.output));
          success("Directory for temporaty output files created at `_output`");
        } else {
          print(`Directory for temporaty output files is already created at '${config.output}'`);
        }
      }
      success("Almost done! Create your first test by executing `codeceptjs gt` (generate test) command");

      if (packages) {
        print("\n--");
        if (isLocal) {
          print("Please install dependent packages locally: " + colors.bold('npm install --save-dev '+packages.join(' ')));
        } else {
          print("Please install dependent packages globally: [sudo] " + colors.bold('npm install -g '+packages.join(' ')));
        }
      }

    });
  });
};
