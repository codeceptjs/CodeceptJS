exports.config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    WebDriver: {
      url: 'http://localhost',
      browser: 'chrome',
    },
  },

  plugins: {
    selenoid: {
      enabled: true,
      name: 'selenoid',
      deletePassed: true,
      autoCreate: true,
      autoStart: true,
      sessionTimeout: '30m',
      enableVideo: true,
      enableLog: true,
      additionalParams: '--env TEST=test',
    },
  },
  include: {},
  bootstrap: null,
  mocha: {},
  name: 'example',
};
