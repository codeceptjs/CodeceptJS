module.exports.config = {
  tests: './customLocator_test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    Puppeteer: {
      url: 'https://www.google.com',
    },
  },
  bootstrap: false,
  mocha: {},
  name: 'sandbox',
  plugins: {
    customLocator: {
      enabled: 'true',
      attribute: 'data-qa',
      showActual: true,
    },
  },
};
