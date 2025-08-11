import Helper from '../../../../lib/helper.js';

class FailureHelper extends Helper {
  constructor() {
    super();
    throw new Error('Failed on FailureHelper');
  }
}

export default FailureHelper;
