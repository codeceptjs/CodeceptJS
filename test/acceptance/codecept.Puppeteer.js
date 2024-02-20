import TestHelper from '../support/TestHelper';

export const config = {
  tests: './*_test.js',
  timeout: 10000,
  output: './output.js',
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
    ScreenshotSessionHelper: {
      require: '../support/ScreenshotSessionHelper.js',
      outputPath: './output.js',
    },
    Expect: {},
  },
  include: {},
  bootstrap: false,
  mocha: {},
  plugins: {
    screenshotOnFail: {
      enabled: true,
    },
  },
  name: 'acceptance',
  gherkin: {
    features: './gherkin/*.feature',
    steps: ['./gherkin/steps.js'],
  },
};
