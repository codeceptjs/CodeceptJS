exports.config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    FileSystem: {},
    CustomHelper: {
      require: './custom_helper.js',
    },
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'step-enhancements tests',
}
