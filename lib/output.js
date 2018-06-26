const colors = require('chalk');
const symbols = require('mocha/lib/reporters/base').symbols;

const styles = {
  error: colors.bgRed.white.bold,
  success: colors.bgGreen.white.bold,
  scenario: colors.magenta.bold,
  basic: colors.white,
  debug: colors.cyan,
  log: colors.grey,
};

let outputLevel = 0;
let outputProcess = '';
let newline = true;

module.exports = {
  colors,
  styles,
  print,
  stepShift: 0,

  /**
   * Set or return current verbosity level
   */
  level: (level) => {
    if (level !== undefined) outputLevel = level;
    return outputLevel;
  },

  /**
   * Print information for a process
   * Used in multiple-run
   */
  process: (process) => {
    if (process) outputProcess = `[${process}]`;
    return outputProcess;
  },

  /**
   * Print information in --debug mode
   */
  debug: (msg) => {
    if (outputLevel >= 2) {
      print(' '.repeat(this.stepShift), styles.debug(`> ${msg}`));
    }
  },

  /**
   * Print information in --verbose mode
   */
  log: (msg) => {
    if (outputLevel >= 3) print(' '.repeat(this.stepShift), styles.log(`  ${msg}`));
  },

  /**
   * Print error
   */
  error: (msg) => {
    print(styles.error(msg));
  },

  /**
   * Print a successful message
   */
  success: (msg) => {
    print(styles.success(msg));
  },

  /**
   * Print a step
   */
  step(step) {
    if (outputLevel === 0) return;
    if (!step) return;
    let stepLine = step.toString();
    if (step.metaStep) {
      if (outputLevel < 2) return;
      stepLine = ' '.repeat(2) + colors.green(stepLine);
    }
    if (step.comment) {
      stepLine += colors.grey(step.comment.split('\n').join('\n' + ' '.repeat(4))); // eslint-disable-line
    }
    if (step.isMetaStep && step.isMetaStep() && outputLevel === 2) {
      stepLine += '\n'; // meta steps don't have execution time
    }
    const sym = ' ';
    if (outputLevel === 2) {
      newline = false;
      return process.stdout.write(`${' '.repeat(this.stepShift)} ${sym} ${stepLine}`);
    }
    print(' '.repeat(this.stepShift), `${sym} ${stepLine}`);
  },

  /**
   * Print a step execution time
   */
  stepExecutionTime(step) {
    if (outputLevel < 2) return;
    if (!step) return;

    const time = (step.endTime - step.startTime) / 1000;

    if (Number.isNaN(time)) return;

    if (outputLevel === 2) {
      newline = true;
      process.stdout.write(`${styles.debug(` ("${time} sec")\n`)}`);
      return;
    }

    this.log(`Step finished in ${time} sec`);
  },

  suite: {
    started: (suite) => {
      if (!suite.title) return;
      print(`${colors.bold(suite.title)} --`);
      if (suite.comment) print(suite.comment);
    },
  },

  test: {
    started: (test) => {
      print(`  ${colors.magenta.bold(test.title)}`);
    },
    passed: (test) => {
      print(`  ${colors.green.bold(symbols.ok)} ${test.title} ${colors.grey(`in ${test.duration}ms`)}`);
    },
    failed: (test) => {
      print(`  ${colors.red.bold(symbols.err)} ${test.title} ${colors.grey(`in ${test.duration}ms`)}`);
    },
    skipped: (test) => {
      print(`  ${colors.yellow.bold('S')} ${test.title}`);
    },
  },

  scenario: {
    started: (test) => {

    },
    passed: (test) => {
      print(`  ${colors.green.bold(`${symbols.ok} OK`)} ${colors.grey(`in ${test.duration}ms`)}`);
      print();
    },
    failed: (test) => {
      print(`  ${colors.red.bold(`${symbols.err} FAILED`)} ${colors.grey(`in ${test.duration}ms`)}`);
      print();
    },
  },

  say: (message) => {
    if (outputLevel >= 1) print(`   ${colors.cyan.bold(message)}`);
  },

  result: (passed, failed, skipped, duration) => {
    let style = colors.bgGreen;
    let msg = ` ${passed || 0} passed`;
    let status = style.bold('  OK ');
    if (failed) {
      style = style.bgRed;
      status = style.bold('  FAIL ');
      msg += `, ${failed} failed`;
    }
    status += style.grey(' |');

    if (skipped) {
      if (!failed) style = style.bgYellow;
      msg += `, ${skipped} skipped`;
    }
    msg += '  ';
    print(status + style(msg) + colors.grey(` // ${duration}`));
  },
};

function print(...msg) {
  if (outputProcess) {
    msg.unshift(outputProcess);
  }
  if (!newline) {
    console.log();
    newline = true;
  }
  console.log.apply(this, msg);
}

function ind() {
  return '  ';
}
