
/**
 * Class to handle the interaction with the Console Class from Puppeteer
 */
class Console {
  constructor() {
    this._logEntries = [];
  }

  get entries() {
    return this._logEntries;
  }

  clear() {
    this._logEntries = [];
  }

  add(entry) {
    if (Array.isArray(entry)) {
      this._logEntries = this._logEntries.concat(entry);
    }
    this._logEntries.push(entry);
  }
}

module.exports = Console;
