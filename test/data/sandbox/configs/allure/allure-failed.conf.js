exports.config = {
  tests: './*_test_failed.js',
  timeout: 10000,
  output: './output/failed',
  helpers: {
    FileSystem: {},
  },
  include: {},
  plugins: {
    allure: {
      enabled: true,
    },
  },
  mocha: {},
  name: 'sandbox',
};
