export default {
  tests: './*_test.js',
  output: './output',
  helpers: {
    CustomHelper: {
      require: './helpers/CustomHelper.js',
    },
    FileSystem: {},
    REST: {
      endpoint: 'https://jsonplaceholder.typicode.com',
      prettyPrintJson: true,
    },
  },
  name: 'codeceptjs-esm-example',
}
