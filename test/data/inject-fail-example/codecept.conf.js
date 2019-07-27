exports.config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
  },
  include: {

    page: './pages/page.js',
    notpage: './pages/notpage.js',

  },
  bootstrap: null,
  mocha: {},
  name: 'inject-fail-example',
};
