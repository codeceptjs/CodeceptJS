import assert from 'assert';
import HelperModule from '../../../lib/helper.js';
const Helper = HelperModule.default || HelperModule;

class CustomWorkers extends Helper {
  sayCustomMessage() {
    assert(true, 'this is a custom message')
  }
}

export default CustomWorkers;
