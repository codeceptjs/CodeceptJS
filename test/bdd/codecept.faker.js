import TestHelper from '../support/TestHelper';

export const config = {
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
    ScreenshotSessionHelper: {
      require: '../support/ScreenshotSessionHelper.js',
      outputPath: './output.js',
    },
  },
  include: {},
  bootstrap: false,
  mocha: {},
  plugins: {
    screenshotOnFail: {
      enabled: true,
    },
    fakerTransform: {
      enabled: true,
    },
  },
  name: 'bdd',
  gherkin: {
    features: './features/faker.feature',
    steps: ['./defs/faker.js'],
  },
};
