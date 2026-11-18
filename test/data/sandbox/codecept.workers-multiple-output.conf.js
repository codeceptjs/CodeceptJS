export const config = {
  tests: './workers-multiple-browsers/*.js',
  timeout: 10000,
  output: './output/workers-multiple-output',
  helpers: {
    FakeDriver: {
      require: '../fake_driver',
      browser: 'dummy',
    },
  },
  include: {},
  mocha: {},
  multiple: {
    dev: {
      browsers: ['chromium', 'webkit'],
    },
  },
  name: 'sandbox',
}
