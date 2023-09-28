const { existsSync, readFileSync } = require('fs');
const glob = require('glob');
const fsPath = require('path');
const { resolve } = require('path');

const container = require('./container');
const Config = require('./config');
const event = require('./event');
const runHook = require('./hooks');
const output = require('./output');
const { emptyFolder } = require('./utils');

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
    this.config = Config.create(config);
    this.opts = opts;
    this.testFiles = new Array(0);
    this.requireModules(config.require);
  }

  /**
   * Require modules before codeceptjs running
   *
   * @param {string[]} requiringModules
   */
  requireModules(requiringModules) {
    if (requiringModules) {
      requiringModules.forEach((requiredModule) => {
        const isLocalFile = existsSync(requiredModule) || existsSync(`${requiredModule}.js`);
        if (isLocalFile) {
          requiredModule = resolve(requiredModule);
        }
        require(requiredModule);
      });
    }
  }

  /**
   * Initialize CodeceptJS at specific directory.
   * If async initialization is required, pass callback as second parameter.
   *
   * @param {string} dir
   */
  init(dir) {
    this.initGlobals(dir);
    // initializing listeners
    container.create(this.config, this.opts);
    this.runHooks();
  }

  /**
   * Creates global variables
   *
   * @param {string} dir
   */
  initGlobals(dir) {
    global.codecept_dir = dir;
    global.output_dir = fsPath.resolve(dir, this.config.output);

    if (this.config.emptyOutputFolder) emptyFolder(global.output_dir);

    if (!this.config.noGlobals) {
      global.Helper = global.codecept_helper = require('@codeceptjs/helper');
      global.actor = global.codecept_actor = require('./actor');
      global.pause = require('./pause');
      global.within = require('./within');
      global.session = require('./session');
      global.DataTable = require('./data/table');
      global.locate = locator => require('./locator').build(locator);
      global.inject = container.support;
      global.share = container.share;
      global.secret = require('./secret').secret;
      global.codecept_debug = output.debug;
      global.codeceptjs = require('./index'); // load all objects

      // BDD
      const stepDefinitions = require('./interfaces/bdd');
      global.Given = stepDefinitions.Given;
      global.When = stepDefinitions.When;
      global.Then = stepDefinitions.Then;
      global.DefineParameterType = stepDefinitions.defineParameterType;

      // debug mode
      global.debugMode = false;
    }
  }

  /**
   * Executes hooks.
   */
  runHooks() {
    // default hooks
    runHook(require('./listener/steps'));
    runHook(require('./listener/artifacts'));
    runHook(require('./listener/config'));
    runHook(require('./listener/helpers'));
    runHook(require('./listener/retry'));
    runHook(require('./listener/timeout'));
    runHook(require('./listener/exit'));

    // custom hooks (previous iteration of plugins)
    this.config.hooks.forEach(hook => runHook(hook));
  }

  /**
   * Executes bootstrap.
   *
   */
  async bootstrap() {
    return runHook(this.config.bootstrap, 'bootstrap');
  }

  /**
   * Executes teardown.

   */
  async teardown() {
    return runHook(this.config.teardown, 'teardown');
  }

  /**
   * Loads tests by pattern or by config.tests
   *
   * @param {string} [pattern]
   */
  loadTests(pattern) {
    const options = {
      cwd: global.codecept_dir,
    };

    let patterns = [pattern];
    if (!pattern) {
      patterns = [];

      // If the user wants to test a specific set of test files as an array or string.
      if (this.config.tests && !this.opts.features) {
        if (Array.isArray(this.config.tests)) {
          patterns.push(...this.config.tests);
        } else {
          patterns.push(this.config.tests);
        }
      }

      if (this.config.gherkin.features && !this.opts.tests) {
        if (Array.isArray(this.config.gherkin.features)) {
          this.config.gherkin.features.forEach(feature => {
            patterns.push(feature);
          });
        } else {
          patterns.push(this.config.gherkin.features);
        }
      }
    }

    for (pattern of patterns) {
      glob.sync(pattern, options).forEach((file) => {
        if (file.includes('node_modules')) return;
        if (!fsPath.isAbsolute(file)) {
          file = fsPath.join(global.codecept_dir, file);
        }
        if (!this.testFiles.includes(fsPath.resolve(file))) {
          this.testFiles.push(fsPath.resolve(file));
        }
      });
    }
  }

  /**
   * Run a specific test or all loaded tests.
   *
   * @param {string} [test]
   * @returns {Promise<void>}
   */
  async run(test) {
    return new Promise((resolve, reject) => {
      const mocha = container.mocha();
      mocha.files = this.testFiles;
      if (test) {
        if (!fsPath.isAbsolute(test)) {
          test = fsPath.join(global.codecept_dir, test);
        }
        mocha.files = mocha.files.filter(t => fsPath.basename(t, '.js') === test || t === test);
      }
      const done = () => {
        event.emit(event.all.result, this);
        event.emit(event.all.after, this);
        resolve();
      };

      try {
        event.emit(event.all.before, this);
        mocha.run(() => done());
      } catch (e) {
        output.error(e.stack);
        reject(e);
      }
    });
  }

  static version() {
    return JSON.parse(readFileSync(`${__dirname}/../package.json`, 'utf8')).version;
  }
}

module.exports = Codecept;
