import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import { fileExists, isFile, deepMerge, deepClone } from './utils.js'

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

const configFileNames = ['codecept.config.js', 'codecept.conf.js', 'codecept.js', 'codecept.config.cjs', 'codecept.conf.cjs', 'codecept.config.ts', 'codecept.conf.ts']

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
   * @return {*}
   */
  static async load(configFile) {
    configFile = path.resolve(configFile || '.')

    if (!fileExists(configFile)) {
      // Try different extensions if the file doesn't exist
      const extensions = ['.ts', '.cjs', '.mjs']
      let found = false
      
      for (const ext of extensions) {
        const altConfig = configFile.replace(/\.js$/, ext)
        if (fileExists(altConfig)) {
          configFile = altConfig
          found = true
          break
        }
      }
      
      if (!found) {
        throw new Error(`Config file ${configFile} does not exist. Execute 'codeceptjs init' to create config`)
      }
    }

    // is config file
    if (isFile(configFile)) {
      return await loadConfigFile(configFile)
    }

    for (const name of configFileNames) {
      // is path to directory
      const jsConfig = path.join(configFile, name)

      if (isFile(jsConfig)) {
        return await loadConfigFile(jsConfig)
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

export default Config

async function loadConfigFile(configFile) {
  const require = createRequire(import.meta.url)
  const extensionName = path.extname(configFile)

  // .conf.js config file
  if (extensionName === '.js' || extensionName === '.ts' || extensionName === '.cjs') {
    let configModule
    try {
      // For .ts files, try to compile and load as JavaScript
      if (extensionName === '.ts') {
        try {
          // Try to load ts-node and compile the file
          const { transpile } = require('typescript')
          const tsContent = fs.readFileSync(configFile, 'utf8')

          // Transpile TypeScript to JavaScript with ES module output
          const jsContent = transpile(tsContent, {
            module: 99, // ModuleKind.ESNext
            target: 99, // ScriptTarget.ESNext
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
          })

          // Create a temporary JS file with .mjs extension to force ES module treatment
          const tempJsFile = configFile.replace('.ts', '.temp.mjs')
          fs.writeFileSync(tempJsFile, jsContent)

          try {
            configModule = await import(tempJsFile)
            // Clean up temp file
            fs.unlinkSync(tempJsFile)
          } catch (err) {
            // Clean up temp file even on error
            if (fs.existsSync(tempJsFile)) {
              fs.unlinkSync(tempJsFile)
            }
            throw err
          }
        } catch (tsError) {
          // If TypeScript compilation fails, fallback to ts-node
          try {
            require('ts-node/register')
            configModule = require(configFile)
          } catch (tsNodeError) {
            throw new Error(`Failed to load TypeScript config: ${tsError.message}`)
          }
        }
      } else {
        // Try ESM import first for JS files
        configModule = await import(configFile)
      }
    } catch (importError) {
      try {
        // Fall back to CommonJS require for .js/.cjs files
        if (extensionName !== '.ts') {
          configModule = require(configFile)
        } else {
          throw importError
        }
      } catch (requireError) {
        throw new Error(`Failed to load config file ${configFile}: ${importError.message}`)
      }
    }

    const rawConfig = configModule.config || configModule.default?.config || configModule.default || configModule

    // Process helpers to extract imported classes
    if (rawConfig.helpers) {
      const processedHelpers = {}
      for (const [helperName, helperConfig] of Object.entries(rawConfig.helpers)) {
        // Check if the helper name itself is a class (ESM import)
        if (typeof helperName === 'function' && helperName.prototype) {
          // This is an imported class, use its constructor name
          const className = helperName.name
          processedHelpers[className] = {
            ...helperConfig,
            _helperClass: helperName,
          }
        } else {
          processedHelpers[helperName] = helperConfig
        }
      }
      rawConfig.helpers = processedHelpers
    }

    return Config.create(rawConfig)
  }

  // json config provided
  if (extensionName === '.json') {
    return Config.create(JSON.parse(fs.readFileSync(configFile, 'utf8')))
  }

  throw new Error(`Config file ${configFile} can't be loaded`)
}
