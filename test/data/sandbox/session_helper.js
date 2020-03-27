
const Helper = require('../../../lib/helper');

let uniqueSessions = 0;

class Session extends Helper {
  _init() {
    this.sessionId = uniqueSessions;
  }

  _before() {
    uniqueSessions = 0;
  }

  _session() {
    const defaultSession = this.sessionId;
    return {
      start: () => ++uniqueSessions,
      stop: () => {},
      loadVars: sessionSaved => this.sessionId = sessionSaved,
      restoreVars: () => this.sessionId = defaultSession,
    };
  }

  do() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('res');
      }, 100);
    });
    // .then(() => output.step(`session:${this.sessionId}.${action}`));
  }

  errorStep() {
    throw new Error('ups, error');
  }
}

module.exports = Session;
