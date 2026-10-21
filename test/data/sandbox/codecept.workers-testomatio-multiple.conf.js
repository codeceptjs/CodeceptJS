export const config = {
  tests: './workers-multiple-browsers/*.js',
  timeout: 10000,
  output: './output/testomatio-multiple',
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
  plugins: {
    testomatio: {
      enabled: true,
      require: '@testomatio/reporter/codecept',
    },
  },
  name: 'sandbox',
}
