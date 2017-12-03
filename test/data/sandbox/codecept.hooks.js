module.exports.config = {
  tests: './*_test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    FileSystem: {},
  },
  include: {},
  hooks: [
    'bootstrap.sync.js',
    function () {
      console.log('I am function hook');
    },
  ],
  mocha: {},
  name: 'sandbox',
};
