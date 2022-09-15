const colors = require('chalk');
const fs = require('fs');
const inquirer = require('inquirer');
const mkdirp = require('mkdirp');
const path = require('path');
const util = require('util');

const { print, success, error } = require('../output');
const { fileExists } = require('../utils');
const { getTestRoot } = require('./utils');

module.exports = function (initPath) {
  const testsPath = getTestRoot(initPath);

  print();
  print(`  Welcome to ${colors.magenta.bold('CodeceptJS')} configuration migration tool`);
  print(`  It will help you switch from ${colors.cyan.bold('.json')} to ${colors.magenta.bold('.js')} config format at ease`);
  print();

  if (!path) {
    print('No config file is specified.');
    print(`Test root is assumed to be ${colors.yellow.bold(testsPath)}`);
    print('----------------------------------');
  } else {
    print(`Migrating ${colors.magenta.bold('.js')} config to ${colors.bold(testsPath)}`);
  }

  if (!fileExists(testsPath)) {
    print(`Directory ${testsPath} does not exist, creating...`);
    mkdirp.sync(testsPath);
  }

  const configFile = path.join(testsPath, 'codecept.conf.js');
  if (fileExists(configFile)) {
    error(`Config is already created at ${configFile}`);
    return;
  }

  inquirer.prompt([{
    name: 'configFile',
    type: 'confirm',
    message: `Would you like to switch from ${colors.cyan.bold('.json')} to ${colors.magenta.bold('.js')} config format?`,
    default: true,
  },
  {
    name: 'delete',
    type: 'confirm',
    message: `Would you like to delete ${colors.cyan.bold('.json')} config format afterwards?`,
    default: true,
  },
  ]).then((result) => {
    if (result.configFile) {
      const jsonConfigFile = path.join(testsPath, 'codecept.js');
      const config = JSON.parse(fs.readFileSync(jsonConfigFile, 'utf8'));
      config.name = testsPath.split(path.sep).pop();

      const finish = () => {
        fs.writeFileSync(configFile, `exports.config = ${util.inspect(config, false, 4, false)}`, 'utf-8');
        success(`Config is successfully migrated at ${configFile}`);

        if (result.delete) {
          if (fileExists(jsonConfigFile)) {
            fs.unlinkSync(jsonConfigFile);
            success('JSON config file is deleted!');
          }
        }
      };
      finish();
    }
  });
};
