exports.config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
  },
  include: {

    page: './pages/page.js',
    notpage: './pages/notpage.js',
    arraypage: './pages/arraypage.js',

  },
  bootstrap: null,
  mocha: {},
  name: 'inject-fail-example',
};
