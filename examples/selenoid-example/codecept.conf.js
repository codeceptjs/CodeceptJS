exports.config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    Puppeteer: {
      url: 'http://localhost',
      browser: 'chrome',
    },
  },

  plugins: {
    selenoid: {
      enabled: true,
      deletePassed: true,
      autoCreate: true,
      autoStart: true,
      sessionTimeout: '30m',
      enableVideo: true,
      enableLog: true,
    },
    allure: {
      enabled: false,
    },
  },
  include: {},
  bootstrap: null,
  mocha: {},
  name: 'example',
};
