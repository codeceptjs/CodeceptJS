'use strict';
let fs = require('fs');

let defaultConfig = {
  output: './_output',
  helpers: {},
  include: {},
  mocha: {}
};

let config = {};

class Config {

  static load(configFile, force) {
    if (Object.keys(config).length > 0 && !force) {
      return config;
    }
    config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    config = Object.assign(defaultConfig, config);
    return config;
  }
}

module.exports = Config;

