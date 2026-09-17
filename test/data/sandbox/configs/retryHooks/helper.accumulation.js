import Helper from '../../../../../lib/helper.js';

class AccumulationHelper extends Helper {
  _before() {
    this._failCount = 0;
  }

  failingStep() {
    this._failCount++;
    if (this._failCount <= 2) {
      throw new Error('failing step - retry expected');
    }
  }
}

export default AccumulationHelper;
