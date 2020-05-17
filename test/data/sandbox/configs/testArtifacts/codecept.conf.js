exports.config = {
  tests: './*_test.js',
  output: './output',
  bootstrap: null,
  helpers: {
    CustomHelper: {
      require: './customHelper.js',
    },
  },
  name: 'test-artifacts',
};
