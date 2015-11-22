'use strict';

let colors = require('colors');
let print = console.log;
let symbols = require('mocha/lib/reporters/base').symbols;

let debugEnabled = false;

let styles = {
  error: colors.bgRed.white.bold,
  success: colors.bgGreen.white.bold,
  scenario: colors.magenta.bold,
  basic: colors.white,
  debug: colors.cyan    
};

module.exports = {
  colors,
  styles,
  print,
  
  enableDebug(opt) {
    debugEnabled = opt;
  },
  
  debug: (msg) => {
    if (debugEnabled) print(styles.debug(" > " + msg));
  },
  
  error: (msg) => {
    print(styles.error(msg));
  },

  success: (msg) => {
    print(styles.success(msg)); 
  },

  step: (step) => {
    let sym = process.platform === 'win32' ? '*' : '•';
    print(` ${sym} ${step.toString()}`);
  },
  
  suite: {
    started: (suite) => {
      if (!suite.title) return;
      print(colors.bold(suite.title) + ' --');
    }
  },
 
  test: {
    started: (test) => {
      print(` ${colors.magenta.bold(test.title)}`)          
    },
    passed: (test) => {
      print(` ${colors.green.bold(symbols.ok)} ${test.title} ${colors.grey('in '+test.duration+'ms')}`);
    },
    failed: (test) => {
      print(` ${colors.red.bold(symbols.err)} ${test.title} ${colors.grey('in '+test.duration+'ms')}`);
    },
    skipped: (test) => {
      print(` ${colors.yellow.bold('S')} ${test.title}`);      
    }    
  },
  
  scenario: {
    started: (test) => {
      
    }, 
    passed: (test) => {
      print(' '+colors.green.bold(`${symbols.ok} OK`) +' '+colors.grey(`in ${test.duration}ms`));
      print();
    },
    failed: (test) => {
      print(' '+colors.red.bold(`${symbols.err} FAILED`) +' '+colors.grey(`in ${test.duration}ms`));
      print();
    }
    
    
  },

  say: (message) => {
    print(`   ${colors.cyan.bold(message)}`)
  },
  
  result: (passed, failed, pending, duration) => {
    let style = colors.bgGreen;
    let msg = ` ${passed || 0} passed`;
    let status = style.bold(`  OK `);
    if (failed) {
      style = style.bgRed;
      status = style.bold(`  FAIL `);
      msg += `, ${failed} failed`;
    } 
    status += style.grey(` |`);
    
    if (pending) {      
      if (!failed) style = style.bgYellow;
      msg += `, ${pending} pending`;
    }
    msg += "  ";
    print(status + style(msg) + colors.grey(` // ${duration}`));
  }
  
  // result: {
  //   passed: (num, duration) => {
  //     print(ind()+colors.green.bold(num) + ' passed ' + colors.grey(`(${duration})`));
  //   },
  //   failed: (num) => {
  //     if (!num) return;
  //     print(ind()+colors.red.bold(`${num} failed`));
  //   }, 
  //   pending: (num) => {
  //     if (!num) return;
  //     print(ind()+colors.yellow.bold(`${num} pending`));
  //   }
  // }

}


function ind() {
  return "  ";
}