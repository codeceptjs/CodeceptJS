const container = require('./container');
const recorder = require('./recorder');
const output = require('./output');
const methodsOfObject = require('./utils').methodsOfObject;

const readline = require('readline');
const colors = require('chalk');
// npm install colors
let rl;
let nextStep;
let finish;

/**
 * Pauses test execution and starts interactive shell
 */
module.exports = function () {
  recorder.add('Start new session', () => {
    recorder.session.start('pause');
    output.print(colors.yellow(' Interactive debug session started'));
    output.print(colors.yellow(' Use JavaScript syntax to try steps in action'));
    output.print(colors.yellow(` Press ${colors.bold('ENTER')} to continue`));
    rl = readline.createInterface(process.stdin, process.stdout, completer);

    rl.on('line', parseInput);
    rl.on('close', () => {
      console.log('Exiting interactive shell....');
    });
    return new Promise(((resolve) => {
      finish = resolve;
      return askForStep();
    }));
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
    const I = container.support('I');
    eval(`I.${cmd}`); // eslint-disable-line no-eval
  } catch (err) {
    output.print(output.styles.error(' ERROR '), err.message);
  }
  recorder.session.catch((err) => {
    const msg = err.cliMessage ? err.cliMessage() : err.message;
    return output.print(output.styles.error(' FAIL '), msg);
  });
  recorder.add('ask for next step', askForStep);
  nextStep();
}

function askForStep() {
  return new Promise(((resolve) => {
    nextStep = resolve;
    rl.setPrompt(' I.', 3);
    rl.resume();
    rl.prompt();
  }));
}

function completer(line) {
  const I = container.support('I');
  const completions = methodsOfObject(I);
  const hits = completions.filter((c) => {
    if (c.indexOf(line) === 0) {
      // console.log('bang! ' + c);
      return c;
    }
    return null;
  });
  return [hits && hits.length ? hits : completions, line];
}
