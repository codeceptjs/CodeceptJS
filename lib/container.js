import { globSync } from 'glob'
import path from 'path'
import fs from 'fs'
import debugModule from 'debug'
const debug = debugModule('codeceptjs:container')
import { MetaStep } from './step.js'
import { methodsOfObject, fileExists, isFunction, isAsyncFunction, installedLocally, deepMerge } from './utils.js'
import Translation from './translation.js'
import MochaFactory from './mocha/factory.js'
import recorder from './recorder.js'
import event from './event.js'
import WorkerStorage from './workerStorage.js'
import store from './store.js'
import Result from './result.js'
import ai from './ai.js'
import actorFactory from './actor.js'

let asyncHelperPromise

let container = {
  helpers: {},
  support: {},
  proxySupport: {},
  plugins: {},
  actor: null,
  /**
   * @type {Mocha | {}}
   * @ignore
   */
  mocha: {},
  translation: {},
  /** @type {Result | null} */
  result: null,
  sharedKeys: new Set() // Track keys shared via share() function
}

/**
 * Dependency Injection Container
 */
class Container {
  /**
   * Get the standard acting helpers of CodeceptJS Container
   *
   */
  static get STANDARD_ACTING_HELPERS() {
    return ['Playwright', 'WebDriver', 'Puppeteer', 'Appium']
  }
  /**
   * Create container with all required helpers and support objects
   *
   * @api
   * @param {*} config
   * @param {*} opts
   */
  static async create(config, opts) {
    debug('creating container')
    asyncHelperPromise = Promise.resolve()

    // dynamically create mocha instance
    const mochaConfig = config.mocha || {}
    if (config.grep && !opts.grep) mochaConfig.grep = config.grep
    this.createMocha = () => (container.mocha = MochaFactory.create(mochaConfig, opts || {}))
    this.createMocha()

    // create support objects
    container.support = {}
    container.helpers = await createHelpers(config.helpers || {})
    container.translation = await loadTranslation(config.translation || null, config.vocabularies || [])
    container.proxySupport = createSupportObjects(config.include || {})
    container.plugins = await createPlugins(config.plugins || {}, opts)
    container.result = new Result()

    // Preload includes (so proxies can expose real objects synchronously)
    const includes = config.include || {}

    // Ensure I is available for DI modules at import time
    if (Object.prototype.hasOwnProperty.call(includes, 'I')) {
      try {
        const mod = includes.I
        if (typeof mod === 'string') {
          container.support.I = await loadSupportObject(mod, 'I')
        } else if (typeof mod === 'function') {
          container.support.I = await loadSupportObject(mod, 'I')
        } else if (mod && typeof mod === 'object') {
          container.support.I = mod
        }
      } catch (e) {
        throw new Error(`Could not include object I: ${e.message}`)
      }
    } else {
      // Create default actor if not provided via includes
      createActor()
    }

    // Load remaining includes except I
    for (const [name, mod] of Object.entries(includes)) {
      if (name === 'I') continue
      try {
        if (typeof mod === 'string') {
          container.support[name] = await loadSupportObject(mod, name)
        } else if (typeof mod === 'function') {
          // function or class
          container.support[name] = await loadSupportObject(mod, name)
        } else if (mod && typeof mod === 'object') {
          container.support[name] = mod
        }
      } catch (e) {
        throw new Error(`Could not include object ${name}: ${e.message}`)
      }
    }

    if (opts && opts.ai) ai.enable(config.ai) // enable AI Assistant
    if (config.gherkin) await loadGherkinStepsAsync(config.gherkin.steps || [])
    if (opts && typeof opts.timeouts === 'boolean') store.timeouts = opts.timeouts
  }

  static actor() {
    return container.support.I
  }

  /**
   * Get all plugins
   *
   * @api
   * @param {string} [name]
   * @returns { * }
   */
  static plugins(name) {
    if (!name) {
      return container.plugins
    }
    return container.plugins[name]
  }

  /**
   * Get all support objects or get support object by name
   *
   * @api
   * @param {string} [name]
   * @returns { * }
   */
  static support(name) {
    if (!name) {
      return container.proxySupport
    }
    // Always return the proxy to ensure MetaStep creation works
    return container.proxySupport[name]
  }

  /**
   * Get all helpers or get a helper by name
   *
   * @api
   * @param {string} [name]
   * @returns { * }
   */
  static helpers(name) {
    if (!name) {
      return container.helpers
    }
    return container.helpers[name]
  }

  /**
   * Get translation
   *
   * @api
   */
  static translation() {
    return container.translation
  }

  /**
   * Get Mocha instance
   *
   * @api
   * @returns { * }
   */
  static mocha() {
    return container.mocha
  }

  /**
   * Get result
   *
   * @returns {Result}
   */
  static result() {
    if (!container.result) {
      container.result = new Result()
    }
    return container.result
  }

  /**
   * Append new services to container
   *
   * @api
   * @param {Object<string, *>} newContainer
   */
  static append(newContainer) {
    container = deepMerge(container, newContainer)

    // If new support objects are added, update the proxy support
    if (newContainer.support) {
      const newProxySupport = createSupportObjects(newContainer.support)
      container.proxySupport = { ...container.proxySupport, ...newProxySupport }
    }

    debug('appended', JSON.stringify(newContainer).slice(0, 300))
  }

  /**
   * Clear container
   *
   * @param {Object<string, *>} newHelpers
   * @param {Object<string, *>} newSupport
   * @param {Object<string, *>} newPlugins
   */
  static async clear(newHelpers = {}, newSupport = {}, newPlugins = {}) {
    container.helpers = newHelpers
    container.translation = await loadTranslation()
    container.proxySupport = createSupportObjects(newSupport)
    container.plugins = newPlugins
    container.sharedKeys = new Set() // Clear shared keys
    asyncHelperPromise = Promise.resolve()
    store.actor = null
    debug('container cleared')
  }

  /**
   * @param {Function|null} fn
   * @returns {Promise<void>}
   */
  static async started(fn = null) {
    if (fn) {
      asyncHelperPromise = asyncHelperPromise.then(fn)
    }
    return asyncHelperPromise
  }

  /**
   * Share data across worker threads
   *
   * @param {Object} data
   * @param {Object} options - set {local: true} to not share among workers
   */
  static share(data, options = {}) {
    // Instead of using append which replaces the entire container,
    // directly update the support object to maintain proxy references
    Object.assign(container.support, data)
    
    // Track which keys were explicitly shared
    Object.keys(data).forEach(key => container.sharedKeys.add(key))
    
    if (!options.local) {
      WorkerStorage.share(data)
    }
  }

  static createMocha(config = {}, opts = {}) {
    const mochaConfig = config?.mocha || {}
    if (config?.grep && !opts?.grep) {
      mochaConfig.grep = config.grep
    }
    container.mocha = MochaFactory.create(mochaConfig, opts || {})
  }
}

export default Container

async function createHelpers(config) {
  const helpers = {}
  for (let helperName in config) {
    try {
      let HelperClass

      // Check if helper class was stored in config during ESM import processing
      if (config[helperName]._helperClass) {
        HelperClass = config[helperName]._helperClass
        debug(`helper ${helperName} loaded from ESM import`)
      }

      // ESM import (legacy check)
      if (!HelperClass && typeof helperName === 'function' && helperName.prototype) {
        HelperClass = helperName
        helperName = HelperClass.constructor.name
      }

      // classical require - may be async for ESM modules
      if (!HelperClass) {
        const helperResult = requireHelperFromModule(helperName, config)
        if (helperResult instanceof Promise) {
          // Handle async ESM loading
          helpers[helperName] = {}
          asyncHelperPromise = asyncHelperPromise
            .then(() => helperResult)
            .then(async ResolvedHelperClass => {
              debug(`helper ${helperName} resolved type: ${typeof ResolvedHelperClass}`, ResolvedHelperClass)

              // Extract default export from ESM module wrapper if needed
              if (ResolvedHelperClass && ResolvedHelperClass.__esModule && ResolvedHelperClass.default) {
                ResolvedHelperClass = ResolvedHelperClass.default
                debug(`extracted default export for ${helperName}, new type: ${typeof ResolvedHelperClass}`)
              }

              if (typeof ResolvedHelperClass !== 'function') {
                throw new Error(`Helper '${helperName}' is not a class. Got: ${typeof ResolvedHelperClass}`)
              }

              checkHelperRequirements(ResolvedHelperClass)
              helpers[helperName] = new ResolvedHelperClass(config[helperName])
              if (helpers[helperName]._init) await helpers[helperName]._init()
              debug(`helper ${helperName} async initialized`)
            })
          continue
        } else {
          HelperClass = helperResult
        }
      }

      // handle async CJS modules that use dynamic import
      if (isAsyncFunction(HelperClass)) {
        helpers[helperName] = {}

        asyncHelperPromise = asyncHelperPromise
          .then(() => HelperClass())
          .then(ResolvedHelperClass => {
            // Check if ResolvedHelperClass is a constructor function
            if (typeof ResolvedHelperClass?.constructor !== 'function') {
              throw new Error(`Helper class from module '${helperName}' is not a class. Use CJS async module syntax.`)
            }

            debug(`helper ${helperName} async initialized`)

            helpers[helperName] = new ResolvedHelperClass(config[helperName])
          })

        continue
      }

      checkHelperRequirements(HelperClass)

      helpers[helperName] = new HelperClass(config[helperName])
      debug(`helper ${helperName} initialized`)
    } catch (err) {
      throw new Error(`Could not load helper ${helperName} (${err.message})`)
    }
  }

  for (const name in helpers) {
    if (helpers[name]._init) await helpers[name]._init()
  }
  return helpers
}

function checkHelperRequirements(HelperClass) {
  if (HelperClass._checkRequirements) {
    const requirements = HelperClass._checkRequirements()
    if (requirements) {
      let install
      if (installedLocally()) {
        install = `npm install --save-dev ${requirements.join(' ')}`
      } else {
        console.log('WARNING: CodeceptJS is not installed locally. It is recommended to switch to local installation')
        install = `[sudo] npm install -g ${requirements.join(' ')}`
      }
      throw new Error(`Required modules are not installed.\n\nRUN: ${install}`)
    }
  }
}

async function requireHelperFromModule(helperName, config, HelperClass) {
  const moduleName = getHelperModuleName(helperName, config)
  if (moduleName.startsWith('./helper/')) {
    try {
      // For built-in helpers, use direct relative import with .js extension
      const helperPath = `${moduleName}.js`
      const mod = await import(helperPath)
      HelperClass = mod.default || mod
    } catch (err) {
      throw err
    }
  } else {
    // check if the new syntax export default HelperName is used and loads the Helper, otherwise loads the module that used old syntax export = HelperName.
    try {
      // Try dynamic import for both CommonJS and ESM modules
      const mod = await import(moduleName)
      if (!mod && !mod.default) {
        throw new Error(`Helper module '${moduleName}' was not found. Make sure you have installed the package correctly.`)
      }
      HelperClass = mod.default || mod
    } catch (err) {
      if (err.code === 'ERR_REQUIRE_ESM' || (err.message && err.message.includes('ES module'))) {
        // This is an ESM module, use dynamic import
        try {
          const pathModule = await import('path')
          const absolutePath = pathModule.default.resolve(moduleName)
          const mod = await import(absolutePath)
          HelperClass = mod.default || mod
          debug(`helper ${helperName} loaded via ESM import`)
        } catch (importErr) {
          throw new Error(`Helper module '${moduleName}' could not be imported as ESM: ${importErr.message}`)
        }
      } else if (err.code === 'MODULE_NOT_FOUND') {
        throw new Error(`Helper module '${moduleName}' was not found. Make sure you have installed the package correctly.`)
      } else {
        throw err
      }
    }
  }
  return HelperClass
}

function createSupportObjects(config) {
  const asyncWrapper = function (f) {
    return function () {
      return f.apply(this, arguments).catch(e => {
        recorder.saveFirstAsyncError(e)
        throw e
      })
    }
  }

  function lazyLoad(name) {
    return new Proxy(
      {},
      {
        get(target, prop) {
          // behavr like array or
          if (prop === 'length') return Object.keys(config).length
          if (prop === Symbol.iterator) {
            return function* () {
              for (let i = 0; i < Object.keys(config).length; i++) {
                yield target[i]
              }
            }
          }

          // load actual name from vocabulary
          if (container.translation && container.translation.I && name === 'I') {
            // Use translated name for I
            const actualName = container.translation.I
            if (actualName !== 'I') {
              name = actualName
            }
          }

          if (name === 'I') {
            if (!container.support.I) {
              // Actor will be created during container.create()
              return undefined
            }
            methodsOfObject(container.support.I)
            return container.support.I[prop]
          }

          if (!container.support[name] && typeof config[name] === 'object') {
            container.support[name] = config[name]
          }

          if (!container.support[name]) {
            // Cannot load object synchronously in proxy getter
            // Return undefined and log warning - object should be pre-loaded during container creation
            debug(`Support object ${name} not pre-loaded, returning undefined`)
            return undefined
          }

          const currentObject = container.support[name]
          let currentValue = currentObject[prop]

          if (isFunction(currentValue) || isAsyncFunction(currentValue)) {
            const ms = new MetaStep(name, prop)
            ms.setContext(currentObject)
            if (isAsyncFunction(currentValue)) currentValue = asyncWrapper(currentValue)
            debug(`metastep is created for ${name}.${prop.toString()}()`)
            return ms.run.bind(ms, currentValue)
          }

          return currentValue
        },
        has(target, prop) {
          if (!container.support[name]) {
            // Note: This is sync, so we can't use async loadSupportObject here
            // The object will be loaded lazily on first property access
            return false
          }
          return prop in container.support[name]
        },
        getOwnPropertyDescriptor(target, prop) {
          if (!container.support[name]) {
            // Object will be loaded on property access
            return {
              enumerable: true,
              configurable: true,
              value: undefined,
            }
          }
          return {
            enumerable: true,
            configurable: true,
            value: container.support[name][prop],
          }
        },
        ownKeys() {
          if (!container.support[name]) {
            return []
          }
          return Reflect.ownKeys(container.support[name])
        },
      },
    )
  }

  const keys = Reflect.ownKeys(config)
  return new Proxy(
    {},
    {
      has(target, key) {
        return keys.includes(key) || container.sharedKeys.has(key)
      },
      ownKeys() {
        // Return both original config keys and explicitly shared keys
        return [...new Set([...keys, ...container.sharedKeys])]
      },
      getOwnPropertyDescriptor(target, prop) {
        return {
          enumerable: true,
          configurable: true,
          value: target[prop],
        }
      },
      get(target, key) {
        // First check if this is an explicitly shared property
        if (container.sharedKeys.has(key) && key in container.support) {
          return container.support[key]
        }
        return lazyLoad(key)
      },
    },
  )
}

function createActor(actorPath) {
  if (container.support.I) return container.support.I

  // Default actor
  container.support.I = actorFactory({}, Container)

  return container.support.I
}

async function loadPluginAsync(modulePath, config) {
  let pluginMod
  try {
    // Try dynamic import first (works for both ESM and CJS)
    pluginMod = await import(modulePath)
  } catch (err) {
    throw new Error(`Could not load plugin from '${modulePath}': ${err.message}`)
  }

  const pluginFactory = pluginMod.default || pluginMod
  if (typeof pluginFactory !== 'function') {
    throw new Error(`Plugin '${modulePath}' is not a function. Expected a plugin factory function.`)
  }

  return pluginFactory(config)
}

async function loadPluginFallback(modulePath, config) {
  // This function is kept for backwards compatibility but now uses dynamic import
  return await loadPluginAsync(modulePath, config)
}

async function createPlugins(config, options = {}) {
  const plugins = {}

  const enabledPluginsByOptions = (options.plugins || '').split(',')
  for (const pluginName in config) {
    if (!config[pluginName]) config[pluginName] = {}
    if (!config[pluginName].enabled && enabledPluginsByOptions.indexOf(pluginName) < 0) {
      continue // plugin is disabled
    }
    let module
    try {
      if (config[pluginName].require) {
        module = config[pluginName].require
        if (module.startsWith('.')) {
          // local
          module = path.resolve(global.codecept_dir, module) // custom plugin
        }
      } else {
        module = `./plugin/${pluginName}.js`
      }

      // Use async loading for all plugins (ESM and CJS)
      plugins[pluginName] = await loadPluginAsync(module, config[pluginName])
      debug(`plugin ${pluginName} loaded via async import`)
    } catch (err) {
      throw new Error(`Could not load plugin ${pluginName} from module '${module}':\n${err.message}\n${err.stack}`)
    }
  }
  return plugins
}

async function loadGherkinStepsAsync(paths) {
  global.Before = fn => event.dispatcher.on(event.test.started, fn)
  global.After = fn => event.dispatcher.on(event.test.finished, fn)
  global.Fail = fn => event.dispatcher.on(event.test.failed, fn)

  // Import BDD module to access step file tracking functions
  const bddModule = await import('./mocha/bdd.js')

  // If gherkin.steps is string, then this will iterate through that folder and send all step def js files to loadSupportObject
  // If gherkin.steps is Array, it will go the old way
  // This is done so that we need not enter all Step Definition files under config.gherkin.steps
  if (Array.isArray(paths)) {
    for (const path of paths) {
      // Set context for step definition file location tracking
      bddModule.setCurrentStepFile(path)
      await loadSupportObject(path, `Step Definition from ${path}`)
      bddModule.clearCurrentStepFile()
    }
  } else {
    const folderPath = paths.startsWith('.') ? normalizeAndJoin(global.codecept_dir, paths) : ''
    if (folderPath !== '') {
      const files = globSync(folderPath)
      for (const file of files) {
        // Set context for step definition file location tracking
        bddModule.setCurrentStepFile(file)
        await loadSupportObject(file, `Step Definition from ${file}`)
        bddModule.clearCurrentStepFile()
      }
    }
  }

  delete global.Before
  delete global.After
  delete global.Fail
}

function loadGherkinSteps(paths) {
  global.Before = fn => event.dispatcher.on(event.test.started, fn)
  global.After = fn => event.dispatcher.on(event.test.finished, fn)
  global.Fail = fn => event.dispatcher.on(event.test.failed, fn)

  // Gherkin step loading must be handled asynchronously
  throw new Error('Gherkin step loading must be converted to async. Use loadGherkinStepsAsync() instead.')

  delete global.Before
  delete global.After
  delete global.Fail
}

async function loadSupportObject(modulePath, supportObjectName) {
  if (!modulePath) {
    throw new Error(`Support object "${supportObjectName}" is not defined`)
  }
  // If function/class provided directly
  if (typeof modulePath === 'function') {
    try {
      // class constructor
      if (modulePath.prototype && modulePath.prototype.constructor === modulePath) {
        return new modulePath()
      }
      // plain function factory
      return modulePath()
    } catch (err) {
      throw new Error(`Could not include object ${supportObjectName} from function: ${err.message}`)
    }
  }
  if (typeof modulePath === 'string' && modulePath.charAt(0) === '.') {
    modulePath = path.join(global.codecept_dir, modulePath)
  }
  try {
    // Use dynamic import for both ESM and CJS modules
    let importPath = modulePath
    let tempJsFile = null
    
    if (typeof importPath === 'string') {
      const ext = path.extname(importPath)
      
      // Handle TypeScript files
      if (ext === '.ts') {
        try {
          const { transpile } = await import('typescript')
          
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
          const baseDir = path.dirname(importPath)
          
          // Transpile main file
          let jsContent = transpileTS(importPath)
          
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
              debug(`Transpiled dependency: ${importedPath} -> ${tempImportFile}`)
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

          // Create a temporary JS file with .mjs extension for the main file
          tempJsFile = importPath.replace(/\.ts$/, '.temp.mjs')
          fs.writeFileSync(tempJsFile, jsContent)
          
          // Store all temp files for cleanup
          const allTempFiles = [tempJsFile, ...Array.from(transpiledFiles.values())]
          
          // Attach cleanup handler
          importPath = tempJsFile
          // Store temp files list in a way that cleanup can access them
          tempJsFile = allTempFiles
          
        } catch (tsError) {
          throw new Error(`Failed to load TypeScript file ${importPath}: ${tsError.message}. Make sure 'typescript' package is installed.`)
        }
      } else if (!ext) {
        // Append .js if no extension provided (ESM resolution requires it)
        importPath = `${importPath}.js`
      }
    }
    
    let obj
    try {
      obj = await import(importPath)
    } catch (importError) {
      // Clean up temp files if created before rethrowing
      if (tempJsFile) {
        const filesToClean = Array.isArray(tempJsFile) ? tempJsFile : [tempJsFile]
        for (const file of filesToClean) {
          try {
            if (fs.existsSync(file)) {
              fs.unlinkSync(file)
            }
          } catch (cleanupError) {
            // Ignore cleanup errors
          }
        }
      }
      throw importError
    } finally {
      // Clean up temp files if created
      if (tempJsFile) {
        const filesToClean = Array.isArray(tempJsFile) ? tempJsFile : [tempJsFile]
        for (const file of filesToClean) {
          try {
            if (fs.existsSync(file)) {
              fs.unlinkSync(file)
            }
          } catch (cleanupError) {
            // Ignore cleanup errors
          }
        }
      }
    }

    // Handle ESM module wrapper
    let actualObj = obj
    if (obj && obj.__esModule && obj.default) {
      actualObj = obj.default
    } else if (obj.default) {
      actualObj = obj.default
    }

    // Handle different types of imports
    if (typeof actualObj === 'function') {
      // If it's a class (constructor function)
      if (actualObj.prototype && actualObj.prototype.constructor === actualObj) {
        const ClassName = actualObj
        return new ClassName()
      }
      // If it's a regular function
      return actualObj()
    }

    if (actualObj && Array.isArray(actualObj)) {
      return actualObj
    }

    // If it's a plain object
    if (actualObj && typeof actualObj === 'object') {
      // Call _init if it exists (for page objects)
      if (actualObj._init && typeof actualObj._init === 'function') {
        actualObj._init()
      }
      return actualObj
    }

    throw new Error(`Support object "${supportObjectName}" should be an object, class, or function, but got ${typeof actualObj}`)
  } catch (err) {
    throw new Error(`Could not include object ${supportObjectName} from module '${modulePath}'\n${err.message}\n${err.stack}`)
  }
}

// Backwards compatibility function that throws an error for sync usage
function loadSupportObjectSync(modulePath, supportObjectName) {
  throw new Error(`loadSupportObjectSync is deprecated. Support object "${supportObjectName || 'undefined'}" from '${modulePath}' must be loaded asynchronously. Use loadSupportObject() instead.`)
}

/**
 * Method collect own property and prototype
 */

async function loadTranslation(locale, vocabularies) {
  if (!locale) {
    return Translation.createEmpty()
  }

  let translation

  // check if it is a known translation
  const langs = await Translation.getLangs()
  if (langs[locale]) {
    translation = new Translation(langs[locale])
  } else if (fileExists(path.join(global.codecept_dir, locale))) {
    // get from a provided file instead
    translation = Translation.createDefault()
    translation.loadVocabulary(locale)
  } else {
    translation = Translation.createDefault()
  }

  vocabularies.forEach(v => translation.loadVocabulary(v))

  return translation
}

function getHelperModuleName(helperName, config) {
  // classical require
  if (config[helperName].require) {
    if (config[helperName].require.startsWith('.')) {
      let helperPath = path.resolve(global.codecept_dir, config[helperName].require)
      // Add .js extension if not present for ESM compatibility
      if (!path.extname(helperPath)) {
        helperPath += '.js'
      }
      return helperPath // custom helper
    }
    return config[helperName].require // plugin helper
  }

  // built-in helpers
  if (helperName.startsWith('@codeceptjs/')) {
    return helperName
  }

  // built-in helpers
  return `./helper/${helperName}`
}
function normalizeAndJoin(basePath, subPath) {
  // Normalize and convert slashes to forward slashes in one step
  const normalizedBase = path.posix.normalize(basePath.replace(/\\/g, '/'))
  const normalizedSub = path.posix.normalize(subPath.replace(/\\/g, '/'))

  // If subPath is absolute (starts with "/"), return it as the final path
  if (normalizedSub.startsWith('/')) {
    return normalizedSub
  }

  // Join the paths using POSIX-style
  return path.posix.join(normalizedBase, normalizedSub)
}
