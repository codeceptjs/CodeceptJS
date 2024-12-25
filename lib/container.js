const glob = require('glob')
const path = require('path')
const { MetaStep } = require('./step')
const { methodsOfObject, fileExists, isFunction, isAsyncFunction, installedLocally } = require('./utils')
const Translation = require('./translation')
const MochaFactory = require('./mochaFactory')
const recorder = require('./recorder')
const event = require('./event')
const WorkerStorage = require('./workerStorage')
const store = require('./store')
const ai = require('./ai')

let asyncHelperPromise

let container = {
  helpers: {},
  support: {},
  plugins: {},
  actor: null,
  /**
   * @type {Mocha | {}}
   * @ignore
   */
  mocha: {},
  translation: {},
}

/**
 * Dependency Injection Container
 */
class Container {
  /**
   * Create container with all required helpers and support objects
   *
   * @api
   * @param {*} config
   * @param {*} opts
   */
  static create(config, opts) {
    asyncHelperPromise = Promise.resolve()

    container.helpers = createHelpers(config.helpers || {})
    container.translation = loadTranslation(config.translation || null, config.vocabularies || [])
    container.support = createSupportObjects(config.include || {})
    container.plugins = createPlugins(config.plugins || {}, opts)

    createMocha(config, opts)
    createActor()

    if (opts && opts.ai) ai.enable(config.ai) // enable AI Assistant
    if (config.gherkin) loadGherkinSteps(config.gherkin.steps || [])
    if (opts && typeof opts.timeouts === 'boolean') store.timeouts = opts.timeouts
  }

  static actor() {
    return container.actor
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
      return container.support
    }
    return container.support[name]
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
   * Append new services to container
   *
   * @api
   * @param {Object<string, *>} newContainer
   */
  static append(newContainer) {
    const deepMerge = require('./utils').deepMerge
    container = deepMerge(container, newContainer)
    container.actor = container.support.I
  }

  /**
   * Clear container
   *
   * @param {Object<string, *>} newHelpers
   * @param {Object<string, *>} newSupport
   * @param {Object<string, *>} newPlugins
   */
  static clear(newHelpers, newSupport, newPlugins) {
    container.helpers = newHelpers || {}
    container.support = newSupport || {}
    container.plugins = newPlugins || {}
    container.translation = loadTranslation()
    asyncHelperPromise = Promise.resolve()
    store.actor = null
  }

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
    Container.append({ support: data })
    if (!options.local) {
      WorkerStorage.share(data)
    }
  }
}

module.exports = Container

function createHelpers(config) {
  const helpers = {}
  for (let helperName in config) {
    try {
      let HelperClass

      // ESM import
      if (helperName?.constructor === Function && helperName.prototype) {
        HelperClass = helperName
        helperName = HelperClass.constructor.name
      }

      // classical require
      if (!HelperClass) {
        HelperClass = requireHelperFromModule(helperName, config)
      }

      // handle async CJS modules that use dynamic import
      if (isAsyncFunction(HelperClass)) {
        helpers[helperName] = {}

        asyncHelperPromise = asyncHelperPromise
          .then(() => HelperClass())
          .then((ResolvedHelperClass) => {
            // Check if ResolvedHelperClass is a constructor function
            if (typeof ResolvedHelperClass?.constructor !== 'function') {
              throw new Error(`Helper class from module '${helperName}' is not a class. Use CJS async module syntax.`)
            }

            helpers[helperName] = new ResolvedHelperClass(config[helperName])
          })

        continue
      }

      checkHelperRequirements(HelperClass)

      helpers[helperName] = new HelperClass(config[helperName])
    } catch (err) {
      throw new Error(`Could not load helper ${helperName} (${err.message})`)
    }
  }

  for (const name in helpers) {
    if (helpers[name]._init) helpers[name]._init()
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

function requireHelperFromModule(helperName, config, HelperClass) {
  const moduleName = getHelperModuleName(helperName, config)
  if (moduleName.startsWith('./helper/')) {
    HelperClass = require(moduleName)
  } else {
    // check if the new syntax export default HelperName is used and loads the Helper, otherwise loads the module that used old syntax export = HelperName.
    try {
      const mod = require(moduleName)
      if (!mod && !mod.default) {
        throw new Error(
          `Helper module '${moduleName}' was not found. Make sure you have installed the package correctly.`,
        )
      }
      HelperClass = mod.default || mod
    } catch (err) {
      if (err.code === 'MODULE_NOT_FOUND') {
        throw new Error(
          `Helper module '${moduleName}' was not found. Make sure you have installed the package correctly.`,
        )
      }
      throw err
    }
  }
  return HelperClass
}

function createSupportObjects(config) {
  const objects = {}

  for (const name in config) {
    objects[name] = {} // placeholders
  }

  container.support = objects

  function lazyLoad(name) {
    let newObj = getSupportObject(config, name)
    try {
      if (typeof newObj === 'function') {
        newObj = newObj()
      } else if (newObj._init) {
        newObj._init()
      }
    } catch (err) {
      throw new Error(`Initialization failed for ${name}: ${newObj}\n${err.message}\n${err.stack}`)
    }
    return newObj
  }

  const asyncWrapper = function (f) {
    return function () {
      return f.apply(this, arguments).catch((e) => {
        recorder.saveFirstAsyncError(e)
        throw e
      })
    }
  }

  Object.keys(objects).forEach((object) => {
    const currentObject = objects[object]
    Object.keys(currentObject).forEach((method) => {
      const currentMethod = currentObject[method]
      if (currentMethod && currentMethod[Symbol.toStringTag] === 'AsyncFunction') {
        objects[object][method] = asyncWrapper(currentMethod)
      }
    })
  })

  return new Proxy(
    {},
    {
      has(target, key) {
        return key in config
      },
      ownKeys() {
        return Reflect.ownKeys(config)
      },
      get(target, key) {
        // configured but not in support object, yet: load the module
        if (key in objects && !(key in target)) {
          // load default I
          if (key in objects && !(key in config)) {
            return (target[key] = objects[key])
          }

          // load new object
          const object = lazyLoad(key)
          // check that object is a real object and not an array
          if (Object.prototype.toString.call(object) === '[object Object]') {
            return (target[key] = Object.assign(objects[key], object))
          }
          target[key] = object
        }
        return target[key]
      },
    },
  )
}

function createPlugins(config, options = {}) {
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
        module = `./plugin/${pluginName}`
      }
      plugins[pluginName] = require(module)(config[pluginName])
    } catch (err) {
      throw new Error(`Could not load plugin ${pluginName} from module '${module}':\n${err.message}\n${err.stack}`)
    }
  }
  return plugins
}

function createActor() {
  const actor = require('./actor')
  container.support.I = container.support.I || actor()

  container.actor = container.support.I
  if (container.translation.I !== 'I') container.support[container.translation.I] = container.actor
}

function getSupportObject(config, name) {
  const module = config[name]
  if (typeof module === 'string') {
    return loadSupportObject(module, name)
  }
  return module
}

function loadGherkinSteps(paths) {
  global.Before = (fn) => event.dispatcher.on(event.test.started, fn)
  global.After = (fn) => event.dispatcher.on(event.test.finished, fn)
  global.Fail = (fn) => event.dispatcher.on(event.test.failed, fn)

  // If gherkin.steps is string, then this will iterate through that folder and send all step def js files to loadSupportObject
  // If gherkin.steps is Array, it will go the old way
  // This is done so that we need not enter all Step Definition files under config.gherkin.steps
  if (Array.isArray(paths)) {
    for (const path of paths) {
      loadSupportObject(path, `Step Definition from ${path}`)
    }
  } else {
    const folderPath = paths.startsWith('.') ? path.join(global.codecept_dir, paths) : ''
    if (folderPath !== '') {
      glob.sync(folderPath).forEach((file) => {
        loadSupportObject(file, `Step Definition from ${file}`)
      })
    }
  }

  delete global.Before
  delete global.After
  delete global.Fail
}

function loadSupportObject(modulePath, supportObjectName) {
  if (modulePath.charAt(0) === '.') {
    modulePath = path.join(global.codecept_dir, modulePath)
  }

  try {
    const obj = require(modulePath)

    if (typeof obj !== 'function' && Object.getPrototypeOf(obj) !== Object.prototype && !Array.isArray(obj)) {
      const methods = methodsOfObject(obj)
      Object.keys(methods)
        .filter((key) => !key.startsWith('_'))
        .forEach((key) => {
          const currentMethod = methods[key]
          if (isFunction(currentMethod) || isAsyncFunction(currentMethod)) {
            const ms = new MetaStep(supportObjectName, key)
            ms.setContext(methods)
            methods[key] = ms.run.bind(ms, currentMethod)
          }
        })
      return methods
    }
    if (!Array.isArray(obj)) {
      Object.keys(obj)
        .filter((key) => !key.startsWith('_'))
        .forEach((key) => {
          const currentMethod = obj[key]
          if (isFunction(currentMethod) || isAsyncFunction(currentMethod)) {
            const ms = new MetaStep(supportObjectName, key)
            ms.setContext(obj)
            obj[key] = ms.run.bind(ms, currentMethod)
          }
        })
    }

    return obj
  } catch (err) {
    throw new Error(
      `Could not include object ${supportObjectName} from module '${modulePath}'\n${err.message}\n${err.stack}`,
    )
  }
}

/**
 * Method collect own property and prototype
 */

function loadTranslation(locale, vocabularies) {
  if (!locale) {
    return Translation.createEmpty()
  }

  let translation

  // check if it is a known translation
  if (Translation.langs[locale]) {
    translation = new Translation(Translation.langs[locale])
  } else if (fileExists(path.join(global.codecept_dir, locale))) {
    // get from a provided file instead
    translation = Translation.createDefault()
    translation.loadVocabulary(locale)
  } else {
    translation = Translation.createDefault()
  }

  vocabularies.forEach((v) => translation.loadVocabulary(v))

  return translation
}

function getHelperModuleName(helperName, config) {
  // classical require
  if (config[helperName].require) {
    if (config[helperName].require.startsWith('.')) {
      return path.resolve(global.codecept_dir, config[helperName].require) // custom helper
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

function createMocha(config, opts) {
  const mochaConfig = config.mocha || {}
  if (config.grep && !opts.grep) {
    mochaConfig.grep = config.grep
  }
  container.mocha = MochaFactory.create(mochaConfig, opts || {})
}
