const eventHandlers = require('./eventHandlers');
require('../fake_driver');

eventHandlers.setConsoleLogging(true);

module.exports.config = {
  tests: './*_test.testevents.js',
  timeout: 10000,
  output: './output',
  helpers: {
    FakeDriver: {
      require: '../helper',
    },
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'sandbox',
};
