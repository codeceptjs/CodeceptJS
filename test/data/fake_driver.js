import Helper from '../../lib/helper';

class FakeDriver extends Helper {
  printBrowser() {
    this.debug(this.config.browser);
  }

  printWindowSize() {
    this.debug(this.config.windowSize);
  }
}

export default FakeDriver;
