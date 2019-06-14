const fs = require('fs');
const path = require('path');

const output = require('./output');
const colors = require('chalk');

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
    if (this.commands.length === 0) {
      return;
    }

    const historyFile = path.join(global.output_dir, 'cli-history');
    const commandSnippet = `\n\n<<< Recorded commands on ${new Date()}\n${this.commands.join('\n')}`;
    fs.appendFileSync(historyFile, commandSnippet);

    output.print(colors.yellow(` Commands have been saved to ${historyFile}`));

    this.commands = [];
  }
}

module.exports = new ReplHistory();
