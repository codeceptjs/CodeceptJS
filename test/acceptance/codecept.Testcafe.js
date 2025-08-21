import TestHelper from '../support/TestHelper.js'

module.exports.config = {
  tests: './*_test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    Testcafe: {
      url: TestHelper.siteUrl(),
      show: true,
    },
    Expect: {
      require: '@codeceptjs/expect-helper',
    },
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'acceptance',
  gherkin: {
    features: './gherkin/*.feature',
    steps: ['./gherkin/steps.js'],
  },
}
