'use strict';
let fs = require('fs');
let path = require('path');
let isFile = require('./utils').isFile;
let fileExists = require('./utils').fileExists;
const deepMerge = require('./utils').deepMerge;

let defaultConfig = {
  output: './_output',
  helpers: {},
  include: {},
  mocha: {},
  bootstrap: null,
  teardown: null,
  hooks: []
};

let config = {};

/**
 * Current configuration
 */
class Config {

  /**
   * Create a config with default options
   *
   * @param {*} newConfig
   */
  static create(newConfig) {
    return config = deepMerge(defaultConfig, newConfig);
  }

  /**
   * Load config from a file.
   * If js file provided: require it and get .config key
   * If json file provided: load and parse JSON
   * If directory provided:
   * * try to load `codecept.conf.js` from it
   * * try to load `codecept.json` from it
   * If none of above: fail.
   *
   * @param {*} configFile
   */
  static load(configFile) {
    configFile = path.resolve(configFile || '.');


    if (!fileExists(configFile)) {
      throw new Error(`Config file ${configFile} does not exist. Execute 'codeceptjs init' to create config`);
    }

    // is config file
    if (isFile(configFile)) {
      return loadConfigFile(configFile);
    }

    // is path to directory
    let jsConfig = path.join(configFile, 'codecept.conf.js');
    if (isFile(jsConfig)) {
      return loadConfigFile(jsConfig);
    }

    let jsonConfig = path.join(configFile, 'codecept.json');
    if (isFile(jsonConfig)) {
      return loadConfigFile(jsonConfig);
    }

    throw new Error(`Can not load config from ${jsConfig} or ${jsonConfig}\nCodeceptJS is not initialized in this dir. Execute 'codeceptjs init' to start`);
  }

  /**
   * Get current config.
   */
  static get() {
    return config;
  }

  /**
   * Appends values to current config
   *
   * @param {*} additionalConfig
   */
  static append(additionalConfig) {
    return config = deepMerge(config, additionalConfig);
  }

  /**
   * Resets config to default
   */
  static reset() {
    return config = defaultConfig;
  }
}

module.exports = Config;

function loadConfigFile(configFile) {
  // .conf.js config file
  if (path.extname(configFile) == '.js') {
    return Config.create(require(configFile).config);
  }

  // json config provided
  if (path.extname(configFile) == '.json') {
    return Config.create(JSON.parse(fs.readFileSync(configFile, 'utf8')));
  }
  throw new Error(`Config file ${configFile} can't be loaded`);
}

