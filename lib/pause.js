const container = require('./container');
const recorder = require('./recorder');
const event = require('./event');
const output = require('./output');
const methodsOfObject = require('./utils').methodsOfObject;

const readline = require('readline');
const colors = require('chalk');
// npm install colors
let rl;
let nextStep;
let finish;
let next;

/**
 * Pauses test execution and starts interactive shell
 */
const pause = function () {
  next = false;
  // add listener to all next steps to provide next() functionality
  event.dispatcher.on(event.step.after, () => {
    recorder.add('Start next pause session', () => {
      if (!next) return;
      return pauseSession();
    });
  });
  recorder.add('Start new session', pauseSession);
};

function pauseSession() {
  recorder.session.start('pause');
  output.print(colors.yellow(' Interactive shell started'));
  output.print(colors.yellow(` Press ${colors.bold('ENTER')} to resume test`));
  if (!next) {
    output.print(colors.yellow(' - Use JavaScript syntax to try steps in action'));
    output.print(colors.yellow(` - Press ${colors.bold('TAB')} twice to see all available commands`));
    output.print(colors.yellow(` - Enter ${colors.bold('next')} to run the next step`));
  }
  rl = readline.createInterface(process.stdin, process.stdout, completer);

  rl.on('line', parseInput);
  rl.on('close', () => {
    console.log('Exiting interactive shell....');
  });
  return new Promise(((resolve) => {
    finish = resolve;
    return askForStep();
  }));
}

function parseInput(cmd) {
  rl.pause();
  next = false;
  if (cmd === 'next') next = true;
  if (!cmd || cmd === 'next') {
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

module.exports = pause;
