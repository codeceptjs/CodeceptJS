export const config = {
  tests: './workers-multiple-browsers/*.js',
  timeout: 10000,
  output: './output/junit-multiple',
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
    junitReporter: {
      enabled: true,
    },
  },
  name: 'sandbox',
}
