const { globSync } = require('glob')
const path = require('path')
const debug = require('debug')('codeceptjs:container')
const { MetaStep } = require('./step')
const { methodsOfObject, fileExists, isFunction, isAsyncFunction, installedLocally } = require('./utils')
const Translation = require('./translation')
const MochaFactory = require('./mocha/factory')
const recorder = require('./recorder')
const event = require('./event')
const WorkerStorage = require('./workerStorage')
const store = require('./store')
const Result = require('./result')
const ai = require('./ai')

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
    return ['Playwright', 'WebDriver', 'Puppeteer', 'Appium', 'TestCafe']
  }
  /**
   * Create container with all required helpers and support objects
   *
   * @api
   * @param {*} config
   * @param {*} opts
   */
  static create(config, opts) {
    debug('creating container')
    asyncHelperPromise = Promise.resolve()

    // dynamically create mocha instance
    const mochaConfig = config.mocha || {}
    if (config.grep && !opts.grep) mochaConfig.grep = config.grep
    this.createMocha = () => (container.mocha = MochaFactory.create(mochaConfig, opts || {}))
    this.createMocha()

    // create support objects
    container.support = {}
    container.helpers = createHelpers(config.helpers || {})
    container.translation = loadTranslation(config.translation || null, config.vocabularies || [])
    container.proxySupport = createSupportObjects(config.include || {})
    container.plugins = createPlugins(config.plugins || {}, opts)
    container.result = new Result()

    createActor(config.include?.I)

    if (opts && opts.ai) ai.enable(config.ai) // enable AI Assistant
    if (config.gherkin) loadGherkinSteps(config.gherkin.steps || [])
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
    return container.support[name] || container.proxySupport[name]
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
    const deepMerge = require('./utils').deepMerge
    container = deepMerge(container, newContainer)
    debug('appended', JSON.stringify(newContainer).slice(0, 300))
  }

  /**
   * Clear container
   *
   * @param {Object<string, *>} newHelpers
   * @param {Object<string, *>} newSupport
   * @param {Object<string, *>} newPlugins
   */
  static clear(newHelpers = {}, newSupport = {}, newPlugins = {}) {
    container.helpers = newHelpers
    container.translation = loadTranslation()
    container.proxySupport = createSupportObjects(newSupport)
    container.plugins = newPlugins
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
    Container.append({ support: data })
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
        throw new Error(`Helper module '${moduleName}' was not found. Make sure you have installed the package correctly.`)
      }
      HelperClass = mod.default || mod
    } catch (err) {
      if (err.code === 'MODULE_NOT_FOUND') {
        throw new Error(`Helper module '${moduleName}' was not found. Make sure you have installed the package correctly.`)
      }
      throw err
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
          if (container.translation.name) {
            name = container.translation.name
          }

          if (name === 'I') {
            const actor = createActor(config.I)
            methodsOfObject(actor)
            return actor[prop]
          }

          if (!container.support[name] && typeof config[name] === 'object') {
            container.support[name] = config[name]
          }

          if (!container.support[name]) {
            // Load object on first access
            const supportObject = loadSupportObject(config[name])
            container.support[name] = supportObject
            try {
              if (container.support[name]._init) {
                container.support[name]._init()
              }
              debug(`support object ${name} initialized`)
            } catch (err) {
              throw new Error(`Initialization failed for ${name}: ${container.support[name]}\n${err.message}\n${err.stack}`)
            }
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
          container.support[name] = container.support[name] || loadSupportObject(config[name])
          return prop in container.support[name]
        },
        getOwnPropertyDescriptor(target, prop) {
          container.support[name] = container.support[name] || loadSupportObject(config[name])
          return {
            enumerable: true,
            configurable: true,
            value: this.get(target, prop),
          }
        },
        ownKeys() {
          container.support[name] = container.support[name] || loadSupportObject(config[name])
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
        return keys.includes(key)
      },
      ownKeys() {
        return keys
      },
      getOwnPropertyDescriptor(target, prop) {
        return {
          enumerable: true,
          configurable: true,
          value: this.get(target, prop),
        }
      },
      get(target, key) {
        return lazyLoad(key)
      },
    },
  )
}

function createActor(actorPath) {
  if (container.support.I) return container.support.I

  if (actorPath) {
    container.support.I = loadSupportObject(actorPath)
  } else {
    const actor = require('./actor')
    container.support.I = actor()
  }

  return container.support.I
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

function loadGherkinSteps(paths) {
  global.Before = fn => event.dispatcher.on(event.test.started, fn)
  global.After = fn => event.dispatcher.on(event.test.finished, fn)
  global.Fail = fn => event.dispatcher.on(event.test.failed, fn)

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
      globSync(folderPath).forEach(file => {
        loadSupportObject(file, `Step Definition from ${file}`)
      })
    }
  }

  delete global.Before
  delete global.After
  delete global.Fail
}

function loadSupportObject(modulePath, supportObjectName) {
  if (!modulePath) {
    throw new Error(`Support object "${supportObjectName}" is not defined`)
  }
  if (modulePath.charAt(0) === '.') {
    modulePath = path.join(global.codecept_dir, modulePath)
  }
  try {
    const obj = require(modulePath)

    // Handle different types of imports
    if (typeof obj === 'function') {
      // If it's a class (constructor function)
      if (obj.prototype && obj.prototype.constructor === obj) {
        const ClassName = obj
        return new ClassName()
      }
      // If it's a regular function
      return obj()
    }

    if (obj && Array.isArray(obj)) {
      return obj
    }

    // If it's a plain object
    if (obj && typeof obj === 'object') {
      return obj
    }

    throw new Error(`Support object "${supportObjectName}" should be an object, class, or function, but got ${typeof obj}`)
  } catch (err) {
    throw new Error(`Could not include object ${supportObjectName} from module '${modulePath}'\n${err.message}\n${err.stack}`)
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

  vocabularies.forEach(v => translation.loadVocabulary(v))

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
