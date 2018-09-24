const Base = require('mocha/lib/reporters/base');
const ms = require('mocha/lib/ms');
const event = require('../event');
const AssertionFailedError = require('../assert/error');
const output = require('../output');
const { getHistory } = require('../history');

const cursor = Base.cursor;
let currentMetaStep = [];

class Cli extends Base {
  constructor(runner, opts) {
    super(runner);
    let level = 0;
    let reverse = true;
    let truncate = true;
    opts = opts.reporterOptions || opts;
    if (opts.steps) level = 1;
    if (opts.debug) level = 2;
    if (opts.verbose) level = 3;
    if (opts.noreverse) reverse = false;
    if (opts.notruncate) truncate = false;

    output.level(level);
    output.reverse(reverse);
    output.trunc(truncate);
    output.style(opts.outputStyle);
    output.print(`CodeceptJS v${require('../codecept').version()}`);
    output.print(`Using test root "${global.codecept_dir}"`);

    const showSteps = level >= 1;

    const indents = 0;
    function indent() {
      return Array(indents).join('  ');
    }

    if (level >= 2) {
      const Containter = require('../container');
      output.print(output.styles.debug(`Helpers: ${Object.keys(Containter.helpers()).join(', ')}`));
      output.print(output.styles.debug(`Plugins: ${Object.keys(Containter.plugins()).join(', ')}`));
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
        currentMetaStep = [];
        if (test.steps) {
          output.test.started(test);
        }
      });

      event.dispatcher.on(event.step.started, (step) => {
        output.stepShift = 3;
        const printMetaStep = (currentStep, history) => {
          let tree = currentStep.callTree;
          if (currentStep.callTree.length > 1) {
            tree = currentStep.callTree.slice(0, currentStep.callTree.length - 1);
          }
          if (output.level() < 2) {
            tree = currentStep.callTree.slice(0, 1);
          }
          tree.forEach((call) => {
            if (!history[call.id]) {
              currentMetaStep.shift();
            } else if (currentMetaStep.indexOf(call.id) === -1) {
              currentMetaStep.unshift(call.id);
              output.step(history[call.id]);
            } else {
              output.stepShift += 2;
            }
            history = history[call.id].children;
          });
        };
        const history = getHistory();
        if (output.style() !== 'actor') {
          printMetaStep(step, history);
        }
        output.step(step);
      });

      event.dispatcher.on(event.step.finished, (step) => {
        output.stepShift = 0;
      });
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

          if (err.stack) {
            // remove error message from stacktrace
            const lines = err.stack.split('\n');
            lines.splice(0, 1);
            err.stack = lines.join('\n');
          }
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
