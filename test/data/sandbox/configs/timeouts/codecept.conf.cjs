module.exports = {
  tests: './*_test.cjs',
  output: './output',
  helpers: {
    CustomHelper: {
      require: './customHelper.js',
    },
  },
  name: 'steps',
};
