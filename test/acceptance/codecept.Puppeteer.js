const TestHelper = require('../support/TestHelper');
const eventHandlers = require('../data/sandbox/eventHandlers');

module.exports.config = {
  tests: './*_test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    Puppeteer: {
      url: TestHelper.siteUrl(),
      show: false,
      chrome: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
        ],
      },
    },
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'acceptance',
};
