exports.config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    CustomHelper: {
      require: './customHelper.js',
    },
  },
  timeout: 0.1,
  name: 'steps',
};
