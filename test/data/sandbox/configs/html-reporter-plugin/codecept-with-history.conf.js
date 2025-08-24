exports.config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    FileSystem: {},
  },
  include: {},
  bootstrap: false,
  plugins: {
    htmlReporter: {
      enabled: true,
      output: './output',
      reportFileName: 'report.html',
      includeArtifacts: true,
      showSteps: true,
      showSkipped: true,
      showMetadata: true,
      showTags: true,
      showRetries: true,
      keepHistory: true,
      historyPath: './test-history.json',
      maxHistoryEntries: 10,
    },
  },
  mocha: {},
  name: 'html-reporter-plugin tests with history',
}
