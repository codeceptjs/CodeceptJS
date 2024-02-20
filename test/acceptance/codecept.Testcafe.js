import TestHelper from '../support/TestHelper';

export const config = {
  tests: './*_test.js',
  timeout: 10000,
  output: './output.js',
  helpers: {
    Testcafe: {
      url: TestHelper.siteUrl(),
      show: true,
    },
    Expect: {},
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'acceptance',
  gherkin: {
    features: './gherkin/*.feature',
    steps: ['./gherkin/steps.js'],
  },
};
