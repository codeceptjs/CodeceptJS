'use strict';
let fileExists = require('../utils').fileExists;
let output = require("../output");
let fs = require('fs');
let path = require('path');
let colors = require('colors');

module.exports.getTestRoot = function (currentPath) {
  let testsPath = path.resolve(currentPath || '.');

  if (!currentPath) {
    output.print(`Test root is assumed to be ${colors.yellow.bold(testsPath)}`);
  } else {
    output.print(`Using test root ${colors.bold(testsPath)}`);
  }
  return testsPath;
};

module.exports.getConfig = function (testsPath) {
  let configFile = path.join(testsPath, 'codecept.json');
  if (!fileExists(configFile)) {
    output.error(`Can not load config from ${configFile}\nCodeceptJS is not initialized in this dir. Execute 'codeceptjs init' to start`);
    process.exit(1);
  }
  let config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  if (!config.include) config.include = {};
  if (!config.helpers) config.helpers = {};
  return config;
};
