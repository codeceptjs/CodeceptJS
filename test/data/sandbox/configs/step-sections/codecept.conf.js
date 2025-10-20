exports.config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    FileSystem: {},
    CustomHelper: {
      require: './customHelper.js',
    },
  },
  include: {
    userPage: './userPage.js',
  },
  bootstrap: false,
  mocha: {},
  name: 'step-sections tests',
}
