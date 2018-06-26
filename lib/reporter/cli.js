const Base = require('mocha/lib/reporters/base');
const ms = require('mocha/lib/ms');
const event = require('../event');
const AssertionFailedError = require('../assert/error');
const output = require('../output');

const cursor = Base.cursor;
let currentMetaStep = null;

class Cli extends Base {
  constructor(runner, opts) {
    super(runner);
    let level = 0;
    opts = opts.reporterOptions || opts;
    if (opts.steps) level = 1;
    if (opts.debug) level = 2;
    if (opts.verbose) level = 3;

    output.level(level);
    output.print(`CodeceptJS v${require('../codecept').version()}`);
    output.print(`Using test root "${global.codecept_dir}"`);

    const showSteps = level >= 1;

    const indents = 0;
    function indent() {
      return Array(indents).join('  ');
    }

    runner.on('start', () => {
      console.log();
    });

    runner.on('suite', (suite) => {
      output.suite.started(suite);
    });

    runner.on('fail', (test, err) => {
      if (showSteps && test.steps) {
        return output.scenario.failed(test);
      }
      cursor.CR();
      output.test.failed(test);
    });

    runner.on('pending', (test) => {
      cursor.CR();
      output.test.skipped(test);
    });

    runner.on('pass', (test) => {
      if (showSteps && test.steps) {
        return output.scenario.passed(test);
      }
      cursor.CR();
      output.test.passed(test);
    });

    if (showSteps) {
      runner.on('test', (test) => {
        currentMetaStep = '';
        if (test.steps) {
          output.test.started(test);
        }
      });

      event.dispatcher.on(event.step.started, (step) => {
        if (step.metaStep) {
          if (currentMetaStep !== step.metaStep.toString()) {
            output.step(step.metaStep);
            currentMetaStep = step.metaStep.toString();
          }
        } else {
          currentMetaStep = '';
        }
        output.step(step);
      });
      event.dispatcher.on(event.step.passed, step => output.stepExecutionTime(step));
      event.dispatcher.on(event.step.failed, step => output.stepExecutionTime(step));
    }

    runner.on('end', this.result.bind(this));
  }

  result() {
    const stats = this.stats;
    console.log();

    // passes
    if (stats.failures) {
      output.print('-- FAILURES:');
    }

    // failures
    if (stats.failures) {
      // append step traces
      this.failures.forEach((test) => {
        const err = test.err;
        if (err instanceof AssertionFailedError) {
          err.message = err.cliMessage();

          // remove error message from stacktrace
          const lines = err.stack.split('\n');
          lines.splice(0, 1);
          err.stack = lines.join('\n');
        }
        if (output.level() < 3) {
          err.stack += '\n\nRun with --verbose flag to see NodeJS stacktrace';
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
