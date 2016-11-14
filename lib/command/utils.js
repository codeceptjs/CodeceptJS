'use strict';
let fileExists = require('../utils').fileExists;
let isFile = require('../utils').isFile;
let output = require("../output");
let fs = require('fs');
let path = require('path');

module.exports.getTestRoot = function (currentPath) {
  let testsPath = path.resolve(currentPath || '.');
  return testsPath;
};

module.exports.getConfig = function (testRoot, configfile) {

  let config,
    manualConfigFile = path.resolve(configfile),
    jsConfigFile = path.join(testRoot, 'codecept.conf.js'),
    jsConfigFileDeprecated = path.join(testRoot, 'codecept.js'),
    jsonConfigFile = path.join(testRoot, 'codecept.json');


  if (isFile(manualConfigFile)) { // --config option provided
    if (path.extname(manualConfigFile) === '.js') {
      return configWithDefaults(require(manualConfigFile).config);
    }
    return configWithDefaults(JSON.parse(fs.readFileSync(manualConfigFile, 'utf8')));
  }

  if (fileExists(jsConfigFile)) { // js config file
    return configWithDefaults(require(jsConfigFile).config);
  }

  if (fileExists(jsConfigFileDeprecated)) { // deprecated js config file
    console.log('Using codecept.js as configuration is deprecated, please rename it to codecept.conf.js');
    return configWithDefaults(require(jsConfigFileDeprecated).config);
  }

  if (fileExists(jsonConfigFile)) { // json config provided
    return configWithDefaults(JSON.parse(fs.readFileSync(jsonConfigFile, 'utf8')));
  }
  output.error(`Can not load config from ${jsConfigFile}, ${jsonConfigFile} or ${manualConfigFile}\nCodeceptJS is not initialized in this dir. Execute 'codeceptjs init' to start`);
  process.exit(1);
};

function configWithDefaults(config) {
  if (!config.include) config.include = {};
  if (!config.helpers) config.helpers = {};
  return config;
}
