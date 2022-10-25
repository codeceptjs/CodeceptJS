exports.config = {
  tests: './*_test.multiple.js',
  timeout: 10000,
  output: './output',
  helpers: {
    FakeDriver: {
      require: '../fake_driver',
      browser: 'dummy',
      windowSize: 'maximize',
    },
  },

  multiple: {
    default: {
      browsers: [
        'chrome',
        { browser: 'firefox' },
      ],
    },
    mobile: {
      browsers: [
        'android',
        { browser: 'safari', windowSize: 'maximize' },
        { browser: 'chrome', windowSize: 'maximize' },
        { browser: 'safari', windowSize: '1200x840' },
      ],
    },
    grep: {
      grep: '@grep',
      browsers: [
        'chrome',
        { browser: 'firefox', windowSize: '1200x840' },
      ],
    },
    test: {
      tests: './*_test_override.multiple.js',
      browsers: [
        'chrome',
        { browser: 'firefox', windowSize: '1200x840' },
      ],
    },
    chunks: {
      chunks: 2,
    },
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'sandbox',
};
