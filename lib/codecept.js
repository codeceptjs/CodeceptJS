'use strict';

let fsPath = require('path');
let readFileSync = require('fs').readFileSync;
let readdirSync = require('fs').readdirSync;
let statSync = require('fs').statSync;
let Container = require('./container');
let Config = require('./config');
let event = require('../lib/event');
let glob = require('glob');
let fileExists = require('./utils').fileExists;
let runHook = require('./hooks');

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
    this.config = config;
    this.opts = opts;
    this.testFiles = [];
  }

  /**
   * Initialize CodeceptJS at specific directory.
   * If async initialization is required pass callbacke as second parameter.
   *
   * @param {*} dir
   * @param {*} callback
   */
  init(dir, callback) {
    // preparing globals
    global.codecept_dir = dir;
    global.output_dir = fsPath.resolve(dir, this.config.output);
    global.actor = global.codecept_actor = require('./actor');
    global.Helper = global.codecept_helper = require('./helper');
    global.pause = require('./pause');
    global.within = require('./within');

    // initializing listeners
    Container.create(this.config, this.opts);
    this.bootstrap(callback);
  }

  /**
   * Executes hooks and bootstrap.
   * If bootstrap is async second parameter is required.
   *
   * @param {*} done
   */
  bootstrap(done) {

    // default hooks
    runHook(require('./listener/steps'));
    runHook(require('./listener/helpers'));
    runHook(require('./listener/exit'));
    runHook(require('./listener/trace'));

    // custom hooks
    this.config.hooks.forEach((hook) => runHook(hook));

    // bootstrap
    runHook(this.config.bootstrap, done, 'bootstrap');
  }

  /**
   * Executes teardown.
   * If teardown is async a parameter is provided.
   *
   * @param {*} done
   */
  teardown(done) {
    runHook(this.config.teardown, done, 'teardown');
  }

  /**
   * Loads tests by pattern or by config.tests
   *
   * @param {optional} pattern
   */
  loadTests(pattern) {
    pattern = pattern || this.config.tests;
    glob.sync(fsPath.resolve(codecept_dir, pattern)).forEach((file) => {
      this.testFiles.push(fsPath.resolve(file));
    });
  }

  /**
   * Run a specific test or all loaded tests.
   *
   * @param {optional} test
   */
  run(test) {
    let mocha = Container.mocha();
    mocha.files = this.testFiles;
    if (test) {
      mocha.files = mocha.files.filter((t) => fsPath.basename(t, '_test.js') === test || fsPath.basename(t, '.js') === test || fsPath.basename(t) === test);
    }
    mocha.run().on('end', () => {
      let done = () => {
        event.emit(event.all.result, this);
      };
      this.teardown(done);
    });
  }


  static version() {
    return JSON.parse(readFileSync(__dirname + '/../package.json', 'utf8')).version;
  }
}

module.exports = Codecept;
