exports.config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
  },
  include: {
    classpage: './pages/classpage.js',
    classnestedpage: './pages/classnestedpage.js',
  },
  bootstrap: null,
  mocha: {},
  name: 'pageobject-as-class',
};
