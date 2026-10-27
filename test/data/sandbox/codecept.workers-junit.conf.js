export const config = {
  tests: './workers-junit-suite-hooks/*.js',
  timeout: 10000,
  output: './output',
  helpers: {
    FileSystem: {},
    Workers: {
      require: './workers_helper',
    },
  },
  include: {},
  async bootstrap() {},
  mocha: {},
  plugins: {
    junitReporter: {
      enabled: true,
    },
  },
  name: 'sandbox',
}
