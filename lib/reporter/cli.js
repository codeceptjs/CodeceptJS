'use strict';

let Base = require('mocha/lib/reporters/base');
let ms = require('mocha/lib/ms');
let event = require('../event');
let AssertionFailedError = require('../assert/error');
let output = require('../output');
let tests = [];
let currentTest;
var cursor = Base.cursor;
var color = Base.color;

class Cli extends Base {
  constructor(runner, opts) {
    super(runner);
    let level = 0;
    if (opts.steps) level = 1;
    if (opts.debug) level = 2;
    if (opts.verbose) level = 3;
    output.level(level);

    output.print('CodeceptJS v' + require('../codecept').version());
    output.print(`Using test root "${global.codecept_dir}"`);

    let showSteps = level >= 1;

    let indents = 0;
    function indent() {
      return Array(indents).join('  ');
    }

    runner.on('start', function () {
      console.log();
    });

    runner.on('suite', function (suite) {
      output.suite.started(suite);
    });

    runner.on('fail', function (test, err) {
      if (showSteps && test.steps) {
        return output.scenario.failed(test);
      }
      cursor.CR();
      output.test.failed(test);
    });

    runner.on('pending', function (test) {
      cursor.CR();
      output.test.skipped(test);
    });

    runner.on('pass', function (test) {
      if (showSteps && test.steps) {
        return output.scenario.passed(test);
      }
      cursor.CR();
      output.test.passed(test);
    });

    if (showSteps) {
      runner.on('test', function (test) {
        if (test.steps) {
          output.test.started(test);
        }
      });

      event.dispatcher.on(event.step.started, function (step) {
        output.step(step);
      });
    }

    runner.on('end', this.result.bind(this));
  }

  result() {
    let stats = this.stats;
    console.log();

    // passes
    if (stats.failures) {
      output.print('-- FAILURES:');
    }

    // failures
    if (stats.failures) {
      // append step traces
      this.failures.forEach((test) => {
        let err = test.err;
        if (err instanceof AssertionFailedError) {
          err.message = err.cliMessage();

          // remove error message from stacktrace
          var lines = err.stack.split('\n');
          lines.splice(0, 1);
          err.stack = lines.join('\n');
        }
        if (output.level() < 3) {
          err.stack += `\n\nRun with --verbose flag to see NodeJS stacktrace`;
        }
      });

      Base.list(this.failures);
      console.log();
    }

    output.result(stats.passes, stats.failures, stats.pending, ms(stats.duration));
  }
}
module.exports = function (runner, opts) {
  return new Cli(runner, opts);
};
