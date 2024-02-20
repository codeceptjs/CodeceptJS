export const config = {
  tests: './*_test.js',
  timeout: 10000,
  output: './output.js',
  helpers: {
    FileSystem: {},
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'require test',
  multiple: {
    default: {
      browsers: ['chrome', { browser: 'firefox' }],
    },
  },
  bootstrapAll: './bootstrapall.object.js',
  teardownAll: './teardownall.object.js',
};
