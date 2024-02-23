import mocha from 'mocha';
import ms from 'ms';
import * as event from './event.js';
import * as output from './output.js';
import AssertionFailedError from './assert/error.js';
import * as Codecept from './codecept.js';
import container from './container.js';

const { reporters: { Base } } = mocha;

const cursor = Base.cursor;
let currentMetaStep = [];
let codeceptjsEventDispatchersRegistered = false;

class Cli extends Base {
  constructor(runner, opts) {
    super(runner);
    let level = 0;
    this.loadedTests = [];
    opts = opts.reporterOptions || opts;
    if (opts.steps) level = 1;
    if (opts.debug) level = 2;
    if (opts.verbose) level = 3;
    output.output.level(level);
    const version = Codecept.version();
    output.output.print(`CodeceptJS v${version} ${output.output.standWithUkraine()}`);
    output.output.print(`Using test root "${global.codecept_dir}"`);

    const showSteps = level >= 1;

    if (level >= 2) {
      output.output.print(output.output.styles.debug(`Helpers: ${Object.keys(container.helpers()).join(', ')}`));
      output.output.print(output.output.styles.debug(`Plugins: ${Object.keys(container.plugins()).join(', ')}`));
    }

    runner.on('start', () => {
      console.log();
    });

    runner.on('suite', (suite) => {
      output.output.suite.started(suite);
    });

    runner.on('fail', (test) => {
      if (test.ctx.currentTest) {
        this.loadedTests.push(test.ctx.currentTest.uid);
      }
      if (showSteps && test.steps) {
        return output.output.scenario.failed(test);
      }
      cursor.CR();
      output.output.test.failed(test);
    });

    runner.on('pending', (test) => {
      if (test.parent && test.parent.pending) {
        const suite = test.parent;
        const skipInfo = suite.opts.skipInfo || {};
        skipTestConfig(test, skipInfo.message);
      } else {
        skipTestConfig(test, null);
      }
      this.loadedTests.push(test.uid);
      cursor.CR();
      output.output.test.skipped(test);
    });

    runner.on('pass', (test) => {
      if (showSteps && test.steps) {
        return output.output.scenario.passed(test);
      }
      cursor.CR();
      output.output.test.passed(test);
    });

    if (showSteps) {
      runner.on('test', (test) => {
        currentMetaStep = [];
        if (test.steps) {
          output.output.test.started(test);
        }
      });

      if (!codeceptjsEventDispatchersRegistered) {
        codeceptjsEventDispatchersRegistered = true;

        event.dispatcher.on(event.bddStep.started, (step) => {
         // output.output.stepShift = 2;
          output.output.step(step);
        });

        event.dispatcher.on(event.step.started, (step) => {
          let processingStep = step;
          const metaSteps = [];
          while (processingStep.metaStep) {
            metaSteps.unshift(processingStep.metaStep);
            processingStep = processingStep.metaStep;
          }
          const shift = metaSteps.length;

          for (let i = 0; i < Math.max(currentMetaStep.length, metaSteps.length); i++) {
            if (currentMetaStep[i] !== metaSteps[i]) {
              output.output.stepShift = 3 + 2 * i;
              if (!metaSteps[i]) continue;
              // bdd steps are handled by bddStep.started
              if (metaSteps[i].isBDD()) continue;
              output.output.step(metaSteps[i]);
            }
          }
          currentMetaStep = metaSteps;
          output.output.stepShift = 3 + 2 * shift;
          if (step.helper.constructor.name !== 'ExpectHelper') {
            output.output.step(step);
          }
        });

        event.dispatcher.on(event.step.finished, () => {
          output.output.stepShift = 0;
        });
      }
    }

    runner.on('suite end', suite => {
      let skippedCount = 0;
      const grep = runner._grep;
      for (const test of suite.tests) {
        if (!test.state && !this.loadedTests.includes(test.uid)) {
          if (matchTest(grep, test.title)) {
            if (!test.opts) {
              test.opts = {};
            }
            if (!test.opts.skipInfo) {
              test.opts.skipInfo = {};
            }
            skipTestConfig(test, 'Skipped due to failure in \'before\' hook');
            output.output.test.skipped(test);
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
      output.output.print(output.output.styles.bold('-- FAILURES:'));
    }

    const failuresLog = [];

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
          log += `${output.output.styles.bold('Scenario Steps')}:${scenarioTrace}\n`;
        }

        // display artifacts in debug mode
        if (test?.artifacts && Object.keys(test.artifacts).length) {
          log += `\n${output.output.styles.bold('Artifacts:')}`;
          for (const artifact of Object.keys(test.artifacts)) {
            log += `\n- ${artifact}: ${test.artifacts[artifact]}`;
          }
        }

        let stack = err.stack ? err.stack.split('\n') : [];
        if (stack[0] && stack[0].includes(err.message)) {
          stack.shift();
        }

        if (output.output.level() < 3) {
          stack = stack.slice(0, 3);
        }

        err.stack = `${stack.join('\n')}\n\n${output.output.colors.blue(log)}`;

        // clone err object so stack trace adjustments won't affect test other reports
        test.err = err;
        return test;
      });

      const originalLog = Base.consoleLog;
      Base.consoleLog = (...data) => {
        failuresLog.push([...data]);
        originalLog(...data);
      };
      Base.list(this.failures);
      Base.consoleLog = originalLog;
      console.log();
    }

    event.emit(event.all.failures, { failuresLog, stats });
    output.output.result(stats.passes, stats.failures, stats.pending, ms(stats.duration));

    if (stats.failures && output.output.level() < 3) {
      output.output.print(output.output.styles.debug('Run with --verbose flag to see complete NodeJS stacktrace'));
    }
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

export default function cli(runner, opts) {
  return new Cli(runner, opts);
}
