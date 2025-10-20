exports.config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    CustomHelper: {
      require: './customHelper.js',
    },
  },
  rerun: {
    minSuccess: 3,
    maxReruns: 3,
  },
  bootstrap: null,
  mocha: {},
  name: 'run-rerun',
};
