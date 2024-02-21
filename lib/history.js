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

export default new ReplHistory();
