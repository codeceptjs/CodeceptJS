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
          
          // Recursively transpile the file and its dependencies
          const transpileTS = (filePath) => {
            const tsContent = fs.readFileSync(filePath, 'utf8')
            
            // Transpile TypeScript to JavaScript with ES module output
            let jsContent = transpile(tsContent, {
              module: 99, // ModuleKind.ESNext
              target: 99, // ScriptTarget.ESNext
              esModuleInterop: true,
              allowSyntheticDefaultImports: true,
            })
            
            // Check if the code uses __dirname or __filename (CommonJS globals)
            const usesCommonJSGlobals = /__dirname|__filename/.test(jsContent)
            
            if (usesCommonJSGlobals) {
              // Inject ESM equivalents at the top of the file
              const esmGlobals = `import { fileURLToPath as __fileURLToPath } from 'url';
import { dirname as __dirname_fn } from 'path';
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __dirname_fn(__filename);

`
              jsContent = esmGlobals + jsContent
            }
            
            return jsContent
          }
          
          // Create a map to track transpiled files
          const transpiledFiles = new Map()
          const baseDir = path.dirname(configFile)
          
          // Transpile main file
          let jsContent = transpileTS(configFile)
          
          // Find and transpile all relative TypeScript imports
          // Match: import ... from './file' or '../file' or './file.ts'
          const importRegex = /from\s+['"](\..+?)(?:\.ts)?['"]/g
          let match
          const imports = []
          
          while ((match = importRegex.exec(jsContent)) !== null) {
            imports.push(match[1])
          }
          
          // Transpile each imported TypeScript file
          for (const relativeImport of imports) {
            let importedPath = path.resolve(baseDir, relativeImport)
            
            // Handle .js extensions that might actually be .ts files
            if (importedPath.endsWith('.js')) {
              const tsVersion = importedPath.replace(/\.js$/, '.ts')
              if (fs.existsSync(tsVersion)) {
                importedPath = tsVersion
              }
            }
            
            // Try adding .ts extension if file doesn't exist and no extension provided
            if (!path.extname(importedPath)) {
              if (fs.existsSync(importedPath + '.ts')) {
                importedPath = importedPath + '.ts'
              }
            }
            
            // If it's a TypeScript file, transpile it
            if (importedPath.endsWith('.ts') && fs.existsSync(importedPath)) {
              const transpiledImportContent = transpileTS(importedPath)
              const tempImportFile = importedPath.replace(/\.ts$/, '.temp.mjs')
              fs.writeFileSync(tempImportFile, transpiledImportContent)
              transpiledFiles.set(importedPath, tempImportFile)
            }
          }
          
          // Replace imports in the main file to point to temp .mjs files
          jsContent = jsContent.replace(
            /from\s+['"](\..+?)(?:\.ts)?['"]/g,
            (match, importPath) => {
              let resolvedPath = path.resolve(baseDir, importPath)
              
              // Handle .js extension that might be .ts
              if (resolvedPath.endsWith('.js')) {
                const tsVersion = resolvedPath.replace(/\.js$/, '.ts')
                if (transpiledFiles.has(tsVersion)) {
                  const tempFile = transpiledFiles.get(tsVersion)
                  const relPath = path.relative(baseDir, tempFile).replace(/\\/g, '/')
                  return `from './${relPath}'`
                }
              }
              
              // Try with .ts extension
              const tsPath = resolvedPath.endsWith('.ts') ? resolvedPath : resolvedPath + '.ts'
              
              // If we transpiled this file, use the temp file
              if (transpiledFiles.has(tsPath)) {
                const tempFile = transpiledFiles.get(tsPath)
                // Get relative path from main temp file to this temp file
                const relPath = path.relative(baseDir, tempFile).replace(/\\/g, '/')
                return `from './${relPath}'`
              }
              
              // Otherwise, keep the import as-is
              return match
            }
          )

          // Create a temporary JS file with .mjs extension to force ES module treatment
          const tempJsFile = configFile.replace('.ts', '.temp.mjs')
          fs.writeFileSync(tempJsFile, jsContent)
          
          // Store all temp files for cleanup
          const allTempFiles = [tempJsFile, ...Array.from(transpiledFiles.values())]

          try {
            configModule = await import(tempJsFile)
            // Clean up all temp files
            for (const file of allTempFiles) {
              if (fs.existsSync(file)) {
                fs.unlinkSync(file)
              }
            }
          } catch (err) {
            // Clean up all temp files even on error
            for (const file of allTempFiles) {
              if (fs.existsSync(file)) {
                fs.unlinkSync(file)
              }
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
