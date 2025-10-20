exports.config = {
  tests: './*_test.po.js',
  timeout: 10000,
  output: './output',
  helpers: {
    FileSystem: {},
  },
  include: {
    I: './pages/custom_steps.js',
    MyPage: './pages/my_page.js',
  },
  bootstrap: false,
  mocha: {},
  name: 'sandbox',
};
