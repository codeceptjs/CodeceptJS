const { reporters: { Base } } = require('mocha');
const ms = require('ms');
const event = require('./event');
const AssertionFailedError = require('./assert/error');
const output = require('./output');

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
    output.print(`CodeceptJS v${require('./codecept').version()}`);
    output.print(`Using test root "${global.codecept_dir}"`);

    const showSteps = level >= 1;

    if (level >= 2) {
      const Containter = require('./container');
      output.print(output.styles.debug(`Helpers: ${Object.keys(Containter.helpers()).join(', ')}`));
      output.print(output.styles.debug(`Plugins: ${Object.keys(Containter.plugins()).join(', ')}`));
    }

    runner.on('start', () => {
      console.log();
    });

    runner.on('suite', (suite) => {
      output.suite.started(suite);
    });

    runner.on('fail', (test) => {
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

      event.dispatcher.on(event.step.finished, () => {
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
            test.opts.skipInfo.message = 'Skipped due to failure in \'before\' hook';
            test.opts.skipInfo.isFastSkipped = true;
            event.emit(event.test.skipped, test);
            test.state = 'skipped';
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
      output.print(output.styles.bold('-- FAILURES:'));
    }

    // failures
    if (stats.failures) {
      // append step traces
      this.failures.map((test) => {
        const err = test.err;

        let log = '';

        if (err instanceof AssertionFailedError) {
          err.message = err.inspect();
        }

        const steps = test.steps || (test.ctx && test.ctx.test.steps);
        if (steps && steps.length) {
          let scenarioTrace = '';
          steps.reverse().forEach((step) => {
            const line = `- ${step.toCode()} ${step.line()}`;
            // if (step.status === 'failed') line = '' + line;
            scenarioTrace += `\n${line}`;
          });
          log += `${output.styles.bold('Scenario Steps')}:${scenarioTrace}\n`;
        }


        // display artifacts in debug mode
        if (test.artifacts && Object.keys(test.artifacts).length) {
          log += `\n${output.styles.bold('Artifacts:')}`;
          for (const artifact of Object.keys(test.artifacts)) {
            log += `\n- ${artifact}: ${test.artifacts[artifact]}`;
          }
        }

        let stack = err.stack ? err.stack.split('\n') : [];
        if (stack[0] && stack[0].includes(err.message)) {
          stack.shift();
        }

        if (output.level() < 3) {
          stack = stack.slice(0, 3);
        }

        err.stack = `${stack.join('\n')}\n\n${output.colors.blue(log)}`;

        // clone err object so stack trace adjustments won't affect test other reports
        test.err = err;
        return test;
      });


      Base.list(this.failures);
      console.log();
    }

    output.result(stats.passes, stats.failures, stats.pending, ms(stats.duration));

    if (stats.failures && output.level() < 3) {
      output.print(output.styles.debug('Run with --verbose flag to see complete NodeJS stacktrace'));
    }
  }
}

function matchTest(grep, test) {
  if (grep) {
    return grep.test(test);
  }
  return true;
}

module.exports = function (runner, opts) {
  return new Cli(runner, opts);
};
