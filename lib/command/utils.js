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

module.exports.getConfig = function (testRoot) {

  let config,
    jsConfigFile = path.join(testRoot, 'codecept.js'),
    jsonConfigFile = path.join(testRoot, 'codecept.json');
  if (fileExists(jsConfigFile)) {
    config = require(jsConfigFile).config;
    console.log(config);

  } else if (fileExists(jsonConfigFile)) {
    config = JSON.parse(fs.readFileSync(jsonConfigFile, 'utf8'));
  } else {
    output.error(`Can not load config from ${jsConfigFile} or ${jsonConfigFile}\nCodeceptJS is not initialized in this dir. Execute 'codeceptjs init' to start`);
    process.exit(1);
  }

  if (!config.include) config.include = {};
  if (!config.helpers) config.helpers = {};
  return config;
};
