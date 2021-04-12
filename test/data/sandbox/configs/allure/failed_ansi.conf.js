exports.config = {
  tests: './failed_ansi_test.js',
  timeout: 10000,
  output: './output/ansi',
  helpers: {
    FileSystem: {},
  },
  include: {},
  plugins: {
    allure: {
      enabled: true,
      output: './output/ansi',
    },
  },
  mocha: {},
  name: 'sandbox',
};
