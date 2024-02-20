const profile = process.env.profile || process.profile;

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
  name: 'sandbox',
};

if (profile === 'failed') {
  exports.config.tests = './*_test_failed.js';
}
