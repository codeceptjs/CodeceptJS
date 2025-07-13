export const config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    CustomHelper: {
      require: './helpers/CustomHelper.js',
    },
  },
  name: 'codeceptjs-esm-example',
}
