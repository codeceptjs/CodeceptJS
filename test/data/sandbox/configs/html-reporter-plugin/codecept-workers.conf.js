const { setHeadlessWhen, setWindowSize } = require('@codeceptjs/configure')

setHeadlessWhen(process.env.HEADLESS)
setWindowSize(1600, 1200)

exports.config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    FileSystem: {},
  },
  plugins: {
    htmlReporter: {
      enabled: true,
      output: './output',
      reportFileName: 'worker-report.html',
      includeArtifacts: true,
      showSteps: true,
      showSkipped: true,
      showMetadata: true,
      showTags: true,
      showRetries: true,
      exportStats: false,
      keepHistory: false,
    },
  },
  multiple: {
    parallel: {
      chunks: 2,
      browsers: ['chrome', 'firefox'],
    },
  },
  name: 'html-reporter-plugin worker tests',
}
