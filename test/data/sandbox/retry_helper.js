const Helper = require('../../../lib/helper');

class Retry extends Helper {
  failWhen(fn) {
    if (fn()) throw new Error('ups, error');
  }

  waitForFail(fn) {
    if (fn()) throw new Error('ups, error');
  }
}

module.exports = Retry;
