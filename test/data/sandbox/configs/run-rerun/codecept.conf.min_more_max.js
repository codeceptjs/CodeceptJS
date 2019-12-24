exports.config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    CustomHelper: {
      require: './customHelper.js',
    },
  },
  rerun: {
    minSuccess: 4,
    maxReruns: 3,
  },
  bootstrap: null,
  mocha: {},
  name: 'run-rerun',
};
