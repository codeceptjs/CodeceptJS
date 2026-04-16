export const config = {
  tests: './*_test.hooks.js',
  output: './output',
  helpers: {
    CustomHelper: {
      require: './customHelper.js',
    },
  },
  include: {
    I: './steps_file.js',
    hookpage: './pages/hookpage.js',
    nohookpage: './pages/nohookpage.js',
  },
  bootstrap: null,
  mocha: {},
  name: 'pageobject-hooks',
}
