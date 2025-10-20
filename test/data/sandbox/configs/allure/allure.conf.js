exports.config = {
  tests: './success_test.js',
  timeout: 10000,
  output: './output/success',
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
