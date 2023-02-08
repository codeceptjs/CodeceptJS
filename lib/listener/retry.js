const event = require('../event');
const output = require('../output');
const Config = require('../config');

module.exports = function () {
  event.dispatcher.on(event.suite.before, (suite) => {
    if (suite.opts.retries) return;
    const retryNum = Config.get('retries');
    if (!retryNum) return;
    output.log(`Retries: ${retryNum}`);
    suite.retries(retryNum);
  });
};
