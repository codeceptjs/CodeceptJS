'use strict';

let colors = require('chalk');
let print = console.log;
let symbols = require('mocha/lib/reporters/base').symbols;

let styles = {
  error: colors.bgRed.white.bold,
  success: colors.bgGreen.white.bold,
  scenario: colors.magenta.bold,
  basic: colors.white,
  debug: colors.cyan,
  log: colors.grey
};

let outputLevel = 0;

module.exports = {
  colors,
  styles,
  print,
  stepShift: 0,
  level: (level) => {
    if (level) outputLevel = level;
    return outputLevel;
  },

  debug: (msg) => {
    if (outputLevel >= 2) print(' '.repeat(this.stepShift), styles.debug("> " + msg));
  },

  log: (msg) => {
    if (outputLevel >= 3) print(' '.repeat(this.stepShift), styles.log("  " + msg));
  },

  error: (msg) => {
    print(styles.error(msg));
  },

  success: (msg) => {
    print(styles.success(msg));
  },

  step: function (step) {
    if (outputLevel === 0) return;
    if (!step) return;
    let sym = process.platform === 'win32' ? '*' : '•';
    print(' '.repeat(this.stepShift), `${sym} ${step.toString()}`);
  },

  suite: {
    started: (suite) => {
      if (!suite.title) return;
      print(colors.bold(suite.title) + ' --');
    }
  },

  test: {
    started: (test) => {
      print(` ${colors.magenta.bold(test.title)}`);
    },
    passed: (test) => {
      print(` ${colors.green.bold(symbols.ok)} ${test.title} ${colors.grey('in ' + test.duration + 'ms')}`);
    },
    failed: (test) => {
      print(` ${colors.red.bold(symbols.err)} ${test.title} ${colors.grey('in ' + test.duration + 'ms')}`);
    },
    skipped: (test) => {
      print(` ${colors.yellow.bold('S')} ${test.title}`);
    }
  },

  scenario: {
    started: (test) => {

    },
    passed: (test) => {
      print(' ' + colors.green.bold(`${symbols.ok} OK`) + ' ' + colors.grey(`in ${test.duration}ms`));
      print();
    },
    failed: (test) => {
      print(' ' + colors.red.bold(`${symbols.err} FAILED`) + ' ' + colors.grey(`in ${test.duration}ms`));
      print();
    }


  },

  say: (message) => {
    print(`   ${colors.cyan.bold(message)}`);
  },

  result: (passed, failed, skipped, duration) => {
    let style = colors.bgGreen;
    let msg = ` ${passed || 0} passed`;
    let status = style.bold(`  OK `);
    if (failed) {
      style = style.bgRed;
      status = style.bold(`  FAIL `);
      msg += `, ${failed} failed`;
    }
    status += style.grey(` |`);

    if (skipped) {
      if (!failed) style = style.bgYellow;
      msg += `, ${skipped} skipped`;
    }
    msg += "  ";
    print(status + style(msg) + colors.grey(` // ${duration}`));
  }
};


function ind() {
  return "  ";
}
