const Helper = require('../../../lib/helper');

class Retry extends Helper {
  failWhen(fn) {
    if (fn()) throw new Error('ups, error');
  }

  waitForFail(fn) {
    if (fn()) throw new Error('ups, error');
  }

  asyncStep() {
    return new Promise(resolve => {
      setTimeout(resolve, 500);
    });
  }
}

module.exports = Retry;
