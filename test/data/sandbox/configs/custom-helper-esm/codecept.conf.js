export const config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    FileSystem: {},
    MyHelper: {
      require: './myhelper_helper.js',
    },
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'custom-helper-esm',
};
