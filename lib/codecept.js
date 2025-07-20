import { existsSync, readFileSync } from 'fs'
import { globSync } from 'glob'
import fsPath from 'path'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { createRequire } from 'module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const require = createRequire(import.meta.url)

import Helper from '@codeceptjs/helper';
import containerModule from './container.js'
const container = containerModule.default || containerModule
import ConfigModule from './config.js'
const Config = ConfigModule.default || ConfigModule
import eventModule from './event.js'
const event = eventModule.default || eventModule
import runHook from './hooks.js'
import ActorFactory from './actor.js'
import outputModule from './output.js'
const output = outputModule.default || outputModule
import { emptyFolder } from './utils.js'

import storeListener from './listener/store.js'
import stepsListener from './listener/steps.js'
import configListener from './listener/config.js'
import resultListener from './listener/result.js'
import helpersListener from './listener/helpers.js'
import globalTimeoutListener from './listener/globalTimeout.js'
import globalRetryListener from './listener/globalRetry.js'
import exitListener from './listener/exit.js'
import emptyRunListener from './listener/emptyRun.js'

/**
 * CodeceptJS runner
 */
class Codecept {
  /**
   * Create CodeceptJS runner.
   * Config and options should be passed
   *
   * @param {*} config
   * @param {*} opts
   */
  constructor(config, opts) {
    this.config = Config.create(config)
    this.opts = opts
    this.testFiles = new Array(0)
    this.requireModules(config.require)
  }

  /**
   * Require modules before codeceptjs running
   *
   * @param {string[]} requiringModules
   */
  requireModules(requiringModules) {
    if (requiringModules) {
      requiringModules.forEach(requiredModule => {
        const isLocalFile = existsSync(requiredModule) || existsSync(`${requiredModule}.js`)
        if (isLocalFile) {
          requiredModule = resolve(requiredModule)
        }
        require(requiredModule)
      })
    }
  }

  /**
   * Initialize CodeceptJS at specific directory.
   * If async initialization is required, pass callback as second parameter.
   *
   * @param {string} dir
   */
  async init(dir) {
    await this.initGlobals(dir)
    // initializing listeners
    await container.create(this.config, this.opts)
    // Store container globally for easy access
    global.container = container
    await this.runHooks()
  }

  /**
   * Creates global variables
   *
   * @param {string} dir
   */
  async initGlobals(dir) {
    global.codecept_dir = dir
    global.output_dir = fsPath.resolve(dir, this.config.output)

    if (this.config.emptyOutputFolder) emptyFolder(global.output_dir)

    if (!this.config.noGlobals) {
      // Set up actor global - will use container when available
      global.actor = global.codecept_actor = (obj) => {
        return ActorFactory(obj, global.container || container)
      }
      global.Actor = global.actor
      // Use dynamic imports for modules to avoid circular dependencies
      global.pause = async (...args) => {
        const pauseModule = await import('./pause.js')
        return (pauseModule.default || pauseModule)(...args)
      }
      global.within = async (...args) => {
        const effectsModule = await import('./effects.js')
        return effectsModule.within(...args)
      }
      global.session = async (...args) => {
        const sessionModule = await import('./session.js')
        return (sessionModule.default || sessionModule)(...args)
      }
      const dataTableModule = await import('./data/table.js')
      global.DataTable = dataTableModule.default || dataTableModule
      global.locate = locator => {
        return import('./locator.js').then(locatorModule => 
          (locatorModule.default || locatorModule).build(locator)
        )
      }
      global.inject = container.support
      global.share = container.share
      const secretModule = await import('./secret.js')
      global.secret = secretModule.secret || (secretModule.default && secretModule.default.secret)
      global.codecept_debug = output.debug
      const codeceptjsModule = await import('./index.js') // load all objects
      global.codeceptjs = codeceptjsModule.default || codeceptjsModule

      // BDD
      const stepDefinitionsModule = await import('./mocha/bdd.js')
      const stepDefinitions = stepDefinitionsModule.default || stepDefinitionsModule
      global.Given = stepDefinitions.Given
      global.When = stepDefinitions.When
      global.Then = stepDefinitions.Then
      global.DefineParameterType = stepDefinitions.defineParameterType

      // debug mode
      global.debugMode = false

      // mask sensitive data
      global.maskSensitiveData = this.config.maskSensitiveData || false
    }
  }

  /**
   * Executes hooks.
   */
   async runHooks() {
     // default hooks
     runHook(storeListener.default || storeListener)
     runHook(stepsListener.default || stepsListener)
     runHook(configListener.default || configListener)
     runHook(resultListener.default || resultListener)
     runHook(helpersListener.default || helpersListener)
     runHook(globalTimeoutListener.default || globalTimeoutListener)
     runHook(globalRetryListener.default || globalRetryListener)
     runHook(exitListener.default || exitListener)
     runHook(emptyRunListener.default || emptyRunListener)

     // custom hooks (previous iteration of plugins)
     this.config.hooks.forEach(hook => runHook(hook))
   }

  /**
   * Executes bootstrap.
   *
   */
  async bootstrap() {
    return runHook(this.config.bootstrap, 'bootstrap')
  }

  /**
   * Executes teardown.

   */
  async teardown() {
    return runHook(this.config.teardown, 'teardown')
  }

  /**
   * Loads tests by pattern or by config.tests
   *
   * @param {string} [pattern]
   */
  loadTests(pattern) {
    const options = {
      cwd: global.codecept_dir,
    }

    let patterns = [pattern]
    if (!pattern) {
      patterns = []

      // If the user wants to test a specific set of test files as an array or string.
      if (this.config.tests && !this.opts.features) {
        if (Array.isArray(this.config.tests)) {
          patterns.push(...this.config.tests)
        } else {
          patterns.push(this.config.tests)
        }
      }

      if (this.config.gherkin.features && !this.opts.tests) {
        if (Array.isArray(this.config.gherkin.features)) {
          this.config.gherkin.features.forEach(feature => {
            patterns.push(feature)
          })
        } else {
          patterns.push(this.config.gherkin.features)
        }
      }
    }

    for (pattern of patterns) {
      if (pattern) {
        globSync(pattern, options).forEach(file => {
          if (file.includes('node_modules')) return
          if (!fsPath.isAbsolute(file)) {
            file = fsPath.join(global.codecept_dir, file)
          }
          if (!this.testFiles.includes(fsPath.resolve(file))) {
            this.testFiles.push(fsPath.resolve(file))
          }
        })
      }
    }
  }

  /**
   * Run a specific test or all loaded tests.
   *
   * @param {string} [test]
   * @returns {Promise<void>}
   */
  async run(test) {
    await container.started()

    return new Promise((resolve, reject) => {
      const mocha = container.mocha()
      mocha.files = this.testFiles
      if (test) {
        if (!fsPath.isAbsolute(test)) {
          test = fsPath.join(global.codecept_dir, test)
        }
        mocha.files = mocha.files.filter(t => fsPath.basename(t, '.js') === test || t === test)
      }
      const done = () => {
        event.emit(event.all.result, container.result())
        event.emit(event.all.after, this)
        resolve()
      }

      try {
        event.emit(event.all.before, this)
        mocha.run(() => done())
      } catch (e) {
        output.error(e.stack)
        reject(e)
      }
    })
  }

  static version() {
    return JSON.parse(readFileSync(`${__dirname}/../package.json`, 'utf8')).version
  }
}

export default Codecept
