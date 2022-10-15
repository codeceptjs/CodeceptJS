exports.config = {
  tests: './*_test.multiple.js',
  timeout: 10000,
  output: './output',
  helpers: {
    FakeDriver: {
      require: './support/failureHelper',
    },
  },

  multiple: {
    default: {
      browsers: [
        'chrome',
        { browser: 'firefox' },
      ],
    },
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'multiple-init-failure',
};
