'use strict';

let container = require('./container');
let recorder = require('./recorder');
let output = require('./output');
let methodsOfObject = require('./utils').methodsOfObject;

let readline = require('readline');
let util = require('util');
let colors = require('chalk'); // npm install colors
let rl, nextStep, finish;

/**
 * Pauses test execution and starts interactive shell
 */
module.exports = function () {
  recorder.add('Start new session', function () {
    recorder.session.start('pause');
    output.print(colors.yellow(" Interative debug session started"));
    output.print(colors.yellow(" Use JavaScript syntax to try steps in action"));
    output.print(colors.yellow(` Press ${colors.bold('ENTER')} to continue`));
    rl = readline.createInterface(process.stdin, process.stdout, completer);

    rl.on('line', parseInput);
    rl.on('close', function () {
      console.log('Exiting interactive shell....');
    });
    return new Promise(function (resolve) {
      finish = resolve;
      return askForStep();
    });
  });
};

function parseInput(cmd) {
  rl.pause();
  if (!cmd) {
    finish();
    recorder.session.restore();
    rl.close();
    return nextStep();
  }
  try {
    let I = container.support('I');
    eval('I.' + cmd);
  } catch (err) {
    output.print(output.styles.error(" ERROR "), err.message);
  }
  recorder.session.catch(function (err) {
    let msg = err.cliMessage ? err.cliMessage() : err.message;
    return output.print(output.styles.error(" FAIL "), msg);
  });
  recorder.add('ask for next step', askForStep);
  nextStep();
}

function askForStep() {
  return new Promise(function (resolve) {
    nextStep = resolve;
    rl.setPrompt(' I.', 3);
    rl.resume();
    rl.prompt();
  });
}

function completer(line) {
  let I = container.support('I');
  var completions = methodsOfObject(I);
  var hits = completions.filter(function (c) {
    if (c.indexOf(line) === 0) {
      // console.log('bang! ' + c);
      return c;
    }
  });
  return [hits && hits.length ? hits : completions, line];
}
