const { setHeadlessWhen, setWindowSize } = require('@codeceptjs/configure')

setHeadlessWhen(process.env.HEADLESS)
setWindowSize(1600, 1200)

exports.config = {
  tests: './retry_test.js',
  output: './output',
  helpers: {
    FileSystem: {},
  },
  plugins: {
    htmlReporter: {
      enabled: true,
      output: './output',
      reportFileName: 'retry-report.html',
      includeArtifacts: true,
      showSteps: true,
      showRetries: true,
    },
    retryFailedStep: {
      enabled: true,
      retries: 2,
    },
  },
  name: 'html-reporter-plugin retry tests',
}
