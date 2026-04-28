import TestHelper from '../support/TestHelper.js'
import installCodeceptjs from '../support/install-codeceptjs.js'

export const config = {
  tests: './*_test.js',
  timeout: 20,
  output: './output',
  helpers: {
    WebDriver: {
      url: TestHelper.siteUrl(),
      browser: 'chrome',
      host: TestHelper.seleniumHost(),
      port: TestHelper.seleniumPort(),
      // disableScreenshots: true,
      desiredCapabilities: {
        chromeOptions: {
          args: ['--headless', '--disable-gui', '--window-size=500,700'],
        },
      },
    },
    ScreenshotSessionHelper: {
      require: '../support/ScreenshotSessionHelper.js',
      outputPath: './output',
    },
    Expect: {
      require: '@codeceptjs/expect-helper',
    },
  },
  include: {},
  bootstrap: async () => {
    installCodeceptjs()
    await new Promise(done => setTimeout(done, 5000)) // let's wait for selenium
  },
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
}
