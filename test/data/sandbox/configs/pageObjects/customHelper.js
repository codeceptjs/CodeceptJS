// const Helper = require('../../lib/helper');

class CustomHelper extends Helper {
  printMessage(s) {
    // this.debug('Print message from CustomHelper');
    console.log(s);
  }

  getHumanizeArgs(objectArgs) {
    console.log(objectArgs.value);
  }
}

module.exports = CustomHelper;
