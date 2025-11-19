export const config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    FileSystem: {},
    MyHelperTs: {
      require: './myhelper_ts.ts',
    },
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'custom-helper-esm-ts',
};
