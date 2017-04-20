const Mocha = require('mocha/lib/mocha');
const fsPath = require('path');
const reporter = require('./reporter/cli');
const scenarioUi = fsPath.join(__dirname, './interfaces/bdd.js');

let mocha;

class MochaFactory {

  static create(config, opts) {
    mocha = new Mocha(Object.assign(config, opts));

    mocha.ui(scenarioUi);
    // use standard reporter
    if (!opts.reporter) {
      mocha.reporter(reporter, opts);
      return mocha;
    }

    // load custom reporter with options
    var reporterOptions = Object.assign(config.reporterOptions || {});

    if (opts.reporterOptions !== undefined) {
      opts.reporterOptions.split(",").forEach(function (opt) {
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

    // custom reporters
    mocha.reporter(opts.reporter, reporterOptions);
    return mocha;
  }
}

module.exports = MochaFactory;
