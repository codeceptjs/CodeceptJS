exports.config = {
  tests: './*_test.js',
  timeout: 10000,
  output: './output',
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
  bootstrapAll: './bootstrapall.function.js',
  teardownAll: './teardownall.function.js',
};
