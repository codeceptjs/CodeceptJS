import Helper from '../../../lib/helper';
import * as output from '../../../lib/output.js';
import { Step } from '../../../lib/step.js';

class Within extends Helper {
  _withinBegin(testStr) {
    output.step(new Step(this.constructor.name, `Hey! I am within Begin. I get ${testStr}`));
  }

  _withinEnd() {
    output.step(new Step(this.constructor.name, 'oh! I am within end('));
  }

  _failed() {
    this._withinEnd();
  }

  smallYield() {
    return 'I am small yield string';
  }

  smallPromise() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('result');
      }, 100);
    }).then(() => output.step(new Step(this.constructor.name, 'small Promise was finished')));
  }

  errorStep() {
    throw new Error('ups, error');
  }
}

export default Within;
