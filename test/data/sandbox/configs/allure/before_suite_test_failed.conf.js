exports.config = {
  tests: './before_suite_test_failed.js',
  timeout: 10000,
  output: './output/failed',
  helpers: {
    FileSystem: {},
  },
  include: {},
  plugins: {
    allure: {
      enabled: true,
      output: `./output/failed/allure${Math.random().toString()}`,
    },
  },
  mocha: {},
  name: 'sandbox',
};
