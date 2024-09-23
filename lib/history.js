import colors from 'chalk';
import fs from 'fs';
import path from 'path';
import * as output from './output.js';

/**
 * REPL history records REPL commands and stores them in
 * a file (~history) when session ends.
 */
class ReplHistory {
  constructor() {
    if (global.output_dir) {
      this.historyFile = path.join(global.output_dir, 'cli-history');
    }
    this.commands = [];
  }

  push(cmd) {
    this.commands.push(cmd);
  }

  pop() {
    this.commands.pop();
  }

  load() {
    if (!this.historyFile) return;
    if (!fs.existsSync(this.historyFile)) {
      return;
    }

    const history = fs.readFileSync(this.historyFile, 'utf-8');
    return history.split('\n').reverse().filter(line => line.startsWith('I.')).map(line => line.slice(2));
  }

  save() {
    if (!this.historyFile) return;
    if (this.commands.length === 0) {
      return;
    }

    const commandSnippet = `\n\n<<< Recorded commands on ${new Date()}\n${this.commands.join('\n')}`;
    fs.appendFileSync(this.historyFile, commandSnippet);

    output.print(colors.yellow(` Commands have been saved to ${this.historyFile}`));

    this.commands = [];
  }
}

export default new ReplHistory();
