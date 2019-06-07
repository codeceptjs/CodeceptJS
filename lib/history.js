const fs = require('fs');
const path = require('path');


/**
 * REPL history records REPL commands and stores them in
 * a file (~history) when session ends.
 */
class ReplHistory {
  constructor() {
    this.commands = [];
  }

  push(cmd) {
    this.commands.push(cmd);
  }

  pop() {
    this.commands.pop();
  }

  save() {
    const historyFile = path.join(global.codecept_dir, '~history');
    const output = `\n\n### Recorded commands on ${new Date()}\n${this.commands.join('\n')}`;
    fs.appendFileSync(historyFile, output);

    this.commands = [];
  }
}

module.exports = new ReplHistory();
