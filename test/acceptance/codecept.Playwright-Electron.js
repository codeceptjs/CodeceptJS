const path = require('path');

module.exports.config = {
  tests: './*_test.js',
  timeout: 10000,
  output: './output',
  grep: '@ElectronPlaywright',
  helpers: {
    Playwright: {
      browser: 'electron',
      electron: {
        executablePath: require('electron'),
        args: [path.join('test/data/', 'electron/')],
      },
    },
    ScreenshotSessionHelper: {
      require: '../support/ScreenshotSessionHelper.js',
      outputPath: 'test/acceptance/output',
    },
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
};
