module.exports = {
  tests: './*_test.js',
  timeout: 10000,
  output: './_output',
  helpers: {
    FileSystem: {},
  },
  name: 'failed-tests',
}
