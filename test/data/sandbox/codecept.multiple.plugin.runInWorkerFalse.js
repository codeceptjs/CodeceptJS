export const config = {
  tests: './*_test.multiple.js',
  timeout: 10000,
  output: './output',
  helpers: {
    FakeDriver: {
      require: '../fake_driver',
      browser: 'dummy',
      windowSize: 'maximize',
    },
  },
  multiple: {
    default: {
      browsers: ['chrome', 'firefox'],
    },
  },
  plugins: {
    runInWorkerFalsePlugin: {
      enabled: true,
      runInWorker: false,
      require: './plugin-runInWorkerFalse.js',
      reportDir: 'output/report',
    },
  },
  bootstrap: false,
  mocha: {},
  name: 'sandbox',
}
