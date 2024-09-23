import Helper from '../../lib/helper.js';
import { output } from '../../lib/output.js';

class FakeDriver extends Helper {
  printBrowser() {
    output.debug(this.config.browser);
  }

  printWindowSize() {
    output.debug(this.config.windowSize);
  }
}

export default FakeDriver;
