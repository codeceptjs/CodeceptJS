import TestHelper from '../support/TestHelper';

export const config = {
  tests: './*_test.js',
  timeout: 10000,
  output: './output.js',
  helpers: {
    WebDriver: {
      url: TestHelper.siteUrl(),
      browser: 'chrome',
      host: TestHelper.seleniumHost(),
      port: TestHelper.seleniumPort(),
      // disableScreenshots: true,
      // desiredCapabilities: {
      //   chromeOptions: {
      //     args: ['--headless', '--disable-gpu', '--window-size=1280,1024'],
      //   },
      // },
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
