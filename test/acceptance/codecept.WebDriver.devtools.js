import TestHelper from '../support/TestHelper';

export const config = {
  tests: './*_test.js',
  timeout: 10000,
  output: './output.js',
  helpers: {
    WebDriver: {
      url: TestHelper.siteUrl(),
      browser: 'Chromium',
      windowSize: '500x700',
      devtoolsProtocol: true,
      waitForTimeout: 5000,
      capabilities: {
        chromeOptions: {
          args: ['--headless', '--disable-gpu', '--window-size=500,700'],
        },
      },
    },
    ScreenshotSessionHelper: {
      require: '../support/ScreenshotSessionHelper.js',
      outputPath: './output.js',
    },
    Expect: {},
  },
  include: {},
  bootstrap: async () => new Promise(done => {
    setTimeout(done, 5000);
  }), // let's wait for selenium
  mocha: {},
  name: 'acceptance',
  plugins: {
    screenshotOnFail: {
      enabled: true,
    },
  },
  gherkin: {
    features: './gherkin/*.feature',
    steps: ['./gherkin/steps.js'],
  },
};
