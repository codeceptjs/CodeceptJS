import TestHelper from '../support/TestHelper.js'
import installCodeceptjs from '../support/install-codeceptjs.js'

export const config = {
  tests: './*_test.js',
  timeout: 10,
  output: './output',
  grep: '@Lightpanda',
  helpers: {
    Lightpanda: {
      url: TestHelper.siteUrl(),
    },
    ScreenshotSessionHelper: {
      require: '../support/ScreenshotSessionHelper.js',
      outputPath: 'test/acceptance/output',
    },
    '@codeceptjs/expect-helper': {},
  },
  include: {},
  bootstrap: installCodeceptjs,
  mocha: {},
  plugins: {
    retryFailedStep: {
      enabled: true,
    },
  },
  name: 'acceptance',
  gherkin: {
    features: './gherkin/*.feature',
    steps: ['./gherkin/steps.js'],
  },
}
