const colors = require('chalk');
const readline = require('readline');

const container = require('./container');
const history = require('./history');
const store = require('./store');
const recorder = require('./recorder');
const event = require('./event');
const output = require('./output');
const methodsOfObject = require('./utils').methodsOfObject;

// npm install colors
let rl;
let nextStep;
let finish;
let next;
let registeredVariables = {};
/**
 * Pauses test execution and starts interactive shell
 */
const pause = function (passedObject = {}) {
  if (store.dryRun) return;

  next = false;
  // add listener to all next steps to provide next() functionality
  event.dispatcher.on(event.step.after, () => {
    recorder.add('Start next pause session', () => {
      if (!next) return;
      return pauseSession();
    });
  });
  recorder.add('Start new session', () => pauseSession(passedObject));
};

function pauseSession(passedObject = {}) {
  registeredVariables = passedObject;
  recorder.session.start('pause');
  if (!next) {
    let vars = Object.keys(registeredVariables).join(', ');
    if (vars) vars = `(vars: ${vars})`;

    output.print(colors.yellow(' Interactive shell started'));
    output.print(colors.yellow(' Use JavaScript syntax to try steps in action'));
    output.print(colors.yellow(` - Press ${colors.bold('ENTER')} to run the next step`));
    output.print(colors.yellow(` - Press ${colors.bold('TAB')} twice to see all available commands`));
    output.print(colors.yellow(` - Type ${colors.bold('exit')} + Enter to exit the interactive shell`));
    output.print(colors.yellow(` - Prefix ${colors.bold('=>')} to run js commands ${colors.bold(vars)}`));
  }
  rl = readline.createInterface(process.stdin, process.stdout, completer);

  rl.on('line', parseInput);
  rl.on('close', () => {
    if (!next) console.log('Exiting interactive shell....');
  });
  return new Promise(((resolve) => {
    finish = resolve;
    return askForStep();
  }));
}

function parseInput(cmd) {
  rl.pause();
  next = false;
  store.debugMode = false;
  if (cmd === '') next = true;
  if (!cmd || cmd === 'resume' || cmd === 'exit') {
    finish();
    recorder.session.restore();
    rl.close();
    history.save();
    return nextStep();
  }
  for (const k of Object.keys(registeredVariables)) {
    eval(`var ${k} = registeredVariables['${k}'];`); // eslint-disable-line no-eval
  }
  store.debugMode = true;
  let isCustomCommand = false;
  let lastError = null;
  try {
    const locate = global.locate; // enable locate in this context
    const I = container.support('I');
    if (cmd.trim().startsWith('=>')) {
      isCustomCommand = true;
      cmd = cmd.trim().substring(2, cmd.length);
    } else {
      cmd = `I.${cmd}`;
    }
    const executeCommand = eval(cmd); // eslint-disable-line no-eval

    const result = executeCommand instanceof Promise ? executeCommand : Promise.resolve(executeCommand);
    result.then((val) => {
      if (isCustomCommand) {
        console.log(val);
        return;
      }
      if (cmd.startsWith('I.see') || cmd.startsWith('I.dontSee')) {
        output.print(output.styles.success('  OK  '), cmd);
        return;
      }
      if (cmd.startsWith('I.grab')) {
        output.print(output.styles.debug(val));
      }
    }).catch((err) => {
      if (!lastError) output.print(output.styles.error(' ERROR '), err.message);
      lastError = err.message;
    });

    history.push(cmd); // add command to history when successful
  } catch (err) {
    if (!lastError) output.print(output.styles.error(' ERROR '), err.message);
    lastError = err.message;
  }
  recorder.session.catch((err) => {
    const msg = err.cliMessage ? err.cliMessage() : err.message;

    // pop latest command from history because it failed
    history.pop();

    if (!lastError) output.print(output.styles.error(' FAIL '), msg);
    lastError = err.message;
  });
  recorder.add('ask for next step', askForStep);
  nextStep();
}

function askForStep() {
  return new Promise(((resolve) => {
    nextStep = resolve;
    rl.setPrompt(' I.', 3);
    rl.resume();
    rl.prompt([false]);
  }));
}

function completer(line) {
  const I = container.support('I');
  const completions = methodsOfObject(I);
  const hits = completions.filter((c) => {
    if (c.indexOf(line) === 0) {
      return c;
    }
    return null;
  });
  return [hits && hits.length ? hits : completions, line];
}

module.exports = pause;
