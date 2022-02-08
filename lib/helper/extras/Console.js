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

  includes(msg) {
    const prev = this._logEntries[this._logEntries.length - 1];
    if (!prev) return false;
    const text = msg.text && msg.text() || msg._text || '';
    const prevText = prev.text && prev.text() || prev._text || '';
    return text === prevText;
  }

  add(entry) {
    if (Array.isArray(entry)) {
      this._logEntries = this._logEntries.concat(entry);
    }
    this._logEntries.push(entry);
  }
}

module.exports = Console;
