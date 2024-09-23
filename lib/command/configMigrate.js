import colors from 'chalk';
import fs from 'fs';
import inquirer from 'inquirer';
import mkdirp from 'mkdirp';
import path from 'path';
import util from 'util';
import * as outputLib from '../output.js';
import { fileExists } from '../utils.js';
import { getTestRoot } from './utils.js';

export default function (initPath) {
  const testsPath = getTestRoot(initPath);

  outputLib.print();
  outputLib.print(`  Welcome to ${colors.magenta.bold('CodeceptJS')} configuration migration tool`);
  outputLib.print(`  It will help you switch from ${colors.cyan.bold('.json')} to ${colors.magenta.bold('.js')} config format at ease`);
  outputLib.print();

  if (!path) {
    outputLib.print('No config file is specified.');
    outputLib.print(`Test root is assumed to be ${colors.yellow.bold(testsPath)}`);
    outputLib.print('----------------------------------');
  } else {
    outputLib.print(`Migrating ${colors.magenta.bold('.js')} config to ${colors.bold(testsPath)}`);
  }

  if (!fileExists(testsPath)) {
    outputLib.print(`Directory ${testsPath} does not exist, creating...`);
    mkdirp.sync(testsPath);
  }

  const configFile = path.join(testsPath, 'codecept.conf.js');
  if (fileExists(configFile)) {
    outputLib.output.output.error(`Config is already created at ${configFile}`);
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
        outputLib.output.success(`Config is successfully migrated at ${configFile}`);

        if (result.delete) {
          if (fileExists(jsonConfigFile)) {
            fs.unlinkSync(jsonConfigFile);
            outputLib.output.success('JSON config file is deleted!');
          }
        }
      };
      finish();
    }
  });
}
