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
      exportStats: true,
      exportStatsPath: './test-stats.json',
    },
  },
  mocha: {},
  name: 'html-reporter-plugin tests with stats',
}
