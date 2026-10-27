export const config = {
  tests: './*_test.js',
  output: './output',
  helpers: {},
  include: {},
  bootstrap: null,
  mocha: {},
  multiple: {
    dev: {
      browsers: ['chromium', 'webkit'],
    },
  },
  name: 'last-failed',
}
