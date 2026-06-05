import { globSync } from 'glob'
import path from 'path'
import fs from 'fs'
import { isMainThread } from 'worker_threads'
import debugModule from 'debug'
const debug = debugModule('codeceptjs:container')
import { MetaStep } from './step.js'
import {
  methodsOfObject,
  fileExists,
  isFunction,
  isAsyncFunction,
  installedLocally,
  deepMerge,
  resolveImportModulePath,
} from './utils.js'
import { transpileTypeScript, cleanupTempFiles, fixErrorStack } from './utils/typescript.js'
import Translation from './translation.js'
import MochaFactory from './mocha/factory.js'
import recorder from './recorder.js'
import event from './event.js'
import WorkerStorage from './workerStorage.js'
import store from './store.js'
import Result from './result.js'
import ai from './ai.js'
import actorFactory from './actor.js'
import Config from './config.js'

let asyncHelperPromise

let beforeCalledSet = new Set()

export function getBeforeCalledSet() { return beforeCalledSet }
export function resetBeforeCalledSet() { beforeCalledSet = new Set() }

let container = {
  helpers: {},
  support: {},
  proxySupport: {},
  proxySupportConfig: {}, // Track config used to create proxySupport
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
  sharedKeys: new Set(), // Track keys shared via share() function
  tsFileMapping: null, // TypeScript file mapping for error stack fixing
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
    container.proxySupportConfig = config.include || {}
    container.proxySupport = createSupportObjects(container.proxySupportConfig)
    container.plugins = await createPlugins(config.plugins || {}, opts)
    container.result = new Result()

    // Preload includes (so proxies can expose real objects synchronously)
    const includes = config.include || {}

    // Check if custom I is provided
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
        throw e
      }
    } else {
      // Create default actor - this sets up the callback in asyncHelperPromise
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

    // Wait for all async helpers to finish loading and populate the actor
    await asyncHelperPromise

    // Plugins may have registered Config hooks during their boot. Run anything
    // that hasn't been applied yet and re-feed the mutated helper config to the
    // already-instantiated helpers.
    if (Config.runPendingHooks(config)) {
      for (const name of Object.keys(container.helpers)) {
        const helper = container.helpers[name]
        if (helper && typeof helper._setConfig === 'function' && config.helpers && config.helpers[name]) {
          helper._setConfig(config.helpers[name])
        }
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
    if (typeof container.support[name] === 'function') {
      return container.support[name]
    }
    return container.proxySupport[name]
  }

  /**
   * Get raw (non-proxied) support objects for direct access.
   * Used by listeners to call lifecycle hooks without MetaStep wrapping.
   *
   * @api
   * @returns {object}
   */
  static supportObjects() {
    return container.support
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
   * Get TypeScript file mapping for error stack fixing
   *
   * @api
   */
  static tsFileMapping() {
    return store.tsFileMapping
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
      // Merge the new support config with existing config
      container.proxySupportConfig = { ...container.proxySupportConfig, ...newContainer.support }
      // Recreate the proxy with merged config
      container.proxySupport = createSupportObjects(container.proxySupportConfig)
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
    container.proxySupportConfig = newSupport
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
          // Handle async ESM loading - create placeholder
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
              debug(`helper ${helperName} async loaded`)
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

            helpers[helperName] = new ResolvedHelperClass(config[helperName])
            debug(`helper ${helperName} async CJS loaded`)
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

  // Don't await here - let Container.create() handle the await
  // This allows actor callbacks to be registered before resolution
  asyncHelperPromise = asyncHelperPromise.then(async () => {
    // Call _init on all helpers after they're all loaded
    for (const name in helpers) {
      if (helpers[name]._init) {
        await helpers[name]._init()
        debug(`helper ${name} _init() called`)
      }
    }
  })

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

      const resolvedPath = resolveImportModulePath(helperPath)
      const mod = await import(resolvedPath)
      HelperClass = mod.default || mod
    } catch (err) {
      throw err
    }
  } else {
    // Handle TypeScript files
    let importPath = moduleName
    let tempJsFile = null
    let fileMapping = null
    const ext = path.extname(moduleName)

    if (ext === '.ts') {
      try {
        // Use the TypeScript transpilation utility
        const typescript = ((await import('typescript')).default || (await import('typescript')))
        const { tempFile, allTempFiles, fileMapping: mapping } = await transpileTypeScript(importPath, typescript)

        debug(`Transpiled TypeScript helper: ${importPath} -> ${tempFile}`)

        importPath = tempFile
        tempJsFile = allTempFiles
        fileMapping = mapping
        // Store file mapping in container for runtime error fixing (merge with existing)
        if (!store.tsFileMapping) {
          store.tsFileMapping = new Map()
        }
        for (const [key, value] of mapping.entries()) {
          store.tsFileMapping.set(key, value)
        }
      } catch (tsError) {
        throw new Error(`Failed to load TypeScript helper ${importPath}: ${tsError.message}. Make sure 'typescript' package is installed.`)
      }
    }

    // check if the new syntax export default HelperName is used and loads the Helper, otherwise loads the module that used old syntax export = HelperName.
    try {
      // Try dynamic import for both CommonJS and ESM modules
      const resolvedPath = resolveImportModulePath(importPath)
      const mod = await import(resolvedPath)

      if (!mod && !mod.default) {
        throw new Error(`Helper module '${moduleName}' was not found. Make sure you have installed the package correctly.`)
      }
      HelperClass = mod.default || mod

      // Clean up temp files if created
      if (tempJsFile) {
        const filesToClean = Array.isArray(tempJsFile) ? tempJsFile : [tempJsFile]
        cleanupTempFiles(filesToClean)
      }
    } catch (err) {
      // Fix error stack to point to original .ts files
      if (fileMapping) {
        fixErrorStack(err, fileMapping)
      }

      // Clean up temp files before rethrowing
      if (tempJsFile) {
        const filesToClean = Array.isArray(tempJsFile) ? tempJsFile : [tempJsFile]
        cleanupTempFiles(filesToClean)
      }

      if (err.code === 'ERR_REQUIRE_ESM' || (err.message && err.message.includes('ES module'))) {
        // This is an ESM module, use dynamic import
        try {
          const pathModule = await import('path')
          const absolutePath = pathModule.default.resolve(importPath)
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
            if (prop.toString().charAt(0) !== '_' && currentObject._before && !beforeCalledSet.has(name)) {
              beforeCalledSet.add(name)
              const originalValue = currentValue
              const wrappedValue = async function (...args) {
                await currentObject._before()
                return originalValue.apply(currentObject, args)
              }
              const ms = new MetaStep(name, prop)
              ms.setContext(currentObject)
              debug(`metastep is created for ${name}.${prop.toString()}() (with _before)`)
              return ms.run.bind(ms, asyncWrapper(wrappedValue))
            }

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
        // For destructuring to work, we need to return the actual value from the getter
        let value
        if (container.sharedKeys.has(prop) && prop in container.support) {
          value = container.support[prop]
        } else if (prop in container.support && typeof container.support[prop] === 'function') {
          value = container.support[prop]
        } else {
          value = lazyLoad(prop)
        }
        return {
          enumerable: true,
          configurable: true,
          value: value,
        }
      },
      get(target, key) {
        // First check if this is an explicitly shared property
        if (container.sharedKeys.has(key) && key in container.support) {
          return container.support[key]
        }
        if (key in container.support && typeof container.support[key] === 'function') {
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
    const resolvedPath = resolveImportModulePath(modulePath)
    pluginMod = await import(resolvedPath)
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

  const pluginOptionMap = new Map()
  for (const token of (options.plugins || '').split(',').filter(Boolean)) {
    const parts = token.split(':')
    pluginOptionMap.set(parts[0], parts.slice(1))
  }

  for (const [name] of pluginOptionMap) {
    if (!config[name]) config[name] = {}
  }

  for (const pluginName in config) {
    if (!config[pluginName]) config[pluginName] = {}
    const pluginConfig = config[pluginName]
    const enabledByCli = pluginOptionMap.has(pluginName)
    if (!pluginConfig.enabled && !enabledByCli) {
      continue // plugin is disabled
    }

    if (enabledByCli && pluginOptionMap.get(pluginName).length > 0) {
      pluginConfig._args = pluginOptionMap.get(pluginName)
    }

    // Generic workers gate:
    // - runInWorker / runInWorkers controls plugin execution inside worker threads.
    // - runInParent / runInMain can disable plugin in workers parent process.
    const runInWorker = pluginConfig.runInWorker ?? pluginConfig.runInWorkers ?? (pluginName === 'testomatio' ? false : true)
    const runInParent = pluginConfig.runInParent ?? pluginConfig.runInMain ?? true

    if (!isMainThread && !runInWorker) {
      continue
    }

    if (isMainThread && store.workerMode && !runInParent) {
      continue
    }
    let module
    try {
      if (pluginConfig.require) {
        module = pluginConfig.require
        if (module.startsWith('.')) {
          // local
          module = path.resolve(store.codeceptDir, module) // custom plugin
        }
      } else {
        module = `./plugin/${pluginName}.js`
      }

      // Use async loading for all plugins (ESM and CJS)
      plugins[pluginName] = await loadPluginAsync(module, pluginConfig)
      debug(`plugin ${pluginName} loaded via async import`)
    } catch (err) {
      throw new Error(`Could not load plugin ${pluginName} from module '${module}':\n${err.message}\n${err.stack}`)
    }
  }
  return plugins
}

async function loadGherkinStepsAsync(paths) {
  // Import BDD module to access step file tracking functions and step DSL
  const bddModule = await import('./mocha/bdd.js')

  global.Before = fn => event.dispatcher.on(event.test.started, fn)
  global.After = fn => event.dispatcher.on(event.test.finished, fn)
  global.Fail = fn => event.dispatcher.on(event.test.failed, fn)

  // Scope-inject Given/When/Then/And while loading step files so they work
  // with noGlobals: true. When noGlobals: false, globals.js has already set
  // them as permanent globals — skip to avoid deleting them at the end.
  const injectStepDsl = !!store.noGlobals
  if (injectStepDsl) {
    global.Given = bddModule.Given
    global.When = bddModule.When
    global.Then = bddModule.Then
    global.And = bddModule.And
    global.DefineParameterType = bddModule.defineParameterType
  }

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
    const folderPath = paths.startsWith('.') ? normalizeAndJoin(store.codeceptDir, paths) : ''
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
  if (injectStepDsl) {
    delete global.Given
    delete global.When
    delete global.Then
    delete global.And
    delete global.DefineParameterType
  }
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
    modulePath = path.join(store.codeceptDir, modulePath)
  }
  try {
    // Use dynamic import for both ESM and CJS modules
    let importPath = modulePath
    let tempJsFile = null
    let fileMapping = null

    if (typeof importPath === 'string') {
      const ext = path.extname(importPath)

      // Handle TypeScript files
      if (ext === '.ts') {
        try {
          // Use the TypeScript transpilation utility
          const typescript = ((await import('typescript')).default || (await import('typescript')))
          const { tempFile, allTempFiles, fileMapping: mapping } = await transpileTypeScript(importPath, typescript)

          debug(`Transpiled TypeScript file: ${importPath} -> ${tempFile}`)

          // Attach cleanup handler
          importPath = tempFile
          // Store temp files list in a way that cleanup can access them
          tempJsFile = allTempFiles
          fileMapping = mapping
          // Store file mapping in container for runtime error fixing (merge with existing)
          if (!container.tsFileMapping) {
            container.tsFileMapping = new Map()
          }
          for (const [key, value] of mapping.entries()) {
            container.tsFileMapping.set(key, value)
          }
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
      const resolvedPath = resolveImportModulePath(importPath)
      obj = await import(resolvedPath)
    } catch (importError) {
      if (fileMapping) {
        fixErrorStack(importError, fileMapping)
      }

      if (tempJsFile) {
        const filesToClean = Array.isArray(tempJsFile) ? tempJsFile : [tempJsFile]
        cleanupTempFiles(filesToClean)
      }
      throw importError
    } finally {
      if (tempJsFile) {
        const filesToClean = Array.isArray(tempJsFile) ? tempJsFile : [tempJsFile]
        cleanupTempFiles(filesToClean)
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
    const newErr = new Error(`Could not include object ${supportObjectName} from module '${modulePath}': ${err.message}`)
    newErr.stack = err.stack
    throw newErr
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
  } else if (fileExists(path.join(store.codeceptDir, locale))) {
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
      let helperPath = path.resolve(store.codeceptDir, config[helperName].require)
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
