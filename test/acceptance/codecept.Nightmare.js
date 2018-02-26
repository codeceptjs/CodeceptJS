const TestHelper = require('../support/TestHelper');
const eventHandlers = require('../data/sandbox/eventHandlers');

module.exports.config = {
  tests: './*_test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    Nightmare: {
      url: TestHelper.siteUrl(),
    },
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'acceptance',
};
