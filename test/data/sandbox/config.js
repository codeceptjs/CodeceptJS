const profile = process.profile;

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
  name: 'sandbox',
};

if (profile === 'failed') {
  exports.config.tests = './*_test_failed.js';
}

if (profile === 'bootstrap') {
  exports.config.bootstrap = 'hooks.js';
}
