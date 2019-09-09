const colors = require('chalk');
const figures = require('figures');

const styles = {
  error: colors.bgRed.white.bold,
  success: colors.bgGreen.white.bold,
  scenario: colors.magenta.bold,
  basic: colors.white,
  debug: colors.cyan,
  log: colors.grey,
  bold: colors.bold,
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
  level(level) {
    if (level !== undefined) outputLevel = level;
    return outputLevel;
  },

  /**
   * Print information for a process
   * Used in multiple-run
   */
  process(process) {
    if (process === null) return outputProcess = '';
    if (process) outputProcess = `[${process}]`;
    return outputProcess;
  },

  /**
   * Print information in --debug mode
   */
  debug(msg) {
    if (outputLevel >= 2) {
      print(' '.repeat(this.stepShift), styles.debug(`${figures.pointerSmall} ${msg}`));
    }
  },

  /**
   * Print information in --verbose mode
   */
  log(msg) {
    if (outputLevel >= 3) print(' '.repeat(this.stepShift), styles.log(truncate(`   ${msg}`, this.spaceShift)));
  },

  /**
   * Print error
   */
  error(msg) {
    print(styles.error(msg));
  },

  /**
   * Print a successful message
   */
  success(msg) {
    print(styles.success(msg));
  },

  plugin(name, msg) {
    this.debug(`<${name}> ${msg}`);
  },

  /**
   * Print a step
   */
  step(step) {
    if (outputLevel === 0) return;
    if (!step) return;
    // Avoid to print non-gherkin steps, when gherkin is running for --steps mode
    if (outputLevel === 1) {
      if (!step.isMetaStep() && step.hasBDDAncestor()) {
        return;
      }
    }

    let stepLine = step.toString();
    if (step.metaStep && outputLevel >= 1) {
      this.stepShift += 2;
      stepLine = colors.green(truncate(stepLine, this.spaceShift));
    }
    if (step.comment) {
      stepLine += colors.grey(step.comment.split('\n').join('\n' + ' '.repeat(4))); // eslint-disable-line
    }

    print(' '.repeat(this.stepShift), truncate(stepLine, this.spaceShift));
  },

  suite: {
    started: (suite) => {
      if (!suite.title) return;
      print(`${colors.bold(suite.title)} --`);
      if (suite.comment) print(suite.comment);
    },
  },

  test: {
    started(test) {
      print(`  ${colors.magenta.bold(test.title)}`);
    },
    passed(test) {
      print(`  ${colors.green.bold(figures.tick)} ${test.title} ${colors.grey(`in ${test.duration}ms`)}`);
    },
    failed(test) {
      print(`  ${colors.red.bold(figures.cross)} ${test.title} ${colors.grey(`in ${test.duration}ms`)}`);
    },
    skipped(test) {
      print(`  ${colors.yellow.bold('S')} ${test.title}`);
    },
  },

  scenario: {
    started(test) {},
    passed(test) {
      print(`  ${colors.green.bold(`${figures.tick} OK`)} ${colors.grey(`in ${test.duration}ms`)}`);
      print();
    },
    failed(test) {
      print(`  ${colors.red.bold(`${figures.cross} FAILED`)} ${colors.grey(`in ${test.duration}ms`)}`);
      print();
    },
  },

  /**
   *
   * Print a text in console log
   */
  say(message, color = 'cyan') {
    if (outputLevel >= 1) print(`   ${colors[color].bold(message)}`);
  },

  result(passed, failed, skipped, duration) {
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

function truncate(msg, gap = 0) {
  if (msg.indexOf('\n') > 0) {
    return msg; // don't cut multi line steps
  }
  const width = (process.stdout.columns || 200) - gap - 4;
  if (msg.length > width) {
    msg = msg.substr(0, width - 1) + figures.ellipsis;
  }
  return msg;
}
