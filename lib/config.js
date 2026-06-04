import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import { fileExists, isFile, deepMerge, deepClone, resolveImportModulePath } from './utils.js'
import { transpileTypeScript, cleanupTempFiles, fixErrorStack } from './utils/typescript.js'

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
    screenshot: {
      enabled: true,
      on: 'fail',
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

// Array<{ fn: (cfg) => void, ran: boolean, error?: Error }>
let hooks = []
let config = {}

// Apply a single hook against `cfg`, swallowing errors so one broken hook
// can't take down the whole run. The failure is logged through the
// framework's own output module (when available) so it shows up in test
// reports; the hook is still marked ran so it doesn't get retried.
function applyHook(hook, cfg) {
  try {
    hook.fn(cfg)
  } catch (err) {
    hook.error = err
    const out = globalThis.codeceptjs?.output
    if (out && typeof out.error === 'function') out.error(`config hook failed: ${err.message}`)
    else console.error('config hook failed:', err)
  } finally {
    hook.ran = true
  }
}

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
    // Re-apply every hook against the freshly built config; hooks added later
    // (e.g. from plugin boot) stay pending until runPendingHooks. Array
    // iterators re-check length on each step, so hooks pushed during a hook
    // execution are visited in this same pass.
    for (const hook of hooks) applyHook(hook, config)
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
    hooks.push({ fn, ran: false })
  }

  /**
   * Run every hook that hasn't been applied to the current config yet.
   * Hooks added after `Config.create()` (e.g. from plugin boot code) stay
   * pending until this is called; once it runs, they're marked applied so
   * subsequent calls are no-ops. Hooks added while pending hooks are running
   * are picked up in the same pass (the array iterator re-checks length).
   *
   * Failures are logged through `output.error` and don't abort the loop —
   * a broken hook can't poison the run, but its error is visible.
   *
   * @param {Object<string, *>} [cfg] target config (defaults to the live singleton)
   * @return {boolean} true if any hook ran
   */
  static runPendingHooks(cfg = config) {
    let ran = false
    for (const hook of hooks) {
      if (hook.ran) continue
      applyHook(hook, cfg)
      ran = true
    }
    return ran
  }

  /**
   * Number of registered config hooks. Useful for snapshotting before a phase
   * (e.g. plugin loading) and re-running only the hooks added during it.
   * @return {number}
   */
  static hooksCount() {
    return hooks.length
  }

  /**
   * Run hooks in `[fromIndex, end)` against the given config object, mutating it.
   * @param {number} fromIndex
   * @param {Object<string, *>} cfg
   */
  static runHooksFrom(fromIndex, cfg) {
    for (let i = fromIndex; i < hooks.length; i++) hooks[i](cfg)
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

  // Populate the in-process registry that packages like @codeceptjs/configure
  // look up at config-import time (their proxies throw if `globalThis.codeceptjs`
  // is missing). initCodeceptGlobals sets this too, but only later during
  // bootstrap — config files are imported here first.
  if (!globalThis.codeceptjs) {
    const indexModule = await import('./index.js')
    globalThis.codeceptjs = indexModule.default || indexModule
  }

  // .conf.js config file
  if (extensionName === '.js' || extensionName === '.ts' || extensionName === '.cjs') {
    let configModule
    try {
      // For .ts files, try to compile and load as JavaScript
      if (extensionName === '.ts') {
        let transpileError = null
        let tempFile = null
        let allTempFiles = null
        let fileMapping = null

        try {
          // Use the TypeScript transpilation utility
          const typescript = require('typescript')
          const result = await transpileTypeScript(configFile, typescript)
          tempFile = result.tempFile
          allTempFiles = result.allTempFiles
          fileMapping = result.fileMapping

          const resolvedPath = resolveImportModulePath(tempFile)
          configModule = await import(resolvedPath)
          cleanupTempFiles(allTempFiles)
        } catch (err) {
          transpileError = err
          if (fileMapping) {
            fixErrorStack(err, fileMapping)
          }
          if (allTempFiles) {
            cleanupTempFiles(allTempFiles)
          }
          // Throw immediately with the actual error - don't fall back to ts-node
          // as it will mask the real error with "Unexpected token 'export'"
          throw err
        }
      } else {
        // Try ESM import first for JS files
        const resolvedPath = resolveImportModulePath(configFile)
        configModule = await import(resolvedPath)
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
