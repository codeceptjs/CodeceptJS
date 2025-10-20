exports.config = {
  tests: './*_ftest.js',
  output: './output',
  helpers: {
    CustomHelper: {
      require: './customHelper.js',
    },
  },
  rerun: {
    minSuccess: 2,
    maxReruns: 3,
  },
  bootstrap: null,
  mocha: {},
  name: 'run-rerun',
};
