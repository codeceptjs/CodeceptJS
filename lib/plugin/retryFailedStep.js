const event = require('../event');
const recorder = require('../recorder');

const defaultConfig = {
  retries: 5
}

module.exports = (config) => {
  config = Object.assign(defaultConfig, config);

  event.dispatcher.on(event.test.before, (test) => {
    recorder.retry(config);
  });
}
