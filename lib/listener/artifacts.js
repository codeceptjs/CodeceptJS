const event = require('../event');

module.exports = function () {
  event.dispatcher.on(event.test.before, (test) => {
    test.artifacts = {};
  });
};
