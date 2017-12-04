
const Helper = require('../../../lib/helper');
const output = require('../../../lib/output');

class Whithin extends Helper {
  _withinBegin(testStr) {
    output.step(`Hey! I am within Begin. I get ${testStr}`);
  }

  _withinEnd() {
    output.step('oh! I am within end(');
  }

  _failed() {
    this._withinEnd();
  }

  smallYield() {
    return `I am small yield string`;
  }

  smallPromise() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('result');
      }, 100);
    }).then(() => output.step('small Promise was finished'));
  }

  errorStep() {
    throw new Error('ups, error');
  }
}

module.exports = Whithin;
