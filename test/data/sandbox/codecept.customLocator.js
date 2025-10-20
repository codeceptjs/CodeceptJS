exports.config = {
  tests: './*.customLocator.js',
  timeout: 10000,
  output: './output',
  helpers: {
    Playwright: {
      url: 'http://localhost',
      show: true,
      browser: 'chromium',
    },
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'sandbox',
  plugins: {
    customLocator: {
      enabled: false,
      prefix: '$',
      attribute: 'data-testid',
    },
  },
};
