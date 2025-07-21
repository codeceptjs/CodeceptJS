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
import container from './container.js'
import Config from './config.js'
import event from './event.js'
import runHook from './hooks.js'
import ActorFactory from './actor.js'
import output from './output.js'
import { emptyFolder } from './utils.js'
import { initCodeceptGlobals } from './globals.js'

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
    await initCodeceptGlobals(dir, this.config, container)
  }

  /**
   * Executes hooks.
   */
   async runHooks() {
     // default hooks
     runHook(storeListener)
     runHook(stepsListener)
     runHook(configListener)
     runHook(resultListener)
     runHook(helpersListener)
     runHook(globalTimeoutListener)
     runHook(globalRetryListener)
     runHook(exitListener)
     runHook(emptyRunListener)

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

      if (this.config.gherkin && this.config.gherkin.features && !this.opts.tests) {
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
    
    // Ensure translations are loaded for Gherkin features
    try {
      const { loadTranslations } = await import('./mocha/gherkin.js')
      await loadTranslations()
    } catch (e) {
      // Ignore if gherkin module not available
    }

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
