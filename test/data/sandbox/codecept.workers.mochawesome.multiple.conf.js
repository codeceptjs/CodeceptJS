export const config = {
  tests: './workers/*.js',
  timeout: 10000,
  output: './output/workers_mochawesome',
  helpers: {
    FileSystem: {},
    Workers: {
      require: './workers_helper',
    },
  },
  include: {},
  mocha: {
    reporter: 'mochawesome',
    reporterOptions: {
      reportDir: './output/workers_mochawesome',
      reportFilename: 'report',
      quiet: true,
      overwrite: true,
      json: true,
      html: false,
    },
  },
  multiple: {
    parallel: {
      browsers: ['chrome', 'firefox'],
    },
  },
  name: 'sandbox',
};
