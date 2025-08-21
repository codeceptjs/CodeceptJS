import assert from 'assert'
import Helper from '../../../lib/helper.js'

class CustomWorkers extends Helper {
  sayCustomMessage() {
    assert(true, 'this is a custom message');
  }
}

export default CustomWorkers;
