export const config = {
  tests: './fs_test.js',
  timeout: 10000,
  output: './output.js',
  helpers: {
    FileSystem: {},
  },
  include: {},
  bootstrap: () => console.log('I am bootstrap'),
  teardown: () => console.log('I am teardown'),
  mocha: {},
  name: 'sandbox',
};
