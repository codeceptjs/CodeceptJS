import { existsSync, readFileSync } from 'fs';
import glob from 'glob';
import { resolve, dirname, isAbsolute, join } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'node:module';
import container from './container.js';
import Config from './config.js';
import * as event from './event.js';
import runHook from './hooks.js';
import * as output from './output.js';
import { emptyFolder } from './utils.js';
import * as index from './index.js';

// Helpers and features
import * as actor from './actor.js';
import pause from './pause.js';
import within from './within.js';
import session from './session.js';
import data from './data/table.js';
import Locator from './locator.js';
import secret from './secret.js';
import * as stepDefinitions from './interfaces/bdd.js';

// Listeners
import listener from './listener/steps.js';
import listenerArtifacts from './listener/artifacts.js';
import listenerConfig from './listener/config.js';
import listenerHelpers from './listener/helpers.js';
import listenerRetry from './listener/retry.js';
import listenerTimeout from './listener/timeout.js';
import listenerExit from './listener/exit.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/**
 * CodeceptJS runner class.
 */
export default class Codecept {
  /**
   * Initializes CodeceptJS runner with config and options.
   * @param {Object} config - Configuration object.
   * @param {Object} opts - Options.
   */
  constructor(config, opts) {
    this.config = Config.create(config);
    this.opts = opts;
    this.testFiles = [];
    this.requireModules(config?.require);
  }

  /**
   * Requires necessary modules before running CodeceptJS.
   * @param {string[]} requiringModules - List of modules to require.
   */
  requireModules(requiringModules) {
    requiringModules?.forEach((requiredModule) => {
      const isLocalFile = existsSync(requiredModule) || existsSync(`${requiredModule}.js`);
      const modulePath = isLocalFile ? resolve(requiredModule) : requiredModule;
      require(modulePath);
    });
  }

  /**
   * Initializes CodeceptJS in a specific directory.
   * @param {string} dir - Directory path.
   */
  init(dir) {
    this.initGlobals(dir);
    container.create(this.config, this.opts);
    this.runHooks();
  }

  /**
   * Initializes global variables.
   * @param {string} dir - Directory path.
   */
  initGlobals(dir) {
    global.codecept_dir = dir;
    global.output_dir = resolve(dir, this.config.output);

    if (this.config.emptyOutputFolder) emptyFolder(global.output_dir);

    if (!this.config.noGlobals) {
      this.initGlobalHelpers();
    }
  }

  /**
   * Initializes global helpers and other CodeceptJS features.
   */
  initGlobalHelpers() {
    global.Helper = global.codecept_helper = index.generated;
    global.actor = global.codecept_actor = actor;
    global.pause = pause;
    global.within = within;
    global.session = session;
    global.DataTable = data;
    global.locate = (locator) => new Locator(locator);
    global.inject = container.support;
    global.share = container.share;
    global.secret = secret;
    global.codecept_debug = output.debug;
    global.codeceptjs = index;

    // BDD
    global.Given = stepDefinitions.Given;
    global.When = stepDefinitions.When;
    global.Then = stepDefinitions.Then;
    global.DefineParameterType = stepDefinitions.defineParameterType;
    global.debugMode = false;
  }

  /**
   * Runs all hooks, including custom and default.
   */
  runHooks() {
    const listeners = [
      listener,
      listenerArtifacts,
      listenerConfig,
      listenerHelpers,
      listenerRetry,
      listenerTimeout,
      listenerExit,
    ];

    listeners.forEach(runHook);

    // Run custom hooks
    this.config.hooks.forEach(runHook);
  }

  /**
   * Executes the bootstrap process.
   */
  async bootstrap() {
    return runHook(this.config.bootstrap, 'bootstrap');
  }

  /**
   * Executes the teardown process.
   */
  async teardown() {
    return runHook(this.config.teardown, 'teardown');
  }

  /**
   * Loads test files based on the given pattern or config.
   * @param {string} [pattern] - Optional pattern for loading tests.
   */
  loadTests(pattern) {
    const patterns = this.getTestPatterns(pattern);
    const options = { cwd: global.codecept_dir };

    patterns.forEach((p) => {
      glob.sync(p, options).forEach((file) => {
        if (!file.includes('node_modules')) {
          const fullPath = isAbsolute(file) ? file : join(global.codecept_dir, file);
          const resolvedFile = resolve(fullPath);

          if (!this.testFiles.includes(resolvedFile)) {
            this.testFiles.push(resolvedFile);
          }
        }
      });
    });
  }

  /**
   * Gets test patterns based on config and options.
   * @param {string} [pattern] - Test pattern to match.
   * @returns {string[]} - Array of test patterns.
   */
  getTestPatterns(pattern) {
    if (pattern) return [pattern];

    const patterns = [];
    const { tests, gherkin } = this.config;

    if (tests && !this.opts.features) {
      patterns.push(...(Array.isArray(tests) ? tests : [tests]));
    }

    if (gherkin?.features && !this.opts.tests) {
      patterns.push(...(Array.isArray(gherkin.features) ? gherkin.features : [gherkin.features]));
    }

    return patterns;
  }

  /**
   * Runs tests either specific to a file or all loaded tests.
   * @param {string} [test] - Test file to run.
   * @returns {Promise<void>}
   */
  async run(test) {
    const mocha = container.mocha();
    mocha.files = this.testFiles;

    if (test) {
      const testPath = isAbsolute(test) ? test : join(global.codecept_dir, test);
      mocha.files = mocha.files.filter((t) => resolve(t) === resolve(testPath));
    }

    return new Promise((resolve, reject) => {
      try {x
        event.emit(event.all.before, this);
        mocha.run(() => {
          event.emit(event.all.result, this);
          event.emit(event.all.after, this);
          resolve();
        });
      } catch (error) {
        output.output.error(error.stack);
        reject(error);
      }
    });
  }
}

/**
 * Retrieves the version from package.json.
 * @returns {string} - The version of the package.
 */
export function version() {
  return JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf8')).version;
}
