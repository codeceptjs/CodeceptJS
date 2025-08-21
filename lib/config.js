import fs from 'fs';
import path from 'path';
import { fileExists, isFile, deepMerge, deepClone } from './utils.js';

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
}

let hooks = []
let config = {}

const configFileNames = ['codecept.config.js', 'codecept.conf.js', 'codecept.js', 'codecept.config.mjs', 'codecept.conf.mjs', 'codecept.config.ts', 'codecept.conf.ts']

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
    config = deepMerge(deepClone(defaultConfig), newConfig)
    hooks.forEach(f => f(config))
    return config
  }

  /**
   * Load config from a file.
   * If js file provided: require it and get .config key
   * If json file provided: load and parse JSON
   * If directory provided:
   * * try to load `codecept.config.js` from it
   * * try to load `codecept.conf.js` from it
   * * try to load `codecept.js` from it
   * If none of above: fail.
   *
   * @param {string} configFile
   * @return {Promise<*>}
   */
  static async load(configFile) {
    configFile = path.resolve(configFile || '.')

    if (!fileExists(configFile)) {
      configFile = configFile.replace('.js', '.ts')

      if (!fileExists(configFile)) {
        throw new Error(`Config file ${configFile} does not exist. Execute 'codeceptjs init' to create config`)
      }
    }

    // is config file
    if (isFile(configFile)) {
      return loadConfigFile(configFile)
    }

    for (const name of configFileNames) {
      // is path to directory
      const jsConfig = path.join(configFile, name)

      if (isFile(jsConfig)) {
        return loadConfigFile(jsConfig)
      }
    }

    const configPaths = configFileNames.map(name => path.join(configFile, name)).join(' or ')

    throw new Error(`Can not load config from ${configPaths}\nCodeceptJS is not initialized in this dir. Execute 'codeceptjs init' to start`)
  }

  /**
   * Synchronous config loader for backward compatibility.
   * Falls back to async loading if ESM is detected.
   * @param {string} configFile
   * @returns {*}
   */
  static loadSync(configFile) {
    configFile = path.resolve(configFile || '.')

    if (!fileExists(configFile)) {
      configFile = configFile.replace('.js', '.ts')

      if (!fileExists(configFile)) {
        throw new Error(`Config file ${configFile} does not exist. Execute 'codeceptjs init' to create config`)
      }
    }

    // is config file
    if (isFile(configFile)) {
      return loadConfigFileSync(configFile)
    }

    for (const name of configFileNames) {
      // is path to directory
      const jsConfig = path.join(configFile, name)

      if (isFile(jsConfig)) {
        return loadConfigFileSync(jsConfig)
      }
    }

    const configPaths = configFileNames.map(name => path.join(configFile, name)).join(' or ')

    throw new Error(`Can not load config from ${configPaths}\nCodeceptJS is not initialized in this dir. Execute 'codeceptjs init' to start`)
  }

  /**
   * Get current config.
   * @param {string} [key]
   * @param {*} [val]
   * @return {*}
   */
  static get(key, val) {
    if (key) {
      return config[key] || val
    }
    return config
  }

  static addHook(fn) {
    hooks.push(fn)
  }

  /**
   * Appends values to current config
   *
   * @param {Object<string, *>} additionalConfig
   * @return {Object<string, *>}
   */
  static append(additionalConfig) {
    return (config = deepMerge(config, additionalConfig))
  }

  /**
   * Resets config to default
   * @return {Object<string, *>}
   */
  static reset() {
    hooks = []
    return (config = { ...defaultConfig })
  }
}

export default Config;

export { loadConfigFile, loadConfigFileSync };

/**
 * Check if a file should be treated as ESM
 * @param {string} configFile
 * @returns {boolean}
 */
function isEsmModule(configFile) {
  const extensionName = path.extname(configFile)

  // .mjs files are always ESM
  if (extensionName === '.mjs') {
    return true
  }

  // Check if the nearest package.json has "type": "module"
  if (extensionName === '.js') {
    return hasEsmTypeInPackageJson(configFile)
  }

  return false
}

/**
 * Find the nearest package.json and check if it has "type": "module"
 * @param {string} startPath
 * @returns {boolean}
 */
function hasEsmTypeInPackageJson(startPath) {
  let currentDir = path.dirname(path.resolve(startPath))

  while (currentDir !== path.dirname(currentDir)) {
    const packageJsonPath = path.join(currentDir, 'package.json')

    if (fileExists(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
        return packageJson.type === 'module'
      } catch (err) {
        // Invalid package.json, continue searching
      }
    }

    currentDir = path.dirname(currentDir)
  }

  return false
}

async function loadConfigFile(configFile) {
  const extensionName = path.extname(configFile)

  if (extensionName === '.ts') {
    try {
      // For ESM context, register ts-node properly
      await import('ts-node/esm');
    } catch (err) {
      try {
        // Fallback to traditional register
        await import('ts-node/register');
      } catch (err2) {
        console.log('ts-node package is required to parse codecept.conf.ts config correctly')
        throw new Error('TypeScript config files cannot be loaded without ts-node. Please install ts-node: npm install ts-node')
      }
    }
  }

  // .conf.js, .conf.mjs, .conf.ts, or .conf.cjs config file
  if (extensionName === '.js' || extensionName === '.mjs' || extensionName === '.ts' || extensionName === '.cjs') {
    // Check if this should be treated as an ESM module
    if (isEsmModule(configFile)) {
      try {
        // Use dynamic import for ESM modules
        const module = await import(path.resolve(configFile))
        const configObject = module.config || module.default || module
        return Config.create(configObject)
      } catch (err) {
        // If dynamic import fails, try require as fallback for better error messages
        if (err.code === 'ERR_REQUIRE_ESM') {
          throw new Error(`Config file ${configFile} is an ES module. Please ensure your configuration is properly exported using 'export const config = {...}' or 'export default {...}'`)
        }
        throw err
      }
    } else {
      // Use dynamic import for CommonJS modules too in ESM context
      const module = await import(path.resolve(configFile))
      const configObject = module.config || module.default || module
      return Config.create(configObject)
    }
  }

  // json config provided
  if (extensionName === '.json') {
    return Config.create(JSON.parse(fs.readFileSync(configFile, 'utf8')))
  }

  throw new Error(`Config file ${configFile} can't be loaded`)
}

function loadConfigFileSync(configFile) {
  const extensionName = path.extname(configFile)

  if (extensionName === '.ts') {
    throw new Error('TypeScript config files cannot be loaded synchronously in ESM environment. Please use loadConfigFile() instead.')
  }

  // .conf.js, .conf.mjs, .conf.ts, or .conf.cjs config file
  if (extensionName === '.js' || extensionName === '.mjs' || extensionName === '.ts' || extensionName === '.cjs') {
    // Check if this should be treated as an ESM module
    if (isEsmModule(configFile)) {
      throw new Error(
        `Config file ${configFile} is an ES module and cannot be loaded synchronously. The file contains 'type: module' in package.json or uses .mjs extension. Please use async configuration loading or switch your config to CommonJS format.`,
      )
    } else {
      throw new Error(
        `Config file ${configFile} cannot be loaded synchronously in ESM environment. Please use loadConfigFile() instead.`
      )
    }
  }

  // json config provided
  if (extensionName === '.json') {
    return Config.create(JSON.parse(fs.readFileSync(configFile, 'utf8')))
  }

  throw new Error(`Config file ${configFile} can't be loaded`)
}
