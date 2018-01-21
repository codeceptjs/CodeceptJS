const fsPath = require('path');
const readFileSync = require('fs').readFileSync;
const Container = require('./container');
const Config = require('./config');
const event = require('../lib/event');
const glob = require('glob');
const runHook = require('./hooks');

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
  }

  /**
   * Initialize CodeceptJS at specific directory.
   * If async initialization is required, pass callback as second parameter.
   *
   * @param {*} dir
   * @param {*} callback
   */
  init(dir, callback) {
    // preparing globals
    global.codecept_dir = dir;
    global.output_dir = fsPath.resolve(dir, this.config.output);

    if (!this.config.noGlobals) {
      global.actor = global.codecept_actor = require('./actor');
      global.Helper = global.codecept_helper = require('./helper');
      global.pause = require('./pause');
      global.within = require('./within');
      global.DataTable = require('./data/table');
    }

    // initializing listeners
    Container.create(this.config, this.opts);
    this.bootstrap(callback);
  }

  /**
   * Executes hooks and bootstrap.
   * If bootstrap is async, second parameter is required.
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
    this.config.hooks.forEach(hook => runHook(hook));

    // bootstrap
    runHook(this.config.bootstrap, done, 'bootstrap');
  }

  /**
   * Executes teardown.
   * If teardown is async a parameter is provided.
   *
   * @param {*} done
   */
  teardown(done = undefined) {
    runHook(this.config.teardown, done, 'teardown');
  }

  /**
   * Loads tests by pattern or by config.tests
   *
   * @param {string} [pattern]
   */
  loadTests(pattern) {
    pattern = pattern || this.config.tests;
    glob.sync(fsPath.resolve(global.codecept_dir, pattern)).forEach((file) => {
      this.testFiles.push(fsPath.resolve(file));
    });
  }

  /**
   * Run a specific test or all loaded tests.
   *
   * @param {string} [test]
   */
  run(test) {
    const mocha = Container.mocha();
    mocha.files = this.testFiles;
    if (test) {
      mocha.files = mocha.files.filter(t => fsPath.basename(t, '_test.js') === test || fsPath.basename(t, '.js') === test || fsPath.basename(t) === test);
    }
    mocha.run(() => {
      const done = () => {
        event.emit(event.all.result, this);
      };
      this.teardown(done);
    });
  }


  static version() {
    return JSON.parse(readFileSync(`${__dirname}/../package.json`, 'utf8')).version;
  }
}

module.exports = Codecept;
