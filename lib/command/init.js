const print = require('../output').print;
const success = require('../output').success;
const error = require('../output').error;
const colors = require('chalk');
const fs = require('fs');
const path = require('path');
const fileExists = require('../utils').fileExists;
const inquirer = require('inquirer');
const getTestRoot = require('./utils').getTestRoot;
const isLocal = require('../utils').installedLocally();
const mkdirp = require('mkdirp');

const defaultConfig = {
  tests: './*_test.js',
  timeout: 10000,
  output: '',
  helpers: {},
  include: {},
  bootstrap: false,
  mocha: {},
};

const helpers = ['WebDriverIO', 'Protractor', 'Puppeteer', 'Nightmare', 'Appium', 'REST'];
const translations = Object.keys(require('../../translations'));

const noTranslation = 'English (no localization)';
translations.unshift(noTranslation);

let packages;

const defaultActor = `
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
  const testsPath = getTestRoot(initPath);

  print();
  print(`  Welcome to ${colors.magenta.bold('CodeceptJS')} initialization tool`);
  print('  It will prepare and configure a test environment for you');
  print();


  if (!path) {
    print('No test root specified.');
    print(`Test root is assumed to be ${colors.yellow.bold(testsPath)}`);
    print('----------------------------------');
  } else {
    print(`Installing to ${colors.bold(testsPath)}`);
  }

  if (!fileExists(testsPath)) {
    print(`Directory ${testsPath} does not exist, creating...`);
    mkdirp.sync(testsPath);
  }

  const configFile = path.join(testsPath, 'codecept.json');
  if (fileExists(configFile)) {
    error(`Config is already created at ${configFile}`);
    return;
  }


  inquirer.prompt([
    {
      name: 'tests',
      type: 'input',
      default: './*_test.js',
      message: 'Where are your tests located?',
    },
    {
      name: 'helpers',
      type: 'checkbox',
      choices: helpers,
      message: 'What helpers do you want to use?',
    },
    {
      name: 'output',
      default: './output',
      message: 'Where should logs, screenshots, and reports to be stored?',
    },
    {
      name: 'steps',
      type: 'confirm',
      message: 'Would you like to extend I object with custom steps?',
      default: true,
    },
    {
      name: 'translation',
      type: 'list',
      message: 'Do you want to choose localization for tests?',
      choices: translations,
    },
    {
      name: 'steps_file',
      type: 'input',
      message: 'Where would you like to place custom steps?',
      default: './steps_file.js',
      when(answers) {
        return answers.steps;
      },
    },
  ], (result) => {
    const config = defaultConfig;
    config.name = testsPath.split(path.sep).pop();
    config.output = result.output;

    config.tests = result.tests;
    // create a directory tests if it is included in tests path
    const matchResults = config.tests.match(/[^*.]+/);
    if (matchResults) {
      mkdirp.sync(path.join(testsPath, matchResults[0]));
    }

    // append file mask to the end of tests
    if (!config.tests.match(/\*(.*?)$/)) {
      config.tests = `${config.tests.replace(/\/+$/, '')}/*_test.js`;
      console.log(`Adding default test mask: ${config.tests}`);
    }

    if (result.translation !== noTranslation) config.translation = result.translation;

    result.helpers.forEach(helper => config.helpers[helper] = {});

    let helperConfigs = [];

    result.helpers.forEach((helperName) => {
      try {
        const Helper = require(`../helper/${helperName}`);
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

    const finish = () => {
      if (result.steps_file) {
        const stepFile = path.join(testsPath, result.steps_file);
        if (!fileExists(path.dirname(stepFile))) {
          mkdirp.sync(path.dirname(stepFile));
        }
        fs.writeFileSync(stepFile, defaultActor);
        config.include.I = result.steps_file;
        success(`Steps file created at ${stepFile}`);
      }

      fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
      success(`Config created at ${configFile}`);

      if (config.output) {
        if (!fileExists(config.output)) {
          mkdirp.sync(path.join(testsPath, config.output));
          success('Directory for temporary output files created at `_output`');
        } else {
          print(`Directory for temporary output files is already created at '${config.output}'`);
        }
      }
      success('Almost done! Create your first test by executing `codeceptjs gt` (generate test) command');

      if (packages) {
        print('\n--');
        if (isLocal) {
          print(`Please install dependent packages locally: ${colors.bold(`npm install --save-dev ${packages.join(' ')}`)}`);
        } else {
          print(`Please install dependent packages globally: [sudo] ${colors.bold(`npm install -g ${packages.join(' ')}`)}`);
        }
      }
    };

    if (!result.helpers.length) {
      return finish();
    }

    print('Configure helpers...');
    inquirer.prompt(helperConfigs, (helperResult) => {
      Object.keys(helperResult).forEach((key) => {
        const parts = key.split('_');
        const helperName = parts[0];
        const configName = parts[1];
        if (!configName) return;
        config.helpers[helperName][configName] = helperResult[key];
      });

      finish();
    });
  });
};
