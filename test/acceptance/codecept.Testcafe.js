import TestHelper from '../support/TestHelper.js'

export const config = {
  tests: './*_test.js',
  timeout: 10,
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
