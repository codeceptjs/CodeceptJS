const event = require('../event');

module.exports = function () {
  event.dispatcher.on(event.all.before, (test) => {
    test.artifacts = {};
  });
};
