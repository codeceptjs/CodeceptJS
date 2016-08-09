'use strict';

let Mocha = require('mocha/lib/mocha');
let fsPath = require('path');
let readFileSync = require('fs').readFileSync;
let readdirSync = require('fs').readdirSync;
let statSync = require('fs').statSync;
let container = require('./container');
let reporter = require('./reporter/cli');
let event = require('../lib/event');
let glob = require('glob');
let fileExists = require('./utils').fileExists;
const scenarioUi = fsPath.join(__dirname, './interfaces/bdd.js');

class Codecept {

  constructor(config, opts) {
    this.opts = opts;
    this.config = config;
    this.mocha = new Mocha(Object.assign(config.mocha, opts));
    this.mocha.ui(scenarioUi);
    if (opts.reporter) {
      // custom reporters
      this.mocha.reporter(opts.reporter, this.reporterOptions());
    } else {
      // standard reporter. TODO: make them run side by side
      this.mocha.reporter(reporter, opts);
    }
    this.testFiles = [];
  }

  init(dir) {
    // preparing globals
    global.codecept_dir = dir;
    global.output_dir = fsPath.resolve(dir, this.config.output);
    global.actor = global.codecept_actor = require('./actor');
    global.Helper = global.codecept_helper = require('./helper');
    global.pause = require('./pause');
    global.within = require('./within');

    // initializing listeners
    container.create(this.config);
    require('./listener/steps');
    require('./listener/helpers');
    require('./listener/exit');
    require('./listener/trace');

    this.bootstrap();
  }

  // loading bootstrap
  bootstrap() {
    if (this.config.bootstrap && fileExists(fsPath.join(dir, this.config.bootstrap))) {
      require(fsPath.join(dir, this.config.bootstrap));
    }
  }

  // loading teardown
  teardown() {
    if (this.config.teardown && fileExists(fsPath.join(codecept_dir, this.config.teardown))) {
      require(fsPath.join(codecept_dir, this.config.teardown));
    }
  }

  loadTests(pattern) {
    pattern = pattern || this.config.tests;
    glob.sync(fsPath.join(codecept_dir, pattern)).forEach((file) => {
      this.testFiles.push(fsPath.resolve(file));
    });
  }

  reporterOptions() {
    var reporterOptions = Object.assign(this.config.mocha.reporterOptions || {});
    if (this.opts.reporterOptions !== undefined) {
        this.opts.reporterOptions.split(",").forEach(function(opt) {
            var L = opt.split("=");
            if (L.length > 2 || L.length === 0) {
                throw new Error("invalid reporter option '" + opt + "'");
            } else if (L.length === 2) {
                reporterOptions[L[0]] = L[1];
            } else {
                reporterOptions[L[0]] = true;
            }
        });
    }
    return reporterOptions;

  }

  run(test) {
    this.mocha.files = this.testFiles;
    if (test) {
      this.mocha.files = this.mocha.files.filter((t) => fsPath.basename(t, '_test.js') === test || fsPath.basename(t, '.js') === test || fsPath.basename(t) === test);
    }
    this.mocha.run(() => {
      event.emit(event.all.result, this);
    }).on('end', () => {
      this.teardown();
    });
  }

  static version() {
    return JSON.parse(readFileSync(__dirname + '/../package.json', 'utf8')).version;
  }
}

module.exports = Codecept;
