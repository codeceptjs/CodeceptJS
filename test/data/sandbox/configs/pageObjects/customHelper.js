const event = require('../../../../../lib/event');

class CustomHelper extends Helper {
  constructor(config) {
    super(config);

    event.dispatcher.on(event.step.started, (step) => {
      console.log(`Start event step: ${step.toString()}`);
    });
  }

  printMessage(s) {
    // this.debug('Print message from CustomHelper');
    console.log(s);
  }

  getHumanizeArgs(objectArgs) {
    console.log(objectArgs.value);
  }

  errorMethodHumanizeArgs(objectArgs) {
    throw new Error('Error humanize args');
  }
}

module.exports = CustomHelper;
