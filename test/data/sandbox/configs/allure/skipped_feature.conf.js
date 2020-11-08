exports.config = {
  tests: './skipped_feature.js',
  timeout: 10000,
  output: './output/skipped',
  helpers: {
    FileSystem: {},
  },
  include: {},
  plugins: {
    allure: {
      enabled: true,
      output: './output/skipped',
    },
  },
  mocha: {},
  name: 'sandbox',
};
