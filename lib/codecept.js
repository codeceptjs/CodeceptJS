import { existsSync, readFileSync } from 'fs';
import { globSync } from 'glob';
import shuffle from 'lodash.shuffle';
import fsPath from 'path';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';

import container from './container.js';
import Config from './config.js';
import event from './event.js';
import runHook from './hooks.js';
import output from './output.js';
import { emptyFolder } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    // Note: requireModules is now async and should be called after construction
  }

  /**
   * Require modules before codeceptjs running
   *
   * @param {string[]} requiringModules
   */
  async requireModules(requiringModules) {
    if (requiringModules) {
      for (const requiredModule of requiringModules) {
        let modulePath = requiredModule;
        const isLocalFile = existsSync(requiredModule) || existsSync(`${requiredModule}.js`)
        if (isLocalFile) {
          modulePath = resolve(requiredModule)
        }
        await import(modulePath);
      }
    }
  }

  /**
   * Initialize CodeceptJS at specific directory.
   * If async initialization is required, pass callback as second parameter.
   *
   * @param {string} dir
   */
  async init(dir) {
    await this.requireModules(this.config.require);
    await this.initGlobals(dir)
    // initializing listeners
    container.create(this.config, this.opts)
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
      const helper = await import('@codeceptjs/helper');
      global.Helper = global.codecept_helper = helper.default || helper;
      
      const actor = await import('./actor.js');
      global.actor = global.codecept_actor = actor.default || actor;
      
      const pause = await import('./pause.js');
      global.pause = pause.default || pause;
      
      const within = await import('./within.js');
      global.within = within.default || within;
      
      const session = await import('./session.js');
      global.session = session.default || session;
      
      const DataTable = await import('./data/table.js');
      global.DataTable = DataTable.default || DataTable;
      
      const locator = await import('./locator.js');
      global.locate = loc => (locator.default || locator).build(loc);
      
      global.inject = container.support
      global.share = container.share
      
      const secret = await import('./secret.js');
      global.secret = secret.secret;
      
      global.codecept_debug = output.debug
      
      const codeceptjs = await import('./index.js');
      global.codeceptjs = codeceptjs.default || codeceptjs; // load all objects

      // BDD
      const stepDefinitions = await import('./mocha/bdd.js');
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
    runHook((await import('./listener/store.js')).default)
    runHook((await import('./listener/steps.js')).default)
    runHook((await import('./listener/config.js')).default)
    runHook((await import('./listener/result.js')).default)
    runHook((await import('./listener/helpers.js')).default)
    runHook((await import('./listener/globalTimeout.js')).default)
    runHook((await import('./listener/globalRetry.js')).default)
    runHook((await import('./listener/exit.js')).default)
    runHook((await import('./listener/emptyRun.js')).default)

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

    if (this.opts.shuffle) {
      this.testFiles = shuffle(this.testFiles)
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

export default Codecept;
