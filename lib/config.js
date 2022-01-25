const fs = require('fs');
const path = require('path');
const {
  fileExists,
  isFile,
  deepMerge,
  deepClone,
} = require('./utils');

const defaultConfig = {
  output: './_output',
  helpers: {},
  include: {},
  mocha: {},
  bootstrap: null,
  timeout: null,
  teardown: null,
  hooks: [],
  gherkin: {},
  plugins: {
    screenshotOnFail: {
      enabled: true, // will be disabled by default in 2.0
    },
  },
  stepTimeout: 0,
  stepTimeoutOverride: [
    {
      pattern: 'wait.*',
      timeout: 0,
    },
    {
      pattern: 'amOnPage',
      timeout: 0,
    },
  ],
};

let hooks = [];
let config = {};

const configFileNames = [
  'codecept.config.js',
  'codecept.conf.js',
  'codecept.json',
  'codecept.config.ts',
  'codecept.conf.ts',
];

/**
 * Current configuration
 */
class Config {
  /**
   * Create a config with default options
   *
   * @param {*} newConfig
   * @return {Object<string, *>}
   */
  static create(newConfig) {
    config = deepMerge(deepClone(defaultConfig), newConfig);
    hooks.forEach(f => f(config));
    return config;
  }

  /**
   * Load config from a file.
   * If js file provided: require it and get .config key
   * If json file provided: load and parse JSON
   * If directory provided:
   * * try to load `codecept.config.js` from it
   * * try to load `codecept.conf.js` from it
   * * try to load `codecept.json` from it
   * If none of above: fail.
   *
   * @param {string} configFile
   * @return {*}
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

    for (const name of configFileNames) {
      // is path to directory
      const jsConfig = path.join(configFile, name);

      if (isFile(jsConfig)) {
        return loadConfigFile(jsConfig);
      }
    }

    const configPaths = configFileNames.map(name => path.join(configFile, name)).join(' or ');

    throw new Error(`Can not load config from ${configPaths}\nCodeceptJS is not initialized in this dir. Execute 'codeceptjs init' to start`);
  }

  /**
   * Get current config.
   * @param {string} [key]
   * @param {*} [val]
   * @return {*}
   */
  static get(key, val) {
    if (key) {
      return config[key] || val;
    }
    return config;
  }

  static addHook(fn) {
    hooks.push(fn);
  }

  /**
   * Appends values to current config
   *
   * @param {Object<string, *>} additionalConfig
   * @return {Object<string, *>}
   */
  static append(additionalConfig) {
    return config = deepMerge(config, additionalConfig);
  }

  /**
   * Resets config to default
   * @return {Object<string, *>}
   */
  static reset() {
    hooks = [];
    return config = { ...defaultConfig };
  }
}

module.exports = Config;

function loadConfigFile(configFile) {
  const extensionName = path.extname(configFile);

  // .conf.js config file
  if (extensionName === '.js' || extensionName === '.ts' || extensionName === '.cjs') {
    return Config.create(require(configFile).config);
  }

  // json config provided
  if (extensionName === '.json') {
    return Config.create(JSON.parse(fs.readFileSync(configFile, 'utf8')));
  }

  throw new Error(`Config file ${configFile} can't be loaded`);
}
