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
  require: ['requiredModule', 'requiredModule2'],
  multiple: {
    default: {
      browsers: [
        'chrome',
        { browser: 'firefox' },
      ],
    },
  },
};
