export const config = {
  tests: './*_test.inject.po.js',
  timeout: 10000,
  output: './output.js',
  helpers: {
    FileSystem: {},
  },
  include: {
    MyPage: '../../support/my_page.js',
    SecondPage: '../../support/second_page.js',
  },
  bootstrap: false,
  mocha: {},
  name: 'sandbox',
};
