export const config = {
  tests: './*_test.js',
  output: './output.js',
  bootstrap: null,
  helpers: {
    CustomHelper: {
      require: './customHelper.js',
    },
  },
  name: 'test-artifacts',
};
