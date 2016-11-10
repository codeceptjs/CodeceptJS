'use strict';
let fileExists = require('../utils').fileExists;
let output = require("../output");
let fs = require('fs');
let path = require('path');

module.exports.getTestRoot = function (currentPath) {
  let testsPath = path.resolve(currentPath || '.');
  return testsPath;
};

module.exports.getConfig = function (testRoot, configfile) {

  let config;

  if(configfile){
    let manualConfigFile = path.resolve(configfile);
    if (fileExists(manualConfigFile)){
      if(path.extname(manualConfigFile) === '.js'){
        config = require(manualConfigFile).config;
      }else{
        config = JSON.parse(fs.readFileSync(manualConfigFile, 'utf8'));
      }
    }else{
      output.error(`Can not load config from ${manualConfigFile}: File does not exist.`);
      process.exit(1);
    }

  }else{
    let jsConfigFile = path.join(testRoot, 'codecept.conf.js'),
      jsConfigFileDeprecated = path.join(testRoot, 'codecept.js'),
      jsonConfigFile = path.join(testRoot, 'codecept.json');

    if (fileExists(jsConfigFile)) {
      config = require(jsConfigFile).config;
    } else if (fileExists(jsConfigFileDeprecated)) {
      console.log('Using codecept.js as configuration is deprecated, please rename it to codecept.conf.js');
      config = require(jsConfigFileDeprecated).config;
    } else if (fileExists(jsonConfigFile)) {
      config = JSON.parse(fs.readFileSync(jsonConfigFile, 'utf8'));
    } else {
      output.error(`Can not load config from ${jsConfigFile} or ${jsonConfigFile}\nCodeceptJS is not initialized in this dir. Execute 'codeceptjs init' to start`);
      process.exit(1);
    }
  }

  if (!config.include) config.include = {};
  if (!config.helpers) config.helpers = {};
  return config;
};
