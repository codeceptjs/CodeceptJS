const withTimestamp = entry => Object.assign({
  timestamp: Date.now(),
}, entry);

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
      this._logEntries = this._logEntries.concat(entry.map(e => withTimestamp(e)));
    }
    this._logEntries.push(withTimestamp(entry));
  }
}

module.exports = Console;
