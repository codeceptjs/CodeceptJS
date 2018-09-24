const { clean } = require('../history');
const event = require('../event');

/**
 * Clean history on failures and pass
 */
module.exports = function () {
  event.dispatcher.on(event.test.failed, (test, err) => {
    clean();
  });

  event.dispatcher.on(event.test.finish, (test, err) => {
    clean();
  });
};

