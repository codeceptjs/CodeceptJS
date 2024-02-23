import { existsSync, readFileSync } from 'fs';
import glob from 'glob';
import fsPath, { resolve } from 'path';
import generated from '@codeceptjs/helper';
import container from './container.js';
import Config from './config.js';
import * as event from './event.js';
import runHook from './hooks.js';
import * as output from './output.js';
import { emptyFolder } from './utils.js';
import * as index from './index.js';

import * as actor0 from './actor.js';

import pause0 from './pause.js';

import within0 from './within.js';

import session0 from './session.js';

import data from './data/table.js';

import * as Build from './locator.js';

import secret from './secret.js';

// BDD
import * as stepDefinitions from './interfaces/bdd.js';

import listener from './listener/steps.js';

import listener0 from './listener/artifacts.js';

import listener01 from './listener/config.js';

import listener012 from './listener/helpers.js';

import listener0123 from './listener/retry.js';

import listener01234 from './listener/timeout.js';

import listener012345 from './listener/exit.js';

const __dirname = fsPath.resolve('.');

/**
 * CodeceptJS runner
 */
export default class Codecept {
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
    // @ts-ignore
    global.codecept_dir = dir;
    // @ts-ignore
    global.output_dir = fsPath.resolve(dir, this.config.output);

    if (this.config.emptyOutputFolder) emptyFolder(global.output_dir);

    if (!this.config.noGlobals) {
      global.Helper = global.codecept_helper = generated;
      global.actor = global.codecept_actor = actor0;
      global.pause = pause0;
      global.within = within0;
      global.session = session0;
      global.DataTable = data;
      global.locate = locator => new Build(locator);
      global.inject = container.support;
      global.share = container.share;
      global.secret = secret;
      global.codecept_debug = output.debug;
      global.codeceptjs = index; // load all objects
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
    runHook(listener);
    runHook(listener0);
    runHook(listener01);
    runHook(listener012);
    runHook(listener0123);
    runHook(listener01234);
    runHook(listener012345);

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
        output.output.error(e.stack);
        reject(e);
      }
    });
  }
}

export function version() {
  return JSON.parse(readFileSync(`${__dirname}/package.json`, 'utf8')).version;
}
