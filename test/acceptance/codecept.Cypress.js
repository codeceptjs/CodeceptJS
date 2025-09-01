const TestHelper = require('../support/TestHelper')

exports.config = {
  tests: './*_test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    Cypress: {
      url: TestHelper.siteUrl(),
      browser: 'chrome',
      show: false,
      timeout: 5000,
    },
    FileSystem: {},
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'acceptance',
  translation: 'en-US',
}
