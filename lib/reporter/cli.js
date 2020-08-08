const { reporters: { Base } } = require('mocha');
const ms = require('ms');
const event = require('../event');
const AssertionFailedError = require('../assert/error');
const output = require('../output');

const cursor = Base.cursor;
let currentMetaStep = [];

class Cli extends Base {
  constructor(runner, opts) {
    super(runner);
    let level = 0;
    this.loadedTests = [];
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
      if (test.ctx.currentTest) {
        this.loadedTests.push(test.ctx.currentTest.id);
      }
      if (showSteps && test.steps) {
        return output.scenario.failed(test);
      }
      cursor.CR();
      output.test.failed(test);
    });

    runner.on('pending', (test) => {
      if (test.parent && test.parent.pending) {
        const suite = test.parent;
        const skipInfo = suite.opts.skipInfo || {};
        skipTestConfig(test, skipInfo.message);
      }
      this.loadedTests.push(test.id);
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
        const printMetaStep = (metaStep) => {
          if (!metaStep) return currentMetaStep.shift();
          if (currentMetaStep.indexOf(metaStep.toString()) >= 0) return; // step is the same
          if (metaStep.metaStep) {
            printMetaStep(metaStep.metaStep);
          }
          currentMetaStep.unshift(metaStep.toString());
          output.step(metaStep);
        };
        printMetaStep(step.metaStep);
        output.step(step);
      });

      event.dispatcher.on(event.step.finished, (step) => {
        output.stepShift = 0;
      });
    }

    runner.on('suite end', suite => {
      let skippedCount = 0;
      const grep = runner._grep;
      for (const test of suite.tests) {
        if (!test.state && !this.loadedTests.includes(test.id)) {
          if (matchTest(grep, test.title)) {
            if (!test.opts) {
              test.opts = {};
            }
            if (!test.opts.skipInfo) {
              test.opts.skipInfo = {};
            }
            skipTestConfig(test, 'Skipped due to failure in \'before\' hook');
            output.test.skipped(test);
            skippedCount += 1;
          }
        }
      }

      this.stats.pending += skippedCount;
      this.stats.tests += skippedCount;
    });

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

function matchTest(grep, test) {
  if (grep) {
    return grep.test(test);
  }
  return true;
}

function skipTestConfig(test, message) {
  if (!test.opts) {
    test.opts = {};
  }
  if (!test.opts.skipInfo) {
    test.opts.skipInfo = {};
  }
  test.opts.skipInfo.message = test.opts.skipInfo.message || message;
  test.opts.skipInfo.isFastSkipped = true;
  event.emit(event.test.skipped, test);
  test.state = 'skipped';
}

module.exports = function (runner, opts) {
  return new Cli(runner, opts);
};
